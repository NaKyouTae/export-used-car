import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import CarDetailClient from "./CarDetailClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:18090";
const COOKIE_ACCESS = "euc_at";

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

async function getCar(id: string): Promise<CarDetail | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_ACCESS)?.value;

    const headers: Record<string, string> = {};
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;

    const res = await fetch(`${API_URL}/cars/${id}`, {
      headers,
      // Auth-aware response — don't cache so the seller-view rule applies per request
      cache: accessToken ? "no-store" : undefined,
      next: accessToken ? undefined : { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await getCar(id);
  if (!car) return { title: "Car Not Found" };
  return {
    title: `${car.title} - Ajucar`,
    description: `${car.year} ${car.make?.name || ""} ${car.carModel?.name || ""} - ${Number(car.priceMin).toLocaleString()} KRW`,
  };
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const car = await getCar(id);
  if (!car) notFound();

  return <CarDetailClient car={car} />;
}
