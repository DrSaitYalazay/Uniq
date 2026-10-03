/**
 * SoA Projection Engine — Single Source of Truth for Step 10
 *
 * This is the ONLY place where SoA data is merged, derived, and normalized.
 * All UI (stats, filters, table) MUST consume the output of buildSoAProjection().
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ FIELD OWNERSHIP TABLE                                          │
 * │                                                                │
 * │ Field              │ Source                   │ Precedence      │
 * │ ────────────────── │ ──────────────────────── │ ─────────────── │
 * │ id                 │ Master catalog / custom  │ Canonical       │
 * │ name (de/en)       │ Master catalog / custom  │ Canonical       │
 * │ description (de/en)│ Master catalog / custom  │ Canonical       │
 * │ category           │ Master catalog / custom  │ Canonical       │
 * │ source             │ Derived: system/manual   │ Derived         │
 * │ applicable         │ 1) savedSoA override     │ Saved > Assess  │
 * │                    │ 2) assessment status      │                 │
 * │ justification      │ savedSoA                 │ User input      │
 * │ impl_status        │ Assessment (q.status)    │ Assessment      │
 * │ due_date           │ Treatment (if control    │ Treatment       │
 * │                    │   is selected for a risk)│                 │
 * │ owner              │ Treatment                │ Treatment       │
 * │ linked_risks       │ Risk linkage engine      │ Computed        │
 * │ linked_to_high_risk│ Risk linkage engine      │ Computed        │
 * │ is_risky_exclusion │ Derived: !applicable &&  │ Computed        │
 * │                    │   linked_to_high_risk    │                 │
 * │ is_excluded        │ treatmentData.excluded   │ Treatment       │
 * │ exclusion_reason   │ treatmentData.excluded   │ Treatment       │
 * │ is_manual          │ treatmentData.manualIds  │ Treatment       │
 * │ is_custom          │ id.startsWith("custom-") │ Derived         │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * MERGE PRECEDENCE (highest → lowest):
 * 1. Saved SoA overrides (user explicitly set applicable/justification)
 * 2. Treatment mapping (owner, due_date, linked risks, excluded)
 * 3. Assessment data (implementation status from baseline)
 * 4. Master defaults (control catalog metadata)
 */

export type SoAStatus = "ja" | "teilweise" | "nein" | "entbehrlich" | null; // ersetzt ComplianceStatus

/**
 * Katalogangaben je Kontrolle (aus controls.meta), soweit vorhanden.
 * SoA-Prüfbericht 02.10.2026 (C-3, C-6, C-10, C-12): Geltungsbeginn,
 * Rechtsgrundlage, Kennzeichnung interne Praxis/Vorgabe, gesetzlicher
 * Auslöser, Rolle, nicht bewertete Übersichtszeilen.
 */
export interface SoACatalogMeta {
  appliesFrom?: string;          // YYYY-MM-DD — Pflicht gilt ab
  appliesFromNote?: string;
  legalRef?: string;
  policyFlag?: string;           // "interne_praxis" | "interne_vorgabe"
  statutoryTrigger?: string;
  internalTarget?: string;
  role?: string[];
  applicabilityCondition?: string;
  evidenceHint?: string;
  scored?: boolean;              // false = Übersicht, nicht bewertet
  rollupOf?: string[];           // Kinder einer Übersichtszeile
  family?: string;               // AIACT-Kontrollfamilie (A-01 … A-14, E, T)
}

export interface SoAQuestionLite {
  id: string;
  question: string;
  questionEn: string;
  description: string;
  descriptionEn: string;
  status: SoAStatus;
  catalog?: SoACatalogMeta;
}
export interface SoACategoryLite {
  id: string;
  article: string;
  title: string;
  titleEn: string;
  questions: SoAQuestionLite[];
}
import type { RiskLevel } from "@/lib/riskEngine";
import { parseControlSelectionId, type TreatmentObject } from "@/lib/treatmentEngine";
import type { ControlRiskLink, RiskLinkageMap } from "@/lib/soaRiskLinkage";

// ── Input types ──

