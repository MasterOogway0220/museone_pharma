"use server";

import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { listCustomers } from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";

const { heldCarts } = schema;

const holdSchema = z.object({ label: z.string().trim().min(1).max(80), cart: z.string().max(60_000) });

export async function holdCart(slug: string, label: string, cart: string) {
  const { tenant, user } = await requireTenant(slug, { write: true });
  const d = holdSchema.parse({ label, cart });
  JSON.parse(d.cart); // must be valid JSON
  await db.insert(heldCarts).values({ id: randomUUID(), tenantId: tenant.id, userId: user.id, ...d });
}

export async function listHeld(slug: string) {
  const { tenant } = await requireTenant(slug);
  return db
    .select({ id: heldCarts.id, label: heldCarts.label, createdAt: heldCarts.createdAt })
    .from(heldCarts)
    .where(eq(heldCarts.tenantId, tenant.id))
    .orderBy(desc(heldCarts.createdAt))
    .limit(50);
}

// Resuming removes it from the held list, so two tills can't finish the same bill.
export async function takeHeld(slug: string, id: string) {
  const { tenant } = await requireTenant(slug, { write: true });
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ cart: heldCarts.cart })
      .from(heldCarts)
      .where(and(eq(heldCarts.tenantId, tenant.id), eq(heldCarts.id, id)))
      .for("update");
    if (!row) return null;
    await tx.delete(heldCarts).where(and(eq(heldCarts.tenantId, tenant.id), eq(heldCarts.id, id)));
    return row.cart;
  });
}

export async function searchCustomers(slug: string, q: string) {
  const { tenant } = await requireTenant(slug);
  if (q.trim().length < 2) return [];
  const rows = await listCustomers(tenant.id, q.slice(0, 60));
  return rows.slice(0, 8).map((c) => ({ id: c.id, name: c.name, phone: c.phone }));
}
