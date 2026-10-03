/**
 * ControlPicker — searchable NIS2/ISO control catalog picker with support
 * for user-defined custom controls. Used inside the risk treatment editor
 * so users can add controls beyond the auto-suggested ones.
 */
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, AlertTriangle, ChevronDown, ChevronRight, Plus, CheckSquare, Square, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { nis2Domains } from "@/data/nis2Controls";
import type { ControlSelectionEntry } from "@/lib/treatmentEngine";
import { cn } from "@/lib/utils";

export interface CustomControlEntry {
  id: string;
  question: string;
  questionEn: string;
}

/** Minimal gap info used for coverage stats and "Nach Gap" grouping. */
export interface PickerGapInfo {
  gap_id: string;
  title: string;
  /** Muss-Anforderung when severity is critical/high. */
  is_muss: boolean;
}


interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Full selectable control catalog from all enabled frameworks. */
  controlCatalog?: ControlSelectionEntry[];
  /** Control IDs derived from gap findings — highlighted as "Gap" */
  gapControlIds?: string[];
  /** Gaps addressed by this treatment — powers coverage line + "Nach Gap" view. */
  gaps?: PickerGapInfo[];
  customControls?: CustomControlEntry[];
  onAddCustom?: (entry: CustomControlEntry) => void;
  de?: boolean;
}

