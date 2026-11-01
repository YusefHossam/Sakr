import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

// The shop is organised in seven sections; brands are not a way to browse any more.
const SECTIONS: [string, string][] = [
  ["tees", "Tees"], ["hoodies", "Hoodies & sweatshirts"], ["jackets", "Jackets"], ["pants", "Pants"],
  ["shorts", "Shorts"], ["shoes", "Shoes"], ["accessories", "Accessories"],
];

test("the menu shows the seven sections and no brands", async ({ page }) => {
  await prepare(page);
  await page.goto("/en");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const [, label] of SECTIONS) await expect(nav.getByRole("button", { name: label, exact: true })).toBeVisible();
  await expect(nav.getByRole("button", { name: "Brands" })).toHaveCount(0);
  // Opening a section lists its types, not brands.
  await nav.getByRole("button", { name: "Shoes", exact: true }).hover();
  await expect(page.getByRole("link", { name: "Crocs", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Loafers", exact: true })).toBeVisible();
});

for (const [slug, label] of SECTIONS) {
  test(`section page /shop/${slug} @phone`, async ({ page }) => {
    await prepare(page);
    await page.goto(`/en/shop/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(label);
    await expect(page.locator('main a[href*="/product/"]').first()).toBeVisible();
  });
}

test("a section type narrows the grid (Shoes → Crocs)", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/shop/shoes?type=clogs");
  const titles = await page.locator("main a[href*='/product/'] p.line-clamp-2").allTextContents();
  expect(titles.length).toBeGreaterThan(3);
  expect(titles.every((t) => /clog|crocs/i.test(t)), titles.slice(0, 6).join(" | ")).toBe(true);
});

test("old category and brand links still land somewhere sensible", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/shop/footwear");
  await expect(page).toHaveURL(/\/en\/shop\/shoes$/);
  await page.goto("/en/shop/crewnecks");
  await expect(page).toHaveURL(/\/en\/shop\/hoodies\?type=sweatshirts/);
  await page.goto("/en/brands/chrome-hearts");
  await expect(page).toHaveURL(/\/en\/search\?q=chrome/);
});

test("product breadcrumb goes to the section, brand is plain text", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/shop/hoodies");
  await page.locator('main a[href*="/product/"]').first().click();
  const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumbs.getByRole("link", { name: /Hoodies & sweatshirts/ })).toBeVisible();
  await expect(page.locator('a[href*="/brands/"]')).toHaveCount(0);
});

// Fits follow recipes: every fit names its formula and has 3 to 5 pieces.
for (const mood of ["drip", "clean", "opium", "old-money", "streetwear", "casual"]) {
  test(`fits for ${mood} follow a named formula`, async ({ page }) => {
    await prepare(page);
    await page.goto(`/en/fits/${mood}`);
    const fits = page.locator("main article");
    await expect(fits.first()).toBeVisible();
    const n = await fits.count();
    expect(n).toBeGreaterThan(2);
    for (let i = 0; i < n; i++) {
      const pieces = await fits.nth(i).locator("ul li a[href*='/product/']").count();
      expect(pieces).toBeGreaterThanOrEqual(3);
      expect(pieces).toBeLessThanOrEqual(5);
      await expect(fits.nth(i).locator("li.text-sm").first()).toContainText("+");
    }
  });
}
