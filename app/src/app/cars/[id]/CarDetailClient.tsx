"use client";

import Image from "next/image";
import {
  formatPrice,
  formatMileage,
  timeAgo,
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DRIVETRAIN_LABELS,
} from "@/lib/constants";
import PageHeader from "@/components/PageHeader";

interface CarDetail {
  id: string;
  title: string;
  trim?: string;
  subTrim?: string;
  year: number;
  registrationDate?: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  drivetrain?: string;
  displacement?: number;
  color?: string;
  price: number | string;
  description?: string;
  status: string;
  viewCount: number;
  wishlistCount: number;
  chatCount: number;
  createdAt: string;
  category?: { id: string; name: string };
  make?: { id: string; name: string };
  carModel?: { id: string; name: string };
  seller?: { id: string; companyName: string; contactName: string };
  images?: { id: string; url: string; isThumbnail: boolean; order: number }[];
  tags?: { tag: { id: string; name: string } }[];
  options?: {
    optionItem: {
      id: string;
      name: string;
      category: { id: string; name: string };
    };
  }[];
}

export default function CarDetailClient({ car }: { car: CarDetail }) {
  const sortedImages = [...(car.images || [])].sort((a, b) => a.order - b.order);
  const imageCount = sortedImages.length;

  // Group options by category
  const optionsByCategory: Record<string, string[]> = {};
  car.options?.forEach((opt) => {
    const catName = opt.optionItem.category.name;
    if (!optionsByCategory[catName]) optionsByCategory[catName] = [];
    optionsByCategory[catName].push(opt.optionItem.name);
  });

  const specRows = [
    { label: "Category", value: car.category?.name },
    { label: "Make", value: car.make?.name },
    { label: "Model", value: car.carModel?.name },
    { label: "Trim", value: [car.trim, car.subTrim].filter(Boolean).join(" ") || undefined },
    { label: "Year", value: car.year?.toString() },
    { label: "Registration", value: car.registrationDate },
    {
      label: "Displacement",
      value: car.displacement ? `${car.displacement.toLocaleString()}cc` : undefined,
    },
    { label: "Fuel", value: FUEL_TYPE_LABELS[car.fuelType] },
    { label: "Transmission", value: TRANSMISSION_LABELS[car.transmission] },
    {
      label: "Drivetrain",
      value: car.drivetrain ? DRIVETRAIN_LABELS[car.drivetrain] : undefined,
    },
    { label: "Color", value: car.color },
  ].filter((row) => row.value);

  return (
    <div className="min-h-screen bg-white pb-20">
      <PageHeader title="" />

      {/* Image Gallery Placeholder */}
      <div className="relative bg-gray-100 aspect-[4/3] max-h-[400px] w-full overflow-hidden">
        {sortedImages.length > 0 ? (
          <Image
            src={sortedImages[0].url}
            alt={car.title}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageCount > 1 && (
          <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            1/{imageCount}
          </span>
        )}
      </div>

      <div className="max-w-screen-lg mx-auto px-4">
        {/* Seller Info */}
        {car.seller && (
          <div className="flex items-center gap-3 py-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm font-bold">
              {car.seller.companyName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">
                {car.seller.companyName}
              </p>
              <p className="text-xs text-gray-500">Dealer</p>
            </div>
          </div>
        )}

        {/* Title + Specs Summary */}
        <div className="py-4">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {car.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {car.year} · {formatMileage(car.mileage)} ·{" "}
            {FUEL_TYPE_LABELS[car.fuelType] || car.fuelType}
          </p>
        </div>

        {/* Price */}
        <div className="pb-4">
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(car.price)}
          </p>
        </div>

        {/* Description */}
        {car.description && (
          <div className="py-4 border-t border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {car.description}
            </p>
          </div>
        )}

        {/* Tags */}
        {car.tags && car.tags.length > 0 && (
          <div className="py-4 border-t border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-2">Additional Info</h2>
            <div className="flex flex-wrap gap-2">
              {car.tags.map((t) => (
                <span
                  key={t.tag.id}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                >
                  {t.tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Specs Table */}
        <div className="py-4 border-t border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-3">Specifications</h2>
          <div className="space-y-0">
            {specRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between py-2.5 border-b border-gray-50 last:border-0"
              >
                <span className="text-sm text-gray-500">{row.label}</span>
                <span className="text-sm font-medium text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        {Object.keys(optionsByCategory).length > 0 && (
          <div className="py-4 border-t border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Options</h2>
            <div className="space-y-3">
              {Object.entries(optionsByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {category}
                  </h3>
                  <p className="text-sm text-gray-700">{items.join(", ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            {timeAgo(car.createdAt)} · Chat {car.chatCount} · Likes{" "}
            {car.wishlistCount} · Views {car.viewCount}
          </p>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 pb-safe z-50">
        <div className="max-w-screen-lg mx-auto flex items-center gap-3">
          <button className="flex items-center justify-center w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors">
            Chat with Seller
          </button>
        </div>
      </div>
    </div>
  );
}
