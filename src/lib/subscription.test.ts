import { describe, expect, test } from "vitest";
import { accessLevel, extendPaidUntil, todayInIndia } from "./subscription";

describe("accessLevel", () => {
  const t = { suspended: false, paidUntil: "2026-10-31" };

  test("full access up to and including paid-until day", () => {
    expect(accessLevel(t, "2026-10-31")).toBe("full");
  });
  test("read-only for 7 days after expiry", () => {
    expect(accessLevel(t, "2026-11-01")).toBe("readonly");
    expect(accessLevel(t, "2026-11-07")).toBe("readonly");
  });
  test("blocked after grace", () => {
    expect(accessLevel(t, "2026-11-08")).toBe("blocked");
  });
  test("suspended is blocked even when paid", () => {
    expect(accessLevel({ ...t, suspended: true }, "2026-10-01")).toBe("blocked");
  });
});

describe("extendPaidUntil", () => {
  test("extends from current paid-until when still paid", () => {
    expect(extendPaidUntil("2026-10-31", 1, "2026-10-20")).toBe("2026-11-30");
  });
  test("extends from today when lapsed, so unpaid days are not given back", () => {
    expect(extendPaidUntil("2026-09-30", 12, "2026-10-27")).toBe("2027-10-27");
  });
  test("month end clamps instead of overflowing", () => {
    expect(extendPaidUntil("2026-01-31", 1, "2026-01-15")).toBe("2026-02-28");
  });
});

test("todayInIndia uses IST, not UTC", () => {
  // 20:00 UTC on Oct 27 is 01:30 IST on Oct 28.
  expect(todayInIndia(new Date("2026-10-27T20:00:00Z"))).toBe("2026-10-28");
});
