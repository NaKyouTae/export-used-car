"use client";

import { ReactNode } from "react";
import Link from "next/link";
import CarThumbnail, { getCarThumbnail } from "@/components/car/CarThumbnail";
import CarInfo, { CarSummary } from "@/components/car/CarInfo";
import CarStats from "@/components/car/CarStats";

interface CarCardProps {
  car: CarSummary;
  /** 링크 경로 (기본: 차량 상세) */
  href?: string;
  /** 이미지·정보 위에 표시되는 행 (예: 상태 + 더보기 버튼) */
  header?: ReactNode;
}

export default function CarCard({ car, href, header }: CarCardProps) {
  return (
    <article className="border-b border-gray-100 py-4">
      {header && <div className="mb-2">{header}</div>}
      <Link href={href ?? `/cars/${car.id}`} className="block">
        {/* 이미지 + 차량 상세 정보 (이미지 높이는 정보 높이에 맞춤) */}
        <div className="flex gap-3">
          <CarThumbnail src={getCarThumbnail(car)} alt={car.title} />
          <CarInfo car={car} />
        </div>
        {/* 뷰 · 찜 · 채팅 (정보 아래, 우측 정렬) */}
        <CarStats
          viewCount={car.viewCount}
          wishlistCount={car.wishlistCount}
          chatCount={car.chatCount}
          className="justify-end mt-2"
        />
      </Link>
    </article>
  );
}
