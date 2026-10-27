import type { Metadata } from "next";
import { Suspense } from "react";
import { SkeletonRows } from "@/components/skeleton";
import { requireSuperAdmin } from "@/lib/dal";
import { extendPaidUntil, todayInIndia } from "@/lib/subscription";
import { CreateTenantForm } from "./create-tenant-form";

export const metadata: Metadata = { title: "Add pharmacy", robots: { index: false } };

export default function NewTenantPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Add pharmacy</h1>
      <Suspense fallback={<SkeletonRows rows={8} />}>
        <Guarded />
      </Suspense>
    </div>
  );
}

async function Guarded() {
  await requireSuperAdmin();
  // Default: one month trial.
  return <CreateTenantForm defaultPaidUntil={extendPaidUntil(todayInIndia(), 1)} />;
}
