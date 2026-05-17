"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const HIDDEN_EXACT_PATHS = ["/login", "/register", "/privacy", "/terms"];
const HIDDEN_PREFIX_PATHS = [
  "/login/",
  "/register/",
  "/chat/",
  "/seller/cars/new",
];
const HIDDEN_REGEX_PATHS = [/^\/mypage\/.+/];

export default function SellerFAB() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user || user.role !== "SELLER") return null;

  if (HIDDEN_EXACT_PATHS.includes(pathname)) return null;
  if (HIDDEN_PREFIX_PATHS.some((p) => pathname.startsWith(p))) return null;
  if (HIDDEN_REGEX_PATHS.some((r) => r.test(pathname))) return null;
  if (/^\/cars\/[^/]+$/.test(pathname)) return null;
  if (/^\/seller\/cars\/[^/]+\/edit$/.test(pathname)) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-40 pointer-events-none">
      <Link
        href="/seller/cars/new"
        aria-label="Register new car"
        className="pointer-events-auto absolute right-5 bottom-[calc(76px+max(20px,env(safe-area-inset-bottom)))] inline-flex items-center gap-1 h-8 pl-2.5 pr-3 rounded-full bg-main-600 text-white text-xs font-semibold shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 transition-transform"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Car</span>
      </Link>
    </div>
  );
}
