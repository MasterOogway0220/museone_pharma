import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { deleteCustomerAction } from "../../catalog-actions";
import { SkeletonRows } from "@/components/skeleton";
import { requireTenant } from "@/lib/dal";
import { CustomerForm } from "../customer-form";

export const metadata: Metadata = { title: "Customer", robots: { index: false } };

export default function CustomerPage({ params }: PageProps<"/t/[slug]/customers/[id]">) {
  return (
    <div className="max-w-2xl">
      <Suspense fallback={<SkeletonRows rows={5} />}>
        <CustomerDetail params={params} />
      </Suspense>
    </div>
  );
}

async function CustomerDetail({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { tenant } = await requireTenant(slug);
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(and(eq(schema.customers.tenantId, tenant.id), eq(schema.customers.id, id)));
  if (!customer) notFound();
  return (
    <div className="space-y-8">
      <div>
        <Link href={`/t/${slug}/customers`} className="text-sm text-muted hover:text-foreground">
          All customers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{customer.name}</h1>
      </div>
      <CustomerForm slug={slug} id={id} customer={customer} />
      <form action={deleteCustomerAction.bind(null, slug, id)}>
        <button className="text-sm text-danger hover:underline">Delete customer</button>
      </form>
    </div>
  );
}
