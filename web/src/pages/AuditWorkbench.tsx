/**
 * AuditWorkbench — Phase 07 Audit & KVP.
 *
 * Arbeitsplatz für den Auditor:
 *  1) Filter über die BEREITS AKTIVEN Frameworks (kein Neu-Wählen).
 *  2) Bildschirm startet leer — auf Knopfdruck werden die Gap-Ergebnisse geladen.
 *     Fokus auf OFFENE Punkte: nein (fehlend) / teilweise (schwach); n.a. und
 *     „nicht bewertet" optional sichtbar.
 *  3) Je Befund schlägt das System major/minor vor; der Auditor überschreibt frei.
 *  4) Verknüpfte Risiken sofort sichtbar; wählbar, per Katalog-Stichwort suchbar,
 *     manuell ergänzbar.
 *  5) Maßnahmen je Befund festhalten.
 *
 *  6) Audit-Programm (ISO 27001 9.2): mehrere Audits mit Historie; der Arbeitsbereich
 *     zeigt immer das AKTIVE Audit (Datenmodell: components/audit/auditProgram.ts).
 *
 * Status-Quelle: useAssessment (identische ISO-Hub-Projektion wie die Bewertung).
 * Frameworks: aus company_profiles.enabled_frameworks (DB-Codes!) — identisch zur
 * Bewertung, damit z. B. BSI (DB-Code) nicht durch den Context-Key BSI_ITGS wegfällt.
 * Persistenz: useToolData (org-weit). Die alten Top-Level-Felder (items/auditor/datum/
 * urteil) bleiben als Spiegel des aktiven Audits erhalten (Legacy-Konsumenten).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip } from "recharts";
import { toast } from "sonner";
import PersonSelect from "@/components/PersonSelect";
import { PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL, type Person, type PersonnelRegistry } from "@/lib/personnel";
import { createDeadline } from "@/lib/deadlineEngine";
import { AuditProgramCard, type NewAuditInput } from "@/components/audit/AuditProgramCard";
import { AuditTrendChart } from "@/components/audit/AuditTrendChart";
import {
  normalizeAuditState, activeAudit, updateActiveAudit, updateAudit, setActiveAudit, addAudit, removeAudit,
  countAuditFindings, sortAudits, todayIso, isNormalized, AUDIT_TYP_LABEL, AUDIT_STATUS_LABEL, DEFAULT_AUDIT_STATE,
  type Sev, type FindingState, type AuditItem, type AuditState, type AuditRecord,
} from "@/components/audit/auditProgram";
import { FrameworkMiniGrid, type FwMiniItem } from "@/components/FrameworkMiniGrid";
import { FRAMEWORKS, type FrameworkKey } from "@/contexts/FrameworkContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ModeToggle } from "@/components/ModeToggle";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import { useAuth } from "@/contexts/AuthContext";
import { useToolData } from "@/hooks/useToolData";
import { useUmsetzungEffective } from "@/hooks/useUmsetzungEffective";
import { applyUmsetzungOverlay } from "@/hooks/useComplianceOverview";
import { supabase } from "@/integrations/supabase/client";
import { onFrameworksUpdated } from "@/lib/frameworkBus";
import { useAssessment, answerKey } from "@/hooks/useAssessment";
import { useFrameworkInheritance } from "@/hooks/useFrameworkInheritance";
import { useCoverageReview } from "@/hooks/useCoverageReview";
import {
  projectAnswer,
  buildAnchorAnswerMap,
  type AnswerRow,
  type ControlRow,
  type EffectiveAnswer,
} from "@/lib/assessmentEngine";
import {
  ClipboardCheck, Play, Search, Plus, Trash2, ShieldAlert, CheckCircle2, Filter, FileDown, FileText,
} from "lucide-react";
import { controlMandatoryLevel, suggestFindingSeverity, MANDATORY_LABEL, type MandatoryLevel } from "@/data/controlSeverity";
import { controlMetadata } from "@/data/controlMetadata";
import { familyFromIsoIds } from "@/data/isoFamilyMap";
import { isoRef, isAnnexA } from "@/data/isoAnnexMap";

/** ISO 27001: `muss` ist in der DB (noch) null → aus der Annex-Map ableiten (Klausel 4–10 = MUSS, Annex A = SOLL). */
function withIsoMuss<T extends { id: string; framework?: string; muss?: string | null }>(c: T): T {
  if ((c.muss == null || c.muss === "") && (c.framework === "ISO27001" || /^(a[5-8]|c\d+)-\d+$/.test(c.id))) {
    return { ...c, muss: isAnnexA(c.id) ? "false" : "true" };
  }
  return c;
}
import { rkExport, rkSection, rkLead, rkTable, rkKpiRow, rkGlossary } from "@/lib/reportKit";

import { CHART_STATUS, CHART_EMPTY } from "@/lib/chartPalette";
import { insideSliceLabel } from "@/lib/chartLabels";
// Tenant-Risikoregister (Risikoanalyse, useToolData "risk-treatment"): risk_level pro Gap/Capability.
interface TreatmentLite { capability_tag?: string; risk_level?: string }
const LEVEL_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

// Typen Sev / FindingState / AuditItem / AuditState / AuditRecord: siehe components/audit/auditProgram.ts
export type { Sev, FindingState, AuditItem, AuditState, AuditRecord };
type Kind = "nein" | "teilweise" | "na" | "unbewertet" | "ja";

const DEFAULT: AuditState = DEFAULT_AUDIT_STATE;

interface RiskRow { risk_id: string; text_de: string | null; text_en: string | null; stufe: string | null; }
interface CRRow { framework: string; control_id: string; risk_id: string; }
// An die Umsetzung (Phase 06) übergebene Korrekturmaßnahme.
// `auditId`: Audit, aus dem die Übergabe stammt (fehlt bei Altdaten → gehört zum aktiven/ersten Audit).
export interface AuditAction { id: string; framework: string; controlId: string; controlReq: string; severity: Sev; measure: string; createdAt: string; done: boolean; owner?: string; due?: string; doneAt?: string; auditId?: string; }

// DB-Code → Context-Key (Umkehrung von codeToKey in FrameworkContext: nur BSI weicht ab)
const codeToKey = (code: string): FrameworkKey | null => {
  const k = code === "BSI" ? "BSI_ITGS" : code;
  return (k in FRAMEWORKS ? (k as FrameworkKey) : null);
};

function levelRank(stufe: string | null | undefined): number {
  const s = (stufe ?? "").toLowerCase();
  if (/kritisch|critical|sehr hoch|very high/.test(s)) return 4;
  if (/hoch|high/.test(s)) return 3;
  if (/mittel|medium|moderate/.test(s)) return 2;
  if (/niedrig|gering|low/.test(s)) return 1;
  return 0;
}
const STATUS_META: Record<Kind, { de: string; en: string; cls: string }> = {
  nein:       { de: "Fehlend", en: "Missing", cls: "bg-destructive/15 text-destructive" },
  teilweise:  { de: "Teilweise", en: "Partial", cls: "st-teilweise-tint st-teilweise-text" },
  na:         { de: "Nicht anwendbar", en: "Not applicable", cls: "bg-muted text-muted-foreground" },
  unbewertet: { de: "Nicht bewertet", en: "Not assessed", cls: "bg-slate-500/15 text-slate-500" },
  ja:         { de: "Inzwischen erfüllt", en: "Now fulfilled", cls: "st-ja-tint st-ja-text" },
};
const STATE_LABEL: Record<FindingState, { de: string; en: string }> = {
  offen: { de: "Offen", en: "Open" }, in_bearbeitung: { de: "In Bearbeitung", en: "In progress" }, erledigt: { de: "Erledigt", en: "Resolved" },
};

interface Finding {
  fw: string; control: ControlRow; status: Kind; maxRank: number;
  linkedRiskIds: string[]; existingNote: string | null;
}

/** Anzeige der Kontroll-ID (nur Darstellung): ISO 27001 → „A.5.1 · a5-04" — die interne
 *  Prüffragen-Nummer ist KEINE Annex-Nummer. Schlüssel/Logik bleiben auf `control.id`. */
function controlDisplayId(f: Pick<Finding, "fw" | "control">): string {
  if (f.fw !== "ISO27001") return f.control.id;
  const ref = isoRef(f.control.id);
  return ref === f.control.id ? f.control.id : `${ref} · ${f.control.id}`;
}

