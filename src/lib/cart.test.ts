import { expect, test } from "vitest";
import { buildSaleLines, deductSold, needsPrescription, priceLines, type CartProduct } from "./cart";

const today = "2026-10-27";
const crocin: CartProduct = {
  id: "p1",
  name: "Crocin",
  price: "32.00",
  mrp: "34.50",
  gstRate: 12,
  hsn: "3004",
  schedule: "none",
  trackStock: true,
  batches: [
    { batch: "B2", expiry: "2028-06-30", qty: 6 },
    { batch: "B1", expiry: "2027-12-31", qty: 3 },
  ],
};
const h1: CartProduct = { ...crocin, id: "p2", schedule: "H1", trackStock: false, batches: [] };
const products = new Map([crocin, h1].map((p) => [p.id, p]));

test("a cart item over two batches becomes two bill lines, earliest expiry first", () => {
  const lines = buildSaleLines([{ productId: "p1", qty: 5 }], products, today);
  expect(lines).toEqual([
    { productId: "p1", batch: "B1", expiry: "2027-12-31", qty: 3, price: 32 },
    { productId: "p1", batch: "B2", expiry: "2028-06-30", qty: 2, price: 32 },
  ]);
  expect(priceLines(lines, products, 0).totals.netPaise).toBe(16000);
});

test("untracked items sell without a batch", () => {
  expect(buildSaleLines([{ productId: "p2", qty: 1 }], products, today)).toEqual([
    { productId: "p2", batch: "", expiry: null, qty: 1, price: 32 },
  ]);
});

test("deductSold lowers the till's stock copy per batch", () => {
  const lines = buildSaleLines([{ productId: "p1", qty: 5 }], products, today);
  const [after] = deductSold([crocin], lines);
  expect(after.batches).toEqual([
    { batch: "B2", expiry: "2028-06-30", qty: 4 },
    { batch: "B1", expiry: "2027-12-31", qty: 0 },
  ]);
});

test("H1 in cart needs the register details", () => {
  expect(needsPrescription([{ productId: "p2", qty: 1 }], products).register).toBe(true);
  expect(needsPrescription([{ productId: "p1", qty: 1 }], products).register).toBe(false);
});
