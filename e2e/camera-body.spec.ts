import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { fakeCamera, feed } from "./camera-feeds";
import { prepare } from "./helpers";

// Size finder: pose detection + body segmentation turn a full-body photo into measurements and sizes.
test.use(fakeCamera("body.y4m"));

test("size finder measures a body from an uploaded photo @phone", async ({ page }) => {
  test.setTimeout(150_000);
  await prepare(page);
  await page.goto("/en/size-finder");
  await page.locator('input[type="file"]').first().setInputFiles(feed("body-3.jpg"));
  await page.getByRole("button", { name: "Measure me" }).click();
  await expect(page.getByRole("heading", { name: "Your measurements" })).toBeVisible({ timeout: 120_000 });
  for (const k of ["Shoulders", "Chest", "Waist", "Tops", "Bottoms"]) await expect(page.locator("main").getByText(k, { exact: true }).first()).toBeVisible();
  // Plausible human numbers even though the model holds his arms out in an open jacket.
  const text = await page.locator("main").innerText();
  const cm = (label: string) => Number(text.match(new RegExp(`${label}\\s+(\\d+)\\s?cm`, "i"))?.[1]);
  expect(cm("Chest")).toBeGreaterThan(78);
  expect(cm("Chest")).toBeLessThan(130);
  expect(cm("Waist")).toBeGreaterThan(60);
  expect(cm("Waist")).toBeLessThan(120);
});

test("size finder captures from the live camera and measures", async ({ page }) => {
  test.skip(!existsSync(feed("body.y4m")), "camera feed not generated");
  test.setTimeout(150_000);
  await prepare(page);
  await page.goto("/en/size-finder");
  await page.getByRole("button", { name: "Use camera" }).first().click();
  const video = page.locator("main video").first();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState >= 2 && v.videoWidth > 0), { timeout: 20_000 }).toBe(true);
  await page.getByRole("button", { name: "Capture" }).click();
  // 3-2-1 countdown, then the frame becomes the photo.
  await expect(page.locator('main img[alt="Front photo"]')).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Measure me" }).click();
  await expect(page.getByRole("heading", { name: "Your measurements" })).toBeVisible({ timeout: 120_000 });
});
