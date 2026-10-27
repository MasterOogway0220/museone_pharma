"use server";

import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { requireSuperAdmin } from "@/lib/dal";
import { recordTenantPayment } from "@/lib/payments";
import { createStaffUser } from "@/lib/users";
import { createTenantSchema, fieldErrors, recordPaymentSchema } from "@/lib/validation";

export type FormState = { errors?: Record<string, string>; ok?: boolean };

export async function createTenant(_: FormState, form: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const parsed = createTenantSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  const [taken] = await db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.slug, d.slug));
  if (taken) return { errors: { slug: "This link is already used by another pharmacy." } };

  const id = randomUUID();
  await db.insert(schema.tenants).values({
    id,
    slug: d.slug,
    name: d.name,
    ownerName: d.ownerName,
    phone: d.phone,
    city: d.city,
    gstin: d.gstin,
    plan: d.plan,
    paidUntil: d.paidUntil,
  });
  try {
    await createStaffUser({
      tenantId: id,
      slug: d.slug,
      name: d.ownerName,
      username: d.ownerUsername,
      password: d.ownerPassword,
      role: "owner",
    });
  } catch (e) {
    // Don't leave a pharmacy without an owner login.
    await db.delete(schema.tenants).where(eq(schema.tenants.id, id));
    throw e;
  }
  revalidatePath("/admin");
  redirect(`/admin/tenants/${id}`);
}

export async function recordPayment(_: FormState, form: FormData): Promise<FormState> {
  const admin = await requireSuperAdmin();
  const parsed = recordPaymentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await recordTenantPayment(parsed.data, admin.id);
  revalidatePath(`/admin/tenants/${parsed.data.tenantId}`);
  return { ok: true };
}

export async function setSuspended(tenantId: string, suspended: boolean) {
  await requireSuperAdmin();
  await db.update(schema.tenants).set({ suspended }).where(eq(schema.tenants.id, tenantId));
  if (suspended) {
    // Sign out everyone in that pharmacy right away.
    await db.execute(
      sql`DELETE s FROM ${schema.session} s JOIN ${schema.user} u ON u.id = s.user_id WHERE u.tenant_id = ${tenantId}`,
    );
  }
  revalidatePath(`/admin/tenants/${tenantId}`);
}
