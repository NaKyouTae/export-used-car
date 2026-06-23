import { Suspense } from "react";
import CarsFilterClient from "./CarsFilterClient";

export default function CarsFilterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CarsFilterClient />
    </Suspense>
  );
}
