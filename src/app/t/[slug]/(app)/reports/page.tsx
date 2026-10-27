import type { Metadata } from "next";
import { Suspense } from "react";
import { DateRange, readRange } from "@/components/date-range";
import { SkeletonRows } from "@/components/skeleton";
import { requireTenant } from "@/lib/dal";
import { formatINR, toPaise } from "@/lib/money";
import { salesSummary } from "@/lib/reports";
import { todayInIndia } from "@/lib/subscription";

export const metadata: Metadata = { title: "Reports", robots: { index: false } };

export default function ReportsPage({ params, searchParams }: PageProps<"/t/[slug]/reports">) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Reports</h1>
      <Suspense fallback={<SkeletonRows rows={10} />}>
        <Reports params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const rs = (v: string | number) => formatINR(toPaise(v));

async function Reports({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenant(slug, { perm: "permTransactions" });
  const { from, to } = readRange(await searchParams, todayInIndia());
  const r = await salesSummary(tenant.id, from, to);
  const t = r.totals;
  const q = `from=${from}&to=${to}`;
  const margin = r.profit.taxablePaise - r.profit.costPaise;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <DateRange from={from} to={to} />
        <div className="flex flex-wrap gap-2 text-sm">
          <a className="btn-quiet" href={`/api/t/${slug}/export/sales?${q}`}>
            Download sales (CSV)
          </a>
          <a className="btn-quiet" href={`/api/t/${slug}/export/h1?${q}`}>
            Schedule H1 register (CSV)
          </a>
        </div>
      </div>

      <dl className="grid gap-px overflow-hidden rounded-ui border border-border bg-border sm:grid-cols-4">
        <Stat label="Net sales" value={rs(t.payable)} big />
        <Stat label="Bills" value={String(t.bills)} />
        <Stat label="Discount given" value={rs(t.discount)} />
        <Stat
          label="Gross profit"
          value={formatINR(margin)}
          hint={r.profit.unknownCost ? `${r.profit.unknownCost} item(s) without purchase cost left out` : "Taxable sales minus average purchase cost"}
        />
        <Stat label="Taxable value" value={rs(t.taxable)} />
        <Stat label="CGST" value={rs(t.cgst)} />
        <Stat label="SGST" value={rs(t.sgst)} />
        <Stat label="Returns" value={`${r.returned.bills} / ${rs(r.returned.amount)}`} />
      </dl>

      <div className="grid gap-8 lg:grid-cols-2">
        <Table
          title="GST summary by rate (for GSTR-1 B2C)"
          head={["Rate", "Taxable", "CGST", "SGST"]}
          rows={r.gstByRate.map((g) => [`${Number(g.rate)}%`, rs(g.taxable), rs(g.cgst), rs(g.sgst)])}
        />
        <Table title="Top medicines" head={["Medicine", "Qty", "Sales"]} rows={r.topProducts.map((p) => [p.name, String(p.qty), rs(p.net)])} />
        <Table title="By payment method" head={["Method", "Bills", "Amount"]} rows={r.byMethod.map((m) => [m.key.toUpperCase(), String(m.bills), rs(m.amount)])} />
        <Table title="By cashier" head={["Cashier", "Bills", "Amount"]} rows={r.byCashier.map((m) => [m.key, String(m.bills), rs(m.amount)])} />
        <Table title="By till" head={["Till", "Bills", "Amount"]} rows={r.byTill.map((m) => [m.key, String(m.bills), rs(m.amount)])} />
      </div>
    </div>
  );
}

function Stat({ label, value, hint, big }: { label: string; value: string; hint?: string; big?: boolean }) {
  return (
    <div className="bg-surface p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`mt-1 font-mono ${big ? "text-2xl font-semibold" : "text-lg"}`}>{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted">{hint}</dd>}
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: string[][] }) {
  return (
    <section>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No sales in this period.</p>
      ) : (
        <table className="w-full rounded-ui border border-border bg-surface text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              {head.map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, n) => (
              <tr key={n} className="border-b border-border last:border-0">
                {r.map((c, i) => (
                  <td key={i} className={`px-3 py-2 ${i ? "text-right font-mono" : ""}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
