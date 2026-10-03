/**
 * TreatmentTable — Phase 4 Risk Treatment editor.
 *
 * Groups risks by root cause (gap_title + capability + scope), one row per
 * group. Each row exposes: strategy, owner, due-date, status,
 * justification and the auto-suggested control list (chips). Persistence
 * happens via a `useToolData` state object passed from Risk.tsx — this
 * component is purely presentational + change callbacks.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { ListPlus, Search, ChevronsDownUp, ChevronsUpDown, AlertTriangle, ShieldCheck, Wand2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PersonSelect from "@/components/PersonSelect";
import { type PersonnelRegistry, type Person } from "@/lib/personnel";
import {
  riskLevelLabel, validateAcceptance, scoreAndLevel, DEFAULT_RISK_CONFIG,
  type RiskObject, type RiskLevel, type RiskMatrixConfig,
} from "@/lib/riskEngine";
import {
  STRATEGY_OPTIONS, STATUS_OPTIONS,
  getTreatmentPriority, priorityColor,
  suggestResidualLI, effectiveResidualLI, acceptanceGateStatus, ACCEPTANCE_MIN_CHARS,
  type TreatmentObject, type TreatmentStrategy, type TreatmentStatus,
  type ControlSelectionEntry, type CustomControl,
} from "@/lib/treatmentEngine";
import {
  groupRisks, friendlyRiskLabel,
  suggestOwnerRole, suggestDueDate, suggestStrategy,
} from "@/lib/treatmentQuickWins";
import { ControlPicker } from "./ControlPicker";
import { ScenarioList } from "@/components/risk/ScenarioList";
import { isoRef } from "@/data/isoAnnexMap";

/** Anzeige-ID (nur Darstellung): ISO 27001 → „A.5.1 · a5-04" — die interne Prüffragen-Nummer
 *  ist KEINE Annex-Nummer; andere Frameworks unverändert. */
function displayControlId(framework: string, nativeId: string): string {
  if (framework !== "ISO27001") return nativeId;
  const ref = isoRef(nativeId);
  return ref === nativeId ? nativeId : `${ref} · ${nativeId}`;
}

type GroupByDim = "none" | "priority" | "risk_level" | "strategy" | "status";

interface Props {
  risks: RiskObject[];
  treatments: TreatmentObject[];
  controlList: ControlSelectionEntry[];
  /** Consolidated gaps — used by the picker for coverage + "Nach Gap" grouping. */
  gaps?: Array<{ gap_id: string; title: string; title_en: string; severity: string }>;
  personnel: PersonnelRegistry;
  de: boolean;
  onChange: (t: TreatmentObject) => void;
  onFillAllDefaults: () => void;
  /**
   * ITEM 16 — optional, config-gated acceptance gate. Undefined (default) keeps
   * today's behavior; when set, "accept" on high-enough risks warns about
   * mandatory justification/owner.
   */
  acceptanceGate?: { acceptance_gate?: boolean; acceptance_max_level?: RiskLevel };
  /** Deep-Link aus „Top-Risiken": diese Risiko-ID aufklappen, hinscrollen, hervorheben. */
  focusRiskId?: string | null;
  /** P4.B.2 — Matrix-Konfiguration der Analyse (gleiche Formel/Schwellen für das Restrisiko). */
  config?: RiskMatrixConfig;
  /** Manuelle Zellfarben der Analyse-Matrix (`${l}-${i}` → Stufe), damit Rest-Stufe identisch klassifiziert. */
  cellOverrides?: Record<string, RiskLevel>;
  /** Appetit-Prüfung der Analyse (Restrisiko „über Appetit"). */
  isOverAppetite?: (l: number, i: number, level: RiskLevel) => boolean;
  /** „+ Neue Person" im PersonSelect schreibt ins zentrale Personen-Register. */
  onAddPerson?: (p: Person) => void;
}

