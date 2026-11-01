import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

// Language and currency are two separate switches: changing one never changes the other.
test("currency and language switch independently @phone", async ({ page, isMobile }) => {
  await prepare(page);
  await page.goto("/ar/shop/tees", { waitUntil: "domcontentloaded" });
  // On phones both switches live in the side menu, which stays open while you use them.
  if (isMobile) await page.getByRole("button", { name: "افتح القايمة" }).click();

  // Pick US dollars while staying in Arabic.
  await page.getByRole("button", { name: /العملة/ }).first().click();
  await page.getByRole("option", { name: /USD/ }).click();
  await expect(page).toHaveURL(/\/ar\/shop\/tees/);
  await expect(page.getByRole("button", { name: /العملة: USD/ }).first()).toBeAttached();
  if (!isMobile) await expect(page.locator("main").getByText(/\$/).first()).toBeVisible();

  // Switch to English on the same page: still dollars.
  await page.getByRole("button", { name: "Switch to English" }).first().click();
  await expect(page).toHaveURL(/\/en\/shop\/tees/);
  expect(await page.evaluate(() => localStorage.getItem("sakr-currency"))).toBe("USD");
  await expect(page.locator("main").getByText(/\$/).first()).toBeAttached();
});
