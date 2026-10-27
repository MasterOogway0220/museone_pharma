import type { ExpiryStatus, StockStatus } from "@/lib/stock";

const base = "inline-block rounded-ui border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function StockBadge({ status, qty }: { status: StockStatus; qty: number }) {
  if (status === "out") return <span className={`${base} border-danger/50 text-danger`}>Out of stock</span>;
  if (status === "low") return <span className={`${base} border-warning/50 text-warning`}>Low: {qty}</span>;
  return <span className="font-mono text-sm">{qty}</span>;
}

export function ExpiryBadge({ status, date }: { status: ExpiryStatus; date: string | null }) {
  if (!date) return <span className="text-muted">None</span>;
  const label = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  if (status === "expired") return <span className={`${base} border-danger/50 text-danger`}>Expired {label}</span>;
  if (status === "near") return <span className={`${base} border-warning/50 text-warning`}>{label}</span>;
  return <span className="font-mono text-sm">{label}</span>;
}
