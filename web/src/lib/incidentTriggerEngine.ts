/**
 * incidentTriggerEngine — Vorfall-Werkzeug (Sprint 1).
 *
 * Ein Vorfall wird EINMAL erfasst + bewertet (Assessment). Dieses Modul löst
 * daraus deterministisch die Meldepflichten je AKTIVEM Framework auf und
 * berechnet die Fristen (Timer-Dienst, Warnschwellen 75 % / 90 % / abgelaufen).
 *
 * Kernregel (Spec 2.4): "unbekannt" wird wie "ja" behandelt — Fristen laufen.
 * Nicht ausgelöste Pflichten werden mit Begründung dokumentiert (Prüffestigkeit).
 *
 * Quelle der Schemata/Trigger: incidentReportForms.ts (aus vorfall_meldeformulare.json).
 */

import {
  VORFALL_FORMULARE,
  type FrameworkFormular,
  type MeldeStufe,
} from "@/data/incidentReportForms";

/** Antwort-Werte im Assessment. "unbekannt" == "ja" (Fristen laufen). */
export type JaNein = "ja" | "nein" | "unbekannt";
export type RisikoStufe = "kein" | "normal" | "hoch" | "unbekannt";

export interface VorfallAssessment {
  personenbezug?: JaNein;
  risiko_betroffene?: RisikoStufe;
  erheblich_nis2?: JaNein;
  dora_schwerwiegend?: JaNein;
  kritis_stoerung?: JaNein;
  dachg_vorfall?: JaNein;
  cra_produktvorfall?: JaNein;
  aiact_art73?: JaNein;
  /** Freitext-Begründung je Feld (Prüffestigkeit). */
  begruendung?: Record<string, string>;
}

/** "unbekannt" zählt wie "ja". */
export const giltAlsJa = (v?: JaNein): boolean => v === "ja" || v === "unbekannt";

/** Ampel-Zustand einer laufenden Frist. */
export type FristAmpel = "gruen" | "gelb" | "orange" | "rot" | "kein_timer" | "unverzueglich";

export interface FristStatus {
  ampel: FristAmpel;
  deadline: string | null; // ISO
  pct: number;             // 0..100+ (verbrauchter Anteil)
  restMs: number | null;   // verbleibende Zeit (negativ = überfällig)
  restText: string;        // menschenlesbar (z. B. "3 h 12 m")
}

/** Eine konkrete Melde-Instanz, die im Vorfall (D83) gespeichert wird. */
export interface MeldungInstanz {
  framework: string;
  delta_doc: string;
  empfaenger: string;
  rechtsgrundlage: string;
  stufe: string;
  label: string;
  frist: string;
  dauer_h: number | null;
  frist_start: string;      // ISO (i. d. R. Kenntnis/Erkennungszeit)
  frist_ende: string | null;
  status: "offen" | "entwurf" | "abgesendet" | "bestaetigt" | "entfallen";
}

/** Aktiv, aber NICHT ausgelöst — mit Begründung (Prüffestigkeit). */
export interface NichtAusgeloest {
  framework: string;
  grund: string;
}

export interface Meldepflichtaufloesung {
  meldungen: MeldungInstanz[];
  nichtAusgeloest: NichtAusgeloest[];
}

/**
 * Prüft je Framework, ob die Trigger-Bedingung erfüllt ist, und liefert die
 * relevanten Meldestufen. GDPR hat abgestufte Logik (Register/Behörde/Betroffene).
 * Gibt zusätzlich zurück, warum ein aktives Framework NICHT ausgelöst wurde.
 */
