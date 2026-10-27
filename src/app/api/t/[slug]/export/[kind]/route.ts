import { readRange } from "@/components/date-range";
import { apiTenant } from "@/lib/dal";
import { h1Register, saleLinesForExport } from "@/lib/reports";
import { toCsv } from "@/lib/report-utils";
import { todayInIndia } from "@/lib/subscription";

// CSV downloads for accountants and inspectors. Allowed during read-only grace (export is how owners leave).
export async function GET(req: Request, { params }: RouteContext<"/api/t/[slug]/export/[kind]">) {
  const { slug, kind } = await params;
  if (kind !== "sales" && kind !== "h1") return new Response("Not found", { status: 404 });
  const ctx = await apiTenant(slug, { perm: "permTransactions" });
  if (ctx instanceof Response) return ctx;

  const { from, to } = readRange(Object.fromEntries(new URL(req.url).searchParams), todayInIndia());
  const rows = kind === "sales" ? await saleLinesForExport(ctx.tenant.id, from, to) : await h1Register(ctx.tenant.id, from, to);
  const name = `${slug}-${kind === "sales" ? "sales" : "schedule-h1-register"}-${from}-to-${to}.csv`;
  // BOM so Excel opens the file as UTF-8 (₹, Devanagari names).
  return new Response("﻿" + toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
