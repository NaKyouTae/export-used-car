"use client";

import { ReactNode } from "react";
import Image from "next/image";

export interface CarThumbnailSource {
  thumbnail?: string | null;
  images?: { url: string; isThumbnail: boolean }[];
}

/** 차량 객체에서 대표 이미지 URL을 추출 */
export function getCarThumbnail(car: CarThumbnailSource): string | null {
  return (
    car.thumbnail ||
    car.images?.find((img) => img.isThumbnail)?.url ||
    car.images?.[0]?.url ||
    null
  );
}

interface CarThumbnailProps {
  src?: string | null;
  alt?: string;
  /** 래퍼 크기 클래스 (기본: w-32) */
  className?: string;
  sizes?: string;
  /** 이미지 좌측 위 오버레이 (예: 상태 텍스트) */
  overlayTopLeft?: ReactNode;
}

export default function CarThumbnail({
  src,
  alt = "",
  className = "w-32",
  sizes = "128px",
  overlayTopLeft,
}: CarThumbnailProps) {
  return (
    <div
      className={`relative rounded overflow-hidden bg-gray-100 flex-shrink-0 self-stretch ${className}`}
    >
      {overlayTopLeft && (
        <div className="absolute top-1 left-1.5 z-10">{overlayTopLeft}</div>
      )}
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
