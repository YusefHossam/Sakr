import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

// The search understands Arabic, Franco and English, forgives typos, and suggests while you type.
const CASES: { q: string; brand?: string; section?: RegExp; product: RegExp }[] = [
  { q: "نضارات كروم هارت", brand: "Chrome Hearts", section: /نضارات|Sunglasses/, product: /glasses/i },
  { q: "kroom hartz nadara", brand: "Chrome Hearts", section: /Sunglasses|نضارات/, product: /glasses/i },
  { q: "sa3at casio", brand: "Casio", section: /Watches|ساعات/, product: /watch|g-shock/i },
  { q: "بوكسرات psd", brand: "PSD", section: /Boxers|بوكسرات/, product: /./ },
  { q: "hodie corteiz", brand: "Corteiz", section: /Hoodies|هوديز/, product: /./ },
  { q: "كروكس", brand: "Crocs", product: /clog|crocs/i },
  { q: "اسكارف lv", brand: "Louis Vuitton", section: /Scarves|سكارفات/, product: /scarf|stole|shawl|bandeau/i },
  { q: "شنط لويس فيتون", brand: "Louis Vuitton", section: /Bags|شنط/, product: /./ },
  { q: "بالمان", brand: "Balmain", product: /./ },
  { q: "اسكرفات", section: /Scarves|سكارفات/, product: /scarf|stole|shawl/i },
  { q: "ساعات الماظ", section: /Watches|ساعات/, product: /./ },
];

for (const c of CASES) {
  test(`suggests for "${c.q}"`, async ({ request }) => {
    const res = await request.get(`/api/search/suggest?q=${encodeURIComponent(c.q)}`);
    expect(res.ok()).toBe(true);
    const data = (await res.json()) as { brands: { name: string }[]; types: { label: { ar: string; en: string } }[]; products: { title: string }[] };
    if (c.brand) expect(data.brands.map((b) => b.name)).toContain(c.brand);
    if (c.section) expect(data.types.some((t) => c.section!.test(t.label.en) || c.section!.test(t.label.ar))).toBe(true);
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.products.some((p) => c.product.test(p.title))).toBe(true);
  });
}

test("typing shows the dropdown, Enter opens filtered results @phone", async ({ page }) => {
  await prepare(page);
  await page.goto("/ar/search");
  const box = page.getByRole("combobox");
  await box.fill("نضارات كروم هارت");
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(list.getByRole("option").first()).toBeVisible();
  await expect(list).toContainText("Chrome Hearts");
  await box.press("Enter");
  await expect(page).toHaveURL(/search\?q=/);
  const titles = page.locator('main a[href*="/product/"] p.line-clamp-2');
  await expect(titles.first()).toBeVisible();
  const first8 = (await titles.allTextContents()).slice(0, 8);
  expect(first8.every((t) => /glasses/i.test(t)), first8.join(" | ")).toBe(true);
});

test("arrow keys pick a suggestion", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/search");
  const box = page.getByRole("combobox");
  await box.fill("sa3at casio");
  await expect(page.getByRole("listbox")).toBeVisible();
  await box.press("ArrowDown");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=|\/product\/|\/shop\//);
});
