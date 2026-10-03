/**
 * Treatment Engine — Risk Treatment Decision & Control Selection
 *
 * Bridges: Risk Analysis (Step 8) → SoA (Step 10) → Implementation (Step 12)
 *
 * Pipeline: Risks + Gaps + Findings → Treatment Decisions → Selected Controls
 */

import type { RiskObject, RiskLevel } from "@/lib/riskEngine";
import type { ConsolidatedGap, Finding, AssetInfo } from "@/lib/gapEngine";
import type { ControlRow, IsoMapping } from "@/lib/assessmentEngine";
import { capabilityFor } from "@/lib/capabilityMap";
import { controlMetadata } from "@/data/controlMetadata";
import { controlFamilies } from "@/data/controlEngine";
import { nis2Domains, type ControlQuestion } from "@/data/nis2Controls";
import type { CatalogMeasure } from "@/data/controlCatalog";

// ── Types ──

export type TreatmentStrategy = "mitigate" | "accept" | "transfer" | "avoid";
export type TreatmentStatus = "planned" | "in_progress" | "done";

export interface SuggestedControl {
  /** Persisted selection key: framework::control_id. Custom controls keep their own id. */
  control_id: string;
  native_control_id: string;
  framework: string;
  framework_label: string;
  control_title: string;
  control_title_en: string;
  control_description: string;
  control_description_en: string;
  capability_tag: string;
  scope: "asset" | "organization";
  family_id: string;
  importance: string;
  /** IDs of gaps this control addresses */
  related_gap_ids: string[];
  /** IDs of risks this control mitigates */
  related_risk_ids: string[];
  /** Pre-built ISO 27002 + BSI IT-Grundschutz reference measures for this control */
  catalog_measures: CatalogMeasure[];
  /** Localized ZOK paths the catalog_measures were resolved from (deduplicated across linked risks) */
  zok_source_paths_de: string[];
  zok_source_paths_en: string[];
  /** True if any of the contributing resolutions came from the verbundweite ISMS bucket */
  catalog_from_isms: boolean;
  /** True when this entry is auto-suggested for at least one current risk. */
  is_suggested: boolean;
  /** ISO hub controls that led to this suggestion through mapping. */
  source_iso_ids: string[];
}

export interface CustomControl {
  id: string;
  question: string;
  questionEn: string;
}

export interface TreatmentObject {
  treatment_id: string;
  risk_id: string;
  strategy: TreatmentStrategy;
  selected_control_ids: string[];
  /** User-defined ad-hoc controls persisted alongside the treatment. */
  custom_controls?: CustomControl[];
  justification: string;
  owner: string;
  due_date: string;
  status: TreatmentStatus;
  /**
   * Persisted risk level from Risk Analysis (Step 8) — the single source of truth
   * consumed by SoA/Roadmap so those stages do not re-run gap/risk analysis. Always
   * refreshed from the current risk register during treatment generation.
   */
  risk_level?: RiskLevel;

  // ── P4.B.2 / US4.5 · Restrisiko nach Behandlung (rückwärtskompatibel: fehlend = null) ──
  /** Rest-Eintrittswahrscheinlichkeit (1–cols) nach Behandlung; null = nicht erfasst. */
  residual_likelihood?: number | null;
  /** Rest-Auswirkung (1–rows) nach Behandlung; null = nicht erfasst. */
  residual_impact?: number | null;
  /** „Restrisiko akzeptiert von" (Personen-Register, formatPerson-String). */
  residual_accepted_by?: string | null;
  /** Datum der Restrisiko-Akzeptanz (yyyy-mm-dd). */
  residual_accepted_at?: string | null;

