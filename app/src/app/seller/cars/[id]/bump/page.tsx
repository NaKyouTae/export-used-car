"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import CarThumbnail, { getCarThumbnail } from "@/components/car/CarThumbnail";
import CarInfo, { CarSummary } from "@/components/car/CarInfo";

export default function BumpCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [car, setCar] = useState<CarSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [bumping, setBumping] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "SELLER") {
      router.push("/mypage");
    }
  }, [isAuthenticated, authLoading, user, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchCar() {
      try {
        const res = await fetch(`/api/cars/${id}`);
        if (!res.ok) {
          router.push("/seller/cars");
          return;
        }
        setCar(await res.json());
      } catch {
        router.push("/seller/cars");
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [isAuthenticated, id, router]);

  const handleBump = async () => {
    if (bumping) return;
    setBumping(true);
    setError("");
    try {
      const res = await fetch(`/api/cars/${id}/bump`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      router.push("/seller/cars");
    } catch {
      setError(t("Failed to bump up the listing"));
      setBumping(false);
    }
  };

  // yyyy-mm-dd hh:mm (로컬 타임존 기준)
  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const d = new Date(value);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !car) return null;

  const listedAt = car.bumpedAt || car.createdAt;

  return (
    <div className="bg-white">
      <PageHeader title={t("Bump up listing")} />

      <div className="px-4 py-4 space-y-4">
        {/* 차량 정보 */}
        <div className="flex gap-3 border border-gray-100 rounded-xl p-3">
          <CarThumbnail src={getCarThumbnail(car)} alt={car.title} />
          <CarInfo car={car} />
        </div>

        {/* 현재 등록 시간 */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <span className="text-sm text-gray-500">{t("Currently listed at")}</span>
          <span className="text-sm font-medium text-gray-900">
            {formatDateTime(listedAt)}
          </span>
        </div>

        {/* 안내 문구 */}
        <p className="text-sm leading-relaxed text-gray-600">
          {t(
            "Bumping up refreshes the upload time to now, so this vehicle moves back to the top as the most recently listed car."
          )}
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={handleBump}
          disabled={bumping}
          className="w-full h-12 bg-main-500 text-white text-base font-semibold rounded-xl hover:bg-main-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {bumping ? t("Bumping up...") : t("Bump up")}
        </button>
      </div>
    </div>
  );
}
