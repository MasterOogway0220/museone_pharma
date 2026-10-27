import { expiryStatus } from "./stock";

export type BatchQty = { batch: string; expiry: string | null; qty: number };

// First-expiry-first-out. Expired and empty batches are never sold from.
// If the till's stock copy is short (e.g. offline), the rest goes on the last batch used;
// the ledger then shows that batch negative until stock is corrected.
export function allocateFefo(batches: BatchQty[], qty: number, today: string): BatchQty[] {
  const usable = batches
    .filter((b) => b.qty > 0 && expiryStatus(b.expiry, today) !== "expired")
    .sort((a, b) => (a.expiry ?? "9999").localeCompare(b.expiry ?? "9999"));
  const out: BatchQty[] = [];
  let left = qty;
  for (const b of usable) {
    if (left === 0) break;
    const take = Math.min(b.qty, left);
    out.push({ batch: b.batch, expiry: b.expiry, qty: take });
    left -= take;
  }
  if (left > 0) {
    if (out.length) out[out.length - 1].qty += left;
    else out.push({ batch: "", expiry: null, qty: left });
  }
  return out;
}
