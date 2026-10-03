/**
 * demoPackageMore — Ergänzung zum Demo-Paket (lib/demoPackage.ts).
 *
 * Schreibt alles, was sonst erst durch einen Seitenbesuch oder eine Nutzeraktion
 * entsteht, damit JEDE Funktion direkt nach dem Laden Inhalte zeigt:
 *   Risikobehandlung (Phase 04) inkl. Restrisiko, Akzeptanz, FAIR-Szenarien ·
 *   SoA-Begründungen + freigegebene SoA-Versionen · Roadmap-Zieltermin ·
 *   Umsetzungsverlauf (Dashboard-Prognose) · Audit-Programm mit laufendem Audit ·
 *   Management-Review-Historie · Control-Monitoring (Tests + Ergebnisse) ·
 *   Reifegrad-Ziele · Asset-Bewertungen · Schulungsplan · Meldeketten der Vorfälle ·
 *   Beschaffungs-Freigabe · Datenschutz-Cockpit · Lieferanten/DORA · BCM/KRITIS ·
 *   Dokumente · Richtlinien · Fristen-Historie.
 *
 * Deterministisch wie das Hauptpaket (Hash statt Zufall).
 */
import { supabase } from "@/integrations/supabase/client";
import type { RawControl } from "@/lib/implementationEngine";
import type { KiSystem } from "@/lib/kiGovernance";
import { untriggeredJustification } from "@/lib/aiActMatrix";
import { catalogMetaOf } from "@/data/frameworkCatalogs";
import { buildFindingsAndGaps } from "@/lib/gapEngine";
import { generateRisks, scoreAndLevel, DEFAULT_RISK_CONFIG, type RiskObject } from "@/lib/riskEngine";
import { generateTreatmentPlan, suggestResidualLI, type TreatmentObject, type TreatmentStrategy } from "@/lib/treatmentEngine";
import { toAssetInfo } from "@/hooks/useRiskAnalysis";
import { resolveMeldepflichten, type MeldungInstanz, type VorfallAssessment } from "@/lib/incidentTriggerEngine";
import { GATE_NOTE_PREFIX, SCOPE_GATE_TOOL_KEY, writeScopeGatesLocal } from "@/lib/applicabilityGates";
import { isIsoClause, isoRefsAll } from "@/data/isoAnnexMap";
import { CATEGORIES } from "@/data/training/categories";
import type { AuditRecord, AuditItem, AuditState } from "@/components/audit/auditProgram";
import type { LifecycleDoc, Supplier, Dienstleister, BcmProzess } from "@/lib/tools/toolLinks";

type Antwort = "ja" | "teilweise" | "nein" | "na";
type Step = (msg: string) => void;
export interface DemoCtrl extends RawControl { tags: string[] | null; muss?: string | null; sub_sector?: string | null }

/** Was das Hauptpaket bereits erzeugt hat und hier weiterverwendet wird. */
export interface DemoKontext {
  tenantId: string;
  userId: string;
  step: Step;
  frameworks: string[];
  ctrls: DemoCtrl[];
  antwortMap: Map<string, Antwort>;           // "FW:id" → Org-Antwort
  /** KI-Register der Demo — für rollenkonsistente AI-Act-Begründungen (C-7). */
  kiSysteme?: KiSystem[];
  impl: Array<{ bundle_key: string; status: string; completed_at: string | null; first_implemented_at: string | null; owner: string }>;
  buendel: Array<{ bundle_key: string; memberControlIds: string[] }>;
  P: Record<string, string>;                   // Personen-ID → "Name (Titel)"
  person: (i: number) => string;
  ast: (key: string) => { id: string; name: string };
  svcId: Map<string, string>;
  evidenceIds: string[];
  incidents: any[];
  suppliers: Supplier[];
  tprm: Dienstleister[];
  bcm: { prozesse: BcmProzess[]; anlagen: any[] };
  docs: LifecycleDoc[];
  policies: Record<string, any>;
  review: { reviews: any[] };
  manualRisks: { risks: Array<{ id: string; likelihood: number; impact: number; title_de: string }> };
}

