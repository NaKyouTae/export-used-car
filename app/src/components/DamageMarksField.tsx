"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DamageDiagram, { type DamageMark } from "./DamageDiagram";

interface DamageMarksFieldProps {
  marks: DamageMark[];
  onChange: (marks: DamageMark[]) => void;
  /** 트리거 버튼(행) 스타일 — 페이지의 triggerClass 를 그대로 전달 */
  className?: string;
  placeholder?: string;
}

/**
 * 폼 안의 "사고·수리 부위" 항목 행.
 * 탭하면 전용 편집 화면이 오른쪽에서 슬라이드-인 한다.
 * 실제 라우트 이동이 아니라 오버레이라 상위 폼 입력값은 그대로 유지된다.
 */
export default function DamageMarksField({
  marks,
  onChange,
  className,
  placeholder = "표시 안 함",
}: DamageMarksFieldProps) {
  const [open, setOpen] = useState(false);

  const replaceCount = marks.filter((m) => m.type === "REPLACE").length;
  const repairCount = marks.filter((m) => m.type === "REPAIR").length;
  const hasMarks = marks.length > 0;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <span className={hasMarks ? "text-gray-900" : "text-gray-400"}>
          {hasMarks
            ? `교환 ${replaceCount} · 판금·용접 ${repairCount}`
            : placeholder}
        </span>
        <svg
          className="h-5 w-5 shrink-0 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 flex justify-center bg-black/20"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex h-full w-full max-w-[390px] flex-col bg-white shadow-xl"
            >
              {/* Header */}
              <header className="sticky top-0 z-10 border-b border-gray-100 bg-white pt-safe">
                <div className="flex h-12 items-center px-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mr-2 -ml-1 p-1 text-gray-700"
                    aria-label="뒤로"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h1 className="flex-1 truncate text-lg font-semibold text-gray-900">
                    사고·수리 부위
                  </h1>
                </div>
              </header>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <DamageDiagram marks={marks} onChange={onChange} />
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-14 w-full rounded-2xl bg-main-500 text-[16px] font-bold text-white transition-all active:scale-[0.99]"
                >
                  완료
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
