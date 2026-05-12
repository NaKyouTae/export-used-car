"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CarCard from "@/components/CarCard";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";

interface Car {
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
  thumbnail?: string | null;
  images?: { url: string; isThumbnail: boolean }[];
}

export default function WishlistPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    async function fetchWishlist() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/wishlist", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCars(Array.isArray(data) ? data : []);
      } catch {
        setCars([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchWishlist();
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || (!isAuthenticated && !error)) {
    return (
      <div className="min-h-screen bg-white">
        <PageHeader title="Wishlist" />
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Wishlist" />

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-sm">Failed to load wishlist</p>
            <p className="text-xs mt-1 mb-4">Please check your connection and try again</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-main-500 text-white text-sm font-semibold rounded-xl hover:bg-main-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : cars.length > 0 ? (
          <div>
            {cars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-sm">No wishlisted cars yet</p>
            <p className="text-xs mt-1 text-gray-300">
              Tap the heart icon on a car to save it here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
