/**
 * End-to-end guarantee: a demo reload never wipes user input.
 *
 * What this test does:
 *   1. Sign in (or create + sign in) a dedicated E2E user via Supabase.
 *   2. Pre-seed user_tool_data with realistic user fixtures across every
 *      pipeline step that has a user input point:
 *        - Step 2  Betroffenheit         (tool_key: betroffenheit)
 *        - Step 6  NIS2-Check            (tool_key: nis2-check)
 *        - Step 8  Risk Matrix           (tool_key: nis2-risk-matrix)
 *        - Step 9  Treatment             (tool_key: nis2-treatment-engine)
 *        - Step 10 SoA                   (tool_key: soa)
 *        - Step 12 Execution             (tool_key: nis2-execution-actions)
 *        - Step 14 Policies              (tool_key: policies)
 *        - Training                      (tool_key: training)
 *   3. Open the app, navigate to /context, click "Demo-Daten laden (DE)".
 *   4. Wait for the success toast.
 *   5. Re-read every tool_key from the cloud and assert that every user
 *      field still has its user-set value (merge contract enforced by
 *      mergeDemoWithUser).
 */
import { test, expect } from "@playwright/test";
import { ensureTestUser, readToolData, writeToolData, cloud } from "./helpers/cloud";
import { loginViaUI } from "./helpers/auth";

const EMAIL = process.env.E2E_EMAIL!;
const PASSWORD = process.env.E2E_PASSWORD!;

if (!EMAIL || !PASSWORD) {
  throw new Error(
    "Set E2E_EMAIL and E2E_PASSWORD before running Playwright (>=12 chars password)."
  );
}

// ── User input fixtures: each entry mimics what useToolData would persist ──
const USER_INPUTS: Record<string, Record<string, unknown>> = {
  betroffenheit: {
    sector: "health",
    answers: { q1: "yes", q2: "no", q3: "yes" },
    completedAt: "2026-05-15T10:00:00Z",
  },
  "nis2-check": {
    answers: {
      "e2e-control-1": { status: "implemented", comment: "E2E: done by IT", assignee: "alice" },
      "e2e-control-2": { status: "partial", comment: "E2E: WIP" },
    },
  },
  "nis2-risk-matrix": {
    formula: "add",
    overrides: { "e2e-risk-1": { likelihood: 5, impact: 4 } },
    customRisks: [{ id: "e2e-cr-1", title: "E2E eigene Bedrohung" }],
  },
  "nis2-treatment-engine": {
    decisions: {
      "e2e-r-1": { strategy: "mitigate", justification: "E2E: hohe Auswirkung" },
      "e2e-r-2": { strategy: "accept", justification: "E2E: niedriges Restrisiko" },
    },
    customControls: [{ id: "e2e-cc-1", name: "E2E manuelle Maßnahme" }],
  },
  soa: {
    controls: {
      "e2e-a-01": { applicable: false, justification: "E2E: nicht anwendbar" },
      "e2e-a-03": { applicable: false, justification: "E2E: out of scope" },
    },
    soaExclusions: ["e2e-a-05"],
    customJustifications: { "e2e-a-07": "E2E eigene Begründung" },
  },
  "nis2-execution-actions": {
    actions: [
      { id: "e2e-act-1", status: "Fertig", owner: "Bob", note: "E2E Q1 abgeschlossen" },
      { id: "e2e-act-custom", title: "E2E manuell hinzugefügt", status: "Laufend" },
    ],
    comments: { "e2e-act-1": "E2E review passed" },
  },
  policies: {
    statusOverrides: { "e2e-p01": "approved", "e2e-p51": "entbehrlich" },
    acknowledgements: [{ policyId: "e2e-p01", name: "E2E Alice", date: "2026-05-01" }],
  },
  training: {
    progress: {
      "e2e-m1": { completed: true, score: 92 },
      "e2e-m2": { completed: false, score: 0 },
    },
  },
};

