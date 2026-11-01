import { expect, test, type Page } from "@playwright/test";
import { CUSTOMER, login, prepare } from "./helpers";

// No dead ends: every internal link on the main pages (signed in, both languages) must not answer 404.
const START = [
  "/ar", "/en", "/ar/account", "/en/account", "/ar/u/buyer_test", "/ar/duel", "/ar/crew", "/ar/live", "/ar/wall",
  "/ar/fits/drip", "/ar/fits/clean", "/ar/fits/opium", "/ar/fits/old-money", "/ar/fits/streetwear", "/ar/fits/casual",
  "/ar/moods/drip", "/ar/shop", "/ar/shop/tees", "/ar/shop/shoes", "/ar/shop/accessories", "/ar/search?q=%D9%87%D9%88%D8%AF%D9%8A",
  "/ar/cart", "/ar/track", "/ar/stylist", "/ar/size-finder", "/ar/fit-builder", "/ar/fit-check", "/ar/mystery-box", "/ar/status", "/ar/design-system",
];

async function internalLinks(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? "")
      .filter((h) => h.startsWith("/") && !h.startsWith("//") && !h.startsWith("/api/")),
  );
}

test("no internal link answers 404", async ({ page }) => {
  test.setTimeout(900_000);
  await prepare(page);
  await login(page, CUSTOMER);

  const found = new Map<string, string>(); // link -> page it was found on
  for (const path of START) {
    const res = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(res?.status(), `start page ${path}`).not.toBe(404);
    await page.waitForTimeout(1200); // let streamed sections arrive
    for (const href of await internalLinks(page)) if (!found.has(href)) found.set(href, path);
  }

  // Product pages are thousands of near-identical routes: check a sample of them, every other link fully.
  const products = [...found.keys()].filter((h) => h.includes("/product/"));
  const others = [...found.keys()].filter((h) => !h.includes("/product/"));
  const links = [...others, ...products.slice(0, 40)];
  const broken: string[] = [];
  for (const href of links) {
    const res = await page.goto(href, { waitUntil: "domcontentloaded" });
    // Streamed pages can render the 404 page under a 200, so look at what is on screen too.
    const shows404 = await page.locator("main p", { hasText: /^404$/ }).first().isVisible({ timeout: 2500 }).catch(() => false);
    if (res?.status() === 404 || shows404) broken.push(`${href}  (on ${found.get(href)})`);
  }
  console.log(`checked ${links.length} links from ${START.length} pages`);
  expect(broken, `broken links:\n${broken.join("\n")}`).toEqual([]);
});
