import { accessLevel, todayInIndia, type AccessLevel } from "./subscription";

export function tenantAccess(
  user: { tenantId?: string | null; role: string; disabled?: boolean },
  tenant: { id: string; suspended: boolean; paidUntil: string },
  today = todayInIndia(),
): AccessLevel | "forbidden" {
  if (!user.tenantId || user.tenantId !== tenant.id || user.disabled) return "forbidden";
  return accessLevel(tenant, today);
}
