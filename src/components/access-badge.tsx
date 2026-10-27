import type { AccessLevel } from "@/lib/subscription";

const STYLES: Record<AccessLevel, { label: string; className: string }> = {
  full: { label: "Active", className: "border-brand/40 text-brand" },
  readonly: { label: "Grace period", className: "border-warning/50 text-warning" },
  blocked: { label: "Blocked", className: "border-danger/50 text-danger" },
};

export function AccessBadge({ level, suspended }: { level: AccessLevel; suspended?: boolean }) {
  const s = STYLES[level];
  return (
    <span className={`inline-block rounded-ui border px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {suspended ? "Suspended" : s.label}
    </span>
  );
}
