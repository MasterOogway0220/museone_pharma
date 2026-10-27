// Needs the dev MySQL (pnpm test:db).
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db, pool, schema } from "@/db";
import type { SaleInput } from "./validation";

vi.mock("server-only", () => ({}));
const catalog = await import("./catalog");
const { recordSale, SaleRejected } = await import("./sales");

const A = randomUUID();
const B = randomUUID();
let userId = "";
let otc = "";
let h1 = "";
let seq = 0;

const base = {
  categoryId: null,
  hsn: "3004",
  gstRate: "12" as const,
  supplier: null,
  minStock: 0,
  trackStock: true,
};

function sale(lines: SaleInput["lines"], extra: Partial<SaleInput> = {}): SaleInput {
  seq += 1;
  return {
    id: randomUUID(),
    invoiceNo: `T1-${seq}`,
    tillCode: "T1",
    soldAt: new Date().toISOString(),
    customerId: null,
    customerName: null,
    customerPhone: null,
    doctorName: null,
    patientName: null,
    discountPct: 0,
    paymentMethod: "cash",
    tendered: null,
    lines,
    ...extra,
  };
}

beforeAll(async () => {
  const [admin] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.role, "superadmin"));
  userId = admin.id;
  for (const id of [A, B]) {
    await db
      .insert(schema.tenants)
      .values({ id, slug: `sale-${id.slice(0, 8)}`, name: "S", ownerName: "T", phone: "9820012345", paidUntil: "2030-01-01" });
  }
  otc = await catalog.saveProduct(A, null, { ...base, name: "OTC", barcode: "111", mrp: 56, price: 56, schedule: "none" });
  h1 = await catalog.saveProduct(A, null, { ...base, name: "H1 drug", barcode: "222", mrp: 100, price: 90, schedule: "H1" });
  await catalog.addStock(A, userId, { productId: otc, batch: "B1", expiry: "2028-01-31", qty: 10, unitCost: 40 });
});

afterAll(async () => {
  const t = [A, B];
  await db.delete(schema.saleItems).where(inArray(schema.saleItems.tenantId, t));
  await db.delete(schema.stockMovements).where(inArray(schema.stockMovements.tenantId, t));
  await db.delete(schema.sales).where(inArray(schema.sales.tenantId, t));
  await db.delete(schema.products).where(inArray(schema.products.tenantId, t));
  await db.delete(schema.tenants).where(inArray(schema.tenants.id, t));
  await pool.end();
});

const line = (productId: string, qty: number, price: number, batch = "B1") => ({
  productId,
  batch,
  expiry: "2028-01-31",
  qty,
  price,
});

test("sale stores server-computed GST totals and takes stock off the batch", async () => {
  const s = sale([line(otc, 2, 56)]);
  const res = await recordSale(A, userId, s);
  expect(res).toMatchObject({ invoiceNo: s.invoiceNo, payable: "112.00", duplicate: false });
  const [row] = await db.select().from(schema.sales).where(eq(schema.sales.id, s.id));
  expect([row.taxable, row.cgst, row.sgst]).toEqual(["100.00", "6.00", "6.00"]);
  const [p] = await catalog.listProducts(A, "OTC");
  expect(p.stock).toBe(8);
});

test("retrying the same sale id does nothing twice", async () => {
  const s = sale([line(otc, 1, 56)]);
  await recordSale(A, userId, s);
  const again = await Promise.all([recordSale(A, userId, s), recordSale(A, userId, s)]);
  expect(again.every((r) => r.duplicate)).toBe(true);
  const items = await db.select().from(schema.saleItems).where(eq(schema.saleItems.saleId, s.id));
  expect(items).toHaveLength(1);
  const [p] = await catalog.listProducts(A, "OTC");
  expect(p.stock).toBe(7);
});

test("price above MRP is rejected", async () => {
  await expect(recordSale(A, userId, sale([line(otc, 1, 60)]))).rejects.toThrow("above MRP");
});

test("Schedule H1 needs doctor and patient", async () => {
  await expect(recordSale(A, userId, sale([line(h1, 1, 90, "")]))).rejects.toThrow(SaleRejected);
  await expect(
    recordSale(A, userId, sale([line(h1, 1, 90, "")], { doctorName: "Dr. Rao", patientName: "S. Kulkarni" })),
  ).resolves.toMatchObject({ duplicate: false });
});

test("another tenant cannot sell this tenant's product", async () => {
  await expect(recordSale(B, userId, sale([line(otc, 1, 56)]))).rejects.toThrow("no longer exists");
});

test("cash received below bill is rejected; credit needs a customer", async () => {
  await expect(recordSale(A, userId, sale([line(otc, 1, 56)], { tendered: 50 }))).rejects.toThrow("less than");
  await expect(recordSale(A, userId, sale([line(otc, 1, 56)], { paymentMethod: "credit" }))).rejects.toThrow(
    "saved customer",
  );
});

test("reused invoice number with a different id is refused", async () => {
  const first = sale([line(otc, 1, 56)]);
  await recordSale(A, userId, first);
  await expect(recordSale(A, userId, { ...sale([line(otc, 1, 56)]), invoiceNo: first.invoiceNo })).rejects.toThrow(
    "already used",
  );
});
