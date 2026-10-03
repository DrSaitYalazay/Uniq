/**
 * Manual Risk model — user-added risks that complement the auto-generated
 * gap-driven risks in Phase 04. Stored via useToolData (persisted per tenant)
 * under MANUAL_RISKS_KEY as `{ risks, overrides }`.
 *
 * Manual risks can come from three sources:
 *  - "catalog": the user picked a typical risk from the static ISO 27002 / BSI
 *    IT-Grundschutz catalog (allRisksIndex). The catalog risk metadata is preserved.
 *  - "catalog" (DB): the user picked a risk text from the `risks` table
 *    (Bedrohung → Folge → Rechtsfolge). source_catalog_id = risks.risk_id.
 *  - "custom": the user authored the risk free-form.
 */

import type { CatalogRisk } from "@/data/controlCatalog";
import type { IndexedRisk } from "@/data/allRisksIndex";
import { scoreAndLevel, type RiskObject, type RiskMatrixConfig } from "@/lib/riskEngine";

export const MANUAL_RISKS_KEY = "manual-risks";

export interface ManualRisk {
  id: string;
  source: "catalog" | "custom";
  /** Original catalog risk id (e.g. "a-01-r1" or DB "R-0123"), only when source === "catalog". */
  source_catalog_id?: string;
  /** Originating control id (e.g. "a-01"), only when source === "catalog". */
  source_control_id?: string;
  /** "static" = allRisksIndex, "db" = Tabelle `risks`. Fehlt = static. */
  source_kind?: "static" | "db";
  title_de: string;
  title_en: string;
  description_de: string;
  description_en: string;
  likelihood: number;
  impact: number;
  scope: "asset" | "organization";
  asset_id?: string | null;
  asset_name?: string | null;
  capability_tag?: string;
  threat_category?: string;
  cia?: ("C" | "I" | "A")[];
  zok_labels_de?: string[];
  zok_labels_en?: string[];
  created_at: string;
  updated_at?: string;
}

/**
 * User-applied overrides on auto-generated risks. Keyed by risk_id; if an
 * entry exists, the auto-generated likelihood/impact are replaced and the
 * score + level are recomputed using the active matrix configuration.
 * `reason` ist Pflicht in der UI (P4.M.3); ältere Blobs ohne reason bleiben gültig.
 */
export interface RiskOverride {
  likelihood: number;
  impact: number;
  reason?: string;
  set_by?: string;
  set_at?: string;
}
export type RiskOverrides = Record<string, RiskOverride>;

export interface ManualRiskState {
  risks: ManualRisk[];
  overrides: RiskOverrides;
}

export const DEFAULT_MANUAL_RISK_STATE: ManualRiskState = { risks: [], overrides: {} };

/** Robust gegen ältere/unvollständige Blobs (fehlende Felder = leer). */
export function normalizeManualRiskState(s: Partial<ManualRiskState> | null | undefined): ManualRiskState {
  return {
    risks: Array.isArray(s?.risks) ? s!.risks.filter(r => r && typeof r.id === "string") : [],
    overrides: s?.overrides && typeof s.overrides === "object" ? s.overrides : {},
  };
}

