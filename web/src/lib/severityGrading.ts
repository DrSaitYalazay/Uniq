/**
 * severityGrading — Abweichungsgrad (Major/Minor) eines Auditbefunds.
 *
 * Y7 (Codex-Prüfbericht 2026-09-12): „Major/Minor-Vorschläge liegen im Katalog
 * vor, sind aber nicht an den Bewertungsablauf angebunden." Diese Datei ist
 * diese Anbindung — und zieht dabei zwei Grenzen, die der Katalogvertrag
 * ausdrücklich verlangt:
 *
 * 1. VORSCHLAG ≠ BEWERTUNG. `assessment_contract.severity`: „Absent/Partial
 *    values are starting suggestions only. Unknown or non-applicable scope
 *    yields no grade." Der Katalogwert wird deshalb als Vorschlag angezeigt,
 *    nie als Ergebnis gespeichert. Erst der Prüfer entscheidet — mit
 *    Begründung (DB-CHECK `answers_severity_note_chk`).
 *
 * 2. ABWEICHUNGSGRAD ≠ RISIKOPRIORITÄT. Die Risikopriorität bewertet die
 *    mögliche Wirkung eines Szenarios (Eintritt × Auswirkung) und steht in
 *    `risks`/`control_risk`. Der Abweichungsgrad bewertet das Gewicht des
 *    FESTGESTELLTEN Mangels gegenüber der Norm. Ein hohes Risiko macht einen
 *    Mangel nicht zur Hauptabweichung, und eine Hauptabweichung erhöht keine
 *    Risikopriorität. Keine Funktion in dieser Datei liest Risikodaten.
 */
import type { AnswerStatus, ControlRow, Severity, SeveritySource } from "./assessmentEngine";

/** Katalogwerte sind „Major"/"Minor" (Großschreibung) → interne Kleinschreibung. */
function normalize(v: unknown): Severity | null {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "major") return "major";
  if (s === "minor") return "minor";
  return null;
}

/**
 * Katalogvorschlag für den Abweichungsgrad.
 *
 * „nein" (Maßnahme fehlt)      → meta.default_absent
 * „teilweise" (teilweise da)   → meta.default_partial
 * „ja" / „na" / ohne Antwort   → kein Vorschlag; ohne Mangel gibt es keinen
 *                                Grad, und bei „na"/unbekanntem Geltungs-
 *                                bereich verbietet der Vertrag eine Note.
 */
export function suggestedSeverity(control: ControlRow | undefined, status: AnswerStatus | null): Severity | null {
  if (!control || (status !== "nein" && status !== "teilweise")) return null;
  const meta = (control.meta ?? {}) as Record<string, unknown>;
  return normalize(status === "nein" ? meta.default_absent : meta.default_partial);
}

/** true = der Befund braucht überhaupt eine Einstufung (nur bei Mangel). */
export function severityApplies(status: AnswerStatus | null): boolean {
  return status === "nein" || status === "teilweise";
}

export interface SeverityView {
  /** Wirksamer Grad: Prüferentscheid, sonst Vorschlag, sonst null. */
  value: Severity | null;
  /** Woher der wirksame Grad kommt. null = noch keiner vorhanden. */
  source: SeveritySource | null;
  /** true = ein Vorschlag liegt vor, der Prüfer hat ihn noch nicht bestätigt. */
  pending: boolean;
  /** Begründung des Prüfers (nur bei source === "pruefer" gefüllt). */
  note: string | null;
}

/**
 * Wirksame Einstufung eines Befunds.
 *
 * Der Prüferentscheid gewinnt immer. Fehlt er, wird der Katalogvorschlag
 * angezeigt und als `pending` markiert — im Bericht erscheint er dann als
 * „Vorschlag", nicht als Bewertung.
 */
export function severityView(
  control: ControlRow | undefined,
  status: AnswerStatus | null,
  stored: { severity?: Severity | null; severity_source?: SeveritySource | null; severity_note?: string | null } | undefined,
): SeverityView {
  if (!severityApplies(status)) {
    return { value: null, source: null, pending: false, note: null };
  }
  if (stored?.severity_source === "pruefer" && stored.severity) {
    return { value: stored.severity, source: "pruefer", pending: false, note: stored.severity_note ?? null };
  }
  const sug = suggestedSeverity(control, status);
  return { value: sug, source: sug ? "vorschlag" : null, pending: sug !== null, note: null };
}

/** Anzeigetext des Grads. */
export function severityLabel(v: Severity | null, lang: "de" | "en" = "de"): string {
  if (v === "major") return lang === "de" ? "Hauptabweichung" : "Major nonconformity";
  if (v === "minor") return lang === "de" ? "Nebenabweichung" : "Minor nonconformity";
  if (v === "keine") return lang === "de" ? "Keine Abweichung" : "No nonconformity";
  return lang === "de" ? "nicht eingestuft" : "not graded";
}

/** Kurzform für Tabellen und Berichte. */
export function severityShort(v: Severity | null, lang: "de" | "en" = "de"): string {
  if (v === "major") return "Major";
  if (v === "minor") return "Minor";
  if (v === "keine") return lang === "de" ? "keine" : "none";
  return "—";
}

/** Farbklasse aus der Statuspalette — Major wie „nein", Minor wie „teilweise". */
export function severityToneClass(v: Severity | null): string {
  if (v === "major") return "st-nein-border st-nein-text";
  if (v === "minor") return "st-teilweise-border st-teilweise-text";
  return "border-border text-muted-foreground";
}

/**
 * Zusammenfassung für Berichte: zählt getrennt, was der Prüfer entschieden hat
 * und was noch Vorschlag ist. Diese Trennung ist der Kern der Anforderung —
 * ein Bericht darf 87 Katalogvorschläge nicht als 87 Auditbefunde ausgeben.
 */
export function severitySummary(
  items: Array<{ control?: ControlRow; status: AnswerStatus | null; stored?: Parameters<typeof severityView>[2] }>,
): { majorConfirmed: number; minorConfirmed: number; noneConfirmed: number; majorSuggested: number; minorSuggested: number; ungraded: number } {
  let majorConfirmed = 0, minorConfirmed = 0, noneConfirmed = 0, majorSuggested = 0, minorSuggested = 0, ungraded = 0;
  for (const it of items) {
    if (!severityApplies(it.status)) continue;
    const v = severityView(it.control, it.status, it.stored);
    if (v.source === "pruefer") {
      if (v.value === "major") majorConfirmed++;
      else if (v.value === "minor") minorConfirmed++;
      else noneConfirmed++;
    } else if (v.source === "vorschlag") {
      if (v.value === "major") majorSuggested++; else minorSuggested++;
    } else {
      ungraded++;
    }
  }
  return { majorConfirmed, minorConfirmed, noneConfirmed, majorSuggested, minorSuggested, ungraded };
}
