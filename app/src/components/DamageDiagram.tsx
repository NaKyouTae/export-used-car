"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue } from "framer-motion";

/** 부위 표시 종류 — 첨부 도면 범례와 동일 */
export type DamageType = "REPLACE" | "REPAIR";

export interface DamageMark {
  id: string;
  type: DamageType;
  /** 이미지 컨테이너 대비 가로 위치 (0~100%) */
  x: number;
  /** 이미지 컨테이너 대비 세로 위치 (0~100%) */
  y: number;
}

interface DamageTypeMeta {
  label: string;
  short: string;
  className: string;
}

export const DAMAGE_TYPES: Record<DamageType, DamageTypeMeta> = {
  REPLACE: { label: "교환", short: "X", className: "bg-red-500" },
  REPAIR: { label: "판금·용접", short: "W", className: "bg-blue-500" },
};

const MARKER_SIZE = 28; // px

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

interface DamageMarkerItemProps {
  mark: DamageMark;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
}

function DamageMarkerItem({
  mark,
  containerRef,
  onMove,
  onRemove,
}: DamageMarkerItemProps) {
  // framer-motion 이 드래그 중 transform(x/y)에 기록하는 값.
  // 드래그 종료 시 0으로 되돌리고 left/top(%)을 갱신해 위치를 확정한다.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const meta = DAMAGE_TYPES[mark.type];

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragMomentum={false}
      dragElastic={0}
      style={{
        x,
        y,
        left: `${mark.x}%`,
        top: `${mark.y}%`,
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        // transform 대신 margin 으로 중앙 정렬 (x/y motion value 와 충돌 방지)
        marginLeft: -MARKER_SIZE / 2,
        marginTop: -MARKER_SIZE / 2,
      }}
      onDragEnd={(_, info) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nextX = clamp(mark.x + (info.offset.x / rect.width) * 100, 0, 100);
        const nextY = clamp(
          mark.y + (info.offset.y / rect.height) * 100,
          0,
          100
        );
        x.set(0);
        y.set(0);
        onMove(nextX, nextY);
      }}
      whileDrag={{ scale: 1.15, zIndex: 20 }}
      className="absolute z-10 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
    >
      <span
        className={`flex h-full w-full items-center justify-center rounded-full text-[13px] font-bold text-white shadow-md ${meta.className}`}
      >
        {meta.short}
      </span>
      {/* 삭제 버튼 */}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        aria-label={`${meta.label} 삭제`}
        className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-gray-800 text-[9px] font-bold leading-none text-white"
      >
        ×
      </button>
    </motion.div>
  );
}

interface DamageDiagramProps {
  marks: DamageMark[];
  onChange: (marks: DamageMark[]) => void;
  /** 도면 이미지 경로 (기본: 임시 플레이스홀더) */
  imageSrc?: string;
}

export default function DamageDiagram({
  marks,
  onChange,
  imageSrc = "/car-diagram-placeholder.svg",
}: DamageDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const addMark = (type: DamageType) => {
    // 겹침 방지용 계단식 오프셋
    const offset = (marks.length % 5) * 5;
    onChange([
      ...marks,
      {
        id: crypto.randomUUID(),
        type,
        x: clamp(45 + offset, 0, 100),
        y: clamp(45 + offset, 0, 100),
      },
    ]);
  };

  const moveMark = (id: string, x: number, y: number) =>
    onChange(marks.map((m) => (m.id === id ? { ...m, x, y } : m)));

  const removeMark = (id: string) =>
    onChange(marks.filter((m) => m.id !== id));

  return (
    <div className="space-y-3">
      {/* 상단 라벨 팔레트 — 탭하면 도면 위에 마커 추가 */}
      <div className="flex items-center gap-2">
        {(Object.keys(DAMAGE_TYPES) as DamageType[]).map((type) => {
          const meta = DAMAGE_TYPES[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => addMark(type)}
              className="flex items-center gap-1.5 rounded-full bg-gray-100 py-1.5 pl-1.5 pr-3 text-[13px] font-semibold text-gray-700 active:scale-95 transition-transform"
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${meta.className}`}
              >
                {meta.short}
              </span>
              {meta.label}
            </button>
          );
        })}
        <span className="ml-auto text-[12px] text-gray-400">
          탭하여 추가 · 드래그로 이동
        </span>
      </div>

      {/* 도면 + 마커 레이어 */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 select-none"
        style={{ aspectRatio: "320 / 440" }}
      >
        <Image
          src={imageSrc}
          alt="차량 부위 도면"
          fill
          sizes="390px"
          className="pointer-events-none object-contain"
          priority
        />
        {marks.map((mark) => (
          <DamageMarkerItem
            key={mark.id}
            mark={mark}
            containerRef={containerRef}
            onMove={(x, y) => moveMark(mark.id, x, y)}
            onRemove={() => removeMark(mark.id)}
          />
        ))}
      </div>

      {marks.length > 0 && (
        <p className="text-[12px] text-gray-400">
          교환 {marks.filter((m) => m.type === "REPLACE").length} · 판금·용접{" "}
          {marks.filter((m) => m.type === "REPAIR").length}
        </p>
      )}
    </div>
  );
}
