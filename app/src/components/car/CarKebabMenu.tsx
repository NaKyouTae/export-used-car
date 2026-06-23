"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const canUseDOM = typeof window !== "undefined";

// 판매 흐름상 "다음 상태"로 넘기는 버튼
const NEXT_STATUS: Record<string, { value: string; labelKey: string }> = {
  ACTIVE: { value: "DEALING", labelKey: "Change to Dealing" },
  DEALING: { value: "RESERVED", labelKey: "Change to Reserved" },
  RESERVED: { value: "SOLD", labelKey: "Change to Sold" },
};

interface CarKebabMenuProps {
  carId: string;
  status: string;
  onChanged?: () => void;
}

export default function CarKebabMenu({
  carId,
  status,
  onChanged,
}: CarKebabMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);

  // 카드 링크 등으로의 이벤트 전파 방지
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  };

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patchStatus = async (newStatus: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      close();
      onChanged?.();
    } catch {
      alert(t("Failed to change status"));
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    stop(e);
    close();
    router.push(`/seller/cars/${carId}/edit`);
  };

  const handleBump = (e: React.MouseEvent) => {
    stop(e);
    close();
    router.push(`/seller/cars/${carId}/bump`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    stop(e);
    if (busy) return;
    if (!window.confirm(t("Are you sure you want to delete this vehicle?"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/cars/${carId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error();
      close();
      onChanged?.();
    } catch {
      alert(t("Failed to delete vehicle"));
    } finally {
      setBusy(false);
    }
  };

  const next = NEXT_STATUS[status];
  const isHidden = status === "HIDDEN";

  const btnBase =
    "w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center disabled:opacity-50 transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen(true);
        }}
        aria-label={t("More")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="p-1 -m-1 text-gray-400 hover:text-gray-600 shrink-0"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {canUseDOM &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("Manage vehicle")}
            className="fixed inset-0 z-[100]"
            onClick={stop}
          >
            <div
              onClick={(e) => {
                stop(e);
                close();
              }}
              className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
                closing ? "opacity-0" : "opacity-100"
              }`}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
              <div
                className={`pointer-events-auto w-full max-w-[390px] bg-white rounded-t-2xl shadow-xl flex flex-col ${
                  closing ? "animate-slide-down" : "animate-slide-up"
                }`}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* 닫기 (우측 상단) */}
                <div className="flex justify-end px-3 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      close();
                    }}
                    aria-label={t("Close")}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="px-4 pt-1 pb-[max(env(safe-area-inset-bottom),16px)] space-y-2">
                  {/* 다음 상태로 변경 */}
                  {next && (
                    <button
                      type="button"
                      onClick={(e) => {
                        stop(e);
                        patchStatus(next.value);
                      }}
                      disabled={busy}
                      className={`${btnBase} bg-main-500 text-white hover:bg-main-600`}
                    >
                      {t(next.labelKey)}
                    </button>
                  )}

                  {/* 끌어올리기 */}
                  <button
                    type="button"
                    onClick={handleBump}
                    className={`${btnBase} border border-main-500 text-main-600 hover:bg-main-50`}
                  >
                    {t("Bump up")}
                  </button>

                  {/* 차량 수정 */}
                  <button
                    type="button"
                    onClick={handleEdit}
                    className={`${btnBase} border border-gray-200 text-gray-800 hover:bg-gray-50`}
                  >
                    {t("Edit vehicle")}
                  </button>

                  {/* 숨기기 / 숨김 해제 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      patchStatus(isHidden ? "ACTIVE" : "HIDDEN");
                    }}
                    disabled={busy}
                    className={`${btnBase} border border-gray-200 text-gray-800 hover:bg-gray-50`}
                  >
                    {isHidden ? t("Unhide") : t("Hide")}
                  </button>

                  {/* 삭제 */}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={busy}
                    className={`${btnBase} border border-red-200 text-red-600 hover:bg-red-50`}
                  >
                    {t("Delete")}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