  // ── P4.B.3 · Akzeptanz-Gate (Strategie „Akzeptieren" bei Stufe ≥ Hoch) ──
  /** Pflicht-Begründung der Risikoakzeptanz (≥ ACCEPTANCE_MIN_CHARS Zeichen). */
  acceptance_justification?: string | null;
  /** Freigeber der Akzeptanz (Personen-Register). */
  acceptance_approver?: string | null;
  /** Freigabedatum (yyyy-mm-dd). */
  acceptance_date?: string | null;
}

// ── P4.B.2 · Restrisiko-Vorschlag aus Strategie ──

/**
 * suggestResidualLI — Vorschlag für Rest-L/Rest-I aus Strategie + Anzahl
 * ausgewählter Kontrollen (rein advisory, Nutzer kann überschreiben):
 *   vermeiden   → L 1
 *   mindern     → L − (1 je 3 ausgewählte Kontrollen), min 1
 *   übertragen  → I − 1 (min 1)
 *   akzeptieren → unverändert
 */
export function suggestResidualLI(
  strategy: TreatmentStrategy,
  likelihood: number,
  impact: number,
  selectedControlCount: number,
): { likelihood: number; impact: number } {
  const l = Math.max(1, Math.round(likelihood));
  const i = Math.max(1, Math.round(impact));
  switch (strategy) {
    case "avoid":    return { likelihood: 1, impact: i };
    case "mitigate": return { likelihood: Math.max(1, l - Math.floor(Math.max(0, selectedControlCount) / 3)), impact: i };
    case "transfer": return { likelihood: l, impact: Math.max(1, i - 1) };
    case "accept":
    default:         return { likelihood: l, impact: i };
  }
}

/** Effektives Rest-L/I: erfasste Werte, sonst inhärente Werte des Risikos. */
export function effectiveResidualLI(
  risk: Pick<RiskObject, "likelihood" | "impact">,
  t: Pick<TreatmentObject, "residual_likelihood" | "residual_impact"> | undefined,
): { likelihood: number; impact: number; captured: boolean } {
  const l = typeof t?.residual_likelihood === "number" ? t.residual_likelihood : null;
  const i = typeof t?.residual_impact === "number" ? t.residual_impact : null;
  return {
    likelihood: l ?? risk.likelihood,
    impact: i ?? risk.impact,
    captured: l !== null || i !== null,
  };
}

// ── P4.B.3 · Akzeptanz-Gate ──

export const ACCEPTANCE_MIN_CHARS = 20;

/** Gate greift bei Strategie „Akzeptieren" und Risikostufe ≥ Hoch. */
export function acceptanceGateRequired(
  risk: Pick<RiskObject, "risk_level">,
  t: Pick<TreatmentObject, "strategy">,
): boolean {
  return t.strategy === "accept" && (risk.risk_level === "high" || risk.risk_level === "critical");
}

export interface AcceptanceGateStatus {
  required: boolean;
  ok: boolean;
  missing: ("justification" | "approver" | "date")[];
}

/**
 * acceptanceGateStatus — prüft Begründung (≥ 20 Zeichen), Freigeber und Datum.
 * Nicht erforderlich (Strategie ≠ accept oder Stufe < Hoch) ⇒ ok = true.
 */
export function acceptanceGateStatus(
  risk: Pick<RiskObject, "risk_level">,
  t: Pick<TreatmentObject, "strategy" | "acceptance_justification" | "acceptance_approver" | "acceptance_date">,
): AcceptanceGateStatus {
  const required = acceptanceGateRequired(risk, t);
  if (!required) return { required: false, ok: true, missing: [] };
  const missing: AcceptanceGateStatus["missing"] = [];
  if ((t.acceptance_justification ?? "").trim().length < ACCEPTANCE_MIN_CHARS) missing.push("justification");
  if (!(t.acceptance_approver ?? "").trim()) missing.push("approver");
  if (!(t.acceptance_date ?? "").trim()) missing.push("date");
  return { required: true, ok: missing.length === 0, missing };
}

