import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { NotFoundError } from "@/lib/catalog";
import type { Perms } from "@/lib/users";

const { user, session } = schema;

export function listStaff(tenantId: string) {
  return db
    .select({
      id: user.id,
      name: user.name,
      username: user.displayUsername,
      role: user.role,
      disabled: user.disabled,
      permProducts: user.permProducts,
      permCategories: user.permCategories,
      permTransactions: user.permTransactions,
      permUsers: user.permUsers,
      permSettings: user.permSettings,
    })
    .from(user)
    .where(eq(user.tenantId, tenantId))
    .orderBy(asc(user.name));
}

// Owner accounts are only changed by the super admin, so a manager with staff rights can't lock the owner out.
async function editable(tenantId: string, userId: string) {
  const [u] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.tenantId, tenantId), eq(user.id, userId), ne(user.role, "owner")));
  if (!u) throw new NotFoundError("Staff member not found, or is the owner.");
}

async function signOutEverywhere(userId: string) {
  await db.delete(session).where(eq(session.userId, userId));
}

export async function updateStaff(tenantId: string, userId: string, data: Perms & { role: "manager" | "cashier"; disabled: boolean }) {
  await editable(tenantId, userId);
  await db.update(user).set(data).where(and(eq(user.tenantId, tenantId), eq(user.id, userId)));
  // New permissions apply on the next request anyway; disabling must also end open sessions.
  if (data.disabled) await signOutEverywhere(userId);
}

export async function resetStaffPassword(tenantId: string, userId: string, password: string) {
  await editable(tenantId, userId);
  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(userId, await ctx.password.hash(password));
  await signOutEverywhere(userId);
}
