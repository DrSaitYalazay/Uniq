/**
 * aiActMatrix — SoA-Prüfbericht 02.10.2026, Befunde C-5 und C-7.
 *
 * C-5: Die AI-Act-SoA braucht eine Aussage je KI-System und je Rolle der
 * Organisation, nicht nur eine Zeile je Kontrolle. Quelle ist das KI-Register
 * (Werkzeug KI-Governance): System-ID, Version, Rolle, Risikoklasse,
 * Verantwortlicher, Bewertungsdatum, Freigebender, Nachweise.
 * Aus Register und Katalog (meta.role, meta.family) entsteht die Matrix
 * System × Rolle × Kontrolle.
 *
 * C-7: Rollenkonsistenz über diese Matrix — z. B. „nicht anwendbar" in der
 * SoA, obwohl ein erfasstes System die Kontrolle auslöst.
 *
 * Grenzen (offen benannt):
 *  - Der Umsetzungsstatus wird in der Gap-Analyse je Kontrolle erhoben, nicht
 *    je System. Die Matrix zeigt deshalb den Kontrollstatus der Organisation.
 *  - Die Rolle „GPAI-Modellanbieter" (Kapitel V) ist im Register nicht
 *    erfasst (das Feld „nutzt ein GPAI-Modell" ist nur eine Info). A-14 wird
 *    daher von keinem System ausgelöst und nur als Hinweis geprüft.
 */
import type { KiSystem, Rolle } from "@/lib/kiGovernance";
import type { SoAProjectedControl } from "@/lib/soaProjection";
import { soaStatusClass, type SoAStatusClass } from "@/lib/soaProjection";

type L = { de: string; en: string };

/** Familie einer AIACT-Kontrolle (meta.family, sonst aus der ID). */
export function aiactFamily(c: Pick<SoAProjectedControl, "id" | "catalog">): string {
  const f = c.catalog?.family;
  if (typeof f === "string" && f) return f;
  const id = c.id.replace(/^AIACT-/, "");
  return id.match(/^(A-\d\d)/)?.[1] ?? (id.startsWith("E-") ? "E" : id.startsWith("T-") ? "T" : "");
}

/** Familien, deren Pflichten nur für Hochrisiko-Systeme gelten (Kapitel III). */
const HIGH_RISK_FAMILIES = new Set(["A-03", "A-04", "A-05", "A-06", "A-07", "A-08", "A-09", "A-10", "A-11", "A-13"]);

export type TriggerReason = "rolle" | "einstufung" | "transparenz" | "fria" | "gpai";

export interface SystemTrigger {
  applies: boolean;
  /** Warum nicht anwendbar (Begründungsart + Text). */
  reasonType?: TriggerReason;
  reason?: L;
}

const ROLE_L: Record<string, L> = {
  anbieter: { de: "Anbieter", en: "provider" }, betreiber: { de: "Betreiber", en: "deployer" },
  einfuehrer: { de: "Einführer", en: "importer" }, haendler: { de: "Händler", en: "distributor" },
  gpai_anbieter: { de: "GPAI-Anbieter", en: "GPAI provider" },
};
const roleTxt = (r: string, lang: "de" | "en") => ROLE_L[r]?.[lang] ?? r;

const R = (reasonType: TriggerReason, de: string, en: string): SystemTrigger => ({ applies: false, reasonType, reason: { de, en } });

/** Löst die Kontrolle für dieses System (in seiner Rolle) eine Pflicht aus? */
export function systemTrigger(c: SoAProjectedControl, sys: KiSystem): SystemTrigger {
  const roles = c.catalog?.role ?? [];
  if (roles.length > 0 && !roles.includes(sys.rolle)) {
    return R("rolle", `Pflicht richtet sich an ${roles.map(r => roleTxt(r, "de")).join("/")}; Organisation ist für dieses System ${roleTxt(sys.rolle, "de")}`,
      `Duty addresses ${roles.map(r => roleTxt(r, "en")).join("/")}; organisation is ${roleTxt(sys.rolle, "en")} for this system`);
  }
  const fam = aiactFamily(c);
  if (fam === "A-14") return R("gpai", "Nur für Anbieter von KI-Modellen mit allgemeinem Verwendungszweck — Rolle im Register nicht erfasst", "Only for providers of general-purpose AI models — role not recorded in the register");
  if (HIGH_RISK_FAMILIES.has(fam) && sys.risikoklasse !== "hoch") {
    return R("einstufung", "System ist nicht als Hochrisiko eingestuft", "System is not classified as high-risk");
  }
  if (fam === "A-12") {
    if (sys.risikoklasse !== "hoch") return R("einstufung", "System ist nicht als Hochrisiko eingestuft", "System is not classified as high-risk");
    if (!sys.friaPflicht) return R("fria", "Betreiber nicht FRIA-pflichtig nach Art. 27", "Deployer not subject to FRIA under Art. 27");
  }
  if ((fam === "T" || fam === "A-50") && !sys.transparenzpflicht) {
    return R("transparenz", "Keine Transparenzpflicht nach Art. 50 (kein Chatbot, keine synthetischen Inhalte)", "No Art. 50 transparency duty (no chatbot, no synthetic content)");
  }
  return { applies: true };
}

