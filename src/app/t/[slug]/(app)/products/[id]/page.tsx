import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { removeProductAction } from "../../catalog-actions";
import { ExpiryBadge } from "@/components/badges";
import { SkeletonRows } from "@/components/skeleton";
import { NotFoundError, batchBalances, getProduct, listCategories } from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";
import { expiryStatus } from "@/lib/stock";
import { todayInIndia } from "@/lib/subscription";
import { ProductForm } from "../product-form";
import { StockInForm, WriteOffButton } from "./stock-forms";

export const metadata: Metadata = { title: "Product", robots: { index: false } };

export default function ProductPage({ params }: PageProps<"/t/[slug]/products/[id]">) {
  return (
    <div className="max-w-4xl">
      <Suspense fallback={<SkeletonRows rows={10} />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ProductDetail({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { tenant } = await requireTenant(slug, { perm: "permProducts" });
  const product = await getProduct(tenant.id, id).catch((e) => {
    if (e instanceof NotFoundError) notFound();
    throw e;
  });
  if (!product.active) notFound();
  const [categories, balances] = await Promise.all([listCategories(tenant.id), batchBalances(tenant.id, [id])]);
  const batches = (balances.get(id) ?? []).filter((b) => b.qty !== 0);
  const total = batches.reduce((s, b) => s + b.qty, 0);
  const today = todayInIndia();

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/t/${slug}/products`} className="text-sm text-muted hover:text-foreground">
          All products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{product.name}</h1>
      </div>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Stock: {product.trackStock ? total : "not tracked"}</h2>
        <p className="mb-4 text-sm text-muted">Sales take stock from the batch that expires first.</p>
        {batches.length > 0 && (
          <div className="mb-4 overflow-x-auto rounded-ui border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Batch</th>
                  <th className="px-4 py-2 font-medium">Expiry</th>
                  <th className="px-4 py-2 text-right font-medium">Qty</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => {
                  const status = expiryStatus(b.expiry, today);
                  return (
                    <tr key={`${b.batch}|${b.expiry}`} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono">{b.batch || "No batch"}</td>
                      <td className="px-4 py-2">
                        <ExpiryBadge status={status} date={b.expiry} />
                      </td>
                      <td className={`px-4 py-2 text-right font-mono ${b.qty < 0 ? "text-danger" : ""}`}>{b.qty}</td>
                      <td className="px-4 py-2 text-right">
                        {status === "expired" && b.qty > 0 && (
                          <WriteOffButton slug={slug} productId={id} batch={b.batch} expiry={b.expiry} qty={b.qty} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="rounded-ui border border-border bg-surface p-4">
          <h3 className="mb-3 font-medium">Receive stock</h3>
          <StockInForm slug={slug} productId={id} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Details</h2>
        <ProductForm slug={slug} id={id} product={product} categories={categories} />
      </section>

      <section className="rounded-ui border border-danger/40 p-6">
        <h2 className="text-lg font-semibold">Remove product</h2>
        <p className="mt-1 mb-4 text-muted">Hides it from billing and search. Past sales and stock history stay in reports.</p>
        <form action={removeProductAction.bind(null, slug, id)}>
          <button className="btn-quiet text-danger">Remove</button>
        </form>
      </section>
    </div>
  );
}
