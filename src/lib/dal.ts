import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { forbidden, notFound, redirect } from "next/navigation";
import { db, schema } from "@/db";
import { auth } from "@/lib/auth";
import { tenantAccess } from "@/lib/access";

// Cached per request: layout and page both ask.
export const getSessionUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

export type Perm = "permProducts" | "permCategories" | "permTransactions" | "permUsers" | "permSettings";

export async function requireSuperAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "superadmin") forbidden();
  return user;
}

export const getTenantBySlug = cache(async (slug: string) => {
  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.slug, slug));
  return tenant ?? null;
});

// Every tenant page and action goes through this. The tenant comes from the URL,
// but access is decided by the session user's tenantId.
export async function requireTenant(slug: string, opts: { write?: boolean; perm?: Perm } = {}) {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  const user = await getSessionUser();
  if (!user) redirect(`/t/${slug}/login`);
  const access = tenantAccess(user, tenant);
  if (access === "forbidden") forbidden();
  if (access === "blocked") redirect(`/t/${slug}/blocked`);
  if (opts.perm && !user[opts.perm]) forbidden();
  if (opts.write && access === "readonly") throw new ReadOnlyError();
  return { user, tenant, access };
}

// Same checks as requireTenant, for route handlers: returns a JSON error Response instead of redirecting.
export async function apiTenant(slug: string, opts: { write?: boolean; perm?: Perm } = {}) {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return Response.json({ error: "Not found" }, { status: 404 });
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Signed out. Sign in again." }, { status: 401 });
  const access = tenantAccess(user, tenant);
  if (access === "forbidden" || (opts.perm && !user[opts.perm])) {
    return Response.json({ error: "No access" }, { status: 403 });
  }
  if (access === "blocked" || (opts.write && access === "readonly")) {
    return Response.json({ error: new ReadOnlyError().message }, { status: 402 });
  }
  return { user, tenant, access };
}

export class ReadOnlyError extends Error {
  constructor() {
    super("Subscription ended. Billing and changes are paused until it is renewed.");
  }
}
