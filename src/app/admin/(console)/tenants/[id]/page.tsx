import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { setSuspended } from "@/app/admin/actions";
import { AccessBadge } from "@/components/access-badge";
import { SkeletonRows } from "@/components/skeleton";
import { requireSuperAdmin } from "@/lib/dal";
import { accessLevel } from "@/lib/subscription";
import { PaymentForm } from "./payment-form";

export const metadata: Metadata = { title: "Pharmacy", robots: { index: false } };

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function TenantPage({ params }: PageProps<"/admin/tenants/[id]">) {
  return (
    <Suspense fallback={<SkeletonRows rows={8} />}>
      <TenantDetail params={params} />
    </Suspense>
  );
}

async function TenantDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const [tenant] = await db.select().from(schema.tenants).where(eq(schema.tenants.id, id));
  if (!tenant) notFound();
  const [payments, [owner]] = await Promise.all([
    db
      .select()
      .from(schema.tenantPayments)
      .where(eq(schema.tenantPayments.tenantId, id))
      .orderBy(desc(schema.tenantPayments.createdAt)),
    db
      .select({ username: schema.user.displayUsername })
      .from(schema.user)
      .where(and(eq(schema.user.tenantId, id), eq(schema.user.role, "owner")))
      .limit(1),
  ]);
  const level = accessLevel(tenant);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-foreground">
          All pharmacies
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <AccessBadge level={level} suspended={tenant.suspended} />
        </div>
      </div>

      <dl className="grid gap-x-8 gap-y-4 rounded-ui border border-border bg-surface p-6 sm:grid-cols-3">
        <Item term="Billing link" value={`/t/${tenant.slug}`} mono />
        <Item term="Owner login" value={owner?.username?.split(".").slice(1).join(".") ?? "None"} mono />
        <Item term="Owner" value={`${tenant.ownerName}, ${tenant.phone}`} />
        <Item term="City" value={tenant.city} />
        <Item term="GSTIN" value={tenant.gstin ?? "Not set"} mono />
        <Item term="Plan" value={tenant.plan} />
        <Item term="Paid until" value={tenant.paidUntil} mono />
      </dl>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Record a payment</h2>
        <div className="rounded-ui border border-border bg-surface p-6">
          <PaymentForm tenantId={tenant.id} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Payments</h2>
        {payments.length === 0 ? (
          <p className="text-muted">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-ui border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Recorded</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Months</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Paid until</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{p.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                    <td className="px-4 py-3 font-mono">{inr.format(Number(p.amount))}</td>
                    <td className="px-4 py-3">{p.months}</td>
                    <td className="px-4 py-3 uppercase">
                      {p.method}
                      {p.reference && <span className="ml-2 font-mono text-xs text-muted normal-case">{p.reference}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {p.paidUntilBefore} to {p.paidUntilAfter}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-ui border border-danger/40 p-6">
        <h2 className="text-lg font-semibold">{tenant.suspended ? "Pharmacy is suspended" : "Suspend pharmacy"}</h2>
        <p className="mt-1 mb-4 text-muted">
          {tenant.suspended
            ? "Staff cannot sign in. Data is kept."
            : "Signs out all staff and blocks sign in. Data is kept and access comes back when you restore it."}
        </p>
        <form action={setSuspended.bind(null, tenant.id, !tenant.suspended)}>
          <button className={tenant.suspended ? "btn" : "btn-quiet text-danger"}>
            {tenant.suspended ? "Restore access" : "Suspend"}
          </button>
        </form>
      </section>
    </div>
  );
}

function Item({ term, value, mono }: { term: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-muted">{term}</dt>
      <dd className={`mt-0.5 ${mono ? "font-mono text-sm" : ""}`}>{value}</dd>
    </div>
  );
}
