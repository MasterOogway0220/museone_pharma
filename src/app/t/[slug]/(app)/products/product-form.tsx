"use client";

import { saveProductAction } from "../catalog-actions";
import { Field } from "@/components/field";
import { useFormAction } from "@/components/use-form-action";

type Product = {
  name: string;
  barcode: string;
  categoryId: string | null;
  hsn: string | null;
  gstRate: string;
  mrp: string;
  price: string;
  supplier: string | null;
  minStock: number;
  trackStock: boolean;
  schedule: string;
};

export function ProductForm({
  slug,
  id,
  product,
  categories,
}: {
  slug: string;
  id: string | null;
  product?: Product;
  categories: { id: string; name: string }[];
}) {
  const { state, formAction, pending, e, v } = useFormAction(saveProductAction.bind(null, slug, id));
  const p = product;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Medicine name" name="name" required defaultValue={v("name", p?.name)} error={e.name} autoFocus={!id} />
        <Field
          label="Barcode"
          name="barcode"
          required
          defaultValue={v("barcode", p?.barcode)}
          error={e.barcode}
          hint="Scan the pack, or type any code and print a label."
        />
        <div>
          <label className="label" htmlFor="categoryId">
            Category
          </label>
          <select className="input" id="categoryId" name="categoryId" defaultValue={v("categoryId", p?.categoryId) ?? ""}>
            <option value="">Uncategorised</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Field label="Supplier" name="supplier" defaultValue={v("supplier", p?.supplier)} error={e.supplier} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="MRP (₹)" name="mrp" type="number" step="0.01" min="0" required defaultValue={v("mrp", p?.mrp)} error={e.mrp} />
        <Field
          label="Selling price (₹)"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={v("price", p?.price)}
          error={e.price}
          hint="Including GST"
        />
        <div>
          <label className="label" htmlFor="gstRate">
            GST rate
          </label>
          <select className="input" id="gstRate" name="gstRate" defaultValue={v("gstRate", p ? String(Number(p.gstRate)) : "12")}>
            {["0", "5", "12", "18", "28"].map((r) => (
              <option key={r} value={r}>
                {r}%
              </option>
            ))}
          </select>
        </div>
        <Field label="HSN code" name="hsn" inputMode="numeric" defaultValue={v("hsn", p?.hsn)} error={e.hsn} hint="Medicines: usually 3004" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Low stock alert at"
          name="minStock"
          type="number"
          min="0"
          defaultValue={v("minStock", p?.minStock ?? 0)}
          error={e.minStock}
        />
        <div>
          <label className="label" htmlFor="schedule">
            Drug schedule
          </label>
          <select className="input" id="schedule" name="schedule" defaultValue={v("schedule", p?.schedule ?? "none")}>
            <option value="none">Not scheduled (OTC)</option>
            <option value="H">Schedule H</option>
            <option value="H1">Schedule H1 (register required)</option>
            <option value="X">Schedule X</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end py-2">
          <input
            type="checkbox"
            name="trackStock"
            defaultChecked={state.values ? state.values.trackStock === "on" : (p?.trackStock ?? true)}
            className="size-4 accent-brand"
          />
          Track stock for this item
        </label>
      </div>

      {e.form && (
        <p role="alert" className="text-sm text-danger">
          {e.form}
        </p>
      )}
      <div className="flex items-center gap-4">
        <button className="btn" disabled={pending}>
          {pending ? "Saving" : id ? "Save changes" : "Add product"}
        </button>
        {state.ok && id && (
          <p role="status" className="text-sm text-brand">
            Saved.
          </p>
        )}
      </div>
    </form>
  );
}