// ── Hilfen (wie im Hauptpaket) ──────────────────────────────────────────────
const tag = (d: number) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const iso = (d: number, h = 9) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.toISOString(); };
/** Lokale Datums-/Uhrzeit für <input type="datetime-local"> (ohne Zeitzone). */
const lokal = (d: number, h = 9, m = 0) => {
  const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
const vorStunden = (h: number) => { const x = new Date(Date.now() - h * 3600_000); const p = (n: number) => String(n).padStart(2, "0"); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`; };
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0) / 0xffffffff;
}
async function q<T = any>(p: PromiseLike<{ data: T; error: any }>, was: string): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${was}: ${error.message ?? error}`);
  return data;
}
async function alle<T>(build: (from: number, to: number) => any, was: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const rows = await q<T[]>(build(from, from + 999), was);
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}
const kurz = (s: string | null | undefined, n = 110) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1).replace(/\s+\S*$/, "")} …` : t;
};

// ── Scope-Frage „TLD-Register / Domain-Registrierung" (NIS2 Art. 28) ─────────
/** NIS2-Kontrollen der Scope-Frage APP-DOM — für einen Energieversorger „nicht anwendbar". */
export const DEMO_GATE_CONTROLS = new Set(["NIS2:C19.1", "NIS2:C19.2", "NIS2:C19.3", "NIS2:C19.4", "NIS2:C19.5", "NIS2:C19.6", "NIS2:C19.8", "NIS2:C19.9"]);
export const DEMO_GATE_NOTE = `${GATE_NOTE_PREFIX} APP-DOM: Betreibt Ihre Organisation ein TLD-Namenregister oder bietet sie Domainnamen-Registrierungsdienste an? → Nein`;
/** ISO 27001: reine Klausel-Anforderungen (4–10) sind Pflicht — nie „nicht anwendbar". */
export const istPflichtKlausel = (fw: string, id: string) => fw === "ISO27001" && isIsoClause(id) && !isoRefsAll(id).some(r => r.startsWith("A."));

// ═══════════════════════════════════════════════════════════════════════════
export async function ladeZusatz(k: DemoKontext): Promise<Record<string, unknown>> {
  const { tenantId, userId, step, P, person } = k;
  const blobs: Record<string, unknown> = {};

  // ── 1) Scope-Frage (org-weit) ─────────────────────────────────────────────
  step("Scope-Fragen …");
  await q(supabase.from("org_tool_data").upsert({ tenant_id: tenantId, tool_key: SCOPE_GATE_TOOL_KEY, data: { "APP-DOM": "no" }, updated_by: userId }, { onConflict: "tenant_id,tool_key" }) as any, "scope-gates");
  writeScopeGatesLocal({ "APP-DOM": "no" });

  // ── 2) Bewertungen je Asset (Gap-Analyse „Assets") ────────────────────────
  step("Gap-Analyse: Bewertungen je Asset …");
  const assetAnswers = assetBewertungen(k);
  if (assetAnswers.length) await q(supabase.from("answers").insert(assetAnswers) as any, "answers (Assets)");

  // ── 3) Reifegrad-Ziele ─────────────────────────────────────────────────────
  const ziele: Array<[string, string | null, number]> = [
    ["ISO27001", null, 3], ["ISO27001", "A.5", 3], ["ISO27001", "A.7", 4], ["ISO27001", "A.8", 4],
    ["ISO42001", null, 3], ["NIS2", null, 3], ["NIS2", "T07", 4], ["NIS2", "T11", 4], ["NIS2", "T12", 4], ["AIACT", null, 3],
  ];
  await q(supabase.from("maturity_targets").insert(ziele.map(([framework, family_id, target]) => ({ tenant_id: tenantId, framework, family_id, target, updated_by: userId }))) as any, "maturity_targets");

  // ── 4) Umsetzungsverlauf für Dashboard (Monat/Woche/Kumulativ/Prognose) ──
  // Dieselbe Regel wie Implementation.tsx (fertig = 1 am Abschlussdatum, laufend = 0,5
  // am Beginn); sonst entsteht der Datensatz erst beim ersten Besuch der Umsetzung.
  const implByKey = new Map(k.impl.map(r => [r.bundle_key, r]));
  const events: Array<{ k: string; d: string; w: number; f: string[] }> = [];
  for (const b of k.buendel) {
    const r = implByKey.get(b.bundle_key);
    if (!r || (r.status !== "fertig" && r.status !== "laufend")) continue;
    const d = r.status === "fertig" ? r.completed_at : r.first_implemented_at;
    if (!d) continue;
    events.push({ k: b.bundle_key, d, w: r.status === "fertig" ? 1 : 0.5, f: [...new Set(b.memberControlIds.map(m => m.split(":")[0]))] });
  }
  const total = k.buendel.filter(b => !b.memberControlIds.every(m => k.antwortMap.get(m) === "na")).length;
  blobs["umsetzung-progress"] = { total, events };

  // ── 5) Risikoanalyse → Behandlungsplan (Phase 04) ─────────────────────────
  step("Risikoanalyse: Behandlungsplan, Restrisiko, FAIR …");
  const { risks, treatments } = await risikoBehandlung(k, assetAnswers);
  blobs["risk-treatment"] = { treatments, implementedControls: [] };

  // FAIR-Szenarien (quantitativ, Expertenmodus) für die drei größten Risiken + Modelldrift
  const topRisks = [...risks].sort((a, b) => b.risk_score - a.risk_score).slice(0, 3);
  const fair = [
    ...topRisks.map((r, i) => ({ risk_id: r.risk_id, inputs: [
      { lefMin: 0.1, lefLikely: 0.4, lefMax: 1.5, lmMin: 250_000, lmLikely: 1_200_000, lmMax: 6_000_000 },
      { lefMin: 0.2, lefLikely: 0.8, lefMax: 3, lmMin: 80_000, lmLikely: 350_000, lmMax: 1_800_000 },
      { lefMin: 0.5, lefLikely: 2, lefMax: 6, lmMin: 15_000, lmLikely: 90_000, lmMax: 400_000 },
    ][i] })),
    { risk_id: "custom-demo-1", inputs: { lefMin: 0.2, lefLikely: 0.6, lefMax: 2, lmMin: 50_000, lmLikely: 400_000, lmMax: 2_500_000 } },
  ];
  await q(supabase.from("quant_scenarios").insert(fair.map(f => ({ tenant_id: tenantId, risk_id: f.risk_id, mode: "light", inputs: f.inputs, updated_by: userId }))) as any, "quant_scenarios");

  // ── 6) SoA: Begründungen, freigegebene Versionen, Roadmap-Zieltermin ──────
  step("SoA-Begründungen und Freigaben …");
  const BEGR = [
    "Nicht einschlägig: Nordwerk übt die zugrunde liegende Tätigkeit nicht aus (Scope-Prüfung 03/2026, bestätigt durch die Geschäftsführung).",
    "Nicht anwendbar: betrifft Anbieter/Hersteller-Pflichten; Nordwerk ist für dieses System ausschließlich Betreiber.",
    "Ausgeschlossen: keine eigene Softwareentwicklung für Dritte; Eigenentwicklungen werden über A.8.25–A.8.31 abgedeckt.",
    "Nicht relevant: keine grenzüberschreitenden Dienste außerhalb der EU; Tätigkeit ausschließlich im Netzgebiet Nord.",
    "Nicht anwendbar: Anforderung richtet sich an Anbieter von GPAI-Modellen; Nordwerk nutzt Modelle nur über Dienstleister.",
  ];
  // Begründungsart je Textbaustein (SoA-Prüfbericht C-2): Rolle / System
  const BEGR_ART = ["system", "rolle", "rolle", "system", "rolle"] as const;
  const soaControls: Record<string, { applicable: boolean; justification: string; reasonType: string }> = {};
  for (const [key, a] of k.antwortMap) {
    if (a !== "na") continue;
    const fw = key.split(":")[0];
    const idx = fw === "AIACT" || fw === "ISO42001" ? (hash(key) < 0.5 ? 1 : 4) : Math.floor(hash(key) * 4) % 4 === 1 ? 0 : Math.floor(hash(key) * 4) % 4;
    if (fw === "AIACT" && k.kiSysteme) {
      const row = k.ctrls.find(c => c.framework === "AIACT" && c.id === key.slice(6));
      const j = row ? untriggeredJustification({ id: row.id, catalog: catalogMetaOf(row.meta) }, k.kiSysteme) : null;
      if (j) { soaControls[key] = { applicable: false, reasonType: j.reasonType, justification: j.de }; continue; }
    }
    soaControls[key] = DEMO_GATE_CONTROLS.has(key)
      ? { applicable: false, reasonType: "system", justification: "Nicht anwendbar: Nordwerk betreibt kein TLD-Namenregister und bietet keine Domain-Registrierung an (Scope-Frage APP-DOM = Nein)." }
      : { applicable: false, reasonType: BEGR_ART[idx], justification: BEGR[idx] };
  }
  blobs["soa"] = { controls: soaControls, annex: {} };
  const naListe = Object.entries(soaControls).map(([key, v]) => ({ framework: key.split(":")[0], controlId: key.split(":").slice(1).join(":"), applicable: false, justification: v.justification }));
  const bewertbar = k.ctrls.filter(c => !c.tags?.includes("sub") && (c.meta as any)?.scored !== false).length;
  const stats = { total: bewertbar, applicable: bewertbar - naListe.length, notApplicable: naListe.length, missingJustification: 0 };
  await q(supabase.from("org_tool_data").upsert({ tenant_id: tenantId, tool_key: "soa-versions", updated_by: userId, data: { versions: [
    { version: 1, created_at: iso(-190), approved_by: P["demo-p01"], note: "Erstfreigabe ISMS (ISO 27001 / NIS2) vor dem internen Audit.",
      stats: { ...stats, notApplicable: naListe.filter(c => c.framework === "ISO27001" || c.framework === "NIS2").length, applicable: bewertbar - naListe.filter(c => c.framework === "ISO27001" || c.framework === "NIS2").length },
      controls: naListe.filter(c => c.framework === "ISO27001" || c.framework === "NIS2") },
    { version: 2, created_at: iso(-18), approved_by: P["demo-p01"], note: "Erweiterung um EU AI Act und ISO/IEC 42001 (KI-Register, Hochrisiko-Einstufung).", stats, controls: naListe },
  ] } }, { onConflict: "tenant_id,tool_key" }) as any, "soa-versions");
  blobs["nis2-roadmap-config"] = {
    targetDate: iso(270), checkpointPcts: [25, 50, 75, 100], phaseDays: { now: 90, next: 90, later: 180 },
    fte: 1, fteByRole: { it: 1.5, isb: 1, mgmt: 0.1, fach: 0.3 }, daysMode: "auto",
  };

  // ── 7) Audit-Programm: Vorjahr, abgeschlossen, LAUFEND, Zertifizierung ─────
  step("Audit-Programm …");
  const audit = await auditProgramm(k, risks);
  blobs["audit-workbench"] = audit.state;
  blobs["audit-actions"] = { actions: audit.actions };

  // ── 8) Management-Review: zwei Reviews mit vollständigem Snapshot ──────────
  const topR = [...risks].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5)
    .map(r => ({ title: (r as any).gap_title ?? r.capability_tag, level: r.risk_level, score: r.risk_score }));
  const mr0 = k.review.reviews[0];
  blobs["management-review"] = { reviews: [
    { id: "demo-mr0", createdAt: iso(-745), teilnehmer: `${P["demo-p01"]}, ${P["demo-p02"]}, ${P["demo-p03"]}`,
      beschluesse: "ISMS-Aufbau nach ISO/IEC 27001 beschlossen; CISO-Stelle geschaffen; NIS2-Betroffenheit prüfen lassen.",
      chancen: "Zertifizierung als Voraussetzung für Konzessionsverfahren der Kommunen.", ressourcen: "Budget ISMS-Aufbau 180 T€, externe Beratung 40 PT.",
      nis2Kenntnisnahme: "NIS2-Umsetzungsgesetz zur Kenntnis genommen; Betroffenheitsanalyse beauftragt.", nis2Bestaetigt: false,
      snapshot: { compliance: [{ framework: "ISO27001", pct: 18, applicable: 300 }, { framework: "NIS2", pct: 14, applicable: 250 }], topRisks: topR.slice(0, 3).map(r => ({ ...r, score: Math.min(25, r.score + 4) })), incidents: { total: 5, open: 1, critical: 0 }, openDeadlines: 6 } },
    { ...mr0, snapshot: { ...mr0.snapshot,
      compliance: [{ framework: "ISO27001", pct: 38, applicable: 308 }, { framework: "NIS2", pct: 31, applicable: 247 }, { framework: "ISO42001", pct: 18, applicable: 104 }, { framework: "AIACT", pct: 12, applicable: 96 }],
      topRisks: topR } },
  ] };
  await q(supabase.from("kpi_snapshots").insert([
    { taken_at: iso(-745), v: { ISO27001: 0.18, NIS2: 0.14 }, risk: 20, inc: [5, 1, 0], dl: 6 },
    { taken_at: iso(-380), v: { ISO27001: 0.38, NIS2: 0.31, ISO42001: 0.18, AIACT: 0.12 }, risk: topR[0]?.score ?? 16, inc: [2, 0, 0], dl: 3 },
  ].map(s => {
    const vals = Object.values(s.v); const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const metrics: Record<string, number> = { mr_avg_compliance: avg, mr_incidents_total: s.inc[0], mr_incidents_open: s.inc[1], mr_incidents_critical: s.inc[2], mr_open_deadlines: s.dl, mr_top_risk_score: s.risk };
    for (const [fw, v] of Object.entries(s.v)) metrics[`mr_compliance_${fw}`] = v;
    return { tenant_id: tenantId, taken_at: s.taken_at, metrics, has_data: Object.fromEntries(Object.keys(metrics).map(m => [m, true])), source: "management_review" };
  })) as any, "kpi_snapshots (Management-Review)");

  // ── 9) Control-Monitoring: Tests + Ergebnisverlauf ─────────────────────────
  step("Control-Monitoring …");
  await controlMonitoring(k);

  // ── 10) Nachweise: mehr Belege an erfüllten Kontrollen ─────────────────────
  step("Nachweise …");
  await weitereNachweise(k);

  // ── 11) Schulungen: Themenstand, Jahresplan, Quiz, fällige Wiederholungen ──
  step("Schulungen …");
  blobs["training"] = schulungen(k);
  const quiz = [
    ["Thomas Albers", "management", 18, 20], ["Miriam Hoffmann", "it", 17, 20], ["Felix Wagner", "it", 19, 20], ["Sabine Wolff", "procurement", 14, 20],
    ["Markus Lehmann", "management", 12, 20], ["Stefan Kühn", "ot", 16, 20], ["Julia Schröder", "all", 20, 20], ["Jonas Brandt", "all", 15, 20],
  ] as const;
  await q(supabase.from("training_quiz_results").insert(quiz.map(([n, track, score, total], i) => ({
    user_id: tenantId, role_track: track, participant_name: n, participant_email: `${n.split(" ")[0][0].toLowerCase()}.${n.split(" ").slice(-1)[0].toLowerCase().replace("ü", "ue").replace("ö", "oe")}@nordwerk-demo.example`,
    score, total_questions: total, passed: score / total >= 0.7, answers: {}, taken_at: iso(-(12 + i * 17)),
  }))) as any, "training_quiz_results");
  // Wiederholungen: einige Nachweise sind fällig bzw. überfällig
  const alt = [["a01", "Sabine Wolff", "Leiterin Einkauf", -372], ["a03", "Markus Lehmann", "Personalleiter", -358], ["a02", "Stefan Kühn", "Leiter Netzbetrieb (OT)", -380], ["g02", "Dr. Katrin Weber", "Geschäftsführerin", -345]] as const;
  await q(supabase.from("training_completions").insert(alt.map(([topic, n, rolle, d]) => ({
    user_id: tenantId, topic_id: topic, role_track: topic.startsWith("g") ? "management" : "all", participant_name: n, participant_email: "",
    participant_role: rolle, completed_at: iso(d), next_due_at: iso(d + 365), notes: "Wiederholung fällig",
  }))) as any, "training_completions (fällig)");

  // ── 12) Vorfälle mit Bewertung und Meldekette ─────────────────────────────
  step("Vorfälle und Meldeketten …");
  const inc = await vorfaelle(k);
  blobs["incident-register"] = { incidents: inc };

  // ── 13) Beschaffung, Datenschutz, Lieferanten, DORA, BCM ─────────────────
  step("Beschaffung, Datenschutz, Lieferanten, BCM …");
  blobs["procurement-check"] = { requests: BESCHAFFUNG(P) };
  blobs["datenschutz-cockpit"] = DATENSCHUTZ();
  blobs["supplier-check"] = { suppliers: lieferanten(k) };
  blobs["tprm"] = { dienstleister: dora(k) };
  blobs["bcm"] = bcm(k);

  // ── 14) Dokumente + Richtlinien vervollständigen ───────────────────────────
  blobs["document-lifecycle"] = { docs: [...k.docs, ...MEHR_DOCS(P)] };
  blobs["policies"] = { ...k.policies, ...mehrRichtlinien(k) };

  // ── 15) Fristen-Historie (Fristen-Treue im Posture-Score) ──────────────────
  const erledigt = [
    ["document_review", "ISO27001", "Richtlinien-Review Informationssicherheitsleitlinie", -300, -4],
    ["training_cycle", "NIS2", "Awareness-Schulung Belegschaft 1. Halbjahr", -250, -9],
    ["exercise", "NIS2", "Blackout-Übung Leitwarte", -105, -5],
    ["evidence_review", "ISO27001", "Rezertifizierung Zugriffsrechte SAP", -160, -2],
    ["audit_cycle", "ISO27001", "Internes ISMS-Audit durchführen", -125, -3],
    ["ai_act_deadline", "AIACT", "KI-Kompetenz-Maßnahmen nach Art. 4 dokumentieren", -60, 6],
    ["document_review", "ISO42001", "KI-Politik freigeben", -95, -1],
  ] as const;
  await q(supabase.from("compliance_deadlines").insert(erledigt.map(([kind, framework, label, due, delta]) => ({
    tenant_id: tenantId, kind, framework, label, status: "done", starts_at: iso(due - 60), due_at: iso(due), done_at: iso(due + delta), meta: { demo: true },
  }))) as any, "compliance_deadlines (erledigt)");

  return blobs;
}

// ═══════════════════════════════════════════════════════════════════════════
// Bewertungen je Asset: technische Kontrollen weichen am konkreten System ab.
function assetBewertungen(k: DemoKontext): any[] {
  const regeln: Array<{ re: RegExp; assets: Array<[string, Antwort, number]> }> = [
    { re: /MFA|Mehr-?Faktor|Authentifizier/i, assets: [["scada", "nein", 1], ["ad", "ja", 4], ["portal", "teilweise", 2], ["sap", "teilweise", 3]] },
    { re: /Patch|Schwachstell|Aktualisier/i, assets: [["scada", "nein", 1], ["rtu", "nein", 0], ["clients", "ja", 4], ["vm", "teilweise", 3]] },
    { re: /Sicherung|Backup|Wiederherstell/i, assets: [["backup", "ja", 4], ["hana", "ja", 4], ["historian", "teilweise", 2], ["modell", "nein", 1]] },
    { re: /Protokoll|Logging|Ereignis/i, assets: [["fw", "ja", 4], ["scada", "teilweise", 2], ["chatbot", "teilweise", 2], ["bewerber", "nein", 1]] },
    { re: /Verschlüssel|Kryptogra/i, assets: [["hana", "ja", 4], ["clients", "ja", 5], ["rtu", "nein", 1], ["exo", "ja", 4]] },
    { re: /Netz.*(Segment|Trenn)|Segmentier/i, assets: [["fw", "ja", 4], ["scada", "teilweise", 3], ["rtu", "teilweise", 2]] },
  ];
  const out: any[] = [];
  const seen = new Set<string>();
  for (const r of regeln) {
    const treffer = k.ctrls.filter(c => (c.framework === "ISO27001" || c.framework === "NIS2") && !c.tags?.includes("sub") && r.re.test(c.req_de ?? "")).slice(0, 2);
    for (const c of treffer) for (const [key, antwort, reif] of r.assets) {
      const a = k.ast(key);
      const id = `${c.framework}:${c.id}:${a.id}`;
      if (!a.id || seen.has(id)) continue;
      seen.add(id);
      out.push({ tenant_id: k.tenantId, framework: c.framework, control_id: c.id, asset_id: a.id, antwort, reifegrad: reif,
        evidence: antwort === "ja" ? "Konfigurationsnachweis im DMS" : null,
        note: antwort === "nein" ? `Am System „${a.name}" noch nicht umgesetzt (Herstellerfreigabe ausstehend).` : antwort === "teilweise" ? `Am System „${a.name}" nur teilweise umgesetzt.` : null,
        updated_by: k.userId, updated_at: iso(-Math.round(20 + hash(id) * 200)) });
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// Risikoanalyse wie Phase 04 (gapEngine → riskEngine → treatmentEngine), dann
// realistische Behandlungsentscheidungen mit Restrisiko und Akzeptanz.
async function risikoBehandlung(k: DemoKontext, assetAnswers: any[]): Promise<{ risks: RiskObject[]; treatments: TreatmentObject[] }> {
  const fws = k.frameworks;
  const [nodeMembers, isoMaps, assets, services, deps] = await Promise.all([
    alle<{ node_id: string; framework: string; control_id: string }>((f, t) => supabase.from("control_node_member").select("node_id, framework, control_id").order("node_id").order("framework").order("control_id").range(f, t), "control_node_member"),
    alle<any>((f, t) => supabase.from("control_iso").select("framework, control_id, iso_id").in("framework", fws).order("framework").order("control_id").order("iso_id").range(f, t), "control_iso"),
    q<any[]>(supabase.from("assets").select("id, service_id, asset_name, asset_type, environment, inherited_criticality, user_override_criticality").eq("user_id", k.tenantId) as any, "assets"),
    q<any[]>(supabase.from("services").select("id, name, criticality, category").eq("user_id", k.tenantId) as any, "services"),
    q<any[]>(supabase.from("dependencies").select("source_type, source_id, target_type, target_id, is_spof, criticality").eq("user_id", k.tenantId) as any, "dependencies"),
  ]);
  const nodeOf = new Map(nodeMembers.map(n => [`${n.framework}::${n.control_id}`, n.node_id]));
  const findingControls = k.ctrls.filter(c => !c.tags?.includes("sub") && (c.meta as any)?.scored !== false);
  const findingSet = new Set(findingControls.map(c => `${c.framework}::${c.id}`));
  const seenNode = new Set<string>();
  const eff: any[] = [];
  for (const c of findingControls) {
    const a = k.antwortMap.get(`${c.framework}:${c.id}`);
    if (a !== "nein" && a !== "teilweise") continue;
    const node = nodeOf.get(`${c.framework}::${c.id}`);
    if ((c.meta as any)?.coverage !== "delta" && node) { if (seenNode.has(node)) continue; seenNode.add(node); }
    eff.push({ framework: c.framework, control_id: c.id, asset_id: null, antwort: a, reifegrad: null, note: null });
  }
  for (const a of assetAnswers) {
    if ((a.antwort === "nein" || a.antwort === "teilweise") && findingSet.has(`${a.framework}::${a.control_id}`))
      eff.push({ framework: a.framework, control_id: a.control_id, asset_id: a.asset_id, antwort: a.antwort, reifegrad: null, note: a.note });
  }
  const { findings, gaps } = buildFindingsAndGaps(findingControls as any, eff, assets, services);
  const assetInfos = toAssetInfo(assets, services, deps);
  const depTuples = deps.filter(d => (d.source_type ?? "asset") === "asset" && (d.target_type ?? "asset") === "asset").map(d => ({ source_asset_id: d.source_id, target_asset_id: d.target_id }));
  const result = generateRisks({ gaps, findings, assets: assetInfos, dependencies: depTuples, config: DEFAULT_RISK_CONFIG });
  const plan = generateTreatmentPlan({ risks: result.risks, gaps, findings, assets: assetInfos, existingTreatments: [], frameworkControls: k.ctrls as any, controlIsoMappings: isoMaps, enabledFrameworks: fws });
  const riskById = new Map(result.risks.map(r => [r.risk_id, r]));

  const sorted = [...plan.treatments].sort((a, b) => (riskById.get(b.risk_id)?.risk_score ?? 0) - (riskById.get(a.risk_id)?.risk_score ?? 0));
  const out: TreatmentObject[] = sorted.map((t, i) => {
    const r = riskById.get(t.risk_id)!;
    const h = hash(t.risk_id);
    // Strategie: überwiegend mindern; einzelne bewusste Akzeptanzen/Übertragungen.
    let strategy: TreatmentStrategy = "mitigate";
    if (i === 6 || i === 11) strategy = "accept";
    else if (i === 4 || i === 9) strategy = "transfer";
    else if (i === 13) strategy = "avoid";
    const sel = (t.selected_control_ids ?? []).slice(0, 3 + Math.floor(h * 3));
    const status = strategy === "accept" ? "done" : h < 0.3 ? "done" : h < 0.7 ? "in_progress" : "planned";
    const s = suggestResidualLI(strategy, r.likelihood, r.impact, sel.length);
    const resL = strategy === "mitigate" ? Math.max(1, Math.min(s.likelihood, r.likelihood - 1)) : s.likelihood;
    const resI = strategy === "mitigate" && h < 0.5 ? Math.max(1, r.impact - 1) : s.impact;
    const hochAkzeptanz = strategy === "accept" && (r.risk_level === "high" || r.risk_level === "critical");
    return {
      ...t, strategy, selected_control_ids: strategy === "accept" ? [] : sel, status,
      owner: k.person(1 + (i % 8)), due_date: status === "done" ? tag(-Math.round(10 + h * 90)) : tag(Math.round(20 + h * 160)),
      risk_level: r.risk_level, capability_tag: r.capability_tag,
      justification: {
        mitigate: "Risiko liegt über dem Appetit; Minderung durch die ausgewählten Maßnahmen bis zum Zieltermin.",
        accept: "Restrisiko bewusst getragen: Maßnahmenkosten stehen in keinem Verhältnis zur Schadenshöhe; jährliche Neubewertung.",
        transfer: "Übertragung über Cyber-Versicherung (Police 2026) und vertragliche Haftungsregelung mit dem Dienstleister.",
        avoid: "Tätigkeit eingestellt: Altsystem abgeschaltet, Funktion in das zentrale System überführt.",
      }[strategy],
      residual_likelihood: resL, residual_impact: resI,
      residual_accepted_by: status === "done" ? P_(k, "demo-p01") : null, residual_accepted_at: status === "done" ? tag(-Math.round(5 + h * 40)) : null,
      ...(hochAkzeptanz || strategy === "accept" ? {
        acceptance_justification: "Akzeptanz durch die Geschäftsführung nach Kosten-Nutzen-Bewertung; Überwachung über KPI und jährliche Neubewertung im Management-Review.",
        acceptance_approver: P_(k, "demo-p01"), acceptance_date: tag(-30),
      } : {}),
    } as TreatmentObject;
  });
  // Behandlungen der manuell erfassten KI-Risiken
  for (const [i, m] of k.manualRisks.risks.entries()) {
    const lvl = scoreAndLevel(m.likelihood, m.impact, DEFAULT_RISK_CONFIG).level;
    out.push({
      treatment_id: `treat-${m.id}`, risk_id: m.id, strategy: "mitigate", selected_control_ids: [], status: i === 0 ? "in_progress" : "planned",
      justification: ["Monitoring der Prognosegüte (Drift-Erkennung) und Freigabeprozess für Modellwechsel.", "Prompt-Filter, Themenbegrenzung und Übergabe an Mitarbeitende bei unsicheren Antworten.", "Bias-Prüfung der Trainingsdaten, menschliche Letztentscheidung, FRIA vor Einsatz."][i] ?? "",
      owner: P_(k, "demo-p05"), due_date: tag(45 + i * 30), risk_level: lvl,
      residual_likelihood: Math.max(1, m.likelihood - 1), residual_impact: m.impact, residual_accepted_by: null, residual_accepted_at: null,
    } as TreatmentObject);
  }
  return { risks: result.risks, treatments: out };
}
const P_ = (k: DemoKontext, id: string) => k.P[id];

// ═══════════════════════════════════════════════════════════════════════════
// Audit-Programm: Vorjahres-Audit (abgeschlossen), ISMS-Audit (abgeschlossen),
// laufendes AIMS-Audit (aktiv, bearbeitbar) und geplantes Zertifizierungsaudit.
async function auditProgramm(k: DemoKontext, risks: RiskObject[]) {
  const { P, person } = k;
  const req = new Map(k.ctrls.map(c => [`${c.framework}:${c.id}`, c.req_de ?? c.id]));
  const neinVon = (fws: string[]) => [...k.antwortMap.entries()].filter(([key, a]) => a === "nein" && fws.includes(key.split(":")[0]) && !DEMO_GATE_CONTROLS.has(key)).map(([key]) => key);
  const isms = neinVon(["ISO27001", "NIS2"]);
  const aims = neinVon(["ISO42001", "AIACT"]);
  const pick = (arr: string[], start: number, n: number) => arr.filter((_, i) => i % 3 === 0).slice(start, start + n);
  const a1Keys = pick(isms, 0, 8), a0Keys = pick(isms, 8, 6), a2Keys = pick(aims, 0, 10);

  // Risiko-Katalog je Kontrolle (control_risk) für die Spalte „Risiken"
  const alleKeys = [...a0Keys, ...a1Keys, ...a2Keys];
  const ids = [...new Set(alleKeys.map(x => x.split(":").slice(1).join(":")))];
  const cr = ids.length ? await q<any[]>(supabase.from("control_risk").select("framework, control_id, risk_id").in("control_id", ids) as any, "control_risk") : [];
  const riskOf = (key: string) => cr.filter(r => `${r.framework}:${r.control_id}` === key).map(r => r.risk_id).slice(0, 2);
  const zuTop = risks.slice(0, 1);

  const SEV = ["major", "minor", "minor", "beobachtung"] as const;
  const item = (key: string, i: number, audit: "a0" | "a1" | "a2"): AuditItem => {
    const text = kurz(req.get(key), 120);
    const sev = audit === "a2" ? (i < 2 ? "major" : i < 7 ? "minor" : "beobachtung") : SEV[i % 4];
    const state = audit === "a0" ? "erledigt" : audit === "a1" ? (i < 3 ? "in_bearbeitung" : i < 5 ? "offen" : "erledigt") : (i < 3 ? "offen" : i < 7 ? "in_bearbeitung" : "erledigt");
    const due = audit === "a0" ? tag(-420 + i * 12) : audit === "a1" ? tag(20 + i * 10) : tag(30 + i * 7);
    const done = state === "erledigt";
    return {
      severity: sev, riskIds: riskOf(key),
      manualRisks: i === 0 && zuTop[0] ? [{ id: "mr-" + key, text: kurz((zuTop[0] as any).gap_title ?? zuTop[0].capability_tag, 90) }] : [],
      measures: `${text} — verbindlich regeln, Zuständigkeit festlegen und die Umsetzung mit Nachweis belegen.`,
      note: `Feststellung: ${sev === "major" ? "Anforderung nicht umgesetzt" : sev === "minor" ? "Umsetzung lückenhaft" : "Verbesserungspotenzial"}; Stichprobe ${2 + (i % 4)} von ${6 + (i % 5)} Vorgängen ohne Nachweis. Interview mit ${person(2 + (i % 6)).split(" (")[0]}.`,
      evidence: state === "offen" ? "" : `Ticket CHG-2026-0${400 + i * 7} · DMS://Audit/${audit.toUpperCase()}/${i + 1}`,
      state, owner: person(1 + (i % 8)), due,
      ...(state !== "offen" ? { recheck: tag((audit === "a0" ? -380 : audit === "a1" ? 50 : 60) + i * 10) } : {}),
      ...(done ? { closedAt: audit === "a0" ? iso(-400 + i * 5) : iso(-5 - i) } : {}),
    };
  };
  const items = (keys: string[], a: "a0" | "a1" | "a2") => Object.fromEntries(keys.map((key, i) => [key.replace(":", "::"), item(key, i, a)]));
  const a0: AuditRecord = { id: "demo-a0", typ: "intern", titel: "Internes Audit ISMS 2025 (ISO 27001)", auditor: P["demo-p09"], datum: tag(-485), status: "abgeschlossen",
    urteil: "Konform mit Auflagen: 1 Hauptabweichung (Risikobeurteilung), 3 Nebenabweichungen. Alle Maßnahmen fristgerecht umgesetzt.",
    scopeFrameworks: ["ISO27001"], items: items(a0Keys, "a0"), abgeschlossenAm: tag(-478), naechstesAudit: tag(-120), createdAt: iso(-490) };
  const a1: AuditRecord = { id: "demo-a1", typ: "intern", titel: "Internes Audit ISMS 2026 (ISO 27001 / NIS2)", auditor: P["demo-p09"], datum: tag(-120), status: "abgeschlossen",
    urteil: "Mit Auflagen konform: 2 Hauptabweichungen, 4 Nebenabweichungen, 2 Beobachtungen.",
    scopeFrameworks: ["ISO27001", "NIS2"], items: items(a1Keys, "a1"), abgeschlossenAm: tag(-110), naechstesAudit: tag(245), createdAt: iso(-125) };
  const a2: AuditRecord = { id: "demo-a2", typ: "intern", titel: "Internes AIMS-Audit 2026 (ISO/IEC 42001 / KI-VO)", auditor: `${P["demo-p09"]} mit externer Unterstützung`, datum: tag(-5), status: "laufend",
    urteil: "Zwischenstand: Hochrisiko-Pflichten nach Anhang III noch nicht vollständig vorbereitet; KI-Kompetenz (Art. 4) weitgehend nachgewiesen.",
    scopeFrameworks: ["ISO42001", "AIACT"], items: items(a2Keys, "a2"), createdAt: iso(-12) };
  const a3: AuditRecord = { id: "demo-a3", typ: "zertifizierung", titel: "ISO 27001 Überwachungsaudit (Zertifizierungsstelle)", auditor: "Zertifizierungsstelle (extern)", datum: tag(120), status: "geplant",
    urteil: "", scopeFrameworks: ["ISO27001"], items: {}, createdAt: iso(-30) };
  const state: AuditState = { items: a2.items, auditor: a2.auditor, datum: a2.datum, urteil: a2.urteil, audits: [a0, a1, a2, a3], activeAuditId: "demo-a2" };

  // Übergabe in die Umsetzung (Korrekturmaßnahmen) — konsistent zum Befundstatus
  const actions: any[] = [];
  const push = (rec: AuditRecord, maxN: number) => Object.entries(rec.items).filter(([, it]) => it.severity !== "beobachtung").slice(0, maxN).forEach(([ik, it], i) => {
    const [fw, cid] = ik.split("::");
    const done = it.state === "erledigt";
    actions.push({ id: `demo-${rec.id}-aa${i + 1}`, framework: fw, controlId: cid, controlReq: kurz(req.get(`${fw}:${cid}`), 180), severity: it.severity === "major" ? "major" : "minor",
      measure: it.measures, createdAt: rec.id === "demo-a2" ? iso(-4) : rec.id === "demo-a1" ? iso(-110) : iso(-478), done, owner: it.owner, due: it.due,
      ...(done ? { doneAt: it.closedAt ?? iso(-3) } : {}), auditId: rec.id });
  });
  push(a0, 4); push(a1, 6); push(a2, 5);
  return { state, actions };
}

