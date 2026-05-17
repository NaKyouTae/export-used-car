"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  formatPriceRange,
  formatMileage,
  FUEL_TYPE_LABELS,
  TRANSMISSION_LABELS,
  DRIVETRAIN_LABELS,
} from "@/lib/constants";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { addRecentlyViewed } from "@/hooks/useRecentlyViewed";

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
  priceMin: number | string;
  priceMax: number | string;
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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(car.wishlistCount);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const thumbnail =
      car.images?.find((img) => img.isThumbnail)?.url ||
      car.images?.[0]?.url ||
      null;
    addRecentlyViewed({
      id: car.id,
      title: car.title,
      year: car.year,
      mileage: car.mileage,
      fuelType: car.fuelType,
      priceMin: car.priceMin,
      priceMax: car.priceMax,
      viewCount: car.viewCount,
      wishlistCount: car.wishlistCount,
      chatCount: car.chatCount,
      createdAt: car.createdAt,
      thumbnail,
    });
  }, [car]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetch(`/api/cars/${car.id}/wishlist`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setWishlisted(data.wishlisted);
      })
      .catch(() => {});
  }, [car.id, isAuthenticated, authLoading]);

  const toggleWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (togglingWishlist) return;
    setTogglingWishlist(true);
    try {
      const res = await fetch(`/api/cars/${car.id}/wishlist`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setWishlisted(data.wishlisted);
        setWishlistCount((prev) => prev + (data.wishlisted ? 1 : -1));
      }
    } catch {
      // ignore
    } finally {
      setTogglingWishlist(false);
    }
  }, [car.id, togglingWishlist, isAuthenticated, router]);

  const isSeller = user?.role === "SELLER";

  const handleChatAction = useCallback(async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (startingChat) return;

    // Seller: go to chat list filtered by this car
    if (isSeller) {
      router.push(`/chat?carId=${car.id}`);
      return;
    }

    // Buyer: create or get chat room, then navigate to it
    setStartingChat(true);
    try {
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: car.id }),
      });
      if (res.ok) {
        const room = await res.json();
        router.push(`/chat/${room.id}`);
      }
    } catch {
      // ignore
    } finally {
      setStartingChat(false);
    }
  }, [car.id, isAuthenticated, isSeller, router, startingChat]);

  const sortedImages = [...(car.images || [])].sort((a, b) => a.order - b.order);
  const imageCount = sortedImages.length;

  const handleGalleryScroll = useCallback(() => {
    const el = galleryRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCurrentImageIdx((prev) => (prev === idx ? prev : idx));
  }, []);

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
    <div className="min-h-dvh bg-white pb-[72px]">
      <PageHeader title="Car Details" />

      {/* Image Gallery */}
      <div className="relative bg-gray-100 aspect-[4/3] max-h-[400px] w-full">
        {sortedImages.length > 0 ? (
          <div
            ref={galleryRef}
            onScroll={handleGalleryScroll}
            className="h-full w-full overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
          >
            {sortedImages.map((img, idx) => (
              <div
                key={img.id}
                className="relative flex-shrink-0 w-full h-full snap-center snap-always"
              >
                <Image
                  src={img.url}
                  alt={`${car.title} - ${idx + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover pointer-events-none"
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageCount > 1 && (
          <>
            <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
              {currentImageIdx + 1}/{imageCount}
            </span>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
              {sortedImages.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImageIdx ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className=" px-4">
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
        <div className="pb-2">
          <p className="text-2xl font-bold text-gray-900">
            {formatPriceRange(car.priceMin, car.priceMax)}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pb-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {car.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlistCount}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {car.chatCount}
          </span>
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

      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[390px] mx-auto bg-white border-t border-gray-200 px-4 py-3 pb-safe z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleWishlist}
            disabled={togglingWishlist}
            className="flex items-center justify-center w-12 h-12 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {wishlisted ? (
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
          <button
            onClick={handleChatAction}
            disabled={startingChat}
            className="flex-1 py-3 bg-main-500 text-white font-semibold rounded-xl hover:bg-main-600 transition-colors disabled:opacity-60"
          >
            {startingChat
              ? "Opening Chat..."
              : isSeller
                ? `View Chats (${car.chatCount})`
                : "Chat with Seller"}
          </button>
        </div>
      </div>
    </div>
  );
}
