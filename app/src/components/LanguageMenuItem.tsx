"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { useLanguage } from "@/lib/i18n/useLanguage";

const canUseDOM = typeof window !== "undefined";

/**
 * 마이페이지 메뉴 한 줄로 표시되는 기본 언어 선택기.
 * 좌측에 "Language" 라벨, 우측에 현재 설정 언어를 보여주고,
 * 행을 누르면 바텀시트로 지원 언어를 선택할 수 있다.
 * persistToServer=true 면 선택 시 계정 기본 언어(/api/profile)도 갱신한다.
 */
export default function LanguageMenuItem({
  persistToServer = false,
}: {
  persistToServer?: boolean;
}) {
  const { t } = useTranslation();
  const { language, changeLanguage, options } = useLanguage();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const current = options.find((o) => o.value === language);

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

  const handleSelect = (value: "EN" | "KO") => {
    changeLanguage(value);
    close();
    if (persistToServer) {
      fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: value }),
      }).catch(() => {
        // 서버 저장 실패해도 로컬 변경은 유지 (다음 동기화 때 재시도)
      });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-3 h-8 w-full active:bg-gray-50"
      >
        <span className="text-gray-500">
          <GlobeIcon />
        </span>
        <span className="flex-1 text-sm font-medium text-gray-900 text-left">
          {t("Language")}
        </span>
        <span className="text-sm text-gray-400">{current?.label}</span>
        <svg
          className="w-4 h-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {canUseDOM &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("Select Language")}
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
                className={`pointer-events-auto w-full max-w-[390px] bg-white rounded-t-2xl shadow-xl flex flex-col ${
                  closing ? "animate-slide-down" : "animate-slide-up"
                }`}
                style={{ maxHeight: "50vh" }}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 pt-1 pb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {t("Select Language")}
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

                <ul
                  role="listbox"
                  className="flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),16px)]"
                >
                  {options.map((o) => {
                    const isSelected = o.value === language;
                    return (
                      <li key={o.value}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(o.value)}
                          className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm text-left active:bg-gray-100 ${
                            isSelected
                              ? "bg-main-50 text-main-700 font-medium"
                              : "text-gray-800"
                          }`}
                        >
                          <span className="truncate flex-1">{o.label}</span>
                          {isSelected && (
                            <svg
                              className="w-5 h-5 text-main-500 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
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
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