/** Begründungsart für „nicht anwendbar" (SoA-Prüfbericht C-2). */
export type SoAReasonType = "rolle" | "system" | "rechtlich" | "zeitlich" | "sonstiges";
export const SOA_REASON_LABEL: Record<SoAReasonType, { de: string; en: string }> = {
  rolle: { de: "Rolle", en: "Role" },
  system: { de: "System", en: "System" },
  rechtlich: { de: "Rechtliche Ausnahme", en: "Legal exception" },
  zeitlich: { de: "Noch nicht anwendbar", en: "Not yet applicable" },
  sonstiges: { de: "Sonstiges", en: "Other" },
};

export interface SoAControlOverride {
  applicable: boolean;
  justification: string;
  reasonType?: SoAReasonType;
}

export interface SoASavedData {
  controls: Record<string, SoAControlOverride>;
  /**
   * ISO 27001: Anwendbarkeitsentscheidung auf NORM-Ebene, je Annex-A-Kontrolle
   * (Schlüssel `${namespace}:${ref}`, z. B. "ISO27001:A.8.10").
   *
   * Warum getrennt von `controls`: Annex A hat 93 Kontrollen, unser Katalog
   * öffnet sie in mehrere Prüfkontrollen auf — und eine Prüfkontrolle kann zu
   * MEHREREN Annex-A-Kontrollen gehören (z. B. DATA-DELETE → A.5.33 und
   * A.8.10). Schreibt man die Entscheidung nur in die Prüfkontrolle, kippt ein
   * „nicht anwendbar" bei A.8.10 auch die Überschrift A.5.33 um. Die
   * SoA-Entscheidung gehört deshalb zur Überschrift; die Anwendbarkeit einer
   * Prüfkontrolle wird daraus abgeleitet (anwendbar, sobald MINDESTENS EINE
   * ihrer Überschriften anwendbar ist). Umsetzungsstatus und Nachweise bleiben
   * dagegen genau ein Datensatz je Prüfkontrolle.
   */
  annex?: Record<string, SoAControlOverride>;
}

export interface TreatmentCustomControl {
  id: string;
  question: string;
  questionEn: string;
  description: string;
  descriptionEn: string;
  justification?: string;
  scope?: "asset" | "organization";
  linked_risk_id?: string;
  linked_gap_id?: string;
  owner?: string;
  control_source?: string;
  /** User-supplied default person-days; consumed by Roadmap (Step 15). */
  effort_days?: number;
}

export interface TreatmentExcludedControl {
  control_id: string;
  risk_id: string;
  reason: string;
}

/**
 * A control confirmed implemented via Gap/Baseline assessment (answer = "ja"),
 * mirrored into TreatmentState so SoA can read the "already implemented" fact
 * from a single source (Risk/Treatment) instead of the raw assessment answers.
 * Auto-synced on the Risk page — not user-editable.
 */
export interface ImplementedControlEntry {
  control_id: string;              // Hub (ISO 27001) control id, e.g. "iso-a-5-1"
  source: "baseline" | "assessment";
  verified_at: string;             // ISO timestamp of last sync
}

export interface TreatmentState {
  treatments: TreatmentObject[];
  manualControlIds: string[];
  customControls: TreatmentCustomControl[];
  excludedControls: TreatmentExcludedControl[];
  /** Controls the Gap engine marks as implemented (answer=ja). Auto-derived. */
  implementedControls?: ImplementedControlEntry[];
}


// ── Output types ──

export type SoASource = "system" | "manual_catalog" | "custom";

export interface SoAProjectedControl {
  // Identity
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  categoryId: string;
  categoryTitle: string;
  categoryTitleEn: string;
  article: string;

  // Classification
  source: SoASource;
  isManual: boolean;
  isCustom: boolean;

  // Applicability (merge precedence: savedSoA > assessment)
  applicable: boolean;
  applicableSource: "saved_override" | "assessment_default";
  justification: string;

  // Implementation
  implStatus: SoAStatus; // from assessment
  implStatusLabel: string;

  // Treatment-derived
  owner: string;
  dueDate: string;
  treatmentLinked: boolean; // is this control selected in ANY treatment?

  // Risk linkage
  linkedRisks: ControlRiskLink[];
  linkedToHighRisk: boolean;

  // Flags
  isRiskyExclusion: boolean;   // not applicable but linked to high/critical risk
  isExcluded: boolean;         // explicitly rejected in treatment
  exclusionReason: string;
  missingJustification: boolean; // not applicable and no justification

