"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import CarCard from "@/components/CarCard";
import CarKebabMenu from "@/components/car/CarKebabMenu";
import { CAR_STATUS_LABELS } from "@/lib/constants";

interface Car {
  id: string;
  title: string;
  year: number;
  mileage: number;
  fuelType: string;
  priceMin: number | string;
  priceMax: number | string;
  status: string;
  viewCount: number;
  wishlistCount: number;
  chatCount: number;
  createdAt: string;
  thumbnail?: string | null;
  images?: { url: string; isThumbnail: boolean }[];
}

export default function SellerCarsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "SELLER") {
      router.replace("/mypage");
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchCars() {
      try {
        const res = await fetch(`/api/seller/cars`);
        if (res.ok) {
          const data = await res.json();
          setCars(data.items || data.data || data || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchCars();
  }, [isAuthenticated, reloadKey]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const statuses = ["", "ACTIVE", "DEALING", "RESERVED", "SOLD", "HIDDEN"];

  const countFor = (status: string) =>
    status ? cars.filter((c) => c.status === status).length : cars.length;

  const filteredCars = statusFilter
    ? cars.filter((c) => c.status === statusFilter)
    : cars;

  return (
    <div className="bg-white">
      <PageHeader title={t("My Vehicles")} />

      <div className="">
        {/* Status Filter */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {statuses.map((status) => {
            const count = countFor(status);
            return (
              <button
                key={status || "all"}
                onClick={() => setStatusFilter(status)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {status ? t(CAR_STATUS_LABELS[status]) : t("All")}
                {count > 0 ? ` ${count}` : ""}
              </button>
            );
          })}
        </div>

        {/* Car List */}
        <div className="px-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCars.length > 0 ? (
            <div>
              {filteredCars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  href={`/cars/${car.id}`}
                  header={
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {t(CAR_STATUS_LABELS[car.status] || car.status)}
                      </span>
                      <CarKebabMenu
                        carId={car.id}
                        status={car.status}
                        onChanged={() => setReloadKey((k) => k + 1)}
                      />
                    </div>
                  }
                />
              ))}
            </div>
          ) : cars.length > 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">{t("No vehicles in this status")}</p>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">{t("No vehicles registered")}</p>
              <Link href="/seller/cars/new" className="text-sm text-main-600 font-medium mt-2 inline-block">
                {t("Register your first vehicle")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
