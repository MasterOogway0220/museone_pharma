import type { Metadata } from "next";
import { Suspense } from "react";
import { SkeletonRows } from "@/components/skeleton";
import { requireTenant } from "@/lib/dal";
import { getSettings } from "@/lib/pos";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage({ params }: PageProps<"/t/[slug]/settings">) {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Settings</h1>
      <Suspense fallback={<SkeletonRows rows={6} />}>
        <Settings params={params} />
      </Suspense>
    </div>
  );
}

async function Settings({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenant(slug, { perm: "permSettings" });
  const s = await getSettings(tenant.id);
  return (
    <>
      <SettingsForm slug={slug} settings={{ ...s, gstin: tenant.gstin }} />
      <p className="mt-8 text-sm text-muted">
        Plan: <span className="capitalize">{tenant.plan}</span>, paid until <span className="font-mono">{tenant.paidUntil}</span>.
      </p>
    </>
  );
}