  // Katalog (SoA-Prüfbericht 02.10.2026)
  catalog?: SoACatalogMeta;
  reasonType?: SoAReasonType;
  /** Nicht bewertete Übersichtszeile (Status aus den Kindern abgeleitet, nicht gezählt). */
  isRollup: boolean;
  /** Anwendbar, aber die Pflicht gilt erst ab catalog.appliesFrom (und noch nicht umgesetzt). */
  notYetApplicable: boolean;
}

export interface SoAProjection {
  // All controls in final order
  systemControls: SoAProjectedControl[];
  manualControls: SoAProjectedControl[];
  excludedControls: SoAProjectedControl[];
  allControls: SoAProjectedControl[];

  // Pre-computed stats (derived from allControls — no separate counting)
  stats: SoAStats;

  // Categories with their projected controls (for collapsible UI)
  categories: SoAProjectedCategory[];

  // Debug info
  debug: SoADebugInfo;
}

export interface SoAProjectedCategory {
  id: string;
  article: string;
  title: string;
  titleEn: string;
  controls: SoAProjectedControl[];
  applicableCount: number;
  totalCount: number;
}

export interface SoAStats {
  total: number;
  applicable: number;
  notApplicable: number;
  implemented: number;
  partial: number;
  notImplemented: number;
  notAssessed: number;
  /** Anwendbar, Pflicht gilt erst später (Art. 113 o. Ä.) und noch nicht (teilweise) umgesetzt. */
  notYetApplicable: number;
  missingJustification: number;
  riskyExclusions: number;
  riskLinked: number;
  unlinked: number;
  manualCount: number;
  excludedCount: number;
  treatmentLinkedCount: number;
}

export interface SoADebugControlEntry {
  id: string;
  inCatalog: boolean;
  inTreatment: boolean;
  inManualControls: boolean;
  inSavedSoA: boolean;
  derivedApplicable: boolean;
  finalApplicable: boolean;
  applicableSource: string;
  linked_risk_ids: string[];
  justification: string;
}

export interface SoADebugInfo {
  controlEntries: SoADebugControlEntry[];
  pipelineCounts: {
    masterCatalog: number;
    treatmentRisks: number;
    treatmentSelectedControls: number;
    manualControlIds: number;
    customControls: number;
    excludedControls: number;
    savedSoAOverrides: number;
    riskLinkedControls: number;
  };
}

// ── Projection Input ──

export interface SoAProjectionInput {
  /** Master control catalog: categories with hydrated assessment data */
  categories: SoACategoryLite[];
  /** Risk linkage map (from soaRiskLinkage.ts) */
  linkageMap: RiskLinkageMap;
  /** Treatment state from Step 9 */
  treatmentData: TreatmentState;
  /** Saved SoA overrides (user's applicability decisions + justifications) */
  savedSoAData: SoASavedData;
}

// ── Build Projection ──

/**
 * EINE Statusklasse je Zeile — dieselbe Funktion speist Kacheln, Tabellenzeilen
 * und die Export-Prüfung (Befund C-1: Kachel und Zeilen zählten verschieden).
 */
export type SoAStatusClass = "na" | "ja" | "teilweise" | "nein" | "spaeter" | "offen";
export function soaStatusClass(c: Pick<SoAProjectedControl, "applicable" | "isExcluded" | "implStatus" | "notYetApplicable">): SoAStatusClass {
  if (!(c.applicable && !c.isExcluded)) return "na";
  if (c.notYetApplicable) return "spaeter";
  if (c.implStatus === "ja" || c.implStatus === "teilweise" || c.implStatus === "nein") return c.implStatus;
  return "offen";
}