function newId(): string {
  return `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function manualRiskFromCatalog(ir: IndexedRisk, _lang: "de" | "en", maxL: number, maxI: number): ManualRisk {
  const r = ir.risk;
  return {
    id: newId(),
    source: "catalog",
    source_kind: "static",
    source_catalog_id: r.id,
    source_control_id: ir.control_id,
    title_de: r.title_de,
    title_en: r.title_en,
    description_de: r.description_de,
    description_en: r.description_en,
    likelihood: Math.min(maxL, r.typical_likelihood),
    impact: Math.min(maxI, r.typical_impact),
    scope: "organization",
    asset_id: null,
    asset_name: null,
    capability_tag: ir.capability_tag,
    threat_category: r.threat_category,
    cia: r.cia,
    zok_labels_de: ir.zok_labels_de,
    zok_labels_en: ir.zok_labels_en,
    created_at: new Date().toISOString(),
  };
}

/** Zeile der Tabelle `risks` (Risikotext-Katalog, Bedrohung → Folge → Rechtsfolge). */
export interface DbRiskRow {
  risk_id: string;
  text_de: string;
  text_en: string | null;
  stufe: string | null;
  typ?: string | null;
  quelle?: string | null;
  primary_control_framework?: string | null;
  primary_control_id?: string | null;
}

/** Kurztitel aus dem Katalogtext: erster Satzteil (bis „→", „:", „." oder 90 Zeichen). */
export function dbRiskTitle(text: string, max = 90): string {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const cut = t.split(/\s*(?:→|:|\.\s)/)[0] ?? t;
  const base = cut.length >= 12 ? cut : t;
  return base.length > max ? base.slice(0, max - 1).trimEnd() + "…" : base;
}

export function manualRiskFromDbRisk(row: DbRiskRow, maxL: number, maxI: number): ManualRisk {
  const stufe = (row.stufe ?? "").toLowerCase();
  const base = stufe === "hoch" || stufe === "high" ? 4 : stufe === "niedrig" || stufe === "low" ? 2 : 3;
  const de = row.text_de ?? "";
  const en = row.text_en ?? row.text_de ?? "";
  return {
    id: newId(),
    source: "catalog",
    source_kind: "db",
    source_catalog_id: row.risk_id,
    source_control_id: row.primary_control_id ?? undefined,
    title_de: dbRiskTitle(de),
    title_en: dbRiskTitle(en),
    description_de: de,
    description_en: en,
    likelihood: Math.max(1, Math.min(maxL, base)),
    impact: Math.max(1, Math.min(maxI, base)),
    scope: "organization",
    asset_id: null,
    asset_name: null,
    capability_tag: "manual",
    threat_category: row.typ ?? "",
    cia: [],
    zok_labels_de: [],
    zok_labels_en: [],
    created_at: new Date().toISOString(),
  };
}

export function ensureCustomId(r: ManualRisk): ManualRisk {
  if (r.id) return r;
  return { ...r, id: newId() };
}

/**
 * Adapt a ManualRisk into the same RiskObject shape used by the rest of the
 * Risk Engine UI so the same RiskCard can render it. Score/Stufe kommen aus
 * derselben Matrix-Konfiguration wie die Engine-Risiken (scoreAndLevel).
 */
export function manualRiskToRiskObject(m: ManualRisk, cfg: RiskMatrixConfig): RiskObject & { risk_source: "manual" } {
  const { likelihood, impact, score, level } = scoreAndLevel(m.likelihood, m.impact, cfg);
  const reasonDe = m.source === "catalog"
    ? `Manuell aus Katalog (${m.source_catalog_id})`
    : "Manuell erfasst";
  const catalogRisk: CatalogRisk | undefined = m.source === "catalog" && m.source_kind !== "db" ? {
    id: m.source_catalog_id ?? m.id,
    title_de: m.title_de, title_en: m.title_en,
    description_de: m.description_de, description_en: m.description_en,
    cia: m.cia ?? [],
    typical_likelihood: m.likelihood,
    typical_impact: m.impact,
    threat_category: m.threat_category ?? "",
  } : undefined;
  // DB-Katalogtexte sind echte Szenarien (Bedrohung → Folge) → als Szenario
  // führen, damit „Was droht konkret" und der Bericht sie wie Engine-Risiken zeigen.
  const scenarios = m.source_kind === "db" && m.description_de
    ? [{
        control_id: m.source_control_id ?? m.source_catalog_id ?? m.id,
        control_title: m.title_de,
        control_title_en: m.title_en || m.title_de,
        finding_type: "missing" as const,
        text_de: m.description_de,
        text_en: m.description_en || m.description_de,
      }]
    : [];
  // Kontroll-Referenz (Katalog-Ursprungskontrolle bzw. DB-Primärkontrolle) →
  // treatmentEngine.suggestControlsForRisk nutzt sie für den Kontrollvorschlag.
  const supporting = m.source === "catalog" && m.source_control_id
    ? [{
        control_id: m.source_control_id,
        control_title: m.title_de,
        control_title_en: m.title_en || m.title_de,
        control_description: "",
        control_description_en: "",
        finding_type: "missing" as const,
        risk_text: m.description_de,
        risk_text_en: m.description_en || m.description_de,
        measure_text: "",
        measure_text_en: "",
      }]
    : [];
  return {
    risk_id: m.id,
    related_gap_id: "",
    scope: m.scope,
    asset_id: m.asset_id ?? null,
    asset_name: m.asset_name ?? null,
    service_id: null,
    service_name: null,
    capability_tag: m.capability_tag ?? "manual",
    description: m.description_de || m.title_de,
    description_en: m.description_en || m.title_en || m.title_de,
    likelihood,
    likelihood_reasons: [reasonDe],
    impact,
    impact_reasons: [reasonDe],
    risk_score: score,
    risk_level: level,
    inherent_score: score,
    gap_severity: level === "critical" ? "critical" : level === "high" ? "high" : level === "medium" ? "medium" : "low",
    gap_title: m.title_de,
    gap_title_en: m.title_en || m.title_de,
    scenarios,
    finding_count: 0,
    missing_count: 0,
    weak_count: 0,
    supporting_findings: supporting,
    gap_why_it_matters: "",
    gap_why_it_matters_en: "",
    gap_recommendation: "",
    gap_recommendation_en: "",
    catalog_risks: catalogRisk ? [catalogRisk] : [],
    zok_source_paths_de: m.zok_labels_de ?? [],
    zok_source_paths_en: m.zok_labels_en ?? [],
    catalog_from_isms: m.scope === "organization",
    risk_source: "manual",
  };
}

/** Apply a single override to a RiskObject and recompute score + level. */
export function applyOverride(
  risk: RiskObject,
  override: RiskOverride | undefined,
  cfg: RiskMatrixConfig,
): RiskObject {
  if (!override) return risk;
  const { likelihood: l, impact: i, score, level } = scoreAndLevel(override.likelihood, override.impact, cfg);
  const tag = "Manuell angepasst";
  return {
    ...risk,
    likelihood: l,
    impact: i,
    risk_score: score,
    risk_level: level,
    inherent_score: score,
    likelihood_reasons: [tag, ...(risk.likelihood_reasons ?? [])],
    impact_reasons: [tag, ...(risk.impact_reasons ?? [])],
    risk_overridden: true,
    override_reason: override.reason ?? "",
    override_by: override.set_by,
    override_at: override.set_at,
  };
}

/**
 * Merge auto-generated risks (with overrides applied) and manual risks
 * into a single ordered list, ready for the matrix UI or treatment plan.
 * Engine-Risiken bleiben unverändert, solange kein Override existiert;
 * manuelle Risiken kommen rein additiv hinzu.
 */
export function mergeRisks(
  autoRisks: RiskObject[],
  manuals: ManualRisk[],
  overrides: RiskOverrides,
  cfg: RiskMatrixConfig,
): RiskObject[] {
  const auto = autoRisks.map(r => applyOverride(r, overrides[r.risk_id], cfg));
  const manual = manuals.map(m => manualRiskToRiskObject(m, cfg));
  return [...auto, ...manual].sort((a, b) => b.risk_score - a.risk_score);
}
