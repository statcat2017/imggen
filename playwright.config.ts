import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
  webServer: {
    command: "npm run dev",
    port: 5173,
    timeout: 10000,
    reuseExistingServer: !process.env.CI,
  },
});