// Paginierter Loader (cy-Gateway/PostgREST-sicher).
async function fetchAllRows<T>(table: string, columns: string, filter?: (q: any) => any, orderCols: string[] = ["id"]): Promise<T[]> {
  const PAGE = 1000; const out: T[] = [];
  for (let from = 0; from < 100000; from += PAGE) {
    // Deterministische Sortierung ist Pflicht: ohne stabile ORDER BY überspringt
    // oder dupliziert die .range()-Paginierung Zeilen, sobald die Tabelle > PAGE ist.
    let q = supabase.from(table).select(columns);
    for (const c of orderCols) q = q.order(c);
    q = q.range(from, from + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) break;
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

export default function AuditWorkbench() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { mode } = useAssessmentMode();
  const { user, tenantId } = useAuth();

  // ── Frameworks aus DB (Codes), identisch zur Bewertung ──
  const [enabledFrameworks, setEnabledFrameworks] = useState<string[]>([]);
  const loadProfile = useCallback(async () => {
    if (!user || !tenantId) return;
    const { data } = await supabase.from("company_profiles").select("enabled_frameworks").eq("user_id", tenantId).order("updated_at", { ascending: false }).limit(1).maybeSingle();
    setEnabledFrameworks(((data?.enabled_frameworks ?? []) as string[]).filter(Boolean));
  }, [user, tenantId]);
  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => onFrameworksUpdated(({ enabled_frameworks }) => setEnabledFrameworks(enabled_frameworks ?? [])), []);

  const { controls, answers, anchorsBySpokeControl, isoMappings, loading } = useAssessment(enabledFrameworks);
  const { mode: inheritanceMode } = useFrameworkInheritance();
  // Y8: EIN gemeinsamer Deckungs-Resolver fuer ALLE Verbraucher der Projektion.
  // Geerbtes „ja" aus einem anderen Framework bleibt „teilweise", bis Umfang,
  // Zeitraum und Nachweisdeckung bestaetigt sind.
  const { coverage } = useCoverageReview();
  const { data: auditRaw, setData, loading: auditLoading } = useToolData<AuditState>("audit-workbench", "cws-audit-workbench", DEFAULT);
  // Normalisierte Sicht: Audit-Programm (audits/activeAuditId) + Top-Level-Spiegel des aktiven Audits.
  // `audit.items/auditor/datum/urteil` sind damit IMMER die des aktiven Audits (Legacy-Lesepfade bleiben).
  const audit = useMemo(() => normalizeAuditState(auditRaw, de), [auditRaw, de]);
  const active = useMemo(() => activeAudit(audit) as AuditRecord, [audit]);
  const activeId = audit.activeAuditId;
  const readOnly = active?.status === "abgeschlossen";
  const audits = audit.audits ?? [];
  // Migration einmalig persistieren (alter Ein-Audit-Blob → Programm-Format), sobald der Cloud-Stand geladen ist.
  useEffect(() => {
    if (auditLoading || isNormalized(auditRaw)) return;
    setData(d => normalizeAuditState(d, de));
  }, [auditLoading, auditRaw, setData, de]);
  // Zentrales Personen-Register (Owner der Korrekturmaßnahme) — einmal lesen, an FindingCards durchreichen.
  const { data: personnel, setData: setPersonnel } = useToolData<PersonnelRegistry>(PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL);
  const people = personnel.people ?? [];
  const addPerson = useCallback((p: Person) => setPersonnel(d => ({ people: [...(d.people ?? []), p] })), [setPersonnel]);
  // „Spätere Phase gewinnt": Umsetzungs-Status hebt die Gap-Projektion an, damit
  // fertig umgesetzte Kontrollen nicht als Befund auftauchen (wie im Dashboard).
  // LIVE aus implementation_status (dieselbe Bündelung wie Umsetzung/Dashboard) — kein Cache-Blob.
  const ums = useUmsetzungEffective(controls, enabledFrameworks);
  // Bewertetes Risikoregister (Risikoanalyse) — Quelle der realen Risiko-Stufe je Capability.
  const { data: treatment } = useToolData<{ treatments: TreatmentLite[] }>("risk-treatment", "risk-treatment", { treatments: [] });
  // Übergabe an die Umsetzung: Korrekturmaßnahmen aus dem Audit (shared mit Phase 06).
  const { data: auditActions, setData: setAuditActions } = useToolData<{ actions: AuditAction[] }>("audit-actions", "cws-audit-actions", { actions: [] });
  const capRiskRank = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of treatment.treatments ?? []) {
      if (!t.capability_tag || !t.risk_level) continue;
      const r = LEVEL_RANK[t.risk_level] ?? 0;
      if (r > (m.get(t.capability_tag) ?? 0)) m.set(t.capability_tag, r);
    }
    return m;
  }, [treatment]);

  // ── Risikoregister + Verknüpfung (paginiert, auf aktive Frameworks gefiltert) ──
  const [risks, setRisks] = useState<RiskRow[]>([]);
  const [controlRisk, setControlRisk] = useState<CRRow[]>([]);
  useEffect(() => {
    let cancel = false;
    (async () => {
      const [r, cr] = await Promise.all([
        fetchAllRows<RiskRow>("risks", "risk_id, text_de, text_en, stufe", q => q.eq("status", "active"), ["risk_id"]),
        enabledFrameworks.length
          ? fetchAllRows<CRRow>("control_risk", "framework, control_id, risk_id", q => q.in("framework", ["ISO27001", ...enabledFrameworks]), ["framework", "control_id", "risk_id"])
          : Promise.resolve([] as CRRow[]),
      ]);
      if (cancel) return;
      setRisks(r); setControlRisk(cr);
    })();
    return () => { cancel = true; };
  }, [enabledFrameworks]);

  // Konflikt-Bewusstsein (Mehr-Auditor): der Audit-Zustand ist EINE geteilte Zeile (Ganzobjekt-
  // Persistenz). Ohne feingranulare Persistenz kann paralleles Editieren überschreiben. Wir
  // pollen die Remote-Zeile und warnen bei Divergenz, statt still zu verlieren.
  const [conflict, setConflict] = useState(false);
  const remoteSeenRef = useRef<string | null>(null);
  // Stabile (schlüsselsortierte) Serialisierung — verhindert Falsch-Positive durch jsonb-Key-Reihenfolge.
  const canon = useCallback((o: unknown): string => {
    if (o === null || typeof o !== "object") return JSON.stringify(o);
    if (Array.isArray(o)) return "[" + o.map(canon).join(",") + "]";
    return "{" + Object.keys(o as Record<string, unknown>).sort().map(k => JSON.stringify(k) + ":" + canon((o as Record<string, unknown>)[k])).join(",") + "}";
  }, []);
  useEffect(() => {
    if (!user || !tenantId) return;
    let stop = false;
    const check = async () => {
      const { data: row } = await supabase.from("user_tool_data").select("data").eq("user_id", tenantId).eq("tool_key", "audit-workbench").maybeSingle();
      if (stop || !row) return;
      const remote = canon(row.data ?? {});
      // Ganzer Blob (Programm + Spiegel) — genau das, was useToolData hält und schreibt.
      const localStr = canon(auditRaw ?? {});
      // Nur bei ECHTER Remote-Änderung, die von unserem lokalen Stand abweicht.
      if (remoteSeenRef.current !== null && remote !== remoteSeenRef.current && remote !== localStr) setConflict(true);
      remoteSeenRef.current = remote;
    };
    const id = setInterval(check, 25000);
    return () => { stop = true; clearInterval(id); };
  }, [user, tenantId, auditRaw, canon]);

  const riskById = useMemo(() => { const m = new Map<string, RiskRow>(); for (const r of risks) m.set(r.risk_id, r); return m; }, [risks]);
  // Suche: Platzhalter-Risiken (text_de == risk_id) ausblenden.
  // Suche: Risiken der AKTIVEN Frameworks zuerst (über control_risk verknüpft), andere Kataloge danach.
  const activeRiskIds = useMemo(() => new Set(controlRisk.map(cr => cr.risk_id)), [controlRisk]);
  const searchableRisks = useMemo(() => risks
    .filter(r => (r.text_de ?? "").trim() && r.text_de !== r.risk_id)
    .sort((a, b) => Number(activeRiskIds.has(b.risk_id)) - Number(activeRiskIds.has(a.risk_id))), [risks, activeRiskIds]);
  const risksByControl = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const cr of controlRisk) { const k = `${cr.framework}::${cr.control_id}`; if (!m.has(k)) m.set(k, []); m.get(k)!.push(cr.risk_id); }
    return m;
  }, [controlRisk]);

  // ── Projektion (identisch zur Bewertung): Knoten-zuerst-Anker ──
  const isoAnchorsBySpokeControl = anchorsBySpokeControl;
  // Bei Modus "off" (Übernahme aus): LEERE Anker-Map → projectAnswer nutzt nur
  // die eigene Antwort (keine Cross-Framework-Vererbung).
  const isoAnswerByControl = useMemo(
    () => inheritanceMode === "off"
      ? new Map<string, AnswerRow>()
      : buildAnchorAnswerMap(answers, (fw, cid) => isoAnchorsBySpokeControl.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? []),
    [answers, isoAnchorsBySpokeControl, inheritanceMode],
  );
  // Familien-Ableitung (Anzeige/Severity): ISO-Crosswalk NUR für familyFromIsoIds —
  // bewusst getrennt von der (node-only) Projektions-Anker-Map.
  const isoIdsByControl = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const r of isoMappings) {
      const k = `${r.framework}::${r.control_id}`;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r.iso_id);
    }
    return m;
  }, [isoMappings]);
  const controlsByFramework = useMemo(() => {
    const m = new Map<string, ControlRow[]>();
    for (const c of controls) {
      if (c.tags?.includes("sub")) continue;
      if ((c.meta as any)?.scored === false) continue;
      if (!m.has(c.framework)) m.set(c.framework, []);
      m.get(c.framework)!.push(c);
    }
    return m;
  }, [controls]);
  const umsMembers = ums.members;
  const effectiveByFramework = useMemo(() => {
    const m = new Map<string, Map<string, EffectiveAnswer>>();
    controlsByFramework.forEach((list, fw) => {
      const inner = new Map<string, EffectiveAnswer>();
      for (const c of list) inner.set(c.id, applyUmsetzungOverlay(projectAnswer(c, answers[answerKey(fw, c.id, null)], isoAnswerByControl, isoAnchorsBySpokeControl, { coverage }), ums.members[`${fw}:${c.id}`]));
      m.set(fw, inner);
    });
    return m;
  }, [controlsByFramework, answers, isoAnswerByControl, isoAnchorsBySpokeControl, umsMembers, coverage]);

  // ── Filter/Ansicht ──
  const auditableFrameworks = useMemo(
    () => enabledFrameworks.filter(f => controlsByFramework.has(f)),
    [enabledFrameworks, controlsByFramework],
  );
  const [included, setIncluded] = useState<Set<string> | null>(null);
  // Start-Filter = Scope des aktiven Audits (wie beim Öffnen/Anlegen über applyScope);
  // ohne Scope alle prüfbaren Frameworks. Vorher galten beim ersten Laden immer alle
  // Frameworks — ein AIMS-Audit listete dann auch sämtliche NIS2/ISO-27001-Punkte.
  useEffect(() => {
    if (included !== null || !auditableFrameworks.length || auditLoading) return;
    const scoped = (active?.scopeFrameworks ?? []).filter(f => auditableFrameworks.includes(f));
    setIncluded(new Set(scoped.length ? scoped : auditableFrameworks));
  }, [auditableFrameworks, included, auditLoading, active]);
  const inc = included ?? new Set(auditableFrameworks);

  const [loaded, setLoaded] = useState(false);
  const [includePartial, setIncludePartial] = useState(true);
  const [showNa, setShowNa] = useState(false);
  const [showUnbewertet, setShowUnbewertet] = useState(false);
  const [sevFilter, setSevFilter] = useState<"all" | Sev | "erledigt">("all");
  const [visibleCount, setVisibleCount] = useState(50);   // Rendern in Seiten — kein 1000+-Karten-Rerender
  useEffect(() => { setVisibleCount(50); }, [sevFilter, loaded, includePartial, showNa, showUnbewertet, included]);

  const findings = useMemo<Finding[]>(() => {
    if (!loaded) return [];
    const out: Finding[] = [];
    for (const fw of auditableFrameworks) {
      if (!inc.has(fw)) continue;
      const list = controlsByFramework.get(fw) ?? [];
      const eff = effectiveByFramework.get(fw);
      for (const c of list) {
        const ea = eff?.get(c.id);
        const st = ea?.status ?? null;
        let kind: Kind | null = null;
        if (st === "nein") kind = "nein";
        else if (st === "teilweise") kind = includePartial ? "teilweise" : null;
        else if (st === "na") kind = showNa ? "na" : null;
        else if (st == null) kind = showUnbewertet ? "unbewertet" : null; // nur unbeantwortet = nicht bewertet
        else kind = null;                                                 // "ja" = erfüllt → nie als NEUER Befund
        // Dokumentierte Feststellungen (Befund gesetzt, Maßnahme, Notiz, Nachweis, Status)
        // dürfen NIE durch einen Anzeige-Filter verschwinden — auch nicht, wenn die
        // Kontrolle inzwischen erfüllt ist (dann Status „Inzwischen erfüllt").
        const existing = audit.items?.[`${fw}::${c.id}`];
        const touched = !!existing; // Items entstehen nur durch eine Auditor-Aktion (Befund/Status/Text/Risiko)
        if (!kind && touched) kind = st === "teilweise" ? "teilweise" : st === "nein" ? "nein" : st === "na" ? "na" : st == null ? "unbewertet" : "ja";
        if (!kind) continue;
        const linked = risksByControl.get(`${fw}::${c.id}`) ?? [];
        const catalogRank = linked.reduce((mx, rid) => Math.max(mx, levelRank(riskById.get(rid)?.stufe)), 0);
        // Reale, bewertete Risiko-Stufe aus der Risikoanalyse über die Kontroll-Familie (= capability_tag).
        // Familie: kuratiert (controlMetadata) ODER aus dem control_iso-Crosswalk — sowohl meta.iso_ids
        // ALS AUCH isoIdsByControl (direkt aus control_iso, NUR für Anzeige/Severity; Projektion
        // läuft node-only). Der Crosswalk deckt u. a. BSI ab (dort ist meta.iso_ids leer).
        const anchors = [
          ...((c.meta as { iso_ids?: string[] } | null)?.iso_ids ?? []),
          ...(isoIdsByControl.get(`${fw}::${c.id}`) ?? []),
        ];
        const fam = (controlMetadata as Record<string, { familyId?: string }>)[c.id]?.familyId
          ?? familyFromIsoIds(anchors);
        const assessedRank = fam ? (capRiskRank.get(fam) ?? 0) : 0;
        const maxRank = Math.max(catalogRank, assessedRank);
        // Risikotexte sind in der DB aus den zugeordneten Kontrollen befüllt (overrides.sql) —
        // alle verknüpften Risiken werden real betextet angezeigt (kein Ausblenden).
        out.push({ fw, control: c, status: kind, maxRank, linkedRiskIds: linked, existingNote: (answers[answerKey(fw, c.id, null)]?.note ?? null) });
      }
    }
    return out;
  }, [loaded, auditableFrameworks, inc, controlsByFramework, effectiveByFramework, includePartial, showNa, showUnbewertet, risksByControl, riskById, answers, capRiskRank, isoIdsByControl, audit.items]);

  // Bereits dokumentierte Feststellungen automatisch laden — der Auditor soll seine
  // Arbeit nach Reload sofort sehen, nicht erst nach erneutem „Gap-Ergebnisse laden".
  const hasItems = Object.keys(audit.items ?? {}).length > 0;
  useEffect(() => { if (!loaded && !loading && hasItems && auditableFrameworks.length > 0) setLoaded(true); }, [loaded, loading, hasItems, auditableFrameworks.length]);

  const keyOf = useCallback((f: Finding) => `${f.fw}::${f.control.id}`, []);
  const defaultItem = useCallback((f: Finding): AuditItem => {
    const sev: Sev = (f.status === "nein" || f.status === "teilweise") ? suggestFindingSeverity(f.status, withIsoMuss(f.control as any), f.maxRank) : "minor";
    // Vorverknüpfte Katalog-Risiken werden übernommen (abwählbar) — sonst stehen
    // Vorschläge nur auf dem Bildschirm und fehlen in CSV/Bericht.
    return { severity: sev, riskIds: f.linkedRiskIds.slice(0, 5), manualRisks: [], measures: "", note: "", evidence: "", state: "offen" };
  }, []);

  // Gehört eine Übergabe zum AKTIVEN Audit? Altdaten ohne auditId zählen zum Legacy-/aktiven Audit,
  // damit bestehende Übergaben nach der Migration nicht „verwaisen".
  const actionOfActive = useCallback((a: AuditAction) => !a.auditId || a.auditId === activeId, [activeId]);

  const patchItem = useCallback((f: Finding, p: Partial<AuditItem>) => {
    if (readOnly) return; // abgeschlossene Audits sind schreibgeschützt
    const k = `${f.fw}::${f.control.id}`;
    setData(d => updateActiveAudit(d, act => {
      if (act.status === "abgeschlossen") return {};
      const base = act.items?.[k] ?? defaultItem(f);
      const next: AuditItem = { ...base, ...p };
      // Erledigt-Zeitpunkt festhalten (ISO 27001 10.1: Nachweis der Korrektur).
      if (p.state === "erledigt" && base.state !== "erledigt") next.closedAt = new Date().toISOString();
      if (p.state && p.state !== "erledigt") next.closedAt = undefined;
      return { items: { ...(act.items ?? {}), [k]: next }, status: act.status === "geplant" ? "laufend" : act.status };
    }, de));
    // KVP-Schleife: Befund „erledigt" ⇄ übergebene Korrekturmaßnahme „done" bleiben synchron (nur aktives Audit).
    if (p.state) {
      const done = p.state === "erledigt";
      setAuditActions(d => {
        const list = d.actions ?? [];
        const hit = (a: AuditAction) => a.framework === f.fw && a.controlId === f.control.id && actionOfActive(a);
        if (!list.some(a => hit(a) && a.done !== done)) return d;
        return { actions: list.map(a => hit(a) ? { ...a, done, doneAt: done ? new Date().toISOString() : undefined } : a) };
      });
    }
  }, [setData, defaultItem, setAuditActions, readOnly, actionOfActive, de]);

  // Rückweg der KVP-Schleife: in der Umsetzung abgehakte Korrekturmaßnahmen schließen den Befund
  // (im aktiven Audit — Systemabgleich, gilt auch wenn das Audit bereits abgeschlossen ist).
  useEffect(() => {
    const list = (auditActions.actions ?? []).filter(a => a.done && actionOfActive(a));
    if (!list.length) return;
    setData(d => {
      const n = normalizeAuditState(d, de);
      const act = activeAudit(n);
      if (!act) return d;
      let changed = false;
      const items = { ...(act.items ?? {}) };
      for (const a of list) {
        const k = `${a.framework}::${a.controlId}`;
        const it = items[k];
        if (!it) continue;
        if (it.state !== "erledigt") { items[k] = { ...it, state: "erledigt", closedAt: a.doneAt ?? new Date().toISOString() }; changed = true; }
      }
      return changed ? updateActiveAudit(n, { items }, de) : d;
    });
  }, [auditActions, setData, actionOfActive, de]);

  const handedOff = useMemo(() => new Set((auditActions.actions ?? []).filter(actionOfActive).map(a => `${a.framework}::${a.controlId}`)), [auditActions, actionOfActive]);
  const handoffToUmsetzung = useCallback((f: Finding, item: AuditItem) => {
    if (!item.measures.trim() || readOnly) return;
    setAuditActions(d => {
      const list = d.actions ?? [];
      const existing = list.find(a => a.framework === f.fw && a.controlId === f.control.id && actionOfActive(a));
      const req = (de ? f.control.req_de : f.control.req_en) ?? f.control.req_de ?? f.control.id;
      const ownerDue = { owner: item.owner?.trim() || undefined, due: item.due || undefined };
      if (existing) {
        // Bestehende Übergabe aktualisieren — id UND done-Status bleiben erhalten; Owner/Frist aus dem
        // Befund nur übernehmen, wenn dort gesetzt (in der Umsetzung gepflegte Werte nicht leeren).
        return { actions: list.map(a => a === existing ? { ...a, controlReq: req, severity: item.severity, measure: item.measures, auditId: a.auditId ?? activeId, owner: ownerDue.owner ?? a.owner, due: ownerDue.due ?? a.due } : a) };
      }
      return { actions: [...list, { id: crypto.randomUUID(), framework: f.fw, controlId: f.control.id, controlReq: req, severity: item.severity, measure: item.measures, createdAt: new Date().toISOString(), done: false, auditId: activeId, ...ownerDue }] };
    });
  }, [setAuditActions, de, readOnly, actionOfActive, activeId]);

  // ── Audit-Programm: Aktionen ──
  const applyScope = useCallback((rec: AuditRecord | null) => {
    // Framework-Filter des Arbeitsbereichs auf den Scope des geöffneten Audits setzen (falls gesetzt).
    if (!rec) return;
    const scoped = rec.scopeFrameworks.filter(f => auditableFrameworks.includes(f));
    if (scoped.length) setIncluded(new Set(scoped));
  }, [auditableFrameworks]);
  const createAudit = useCallback((inp: NewAuditInput) => {
    const rec: AuditRecord = {
      id: crypto.randomUUID(), typ: inp.typ, titel: inp.titel, auditor: inp.auditor, datum: inp.datum, urteil: "",
      status: inp.datum > todayIso() ? "geplant" : "laufend", scopeFrameworks: inp.scopeFrameworks, items: {}, createdAt: new Date().toISOString(),
    };
    setData(d => addAudit(d, rec, true, de));
    applyScope(rec);
    setLoaded(true);
    toast.success(de ? `Audit „${rec.titel}" angelegt und geöffnet.` : `Audit “${rec.titel}” created and opened.`);
  }, [setData, de, applyScope]);
  const openAudit = useCallback((id: string) => {
    setData(d => setActiveAudit(d, id, de));
    applyScope(audits.find(a => a.id === id) ?? null);
    setSevFilter("all");
  }, [setData, de, applyScope, audits]);
  const startAudit = useCallback((id: string) => setData(d => updateAudit(d, id, { status: "laufend" }, de)), [setData, de]);
  const closeAudit = useCallback(async (id: string, naechstesAudit: string, withDeadline: boolean) => {
    const rec = audits.find(a => a.id === id);
    if (!rec) return;
    if (!rec.urteil.trim()) { toast.error(de ? "Gesamturteil fehlt — bitte zuerst ausfüllen." : "Overall verdict missing — please fill in first."); return; }
    const heute = todayIso();
    setData(d => updateAudit(d, id, { status: "abgeschlossen", abgeschlossenAm: heute, naechstesAudit: naechstesAudit || undefined }, de));
    if (withDeadline && naechstesAudit) {
      if (!tenantId) { toast.error(de ? "Frist nicht angelegt: kein Mandant." : "Deadline not created: no tenant."); return; }
      try {
        await createDeadline(supabase, {
          tenant_id: tenantId,
          kind: "audit_cycle",
          framework: null,
          ref_table: "audit-workbench",
          ref_id: id,
          label: de ? "Nächstes internes Audit" : "Next internal audit",
          starts_at: new Date().toISOString(),
          due_at: new Date(naechstesAudit + "T00:00:00Z").toISOString(),
          meta: { audit_id: id, audit_titel: rec.titel, audit_typ: rec.typ, abgeschlossen_am: heute },
        });
        toast.success(de ? `Audit abgeschlossen. Frist „Nächstes internes Audit" (${naechstesAudit}) angelegt.` : `Audit completed. Deadline “Next internal audit” (${naechstesAudit}) created.`);
      } catch (e: any) {
        toast.error(`${de ? "Audit abgeschlossen, aber Frist NICHT angelegt" : "Audit completed, but deadline NOT created"}: ${e?.message || String(e)}`);
      }
    } else {
      toast.success(de ? "Audit abgeschlossen." : "Audit completed.");
    }
  }, [audits, setData, de, tenantId]);
  const deleteAudit = useCallback((id: string) => setData(d => removeAudit(d, id, de)), [setData, de]);

  // Kennzahlen (nur echte Befunde: nein/teilweise)
  const stats = useMemo(() => {
    let major = 0, minor = 0, ofi = 0, erledigt = 0, real = 0;
    for (const f of findings) {
      if (f.status === "na" || f.status === "unbewertet") continue;
      real++;
      const it = audit.items?.[keyOf(f)] ?? defaultItem(f);
      if (it.severity === "major") major++; else if (it.severity === "beobachtung") ofi++; else minor++;
      if (it.state === "erledigt") erledigt++;
    }
    return { total: findings.length, real, major, minor, ofi, erledigt };
  }, [findings, audit, keyOf, defaultItem]);

  const isTouched = useCallback((f: Finding) => {
    return !!audit.items?.[keyOf(f)]; // Items entstehen nur durch eine Auditor-Aktion
  }, [audit, keyOf]);
  const visibleFindings = useMemo(() => {
    const base = sevFilter === "all" ? findings : findings.filter(f => {
      if (f.status === "na" || f.status === "unbewertet") return sevFilter === "all";
      const it = audit.items?.[keyOf(f)] ?? defaultItem(f);
      if (sevFilter === "erledigt") return it.state === "erledigt";
      return it.severity === sevFilter;
    });
    // Bearbeitete Feststellungen zuerst (stabil), dann die unbearbeitete Prüfliste.
    return [...base].sort((a, b) => Number(isTouched(b)) - Number(isTouched(a)));
  }, [findings, sevFilter, audit, keyOf, defaultItem, isTouched]);

  const fwLabel = useCallback((code: string) => { const k = codeToKey(code); return (k && FRAMEWORKS[k]?.short) || code; }, []);

  const exportCsv = () => {
    const head = ["Framework", "Control", "Anforderung", "Status", "Befund", "Zustand", "Risiken", "Maßnahmen", "Verantwortlich", "Frist", "Wiederholungsprüfung", "Erledigt am", "Nachweis", "Notiz"];
    const meta = [["Audit", active?.titel ?? ""], ["Typ", active ? AUDIT_TYP_LABEL[active.typ].de : ""], ["Audit-Status", active ? AUDIT_STATUS_LABEL[active.status].de : ""], ["Auditor", audit.auditor ?? ""], ["Datum", audit.datum ?? ""], ["Gesamturteil", audit.urteil ?? ""], ["Frameworks", [...inc].map(fwLabel).join(", ")], ["Exportiert", new Date().toLocaleString("de-DE")], []];
    const rows = findings.filter(f => f.status === "nein" || f.status === "teilweise" || f.status === "ja").map(f => {
      const it = audit.items?.[keyOf(f)] ?? defaultItem(f);
      const ris = [...it.riskIds.map(rid => { const r = riskById.get(rid); return r && r.text_de !== rid ? `${rid}: ${(de ? r.text_de : r.text_en) ?? r.text_de}` : rid; }), ...it.manualRisks.map(m => m.text)].join("; ");
      const sevLabel = it.severity === "major" ? "Major" : it.severity === "beobachtung" ? "Beobachtung (OFI)" : "Minor";
      return [fwLabel(f.fw), controlDisplayId(f), (de ? f.control.req_de : f.control.req_en) ?? f.control.req_de ?? "", STATUS_META[f.status].de, sevLabel, STATE_LABEL[it.state].de, ris, it.measures, it.owner ?? "", it.due ?? "", it.recheck ?? "", it.closedAt ? it.closedAt.slice(0, 10) : "", it.evidence ?? "", it.note];
    });
    // CSV-Formel-Injektion verhindern: Zellen, die mit = + - @ beginnen, mit ' entschärfen.
    const cell = (c: unknown) => { let s = String(c ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    const csv = [...meta, head, ...rows].map(r => r.map(cell).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "Audit-Befunde.csv"; a.click(); URL.revokeObjectURL(url);
  };

  // Offizieller Audit-Bericht über das gemeinsame Bericht-Shell (reportKit):
  // Marke + Firmen-Logo/Initial, Footer, Toolbar, Glossar; Vorschau im Tab, KEIN Auto-Druck.
  const openReport = (modeOut: "pdf" | "word") => {
    const esc = (v: unknown) => String(v ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
    const real = findings.filter(f => f.status === "nein" || f.status === "teilweise" || f.status === "ja");
    const sevLabel = (sv: Sev) => sv === "major" ? "Major" : sv === "beobachtung" ? (de ? "Beobachtung (OFI)" : "Observation (OFI)") : "Minor";
    const sevColor = (sv: Sev) => sv === "major" ? "#b91c1c" : sv === "beobachtung" ? "#475569" : "#b45309";
    const stateLabel = (st: FindingState) => de ? STATE_LABEL[st].de : STATE_LABEL[st].en;
    const riskTexts = (it: AuditItem) => [
      ...it.riskIds.map(rid => { const r = riskById.get(rid); return r && r.text_de !== rid ? ((de ? r.text_de : r.text_en) ?? r.text_de ?? rid) : rid; }),
      ...it.manualRisks.map(m => m.text),
    ].filter(Boolean);
    const actionsByKey = new Map((auditActions.actions ?? []).filter(actionOfActive).map(a => [`${a.framework}::${a.controlId}`, a]));
    const touched = real.filter(f => isTouched(f));
    const untouched = real.filter(f => !isTouched(f));
    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString(de ? "de-DE" : "en-GB") : "—";
    const typLabel = (t: AuditRecord["typ"]) => de ? AUDIT_TYP_LABEL[t].de : AUDIT_TYP_LABEL[t].en;
    // Historie: frühere (andere) Audits des Programms — Datum, Typ, Urteil, Major/Minor.
    const others = sortAudits(audits.filter(a => a.id !== activeId));
    const historie = rkSection(de ? "Historie: frühere Audits" : "History: previous audits") +
      (others.length
        ? rkTable([de ? "Datum" : "Date", de ? "Audit" : "Audit", de ? "Typ" : "Type", "Status", de ? "Urteil" : "Verdict", "Major", "Minor", de ? "Erledigt" : "Resolved"],
            others.map(a => { const c = countAuditFindings(a); return [fmtDate(a.datum), esc(a.titel) || "—", esc(typLabel(a.typ)), esc(de ? AUDIT_STATUS_LABEL[a.status].de : AUDIT_STATUS_LABEL[a.status].en), esc(a.urteil) || "—", `<b style="color:#b91c1c">${c.major}</b>`, `<b style="color:#b45309">${c.minor}</b>`, `<b style="color:#047857">${c.erledigt}</b>`]; }))
        : `<p style="color:#718096">${de ? "Keine früheren Audits im Programm." : "No previous audits in the programme."}</p>`);

    const kpis = rkKpiRow([
      { label: de ? "Befunde gesamt" : "Findings total", value: stats.real, color: "#1A2E41" },
      { label: "Major", value: stats.major, color: "#b91c1c" },
      { label: "Minor", value: stats.minor, color: "#b45309" },
      { label: de ? "Beobachtung (OFI)" : "Observation (OFI)", value: stats.ofi, color: "#475569" },
      { label: de ? "Erledigt" : "Resolved", value: stats.erledigt, color: "#047857" },
    ]);
    const kopf = rkTable([de ? "Feld" : "Field", de ? "Wert" : "Value"], [
      [de ? "Audit" : "Audit", `${esc(active?.titel) || "—"}${active ? ` <span style="color:#718096">(${esc(typLabel(active.typ))} · ${esc(de ? AUDIT_STATUS_LABEL[active.status].de : AUDIT_STATUS_LABEL[active.status].en)}${active.abgeschlossenAm ? `, ${de ? "abgeschlossen am" : "completed on"} ${fmtDate(active.abgeschlossenAm)}` : ""})</span>` : ""}`],
      [de ? "Auditor" : "Auditor", esc(audit.auditor) || "—"],
      [de ? "Audit-Datum" : "Audit date", fmtDate(audit.datum)],
      [de ? "Gesamturteil" : "Overall verdict", esc(audit.urteil) || "—"],
      [de ? "Geprüfte Frameworks" : "Audited frameworks", esc([...inc].map(fwLabel).join(", ")) || "—"],
      [de ? "Grundlage" : "Basis", de ? "Gap-Analyse (Phase 03) + Umsetzungsstand (Phase 06), Weakest-Link je Kontroll-Knoten" : "Gap analysis (phase 03) + implementation status (phase 06), weakest link per control node"],
    ]);
    const findingRows = (list: Finding[], withDetails: boolean) => list.map((f, i) => {
      const it = audit.items?.[keyOf(f)] ?? defaultItem(f);
      const act = actionsByKey.get(keyOf(f));
      const ris = riskTexts(it);
      const base = [
        String(i + 1),
        `<b>${esc(fwLabel(f.fw))}</b><br><span style="font-family:monospace;color:#718096">${esc(controlDisplayId(f))}</span>`,
        esc((de ? f.control.req_de : f.control.req_en) ?? f.control.req_de ?? f.control.id),
        esc(de ? STATUS_META[f.status].de : STATUS_META[f.status].en),
        `<b style="color:${sevColor(it.severity)}">${sevLabel(it.severity)}</b><br><span style="color:#718096">${esc(stateLabel(it.state))}</span>`,
      ];
      if (!withDetails) return base;
      return [
        ...base,
        ris.length ? `<ul style="margin:0;padding-left:14px">${ris.map(r => `<li>${esc(r)}</li>`).join("")}</ul>` : "—",
        `${esc(it.measures) || "—"}${(it.owner || it.due || it.recheck) ? `<br><span style="color:#718096">${de ? "Verantwortlich" : "Owner"}: ${esc(it.owner || "—")} · ${de ? "Frist" : "Due"} ${fmtDate(it.due)}${it.recheck ? ` · ${de ? "Wiederholungsprüfung" : "Re-check"} ${fmtDate(it.recheck)}` : ""}</span>` : ""}${act ? `<br><span style="color:#718096">${de ? "Umsetzung" : "Implementation"}: ${esc(act.owner || "—")} · ${de ? "Frist" : "Due"} ${fmtDate(act.due)} · ${act.done ? (de ? "erledigt" : "done") : (de ? "offen" : "open")}</span>` : ""}${it.closedAt ? `<br><span style="color:#047857">${de ? "Erledigt am" : "Resolved on"} ${fmtDate(it.closedAt)}</span>` : ""}`,
        `${esc(it.evidence) || "—"}${it.note ? `<br><i style="color:#718096">${esc(it.note)}</i>` : ""}`,
      ];
    });
    const headDetail = ["#", "Framework / Control", de ? "Anforderung" : "Requirement", "Status", de ? "Befund" : "Finding", de ? "Risiken" : "Risks", de ? "Maßnahmen / Umsetzung" : "Measures / implementation", de ? "Nachweis / Notiz" : "Evidence / note"];
    const headList = ["#", "Framework / Control", de ? "Anforderung" : "Requirement", "Status", de ? "Befund (Vorschlag)" : "Finding (suggested)"];

    const methodik = rkSection(de ? "Methodik & Bewertungsskala" : "Methodology & rating scale") +
      rkLead(de
        ? "Grundlage sind die offenen Punkte der Gap-Analyse (nicht erfüllt / teilweise) nach Anrechnung des Umsetzungsstands. Das System schlägt je Befund eine Schwere vor (Verpflichtungsgrad der Norm, Katalog-Risikostufe, bewertetes Risiko); die Entscheidung trifft der Auditor."
        : "Basis are the open points of the gap analysis (not met / partial) after crediting the implementation status. The system suggests a severity per finding (normative obligation level, catalogue risk level, assessed risk); the auditor decides.") +
      rkTable([de ? "Schwere" : "Severity", de ? "Definition (ISO 19011 / ISO 27001 9.2)" : "Definition (ISO 19011 / ISO 27001 9.2)"], [
        ["<b style=\"color:#b91c1c\">Major</b>", de ? "Wesentliche Nichtkonformität: Pflichtanforderung (MUSS) nicht erfüllt oder systematisches Versagen einer Kontrolle; gefährdet die Zertifizierung/Konformität. Korrekturmaßnahme mit Ursachenanalyse und Frist erforderlich." : "Major nonconformity: a mandatory (MUST) requirement is not met or a control fails systematically; jeopardises certification/conformity. Corrective action with root-cause analysis and deadline required."],
        ["<b style=\"color:#b45309\">Minor</b>", de ? "Geringfügige Nichtkonformität: Anforderung nur teilweise erfüllt oder Einzelfallabweichung ohne systemische Wirkung. Korrekturmaßnahme erforderlich, Frist nach Risiko." : "Minor nonconformity: requirement only partly met or isolated deviation without systemic effect. Corrective action required, deadline according to risk."],
        ["<b style=\"color:#475569\">" + (de ? "Beobachtung (OFI)" : "Observation (OFI)") + "</b>", de ? "Verbesserungspotenzial ohne Verstoß gegen die Norm. Keine Pflicht zur Korrektur, Empfehlung für den KVP." : "Opportunity for improvement without breach of the standard. No mandatory correction, recommendation for continual improvement."],
      ]) +
      rkTable([de ? "Zustand" : "State", de ? "Bedeutung" : "Meaning"], [
        [de ? "Offen" : "Open", de ? "Befund festgestellt, noch keine Korrekturmaßnahme begonnen." : "Finding raised, no corrective action started yet."],
        [de ? "In Bearbeitung" : "In progress", de ? "Korrekturmaßnahme an die Umsetzung (Phase 06) übergeben bzw. begonnen." : "Corrective action handed to implementation (phase 06) or started."],
        [de ? "Erledigt" : "Resolved", de ? "Korrekturmaßnahme abgeschlossen und Wirksamkeit nachgewiesen (Nachweis hinterlegt)." : "Corrective action completed and effectiveness evidenced."],
      ]);

    const unterschrift = rkSection(de ? "Freigabe" : "Sign-off") +
      `<table style="width:100%;margin-top:18px;border-collapse:collapse"><tr>
        <td style="width:50%;padding:0 18px 0 0;vertical-align:bottom"><div style="border-top:1px solid #1A2E41;padding-top:6px;font-size:11px;color:#4A5568">${de ? "Auditor" : "Auditor"}: ${esc(audit.auditor) || "________________"}<br>${de ? "Datum, Unterschrift" : "Date, signature"}</div></td>
        <td style="width:50%;padding:0 0 0 18px;vertical-align:bottom"><div style="border-top:1px solid #1A2E41;padding-top:6px;font-size:11px;color:#4A5568">${de ? "Leitung / Auftraggeber" : "Management / sponsor"}<br>${de ? "Datum, Unterschrift" : "Date, signature"}</div></td>
      </tr></table>`;

    const body =
      rkSection(de ? "Audit-Rahmen" : "Audit scope") + kopf +
      rkSection(de ? "Ergebnis auf einen Blick" : "Result at a glance") + kpis +
      rkSection(de ? `Feststellungen (${touched.length})` : `Findings (${touched.length})`) +
      rkLead(de ? "Vom Auditor bewertete Befunde mit Schwere, Risiken, Korrekturmaßnahmen und Nachweisen." : "Findings assessed by the auditor with severity, risks, corrective actions and evidence.") +
      (touched.length ? rkTable(headDetail, findingRows(touched, true)) : `<p style="color:#718096">${de ? "Noch keine bewerteten Feststellungen." : "No assessed findings yet."}</p>`) +
      rkSection(de ? `Prüfliste — weitere offene Punkte (${untouched.length})` : `Checklist — further open points (${untouched.length})`) +
      rkLead(de ? "Offene Punkte aus der Gap-Analyse, die im Audit noch nicht einzeln bewertet wurden (Schwere = Systemvorschlag)." : "Open points from the gap analysis not yet individually assessed in the audit (severity = system suggestion).") +
      (untouched.length ? rkTable(headList, findingRows(untouched, false)) : `<p style="color:#718096">${de ? "Keine weiteren offenen Punkte." : "No further open points."}</p>`) +
      methodik + historie + unterschrift + rkGlossary(de ? "de" : "en");

    const safeTitle = (active?.titel || "").replace(/[^\w\-äöüÄÖÜß ]+/g, "").trim().replace(/\s+/g, "_");
    rkExport(modeOut, {
      title: de ? "Audit-Bericht" : "Audit report",
      sub: `${de ? "Phase 06 · Audit & KVP" : "Phase 06 · Audit & CIP"}${active ? ` · ${active.titel} (${typLabel(active.typ)})` : ""}${audit.datum ? ` · ${fmtDate(audit.datum)}` : ""}`,
      body, file: `Audit-Bericht_${safeTitle ? safeTitle + "_" : ""}${audit.datum || new Date().toISOString().slice(0, 10)}`, lang: de ? "de" : "en",
      charts: modeOut === "pdf",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="text-primary" size={22} />{de ? "Audit & KVP" : "Audit & CIP"}</h1>
          <ModeToggle de={de} />
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de ? "Auditieren Sie gezielt die offenen Punkte aus der Gap-Analyse. Das System schlägt je Befund major/minor vor — Sie entscheiden. Verknüpfte Risiken und Maßnahmen halten Sie direkt fest." : "Audit the open points from the gap analysis. The system suggests major/minor per finding — you decide. Capture linked risks and measures directly."}
        </p>
      </header>

      {conflict && (
        <div className="rounded-xl border st-teilweise-border st-teilweise-tint p-3 flex items-center gap-3 text-sm">
          <ShieldAlert size={16} className="st-teilweise-text shrink-0" />
          <span className="flex-1">{de ? "Achtung: Ein anderer Nutzer bearbeitet denselben Audit-Datensatz. Der Zustand wird als EINE geteilte Zeile gespeichert — koordinieren Sie sich, um gegenseitiges Überschreiben zu vermeiden. Exportieren Sie ggf. den Bericht, bevor Sie fortfahren." : "Warning: another user is editing the same audit record. State is stored as ONE shared row — coordinate to avoid overwriting each other. Export the report before continuing if needed."}</span>
          <button onClick={() => setConflict(false)} className="rounded-md st-teilweise-bg text-white px-3 py-1 text-xs font-semibold shrink-0">{de ? "Verstanden" : "Understood"}</button>
        </div>
      )}

      {/* Audit-Programm (ISO 27001 9.2): alle Audits, Historie, Öffnen/Abschließen */}
      <AuditProgramCard de={de} audits={audits} activeId={activeId} auditableFrameworks={auditableFrameworks} fwLabel={fwLabel}
        onCreate={createAudit} onOpen={openAudit} onStart={startAudit} onClose={closeAudit} onDelete={deleteAudit} />

      {/* Audit-Kopf — bearbeitet das AKTIVE Audit */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-semibold text-foreground">{active?.titel || (de ? "Aktives Audit" : "Active audit")}</span>
          {active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{de ? AUDIT_TYP_LABEL[active.typ].de : AUDIT_TYP_LABEL[active.typ].en}</span>}
          {active && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${AUDIT_STATUS_LABEL[active.status].cls}`}>{de ? AUDIT_STATUS_LABEL[active.status].de : AUDIT_STATUS_LABEL[active.status].en}</span>}
          {readOnly && <span className="text-[11px] text-muted-foreground">{de ? "— abgeschlossen: Befunde nur ansehen, Bericht weiterhin exportierbar." : "— completed: findings are read-only, report still exportable."}</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Titel" : "Title"}
            <input value={active?.titel ?? ""} disabled={readOnly} onChange={e => setData(d => updateActiveAudit(d, { titel: e.target.value }, de))} className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-60" /></label>
          <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Auditor" : "Auditor"}
            <input value={audit.auditor ?? ""} disabled={readOnly} onChange={e => setData(d => updateActiveAudit(d, { auditor: e.target.value }, de))} className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-60" /></label>
          <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Datum" : "Date"}
            <input type="date" value={audit.datum ?? ""} disabled={readOnly} onChange={e => setData(d => updateActiveAudit(d, { datum: e.target.value }, de))} className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-60" /></label>
          <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Gesamturteil" : "Overall verdict"}
            <input value={audit.urteil ?? ""} disabled={readOnly} onChange={e => setData(d => updateActiveAudit(d, { urteil: e.target.value }, de))} placeholder={de ? "z. B. bestanden mit Auflagen" : "e.g. passed with conditions"} className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground disabled:opacity-60" /></label>
        </div>
      </div>

      {/* Filter & Optionen */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><Filter size={15} className="text-primary" />{de ? "Frameworks (aktiv) filtern" : "Filter frameworks (active)"}</div>
        {auditableFrameworks.length === 0 ? (
          <p className="text-xs text-muted-foreground">{loading ? (de ? "Lädt…" : "Loading…") : (de ? "Keine aktiven Frameworks mit Kontrollen. Wählen Sie welche in Schritt 1." : "No active frameworks with controls. Select some in Step 1.")}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {auditableFrameworks.map(fw => {
              const on = inc.has(fw);
              return (
                <button key={fw} onClick={() => { const n = new Set(inc); on ? n.delete(fw) : n.add(fw); setIncluded(n); }}
                  className={`text-xs px-2.5 py-1 rounded-full border ${on ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-background text-muted-foreground"}`}>
                  {fwLabel(fw)}
                </button>
              );
            })}
          </div>
        )}
        {/* Erweiterte Auditor-Filter: nur Detail-Modus. Überblick zeigt die
            Standard-Befundliste ohne Power-User-Optionen. */}
        {mode === "expert" && (
        <div className="flex flex-wrap gap-4 text-xs pt-1">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={includePartial} onChange={e => setIncludePartial(e.target.checked)} />{de ? "Teilweise (schwach) einschließen" : "Include partial (weak)"}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={showNa} onChange={e => setShowNa(e.target.checked)} />{de ? "Nicht anwendbare (n.a.) anzeigen" : "Show not-applicable (n/a)"}</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={showUnbewertet} onChange={e => setShowUnbewertet(e.target.checked)} />{de ? "Nicht bewertete anzeigen" : "Show not-assessed"}</label>
        </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setLoaded(true)} disabled={loading || auditableFrameworks.length === 0}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            <Play size={15} />{de ? "Gap-Ergebnisse laden" : "Load gap results"}
          </button>
          {loaded && findings.length > 0 && (
            <>
              <button onClick={exportCsv} className="rounded-md border border-border px-3 py-2 text-sm flex items-center gap-1.5"><FileDown size={15} />CSV</button>
              <button onClick={() => openReport("pdf")} className="rounded-md border border-border px-3 py-2 text-sm flex items-center gap-1.5" title={de ? "Vorschau im neuen Tab — dort „Als PDF speichern“" : "Preview in new tab — save as PDF there"}><FileText size={15} />{de ? "Bericht (Vorschau / PDF)" : "Report (preview / PDF)"}</button>
              <button onClick={() => openReport("word")} className="rounded-md border border-border px-3 py-2 text-sm flex items-center gap-1.5"><FileDown size={15} />Word</button>
            </>
          )}
        </div>
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {loading ? (de ? "Lädt Kontrollen…" : "Loading controls…") : (de ? "Der Arbeitsbereich ist leer. Klicken Sie „Gap-Ergebnisse laden“, um die offenen Punkte zu prüfen." : "Workspace is empty. Click ‘Load gap results’ to review open points.")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button onClick={() => setSevFilter("all")} className={`text-left rounded-xl border p-4 ${sevFilter === "all" ? "border-primary bg-primary/5" : "border-border bg-card"}`}><div className="text-2xl font-bold">{stats.real}</div><div className="text-xs text-muted-foreground">{de ? "Befunde" : "Findings"}</div></button>
            <button onClick={() => setSevFilter("major")} className={`text-left rounded-xl border p-4 ${sevFilter === "major" ? "border-destructive bg-destructive/10" : "border-destructive/40 bg-destructive/5"}`}><div className="text-2xl font-bold text-destructive">{stats.major}</div><div className="text-xs text-muted-foreground">Major</div></button>
            <button onClick={() => setSevFilter("minor")} className={`text-left rounded-xl border p-4 ${sevFilter === "minor" ? "st-teilweise-border st-teilweise-tint" : "st-teilweise-border st-teilweise-tint"}`}><div className="text-2xl font-bold st-teilweise-text">{stats.minor}</div><div className="text-xs text-muted-foreground">Minor</div></button>
            <button onClick={() => setSevFilter("beobachtung")} className={`text-left rounded-xl border p-4 ${sevFilter === "beobachtung" ? "border-slate-500 bg-slate-500/10" : "border-slate-400/40 bg-slate-400/5"}`}><div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{stats.ofi}</div><div className="text-xs text-muted-foreground">{de ? "Beobachtung (OFI)" : "Observation (OFI)"}</div></button>
            <button onClick={() => setSevFilter("erledigt")} className={`text-left rounded-xl border p-4 ${sevFilter === "erledigt" ? "st-ja-border st-ja-tint" : "border-border bg-card"}`}><div className="text-2xl font-bold st-ja-text">{stats.erledigt}</div><div className="text-xs text-muted-foreground">{de ? "Erledigt" : "Resolved"}</div></button>
          </div>

          {mode !== "expert" ? (() => {
            if (findings.length === 0) return (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 size={22} className="st-ja-text" />
                {de ? "Keine Befunde — alle Kontrollen erfüllt oder als N.a. markiert." : "No findings — all controls met or marked N/A."}
              </div>
            );
            const SEVC = { major: CHART_STATUS.nein, minor: CHART_STATUS.teilweise, ofi: CHART_STATUS.na, erledigt: CHART_STATUS.ja };
            const fwAgg = new Map<string, { oMajor: number; oMinor: number; oOfi: number; resolved: number; total: number }>();
            let oMajor = 0, oMinor = 0, oOfi = 0, resolved = 0, realTot = 0;
            for (const f of findings) {
              if (f.status === "na" || f.status === "unbewertet") continue;
              const it = audit.items?.[keyOf(f)] ?? defaultItem(f);
              realTot++;
              const cur = fwAgg.get(f.fw) ?? { oMajor: 0, oMinor: 0, oOfi: 0, resolved: 0, total: 0 };
              cur.total++;
              if (it.state === "erledigt") { resolved++; cur.resolved++; }
              else if (it.severity === "major") { oMajor++; cur.oMajor++; }
              else if (it.severity === "beobachtung") { oOfi++; cur.oOfi++; }
              else { oMinor++; cur.oMinor++; }
              fwAgg.set(f.fw, cur);
            }
            const resolPct = realTot ? Math.round((resolved / realTot) * 100) : 0;
            const legend = [
              { l: "Major", v: oMajor, c: SEVC.major },
              { l: "Minor", v: oMinor, c: SEVC.minor },
              { l: de ? "Beobachtung" : "Observation", v: oOfi, c: SEVC.ofi },
              { l: de ? "Erledigt" : "Resolved", v: resolved, c: SEVC.erledigt },
            ];
            const bigDonut = legend.map(s => ({ name: s.l, value: s.v, color: s.c })).filter(d => d.value > 0);
            const bigDD = bigDonut.length ? bigDonut : [{ name: "-", value: 1, color: CHART_EMPTY }];
            const fwItems: FwMiniItem[] = [...fwAgg.entries()].sort((a, b) => b[1].total - a[1].total).map(([fw, c]) => ({
              key: fw, label: fwLabel(fw),
              pct: c.total ? Math.round((c.resolved / c.total) * 100) : 0,
              donut: [
                { name: "Major", value: c.oMajor, color: SEVC.major },
                { name: "Minor", value: c.oMinor, color: SEVC.minor },
                { name: "OFI", value: c.oOfi, color: SEVC.ofi },
                { name: de ? "Erledigt" : "Resolved", value: c.resolved, color: SEVC.erledigt },
              ],
              rows: [
                { label: "Major", value: c.oMajor, color: SEVC.major },
                { label: "Minor", value: c.oMinor, color: SEVC.minor },
                { label: de ? "Beobachtung" : "Observation", value: c.oOfi, color: SEVC.ofi },
              ],
              footer: { label: de ? "Erledigt / gesamt" : "Resolved / total", value: `${c.resolved}/${c.total}` },
            }));
            return (
              <div className="space-y-4">
                {/* UniqSuite: Schwere-Ring + Balken wiederholten die Kennzahl-Kacheln (Major/Minor/OFI/Erledigt) darüber. */}
                {SHOW_SEVERITY_BLOCK && <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="w-full md:w-80 shrink-0" style={{ height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        {/* Beschriftung IM Ring (lib/chartLabels) — ausserhalb
                            gezeichnete Werte kollidieren mit Nachbarsegmenten
                            und mit allem, was unter dem Diagramm steht. */}
                        <Pie data={bigDD} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={104} paddingAngle={2}
                             labelLine={false} label={insideSliceLabel("percent", 0.06)}>
                          {bigDD.map((d, i) => <Cell key={i} fill={(d as any).color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                        </Pie>
                        <RTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-2">
                      {de ? "Befunde nach Schwere" : "Findings by severity"}
                      <span className="ml-2 st-ja-text">{resolPct}% {de ? "erledigt" : "resolved"}</span>
                    </div>
                    <div className="flex h-4 w-full rounded-full overflow-hidden border border-border">
                      {legend.map((s, i) => s.v > 0 ? <div key={i} style={{ width: `${(s.v / Math.max(1, realTot)) * 100}%`, background: s.c }} title={`${s.l}: ${s.v}`} /> : null)}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {legend.map((s, i) => <span key={i} className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.c }} />{s.l}: <b className="text-foreground">{s.v}</b></span>)}
                    </div>
                  </div>
                </div>}
                <FrameworkMiniGrid items={fwItems} title={de ? "Befunde je Framework" : "Findings by framework"} subtitle={de ? "— offene Befunde nach Schwere, % erledigt" : "— open findings by severity, % resolved"} />
                <AuditTrendChart de={de} audits={audits} activeId={activeId} />
                {/* UniqSuite: Gesamturteil steht bereits im Feld „Gesamturteil" des Audit-Kopfs. */}
                {SHOW_SEVERITY_BLOCK && audit.urteil && (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
                    <div className="text-[11px] text-muted-foreground">{de ? "Gesamturteil" : "Overall verdict"}</div>
                    <div className="text-sm font-semibold text-foreground">{audit.urteil}</div>
                  </div>
                )}

                {visibleFindings.length > 0 && (
                  <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-1">
                    <div className="text-sm font-semibold text-foreground mb-1">{de ? "Befunde" : "Findings"}</div>
                    {visibleFindings.slice(0, 25).map(f => (
                      <div key={`${f.fw}::${f.control.id}`} className="flex items-center gap-2 py-1 border-b border-border/40 last:border-0">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0" title={f.control.id}>{controlDisplayId(f)}</span>
                        <span className="text-xs text-foreground truncate flex-1" title={(de ? f.control.req_de : f.control.req_en) ?? f.control.id}>
                          {(de ? f.control.req_de : f.control.req_en) ?? f.control.req_de ?? f.control.id}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_META[f.status].cls}`}>
                          {de ? STATUS_META[f.status].de : STATUS_META[f.status].en}
                        </span>
                      </div>
                    ))}
                    {visibleFindings.length > 25 && (
                      <div className="text-[11px] text-muted-foreground pt-1">+{visibleFindings.length - 25} {de ? "weitere" : "more"}</div>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground">
                  {de ? "Zum Bearbeiten der Befunde (major/minor, Maßnahmen, Übergabe an die Umsetzung) auf " : "To edit findings (major/minor, measures, handover), switch to "}
                  <span className="font-semibold text-foreground">Detail</span>
                  {de ? " wechseln." : " above."}
                </div>
              </div>
            );
          })() : visibleFindings.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 size={22} className="st-ja-text" />{de ? "Keine Befunde in der aktuellen Auswahl." : "No findings in the current selection."}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleFindings.slice(0, visibleCount).map(f => (
                <FindingCard key={`${activeId}::${f.fw}::${f.control.id}`} f={f} de={de}
                  item={audit.items?.[`${f.fw}::${f.control.id}`] ?? defaultItem(f)}
                  riskById={riskById} searchableRisks={searchableRisks} fwLabel={fwLabel}
                  onPatch={patchItem} onHandoff={handoffToUmsetzung}
                  handedOff={handedOff.has(`${f.fw}::${f.control.id}`)}
                  readOnly={readOnly} people={people} onAddPerson={addPerson} />
              ))}
              {visibleFindings.length > visibleCount && (
                <div className="flex items-center justify-center gap-3 py-2">
                  <span className="text-xs text-muted-foreground">{de ? `${visibleCount} von ${visibleFindings.length} angezeigt` : `${visibleCount} of ${visibleFindings.length} shown`}</span>
                  <button onClick={() => setVisibleCount(c => c + 100)} className="rounded-md border border-border px-3 py-1.5 text-sm">{de ? "Mehr laden" : "Load more"}</button>
                  <button onClick={() => setVisibleCount(visibleFindings.length)} className="rounded-md border border-border px-3 py-1.5 text-sm">{de ? "Alle" : "All"}</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Befund-Karte (lokale Draft-States → kein Volllisten-Rerender pro Tastendruck) ──
function FindingCard({ f, de, item, riskById, searchableRisks, fwLabel, onPatch, onHandoff, handedOff, readOnly, people, onAddPerson }: {
  f: Finding; de: boolean; item: AuditItem;
  riskById: Map<string, RiskRow>; searchableRisks: RiskRow[];
  fwLabel: (c: string) => string; onPatch: (f: Finding, p: Partial<AuditItem>) => void;
  onHandoff: (f: Finding, item: AuditItem) => void; handedOff: boolean;
  readOnly: boolean; people: Person[]; onAddPerson: (p: Person) => void;
}) {
  const [measures, setMeasures] = useState(item.measures);
  const [note, setNote] = useState(item.note);
  const [evidence, setEvidence] = useState(item.evidence ?? "");
  const [manual, setManual] = useState("");
  const [q, setQ] = useState("");
  const isNa = f.status === "na" || f.status === "unbewertet";
  const ro = readOnly;

  const toggleRisk = (rid: string) => { if (ro) return; onPatch(f, { riskIds: item.riskIds.includes(rid) ? item.riskIds.filter(x => x !== rid) : [...item.riskIds, rid] }); };
  const addManual = () => { if (ro || !manual.trim()) return; onPatch(f, { manualRisks: [...item.manualRisks, { id: crypto.randomUUID(), text: manual.trim() }] }); setManual(""); };
  const removeManual = (id: string) => { if (ro) return; onPatch(f, { manualRisks: item.manualRisks.filter(m => m.id !== id) }); };
  const fmtD = (d?: string) => d ? new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(de ? "de-DE" : "en-GB") : "—";

  const ql = q.trim().toLowerCase();
  const hits = ql.length >= 2
    ? searchableRisks.filter(r => !item.riskIds.includes(r.risk_id) && ((r.text_de ?? "") + " " + (r.text_en ?? "") + " " + r.risk_id).toLowerCase().includes(ql)).slice(0, 8)
    : [];

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${isNa ? "border-border bg-muted/20" : "border-border bg-card"}`}>
      <div className="flex flex-wrap items-start gap-2">
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{fwLabel(f.fw)}</span>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0" title={f.control.id}>{controlDisplayId(f)}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_META[f.status].cls}`}>{de ? STATUS_META[f.status].de : STATUS_META[f.status].en}</span>
        {(() => { const lvl: MandatoryLevel = controlMandatoryLevel(withIsoMuss(f.control as any)); return (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 border ${lvl === "mandatory" ? "border-destructive/40 text-destructive" : lvl === "recommended" ? "st-teilweise-border st-teilweise-text" : "border-border text-muted-foreground"}`} title={de ? "Norm-Verpflichtungsgrad (Basis des Vorschlags)" : "Normative obligation level (basis of suggestion)"}>
            {de ? MANDATORY_LABEL[lvl].de : MANDATORY_LABEL[lvl].en}
          </span>); })()}
        <p className="text-sm flex-1 min-w-[240px]">{(de ? f.control.req_de : f.control.req_en) ?? f.control.req_de ?? f.control.id}</p>
      </div>
      {f.existingNote && <p className="text-[11px] text-muted-foreground border-l-2 border-border pl-2">{de ? "Bewertungs-Notiz: " : "Assessment note: "}{f.existingNote}</p>}

      {!isNa && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">{de ? "Befund:" : "Finding:"}</span>
              <div className="inline-flex rounded-md border border-border overflow-hidden">
                {(["major", "minor", "beobachtung"] as Sev[]).map(s => (
                  <button key={s} onClick={() => !ro && onPatch(f, { severity: s })} disabled={ro}
                    className={`px-2.5 py-1 text-xs font-semibold disabled:cursor-not-allowed ${item.severity === s ? (s === "major" ? "bg-destructive text-destructive-foreground" : s === "beobachtung" ? "bg-slate-500 text-white" : "st-teilweise-bg text-white") : "bg-background text-muted-foreground"}`}>
                    {s === "major" ? "Major" : s === "beobachtung" ? (de ? "Beob." : "OFI") : "Minor"}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground italic">{de ? "Vorschlag" : "Suggested"}: {suggestFindingSeverity(f.status as "nein" | "teilweise", withIsoMuss(f.control as any), f.maxRank)}</span>
            </div>
            <select value={item.state} disabled={ro} onChange={e => onPatch(f, { state: e.target.value as FindingState })} className="text-xs rounded-md border border-border bg-background px-2 py-1 ml-auto disabled:opacity-60">
              <option value="offen">{de ? "Offen" : "Open"}</option>
              <option value="in_bearbeitung">{de ? "In Bearbeitung" : "In progress"}</option>
              <option value="erledigt">{de ? "Erledigt" : "Resolved"}</option>
            </select>
          </div>

          {/* Korrekturmaßnahme: Verantwortlich (Personen-Register), Frist, Wiederholungsprüfung */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-lg border border-border bg-muted/10 p-2.5">
            <label className="text-[11px] text-muted-foreground flex flex-col gap-1">{de ? "Verantwortlich (Korrekturmaßnahme)" : "Owner (corrective action)"}
              {ro ? <span className="text-xs text-foreground py-1">{item.owner || "—"}</span>
                  : <PersonSelect value={item.owner ?? ""} onChange={v => onPatch(f, { owner: v || undefined })} people={people} onAddPerson={onAddPerson} de={de} placeholder={de ? "— Person wählen —" : "— select person —"} />}
            </label>
            <label className="text-[11px] text-muted-foreground flex flex-col gap-1">{de ? "Frist Korrekturmaßnahme" : "Corrective action due"}
              {ro ? <span className="text-xs text-foreground py-1">{fmtD(item.due)}</span>
                  : <input type="date" value={item.due ?? ""} onChange={e => onPatch(f, { due: e.target.value || undefined })} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs" />}
            </label>
            <label className="text-[11px] text-muted-foreground flex flex-col gap-1">{de ? "Wiederholungsprüfung (Wirksamkeit)" : "Re-check (effectiveness)"}
              {ro ? <span className="text-xs text-foreground py-1">{fmtD(item.recheck)}</span>
                  : <input type="date" value={item.recheck ?? ""} onChange={e => onPatch(f, { recheck: e.target.value || undefined })} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs" />}
            </label>
            {item.closedAt && <div className="md:col-span-3 text-[11px] st-ja-text">{de ? "Erledigt am" : "Resolved on"} {fmtD(item.closedAt)}</div>}
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5"><ShieldAlert size={12} />{de ? "Zugeordnete Risiken" : "Associated risks"}</div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set([...f.linkedRiskIds, ...item.riskIds])).map(rid => {
                const r = riskById.get(rid); const sel = item.riskIds.includes(rid);
                return (
                  <button key={rid} onClick={() => toggleRisk(rid)}
                    className={`text-[11px] px-2 py-1 rounded-md border text-left max-w-[340px] truncate ${sel ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                    title={r?.text_de ?? rid}>
                    <span className="font-mono">{rid}</span>{r && r.text_de !== rid ? ` · ${(de ? r.text_de : r.text_en) ?? r.text_de ?? ""}` : ""}
                  </button>
                );
              })}
              {f.linkedRiskIds.length === 0 && item.riskIds.length === 0 && <span className="text-[11px] text-muted-foreground">{de ? "Keine vorverknüpften Risiken — suchen oder manuell ergänzen." : "No pre-linked risks — search or add manually."}</span>}
            </div>
            {!ro && <div className="relative">
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2">
                <Search size={12} className="text-muted-foreground" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={de ? "Risiko im Katalog suchen (Stichwort)…" : "Search risk catalog (keyword)…"} className="flex-1 bg-transparent py-1 text-xs outline-none" />
              </div>
              {hits.length > 0 && (
                <div className="mt-1 rounded-md border border-border bg-card shadow-sm divide-y divide-border max-h-48 overflow-y-auto">
                  {hits.map(r => (
                    <button key={r.risk_id} onClick={() => { toggleRisk(r.risk_id); setQ(""); }} className="w-full text-left px-2 py-1.5 text-[11px] hover:bg-muted flex gap-2">
                      <span className="font-mono text-muted-foreground shrink-0">{r.risk_id}</span>
                      <span className="truncate">{(de ? r.text_de : r.text_en) ?? r.text_de}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>}
            {item.manualRisks.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-[11px]">
                <span className="px-1.5 py-0.5 rounded st-teilweise-tint st-teilweise-text">{de ? "manuell" : "manual"}</span>
                <span className="flex-1">{m.text}</span>
                {!ro && <button onClick={() => removeManual(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>}
              </div>
            ))}
            {!ro && <div className="flex items-center gap-1.5">
              <input value={manual} onChange={e => setManual(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addManual(); }}
                placeholder={de ? "Eigenes Risiko formulieren + Enter" : "Write your own risk + Enter"} className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[11px]" />
              <button onClick={addManual} className="rounded-md border border-border px-2 py-1 text-[11px] flex items-center gap-1"><Plus size={11} />{de ? "Risiko" : "Risk"}</button>
            </div>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-semibold text-muted-foreground">{de ? "Maßnahmen (was kann getan werden?)" : "Measures (what can be done?)"}</div>
              <button
                onClick={() => { if (ro) return; if (measures !== item.measures) onPatch(f, { measures }); onHandoff(f, { ...item, measures }); }}
                disabled={ro || !measures.trim()}
                className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 disabled:opacity-40 ${handedOff ? "st-ja-border st-ja-text" : "border-primary/40 text-primary"}`}
                title={ro ? (de ? "Audit abgeschlossen — schreibgeschützt" : "Audit completed — read-only") : (de ? "Als Korrekturmaßnahme (mit Verantwortlichem und Frist) an die Umsetzung (Phase 06) übergeben" : "Hand over as corrective action (with owner and due date) to Implementation (Phase 06)")}>
                {handedOff ? (de ? "✓ übergeben — aktualisieren" : "✓ handed over — update") : (de ? "→ An Umsetzung übergeben" : "→ Hand to Implementation")}
              </button>
            </div>
            <textarea value={measures} disabled={ro} onChange={e => setMeasures(e.target.value)} onBlur={() => !ro && measures !== item.measures && onPatch(f, { measures })} rows={2}
              placeholder={de ? "Empfohlene Behandlung / Korrekturmaßnahmen…" : "Recommended treatment / corrective actions…"} className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs disabled:opacity-70" />
          </div>
          <textarea value={note} disabled={ro} onChange={e => setNote(e.target.value)} onBlur={() => !ro && note !== item.note && onPatch(f, { note })} rows={1}
            placeholder={de ? "Auditor-Notiz zum Befund…" : "Auditor note on the finding…"} className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-[11px] disabled:opacity-70" />
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="shrink-0">{de ? "Nachweis:" : "Evidence:"}</span>
            <input value={evidence} disabled={ro} onChange={e => setEvidence(e.target.value)} onBlur={() => !ro && evidence !== (item.evidence ?? "") && onPatch(f, { evidence })}
              placeholder={de ? "Referenz / URL / Dokument / Screenshot-Name…" : "Reference / URL / document / screenshot name…"}
              className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] disabled:opacity-70" />
          </label>
        </>
      )}
    </div>
  );
}

const SHOW_SEVERITY_BLOCK = false;