export function ControlPicker({
  selected, onChange,
  controlCatalog = [],
  gapControlIds = [], gaps = [], customControls = [], onAddCustom,
  de = true,
}: Props) {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeFrameworks, setActiveFrameworks] = useState<Set<string>>(new Set());
  const [customLabel, setCustomLabel] = useState("");
  const [groupMode, setGroupMode] = useState<"framework" | "gap">(gaps.length > 0 ? "gap" : "framework");

  const allControls = useMemo(() => {
    const catalog = controlCatalog.length > 0
      ? controlCatalog.map(c => ({
          id: c.control_id,
          nativeId: c.native_control_id,
          question: c.control_title,
          questionEn: c.control_title_en,
          description: c.control_description,
          descriptionEn: c.control_description_en,
          framework: c.framework,
          frameworkLabel: c.framework_label,
          domainId: `${c.framework}::${c.family_id}`,
          domain: c.family_id,
          isCustom: false,
          isSuggested: c.is_suggested,
          mitigatedRiskCount: c.mitigated_risk_count,
          linkedGapCount: c.linked_gap_ids.length,
          linkedGapIds: c.linked_gap_ids,
        }))
      : nis2Domains.flatMap(domain =>
          domain.categories.flatMap(cat =>
            cat.questions.map(q => ({
              id: q.id,
              nativeId: q.id,
              question: q.question,
              questionEn: q.questionEn,
              description: q.description,
              descriptionEn: q.descriptionEn,
              framework: "NIS2",
              frameworkLabel: "NIS2",
              domainId: `NIS2::${domain.id}`,
              domain: de ? domain.titleDe : domain.title,
              isCustom: false,
              isSuggested: gapControlIds.includes(q.id),
              mitigatedRiskCount: 0,
              linkedGapCount: 0,
              linkedGapIds: [] as string[],
            })),
          ),
        );
    const custom = customControls.map(c => ({
      id: c.id,
      nativeId: c.id,
      question: c.question,
      questionEn: c.questionEn,
      description: c.question,
      descriptionEn: c.questionEn,
      framework: "__custom__",
      frameworkLabel: de ? "Eigene" : "Custom",
      domainId: "__custom__",
      domain: de ? "Benutzerdefiniert" : "Custom",
      isCustom: true,
      isSuggested: false,
      mitigatedRiskCount: 0,
      linkedGapCount: 0,
      linkedGapIds: [] as string[],
    }));
    return [...catalog, ...custom];
  }, [controlCatalog, customControls, de, gapControlIds]);

  const frameworks = useMemo(() => {
    const seen = new Map<string, { code: string; label: string; count: number }>();
    for (const c of allControls) {
      if (!seen.has(c.framework)) seen.set(c.framework, { code: c.framework, label: c.frameworkLabel, count: 0 });
      seen.get(c.framework)!.count += 1;
    }
    return Array.from(seen.values()).filter(f => f.code !== "__custom__");
  }, [allControls]);

  useEffect(() => {
    setActiveFrameworks(prev => {
      const available = new Set(frameworks.map(f => f.code));
      const kept = Array.from(prev).filter(f => available.has(f));
      return new Set(kept.length > 0 ? kept : frameworks.map(f => f.code));
    });
  }, [frameworks]);

  const gapSet = useMemo(() => new Set(gapControlIds), [gapControlIds]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  /** Muss = Gaps mit Schweregrad critical/high (aus dem übergebenen gaps-Array). */
  const mussGapIds = useMemo(
    () => new Set(gaps.filter(g => g.is_muss).map(g => g.gap_id)),
    [gaps],
  );
  const gapTitleMap = useMemo(() => new Map(gaps.map(g => [g.gap_id, g.title])), [gaps]);

  /** Coverage: Muss-Gaps, die durch mindestens eine ausgewählte Kontrolle abgedeckt sind. */
  const coverage = useMemo(() => {
    if (mussGapIds.size === 0) return null;
    const covered = new Set<string>();
    for (const c of allControls) {
      if (!selectedSet.has(c.id)) continue;
      for (const gid of c.linkedGapIds) {
        if (mussGapIds.has(gid)) covered.add(gid);
      }
    }
    const suggestedCount = allControls.filter(
      c => (c.isSuggested || gapSet.has(c.id)) && !c.isCustom,
    ).length;
    return { covered: covered.size, total: mussGapIds.size, suggestedCount };
  }, [allControls, selectedSet, mussGapIds, gapSet]);


  const displayed = useMemo(() => {
    let list = allControls.filter(c => c.isCustom || activeFrameworks.has(c.framework));
    if (!showAll) list = list.filter(c => gapSet.has(c.id) || c.isSuggested || c.isCustom);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.nativeId.toLowerCase().includes(q) ||
        c.question.toLowerCase().includes(q) ||
        c.questionEn.toLowerCase().includes(q) ||
        c.frameworkLabel.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allControls, activeFrameworks, gapSet, showAll, search]);

  /** Group by framework (default legacy) OR by gap (risk-centric, hub + equivalents per gap). */
  const grouped = useMemo(() => {
    const m = new Map<string, { label: string; controls: typeof displayed; framework: string; gapId?: string; isMuss?: boolean }>();
    if (groupMode === "gap" && gaps.length > 0) {
      // Bucket per gap; each control appears under every gap it addresses.
      // Custom controls and unrelated controls go into a trailing "Weitere" bucket.
      for (const g of gaps) {
        m.set(`gap::${g.gap_id}`, {
          label: g.title,
          framework: "__gap__",
          controls: [],
          gapId: g.gap_id,
          isMuss: g.is_muss,
        });
      }
      const otherKey = "__other__";
      m.set(otherKey, { label: de ? "Weitere Kontrollen" : "Other controls", framework: "__other__", controls: [] });
      for (const c of displayed) {
        const matched = c.linkedGapIds.filter(gid => m.has(`gap::${gid}`));
        if (matched.length === 0) {
          m.get(otherKey)!.controls.push(c);
        } else {
          for (const gid of matched) m.get(`gap::${gid}`)!.controls.push(c);
        }
      }
      // Framework-neutral: kein Hub. Innerhalb einer Gap-Gruppe alphabetisch nach
      // Framework, benutzerdefinierte Kontrollen zuletzt. Kein Framework wird
      // bevorzugt — Äquivalente stehen gleichrangig nebeneinander.
      for (const entry of m.values()) {
        entry.controls.sort((a, b) => {
          const rank = (x: typeof a) => x.isCustom ? 1 : 0;
          const r = rank(a) - rank(b);
          return r !== 0 ? r : a.framework.localeCompare(b.framework);
        });
      }
      // Drop empty gap buckets and empty other bucket.
      for (const [k, v] of Array.from(m.entries())) {
        if (v.controls.length === 0) m.delete(k);
      }
      return m;
    }
    for (const c of displayed) {
      const groupId = c.isCustom ? c.domainId : c.framework;
      if (!m.has(groupId)) m.set(groupId, { label: c.frameworkLabel, framework: c.framework, controls: [] });
      m.get(groupId)!.controls.push(c);
    }
    return m;
  }, [displayed, groupMode, gaps, de]);


  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  const mergeSelected = (ids: string[]) => onChange(Array.from(new Set([...selected, ...ids])));
  const selectVisible = () => mergeSelected(displayed.map(c => c.id));
  const selectSuggested = () => mergeSelected(displayed.filter(c => gapSet.has(c.id) || c.isSuggested).map(c => c.id));
  const clearSelected = () => onChange([]);

  const toggleFramework = (framework: string) => {
    setActiveFrameworks(prev => {
      const next = new Set(prev);
      next.has(framework) ? next.delete(framework) : next.add(framework);
      return next;
    });
  };

  const toggleDomain = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label || !onAddCustom) return;
    const id = `custom-${Date.now().toString(36)}`;
    const entry: CustomControlEntry = { id, question: label, questionEn: label };
    onAddCustom(entry);
    onChange([...selected, id]);
    setCustomLabel("");
  };

  return (
    <div className="space-y-2">
      {/* Coverage line — always visible when Muss-Gaps are known. */}
      {coverage && (
        <div className="flex items-center gap-2 flex-wrap px-2 py-1.5 rounded-md bg-primary/5 border border-primary/20 text-[11px]">
          <span className="font-semibold">
            {de ? "Deckt" : "Covers"} {coverage.covered} {de ? "von" : "of"} {coverage.total} {de ? "Muss-Anforderungen" : "must requirements"}
          </span>
          <span className="text-muted-foreground">·</span>
          <span>{selected.length} {de ? "gewählt" : "selected"}</span>
          <span className="text-muted-foreground">·</span>
          <span>{coverage.suggestedCount} {de ? "empfohlen" : "suggested"}</span>
          <span
            className="text-[10px] text-muted-foreground italic ml-auto"
            title={de
              ? "Muss = Gaps mit Schweregrad kritisch/hoch. Coverage zählt Muss-Gaps, die mindestens eine ausgewählte Kontrolle adressiert."
              : "Must = gaps with severity critical/high. Coverage counts must-gaps addressed by at least one selected control."}
          >
            {de ? "nur Muss (kritisch/hoch)" : "must only (critical/high)"}
          </span>
        </div>
      )}

      {/* Toolbar */}

      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder={de ? "Katalog durchsuchen…" : "Search catalog…"}
                 className="pl-7 h-8 text-xs" />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button variant={!showAll ? "secondary" : "outline"} size="sm"
                className="h-8 text-[11px] gap-1" onClick={() => setShowAll(!showAll)}>
          <AlertTriangle className="h-3 w-3 text-orange-500" />
          {showAll ? (de ? "Nur Vorschläge" : "Suggestions only") : (de ? "Alle zeigen" : "Show all")}
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={selectSuggested}>
          <CheckSquare className="h-3 w-3" />
          {de ? "Vorschläge übernehmen" : "Use suggestions"}
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={selectVisible}>
          <Filter className="h-3 w-3" />
          {de ? "Sichtbare wählen" : "Select visible"}
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1" onClick={clearSelected}>
          <Square className="h-3 w-3" />
          {de ? "Leeren" : "Clear"}
        </Button>
        <Badge variant="secondary" className="text-[10px]">
          {selected.length} {de ? "ausgewählt" : "selected"}
        </Badge>
      </div>

      {frameworks.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {gaps.length > 0 && (
            <div className="flex items-center gap-1 mr-1 border border-border rounded-md p-0.5 bg-muted/30">
              <Button
                type="button" size="sm"
                variant={groupMode === "gap" ? "secondary" : "ghost"}
                className="h-6 text-[10px] px-2"
                onClick={() => setGroupMode("gap")}
              >
                {de ? "Nach Gap" : "By gap"}
              </Button>
              <Button
                type="button" size="sm"
                variant={groupMode === "framework" ? "secondary" : "ghost"}
                className="h-6 text-[10px] px-2"
                onClick={() => setGroupMode("framework")}
              >
                {de ? "Nach Framework" : "By framework"}
              </Button>
            </div>
          )}
          {frameworks.map(fw => {
            const active = activeFrameworks.has(fw.code);
            return (
              <Button
                key={fw.code}
                type="button"
                size="sm"
                variant={active ? "secondary" : "outline"}
                className="h-7 text-[11px] gap-1"
                onClick={() => toggleFramework(fw.code)}
                title={de
                  ? "Framework filtern. Kontrollen sind über framework-neutrale Kontroll-Knoten (same-as) verknüpft — kein Framework ist Hub."
                  : "Filter by framework. Controls are linked via framework-neutral control nodes (same-as) — no framework is a hub."}
              >
                {active ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                {fw.label}
                <span className="text-muted-foreground">{fw.count}</span>
              </Button>
            );
          })}
        </div>
      )}


      {/* Custom control input */}
      {onAddCustom && (
        <div className="flex items-center gap-1.5">
          <Input value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                 onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
                 placeholder={de ? "Eigene Kontrolle hinzufügen…" : "Add custom control…"}
                 className="h-8 text-xs" />
          <Button size="sm" variant="outline" className="h-8 text-[11px] gap-1"
                  disabled={!customLabel.trim()} onClick={addCustom}>
            <Plus className="h-3 w-3" />
            {de ? "Hinzufügen" : "Add"}
          </Button>
        </div>
      )}

      {/* List */}
      <div className="max-h-[320px] overflow-y-auto border border-border rounded-md">
        {displayed.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            {de ? "Keine Kontrollen gefunden." : "No controls found."}
          </p>
        )}
        {Array.from(grouped.entries()).map(([domainId, { label, controls, gapId, isMuss }]) => {
          const open = expanded.has(domainId) || !!search || groupMode === "gap";
          const domainGaps = controls.filter(c => gapSet.has(c.id) || c.isSuggested).length;
          const domainSelected = controls.filter(c => selectedSet.has(c.id)).length;
          const isGapGroup = groupMode === "gap" && !!gapId;
          const coveredHere = isGapGroup
            ? controls.some(c => selectedSet.has(c.id))
            : false;
          return (
            <div key={domainId} className="border-b border-border last:border-b-0">
              <button type="button"
                      onClick={() => toggleDomain(domainId)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/60",
                        isGapGroup && isMuss && !coveredHere ? "bg-destructive/10" : "bg-muted/40",
                        isGapGroup && coveredHere && "bg-primary/10",
                      )}>
                {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <span className="text-xs font-semibold flex-1 text-left">{label}</span>
                {isGapGroup && isMuss && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">Muss</Badge>
                )}
                {isGapGroup && coveredHere && (
                  <Badge variant="default" className="text-[9px] px-1 py-0 bg-primary/80">
                    {de ? "gedeckt" : "covered"}
                  </Badge>
                )}
                {!isGapGroup && domainGaps > 0 && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">
                    {domainGaps} {de ? "Vorschläge" : "suggested"}
                  </Badge>
                )}
                {domainSelected > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1 py-0">
                    {domainSelected}/{controls.length}
                  </Badge>
                )}
              </button>
              {open && (
                <div className="divide-y divide-border/40">
                  {controls.map(c => {
                    const isGap = gapSet.has(c.id) || c.isSuggested;
                    const isSel = selectedSet.has(c.id);
                    return (
                      <label key={`${domainId}::${c.id}`}
                             className={cn(
                               "flex items-start gap-2 px-3 py-1.5 cursor-pointer text-xs hover:bg-muted/40",
                               isGap && "bg-destructive/5",
                               isSel && "bg-primary/5",
                             )}>
                        <Checkbox checked={isSel} onCheckedChange={() => toggle(c.id)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] text-muted-foreground">{c.nativeId}</span>
                            {!c.isCustom && (
                              <Badge
                                variant="outline"
                                className="text-[8px] px-1 py-0"
                                title={de
                                  ? "Framework dieser Kontrolle. Äquivalente Kontrollen teilen sich einen framework-neutralen Kontroll-Knoten (same-as)."
                                  : "Framework of this control. Equivalent controls share a framework-neutral control node (same-as)."}
                              >
                                {c.frameworkLabel}
                              </Badge>
                            )}
                            {isGap && <Badge variant="destructive" className="text-[8px] px-1 py-0">{de ? "Vorschlag" : "Suggested"}</Badge>}
                            {c.isCustom && <Badge variant="outline" className="text-[8px] px-1 py-0 border-primary text-primary">Custom</Badge>}
                          </div>
                          <p className="text-[11px] leading-tight mt-0.5">{de ? c.question : c.questionEn}</p>
                          <p className="text-[10px] leading-tight text-muted-foreground mt-0.5 line-clamp-2">
                            {c.domain}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