export interface ControlSelectionEntry {
  /** Persisted selection key: framework::control_id. Custom controls keep their own id. */
  control_id: string;
  native_control_id: string;
  framework: string;
  framework_label: string;
  control_title: string;
  control_title_en: string;
  control_description: string;
  control_description_en: string;
  capability_tag: string;
  scope: "asset" | "organization";
  family_id: string;
  importance: string;
  mitigated_risk_ids: string[];
  mitigated_risk_count: number;
  linked_gap_ids: string[];
  /** Pre-built ISO 27002 + BSI IT-Grundschutz reference measures for this control */
  catalog_measures: CatalogMeasure[];
  /** Localized ZOK paths the catalog_measures were resolved from (deduplicated) */
  zok_source_paths_de: string[];
  zok_source_paths_en: string[];
  /** True if any contribution came from the verbundweite ISMS bucket */
  catalog_from_isms: boolean;
  is_suggested: boolean;
  source_iso_ids: string[];
}

export interface TreatmentAnalysisResult {
  treatments: TreatmentObject[];
  suggestedControls: Map<string, SuggestedControl>;
  controlSelectionList: ControlSelectionEntry[];
}

export interface TreatmentEngineInput {
  risks: RiskObject[];
  gaps: ConsolidatedGap[];
  findings: Finding[];
  /** Optional asset list — used to resolve ZOK-based catalog measures */
  assets?: AssetInfo[];
  existingTreatments?: TreatmentObject[];
  /** All controls from the enabled framework catalogs, including ISO hub. */
  frameworkControls?: ControlRow[];
  /** Mapping rows from selected framework controls to ISO hub controls. */
  controlIsoMappings?: IsoMapping[];
  /** Enabled framework codes, used to decide which catalogs appear in the picker. */
  enabledFrameworks?: string[];
}

// ── Control lookup ──

const _controlMap = new Map<string, ControlQuestion>();
for (const domain of nis2Domains) {
  for (const cat of domain.categories) {
    for (const q of cat.questions) {
      _controlMap.set(q.id, q);
    }
  }
}

const HUB_FRAMEWORK = "ISO27001";
const EMPTY_MEASURES: CatalogMeasure[] = [];

export function makeControlSelectionId(framework: string, controlId: string): string {
  if (!framework || controlId.startsWith("custom-")) return controlId;
  return `${framework}::${controlId}`;
}

export function parseControlSelectionId(selectionId: string): { framework: string | null; controlId: string } {
  const idx = selectionId.indexOf("::");
  if (idx === -1) return { framework: null, controlId: selectionId };
  return { framework: selectionId.slice(0, idx), controlId: selectionId.slice(idx + 2) };
}

function frameworkLabel(framework: string): string {
  const labels: Record<string, string> = {
    ISO27001: "ISO 27001",
    NIS2: "NIS2",
    BSI: "BSI IT-Grundschutz",
    DORA: "DORA",
    TISAX: "TISAX",
    GDPR: "DSGVO",
    ISO27701: "ISO 27701",
    BCM22301: "ISO 22301",
    BSI200_4: "BSI 200-4",
    AIACT: "EU AI Act",
    ISO42001: "ISO 42001",
    NIST_AI_RMF: "NIST AI RMF",
  };
  return labels[framework] ?? framework;
}

type CatalogControlEntry = Omit<ControlSelectionEntry, "mitigated_risk_ids" | "mitigated_risk_count" | "linked_gap_ids" | "is_suggested" | "source_iso_ids"> & {
  source_iso_ids: string[];
};

function rowText(row: ControlRow, field: "de" | "en"): string {
  const primary = field === "de" ? row.req_de : row.req_en;
  const fallback = field === "de" ? row.req_en : row.req_de;
  return (primary ?? "").trim() || (fallback ?? "").trim() || row.id;
}

