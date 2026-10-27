import Link from "next/link";

// shortcut: placeholder until Phase 7 builds the real landing page.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16">
      <p className="text-sm font-semibold tracking-wide text-brand">MuseOne Pharma</p>
      <h1 className="mt-4 text-4xl font-semibold">Billing, stock and expiry tracking for pharmacies.</h1>
      <p className="mt-4 text-lg text-muted">Pharmacy staff: open the link your owner shared with you.</p>
      <Link href="/admin/login" className="mt-8 text-sm text-muted underline">
        Admin sign in
      </Link>
    </main>
  );
}
