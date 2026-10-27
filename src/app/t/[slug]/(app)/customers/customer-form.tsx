"use client";

import { saveCustomerAction } from "../catalog-actions";
import { Field } from "@/components/field";
import { useFormAction } from "@/components/use-form-action";

type Customer = { name: string; phone: string | null; email: string | null; address: string | null };

export function CustomerForm({ slug, id, customer }: { slug: string; id: string | null; customer?: Customer }) {
  const { state, formAction, pending, e, v, okKey } = useFormAction(saveCustomerAction.bind(null, slug, id));
  // After adding, remount so the form clears.
  return (
    <form action={formAction} key={okKey} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" name="name" required defaultValue={v("name", customer?.name)} error={e.name} />
      <Field label="Mobile" name="phone" type="tel" defaultValue={v("phone", customer?.phone)} error={e.phone} />
      <Field label="Email" name="email" type="email" defaultValue={v("email", customer?.email)} error={e.email} />
      <Field label="Address" name="address" defaultValue={v("address", customer?.address)} error={e.address} />
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="btn" disabled={pending}>
          {pending ? "Saving" : id ? "Save changes" : "Add customer"}
        </button>
        {state.ok && !id && (
          <p role="status" className="text-sm text-brand">
            Customer added.
          </p>
        )}
        {e.form && <p className="text-sm text-danger">{e.form}</p>}
      </div>
    </form>
  );
}
