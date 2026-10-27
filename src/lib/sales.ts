import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { fromPaise, priceSale, toPaise } from "@/lib/money";
import type { SaleInput } from "@/lib/validation";

const { sales, saleItems, stockMovements, products, customers } = schema;

export class SaleRejected extends Error {}

function isDuplicate(e: unknown) {
  return (e as { cause?: { code?: string } })?.cause?.code === "ER_DUP_ENTRY";
}

// Records a sale from a till. Idempotent on sale.id: a retried sync returns the stored sale.
export async function recordSale(tenantId: string, userId: string, input: SaleInput) {
  const [existing] = await db
    .select({ id: sales.id, invoiceNo: sales.invoiceNo, payable: sales.payable })
    .from(sales)
    .where(and(eq(sales.tenantId, tenantId), eq(sales.id, input.id)));
  if (existing) return { ...existing, duplicate: true };

  const ids = [...new Set(input.lines.map((l) => l.productId))];
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenantId), inArray(products.id, ids)));
  const byId = new Map(rows.map((p) => [p.id, p]));

  for (const l of input.lines) {
    const p = byId.get(l.productId);
    if (!p) throw new SaleRejected("A product on this bill no longer exists.");
    if (toPaise(l.price) > toPaise(p.mrp)) throw new SaleRejected(`${p.name}: price is above MRP.`);
  }
  const restricted = input.lines.some((l) => ["H1", "X"].includes(byId.get(l.productId)!.schedule));
  if (restricted && (!input.doctorName || !input.patientName)) {
    throw new SaleRejected("Schedule H1/X medicines need the doctor's and patient's names.");
  }
  if (input.customerId) {
    const [c] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, input.customerId)));
    if (!c) throw new SaleRejected("Customer not found.");
  }
  if (input.paymentMethod === "credit" && !input.customerId) {
    throw new SaleRejected("Credit sales need a saved customer.");
  }

  // Totals are recomputed here from line prices; the till's own totals are never trusted.
  const { lines, totals } = priceSale(
    input.lines.map((l) => ({
      pricePaise: toPaise(l.price),
      qty: l.qty,
      gstRate: Number(byId.get(l.productId)!.gstRate),
    })),
    input.discountPct,
  );
  if (input.paymentMethod === "cash" && input.tendered !== null && toPaise(input.tendered) < totals.payablePaise) {
    throw new SaleRejected("Cash received is less than the bill amount.");
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(sales).values({
        id: input.id,
        tenantId,
        invoiceNo: input.invoiceNo,
        tillCode: input.tillCode,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        doctorName: input.doctorName,
        patientName: input.patientName,
        discountPct: input.discountPct.toFixed(2),
        gross: fromPaise(totals.grossPaise),
        discount: fromPaise(totals.grossPaise - totals.netPaise),
        taxable: fromPaise(totals.taxablePaise),
        cgst: fromPaise(totals.cgstPaise),
        sgst: fromPaise(totals.sgstPaise),
        roundOff: fromPaise(totals.roundOffPaise),
        payable: fromPaise(totals.payablePaise),
        paymentMethod: input.paymentMethod,
        tendered: input.tendered === null ? null : input.tendered.toFixed(2),
        userId,
        soldAt: new Date(input.soldAt),
      });
      await tx.insert(saleItems).values(
        input.lines.map((l, i) => {
          const p = byId.get(l.productId)!;
          const t = lines[i];
          return {
            tenantId,
            saleId: input.id,
            productId: p.id,
            name: p.name,
            hsn: p.hsn,
            schedule: p.schedule,
            batch: l.batch,
            expiry: l.expiry,
            qty: l.qty,
            mrp: p.mrp,
            price: fromPaise(t.pricePaise),
            gstRate: p.gstRate,
            discount: fromPaise(t.discountPaise),
            taxable: fromPaise(t.taxablePaise),
            cgst: fromPaise(t.cgstPaise),
            sgst: fromPaise(t.sgstPaise),
            net: fromPaise(t.netPaise),
          };
        }),
      );
      const moves = input.lines
        .filter((l) => byId.get(l.productId)!.trackStock)
        .map((l) => ({
          id: randomUUID(),
          tenantId,
          productId: l.productId,
          batch: l.batch,
          expiry: l.expiry,
          qty: -l.qty,
          reason: "sale" as const,
          saleId: input.id,
          userId,
        }));
      if (moves.length) await tx.insert(stockMovements).values(moves);
    });
  } catch (e) {
    if (!isDuplicate(e)) throw e;
    // Same id raced in from another request: that one won, report it.
    const [won] = await db
      .select({ id: sales.id, invoiceNo: sales.invoiceNo, payable: sales.payable })
      .from(sales)
      .where(and(eq(sales.tenantId, tenantId), eq(sales.id, input.id)));
    if (won) return { ...won, duplicate: true };
    throw new SaleRejected(`Invoice number ${input.invoiceNo} is already used.`);
  }
  return { id: input.id, invoiceNo: input.invoiceNo, payable: fromPaise(totals.payablePaise), duplicate: false };
}
