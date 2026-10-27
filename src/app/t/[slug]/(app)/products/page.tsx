import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExpiryBadge, StockBadge } from "@/components/badges";
import { SkeletonRows } from "@/components/skeleton";
import { listProducts } from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";
import { formatINR, toPaise } from "@/lib/money";

export const metadata: Metadata = { title: "Products", robots: { index: false } };

export default function ProductsPage({ params, searchParams }: PageProps<"/t/[slug]/products">) {
  return (
    <Suspense fallback={<SkeletonRows rows={8} />}>
      <Products params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const FILTERS = { all: "All", low: "Low or out", expiry: "Expiring" } as const;

async function Products({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = (typeof sp.show === "string" && sp.show in FILTERS ? sp.show : "all") as keyof typeof FILTERS;
  const { tenant } = await requireTenant(slug, { perm: "permProducts" });
  const all = await listProducts(tenant.id, q);
  const rows = all.filter((p) =>
    filter === "low" ? p.stockStatus !== "ok" : filter === "expiry" ? p.expiryStatus !== "ok" : true,
  );
  const base = `/t/${slug}/products`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-2">
          <Link href={`${base}/labels`} className="btn-quiet">
            Print labels
          </Link>
          <Link href={`${base}/new`} className="btn">
            Add product
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="flex min-w-64 flex-1 gap-2" role="search">
          <input type="hidden" name="show" value={filter} />
          <input className="input" name="q" defaultValue={q} placeholder="Search name or scan barcode" aria-label="Search products" />
          <button className="btn-quiet">Search</button>
        </form>
        <div className="flex gap-1 text-sm" role="group" aria-label="Filter">
          {Object.entries(FILTERS).map(([key, label]) => (
            <Link
              key={key}
              href={`${base}?show=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={filter === key ? "true" : undefined}
              className={`rounded-ui border px-3 py-2 ${filter === key ? "border-brand text-brand" : "border-border text-muted"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-ui border border-dashed border-border p-8 text-center text-muted">
          {all.length === 0 && !q ? "No products yet. Add your first medicine to start billing." : "Nothing matches this search."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-ui border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Medicine</th>
                <th className="px-4 py-3 font-medium">Barcode</th>
                <th className="px-4 py-3 text-right font-medium">MRP</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Next expiry</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`${base}/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-muted">
                      {p.categoryName ?? "Uncategorised"}
                      {p.schedule !== "none" && <span className="ml-2 font-medium text-danger">Sch. {p.schedule}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.barcode}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatINR(toPaise(p.mrp))}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatINR(toPaise(p.price))}</td>
                  <td className="px-4 py-3 font-mono">{Number(p.gstRate)}%</td>
                  <td className="px-4 py-3">{p.trackStock ? <StockBadge status={p.stockStatus} qty={p.stock} /> : <span className="text-muted">Not tracked</span>}</td>
                  <td className="px-4 py-3">
                    <ExpiryBadge status={p.expiryStatus} date={p.nextExpiry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
