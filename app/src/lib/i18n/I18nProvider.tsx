"use client";

import { useEffect, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { DEFAULT_LANGUAGE, normalizeLanguage, type LanguageType } from "./config";
import { i18n, setI18nLanguage } from "./index";
import LanguageSync from "./LanguageSync";

/**
 * 앱 전체를 감싸는 i18n 프로바이더.
 *
 * 서버(layout)가 쿠키에서 읽은 initialLanguage를 받아, 서버 SSR과 클라이언트의
 * "첫 렌더"가 동일한 언어를 쓰도록 첫 렌더 시점에 동기로 언어를 설정한다.
 * → 스트리밍/Suspense로 늦게 hydrate되는 서브트리에서도 하이드레이션 불일치가 없다.
 */
export default function I18nProvider({
  children,
  initialLanguage = DEFAULT_LANGUAGE,
}: {
  children: ReactNode;
  initialLanguage?: LanguageType;
}) {
  // lazy initializer는 첫 렌더 시 서버/클라이언트 양쪽에서 한 번 실행된다.
  // 자식이 렌더되기 전에 전역 i18n 언어를 initialLanguage로 맞춰준다.
  const [, setLang] = useState(() => {
    setI18nLanguage(initialLanguage);
    return initialLanguage;
  });

  useEffect(() => {
    const onChange = (lng: string) => setLang(normalizeLanguage(lng));
    i18n.on("languageChanged", onChange);
    return () => {
      i18n.off("languageChanged", onChange);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageSync />
      {children}
    </I18nextProvider>
  );
}
