import { Suspense } from "react";
import CarsListClient from "./CarsListClient";

export default function CarsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CarsListClient />
    </Suspense>
  );
}
