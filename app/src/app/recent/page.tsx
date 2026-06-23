"use client";

import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";
import CarCard from "@/components/CarCard";
import { useRecentlyViewedCars } from "@/hooks/useRecentlyViewed";

const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

export default function RecentlyViewedPage() {
  const { t } = useTranslation();
  const cars = useRecentlyViewedCars();
  const loaded = useSyncExternalStore(subscribeNoop, getTrue, getFalse);

  return (
    <div className="bg-white">
      <PageHeader title={t("Recently Viewed")} />

      {!loaded ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cars.length > 0 ? (
        <div className="px-4">
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={{
                ...car,
                thumbnail: car.thumbnail,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-gray-400">{t("No recently viewed cars")}</p>
        </div>
      )}
    </div>
  );
}
