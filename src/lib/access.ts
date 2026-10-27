import { accessLevel, todayInIndia, type AccessLevel } from "./subscription";

export function tenantAccess(
  user: { tenantId?: string | null; role: string },
  tenant: { id: string; suspended: boolean; paidUntil: string },
  today = todayInIndia(),
): AccessLevel | "forbidden" {
  if (!user.tenantId || user.tenantId !== tenant.id) return "forbidden";
  return accessLevel(tenant, today);
}
