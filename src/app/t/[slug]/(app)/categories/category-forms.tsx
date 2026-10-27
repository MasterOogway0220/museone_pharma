"use client";

import { saveCategoryAction } from "../catalog-actions";
import { useFormAction } from "@/components/use-form-action";

export function CategoryForm({ slug, id, name }: { slug: string; id: string | null; name?: string }) {
  const { formAction, pending, e, v, okKey } = useFormAction(saveCategoryAction.bind(null, slug, id));
  const error = e.name ?? e.form;
  return (
    <form action={formAction} className="flex flex-1 items-start gap-2">
      <div className="flex-1">
        <input
          className="input"
          name="name"
          required
          aria-label={id ? `Rename ${name}` : "New category name"}
          placeholder={id ? undefined : "New category, e.g. Antibiotics"}
          defaultValue={v("name", name)}
          key={okKey}
          aria-invalid={!!error}
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>
      <button className={id ? "btn-quiet" : "btn"} disabled={pending}>
        {id ? "Rename" : "Add"}
      </button>
    </form>
  );
}
