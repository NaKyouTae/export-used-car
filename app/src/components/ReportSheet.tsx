"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const canUseDOM = typeof window !== "undefined";

export type ReportTargetType = "CAR" | "USER";
type ReportReason = "SPAM" | "FRAUD" | "INAPPROPRIATE" | "PROHIBITED" | "OTHER";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "SPAM", label: "Spam or scam" },
  { value: "FRAUD", label: "Fraudulent or fake listing" },
  { value: "INAPPROPRIATE", label: "Inappropriate or offensive content" },
  { value: "PROHIBITED", label: "Prohibited or illegal item" },
  { value: "OTHER", label: "Other" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
};

export default function ReportSheet({
  open,
  onClose,
  targetType,
  targetId,
}: Props) {
  const { t } = useTranslation();
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
      // 닫힌 뒤 상태 초기화
      setReason(null);
      setDetail("");
      setSubmitting(false);
      setDone(false);
      setError(null);
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

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, detail }),
      });
      if (!res.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError(t("Failed to submit report. Please try again."));
      setSubmitting(false);
    }
  };

  if (!canUseDOM || !open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("Report")}
      className="fixed inset-0 z-[100]"
    >
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          closing ? "opacity-0" : "opacity-100"
        }`}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-[390px] bg-white rounded-t-2xl shadow-xl flex flex-col pb-safe ${
            closing ? "animate-slide-down" : "animate-slide-up"
          }`}
          style={{ maxHeight: "85vh" }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-4 pt-1 pb-3">
            <h3 className="text-base font-semibold text-gray-900">
              {targetType === "CAR"
                ? t("Report this listing")
                : t("Report this user")}
            </h3>
            <button
              type="button"
              onClick={close}
              className="p-1 text-gray-400 hover:text-gray-600"
              aria-label={t("Close")}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {done ? (
            <div className="px-5 pb-8 pt-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {t("Thanks for your report")}
              </p>
              <p className="mt-1 text-[13px] text-gray-500">
                {t("Our team will review it as soon as possible.")}
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-5 w-full rounded-xl bg-main-500 py-3 text-sm font-semibold text-white"
              >
                {t("Done")}
              </button>
            </div>
          ) : (
            <div className="overflow-y-auto px-4 pb-6">
              <p className="mb-3 text-[13px] text-gray-500">
                {t("Please select a reason for reporting.")}
              </p>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${
                      reason === r.value
                        ? "border-main-500 bg-main-50 text-gray-900"
                        : "border-gray-200 text-gray-700"
                    }`}
                  >
                    <span>{t(r.label)}</span>
                    {reason === r.value && (
                      <svg
                        className="h-5 w-5 text-main-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t("Add more details (optional)")}
                className="mt-3 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-main-500"
              />

              {error && (
                <p className="mt-2 text-[13px] text-red-500">{error}</p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={!reason || submitting}
                className="mt-4 w-full rounded-xl bg-main-500 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {submitting ? t("Submitting...") : t("Submit report")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
