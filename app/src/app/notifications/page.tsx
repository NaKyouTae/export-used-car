"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { formatRelativeTime } from "@/lib/datetime";

interface NotificationItem {
  id: string;
  type: "CHAT_MESSAGE" | "PRICE_DROP" | "SYSTEM" | "KEYWORD_MATCH";
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

function notifyBell() {
  window.dispatchEvent(new Event("notifications:update"));
}

// 알림 종류별 아이콘
function TypeIcon({ type }: { type: NotificationItem["type"] }) {
  if (type === "CHAT_MESSAGE") {
    return (
      <svg className="w-5 h-5 text-main-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  if (type === "PRICE_DROP") {
    return (
      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    );
  }
  if (type === "KEYWORD_MATCH") {
    return (
      <svg className="w-5 h-5 text-main-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(() => {
    fetch("/api/notifications", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    fetchItems();
  }, [isAuthenticated, authLoading, router, fetchItems]);

  const markRead = useCallback((id: string) => {
    fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    })
      .then(() => notifyBell())
      .catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    fetch("/api/notifications/read-all", {
      method: "POST",
      credentials: "include",
    })
      .then(() => {
        setItems((prev) =>
          prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
        );
        notifyBell();
      })
      .catch(() => {});
  }, []);

  const handleClick = (n: NotificationItem) => {
    if (!n.readAt) {
      markRead(n.id);
      setItems((prev) =>
        prev.map((it) =>
          it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it,
        ),
      );
    }
    // 딥링크: 채팅 알림은 해당 채팅방으로, 키워드/가격 알림은 해당 차량 상세로 이동
    const roomId = n.data?.chatRoomId;
    if (n.type === "CHAT_MESSAGE" && typeof roomId === "string") {
      router.push(`/chat/${roomId}`);
      return;
    }
    const carId = n.data?.carId;
    if (
      (n.type === "KEYWORD_MATCH" || n.type === "PRICE_DROP") &&
      typeof carId === "string"
    ) {
      router.push(`/cars/${carId}`);
    }
  };

  const hasUnread = items.some((n) => !n.readAt);

  if (authLoading || loading) {
    return (
      <div className="bg-white min-h-screen">
        <PageHeader title={t("Notifications")} />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <PageHeader
        title={t("Notifications")}
        rightAction={
          hasUnread ? (
            <button
              onClick={markAllRead}
              className="text-xs font-medium text-main-600"
            >
              {t("Mark all as read")}
            </button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm">{t("No notifications yet")}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                n.readAt ? "" : "bg-main-50/40"
              }`}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                <TypeIcon type={n.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {n.title}
                  </span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate mt-0.5">{n.body}</p>
              </div>
              {!n.readAt && (
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
