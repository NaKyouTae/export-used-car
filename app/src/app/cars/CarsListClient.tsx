"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import CarCard from "@/components/CarCard";
import PageHeader from "@/components/PageHeader";

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
  images?: { url: string; isThumbnail: boolean }[];
}

interface FilterState {
  categoryId: string;
  makeId: string;
  modelId: string;
  fuelType: string;
  yearMin: string;
  yearMax: string;
  mileageMax: string;
  sort: string;
  search: string;
}

export default function CarsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    categoryId: searchParams.get("categoryId") || "",
    makeId: searchParams.get("makeId") || "",
    modelId: searchParams.get("modelId") || "",
    fuelType: searchParams.get("fuelType") || "",
    yearMin: searchParams.get("yearMin") || "",
    yearMax: searchParams.get("yearMax") || "",
    mileageMax: searchParams.get("mileageMax") || "",
    sort: searchParams.get("sort") || "newest",
    search: searchParams.get("search") || "",
  });

  const buildQueryString = useCallback(
    (cursorVal?: string | null) => {
      const params = new URLSearchParams();
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.makeId) params.set("makeId", filters.makeId);
      if (filters.modelId) params.set("modelId", filters.modelId);
      if (filters.fuelType) params.set("fuelType", filters.fuelType);
      if (filters.yearMin) params.set("yearMin", filters.yearMin);
      if (filters.yearMax) params.set("yearMax", filters.yearMax);
      if (filters.mileageMax) params.set("mileageMax", filters.mileageMax);
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.search) params.set("search", filters.search);
      if (cursorVal) params.set("cursor", cursorVal);
      params.set("limit", "20");
      return params.toString();
    },
    [filters]
  );

  const fetchCars = useCallback(
    async (isLoadMore = false) => {
      setLoading(true);
      try {
        const qs = buildQueryString(isLoadMore ? cursor : null);
        const res = await fetch(`/api/cars?${qs}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const items = data.items || data.data || data || [];
        const nextCursor = data.nextCursor || data.cursor || null;

        if (isLoadMore) {
          setCars((prev) => [...prev, ...items]);
        } else {
          setCars(items);
        }
        setCursor(nextCursor);
        setHasMore(!!nextCursor && items.length > 0);
      } catch {
        if (!isLoadMore) {
          setCars([]);
          setFetchError(true);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString, cursor]
  );

  const activeFilterCount = [
    filters.categoryId,
    filters.makeId,
    filters.fuelType,
    filters.yearMin || filters.yearMax,
    filters.mileageMax,
  ].filter(Boolean).length;

  // Initial fetch and filter changes
  useEffect(() => {
    async function resetAndFetch() {
      setCursor(null);
      setHasMore(true);
      setLoading(true);
      setFetchError(false);
      try {
        const qs = buildQueryString(null);
        const res = await fetch(`/api/cars?${qs}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const items = data.items || data.data || data || [];
        const nextCursor = data.nextCursor || data.cursor || null;
        setCars(items);
        setCursor(nextCursor);
        setHasMore(!!nextCursor && items.length > 0);
      } catch {
        setCars([]);
        setFetchError(true);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }
    resetAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchCars(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchCars]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/cars?${params.toString()}`, { scroll: false });
  };

  const sortOptions = [
    { value: "newest", label: t("Newest") },
    { value: "price_asc", label: t("Price: Low to High") },
    { value: "price_desc", label: t("Price: High to Low") },
    { value: "mileage_asc", label: t("Mileage: Low to High") },
    { value: "year_desc", label: t("Year: Newest") },
  ];

  return (
    <div className="bg-white">
      <PageHeader
        title={t("Cars")}
        showBack={false}
        rightAction={
          <button
            onClick={() => {
              const qs = searchParams.toString();
              router.push(qs ? `/cars/filter?${qs}` : "/cars/filter");
            }}
            className="relative p-1 text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-main-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        }
      />

      <div className="">
        {/* Search Bar */}
        <div className="px-4 pt-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder={t("Search cars...")}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilter("sort", opt.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filters.sort === opt.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Car List */}
        <div className="px-4">
          {fetchError && !loading ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">{t("Failed to load cars")}</p>
              <p className="text-xs mt-1 mb-4">{t("Please check your connection and try again")}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-main-500 text-white text-sm font-semibold rounded-xl hover:bg-main-600 transition-colors"
              >
                {t("Refresh")}
              </button>
            </div>
          ) : cars.length > 0 ? (
            <div>
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm">{t("No cars found")}</p>
              <p className="text-xs mt-1">{t("Try adjusting your filters")}</p>
            </div>
          ) : null}

          {/* Loading / Infinite scroll trigger */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {hasMore && !loading && <div ref={observerRef} className="h-10" />}
        </div>
      </div>
    </div>
  );
}
