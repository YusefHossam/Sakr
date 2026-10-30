import { expect, type Page } from "@playwright/test";

// Local test accounts (docs/TEST_ACCOUNTS.md); override with env vars on other machines.
export const CUSTOMER = { email: process.env.E2E_CUSTOMER_EMAIL ?? "buyer.test@sakr.local", password: process.env.E2E_CUSTOMER_PASSWORD ?? "Test-ad4f1712" };
export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? "owner.test@sakr.local", password: process.env.E2E_ADMIN_PASSWORD ?? "Admin-e7cc5ead7b" };

/** Skips the ENTER intro and collects uncaught page errors so a test can assert there were none. */
export async function prepare(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("sakr-entered", "1");
    } catch {
      // storage blocked: the intro just shows
    }
  });
  return errors;
}

export async function login(page: Page, who: { email: string; password: string }, next = "/en/account") {
  await page.goto(`/en/login?next=${encodeURIComponent(next.replace(/^\/en/, ""))}`);
  // Scoped to the page form: the footer has its own email field (newsletter).
  const form = page.locator("main form").filter({ has: page.locator('input[name="password"]') });
  await form.locator('input[name="email"]').fill(who.email);
  await form.locator('input[name="password"]').fill(who.password);
  await form.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
