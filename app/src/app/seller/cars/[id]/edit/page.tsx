"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import CarImageUploader from "@/components/CarImageUploader";
import BottomSheetSelect from "@/components/BottomSheetSelect";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";

interface UploadedImage {
  id?: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

interface Tag {
  id: string;
  name: string;
  nameKo?: string;
}

interface OptionCategory {
  id: string;
  name: string;
  slug: string;
  items: OptionItem[];
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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [originalImageIds, setOriginalImageIds] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [optionCategories, setOptionCategories] = useState<OptionCategory[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedOptionItemIds, setSelectedOptionItemIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    makeId: "",
    modelId: "",
    trim: "",
    subTrim: "",
    year: new Date().getFullYear(),
    registrationDate: "",
    mileage: 0,
    fuelType: "GASOLINE",
    transmission: "AUTOMATIC",
    drivetrain: "FWD",
    displacement: "",
    color: "",
    priceMin: "",
    priceMax: "",
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
        const [carRes, tagsRes, optionsRes] = await Promise.all([
          fetch(`/api/cars/${id}`),
          fetch("/api/tags"),
          fetch("/api/option-categories"),
        ]);

        if (tagsRes.ok) {
          const data = await tagsRes.json();
          if (Array.isArray(data)) setTags(data);
        }
        if (optionsRes.ok) {
          const data = await optionsRes.json();
          if (Array.isArray(data)) setOptionCategories(data);
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
          trim: car.trim || "",
          subTrim: car.subTrim || "",
          year: car.year || new Date().getFullYear(),
          registrationDate: car.registrationDate || "",
          mileage: car.mileage || 0,
          fuelType: car.fuelType || "GASOLINE",
          transmission: car.transmission || "AUTOMATIC",
          drivetrain: car.drivetrain || "FWD",
          displacement: car.displacement?.toString() || "",
          color: car.color || "",
          priceMin: car.priceMin ? Number(car.priceMin).toLocaleString("ko-KR") : "",
          priceMax: car.priceMax ? Number(car.priceMax).toLocaleString("ko-KR") : "",
          description: car.description || "",
          status: car.status || "ACTIVE",
        });

        // Pre-select existing tags & options
        if (car.tags) {
          setSelectedTagIds(car.tags.map((t: { tag: Tag }) => t.tag.id));
        }
        if (car.options) {
          setSelectedOptionItemIds(
            car.options.map((o: { optionItem: OptionItem }) => o.optionItem.id)
          );
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
          year: Number(form.year),
          mileage: Number(form.mileage),
          displacement: form.displacement
            ? Number(form.displacement)
            : undefined,
          priceMin: Number(form.priceMin.replace(/,/g, "")),
          priceMax: Number(form.priceMax.replace(/,/g, "")),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update car");
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
      setError("Network error. Please try again.");
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
    "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="bg-white">
      <PageHeader title="Edit Car" />

      <form
        onSubmit={handleSubmit}
        className="px-4 pt-6 space-y-6"
      >
        {/* Photos */}
        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900">
            Photos {images.length > 0 && `(${images.length})`}
          </h2>
          <CarImageUploader images={images} onChange={setImages} />
        </section>

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className={labelClass}>Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Year <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => updateForm("year", e.target.value)}
                min={1990}
                max={2030}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Registration Date</label>
              <input
                type="text"
                value={form.registrationDate}
                onChange={(e) =>
                  updateForm("registrationDate", e.target.value)
                }
                placeholder="2020-03"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Trim</label>
              <input
                type="text"
                value={form.trim}
                onChange={(e) => updateForm("trim", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sub Trim</label>
              <input
                type="text"
                value={form.subTrim}
                onChange={(e) => updateForm("subTrim", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Specs */}
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-900">Specifications</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mileage (km) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.mileage || ""}
                onChange={(e) => updateForm("mileage", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Displacement (cc)</label>
              <input
                type="number"
                value={form.displacement}
                onChange={(e) => updateForm("displacement", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fuel Type <span className="text-red-500">*</span></label>
              <BottomSheetSelect
                value={form.fuelType}
                onChange={(v) => updateForm("fuelType", v)}
                options={Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                title="Select fuel type"
              />
            </div>
            <div>
              <label className={labelClass}>Transmission <span className="text-red-500">*</span></label>
              <BottomSheetSelect
                value={form.transmission}
                onChange={(v) => updateForm("transmission", v)}
                options={Object.entries(TRANSMISSION_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
                title="Select transmission"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Drivetrain</label>
              <BottomSheetSelect
                value={form.drivetrain}
                onChange={(v) => updateForm("drivetrain", v)}
                options={[
                  { value: "FWD", label: "FWD" },
                  { value: "RWD", label: "RWD" },
                  { value: "AWD", label: "AWD" },
                ]}
                title="Select drivetrain"
              />
            </div>
            <div>
              <label className={labelClass}>Color</label>
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
            <h2 className="font-semibold text-gray-900">Tags</h2>
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
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selected
                        ? "bg-main-500 text-white border-main-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-main-300"
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
        {optionCategories.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-semibold text-gray-900">Options</h2>
            {optionCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">
                  {category.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => {
                    const selected = selectedOptionItemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelectedOptionItemIds((prev) =>
                            selected
                              ? prev.filter((oid) => oid !== item.id)
                              : [...prev, item.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          selected
                            ? "bg-main-500 text-white border-main-500"
                            : "bg-white text-gray-600 border-gray-200 hover:border-main-300"
                        }`}
                      >
                        {item.nameKo || item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Price & Description */}
        <section className="space-y-4">
          <h2 className="font-semibold text-gray-900">Price & Description</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Min Price (KRW) <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                value={form.priceMin}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  updateForm("priceMin", raw ? Number(raw).toLocaleString("ko-KR") : "");
                }}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max Price (KRW) <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                value={form.priceMax}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  updateForm("priceMax", raw ? Number(raw).toLocaleString("ko-KR") : "");
                }}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={5}
              className={`${inputClass} resize-none`}
            />
          </div>
        </section>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-40 bg-white border-t border-gray-100 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="submit"
            disabled={saving || !form.title || !form.priceMin || !form.priceMax}
            className="w-full h-12 bg-main-500 text-white text-base font-semibold rounded-xl hover:bg-main-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
