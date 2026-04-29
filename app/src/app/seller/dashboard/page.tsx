"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import {
  CAR_STATUS_LABELS,
  CAR_STATUS_COLORS,
  formatPrice,
  timeAgo,
} from "@/lib/constants";

interface Car {
  id: string;
  title: string;
  status: string;
  price: number | string;
  viewCount: number;
  wishlistCount: number;
  chatCount: number;
  createdAt: string;
  thumbnail?: string | null;
}

interface StatusCounts {
  DRAFT: number;
  ACTIVE: number;
  RESERVED: number;
  SOLD: number;
  HIDDEN: number;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/seller/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchCars() {
      try {
        const res = await fetch("/api/seller/cars?limit=50&sort=newest");
        if (res.ok) {
          const data = await res.json();
          setCars(data.data || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchCars();
  }, [isAuthenticated]);

  const statusCounts: StatusCounts = cars.reduce(
    (acc, car) => {
      const status = car.status as keyof StatusCounts;
      if (status in acc) acc[status]++;
      return acc;
    },
    { DRAFT: 0, ACTIVE: 0, RESERVED: 0, SOLD: 0, HIDDEN: 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Dashboard"
        showBack={false}
        rightAction={
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Customer Page
            </Link>
            <Link
              href="/seller/cars/new"
              className="text-sm text-orange-600 font-medium"
            >
              + New Car
            </Link>
          </div>
        }
      />

      <div className="max-w-screen-lg mx-auto px-4 py-4">
        {/* Welcome */}
        <div className="bg-white rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <p className="text-lg font-bold text-gray-900">
            {user?.companyName || user?.name || "Seller"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(["ACTIVE", "RESERVED", "SOLD"] as const).map((s) => (
            <div key={s} className="bg-white rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts[s]}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {CAR_STATUS_LABELS[s]}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {(["DRAFT", "HIDDEN"] as const).map((s) => (
            <div key={s} className="bg-white rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {statusCounts[s]}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {CAR_STATUS_LABELS[s]}
              </p>
            </div>
          ))}
        </div>

        {/* My Cars */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">My Cars</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cars.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {cars.map((car) => (
                <Link
                  key={car.id}
                  href={`/seller/cars/${car.id}/edit`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {car.thumbnail ? (
                      <Image
                        src={car.thumbnail}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {car.title}
                    </p>
                    <p className="text-sm text-gray-900 font-semibold mt-0.5">
                      {formatPrice(car.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      {car.viewCount > 0 && <span>Views {car.viewCount}</span>}
                      {car.wishlistCount > 0 && (
                        <span>Likes {car.wishlistCount}</span>
                      )}
                      {car.chatCount > 0 && <span>Chat {car.chatCount}</span>}
                      <span>{timeAgo(car.createdAt)}</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAR_STATUS_COLORS[car.status] || "bg-gray-100 text-gray-600"}`}
                  >
                    {CAR_STATUS_LABELS[car.status] || car.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="text-sm">No cars registered yet</p>
              <Link
                href="/seller/cars/new"
                className="text-sm text-orange-600 font-medium mt-2 inline-block"
              >
                Register your first car
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
