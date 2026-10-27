"use client";

import { useActionState, useState } from "react";
import { recordPayment, type FormState } from "@/app/admin/actions";
import { Field } from "@/components/field";

export function PaymentForm({ tenantId }: { tenantId: string }) {
  // New key per successful payment; a double click resends the same key and is ignored.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, form) => {
    const res = await recordPayment(prev, form);
    if (res.ok) setRequestId(crypto.randomUUID());
    return res;
  }, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="tenantId" value={tenantId} />
      <Field label="Amount (₹)" name="amount" type="number" min="1" step="0.01" required error={e.amount} />
      <Field label="Months" name="months" type="number" min="1" max="36" defaultValue="1" required error={e.months} />
      <div>
        <label className="label" htmlFor="method">
          Method
        </label>
        <select className="input" id="method" name="method" defaultValue="upi">
          <option value="upi">UPI</option>
          <option value="bank">Bank transfer</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="other">Other</option>
        </select>
      </div>
      <Field label="Reference (UTR, cheque no.)" name="reference" error={e.reference} />
      <div className="flex items-center gap-4 sm:col-span-2">
        <button className="btn" disabled={pending}>
          {pending ? "Saving" : "Record payment"}
        </button>
        {state.ok && (
          <p role="status" className="text-sm text-brand">
            Payment recorded. Paid-until date extended.
          </p>
        )}
        {e.form && <p className="text-sm text-danger">{e.form}</p>}
      </div>
    </form>
  );
}
