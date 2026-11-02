import { expect, test } from "@playwright/test";
import { ADMIN, CUSTOMER, login, prepare } from "./helpers";

// The owner signs in with a username, customers with an email; the old test admin is no longer an admin.
test("owner signs in with the username and reaches the admin panel", async ({ page }) => {
  expect(ADMIN.email, "ADMIN_USERNAME must be set in .env.local").not.toBe("");
  await prepare(page);
  await login(page, ADMIN, "/en/admin");
  await page.goto("/en/admin");
  await expect(page.locator("main h1").first()).toBeVisible();
  await expect(page).toHaveURL(/\/en\/admin/);
});

test("wrong admin password is refused", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/login");
  const form = page.locator("main form").filter({ has: page.locator('input[name="password"]') });
  await form.locator('input[name="email"]').fill(ADMIN.email);
  await form.locator('input[name="password"]').fill("not-the-password");
  await form.locator('button[type="submit"]').click();
  await expect(page.getByRole("alert").filter({ hasText: /.+/ }).first()).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("customers still sign in with an email, and cannot open the admin panel", async ({ page }) => {
  await prepare(page);
  await login(page, CUSTOMER);
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("the admin can also sign in with the second password", async ({ page }) => {
  const second = process.env.ADMIN_PASSWORD_2;
  test.skip(!second, "ADMIN_PASSWORD_2 is not set");
  await prepare(page);
  await login(page, { email: ADMIN.email, password: second! }, "/en/admin");
  await page.goto("/en/admin");
  await expect(page.locator("main h1").first()).toBeVisible();
});

test("the second admin password does not work for a customer account", async ({ page }) => {
  const second = process.env.ADMIN_PASSWORD_2;
  test.skip(!second, "ADMIN_PASSWORD_2 is not set");
  await prepare(page);
  await page.goto("/en/login");
  const form = page.locator("main form").filter({ has: page.locator('input[name="password"]') });
  await form.locator('input[name="email"]').fill(CUSTOMER.email);
  await form.locator('input[name="password"]').fill(second!);
  await form.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/login/);
});
