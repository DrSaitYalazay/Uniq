import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load env vars BEFORE config is read so tests + webServer see them.
// .env has VITE_SUPABASE_* (auto-managed); .env.e2e.local has E2E_EMAIL/PASSWORD.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.e2e.local"), override: true });

/**
 * Playwright E2E configuration for UniqSuite.
 *
 * Required env vars (set in shell or .env.e2e.local — NEVER commit):
 *   E2E_EMAIL     — test user email
 *   E2E_PASSWORD  — test user password (min 12 chars)
 *
 * The first run creates the user automatically via Supabase signUp;
 * subsequent runs reuse it.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:8080",
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Allow override (e.g. when running in a sandbox where the auto-downloaded
        // chromium is missing system libs and a Nix-provided one is on disk).
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
          : undefined,
      },
    },
  ],
});