export function buildSoAProjection(input: SoAProjectionInput): SoAProjection {
  const { categories, linkageMap, treatmentData, savedSoAData: rawSoA } = input;
  // Tolerate legacy demo-seed shape { justifications, soaExclusions, customJustifications }.
  // Migrate it on-read into the canonical { controls: { [id]: { applicable, justification } } }.
  const legacy = rawSoA as unknown as {
    justifications?: Record<string, string>;
    soaExclusions?: Record<string, boolean>;
    customJustifications?: Record<string, string>;
  } | undefined;
  const merged: Record<string, SoAControlOverride> = { ...(rawSoA?.controls ?? {}) };
  if (legacy?.justifications) {
    for (const [id, j] of Object.entries(legacy.justifications)) {
      const cur = merged[id];
      merged[id] = { applicable: cur?.applicable ?? true, justification: cur?.justification || j || "" };
    }
  }
  if (legacy?.soaExclusions) {
    for (const [id, excluded] of Object.entries(legacy.soaExclusions)) {
      if (!excluded) continue;
      const cur = merged[id];
      merged[id] = { applicable: false, justification: cur?.justification || "" };
    }
  }
  if (legacy?.customJustifications) {
    for (const [id, j] of Object.entries(legacy.customJustifications)) {
      const cur = merged[id];
      merged[id] = { applicable: cur?.applicable ?? true, justification: cur?.justification || j || "" };
    }
  }
  // `annex` (Entscheidungen auf Norm-Ebene) unverändert durchreichen — die
  // Legacy-Migration oben betrifft nur `controls`.
  const savedSoAData: SoASavedData = { controls: merged, annex: rawSoA?.annex };

  // Pre-compute lookups
  const treatmentControlSet = new Set<string>();
  const controlOwnerMap = new Map<string, string>();
  const controlDueDateMap = new Map<string, string>();
  for (const t of treatmentData.treatments) {
    for (const cid of t.selected_control_ids) {
      const parsed = parseControlSelectionId(cid);
      treatmentControlSet.add(cid);
      if (parsed.framework) treatmentControlSet.add(parsed.controlId);
      // First treatment owner/dueDate wins (controls can appear in multiple treatments)
      if (t.owner && !controlOwnerMap.has(cid)) controlOwnerMap.set(cid, t.owner);
      if (t.due_date && !controlDueDateMap.has(cid)) controlDueDateMap.set(cid, t.due_date);
      if (parsed.framework) {
        if (t.owner && !controlOwnerMap.has(parsed.controlId)) controlOwnerMap.set(parsed.controlId, t.owner);
        if (t.due_date && !controlDueDateMap.has(parsed.controlId)) controlDueDateMap.set(parsed.controlId, t.due_date);
      }
    }
  }

  const manualIdSet = new Set(treatmentData.manualControlIds ?? []);
  const customControlMap = new Map<string, TreatmentCustomControl>();
  for (const c of (treatmentData.customControls ?? [])) customControlMap.set(c.id, c);

  const excludedMap = new Map<string, TreatmentExcludedControl>();
  for (const e of (treatmentData.excludedControls ?? [])) excludedMap.set(e.control_id, e);
  const effectiveApplicable = (c: SoAProjectedControl) => c.applicable && !c.isExcluded;

  // q.status kommt bereits als EFFEKTIVER Status (useComplianceOverview mit
  // „spätere Phase gewinnt"-Overlay) herein; die alte implementedControls-Forcierung
  // war eine zweite, veraltete Quelle (Ratchet) und wird nicht mehr angewandt.

  // ── Step 1: Project system controls (from master catalog) ──
  const projectedCategories: SoAProjectedCategory[] = [];
  const systemControls: SoAProjectedControl[] = [];

  for (const cat of categories) {
    const catControls: SoAProjectedControl[] = [];

    for (const q of cat.questions) {
      const projected = projectControl(
        q, cat, "system",
        savedSoAData, linkageMap, treatmentControlSet,
        controlOwnerMap, controlDueDateMap, manualIdSet,
        excludedMap, customControlMap,
      );
      catControls.push(projected);
      systemControls.push(projected);
    }


    projectedCategories.push({
      id: cat.id,
      article: cat.article,
      title: cat.title,
      titleEn: cat.titleEn,
      controls: catControls,
      applicableCount: catControls.filter(c => effectiveApplicable(c)).length,
      totalCount: catControls.length,
    });
  }

  // ── Step 2: Project custom/manual controls that are not in the master catalog ──
  // We project EVERY entry in customControls AND every manualControlId, deduplicated.
  // Older bug: only manualControlIds were iterated, so user-added custom Maßnahmen
  // (and demo-seeded customControls) silently disappeared from SoA whenever the
  // manualControlIds array was empty or out of sync.
  const customManualControls: SoAProjectedControl[] = [];
  const projectedCustomIds = new Set<string>();
  const candidateIds: string[] = [
    ...(treatmentData.manualControlIds ?? []),
    ...((treatmentData.customControls ?? []).map(c => c.id)),
  ];
  for (const mid of candidateIds) {
    if (projectedCustomIds.has(mid)) continue;
    // Skip if already in system controls
    if (systemControls.some(c => c.id === mid)) continue;

    const customCtrl = customControlMap.get(mid) as (TreatmentCustomControl & { title?: string; titleEn?: string }) | undefined;
    // For non-custom manual catalog ids without a customControl entry, skip silently.
    if (!customCtrl && mid.startsWith("custom-")) continue;
    if (!customCtrl) continue;

    // Tolerate legacy/demo shape that uses title/titleEn instead of question/questionEn.
    const qText = customCtrl.question || customCtrl.title || customCtrl.id;
    const qTextEn = customCtrl.questionEn || customCtrl.titleEn || qText;
    const pseudoQuestion: SoAQuestionLite = {
      id: customCtrl.id,
      question: qText,
      questionEn: qTextEn,
      description: customCtrl.description ?? "",
      descriptionEn: customCtrl.descriptionEn ?? "",
      status: null,
    };
    const pseudoCat = {
      id: "user-defined", article: "—",
      title: "Benutzerdefiniert", titleEn: "User-Defined",
    } as SoACategoryLite;

    const source: SoASource = mid.startsWith("custom-") ? "custom" : "manual_catalog";
    const projected = projectControl(
      pseudoQuestion, pseudoCat, source,
      savedSoAData, linkageMap, treatmentControlSet,
      controlOwnerMap, controlDueDateMap, manualIdSet,
      excludedMap, customControlMap,
    );
    customManualControls.push(projected);
    projectedCustomIds.add(mid);
  }

  // ── Step 3: Project excluded controls ──
  const excludedControls: SoAProjectedControl[] = [];
  for (const ex of excludedMap.values()) {
    // Find in system or create stub
    const existing = systemControls.find(c => c.id === ex.control_id);
    if (existing) {
      // Already projected — just mark with exclusion data
      const excluded: SoAProjectedControl = {
        ...existing,
        isExcluded: true,
        exclusionReason: ex.reason,
      };
      excludedControls.push(excluded);
    }
  }

  // ── Step 4: Compute combined list ──
  const allControls = [...systemControls, ...customManualControls];
  const manualControls = customManualControls;

  // ── Step 5: Compute SoA stats from NIS2 catalog controls only ──
  // Custom/manual controls are shown separately and must not inflate the 236-control catalog total.
  // Übersichtszeilen (z. B. AI Act A-50.1 über T-09…T-43): Status aus den Kindern
  // ableiten und NICHT zählen — sonst doppelt gezählt (SoA-Prüfbericht B-15/C-10).
  const byId = new Map(systemControls.map(c => [c.id, c]));
  for (const c of systemControls) {
    if (!c.isRollup) continue;
    const kids = (c.catalog?.rollupOf ?? []).map(id => byId.get(id)).filter((k): k is SoAProjectedControl => !!k && effectiveApplicable(k));
    const st = kids.map(k => k.implStatus).filter(x => x === "ja" || x === "teilweise" || x === "nein");
    c.implStatus = st.length === 0 ? null : st.every(x => x === "ja") ? "ja" : st.every(x => x === "nein") ? "nein" : "teilweise";
    c.implStatusLabel = c.implStatus ?? "null";
    c.notYetApplicable = false;
  }
  const statsControls = systemControls.filter(c => !c.isRollup);
  const cls = (k: SoAStatusClass) => statsControls.filter(c => soaStatusClass(c) === k).length;
  const stats: SoAStats = {
    total: statsControls.length,
    applicable: statsControls.filter(c => effectiveApplicable(c)).length,
    notApplicable: statsControls.filter(c => !effectiveApplicable(c)).length,
    implemented: cls("ja"),
    partial: cls("teilweise"),
    notImplemented: cls("nein"),
    // Alles Anwendbare ohne Umsetzungsstatus — auch ein „entbehrlich" aus der Gap-Analyse,
    // das in der SoA bewusst als anwendbar geführt wird. Vorher zählte die Kachel nur
    // `null`, die Zeile druckte aber „Nicht bewertet" (Kachel 23 statt 24, Befund C-1).
    notAssessed: cls("offen"),
    notYetApplicable: cls("spaeter"),
    missingJustification: statsControls.filter(c => c.missingJustification).length,
    riskyExclusions: statsControls.filter(c => c.isRiskyExclusion).length
      + excludedControls.filter(c => c.linkedToHighRisk).length,
    riskLinked: statsControls.filter(c => c.linkedRisks.length > 0).length,
    unlinked: statsControls.filter(c => c.linkedRisks.length === 0).length,
    // Only count manual controls that are NOT in master catalog (truly new additions).
    // Manual flags on catalog controls don't grow Gesamt, so they shouldn't be counted here.
    manualCount: customManualControls.length,
    excludedCount: excludedControls.length,
    treatmentLinkedCount: allControls.filter(c => c.treatmentLinked).length,
  };

  // ── Step 6: Build debug info ──
  const debugEntries: SoADebugControlEntry[] = allControls.map(c => ({
    id: c.id,
    inCatalog: c.source === "system",
    inTreatment: c.treatmentLinked,
    inManualControls: c.isManual,
    inSavedSoA: savedSoAData?.controls?.[c.id] !== undefined,
    derivedApplicable: c.implStatus !== "entbehrlich",
    finalApplicable: c.applicable,
    applicableSource: c.applicableSource,
    linked_risk_ids: c.linkedRisks.map(r => r.risk_id),
    justification: c.justification,
  }));

  const debug: SoADebugInfo = {
    controlEntries: debugEntries,
    pipelineCounts: {
      masterCatalog: systemControls.length,
      treatmentRisks: treatmentData.treatments.length,
      treatmentSelectedControls: treatmentControlSet.size,
      manualControlIds: (treatmentData.manualControlIds ?? []).length,
      customControls: (treatmentData.customControls ?? []).length,
      excludedControls: (treatmentData.excludedControls ?? []).length,
      savedSoAOverrides: Object.keys(savedSoAData.controls).length,
      riskLinkedControls: linkageMap.byControl.size,
    },
  };

  return {
    systemControls,
    manualControls,
    excludedControls,
    allControls,
    stats,
    categories: projectedCategories,
    debug,
  };
}

