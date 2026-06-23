import { useSyncExternalStore } from "react";

const STORAGE_KEY = "euc_recently_viewed";
const MAX_ITEMS = 30;

export interface RecentCar {
  id: string;
  title: string;
  year: number;
  registrationDate?: string | null;
  mileage: number;
  fuelType: string;
  transmission?: string;
  drivetrain?: string | null;
  seats?: number | null;
  priceMin: number | string;
  priceMax: number | string;
  viewCount: number;
  wishlistCount: number;
  chatCount: number;
  createdAt: string;
  thumbnail?: string | null;
  seller?: { companyName?: string | null };
  viewedAt: number;
}

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function addRecentlyViewed(car: Omit<RecentCar, "viewedAt">) {
  try {
    const list = getRecentlyViewed();
    const filtered = list.filter((item) => item.id !== car.id);
    filtered.unshift({ ...car, viewedAt: Date.now() });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(filtered.slice(0, MAX_ITEMS))
    );
    notify();
  } catch {
    // localStorage unavailable
  }
}

export function getRecentlyViewed(): RecentCar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentCar[];
  } catch {
    return [];
  }
}

let cachedRaw: string | null = null;
let cachedSnapshot: RecentCar[] = [];

function getSnapshot(): RecentCar[] {
  const raw =
    typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  try {
    cachedSnapshot = raw ? (JSON.parse(raw) as RecentCar[]) : [];
  } catch {
    cachedSnapshot = [];
  }
  return cachedSnapshot;
}

const EMPTY: RecentCar[] = [];
const getServerSnapshot = () => EMPTY;

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRecentlyViewedCars(): RecentCar[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
