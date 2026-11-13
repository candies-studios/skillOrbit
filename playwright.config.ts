import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a production build (`npm run build` first).
 * Set PLAYWRIGHT_CHROME_PATH to use a system Chrome instead of
 * `npx playwright install chromium`.
 */
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3200", trace: "retain-on-failure", launchOptions },
  webServer: {
    command: "npx next start -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile", use: { ...devices["Pixel 7"], launchOptions } },
  ],
});
