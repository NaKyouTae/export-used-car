import Link from "next/link";
import CarCard from "@/components/CarCard";
import Header from "@/components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  sedan: "🚗",
  suv: "🚙",
  truck: "🚛",
  van: "🚐",
  bus: "🚌",
  hatchback: "🚗",
  coupe: "🏎️",
  wagon: "🚗",
  convertible: "🏎️",
  pickup: "🛻",
};

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function getRecentCars() {
  try {
    const res = await fetch(`${API_URL}/cars?limit=8&sort=newest`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, cars] = await Promise.all([
    getCategories(),
    getRecentCars(),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero / Search */}
      <section className="bg-gradient-to-b from-gray-50 to-white px-4 pt-8 pb-6">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Find Your Perfect Car
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Premium Korean used cars, shipped worldwide
          </p>
          <Link
            href="/cars"
            className="flex items-center w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-400 text-sm hover:border-gray-300 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Search by make, model, or keyword...
          </Link>
        </div>
      </section>

      {/* Category Chips */}
      {categories.length > 0 && (
        <section className="px-4 py-4">
          <div className="max-w-screen-lg mx-auto">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/cars?categoryId=${cat.id}`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-medium text-gray-700 transition-colors"
                >
                  <span>
                    {CATEGORY_EMOJIS[cat.slug.toLowerCase()] || "🚗"}
                  </span>
                  <span>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Listed */}
      <section className="px-4 pb-8">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              Recently Listed
            </h3>
            <Link
              href="/cars"
              className="text-sm text-orange-600 font-medium hover:text-orange-700"
            >
              View All
            </Link>
          </div>

          {Array.isArray(cars) && cars.length > 0 ? (
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {cars.map(
                (car: {
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
                  images?: { url: string; isThumbnail: boolean }[];
                }) => (
                  <CarCard key={car.id} car={car} />
                )
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-3 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <p className="text-sm">No cars listed yet</p>
              <p className="text-xs mt-1 text-gray-300">
                Check back soon for new listings
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-4 text-center text-xs text-gray-400">
        <p>AutoExport - Korean Used Car Export Platform</p>
      </footer>
    </div>
  );
}
