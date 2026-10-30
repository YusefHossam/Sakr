import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against a running build. Start one first:
//   npm run build && npx next start --port 3200
// Then: npm run test:e2e   (BASE_URL overrides the address, e.g. a deployed preview)
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // the tests share one test customer and one cart
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3200",
    channel: process.env.PW_CHANNEL ?? "msedge", // uses the installed browser, no download needed
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Edge"], channel: process.env.PW_CHANNEL ?? "msedge" } },
    { name: "phone", use: { ...devices["Pixel 7"], channel: process.env.PW_CHANNEL ?? "msedge" }, grep: /@phone/ },
  ],
});
