import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, like, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { fromPaise, toPaise } from "@/lib/money";
import { expiryStatus, stockStatus } from "@/lib/stock";
import { todayInIndia } from "@/lib/subscription";
import type { z } from "zod";
import type { categorySchema, customerSchema, productSchema, stockInSchema } from "@/lib/validation";

// Every function here takes tenantId first and filters on it. Never query tenant tables elsewhere.

const { products, categories, stockMovements, customers } = schema;

export class NotFoundError extends Error {}
export class ConflictError extends Error {}

function isDuplicate(e: unknown) {
  return (e as { cause?: { code?: string } })?.cause?.code === "ER_DUP_ENTRY";
}

// ---------- Stock ----------

export type Batch = { batch: string; expiry: string | null; qty: number };

// shortcut: batch balances are summed per request; fine to ~50k movements per tenant, then add a balances table.
export async function batchBalances(tenantId: string, productIds?: string[]) {
  const rows = await db
    .select({
      productId: stockMovements.productId,
      batch: stockMovements.batch,
      expiry: stockMovements.expiry,
      qty: sql<string>`SUM(${stockMovements.qty})`,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.tenantId, tenantId),
        productIds?.length ? sql`${stockMovements.productId} IN ${productIds}` : undefined,
      ),
    )
    .groupBy(stockMovements.productId, stockMovements.batch, stockMovements.expiry);

  const byProduct = new Map<string, Batch[]>();
  for (const r of rows) {
    const list = byProduct.get(r.productId) ?? [];
    list.push({ batch: r.batch, expiry: r.expiry, qty: Number(r.qty) });
    byProduct.set(r.productId, list);
  }
  // Earliest expiry first: the order a pharmacist should sell in (FEFO).
  for (const list of byProduct.values()) list.sort((a, b) => (a.expiry ?? "9999").localeCompare(b.expiry ?? "9999"));
  return byProduct;
}

export async function addStock(tenantId: string, userId: string, input: z.infer<typeof stockInSchema>) {
  await getProduct(tenantId, input.productId); // ownership check
  await db.insert(stockMovements).values({
    id: randomUUID(),
    tenantId,
    productId: input.productId,
    batch: input.batch.toUpperCase(),
    expiry: input.expiry,
    qty: input.qty,
    reason: "purchase",
    unitCost: input.unitCost.toFixed(2),
    userId,
  });
}

export async function adjustStock(
  tenantId: string,
  userId: string,
  input: { productId: string; batch: string; expiry: string | null; qty: number; reason: "adjust" | "expired"; note?: string },
) {
  await getProduct(tenantId, input.productId);
  await db.insert(stockMovements).values({ id: randomUUID(), tenantId, userId, ...input, batch: input.batch.toUpperCase() });
}

// ---------- Products ----------

export async function listProducts(tenantId: string, q = "") {
  const term = q.trim();
  const rows = await db
    .select({ p: products, categoryName: categories.name })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(products.tenantId, tenantId),
        eq(products.active, true),
        term ? or(like(products.name, `%${term}%`), eq(products.barcode, term)) : undefined,
      ),
    )
    .orderBy(asc(products.name))
    .limit(500);

  const balances = await batchBalances(tenantId, rows.map((r) => r.p.id));
  const today = todayInIndia();
  return rows.map(({ p, categoryName }) => {
    const batches = (balances.get(p.id) ?? []).filter((b) => b.qty > 0);
    const stock = (balances.get(p.id) ?? []).reduce((s, b) => s + b.qty, 0);
    const nextExpiry = batches[0]?.expiry ?? null;
    return {
      ...p,
      categoryName,
      stock,
      batches,
      nextExpiry,
      stockStatus: p.trackStock ? stockStatus(stock, p.minStock) : ("ok" as const),
      expiryStatus: expiryStatus(nextExpiry, today),
    };
  });
}

export async function getProduct(tenantId: string, id: string) {
  const [p] = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.id, id)));
  if (!p) throw new NotFoundError("Product not found.");
  return p;
}

async function assertCategory(tenantId: string, categoryId: string | null) {
  if (!categoryId) return;
  const [c] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.tenantId, tenantId), eq(categories.id, categoryId)));
  if (!c) throw new NotFoundError("Category not found.");
}

function productValues(input: z.infer<typeof productSchema>) {
  return {
    ...input,
    gstRate: input.gstRate,
    mrp: fromPaise(toPaise(input.mrp)),
    price: fromPaise(toPaise(input.price)),
  };
}

export async function saveProduct(tenantId: string, id: string | null, input: z.infer<typeof productSchema>) {
  await assertCategory(tenantId, input.categoryId);
  try {
    if (id) {
      const res = await db
        .update(products)
        .set(productValues(input))
        .where(and(eq(products.tenantId, tenantId), eq(products.id, id)));
      if (res[0].affectedRows === 0) throw new NotFoundError("Product not found.");
      return id;
    }
    const newId = randomUUID();
    await db.insert(products).values({ id: newId, tenantId, ...productValues(input) });
    return newId;
  } catch (e) {
    if (isDuplicate(e)) throw new ConflictError("Another product already uses this barcode.");
    throw e;
  }
}

// Products with stock history are kept for reports; removing just hides them.
export async function removeProduct(tenantId: string, id: string) {
  const res = await db
    .update(products)
    .set({ active: false, barcode: sql`CONCAT(${products.barcode}, '#', ${products.id})` })
    .where(and(eq(products.tenantId, tenantId), eq(products.id, id)));
  if (res[0].affectedRows === 0) throw new NotFoundError("Product not found.");
}

// ---------- Categories ----------

export function listCategories(tenantId: string) {
  return db.select().from(categories).where(eq(categories.tenantId, tenantId)).orderBy(asc(categories.name));
}

export async function saveCategory(tenantId: string, id: string | null, input: z.infer<typeof categorySchema>) {
  try {
    if (id) {
      const res = await db
        .update(categories)
        .set(input)
        .where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)));
      if (res[0].affectedRows === 0) throw new NotFoundError("Category not found.");
      return;
    }
    await db.insert(categories).values({ id: randomUUID(), tenantId, ...input });
  } catch (e) {
    if (isDuplicate(e)) throw new ConflictError("This category already exists.");
    throw e;
  }
}

export async function deleteCategory(tenantId: string, id: string) {
  // Products in it keep working with no category (FK is ON DELETE SET NULL).
  await db.delete(categories).where(and(eq(categories.tenantId, tenantId), eq(categories.id, id)));
}

// ---------- Customers ----------

export function listCustomers(tenantId: string, q = "") {
  const term = q.trim();
  return db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, tenantId),
        term ? or(like(customers.name, `%${term}%`), like(customers.phone, `${term}%`)) : undefined,
      ),
    )
    .orderBy(asc(customers.name))
    .limit(500);
}

export async function saveCustomer(tenantId: string, id: string | null, input: z.infer<typeof customerSchema>) {
  if (id) {
    const res = await db
      .update(customers)
      .set(input)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
    if (res[0].affectedRows === 0) throw new NotFoundError("Customer not found.");
    return id;
  }
  const newId = randomUUID();
  await db.insert(customers).values({ id: newId, tenantId, ...input });
  return newId;
}

export async function deleteCustomer(tenantId: string, id: string) {
  await db.delete(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
}
