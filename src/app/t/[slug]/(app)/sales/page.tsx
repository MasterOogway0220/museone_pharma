import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DateRange, readRange } from "@/components/date-range";
import { SkeletonRows } from "@/components/skeleton";
import { requireTenant } from "@/lib/dal";
import { formatINR, toPaise } from "@/lib/money";
import { listSales } from "@/lib/reports";
import { todayInIndia } from "@/lib/subscription";

export const metadata: Metadata = { title: "Sales", robots: { index: false } };

export default function SalesPage({ params, searchParams }: PageProps<"/t/[slug]/sales">) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Sales</h1>
      <Suspense fallback={<SkeletonRows rows={8} />}>
        <Sales params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Sales({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenant(slug);
  const { from, to } = readRange(await searchParams, todayInIndia());
  const rows = await listSales(tenant.id, from, to);
  const total = rows.filter((r) => r.status === "completed").reduce((s, r) => s + toPaise(r.payable), 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <DateRange from={from} to={to} />
        <p className="text-right">
          <span className="text-muted">
            {rows.length} bill{rows.length === 1 ? "" : "s"}
          </span>
          <span className="ml-3 font-mono text-xl font-semibold">{formatINR(total)}</span>
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-ui border border-dashed border-border p-8 text-center text-muted">No bills in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-ui border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Bill</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Paid by</th>
                <th className="px-4 py-3 font-medium">Cashier</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/t/${slug}/sales/${r.id}`} className="font-mono hover:underline">
                      {r.invoiceNo}
                    </Link>
                    {r.status === "returned" && <span className="ml-2 text-xs font-medium text-danger">Returned</span>}
                  </td>
                  <td className="px-4 py-3">{r.soldAt.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Kolkata" })}</td>
                  <td className="px-4 py-3">{r.customerName ?? <span className="text-muted">Walk-in</span>}</td>
                  <td className="px-4 py-3 uppercase">{r.paymentMethod}</td>
                  <td className="px-4 py-3">{r.cashier}</td>
                  <td className={`px-4 py-3 text-right font-mono ${r.status === "returned" ? "text-muted line-through" : ""}`}>{formatINR(toPaise(r.payable))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
