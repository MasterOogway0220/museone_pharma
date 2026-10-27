import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { toPaise } from "@/lib/money";
import { istRange } from "@/lib/report-utils";

const { sales, saleItems, stockMovements, user } = schema;

function inRange(tenantId: string, from: string, to: string) {
  const { start, end } = istRange(from, to);
  return and(eq(sales.tenantId, tenantId), gte(sales.soldAt, start), lt(sales.soldAt, end));
}

export async function listSales(tenantId: string, from: string, to: string) {
  return db
    .select({
      id: sales.id,
      invoiceNo: sales.invoiceNo,
      soldAt: sales.soldAt,
      customerName: sales.customerName,
      payable: sales.payable,
      paymentMethod: sales.paymentMethod,
      status: sales.status,
      cashier: user.name,
    })
    .from(sales)
    .innerJoin(user, eq(user.id, sales.userId))
    .where(inRange(tenantId, from, to))
    .orderBy(desc(sales.soldAt))
    .limit(1000);
}

export async function getSale(tenantId: string, id: string) {
  const [sale] = await db
    .select({ s: sales, cashier: user.name })
    .from(sales)
    .innerJoin(user, eq(user.id, sales.userId))
    .where(and(eq(sales.tenantId, tenantId), eq(sales.id, id)));
  if (!sale) return null;
  const items = await db
    .select()
    .from(saleItems)
    .where(and(eq(saleItems.tenantId, tenantId), eq(saleItems.saleId, id)))
    .orderBy(saleItems.id);
  return { ...sale.s, cashier: sale.cashier, items };
}

// Whole-bill return: puts the stock back on the same batches and marks the bill returned.
export async function returnSale(tenantId: string, userId: string, id: string) {
  return db.transaction(async (tx) => {
    const [s] = await tx
      .select({ status: sales.status })
      .from(sales)
      .where(and(eq(sales.tenantId, tenantId), eq(sales.id, id)))
      .for("update");
    if (!s) throw new Error("Bill not found.");
    if (s.status === "returned") return false;
    const sold = await tx
      .select()
      .from(stockMovements)
      .where(and(eq(stockMovements.tenantId, tenantId), eq(stockMovements.saleId, id), eq(stockMovements.reason, "sale")));
    if (sold.length) {
      await tx.insert(stockMovements).values(
        sold.map((m) => ({
          id: randomUUID(),
          tenantId,
          productId: m.productId,
          batch: m.batch,
          expiry: m.expiry,
          qty: -m.qty,
          reason: "return" as const,
          saleId: id,
          userId,
        })),
      );
    }
    await tx.update(sales).set({ status: "returned" }).where(and(eq(sales.tenantId, tenantId), eq(sales.id, id)));
    return true;
  });
}

const sum = (col: unknown) => sql<string>`COALESCE(SUM(${col}), 0)`;

export async function salesSummary(tenantId: string, from: string, to: string) {
  const where = and(inRange(tenantId, from, to), eq(sales.status, "completed"));
  const [totals] = await db
    .select({
      bills: sql<number>`COUNT(*)`,
      gross: sum(sales.gross),
      discount: sum(sales.discount),
      taxable: sum(sales.taxable),
      cgst: sum(sales.cgst),
      sgst: sum(sales.sgst),
      payable: sum(sales.payable),
    })
    .from(sales)
    .where(where);

  const [byMethod, byCashier, byTill, gstByRate, topProducts, returned] = await Promise.all([
    db
      .select({ key: sales.paymentMethod, bills: sql<number>`COUNT(*)`, amount: sum(sales.payable) })
      .from(sales)
      .where(where)
      .groupBy(sales.paymentMethod),
    db
      .select({ key: user.name, bills: sql<number>`COUNT(*)`, amount: sum(sales.payable) })
      .from(sales)
      .innerJoin(user, eq(user.id, sales.userId))
      .where(where)
      .groupBy(user.name),
    db
      .select({ key: sales.tillCode, bills: sql<number>`COUNT(*)`, amount: sum(sales.payable) })
      .from(sales)
      .where(where)
      .groupBy(sales.tillCode),
    // GSTR-1 B2C summary: taxable value and tax per rate.
    db
      .select({ rate: saleItems.gstRate, taxable: sum(saleItems.taxable), cgst: sum(saleItems.cgst), sgst: sum(saleItems.sgst) })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(where)
      .groupBy(saleItems.gstRate)
      .orderBy(saleItems.gstRate),
    db
      .select({ productId: saleItems.productId, name: saleItems.name, qty: sql<number>`SUM(${saleItems.qty})`, net: sum(saleItems.net) })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(where)
      .groupBy(saleItems.productId, saleItems.name)
      .orderBy(desc(sql`SUM(${saleItems.net})`))
      .limit(10),
    db
      .select({ bills: sql<number>`COUNT(*)`, amount: sum(sales.payable) })
      .from(sales)
      .where(and(inRange(tenantId, from, to), eq(sales.status, "returned"))),
  ]);

  return { totals, byMethod, byCashier, byTill, gstByRate, topProducts, returned: returned[0], profit: await grossProfit(tenantId, from, to) };
}

