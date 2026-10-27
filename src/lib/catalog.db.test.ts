// Tenant isolation for catalog data. Needs the dev MySQL (pnpm test:db).
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db, pool, schema } from "@/db";

vi.mock("server-only", () => ({}));
const catalog = await import("./catalog");

const A = randomUUID();
const B = randomUUID();
let userId = "";
let productId = "";

const product = {
  name: "Paracetamol 500mg",
  barcode: `89${Date.now()}`,
  categoryId: null,
  hsn: "3004",
  gstRate: "12" as const,
  mrp: 30,
  price: 28,
  supplier: null,
  minStock: 10,
  trackStock: true,
  schedule: "none" as const,
};

beforeAll(async () => {
  const [admin] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.role, "superadmin"));
  userId = admin.id;
  for (const id of [A, B]) {
    await db.insert(schema.tenants).values({
      id,
      slug: `iso-${id.slice(0, 8)}`,
      name: "Iso",
      ownerName: "T",
      phone: "9820012345",
      paidUntil: "2030-01-01",
    });
  }
  productId = await catalog.saveProduct(A, null, product);
});

afterAll(async () => {
  const t = [A, B];
  await db.delete(schema.stockMovements).where(inArray(schema.stockMovements.tenantId, t));
  await db.delete(schema.products).where(inArray(schema.products.tenantId, t));
  await db.delete(schema.customers).where(inArray(schema.customers.tenantId, t));
  await db.delete(schema.tenants).where(inArray(schema.tenants.id, t));
  await pool.end();
});

test("tenant B cannot read, edit, remove or stock tenant A's product", async () => {
  await expect(catalog.getProduct(B, productId)).rejects.toThrow(catalog.NotFoundError);
  await expect(catalog.saveProduct(B, productId, { ...product, name: "hacked" })).rejects.toThrow(catalog.NotFoundError);
  await expect(catalog.removeProduct(B, productId)).rejects.toThrow(catalog.NotFoundError);
  await expect(
    catalog.addStock(B, userId, { productId, batch: "X1", expiry: "2027-01-01", qty: 5, unitCost: 10 }),
  ).rejects.toThrow(catalog.NotFoundError);
  expect(await catalog.listProducts(B)).toHaveLength(0);
  expect((await catalog.getProduct(A, productId)).name).toBe(product.name);
});

test("same barcode is allowed in another tenant but not twice in one", async () => {
  await expect(catalog.saveProduct(B, null, product)).resolves.toBeTruthy();
  await expect(catalog.saveProduct(A, null, product)).rejects.toThrow(catalog.ConflictError);
});

test("stock is the ledger sum, batches sorted earliest expiry first", async () => {
  await catalog.addStock(A, userId, { productId, batch: "b2", expiry: "2027-06-30", qty: 20, unitCost: 18 });
  await catalog.addStock(A, userId, { productId, batch: "b1", expiry: "2027-01-31", qty: 5, unitCost: 18 });
  await catalog.adjustStock(A, userId, { productId, batch: "B1", expiry: "2027-01-31", qty: -2, reason: "adjust" });
  const [p] = await catalog.listProducts(A, product.name);
  expect(p.stock).toBe(23);
  expect(p.batches.map((b) => [b.batch, b.qty])).toEqual([["B1", 3], ["B2", 20]]);
  expect(p.nextExpiry).toBe("2027-01-31");
});

test("removed product frees its barcode", async () => {
  await catalog.removeProduct(A, productId);
  await expect(catalog.saveProduct(A, null, product)).resolves.toBeTruthy();
});
