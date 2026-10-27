import { expect, test } from "vitest";
import { gstinSchema, phoneSchema, slugSchema, usernameSchema } from "./validation";

test("phone accepts Indian formats and normalises to 10 digits", () => {
  expect(phoneSchema.parse("+91 98200 12345")).toBe("9820012345");
  expect(phoneSchema.parse("09820012345")).toBe("9820012345");
  expect(phoneSchema.safeParse("1234567890").success).toBe(false);
});

test("GSTIN format", () => {
  expect(gstinSchema.parse("27aapfu0939f1zv")).toBe("27AAPFU0939F1ZV");
  expect(gstinSchema.safeParse("27AAPFU0939F1Z").success).toBe(false);
});

test("slug and username reject separators that would break the login prefix", () => {
  expect(slugSchema.parse("Sunrise-Pharmacy")).toBe("sunrise-pharmacy");
  expect(slugSchema.safeParse("-bad").success).toBe(false);
  expect(usernameSchema.safeParse("ravi.k").success).toBe(false);
  expect(usernameSchema.parse("Ravi_K")).toBe("ravi_k");
});
