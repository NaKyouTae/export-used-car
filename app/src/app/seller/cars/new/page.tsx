"use client";

import { useState, useEffect } from "react";
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

interface Make {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
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

export default function NewCarPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [optionCategories, setOptionCategories] = useState<OptionCategory[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedOptionItemIds, setSelectedOptionItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
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

  // Fetch makes, categories, tags, and option categories
  useEffect(() => {
    async function fetchData() {
      try {
        const [makesRes, categoriesRes, tagsRes, optionsRes] = await Promise.all([
          fetch("/api/makes"),
          fetch("/api/categories"),
          fetch("/api/tags"),
          fetch("/api/option-categories"),
        ]);
        if (makesRes.ok) {
          const data = await makesRes.json();
          if (Array.isArray(data)) setMakes(data);
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          if (Array.isArray(data)) setCategories(data);
        }
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          if (Array.isArray(data)) setTags(data);
        }
        if (optionsRes.ok) {
          const data = await optionsRes.json();
          if (Array.isArray(data)) setOptionCategories(data);
        }
      } catch {
        // Data will be empty, user can still type
      }
    }
    fetchData();
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!form.makeId) {
        setModels([]);
        return;
      }
      try {
        const res = await fetch(`/api/makes/${form.makeId}/models`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setModels(data);
        }
      } catch {
        // ignore
      }
    };
    fetchModels();
  }, [form.makeId]);

  const updateForm = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          year: Number(form.year),
          mileage: Number(form.mileage),
          displacement: form.displacement ? Number(form.displacement) : undefined,
          priceMin: Number(form.priceMin.replace(/,/g, "")),
          priceMax: Number(form.priceMax.replace(/,/g, "")),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to register car");
        return;
      }

      const carId = data.id;

      // 2. Upload images
      const newImages = images.filter((img) => img.isNew && img.file);
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i];
        const formData = new FormData();
        formData.append("file", img.file!);
        formData.append("imageCategory", "CAR_PHOTO");
        formData.append("targetId", carId);

        await fetch("/api/images", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
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
          })
        );
      }
      if (selectedOptionItemIds.length > 0) {
        promises.push(
          fetch(`/api/cars/${carId}/options`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ optionItemIds: selectedOptionItemIds }),
          })
        );
      }
      await Promise.all(promises);

      router.push("/seller/cars");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Register Car" />

      <form onSubmit={handleSubmit} className="px-4 pt-6 space-y-6">
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
              placeholder="e.g. 2020 Hyundai Sonata 2.0T"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <BottomSheetSelect
                value={form.categoryId}
                onChange={(v) => updateForm("categoryId", v)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select"
                title="Select category"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Make <span className="text-red-500">*</span></label>
              <BottomSheetSelect
                value={form.makeId}
                onChange={(v) => {
                  updateForm("makeId", v);
                  updateForm("modelId", "");
                }}
                options={makes.map((m) => ({ value: m.id, label: m.name }))}
                placeholder="Select"
                title="Select make"
                searchable
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Model <span className="text-red-500">*</span></label>
              <BottomSheetSelect
                value={form.modelId}
                onChange={(v) => updateForm("modelId", v)}
                options={models.map((m) => ({ value: m.id, label: m.name }))}
                placeholder="Select"
                title="Select model"
                searchable
                disabled={!form.makeId}
                required
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Trim</label>
              <input
                type="text"
                value={form.trim}
                onChange={(e) => updateForm("trim", e.target.value)}
                placeholder="e.g. 2.0T"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Sub Trim</label>
              <input
                type="text"
                value={form.subTrim}
                onChange={(e) => updateForm("subTrim", e.target.value)}
                placeholder="e.g. Prestige"
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
                placeholder="185000"
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
                placeholder="1999"
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
                placeholder="White"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Registration Date</label>
            <input
              type="text"
              value={form.registrationDate}
              onChange={(e) => updateForm("registrationDate", e.target.value)}
              placeholder="2020-03"
              className={inputClass}
            />
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
                          ? prev.filter((id) => id !== tag.id)
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
                              ? prev.filter((id) => id !== item.id)
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
                placeholder="15,000,000"
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
                placeholder="20,000,000"
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
              placeholder="Describe the vehicle condition, features, history..."
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
            disabled={loading || !form.title || !form.categoryId || !form.makeId || !form.modelId || !form.priceMin || !form.priceMax}
            className="w-full h-12 bg-main-500 text-white text-base font-semibold rounded-xl hover:bg-main-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Registering..." : "Register Car"}
          </button>
        </div>
      </form>
    </div>
  );
}
