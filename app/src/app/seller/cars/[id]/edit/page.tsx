"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import CarImageUploader from "@/components/CarImageUploader";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";

interface UploadedImage {
  id?: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

export default function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [originalImageIds, setOriginalImageIds] = useState<string[]>([]);

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
    price: "",
    description: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/seller/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch car data + images
  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchCar() {
      try {
        const res = await fetch(`/api/cars/${id}`);
        if (!res.ok) {
          router.push("/seller/dashboard");
          return;
        }
        const car = await res.json();
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
          price: car.price?.toString() || "",
          description: car.description || "",
          status: car.status || "ACTIVE",
        });

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
        router.push("/seller/dashboard");
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
          price: Number(form.price),
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

      router.push("/seller/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const inputClass =
    "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Edit Car" />

      <form
        onSubmit={handleSubmit}
        className="max-w-screen-md mx-auto py-6 space-y-6"
      >
        {/* Photos */}
        <section className="bg-white rounded-xl overflow-hidden mx-4">
          <h2 className="font-semibold text-gray-900 px-4 pt-4 pb-2">
            Photos {images.length > 0 && `(${images.length})`}
          </h2>
          <div className="px-4 pb-4">
            <CarImageUploader images={images} onChange={setImages} />
          </div>
        </section>

        {/* Basic Info */}
        <section className="bg-white rounded-xl p-4 space-y-4 mx-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className={labelClass}>Title *</label>
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
              <label className={labelClass}>Year *</label>
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
        <section className="bg-white rounded-xl p-4 space-y-4 mx-4">
          <h2 className="font-semibold text-gray-900">Specifications</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mileage (km) *</label>
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
              <label className={labelClass}>Fuel Type *</label>
              <select
                value={form.fuelType}
                onChange={(e) => updateForm("fuelType", e.target.value)}
                className={inputClass}
              >
                {Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Transmission *</label>
              <select
                value={form.transmission}
                onChange={(e) => updateForm("transmission", e.target.value)}
                className={inputClass}
              >
                {Object.entries(TRANSMISSION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Drivetrain</label>
              <select
                value={form.drivetrain}
                onChange={(e) => updateForm("drivetrain", e.target.value)}
                className={inputClass}
              >
                <option value="FWD">FWD</option>
                <option value="RWD">RWD</option>
                <option value="AWD">AWD</option>
              </select>
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

        {/* Price & Description */}
        <section className="bg-white rounded-xl p-4 space-y-4 mx-4">
          <h2 className="font-semibold text-gray-900">Price & Description</h2>

          <div>
            <label className={labelClass}>Price (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                $
              </span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                required
                className={`${inputClass} pl-8`}
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
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mx-4">
            {error}
          </div>
        )}

        <div className="mx-4">
          <button
            type="submit"
            disabled={saving || !form.title || !form.price}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
