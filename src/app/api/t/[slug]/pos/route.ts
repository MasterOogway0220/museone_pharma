import { apiTenant } from "@/lib/dal";
import { posData } from "@/lib/pos";

// Till catalog + bill settings. The till caches this for offline billing.
export async function GET(_: Request, { params }: RouteContext<"/api/t/[slug]/pos">) {
  const ctx = await apiTenant((await params).slug);
  if (ctx instanceof Response) return ctx;
  const data = await posData(ctx.tenant);
  return Response.json(
    { ...data, user: { id: ctx.user.id, name: ctx.user.name }, readOnly: ctx.access === "readonly" },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
