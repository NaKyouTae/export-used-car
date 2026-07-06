"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CarImageUploader from "@/components/CarImageUploader";
import BottomSheetMultiSelect from "@/components/BottomSheetMultiSelect";
import MakeModelPicker from "@/components/MakeModelPicker";
import SegmentedControl from "@/components/SegmentedControl";
import DamageMarksField from "@/components/DamageMarksField";
import { type DamageMark } from "@/components/DamageDiagram";
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";

export interface UploadedImage {
  id?: string;
  url: string;
  file?: File;
  isNew?: boolean;
}

export interface Make {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
  nameKo?: string;
}

export interface OptionItem {
  id: string;
  name: string;
  nameKo?: string;
}

export interface CarFormValues {
  title: string;
  categoryId: string;
  makeId: string;
  modelId: string;
  year: number;
  registrationDate: string;
  mileage: number | string;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  displacement: string;
  seats: string;
  color: string;
  description: string;
  status: string;
}

export interface CarFormSubmitPayload {
  form: CarFormValues;
  images: UploadedImage[];
  damageMarks: DamageMark[];
  selectedTagIds: string[];
  selectedOptionItemIds: string[];
}

interface CarFormWizardProps {
  makes: Make[];
  tags: Tag[];
  options: OptionItem[];
  initialForm?: Partial<CarFormValues>;
  initialModelName?: string;
  initialImages?: UploadedImage[];
  initialDamageMarks?: DamageMark[];
  initialTagIds?: string[];
  initialOptionItemIds?: string[];
  submitLabel: string;
  submitting: boolean;
  error?: string;
  onSubmit: (payload: CarFormSubmitPayload) => void;
}

const DEFAULT_FORM: CarFormValues = {
  title: "",
  categoryId: "",
  makeId: "",
  modelId: "",
  year: new Date().getFullYear(),
  registrationDate: "",
  mileage: 0,
  fuelType: "GASOLINE",
  transmission: "AUTOMATIC",
  drivetrain: "FWD",
  displacement: "",
  seats: "",
  color: "",
  description: "",
  status: "ACTIVE",
};

