"use client";

import { useActionState } from "react";
import { requestDemo, type LeadState } from "@/app/lead-action";
import { Field } from "@/components/field";

export function DemoForm() {
  const [state, action, pending] = useActionState<LeadState & { values?: Record<string, string> }, FormData>(
    async (prev, form) => ({
      ...(await requestDemo(prev, form)),
      values: Object.fromEntries([...form].map(([k, v]) => [k, String(v)])),
    }),
    {},
  );
  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <Field label="Your name" name="name" autoComplete="name" required defaultValue={v.name} error={e.name} />
      <Field label="Mobile" name="phone" type="tel" autoComplete="tel" required defaultValue={v.phone} error={e.phone} />
      <Field label="Pharmacy name" name="pharmacy" autoComplete="organization" required defaultValue={v.pharmacy} error={e.pharmacy} />
      <Field label="Area" name="area" required placeholder="e.g. Dadar, Borivali" defaultValue={v.area} error={e.area} />
      <div>
        <label className="label" htmlFor="counters">
          Billing counters
        </label>
        <select className="input" id="counters" name="counters" defaultValue={v.counters ?? "1"}>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4 or more</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="message">
          Anything we should know? (optional)
        </label>
        <textarea className="input min-h-24" id="message" name="message" maxLength={500} defaultValue={v.message} placeholder="Software you use today, best time to call" />
      </div>
      {/* Honeypot for bots; hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {(e.form || Object.keys(e).length > 0) && (
        <p role="alert" className="text-sm text-danger sm:col-span-2">
          {e.form ?? "Please fix the fields marked above."}
        </p>
      )}
      <div className="sm:col-span-2">
        <button className="btn-cta w-full sm:w-auto" disabled={pending}>
          {pending ? "Sending" : "Book my free demo"}
        </button>
        <p className="mt-3 text-sm text-muted">We call you back within one working day to fix a time. Your number is used only for this.</p>
      </div>
    </form>
  );
}
