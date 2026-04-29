"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-screen-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-gray-900">
          AutoExport
        </Link>

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
          ) : isAuthenticated && user ? (
            <>
              <span className="text-sm text-gray-600">
                {user.companyName || user.name || user.email}
              </span>
              {user.userType === "SELLER" ? (
                <Link
                  href="/seller/dashboard"
                  className="text-sm text-orange-600 font-medium hover:text-orange-700"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/cars"
                  className="text-sm text-orange-600 font-medium hover:text-orange-700"
                >
                  Browse
                </Link>
              )}
              <button
                onClick={async () => {
                  await fetch("/api/auth/token", {
                    method: "DELETE",
                    credentials: "include",
                  });
                  window.location.href = "/";
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/seller/login"
                className="text-sm text-orange-600 font-medium hover:text-orange-700"
              >
                Sell Cars
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
