"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/tenant-action";

type State = FormState & { values?: Record<string, string>; okCount?: number };

// React resets a form after its action runs. Keep what the user typed (minus passwords)
// so a validation error doesn't wipe the form; `v(name, initial)` gives the defaultValue.
export function useFormAction(action: (s: FormState, f: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState<State, FormData>(async (prev, form) => {
    const res = await action(prev, form);
    // okCount changes on each success; use it as a key to clear an add form.
    if (res.ok) return { ...res, okCount: (prev.okCount ?? 0) + 1 };
    const values = Object.fromEntries(
      [...form].filter(([k, val]) => typeof val === "string" && !/password/i.test(k)),
    ) as Record<string, string>;
    return { ...res, values, okCount: prev.okCount };
  }, {});
  const e = state.errors ?? {};
  const v = (name: string, initial?: string | number | null) => state.values?.[name] ?? (initial == null ? undefined : String(initial));
  return { state, formAction, pending, e, v, okKey: state.okCount ?? 0 };
}
