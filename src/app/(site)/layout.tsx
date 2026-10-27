import Link from "next/link";
import { site } from "@/data/site";

// Public site chrome: header, footer and the phone-only sticky call to action.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-ui focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2 rounded-ui font-semibold underline-offset-4 hover:underline">
            <svg viewBox="0 0 64 64" className="size-7" aria-hidden="true">
              <rect width="64" height="64" rx="12" fill="var(--brand)" />
              <path d="M26 14h12v12h12v12H38v12H26V38H14V26h12z" fill="var(--background)" />
            </svg>
            {site.name}
          </Link>
          <nav aria-label="Site" className="flex items-center gap-1 text-sm sm:gap-4">
            <Link href="/#pricing" className="link-quiet hidden sm:inline">
              Pricing
            </Link>
            <Link href="/#faq" className="link-quiet hidden sm:inline">
              Questions
            </Link>
            <Link href="/sign-in" className="link-quiet">
              Sign in
            </Link>
            <Link href="/#demo" className="btn-cta hidden px-4 py-2 md:inline-flex">
              Book a demo
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{site.name}</p>
            <p>Billing and stock for chemists in Mumbai.</p>
            {site.contactAddress && <address className="not-italic">{site.contactAddress}</address>}
          </div>
          <nav aria-label="Legal" className="flex gap-4">
            <Link href="/terms" className="link-quiet">
              Terms of Service
            </Link>
            <Link href="/privacy" className="link-quiet">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 md:hidden">
        <Link href="/#demo" className="btn-cta w-full">
          Book a free demo
        </Link>
      </div>
    </div>
  );
}
