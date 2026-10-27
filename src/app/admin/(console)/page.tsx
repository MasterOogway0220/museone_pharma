import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { AccessBadge } from "@/components/access-badge";
import { SkeletonRows } from "@/components/skeleton";
import { requireSuperAdmin } from "@/lib/dal";
import { accessLevel } from "@/lib/subscription";

export const metadata: Metadata = { title: "Pharmacies", robots: { index: false } };

export default function AdminHome() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pharmacies</h1>
        <Link href="/admin/tenants/new" className="btn">
          Add pharmacy
        </Link>
      </div>
      <Suspense fallback={<SkeletonRows />}>
        <TenantTable />
      </Suspense>
    </>
  );
}

async function TenantTable() {
  await requireSuperAdmin();
  const tenants = await db.select().from(schema.tenants).orderBy(desc(schema.tenants.createdAt));
  if (!tenants.length) {
    return (
      <p className="rounded-ui border border-dashed border-border p-8 text-center text-muted">
        No pharmacies yet. Add the first one to give them their billing link.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-ui border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Pharmacy</th>
            <th className="px-4 py-3 font-medium">Link</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Paid until</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <Link href={`/admin/tenants/${t.id}`} className="font-medium hover:underline">
                  {t.name}
                </Link>
                <div className="text-muted">
                  {t.ownerName}, {t.city}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-xs">/t/{t.slug}</td>
              <td className="px-4 py-3 capitalize">{t.plan}</td>
              <td className="px-4 py-3 font-mono">{t.paidUntil}</td>
              <td className="px-4 py-3">
                <AccessBadge level={accessLevel(t)} suspended={t.suspended} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
