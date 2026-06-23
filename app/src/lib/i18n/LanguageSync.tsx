"use client";

import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { LANGUAGE_I18N_CODE, writeLanguageCookie, type LanguageType } from "./config";
import { i18n, setI18nLanguage } from "./index";

/**
 * 로그인한 사용자의 계정 기본 언어를 앱 진입 시 적용한다.
 * 서버에 저장된 user.language를 단일 진실 공급원으로 삼아 i18n/쿠키를 동기화한다.
 * (비로그인 사용자는 쿠키/기본값으로 처리 — layout에서 SSR 시 반영)
 */
export default function LanguageSync() {
  const { user, isAuthenticated } = useAuth();
  const userLanguage = user?.language;

  useEffect(() => {
    if (!isAuthenticated || !userLanguage) return;
    if (userLanguage !== "EN" && userLanguage !== "KO") return;

    const code = LANGUAGE_I18N_CODE[userLanguage as LanguageType];
    if (i18n.language !== code) {
      setI18nLanguage(userLanguage as LanguageType);
    }
    writeLanguageCookie(userLanguage as LanguageType);
  }, [isAuthenticated, userLanguage]);

  return null;
}