// ═══════════════════════════════════════════════════════════════════════════
async function controlMonitoring(k: DemoKontext) {
  const links = await q<any[]>(supabase.from("answer_evidence").select("framework, control_id, evidence_id").eq("tenant_id", k.tenantId).limit(40) as any, "answer_evidence lesen");
  const ja = [...k.antwortMap.entries()].filter(([, a]) => a === "ja").map(([key]) => key);
  const tests: Array<{ framework: string; control_id: string; kind: string; label: string; config: any; interval_hours: number; enabled?: boolean; verlauf: string[]; ev?: string | null }> = [];
  links.slice(0, 5).forEach((l, i) => tests.push({ framework: l.framework, control_id: l.control_id, kind: "evidence_present", label: `Nachweis vorhanden · ${l.framework} ${l.control_id}`, config: {}, interval_hours: 24,
    verlauf: i === 4 ? ["fail", "fail", "pass", "pass", "pass", "pass"] : ["pass", "pass", "pass", "pass", "fail", "pass"], ev: l.evidence_id }));
  ja.slice(0, 4).forEach((key, i) => { const [fw, cid] = [key.split(":")[0], key.split(":").slice(1).join(":")];
    tests.push({ framework: fw, control_id: cid, kind: "answer_review_age", label: `Bewertung aktuell (≤ 365 Tage) · ${fw} ${cid}`, config: { max_age_days: 365 }, interval_hours: 168,
      verlauf: i === 3 ? ["fail", "fail", "fail", "pass"] : ["pass", "pass", "pass", "pass"] }); });
  const nein = [...k.antwortMap.entries()].filter(([, a]) => a === "nein").map(([key]) => key);
  nein.slice(0, 2).forEach(key => { const [fw, cid] = [key.split(":")[0], key.split(":").slice(1).join(":")];
    tests.push({ framework: fw, control_id: cid, kind: "deadline_adherence", label: `Fristen eingehalten · ${fw} ${cid}`, config: {}, interval_hours: 24, verlauf: ["fail", "fail", "pass", "pass", "pass"] }); });
  const mfa = k.ctrls.find(c => c.framework === "ISO27001" && /MFA|Mehr-?Faktor/i.test(c.req_de ?? ""));
  if (mfa) tests.push({ framework: "ISO27001", control_id: mfa.id, kind: "webhook_pull", label: "MFA-Abdeckung aus Entra ID (Monitoring-API)",
    config: { url: "https://monitoring.nordwerk-demo.example/api/mfa", jsonpath: "$.status", expect: "ok" }, interval_hours: 24, verlauf: ["pass", "error", "pass", "pass", "fail", "pass"] });
  if (ja[10]) { const [fw, cid] = [ja[10].split(":")[0], ja[10].split(":").slice(1).join(":")];
    tests.push({ framework: fw, control_id: cid, kind: "evidence_present", label: `Nachweis vorhanden · ${fw} ${cid} (pausiert)`, config: {}, interval_hours: 168, enabled: false, verlauf: ["pass"] }); }

  const rows = await q<any[]>(supabase.from("control_tests").insert(tests.map(t => ({
    tenant_id: k.tenantId, framework: t.framework, control_id: t.control_id, node_id: null, kind: t.kind, label: t.label, schedule: null,
    config: t.config, enabled: t.enabled ?? true, interval_hours: t.interval_hours, created_at: iso(-60),
  }))).select("id") as any, "control_tests");
  const results: any[] = [];
  rows.forEach((row, i) => {
    const t = tests[i];
    t.verlauf.forEach((status, j) => {
      const ranAt = new Date(Date.now() - (j + 1) * t.interval_hours * 3600_000 - 3600_000).toISOString();
      let detail: any = { kind: t.kind, framework: t.framework, control_id: t.control_id };
      if (t.kind === "evidence_present") detail = { ...detail, fresh_evidence: status === "pass" ? 1 : 0 };
      if (t.kind === "answer_review_age") detail = { ...detail, max_age_days: 365, updated_at: iso(status === "pass" ? -120 : -400) };
      if (t.kind === "deadline_adherence") detail = { ...detail, overdue_deadlines: status === "fail" ? 1 : 0 };
      if (t.kind === "webhook_pull") detail = status === "error" ? { error: "HTTP 503", url: t.config.url } : { url: t.config.url, jsonpath: "$.status", expected: "ok", actual: status === "pass" ? "ok" : "degraded" };
      results.push({ tenant_id: k.tenantId, test_id: row.id, ran_at: ranAt, status, evidence_id: t.kind === "evidence_present" && status === "pass" ? (t.ev ?? null) : null, detail });
    });
  });
  if (results.length) await q(supabase.from("control_test_results").insert(results) as any, "control_test_results");
}

