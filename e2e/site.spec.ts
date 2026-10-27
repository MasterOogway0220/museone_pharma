import { expect, test } from "@playwright/test";
import { adminLogin, run } from "./helpers";

test("demo request: validation, thank-you page, visible to super admin", async ({ page }) => {
  const pharmacy = `Shree Ganesh Medicals ${run}`;
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every bill right");
  await page.getByLabel("Your name").fill("Mahesh Patil");
  await page.getByLabel("Mobile").fill("12345");
  await page.getByLabel("Pharmacy name").fill(pharmacy);
  await page.getByLabel("Area").fill("Borivali West");
  await page.getByRole("button", { name: "Book my free demo" }).click();
  await expect(page.getByText("Enter a 10 digit mobile number.")).toBeVisible();
  await expect(page.getByLabel("Pharmacy name")).toHaveValue(pharmacy);

  await page.getByLabel("Mobile").fill("98200 54321");
  await page.getByRole("button", { name: "Book my free demo" }).click();
  await expect(page.getByRole("heading", { name: "Thank you. We'll call you." })).toBeVisible();

  await adminLogin(page);
  await page.goto("/admin/leads");
  await expect(page.getByText(pharmacy)).toBeVisible();
});

test("pharmacy sign-in forwards to that pharmacy's login", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Pharmacy link").fill("https://museonepharma.com/t/sai-medical");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/t\/sai-medical\/login$/);
});
