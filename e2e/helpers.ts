import { expect, type Page } from "@playwright/test";

// Runs against the dev database with unique slugs per run.
export const run = Date.now().toString(36);
const adminEmail = process.env.SUPERADMIN_EMAIL!;
const adminPassword = process.env.SUPERADMIN_PASSWORD!;

export async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Pharmacies" })).toBeVisible();
}

export async function createPharmacy(page: Page, slug: string) {
  await page.goto("/admin/tenants/new");
  await page.getByLabel("Pharmacy name").fill(`Test ${slug}`);
  await page.getByLabel("Link").fill(slug);
  await page.getByLabel("Owner name").fill("Ravi Shah");
  await page.getByLabel("Mobile").fill("+91 98200 12345");
  await page.getByLabel("Username").fill("owner");
  await page.getByLabel("Temporary password").fill("owner-pass-123");
  await page.getByRole("button", { name: "Create pharmacy" }).click();
  await expect(page.getByRole("heading", { name: `Test ${slug}` })).toBeVisible();
}

export async function staffLogin(page: Page, slug: string, username = "owner", password = "owner-pass-123") {
  await page.goto(`/t/${slug}/login`);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("link", { name: "Sell" })).toBeVisible();
}

// New pharmacy with its owner signed in on `page`.
export async function ownerSession(page: Page, prefix: string) {
  const slug = `${prefix}-${run}`;
  const admin = await page.context().browser()!.newPage();
  await adminLogin(admin);
  await createPharmacy(admin, slug);
  await admin.close();
  await staffLogin(page, slug);
  return slug;
}
