"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/db";
import { ConflictError } from "@/lib/catalog";
import { resetStaffPassword, updateStaff } from "@/lib/staff";
import { tenantAction, type FormState } from "@/lib/tenant-action";
import { createStaffUser } from "@/lib/users";
import { createStaffSchema, resetPasswordSchema, settingsSchema, updateStaffSchema } from "@/lib/validation";

export async function createStaffAction(slug: string, _: FormState, form: FormData) {
  const res = await tenantAction(slug, "permUsers", createStaffSchema, form, async ({ tenant }, d) => {
    const { name, username, password, role, ...perms } = d;
    try {
      await createStaffUser({ tenantId: tenant.id, slug: tenant.slug, name, username, password, role, perms });
    } catch (e) {
      if (e instanceof Error && e.message.includes("already exists")) throw new ConflictError("This username is taken.");
      throw e;
    }
  });
  if (res.ok) revalidatePath(`/t/${slug}/users`);
  return res;
}

export async function updateStaffAction(slug: string, userId: string, _: FormState, form: FormData) {
  const res = await tenantAction(slug, "permUsers", updateStaffSchema, form, ({ tenant, user }, d) => {
    if (userId === user.id) throw new ConflictError("You can't change your own access.");
    return updateStaff(tenant.id, userId, d);
  });
  if (res.ok) revalidatePath(`/t/${slug}/users`);
  return res;
}

export async function resetPasswordAction(slug: string, userId: string, _: FormState, form: FormData) {
  return tenantAction(slug, "permUsers", resetPasswordSchema, form, ({ tenant }, d) =>
    resetStaffPassword(tenant.id, userId, d.password),
  );
}

export async function saveSettingsAction(slug: string, _: FormState, form: FormData) {
  const res = await tenantAction(slug, "permSettings", settingsSchema, form, async ({ tenant }, d) => {
    const { gstin, ...rest } = d;
    const values = { ...rest, defaultDiscountPct: rest.defaultDiscountPct.toFixed(2) };
    await db.transaction(async (tx) => {
      await tx
        .insert(schema.tenantSettings)
        .values({ tenantId: tenant.id, ...values })
        .onDuplicateKeyUpdate({ set: values });
      await tx.update(schema.tenants).set({ gstin }).where(eq(schema.tenants.id, tenant.id));
    });
  });
  if (res.ok) revalidatePath(`/t/${slug}`, "layout");
  return res;
}
