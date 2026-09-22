import type { Decimal } from "@prisma/client/runtime/library";

type NumberLike = number | string | Decimal;

export function toNumber(value: NumberLike): number {
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export function formatMoney(value: NumberLike, currency = "so'm"): string {
  const num = toNumber(value);
  const formatted = new Intl.NumberFormat("uz-UZ", {
    maximumFractionDigits: 0,
  }).format(Math.round(num));
  return `${formatted} ${currency}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function formatDateTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${hh}:${min}`;
}

export function currentMonthKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function monthLabel(monthKey: string): string {
  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
  ];
  const parts = monthKey.split("-");
  const y = parts[0] ?? "";
  const m = parts[1] ?? "01";
  const idx = Math.max(0, Math.min(11, Number(m) - 1));
  return `${months[idx]} ${y}`;
}

export function generateJoinCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