export interface MatrixRow {
  systemId: string;          // sichtbare System-ID
  systemName: string;
  version: string;
  rolle: Rolle;
  risikoklasse: KiSystem["risikoklasse"];
  controlId: string;
  controlName: string;
  controlNameEn: string;
  family: string;
  applies: boolean;
  reasonType?: TriggerReason;
  reason?: L;
  /** Status der Organisation für diese Kontrolle (Gap-Analyse), nur wenn anwendbar. */
  status: SoAStatusClass | "na";
  owner: string;
  assessedAt: string;
  approvedBy: string;
  evidence: string[];
}

/** Sichtbare System-ID: eigene Kennung, sonst KI-001 … nach Registerreihenfolge. */
export function systemCode(sys: KiSystem, index: number): string {
  return (sys.kennung && sys.kennung.trim()) || `KI-${String(index + 1).padStart(3, "0")}`;
}

export function evidenceList(sys: KiSystem): string[] {
  return (sys.nachweise ?? "").split(/\r?\n|,\s*(?=https?:)/).map(s => s.trim()).filter(Boolean);
}

/** Aktive Systeme (eingestellte Systeme lösen keine Pflichten mehr aus). */
export function activeSystems(systems: KiSystem[] | undefined): KiSystem[] {
  return (systems ?? []).filter(s => s.status !== "eingestellt");
}

/** Matrix System × Rolle × Kontrolle (ohne Übersichtszeilen). */
export function buildAiActMatrix(controls: SoAProjectedControl[], systems: KiSystem[]): MatrixRow[] {
  const all = systems ?? [];
  const out: MatrixRow[] = [];
  const scored = controls.filter(c => !c.isRollup);
  all.forEach((sys, i) => {
    if (sys.status === "eingestellt") return;
    for (const c of scored) {
      const t = systemTrigger(c, sys);
      out.push({
        systemId: systemCode(sys, i), systemName: sys.name || "—", version: sys.version ?? "",
        rolle: sys.rolle, risikoklasse: sys.risikoklasse,
        controlId: c.id, controlName: c.name, controlNameEn: c.nameEn, family: aiactFamily(c),
        applies: t.applies, reasonType: t.reasonType, reason: t.reason,
        status: t.applies ? soaStatusClass(c) : "na",
        owner: sys.verantwortlicher ?? "", assessedAt: sys.bewertetAm ?? "", approvedBy: sys.freigegebenVon ?? "",
        evidence: evidenceList(sys),
      });
    }
  });
  return out;
}

export interface SystemSummary {
  systemId: string; name: string; version: string; rolle: Rolle; risikoklasse: KiSystem["risikoklasse"];
  owner: string; assessedAt: string; approvedBy: string; evidence: string[];
  applicable: number; implemented: number; partial: number; open: number; later: number; notAssessed: number;
}

export function summarizeMatrix(rows: MatrixRow[]): SystemSummary[] {
  const m = new Map<string, SystemSummary>();
  for (const r of rows) {
    let s = m.get(r.systemId);
    if (!s) {
      s = { systemId: r.systemId, name: r.systemName, version: r.version, rolle: r.rolle, risikoklasse: r.risikoklasse,
        owner: r.owner, assessedAt: r.assessedAt, approvedBy: r.approvedBy, evidence: r.evidence,
        applicable: 0, implemented: 0, partial: 0, open: 0, later: 0, notAssessed: 0 };
      m.set(r.systemId, s);
    }
    if (!r.applies) continue;
    s.applicable++;
    if (r.status === "ja") s.implemented++;
    else if (r.status === "teilweise") s.partial++;
    else if (r.status === "nein") s.open++;
    else if (r.status === "spaeter") s.later++;
    else if (r.status === "offen") s.notAssessed++;
  }
  return Array.from(m.values());
}

