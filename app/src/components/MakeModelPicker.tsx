"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const canUseDOM = typeof window !== "undefined";

export type PickerModel = {
  id: string;
  name: string;
  categoryId?: string | null;
};
export type PickerMake = {
  id: string;
  name: string;
  models?: PickerModel[];
};

type Props = {
  makes: PickerMake[];
  makeId: string;
  modelId: string;
  valueLabel?: string;
  onSelect: (make: PickerMake, model: PickerModel) => void;
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

export default function MakeModelPicker({
  makes,
  makeId,
  modelId,
  valueLabel,
  onSelect,
  placeholder,
  title,
  disabled,
  id,
  className,
}: Props) {
  const { t } = useTranslation();
  const placeholderText = placeholder ?? t("Select");
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      setQuery("");
    }, 200);
  };

  const openSheet = () => {
    if (disabled) return;
    setOpen(true);
    // 현재 선택된 제조사를 자동으로 펼침 (모델은 makes에 포함되어 있음)
    if (makeId) setExpanded(makeId);
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

  const toggleMake = (mid: string) => {
    setExpanded((prev) => (prev === mid ? null : mid));
  };

  const isSearching = query.trim().length > 0;
  const filteredMakes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return makes;
    return makes.reduce<PickerMake[]>((acc, m) => {
      const makeMatches = m.name.toLowerCase().includes(q);
      const models = m.models ?? [];
      // 제조사명이 매칭되면 모든 모델 노출, 아니면 모델명이 매칭되는 것만 노출
      const matchedModels = makeMatches
        ? models
        : models.filter((model) => model.name.toLowerCase().includes(q));
      if (makeMatches || matchedModels.length > 0) {
        acc.push({ ...m, models: matchedModels });
      }
      return acc;
    }, []);
  }, [makes, query]);

  const triggerClass =
    "w-full flex items-center justify-between gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={className ? className : triggerClass}
      >
        {valueLabel ? (
          <span className="truncate text-gray-900">{valueLabel}</span>
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

                <div className="px-4 pb-2">
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("Search make or model")}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-main-500 focus:border-transparent"
                  />
                </div>

                <ul className="flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),16px)]">
                  {filteredMakes.length === 0 ? (
                    <li className="px-4 py-8 text-sm text-gray-400 text-center">
                      {t("No makes found")}
                    </li>
                  ) : (
                    filteredMakes.map((make) => {
                      const isExpanded = isSearching || expanded === make.id;
                      const models = make.models ?? [];
                      return (
                        <li
                          key={make.id}
                          className="border-b border-gray-50"
                        >
                          {/* 제조사 (1레벨) */}
                          <button
                            type="button"
                            onClick={() => toggleMake(make.id)}
                            className={`w-full flex items-center gap-2 px-5 py-3.5 text-sm text-left ${
                              make.id === makeId
                                ? "text-main-700 font-medium"
                                : "text-gray-800"
                            }`}
                          >
                            <svg
                              className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
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
                            <span className="truncate flex-1">{make.name}</span>
                          </button>

                          {/* 모델 (2레벨) */}
                          {isExpanded && (
                            <ul className="bg-gray-50">
                              {models.length > 0 ? (
                                models.map((model) => {
                                  const selected = model.id === modelId;
                                  return (
                                    <li key={model.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onSelect(make, model);
                                          close();
                                        }}
                                        className={`w-full flex items-center gap-2 pl-12 pr-5 py-3 text-sm text-left active:bg-gray-100 ${
                                          selected
                                            ? "text-main-700 font-medium"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        <span className="truncate flex-1">
                                          {model.name}
                                        </span>
                                        {selected && (
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
                              ) : (
                                <li className="pl-12 pr-5 py-3 text-sm text-gray-400">
                                  {t("No models")}
                                </li>
                              )}
                            </ul>
                          )}
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
