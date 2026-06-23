"use client";

import { useTranslation } from "react-i18next";
import CarCard from "@/components/CarCard";

type Car = {
  id: string;
  title: string;
  year: number;
  mileage: number;
  fuelType: string;
  priceMin: number | string;
  priceMax: number | string;
  viewCount: number;
  wishlistCount: number;
  chatCount: number;
  createdAt: string;
  images?: { url: string; isThumbnail: boolean }[];
};

export default function HomeClient({
  popularCars,
  recentCars,
}: {
  popularCars: Car[];
  recentCars: Car[];
}) {
  const { t } = useTranslation();

  return (
    <>
      {/* Popular Cars */}
      <section className="px-4 pt-4 pb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{t("Popular Cars")}</h3>

        {Array.isArray(popularCars) && popularCars.length > 0 ? (
          <div>
            {popularCars.map((car: Car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">{t("No popular cars yet")}</p>
          </div>
        )}
      </section>

      {/* Recently Listed */}
      <section className="px-4 pb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{t("Recently Listed")}</h3>

        {Array.isArray(recentCars) && recentCars.length > 0 ? (
          <div>
            {recentCars.map((car: Car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <svg
              className="w-16 h-16 mx-auto mb-3 text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-sm">{t("No cars listed yet")}</p>
            <p className="text-xs mt-1 text-gray-300">
              {t("Check back soon for new listings")}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