export type IssueKind = "konflikt" | "pruefen" | "angaben";
export interface ConsistencyIssue {
  kind: IssueKind;
  controlId?: string;
  systemId?: string;
  text: L;
}

/**
 * Rollenkonsistenz (C-7) über die Matrix.
 *  konflikt — SoA sagt „nicht anwendbar", ein erfasstes System löst die Pflicht aber aus.
 *  pruefen  — SoA sagt „anwendbar", aber kein erfasstes System löst sie aus
 *             (nur rollen-/klassenabhängige Familien; Querschnitt E, A-01, A-02 ausgenommen).
 *  angaben  — System ohne Verantwortlichen, Bewertungsdatum oder Freigebenden.
 */
export function matrixConsistency(controls: SoAProjectedControl[], systems: KiSystem[]): ConsistencyIssue[] {
  const act = (systems ?? []).map((s, i) => ({ s, code: systemCode(s, i) })).filter(x => x.s.status !== "eingestellt");
  const issues: ConsistencyIssue[] = [];
  if (act.length === 0) return issues;
  for (const c of controls) {
    if (c.isRollup || c.isExcluded) continue;
    const hits = act.filter(x => systemTrigger(c, x.s).applies);
    const fam = aiactFamily(c);
    if (!c.applicable && hits.length > 0) {
      const names = hits.map(x => `${x.code} ${x.s.name}`).join(", ");
      issues.push({ kind: "konflikt", controlId: c.id, text: {
        de: `${c.id.replace("AIACT-", "")}: in der SoA „nicht anwendbar", wird aber ausgelöst durch ${names}.`,
        en: `${c.id.replace("AIACT-", "")}: "not applicable" in the SoA, but triggered by ${names}.`,
      } });
    } else if (c.applicable && hits.length === 0 && !["E", "A-01", "A-02", ""].includes(fam)) {
      issues.push({ kind: "pruefen", controlId: c.id, text: {
        de: `${c.id.replace("AIACT-", "")}: anwendbar, aber kein erfasstes KI-System löst die Pflicht aus — prüfen, ob „nicht anwendbar" (Begründungsart Rolle/Einstufung).`,
        en: `${c.id.replace("AIACT-", "")}: applicable, but no recorded AI system triggers the duty — check whether "not applicable" (reason type role/classification).`,
      } });
    }
  }
  for (const { s, code } of act) {
    const miss: L[] = [];
    if (!s.verantwortlicher) miss.push({ de: "Verantwortlicher", en: "owner" });
    if (!s.bewertetAm) miss.push({ de: "Bewertungsdatum", en: "assessment date" });
    if (!s.freigegebenVon) miss.push({ de: "Freigebender", en: "approver" });
    if (miss.length) issues.push({ kind: "angaben", systemId: code, text: {
      de: `${code} ${s.name || "—"}: ${miss.map(m => m.de).join(", ")} fehlt im KI-Register.`,
      en: `${code} ${s.name || "—"}: ${miss.map(m => m.en).join(", ")} missing in the AI register.`,
    } });
  }
  return issues;
}

/**
 * Löst KEIN aktives System die Kontrolle aus? Dann Begründung für „nicht
 * anwendbar" auf Organisationsebene (Begründungsart nach SoA-Prüfbericht C-2),
 * sonst null.
 */
export function untriggeredJustification(
  c: Pick<SoAProjectedControl, "id" | "catalog">, systems: KiSystem[],
): { reasonType: "rolle" | "system"; de: string; en: string } | null {
  const act = activeSystems(systems);
  if (!act.length) return null;
  const ts = act.map(s => systemTrigger(c as SoAProjectedControl, s));
  if (ts.some(t => t.applies)) return null;
  const uniq = (xs: string[]) => Array.from(new Set(xs));
  const rolleOnly = ts.every(t => t.reasonType === "rolle" || t.reasonType === "gpai");
  return {
    reasonType: rolleOnly ? "rolle" : "system",
    de: `Nicht anwendbar: kein KI-System im Register löst die Pflicht aus (${uniq(ts.map(t => t.reason!.de)).join("; ")}).`,
    en: `Not applicable: no AI system in the register triggers the duty (${uniq(ts.map(t => t.reason!.en)).join("; ")}).`,
  };
}
