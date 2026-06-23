"use client";

import { useTranslation } from "react-i18next";

import {
  LANGUAGE_OPTIONS,
  normalizeLanguage,
  writeLanguageCookie,
  type LanguageType,
} from "./config";
import { setI18nLanguage } from "./index";

/**
 * 현재 언어와 변경 함수를 제공하는 훅.
 * 변경 시 쿠키에 저장하고 i18next 언어를 동기 전환한다.
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language = normalizeLanguage(i18n.language);

  const changeLanguage = (next: LanguageType) => {
    writeLanguageCookie(next);
    setI18nLanguage(next);
  };

  return { language, changeLanguage, options: LANGUAGE_OPTIONS };
}
