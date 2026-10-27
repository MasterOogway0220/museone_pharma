import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { slugSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your pharmacy's MuseOne billing, stock and reports using your pharmacy link.", alternates: { canonical: "/sign-in" } };

async function go(form: FormData) {
  "use server";
  // Accepts "sai-medical" or a pasted full link like https://.../t/sai-medical.
  const raw = String(form.get("pharmacy") ?? "").trim().replace(/^.*\/t\//, "").replace(/\/.*$/, "");
  const slug = slugSchema.safeParse(raw);
  redirect(slug.success ? `/t/${slug.data}/login` : "/sign-in?error=1");
}

export default function SignIn({ searchParams }: PageProps<"/sign-in">) {
  return (
    <section className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-3xl font-semibold tracking-[-0.02em]">Sign in to your pharmacy</h1>
      <p className="mt-3 text-muted">Type your pharmacy&apos;s link name, or paste the full link from your welcome message.</p>
      <Suspense fallback={<div className="mt-8 h-36 animate-pulse rounded-ui bg-border/40" />}>
        <PharmacyForm searchParams={searchParams} />
      </Suspense>
      <p className="mt-10 text-sm text-muted">
        MuseOne staff:{" "}
        <Link href="/admin/login" className="underline">
          admin sign in
        </Link>
      </p>
    </section>
  );
}

async function PharmacyForm({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const error = (await searchParams).error;
  return (
    <form action={go} className="mt-8 space-y-4">
      <div>
        <label className="label" htmlFor="pharmacy">
          Pharmacy link
        </label>
        <input className="input" id="pharmacy" name="pharmacy" required placeholder="sai-medical" autoComplete="off" aria-invalid={!!error} aria-describedby={error ? "pharmacy-error" : undefined} />
        {error && (
          <p id="pharmacy-error" className="mt-1 text-sm text-danger">
            That isn&apos;t a valid link name. Check your welcome message.
          </p>
        )}
      </div>
      <button className="btn-cta w-full">Continue</button>
    </form>
  );
}
