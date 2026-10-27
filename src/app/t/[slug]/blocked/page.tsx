import type { Metadata } from "next";
import { logout } from "@/app/auth-actions";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Access paused", robots: { index: false } };

export default function BlockedPage() {
  return (
    <AuthShell title="Access paused" subtitle="This pharmacy's subscription is not active.">
      <p className="mb-4">Your records are safe. Contact MuseOne Pharma to renew, and access comes back right away.</p>
      <form action={logout.bind(null, "/")}>
        <button className="btn-quiet w-full">Sign out</button>
      </form>
    </AuthShell>
  );
}
