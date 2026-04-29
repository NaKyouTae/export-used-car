"use client";

import { useState, useEffect } from "react";
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

export default function NewCarPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
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
    price: "",
    description: "",
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/seller/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch makes and categories
  useEffect(() => {
    async function fetchData() {
      try {
        const [makesRes, categoriesRes] = await Promise.all([
          fetch("/api/makes"),
          fetch("/api/categories"),
        ]);
        if (makesRes.ok) {
          const data = await makesRes.json();
          if (Array.isArray(data)) setMakes(data);
        }
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          if (Array.isArray(data)) setCategories(data);
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
          price: Number(form.price),
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

      router.push("/seller/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Register Car" />

      <form onSubmit={handleSubmit} className="max-w-screen-md mx-auto py-6 space-y-6">
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
              placeholder="e.g. 2020 Hyundai Sonata 2.0T"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => updateForm("categoryId", e.target.value)}
                className={inputClass}
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Make</label>
              <select
                value={form.makeId}
                onChange={(e) => {
                  updateForm("makeId", e.target.value);
                  updateForm("modelId", "");
                }}
                className={inputClass}
              >
                <option value="">Select</option>
                {makes.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Model</label>
              <select
                value={form.modelId}
                onChange={(e) => updateForm("modelId", e.target.value)}
                disabled={!form.makeId}
                className={inputClass}
              >
                <option value="">Select</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
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
        <section className="bg-white rounded-xl p-4 space-y-4 mx-4">
          <h2 className="font-semibold text-gray-900">Specifications</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Mileage (km) *</label>
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
              <label className={labelClass}>Fuel Type *</label>
              <select
                value={form.fuelType}
                onChange={(e) => updateForm("fuelType", e.target.value)}
                className={inputClass}
              >
                {Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
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
                  <option key={k} value={k}>{v}</option>
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

        {/* Price & Description */}
        <section className="bg-white rounded-xl p-4 space-y-4 mx-4">
          <h2 className="font-semibold text-gray-900">Price & Description</h2>

          <div>
            <label className={labelClass}>Price (USD) *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
                placeholder="12500"
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
              placeholder="Describe the vehicle condition, features, history..."
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
            disabled={loading || !form.title || !form.price}
            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Registering..." : "Register Car"}
          </button>
        </div>
      </form>
    </div>
  );
}
