import { expect, test } from "vitest";
import { istRange, toCsv } from "./report-utils";

test("istRange covers whole India days", () => {
  const { start, end } = istRange("2026-10-27", "2026-10-27");
  expect(start.toISOString()).toBe("2026-10-26T18:30:00.000Z");
  expect(end.toISOString()).toBe("2026-10-27T18:30:00.000Z");
});

test("toCsv quotes, escapes and neutralises formulas but keeps negative numbers", () => {
  const csv = toCsv([{ a: 'He said "hi", ok', b: "=HYPERLINK(1)", c: -5, d: "-12.50", e: null }]);
  expect(csv).toBe('a,b,c,d,e\r\n"He said ""hi"", ok",\'=HYPERLINK(1),-5,-12.50,');
});
