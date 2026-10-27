import { expect, test } from "@playwright/test";
import { adminLogin, createPharmacy, run, staffLogin } from "./helpers";

test("super admin creates pharmacies; staff are kept inside their own pharmacy", async ({ page, browser }) => {
  const a = `pa-${run}`;
  const b = `pb-${run}`;
  await adminLogin(page);
  await createPharmacy(page, a);
  await createPharmacy(page, b);

  // Same username "owner" in two pharmacies is allowed.
  const staff = await browser.newPage();
  await staffLogin(staff, a);

  // Owner of A opening B's billing page sees "No access", never B's data.
  // The HTTP status stays 200: the page streams, so headers are sent before the check runs.
  await staff.goto(`/t/${b}`);
  await expect(staff.getByRole("heading", { name: "No access" })).toBeVisible();
  await expect(staff.getByText(`Test ${b}`)).toHaveCount(0);

  // Staff cannot open the admin console.
  await staff.goto("/admin");
  await expect(staff.getByRole("heading", { name: "No access" })).toBeVisible();
});

test("wrong password is rejected with a generic message", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.SUPERADMIN_EMAIL!);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong login or password.")).toBeVisible();
});

// Replays of the same request are covered by src/lib/payments.db.test.ts.
test("recording a payment extends paid-until", async ({ page }) => {
  const slug = `pp-${run}`;
  await adminLogin(page);
  await createPharmacy(page, slug);
  const before = await page.locator("dt:text('Paid until') + dd").textContent();

  await page.getByLabel("Amount (₹)").fill("999");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByRole("status")).toBeVisible();

  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  const after = await page.locator("dt:text('Paid until') + dd").textContent();
  expect(after).not.toBe(before);
});

test("suspending a pharmacy signs its staff out", async ({ page, browser }) => {
  const slug = `ps-${run}`;
  await adminLogin(page);
  await createPharmacy(page, slug);
  const staff = await browser.newPage();
  await staffLogin(staff, slug);

  await page.getByRole("button", { name: "Suspend" }).click();
  await expect(page.getByRole("heading", { name: "Pharmacy is suspended" })).toBeVisible();

  await staff.reload();
  await expect(staff.getByRole("heading", { name: "Sign in", exact: false }).or(staff.getByLabel("Username"))).toBeVisible();
});
