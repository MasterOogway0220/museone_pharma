"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TenantNav({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto text-sm">
      {links.map((l) => {
        const active = l.href === links[0].href ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-ui px-3 py-2 ${active ? "bg-brand text-brand-foreground" : "text-muted hover:text-foreground"}`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
