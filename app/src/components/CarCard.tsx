import Link from "next/link";
import Image from "next/image";
import {
  formatPriceRange,
  formatMileage,
  FUEL_TYPE_LABELS,
} from "@/lib/constants";

interface CarCardProps {
  car: {
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
    thumbnail?: string | null;
    images?: { url: string; isThumbnail: boolean }[];
    category?: { name: string };
    make?: { name: string };
    carModel?: { name: string };
  };
}

export default function CarCard({ car }: CarCardProps) {
  const thumbnailUrl =
    car.thumbnail ||
    car.images?.find((img) => img.isThumbnail)?.url ||
    car.images?.[0]?.url ||
    null;

  return (
    <Link href={`/cars/${car.id}`} className="block">
      <article className="flex flex-col py-4 border-b border-gray-100">
        {/* Thumbnail */}
        <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-gray-100">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={car.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 min-w-0">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-[15px] leading-snug">
            {car.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {car.year} · {formatMileage(car.mileage)} ·{" "}
            {FUEL_TYPE_LABELS[car.fuelType] || car.fuelType}
          </p>
          <p className="font-semibold text-gray-900 mt-2 text-[15px] truncate">
            {formatPriceRange(car.priceMin, car.priceMax)}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {car.viewCount}
            </span>
            <span className="flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {car.wishlistCount}
            </span>
            <span className="flex items-center gap-0.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {car.chatCount}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
