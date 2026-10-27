import type { Metadata } from "next";
import { Suspense } from "react";
import { SkeletonRows } from "@/components/skeleton";
import { listProducts } from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";
import { toPaise } from "@/lib/money";
import { LabelSheet } from "./label-sheet";

export const metadata: Metadata = { title: "Print labels", robots: { index: false } };

export default function LabelsPage({ params }: PageProps<"/t/[slug]/products/labels">) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold print:hidden">Print barcode labels</h1>
      <Suspense fallback={<SkeletonRows rows={8} />}>
        <Labels params={params} />
      </Suspense>
    </>
  );
}

async function Labels({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenant(slug, { perm: "permProducts" });
  const products = await listProducts(tenant.id);
  return (
    <LabelSheet items={products.map((p) => ({ id: p.id, name: p.name, barcode: p.barcode, mrpPaise: toPaise(p.mrp) }))} />
  );
}
