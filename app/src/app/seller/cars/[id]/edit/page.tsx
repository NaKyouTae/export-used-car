"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import CarFormWizard, {
  type Make,
  type Tag,
  type OptionItem,
  type UploadedImage,
  type CarFormValues,
  type CarFormSubmitPayload,
} from "@/components/car/CarFormWizard";
import { type DamageMark } from "@/components/DamageDiagram";

export default function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [makes, setMakes] = useState<Make[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [options, setOptions] = useState<OptionItem[]>([]);

  // 위저드 초기값
  const [initialForm, setInitialForm] = useState<Partial<CarFormValues>>();
  const [initialModelName, setInitialModelName] = useState("");
  const [initialImages, setInitialImages] = useState<UploadedImage[]>([]);
  const [initialDamageMarks, setInitialDamageMarks] = useState<DamageMark[]>([]);
  const [initialTagIds, setInitialTagIds] = useState<string[]>([]);
  const [initialOptionItemIds, setInitialOptionItemIds] = useState<string[]>([]);
  const [originalImageIds, setOriginalImageIds] = useState<string[]>([]);

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

  // Fetch car data + reference data
  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchCar() {
      try {
        const [carRes, tagsRes, optionsRes, makesRes] = await Promise.all([
          fetch(`/api/cars/${id}`),
          fetch("/api/tags"),
          fetch("/api/options"),
          fetch("/api/makes"),
        ]);

        if (tagsRes.ok) {
          const data = await tagsRes.json();
          if (Array.isArray(data)) setTags(data);
        }
        if (optionsRes.ok) {
          const data = await optionsRes.json();
          if (Array.isArray(data)) setOptions(data);
        }
        if (makesRes.ok) {
          const data = await makesRes.json();
          if (Array.isArray(data)) setMakes(data);
        }

        if (!carRes.ok) {
          router.push("/seller/cars");
          return;
        }
        const car = await carRes.json();

        setInitialForm({
          title: car.title || "",
          categoryId: car.categoryId || "",
          makeId: car.makeId || "",
          modelId: car.modelId || "",
          year: car.year || new Date().getFullYear(),
          registrationDate:
            car.registrationDate || (car.year ? `${car.year}-01` : ""),
          mileage: car.mileage || 0,
          fuelType: car.fuelType || "GASOLINE",
          transmission: car.transmission || "AUTOMATIC",
          drivetrain: car.drivetrain || "FWD",
          displacement: car.displacement?.toString() || "",
          seats: car.seats?.toString() || "",
          color: car.color || "",
          description: car.description || "",
          status: car.status || "ACTIVE",
        });

        const makeName = car.make?.name || "";
        const modelName = car.carModel?.name || "";
        setInitialModelName([makeName, modelName].filter(Boolean).join(" "));

        if (car.tags) {
          setInitialTagIds(car.tags.map((x: { tag: Tag }) => x.tag.id));
        }
        if (car.options) {
          setInitialOptionItemIds(
            car.options.map((o: { optionItem: OptionItem }) => o.optionItem.id),
          );
        }
        if (Array.isArray(car.damageMarks)) {
          setInitialDamageMarks(car.damageMarks as DamageMark[]);
        }

        const existingImages: UploadedImage[] = (car.images || []).map(
          (img: { id: string; url: string }) => ({
            id: img.id,
            url: img.url,
            isNew: false,
          }),
        );
        setInitialImages(existingImages);
        setOriginalImageIds(existingImages.map((img) => img.id!));
      } catch {
        router.push("/seller/cars");
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [id, isAuthenticated, router]);

  const handleSubmit = async ({
    form,
    images,
    damageMarks,
    selectedTagIds,
    selectedOptionItemIds,
  }: CarFormSubmitPayload) => {
    setSaving(true);
    setError("");

    try {
      // 1. Update car info
      const res = await fetch(`/api/cars/${id}`, {
        method: "PATCH",
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
          // 가격 기능 미사용 — 당분간 0원으로 유지
          priceMin: 0,
          priceMax: 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || t("Failed to update vehicle"));
        return;
      }

      // 2. Delete removed images
      const currentExistingIds = images
        .filter((img) => !img.isNew && img.id)
        .map((img) => img.id!);
      const deletedIds = originalImageIds.filter(
        (oid) => !currentExistingIds.includes(oid),
      );
      // 이미지 변경은 실패해도 차량 정보 저장은 이미 끝났으므로
      // 중단하지 않고 실패 건수만 모아 마지막에 알린다.
      let imageFailures = 0;
      for (const imgId of deletedIds) {
        const delRes = await fetch(`/api/images/${imgId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!delRes.ok) imageFailures += 1;
      }

      // 3. Upload new images
      const newImages = images.filter((img) => img.isNew && img.file);
      for (const img of newImages) {
        const formData = new FormData();
        formData.append("file", img.file!);
        formData.append("imageCategory", "CAR_PHOTO");
        formData.append("targetId", id);
        const uploadRes = await fetch("/api/images", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadRes.ok) imageFailures += 1;
      }

      // 4. Set tags & options
      await Promise.all([
        fetch(`/api/cars/${id}/tags`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ tagIds: selectedTagIds }),
        }),
        fetch(`/api/cars/${id}/options`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ optionItemIds: selectedOptionItemIds }),
        }),
      ]);

      if (imageFailures > 0) {
        alert(t("Some photo changes were not saved. Please check the photos."));
      }

      router.push("/seller/cars");
    } catch {
      setError(t("A network error occurred. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageHeader title={t("Edit Vehicle")} />
      <CarFormWizard
        makes={makes}
        tags={tags}
        options={options}
        initialForm={initialForm}
        initialModelName={initialModelName}
        initialImages={initialImages}
        initialDamageMarks={initialDamageMarks}
        initialTagIds={initialTagIds}
        initialOptionItemIds={initialOptionItemIds}
        submitLabel={t("Save Changes")}
        submitting={saving}
        error={error}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
