"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { CAR_STATUS_LABELS, CAR_STATUS_COLORS, formatPriceRange, formatMileage, FUEL_TYPE_LABELS } from "@/lib/constants";

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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

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
        const params = new URLSearchParams();
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/seller/cars?${params.toString()}`);
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
  }, [isAuthenticated, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const statuses = ["", "DRAFT", "ACTIVE", "RESERVED", "SOLD", "HIDDEN"];

  return (
    <div className="bg-white">
      <PageHeader title="My Cars" />

      <div className="">
        {/* Status Filter */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {statuses.map((status) => (
            <button
              key={status || "all"}
              onClick={() => { setStatusFilter(status); setLoading(true); }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {status ? CAR_STATUS_LABELS[status] : "All"}
            </button>
          ))}
        </div>

        {/* Car List */}
        <div className="px-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cars.length > 0 ? (
            <div>
              {cars.map((car) => {
                const thumb =
                  car.thumbnail ||
                  car.images?.find((i) => i.isThumbnail)?.url ||
                  car.images?.[0]?.url;
                return (
                  <Link
                    key={car.id}
                    href={`/seller/cars/${car.id}/edit`}
                    className="flex gap-3 bg-white py-3 border-b border-gray-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {thumb ? (
                        <Image src={thumb} alt="" fill sizes="96px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{car.title}</h3>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${CAR_STATUS_COLORS[car.status] || "bg-gray-100 text-gray-600"}`}>
                          {CAR_STATUS_LABELS[car.status] || car.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {car.year} · {formatMileage(car.mileage)} · {FUEL_TYPE_LABELS[car.fuelType] || car.fuelType}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{formatPriceRange(car.priceMin, car.priceMax)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Views {car.viewCount} · Likes {car.wishlistCount} · Chat {car.chatCount}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-sm">No cars found</p>
              <Link href="/seller/cars/new" className="text-sm text-main-600 font-medium mt-2 inline-block">
                Register your first car
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
