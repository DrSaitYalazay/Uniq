/**
 * Risk — Phase 4 Risk Analysis + Risk Treatment (two-tab page).
 *
 * Tabs:
 *   • Analysis: configurable 5×5 matrix (formula/palette/thresholds),
 *     KPI strip, heatmap, filters, Top-10 risk cards.
 *   • Treatment: grouped risks, per-row treatment editor persisted via
 *     useToolData under key "risk-treatment".
 *
 * Both tabs share the same auto-derived RiskAnalysisResult from
 * useRiskAnalysis so a change to the matrix config immediately re-classifies
 * risks on both views.
 */
import { useMemo, useState, useCallback, useEffect } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip } from "recharts";
import { Link } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, FileDown, FileText, FileSpreadsheet, ShieldAlert, RotateCcw, ArrowUpRight, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFramework } from "@/contexts/FrameworkContext";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { useToolData } from "@/hooks/useToolData";
import {
  DEFAULT_PERSONNEL, PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY,
  formatPerson, type PersonnelRegistry, type Person,
} from "@/lib/personnel";
import { RiskHeatmap } from "@/components/risk/RiskHeatmap";
import { MatrixConfigPanel } from "@/components/risk/MatrixConfigPanel";
import { TreatmentTable } from "@/components/risk/TreatmentTable";
import { QuantRiskPanel } from "@/components/risk/QuantRiskPanel";
import { ManualRiskPanel } from "@/components/risk/ManualRiskPanel";
import { LIOverrideEditor } from "@/components/risk/LIOverrideEditor";
import { RiskPicker } from "@/components/RiskPicker";
import type { IndexedRisk } from "@/data/allRisksIndex";
import {
  MANUAL_RISKS_KEY, DEFAULT_MANUAL_RISK_STATE, normalizeManualRiskState,
  manualRiskFromCatalog, manualRiskFromDbRisk, ensureCustomId, mergeRisks,
  type ManualRisk, type ManualRiskState, type RiskOverride, type DbRiskRow,
} from "@/lib/manualRisks";
import { ModeToggle } from "@/components/ModeToggle";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import { InfoHint } from "@/components/dashboard/InfoHint";
import {
  APPETITE_KEY, DEFAULT_APPETITE, LEVEL_RANK, appScore, appLevel,
  isOverAppetite as computeOverAppetite, type AppetiteState,
} from "@/lib/riskAppetite";
import { buildTopRiskInsight } from "@/lib/riskReportNarrative";
import {
  riskLevelLabel, DEFAULT_RISK_CONFIG, themeMatrixPalette, scoreAndLevel, explainLikelihoodImpact,
  type RiskLevel, type RiskObject, type RiskMatrixConfig, type ColorPalette, type RiskSummary,
} from "@/lib/riskEngine";
import {
  generateTreatmentPlan, effectiveResidualLI, type TreatmentObject,
} from "@/lib/treatmentEngine";
import { exportRiskReportPdf } from "@/lib/riskReport";
import { exportRiskReportDocx } from "@/lib/riskReportDocx";
import { exportRiskReportXlsx } from "@/lib/riskReportXlsx";

import type { ImplementedControlEntry } from "@/lib/soaProjection";

import { CHART_STATUS, CHART_SEVERITY, CHART_EMPTY, subscribeChartPaletteMode } from "@/lib/chartPalette";
import { insideSliceLabel } from "@/lib/chartLabels";
// FEHLTEN — die Risikoanalyse rief beide Abonnements auf, ohne sie zu
// importieren; nach dem Beheben von resolveChartHex wäre hier der nächste
// „is not defined"-Absturz gekommen (12.09.2026).
import { subscribeAccent } from "@/lib/accentTheme";
import { ScenarioList } from "@/components/risk/ScenarioList";
const TREATMENT_KEY = "risk-treatment";

interface TreatmentState {
  treatments: TreatmentObject[];
  implementedControls?: ImplementedControlEntry[];
}

const DEFAULT_TREATMENT_STATE: TreatmentState = { treatments: [], implementedControls: [] };


const LEVEL_TONE: Record<RiskLevel, string> = {
  critical: "bg-destructive/85 text-destructive-foreground",
  high:     "bg-destructive/50 text-destructive-foreground",
  medium:   "st-teilweise-bg text-white",
  low:      "st-ja-bg text-white",
};


