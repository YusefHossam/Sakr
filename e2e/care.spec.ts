import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

// Jewellery and metal pieces carry a care and cleaning guide that matches their material.
test("a silver ring shows silver care steps", async ({ page }) => {
  await prepare(page);
  await page.goto("/ar/search?q=" + encodeURIComponent("خواتم كروم هارتس"));
  await page.locator('main a[href*="/product/"]').first().click();
  await page.getByRole("tab", { name: "العناية والتنضيف" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("قماشة تلميع فضة");
});

test("an iced watch shows watch and stone care", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/search?q=king+ice+watch");
  await page.locator('main a[href*="/product/"]').first().click();
  await page.getByRole("tab", { name: "Care & cleaning" }).click();
  const panel = page.getByRole("tabpanel");
  await expect(panel).toContainText("microfibre");
  await expect(panel).toContainText("stones");
});

test("clothing keeps the washing guide", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/shop/hoodies");
  await page.locator('main a[href*="/product/"]').first().click();
  await expect(page.getByRole("tab", { name: "Care & cleaning" })).toHaveCount(0);
});
