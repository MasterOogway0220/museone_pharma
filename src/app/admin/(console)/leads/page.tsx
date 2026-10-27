import type { Metadata } from "next";
import { Suspense } from "react";
import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { SkeletonRows } from "@/components/skeleton";
import { requireSuperAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Demo requests", robots: { index: false } };

export default function LeadsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Demo requests</h1>
      <Suspense fallback={<SkeletonRows />}>
        <Leads />
      </Suspense>
    </>
  );
}

async function Leads() {
  await requireSuperAdmin();
  const rows = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(500);
  if (!rows.length) return <p className="text-muted">No demo requests yet.</p>;
  return (
    <div className="overflow-x-auto rounded-ui border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">When</th>
            <th className="px-4 py-3 font-medium">Pharmacy</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Counters</th>
            <th className="px-4 py-3 font-medium">Message</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-b border-border align-top last:border-0">
              <td className="px-4 py-3 whitespace-nowrap">{l.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{l.pharmacy}</div>
                <div className="text-muted">{l.area}</div>
              </td>
              <td className="px-4 py-3">
                {l.name}
                <a className="block font-mono text-brand underline" href={`tel:+91${l.phone}`}>
                  {l.phone}
                </a>
              </td>
              <td className="px-4 py-3">{l.counters}</td>
              <td className="px-4 py-3 text-muted">{l.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
