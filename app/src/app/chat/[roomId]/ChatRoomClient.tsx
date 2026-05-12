"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { formatPriceRange } from "@/lib/constants";
import { notifyChatUpdate } from "@/lib/chat-events";
import PageHeader from "@/components/PageHeader";

interface ChatRoomInfo {
  id: string;
  car: {
    id: string;
    title: string;
    priceMin: number | string;
    priceMax: number | string;
  } | null;
  seller: { id: string; companyName: string; contactName: string };
  buyer: { id: string; name: string; email: string };
}

interface Message {
  id: string;
  senderType: "SELLER" | "BUYER";
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<ChatRoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Poll: fetch only new messages (after the last one we have)
  const pollNewMessages = useCallback(async () => {
    const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`, {
      credentials: "include",
    });
    if (res.ok) {
      const { data } = await res.json();
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m: Message) => m.id));
        const newMsgs = (data as Message[]).filter((m) => !existingIds.has(m.id));
        return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
      });
      notifyChatUpdate();
    }
  }, [roomId]);

  // Load older messages (scroll up)
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    setLoadingOlder(true);

    const oldestId = messages[0].id;
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    try {
      const res = await fetch(
        `/api/chat/rooms/${roomId}/messages?cursor=${oldestId}&limit=10`,
        { credentials: "include" }
      );
      if (res.ok) {
        const { data, hasMore: more } = await res.json();
        setHasMore(more);
        if (data.length > 0) {
          setMessages((prev) => [...data, ...prev]);
          // Restore scroll position after prepending
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, messages, hasMore, loadingOlder]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch(`/api/chat/rooms/${roomId}`, { credentials: "include" }).then(
        (res) => (res.ok ? res.json() : null)
      ),
      fetch(`/api/chat/rooms/${roomId}/messages?limit=10`, {
        credentials: "include",
      }).then((res) => (res.ok ? res.json() : { data: [], hasMore: false })),
    ])
      .then(([roomData, messagesRes]) => {
        if (!roomData) {
          router.push("/chat");
          return;
        }
        setRoom(roomData);
        setMessages(messagesRes.data);
        setHasMore(messagesRes.hasMore);
        notifyChatUpdate();
      })
      .catch(() => router.push("/chat"))
      .finally(() => setLoading(false));
  }, [roomId, isAuthenticated, authLoading, router]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!room) return;
    pollingRef.current = setInterval(pollNewMessages, 5000);
    return () => clearInterval(pollingRef.current);
  }, [room, pollNewMessages]);

  // Scroll up to load older messages
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 50) {
      loadOlderMessages();
    }
  }, [loadOlderMessages]);



  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        notifyChatUpdate();
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        });
      }
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <PageHeader title="Chat" />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!room) return null;

  const otherName =
    user?.userType === "BUYER"
      ? room.seller.companyName
      : room.buyer.name || room.buyer.email;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDateKey = (dateStr: string) => new Date(dateStr).toDateString();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <PageHeader
        title={otherName}
        rightAction={
          room.car ? (
            <button
              onClick={() => router.push(`/cars/${room.car!.id}`)}
              className="text-xs text-main-500 font-medium"
            >
              View Car
            </button>
          ) : undefined
        }
      />

      {/* Car info bar */}
      {room.car && (
        <div className="bg-white border-b border-gray-100 px-4 py-2.5">
          <p className="text-xs text-gray-700 font-medium truncate">
            {room.car.title}
          </p>
          <p className="text-xs text-main-500 font-semibold">
            {formatPriceRange(room.car.priceMin, room.car.priceMax)}
          </p>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3"
      >
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {messages.map((msg, i) => {
          const dateKey = getDateKey(msg.createdAt);
          const prevDateKey =
            i > 0 ? getDateKey(messages[i - 1].createdAt) : null;
          const showDate = dateKey !== prevDateKey;

          const isMe =
            (user?.userType === "BUYER" && msg.senderType === "BUYER") ||
            (user?.userType === "SELLER" && msg.senderType === "SELLER");

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] text-gray-400 bg-gray-200/60 px-3 py-1 rounded-full">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                </div>
              )}
              <div
                className={`flex mb-2 ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl ${
                    isMe
                      ? "bg-main-500 text-white rounded-br-md"
                      : "bg-white text-gray-900 rounded-bl-md shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe ? "text-white/60" : "text-gray-400"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 pt-3 pb-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-main-500/30 max-h-[100px]"
            style={{ minHeight: "40px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 bg-main-500 text-white rounded-full flex items-center justify-center hover:bg-main-600 transition-colors disabled:opacity-40 disabled:hover:bg-main-500"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
