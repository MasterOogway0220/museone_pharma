import "server-only";
import type { z } from "zod";
import { ConflictError, NotFoundError } from "@/lib/catalog";
import { ReadOnlyError, requireTenant, type Perm } from "@/lib/dal";
import { fieldErrors } from "@/lib/validation";

export type FormState = { errors?: Record<string, string>; ok?: boolean; id?: string };

type Ctx = Awaited<ReturnType<typeof requireTenant>>;

// Auth + permission + validation + known-error mapping for every tenant form action.
export async function tenantAction<S extends z.ZodType>(
  slug: string,
  perm: Perm | undefined,
  schema: S,
  form: FormData,
  fn: (ctx: Ctx, data: z.infer<S>) => Promise<string | void>,
): Promise<FormState> {
  const ctx = await requireTenant(slug, { write: true, perm });
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  try {
    const id = await fn(ctx, parsed.data);
    return { ok: true, id: id ?? undefined };
  } catch (e) {
    if (e instanceof NotFoundError || e instanceof ConflictError || e instanceof ReadOnlyError) {
      return { errors: { form: e.message } };
    }
    throw e;
  }
}