export default function CarFormWizard({
  makes,
  tags,
  options,
  initialForm,
  initialModelName = "",
  initialImages = [],
  initialDamageMarks = [],
  initialTagIds = [],
  initialOptionItemIds = [],
  submitLabel,
  submitting,
  error,
  onSubmit,
}: CarFormWizardProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CarFormValues>({
    ...DEFAULT_FORM,
    ...initialForm,
  });
  const [selectedModelName, setSelectedModelName] = useState(initialModelName);
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [damageMarks, setDamageMarks] =
    useState<DamageMark[]>(initialDamageMarks);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [selectedOptionItemIds, setSelectedOptionItemIds] =
    useState<string[]>(initialOptionItemIds);

  const updateForm = (key: keyof CarFormValues, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── styles (기존 폼과 동일) ──
  const inputClass =
    "w-full px-4 h-14 bg-gray-100 rounded-2xl text-[16px] font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 border border-transparent focus:outline-none focus:bg-white focus:border-main-500 focus:ring-4 focus:ring-main-500/10 transition-all";
  const textareaClass =
    "w-full px-4 py-4 bg-gray-100 rounded-2xl text-[16px] font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 border border-transparent focus:outline-none focus:bg-white focus:border-main-500 focus:ring-4 focus:ring-main-500/10 transition-all resize-none";
  const triggerClass =
    "w-full flex items-center justify-between gap-2 px-4 h-14 bg-gray-100 rounded-2xl text-[16px] font-medium text-gray-900 text-left border border-transparent focus:outline-none focus:bg-white focus:border-main-500 transition-colors disabled:opacity-50";
  const labelClass = "block text-[13px] font-medium text-gray-500 mb-1.5 ml-1";
  const sectionTitleClass = "text-[15px] font-bold text-gray-900";

  // ── 스텝 정의 + 유효성 ──
  const steps = useMemo(
    () => [
      {
        title: t("Vehicle"),
        valid: !!form.makeId && !!form.modelId && !!form.registrationDate,
      },
      {
        title: t("Specs"),
        valid: Number(form.mileage) > 0 && !!form.fuelType && !!form.transmission,
      },
      { title: t("Photos & Damage"), valid: true },
      { title: t("Details"), valid: !!form.title },
    ],
    [form, t],
  );
  const lastStep = steps.length - 1;
  const canSubmit = steps.every((s) => s.valid);

  const goNext = () => setStep((s) => Math.min(s + 1, lastStep));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    if (!canSubmit || submitting) return;
    onSubmit({
      form,
      images,
      damageMarks,
      selectedTagIds,
      selectedOptionItemIds,
    });
  };

  const replaceCount = damageMarks.filter((m) => m.type === "REPLACE").length;
  const repairCount = damageMarks.filter((m) => m.type === "REPAIR").length;

  return (
    <div className="flex flex-1 flex-col">
      {/* 진행 표시 — PageHeader(높이 48px + safe-area) 바로 아래에 고정 */}
      <div
        className="sticky z-30 border-b border-gray-50 bg-white px-4 pt-3 pb-3"
        style={{ top: "calc(env(safe-area-inset-top) + 48px)" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-bold text-main-500">
            {step + 1} / {steps.length}
          </span>
          <span className="text-[13px] font-semibold text-gray-700">
            {steps[step].title}
          </span>
        </div>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              aria-label={s.title}
              onClick={() => setStep(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-main-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pt-3 pb-28">
        {/* ── STEP 1: 차량 ── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                {t("Make · Model")} <span className="text-main-500">*</span>
              </label>
              <MakeModelPicker
                makes={makes}
                makeId={form.makeId}
                modelId={form.modelId}
                valueLabel={selectedModelName}
                placeholder={t("Select a make, then a model")}
                title={t("Select Make · Model")}
                className={triggerClass}
                onSelect={(make, model) => {
                  updateForm("makeId", make.id);
                  updateForm("modelId", model.id);
                  updateForm("categoryId", model.categoryId || "");
                  setSelectedModelName(`${make.name} ${model.name}`);
                  // 제목 자동 생성 (비어 있을 때만)
                  setForm((prev) =>
                    prev.title.trim()
                      ? prev
                      : {
                          ...prev,
                          title: `${prev.year} ${make.name} ${model.name}`,
                        },
                  );
                }}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("Year")} <span className="text-main-500">*</span>
              </label>
              <input
                type="month"
                value={form.registrationDate}
                onChange={(e) => {
                  const v = e.target.value; // "YYYY-MM"
                  updateForm("registrationDate", v);
                  if (v) updateForm("year", Number(v.slice(0, 4)));
                }}
                min="1990-01"
                max="2030-12"
                required
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: 스펙 ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>
                {t("Mileage")} <span className="text-main-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.mileage || ""}
                  onChange={(e) => updateForm("mileage", e.target.value)}
                  placeholder="185,000"
                  required
                  className={`${inputClass} pr-12`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-gray-400">
                  km
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                {t("Fuel")} <span className="text-main-500">*</span>
              </label>
              <SegmentedControl
                value={form.fuelType}
                onChange={(v) => updateForm("fuelType", v)}
                options={Object.entries(FUEL_TYPE_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t("Transmission")} <span className="text-main-500">*</span>
              </label>
              <SegmentedControl
                value={form.transmission}
                onChange={(v) => updateForm("transmission", v)}
                options={Object.entries(TRANSMISSION_LABELS).map(([k, v]) => ({
                  value: k,
                  label: v,
                }))}
              />
            </div>

            <div>
              <label className={labelClass}>{t("Drivetrain")}</label>
              <SegmentedControl
                value={form.drivetrain}
                onChange={(v) => updateForm("drivetrain", v)}
                options={[
                  { value: "FWD", label: "FWD" },
                  { value: "RWD", label: "RWD" },
                  { value: "AWD", label: "AWD" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t("Displacement")}</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.displacement}
                    onChange={(e) => updateForm("displacement", e.target.value)}
                    placeholder="1,999"
                    className={`${inputClass} pr-10`}
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-gray-400">
                    cc
                  </span>
                </div>
              </div>
              <div>
                <label className={labelClass}>{t("Seats")}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.seats}
                  onChange={(e) => updateForm("seats", e.target.value)}
                  placeholder="5"
                  min={1}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t("Color")}</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => updateForm("color", e.target.value)}
                placeholder={t("White")}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: 사진 · 사고 ── */}
        {step === 2 && (
          <div className="space-y-8">
            <section className="space-y-2">
              <h2 className={sectionTitleClass}>
                {t("Photos")} {images.length > 0 && `(${images.length})`}
              </h2>
              <CarImageUploader images={images} onChange={setImages} />
            </section>

            <section className="space-y-2">
              <h2 className={sectionTitleClass}>사고·수리 부위</h2>
              <DamageMarksField
                marks={damageMarks}
                onChange={setDamageMarks}
                className={triggerClass}
              />
            </section>
          </div>
        )}

        {/* ── STEP 4: 상세 ── */}
        {step === 3 && (
          <div className="space-y-8">
            <section className="space-y-2">
              <label className={labelClass}>
                {t("Title")} <span className="text-main-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm("title", e.target.value)}
                placeholder={t("e.g. 2020 Hyundai Sonata 2.0T")}
                required
                className={inputClass}
              />
            </section>

            {tags.length > 0 && (
              <section className="space-y-3">
                <h2 className={sectionTitleClass}>{t("Tags")}</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setSelectedTagIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id],
                          )
                        }
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                          selected
                            ? "border-main-500 bg-main-500 text-white shadow-sm shadow-main-500/20"
                            : "border-transparent bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tag.nameKo || tag.name}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-3">
              <h2 className={sectionTitleClass}>{t("Options")}</h2>
              <BottomSheetMultiSelect
                title={t("Select Options")}
                placeholder={t("Select Options")}
                values={selectedOptionItemIds}
                onChange={setSelectedOptionItemIds}
                className={triggerClass}
                groups={[
                  {
                    options: options.map((item) => ({
                      value: item.id,
                      label: item.nameKo || item.name,
                    })),
                  },
                ]}
              />
            </section>

            <section className="space-y-3">
              <h2 className={sectionTitleClass}>{t("Description")}</h2>
              <textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                placeholder={t(
                  "Describe the vehicle condition, options, history, etc...",
                )}
                rows={5}
                className={textareaClass}
              />
            </section>

            {/* 요약 카드 */}
            <section className="space-y-2 rounded-2xl bg-gray-50 p-4">
              <h2 className={sectionTitleClass}>{t("Summary")}</h2>
              <dl className="space-y-1.5 text-[14px]">
                <SummaryRow
                  label={t("Make · Model")}
                  value={selectedModelName || "-"}
                />
                <SummaryRow
                  label={t("Year")}
                  value={form.registrationDate || "-"}
                />
                <SummaryRow
                  label={t("Mileage")}
                  value={
                    Number(form.mileage)
                      ? `${Number(form.mileage).toLocaleString()} km`
                      : "-"
                  }
                />
                <SummaryRow
                  label={t("Photos")}
                  value={`${images.length}`}
                />
                <SummaryRow
                  label="사고·수리"
                  value={
                    damageMarks.length
                      ? `교환 ${replaceCount} · 판금·용접 ${repairCount}`
                      : "-"
                  }
                />
              </dl>
            </section>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {/* 하단 내비게이션 */}
      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 border-t border-gray-100 bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <div className="flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="h-14 flex-1 rounded-2xl bg-gray-100 text-[16px] font-bold text-gray-700 transition-all active:scale-[0.99]"
            >
              {t("Previous")}
            </button>
          )}
          {step < lastStep ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!steps[step].valid}
              className="h-14 flex-[2] rounded-2xl bg-main-500 text-[16px] font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("Next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="h-14 flex-[2] rounded-2xl bg-main-500 text-[16px] font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? t("Saving...") : submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="truncate text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}
