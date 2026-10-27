import { expect, test } from "vitest";
import { daysToExpire, expiryStatus, stockStatus } from "./stock";

// Ported from PharmaSpot getStockStatus: 0 none, -1 low, 1 ok.
test("stockStatus", () => {
  expect(stockStatus(0, 5)).toBe("out");
  expect(stockStatus(-2, 5)).toBe("out");
  expect(stockStatus(5, 5)).toBe("low");
  expect(stockStatus(6, 5)).toBe("ok");
});

test("daysToExpire is 0 on or after expiry day", () => {
  expect(daysToExpire("2026-11-26", "2026-10-27")).toBe(30);
  expect(daysToExpire("2026-10-27", "2026-10-27")).toBe(0);
  expect(daysToExpire("2026-10-01", "2026-10-27")).toBe(0);
});

test("expiryStatus: expired, near (90 days, the usual return window), ok", () => {
  expect(expiryStatus("2026-10-27", "2026-10-27")).toBe("expired");
  expect(expiryStatus("2027-01-25", "2026-10-27")).toBe("near");
  expect(expiryStatus("2027-01-26", "2026-10-27")).toBe("ok");
  expect(expiryStatus(null, "2026-10-27")).toBe("ok");
});
