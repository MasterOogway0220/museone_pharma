import type { Metadata } from "next";
import { Suspense } from "react";
import { SkeletonRows } from "@/components/skeleton";
import { requireTenant } from "@/lib/dal";
import { listStaff } from "@/lib/staff";
import { AddStaffForm, EditStaffForm } from "./staff-forms";

export const metadata: Metadata = { title: "Staff", robots: { index: false } };

export default function StaffPage({ params }: PageProps<"/t/[slug]/users">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Staff</h1>
      <Suspense fallback={<SkeletonRows rows={6} />}>
        <Staff params={params} />
      </Suspense>
    </>
  );
}

async function Staff({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant, user } = await requireTenant(slug, { perm: "permUsers" });
  const staff = await listStaff(tenant.id);
  const prefix = `${tenant.slug}.`;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <ul className="space-y-4">
        {staff.map((s) => (
          <li key={s.id} className="rounded-ui border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
              <span className="font-medium">{s.name}</span>
              <span className="font-mono text-sm text-muted">{s.username?.replace(prefix, "")}</span>
              <span className="text-sm capitalize text-muted">{s.role}</span>
              {s.disabled && <span className="text-sm font-medium text-danger">Disabled</span>}
            </div>
            {s.role === "owner" ? (
              <p className="text-sm text-muted">The owner has full access. Contact MuseOne support to change the owner.</p>
            ) : s.id === user.id ? (
              <p className="text-sm text-muted">This is you.</p>
            ) : (
              <EditStaffForm slug={slug} staff={s} />
            )}
          </li>
        ))}
      </ul>
      <section className="h-fit rounded-ui border border-border bg-surface p-4">
        <h2 className="mb-4 font-semibold">Add staff</h2>
        <AddStaffForm slug={slug} />
      </section>
    </div>
  );
}
