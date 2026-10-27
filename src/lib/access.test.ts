import { expect, test } from "vitest";
import { tenantAccess } from "./access";

const tenantA = { id: "a", suspended: false, paidUntil: "2026-12-31" };
const today = "2026-10-27";

test("staff of tenant A can use tenant A", () => {
  expect(tenantAccess({ tenantId: "a", role: "cashier" }, tenantA, today)).toBe("full");
});

test("staff of tenant B cannot use tenant A", () => {
  expect(tenantAccess({ tenantId: "b", role: "owner" }, tenantA, today)).toBe("forbidden");
});

test("super admin has no tenant session; manages tenants from /admin only", () => {
  expect(tenantAccess({ tenantId: null, role: "superadmin" }, tenantA, today)).toBe("forbidden");
});

test("own tenant past grace is blocked", () => {
  expect(tenantAccess({ tenantId: "a", role: "owner" }, { ...tenantA, paidUntil: "2026-10-01" }, today)).toBe("blocked");
});
