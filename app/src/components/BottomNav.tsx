"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Cars", href: "/cars", icon: CarIcon },
  { label: "Wishlist", href: "/wishlist", icon: WishlistIcon },
  { label: "Chat", href: "/chat", icon: ChatIcon, badge: true },
  { label: "My", href: "/mypage", icon: MyPageIcon },
] as const;

const AUTH_PATHS = ["/login", "/register"];

export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    // Only poll for authenticated users — avoids silent 401s on login/auth pages
    if (!isAuthenticated) return;

    let active = true;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/chat/unread-count", {
          credentials: "include",
        });
        if (!active) return;
        if (res.status === 401) {
          // Auth expired — stop polling until next auth change
          if (pollingRef.current) clearInterval(pollingRef.current);
          setUnreadCount(0);
          return;
        }
        if (!res.ok) {
          console.warn(
            `[BottomNav] unread-count failed: ${res.status} ${res.statusText}`
          );
          return;
        }
        const data = await res.json();
        if (!active) return;
        setUnreadCount(data.unreadCount ?? 0);
      } catch (err) {
        console.warn("[BottomNav] unread-count network error:", err);
      }
    };

    fetchUnread();
    pollingRef.current = setInterval(fetchUnread, 10000);

    // Instant refresh when chat is read or new message arrives
    window.addEventListener("chat:unread-update", fetchUnread);
    return () => {
      active = false;
      clearInterval(pollingRef.current);
      window.removeEventListener("chat:unread-update", fetchUnread);
    };
  }, [isAuthenticated]);

  // When logged out, force display to 0 without setState in effect
  const displayedUnread = isAuthenticated ? unreadCount : 0;

  // Hide on sub-pages and auth pages that don't need bottom nav
  if (AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
    return null;
  if (/^\/cars\/[^/]+$/.test(pathname)) return null;
  if (pathname.startsWith("/chat/")) return null;
  if (pathname.startsWith("/mypage/profile")) return null;
  if (isAuthLoading) return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50 pointer-events-none">
      <div className="mx-5 mb-5 pointer-events-auto">
        <nav className="flex items-center justify-around h-[60px] bg-white/90 backdrop-blur-xl rounded-[32px] shadow-[0_0_20px_rgba(0,0,0,0.06)]">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const showBadge =
              "badge" in item && item.badge && displayedUnread > 0 && !isActive;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-0.5 w-16 py-1"
              >
                <div className="relative">
                  <item.icon active={isActive} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 leading-none">
                      {displayedUnread >= 99 ? "99+" : displayedUnread}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isActive ? "text-main-600" : "text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "oklch(0.47 0.19 250)" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function CarIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "oklch(0.47 0.19 250)" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1h1.4a1 1 0 0 0 .8-.4l2-2.67A1 1 0 0 1 9 4.5h6a1 1 0 0 1 .8.43l2 2.67a1 1 0 0 0 .8.4H20a1 1 0 0 1 1 1v6a2 2 0 0 1-2 2" />
      <circle cx="7.5" cy="17" r="2" />
      <circle cx="16.5" cy="17" r="2" />
    </svg>
  );
}

function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "oklch(0.47 0.19 250)" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function WishlistIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "oklch(0.47 0.19 250)" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function MyPageIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "oklch(0.47 0.19 250)" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}
