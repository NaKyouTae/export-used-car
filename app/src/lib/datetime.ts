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

export function formatTime(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(getUserLocale(), {
    hour: "numeric",
    minute: "2-digit",
    timeZone: getUserTimeZone(),
    ...options,
  }).format(toDate(value));
}

export function formatDate(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(getUserLocale(), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: getUserTimeZone(),
    ...options,
  }).format(toDate(value));
}

export function formatDateTime(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions
): string {
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

const RELATIVE_UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
  { unit: "second", ms: 1000 },
];

export function formatRelativeTime(value: string | number | Date): string {
  const date = toDate(value);
  const diffMs = date.getTime() - Date.now();
  const absDiff = Math.abs(diffMs);

  if (absDiff < 60 * 1000) {
    return new Intl.RelativeTimeFormat(getUserLocale(), {
      numeric: "auto",
    }).format(0, "second");
  }

  const rtf = new Intl.RelativeTimeFormat(getUserLocale(), { numeric: "auto" });
  for (const { unit, ms } of RELATIVE_UNITS) {
    if (absDiff >= ms) {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(0, "second");
}

// Calendar-day comparison in the user's timezone (not UTC, not local-runtime).
function toZonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getDateKey(value: string | number | Date): string {
  return toZonedDateParts(toDate(value), getUserTimeZone());
}

export function formatDateSeparator(value: string | number | Date): string {
  const tz = getUserTimeZone();
  const target = toZonedDateParts(toDate(value), tz);
  const now = new Date();
  const today = toZonedDateParts(now, tz);
  const yesterday = toZonedDateParts(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
    tz
  );

  const locale = getUserLocale();
  if (target === today) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      0,
      "day"
    );
  }
  if (target === yesterday) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      -1,
      "day"
    );
  }
  return formatDate(value, { year: "numeric", month: "long", day: "numeric" });
}

// Chat-list timestamp: time-of-day if today, "yesterday", weekday if within a week, else date.
export function formatChatListTime(value: string | number | Date): string {
  const tz = getUserTimeZone();
  const date = toDate(value);
  const target = toZonedDateParts(date, tz);
  const now = new Date();
  const today = toZonedDateParts(now, tz);
  const yesterday = toZonedDateParts(
    new Date(now.getTime() - 24 * 60 * 60 * 1000),
    tz
  );

  if (target === today) return formatTime(date);
  if (target === yesterday) {
    return new Intl.RelativeTimeFormat(getUserLocale(), {
      numeric: "auto",
    }).format(-1, "day");
  }

  const diffDays = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays < 7) {
    return new Intl.DateTimeFormat(getUserLocale(), {
      weekday: "short",
      timeZone: tz,
    }).format(date);
  }
  return formatDate(date, { month: "short", day: "numeric" });
}