// Profit = taxable sales value minus weighted average purchase cost (cost entered without GST).
// shortcut: average cost over all purchases, not FIFO cost per batch; upgrade with batch costing if owners ask.
async function grossProfit(tenantId: string, from: string, to: string) {
  const sold = await db
    .select({ productId: saleItems.productId, qty: sql<number>`SUM(${saleItems.qty})`, taxable: sum(saleItems.taxable) })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .where(and(inRange(tenantId, from, to), eq(sales.status, "completed")))
    .groupBy(saleItems.productId);
  if (!sold.length) return { taxablePaise: 0, costPaise: 0, unknownCost: 0 };
  const costs = await db
    .select({
      productId: stockMovements.productId,
      avg: sql<string>`SUM(${stockMovements.qty} * ${stockMovements.unitCost}) / SUM(${stockMovements.qty})`,
    })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.tenantId, tenantId),
        eq(stockMovements.reason, "purchase"),
        inArray(
          stockMovements.productId,
          sold.map((s) => s.productId),
        ),
      ),
    )
    .groupBy(stockMovements.productId);
  const avg = new Map(costs.map((c) => [c.productId, Number(c.avg)]));
  let taxablePaise = 0;
  let costPaise = 0;
  let unknownCost = 0;
  for (const s of sold) {
    const a = avg.get(s.productId);
    if (a === undefined) {
      unknownCost += 1;
      continue;
    }
    taxablePaise += toPaise(s.taxable);
    costPaise += Math.round(a * 100 * Number(s.qty));
  }
  return { taxablePaise, costPaise, unknownCost };
}

// Schedule H1/X register: what the Drugs and Cosmetics Rules ask chemists to keep.
export function h1Register(tenantId: string, from: string, to: string) {
  return db
    .select({
      soldAt: sales.soldAt,
      invoiceNo: sales.invoiceNo,
      patientName: sales.patientName,
      doctorName: sales.doctorName,
      name: saleItems.name,
      schedule: saleItems.schedule,
      batch: saleItems.batch,
      qty: saleItems.qty,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .where(and(inRange(tenantId, from, to), inArray(saleItems.schedule, ["H1", "X"])))
    .orderBy(sales.soldAt);
}

export function saleLinesForExport(tenantId: string, from: string, to: string) {
  return db
    .select({
      soldAt: sales.soldAt,
      invoiceNo: sales.invoiceNo,
      status: sales.status,
      customer: sales.customerName,
      payment: sales.paymentMethod,
      item: saleItems.name,
      hsn: saleItems.hsn,
      batch: saleItems.batch,
      expiry: saleItems.expiry,
      qty: saleItems.qty,
      price: saleItems.price,
      gstRate: saleItems.gstRate,
      discount: saleItems.discount,
      taxable: saleItems.taxable,
      cgst: saleItems.cgst,
      sgst: saleItems.sgst,
      net: saleItems.net,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .where(inRange(tenantId, from, to))
    .orderBy(sales.soldAt, saleItems.id);
}
