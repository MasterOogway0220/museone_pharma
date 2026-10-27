import { allocateFefo } from "./fefo";
import { priceSale, toPaise } from "./money";

export type CartProduct = {
  id: string;
  name: string;
  price: string;
  mrp: string;
  gstRate: number;
  hsn: string | null;
  schedule: "none" | "H" | "H1" | "X";
  trackStock: boolean;
  batches: { batch: string; expiry: string | null; qty: number }[];
};

export type CartItem = { productId: string; qty: number };

export type SaleLine = { productId: string; batch: string; expiry: string | null; qty: number; price: number };

// One sale line per batch used, so the bill shows batch and expiry for every unit sold.
export function buildSaleLines(cart: CartItem[], products: Map<string, CartProduct>, today: string): SaleLine[] {
  return cart.flatMap((item) => {
    const p = products.get(item.productId);
    if (!p) return [];
    const parts = p.trackStock ? allocateFefo(p.batches, item.qty, today) : [{ batch: "", expiry: null, qty: item.qty }];
    return parts.map((b) => ({ productId: p.id, batch: b.batch, expiry: b.expiry, qty: b.qty, price: Number(p.price) }));
  });
}

export function priceLines(lines: SaleLine[], products: Map<string, CartProduct>, discountPct: number) {
  return priceSale(
    lines.map((l) => ({ pricePaise: toPaise(l.price), qty: l.qty, gstRate: products.get(l.productId)?.gstRate ?? 0 })),
    discountPct,
  );
}

// After a sale, take the sold quantities off the till's own stock copy so the next bill is right,
// even before the catalog is refreshed from the server.
export function deductSold(products: CartProduct[], lines: SaleLine[]): CartProduct[] {
  const sold = new Map<string, number>();
  for (const l of lines) sold.set(`${l.productId}|${l.batch}|${l.expiry}`, (sold.get(`${l.productId}|${l.batch}|${l.expiry}`) ?? 0) + l.qty);
  return products.map((p) => {
    if (!lines.some((l) => l.productId === p.id)) return p;
    const batches = p.batches.map((b) => ({ ...b, qty: b.qty - (sold.get(`${p.id}|${b.batch}|${b.expiry}`) ?? 0) }));
    return { ...p, batches };
  });
}

export function needsPrescription(cart: CartItem[], products: Map<string, CartProduct>) {
  const schedules = new Set(cart.map((i) => products.get(i.productId)?.schedule));
  return { register: schedules.has("H1") || schedules.has("X"), rx: schedules.has("H") };
}

export function inStock(p: CartProduct) {
  return p.batches.reduce((s, b) => s + b.qty, 0);
}
