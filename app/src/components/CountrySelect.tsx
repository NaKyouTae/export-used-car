"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  placeholder,
  id,
  required,
}: Props) {
  const { t } = useTranslation();
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
      placeholder={placeholder ?? t("Select your country")}
      title={t("Select country")}
      required={required}
      searchable
    />
  );
}
