import type { Metadata } from "next";
import { loginSuperAdmin } from "@/app/auth-actions";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <AuthShell title="Admin sign in" subtitle="Manage pharmacies and subscriptions.">
      <LoginForm action={loginSuperAdmin} idLabel="Email" idName="email" idType="email" />
    </AuthShell>
  );
}
