import { expect, test } from "@playwright/test";
import { ownerSession } from "./helpers";

test("owner sets up catalog: category, product, stock by batch, customer", async ({ page }) => {
  const slug = await ownerSession(page, "cat");

  await page.getByRole("link", { name: "Categories" }).click();
  await page.getByLabel("New category name").fill("Analgesics");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByLabel("Rename Analgesics")).toBeVisible();

  await page.getByRole("link", { name: "Products" }).click();
  await expect(page.getByText("No products yet")).toBeVisible();
  await page.getByRole("link", { name: "Add product" }).click();
  await page.getByLabel("Medicine name").fill("Crocin 650 Tablet");
  await page.getByLabel("Barcode", { exact: true }).fill("8901234567890");
  await page.getByLabel("Category", { exact: true }).selectOption({ label: "Analgesics" });
  await page.getByLabel("MRP (₹)").fill("34.50");
  await page.getByLabel("Selling price (₹)").fill("40");
  await page.getByLabel("HSN code").fill("3004");
  await page.getByLabel("Low stock alert at").fill("10");
  await page.getByRole("button", { name: "Add product" }).click();

  // Price above MRP is rejected, and typed values survive the error.
  await expect(page.getByText("Selling price cannot be above MRP.")).toBeVisible();
  await expect(page.getByLabel("Medicine name")).toHaveValue("Crocin 650 Tablet");
  await page.getByLabel("Selling price (₹)").fill("32");
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByRole("heading", { name: "Crocin 650 Tablet" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stock: 0" })).toBeVisible();

  // Two batches; stock is their sum, earliest expiry listed first.
  for (const [batch, expiry, qty] of [["B2", "2028-06-30", "6"], ["b1", "2027-12-31", "3"]]) {
    await page.getByLabel("Batch no.").fill(batch);
    await page.getByLabel("Expiry").fill(expiry);
    await page.getByLabel("Quantity").fill(qty);
    await page.getByLabel("Cost per unit (₹)").fill("22");
    await page.getByRole("button", { name: "Add stock" }).click();
    await expect(page.getByText("Stock added.")).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Stock: 9" })).toBeVisible();
  await expect(page.locator("tbody tr").first()).toContainText("B1");

  // 9 is below the alert level of 10: shows in the low-stock filter.
  await page.goto(`/t/${slug}/products?show=low`);
  await expect(page.getByText("Low: 9")).toBeVisible();
  await page.getByLabel("Search products").fill("8901234567890");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("link", { name: "Crocin 650 Tablet" })).toBeVisible();

  // Duplicate barcode is refused.
  await page.goto(`/t/${slug}/products/new`);
  await page.getByLabel("Medicine name").fill("Copy");
  await page.getByLabel("Barcode", { exact: true }).fill("8901234567890");
  await page.getByLabel("MRP (₹)").fill("10");
  await page.getByLabel("Selling price (₹)").fill("10");
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Another product already uses this barcode.")).toBeVisible();

  await page.getByRole("link", { name: "Customers" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Meena Patil");
  await page.getByLabel("Mobile").fill("9867012345");
  await page.getByRole("button", { name: "Add customer" }).click();
  await expect(page.getByRole("link", { name: "Meena Patil" })).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
});
