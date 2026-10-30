import { expect, test } from "@playwright/test";
import { feed } from "./camera-feeds";
import { CUSTOMER, login, prepare } from "./helpers";

// Fit Check sends one photo to the free Gemini tier and shows a score, the mood and pieces to complete the look.
// The free tier is sometimes overloaded; that answer is a clear "busy" message, which also counts as handled.
test("fit check rates an outfit photo", async ({ page }) => {
  test.setTimeout(150_000);
  const errors = await prepare(page);
  await login(page, CUSTOMER, "/en/fit-check");
  await page.goto("/en/fit-check");
  await page.getByLabel("Photo").setInputFiles(feed("body-3.jpg"));
  const main = page.locator("main");
  const outcome = main.getByText("Complete it with").or(main.getByRole("alert"));
  await expect(outcome.first()).toBeVisible({ timeout: 120_000 });
  const alert = main.getByRole("alert");
  if (await alert.isVisible()) {
    const msg = await alert.innerText();
    test.info().annotations.push({ type: "gemini", description: msg });
    expect(msg).toMatch(/busy/i); // busy is fine; any other error is a real failure
  } else {
    await expect(main.getByText("Mood:")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
