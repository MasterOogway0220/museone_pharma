import "dotenv/config";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  workers: 1,
  // Own port so a dev server on 3000 (this or another project) is never tested by mistake.
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    env: { BETTER_AUTH_URL: "http://localhost:3100" },
    timeout: 120_000,
  },
});
