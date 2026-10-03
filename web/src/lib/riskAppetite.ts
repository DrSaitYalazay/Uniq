/**
 * Risikoappetit (akzeptables Risiko) — gemeinsame Logik für die Risiko-Seite
 * (Matrix-Overlay + Toleranzgrenze) und die Dashboard-Kachel.
 *
 * Zwei Modi:
 *   • "class" — höchste noch akzeptable Stufe wählen; alles darüber = über Appetit.
 *   • "line"  — Grenze frei auf Zellen zeichnen (explizite over-Zellen).
 *
 * Persistiert org-weit via useToolData unter APPETITE_KEY.
 */
import type { RiskLevel } from "@/lib/riskEngine";

export const APPETITE_KEY = "risk-appetite";

export const LEVEL_RANK: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export interface AppetiteState {
  /** "class" = akzeptable Stufe wählen; "line" = Grenze frei auf Zellen zeichnen. */
  mode: "class" | "line";
  /** Höchste noch akzeptable Stufe (class-Modus). */
  classLevel: RiskLevel;
  /** Explizit als über-Appetit markierte Zellen `${likelihood}-${impact}` (line-Modus). */
  overCells: string[];
}

export const DEFAULT_APPETITE: AppetiteState = { mode: "class", classLevel: "high", overCells: [] };

export function appScore(l: number, i: number, formula: "multiply" | "sum" | "max"): number {
  if (formula === "sum") return l + i;
  if (formula === "max") return Math.max(l, i);
  return l * i;
}

export function appLevel(
  score: number,
  t: { low_max: number; medium_max: number; high_max: number },
): RiskLevel {
  if (score <= t.low_max) return "low";
  if (score <= t.medium_max) return "medium";
  if (score <= t.high_max) return "high";
  return "critical";
}

/** Liegt (likelihood, impact) mit gegebener Stufe über dem Appetit? */
export function isOverAppetite(
  appetite: AppetiteState,
  l: number,
  i: number,
  level: RiskLevel,
): boolean {
  if (appetite.mode === "line") return appetite.overCells.includes(`${l}-${i}`);
  return LEVEL_RANK[level] > LEVEL_RANK[appetite.classLevel];
}