export function resolveMeldepflichten(
  assessment: VorfallAssessment,
  activeFrameworks: string[],
  fristStartIso: string,
): Meldepflichtaufloesung {
  const meldungen: MeldungInstanz[] = [];
  const nichtAusgeloest: NichtAusgeloest[] = [];
  const active = new Set(activeFrameworks);

  const pushStufen = (fw: string, form: FrameworkFormular, stufen: MeldeStufe[]) => {
    for (const st of stufen) {
      meldungen.push({
        framework: fw,
        delta_doc: form.delta_doc,
        empfaenger: form.empfaenger,
        rechtsgrundlage: form.rechtsgrundlage,
        stufe: st.stufe,
        label: st.label,
        frist: st.frist,
        dauer_h: st.dauer_h,
        frist_start: fristStartIso,
        frist_ende: st.dauer_h != null ? addHoursIso(fristStartIso, st.dauer_h) : null,
        status: "offen",
      });
    }
  };

  // NIS2
  if (active.has("NIS2")) {
    if (giltAlsJa(assessment.erheblich_nis2)) pushStufen("NIS2", VORFALL_FORMULARE.NIS2, VORFALL_FORMULARE.NIS2.stufen);
    else nichtAusgeloest.push({ framework: "NIS2", grund: "Kein erheblicher Sicherheitsvorfall (erheblich_nis2 = nein)." });
  }
  // DORA
  if (active.has("DORA")) {
    if (giltAlsJa(assessment.dora_schwerwiegend)) pushStufen("DORA", VORFALL_FORMULARE.DORA, VORFALL_FORMULARE.DORA.stufen);
    else nichtAusgeloest.push({ framework: "DORA", grund: "Nicht als schwerwiegender IKT-Vorfall klassifiziert (RTS 2024/1772)." });
  }
  // KRITIS
  if (active.has("KRITIS")) {
    if (giltAlsJa(assessment.kritis_stoerung)) pushStufen("KRITIS", VORFALL_FORMULARE.KRITIS, VORFALL_FORMULARE.KRITIS.stufen);
    else nichtAusgeloest.push({ framework: "KRITIS", grund: "Keine (potenzielle) Auswirkung auf die kritische Dienstleistung." });
  }
  // KRITIS-DachG (physisch)
  if (active.has("KRITIS_DACHG")) {
    if (giltAlsJa(assessment.dachg_vorfall)) pushStufen("KRITIS_DACHG", VORFALL_FORMULARE.KRITIS_DACHG, VORFALL_FORMULARE.KRITIS_DACHG.stufen);
    else nichtAusgeloest.push({ framework: "KRITIS_DACHG", grund: "Keine erhebliche (physische) Beeinträchtigung der kritischen Anlage." });
  }
  // CRA
  if (active.has("CRA")) {
    if (giltAlsJa(assessment.cra_produktvorfall)) pushStufen("CRA", VORFALL_FORMULARE.CRA, VORFALL_FORMULARE.CRA.stufen);
    else nichtAusgeloest.push({ framework: "CRA", grund: "Keine aktiv ausgenutzte Schwachstelle / schwerwiegender Produktvorfall." });
  }
  // AI Act Art. 73
  if (active.has("AIACT")) {
    if (giltAlsJa(assessment.aiact_art73)) pushStufen("AIACT", VORFALL_FORMULARE.AIACT, VORFALL_FORMULARE.AIACT.stufen);
    else nichtAusgeloest.push({ framework: "AIACT", grund: "Kein schwerwiegender KI-Vorfall nach Art. 73." });
  }
  // GDPR — abgestufte Logik
  if (active.has("GDPR")) {
    const gdpr = VORFALL_FORMULARE.GDPR;
    if (giltAlsJa(assessment.personenbezug)) {
      const risiko = assessment.risiko_betroffene ?? "unbekannt";
      const stufen = gdpr.stufen.filter((st) => {
        if (st.stufe === "registereintrag") return true; // immer bei Personenbezug
        if (st.stufe === "meldung_behoerde") return risiko !== "kein"; // normal/hoch/unbekannt
        if (st.stufe === "benachrichtigung_betroffene") return risiko === "hoch"; // nur hohes Risiko
        return true;
      });
      pushStufen("GDPR", gdpr, stufen);
    } else {
      nichtAusgeloest.push({ framework: "GDPR", grund: "Kein Personenbezug betroffen (personenbezug = nein)." });
    }
  }

  return { meldungen, nichtAusgeloest };
}

/** Fristen-Dienst: Ampel + Restzeit einer Meldung zum Zeitpunkt `now`. */
export function fristStatus(m: Pick<MeldungInstanz, "frist_start" | "dauer_h">, now: Date = new Date()): FristStatus {
  if (m.dauer_h == null) {
    return { ampel: "kein_timer", deadline: null, pct: 0, restMs: null, restText: "auf Ersuchen / laufend" };
  }
  if (m.dauer_h === 0) {
    return { ampel: "unverzueglich", deadline: null, pct: 100, restMs: null, restText: "unverzüglich" };
  }
  const start = new Date(m.frist_start).getTime();
  const total = m.dauer_h * 3600_000;
  const deadline = start + total;
  const elapsed = now.getTime() - start;
  const restMs = deadline - now.getTime();
  const pct = Math.max(0, (elapsed / total) * 100);
  let ampel: FristAmpel = "gruen";
  if (pct >= 100) ampel = "rot";
  else if (pct >= 90) ampel = "orange";
  else if (pct >= 75) ampel = "gelb";
  return {
    ampel,
    deadline: new Date(deadline).toISOString(),
    pct: Math.round(pct),
    restMs,
    restText: formatRest(restMs),
  };
}

/** Anzahl offener Meldungen mit ablaufender Frist (nächste `stunden` h). */
export function ablaufendeFristen(meldungen: MeldungInstanz[], stunden = 24, now: Date = new Date()): MeldungInstanz[] {
  return meldungen.filter((m) => {
    if (m.status === "abgesendet" || m.status === "bestaetigt" || m.status === "entfallen") return false;
    const s = fristStatus(m, now);
    if (s.restMs == null) return false;
    return s.restMs <= stunden * 3600_000; // inkl. bereits überfällig (negativ)
  });
}

function addHoursIso(startIso: string, hours: number): string {
  return new Date(new Date(startIso).getTime() + hours * 3600_000).toISOString();
}

function formatRest(ms: number): string {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600_000);
  const m = Math.floor((abs % 3600_000) / 60_000);
  const txt = h >= 24 ? `${Math.floor(h / 24)} T ${h % 24} h` : `${h} h ${m} m`;
  return ms < 0 ? `überfällig seit ${txt}` : txt;
}
