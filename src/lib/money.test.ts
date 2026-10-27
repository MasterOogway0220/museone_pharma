import { expect, test } from "vitest";
import { billTotals, formatINR, lineTotals, priceSale, toPaise } from "./money";

test("toPaise avoids float drift", () => {
  expect(toPaise("10.10")).toBe(1010);
  expect(toPaise(0.1 + 0.2)).toBe(30);
});

test("line with GST-inclusive price splits into taxable + CGST + SGST that add up exactly", () => {
  // 2 x ₹56.00 at 12%: gross 112.00, taxable 100.00, GST 12.00
  const l = lineTotals({ pricePaise: 5600, qty: 2, gstRate: 12, discountPaise: 0 });
  expect(l).toEqual({ grossPaise: 11200, taxablePaise: 10000, cgstPaise: 600, sgstPaise: 600, netPaise: 11200 });
});

test("odd paise GST: SGST takes the remainder so the parts always sum to net", () => {
  const l = lineTotals({ pricePaise: 1999, qty: 1, gstRate: 5, discountPaise: 0 });
  expect(l.taxablePaise + l.cgstPaise + l.sgstPaise).toBe(l.netPaise);
});

test("line discount reduces the GST-inclusive amount before the split", () => {
  const l = lineTotals({ pricePaise: 11200, qty: 1, gstRate: 12, discountPaise: 1120 });
  expect(l.netPaise).toBe(10080);
  expect(l.taxablePaise).toBe(9000);
});

test("bill totals sum lines and round off to the nearest rupee", () => {
  const t = billTotals([
    { pricePaise: 4550, qty: 1, gstRate: 12, discountPaise: 0 },
    { pricePaise: 1000, qty: 3, gstRate: 5, discountPaise: 0 },
  ]);
  expect(t.netPaise).toBe(7550);
  expect(t.roundOffPaise).toBe(50);
  expect(t.payablePaise).toBe(7600);
});

test("formatINR uses Indian grouping", () => {
  expect(formatINR(12345678)).toBe("₹1,23,456.78");
});

test("priceSale applies bill discount % per line and totals match the sum of lines", () => {
  const { lines, totals } = priceSale(
    [
      { pricePaise: 3200, qty: 2, gstRate: 12 },
      { pricePaise: 999, qty: 1, gstRate: 5 },
    ],
    10,
  );
  expect(lines[0].discountPaise).toBe(640);
  expect(lines[1].discountPaise).toBe(100);
  expect(totals.grossPaise).toBe(7399);
  expect(totals.netPaise).toBe(7399 - 740);
  expect(totals.taxablePaise + totals.cgstPaise + totals.sgstPaise).toBe(totals.netPaise);
  expect(totals.payablePaise % 100).toBe(0);
});
