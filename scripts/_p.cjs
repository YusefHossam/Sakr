const fs = require("fs");
const f = "e2e/camera-body.spec.ts";
let s = fs.readFileSync(f, "utf8");
const a = `  expect(await page.locator("main").innerText()).toMatch(/\b\d{2,3}\s?cm\b/i);`;
if (!s.includes(a)) throw new Error("anchor");
s = s.replace(a, () => `  // Plausible human numbers even though the model holds his arms out in an open jacket.
  const text = await page.locator("main").innerText();
  const cm = (label: string) => Number(text.match(new RegExp(label + "\\s+(\\d+)\\s?cm", "i"))?.[1]);
  expect(cm("Chest")).toBeGreaterThan(78);
  expect(cm("Chest")).toBeLessThan(130);
  expect(cm("Waist")).toBeGreaterThan(60);
  expect(cm("Waist")).toBeLessThan(120);`);
fs.writeFileSync(f, s);