export function TreatmentTable({
  risks, treatments, controlList, gaps = [], personnel, de, onChange, onFillAllDefaults,
  acceptanceGate, focusRiskId = null, config = DEFAULT_RISK_CONFIG, cellOverrides = {},
  isOverAppetite, onAddPerson = () => {},
}: Props) {
  const dims = config.dimensions ?? { rows: 5, cols: 5 };
  const people = personnel.people ?? [];
  const today = new Date().toISOString().slice(0, 10);
  /** Rest-Score/-Stufe wie in der Analyse (inkl. manueller Zellfarben). */
  const residualOf = (l: number, i: number) => {
    const s = scoreAndLevel(l, i, config);
    const ov = cellOverrides[`${s.likelihood}-${s.impact}`];
    return { ...s, level: ov ?? s.level };
  };
  const levelTone = (lvl: RiskLevel) =>
    lvl === "critical" ? "bg-destructive/85 text-destructive-foreground"
    : lvl === "high" ? "bg-destructive/50 text-destructive-foreground"
    : lvl === "medium" ? "st-teilweise-bg text-white" : "st-ja-bg text-white";
  const groups = useMemo(() => groupRisks(risks), [risks]);
  const treatmentMap = useMemo(
    () => new Map(treatments.map(t => [t.risk_id, t])),
    [treatments],
  );
  const controlTitleMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of controlList) {
      m.set(c.control_id, de ? c.control_title : c.control_title_en);
    }
    // Also include user-defined custom controls from all treatments
    for (const t of treatments) {
      for (const cc of t.custom_controls ?? []) {
        m.set(cc.id, de ? cc.question : cc.questionEn);
      }
    }
    return m;
  }, [controlList, treatments, de]);

  const controlBadgeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of controlList) {
      m.set(c.control_id, `${c.framework_label} · ${displayControlId(c.framework, c.native_control_id)}`);
    }
    for (const t of treatments) {
      for (const cc of t.custom_controls ?? []) m.set(cc.id, cc.id);
    }
    return m;
  }, [controlList, treatments]);

  /** Detail lookup for the selected-controls list: framework, native id, title. */
  const controlDetailMap = useMemo(() => {
    const m = new Map<string, { framework: string; nativeId: string; title: string; isCustom: boolean }>();
    for (const c of controlList) {
      m.set(c.control_id, {
        framework: c.framework_label,
        nativeId: displayControlId(c.framework, c.native_control_id),
        title: de ? c.control_title : c.control_title_en,
        isCustom: false,
      });
    }
    for (const t of treatments) {
      for (const cc of t.custom_controls ?? []) {
        m.set(cc.id, {
          framework: de ? "Eigen" : "Custom",
          nativeId: cc.id,
          title: de ? cc.question : cc.questionEn,
          isCustom: true,
        });
      }
    }
    return m;
  }, [controlList, treatments, de]);

  /** Map risk_id → set of control_ids that came from gap findings (highlighted). */
  const gapControlsByRisk = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of controlList) {
      for (const rid of c.mitigated_risk_ids) {
        if (!m.has(rid)) m.set(rid, new Set());
        m.get(rid)!.add(c.control_id);
      }
    }
    return m;
  }, [controlList]);

  /** Map risk_id → gap picker info (only gaps addressed by mapped controls). */
  const gapsByRisk = useMemo(() => {
    const gapMap = new Map(gaps.map(g => [g.gap_id, g]));
    const byRisk = new Map<string, Array<{ gap_id: string; title: string; is_muss: boolean }>>();
    for (const c of controlList) {
      for (const rid of c.mitigated_risk_ids) {
        if (!byRisk.has(rid)) byRisk.set(rid, []);
        const bucket = byRisk.get(rid)!;
        for (const gid of c.linked_gap_ids) {
          if (bucket.some(g => g.gap_id === gid)) continue;
          const g = gapMap.get(gid);
          if (!g) continue;
          bucket.push({
            gap_id: g.gap_id,
            title: de ? g.title : g.title_en,
            is_muss: g.severity === "critical" || g.severity === "high",
          });
        }
      }
    }
    return byRisk;
  }, [controlList, gaps, de]);


  // ---- Filter + Grouping state ------------------------------------------------
  const [search, setSearch] = useState("");
  const [fStrategy, setFStrategy] = useState<string>("__all");
  const [fStatus, setFStatus] = useState<string>("__all");
  const [fLevel, setFLevel] = useState<string>("__all");
  const [fPriority, setFPriority] = useState<string>("__all");
  const [groupBy, setGroupBy] = useState<GroupByDim>("priority");
  const [openItems, setOpenItems] = useState<string[]>([]);
  // Fokus-Risiko (Klick in „Top-Risiken"): Gruppe öffnen + hinscrollen.
  const focusKey = useMemo(() => {
    if (!focusRiskId) return null;
    const g = groups.find(gr => gr.members.some(mm => mm.risk_id === focusRiskId));
    return g ? g.key : null;
  }, [groups, focusRiskId]);
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focusKey) return;
    setOpenItems(prev => (prev.includes(focusKey) ? prev : [...prev, focusKey]));
    const t = setTimeout(() => focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
    return () => clearTimeout(t);
  }, [focusKey]);

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {de
          ? "Keine Risiken zur Behandlung — führen Sie zuerst die Gap-Analyse (Phase 3) durch."
          : "No risks to treat — complete the Gap Analysis (Phase 3) first."}
      </div>
    );
  }

  // Enrich groups with their treatment + derived values used for filtering/grouping
  const enriched = groups
    .map(group => {
      const primary = group.primary;
      const treatment = treatmentMap.get(primary.risk_id);
      if (!treatment) return null;
      return {
        group, primary, treatment,
        priority: getTreatmentPriority(primary),
      };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const filtered = enriched.filter(({ primary, treatment, priority, group }) => {
    if (fStrategy !== "__all" && treatment.strategy !== fStrategy) return false;
    if (fStatus !== "__all" && treatment.status !== fStatus) return false;
    if (fLevel !== "__all" && primary.risk_level !== fLevel) return false;
    if (fPriority !== "__all" && priority !== fPriority) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = [
        friendlyRiskLabel(primary, de ? "de" : "en"),
        ...group.affectedAssets,
        treatment.justification,
        treatment.owner,
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Group by chosen dimension
  const groupKey = (e: typeof enriched[number]): string => {
    switch (groupBy) {
      case "priority": return e.priority;
      case "risk_level": return riskLevelLabel(e.primary.risk_level, de ? "de" : "en").toUpperCase();
      case "strategy": {
        const o = STRATEGY_OPTIONS.find(o => o.value === e.treatment.strategy);
        return o ? (de ? o.labelDe : o.labelEn) : e.treatment.strategy;
      }
      case "status": {
        const o = STATUS_OPTIONS.find(o => o.value === e.treatment.status);
        return o ? (de ? o.labelDe : o.labelEn) : e.treatment.status;
      }
      default: return "";
    }
  };

  const sections = new Map<string, typeof filtered>();
  for (const e of filtered) {
    const k = groupKey(e);
    if (!sections.has(k)) sections.set(k, []);
    sections.get(k)!.push(e);
  }

  const allItemIds = filtered.map(e => e.group.key);
  const allOpen = openItems.length === allItemIds.length && allItemIds.length > 0;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-muted-foreground">
            {de
              ? `${filtered.length} von ${enriched.length} Risikogruppen · ${risks.length} Einzelrisiken`
              : `${filtered.length} of ${enriched.length} risk groups · ${risks.length} individual risks`}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" variant="ghost" className="h-7 text-[11px] gap-1"
              onClick={() => setOpenItems(allOpen ? [] : allItemIds)}
            >
              {allOpen
                ? <><ChevronsDownUp className="h-3 w-3" />{de ? "Alle einklappen" : "Collapse all"}</>
                : <><ChevronsUpDown className="h-3 w-3" />{de ? "Alle ausklappen" : "Expand all"}</>}
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onFillAllDefaults}>
              {de ? "Alle Standardwerte übernehmen" : "Apply all defaults"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <div className="col-span-2 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={de ? "Suche: Risiko, Asset, Owner…" : "Search: risk, asset, owner…"}
              className="h-8 pl-7 text-xs"
            />
          </div>
          <Select value={fPriority} onValueChange={setFPriority}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={de ? "Priorität" : "Priority"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all" className="text-xs">{de ? "Alle Prioritäten" : "All priorities"}</SelectItem>
              {["P1","P2","P3","P4"].map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fLevel} onValueChange={setFLevel}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={de ? "Risikostufe" : "Risk level"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all" className="text-xs">{de ? "Alle Stufen" : "All levels"}</SelectItem>
              {["critical","high","medium","low"].map(l => (
                <SelectItem key={l} value={l} className="text-xs">
                  {riskLevelLabel(l as RiskObject["risk_level"], de ? "de" : "en")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fStrategy} onValueChange={setFStrategy}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={de ? "Strategie" : "Strategy"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all" className="text-xs">{de ? "Alle Strategien" : "All strategies"}</SelectItem>
              {STRATEGY_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {de ? o.labelDe : o.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all" className="text-xs">{de ? "Alle Status" : "All statuses"}</SelectItem>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {de ? o.labelDe : o.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{de ? "Gruppieren nach:" : "Group by:"}</span>
          <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupByDim)}>
            <SelectTrigger className="h-7 text-xs w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="priority" className="text-xs">{de ? "Priorität" : "Priority"}</SelectItem>
              <SelectItem value="risk_level" className="text-xs">{de ? "Risikostufe" : "Risk level"}</SelectItem>
              <SelectItem value="strategy" className="text-xs">{de ? "Strategie" : "Strategy"}</SelectItem>
              <SelectItem value="status" className="text-xs">Status</SelectItem>
              <SelectItem value="none" className="text-xs">{de ? "Keine Gruppierung" : "No grouping"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6 text-center text-xs text-muted-foreground">
          {de ? "Keine Treffer für die aktuellen Filter." : "No matches for current filters."}
        </div>
      )}

      {/* Sections */}
      {Array.from(sections.entries()).map(([sectionLabel, items]) => (
        <div key={sectionLabel || "all"} className="space-y-2">
          {groupBy !== "none" && (
            <div className="flex items-center gap-2 pt-1">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wide">
                {sectionLabel}
              </div>
              <div className="h-px flex-1 bg-border" />
              <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
            </div>
          )}

          <Accordion
            type="multiple"
            value={openItems}
            onValueChange={setOpenItems}
            className="space-y-2"
          >
            {items.map(({ group, primary, treatment, priority }) => {
              const strategyHint = suggestStrategy(primary);
              const ownerHint = suggestOwnerRole(primary, de ? "de" : "en");
              const dueHint = suggestDueDate(primary);
              const memberCount = group.members.length;
              const isManual = primary.risk_source === "manual";
              // P4.B.3 · Akzeptanz-Gate (Strategie „Akzeptieren" bei Stufe ≥ Hoch)
              const gate = acceptanceGateStatus(primary, treatment);
              const gateBlocksDone = gate.required && !gate.ok;
              // P4.B.2 · Restrisiko
              const eff = effectiveResidualLI(primary, treatment);
              const residual = residualOf(eff.likelihood, eff.impact);
              const residualOver = isOverAppetite ? isOverAppetite(residual.likelihood, residual.impact, residual.level) : false;
              const suggestion = suggestResidualLI(treatment.strategy, primary.likelihood, primary.impact, treatment.selected_control_ids.length);
              const suggestionDiffers = suggestion.likelihood !== eff.likelihood || suggestion.impact !== eff.impact;

              return (
                <AccordionItem
                  key={group.key}
                  value={group.key}
                  ref={group.key === focusKey ? focusRef : undefined}
                  className={`rounded-lg border bg-card px-3 data-[state=open]:shadow-sm ${
                    group.key === focusKey ? "border-accent ring-2 ring-accent/60" : "border-border"
                  }`}
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-start gap-3 w-full pr-2 text-left">
                      {/* Left meta column */}
                      <div className="flex flex-col gap-1 flex-shrink-0 pt-0.5">
                        <Badge variant="outline" className={`text-[10px] w-fit ${priorityColor(priority)}`}>{priority}</Badge>
                        <Badge variant="outline" className="text-[10px] w-fit">
                          {riskLevelLabel(primary.risk_level, de ? "de" : "en").toUpperCase()}
                        </Badge>
                      </div>

                      {/* Title + subline (full width, wraps, never truncates) */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-sm font-semibold text-foreground leading-snug whitespace-normal break-words">
                          {friendlyRiskLabel(primary, de ? "de" : "en")}
                          {isManual && (
                            <Badge variant="outline" className="ml-1.5 align-middle text-[9px] st-teilweise-tint st-teilweise-border st-teilweise-text">
                              {de ? "manuell" : "manual"}
                            </Badge>
                          )}
                          {primary.risk_overridden && (
                            <Badge variant="outline" className="ml-1.5 align-middle text-[9px] border-copper/60 text-copper">
                              {de ? "L/I manuell angepasst" : "L/I manually adjusted"}
                            </Badge>
                          )}
                          {gateBlocksDone && (
                            <Badge variant="outline" className="ml-1.5 align-middle text-[9px] border-destructive/60 text-destructive">
                              {de ? "Akzeptanz unvollständig" : "Acceptance incomplete"}
                            </Badge>
                          )}
                        </div>
                        {primary.scenarios?.length > 0 && (
                          // Zugeklappt: 2 Zeilen als Teaser. Aufgeklappt: Volltext im Inhalt („Was droht konkret").
                          <div className={`text-xs text-foreground/85 leading-snug whitespace-normal break-words ${openItems.includes(group.key) ? "" : "line-clamp-2"}`}>
                            {de ? primary.scenarios[0].text_de : primary.scenarios[0].text_en}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground leading-snug whitespace-normal break-words">
                          {group.affectedAssets.length > 0
                            ? (de ? "Assets: " : "Assets: ") +
                              group.affectedAssets.slice(0, 3).join(", ") +
                              (group.affectedAssets.length > 3 ? ` +${group.affectedAssets.length - 3}` : "")
                            : (primary.scope === "organization"
                                ? (de ? "Organisationsweit" : "Organization-wide")
                                : (de ? "Kein Asset zugeordnet" : "No asset assigned"))}
                          <span className="mx-1.5">·</span>
                          Score {primary.risk_score}
                          {memberCount > 1 && (
                            <>
                              <span className="mx-1.5">·</span>
                              {memberCount} {de ? "gleichartige Risiken" : "similar risks"}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right status badges */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 pt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {STRATEGY_OPTIONS.find(o => o.value === treatment.strategy)?.[de ? "labelDe" : "labelEn"] ?? treatment.strategy}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {treatment.selected_control_ids.length} {de ? "Kontrollen" : "controls"}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>


                  <AccordionContent className="pb-3">
                    <div className="space-y-3">
                      {primary.scenarios?.length > 0 && (
                        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {de ? "Was droht konkret" : "What is concretely at stake"}
                            <span className="ml-2 font-normal normal-case">{primary.scenarios.length} {de ? "Szenarien" : "scenarios"}</span>
                          </div>
                          <ScenarioList scenarios={primary.scenarios} de={de} max={6}
                            moreHint={de ? `+ ${primary.scenarios.length - 6} weitere Szenarien in der Analyse` : `+ ${primary.scenarios.length - 6} more scenarios in the analysis`} />
                        </div>
                      )}
                      {group.affectedAssets.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[11px] text-muted-foreground">
                            {de ? "Betroffene Assets:" : "Affected assets:"}
                          </span>
                          {group.affectedAssets.slice(0, 6).map(a => (
                            <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                          ))}
                          {group.affectedAssets.length > 6 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{group.affectedAssets.length - 6}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Row grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Strategy */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">
                            {de ? "Strategie" : "Strategy"}
                          </label>
                          <Select
                            value={treatment.strategy}
                            onValueChange={v => {
                              const next: TreatmentObject = { ...treatment, strategy: v as TreatmentStrategy };
                              // P4.B.3 — Wechsel auf „Akzeptieren" bei Stufe ≥ Hoch ohne vollständige
                              // Akzeptanz: „Abgeschlossen" ist nicht haltbar → zurück auf „In Bearbeitung".
                              const g = acceptanceGateStatus(primary, next);
                              if (next.status === "done" && g.required && !g.ok) next.status = "in_progress";
                              onChange(next);
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STRATEGY_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">
                                  {de ? o.labelDe : o.labelEn}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {strategyHint && strategyHint !== treatment.strategy && (
                            <div className="text-[10px] text-muted-foreground">
                              {de ? "Vorschlag:" : "Suggestion:"}{" "}
                              <span className="font-medium">
                                {STRATEGY_OPTIONS.find(o => o.value === strategyHint)?.[de ? "labelDe" : "labelEn"]}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Owner & Due date moved to Roadmap phase */}
                        <div className="col-span-1 md:col-span-2 rounded-md border border-dashed border-border/50 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                          {de
                            ? "Verantwortliche Person und Fälligkeitsdatum werden in der Roadmap-Phase gepflegt."
                            : "Owner and due date are managed in the Roadmap phase."}
                          <div className="text-[10px] mt-0.5">
                            {de ? "Empfohlene Rolle:" : "Recommended role:"} <span className="font-medium">{ownerHint}</span>
                            {" · "}
                            {de ? "Empfohlenes Datum:" : "Recommended date:"} <span className="font-medium">{dueHint}</span>
                          </div>
                        </div>



                        {/* Status */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-foreground">Status</label>
                          <Select
                            value={treatment.status}
                            onValueChange={v => {
                              // P4.B.3 — „Abgeschlossen" ist bei unvollständiger Akzeptanz gesperrt.
                              if (v === "done" && gateBlocksDone) return;
                              onChange({ ...treatment, status: v as TreatmentStatus });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value} className="text-xs"
                                            disabled={o.value === "done" && gateBlocksDone}>
                                  {de ? o.labelDe : o.labelEn}
                                  {o.value === "done" && gateBlocksDone ? (de ? " — gesperrt (Akzeptanz unvollständig)" : " — locked (acceptance incomplete)") : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* P4.B.3 — Akzeptanz-Gate: Pflichtfelder bei „Akzeptieren" ≥ Hoch */}
                      {gate.required && (
                        <div className={`rounded-lg border p-3 space-y-2 ${gate.ok
                          ? "st-ja-border st-ja-tint"
                          : "border-destructive/50 bg-destructive/5"}`}>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            {gate.ok
                              ? <><ShieldCheck className="h-3.5 w-3.5 st-ja-text" /><span className="text-foreground">{de ? "Risikoakzeptanz dokumentiert" : "Risk acceptance documented"}</span></>
                              : <><AlertTriangle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{de ? "Akzeptanz unvollständig — Begründung/Freigabe fehlt" : "Acceptance incomplete — justification/approval missing"}</span></>}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {de
                              ? `Ein Risiko der Stufe „${riskLevelLabel(primary.risk_level, "de")}" darf nur mit Begründung (≥ ${ACCEPTANCE_MIN_CHARS} Zeichen), Freigeber und Datum akzeptiert werden. Bis dahin ist der Status „Abgeschlossen" gesperrt.`
                              : `A "${riskLevelLabel(primary.risk_level, "en")}" risk may only be accepted with a justification (≥ ${ACCEPTANCE_MIN_CHARS} chars), an approver and a date. Until then the status "Done" is locked.`}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground">
                              {de ? "Begründung der Akzeptanz *" : "Acceptance justification *"}
                              <span className={`ml-1 font-normal ${gate.missing.includes("justification") ? "text-destructive" : "text-muted-foreground"}`}>
                                ({(treatment.acceptance_justification ?? "").trim().length}/{ACCEPTANCE_MIN_CHARS})
                              </span>
                            </label>
                            <Textarea
                              value={treatment.acceptance_justification ?? ""}
                              onChange={e => onChange({ ...treatment, acceptance_justification: e.target.value })}
                              rows={2}
                              className={`text-xs ${gate.missing.includes("justification") ? "border-destructive/60" : ""}`}
                              placeholder={de
                                ? "Warum wird dieses Risiko bewusst getragen? (Kosten/Nutzen, kompensierende Maßnahmen, Zeitraum …)"
                                : "Why is this risk consciously borne? (cost/benefit, compensating controls, time frame …)"}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-foreground">{de ? "Freigeber *" : "Approver *"}</label>
                              <PersonSelect
                                value={treatment.acceptance_approver ?? ""}
                                onChange={v => onChange({ ...treatment, acceptance_approver: v || null })}
                                people={people} onAddPerson={onAddPerson} de={de}
                                className={gate.missing.includes("approver") ? "rounded-md ring-1 ring-destructive/60" : ""}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-foreground">{de ? "Freigabedatum *" : "Approval date *"}</label>
                              <div className="flex items-center gap-1">
                                <Input type="date" value={treatment.acceptance_date ?? ""}
                                       onChange={e => onChange({ ...treatment, acceptance_date: e.target.value || null })}
                                       className={`h-8 text-xs ${gate.missing.includes("date") ? "border-destructive/60" : ""}`} />
                                {!treatment.acceptance_date && (
                                  <Button type="button" size="sm" variant="ghost" className="h-8 text-[11px] px-2"
                                          onClick={() => onChange({ ...treatment, acceptance_date: today })}>
                                    {de ? "Heute" : "Today"}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* P4.B.2 / US4.5 — Restrisiko nach Behandlung */}
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {de ? "Restrisiko nach Behandlung" : "Residual risk after treatment"}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {de ? "Ausgangswert:" : "Inherent:"} L {primary.likelihood} × I {primary.impact} = {primary.risk_score}
                          </span>
                          <span className="ml-auto flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px]">
                              {de ? "Rest-Score" : "Residual score"} {residual.score}
                            </Badge>
                            <Badge className={`${levelTone(residual.level)} text-[10px]`}>
                              {riskLevelLabel(residual.level, de ? "de" : "en").toUpperCase()}
                            </Badge>
                            {isOverAppetite && (
                              <Badge variant="outline" className={`text-[10px] ${residualOver ? "border-destructive/60 text-destructive" : "st-ja-border st-ja-text"}`}>
                                {residualOver ? (de ? "über Appetit" : "over appetite") : (de ? "im Appetit" : "within appetite")}
                              </Badge>
                            )}
                            {!eff.captured && (
                              <span className="text-[10px] text-muted-foreground italic">
                                {de ? "(noch nicht erfasst = Ausgangswert)" : "(not captured yet = inherent)"}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-end">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground">{de ? "Rest-L" : "Residual L"}</label>
                            <select value={eff.likelihood}
                                    onChange={e => onChange({ ...treatment, residual_likelihood: Number(e.target.value), residual_impact: eff.impact })}
                                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground">
                              {Array.from({ length: dims.cols }, (_, k) => k + 1).map(v => (
                                <option key={v} value={v}>{v}{v === primary.likelihood ? (de ? " (Ausgang)" : " (inherent)") : ""}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground">{de ? "Rest-I" : "Residual I"}</label>
                            <select value={eff.impact}
                                    onChange={e => onChange({ ...treatment, residual_impact: Number(e.target.value), residual_likelihood: eff.likelihood })}
                                    className="w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground">
                              {Array.from({ length: dims.rows }, (_, k) => k + 1).map(v => (
                                <option key={v} value={v}>{v}{v === primary.impact ? (de ? " (Ausgang)" : " (inherent)") : ""}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <div className="text-[11px] text-muted-foreground">
                              {de ? "Vorschlag aus Strategie:" : "Suggestion from strategy:"}{" "}
                              <span className="font-medium text-foreground">L {suggestion.likelihood} × I {suggestion.impact}</span>
                              <span className="ml-1">
                                ({treatment.strategy === "avoid" ? (de ? "vermeiden → L 1" : "avoid → L 1")
                                  : treatment.strategy === "mitigate" ? (de ? `mindern → L − 1 je 3 Kontrollen (${treatment.selected_control_ids.length} gewählt)` : `mitigate → L − 1 per 3 controls (${treatment.selected_control_ids.length} selected)`)
                                  : treatment.strategy === "transfer" ? (de ? "übertragen → I − 1" : "transfer → I − 1")
                                  : (de ? "akzeptieren → unverändert" : "accept → unchanged")})
                              </span>
                            </div>
                            <Button type="button" size="sm" variant="outline" className="h-7 text-[11px] gap-1"
                                    disabled={!suggestionDiffers}
                                    onClick={() => onChange({ ...treatment, residual_likelihood: suggestion.likelihood, residual_impact: suggestion.impact })}>
                              <Wand2 className="h-3 w-3" />
                              {de ? "Vorschlag übernehmen" : "Apply suggestion"}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground">{de ? "Restrisiko akzeptiert von" : "Residual risk accepted by"}</label>
                            <PersonSelect
                              value={treatment.residual_accepted_by ?? ""}
                              onChange={v => onChange({ ...treatment, residual_accepted_by: v || null, residual_accepted_at: treatment.residual_accepted_at ?? (v ? today : null) })}
                              people={people} onAddPerson={onAddPerson} de={de}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-foreground">{de ? "Datum" : "Date"}</label>
                            <Input type="date" value={treatment.residual_accepted_at ?? ""}
                                   onChange={e => onChange({ ...treatment, residual_accepted_at: e.target.value || null })}
                                   className="h-8 text-xs" />
                          </div>
                        </div>
                      </div>

                      {/* Selected controls + picker */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-semibold text-foreground">
                            {de ? "Vorgeschlagene Kontrollen" : "Suggested controls"}
                            <span className="text-muted-foreground font-normal ml-1">
                              ({treatment.selected_control_ids.length})
                            </span>
                          </div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1">
                                <ListPlus className="h-3 w-3" />
                                {de ? "Aus Katalog wählen" : "Pick from catalog"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-[min(820px,calc(100vw-2rem))] p-3">
                              <ControlPicker
                                selected={treatment.selected_control_ids}
                                onChange={ids => onChange({ ...treatment, selected_control_ids: ids })}
                                controlCatalog={controlList}
                                gapControlIds={Array.from(gapControlsByRisk.get(primary.risk_id) ?? [])}
                                gaps={gapsByRisk.get(primary.risk_id) ?? []}
                                customControls={treatment.custom_controls ?? []}
                                onAddCustom={(entry: CustomControl) =>
                                  onChange({
                                    ...treatment,
                                    custom_controls: [...(treatment.custom_controls ?? []), entry],
                                  })
                                }
                                de={de}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        {treatment.selected_control_ids.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground italic">
                            {de
                              ? "Noch keine Kontrollen ausgewählt — öffnen Sie den Katalog."
                              : "No controls selected yet — open the catalog."}
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {treatment.selected_control_ids.map(cid => {
                              const d = controlDetailMap.get(cid);
                              const isGap = gapControlsByRisk.get(primary.risk_id)?.has(cid);
                              return (
                                <div
                                  key={cid}
                                  className={`flex items-start gap-2 p-2 rounded-lg border ${
                                    d?.isCustom
                                      ? "st-teilweise-tint/50 st-teilweise-border"
                                      : isGap
                                        ? "bg-primary/5 border-primary/20"
                                        : "bg-background border-border"
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Badge variant="outline" className="text-[9px] font-mono">
                                        {d?.framework ?? (de ? "Kontrolle" : "Control")}
                                      </Badge>
                                      <span className="text-[10px] font-mono text-muted-foreground">
                                        {d?.nativeId ?? cid}
                                      </span>
                                      {isGap && (
                                        <Badge variant="outline" className="text-[9px] bg-primary/10 border-primary/30 text-primary">
                                          Gap
                                        </Badge>
                                      )}
                                      {d?.isCustom && (
                                        <Badge variant="outline" className="text-[9px] st-teilweise-tint st-teilweise-border st-teilweise-text">
                                          {de ? "Manuell" : "Manual"}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-[11.5px] text-foreground leading-snug mt-0.5 break-words">
                                      {d?.title ?? controlTitleMap.get(cid) ?? cid}
                                    </div>
                                  </div>
                                  <Button
                                    type="button" size="sm" variant="ghost"
                                    className="h-6 w-6 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                    title={de ? "Kontrolle entfernen" : "Remove control"}
                                    onClick={() =>
                                      onChange({
                                        ...treatment,
                                        selected_control_ids: treatment.selected_control_ids.filter(x => x !== cid),
                                      })
                                    }
                                  >
                                    ×
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                      </div>

                      {/* ITEM 16 — acceptance-gate warning (only when a gate is configured) */}
                      {acceptanceGate && treatment.strategy === "accept" &&
                        !validateAcceptance(primary, treatment, acceptanceGate).ok && (
                        <div className="rounded-md border st-teilweise-border st-teilweise-tint px-3 py-2 text-[11px] st-teilweise-text">
                          {de
                            ? "Akzeptanz dieses Risikos erfordert eine Begründung und eine verantwortliche Person."
                            : "Accepting this risk requires a justification and an owner."}
                        </div>
                      )}

                      {/* Justification */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          {de ? "Begründung / Notizen" : "Justification / Notes"}
                        </label>
                        <Textarea
                          value={treatment.justification}
                          onChange={e => onChange({ ...treatment, justification: e.target.value })}
                          rows={2}
                          className="text-xs"
                          placeholder={
                            de
                              ? "z. B. Restrisiko akzeptiert wegen …, Kontrolle X übernommen aus …"
                              : "e.g. residual risk accepted because …, control X inherited from …"
                          }
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
