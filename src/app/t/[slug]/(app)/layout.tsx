import { Suspense } from "react";
import { logout } from "@/app/auth-actions";
import { SkeletonRows } from "@/components/skeleton";
import { TenantNav } from "@/components/tenant-nav";
import { requireTenant } from "@/lib/dal";

export default function TenantAppLayout({ children, params }: LayoutProps<"/t/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl p-4">
          <SkeletonRows />
        </div>
      }
    >
      <Chrome params={params}>{children}</Chrome>
    </Suspense>
  );
}

async function Chrome({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const { user, tenant, access } = await requireTenant(slug);
  const base = `/t/${slug}`;
  const links = [
    { href: base, label: "Sell", show: true },
    { href: `${base}/sales`, label: "Sales", show: true },
    { href: `${base}/products`, label: "Products", show: user.permProducts },
    { href: `${base}/categories`, label: "Categories", show: user.permCategories },
    { href: `${base}/customers`, label: "Customers", show: true },
    { href: `${base}/reports`, label: "Reports", show: user.permTransactions },
    { href: `${base}/users`, label: "Staff", show: user.permUsers },
    { href: `${base}/settings`, label: "Settings", show: user.permSettings },
  ].filter((l) => l.show);

  return (
    <div className="flex flex-1 flex-col">
      {access === "readonly" && (
        <p role="alert" className="print:hidden border-b border-warning/40 bg-warning/10 px-4 py-2 text-center text-sm">
          Subscription ended on {tenant.paidUntil}. Billing is paused; you can still view records. Contact MuseOne to renew.
        </p>
      )}
      <header className="border-b border-border bg-surface print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2">
          <span className="font-semibold">{tenant.name}</span>
          <TenantNav links={links} />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">
              {user.name}, <span className="capitalize">{user.role}</span>
            </span>
            <form action={logout.bind(null, `${base}/login`)}>
              <button className="text-muted hover:text-foreground">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 print:p-0">{children}</main>
    </div>
  );
}
