import { type Page, expect } from "@playwright/test";

/**
 * Log in via the real Auth page so the browser obtains a Supabase session
 * matching the user we created node-side. The /auth page has stable input
 * ids (auth-email, auth-password).
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.waitForSelector("#auth-email", { timeout: 20_000 });
  await page.fill("#auth-email", email);
  await page.fill("#auth-password", password);
  await page.click("button[type=submit]");
  // After login the app redirects away from /auth.
  await expect(page).not.toHaveURL(/\/auth(\?|$)/, { timeout: 30_000 });
}
