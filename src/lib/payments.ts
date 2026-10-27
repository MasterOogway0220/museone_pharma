import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { extendPaidUntil } from "@/lib/subscription";

export type PaymentInput = {
  requestId: string;
  tenantId: string;
  amount: number;
  months: number;
  method: "upi" | "bank" | "cash" | "cheque" | "other";
  reference?: string;
};

// Idempotent on requestId: a retried or double-submitted payment extends paid-until once.
export async function recordTenantPayment(d: PaymentInput, recordedBy: string, today?: string) {
  return db.transaction(async (tx) => {
    // Lock the tenant row first, so concurrent payments for this tenant run one at a time.
    const [tenant] = await tx
      .select({ paidUntil: schema.tenants.paidUntil })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, d.tenantId))
      .for("update");
    if (!tenant) throw new Error("Pharmacy not found.");

    const [done] = await tx
      .select({ after: schema.tenantPayments.paidUntilAfter })
      .from(schema.tenantPayments)
      .where(eq(schema.tenantPayments.requestId, d.requestId))
      .for("update");
    if (done) return { paidUntil: done.after, duplicate: true };

    const after = extendPaidUntil(tenant.paidUntil, d.months, today);
    await tx.insert(schema.tenantPayments).values({
      requestId: d.requestId,
      tenantId: d.tenantId,
      amount: d.amount.toFixed(2),
      months: d.months,
      method: d.method,
      reference: d.reference || null,
      paidUntilBefore: tenant.paidUntil,
      paidUntilAfter: after,
      recordedBy,
    });
    await tx
      .update(schema.tenants)
      .set({ paidUntil: after, plan: sql`IF(${schema.tenants.plan} = 'trial', 'basic', ${schema.tenants.plan})` })
      .where(eq(schema.tenants.id, d.tenantId));
    return { paidUntil: after, duplicate: false };
  });
}
