import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-sm font-semibold tracking-wide text-brand">MuseOne Pharma</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 mb-6 text-muted">{subtitle}</p>
        <div className="rounded-ui border border-border bg-surface p-6">{children}</div>
      </div>
    </main>
  );
}
