"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const canUseDOM = typeof window !== "undefined";

export type BottomSheetOption = {
  value: string;
  label: string;
  icon?: ReactNode;
  hint?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: BottomSheetOption[];
  placeholder?: string;
  title?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
};

export default function BottomSheetSelect({
  value,
  onChange,
  options,
  placeholder,
  title,
  id,
  required,
  disabled,
  searchable,
  className,
}: Props) {
  const { t } = useTranslation();
  const placeholderText = placeholder ?? t("Select");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setQuery("");
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
    if (searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const triggerClass =
    "w-full flex items-center justify-between gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className ? className : triggerClass}
      >
        {selected ? (
          <span className="flex items-center gap-2 min-w-0">
            {selected.icon && (
              <span className="text-lg leading-none shrink-0" aria-hidden="true">
                {selected.icon}
              </span>
            )}
            <span className="truncate">{selected.label}</span>
          </span>
        ) : (
          <span className="text-gray-400 truncate">{placeholderText}</span>
        )}
        <svg
          className="w-4 h-4 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={value}
          onChange={() => {}}
          className="sr-only"
          style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        />
      )}

      {canUseDOM &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title || placeholderText}
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
                style={
                  searchable
                    ? { height: "50vh" }
                    : { maxHeight: "50vh" }
                }
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 pt-1 pb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {title || placeholderText}
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

                {searchable && (
                  <div className="px-4 pb-2">
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("Search")}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
                    />
                  </div>
                )}

                <ul
                  role="listbox"
                  className="flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),16px)]"
                >
                  {filtered.length === 0 ? (
                    <li className="px-4 py-8 text-sm text-gray-400 text-center">
                      {t("No results")}
                    </li>
                  ) : (
                    filtered.map((o) => {
                      const isSelected = o.value === value;
                      return (
                        <li key={o.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              onChange(o.value);
                              close();
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm text-left active:bg-gray-100 ${
                              isSelected
                                ? "bg-main-50 text-main-700 font-medium"
                                : "text-gray-800"
                            }`}
                          >
                            {o.icon && (
                              <span
                                className="text-lg leading-none shrink-0"
                                aria-hidden="true"
                              >
                                {o.icon}
                              </span>
                            )}
                            <span className="truncate flex-1">{o.label}</span>
                            {o.hint && (
                              <span className="text-xs text-gray-400">
                                {o.hint}
                              </span>
                            )}
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
                    })
                  )}
                </ul>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
