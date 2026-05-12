"use client";

import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

const FULL_SCREEN_PATHS = ["/chat/"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreen = FULL_SCREEN_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      <div
        className={`mx-auto w-full max-w-[390px] min-h-screen bg-white shadow-sm ${
          isFullScreen ? "" : "pb-[88px]"
        }`}
      >
        {children}
      </div>
      <BottomNav />
    </>
  );
}