const Risk = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { mode } = useAssessmentMode();
  // Tab-Steuerung + Deep-Link „Top-Risiken → Risikobehandlung"
  const [tab, setTab] = useState<string>("analysis");
  const [focusRiskId, setFocusRiskId] = useState<string | null>(null);

  // ── Matrix config (client-only state; not persisted server-side) ──
  const [config, setConfig] = useState<RiskMatrixConfig>(DEFAULT_RISK_CONFIG);
  // Standard = THEMENFARBE, live aus der Palette (nicht der eingefrorene
  // kein Modul-Snapshot): so folgt die Matrix dem Akzent/Modus.
  const [palette, setPalette] = useState<ColorPalette>(() => themeMatrixPalette());
  useEffect(() => {
    const resync = () => setPalette(p => (p.id === "theme" ? themeMatrixPalette() : p));
    const offA = subscribeAccent(resync);
    const offM = subscribeChartPaletteMode(resync);
    return () => { offA?.(); offM?.(); };
  }, []);
  // Manual per-cell color overrides, keyed by `${likelihood}-${impact}`.
  const [cellOverrides, setCellOverrides] = useState<Record<string, RiskLevel>>({});

  const cycleCellLevel = useCallback((likelihood: number, impact: number) => {
    const key = `${likelihood}-${impact}`;
    // Only cycle through the 4 palette-defined risk levels — no unrelated
    // baseline/empty tone. Use "Zurücksetzen" to clear overrides.
    const order: RiskLevel[] = ["low", "medium", "high", "critical"];
    setCellOverrides(prev => {
      const cur = prev[key];
      const idx = cur ? order.indexOf(cur) : -1;
      const next = order[(idx + 1) % order.length];
      return { ...prev, [key]: next };
    });
  }, []);

  const { active: activeFrameworks } = useFramework();

  // ── Risikoappetit (org-weit persistiert) ──
  const { data: appetite, setData: setAppetite } =
    useToolData<AppetiteState>(APPETITE_KEY, APPETITE_KEY, DEFAULT_APPETITE);

  const isOverAppetite = useCallback(
    (l: number, i: number, level: RiskLevel) => computeOverAppetite(appetite, l, i, level),
    [appetite],
  );

  const toggleAppetiteCell = useCallback((l: number, i: number) => {
    const key = `${l}-${i}`;
    setAppetite(prev => {
      const has = prev.overCells.includes(key);
      return { ...prev, overCells: has ? prev.overCells.filter(k => k !== key) : [...prev.overCells, key] };
    });
  }, [setAppetite]);

  const setAppetiteMode = useCallback((m: "class" | "line") => {
    setAppetite(prev => {
      // Beim Wechsel in den Linien-Modus die Grenze aus der Klassen-Wahl vorbelegen,
      // damit der Nutzer nicht bei null startet.
      if (m === "line" && prev.overCells.length === 0) {
        const dims = config.dimensions ?? { rows: 5, cols: 5 };
        const seeded: string[] = [];
        for (let l = 1; l <= dims.cols; l++) {
          for (let i = 1; i <= dims.rows; i++) {
            const ov = cellOverrides[`${l}-${i}`];
            const lvl = ov ?? appLevel(appScore(l, i, config.formula), config.thresholds);
            if (LEVEL_RANK[lvl] > LEVEL_RANK[prev.classLevel]) seeded.push(`${l}-${i}`);
          }
        }
        return { ...prev, mode: m, overCells: seeded };
      }
      return { ...prev, mode: m };
    });
  }, [setAppetite, config, cellOverrides]);

  const resetMatrix = useCallback(() => {
    setConfig(DEFAULT_RISK_CONFIG);
    setPalette(themeMatrixPalette());
    setCellOverrides({});
  }, []);

  // ── Data ──
  const { loading, error, result: rawResult, gaps, findings, answered, totalIsoControls, treatmentControls, controlIsoMappings, enabledFrameworks, implementedAnswers, assetInfos } =
    useRiskAnalysis(config);

  const { data: treatmentState, setData: setTreatmentState } =
    useToolData<TreatmentState>(TREATMENT_KEY, TREATMENT_KEY, DEFAULT_TREATMENT_STATE);

  // ── US4.6 / P4.M.3 · Manuelle Risiken + L/I-Overrides (Blob "manual-risks") ──
  const { data: manualRaw, setData: setManualState } =
    useToolData<ManualRiskState>(MANUAL_RISKS_KEY, MANUAL_RISKS_KEY, DEFAULT_MANUAL_RISK_STATE);
  const manual = useMemo(() => normalizeManualRiskState(manualRaw), [manualRaw]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<ManualRisk | null>(null);

  const upsertManualRisk = useCallback((r: ManualRisk) => {
    const withId = ensureCustomId(r);
    setManualState(prev => {
      const p = normalizeManualRiskState(prev);
      const exists = p.risks.some(x => x.id === withId.id);
      const now = new Date().toISOString();
      return {
        ...p,
        risks: exists
          ? p.risks.map(x => (x.id === withId.id ? { ...withId, updated_at: now } : x))
          : [...p.risks, withId],
      };
    });
  }, [setManualState]);

  const deleteManualRisk = useCallback((id: string) => {
    setManualState(prev => {
      const p = normalizeManualRiskState(prev);
      return { ...p, risks: p.risks.filter(x => x.id !== id) };
    });
    // Zugehörige Behandlung entfernen, damit kein verwaister Eintrag im Blob bleibt.
    setTreatmentState(prev => ({ ...prev, treatments: (prev.treatments ?? []).filter(t => t.risk_id !== id) }));
  }, [setManualState, setTreatmentState]);

  const setOverride = useCallback((riskId: string, o: RiskOverride | null) => {
    setManualState(prev => {
      const p = normalizeManualRiskState(prev);
      const overrides = { ...p.overrides };
      if (o) overrides[riskId] = o; else delete overrides[riskId];
      return { ...p, overrides };
    });
  }, [setManualState]);

  /**
   * Cell overrides are authoritative: when the user re-colors a matrix cell
   * we reclassify every risk that lands in that (likelihood, impact) bucket
   * to the chosen level, and recompute risk_score to sit inside that level's
   * threshold band. This propagates to summary counts, filters, treatment
   * plan, KPIs, exports — not just the heatmap tint.
   *
   * Reihenfolge: Engine → L/I-Overrides + manuelle Risiken (mergeRisks) →
   * Zellfarben → Summary. Ohne manuelle Daten und ohne Zellfarben wird das
   * Engine-Ergebnis UNVERÄNDERT durchgereicht (Zahlen bleiben identisch).
   */
  const result = useMemo(() => {
    if (!rawResult) return rawResult;
    const hasManual = manual.risks.length > 0 || Object.keys(manual.overrides).length > 0;
    const hasCells = Object.keys(cellOverrides).length > 0;
    if (!hasManual && !hasCells) return rawResult;
    let risks: RiskObject[] = hasManual
      ? mergeRisks(rawResult.risks, manual.risks, manual.overrides, rawResult.config)
      : rawResult.risks;
    if (hasCells) {
      const t = rawResult.config.thresholds;
      const scoreForLevel: Record<RiskLevel, number> = {
        low: Math.max(1, t.low_max),
        medium: t.medium_max,
        high: t.high_max,
        critical: t.high_max + 1,
      };
      risks = risks.map(r => {
        const ov = cellOverrides[`${r.likelihood}-${r.impact}`];
        if (!ov || ov === r.risk_level) return r;
        return { ...r, risk_level: ov, risk_score: scoreForLevel[ov] };
      });
    }
    const bySeverity: Record<RiskLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    let sum = 0, max = 0, org = 0, asset = 0;
    for (const r of risks) {
      bySeverity[r.risk_level]++;
      sum += r.risk_score;
      if (r.risk_score > max) max = r.risk_score;
      if (r.scope === "organization") org++; else asset++;
    }
    const summary: RiskSummary = {
      ...rawResult.summary,
      totalRisks: risks.length,
      bySeverity,
      byScope: { organization: org, asset },
      averageScore: risks.length ? Math.round((sum / risks.length) * 10) / 10 : 0,
      maxScore: max,
    };
    return { ...rawResult, risks, summary };
  }, [rawResult, cellOverrides, manual]);

  /** Engine-Originalwerte je Risiko (für „Engine: L a × I b" im Override-Popover). */
  const engineLI = useMemo(() => {
    const m = new Map<string, { l: number; i: number }>();
    for (const r of rawResult?.risks ?? []) m.set(r.risk_id, { l: r.likelihood, i: r.impact });
    return m;
  }, [rawResult]);

  const { data: personnel, setData: setPersonnel } = useToolData<PersonnelRegistry>(
    PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL,
  );
  const addPerson = useCallback((p: Person) => {
    setPersonnel(prev => ({ ...prev, people: [...(prev.people ?? []), p] }));
  }, [setPersonnel]);

  // ── Filters (Analysis tab) ──
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "all">("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "organization" | "asset">("all");

  // ── Report picker (Analysis tab) ──
  const [preparedBy, setPreparedBy] = useState("");
  const [classification, setClassification] = useState("");

  const filtered: RiskObject[] = useMemo(() => {
    if (!result) return [];
    return result.risks.filter(r =>
      (levelFilter === "all" || r.risk_level === levelFilter) &&
      (scopeFilter === "all" || r.scope === scopeFilter),
    );
  }, [result, levelFilter, scopeFilter]);

  // ── Treatment plan: merges auto-suggestions with saved user edits ──
  const treatmentPlan = useMemo(() => {
    if (!result) return null;
    return generateTreatmentPlan({
      risks: result.risks,
      gaps,
      findings,
      existingTreatments: treatmentState.treatments,
      frameworkControls: treatmentControls,
      controlIsoMappings,
      enabledFrameworks,
    });
  }, [result, gaps, findings, treatmentState.treatments, treatmentControls, controlIsoMappings, enabledFrameworks]);

  const handleTreatmentChange = useCallback((updated: TreatmentObject) => {
    setTreatmentState(prev => {
      const rest = (prev.treatments ?? []).filter(t => t.risk_id !== updated.risk_id);
      return { ...prev, treatments: [...rest, updated] };
    });
  }, [setTreatmentState]);

  const handleFillAllDefaults = useCallback(() => {
    if (!treatmentPlan) return;
    // Replace any missing treatments with the auto-generated defaults.
    setTreatmentState(prev => ({ ...prev, treatments: treatmentPlan.treatments }));
  }, [treatmentPlan, setTreatmentState]);

  // Sync Gap "implemented" answers into TreatmentState so SoA reads the
  // "already implemented" fact from Treatment as single source of truth.
  // Runs whenever the raw Gap/Baseline answers change.
  useEffect(() => {
    if (loading || !implementedAnswers) return;
    const nextIds = implementedAnswers.map(a => a.control_id).sort();
    const prevIds = (treatmentState.implementedControls ?? [])
      .map(e => e.control_id).sort();
    const sameLen = nextIds.length === prevIds.length;
    const identical = sameLen && nextIds.every((id, i) => id === prevIds[i]);
    if (identical) return;
    const now = new Date().toISOString();
    const entries: ImplementedControlEntry[] = implementedAnswers.map(a => ({
      control_id: a.control_id,
      source: a.source,
      verified_at: now,
    }));
    setTreatmentState(prev => ({ ...prev, implementedControls: entries }));
  }, [loading, implementedAnswers, treatmentState.implementedControls, setTreatmentState]);


  const s = result?.summary;

  // Über-Appetit-Bilanz: wie viele Risiken über der Toleranz liegen, davon
  // wie viele bereits bewusst akzeptiert (Behandlung = „Akzeptieren").
  const appetiteSummary = useMemo(() => {
    if (!result) return null;
    const acceptedIds = new Set(
      (treatmentState.treatments ?? []).filter(t => t.strategy === "accept").map(t => t.risk_id),
    );
    let over = 0, overUnaccepted = 0;
    for (const r of result.risks) {
      if (isOverAppetite(r.likelihood, r.impact, r.risk_level)) {
        over++;
        if (!acceptedIds.has(r.risk_id)) overUnaccepted++;
      }
    }
    return { total: result.risks.length, over, overUnaccepted, accepted: over - overUnaccepted };
  }, [result, treatmentState.treatments, isOverAppetite]);

  // P4.B.2 · Restrisiko-Bilanz: Σ Rest-Scores (erfasst → Rest-L/I, sonst Ausgangswert),
  // Anzahl über Appetit nach Behandlung. Gleiche Matrix + Zellfarben wie die Analyse.
  const residualSummary = useMemo(() => {
    if (!result) return null;
    const tMap = new Map((treatmentState.treatments ?? []).map(t => [t.risk_id, t]));
    let inherentSum = 0, residualSum = 0, over = 0, captured = 0;
    for (const r of result.risks) {
      inherentSum += r.risk_score;
      const eff = effectiveResidualLI(r, tMap.get(r.risk_id));
      const s = scoreAndLevel(eff.likelihood, eff.impact, result.config);
      const level = cellOverrides[`${s.likelihood}-${s.impact}`] ?? s.level;
      residualSum += s.score;
      if (eff.captured) captured++;
      if (isOverAppetite(s.likelihood, s.impact, level)) over++;
    }
    return { total: result.risks.length, inherentSum, residualSum, over, captured };
  }, [result, treatmentState.treatments, cellOverrides, isOverAppetite]);

  const dims = config.dimensions ?? { rows: 5, cols: 5 };
  const addedCatalogIds = useMemo(
    () => new Set(manual.risks.map(m => m.source_catalog_id).filter((x): x is string => !!x)),
    [manual.risks],
  );
  const pickerAssets = useMemo(
    () => assetInfos.map(a => ({ id: a.id, asset_name: a.asset_name })),
    [assetInfos],
  );
  const openPickerNew = useCallback(() => { setEditingManual(null); setPickerOpen(true); }, []);
  const openPickerEdit = useCallback((m: ManualRisk) => { setEditingManual(m); setPickerOpen(true); }, []);
  const handleAddCatalog = useCallback((ir: IndexedRisk) => {
    upsertManualRisk(manualRiskFromCatalog(ir, de ? "de" : "en", dims.cols, dims.rows));
  }, [upsertManualRisk, de, dims.cols, dims.rows]);
  const handleAddDb = useCallback((row: DbRiskRow) => {
    upsertManualRisk(manualRiskFromDbRisk(row, dims.cols, dims.rows));
  }, [upsertManualRisk, dims.cols, dims.rows]);
  const handleSaveCustom = useCallback((r: ManualRisk) => {
    upsertManualRisk(r);
    setPickerOpen(false);
    setEditingManual(null);
  }, [upsertManualRisk]);

  // CWS-Kernregel: ohne Framework-Auswahl KEINE ISO-Default-Risiken zeigen.
  if (activeFrameworks.length === 0) {
    return (
      <div className="min-h-screen">
        <main className="max-w-3xl mx-auto p-4 md:p-6 py-16 text-center space-y-4">
          <div className="inline-flex p-3 rounded-xl bg-primary/10">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {de ? "Noch kein Framework ausgewählt" : "No framework selected yet"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {de
              ? "Wählen Sie zuerst in Schritt 1 (Unternehmensprofil) die relevanten Frameworks aus. Die Risikoanalyse basiert dann ausschließlich auf deren Kontrollen."
              : "Please select the relevant frameworks in Step 1 (Company Profile) first. The risk analysis will then be based solely on their controls."}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* AppHeader artık AppLayout'ta global */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-copper font-semibold">
              <ShieldAlert className="h-4 w-4" />
              {de ? "Phase 4 · Risiko" : "Phase 4 · Risk"}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {de ? "Risikoanalyse & Behandlung" : "Risk Analysis & Treatment"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle de={de} />
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/assessment">
                {de ? "Zur Bewertung" : "To Assessment"} <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => { setTab("analysis"); openPickerNew(); }}
                    disabled={loading}>
              <Plus className="h-3.5 w-3.5" /> {de ? "Eigenes Risiko" : "Custom risk"}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2"
                        disabled={!result || result.risks.length === 0}>
                  <FileDown className="h-4 w-4" /> {de ? "Bericht" : "Report"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3">
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">
                      {de ? "Bericht erstellt von" : "Report prepared by"}
                      <span className="text-muted-foreground font-normal ml-1">({de ? "optional" : "optional"})</span>
                    </label>
                    <select value={preparedBy} onChange={e => setPreparedBy(e.target.value)}
                            className="w-full h-8 text-[11.5px] rounded border border-border bg-background px-2">
                      <option value="">{de ? "— keine Angabe —" : "— none —"}</option>
                      {(personnel.people ?? []).map(p => (
                        <option key={p.id} value={formatPerson(p)}>{formatPerson(p)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-foreground mb-1 block">
                      {de ? "Vertraulichkeitsstufe" : "Confidentiality"}
                    </label>
                    <select value={classification} onChange={e => setClassification(e.target.value)}
                            className="w-full h-8 text-[11.5px] rounded border border-border bg-background px-2">
                      <option value="">{de ? "— kein Stempel —" : "— no stamp —"}</option>
                      <option value={de ? "Öffentlich" : "Public"}>{de ? "Öffentlich" : "Public"}</option>
                      <option value={de ? "Intern" : "Internal"}>{de ? "Intern" : "Internal"}</option>
                      <option value={de ? "Vertraulich – nur zum internen Gebrauch" : "Confidential – internal use only"}>
                        {de ? "Vertraulich" : "Confidential"}
                      </option>
                      <option value={de ? "Streng vertraulich" : "Strictly confidential"}>
                        {de ? "Streng vertraulich" : "Strictly confidential"}
                      </option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 border-t border-border pt-2">
                    <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1"
                            onClick={() => result && exportRiskReportPdf({ result, de, authorName: preparedBy, classification, palette, cellOverrides, isOverAppetite })}>
                      <FileDown className="h-3 w-3" /> PDF
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1"
                            onClick={() => result && exportRiskReportDocx({ result, de, authorName: preparedBy, classification })}>
                      <FileText className="h-3 w-3" /> Word
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1"
                            onClick={() => result && exportRiskReportXlsx({ result, de, authorName: preparedBy, classification })}>
                      <FileSpreadsheet className="h-3 w-3" /> Excel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            {de ? "Risiken werden berechnet…" : "Calculating risks…"}
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded border border-destructive/40 bg-destructive/5 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && result && (
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="analysis">
                {de ? "Analyse" : "Analysis"}
              </TabsTrigger>
              <TabsTrigger value="treatment">
                {de ? "Behandlung" : "Treatment"}
                {treatmentPlan && treatmentPlan.treatments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {treatmentPlan.treatments.length}
                  </Badge>
                )}
              </TabsTrigger>
              {mode === "expert" && (
                <TabsTrigger value="quant">
                  {de ? "Quantitatives Risiko (FAIR)" : "Quantitative risk (FAIR)"}
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── ANALYSIS TAB ────────────────────────────────────────── */}
            <TabsContent value="analysis" className="space-y-4">
              {/* KPI strip */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {[
                  { label: de ? "Gesamt" : "Total", value: s!.totalRisks },
                  { label: de ? "Kritisch" : "Critical", value: s!.bySeverity.critical, tone: "text-destructive" },
                  { label: de ? "Hoch" : "High", value: s!.bySeverity.high, tone: "text-destructive/70" },
                  { label: de ? "Mittel" : "Medium", value: s!.bySeverity.medium, tone: "st-teilweise-text" },
                  { label: de ? "Niedrig" : "Low", value: s!.bySeverity.low, tone: "st-ja-text" },
                  { label: de ? "Ø Score" : "Avg score", value: s!.averageScore },
                ].map((k, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className={`text-2xl font-bold ${k.tone ?? "text-foreground"}`}>{k.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
                  </div>
                ))}
              </div>

              {s!.totalRisks > 0 && (() => {
                const RC: Record<string, string> = { critical: CHART_SEVERITY.kritisch, high: CHART_STATUS.nein, medium: CHART_STATUS.teilweise, low: CHART_STATUS.ja };
                const donut = [
                  { name: de ? "Kritisch" : "Critical", value: s!.bySeverity.critical, color: RC.critical },
                  { name: de ? "Hoch" : "High",         value: s!.bySeverity.high,     color: RC.high },
                  { name: de ? "Mittel" : "Medium",     value: s!.bySeverity.medium,   color: RC.medium },
                  { name: de ? "Niedrig" : "Low",       value: s!.bySeverity.low,      color: RC.low },
                ].filter(d => d.value > 0);
                const dd = donut.length ? donut : [{ name: "-", value: 1, color: CHART_EMPTY }];
                return (
                  <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="w-full sm:w-56 shrink-0" style={{ height: 180 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          {/* Beschriftung IM Ring (lib/chartLabels) — siehe Regel dort. */}
                          <Pie data={dd} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2}
                               labelLine={false} label={insideSliceLabel("percent", 0.08)}>
                            {dd.map((d, i) => <Cell key={i} fill={(d as any).color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                          </Pie>
                          <RTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground mb-2">{de ? "Risiken nach Schwere" : "Risks by severity"}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {donut.map(d => (
                          <span key={d.name} className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: d.color }} />{d.name}: <b className="text-foreground">{d.value}</b></span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="text-xs text-muted-foreground">
                {de
                  ? `Basis: ${answered} von ${totalIsoControls} Kontrollen der gewählten Frameworks bewertet.`
                  : `Basis: ${answered} of ${totalIsoControls} controls of the selected frameworks assessed.`}
                {manual.risks.length > 0 && (
                  <span className="ml-1">
                    {de
                      ? `Davon ${manual.risks.length} manuell erfasste Risiken (additiv).`
                      : `Including ${manual.risks.length} manually captured risks (additive).`}
                  </span>
                )}
              </div>

              {/* P4.B.2 · KPI Restrisiko nach Behandlung */}
              {residualSummary && residualSummary.total > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-2xl font-bold text-foreground">{residualSummary.inherentSum}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{de ? "Σ Score vor Behandlung" : "Σ score before treatment"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className={`text-2xl font-bold ${residualSummary.residualSum < residualSummary.inherentSum ? "st-ja-text" : "text-foreground"}`}>
                      {residualSummary.residualSum}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {de ? "Σ Restrisiko nach Behandlung" : "Σ residual risk after treatment"}
                      <span className="ml-1">({residualSummary.captured}/{residualSummary.total} {de ? "erfasst" : "captured"})</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className={`text-2xl font-bold ${residualSummary.over > 0 ? "text-destructive" : "st-ja-text"}`}>{residualSummary.over}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{de ? "über Appetit nach Behandlung" : "over appetite after treatment"}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="text-2xl font-bold text-foreground">
                      {residualSummary.inherentSum > 0 ? Math.round((1 - residualSummary.residualSum / residualSummary.inherentSum) * 100) : 0}%
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{de ? "Reduktion durch Behandlung" : "reduction through treatment"}</div>
                  </div>
                </div>
              )}

              {/* US4.6 · Eigene Risiken (Detail UND Überblick) */}
              <ManualRiskPanel
                risks={manual.risks}
                config={config}
                de={de}
                onAdd={openPickerNew}
                onEdit={openPickerEdit}
                onDelete={deleteManualRisk}
              />

              {/* Matrix config panel — nur im Detail-Modus (Experten-Konfiguration). */}
              {mode === "expert" && (
                <Accordion type="single" collapsible className="rounded-lg border border-border bg-card">
                  <AccordionItem value="matrix-config" className="border-none">
                    <AccordionTrigger className="px-4 py-3 text-sm font-semibold hover:no-underline">
                      {de ? "Matrix-Konfiguration" : "Matrix configuration"}
                      <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                        {config.formula} · {config.dimensions?.cols ?? 5}×{config.dimensions?.rows ?? 5} · {de ? palette.labelDe : palette.labelEn}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <MatrixConfigPanel
                        config={config} palette={palette}
                        onConfigChange={setConfig} onPaletteChange={setPalette}
                        de={de}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Risikomatrix — IMMER sichtbar (auch bei 0 Risiken = leere Matrix, kein Blackout). */}
              <>
                  {/* Heatmap */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="text-sm font-semibold text-foreground">
                        {de
                          ? `Risikomatrix (${config.dimensions?.cols ?? 5} × ${config.dimensions?.rows ?? 5})`
                          : `Risk Matrix (${config.dimensions?.cols ?? 5} × ${config.dimensions?.rows ?? 5})`}
                      </div>
                      {mode === "expert" && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                                onClick={resetMatrix}>
                          <RotateCcw className="h-3 w-3" />
                          {de ? "Zurücksetzen" : "Reset"}
                        </Button>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mb-2">
                      {mode !== "expert"
                        ? (de
                            ? "Farbe = Schweregrad des Risikos. Die rote gestrichelte Linie zeigt Ihre Toleranzgrenze (akzeptables Risiko)."
                            : "Colour = risk severity. The red dashed line marks your tolerance frontier (acceptable risk).")
                        : appetite.mode === "line"
                          ? (de
                              ? "Linien-Modus: Auf Zellen klicken, um die rote Toleranzgrenze (akzeptabel ↔ über Appetit) zu zeichnen."
                              : "Line mode: Click cells to draw the red tolerance frontier (acceptable ↔ over appetite).")
                          : (de
                              ? "Tipp: Auf eine Zelle klicken, um ihre Farbe manuell zu ändern (Niedrig → Mittel → Hoch → Kritisch)."
                              : "Tip: Click a cell to manually change its color (Low → Medium → High → Critical).")}
                    </div>

                    {/* Risikoappetit-Steuerung */}
                    <div className="flex flex-wrap items-center gap-2 mb-3 rounded-md border border-border bg-muted/30 p-2">
                      <span className="text-[11px] font-semibold text-foreground">
                        {de ? "Akzeptables Risiko:" : "Acceptable risk:"}
                      </span>
                      {mode === "expert" && (
                        <div className="inline-flex rounded-md border border-border overflow-hidden">
                          <button onClick={() => setAppetiteMode("class")}
                                  className={`px-2.5 py-1 text-[11px] transition-colors ${
                                    appetite.mode === "class" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                                  }`}>
                            {de ? "Nach Klasse" : "By class"}
                          </button>
                          <button onClick={() => setAppetiteMode("line")}
                                  className={`px-2.5 py-1 text-[11px] border-l border-border transition-colors ${
                                    appetite.mode === "line" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                                  }`}>
                            {de ? "Linie zeichnen" : "Draw line"}
                          </button>
                        </div>
                      )}

                      {(mode !== "expert" || appetite.mode === "class") ? (
                        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {de ? "akzeptabel bis:" : "acceptable up to:"}
                          <select value={appetite.classLevel}
                                  onChange={e => setAppetite(prev => ({ ...prev, classLevel: e.target.value as RiskLevel, overCells: [] }))}
                                  className="h-7 rounded border border-border bg-background px-2 text-[11px] text-foreground">
                            <option value="low">{de ? "Niedrig" : "Low"}</option>
                            <option value="medium">{de ? "Mittel" : "Medium"}</option>
                            <option value="high">{de ? "Hoch" : "High"}</option>
                            <option value="critical">{de ? "Kritisch (alles akzeptabel)" : "Critical (accept all)"}</option>
                          </select>
                        </label>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1"
                                onClick={() => setAppetite(prev => ({ ...prev, overCells: [] }))}>
                          <RotateCcw className="h-3 w-3" />
                          {de ? "Grenze zurücksetzen" : "Reset frontier"}
                        </Button>
                      )}

                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                        <svg width="26" height="8" aria-hidden="true">
                          <line x1="0" y1="4" x2="26" y2="4" stroke="hsl(var(--destructive))" strokeWidth="2.5" strokeDasharray="5 3" />
                        </svg>
                        {de ? "Appetit-Grenze" : "Appetite frontier"}
                      </span>
                    </div>

                    <RiskHeatmap result={result} de={de} palette={palette}
                                 cellOverrides={cellOverrides}
                                 onCellCycle={mode === "expert" ? cycleCellLevel : undefined}
                                 isOverAppetite={isOverAppetite}
                                 appetiteEdit={mode === "expert" && appetite.mode === "line"}
                                 onToggleAppetiteCell={mode === "expert" ? toggleAppetiteCell : undefined} />

                    {appetiteSummary && appetiteSummary.total > 0 && (
                      <div className={`mt-3 rounded-md border px-3 py-2 text-[12px] ${
                        appetiteSummary.overUnaccepted > 0
                          ? "border-destructive/40 bg-destructive/5 text-foreground"
                          : "st-ja-border st-ja-tint text-foreground"
                      }`}>
                        {appetiteSummary.over === 0 ? (
                          de
                            ? "✓ Alle Risiken liegen innerhalb des akzeptablen Bereichs."
                            : "✓ All risks are within the acceptable range."
                        ) : (
                          <>
                            <strong>{appetiteSummary.overUnaccepted}</strong>
                            {de
                              ? ` von ${appetiteSummary.total} Risiken liegen über dem Appetit und sind noch nicht behandelt`
                              : ` of ${appetiteSummary.total} risks are over appetite and not yet treated`}
                            {appetiteSummary.accepted > 0 && (
                              <span className="text-muted-foreground">
                                {de
                                  ? ` (${appetiteSummary.accepted} bewusst akzeptiert).`
                                  : ` (${appetiteSummary.accepted} consciously accepted).`}
                              </span>
                            )}
                            {appetiteSummary.accepted === 0 && "."}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {result.risks.length === 0 ? (
                    <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                      {answered === 0
                        ? (de
                            ? "Noch keine Bewertung erfasst. Sobald Sie in der Gap-Analyse Kontrollen bewerten, werden hier automatisch Risiken abgeleitet."
                            : "No assessment recorded yet. As soon as you rate controls in the Gap Analysis, risks are derived here automatically.")
                        : (de
                            ? "Auf Basis der erfassten Eingaben wurde kein Risiko identifiziert — alle bewerteten Kontrollen sind umgesetzt. Das ist der Best-Case (kein Handlungsbedarf)."
                            : "Based on the recorded inputs, no risk was identified — all assessed controls are implemented. This is the best case (no action required).")}
                    </div>
                  ) : (
                    <>
                  {mode === "expert" ? (<>
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{de ? "Filter:" : "Filter:"}</span>
                    {(["all", "critical", "high", "medium", "low"] as const).map(l => (
                      <button key={l} onClick={() => setLevelFilter(l)}
                              className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                                levelFilter === l ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"
                              }`}>
                        {l === "all" ? (de ? "Alle" : "All") : riskLevelLabel(l, de ? "de" : "en")}
                      </button>
                    ))}
                    <span className="mx-1 text-muted-foreground">·</span>
                    {(["all", "organization", "asset"] as const).map(s2 => (
                      <button key={s2} onClick={() => setScopeFilter(s2)}
                              className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                                scopeFilter === s2 ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"
                              }`}>
                        {s2 === "all" ? (de ? "Alle Scopes" : "All scopes")
                          : s2 === "organization" ? (de ? "Organisation" : "Organization")
                          : (de ? "Asset" : "Asset")}
                      </button>
                    ))}
                  </div>

                  {/* Risk list (accordion) */}
                  <RiskAccordionList
                    filtered={filtered} de={de}
                    config={config}
                    overrides={manual.overrides}
                    engineLI={engineLI}
                    people={personnel.people ?? []}
                    onAddPerson={addPerson}
                    onSetOverride={setOverride}
                    onEditManual={openPickerEdit}
                    manualById={new Map(manual.risks.map(m => [m.id, m]))}
                  />
                  </>) : (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        {de ? "Top-Risiken" : "Top risks"}
                        <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                          {de ? "die 5 wichtigsten nach Score" : "the 5 highest by score"}
                        </span>
                        <InfoHint
                          title={de ? "Warum genau diese fünf?" : "Why exactly these five?"}
                          text={de
                            ? "Rangfolge nach Risiko-Score = Eintrittswahrscheinlichkeit (L) × Auswirkung (I), je 1–5.\n\nL steigt mit: fehlenden/teilweise umgesetzten Kontrollen, Schwere der Lücke, Wichtigkeit der betroffenen Kontrollen.\n\nI steigt mit: Kritikalität des Assets, Abhängigkeiten, Single Point of Failure, kritischem Service, organisationsweitem Geltungsbereich.\n\nGezeigt werden die 5 höchsten Scores aller aktuellen Risiken. Klick auf ein Risiko öffnet es direkt in der Risikobehandlung."
                            : "Ranked by risk score = likelihood (L) × impact (I), each 1–5.\n\nL rises with: missing/partially implemented controls, gap severity, importance of affected controls.\n\nI rises with: asset criticality, dependencies, single point of failure, critical service, organisation-wide scope.\n\nThe 5 highest scores of all current risks are shown. Click a risk to open it directly in Risk Treatment."}
                        />
                      </div>
                      {[...result.risks].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5).map((r, i) => (
                        <div
                          key={r.risk_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => { setFocusRiskId(r.risk_id); setTab("treatment"); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFocusRiskId(r.risk_id); setTab("treatment"); } }}
                          title={de ? "In der Risikobehandlung öffnen" : "Open in risk treatment"}
                          className="flex items-stretch gap-3 rounded-xl border border-border bg-card p-3 hover:border-accent hover:shadow-sm transition-all cursor-pointer"
                        >
                          <span className="text-lg font-bold text-muted-foreground w-6 text-center shrink-0 self-center">{i + 1}</span>
                          <span className={`w-1.5 rounded-full shrink-0 ${
                            r.risk_level === "critical" ? "bg-destructive"
                            : r.risk_level === "high" ? "bg-destructive/60"
                            : r.risk_level === "medium" ? "st-teilweise-bg" : "st-ja-bg"}`} />
                          <div className="min-w-0 flex-1 self-center">
                            <div className="text-sm font-medium text-foreground truncate">
                              {de ? r.gap_title : r.gap_title_en}
                              {r.risk_source === "manual" && (
                                <Badge variant="outline" className="ml-1.5 align-middle text-[9px] st-teilweise-tint st-teilweise-border st-teilweise-text">
                                  {de ? "manuell" : "manual"}
                                </Badge>
                              )}
                              {r.risk_overridden && (
                                <Badge variant="outline" className="ml-1.5 align-middle text-[9px] border-copper/60 text-copper">
                                  {de ? "L/I angepasst" : "L/I adjusted"}
                                </Badge>
                              )}
                            </div>
                            {/* Das eigentliche Risiko: Katalogtext der wichtigsten betroffenen Kontrolle */}
                            <div className="text-xs text-foreground/85 leading-snug line-clamp-2 mt-0.5">{de ? r.description : r.description_en}</div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">L {r.likelihood} × I {r.impact}{r.service_name ? ` · ${r.service_name}` : ""}{r.scenarios?.length > 1 ? ` · ${r.scenarios.length} ${de ? "Szenarien" : "scenarios"}` : ""}</div>
                          </div>
                          <Badge className={`${LEVEL_TONE[r.risk_level]} self-center`}>{riskLevelLabel(r.risk_level, de ? "de" : "en").toUpperCase()}</Badge>
                          <span className="text-sm font-bold tabular-nums text-foreground w-10 text-right shrink-0 self-center">{r.risk_score}</span>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground self-center shrink-0" />
                        </div>
                      ))}
                      <div className="text-[11px] text-muted-foreground pt-1">
                        {de ? `Alle ${result.risks.length} Risiken mit Filtern im ` : `All ${result.risks.length} risks with filters in `}
                        <span className="font-semibold text-foreground">Detail</span>.
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </>
            </TabsContent>

            {/* ── TREATMENT TAB ───────────────────────────────────────── */}
            <TabsContent value="treatment" className="space-y-4">
              {treatmentPlan ? (
                <TreatmentTable
                  risks={result.risks}
                  treatments={treatmentPlan.treatments}
                  controlList={treatmentPlan.controlSelectionList}
                  gaps={gaps}
                  personnel={personnel}
                  de={de}
                  onChange={handleTreatmentChange}
                  onFillAllDefaults={handleFillAllDefaults}
                  focusRiskId={focusRiskId}
                  config={config}
                  cellOverrides={cellOverrides}
                  isOverAppetite={isOverAppetite}
                  onAddPerson={addPerson}
                />
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  {de ? "Behandlungsplan wird vorbereitet…" : "Preparing treatment plan…"}
                </div>
              )}
            </TabsContent>

            {/* ── QUANTITATIVES RISIKO (FAIR) TAB ─────────────────────── */}
            <TabsContent value="quant" className="space-y-4">
              {/* Quantitative FAIR-/LEC-Analyse: nur im Detail-Modus. Überblick
                  bleibt bei Matrix + Risikoliste (Management-Sicht). */}
              {mode === "expert" && <QuantRiskPanel risks={result.risks} de={de} />}
            </TabsContent>
          </Tabs>
        )}

        {/* US4.6 · Risiko hinzufügen / eigenes Risiko bearbeiten */}
        <RiskPicker
          open={pickerOpen}
          onOpenChange={(o) => { setPickerOpen(o); if (!o) setEditingManual(null); }}
          addedCatalogIds={addedCatalogIds}
          onAddCatalog={handleAddCatalog}
          onAddDb={handleAddDb}
          onSaveCustom={handleSaveCustom}
          assets={pickerAssets}
          lang={de ? "de" : "en"}
          maxL={dims.cols}
          maxI={dims.rows}
          editing={editingManual}
        />
      </main>
    </div>
  );
};

// ── Risk accordion list with pagination ───────────────────────────
const PAGE_SIZE = 10;
interface RiskAccordionListProps {
  filtered: RiskObject[];
  de: boolean;
  config: RiskMatrixConfig;
  overrides: Record<string, RiskOverride>;
  engineLI: Map<string, { l: number; i: number }>;
  people: Person[];
  onAddPerson: (p: Person) => void;
  onSetOverride: (riskId: string, o: RiskOverride | null) => void;
  onEditManual: (m: ManualRisk) => void;
  manualById: Map<string, ManualRisk>;
}
function RiskAccordionList({
  filtered, de, config, overrides, engineLI, people, onAddPerson, onSetOverride, onEditManual, manualById,
}: RiskAccordionListProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  if (filtered.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        {de ? "Keine Risiken für die aktuellen Filter." : "No risks match the current filters."}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-foreground">
          {de ? `Risiken (${shown.length} von ${filtered.length})` : `Risks (${shown.length} of ${filtered.length})`}
        </div>
        {filtered.length > PAGE_SIZE && (
          <div className="flex gap-1">
            {visible < filtered.length && (
              <Button size="sm" variant="outline" className="h-7 text-[11px]"
                      onClick={() => setVisible(filtered.length)}>
                {de ? "Alle anzeigen" : "Show all"}
              </Button>
            )}
            {visible > PAGE_SIZE && (
              <Button size="sm" variant="ghost" className="h-7 text-[11px]"
                      onClick={() => setVisible(PAGE_SIZE)}>
                {de ? "Weniger" : "Show less"}
              </Button>
            )}
          </div>
        )}
      </div>

      <Accordion type="multiple" className="space-y-2">
        {shown.map((r, i) => {
          const ins = buildTopRiskInsight(r, de ? "de" : "en");
          const isManual = r.risk_source === "manual";
          const manualObj = isManual ? manualById.get(r.risk_id) : undefined;
          const li = explainLikelihoodImpact(r, de ? "de" : "en");
          const eng = engineLI.get(r.risk_id);
          return (
            <AccordionItem key={r.risk_id} value={r.risk_id}
                           className="rounded-lg border border-border bg-card overflow-hidden">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex flex-wrap items-center gap-2 text-left flex-1 pr-2">
                  <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                  <span className="font-semibold text-foreground text-sm">
                    {de ? r.gap_title : r.gap_title_en}
                  </span>
                  {isManual && (
                    <Badge variant="outline" className="text-[9px] st-teilweise-tint st-teilweise-border st-teilweise-text">
                      {de ? "manuell" : "manual"}
                    </Badge>
                  )}
                  <Badge className={LEVEL_TONE[r.risk_level]}>
                    {riskLevelLabel(r.risk_level, de ? "de" : "en").toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">Score {r.risk_score}</Badge>
                  {isManual ? (
                    <Badge variant="outline" className="text-[10px]">L {r.likelihood} × I {r.impact}</Badge>
                  ) : (
                    // P4.M.3 — Klick öffnet den L/I-Override-Editor (Pflicht-Begründung)
                    <LIOverrideEditor
                      risk={r} config={config} override={overrides[r.risk_id]}
                      people={people} onAddPerson={onAddPerson} de={de}
                      engineLikelihood={eng?.l} engineImpact={eng?.i}
                      onSave={(o) => onSetOverride(r.risk_id, o)}
                      onReset={() => onSetOverride(r.risk_id, null)}
                    />
                  )}
                  {r.risk_overridden && (
                    <Badge variant="outline" className="text-[10px] border-copper/60 text-copper">
                      {de ? "manuell angepasst" : "manually adjusted"}
                    </Badge>
                  )}
                  {r.scope === "organization"
                    ? <Badge variant="outline" className="text-[10px]">{de ? "Org-weit" : "Org-wide"}</Badge>
                    : <Badge variant="outline" className="text-[10px]">{r.asset_name ?? "—"}</Badge>}
                  {r.service_name && <Badge variant="secondary" className="text-[10px]">{r.service_name}</Badge>}
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                {/* Konkrete Risikoszenarien je betroffener Kontrolle (Katalog `risks`) */}
                {r.scenarios && r.scenarios.length > 0 && (
                  <div className="p-4 border-t border-border">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-destructive mb-2">
                      {de ? "Was droht konkret" : "What is at stake"}
                      <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground">
                        {de ? `${r.scenarios.length} Szenarien · Kurzfassung, Volltext per „Mehr anzeigen"` : `${r.scenarios.length} scenarios · summary, full text via "Show more"`}
                      </span>
                    </div>
                    <ScenarioList scenarios={r.scenarios} de={de} max={4}
                      moreHint={de ? `+ ${r.scenarios.length - 4} weitere in der Risikobehandlung` : `+ ${r.scenarios.length - 4} more in risk treatment`} />
                  </div>
                )}
                <div className="p-4 bg-muted/30 border-t border-border">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    {de ? "Warum kritisch" : "Why critical"}
                  </div>
                  <p className="text-sm text-foreground">{ins.whyCritical}</p>
                  {/* P4.A.3 — L/I-Gründe aus der Engine (lokalisiert) */}
                  <div className="mt-2 space-y-1 text-[12px]">
                    <div className="text-foreground">
                      <span className="font-semibold">{de ? `Eintrittswahrscheinlichkeit L ${r.likelihood}:` : `Likelihood L ${r.likelihood}:`}</span>{" "}
                      <span className="text-muted-foreground">{li.likelihood}</span>
                    </div>
                    <div className="text-foreground">
                      <span className="font-semibold">{de ? `Auswirkung I ${r.impact}:` : `Impact I ${r.impact}:`}</span>{" "}
                      <span className="text-muted-foreground">{li.impact}</span>
                    </div>
                  </div>
                  {/* P4.M.3 — Override-Anzeige */}
                  {r.risk_overridden && (
                    <div className="mt-2 rounded-md border border-copper/40 bg-copper/5 px-3 py-2 text-[12px]">
                      <span className="font-semibold text-copper">{de ? "Manuell angepasst" : "Manually adjusted"}</span>
                      {eng && (
                        <span className="text-muted-foreground"> — {de ? "Engine-Wert" : "engine value"} L {eng.l} × I {eng.i} → L {r.likelihood} × I {r.impact}</span>
                      )}
                      {r.override_reason && (
                        <div className="text-foreground mt-0.5">
                          <span className="text-muted-foreground">{de ? "Begründung:" : "Justification:"}</span> {r.override_reason}
                        </div>
                      )}
                      {(r.override_by || r.override_at) && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {[r.override_by, r.override_at].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  )}
                  {/* US4.6 — manuelles Risiko: Bearbeiten */}
                  {manualObj && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                      {de ? "Manuell erfasstes Risiko" : "Manually captured risk"}
                      {manualObj.source === "catalog" && <span className="font-mono">({manualObj.source_catalog_id})</span>}
                      <Button size="sm" variant="outline" className="h-6 text-[11px] px-2"
                              onClick={(e) => { e.stopPropagation(); onEditManual(manualObj); }}>
                        {de ? "Bearbeiten" : "Edit"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-border">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-copper mb-1">
                    {de ? "Business Impact" : "Business Impact"}
                  </div>
                  <p className="text-sm text-foreground">{ins.businessImpact}</p>
                </div>
                <div className="p-4 bg-primary/5 border-t border-border">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-primary mb-1">
                    {de ? "Sofortmaßnahme" : "Immediate Action"}
                  </div>
                  <p className="text-sm text-foreground">{ins.immediateAction}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button size="sm" variant="outline"
                  onClick={() => setVisible(v => Math.min(filtered.length, v + PAGE_SIZE))}>
            {de ? `Weitere ${Math.min(PAGE_SIZE, filtered.length - visible)} anzeigen` : `Show ${Math.min(PAGE_SIZE, filtered.length - visible)} more`}
          </Button>
        </div>
      )}
    </div>
  );
}

export default Risk;