function buildFallbackNis2Catalog(): CatalogControlEntry[] {
  return nis2Domains.flatMap(domain =>
    domain.categories.flatMap(cat =>
      cat.questions.map(q => {
        const fId = getFamilyIdForControl(q.id);
        return {
          control_id: makeControlSelectionId("NIS2", q.id),
          native_control_id: q.id,
          framework: "NIS2",
          framework_label: frameworkLabel("NIS2"),
          control_title: q.question,
          control_title_en: q.questionEn,
          control_description: q.description,
          control_description_en: q.descriptionEn,
          capability_tag: fId,
          scope: controlMetadata[q.id]?.scope ?? "organization",
          family_id: fId,
          importance: getImportanceForFamily(fId),
          catalog_measures: EMPTY_MEASURES,
          zok_source_paths_de: [],
          zok_source_paths_en: [],
          catalog_from_isms: false,
          source_iso_ids: [],
        };
      }),
    ),
  );
}

function buildFrameworkCatalog(
  rows: ControlRow[],
  mappings: IsoMapping[],
  enabledFrameworks: string[] = [],
): CatalogControlEntry[] {
  if (rows.length === 0) return buildFallbackNis2Catalog();
  const enabled = new Set([HUB_FRAMEWORK, ...enabledFrameworks.filter(Boolean)]);
  const isoBySelection = new Map<string, string[]>();
  for (const m of mappings) {
    const key = makeControlSelectionId(m.framework, m.control_id);
    if (!isoBySelection.has(key)) isoBySelection.set(key, []);
    isoBySelection.get(key)!.push(m.iso_id);
  }

  return rows
    .filter(r => enabled.size === 0 || enabled.has(r.framework))
    .map(row => {
      const selectionId = makeControlSelectionId(row.framework, row.id);
      const cap = capabilityFor(row);
      const meta = controlMetadata[row.id];
      const sourceIsoIds = row.framework === HUB_FRAMEWORK
        ? [row.id]
        : Array.from(new Set(isoBySelection.get(selectionId) ?? []));
      return {
        control_id: selectionId,
        native_control_id: row.id,
        framework: row.framework,
        framework_label: frameworkLabel(row.framework),
        control_title: rowText(row, "de"),
        control_title_en: rowText(row, "en"),
        control_description: rowText(row, "de"),
        control_description_en: rowText(row, "en"),
        capability_tag: cap,
        scope: meta?.scope ?? "organization",
        family_id: cap,
        importance: row.muss === "true" ? "critical" : getImportanceForFamily(cap),
        catalog_measures: EMPTY_MEASURES,
        zok_source_paths_de: [],
        zok_source_paths_en: [],
        catalog_from_isms: row.framework === HUB_FRAMEWORK,
        source_iso_ids: sourceIsoIds,
      };
    });
}

function getFamilyIdForControl(controlId: string): string {
  return controlMetadata[controlId]?.familyId ?? "unknown";
}

function getImportanceForFamily(familyId: string): string {
  const importanceMap: Record<string, string> = {
    governance: "critical", risk_mgmt: "critical", incident_mgmt: "critical",
    business_continuity: "critical", identity_access_mgmt: "high",
    network_security: "high", monitoring_logging: "high", supplier_security: "high",
    vulnerability_mgmt: "high", endpoint_security: "medium", cryptography: "medium",
    data_protection: "medium", secure_development: "medium",
    compliance_audit: "medium", asset_mgmt: "medium",
    personnel_security: "low", awareness_training: "low", physical_security: "low",
  };
  return importanceMap[familyId] ?? "medium";
}

// ── Suggest controls for a risk ──