// ── Per-control projection (pure function) ──

function projectControl(
  q: SoAQuestionLite,
  cat: SoACategoryLite,
  source: SoASource,
  savedSoAData: SoASavedData,
  linkageMap: RiskLinkageMap,
  treatmentControlSet: Set<string>,
  controlOwnerMap: Map<string, string>,
  controlDueDateMap: Map<string, string>,
  manualIdSet: Set<string>,
  excludedMap: Map<string, TreatmentExcludedControl>,
  customControlMap: Map<string, TreatmentCustomControl>,
): SoAProjectedControl {
  // Applicability: savedSoA override > assessment default
  const savedOverride = savedSoAData?.controls?.[q.id];
  let applicable: boolean;
  let applicableSource: "saved_override" | "assessment_default";

  if (savedOverride !== undefined) {
    applicable = savedOverride.applicable;
    applicableSource = "saved_override";
  } else {
    // Default: applicable unless assessment status is "entbehrlich"
    applicable = q.status !== "entbehrlich";
    applicableSource = "assessment_default";
  }

  // Custom control lookup (needed for justification + owner)
  const customCtrl = customControlMap.get(q.id);

  const justification = savedOverride?.justification || customCtrl?.justification || "";
  const catalog = q.catalog;
  const isRollup = catalog?.scored === false && Array.isArray(catalog?.rollupOf);
  // Geltungsbeginn: anwendbar, aber Pflicht gilt erst später und ist noch nicht
  // (teilweise) umgesetzt → eigener Status statt „Nicht umgesetzt" (Befund C-6).
  const today = new Date().toISOString().slice(0, 10);
  const statusDone = q.status === "ja" || q.status === "teilweise";
  const notYetApplicable = !!catalog?.appliesFrom && catalog.appliesFrom > today && !statusDone;

  // Risk linkage
  const linkEntry = linkageMap.byControl.get(q.id);
  const linkedRisks = linkEntry?.linked_risks ?? [];
  const linkedToHighRisk = linkEntry?.linked_to_high_risk ?? false;

  // Treatment-derived fields
  const treatmentLinked = treatmentControlSet.has(q.id);
  const owner = controlOwnerMap.get(q.id) ?? "";
  const dueDate = controlDueDateMap.get(q.id) ?? "";

  // Custom control owner override
  const finalOwner = owner || customCtrl?.owner || "";

  // Exclusion
  const exclusion = excludedMap.get(q.id);
  const isExcluded = !!exclusion;
  const exclusionReason = exclusion?.reason ?? "";

  // Flags
  const isManual = manualIdSet.has(q.id);
  const isCustom = q.id.startsWith("custom-");
  const isRiskyExclusion = !applicable && linkedToHighRisk;
  const missingJustification = !applicable && !justification;

  return {
    id: q.id,
    name: q.question,
    nameEn: q.questionEn,
    description: q.description,
    descriptionEn: q.descriptionEn,
    categoryId: cat.id,
    categoryTitle: cat.title,
    categoryTitleEn: cat.titleEn,
    article: cat.article,
    source,
    isManual,
    isCustom,
    applicable,
    applicableSource,
    justification,
    implStatus: q.status,
    implStatusLabel: q.status ?? "null",
    owner: finalOwner,
    dueDate,
    treatmentLinked,
    linkedRisks,
    linkedToHighRisk,
    isRiskyExclusion,
    isExcluded,
    exclusionReason,
    missingJustification,
    catalog,
    reasonType: savedOverride?.reasonType,
    isRollup,
    notYetApplicable: notYetApplicable && applicable,
  };
}

