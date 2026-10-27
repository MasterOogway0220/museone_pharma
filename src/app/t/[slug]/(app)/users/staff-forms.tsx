"use client";

import { createStaffAction, resetPasswordAction, updateStaffAction } from "../admin-actions";
import { Field } from "@/components/field";
import { useFormAction } from "@/components/use-form-action";

const PERMS = [
  ["permProducts", "Products and stock"],
  ["permCategories", "Categories"],
  ["permTransactions", "Reports, returns, exports"],
  ["permUsers", "Staff"],
  ["permSettings", "Settings"],
] as const;

type Staff = {
  id: string;
  role: string;
  disabled: boolean;
} & Record<(typeof PERMS)[number][0], boolean>;

function PermBoxes({ prefix, values }: { prefix: string; values: Partial<Record<(typeof PERMS)[number][0], boolean>> }) {
  return (
    <fieldset className="flex flex-wrap gap-x-5 gap-y-2">
      <legend className="label">Can manage</legend>
      {PERMS.map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={key} id={`${prefix}-${key}`} defaultChecked={!!values[key]} className="size-4 accent-brand" />
          {label}
        </label>
      ))}
    </fieldset>
  );
}

function RoleSelect({ id, value }: { id: string; value?: string }) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        Role
      </label>
      <select className="input" id={id} name="role" defaultValue={value ?? "cashier"}>
        <option value="cashier">Cashier</option>
        <option value="manager">Manager</option>
      </select>
    </div>
  );
}

export function AddStaffForm({ slug }: { slug: string }) {
  const { state, formAction, pending, e, v, okKey } = useFormAction(createStaffAction.bind(null, slug));
  return (
    <form action={formAction} key={okKey} className="space-y-4">
      <Field label="Full name" name="name" required defaultValue={v("name")} error={e.name} />
      <Field label="Username" name="username" required defaultValue={v("username")} error={e.username} hint="Used to sign in at this pharmacy's link." />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} error={e.password} />
      <RoleSelect id="new-role" value={v("role")} />
      <PermBoxes prefix="new" values={{}} />
      {e.form && <p className="text-sm text-danger">{e.form}</p>}
      <button className="btn" disabled={pending}>
        {pending ? "Adding" : "Add staff"}
      </button>
      {state.ok && (
        <p role="status" className="text-sm text-brand">
          Staff added. Share the username and password with them.
        </p>
      )}
    </form>
  );
}

export function EditStaffForm({ slug, staff }: { slug: string; staff: Staff }) {
  const update = useFormAction(updateStaffAction.bind(null, slug, staff.id));
  const reset = useFormAction(resetPasswordAction.bind(null, slug, staff.id));
  return (
    <div className="space-y-4">
      <form action={update.formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <RoleSelect id={`${staff.id}-role`} value={staff.role} />
          <label className="flex items-center gap-2 self-end py-2 text-sm">
            <input type="checkbox" name="disabled" defaultChecked={staff.disabled} className="size-4 accent-brand" />
            Disabled (cannot sign in)
          </label>
        </div>
        <PermBoxes prefix={staff.id} values={staff} />
        <div className="flex items-center gap-3">
          <button className="btn-quiet" disabled={update.pending}>
            Save access
          </button>
          {update.state.ok && <span className="text-sm text-brand">Saved.</span>}
          {update.e.form && <span className="text-sm text-danger">{update.e.form}</span>}
        </div>
      </form>
      <form action={reset.formAction} key={reset.okKey} className="flex flex-wrap items-start gap-2">
        <div className="min-w-56 flex-1">
          <input
            className="input"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="New password"
            aria-label="New password"
          />
          {reset.e.password && <p className="mt-1 text-sm text-danger">{reset.e.password}</p>}
        </div>
        <button className="btn-quiet" disabled={reset.pending}>
          Reset password
        </button>
        {reset.state.ok && <span className="py-2 text-sm text-brand">Password changed. They have been signed out.</span>}
      </form>
    </div>
  );
}
