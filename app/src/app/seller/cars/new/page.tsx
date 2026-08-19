"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import CarFormWizard, {
  type Make,
  type Tag,
  type OptionItem,
  type CarFormSubmitPayload,
} from "@/components/car/CarFormWizard";

export default function NewCarPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [makes, setMakes] = useState<Make[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Fetch makes, tags, and options
  useEffect(() => {
    async function fetchData() {
      try {
        const [makesRes, tagsRes, optionsRes] = await Promise.all([
          fetch("/api/makes"),
          fetch("/api/tags"),
          fetch("/api/options"),
        ]);
        if (makesRes.ok) {
          const data = await makesRes.json();
          if (Array.isArray(data)) setMakes(data);
        }
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          if (Array.isArray(data)) setTags(data);
        }
        if (optionsRes.ok) {
          const data = await optionsRes.json();
          if (Array.isArray(data)) setOptions(data);
        }
      } catch {
        // Data will be empty, user can still type
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async ({
    form,
    images,
    damageMarks,
    selectedTagIds,
    selectedOptionItemIds,
  }: CarFormSubmitPayload) => {
    setLoading(true);
    setError("");

    try {
      // 1. Create car
      const res = await fetch("/api/seller/cars", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId || undefined,
          year: Number(form.year),
          mileage: Number(form.mileage),
          displacement: form.displacement
            ? Number(form.displacement)
            : undefined,
          seats: form.seats ? Number(form.seats) : undefined,
          damageMarks,
          // 가격 기능 미사용 — 당분간 0원으로 등록
          priceMin: 0,
          priceMax: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("Failed to register vehicle"));
        return;
      }

      const carId = data.id;

      // 2. Upload images
      // 차량은 이미 생성됐으므로 업로드 실패 시에도 중단하지 않고
      // 실패 건수만 모아 마지막에 알린다.
      let imageFailures = 0;
      const newImages = images.filter((img) => img.isNew && img.file);
      for (const img of newImages) {
        const formData = new FormData();
        formData.append("file", img.file!);
        formData.append("imageCategory", "CAR_PHOTO");
        formData.append("targetId", carId);
        const uploadRes = await fetch("/api/images", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadRes.ok) imageFailures += 1;
      }

      // 3. Set tags & options
      const promises: Promise<Response>[] = [];
      if (selectedTagIds.length > 0) {
        promises.push(
          fetch(`/api/cars/${carId}/tags`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ tagIds: selectedTagIds }),
          }),
        );
      }
      if (selectedOptionItemIds.length > 0) {
        promises.push(
          fetch(`/api/cars/${carId}/options`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ optionItemIds: selectedOptionItemIds }),
          }),
        );
      }
      await Promise.all(promises);

      if (imageFailures > 0) {
        alert(
          t("Some photos failed to upload. Please add them again in edit."),
        );
      }

      router.push("/seller/cars");
    } catch {
      setError(t("A network error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageHeader title={t("Register Vehicle")} />
      <CarFormWizard
        makes={makes}
        tags={tags}
        options={options}
        submitLabel={t("Register Vehicle")}
        submitting={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
