export type MonthKey = `${number}-${string}`;

export function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

export function monthKey(date: Date): MonthKey {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

export function parseMonthKey(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;

  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;

  return new Date(Date.UTC(year, month - 1, 1));
}

export function monthLabel(date: Date, locale = "en-IN") {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
