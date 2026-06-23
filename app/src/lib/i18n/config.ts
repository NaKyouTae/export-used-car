// Translation system mirrors taghere-ts-world (i18next + react-i18next).
// Source-of-truth language is English: the translation KEY is the English text,
// `en` is an identity map, `ko` maps English -> Korean.
// Adding a new language = add one file under ./locales and register it here.
//
// The chosen language is persisted in a COOKIE (not localStorage) so the server
// can read it during SSR and render the same language the client will hydrate
// with — this avoids hydration mismatches with streamed/suspended subtrees.

export type LanguageType = "EN" | "KO";

export const DEFAULT_LANGUAGE: LanguageType = "EN";

export const LANGUAGE_OPTIONS: ReadonlyArray<{ label: string; value: LanguageType }> = [
  { label: "English", value: "EN" },
  { label: "한국어", value: "KO" },
] as const;

/** 언어 선호도를 저장하는 쿠키 이름. */
export const LANGUAGE_COOKIE = "ajucar-language";

// i18next에서 사용하는 실제 언어 코드 매핑
export const LANGUAGE_I18N_CODE: Record<LanguageType, string> = {
  EN: "en",
  KO: "ko",
};

/** 임의의 문자열(쿠키/i18n 코드/대소문자)을 LanguageType으로 정규화. */
export const normalizeLanguage = (
  value: string | undefined | null
): LanguageType => {
  switch ((value ?? "").toLowerCase()) {
    case "ko":
      return "KO";
    case "en":
      return "EN";
    default:
      return DEFAULT_LANGUAGE;
  }
};

/** 클라이언트에서 쿠키에 저장된 언어를 읽는다 (없으면 기본값). */
export const readLanguageCookie = (): LanguageType => {
  if (typeof document === "undefined") return DEFAULT_LANGUAGE;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LANGUAGE_COOKIE}=`));
  return normalizeLanguage(match?.split("=")[1]);
};

/** 클라이언트에서 언어를 쿠키에 저장한다 (1년). */
export const writeLanguageCookie = (language: LanguageType) => {
  if (typeof document === "undefined") return;
  document.cookie = `${LANGUAGE_COOKIE}=${language}; path=/; max-age=31536000; samesite=lax`;
};
