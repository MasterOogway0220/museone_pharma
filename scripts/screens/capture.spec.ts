// Captures real product screenshots for the landing page into public/screens/.
// Run: pnpm build && pnpm screens   (needs the docker MySQL and a seeded super admin)
import { expect, test, type Page } from "@playwright/test";
import { adminLogin, createPharmacy, staffLogin } from "../../e2e/helpers";

const slug = `sai-medical-${Date.now().toString(36)}`;
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

const CATEGORY: Record<string, string> = {
  "Dolo 650 Tablet": "Pain and fever",
  "Pan 40 Tablet": "Gastro",
  "Azithral 500 Tablet": "Antibiotics",
  "Shelcal 500 Tablet": "Supplements",
  "Telma 40 Tablet": "Cardiac",
  "Electral ORS Sachet": "Gastro",
};

const products = [
  { name: "Dolo 650 Tablet", barcode: "8901000000011", mrp: "33.60", price: "33.60", gst: "5", schedule: "none", stock: [["DL4521", day(500), "60"]] },
  { name: "Pan 40 Tablet", barcode: "8901000000028", mrp: "199.00", price: "189.00", gst: "5", schedule: "none", stock: [["PN2290", day(60), "8"], ["PN2361", day(420), "30"]] },
  { name: "Azithral 500 Tablet", barcode: "8901000000035", mrp: "119.50", price: "119.50", gst: "5", schedule: "H1", stock: [["AZ1187", day(300), "4"]] },
  { name: "Shelcal 500 Tablet", barcode: "8901000000042", mrp: "126.00", price: "120.00", gst: "5", schedule: "none", stock: [["SH3310", day(30), "15"]] },
  { name: "Telma 40 Tablet", barcode: "8901000000059", mrp: "249.00", price: "236.00", gst: "5", schedule: "H", stock: [["TL0921", day(700), "40"]] },
  { name: "Electral ORS Sachet", barcode: "8901000000066", mrp: "22.00", price: "22.00", gst: "5", schedule: "none", stock: [["EL7781", day(400), "3"]] },
] as const;

async function addProduct(page: Page, p: (typeof products)[number]) {
  await page.goto(`/t/${slug}/products/new`);
  await page.getByLabel("Medicine name").fill(p.name);
  await page.getByLabel("Barcode", { exact: true }).fill(p.barcode);
  await page.getByLabel("Category", { exact: true }).selectOption({ label: CATEGORY[p.name] });
  await page.getByLabel("MRP (₹)").fill(p.mrp);
  await page.getByLabel("Selling price (₹)").fill(p.price);
  await page.getByLabel("GST rate").selectOption(p.gst);
  await page.getByLabel("HSN code").fill("3004");
  await page.getByLabel("Low stock alert at").fill("10");
  await page.getByLabel("Drug schedule").selectOption(p.schedule);
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByRole("heading", { name: p.name })).toBeVisible();
  for (const [batch, expiry, qty] of p.stock) {
    await page.getByLabel("Batch no.").fill(batch);
    await page.getByLabel("Expiry").fill(expiry);
    await page.getByLabel("Quantity").fill(qty);
    await page.getByLabel("Cost per unit (₹)").fill((Number(p.price) * 0.72).toFixed(2));
    await page.getByRole("button", { name: "Add stock" }).click();
    await expect(page.getByText("Stock added.")).toBeVisible();
  }
}

// The app stretches <main> to the window height; shots should end where the content ends.
async function shrinkMain(page: Page) {
  await page.addStyleTag({ content: "main { flex: none !important; }" });
}

async function scan(page: Page, code: string) {
  await page.getByLabel("Scan barcode or search medicine").fill(code);
  await page.getByLabel("Scan barcode or search medicine").press("Enter");
}

test.use({ viewport: { width: 1366, height: 820 }, deviceScaleFactor: 1.5 });
test.setTimeout(180_000);

test("capture product screens", async ({ page, context }) => {
  await page.addInitScript(() => (window.print = () => {}));
  await adminLogin(page);
  await createPharmacy(page, slug);
  await staffLogin(page, slug);
  // Shown in the header of every screenshot.
  await page.goto(`/t/${slug}/settings`);
  await page.getByLabel("Address on bill").fill("12, Ranade Road, Dadar West, Mumbai 400028");
  await page.getByLabel("Drug licence no.").fill("MH-MZ2-20B/123456");
  await page.getByRole("button", { name: "Save settings" }).click();
  for (const name of new Set(Object.values(CATEGORY))) {
    await page.goto(`/t/${slug}/categories`);
    await page.getByLabel("New category name").fill(name);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByLabel(`Rename ${name}`)).toBeVisible();
  }
  for (const p of products) await addProduct(page, p);

  // A few bills for the reports screen.
  await page.goto(`/t/${slug}`);
  await expect(page.getByText(/Till A\d\d/)).toBeVisible();
  for (const codes of [["8901000000011", "8901000000011"], ["8901000000059"], ["8901000000028", "8901000000042"]]) {
    for (const c of codes) await scan(page, c);
    await page.getByRole("button", { name: "Pay (F9)" }).click();
    await page.getByRole("button", { name: "Complete and print" }).click();
    await expect(page.getByText(/saved/)).toBeVisible();
  }

  // Till mid-bill, with a Schedule H1 medicine and its register details.
  await scan(page, "8901000000011");
  await scan(page, "8901000000028");
  await scan(page, "8901000000035");
  await page.getByLabel("Customer name").fill("Sunita Desai");
  await page.getByLabel("Customer mobile").fill("9820012345");
  await page.getByLabel("Doctor name").fill("Dr. A. Kulkarni");
  await page.getByLabel("Patient name").fill("Sunita Desai");
  await page.getByLabel("Scan barcode or search medicine").focus();
  await page.waitForTimeout(400);
  await shrinkMain(page);
  await page.locator("main").screenshot({ path: "public/screens/till.png" });

  // Offline: bills keep going into the device's outbox.
  await page.getByRole("button", { name: "Clear" }).click();
  await context.setOffline(true);
  for (const c of ["8901000000066", "8901000000011"]) {
    await scan(page, c);
    await page.getByRole("button", { name: "Pay (F9)" }).click();
    await page.getByRole("button", { name: "Complete and print" }).click();
    await expect(page.getByText(/saved/)).toBeVisible();
  }
  await scan(page, "8901000000059");
  await page.waitForTimeout(400);
  await shrinkMain(page);
  await page.locator("main").screenshot({ path: "public/screens/offline.png" });
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("waiting to sync")).toHaveCount(0, { timeout: 20_000 });

  await page.goto(`/t/${slug}/products`);
  await shrinkMain(page);
  await page.locator("main").screenshot({ path: "public/screens/products.png" });

  await page.goto(`/t/${slug}/reports`);
  await expect(page.getByText("GST summary by rate")).toBeVisible();
  await shrinkMain(page);
  await page.locator("main").screenshot({ path: "public/screens/reports.png" });
});