// ── Debug logger ──

export function logSoADebug(projection: SoAProjection) {
  const { stats, debug } = projection;

  console.group("🔍 SoA Projection Debug");

  console.log("📊 Pipeline Counts:", debug.pipelineCounts);

  console.log("📋 Stats (from single projection):", {
    total: stats.total,
    applicable: stats.applicable,
    notApplicable: stats.notApplicable,
    implemented: stats.implemented,
    partial: stats.partial,
    notImplemented: stats.notImplemented,
    notAssessed: stats.notAssessed,
    missingJustification: stats.missingJustification,
    riskyExclusions: stats.riskyExclusions,
    riskLinked: stats.riskLinked,
    unlinked: stats.unlinked,
    manualCount: stats.manualCount,
    excludedCount: stats.excludedCount,
    treatmentLinkedCount: stats.treatmentLinkedCount,
  });

  // Show controls with saved overrides
  const overridden = debug.controlEntries.filter(e => e.inSavedSoA);
  if (overridden.length > 0) {
    console.log("🔧 Controls with saved SoA overrides:", overridden);
  }

  // Show risky exclusions
  const risky = debug.controlEntries.filter(e => !e.finalApplicable && e.linked_risk_ids.length > 0);
  if (risky.length > 0) {
    console.log("⚠️ Not-applicable controls WITH risk links:", risky);
  }

  // Show treatment-linked controls
  const treated = debug.controlEntries.filter(e => e.inTreatment);
  if (treated.length > 0) {
    console.log("🔗 Treatment-linked controls:", treated.map(e => ({
      id: e.id, risks: e.linked_risk_ids, applicable: e.finalApplicable
    })));
  }

  // Consistency check: applicable + notApplicable should equal total
  const checkSum = stats.applicable + stats.notApplicable;
  if (checkSum !== stats.total) {
    console.error(`❌ INCONSISTENCY: applicable(${stats.applicable}) + notApplicable(${stats.notApplicable}) = ${checkSum} ≠ total(${stats.total})`);
  } else {
    console.log("✅ Consistency check passed: applicable + notApplicable = total");
  }

  console.groupEnd();
}

