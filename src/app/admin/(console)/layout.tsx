import Link from "next/link";
import { logout } from "@/app/auth-actions";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/admin" className="font-semibold text-brand">
            MuseOne Pharma <span className="font-normal text-muted">Admin</span>
          </Link>
          <nav className="ml-auto mr-6 flex gap-4 text-sm">
            <Link href="/admin" className="text-muted hover:text-foreground">
              Pharmacies
            </Link>
            <Link href="/admin/leads" className="text-muted hover:text-foreground">
              Demo requests
            </Link>
          </nav>
          <form action={logout.bind(null, "/admin/login")}>
            <button className="text-sm text-muted hover:text-foreground">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
