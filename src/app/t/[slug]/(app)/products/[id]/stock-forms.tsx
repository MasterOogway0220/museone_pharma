"use client";

import { addStockAction, writeOffAction } from "../../catalog-actions";
import { Field } from "@/components/field";
import { useFormAction } from "@/components/use-form-action";

export function StockInForm({ slug, productId }: { slug: string; productId: string }) {
  const { state, formAction, pending, e, v } = useFormAction(addStockAction.bind(null, slug));
  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-5">
      <input type="hidden" name="productId" value={productId} />
      <Field label="Batch no." name="batch" required defaultValue={v("batch")} error={e.batch} />
      <Field label="Expiry" name="expiry" type="date" required defaultValue={v("expiry")} error={e.expiry} />
      <Field label="Quantity" name="qty" type="number" min="1" required defaultValue={v("qty")} error={e.qty} />
      <Field label="Cost per unit (₹)" name="unitCost" type="number" step="0.01" min="0" required defaultValue={v("unitCost")} error={e.unitCost} />
      <div className="flex items-end">
        <button className="btn w-full" disabled={pending}>
          {pending ? "Adding" : "Add stock"}
        </button>
      </div>
      {(state.ok || e.form) && (
        <p role={state.ok ? "status" : "alert"} className={`text-sm sm:col-span-5 ${state.ok ? "text-brand" : "text-danger"}`}>
          {state.ok ? "Stock added." : e.form}
        </p>
      )}
    </form>
  );
}

export function WriteOffButton({
  slug,
  productId,
  batch,
  expiry,
  qty,
}: {
  slug: string;
  productId: string;
  batch: string;
  expiry: string | null;
  qty: number;
}) {
  const { formAction, pending, e } = useFormAction(writeOffAction.bind(null, slug));
  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="batch" value={batch} />
      <input type="hidden" name="expiry" value={expiry ?? ""} />
      <input type="hidden" name="qty" value={qty} />
      <button className="text-sm text-danger hover:underline" disabled={pending}>
        {pending ? "Writing off" : `Write off ${qty}`}
      </button>
      {e.form && <span className="ml-2 text-sm text-danger">{e.form}</span>}
    </form>
  );
}
