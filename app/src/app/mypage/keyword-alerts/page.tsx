"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { useTranslation } from "react-i18next";

interface KeywordAlert {
  id: string;
  keyword: string;
  createdAt: string;
}

export default function KeywordAlertsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [alerts, setAlerts] = useState<KeywordAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/keyword-alerts", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAlerts();
  }, [authLoading, isAuthenticated, router, fetchAlerts]);

  const handleAdd = async () => {
    const keyword = input.trim();
    if (!keyword) return;
    if (
      alerts.some((a) => a.keyword.toLowerCase() === keyword.toLowerCase())
    ) {
      setError(t("This keyword is already registered."));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/keyword-alerts", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      if (!res.ok) throw new Error("Failed");
      setInput("");
      await fetchAlerts();
    } catch {
      setError(t("Failed to save. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/keyword-alerts/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white">
        <PageHeader title={t("Keyword Alerts")} />
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-main-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white pb-[88px]">
      <PageHeader title={t("Keyword Alerts")} />

      {/* Intro */}
      <div className="px-4 pt-4">
        <p className="text-sm text-gray-500 leading-relaxed">
          {t(
            "Register keywords you're interested in. We'll notify you when a newly listed car's title contains one of them.",
          )}
        </p>
      </div>

      {/* Input */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder={t("e.g. Sorento, Carnival, Genesis")}
            maxLength={50}
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-main-500 focus:ring-1 focus:ring-main-500"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !input.trim()}
            className="flex-shrink-0 px-4 py-3 bg-main-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 active:bg-main-700"
          >
            {t("Add")}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>

      {/* List */}
      <div className="px-4 pt-6">
        {alerts.length === 0 ? (
          <div className="pt-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-main-50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-main-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              {t("No keyword alerts yet")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("Add a keyword above to get started.")}
            </p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-200 divide-y divide-gray-200">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 px-4 py-3"
              >
                <span className="flex-1 text-sm font-medium text-gray-900 break-all">
                  {a.keyword}
                </span>
                <button
                  onClick={() => handleDelete(a.id)}
                  aria-label={t("Delete")}
                  className="flex-shrink-0 p-1.5 text-gray-300 active:text-red-500"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