function suggestControlsForRisk(
  risk: RiskObject,
  gapMap: Map<string, ConsolidatedGap>,
  findingMap: Map<string, Finding>,
  catalog: CatalogControlEntry[],
): SuggestedControl[] {
  const relatedGap = gapMap.get(risk.related_gap_id);
  const capability = relatedGap?.capability_tag ?? risk.capability_tag;

  const byId = new Map(catalog.map(c => [c.control_id, c]));
  const isoIds = new Set<string>();
  if (relatedGap) {
    const gapFindings = relatedGap.supporting_finding_ids
      .map(id => findingMap.get(id))
      .filter((f): f is Finding => Boolean(f));
    for (const f of gapFindings) isoIds.add(f.control_id);
  } else if (risk.risk_source === "manual") {
    // US4.6 — manuelle Risiken ohne Gap: Kontroll-Referenzen direkt vom Risiko
    // (z. B. Primärkontrolle eines DB-Katalogtexts) verwenden.
    for (const f of risk.supporting_findings ?? []) if (f.control_id) isoIds.add(f.control_id);
  }
  const isManual = risk.risk_source === "manual";

  // 1) Direct ISO controls + all enabled-framework controls mapped to those ISO controls.
  const selectionIds = new Set<string>();
  const addUntil = (items: CatalogControlEntry[], max: number) => {
    for (const c of items) {
      if (selectionIds.size >= max) break;
      selectionIds.add(c.control_id);
    }
  };
  const directIso = catalog.filter(c => c.framework === HUB_FRAMEWORK && isoIds.has(c.native_control_id));
  const mapped = catalog.filter(c => c.framework !== HUB_FRAMEWORK && c.source_iso_ids.some(id => isoIds.has(id)));
  addUntil(directIso, 3);
  addUntil(mapped, 6);
  if (isManual) {
    // Manuell: Referenz kann auch eine Nicht-ISO-Kontrolle sein (native id, beliebiges Framework).
    addUntil(catalog.filter(c => isoIds.has(c.native_control_id)), 6);
  }

  // 2) Fill with controls from the same capability across the selected catalogs.
  for (const c of catalog) {
    if (selectionIds.size >= 6) break;
    if (c.capability_tag === capability) selectionIds.add(c.control_id);
  }

  // Manuelle Risiken: KEIN willkürlicher Auffüll-Fallback (Schritte 3/4) — was
  // nicht über Referenz/Capability passt, wählt der Nutzer bewusst aus dem Katalog.
  if (isManual) {
    const out: SuggestedControl[] = [];
    for (const selectionId of selectionIds) {
      const ctrl = byId.get(selectionId);
      if (!ctrl) continue;
      out.push({ ...ctrl, related_gap_ids: [], related_risk_ids: [risk.risk_id], is_suggested: true, source_iso_ids: Array.from(new Set([...ctrl.source_iso_ids, ...isoIds])) });
    }
    return out;
  }

  // 3) Legacy NIS2-family fallback for sparse/missing mapping data.
  if (selectionIds.size < 2) {
    const family = controlFamilies.find(f => f.id === capability);
    for (const cid of family?.controlIds ?? []) {
      const direct = byId.get(makeControlSelectionId("NIS2", cid)) ?? byId.get(cid);
      if (direct) selectionIds.add(direct.control_id);
      if (selectionIds.size >= 2) break;
    }
  }

  // 4) Absolute guarantee: at least two visible suggestions from the selected catalog.
  if (selectionIds.size < 2) {
    for (const c of catalog) {
      selectionIds.add(c.control_id);
      if (selectionIds.size >= 2) break;
    }
  }

  const suggestions: SuggestedControl[] = [];
  for (const selectionId of selectionIds) {
    const ctrl = byId.get(selectionId);
    if (!ctrl) continue;
    suggestions.push({
      ...ctrl,
      related_gap_ids: relatedGap ? [relatedGap.gap_id] : [],
      related_risk_ids: [risk.risk_id],
      is_suggested: true,
      source_iso_ids: Array.from(new Set([...ctrl.source_iso_ids, ...isoIds])),
    });
  }

  return suggestions;
}

// ── Priority score for a treatment ──

export function getTreatmentPriority(risk: RiskObject): "P1" | "P2" | "P3" {
  if (risk.risk_level === "critical" || (risk.risk_level === "high" && risk.risk_score >= 15)) return "P1";
  if (risk.risk_level === "high" || risk.risk_level === "medium") return "P2";
  return "P3";
}

