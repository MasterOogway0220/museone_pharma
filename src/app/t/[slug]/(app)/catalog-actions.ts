"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as catalog from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";
import { tenantAction, type FormState } from "@/lib/tenant-action";
import { categorySchema, customerSchema, productSchema, stockInSchema } from "@/lib/validation";

const idSchema = z.object({ id: z.string().length(36) });

export async function saveProductAction(slug: string, id: string | null, _: FormState, form: FormData) {
  const res = await tenantAction(slug, "permProducts", productSchema, form, ({ tenant }, data) =>
    catalog.saveProduct(tenant.id, id, data),
  );
  if (res.ok) {
    revalidatePath(`/t/${slug}/products`);
    if (!id) redirect(`/t/${slug}/products/${res.id}`);
  }
  return res;
}

export async function removeProductAction(slug: string, id: string) {
  const { tenant } = await requireTenant(slug, { write: true, perm: "permProducts" });
  await catalog.removeProduct(tenant.id, id);
  revalidatePath(`/t/${slug}/products`);
  redirect(`/t/${slug}/products`);
}

export async function addStockAction(slug: string, _: FormState, form: FormData) {
  const res = await tenantAction(slug, "permProducts", stockInSchema, form, ({ tenant, user }, data) =>
    catalog.addStock(tenant.id, user.id, data),
  );
  if (res.ok) revalidatePath(`/t/${slug}/products`, "layout");
  return res;
}

const writeOffSchema = z.object({
  productId: z.string().length(36),
  batch: z.string().max(40),
  expiry: z.string().transform((v) => v || null),
  qty: z.coerce.number().int().min(1),
});

// Removes an expired or damaged batch from stock.
export async function writeOffAction(slug: string, _: FormState, form: FormData) {
  const res = await tenantAction(slug, "permProducts", writeOffSchema, form, ({ tenant, user }, d) =>
    catalog.adjustStock(tenant.id, user.id, { ...d, qty: -d.qty, reason: "expired", note: "Written off" }),
  );
  if (res.ok) revalidatePath(`/t/${slug}/products`, "layout");
  return res;
}

export async function saveCategoryAction(slug: string, id: string | null, _: FormState, form: FormData) {
  const res = await tenantAction(slug, "permCategories", categorySchema, form, ({ tenant }, data) =>
    catalog.saveCategory(tenant.id, id, data),
  );
  if (res.ok) revalidatePath(`/t/${slug}/categories`);
  return res;
}

export async function deleteCategoryAction(slug: string, form: FormData) {
  await tenantAction(slug, "permCategories", idSchema, form, ({ tenant }, { id }) => catalog.deleteCategory(tenant.id, id));
  revalidatePath(`/t/${slug}/categories`);
}

export async function saveCustomerAction(slug: string, id: string | null, _: FormState, form: FormData) {
  const res = await tenantAction(slug, undefined, customerSchema, form, ({ tenant }, data) =>
    catalog.saveCustomer(tenant.id, id, data),
  );
  if (res.ok) revalidatePath(`/t/${slug}/customers`);
  if (res.ok && id) redirect(`/t/${slug}/customers`);
  return res;
}

export async function deleteCustomerAction(slug: string, id: string) {
  const { tenant } = await requireTenant(slug, { write: true });
  await catalog.deleteCustomer(tenant.id, id);
  revalidatePath(`/t/${slug}/customers`);
  redirect(`/t/${slug}/customers`);
}
