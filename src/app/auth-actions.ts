"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { staffUsername } from "@/lib/users";
import { usernameSchema } from "@/lib/validation";

export type LoginState = { error?: string };

const BAD_LOGIN = "Wrong login or password.";

export async function loginSuperAdmin(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  try {
    const res = await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
    if (res.user.role !== "superadmin") {
      await auth.api.signOut({ headers: await headers() });
      return { error: BAD_LOGIN };
    }
  } catch (e) {
    if (e instanceof APIError) return { error: BAD_LOGIN };
    throw e;
  }
  redirect("/admin");
}

export async function loginStaff(slug: string, _: LoginState, form: FormData): Promise<LoginState> {
  const parsed = usernameSchema.safeParse(form.get("username"));
  if (!parsed.success) return { error: BAD_LOGIN };
  try {
    const res = await auth.api.signInUsername({
      body: { username: staffUsername(slug, parsed.data), password: String(form.get("password") ?? "") },
      headers: await headers(),
    });
    if (res && "user" in res && (res.user as { disabled?: boolean }).disabled) {
      await auth.api.signOut({ headers: await headers() });
      return { error: BAD_LOGIN };
    }
  } catch (e) {
    if (e instanceof APIError) return { error: BAD_LOGIN };
    throw e;
  }
  redirect(`/t/${slug}`);
}

export async function logout(redirectTo: string) {
  await auth.api.signOut({ headers: await headers() });
  redirect(redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/");
}
