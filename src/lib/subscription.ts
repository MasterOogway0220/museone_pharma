// Dates are "YYYY-MM-DD" strings in India time, matching MySQL DATE columns.

export const GRACE_DAYS = 7;

export type AccessLevel = "full" | "readonly" | "blocked";

export function todayInIndia(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(day: string, months: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function accessLevel(
  tenant: { suspended: boolean; paidUntil: string },
  today = todayInIndia(),
): AccessLevel {
  if (tenant.suspended) return "blocked";
  if (today <= tenant.paidUntil) return "full";
  if (today <= addDays(tenant.paidUntil, GRACE_DAYS)) return "readonly";
  return "blocked";
}

export function extendPaidUntil(paidUntil: string, months: number, today = todayInIndia()): string {
  return addMonths(paidUntil >= today ? paidUntil : today, months);
}
