export type ExpirationStatus = "fresh" | "expiring" | "expired";

export function toDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function getExpirationStatus(value: unknown): ExpirationStatus {
  const expirationDate = toDate(value);
  if (!expirationDate) return "fresh";

  const today = startOfDay();
  const soon = addDays(today, 7);

  if (expirationDate < today) return "expired";
  if (expirationDate <= soon) return "expiring";
  return "fresh";
}

export function formatDate(value: unknown) {
  const date = toDate(value);
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeExpiration(value: unknown) {
  const date = toDate(value);
  if (!date) return "No date set";

  const today = startOfDay();
  const target = startOfDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`;
  if (diffDays === 0) return "Expires today";
  if (diffDays === 1) return "Expires tomorrow";
  return `Expires in ${diffDays} days`;
}

export function formatQuantity(quantity: unknown, unit?: string | null) {
  const raw = quantity == null ? "0" : String(quantity);
  const cleaned = raw.includes(".") ? raw.replace(/\.?0+$/, "") : raw;
  return [cleaned, unit].filter(Boolean).join(" ");
}

export function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== "string") return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
