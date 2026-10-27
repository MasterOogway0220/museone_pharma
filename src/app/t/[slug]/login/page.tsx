import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { loginStaff } from "@/app/auth-actions";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { getTenantBySlug } from "@/lib/dal";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function TenantLoginPage({ params }: PageProps<"/t/[slug]/login">) {
  return (
    <Suspense fallback={<div className="m-auto h-80 w-full max-w-sm animate-pulse rounded-ui bg-border/40" />}>
      <TenantLogin params={params} />
    </Suspense>
  );
}

async function TenantLogin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();
  return (
    <AuthShell title={tenant.name} subtitle="Sign in to start billing.">
      <LoginForm action={loginStaff.bind(null, tenant.slug)} idLabel="Username" idName="username" />
    </AuthShell>
  );
}
