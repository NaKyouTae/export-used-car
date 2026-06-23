"use client";

import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  formatMileage,
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DRIVETRAIN_LABELS,
} from "@/lib/constants";

export interface CarSummary {
  id: string;
  title: string;
  year: number;
  registrationDate?: string | null;
  mileage: number;
  fuelType: string;
  transmission?: string;
  drivetrain?: string | null;
  seats?: number | null;
  status?: string;
  viewCount: number;
  wishlistCount: number;
  chatCount: number;
  createdAt: string;
  /** 끌어올리기 시각(최신순 정렬 기준, 등록 시 createdAt과 동일). 매물 등록일 표시에 우선 사용. */
  bumpedAt?: string | null;
  thumbnail?: string | null;
  images?: { url: string; isThumbnail: boolean }[];
  category?: { name: string };
  make?: { name: string };
  carModel?: { name: string };
  seller?: { companyName?: string | null };
}

function formatYmd(s?: string | null) {
  return s ? s.slice(0, 10) : "-";
}

interface CarInfoProps {
  car: CarSummary;
  /** 정보 영역 좌측 위 슬롯 (예: 상태 라벨) */
  topLeft?: ReactNode;
  /** 정보 영역 우측 위 슬롯 (예: 더보기 버튼) */
  topRight?: ReactNode;
}

export default function CarInfo({ car, topLeft, topRight }: CarInfoProps) {
  const { t } = useTranslation();
  return (
    <div className="flex-1 min-w-0">
      {/* 상단 슬롯 (상태 / 더보기 등) */}
      {(topLeft || topRight) && (
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">{topLeft}</div>
          {topRight}
        </div>
      )}

      {/* 차량명 */}
      <h3 className="font-semibold text-gray-900 line-clamp-1 text-[15px] leading-snug">
        {car.title}
      </h3>

      {/* 연식 / 주행거리 */}
      <p className="text-xs text-gray-500 mt-1 truncate">
        {[
          car.registrationDate || (car.year ? `${car.year}` : null),
          formatMileage(car.mileage),
        ]
          .filter(Boolean)
          .join(" / ")}
      </p>

      {/* 변속기 / 연료 / 구동방식 / 좌석수 */}
      <p className="text-xs text-gray-500 mt-1 truncate">
        {[
          car.transmission &&
            (TRANSMISSION_LABELS[car.transmission] || car.transmission),
          FUEL_TYPE_LABELS[car.fuelType] || car.fuelType,
          car.drivetrain && (DRIVETRAIN_LABELS[car.drivetrain] || car.drivetrain),
          car.seats ? t("{{count}} seats", { count: car.seats }) : null,
        ]
          .filter(Boolean)
          .join(" / ")}
      </p>

      {/* 등록 셀러 회사 / 매물 등록일 (끌어올린 경우 bumpedAt 기준) */}
      <p className="text-xs text-gray-400 mt-1 truncate">
        {[car.seller?.companyName, formatYmd(car.bumpedAt || car.createdAt)]
          .filter(Boolean)
          .join(" / ")}
      </p>
    </div>
  );
}
