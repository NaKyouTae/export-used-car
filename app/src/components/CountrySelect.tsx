"use client";

import { useMemo } from "react";
import BottomSheetSelect from "./BottomSheetSelect";
import { COUNTRIES, getCountryFlag } from "@/lib/constants";

type Props = {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  id?: string;
  required?: boolean;
};

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select your country",
  id,
  required,
}: Props) {
  const options = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        value: c.code,
        label: c.name,
        icon: getCountryFlag(c.code),
        hint: c.code,
      })),
    []
  );

  return (
    <BottomSheetSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      title="Select country"
      required={required}
      searchable
    />
  );
}
