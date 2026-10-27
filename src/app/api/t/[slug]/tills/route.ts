import { z } from "zod";
import { apiTenant } from "@/lib/dal";
import { registerTill } from "@/lib/pos";

const bodySchema = z.object({ name: z.string().trim().min(1).max(60) });

// A device registers once and keeps its code; it prefixes that device's invoice numbers.
export async function POST(req: Request, { params }: RouteContext<"/api/t/[slug]/tills">) {
  const ctx = await apiTenant((await params).slug, { write: true });
  if (ctx instanceof Response) return ctx;
  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Bad request" }, { status: 400 });
  return Response.json({ code: await registerTill(ctx.tenant.id, body.data.name) });
}
