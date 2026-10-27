// Dates are "YYYY-MM-DD" strings (see subscription.ts).

export const NEAR_EXPIRY_DAYS = 90;

export type StockStatus = "out" | "low" | "ok";
export type ExpiryStatus = "expired" | "near" | "ok";

export function stockStatus(current: number, min: number): StockStatus {
  if (current <= 0) return "out";
  if (current <= min) return "low";
  return "ok";
}

export function daysToExpire(expiry: string, today: string): number {
  const ms = Date.parse(`${expiry}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

// A medicine is expired on its expiry day (matches PharmaSpot isExpired).
export function expiryStatus(expiry: string | null, today: string): ExpiryStatus {
  if (!expiry) return "ok";
  const days = daysToExpire(expiry, today);
  if (days === 0) return "expired";
  if (days <= NEAR_EXPIRY_DAYS) return "near";
  return "ok";
}
