import { z } from "zod";
import { apiTenant } from "@/lib/dal";
import { tillExists } from "@/lib/pos";
import { SaleRejected, recordSale } from "@/lib/sales";
import { saleSchema } from "@/lib/validation";

const bodySchema = z.object({ sales: z.array(z.unknown()).min(1).max(100) });

// Receives bills from a till, now or later from its offline outbox. Each sale is idempotent on its id.
// Per sale: ok, or rejected (permanent: the till shows it to the user and stops retrying).
export async function POST(req: Request, { params }: RouteContext<"/api/t/[slug]/sales">) {
  const ctx = await apiTenant((await params).slug, { write: true });
  if (ctx instanceof Response) return ctx;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Bad request" }, { status: 400 });

  const results = [];
  for (const raw of body.data.sales) {
    const parsed = saleSchema.safeParse(raw);
    const id = (raw as { id?: unknown })?.id;
    if (!parsed.success) {
      results.push({ id, ok: false, error: "Bill data is invalid." });
      continue;
    }
    if (!(await tillExists(ctx.tenant.id, parsed.data.tillCode))) {
      results.push({ id, ok: false, error: "Unknown till." });
      continue;
    }
    try {
      const r = await recordSale(ctx.tenant.id, ctx.user.id, parsed.data);
      results.push({ id, ok: true, invoiceNo: r.invoiceNo });
    } catch (e) {
      if (!(e instanceof SaleRejected)) throw e;
      results.push({ id, ok: false, error: e.message });
    }
  }
  return Response.json({ results });
}
