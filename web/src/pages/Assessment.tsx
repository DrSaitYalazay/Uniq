import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/AppHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Loader2, Layers, ArrowRight, FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { exportGapReportPdf } from "@/lib/gapReport";
import { exportGapReportDocx } from "@/lib/gapReportDocx";
import { exportGapReportXlsx } from "@/lib/gapReportXlsx";
import { useToolData } from "@/hooks/useToolData";
import { useSoaNotApplicable } from "@/hooks/useSoaNotApplicable";
import { DEFAULT_PERSONNEL, PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, formatPerson, type PersonnelRegistry } from "@/lib/personnel";

import { useAssessment, answerKey } from "@/hooks/useAssessment";
import { useFrameworkInheritance } from "@/hooks/useFrameworkInheritance";
import { useCoverageReview } from "@/hooks/useCoverageReview";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import { useControlHealth } from "@/hooks/useControlHealth";
import { AssessmentPanel } from "@/components/assessment/AssessmentPanel";
import { MaturityPanel } from "@/components/MaturityPanel";
import { AssessmentOverviewPanel } from "@/components/assessment/AssessmentOverviewPanel";
import type { AssessmentAsset } from "@/components/assessment/AssetOverridePanel";
import { LayoutDashboard } from "lucide-react";

import { onFrameworksUpdated } from "@/lib/frameworkBus";
import { isIsoClause } from "@/data/isoAnnexMap";
import {
  computeStats, projectAnswer, buildAnchorAnswerMap,
  type AnswerRow, type AnswerStatus, type ControlRow, type EffectiveAnswer,
  type Severity, type SeveritySource,
} from "@/lib/assessmentEngine";


const FRAMEWORK_LABELS: Record<string, { de: string; en: string; short: string }> = {
  ISO27001:    { de: "ISO/IEC 27001", en: "ISO/IEC 27001", short: "ISO 27001" },
  NIS2:        { de: "NIS2",          en: "NIS2",          short: "NIS2" },
  BSI:         { de: "BSI IT-Grundschutz", en: "BSI IT-Grundschutz", short: "BSI" },
  BSI200_4:    { de: "BSI 200-4 (BCM)",    en: "BSI 200-4 (BCM)",    short: "BSI 200-4" },
  BCM22301:    { de: "ISO 22301 (BCM)",    en: "ISO 22301 (BCM)",    short: "ISO 22301" },
  KRITIS:      { de: "KRITIS",        en: "KRITIS",        short: "KRITIS" },
  DORA:        { de: "DORA",          en: "DORA",          short: "DORA" },
  TISAX:       { de: "TISAX / VDA ISA", en: "TISAX / VDA ISA", short: "TISAX" },
  GDPR:        { de: "DSGVO / GDPR",  en: "GDPR",          short: "GDPR" },
  ISO27701:    { de: "ISO 27701 (Privacy)", en: "ISO 27701 (Privacy)", short: "ISO 27701" },
  AIACT:       { de: "EU AI Act",     en: "EU AI Act",     short: "AI Act" },
  ISO42001:    { de: "ISO 42001",     en: "ISO 42001",     short: "ISO 42001" },
  NIST_AI_RMF: { de: "NIST AI RMF",   en: "NIST AI RMF",   short: "NIST AI" },
  MaRisk:      { de: "MaRisk",        en: "MaRisk",        short: "MaRisk" },
  CRA:         { de: "Cyber Resilience Act", en: "Cyber Resilience Act", short: "CRA" },
  NIST_CSF:    { de: "NIST CSF 2.0",   en: "NIST CSF 2.0",   short: "NIST CSF" },
  ISO27017:    { de: "ISO/IEC 27017 (Cloud)", en: "ISO/IEC 27017 (Cloud)", short: "ISO 27017" },
  ISO27018:    { de: "ISO/IEC 27018 (Cloud-PII)", en: "ISO/IEC 27018 (Cloud PII)", short: "ISO 27018" },
  TR03183:     { de: "BSI TR-03183",   en: "BSI TR-03183",   short: "TR-03183" },
};


