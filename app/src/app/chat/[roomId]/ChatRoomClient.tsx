"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/constants";
import { notifyChatUpdate } from "@/lib/chat-events";
import { compressImage } from "@/lib/image-compress";
import {
  formatTime,
  formatDateSeparator,
  getDateKey,
} from "@/lib/datetime";
import PageHeader from "@/components/PageHeader";
import ImageViewer from "@/components/ImageViewer";
import ReportSheet from "@/components/ReportSheet";

// 이미지 메시지는 content가 이 prefix로 시작한다 (백엔드와 동일 규약).
const IMAGE_MESSAGE_PREFIX = "[img]";
const isImageMessage = (content: string) =>
  content.startsWith(IMAGE_MESSAGE_PREFIX);
const getImageUrl = (content: string) =>
  content.slice(IMAGE_MESSAGE_PREFIX.length);

// 사용자 언어(EN/KO 등) → Google Translate ISO 코드. 서버와 동일 규약.
const GOOGLE_LANG_CODE: Record<string, string> = { EN: "en", KO: "ko" };
const toGoogleLangCode = (lang?: string | null): string => {
  if (!lang) return "en";
  return GOOGLE_LANG_CODE[lang.toUpperCase()] ?? lang.toLowerCase();
};

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
  desiredPrice: number | string | null;
}

interface Message {
  id: string;
  senderType: "SELLER" | "BUYER";
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  // 번역 캐시 (이미 번역된 메시지면 서버 조회 시 함께 내려온다)
  sourceLang?: string | null;
  translatedContent?: string | null;
  translatedLang?: string | null;
}