// ═══════════════════════════════════════════════════════════════════════════
async function weitereNachweise(k: DemoKontext) {
  const N = [
    ["Risikobehandlungsplan 2026 (freigegeben)", "document", 365], ["Asset-Inventar Export Q3", "document", 120], ["Firewall-Regelwerk Review OT-DMZ", "document", 180],
    ["Patch-Report Clients September", "log", 45], ["Schwachstellenscan Kundenportal", "log", 60], ["Pentest-Bericht Kundenportal 2026", "document", 365],
    ["Berechtigungsrezertifizierung SAP IS-U", "attestation", 180], ["Protokoll Krisenstabsübung", "document", 365], ["Lieferantenbewertung Siemens Energy", "document", 365],
    ["AVV Microsoft (DPA) mit Anlagen", "document", 720], ["Verschlüsselungskonzept v1.3", "document", 365], ["Logging-Konzept SIEM", "document", 365],
    ["KI-Folgenabschätzung Lastprognose", "document", 365], ["Bias-Test Bewerber-Ranking Q2", "log", 120], ["Transparenzhinweis Chatbot (Screenshot)", "screenshot", 365],
    ["Schulungsnachweis Geschäftsleitung § 38 BSIG", "attestation", 365], ["Notfallhandbuch Leitwarte v4", "document", 365], ["Backup-Konzept Immutable Storage", "document", 365],
    ["Protokoll Management-Review 2025", "document", -20], ["Datenschutz-Folgenabschätzung Kundenportal", "document", 365],
  ] as const;
  const rows = await q<any[]>(supabase.from("evidence").insert(N.map(([title, kind, valid], i) => ({
    tenant_id: k.tenantId, title, kind, external_url: `https://dms.nordwerk-demo.example/nachweise/${i + 7}`, description: "Abgelegt im Dokumentenmanagement (DMS).",
    collected_at: iso(-(15 + i * 11)), valid_until: tag(valid - Math.round(i * 3)), collected_by: k.userId,
  }))).select("id") as any, "evidence (weitere)");
  const ja = [...k.antwortMap.entries()].filter(([, a]) => a === "ja").map(([key]) => key);
  const links: any[] = [];
  const seen = new Set<string>();
  rows.forEach((e, i) => {
    for (let j = 0; j < 7; j++) {
      const key = ja[(i * 19 + j * 7 + 3) % Math.max(1, ja.length)];
      if (!key) continue;
      const fw = key.split(":")[0], cid = key.split(":").slice(1).join(":");
      const s = `${e.id}|${key}`;
      if (seen.has(s)) continue; seen.add(s);
      links.push({ evidence_id: e.id, tenant_id: k.tenantId, framework: fw, control_id: cid });
    }
  });
  if (links.length) await q(supabase.from("answer_evidence").insert(links) as any, "answer_evidence (weitere)");
}