// ── Stats Consistency Validator ──
// Returns the list of arithmetic invariants that must hold for SoA stats.
// Use to show a UI banner / debug info when projection logic drifts.

export interface SoAStatsCheck {
  label: { de: string; en: string };
  expected: number;
  actual: number;
  ok: boolean;
  detail: string;
}

export interface SoAStatsValidation {
  ok: boolean;
  checks: SoAStatsCheck[];
}

export function validateSoAStats(projection: SoAProjection): SoAStatsValidation {
  const { stats, manualControls, excludedControls } = projection;
  // Übersichtszeilen zählen nirgends mit (siehe buildSoAProjection).
  const systemControls = projection.systemControls.filter(c => !c.isRollup);
  const effectiveApplicable = (c: SoAProjectedControl) => c.applicable && !c.isExcluded;
  const applicable = systemControls.filter(c => effectiveApplicable(c)).length;
  const notApplicable = systemControls.filter(c => !effectiveApplicable(c)).length;
  // Jede anwendbare Zeile fällt in genau eine Statusklasse. Unabhängig nachgezählt
  // (Zeile für Zeile) und gegen die Kacheln geprüft.
  const rowCount = (k: SoAStatusClass) => systemControls.filter(c => soaStatusClass(c) === k).length;
  const rowsByClass = { ja: rowCount("ja"), teilweise: rowCount("teilweise"), nein: rowCount("nein"), offen: rowCount("offen"), spaeter: rowCount("spaeter") };
  const statusTotal = rowsByClass.ja + rowsByClass.teilweise + rowsByClass.nein + rowsByClass.offen + rowsByClass.spaeter;
  const tilesMatchRows = rowsByClass.ja === stats.implemented && rowsByClass.teilweise === stats.partial && rowsByClass.nein === stats.notImplemented
    && rowsByClass.offen === stats.notAssessed && rowsByClass.spaeter === stats.notYetApplicable;

  const checks: SoAStatsCheck[] = [
    {
      label: { de: "Gesamt = NIS2-Katalogkontrollen", en: "Total = NIS2 catalog controls" },
      expected: systemControls.length,
      actual: stats.total,
      ok: stats.total === systemControls.length,
      detail: `Gesamt ${stats.total} / Katalog ${systemControls.length}; manuell separat ${manualControls.length}`,
    },
    {
      label: { de: "Anwendbar + Nicht anwendbar = Gesamt", en: "Applicable + Not Applicable = Total" },
      expected: stats.total,
      actual: applicable + notApplicable,
      ok: stats.applicable === applicable && stats.notApplicable === notApplicable && applicable + notApplicable === stats.total,
      detail: `${applicable} + ${notApplicable} = ${applicable + notApplicable} (Total ${stats.total})`,
    },
    {
      label: { de: "Implementierungs-Status-Summe = Anwendbar", en: "Implementation status sum = Applicable" },
      expected: stats.applicable,
      actual: statusTotal,
      ok: statusTotal === stats.applicable && statusTotal === applicable && tilesMatchRows,
      detail: `${stats.implemented}+${stats.partial}+${stats.notImplemented}+${stats.notAssessed}+${stats.notYetApplicable} = ${statusTotal} (Anwendbar ${stats.applicable}, gezählt ${applicable})`,
    },
    {
      label: { de: "Ausgeschlossen ≤ Nicht anwendbar", en: "Excluded ≤ Not Applicable" },
      expected: stats.notApplicable,
      actual: excludedControls.length,
      ok: stats.excludedCount === excludedControls.length && excludedControls.length <= stats.notApplicable,
      detail: `Ausgeschlossen ${excludedControls.length} / Nicht anwendbar ${stats.notApplicable}`,
    },
    {
      label: { de: "Manuell = separate Zusatzkontrollen", en: "Manual = separate additional controls" },
      expected: manualControls.length,
      actual: stats.manualCount,
      ok: stats.manualCount === manualControls.length,
      detail: `Manuell ${stats.manualCount}; nicht im Gesamt von ${stats.total} enthalten`,
    },
    {
      label: { de: "Risiko-verknüpft + Unverknüpft = Gesamt", en: "Risk-linked + Unlinked = Total" },
      expected: stats.total,
      actual: stats.riskLinked + stats.unlinked,
      ok: stats.riskLinked + stats.unlinked === stats.total,
      detail: `${stats.riskLinked} + ${stats.unlinked} = ${stats.riskLinked + stats.unlinked} (Total ${stats.total})`,
    },
  ];
  return { ok: checks.every(c => c.ok), checks };
}
