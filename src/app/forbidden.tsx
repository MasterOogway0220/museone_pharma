import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";

export default function Forbidden() {
  return (
    <AuthShell title="No access" subtitle="Your account cannot open this page.">
      <Link href="/" className="btn-quiet w-full">
        Go to home
      </Link>
    </AuthShell>
  );
}
