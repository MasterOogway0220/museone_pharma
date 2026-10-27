import { expect, test } from "vitest";
import { allocateFefo } from "./fefo";

const today = "2026-10-27";
const batches = [
  { batch: "LATE", expiry: "2028-01-31", qty: 10 },
  { batch: "OLD", expiry: "2026-09-30", qty: 4 }, // expired
  { batch: "SOON", expiry: "2027-02-28", qty: 3 },
  { batch: "EMPTY", expiry: "2027-01-31", qty: 0 },
];

test("takes earliest-expiring usable batch first, skips expired and empty", () => {
  expect(allocateFefo(batches, 5, today)).toEqual([
    { batch: "SOON", expiry: "2027-02-28", qty: 3 },
    { batch: "LATE", expiry: "2028-01-31", qty: 2 },
  ]);
});

test("more than known stock: the rest goes on the last batch used", () => {
  expect(allocateFefo(batches, 15, today)).toEqual([
    { batch: "SOON", expiry: "2027-02-28", qty: 3 },
    { batch: "LATE", expiry: "2028-01-31", qty: 12 },
  ]);
});

test("no usable stock at all: one line with no batch", () => {
  expect(allocateFefo([], 2, today)).toEqual([{ batch: "", expiry: null, qty: 2 }]);
});
