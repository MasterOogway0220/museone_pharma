"use client";

import { useActionState } from "react";
import type { LoginState } from "@/app/auth-actions";

export function LoginForm({
  action,
  idLabel,
  idName,
  idType = "text",
}: {
  action: (state: LoginState, form: FormData) => Promise<LoginState>;
  idLabel: string;
  idName: string;
  idType?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor={idName}>
          {idLabel}
        </label>
        <input className="input" id={idName} name={idName} type={idType} autoComplete="username" required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button className="btn w-full py-3" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
