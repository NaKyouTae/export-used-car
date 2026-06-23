import Header from "@/components/Header";
import HomeClient from "./HomeClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

type Car = {
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
  images?: { url: string; isThumbnail: boolean }[];
};

async function getPopularCars(): Promise<Car[]> {
  try {
    const res = await fetch(`${API_URL}/cars?limit=5&sort=wishlist`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

async function getRecentCars(): Promise<Car[]> {
  try {
    const res = await fetch(`${API_URL}/cars?limit=10&sort=newest`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [popularCars, recentCars] = await Promise.all([
    getPopularCars(),
    getRecentCars(),
  ]);

  return (
    <div className="bg-white">
      <Header />
      <HomeClient popularCars={popularCars} recentCars={recentCars} />
    </div>
  );
}