export function priorityColor(p: "P1" | "P2" | "P3"): string {
  if (p === "P1") return "bg-red-100 text-red-800 border-red-300";
  if (p === "P2") return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-green-100 text-green-800 border-green-300";
}

// ── Main Entry Point ──

export function generateTreatmentPlan(input: TreatmentEngineInput): TreatmentAnalysisResult {
  const { risks, gaps, findings, existingTreatments } = input;
  const existingMap = new Map((existingTreatments ?? []).map(t => [t.risk_id, t]));
  const gapMap = new Map(gaps.map(g => [g.gap_id, g]));
  const findingMap = new Map(findings.map(f => [f.finding_id, f]));
  const fullCatalog = buildFrameworkCatalog(
    input.frameworkControls ?? [],
    input.controlIsoMappings ?? [],
    input.enabledFrameworks ?? [],
  );
  const legacyIdMap = new Map<string, string>();
  for (const c of fullCatalog) {
    if (!legacyIdMap.has(c.native_control_id) || c.framework === "NIS2") {
      legacyIdMap.set(c.native_control_id, c.control_id);
    }
  }
  const normalizeSelectionIds = (ids: string[] = []) => Array.from(new Set(ids.map(id => {
    if (id.includes("::") || id.startsWith("custom-")) return id;
    return legacyIdMap.get(id) ?? id;
  })));

  // Global control suggestion map (deduplicated)
  const globalControls = new Map<string, SuggestedControl>();
  const riskSuggestions = new Map<string, string[]>(); // risk_id → control_ids

  // Step 1: Generate suggestions per risk
  for (const risk of risks) {
    const suggestions = suggestControlsForRisk(risk, gapMap, findingMap, fullCatalog);
    const controlIds: string[] = [];

    for (const s of suggestions) {
      if (globalControls.has(s.control_id)) {
        // Merge: add this risk/gap to existing entry
        const existing = globalControls.get(s.control_id)!;
        if (!existing.related_risk_ids.includes(risk.risk_id)) {
          existing.related_risk_ids.push(risk.risk_id);
        }
        for (const gid of s.related_gap_ids) {
          if (!existing.related_gap_ids.includes(gid)) {
            existing.related_gap_ids.push(gid);
          }
        }
        // Union ZOK source paths across linked risks
        for (const p of s.zok_source_paths_de) {
          if (!existing.zok_source_paths_de.includes(p)) existing.zok_source_paths_de.push(p);
        }
        for (const p of s.zok_source_paths_en) {
          if (!existing.zok_source_paths_en.includes(p)) existing.zok_source_paths_en.push(p);
        }
        if (s.catalog_from_isms) existing.catalog_from_isms = true;
      } else {
        globalControls.set(s.control_id, { ...s });
      }
      controlIds.push(s.control_id);
    }
    riskSuggestions.set(risk.risk_id, controlIds);
  }

  // Step 2: Generate treatment objects — merge existing user edits with
  // fresh auto-suggestions so stale treatments (empty selected_control_ids
  // from earlier saves) get repopulated instead of staying blank forever.
  const treatments: TreatmentObject[] = risks.map(risk => {
    const existing = existingMap.get(risk.risk_id);
    const autoIds = riskSuggestions.get(risk.risk_id) ?? [];
    if (existing) {
      const normalized = normalizeSelectionIds(existing.selected_control_ids ?? []);
      const looksAutoGenerated = !existing.owner && !existing.due_date && !existing.justification && existing.strategy === "mitigate" && existing.status === "planned";
      // Always refresh risk_level from the current risk register — Risk Analysis is
      // authoritative; SoA/Roadmap read it from here, so drift is not permitted.
      if (looksAutoGenerated && autoIds.length > 0 && normalized.length > 12) {
        return { ...existing, selected_control_ids: autoIds, risk_level: risk.risk_level };
      }
      if (normalized.length < 2 && autoIds.length > 0) {
        return { ...existing, selected_control_ids: Array.from(new Set([...normalized, ...autoIds])).slice(0, Math.max(2, normalized.length)), risk_level: risk.risk_level };
      }
      return { ...existing, selected_control_ids: normalized, risk_level: risk.risk_level };
    }

    return {
      treatment_id: `treat-${risk.risk_id}`,
      risk_id: risk.risk_id,
      strategy: "mitigate" as TreatmentStrategy,
      selected_control_ids: autoIds,
      justification: "",
      owner: "",
      due_date: "",
      status: "planned" as TreatmentStatus,
      risk_level: risk.risk_level,
    };
  });

  // Step 3: Build full picker catalog across every enabled framework. Suggested
  // controls carry risk/gap metadata; non-suggested controls remain selectable.
  const controlSelectionList: ControlSelectionEntry[] = fullCatalog.map(ctrl => {
    const suggested = globalControls.get(ctrl.control_id);
    return {
      control_id: ctrl.control_id,
      native_control_id: ctrl.native_control_id,
      framework: ctrl.framework,
      framework_label: ctrl.framework_label,
      control_title: ctrl.control_title,
      control_title_en: ctrl.control_title_en,
      control_description: ctrl.control_description,
      control_description_en: ctrl.control_description_en,
      capability_tag: ctrl.capability_tag,
      scope: ctrl.scope,
      family_id: ctrl.family_id,
      importance: ctrl.importance,
      mitigated_risk_ids: suggested?.related_risk_ids ?? [],
      mitigated_risk_count: suggested?.related_risk_ids.length ?? 0,
      linked_gap_ids: suggested?.related_gap_ids ?? [],
      catalog_measures: ctrl.catalog_measures,
      zok_source_paths_de: ctrl.zok_source_paths_de,
      zok_source_paths_en: ctrl.zok_source_paths_en,
      catalog_from_isms: ctrl.catalog_from_isms,
      is_suggested: Boolean(suggested),
      source_iso_ids: suggested?.source_iso_ids ?? ctrl.source_iso_ids,
    };
  });

  controlSelectionList.sort((a, b) =>
    b.mitigated_risk_count - a.mitigated_risk_count ||
    a.framework.localeCompare(b.framework) ||
    a.native_control_id.localeCompare(b.native_control_id),
  );

  return { treatments, suggestedControls: globalControls, controlSelectionList };
}