test.describe("Demo reload preserves user input across all pipeline steps", () => {
  test("user inputs in 8 tool_keys survive a Demo-Daten (DE) reload", async ({ page }) => {
    // ── 1. Ensure user + seed cloud with user fixtures ──
    const session = await ensureTestUser(EMAIL, PASSWORD);
    const userId = session.user.id;

    for (const [toolKey, payload] of Object.entries(USER_INPUTS)) {
      await writeToolData(userId, toolKey, payload);
    }

    // Quick sanity: confirm cloud has our fixtures
    for (const toolKey of Object.keys(USER_INPUTS)) {
      const before = await readToolData(userId, toolKey);
      expect(before, `pre-seed failed for ${toolKey}`).toBeTruthy();
    }

    // ── 2. Login in browser so the app reuses the same session ──
    // Pre-dismiss marketing consent popup so it can't intercept clicks.
    await cloud
      .from("profiles")
      .update({ marketing_consent: false, marketing_consent_date: new Date().toISOString() })
      .eq("user_id", userId);

    await loginViaUI(page, EMAIL, PASSWORD);

    // Pre-set cookie consent so the bottom banner doesn't intercept clicks.
    await page.evaluate(() =>
      localStorage.setItem(
        "cookie-consent",
        JSON.stringify({ analytics: false, marketing: false, date: new Date().toISOString() })
      )
    );
    await page.reload();

    // ── 3. Trigger demo reload (DE) from /context ──
    await page.goto("/context");
    const demoBtn = page.getByRole("button", {
      name: /Demo-Daten laden \(DE\)|Load Demo \(DE\)/i,
    });
    await expect(demoBtn).toBeVisible({ timeout: 20_000 });
    // Safety: if any modal/popup is on top, dismiss by Escape before clicking.
    await page.keyboard.press("Escape").catch(() => {});
    await demoBtn.click();

    // ── 4. Wait for syncSeedToCloud to finish ──
    // The button triggers seed + sync + toast + window.location.reload().
    // Sync can take 30-90s (many DB writes). Wait until the page reloads
    // (signaled by company_profiles row appearing for this user).
    await Promise.race([
      page.waitForEvent("load", { timeout: 120_000 }),
      page
        .getByText(/Demo-Daten \(DE\) geladen|Demo data \(DE\) loaded/i)
        .waitFor({ timeout: 120_000 }),
    ]).catch(() => {});

    // Poll cloud until services have been seeded (proves sync completed).
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const { count } = await cloud
        .from("critical_services")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count ?? 0) > 0) break;
      await page.waitForTimeout(2000);
    }

    // ── 5. Verify every user input survived ──
    // Step 2
    const betroffenheit = await readToolData(userId, "betroffenheit");
    expect(betroffenheit.sector).toBe("health");
    expect(betroffenheit.answers.q1).toBe("yes");
    expect(betroffenheit.answers.q3).toBe("yes");

    // Step 6
    const check = await readToolData(userId, "nis2-check");
    expect(check.answers["e2e-control-1"].comment).toBe("E2E: done by IT");
    expect(check.answers["e2e-control-1"].assignee).toBe("alice");
    expect(check.answers["e2e-control-2"].status).toBe("partial");

    // Step 8
    const matrix = await readToolData(userId, "nis2-risk-matrix");
    expect(matrix.formula).toBe("add");
    expect(matrix.overrides["e2e-risk-1"]).toEqual({ likelihood: 5, impact: 4 });
    expect(matrix.customRisks).toEqual([{ id: "e2e-cr-1", title: "E2E eigene Bedrohung" }]);

    // Step 9
    const treatment = await readToolData(userId, "nis2-treatment-engine");
    expect(treatment.decisions["e2e-r-1"].strategy).toBe("mitigate");
    expect(treatment.decisions["e2e-r-2"].justification).toContain("niedriges Restrisiko");
    expect(treatment.customControls[0].name).toBe("E2E manuelle Maßnahme");

    // Step 10
    const soa = await readToolData(userId, "soa");
    expect(soa.controls["e2e-a-01"].applicable).toBe(false);
    expect(soa.controls["e2e-a-01"].justification).toContain("nicht anwendbar");
    expect(soa.controls["e2e-a-03"].applicable).toBe(false);
    expect(soa.soaExclusions).toEqual(["e2e-a-05"]);
    expect(soa.customJustifications["e2e-a-07"]).toBe("E2E eigene Begründung");

    // Step 12
    const exec = await readToolData(userId, "nis2-execution-actions");
    const customAct = exec.actions.find((a: any) => a.id === "e2e-act-custom");
    expect(customAct, "user-added custom action must survive").toBeTruthy();
    expect(customAct.title).toBe("E2E manuell hinzugefügt");
    const fertig = exec.actions.find((a: any) => a.id === "e2e-act-1");
    expect(fertig.status).toBe("Fertig");
    expect(fertig.owner).toBe("Bob");
    expect(exec.comments["e2e-act-1"]).toBe("E2E review passed");

    // Step 14
    const policies = await readToolData(userId, "policies");
    expect(policies.statusOverrides["e2e-p51"]).toBe("entbehrlich");
    expect(policies.acknowledgements[0].name).toBe("E2E Alice");

    // Training
    const training = await readToolData(userId, "training");
    expect(training.progress["e2e-m1"].score).toBe(92);
    expect(training.progress["e2e-m2"].completed).toBe(false);
  });

  test.afterAll(async () => {
    // Clean test user's tool_data so the next run starts deterministically.
    const { data: sessionData } = await cloud.auth.getSession();
    const uid = sessionData?.session?.user?.id;
    if (uid) {
      for (const toolKey of Object.keys(USER_INPUTS)) {
        await cloud.from("user_tool_data").delete().eq("user_id", uid).eq("tool_key", toolKey);
      }
    }
  });
});
