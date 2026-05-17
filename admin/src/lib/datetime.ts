const SSR_LOCALE = "en-US";
const SSR_TIMEZONE = "UTC";

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getUserLocale(): string {
  if (!isClient()) return SSR_LOCALE;
  return navigator.language || SSR_LOCALE;
}

export function getUserTimeZone(): string {
  if (!isClient()) return SSR_TIMEZONE;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || SSR_TIMEZONE;
  } catch {
    return SSR_TIMEZONE;
  }
}

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(getUserLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: getUserTimeZone(),
    ...options,
  }).format(toDate(value));
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat(getUserLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: getUserTimeZone(),
    ...options,
  }).format(toDate(value));
}
