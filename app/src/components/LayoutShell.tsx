"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "./BottomNav";
import SellerFAB from "./SellerFAB";

const FULL_SCREEN_PATHS = ["/chat/"];
const NO_BOTTOM_PADDING_PATHS = ["/privacy", "/terms", "/register", "/login"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isFullScreen =
    FULL_SCREEN_PATHS.some((p) => pathname.startsWith(p)) ||
    NO_BOTTOM_PADDING_PATHS.includes(pathname);

  // Refresh server data on every route change so navigation always
  // reflects the latest state (invalidates Next.js Router/Data cache).
  const previousPathRef = useRef(pathname);
  useEffect(() => {
    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      router.refresh();
    }
  }, [pathname, router]);

  return (
    <>
      <div
        className={`mx-auto w-full max-w-[390px] min-h-dvh bg-white shadow-sm flex flex-col ${
          isFullScreen ? "" : "pb-[calc(84px+env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </div>
      <SellerFAB />
      <BottomNav />
    </>
  );
}
