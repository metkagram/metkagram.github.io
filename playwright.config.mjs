import { defineConfig } from "@playwright/test";

// Keep local E2E unchanged; the deployment workflow can point the same suite at live Pages.
const productionBaseURL = process.env.METKAGRAM_PWA_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: { baseURL: productionBaseURL || "http://127.0.0.1:4173", trace: "retain-on-failure" },
  ...(productionBaseURL ? {} : { webServer: { command: "npm run dev", url: "http://127.0.0.1:4173", reuseExistingServer: true } }),
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } }
  ]
});
