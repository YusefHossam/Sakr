import { expect, test } from "@playwright/test";
import { prepare } from "./helpers";

// Light and dark mode: the switch flips the page, and the choice survives a reload with no flash of the other theme.
test("light mode switch is applied and remembered", async ({ page }) => {
  await prepare(page);
  await page.goto("/en/shop/tees", { waitUntil: "domcontentloaded" });
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await bg()).toBe("rgb(0, 0, 0)");

  await page.getByRole("button", { name: "Light mode" }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await bg()).toBe("rgb(246, 245, 242)");

  // Applied by the head script before paint on the next load.
  await page.reload({ waitUntil: "commit" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Dark mode" }).first().click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "light");
  expect(await bg()).toBe("rgb(0, 0, 0)");
});
