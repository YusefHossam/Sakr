import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

// Every public page renders, in both languages, without a crash or an uncaught error.
const PAGES = [
  "/en", "/ar", "/en/shop/hoodies", "/en/shop/accessories?type=chains", "/en/shop/shoes?type=clogs", "/en/shop/shoes?type=slippers", "/en/shop/shoes?type=loafers", "/en/shop/pants?type=jeans",
  "/en/brands/psd", "/en/brands/chrome-hearts", "/en/search?q=chrome+hearts", "/ar/search?q=%D9%87%D9%88%D8%AF%D9%8A",
  "/en/moods/drip", "/en/fits/clean", "/en/duel", "/en/crew", "/en/live", "/en/status", "/en/design-system", "/en/wall",
  "/en/stylist", "/en/size-finder", "/en/fit-builder", "/en/mystery-box", "/en/track", "/en/cart", "/ar/login",
];

for (const path of PAGES) {
  test(`renders ${path} @phone`, async ({ page }) => {
    const errors = await prepare(page);
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
    await page.waitForTimeout(800);
    expect(errors, `uncaught errors on ${path}`).toEqual([]);
  });
}

test("unknown product shows the 404 page", async ({ page }) => {
  await prepare(page);
  // The product page streams, so the status line is already sent when the lookup misses; the 404 page still renders.
  await page.goto("/en/product/does-not-exist-xyz");
  await expect(page.getByText("404")).toBeVisible();
});

test("footer: payment and social icons in brand colours", async ({ page }) => {
  await prepare(page);
  await page.goto("/en");
  const footer = page.locator("footer");
  for (const m of ["visa", "mastercard", "amex", "applepay", "googlepay", "paypal", "instapay", "vodafone", "fawry", "meeza", "cod"])
    await expect(footer.locator(`[aria-label="${m}"]`)).toHaveCount(1);
  for (const s of ["WhatsApp", "Instagram", "Snapchat", "TikTok", "X"]) await expect(footer.getByRole("link", { name: s, exact: true })).toBeVisible();
  // The WhatsApp mark is green, not grey.
  await expect(footer.getByRole("link", { name: "WhatsApp", exact: true }).locator('path[fill="#25D366"]')).toHaveCount(1);
});

test("custom cursor is the chrome bat, blood-red over links", async ({ page }) => {
  await prepare(page);
  await page.goto("/en");
  const body = decodeURIComponent(await page.evaluate(() => getComputedStyle(document.body).cursor));
  expect(body).toContain("M16 6 L17.5 3"); // the bat outline
  expect(body).toContain("#8c8c8c"); // chrome gradient
  const link = decodeURIComponent(await page.evaluate(() => getComputedStyle(document.querySelector("footer a")!).cursor));
  expect(link).toContain("#9b111e"); // blood-red chrome
});

test("desktop hero plays street footage after load", async ({ page }) => {
  await prepare(page);
  // Headless browsers report a "3g" connection, and the hero skips video on slow links; pretend to be on fast wifi.
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { effectiveType: "4g", saveData: false } }));
  await page.goto("/en");
  const video = page.locator("section video");
  await expect(video).toHaveCount(1, { timeout: 20_000 });
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.readyState >= 2), { timeout: 20_000 }).toBe(true);
});

test("phone hero skips the video and the poster wall @phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone only");
  await prepare(page);
  await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { effectiveType: "4g", saveData: false } }));
  await page.goto("/en");
  await page.waitForLoadState("load");
  await page.waitForTimeout(2500);
  await expect(page.locator("section video")).toHaveCount(0);
  await expect(page.locator("section img.h-\\[24vh\\]")).toHaveCount(0);
});

test("falcon scream and hero clips are served", async ({ request }) => {
  for (const url of ["/sfx/falcon.mp3", "/hero/2146.mp4", "/hero/47497.mp4"]) expect((await request.get(url)).status(), url).toBe(200);
});
