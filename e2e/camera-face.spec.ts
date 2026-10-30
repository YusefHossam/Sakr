import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { fakeCamera, feed } from "./camera-feeds";
import { prepare } from "./helpers";

// AR try-on: face landmarks from the live camera place sunglasses or a cap on the face.
test.use(fakeCamera("face.y4m"));

for (const type of ["sunglasses", "headwear"] as const) {
  test(`AR puts ${type} on a live face`, async ({ page }) => {
    test.skip(!existsSync(feed("face.y4m")), "camera feed not generated");
    test.setTimeout(150_000);
    const errors = await prepare(page);
    await page.goto(`/en/shop/accessories?type=${type}`);
    await page.locator('main a[href*="/product/"]').first().click();
    await page.getByRole("button", { name: /Try the (sunglasses|cap) on \(AR\)/ }).click();
    await expect(page.getByText("Look at the camera")).toBeVisible({ timeout: 90_000 });
    const canvas = page.getByLabel("Camera preview");
    await expect(canvas).toHaveAttribute("data-face", "tracked", { timeout: 30_000 });
    // The canvas really shows the camera picture, not a blank frame.
    const brightness = await canvas.evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      let n = 0;
      for (let i = 0; i < d.length; i += 400, n++) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
      return sum / n;
    });
    expect(brightness).toBeGreaterThan(20);
    await canvas.screenshot({ path: `test-results/ar-${type}.png` });
    expect(errors).toEqual([]);
  });
}
