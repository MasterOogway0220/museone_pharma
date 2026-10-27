import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SkeletonRows } from "@/components/skeleton";
import { listCategories } from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Add product", robots: { index: false } };

export default function NewProductPage({ params }: PageProps<"/t/[slug]/products/new">) {
  return (
    <div className="max-w-4xl">
      <Suspense fallback={<SkeletonRows rows={6} />}>
        <NewProduct params={params} />
      </Suspense>
    </div>
  );
}

async function NewProduct({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenant(slug, { perm: "permProducts" });
  const categories = await listCategories(tenant.id);
  return (
    <>
      <Link href={`/t/${slug}/products`} className="text-sm text-muted hover:text-foreground">
        All products
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Add product</h1>
      <ProductForm slug={slug} id={null} categories={categories} />
    </>
  );
}
