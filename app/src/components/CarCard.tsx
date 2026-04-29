import Link from "next/link";
import Image from "next/image";
import {
  formatPrice,
  formatMileage,
  timeAgo,
  FUEL_TYPE_LABELS,
} from "@/lib/constants";

interface CarCardProps {
  car: {
    id: string;
    title: string;
    year: number;
    mileage: number;
    fuelType: string;
    price: number | string;
    viewCount: number;
    wishlistCount: number;
    chatCount: number;
    createdAt: string;
    thumbnail?: string | null;
    category?: { name: string };
    make?: { name: string };
    carModel?: { name: string };
  };
}

export default function CarCard({ car }: CarCardProps) {
  return (
    <Link href={`/cars/${car.id}`} className="block">
      <article className="flex gap-4 py-4 border-b border-gray-100 md:flex-col md:border md:rounded-xl md:overflow-hidden md:gap-0">
        {/* Thumbnail */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 md:w-full md:h-48 md:rounded-none">
          {car.thumbnail ? (
            <Image
              src={car.thumbnail}
              alt={car.title}
              fill
              sizes="(max-width: 768px) 128px, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-10 h-10"
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
        <div className="flex-1 min-w-0 md:p-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-[15px] leading-snug">
            {car.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {car.year} · {formatMileage(car.mileage)} ·{" "}
            {FUEL_TYPE_LABELS[car.fuelType] || car.fuelType}
          </p>
          <p className="font-bold text-gray-900 mt-2 text-base">
            {formatPrice(car.price)}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            {car.chatCount > 0 && <span>Chat {car.chatCount}</span>}
            {car.wishlistCount > 0 && <span>Likes {car.wishlistCount}</span>}
            {car.viewCount > 0 && <span>Views {car.viewCount}</span>}
            <span>{timeAgo(car.createdAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
