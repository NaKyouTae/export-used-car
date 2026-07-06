"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import CarImageUploader from "@/components/CarImageUploader";
import BottomSheetSelect from "@/components/BottomSheetSelect";
import BottomSheetMultiSelect from "@/components/BottomSheetMultiSelect";
import MakeModelPicker from "@/components/MakeModelPicker";
import DamageMarksField from "@/components/DamageMarksField";
import { type DamageMark } from "@/components/DamageDiagram";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";

interface UploadedImage {
  id?: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

interface Make {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  nameKo?: string;
}

interface OptionItem {
  id: string;
  name: string;
  nameKo?: string;
}

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
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [originalImageIds, setOriginalImageIds] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedOptionItemIds, setSelectedOptionItemIds] = useState<string[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [selectedModelName, setSelectedModelName] = useState("");
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    makeId: "",
    modelId: "",
    year: new Date().getFullYear(),
    registrationDate: "",
    mileage: 0,
    fuelType: "GASOLINE",
    transmission: "AUTOMATIC",
    drivetrain: "FWD",
    displacement: "",
    seats: "",
    color: "",
    description: "",
    status: "ACTIVE",
  });

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

  // Fetch car data + images + tags + options
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
        setForm({
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

        // 현재 제조사·모델 라벨
        const makeName = car.make?.name || "";
        const modelName = car.carModel?.name || "";
        setSelectedModelName(
          [makeName, modelName].filter(Boolean).join(" ")
        );

        // Pre-select existing tags & options
        if (car.tags) {
          setSelectedTagIds(car.tags.map((t: { tag: Tag }) => t.tag.id));
        }
        if (car.options) {
          setSelectedOptionItemIds(
            car.options.map((o: { optionItem: OptionItem }) => o.optionItem.id)
          );
        }

        // Load existing damage marks
        if (Array.isArray(car.damageMarks)) {
          setDamageMarks(car.damageMarks as DamageMark[]);
        }

        // Load existing images
        const existingImages: UploadedImage[] = (car.images || []).map(
          (img: { id: string; url: string }) => ({
            id: img.id,
            url: img.url,
            isNew: false,
          })
        );
        setImages(existingImages);
        setOriginalImageIds(existingImages.map((img) => img.id!));
      } catch {
        router.push("/seller/cars");
      } finally {
        setLoading(false);
      }
    }
    fetchCar();
  }, [id, isAuthenticated, router]);

  const updateForm = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        (oid) => !currentExistingIds.includes(oid)
      );
      for (const imgId of deletedIds) {
        await fetch(`/api/images?id=${imgId}`, {
          method: "DELETE",
          credentials: "include",
        });
      }

      // 3. Upload new images
      const newImages = images.filter((img) => img.isNew && img.file);
      for (const img of newImages) {
        const formData = new FormData();
        formData.append("file", img.file!);
        formData.append("imageCategory", "CAR_PHOTO");
        formData.append("targetId", id);

        await fetch("/api/images", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
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

  const inputClass =
    "w-full px-4 h-14 bg-gray-100 rounded-2xl text-[16px] font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 border border-transparent focus:outline-none focus:bg-white focus:border-main-500 focus:ring-4 focus:ring-main-500/10 transition-all";
  const textareaClass =
    "w-full px-4 py-4 bg-gray-100 rounded-2xl text-[16px] font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 border border-transparent focus:outline-none focus:bg-white focus:border-main-500 focus:ring-4 focus:ring-main-500/10 transition-all resize-none";
  const triggerClass =
    "w-full flex items-center justify-between gap-2 px-4 h-14 bg-gray-100 rounded-2xl text-[16px] font-medium text-gray-900 text-left border border-transparent focus:outline-none focus:bg-white focus:border-main-500 transition-colors disabled:opacity-50";
  const labelClass = "block text-[13px] font-medium text-gray-500 mb-1.5 ml-1";
  const sectionTitleClass = "text-[15px] font-bold text-gray-900";

  return (
    <div className="bg-white min-h-screen">
      <PageHeader title={t("Edit Vehicle")} />

      <form
        onSubmit={handleSubmit}
        className="px-4 pt-5 pb-28 space-y-8"
      >
        {/* Photos */}
        <section className="space-y-2">
          <h2 className={sectionTitleClass}>
            {t("Photos")} {images.length > 0 && `(${images.length})`}
          </h2>
          <CarImageUploader images={images} onChange={setImages} />
        </section>

        {/* 사고/수리 부위 — 항목 탭 시 전용 편집 화면으로 전환 */}
        <section className="space-y-2">
          <h2 className={sectionTitleClass}>사고·수리 부위</h2>
          <DamageMarksField
            marks={damageMarks}
            onChange={setDamageMarks}
            className={triggerClass}
          />
        </section>

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className={sectionTitleClass}>{t("Basic Info")}</h2>

          <div>
            <label className={labelClass}>{t("Title")} <span className="text-main-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{t("Make · Model")} <span className="text-main-500">*</span></label>
            <MakeModelPicker
              makes={makes}
              makeId={form.makeId}
              modelId={form.modelId}
              valueLabel={selectedModelName}
              placeholder={t("Select a make, then a model")}
              title={t("Select Make · Model")}
              className={triggerClass}
              onSelect={(make, model) => {
                updateForm("makeId", make.id);
                updateForm("modelId", model.id);
                updateForm("categoryId", model.categoryId || "");
                setSelectedModelName(`${make.name} ${model.name}`);
              }}
            />
          </div>

          <div>
            <label className={labelClass}>{t("Year")} <span className="text-main-500">*</span></label>
            <input
              type="month"
              value={form.registrationDate}
              onChange={(e) => {
                const v = e.target.value; // "YYYY-MM"
                updateForm("registrationDate", v);
                if (v) updateForm("year", Number(v.slice(0, 4)));
              }}
              min="1990-01"
              max="2030-12"
              required
              className={inputClass}
            />
          </div>
        </section>

        {/* Specs */}
        <section className="space-y-4">
          <h2 className={sectionTitleClass}>{t("Specs")}</h2>

          <div>
            <label className={labelClass}>{t("Mileage")} <span className="text-main-500">*</span></label>
            <div className="relative">
              <input
                type="number"
                value={form.mileage || ""}
                onChange={(e) => updateForm("mileage", e.target.value)}
                placeholder="185,000"
                required
                className={`${inputClass} pr-12`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-gray-400 pointer-events-none">km</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("Displacement")}</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.displacement}
                  onChange={(e) => updateForm("displacement", e.target.value)}
                  placeholder="1,999"
                  className={`${inputClass} pr-10`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-gray-400 pointer-events-none">cc</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("Seats")}</label>
              <input
                type="number"
                value={form.seats}
                onChange={(e) => updateForm("seats", e.target.value)}
                placeholder="5"
                min={1}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("Fuel")} <span className="text-main-500">*</span></label>
              <BottomSheetSelect
                value={form.fuelType}
                onChange={(v) => updateForm("fuelType", v)}
                options={Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                title={t("Select Fuel")}
                className={triggerClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t("Transmission")} <span className="text-main-500">*</span></label>
              <BottomSheetSelect
                value={form.transmission}
                onChange={(v) => updateForm("transmission", v)}
                options={Object.entries(TRANSMISSION_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                title={t("Select Transmission")}
                className={triggerClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("Drivetrain")}</label>
              <BottomSheetSelect
                value={form.drivetrain}
                onChange={(v) => updateForm("drivetrain", v)}
                options={[
                  { value: "FWD", label: t("Front-wheel drive (FWD)") },
                  { value: "RWD", label: t("Rear-wheel drive (RWD)") },
                  { value: "AWD", label: t("All-wheel drive (AWD)") },
                ]}
                title={t("Select Drivetrain")}
                className={triggerClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t("Color")}</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => updateForm("color", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Tags */}
        {tags.length > 0 && (
          <section className="space-y-3">
            <h2 className={sectionTitleClass}>{t("Tags")}</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedTagIds((prev) =>
                        selected
                          ? prev.filter((tid) => tid !== tag.id)
                          : [...prev, tag.id]
                      )
                    }
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                      selected
                        ? "bg-main-500 text-white border-main-500 shadow-sm shadow-main-500/20"
                        : "bg-gray-100 text-gray-600 border-transparent"
                    }`}
                  >
                    {tag.nameKo || tag.name}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Options */}
        <section className="space-y-3">
          <h2 className={sectionTitleClass}>{t("Options")}</h2>
          <BottomSheetMultiSelect
            title={t("Select Options")}
            placeholder={t("Select Options")}
            values={selectedOptionItemIds}
            onChange={setSelectedOptionItemIds}
            className={triggerClass}
            groups={[
              {
                options: options.map((item) => ({
                  value: item.id,
                  label: item.nameKo || item.name,
                })),
              },
            ]}
          />
        </section>

        {/* Description */}
        <section className="space-y-3">
          <h2 className={sectionTitleClass}>{t("Description")}</h2>
          <textarea
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            rows={5}
            className={textareaClass}
          />
        </section>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            disabled={saving || !form.title}
            className="w-full h-14 bg-main-500 text-white text-[16px] font-bold rounded-2xl hover:bg-main-600 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? t("Saving...") : t("Save Changes")}
          </button>
        </div>
      </form>
    </div>
  );
}