interface QuickPhrase {
  id: string;
  category: string;
  content: string;
}

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<ChatRoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quickPhrases, setQuickPhrases] = useState<QuickPhrase[]>([]);
  const [savingPrice, setSavingPrice] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  // 메시지별 번역 결과 캐시 (번역 버튼을 눌렀을 때만 채워짐)
  const [translations, setTranslations] = useState<
    Record<string, { text: string; sourceLang: string; sameLanguage: boolean }>
  >({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  // 번역된 메시지에서 원문을 보고 있는 중인 메시지 id 집합
  const [showOriginal, setShowOriginal] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Load quick phrases
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/quick-phrases", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setQuickPhrases(data);
      })
      .catch(() => {
        // ignore
      });
  }, [isAuthenticated]);

  const handleQuickPhrase = (text: string) => {
    setInput((prev) => {
      const next = prev.trim().length === 0 ? text : `${prev} ${text}`;
      return next;
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

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

  const handlePickImage = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 재선택 허용
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", await compressImage(file));
      const res = await fetch(`/api/chat/rooms/${roomId}/images`, {
        method: "POST",
        credentials: "include",
        body: formData,
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
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDesiredPrice = async (price: number) => {
    if (savingPrice) return false;
    setSavingPrice(true);
    try {
      const res = await fetch(
        `/api/chat/rooms/${roomId}/desired-price`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ desiredPrice: price }),
        }
      );
      if (res.ok) {
        setRoom((prev) => (prev ? { ...prev, desiredPrice: price } : prev));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setSavingPrice(false);
    }
  };

  const handleTranslate = async (msg: Message) => {
    if (translatingId) return;

    // 이미 DB에 "내 언어로" 번역된 캐시가 메시지에 실려 있으면
    // 서버/구글을 전혀 호출하지 않고 그 값을 그대로 사용한다. (비용 0)
    const myLang = toGoogleLangCode(user?.language);
    if (msg.translatedContent && msg.translatedLang === myLang) {
      setTranslations((prev) => ({
        ...prev,
        [msg.id]: {
          text: msg.translatedContent ?? "",
          sourceLang: msg.sourceLang ?? "",
          sameLanguage: (msg.sourceLang ?? "") === myLang,
        },
      }));
      return;
    }

    const messageId = msg.id;
    setTranslatingId(messageId);
    try {
      const res = await fetch(
        `/api/chat/rooms/${roomId}/messages/${messageId}/translate`,
        { method: "POST", credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setTranslations((prev) => ({
          ...prev,
          [messageId]: {
            text: data.translatedContent ?? "",
            sourceLang: data.sourceLang ?? "",
            sameLanguage: Boolean(data.sameLanguage),
          },
        }));
      }
    } catch {
      // ignore
    } finally {
      setTranslatingId(null);
    }
  };

  const toggleOriginal = (messageId: string) => {
    setShowOriginal((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex-1 bg-white">
        <PageHeader title={t("Chat")} backHref="/chat" />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!room) return null;

  // 방 안에서의 입장은 역할이 아니라 본인 id 기준으로 판단
  const amSeller = user?.id === room.seller.id;
  const otherName = amSeller
    ? room.buyer.name || room.buyer.email
    : room.seller.companyName;
  const otherUserId = amSeller ? room.buyer.id : room.seller.id;

  const desiredPriceNum =
    room.desiredPrice === null || room.desiredPrice === undefined
      ? null
      : Number(room.desiredPrice);
  // 구매자가 아직 구매 희망 가격을 입력하지 않았으면 강제로 팝업을 띄움
  const needsDesiredPrice = !amSeller && desiredPriceNum === null;

  return (
    <div className="flex flex-col h-dvh bg-white">
      {/* Header */}
      <PageHeader
        title={otherName}
        backHref="/chat"
        rightAction={
          <div className="flex items-center gap-2">
            {room.car && (
              <button
                onClick={() => router.push(`/cars/${room.car!.id}`)}
                className="text-xs text-main-500 font-medium"
              >
                {t("View Car")}
              </button>
            )}
            <button
              onClick={() => setReportOpen(true)}
              className="p-1 text-gray-400"
              aria-label={t("Report this user")}
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
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </button>
          </div>
        }
      />

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="USER"
        targetId={otherUserId}
      />

      {/* Car info bar */}
      {room.car && (
        <div className="bg-white border-b border-gray-100 px-4 py-2.5">
          <p className="text-xs text-gray-700 font-medium truncate">
            {room.car.title}
          </p>
          {desiredPriceNum !== null && (
            <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {t("Desired price")} {formatPrice(desiredPriceNum)}
            </span>
          )}
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

          const isMe = msg.senderId === user?.id;
          const isImg = isImageMessage(msg.content);

          // 번역: 받은(내가 보낸 게 아닌) 텍스트 메시지에만 노출.
          // 기본은 원문 표시, "번역" 버튼을 누르면 translations에 채워진다.
          // (재입장 시엔 msg에 실려온 DB 캐시를 handleTranslate가 그대로 사용 → 구글/서버 미호출)
          const translation = translations[msg.id];
          const isTranslating = translatingId === msg.id;
          const viewingOriginal = showOriginal.has(msg.id);
          const showTranslated =
            !!translation && !translation.sameLanguage && !viewingOriginal;
          const displayText = showTranslated ? translation.text : msg.content;
          const canTranslate = !isMe && !isImg;

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
                {isImg ? (
                  <div className="max-w-[75%]">
                    <button
                      type="button"
                      onClick={() => setViewerUrl(getImageUrl(msg.content))}
                      className="block overflow-hidden rounded-2xl border border-gray-200"
                    >
                      {/* 원본 비율을 유지해야 해서 next/image 대신 img 를 쓴다.
                          업로드 시 압축되므로 크기는 수백 KB 수준. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(msg.content)}
                        alt={t("Photo")}
                        loading="lazy"
                        decoding="async"
                        className="max-h-60 w-auto object-cover"
                      />
                    </button>
                    <p
                      className={`text-[10px] mt-1 ${
                        isMe ? "text-right text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                ) : (
                  <div className="max-w-[75%]">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl ${
                        isMe
                          ? "bg-main-500 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md border border-gray-200"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {displayText}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMe ? "text-white/60" : "text-gray-500"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>

                    {/* 번역 컨트롤 (받은 텍스트 메시지에만) */}
                    {canTranslate && (
                      <div className="mt-1">
                        {translation?.sameLanguage ? (
                          <span className="text-[11px] text-gray-400">
                            {t("Same as your language")}
                          </span>
                        ) : translation ? (
                          <button
                            type="button"
                            onClick={() => toggleOriginal(msg.id)}
                            className="text-[11px] font-medium text-main-600 active:text-main-700"
                          >
                            {viewingOriginal
                              ? t("Show translation")
                              : t("Show original")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTranslate(msg)}
                            disabled={isTranslating}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-main-600 active:text-main-700 disabled:opacity-50"
                          >
                            {isTranslating ? (
                              <span className="w-3 h-3 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                />
                              </svg>
                            )}
                            {t("Translate")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick phrases */}
      {quickPhrases.length > 0 && (
        <QuickPhraseBar
          phrases={quickPhrases}
          onPick={handleQuickPhrase}
        />
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 pt-3 pb-[max(8px,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handlePickImage}
            disabled={uploading}
            aria-label={t("Attach image")}
            className="flex-shrink-0 w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("Type a message...")}
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

      {/* 구매 희망 가격 입력 팝업 (구매자가 입력할 때까지 닫히지 않음) */}
      {needsDesiredPrice && (
        <DesiredPriceModal
          saving={savingPrice}
          onSubmit={handleSaveDesiredPrice}
        />
      )}

      {/* 이미지 상세 보기 (다운로드 가능) */}
      {viewerUrl && (
        <ImageViewer
          images={[viewerUrl]}
          initialIndex={0}
          onClose={() => setViewerUrl(null)}
        />
      )}
    </div>
  );
}

function DesiredPriceModal({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (price: number) => Promise<boolean>;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const parsed = Number(value.replace(/[^0-9]/g, ""));
  const valid = value.trim().length > 0 && parsed > 0;

  const submit = async () => {
    if (!valid) {
      setError(t("Please enter a valid purchase price."));
      return;
    }
    const ok = await onSubmit(parsed);
    if (!ok) setError(t("Failed to save. Please try again."));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-base font-bold text-gray-900">
          {t("Enter your desired purchase price")}
        </h2>
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
          {t(
            "Please enter your desired purchase price before chatting with the seller."
          )}
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-100 px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-main-500/30">
          <span className="text-sm font-semibold text-gray-500">₩</span>
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            value={value}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^0-9]/g, "");
              setValue(digits ? Number(digits).toLocaleString("ko-KR") : "");
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("e.g. 15,000,000")}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
          />
        </div>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={!valid || saving}
          className="mt-4 w-full rounded-xl bg-main-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-main-600 disabled:opacity-40 disabled:hover:bg-main-500"
        >
          {saving ? t("Saving...") : t("Confirm")}
        </button>
      </div>
    </div>
  );
}

function QuickPhraseBar({
  phrases,
  onPick,
}: {
  phrases: QuickPhrase[];
  onPick: (text: string) => void;
}) {
  return (
    <div className="bg-white border-t border-gray-100">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 px-4 py-2 whitespace-nowrap">
          {phrases.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p.content)}
              className="flex-shrink-0 px-3 py-1.5 bg-main-50 text-main-700 text-xs font-medium rounded-full active:bg-main-100"
            >
              {p.content.length > 20
                ? `${p.content.slice(0, 20)}…`
                : p.content}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
