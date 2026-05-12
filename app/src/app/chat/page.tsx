"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";

interface ChatRoom {
  id: string;
  car: {
    id: string;
    title: string;
    priceMin: number | string;
    priceMax: number | string;
  } | null;
  seller: { id: string; companyName: string; contactName: string };
  buyer: { id: string; name: string; email: string };
  lastMessage: {
    content: string;
    createdAt: string;
    senderType: string;
  } | null;
  unreadCount: number;
  createdAt: string;
}

export default function ChatListPage() {
  return (
    <Suspense>
      <ChatListContent />
    </Suspense>
  );
}

function ChatListContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const carId = searchParams.get("carId");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchRooms = useCallback(() => {
    const url = carId
      ? `/api/chat/rooms?carId=${carId}`
      : "/api/chat/rooms";
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then(setRooms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchRooms();
    pollingRef.current = setInterval(fetchRooms, 10000);

    window.addEventListener("chat:unread-update", fetchRooms);
    return () => {
      clearInterval(pollingRef.current);
      window.removeEventListener("chat:unread-update", fetchRooms);
    };
  }, [isAuthenticated, authLoading, router, fetchRooms]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <PageHeader title="Chat" showBack={!!carId} />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-[100px]">
      <PageHeader title={carId ? "Car Chats" : "Chat"} showBack={!!carId} />

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Start chatting from a car listing</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {rooms.map((room) => {
            const otherName =
              user?.userType === "BUYER"
                ? room.seller.companyName
                : room.buyer.name || room.buyer.email;

            return (
              <button
                key={room.id}
                onClick={() => router.push(`/chat/${room.id}`)}
                className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 bg-main-100 rounded-full flex items-center justify-center">
                  <span className="text-main-600 font-semibold text-sm">
                    {otherName.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {otherName}
                    </span>
                    {room.lastMessage && (
                      <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {room.car && (
                    <p className="text-xs text-main-500 truncate mt-0.5">
                      {room.car.title}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">
                      {room.lastMessage
                        ? room.lastMessage.content
                        : "No messages yet"}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="flex-shrink-0 ml-2 bg-main-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
