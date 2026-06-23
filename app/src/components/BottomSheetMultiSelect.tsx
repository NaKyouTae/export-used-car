"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const canUseDOM = typeof window !== "undefined";

export type MultiSelectOption = {
  value: string;
  label: string;
};

export type MultiSelectGroup = {
  title?: string;
  options: MultiSelectOption[];
};

type Props = {
  values: string[];
  onChange: (values: string[]) => void;
  groups: MultiSelectGroup[];
  placeholder?: string;
  title?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
};

export default function BottomSheetMultiSelect({
  values,
  onChange,
  groups,
  placeholder,
  title,
  id,
  disabled,
  className,
}: Props) {
  const { t } = useTranslation();
  const placeholderText = placeholder ?? t("Select");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const allOptions = useMemo(
    () => groups.flatMap((g) => g.options),
    [groups]
  );
  const selectedOptions = useMemo(
    () => allOptions.filter((o) => values.includes(o.value)),
    [allOptions, values]
  );

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  };

  const toggle = (value: string) => {
    onChange(
      values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value]
    );
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

  const triggerClass =
    "w-full flex items-center justify-between gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-2">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className ? className : triggerClass}
      >
        {selectedOptions.length > 0 ? (
          <span className="truncate text-gray-900">
            {t("{{count}} selected", { count: selectedOptions.length })}
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

      {/* Selected chips */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((o) => (
            <span
              key={o.value}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-main-50 text-main-700 border border-main-200"
            >
              {o.label}
              <button
                type="button"
                onClick={() => toggle(o.value)}
                aria-label={t("Remove {{label}}", { label: o.label })}
                className="text-main-500 hover:text-main-700"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))}
        </div>
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
                style={{ height: "70vh" }}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 pt-1 pb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {title || placeholderText}
                    {selectedOptions.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-main-600">
                        {selectedOptions.length}
                      </span>
                    )}
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

                <div className="flex-1 overflow-y-auto">
                  {allOptions.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-gray-400 text-center">
                      {t("No options available")}
                    </p>
                  ) : (
                    groups.map((group, gi) => (
                      <div key={group.title ?? gi} className="pb-2">
                        {group.title && (
                          <h4 className="px-5 pt-3 pb-1 text-xs font-medium text-gray-500">
                            {group.title}
                          </h4>
                        )}
                        <ul>
                          {group.options.map((o) => {
                            const checked = values.includes(o.value);
                            return (
                              <li key={o.value}>
                                <button
                                  type="button"
                                  onClick={() => toggle(o.value)}
                                  className="w-full flex items-center gap-3 px-5 py-3 text-sm text-left active:bg-gray-100"
                                >
                                  <span
                                    className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 ${
                                      checked
                                        ? "bg-main-500 border-main-500 text-white"
                                        : "bg-white border-gray-300"
                                    }`}
                                    aria-hidden="true"
                                  >
                                    {checked && (
                                      <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={3}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    )}
                                  </span>
                                  <span
                                    className={`flex-1 truncate ${
                                      checked
                                        ? "text-gray-900 font-medium"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {o.label}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-100 px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)] flex gap-2">
                  {selectedOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onChange([])}
                      className="px-4 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
                    >
                      {t("Clear all")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={close}
                    className="flex-1 h-11 rounded-xl bg-main-500 text-white text-sm font-semibold"
                  >
                    {t("Done")}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
