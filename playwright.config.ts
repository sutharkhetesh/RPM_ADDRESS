import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  globalSetup: "./tests/browser/setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3107",
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
