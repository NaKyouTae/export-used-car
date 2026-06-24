"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationBell() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [count, setCount] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchCount = useCallback(() => {
    fetch("/api/notifications/unread-count", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { count: 0 }))
      .then((data) => setCount(data.count ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    fetchCount();
    pollingRef.current = setInterval(fetchCount, 30000);

    // 알림을 읽으면 페이지에서 이 이벤트를 쏴 배지를 갱신한다.
    window.addEventListener("notifications:update", fetchCount);
    return () => {
      clearInterval(pollingRef.current);
      window.removeEventListener("notifications:update", fetchCount);
    };
  }, [isAuthenticated, isLoading, fetchCount]);

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/notifications"
      className="relative -mr-1 p-1 text-gray-700"
      aria-label={t("Notifications")}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
