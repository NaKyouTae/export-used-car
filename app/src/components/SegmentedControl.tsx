"use client";

interface SegmentOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
}

/**
 * 선택지가 적은 항목(연료·변속기·구동)용 한 줄 버튼 그룹.
 * 드롭다운/바텀시트 없이 탭 한 번으로 선택. 6개 이상이면 자동 줄바꿈.
 */
export default function SegmentedControl({
  value,
  onChange,
  options,
}: SegmentedControlProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            className={`h-11 flex-1 min-w-[calc(33.333%-8px)] rounded-xl px-3 text-[15px] font-semibold transition-all active:scale-95 ${
              selected
                ? "bg-main-500 text-white shadow-sm shadow-main-500/20"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