// ── Strategy helpers ──

export const STRATEGY_OPTIONS: { value: TreatmentStrategy; labelDe: string; labelEn: string; color: string }[] = [
  { value: "mitigate", labelDe: "Mitigieren", labelEn: "Mitigate", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "accept", labelDe: "Akzeptieren", labelEn: "Accept", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { value: "transfer", labelDe: "Transferieren", labelEn: "Transfer", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { value: "avoid", labelDe: "Vermeiden", labelEn: "Avoid", color: "bg-gray-100 text-gray-800 border-gray-300" },
];

export const STATUS_OPTIONS: { value: TreatmentStatus; labelDe: string; labelEn: string }[] = [
  { value: "planned", labelDe: "Geplant", labelEn: "Planned" },
  { value: "in_progress", labelDe: "In Bearbeitung", labelEn: "In Progress" },
  { value: "done", labelDe: "Abgeschlossen", labelEn: "Done" },
];

export function strategyLabel(s: TreatmentStrategy, lang: "de" | "en"): string {
  return STRATEGY_OPTIONS.find(o => o.value === s)?.[lang === "de" ? "labelDe" : "labelEn"] ?? s;
}

export function strategyColor(s: TreatmentStrategy): string {
  return STRATEGY_OPTIONS.find(o => o.value === s)?.color ?? "";
}
