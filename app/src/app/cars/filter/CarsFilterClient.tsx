"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";

const canUseDOM = typeof window !== "undefined";

interface Category {
  id: string;
  name: string;
}

interface Make {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
}

type SheetKey = "makeModel" | "category" | "fuel" | "year" | "mileage";

interface DraftState {
  categoryId: string;
  makeId: string;
  modelId: string;
  makeModelLabel: string;
  fuelType: string;
  yearMin: string;
  yearMax: string;
  mileageMax: string;
}

const FUEL_OPTIONS = [
  { value: "GASOLINE", labelKey: "Gasoline" },
  { value: "DIESEL", labelKey: "Diesel" },
  { value: "HYBRID", labelKey: "Hybrid" },
  { value: "ELECTRIC", labelKey: "Electric" },
  { value: "LPG", labelKey: "LPG" },
] as const;

const MILEAGE_OPTIONS = [10000, 30000, 50000, 70000, 90000, 110000, 130000, 150000, 200000];

const CURRENT_YEAR = 2026;
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1999 }, (_, i) => CURRENT_YEAR - i);

export default function CarsFilterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [makes, setMakes] = useState<Make[]>([]);
  const [modelsByMake, setModelsByMake] = useState<Record<string, CarModel[]>>({});
  const [loadingMake, setLoadingMake] = useState<string | null>(null);
  const [expandedMake, setExpandedMake] = useState<string | null>(null);

  const [activeSheet, setActiveSheet] = useState<SheetKey | null>(null);
  const [closing, setClosing] = useState(false);

  const [draft, setDraft] = useState<DraftState>({
    categoryId: searchParams.get("categoryId") || "",
    makeId: searchParams.get("makeId") || "",
    modelId: searchParams.get("modelId") || "",
    makeModelLabel: "",
    fuelType: searchParams.get("fuelType") || "",
    yearMin: searchParams.get("yearMin") || "",
    yearMax: searchParams.get("yearMax") || "",
    mileageMax: searchParams.get("mileageMax") || "",
  });

  // Hide the bottom nav while this full-screen filter page is shown.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("app:bottom-sheet", { detail: { open: true } })
    );
    return () => {
      window.dispatchEvent(
        new CustomEvent("app:bottom-sheet", { detail: { open: false } })
      );
    };
  }, []);

  // Load categories & makes once.
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
    fetch("/api/makes")
      .then((res) => res.json())
      .then((data) => setMakes(Array.isArray(data) ? data : []))
      .catch(() => setMakes([]));
  }, []);

  const loadModels = async (makeId: string): Promise<CarModel[]> => {
    if (modelsByMake[makeId]) return modelsByMake[makeId];
    setLoadingMake(makeId);
    try {
      const res = await fetch(`/api/makes/${makeId}/models`);
      const data = await res.json();
      const list: CarModel[] = Array.isArray(data) ? data : data.data || [];
      setModelsByMake((p) => ({ ...p, [makeId]: list }));
      return list;
    } catch {
      setModelsByMake((p) => ({ ...p, [makeId]: [] }));
      return [];
    } finally {
      setLoadingMake(null);
    }
  };

  // Resolve the make·model label when arriving with makeId/modelId in the URL.
  useEffect(() => {
    if (!draft.makeId || !draft.modelId || draft.makeModelLabel) return;
    const make = makes.find((m) => m.id === draft.makeId);
    if (!make) return;
    let cancelled = false;
    (async () => {
      let models = modelsByMake[make.id];
      if (!models) {
        try {
          const res = await fetch(`/api/makes/${make.id}/models`);
          const data = await res.json();
          models = Array.isArray(data) ? data : data.data || [];
        } catch {
          models = [];
        }
        if (cancelled) return;
        setModelsByMake((p) => ({ ...p, [make.id]: models }));
      }
      const model = models.find((mo) => mo.id === draft.modelId);
      if (model && !cancelled) {
        setDraft((prev) => ({
          ...prev,
          makeModelLabel: `${make.name} ${model.name}`,
        }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makes, draft.makeId, draft.modelId]);

  const closeSheet = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setActiveSheet(null);
      setClosing(false);
    }, 200);
  };

  const openSheet = (key: SheetKey) => {
    setActiveSheet(key);
    if (key === "makeModel" && draft.makeId) {
      setExpandedMake(draft.makeId);
      loadModels(draft.makeId);
    }
  };

  useEffect(() => {
    if (!activeSheet) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSheet]);

  const fmtMileage = (km: number) =>
    i18n.language === "ko"
      ? `${km / 10000}만 km ${t("or less")}`
      : `${t("Under")} ${km.toLocaleString()} km`;

  const categoryName = useMemo(
    () => categories.find((c) => c.id === draft.categoryId)?.name || "",
    [categories, draft.categoryId]
  );

  const fuelLabel = useMemo(() => {
    const opt = FUEL_OPTIONS.find((o) => o.value === draft.fuelType);
    return opt ? t(opt.labelKey) : "";
  }, [draft.fuelType, t]);

  const yearSummary = useMemo(() => {
    if (!draft.yearMin && !draft.yearMax) return "";
    return `${draft.yearMin || ""} ~ ${draft.yearMax || ""}`.trim();
  }, [draft.yearMin, draft.yearMax]);

  const mileageSummary = draft.mileageMax ? fmtMileage(Number(draft.mileageMax)) : "";

  const rows: { key: SheetKey; label: string; value: string }[] = [
    { key: "makeModel", label: t("Make · Model"), value: draft.makeModelLabel },
    { key: "category", label: t("Vehicle Type"), value: categoryName },
    { key: "fuel", label: t("Fuel Type"), value: fuelLabel },
    { key: "year", label: t("Year"), value: yearSummary },
    { key: "mileage", label: t("Mileage"), value: mileageSummary },
  ];

  const activeCount = [
    draft.makeId,
    draft.categoryId,
    draft.fuelType,
    draft.yearMin || draft.yearMax,
    draft.mileageMax,
  ].filter(Boolean).length;

  const handleReset = () =>
    setDraft({
      categoryId: "",
      makeId: "",
      modelId: "",
      makeModelLabel: "",
      fuelType: "",
      yearMin: "",
      yearMax: "",
      mileageMax: "",
    });

  const handleApply = () => {
    const params = new URLSearchParams();
    // Preserve search & sort from the list page.
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);
    if (draft.categoryId) params.set("categoryId", draft.categoryId);
    if (draft.makeId) params.set("makeId", draft.makeId);
    if (draft.modelId) params.set("modelId", draft.modelId);
    if (draft.fuelType) params.set("fuelType", draft.fuelType);
    if (draft.yearMin) params.set("yearMin", draft.yearMin);
    if (draft.yearMax) params.set("yearMax", draft.yearMax);
    if (draft.mileageMax) params.set("mileageMax", draft.mileageMax);
    const qs = params.toString();
    router.replace(qs ? `/cars?${qs}` : "/cars");
  };

  const sheetTitle: Record<SheetKey, string> = {
    makeModel: t("Select Make · Model"),
    category: t("Select Vehicle Type"),
    fuel: t("Select Fuel"),
    year: t("Select Year"),
    mileage: t("Select Mileage"),
  };

  return (
    <div className="bg-white min-h-dvh flex flex-col">
      <PageHeader
        title={t("Filters")}
        backHref="/cars"
        rightAction={
          activeCount > 0 ? (
            <button
              onClick={handleReset}
              className="text-sm font-medium text-gray-500 px-1"
            >
              {t("Reset")}
            </button>
          ) : undefined
        }
      />

      {/* Filter rows */}
      <div className="flex-1">
        {rows.map((row) => (
          <button
            key={row.key}
            onClick={() => openSheet(row.key)}
            className="w-full flex items-center justify-between gap-3 px-4 py-4 border-b border-gray-100 text-left active:bg-gray-50"
          >
            <span className="text-[15px] font-medium text-gray-900 shrink-0">
              {row.label}
            </span>
            <span className="flex items-center gap-1 min-w-0">
              <span
                className={`truncate text-sm ${
                  row.value ? "text-main-600 font-medium" : "text-gray-400"
                }`}
              >
                {row.value || t("All")}
              </span>
              <svg
                className="w-5 h-5 text-gray-300 shrink-0"
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
            </span>
          </button>
        ))}
      </div>

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <button
          onClick={handleApply}
          className="w-full py-3.5 text-sm font-semibold text-white bg-main-500 rounded-xl active:bg-main-600"
        >
          {t("See results")}
        </button>
      </div>

      {/* Bottom sheet */}
      {canUseDOM &&
        activeSheet &&
        createPortal(
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100]">
            <div
              onClick={closeSheet}
              className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
                closing ? "opacity-0" : "opacity-100"
              }`}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
              <div
                className={`pointer-events-auto w-full max-w-[390px] bg-white rounded-t-2xl shadow-xl flex flex-col ${
                  closing ? "animate-slide-down" : "animate-slide-up"
                }`}
                style={{ maxHeight: "75vh", height: activeSheet === "makeModel" ? "70vh" : undefined }}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                <div className="flex items-center justify-between px-4 pt-1 pb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {sheetTitle[activeSheet]}
                  </h3>
                  <button
                    type="button"
                    onClick={closeSheet}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    aria-label={t("Close")}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pb-[max(env(safe-area-inset-bottom),16px)]">
                  {/* Vehicle Type (category) */}
                  {activeSheet === "category" && (
                    <ul>
                      <OptionRow
                        label={t("All")}
                        selected={!draft.categoryId}
                        onClick={() => {
                          setDraft((p) => ({ ...p, categoryId: "" }));
                          closeSheet();
                        }}
                      />
                      {categories.map((c) => (
                        <OptionRow
                          key={c.id}
                          label={c.name}
                          selected={draft.categoryId === c.id}
                          onClick={() => {
                            setDraft((p) => ({ ...p, categoryId: c.id }));
                            closeSheet();
                          }}
                        />
                      ))}
                    </ul>
                  )}

                  {/* Fuel */}
                  {activeSheet === "fuel" && (
                    <ul>
                      <OptionRow
                        label={t("All")}
                        selected={!draft.fuelType}
                        onClick={() => {
                          setDraft((p) => ({ ...p, fuelType: "" }));
                          closeSheet();
                        }}
                      />
                      {FUEL_OPTIONS.map((o) => (
                        <OptionRow
                          key={o.value}
                          label={t(o.labelKey)}
                          selected={draft.fuelType === o.value}
                          onClick={() => {
                            setDraft((p) => ({ ...p, fuelType: o.value }));
                            closeSheet();
                          }}
                        />
                      ))}
                    </ul>
                  )}

                  {/* Mileage */}
                  {activeSheet === "mileage" && (
                    <ul>
                      <OptionRow
                        label={t("All")}
                        selected={!draft.mileageMax}
                        onClick={() => {
                          setDraft((p) => ({ ...p, mileageMax: "" }));
                          closeSheet();
                        }}
                      />
                      {MILEAGE_OPTIONS.map((km) => (
                        <OptionRow
                          key={km}
                          label={fmtMileage(km)}
                          selected={draft.mileageMax === String(km)}
                          onClick={() => {
                            setDraft((p) => ({ ...p, mileageMax: String(km) }));
                            closeSheet();
                          }}
                        />
                      ))}
                    </ul>
                  )}

                  {/* Year range */}
                  {activeSheet === "year" && (
                    <div className="flex h-full min-h-[40vh]">
                      <YearColumn
                        title={t("Min")}
                        years={YEAR_OPTIONS.filter(
                          (y) => !draft.yearMax || y <= Number(draft.yearMax)
                        )}
                        selected={draft.yearMin}
                        onSelect={(y) =>
                          setDraft((p) => ({ ...p, yearMin: y }))
                        }
                        onClear={() => setDraft((p) => ({ ...p, yearMin: "" }))}
                        clearLabel={t("All")}
                        clearSelected={!draft.yearMin}
                      />
                      <div className="w-px bg-gray-100" />
                      <YearColumn
                        title={t("Max")}
                        years={YEAR_OPTIONS.filter(
                          (y) => !draft.yearMin || y >= Number(draft.yearMin)
                        )}
                        selected={draft.yearMax}
                        onSelect={(y) =>
                          setDraft((p) => ({ ...p, yearMax: y }))
                        }
                        onClear={() => setDraft((p) => ({ ...p, yearMax: "" }))}
                        clearLabel={t("All")}
                        clearSelected={!draft.yearMax}
                      />
                    </div>
                  )}

                  {/* Make · Model (two-level) */}
                  {activeSheet === "makeModel" && (
                    <ul>
                      <OptionRow
                        label={t("All")}
                        selected={!draft.makeId}
                        onClick={() => {
                          setDraft((p) => ({
                            ...p,
                            makeId: "",
                            modelId: "",
                            makeModelLabel: "",
                          }));
                          closeSheet();
                        }}
                      />
                      {makes.map((make) => {
                        const isExpanded = expandedMake === make.id;
                        const models = modelsByMake[make.id];
                        return (
                          <li key={make.id} className="border-b border-gray-50">
                            <button
                              type="button"
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedMake(null);
                                } else {
                                  setExpandedMake(make.id);
                                  loadModels(make.id);
                                }
                              }}
                              className={`w-full flex items-center gap-2 px-5 py-3.5 text-sm text-left ${
                                make.id === draft.makeId
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="truncate flex-1">{make.name}</span>
                            </button>
                            {isExpanded && (
                              <ul className="bg-gray-50">
                                {loadingMake === make.id && !models ? (
                                  <li className="pl-12 pr-5 py-3 text-sm text-gray-400">
                                    {t("Loading models...")}
                                  </li>
                                ) : models && models.length > 0 ? (
                                  models.map((model) => {
                                    const selected = model.id === draft.modelId;
                                    return (
                                      <li key={model.id}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDraft((p) => ({
                                              ...p,
                                              makeId: make.id,
                                              modelId: model.id,
                                              makeModelLabel: `${make.name} ${model.name}`,
                                            }));
                                            closeSheet();
                                          }}
                                          className={`w-full flex items-center gap-2 pl-12 pr-5 py-3 text-sm text-left active:bg-gray-100 ${
                                            selected
                                              ? "text-main-700 font-medium"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          <span className="truncate flex-1">{model.name}</span>
                                          {selected && <CheckIcon />}
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
                      })}
                    </ul>
                  )}
                </div>

                {activeSheet === "year" && (
                  <div className="px-4 py-3 border-t border-gray-100 pb-[max(env(safe-area-inset-bottom),12px)]">
                    <button
                      onClick={closeSheet}
                      className="w-full py-3 text-sm font-semibold text-white bg-main-500 rounded-xl active:bg-main-600"
                    >
                      {t("Apply")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm text-left active:bg-gray-100 ${
          selected ? "bg-main-50 text-main-700 font-medium" : "text-gray-800"
        }`}
      >
        <span className="truncate flex-1">{label}</span>
        {selected && <CheckIcon />}
      </button>
    </li>
  );
}

function YearColumn({
  title,
  years,
  selected,
  onSelect,
  onClear,
  clearLabel,
  clearSelected,
}: {
  title: string;
  years: number[];
  selected: string;
  onSelect: (y: string) => void;
  onClear: () => void;
  clearLabel: string;
  clearSelected: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="px-4 py-2 text-xs font-medium text-gray-400 sticky top-0 bg-white">
        {title}
      </div>
      <ul className="flex-1 overflow-y-auto">
        <li>
          <button
            type="button"
            onClick={onClear}
            className={`w-full px-4 py-2.5 text-sm text-left active:bg-gray-100 ${
              clearSelected ? "text-main-700 font-medium" : "text-gray-700"
            }`}
          >
            {clearLabel}
          </button>
        </li>
        {years.map((y) => {
          const isSel = selected === String(y);
          return (
            <li key={y}>
              <button
                type="button"
                onClick={() => onSelect(String(y))}
                className={`w-full px-4 py-2.5 text-sm text-left active:bg-gray-100 ${
                  isSel ? "bg-main-50 text-main-700 font-medium" : "text-gray-700"
                }`}
              >
                {y}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-main-500 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