const Assessment = () => {
  const { user, tenantId } = useAuth();
  const { lang } = useLanguage();
  const de = lang === "de";

  const [enabledFrameworks, setEnabledFrameworks] = useState<string[]>([]);
  const [maturityFlags, setMaturityFlags] = useState<Record<string, boolean>>({});
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("__overview__");
  /** Sprung aus der „Alle"-Liste: diese Anforderung im Framework-Tab öffnen. */
  const [focus, setFocus] = useState<{ fw: string; controlId: string; nonce: number } | null>(null);
  const openControl = (fw: string, controlId: string) => {
    setActiveTab(fw);
    setFocus({ fw, controlId, nonce: Date.now() });
  };
  const [reportFwSelection, setReportFwSelection] = useState<Record<string, boolean>>({});
  const [preparedBy, setPreparedBy] = useState<string>("");
  const [classification, setClassification] = useState<string>("");
  const { data: personnel } = useToolData<PersonnelRegistry>(PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL);
  const [inventory, setInventory] = useState<{
    services: Array<{ id: string; name: string; criticality: number | null; category?: string | null }>;
    assets: AssessmentAsset[];
    dependencies: Array<{ is_spof?: boolean | null; criticality?: number | null }>;
  }>({ services: [], assets: [], dependencies: [] });

  // Load Phase 2 inventory context — feeds criticality-weighted priority in reports.
  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      const [{ data: svc }, { data: ast }, { data: dep }] = await Promise.all([
        supabase.from("services").select("id, name, criticality, category"),
        supabase.from("assets").select("id, service_id, asset_name, asset_type, environment, inherited_criticality, user_override_criticality"),
        supabase.from("dependencies").select("is_spof, criticality"),
      ]);
      setInventory({
        services: (svc ?? []) as any,
        assets: ((ast ?? []) as any[]).map((asset) => {
          const service = ((svc ?? []) as any[]).find((row) => row.id === asset.service_id);
          const inherited = asset.inherited_criticality === true ? (service?.criticality ?? null) : null;
          const override = asset.user_override_criticality === true ? (service?.criticality ?? inherited ?? 4) : null;
          return {
            ...asset,
            inherited_criticality: inherited,
            user_override_criticality: override,
            service_name: service?.name ?? null,
          };
        }),
        dependencies: (dep ?? []) as any,
      });
    })();
  }, [tenantId]);

  const loadProfile = useCallback(async () => {
    if (!user || !tenantId) return;
    const [{ data: profile }, { data: fwRows }] = await Promise.all([
      supabase.from("company_profiles").select("enabled_frameworks").eq("user_id", tenantId).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("frameworks").select("code, uses_maturity"),
    ]);
    const list = (profile?.enabled_frameworks ?? []) as string[];
    setEnabledFrameworks(list);
    const flags: Record<string, boolean> = {};
    (fwRows ?? []).forEach((r: any) => { flags[r.code] = !!r.uses_maturity; });
    setMaturityFlags(flags);
    setProfileLoaded(true);
  }, [user, tenantId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Live-refresh when Scope persists a new framework selection.
  useEffect(() => {
    return onFrameworksUpdated(({ enabled_frameworks }) => {
      setEnabledFrameworks(enabled_frameworks);
    });
  }, []);



  const { controls, answers, anchorsBySpokeControl, loading, setAnswer } = useAssessment(enabledFrameworks);
  const { mode: inheritanceMode } = useFrameworkInheritance();
  // Y8: EIN gemeinsamer Deckungs-Resolver fuer ALLE Verbraucher der Projektion.
  // Geerbtes „ja" aus einem anderen Framework bleibt „teilweise", bis Umfang,
  // Zeitraum und Nachweisdeckung bestaetigt sind.
  const { coverage, decisionFor, saveDecision } = useCoverageReview();
  const { mode: assessmentMode, setMode: setAssessmentMode } = useAssessmentMode();
  // Additiv: abgeleiteter Control-Status (Engine E3). Leer, solange keine control_tests.
  const { healthByControl } = useControlHealth();

  // Anker je Kontrolle = NUR Kontroll-Knoten (control_node_member), node-only.
  const isoAnchorsBySpokeControl = anchorsBySpokeControl;

  // HUB-AGNOSTISCH: jede Framework-Antwort füttert über ihren Knoten den Anker.
  // Bei Modus "off" (Übernahme aus): LEERE Anker-Map → projectAnswer fällt auf die
  // eigene Antwort zurück (keine Cross-Framework-Vererbung).
  const isoAnswerByControl = useMemo(
    () => inheritanceMode === "off"
      ? new Map<string, AnswerRow>()
      : buildAnchorAnswerMap(answers, (fw, cid) => isoAnchorsBySpokeControl.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? []),
    [answers, isoAnchorsBySpokeControl, inheritanceMode],
  );

  // Wie auf Org-Ebene: bei Modus "off" (Übernahme aus) KEINE Cross-Framework-
  // Vererbung — leere Anker-Map, damit projectAnswer auf die eigene Antwort
  // zurückfällt. "off" muss auf Org- UND Asset-Ebene konsistent wirken.
  // Node-only: Asset-Antworten JEDES Frameworks speisen je Asset ihre Knoten-Anker.
  // Kein ISO-Pivot mehr. Kontrolle ohne Knoten ⇒ unabhängig (kein Asset-Cross-Vererben).
  // Fix F-02: WEAKEST-LINK wie auf Org-Ebene (strengster Status je Knoten gewinnt,
  // Gleichstand → neueste), und eigenes „na" wird NICHT über Knoten geerbt.
  const isoAssetAnswerByAsset = useMemo(() => {
    const outer = new Map<string, Map<string, AnswerRow>>();
    if (inheritanceMode === "off") return outer;
    const ts = (r?: AnswerRow) => (r?.updated_at ? Date.parse(r.updated_at) : 0);
    const RANK: Record<string, number> = { nein: 0, teilweise: 1, ja: 2 };
    for (const key of Object.keys(answers)) {
      const row = answers[key];
      if (!row.asset_id || !row.antwort || row.antwort === "na") continue; // „na" nicht über Knoten erben
      const anchors = isoAnchorsBySpokeControl.get(`${row.framework}::${row.control_id}`) ?? [];
      if (anchors.length === 0) continue; // kein Knoten ⇒ unabhängig
      if (!outer.has(row.asset_id)) outer.set(row.asset_id, new Map());
      const inner = outer.get(row.asset_id)!;
      for (const a of anchors) {
        const prev = inner.get(a.anchorId);
        if (!prev
            || RANK[row.antwort] < RANK[prev.antwort]
            || (RANK[row.antwort] === RANK[prev.antwort] && ts(row) >= ts(prev))) {
          inner.set(a.anchorId, row);
        }
      }
    }
    return outer;
  }, [answers, isoAnchorsBySpokeControl, inheritanceMode]);

  const controlsByFramework = useMemo(() => {
    const m = new Map<string, ControlRow[]>();
    for (const c of controls) {
      // Hide sub-controls from primary scoring/rendering. They remain in DB
      // as depth information (e.g. NIST CSF Implementation Examples).
      if (c.tags?.includes("sub")) continue;
      if ((c.meta as any)?.scored === false) continue;
      if (!m.has(c.framework)) m.set(c.framework, []);
      // ISO 27001: `controls.muss` ist in der DB bisher NULL (→ „Kritische MUSS ISO 0").
      // Bis `db/seeds/iso_meta_annex.sql` deployt ist, aus der Annex-Map ableiten:
      // Klauseln 4–10 = MUSS, Annex A = SOLL. Gleiche Regel wie im Seed; ein
      // vorhandener DB-Wert gewinnt immer.
      const row = c.framework === "ISO27001" && c.muss == null
        ? { ...c, muss: isIsoClause(c.id) ? "true" : "false" }
        : c;
      m.get(c.framework)!.push(row);
    }
    return m;
  }, [controls]);


  // SoA (Phase 05) „nicht anwendbar" wirkt auch hier — sonst zeigt die Gap-Analyse
  // „Anwendbar 404", während SoA/Dashboard 403 zählen (Befund P5.R.4).
  const soaNa = useSoaNotApplicable();
  const effectiveByFramework = useMemo(() => {
    const m = new Map<string, Map<string, EffectiveAnswer>>();
    controlsByFramework.forEach((list, fw) => {
      const inner = new Map<string, EffectiveAnswer>();
      for (const c of list) {
        const key = answerKey(fw, c.id, null);
        let eff = projectAnswer(c, answers[key], isoAnswerByControl, isoAnchorsBySpokeControl, { coverage });
        if (soaNa.has(fw, c.id) && eff.status !== "na") eff = { ...eff, status: "na" };
        inner.set(c.id, eff);
      }
      m.set(fw, inner);
    });
    return m;
  }, [controlsByFramework, answers, isoAnswerByControl, isoAnchorsBySpokeControl, soaNa, coverage]);

  // Tabs = only frameworks the user selected in Scope (ISO 27001 is still loaded
  // in the background as the hub for inheritance, but is hidden unless selected).
  const tabFrameworks = useMemo(() => {
    // Kein Framework wird bevorzugt (kein ISO-Hub) — Reihenfolge = Nutzerauswahl.
    const seen = new Set<string>();
    return enabledFrameworks.filter(f => {
      if (seen.has(f)) return false;
      seen.add(f);
      return controlsByFramework.has(f);
    });
  }, [enabledFrameworks, controlsByFramework]);

  useEffect(() => {
    if (activeTab === "__overview__") return; // overview is always valid
    if (tabFrameworks.length > 0 && !tabFrameworks.includes(activeTab)) setActiveTab("__overview__");
  }, [tabFrameworks, activeTab]);


  /**
   * Y7: gespeicherte Einstufungen je Framework → Kontroll-ID.
   * Nur Organisationsebene (asset_id = null): der Abweichungsgrad ist eine
   * Aussage über die Kontrolle, nicht über ein einzelnes Asset.
   */
  const severityByFramework = useMemo(() => {
    const m = new Map<string, Map<string, { severity?: Severity | null; severity_source?: SeveritySource | null; severity_note?: string | null }>>();
    for (const key of Object.keys(answers)) {
      const row = answers[key];
      if (!row || row.asset_id) continue;
      if (!row.severity && !row.severity_source) continue;
      if (!m.has(row.framework)) m.set(row.framework, new Map());
      m.get(row.framework)!.set(row.control_id, {
        severity: row.severity ?? null,
        severity_source: row.severity_source ?? null,
        severity_note: row.severity_note ?? null,
      });
    }
    return m;
  }, [answers]);

  const handleSet = (fw: string, controlId: string, status: AnswerStatus | null) => {
    setAnswer(fw, controlId, { antwort: status });
  };
  const handleNote = (fw: string, controlId: string, note: string) => {
    setAnswer(fw, controlId, { note });
  };
  const handleReifegrad = (fw: string, controlId: string, r: number | null) => {
    setAnswer(fw, controlId, { reifegrad: (r ?? null) as any });
  };
  /**
   * Y7: Abweichungsgrad setzen (Haupt-/Nebenabweichung/keine).
   *
   * `value === null` nimmt den Prüferentscheid zurück; danach gilt wieder der
   * Katalogvorschlag. Der Grad wird NIE aus der Risikopriorität abgeleitet und
   * leitet sie auch nicht — es sind zwei getrennte Aussagen.
   */
  const handleSeverity = (fw: string, controlId: string, value: Severity | null, note: string) => {
    setAnswer(fw, controlId, value
      ? { severity: value, severity_source: "pruefer", severity_note: note }
      : { severity: null, severity_source: null, severity_note: null });
  };
  const handleBulk = (fw: string, ids: string[], status: AnswerStatus, note?: string) => {
    // Toggle: if every control in this group already has exactly this status, clear them all.
    const allMatch = ids.length > 0 && ids.every(id => answers[answerKey(fw, id, null)]?.antwort === status);
    const next = allMatch ? null : status;
    ids.forEach(id => {
      // Pflichtnotiz aus dem Bestätigungsdialog (P3.X.6/P3.X.8): nur in Anforderungen
      // OHNE eigene Notiz übernehmen — bestehende Begründungen bleiben unangetastet.
      const existing = answers[answerKey(fw, id, null)]?.note ?? "";
      const patch: Partial<AnswerRow> = { antwort: next as any };
      if (next && note && !existing.trim()) patch.note = note;
      setAnswer(fw, id, patch);
    });
  };

  const buildAssetEffective = (fw: string, control: ControlRow, assetId: string, orgEffective: EffectiveAnswer): EffectiveAnswer => {
    const direct = answers[answerKey(fw, control.id, assetId)];
    const isoAssetAnswers = isoAssetAnswerByAsset.get(assetId) ?? isoAnswerByControl;

    if (direct?.antwort) {
      return projectAnswer(control, direct, isoAssetAnswers, isoAnchorsBySpokeControl, { coverage });
    }

    // Node-only: kein ISO-Sonderfall mehr — jede Kontrolle erbt nur über ihre Knoten.
    if (isoAssetAnswerByAsset.has(assetId)) {
      const projected = projectAnswer(control, undefined, isoAssetAnswers, isoAnchorsBySpokeControl, { coverage });
      if (projected.status) return projected;
    }

    return orgEffective;
  };

  const handleAssetStatus = (fw: string, controlId: string, assetId: string, status: AnswerStatus | null) => {
    setAnswer(fw, controlId, { antwort: status }, assetId);
  };

  const handleAssetReifegrad = (fw: string, controlId: string, assetId: string, r: number | null) => {
    const direct = answers[answerKey(fw, controlId, assetId)];
    const orgStatus = effectiveByFramework.get(fw)?.get(controlId)?.status ?? null;
    setAnswer(fw, controlId, { antwort: (direct?.antwort ?? orgStatus) as any, reifegrad: (r ?? null) as any }, assetId);
  };


  const isBusy = loading || !profileLoaded;

  return (
    <div className="min-h-screen bg-background">
      {/* AppHeader artık AppLayout'ta global */}
      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {de ? "Bewertung – Gap Analyse" : "Assessment – Gap Analysis"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {de
              ? "Bewerten Sie jede Kontrolle einmal – inhaltsgleiche Kontrollen teilen sich einen framework-neutralen Kontroll-Knoten (same-as) und werden automatisch mitgeführt. Kein Framework ist Hub."
              : "Assess each control once – equivalent controls share a framework-neutral control node (same-as) and are carried over automatically. No framework is a hub."}
          </p>
        </div>

        {profileLoaded && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs">
            <Layers className="h-3.5 w-3.5 text-accent" />
            <span className="font-medium text-foreground">
              {de ? "Aktive Frameworks:" : "Active frameworks:"}
            </span>
            {tabFrameworks.length === 0 ? (
              <span className="text-muted-foreground">{de ? "keine" : "none"}</span>
            ) : (
              tabFrameworks.map(fw => {
                const meta = FRAMEWORK_LABELS[fw] ?? { short: fw };
                return (
                  <Badge key={fw} variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1">
                                        {meta.short}
                  </Badge>
                );
              })
            )}
            <span className="flex-1" />
            {/* Einfach (Baustein) ↔ Experte (Kontrolle) — pro Nutzer/Gerät */}
            <div className="inline-flex items-center rounded-lg border border-border overflow-hidden" role="group"
                 aria-label={de ? "Bewertungsmodus" : "Assessment mode"}>
              {(["simple", "expert"] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAssessmentMode(m)}
                  aria-pressed={assessmentMode === m}
                  title={m === "simple"
                    ? (de ? "Überblick — Konformität je Baustein/Thema auf einen Blick" : "Overview — compliance per building block/topic at a glance")
                    : (de ? "Detail — jede einzelne Anforderung bewerten" : "Detail — assess every single requirement")}
                  className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    assessmentMode === m ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {m === "simple" ? (de ? "Überblick" : "Overview") : (de ? "Detail" : "Detail")}
                </button>
              ))}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1"
                  disabled={tabFrameworks.length === 0}
                >
                  <FileDown className="h-3 w-3" /> {de ? "Bericht" : "Report"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-3">
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold text-foreground mb-1.5">
                      {de ? "Frameworks auswählen" : "Select frameworks"}
                    </div>
                    <div className="flex items-center justify-between mb-2 text-[10.5px]">
                      {(() => {
                        const allOn = tabFrameworks.length > 0 && tabFrameworks.every(f => reportFwSelection[f]);
                        return (
                          <button
                            className="text-accent hover:underline"
                            onClick={() => {
                              if (allOn) {
                                setReportFwSelection({});
                              } else {
                                const all: Record<string, boolean> = {};
                                tabFrameworks.forEach(f => (all[f] = true));
                                setReportFwSelection(all);
                              }
                            }}
                          >{allOn ? (de ? "Alle abwählen" : "Unselect all") : (de ? "Alle" : "All")}</button>
                        );
                      })()}
                      <button
                        className="text-muted-foreground hover:underline"
                        onClick={() => setReportFwSelection({})}
                      >{de ? "Keine" : "None"}</button>
                    </div>
                    <div className="max-h-56 overflow-auto space-y-1.5 pr-1">
                      {tabFrameworks.map(fw => {
                        const meta = FRAMEWORK_LABELS[fw] ?? { de: fw, en: fw, short: fw };
                        const checked = !!reportFwSelection[fw];
                        return (
                          <label key={fw} className="flex items-center gap-2 text-[11.5px] cursor-pointer hover:bg-muted/40 rounded px-1 py-1">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => setReportFwSelection(prev => ({ ...prev, [fw]: !!v }))}
                            />
                            <span>{de ? meta.de : meta.en}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-border pt-2 space-y-2">
                    <div>
                      <label className="text-[11px] font-semibold text-foreground mb-1 block">
                        {de ? "Bericht erstellt von" : "Report prepared by"}
                        <span className="text-muted-foreground font-normal ml-1">({de ? "optional" : "optional"})</span>
                      </label>
                      <select
                        value={preparedBy}
                        onChange={(e) => setPreparedBy(e.target.value)}
                        className="w-full h-8 text-[11.5px] rounded border border-border bg-background px-2"
                      >
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
                      <select
                        value={classification}
                        onChange={(e) => setClassification(e.target.value)}
                        className="w-full h-8 text-[11.5px] rounded border border-border bg-background px-2"
                      >
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
                  </div>
                  <div className="border-t border-border pt-2">
                    <div className="text-[11px] font-semibold text-foreground mb-1.5">
                      {de ? "Format" : "Format"}
                    </div>
                    {(() => {
                      const selected = tabFrameworks.filter(fw => reportFwSelection[fw]);
                      const disabled = selected.length === 0;
                      const buildPayload = () => selected.map(fw => ({
                        framework: fw,
                        controls: controlsByFramework.get(fw) ?? [],
                        effective: effectiveByFramework.get(fw) ?? new Map(),
                        // Y7: Der Bericht zeigt denselben Abweichungsgrad wie der
                        // Bildschirm — inklusive der Kennzeichnung, ob es ein
                        // Prüferentscheid oder noch ein Katalogvorschlag ist.
                        severity: severityByFramework.get(fw),
                      }));
                      const commonMeta = { authorName: preparedBy, classification, mode: assessmentMode };
                      return (
                        <div className="grid grid-cols-3 gap-1.5">
                          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" disabled={disabled}
                            onClick={() => exportGapReportPdf({ frameworks: buildPayload(), de, ...commonMeta, inventory })}>
                            <FileDown className="h-3 w-3" /> PDF
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" disabled={disabled}
                            onClick={() => exportGapReportDocx({ frameworks: buildPayload(), de, ...commonMeta, inventory })}>
                            <FileText className="h-3 w-3" /> Word
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1" disabled={disabled}
                            onClick={() => exportGapReportXlsx({ frameworks: buildPayload(), de, ...commonMeta, inventory })}>
                            <FileSpreadsheet className="h-3 w-3" /> Excel
                          </Button>
                        </div>
                      );
                    })()}
                    {tabFrameworks.filter(fw => reportFwSelection[fw]).length === 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        {de ? "Bitte mindestens ein Framework wählen." : "Please select at least one framework."}
                      </p>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] gap-1">
              <Link to="/context">
                {de ? "In Scope ändern" : "Change in Scope"} <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>

          </div>
        )}

        {isBusy && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> {de ? "Laden …" : "Loading …"}
          </div>
        )}

        {!isBusy && enabledFrameworks.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              {de
                ? "Sie haben in Phase 1 noch keine Frameworks aktiviert. Wählen Sie in Scope die relevanten Frameworks (ISO 27001, NIS2, BSI, DORA, …) — die Auswahl greift sofort."
                : "You haven't activated any frameworks in Phase 1 yet. Pick your relevant frameworks (ISO 27001, NIS2, BSI, DORA, …) in Scope — the choice applies instantly."}
            </p>
            <Button asChild size="sm" className="gap-1">
              <Link to="/scope">
                {de ? "Zu Scope" : "Go to Scope"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}


        {!isBusy && tabFrameworks.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="__overview__" className="gap-2">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>{de ? "Alle" : "All"}</span>
              </TabsTrigger>
              {tabFrameworks.map(fw => {
                const meta = FRAMEWORK_LABELS[fw] ?? { de: fw, en: fw, short: fw };
                const s = computeStats(controlsByFramework.get(fw) ?? [], effectiveByFramework.get(fw) ?? new Map());
                return (
                  <TabsTrigger key={fw} value={fw} className="gap-2">
                    <span>{meta.short}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5">{s.compliancePct}%</Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="__overview__" className="mt-4">
              <AssessmentOverviewPanel
                de={de}
                onSelectFramework={setActiveTab}
                onOpenControl={openControl}
                frameworks={tabFrameworks.map(fw => {
                  const list = controlsByFramework.get(fw) ?? [];
                  const eff = effectiveByFramework.get(fw) ?? new Map();
                  const meta = FRAMEWORK_LABELS[fw] ?? { short: fw };
                  return {
                    framework: fw,
                    shortLabel: meta.short,
                    controls: list,
                    effective: eff,
                    stats: computeStats(list, eff),
                  };
                })}
              />
            </TabsContent>

            {tabFrameworks.map(fw => {
              const list = controlsByFramework.get(fw) ?? [];
              const eff = effectiveByFramework.get(fw) ?? new Map();
              const stats = computeStats(list, eff);
              return (
                <TabsContent key={fw} value={fw} className="mt-4 space-y-4">
                  {/* Reifegrad-Übersicht ist eine detaillierte analytische Ansicht →
                      nur im Detail-Modus. Überblick bleibt schlank (schnelles
                      Bewerten je Baustein). Macht den Modus-Umschalter sichtbar wirksam. */}
                  {assessmentMode === "expert" && (
                    <MaturityPanel
                      framework={fw}
                      controls={list}
                      effective={eff}
                      usesMaturity={!!maturityFlags[fw]}
                      de={de}
                    />
                  )}
                  <AssessmentPanel
                    framework={fw}
                    controls={list}
                    effective={eff}
                    stats={stats}
                    de={de}
                    usesMaturity={!!maturityFlags[fw]}
                    onSetStatus={(id, s) => handleSet(fw, id, s)}
                    onSetNote={(id, v) => handleNote(fw, id, v)}
                    onSetReifegrad={(id, r) => handleReifegrad(fw, id, r)}
                    onBulkStatus={(ids, s, note) => handleBulk(fw, ids, s, note)}
                    mode={assessmentMode}
                    focus={focus && focus.fw === fw ? { controlId: focus.controlId, nonce: focus.nonce } : undefined}
                    assets={inventory.assets}
                    getAssetEffective={(control, assetId, orgEffective) => buildAssetEffective(fw, control, assetId, orgEffective)}
                    isAssetOverride={(controlId, assetId) => !!answers[answerKey(fw, controlId, assetId)]?.antwort}
                    onSetAssetStatus={(controlId, assetId, s) => handleAssetStatus(fw, controlId, assetId, s)}
                    onSetAssetReifegrad={(controlId, assetId, r) => handleAssetReifegrad(fw, controlId, assetId, r)}
                    healthByControl={healthByControl}
                    severityByControl={severityByFramework.get(fw)}
                    onSetSeverity={(id, v, note) => handleSeverity(fw, id, v, note)}
                    coverageByControl={(id) => decisionFor(fw, id)}
                    onSetCoverage={(id, d, detail) => {
                      const src = eff.get(id)?.scopeReviewFrom;
                      void saveDecision(fw, id, d, {
                        sourceFramework: src?.framework ?? null,
                        sourceControlId: src?.controlId ?? null,
                        ...detail,
                      });
                    }}
                  />
                </TabsContent>
              );
            })}

          </Tabs>
        )}

      </main>
    </div>
  );
};

export default Assessment;
