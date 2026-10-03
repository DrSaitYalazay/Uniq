/**
 * controlHealthEngine — Engine E3: Continuous Control Monitoring (CCM),
 * abgeleiteter kontinuierlicher Control-Status.
 *
 * Klasse A-SICHER: rein additive, pure Datei ohne I/O. Ein Control-Status wird
 * nicht mehr behauptet, sondern ABGELEITET aus
 *   derived = f(Selbstauskunft, Evidence-Freshness, Test-Resultate).
 * Veraltete Evidence degradiert; fehlschlagende Tests uebersteuern. Jeder Status
 * traegt eine Konfidenz (automatisiert > manuell > unbelegt). Statusaenderungen
 * laufen durch eine Drift-Statemachine (computeTransitions).
 *
 * Nutzt die (bereits existierenden, leeren) Tabellen control_tests /
 * control_test_results (Migration ..08) + control_status_log/interval_hours
 * (Migration 20260718000003). Referenz: ENGINE_ARCHITECTURE_MARKETGRADE.md §E3.
 *
 * Nur TYP-Importe (werden von esbuild geloescht) — die Engine bleibt
 * standalone-bundelbar ohne Laufzeit-Abhaengigkeiten (kein Supabase-Client).
 */

import type { AnswerStatus, EffectiveAnswer } from "./assessmentEngine";
import type { Evidence, EvidenceKind } from "./evidenceEngine";

// ---------------------------------------------------------------------------
// Tabellen-Typen (Spalten der DB-Tabellen)
// ---------------------------------------------------------------------------

/** Zeile der Tabelle `public.control_tests` (Migration ..08 + interval_hours). */
export interface ControlTest {
  id: string;
  tenant_id: string;
  /** Ziel-Kontrolle (optional) ODER Knoten. */
  framework: string | null;
  control_id: string | null;
  node_id: string | null;
  /** 'mfa_coverage' | 'patch_compliance' | 'evidence_present' | 'custom' ... */
  kind: string;
  label: string;
  /** Cron-artig / 'daily' / 'weekly' (App-interpretiert). */
  schedule: string | null;
  config: Record<string, unknown>;
  enabled: boolean;
  /** macht 'schedule' rechenbar; Default 24. */
  interval_hours: number;
  created_at: string;
}

/** Zeile der Tabelle `public.control_test_results`. */
export interface ControlTestResult {
  id: string;
  tenant_id: string;
  test_id: string;
  ran_at: string;
  status: "pass" | "fail" | "error" | "na";
  evidence_id: string | null;
  /** frei; u. a. `findings: [{ severity, ... }]`. */
  detail: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Engine-Typen (E3.6)
// ---------------------------------------------------------------------------

export type DerivedBadge =
  | "verified"
  | "attested"
  | "unverified"
  | "unknown"
  | "failing";

export type TestState = "none" | "pass" | "fail" | "error";
export type EvidenceState = "none" | "fresh" | "expiring" | "stale";

export interface StatusTransition {
  from: string;
  to: string;
  /** Log-Ursache (control_status_log.cause). */
  cause:
    | "test_fail"
    | "test_recovered"
    | "evidence_expired"
    | "answer_changed"
    | "test_silent";
  /** Semantisches Ereignis fuer Alerts/Reports. */
  event: "DRIFT" | "RECOVERED" | "EVIDENCE_DECAY";
  detail?: Record<string, unknown>;
}

export interface ControlHealth {
  derived: AnswerStatus | null;
  badge: DerivedBadge;
  /** 0..100, null = no_data (keine wertbare Komponente). */
  health: number | null;
  confidence: "high" | "medium" | "low";
  testState: TestState;
  evidenceState: EvidenceState;
  driftEvents: StatusTransition[];
}

export interface DeriveOpts {
  now?: Date;
  ttlOverrides?: Partial<Record<EvidenceKind, number>>;
}

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

/** Evidence-TTL je Art (Tage). E3.2. Override in risk_config.evidence_ttl. */
export const EVIDENCE_TTL_DAYS: Record<EvidenceKind, number> = {
  attestation: 365,
  document: 365,
  ticket: 180,
  screenshot: 90,
  log: 30,
  link: 90,
  other: 180,
};

/** Fenster fuer "laeuft ab" (expiring) — Tage, wie evidenceEngine. */
export const EXPIRING_WINDOW_DAYS = 30;

/** Health-Score-Gewichte (E3.3). */
export const HEALTH_WEIGHTS = { answer: 0.45, pass: 0.3, fresh: 0.25 } as const;

/** Abzug bei kritischem Finding (E3.3). */
export const CRITICAL_FINDING_PENALTY = 15;

const ANSWER_SCORE: Record<AnswerStatus, number | null> = {
  ja: 1,
  teilweise: 0.5,
  nein: 0,
  na: null, // nicht gewertet
};

// ---------------------------------------------------------------------------
// Helfer (rein)
// ---------------------------------------------------------------------------

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x);

function midnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse ein `date`/ISO-Feld auf Mitternacht (lokal, tages-genau). */
function parseDateOnly(s: string): Date {
  const p = String(s).slice(0, 10).split("-");
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function isCriticalFinding(f: unknown): boolean {
  if (!f || typeof f !== "object") return false;
  const o = f as Record<string, unknown>;
  return o.severity === "critical" || o.critical === true;
}

// ---------------------------------------------------------------------------
// Evidence-Aggregat (E3.2 Schritt 2)
// ---------------------------------------------------------------------------

/** Frische-Status EINES Nachweises unter kind-TTL bzw. valid_until. */
export function evidenceItemState(
  e: Evidence,
  now: Date,
  ttlOverrides?: Partial<Record<EvidenceKind, number>>,
): "fresh" | "expiring" | "stale" {
  const today = midnight(now);
  let due: Date;
  if (e.valid_until) {
    due = parseDateOnly(e.valid_until);
  } else {
    const days =
      (ttlOverrides && ttlOverrides[e.kind] != null
        ? (ttlOverrides[e.kind] as number)
        : EVIDENCE_TTL_DAYS[e.kind]) ?? EVIDENCE_TTL_DAYS.other;
    const base = midnight(new Date(e.collected_at));
    due = new Date(base);
    due.setDate(due.getDate() + days);
  }
  if (due.getTime() < today.getTime()) return "stale";
  const window = new Date(today);
  window.setDate(window.getDate() + EXPIRING_WINDOW_DAYS);
  if (due.getTime() < window.getTime()) return "expiring";
  return "fresh";
}

const EVIDENCE_WORST_RANK: Record<"fresh" | "expiring" | "stale", number> = {
  stale: 0,
  expiring: 1,
  fresh: 2,
};

// ---------------------------------------------------------------------------
// Test-Aggregat (E3.2 Schritt 1)
// ---------------------------------------------------------------------------

/** Ein Test gilt als "verstummt", wenn das juengste Resultat aelter als
 *  2×interval_hours ist (oder komplett fehlt). */
function isSilent(
  test: ControlTest,
  latest: ControlTestResult | null,
  now: Date,
): boolean {
  if (!latest) return true;
  const iv = Math.max(1, test.interval_hours || 24);
  const ageMs = now.getTime() - new Date(latest.ran_at).getTime();
  return ageMs > 2 * iv * 3600 * 1000;
}

// ---------------------------------------------------------------------------
// deriveControlHealth (E3.2 + E3.3)
// ---------------------------------------------------------------------------

export function deriveControlHealth(
  answer: EffectiveAnswer | undefined,
  tests: { test: ControlTest; latest: ControlTestResult | null }[],
  evidence: { row: Evidence; inherited: boolean }[],
  opts?: DeriveOpts,
): ControlHealth {
  const now = opts?.now ?? new Date();
  const ttlOverrides = opts?.ttlOverrides;

  const answerStatus: AnswerStatus | null = answer?.status ?? null;

  // --- Schritt 1: Test-Aggregat (AND-Logik) -------------------------------
  const enabled = tests.filter((t) => t.test.enabled !== false);
  let testState: TestState;
  if (enabled.length === 0) {
    testState = "none";
  } else {
    const hasFail = enabled.some((t) => t.latest?.status === "fail");
    const hasError = enabled.some(
      (t) => t.latest?.status === "error" || isSilent(t.test, t.latest, now),
    );
    testState = hasFail ? "fail" : hasError ? "error" : "pass";
  }

  // passRate: passing / (enabled Tests ohne 'na'-Resultat)
  const rateRelevant = enabled.filter((t) => t.latest?.status !== "na");
  const passRatePresent = rateRelevant.length > 0;
  const passRate = passRatePresent
    ? rateRelevant.filter((t) => t.latest?.status === "pass").length /
      rateRelevant.length
    : 0;

  // kritisches Finding aus juengsten Resultaten
  const hasCriticalFinding = enabled.some((t) => {
    const f = (t.latest?.detail as Record<string, unknown> | undefined)?.findings;
    return Array.isArray(f) && f.some(isCriticalFinding);
  });

  // --- Schritt 2: Evidence-Aggregat (TTL) ---------------------------------
  const evStates = evidence.map((e) => evidenceItemState(e.row, now, ttlOverrides));
  let evidenceState: EvidenceState;
  if (evStates.length === 0) {
    evidenceState = "none";
  } else {
    evidenceState = evStates.reduce((worst, s) =>
      EVIDENCE_WORST_RANK[s] < EVIDENCE_WORST_RANK[worst] ? s : worst,
    );
  }
  const freshPresent = evStates.length > 0;
  const freshRate = freshPresent
    ? evStates.filter((s) => s === "fresh").length / evStates.length
    : 0;

  // Evidence-Pflicht: muss-Kontrolle ODER control_tests vorhanden (Default:
  // hier ueber Test-Vorhandensein, da EffectiveAnswer kein muss traegt).
  const evidenceRequired = enabled.length > 0;

  // --- Schritt 3: Derived Status (Lattice, worst wins) --------------------
  const { derived, badge } = deriveStatus(
    answerStatus,
    testState,
    evidenceState,
    evidenceRequired,
  );

  // --- E3.3: Control-Health-Score -----------------------------------------
  const answerScore = answerStatus != null ? ANSWER_SCORE[answerStatus] : null;
  const answerPresent = answerScore != null;

  let num = 0;
  let den = 0;
  if (answerPresent) {
    num += HEALTH_WEIGHTS.answer * (answerScore as number);
    den += HEALTH_WEIGHTS.answer;
  }
  if (passRatePresent) {
    num += HEALTH_WEIGHTS.pass * passRate;
    den += HEALTH_WEIGHTS.pass;
  }
  if (freshPresent) {
    num += HEALTH_WEIGHTS.fresh * freshRate;
    den += HEALTH_WEIGHTS.fresh;
  }

  let health: number | null;
  if (den === 0) {
    health = null; // komplett no_data
  } else {
    const raw = clamp01(num / den);
    health = clamp(
      100 * raw - CRITICAL_FINDING_PENALTY * (hasCriticalFinding ? 1 : 0),
      0,
      100,
    );
  }

  // --- E3.3: Konfidenz -----------------------------------------------------
  let confidence: "high" | "medium" | "low";
  if (passRatePresent) {
    confidence = "high"; // >=1 automatisierter Test + passRate-Komponente
  } else if (freshPresent && evidenceState !== "stale") {
    confidence = "medium"; // nur (frische) Evidence
  } else {
    confidence = "low"; // reine Selbstauskunft
  }

  return {
    derived,
    badge,
    health,
    confidence,
    testState,
    evidenceState,
    driftEvents: [],
  };
}

/** Reine Lattice-Ableitung (E3.2 Schritt 3). */
function deriveStatus(
  answerStatus: AnswerStatus | null,
  testState: TestState,
  evidenceState: EvidenceState,
  evidenceRequired: boolean,
): { derived: AnswerStatus | null; badge: DerivedBadge } {
  if (answerStatus == null) return { derived: null, badge: "unknown" };
  if (answerStatus === "na") return { derived: "na", badge: "unknown" };
  // B-26: Ein fehlschlagender Test übersteuert die Selbstauskunft (außer „na") —
  // ein objektiv fehlgeschlagener Test macht die Kontrolle „nein/failing",
  // unabhängig davon, ob der Nutzer „ja" oder „teilweise" angegeben hat.
  if (testState === "fail") return { derived: "nein", badge: "failing" };
  if (answerStatus === "nein") return { derived: "nein", badge: "unverified" };
  if (answerStatus === "teilweise")
    return { derived: "teilweise", badge: "unverified" };

  // answer === 'ja'
  if (testState === "error") return { derived: "teilweise", badge: "unknown" };
  if (
    (evidenceState === "stale" || evidenceState === "none") &&
    evidenceRequired
  ) {
    return { derived: "teilweise", badge: "unverified" };
  }
  return {
    derived: "ja",
    badge: testState === "pass" ? "verified" : "attested",
  };
}

// ---------------------------------------------------------------------------
// Drift-Statemachine (E3.4)
// ---------------------------------------------------------------------------

/** Grober Zustand fuer das Log (unknown -> passing -> degraded -> failing). */
export function coarseState(h: ControlHealth): string {
  if (h.testState === "fail") return "failing";
  if (h.testState === "error" || h.evidenceState === "stale") return "degraded";
  if (h.testState === "pass") return "passing";
  return "unknown";
}

/**
 * Transitions zwischen zwei aufeinanderfolgenden Zustaenden (E3.4).
 *   pass -> fail   = DRIFT           (cause test_fail)
 *   fail -> pass   = RECOVERED       (cause test_recovered)
 *   fresh -> stale = EVIDENCE_DECAY  (cause evidence_expired)
 */
export function computeTransitions(
  prev: ControlHealth | null,
  next: ControlHealth,
): StatusTransition[] {
  if (!prev) return [];
  const out: StatusTransition[] = [];
  const from = coarseState(prev);
  const to = coarseState(next);

  if (prev.testState === "pass" && next.testState === "fail") {
    out.push({ from, to, cause: "test_fail", event: "DRIFT" });
  } else if (prev.testState === "fail" && next.testState === "pass") {
    out.push({ from, to, cause: "test_recovered", event: "RECOVERED" });
  }

  if (prev.evidenceState === "fresh" && next.evidenceState === "stale") {
    out.push({ from, to, cause: "evidence_expired", event: "EVIDENCE_DECAY" });
  }

  return out;
}

// ---------------------------------------------------------------------------
// frameworkReadiness (E8.1 C1)
// ---------------------------------------------------------------------------

/**
 * Gewichteter Readiness-Rollup ueber Control-Healths.
 *   score    = 100 · Σ w_c·(health_c/100) / Σ w_c   (nur nicht-null Healths)
 *   coverage = Anteil der Kontrollen mit wertbarem Health (health != null)
 * `weights` optional (Reihenfolge = Reihenfolge von `healths`); Default 1.
 */
export function frameworkReadiness(
  healths: ControlHealth[],
  weights?: Map<string, number>,
): { score: number; coverage: number } {
  const wArr = weights ? Array.from(weights.values()) : null;
  let num = 0;
  let den = 0;
  let counted = 0;
  healths.forEach((h, i) => {
    if (h.health == null) return;
    const w = wArr && wArr[i] != null ? wArr[i] : 1;
    num += w * (h.health / 100);
    den += w;
    counted++;
  });
  return {
    score: den > 0 ? (100 * num) / den : 0,
    coverage: healths.length > 0 ? counted / healths.length : 0,
  };
}