// ═══════════════════════════════════════════════════════════════════════════
function schulungen(k: DemoKontext) {
  const topics = new Map(CATEGORIES.flatMap(c => c.topics).map(t => [t.id, t]));
  const fertig = ["g01", "g02", "g03", "g04", "a01", "a02", "a03", "a04", "a05", "a06", "a07", "i01", "i02", "i05", "i06", "r01", "r02", "s01", "p01", "t01", "t02", "t08", "x03"];
  const teilweise: Record<string, number> = { i03: 0.5, r04: 0.4, t03: 0.6 };
  const completions: Record<string, { completed: boolean; completionDate: string }> = {};
  const itemChecks: Record<string, Record<number, boolean>> = {};
  const docChecks: Record<string, Record<number, boolean>> = {};
  const alleIdx = (n: number, anteil = 1) => Object.fromEntries(Array.from({ length: Math.max(0, Math.round(n * anteil)) }, (_, i) => [i, true]));
  fertig.forEach((id, i) => {
    const t = topics.get(id); if (!t) return;
    completions[id] = { completed: true, completionDate: tag(-(20 + i * 9)) };
    itemChecks[id] = alleIdx(t.contentDe.length);
    docChecks[id] = alleIdx(t.docContentDe.length);
  });
  for (const [id, anteil] of Object.entries(teilweise)) {
    const t = topics.get(id); if (!t) continue;
    itemChecks[id] = alleIdx(t.contentDe.length, anteil);
    docChecks[id] = alleIdx(t.docContentDe.length, anteil * 0.5);
  }
  const plan: Array<[string, "Q1" | "Q2" | "Q3" | "Q4", "e_learning" | "workshop" | "tabletop" | "briefing", "planned" | "scheduled" | "in_progress" | "completed" | "overdue" | "deferred", string, Array<[string, number]>]> = [
    ["g01", "Q1", "briefing", "completed", "demo-p02", [["Geschäftsleitung", 3]]],
    ["g02", "Q1", "workshop", "completed", "demo-p02", [["Geschäftsleitung", 3], ["Bereichsleitungen", 8]]],
    ["a01", "Q2", "e_learning", "completed", "demo-p09", [["Gesamte Belegschaft", 420]]],
    ["a02", "Q3", "e_learning", "in_progress", "demo-p09", [["Gesamte Belegschaft", 420]]],
    ["i01", "Q2", "workshop", "completed", "demo-p03", [["IT", 18]]],
    ["i03", "Q3", "workshop", "in_progress", "demo-p03", [["IT", 18], ["SOC", 4]]],
    ["r04", "Q3", "tabletop", "overdue", "demo-p06", [["Krisenstab", 9], ["Leitwarte", 12]]],
    ["t03", "Q4", "workshop", "scheduled", "demo-p06", [["Netzbetrieb (OT)", 24]]],
    ["t05", "Q4", "e_learning", "planned", "demo-p06", [["Netzbetrieb (OT)", 24]]],
    ["s01", "Q2", "briefing", "completed", "demo-p07", [["Einkauf", 7]]],
  ];
  return {
    completions, itemChecks, docChecks,
    onboardingRequiredIds: ["a01", "a02", "a03", "p01"],
    trainingPlanSelectedIds: plan.map(p => p[0]),
    trainingPlanEntries: Object.fromEntries(plan.map(([id, quarter, deliveryMode, status, owner, groups]) => [id, {
      quarter, owner: k.P[owner], ownerEdited: false, deliveryMode, status,
      notes: status === "overdue" ? "Termin wegen Netzumbau verschoben — neuer Termin mit Krisenstab abstimmen." : "",
      participantGroups: groups.map(([label, count]) => ({ label, count })),
    }])),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
async function vorfaelle(k: DemoKontext): Promise<any[]> {
  const fw = ["NIS2", "AIACT"];
  const ASSESS: Record<string, VorfallAssessment> = {
    "demo-i1": { erheblich_nis2: "nein", personenbezug: "ja", risiko_betroffene: "normal", aiact_art73: "nein",
      begruendung: { erheblich_nis2: "Kein erheblicher Vorfall: keine Beeinträchtigung der Energieversorgung, begrenzter Schaden.", personenbezug: "E-Mail-Adressen im Postfach betroffen." } },
    "demo-i2": { erheblich_nis2: "ja", personenbezug: "nein", risiko_betroffene: "kein", aiact_art73: "nein",
      begruendung: { erheblich_nis2: "Ausfall der Fernwirkverbindung eines Umspannwerks > 1 h — erhebliche Störung des Netzbetriebs (§ 2 Nr. 11 BSIG)." } },
    "demo-i3": { erheblich_nis2: "nein", aiact_art73: "nein", personenbezug: "nein",
      begruendung: { aiact_art73: "Chatbot ist kein Hochrisiko-KI-System; kein schwerwiegender Vorfall nach Art. 3 Nr. 49 KI-VO." } },
    "demo-i4": { erheblich_nis2: "nein", personenbezug: "ja", risiko_betroffene: "kein",
      begruendung: { personenbezug: "Gerät vollständig verschlüsselt — kein Risiko für Betroffene (Art. 34 Abs. 3 lit. a DSGVO)." } },
    "demo-i5": { erheblich_nis2: "unbekannt", personenbezug: "unbekannt", aiact_art73: "nein",
      begruendung: { erheblich_nis2: "Ausmaß noch unklar — Frühwarnung vorsorglich vorbereiten (unbekannt = ja)." } },
  };
  const neu = { id: "demo-i5", title: "Ransomware-Verdacht auf Dateiserver Verwaltung", severity: "high", status: "investigating",
    detectedAt: vorStunden(19), occurredAt: vorStunden(21),
    description: "EDR meldet verdächtige Massenumbenennung von Dateien auf einem Dateiserver der Verwaltung; Server isoliert, Forensik läuft.",
    notes: "", impactDescription: "Ein Dateiserver (Verwaltung) isoliert; OT nicht betroffen.", measuresTaken: "Server vom Netz getrennt, Konten gesperrt, Forensik-Dienstleister beauftragt.",
    crossBorder: false, serviceRecipientsAffected: false };
  const offen = { id: "demo-i6", title: "Auffälliger Anmeldeversuch am Kundenportal (Credential Stuffing)", severity: "medium", status: "open",
    detectedAt: lokal(-1, 7, 40), description: "WAF meldet 12.000 fehlgeschlagene Anmeldungen aus einem Botnetz innerhalb von 2 Stunden.",
    notes: "", crossBorder: false, serviceRecipientsAffected: false };
  const liste = [...k.incidents.map(i => ({ ...i, notes: i.notes === "__demo__" ? "" : i.notes,
    // datetime-local ohne Zeitzone: lokale Zeit statt UTC-Ausschnitt
    detectedAt: fixLokal(i.detectedAt), occurredAt: fixLokal(i.occurredAt), containedAt: fixLokal(i.containedAt), resolvedAt: fixLokal(i.resolvedAt) })), neu, offen];

  const fristen: any[] = [];
  const out = liste.map(inc => {
    const a = ASSESS[inc.id];
    if (!a) return inc;
    const { meldungen, nichtAusgeloest } = resolveMeldepflichten(a, fw, new Date(inc.detectedAt).toISOString());
    const ms: MeldungInstanz[] = meldungen.map(m => {
      let status: MeldungInstanz["status"] = "offen";
      if (inc.id === "demo-i2") status = /abschluss|final/i.test(m.stufe + m.label) ? "entwurf" : "bestaetigt";
      if (inc.id === "demo-i5") status = /fr(ü|ue)hwarn|early/i.test(m.stufe + m.label) ? "entwurf" : "offen";
      return { ...m, status };
    });
    for (const m of ms) if (m.frist_ende && m.status !== "bestaetigt" && m.status !== "abgesendet" && m.status !== "entfallen") fristen.push({
      tenant_id: k.tenantId, kind: "incident_report", framework: m.framework, ref_table: "incidents", ref_id: inc.id, label: `${m.framework} · ${m.label}`,
      starts_at: m.frist_start, due_at: m.frist_ende, status: "open", meta: { stufe: m.stufe, empfaenger: m.empfaenger, rechtsgrundlage: m.rechtsgrundlage, frist: m.frist, demo: true },
    });
    return { ...inc, assessment: a, meldungen: ms, nichtAusgeloest, meldungenGeneriertAm: new Date(new Date(inc.detectedAt).getTime() + 2 * 3600_000).toISOString() };
  });
  if (fristen.length) await q(supabase.from("compliance_deadlines").insert(fristen) as any, "compliance_deadlines (Meldeketten)");
  return out;
}
/** „2026-07-17T07:00" (aus UTC geschnitten) → lokale Uhrzeit desselben Zeitpunkts. */
function fixLokal(v?: string): string | undefined {
  if (!v) return v;
  const t = Date.parse(v.length === 16 ? `${v}:00Z` : v);
  if (Number.isNaN(t)) return v;
  const x = new Date(t); const p = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
}

// ═══════════════════════════════════════════════════════════════════════════
const BESCHAFFUNG = (P: Record<string, string>) => {
  const alleJa = (ids: string[]) => Object.fromEntries(ids.map(i => [i, "yes"]));
  const SEC = ["sec-isms", "sec-enc", "sec-access", "sec-log", "sec-inc", "sec-bcp", "sec-pentest", "sec-exit"];
  const GDPR = ["gdpr-avv", "gdpr-tom", "gdpr-loc", "gdpr-sub", "gdpr-rights", "gdpr-dpia"];
  const SAAS = ["saas-slasa", "saas-tenant", "saas-audit"];
  return [
    { id: "demo-r1", appName: "Bewerbermanagement mit KI-Ranking", vendor: "HR-Tech Anbieter (Bewerber-Ranking)", requester: P["demo-p08"], purpose: "Vorauswahl von Bewerbungen für Ausbildungs- und Fachstellen.",
      deployment: "saas", dataClass: "special", certs: [], answers: { ...alleJa([...SEC, ...GDPR, ...SAAS]), "sec-pentest": "no", "sec-exit": "no", "gdpr-dpia": "no", "saas-audit": "no" },
      decision: "conditional", assessedOn: tag(-32), assessedBy: P["demo-p02"], archived: false, notes: "Auflagen: DSFA und FRIA vor Produktivbetrieb, Pentest-Nachweis nachreichen." },
    { id: "demo-r2", appName: "Microsoft 365 Copilot", vendor: "Microsoft Ireland Operations Ltd.", requester: P["demo-p03"], purpose: "KI-Assistenz für Verwaltung und Kundenservice.",
      deployment: "saas", dataClass: "personal", certs: ["ISO27001", "SOC2", "C5", "ISO27018"], answers: alleJa([...SEC, ...GDPR, ...SAAS]),
      decision: "approved", assessedOn: tag(-70), assessedBy: P["demo-p02"], archived: false, notes: "Freigabe mit Sensitivitätslabels; Pilotgruppe 40 Personen." },
    { id: "demo-r3", appName: "Mobile Außendienst-App (Zählerwechsel)", vendor: "FieldService Solutions GmbH", requester: P["demo-p06"], purpose: "Auftragsabwicklung und Fotodokumentation im Außendienst.",
      deployment: "hybrid", dataClass: "personal", certs: ["ISO27001"], answers: { "sec-isms": "yes", "sec-enc": "yes", "sec-access": "yes", "gdpr-avv": "yes", "gdpr-loc": "yes" },
      decision: "open", assessedOn: "", assessedBy: "", archived: false, notes: "Fragebogen beim Anbieter angefordert." },
    { id: "demo-r4", appName: "Kostenloses KI-Transkriptionstool", vendor: "TranscribeNow Inc.", requester: P["demo-p09"], purpose: "Protokolle aus Besprechungsaufnahmen.",
      deployment: "saas", dataClass: "personal", certs: [], answers: { "sec-isms": "no", "sec-enc": "yes", "gdpr-avv": "no", "gdpr-loc": "no", "gdpr-tom": "no", "saas-tenant": "no" },
      decision: "rejected", assessedOn: tag(-15), assessedBy: P["demo-p04"], archived: false, notes: "Abgelehnt: Verarbeitung in den USA ohne Transfermechanismus, kein AVV." },
    { id: "demo-r5", appName: "Ticketsystem (Cloud)", vendor: "ServiceDesk Cloud", requester: P["demo-p09"], purpose: "Kundenservice-Tickets.",
      deployment: "saas", dataClass: "personal", certs: ["ISO27001"], answers: alleJa([...SEC, ...GDPR, ...SAAS]),
      decision: "approved", assessedOn: tag(-400), assessedBy: P["demo-p02"], archived: true, notes: "In Betrieb seit 2025." },
  ];
};

const DATENSCHUTZ = () => ({
  verarbeitungen: [
    { id: "demo-v1", name: "Verbrauchsabrechnung (SAP IS-U)", zwecke: "Abrechnung, Abschlagsplanung, Mahnwesen", rechtsgrundlage: "Art. 6 Abs. 1 lit. b, c DSGVO", loeschfristen: "10 Jahre nach Vertragsende (§ 147 AO)",
      hochrisiko: false, dsfaVorhanden: false, drittlandtransfer: false, transferGarantie: false, jointController: false, art26Vorhanden: false,
      avList: [{ id: "demo-av1", name: "HANA-Hosting (Rechenzentrum)", avvUnterschrieben: true, drittland: false, garantie: false }], status: "aktiv" },
    { id: "demo-v2", name: "Kundenportal", zwecke: "Kundenkonto, Zählerstände, Vertragsänderungen", rechtsgrundlage: "Art. 6 Abs. 1 lit. b DSGVO", loeschfristen: "3 Jahre nach letzter Anmeldung",
      hochrisiko: false, dsfaVorhanden: true, drittlandtransfer: false, transferGarantie: false, jointController: false, art26Vorhanden: false, avList: [], status: "aktiv" },
    { id: "demo-v3", name: "Bewerbermanagement mit KI-Ranking", zwecke: "Auswahl von Bewerbenden", rechtsgrundlage: "§ 26 BDSG, Art. 6 Abs. 1 lit. b DSGVO", loeschfristen: "6 Monate nach Abschluss des Verfahrens",
      hochrisiko: true, dsfaVorhanden: false, drittlandtransfer: false, transferGarantie: false, jointController: false, art26Vorhanden: false,
      avList: [{ id: "demo-av2", name: "HR-Tech Anbieter (Bewerber-Ranking)", avvUnterschrieben: true, drittland: false, garantie: false }], status: "aktiv" },
    { id: "demo-v4", name: "Kunden-Chatbot „Nora\"", zwecke: "Beantwortung von Kundenanfragen", rechtsgrundlage: "Art. 6 Abs. 1 lit. f DSGVO", loeschfristen: "Gesprächsprotokolle 30 Tage",
      hochrisiko: false, dsfaVorhanden: false, drittlandtransfer: true, transferGarantie: false, jointController: false, art26Vorhanden: false,
      avList: [{ id: "demo-av3", name: "Anbieter GPAI-Modell", avvUnterschrieben: false, drittland: true, garantie: false }], status: "aktiv" },
    { id: "demo-v5", name: "Personalverwaltung und Entgelt", zwecke: "Beschäftigungsverhältnis, Lohnabrechnung", rechtsgrundlage: "§ 26 BDSG, Art. 6 Abs. 1 lit. c DSGVO", loeschfristen: "Gesetzliche Aufbewahrung (bis 10 Jahre)",
      hochrisiko: false, dsfaVorhanden: false, drittlandtransfer: false, transferGarantie: false, jointController: false, art26Vorhanden: false,
      avList: [{ id: "demo-av4", name: "DATEV eG", avvUnterschrieben: true, drittland: false, garantie: false }], status: "aktiv" },
    { id: "demo-v6", name: "Smart-Meter-Messwerte", zwecke: "Netzbetrieb, Abrechnung nach Messwerten", rechtsgrundlage: "§§ 49 ff. MsbG", loeschfristen: "Nach Abrechnung, spätestens 3 Jahre",
      hochrisiko: false, dsfaVorhanden: true, drittlandtransfer: false, transferGarantie: false, jointController: true, art26Vorhanden: false, avList: [], status: "aktiv" },
    { id: "demo-v7", name: "Kundenzufriedenheitsumfrage 2024", zwecke: "Befragung", rechtsgrundlage: "Art. 6 Abs. 1 lit. a DSGVO", loeschfristen: "Gelöscht",
      hochrisiko: false, dsfaVorhanden: false, drittlandtransfer: false, transferGarantie: false, jointController: false, art26Vorhanden: false, avList: [], status: "eingestellt" },
  ],
  antraege: [
    { id: "demo-da1", art: "auskunft", eingang: lokal(-5, 10), status: "in_bearbeitung", verlaengert: false, verlaengerungsgrund: "", nachweis: "" },
    { id: "demo-da2", art: "loeschung", eingang: lokal(-26, 14), status: "eingegangen", verlaengert: false, verlaengerungsgrund: "", nachweis: "" },
    { id: "demo-da3", art: "auskunft", eingang: lokal(-40, 9), status: "in_bearbeitung", verlaengert: true, verlaengerungsgrund: "Umfangreiche Daten aus drei Systemen (Abrechnung, Portal, Callcenter) — Verlängerung nach Art. 12 Abs. 3 DSGVO mitgeteilt.", nachweis: "" },
    { id: "demo-da4", art: "widerspruch", eingang: lokal(-60, 11), status: "abgeschlossen", verlaengert: false, verlaengerungsgrund: "", nachweis: "Antwortschreiben vom Datenschutzbeauftragten, DMS://DS/2026/044" },
  ],
});

function lieferanten(k: DemoKontext): Supplier[] {
  const base = k.suppliers.map(s => s.id === "demo-s1" ? { ...s, criticality: "critical" as const }
    : s.id === "demo-s4" ? { ...s, criticality: "critical" as const }
    : s.id === "demo-s3" ? { ...s, sourceRequestId: "demo-r1" } : s);
  return [...base,
    { id: "demo-s5", name: "DATEV eG", service: "Lohn- und Gehaltsabrechnung", criticality: "medium", dataAccess: "sensitive", certs: ["ISO27001"],
      answers: { "q-contract": "yes", "q-incident": "yes", "q-avv": "yes", "q-cert": "yes", "q-subchain": "yes", "q-access": "yes", "q-audit": "yes", "q-review": "yes", "q-cloud": "yes", "q-bcp": "yes", "q-exit": "yes" },
      lastReview: tag(-60), reviewMonths: 24, assessedBy: k.P["demo-p07"], archived: false, notes: "Voll konform." },
    { id: "demo-s6", name: "Druckdienstleister Abrechnungsversand (Altvertrag)", service: "Druck und Versand von Rechnungen", criticality: "low", dataAccess: "personal", certs: [],
      answers: { "q-contract": "yes", "q-avv": "yes" }, lastReview: tag(-700), reviewMonths: 12, assessedBy: k.P["demo-p07"], archived: true, notes: "Vertrag 12/2025 beendet — Versand jetzt digital." },
  ] as Supplier[];
}

function dora(k: DemoKontext): Dienstleister[] {
  const t = k.tprm.map(d => d.id === "demo-t1" ? { ...d, exitStrategie: true, exitGetestet: tag(-90) } : d);
  return [...t,
    { id: "demo-t3", name: "HR-Tech Anbieter (Bewerber-Ranking)", lei: "", kat: "ikt", kritikalitaet: "normal", funktionen: "Bewerbermanagement (SaaS, KI)", region: "DE",
      riskScore: 55, letztePruefung: tag(-30), klauseln: ["Zugangs-/Auditrechte", "Datenstandorte", "Sicherheitsanforderungen"], personenbezug: true, avvVorhanden: true,
      exitStrategie: false, exitGetestet: "", zertifikatBis: tag(-20), subdienstleister: "Hosting EU", status: "aktiv", supplierId: "demo-s3" },
    { id: "demo-t4", name: "Meteo-Datendienst GmbH", lei: "", kat: "ikt", kritikalitaet: "kritisch_wichtig", funktionen: "Wetter- und Marktdaten für die Lastprognose", region: "DE",
      riskScore: 68, letztePruefung: "", klauseln: ["Kündigungsrechte"], personenbezug: false, avvVorhanden: false,
      exitStrategie: false, exitGetestet: "", zertifikatBis: "", subdienstleister: "", status: "aktiv", supplierId: "demo-s4" },
    { id: "demo-t5", name: "DATEV eG", lei: "529900KVTTBMLTD2VT07", kat: "ikt", kritikalitaet: "normal", funktionen: "Lohnabrechnung", region: "DE",
      riskScore: 18, letztePruefung: tag(-60), klauseln: ["Zugangs-/Auditrechte", "Kündigungsrechte", "Datenstandorte", "Subunternehmer-Zustimmung", "Sicherheitsanforderungen", "Exit-Unterstützung"], personenbezug: true, avvVorhanden: true,
      exitStrategie: true, exitGetestet: tag(-200), zertifikatBis: tag(400), subdienstleister: "", status: "aktiv", supplierId: "demo-s5" },
  ] as Dienstleister[];
}

function bcm(k: DemoKontext) {
  const pr = k.bcm.prozesse.map(p => p.id === "demo-b3" ? { ...p, rtoStunden: 12 } : p);
  const nk = [["service", "demo-p09", 24, 24], ["personal", "demo-p08", 72, 24], ["m365", "demo-p03", 24, 8]] as const;
  const names: Record<string, string> = { service: "Kundenservice (Chatbot & Callcenter)", personal: "Personalwesen & Bewerbermanagement", m365: "E-Mail & Kollaboration (M365)" };
  return {
    prozesse: [...pr, ...nk.map(([key, owner, rto, rpo], i) => ({
      id: `demo-b${5 + i}`, name: names[key], verantwortlicher: k.P[owner], kritisch: false, rtoStunden: rto, rpoStunden: rpo,
      planVorhanden: i !== 1, planRtoStunden: i !== 1 ? rto : 0, letzteUebung: i === 0 ? tag(-200) : "", backupRestoreTest: i === 2 ? tag(-90) : "", serviceId: k.svcId.get(key),
    }))],
    anlagen: [
      { id: "demo-k1", name: "Umspannwerk Nord 110/20 kV", sektor: "Energie", einstufung: tag(-150), registrierung: tag(-90), d80: true, d81: false, d82: false },
      { id: "demo-k2", name: "Netzleitstelle Nordwerk", sektor: "Energie", einstufung: tag(-40), registrierung: "", d80: false, d81: false, d82: false },
    ],
  };
}

const MEHR_DOCS = (P: Record<string, string>): LifecycleDoc[] => [
  { id: "demo-d21", name: "Risikobewertungsmethodik", docClass: "einmalig", owner: P["demo-p02"], status: "active", lastReview: tag(-220), intervalMonths: 0, basis: "ISO 27001 6.1.2", notes: "DMS://ISMS/Methodik" },
  { id: "demo-d22", name: "Risikobehandlungsplan", docClass: "einmalig", owner: P["demo-p02"], status: "active", lastReview: tag(-35), intervalMonths: 0, basis: "ISO 27001 6.1.3", notes: "Aus Phase 04 erzeugt." },
  { id: "demo-d23", name: "Rollen & Verantwortlichkeiten (RACI)", docClass: "einmalig", owner: P["demo-p01"], status: "active", lastReview: tag(-180), intervalMonths: 0, basis: "ISO 27001 5.3", notes: "" },
  { id: "demo-d24", name: "Notfallhandbuch (BCM)", docClass: "einmalig", owner: P["demo-p06"], status: "active", lastReview: tag(-100), intervalMonths: 0, basis: "ISO 22301 8.4", notes: "Version 4, Leitwarte + IT." },
  { id: "demo-d25", name: "Lieferantenverzeichnis", docClass: "register", owner: P["demo-p07"], status: "active", lastReview: tag(-25), intervalMonths: 0, basis: "ISO 27001 A.5.19–5.22 / NIS2 Art. 21 (2) d", notes: "" },
  { id: "demo-d26", name: "Berechtigungskonzept / Zugriffsmatrix", docClass: "register", owner: P["demo-p03"], status: "active", lastReview: tag(-160), intervalMonths: 0, basis: "ISO 27001 A.5.15, A.5.18", notes: "" },
  { id: "demo-d27", name: "Schulungs-/Awareness-Nachweise", docClass: "register", owner: P["demo-p09"], status: "active", lastReview: tag(-12), intervalMonths: 0, basis: "ISO 27001 A.6.3 / § 38 BSIG", notes: "LMS-Export." },
  { id: "demo-d28", name: "Penetrationstest", docClass: "periodisch", owner: P["demo-p03"], status: "active", lastReview: tag(-160), intervalMonths: 12, basis: "ISO 27001 A.8.8", notes: "Kundenportal + Perimeter." },
  { id: "demo-d29", name: "Rezertifizierung Zugriffsrechte", docClass: "periodisch", owner: P["demo-p03"], status: "active", lastReview: tag(-200), intervalMonths: 6, basis: "ISO 27001 A.5.18", notes: "Überfällig." },
  { id: "demo-d30", name: "Lieferantenüberprüfung", docClass: "periodisch", owner: P["demo-p07"], status: "active", lastReview: tag(-300), intervalMonths: 12, basis: "ISO 27001 A.5.22", notes: "" },
  { id: "demo-d31", name: "Internes AIMS-Audit", docClass: "periodisch", owner: P["demo-p09"], status: "draft", lastReview: "", intervalMonths: 12, basis: "ISO/IEC 42001 9.2", notes: "Erstes Audit läuft." },
  { id: "demo-d32", name: "AIMS-Managementbewertung", docClass: "periodisch", owner: P["demo-p01"], status: "draft", lastReview: "", intervalMonths: 12, basis: "ISO/IEC 42001 9.3", notes: "" },
  { id: "demo-d33", name: "KI-Risikobeurteilung", docClass: "periodisch", owner: P["demo-p05"], status: "active", lastReview: tag(-110), intervalMonths: 12, basis: "ISO/IEC 42001 6.1.2, 8.2", notes: "" },
  { id: "demo-d34", name: "Konzept menschliche Aufsicht", docClass: "einmalig", owner: P["demo-p05"], status: "draft", lastReview: "", intervalMonths: 0, basis: "KI-VO Art. 14, 26 Abs. 2", notes: "Lastprognose + Bewerber-Ranking." },
  { id: "demo-d35", name: "Gebrauchsanweisung (KI)", docClass: "einmalig", owner: P["demo-p05"], status: "draft", lastReview: "", intervalMonths: 0, basis: "KI-VO Art. 13", notes: "" },
  { id: "demo-d36", name: "Register schwerwiegender KI-Vorfälle", docClass: "register", owner: P["demo-p05"], status: "active", lastReview: tag(-3), intervalMonths: 0, basis: "KI-VO Art. 73", notes: "Bisher kein meldepflichtiger Vorfall." },
  { id: "demo-d37", name: "Daten-Governance & Datensatzdokumentation", docClass: "einmalig", owner: P["demo-p05"], status: "active", lastReview: tag(-70), intervalMonths: 0, basis: "KI-VO Art. 10 / ISO/IEC 42001 A.7", notes: "" },
  { id: "demo-d38", name: "Verzeichnis technischer & organisatorischer Maßnahmen (TOM)", docClass: "register", owner: P["demo-p04"], status: "active", lastReview: tag(-90), intervalMonths: 0, basis: "DSGVO Art. 32", notes: "" },
  { id: "demo-d39", name: "Informationssicherheitsleitlinie (Version 1, 2024)", docClass: "einmalig", owner: P["demo-p02"], status: "archived", lastReview: tag(-620), intervalMonths: 0, basis: "ISO 27001 5.2", notes: "Ersetzt durch Version 2.1." },
];

function mehrRichtlinien(k: DemoKontext): Record<string, any> {
  const { P, person } = k;
  const base = (s: string, owner: number, review: number, doc?: string) => ({
    implementationStatus: s, policyOwner: person(owner), approvalAuthority: P["demo-p01"], responsibleRoles: `${P["demo-p02"]}, ${P["demo-p03"]}`,
    scope: "Nordwerk Energie GmbH, alle Standorte, Mitarbeitenden, Dienstleister und Systeme im Geltungsbereich von ISMS und AIMS",
    version: s === "implemented" ? "2.0" : "1.0", lastReviewDate: s === "entbehrlich" ? "" : tag(review), nextReviewDate: s === "entbehrlich" ? "" : tag(review + 365),
    effectiveDate: s === "implemented" ? tag(review + 7) : "", reviewFrequency: "Jährlich", ...(doc ? { documentId: doc } : {}),
  });
  const neu: Record<string, any> = {
    D85: base("implemented", 1, -180), D02: base("implemented", 1, -35, "demo-d22"), D04: base("partially_implemented", 0, -380, "demo-d09"),
    D41: base("implemented", 8, -120, "demo-d08"), D34: base("implemented", 5, -140), D38: base("implemented", 1, -200), D40: base("implemented", 7, -45, "demo-d18"),
    D26: base("not_implemented", 7, -5, "demo-d15"), D27: base("partially_implemented", 4, -20, "demo-d16"), D29: base("not_implemented", 4, -10),
    D01: base("partially_implemented", 1, -18, "demo-d03"), D35: base("implemented", 5, -100, "demo-d24"), D36: base("partially_implemented", 5, -100),
    D68: base("implemented", 2, -160, "demo-d26"), D21: base("partially_implemented", 3, -60), D22: base("implemented", 3, -90), D23: base("implemented", 3, -120),
    D24: base("implemented", 3, -120), D51: base("implemented", 3, -90, "demo-d38"), D60: base("partially_implemented", 4, -70, "demo-d37"),
    D62: base("not_implemented", 4, -5), D63: base("partially_implemented", 4, -20, "demo-d34"), D73: base("not_implemented", 4, -5),
    D83: base("implemented", 9, -5, "demo-d06"), D49: base("implemented", 9, -60), D72: base("partially_implemented", 0, -90),
    p06: base("partially_implemented", 1, -150), p08: base("implemented", 2, -30), p09: base("implemented", 5, -140), p17: base("implemented", 2, -90),
    p20: base("implemented", 2, -90), p26: base("partially_implemented", 9, -60), p35: base("partially_implemented", 2, -100), p43: base("partially_implemented", 6, -45),
    p52: base("not_implemented", 9, -10), p53: base("implemented", 2, -70),
    D89: base("entbehrlich", 1, 0), D90: base("entbehrlich", 1, 0), D17: base("entbehrlich", 1, 0), D37: base("entbehrlich", 1, 0),
  };
  return neu;
}
