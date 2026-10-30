import { expect, test, type Page } from "@playwright/test";
import { ADMIN, CUSTOMER, login, logout, prepare } from "./helpers";

// The whole buying path in one serial story: cart, offline cart, checkout, the order page, then the admin side
// (event log, cancelling the test order so stock goes back).
test.describe.configure({ mode: "serial" });

let orderNumber = "";

async function openInStockProduct(page: Page) {
  await page.goto("/en/shop/hoodies");
  await page.locator('main a[href*="/product/"]').first().click();
  await expect(page).toHaveURL(/\/product\//);
  const add = page.getByRole("button", { name: /add to cart|pre-order/i });
  await expect(add).toBeEnabled();
  return add;
}

async function emptyCart(page: Page) {
  await page.goto("/en/cart");
  for (let i = 0; i < 10; i++) {
    const remove = page.getByRole("button", { name: "Remove" }).first();
    if (!(await remove.isVisible().catch(() => false))) break;
    await remove.click();
    await page.waitForTimeout(1500);
  }
}

test("customer adds to cart, checks out with cash on delivery, sees the delivery details", async ({ page }) => {
  const errors = await prepare(page);
  await login(page, CUSTOMER);
  await emptyCart(page);

  const add = await openInStockProduct(page);
  // The main photo is prioritised for a fast first paint.
  await expect(page.locator('main img[fetchpriority="high"]').first()).toBeVisible();
  await add.click();
  await expect(page.getByRole("button", { name: /added/i })).toBeVisible();

  await page.goto("/en/cart");
  await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(1);
  await page.goto("/en/checkout");
  await page.locator('input[name="city"]').fill("Zamalek");
  await page.locator('input[name="street"]').fill("26 July St");
  await page.locator('input[name="building"]').fill("12");
  const phone = page.locator('input[name="phone"]');
  if (!(await phone.inputValue())) await phone.fill("+20 100 123 4567");
  await page.locator('input[name="methodChoice"][value="cod"]').check();
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/orders\/SKR-[A-Z0-9]+\?placed=1/, { timeout: 45_000 });
  orderNumber = page.url().match(/SKR-[A-Z0-9]+/)![0];
  await expect(page.getByText("Delivery details")).toBeVisible();
  await expect(page.getByText("26 July St, #12")).toBeVisible();
  await expect(page.getByText(/Expected/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("offline add-to-cart is kept and synced when the connection returns", async ({ page, context }) => {
  await prepare(page);
  await login(page, CUSTOMER);
  await emptyCart(page);
  const add = await openInStockProduct(page);
  await context.setOffline(true);
  await add.click();
  await expect(page.getByText(/You're offline/)).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("sakr-offline-cart"))).toContain("slug");
  await context.setOffline(false);
  await page.evaluate(() => dispatchEvent(new Event("online")));
  await expect(page.getByText(/added offline are now in your cart/)).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => localStorage.getItem("sakr-offline-cart"))).toBeNull();
  await page.goto("/en/cart");
  await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(1);
  await emptyCart(page);
});

test("product page streams live stock over SSE", async ({ request }) => {
  const res = await request.get("/en/shop/hoodies");
  const slug = (await res.text()).match(/\/en\/product\/([a-z0-9-]+)/)![1];
  const page = await fetch(`${test.info().project.use.baseURL}/api/stream/${slug}`);
  expect(page.headers.get("content-type")).toContain("text/event-stream");
  const reader = page.body!.getReader();
  const first = new TextDecoder().decode((await reader.read()).value);
  await reader.cancel();
  expect(first).toMatch(/^data: \{"stock":\[/);
});

test("admin sees the order in the event log and cancels it", async ({ page }) => {
  test.skip(!orderNumber, "needs the order from the first test");
  await prepare(page);
  await logout(page);
  await login(page, ADMIN, "/en/admin");
  await page.goto(`/en/admin/events?o=${orderNumber}`);
  await expect(page.getByText("order.placed")).toBeVisible();

  page.on("dialog", (d) => d.accept());
  await page.goto(`/en/admin/orders/${orderNumber}`);
  await page.getByRole("button", { name: "Reject & cancel" }).click();
  await expect(page.getByText("Cancelled").first()).toBeVisible({ timeout: 20_000 });
  await page.goto(`/en/admin/events?o=${orderNumber}`);
  await expect(page.getByText("order.cancelled")).toBeVisible();
});
