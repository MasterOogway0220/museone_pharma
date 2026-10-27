import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function NotFound() {
  return (
    <AuthShell title="Page not found" subtitle="Check the link, or ask your pharmacy owner for the right one.">
      <Link href="/" className="btn-quiet w-full">
        Go to home
      </Link>
    </AuthShell>
  );
}
