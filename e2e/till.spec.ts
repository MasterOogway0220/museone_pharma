import { expect, test, type Page } from "@playwright/test";
import { ownerSession } from "./helpers";

async function addProduct(page: Page, slug: string, p: { name: string; barcode: string; price: string; schedule?: string; stock?: string }) {
  await page.goto(`/t/${slug}/products/new`);
  await page.getByLabel("Medicine name").fill(p.name);
  await page.getByLabel("Barcode", { exact: true }).fill(p.barcode);
  await page.getByLabel("MRP (₹)").fill(p.price);
  await page.getByLabel("Selling price (₹)").fill(p.price);
  if (p.schedule) await page.getByLabel("Drug schedule").selectOption(p.schedule);
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByRole("heading", { name: p.name })).toBeVisible();
  if (p.stock) {
    await page.getByLabel("Batch no.").fill("B1");
    await page.getByLabel("Expiry").fill("2028-12-31");
    await page.getByLabel("Quantity").fill(p.stock);
    await page.getByLabel("Cost per unit (₹)").fill("10");
    await page.getByRole("button", { name: "Add stock" }).click();
    await expect(page.getByText("Stock added.")).toBeVisible();
  }
}

async function openTill(page: Page, slug: string) {
  await page.goto(`/t/${slug}`);
  await expect(page.getByText(/Till A\d\d/)).toBeVisible();
}

async function scan(page: Page, code: string) {
  await page.getByLabel("Scan barcode or search medicine").fill(code);
  await page.getByLabel("Scan barcode or search medicine").press("Enter");
}

test.beforeEach(async ({ page }) => {
  // Record print calls instead of opening the print dialog.
  await page.addInitScript(() => {
    (window as unknown as { printed: number }).printed = 0;
    window.print = () => void ((window as unknown as { printed: number }).printed += 1);
  });
});

test("scan, pay cash with change, receipt printed, stock reduced", async ({ page }) => {
  const slug = await ownerSession(page, "till");
  await addProduct(page, slug, { name: "Dolo 650", barcode: "8901111111111", price: "33.60", stock: "20" });
  await openTill(page, slug);

  await scan(page, "8901111111111");
  await scan(page, "8901111111111");
  await expect(page.getByLabel("Quantity of Dolo 650")).toHaveValue("2");
  await expect(page.getByTestId("payable")).toHaveText("₹67.00"); // 67.20 rounded off

  await page.keyboard.press("F9");
  await page.getByLabel("Cash received (₹)").fill("100");
  await expect(page.getByText("Change: ₹33.00")).toBeVisible();
  await page.getByRole("button", { name: "Complete and print" }).click();

  await expect(page.getByText(/Bill A\d\d-00001 saved/)).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { printed: number }).printed)).toBe(1);
  await expect(page.getByText("waiting to sync")).toHaveCount(0, { timeout: 15_000 });

  // Sync runs in the background; poll the server-rendered stock.
  await expect(async () => {
    await page.goto(`/t/${slug}/products?q=Dolo`);
    await expect(page.getByRole("cell", { name: "18" })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
});

test("Schedule H1 medicine cannot be billed without doctor and patient", async ({ page }) => {
  const slug = await ownerSession(page, "h1");
  await addProduct(page, slug, { name: "Alprax 0.25", barcode: "8902222222222", price: "50", schedule: "H1", stock: "5" });
  await openTill(page, slug);
  await scan(page, "8902222222222");
  const pay = page.getByRole("button", { name: "Pay (F9)" });
  await expect(pay).toBeDisabled();
  await page.getByLabel("Doctor name").fill("Dr. Rao");
  await page.getByLabel("Patient name").fill("S. Kulkarni");
  await expect(pay).toBeEnabled();
});

test("hold a bill and resume it", async ({ page }) => {
  const slug = await ownerSession(page, "hold");
  await addProduct(page, slug, { name: "ORS Sachet", barcode: "8903333333333", price: "20", stock: "50" });
  await openTill(page, slug);
  await scan(page, "8903333333333");
  await page.getByLabel("Customer name").fill("Asha");
  await page.keyboard.press("F8");
  await expect(page.getByText("Held: Asha")).toBeVisible();
  await expect(page.getByText("Scan a medicine to start the bill.")).toBeVisible();

  await page.getByRole("button", { name: "Held bills" }).click();
  await page.getByRole("button", { name: "Asha" }).click();
  await expect(page.getByLabel("Quantity of ORS Sachet")).toHaveValue("1");
});

test("offline: three bills are kept on the device and sync when back online", async ({ page, context }) => {
  const slug = await ownerSession(page, "off");
  await addProduct(page, slug, { name: "Cetirizine", barcode: "8904444444444", price: "15", stock: "30" });
  await openTill(page, slug);

  await context.setOffline(true);
  for (let i = 0; i < 3; i++) {
    await scan(page, "8904444444444");
    await page.keyboard.press("F9");
    await page.locator("label", { hasText: /^upi$/i }).click();
    await page.getByRole("button", { name: "Complete and print" }).click();
    await expect(page.getByText(new RegExp(`Bill A\\d\\d-0000${i + 1} saved`))).toBeVisible();
  }
  await expect(page.getByText("3 bills waiting to sync")).toBeVisible();
  await expect(page.getByText("Offline: bills are saved on this device")).toBeVisible();

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("waiting to sync")).toHaveCount(0, { timeout: 20_000 });

  await expect(async () => {
    await page.goto(`/t/${slug}/products?q=Cetirizine`);
    await expect(page.getByRole("cell", { name: "27" })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });
});
