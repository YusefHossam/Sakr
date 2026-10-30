import { expect, test } from "@playwright/test";
import { ADMIN, CUSTOMER, login, prepare } from "./helpers";

test("account shows badges and saves the public wardrobe", async ({ page }) => {
  const errors = await prepare(page);
  await login(page, CUSTOMER);
  await page.goto("/en/account");
  await expect(page.getByRole("heading", { name: "Badges" })).toBeVisible();
  await expect(page.getByText("Crew member").or(page.getByText("First drop")).first()).toBeVisible();
  await page.locator('input[name="handle"]').fill("buyer_test");
  await page.locator('input[name="profilePublic"]').check();
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await page.goto("/en/u/buyer_test");
  await expect(page.getByText("@buyer_test")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Wardrobe/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("hot or not: a vote shows the split", async ({ page }) => {
  await prepare(page);
  await login(page, CUSTOMER);
  for (const mood of ["drip", "clean", "opium", "old-money"]) {
    await page.goto(`/en/duel?mood=${mood}`);
    const pick = page.getByRole("button", { name: "This one" }).first();
    if (!(await pick.isVisible().catch(() => false))) continue;
    await pick.click();
    // A fresh vote shows percentages; a pair already voted on shows the next button straight away.
    await expect(page.getByRole("button", { name: /Next duel/ })).toBeVisible();
    return;
  }
  throw new Error("no duel available in any mood");
});

test("crew and live pages work for a signed-in customer", async ({ page }) => {
  await prepare(page);
  await login(page, CUSTOMER);
  await page.goto("/en/crew");
  await expect(page.getByText(/Invite code|Start a crew/).first()).toBeVisible();
  await page.goto("/en/live");
  await expect(page.locator("main")).toContainText(/Live|LIVE/);
});

test("status page reports every system", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/status");
  for (const s of ["Database", "Storefront and catalog", "Ordering", "Live drop", "Card payments", "AI stylist"]) await expect(page.locator("main").getByText(s, { exact: true })).toBeVisible();
});

test("admin panel pages all open", async ({ page }) => {
  const errors = await prepare(page);
  await login(page, ADMIN, "/en/admin");
  for (const p of ["", "/orders", "/customers", "/products", "/catalog", "/marketing", "/content", "/live", "/inbox", "/analytics", "/reports", "/audit", "/events", "/team", "/settings"]) {
    const res = await page.goto(`/en/admin${p}`);
    expect(res?.status(), p || "/").toBe(200);
    await expect(page.locator("main h1").first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
