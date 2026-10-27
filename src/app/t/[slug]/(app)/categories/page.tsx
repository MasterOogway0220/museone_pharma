import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteCategoryAction } from "../catalog-actions";
import { SkeletonRows } from "@/components/skeleton";
import { listCategories } from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";
import { CategoryForm } from "./category-forms";

export const metadata: Metadata = { title: "Categories", robots: { index: false } };

export default function CategoriesPage({ params }: PageProps<"/t/[slug]/categories">) {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>
      <Suspense fallback={<SkeletonRows />}>
        <Categories params={params} />
      </Suspense>
    </div>
  );
}

async function Categories({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenant(slug, { perm: "permCategories" });
  const categories = await listCategories(tenant.id);
  return (
    <>
      <div className="mb-6">
        <CategoryForm slug={slug} id={null} />
      </div>
      {categories.length === 0 ? (
        <p className="text-muted">No categories yet. They help you find medicines faster when billing.</p>
      ) : (
        <ul className="rounded-ui border border-border bg-surface">
          {categories.map((c) => (
            <li key={c.id} className="flex items-start gap-2 border-b border-border p-3 last:border-0">
              <CategoryForm slug={slug} id={c.id} name={c.name} />
              <form action={deleteCategoryAction.bind(null, slug)}>
                <input type="hidden" name="id" value={c.id} />
                <button className="px-2 py-2 text-sm text-danger hover:underline" aria-label={`Delete ${c.name}`}>
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
