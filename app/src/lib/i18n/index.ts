import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { DEFAULT_LANGUAGE, LANGUAGE_I18N_CODE, type LanguageType } from "./config";
import { en } from "./locales/en";
import { ko } from "./locales/ko";

// 언어 세트가 작으므로(한/영) 정적으로 모두 로드해 동기 초기화한다.
// 새 언어 추가 시: ./locales/<code>.ts 생성 후 아래 resources에 등록.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en,
      ko,
    },
    lng: LANGUAGE_I18N_CODE[DEFAULT_LANGUAGE],
    fallbackLng: LANGUAGE_I18N_CODE[DEFAULT_LANGUAGE],
    defaultNS: "main",
    ns: ["main"],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
} else {
  // 이미 초기화된 싱글톤이라면(주로 dev HMR 재실행 시) 최신 번역을 다시 주입한다.
  // init()은 한 번만 실행되므로, 이게 없으면 locale 파일에 새로 추가한 키가
  // 런타임 store에 반영되지 않아 키 그대로(=미번역) 노출된다.
  i18n.addResourceBundle("en", "main", en.main, true, true);
  i18n.addResourceBundle("ko", "main", ko.main, true, true);
}

/** 언어를 변경한다 (i18next 코드 기준 동기 적용). */
export const setI18nLanguage = (language: LanguageType) => {
  const code = LANGUAGE_I18N_CODE[language];
  if (i18n.language !== code) {
    i18n.changeLanguage(code);
  }
};

export { i18n };
