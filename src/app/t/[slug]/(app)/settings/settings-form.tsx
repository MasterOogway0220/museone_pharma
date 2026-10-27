"use client";

import { saveSettingsAction } from "../admin-actions";
import { Field } from "@/components/field";
import { useFormAction } from "@/components/use-form-action";

type Settings = { address: string; phone: string; drugLicence: string; gstin: string | null; footer: string; defaultDiscountPct: string };

export function SettingsForm({ slug, settings }: { slug: string; settings: Settings }) {
  const { state, formAction, pending, e, v } = useFormAction(saveSettingsAction.bind(null, slug));
  return (
    <form action={formAction} className="space-y-4">
      <Field label="Address on bill" name="address" defaultValue={v("address", settings.address)} error={e.address} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone on bill" name="phone" defaultValue={v("phone", settings.phone)} error={e.phone} />
        <Field label="GSTIN" name="gstin" defaultValue={v("gstin", settings.gstin)} error={e.gstin} />
        <Field
          label="Drug licence no."
          name="drugLicence"
          defaultValue={v("drugLicence", settings.drugLicence)}
          error={e.drugLicence}
          hint="Form 20/21 numbers, printed on every bill."
        />
        <Field
          label="Default discount %"
          name="defaultDiscountPct"
          type="number"
          min="0"
          max="100"
          step="0.5"
          defaultValue={v("defaultDiscountPct", Number(settings.defaultDiscountPct))}
          error={e.defaultDiscountPct}
        />
      </div>
      <Field label="Bill footer" name="footer" defaultValue={v("footer", settings.footer)} error={e.footer} />
      <div className="flex items-center gap-4">
        <button className="btn" disabled={pending}>
          {pending ? "Saving" : "Save settings"}
        </button>
        {state.ok && (
          <p role="status" className="text-sm text-brand">
            Saved. Tills pick this up when they refresh products.
          </p>
        )}
        {e.form && <p className="text-sm text-danger">{e.form}</p>}
      </div>
    </form>
  );
}
