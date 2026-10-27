import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SkeletonRows } from "@/components/skeleton";
import { listCustomers } from "@/lib/catalog";
import { requireTenant } from "@/lib/dal";
import { CustomerForm } from "./customer-form";

export const metadata: Metadata = { title: "Customers", robots: { index: false } };

export default function CustomersPage({ params, searchParams }: PageProps<"/t/[slug]/customers">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Customers</h1>
      <Suspense fallback={<SkeletonRows rows={6} />}>
        <Customers params={params} searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Customers({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const { tenant } = await requireTenant(slug);
  const customers = await listCustomers(tenant.id, q);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
      <div>
        <form className="mb-4 flex gap-2" role="search">
          <input className="input" name="q" defaultValue={q} placeholder="Search name or mobile" aria-label="Search customers" />
          <button className="btn-quiet">Search</button>
        </form>
        {customers.length === 0 ? (
          <p className="rounded-ui border border-dashed border-border p-8 text-center text-muted">
            {q ? "No customer matches this search." : "No customers yet. Add regular customers to track their purchases."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-ui border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/t/${slug}/customers/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono">{c.phone ?? ""}</td>
                    <td className="px-4 py-3 text-muted">{c.address ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <section className="h-fit rounded-ui border border-border bg-surface p-4">
        <h2 className="mb-4 font-semibold">Add customer</h2>
        <CustomerForm slug={slug} id={null} />
      </section>
    </div>
  );
}
