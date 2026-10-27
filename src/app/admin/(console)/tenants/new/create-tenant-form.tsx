"use client";

import { useActionState } from "react";
import { createTenant, type FormState } from "@/app/admin/actions";
import { Field } from "@/components/field";

export function CreateTenantForm({ defaultPaidUntil }: { defaultPaidUntil: string }) {
  const [state, action, pending] = useActionState<FormState & { values?: Record<string, string> }, FormData>(
    async (prev, form) => ({
      ...(await createTenant(prev, form)),
      values: Object.fromEntries([...form].filter(([k]) => k !== "ownerPassword")) as Record<string, string>,
    }),
    {},
  );
  const e = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-8">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">Pharmacy</legend>
        <Field label="Pharmacy name" name="name" required defaultValue={v.name} error={e.name} />
        <Field
          label="Link"
          name="slug"
          required
          defaultValue={v.slug}
          error={e.slug}
          hint="Their billing link becomes /t/this-name"
        />
        <Field label="Owner name" name="ownerName" required defaultValue={v.ownerName} error={e.ownerName} />
        <Field label="Mobile" name="phone" type="tel" required defaultValue={v.phone} error={e.phone} />
        <Field label="City" name="city" required defaultValue={v.city ?? "Mumbai"} error={e.city} />
        <Field label="GSTIN (optional)" name="gstin" defaultValue={v.gstin} error={e.gstin} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">Subscription</legend>
        <div>
          <label className="label" htmlFor="plan">
            Plan
          </label>
          <select className="input" id="plan" name="plan" defaultValue={v.plan ?? "trial"}>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <Field
          label="Paid until"
          name="paidUntil"
          type="date"
          required
          defaultValue={v.paidUntil ?? defaultPaidUntil}
          error={e.paidUntil}
          hint="Read-only for 7 days after this date, then blocked."
        />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-lg font-semibold">Owner login</legend>
        <Field label="Username" name="ownerUsername" required defaultValue={v.ownerUsername} error={e.ownerUsername} />
        <Field
          label="Temporary password"
          name="ownerPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          error={e.ownerPassword}
        />
      </fieldset>

      {Object.keys(e).length > 0 && (
        <p role="alert" className="text-sm text-danger">
          Fix the highlighted fields.
        </p>
      )}
      <button className="btn" disabled={pending}>
        {pending ? "Creating" : "Create pharmacy"}
      </button>
    </form>
  );
}
