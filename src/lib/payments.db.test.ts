// Needs the dev MySQL from docker-compose (pnpm test:db).
import { randomUUID } from "node:crypto";
import { afterAll, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { db, pool, schema } from "@/db";
import { recordTenantPayment } from "./payments";

const tenantId = randomUUID();
const today = "2026-10-27";

afterAll(async () => {
  await db.delete(schema.tenantPayments).where(eq(schema.tenantPayments.tenantId, tenantId));
  await db.delete(schema.tenants).where(eq(schema.tenants.id, tenantId));
  await pool.end();
});

test("same requestId twice, even concurrently, records one payment and extends once", async () => {
  const [admin] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.role, "superadmin"));
  await db.insert(schema.tenants).values({
    id: tenantId,
    slug: `db-${tenantId.slice(0, 8)}`,
    name: "DB test",
    ownerName: "Test",
    phone: "9820012345",
    paidUntil: "2026-10-31",
  });

  const input = { requestId: randomUUID(), tenantId, amount: 999, months: 1, method: "upi" as const };
  const results = await Promise.all([
    recordTenantPayment(input, admin.id, today),
    recordTenantPayment(input, admin.id, today),
  ]);
  await recordTenantPayment(input, admin.id, today); // later retry

  expect(results.map((r) => r.duplicate).sort()).toEqual([false, true]);
  const rows = await db.select().from(schema.tenantPayments).where(eq(schema.tenantPayments.tenantId, tenantId));
  expect(rows).toHaveLength(1);
  const [t] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId));
  expect(t.paidUntil).toBe("2026-11-30");
  expect(t.plan).toBe("basic");

  // A different payment does extend again.
  await recordTenantPayment({ ...input, requestId: randomUUID() }, admin.id, today);
  const [t2] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId));
  expect(t2.paidUntil).toBe("2026-12-30");
});
