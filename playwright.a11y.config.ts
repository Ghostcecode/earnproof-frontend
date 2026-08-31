import { defineConfig, devices } from "@playwright/test";

/**
 * Dedicated Playwright configuration for the accessibility suite
 * (e2e/accessibility). Kept separate from the general functional e2e
 * config (playwright.config.ts) because keyboard/focus assertions need a
 * single worker for deterministic timing, and separate from the visual
 * regression config (playwright.visual.config.ts) because it uses
 * different viewports and projects.
 */
const PORT = process.env.PLAYWRIGHT_PORT ?? "3100";
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e/accessibility",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  // A single Next.js server backs every worker; running specs one at a
  // time keeps focus/timing-sensitive keyboard assertions deterministic
  // instead of racing multiple browser contexts against one dev server.
  workers: 1,
  reporter: process.env.CI
    ? [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]]
    : "list",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      NEXT_PUBLIC_APP_URL: BASE_URL,
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:4000/api/v1",
      NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
      NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
    },
  },
});
