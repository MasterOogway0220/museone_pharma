import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ownerSession, staffLogin } from "./helpers";

async function sellOne(page: Page, slug: string) {
  await page.goto(`/t/${slug}/products/new`);
  await page.getByLabel("Medicine name").fill("Pan 40");
  await page.getByLabel("Barcode", { exact: true }).fill("8905555555555");
  await page.getByLabel("MRP (₹)").fill("112");
  await page.getByLabel("Selling price (₹)").fill("112");
  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByLabel("Batch no.").fill("P1");
  await page.getByLabel("Expiry").fill("2028-12-31");
  await page.getByLabel("Quantity").fill("10");
  await page.getByLabel("Cost per unit (₹)").fill("70");
  await page.getByRole("button", { name: "Add stock" }).click();
  await expect(page.getByText("Stock added.")).toBeVisible();

  await page.goto(`/t/${slug}`);
  await expect(page.getByText(/Till A\d\d/)).toBeVisible();
  await page.getByLabel("Scan barcode or search medicine").fill("8905555555555");
  await page.getByLabel("Scan barcode or search medicine").press("Enter");
  await page.getByRole("button", { name: "Pay (F9)" }).click();
  await page.getByRole("button", { name: "Complete and print" }).click();
  await expect(page.getByText(/saved/)).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => (window.print = () => {}));
});

test("settings on bill, sales history, return restores stock, reports and CSV", async ({ page }) => {
  const slug = await ownerSession(page, "bo");

  await page.goto(`/t/${slug}/settings`);
  await page.getByLabel("Address on bill").fill("Shop 4, Linking Road, Bandra West, Mumbai 400050");
  await page.getByLabel("Drug licence no.").fill("MH-MZ1-123456");
  await page.getByLabel("GSTIN").fill("27AAPFU0939F1ZV");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText("Saved. Tills pick this up")).toBeVisible();

  await sellOne(page, slug);

  await expect(async () => {
    await page.goto(`/t/${slug}/sales`);
    await expect(page.getByRole("link", { name: /A\d\d-00001/ })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
  await page.getByRole("link", { name: /A\d\d-00001/ }).click();
  await expect(page.getByText("DL No: MH-MZ1-123456")).toBeVisible();
  await expect(page.getByText("GSTIN: 27AAPFU0939F1ZV")).toBeVisible();

  await page.goto(`/t/${slug}/reports`);
  await expect(page.getByText("₹112.00").first()).toBeVisible();
  // Taxable 100.00 minus cost 70.00.
  await expect(page.getByText("₹30.00")).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download sales (CSV)" }).click();
  const csv = readFileSync(await (await download).path(), "utf8");
  expect(csv).toContain("Pan 40");
  expect(csv).toContain("100.00");

  await page.goto(`/t/${slug}/sales`);
  await page.getByRole("link", { name: /A\d\d-00001/ }).click();
  await page.getByRole("button", { name: "Return whole bill" }).click();
  await expect(page.getByText("RETURNED: CREDIT NOTE")).toBeVisible();
  await page.goto(`/t/${slug}/products?q=Pan`);
  await expect(page.getByRole("cell", { name: "10", exact: true })).toBeVisible();
});

test("owner adds a cashier without product access; disabling locks them out", async ({ page, browser }) => {
  const slug = await ownerSession(page, "staff");
  await page.goto(`/t/${slug}/users`);
  await page.getByLabel("Full name").fill("Kiran Jadhav");
  await page.getByLabel("Username").fill("kiran");
  await page.getByLabel("Password", { exact: true }).fill("kiran-pass-1");
  await page.getByRole("button", { name: "Add staff" }).click();
  await expect(page.getByText("Staff added.")).toBeVisible();

  const cashier = await browser.newPage();
  await staffLogin(cashier, slug, "kiran", "kiran-pass-1");
  await expect(cashier.getByRole("link", { name: "Products" })).toHaveCount(0);
  await cashier.goto(`/t/${slug}/products`);
  await expect(cashier.getByRole("heading", { name: "No access" })).toBeVisible();

  await page.reload();
  const card = page.locator("li", { hasText: "Kiran Jadhav" });
  await card.getByLabel("Disabled (cannot sign in)").check();
  await card.getByRole("button", { name: "Save access" }).click();
  await expect(card.getByText("Saved.")).toBeVisible();

  await cashier.goto(`/t/${slug}`);
  await expect(cashier.getByLabel("Username")).toBeVisible(); // signed out
  await cashier.getByLabel("Username").fill("kiran");
  await cashier.getByLabel("Password").fill("kiran-pass-1");
  await cashier.getByRole("button", { name: "Sign in" }).click();
  await expect(cashier.getByText("Wrong login or password.")).toBeVisible();
});
