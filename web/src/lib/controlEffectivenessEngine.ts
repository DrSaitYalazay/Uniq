/**
 * controlEffectivenessEngine — E2.1 Control-Effectiveness (marktreif).
 *
 * Berechnet je Kontrolle einen Wirksamkeitsfaktor eff_c ∈ [0,1] aus vier
 * multiplikativen Komponenten (Design × Umsetzung × Reife × Nachweis):
 *
 *   eff_c = base_eff_c × impl_c × maturity_c × verify_c
 *
 * Reine, deterministische Helfer — keine Seiteneffekte, keine Runtime-Importe.
 * Läuft eigenständig (ohne E3-Health: verify_c = 0.85 konstant) und wird durch
 * E3 automatisch ehrlicher, sobald Health-Daten vorliegen.
 *
 * Referenz: ENGINE_ARCHITECTURE_MARKETGRADE.md · Abschnitt E2.1 / E2.4.
 */

import type { AnswerStatus, EffectiveAnswer } from "@/lib/assessmentEngine";

// ── Katalog-Zeile (Migration 20260718000002_control_effect.sql) ──

export type ControlEffectDimension = "likelihood" | "impact" | "both";
export type ControlEffectKind = "preventive" | "detective" | "corrective";

export interface ControlEffectRow {
  framework: string;
  control_id: string;
  dimension: ControlEffectDimension;
  kind: ControlEffectKind;
  /** Design-Wirksamkeit ∈ [0,1] (Katalog-Seed; Default 0.5). */
  base_eff: number;
}

// ── E3-Health (optional, vorwärtskompatibel) ──
//
// Solange E3 (controlHealthEngine) nicht gebaut ist, bleibt dies ein schlanker
// Stub: die einzige hier konsumierte Information ist der abgeleitete Nachweis-
// Zustand. Fehlt die Health, arbeitet E2 mit verify_c = 0.85 (attested).

export type ControlVerifyState =
  | "verified"    // Tests pass + Evidence frisch
  | "attested"    // Evidence frisch, keine Tests
  | "unverified"  // „Grün ohne Nachweis"
  | "stale"       // Evidence veraltet
  | "error"       // Test-Fehler / Test verstummt
  | "fail";       // Test fail — Kontrolle wirkt NICHT

export interface ControlHealth {
  verify: ControlVerifyState;
}

// ── Ergebnis ──

export type ControlEffConfidence = "verified" | "attested" | "unverified";

export interface ControlEff {
  /** eff_c ∈ [0,1] */
  eff: number;
  factors: {
    base: number;
    impl: number;
    maturity: number;
    verify: number;
  };
  confidence: ControlEffConfidence;
}

// ── Konstanten (E2.1) ──

const DEFAULT_BASE_EFF = 0.5;
const DEFAULT_VERIFY = 0.85; // ohne E3-Health: attested-Niveau

const IMPL_STATUS_FACTOR: Record<AnswerStatus, number> = {
  ja: 1.0,
  teilweise: 0.5,
  nein: 0,
  na: 0, // nicht anwendbar wirkt nicht risikomindernd
};

const VERIFY_FACTOR: Record<ControlVerifyState, number> = {
  verified: 1.0,
  attested: 0.85,
  unverified: 0.6,
  stale: 0.4,
  error: 0.4,
  fail: 0.0,
};

const VERIFY_CONFIDENCE: Record<ControlVerifyState, ControlEffConfidence> = {
  verified: "verified",
  attested: "attested",
  unverified: "unverified",
  stale: "unverified",
  error: "unverified",
  fail: "unverified",
};

// ── impl_c = Status-Faktor × Projektions-Qualität ──

function implFactor(answer: EffectiveAnswer | undefined): number {
  const status = answer?.status ?? null;
  const statusFactor = status ? IMPL_STATUS_FACTOR[status] ?? 0 : 0;
  // Geerbte Teil-Deckung (subset/intersects) zählt weniger.
  const projectionFactor = answer?.projectionQuality === "partial" ? 0.7 : 1.0;
  return statusFactor * projectionFactor;
}

// ── maturity_c = reifegrad != null ? 0.5 + 0.1·reifegrad : 0.8 ──

function maturityFactor(answer: EffectiveAnswer | undefined): number {
  const r = answer?.reifegrad;
  return r != null ? 0.5 + 0.1 * r : 0.8;
}

/**
 * computeControlEffectiveness — E2.1, rein & deterministisch.
 *
 *   eff = base × impl × maturity × verify
 *
 * @param effectRow  Katalog-Zeile (fehlt → base 0.5).
 * @param answer     wirksame Antwort inkl. Reifegrad/Projektionsqualität.
 * @param health     E3-Health (optional; fehlt → verify konstant 0.85).
 */
export function computeControlEffectiveness(
  effectRow: ControlEffectRow | undefined,
  answer: EffectiveAnswer | undefined,
  health?: ControlHealth,
): ControlEff {
  const base = effectRow?.base_eff ?? DEFAULT_BASE_EFF;
  const impl = implFactor(answer);
  const maturity = maturityFactor(answer);

  const verify = health ? VERIFY_FACTOR[health.verify] : DEFAULT_VERIFY;
  const confidence: ControlEffConfidence = health
    ? VERIFY_CONFIDENCE[health.verify]
    : "attested";

  const eff = base * impl * maturity * verify;

  return {
    eff,
    factors: { base, impl, maturity, verify },
    confidence,
  };
}

// ── Risiko↔Control-Verknüpfung (E2.2) ──
//
// Der Aufrufer baut die Links aus soaRiskLinkage (explizite Treatment-Selektion,
// damping 1.0) PLUS Capability-/Knoten-Match (damping 0.8, weil nicht explizit
// verknüpft). Die Wirkdimension stammt aus der control_effect-Katalogzeile.

export interface RiskControlLink {
  risk_id: string;
  /** "framework::id" — Schlüssel in effByControl. */
  control_key: string;
  /** Wirkrichtung (Katalog-Seed; Default 'likelihood'). */
  dimension?: ControlEffectDimension;
  /** Dämpfung auf eff_c: 1.0 explizit, 0.8 Capability-Match. Default 1.0. */
  damping?: number;
}
