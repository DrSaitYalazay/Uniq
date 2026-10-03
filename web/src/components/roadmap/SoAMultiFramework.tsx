import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Shield, Layers, Lock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import SoAPanel from "./SoAPanel";
import { useFrameworkCatalog } from "@/hooks/useFrameworkCatalog";
import {
  buildSoAProjection,
  type SoAProjection,
  type SoAProjectedControl,
  type SoASavedData,
  type TreatmentState,
} from "@/lib/soaProjection";
import { isIsoClause, isoEntry, annexSortKey, isoRefsAll } from "@/data/isoAnnexMap";


import type { RiskLinkageMap } from "@/lib/soaRiskLinkage";
import type { NIS2Category, ComplianceStatus } from "@/data/nis2Controls";
import type {
  FrameworkDefinition,
  FrameworkKey,
} from "@/contexts/FrameworkContext";
import { FRAMEWORK_DB_VALUE } from "@/data/frameworkCatalogs";
import type { Lang } from "@/contexts/LanguageContext";

/**
 * Codex-Pruefung Y5: Die Trennung „SoA vs. Klausel" lief über die ERSTE
 * Referenz. Eine Kontrolle, deren erste Referenz eine Klausel ist, die aber
 * ZUSÄTZLICH eine Annex-A-Kontrolle abdeckt (z. B. A.5.2 / A.5.4), fiel damit
 * komplett aus der SoA — und die Überschrift erschien nie: 91 statt 93.
 * Maßgeblich ist deshalb, ob die Kontrolle IRGENDEINE Annex-A-Referenz hat.
 */
const coversAnnexA = (id: string) => isoRefsAll(id).some(r => r.startsWith("A."));
/** Reine Klausel-Kontrolle: keine einzige Annex-A-Referenz. */
const isPureClause = (id: string) => isIsoClause(id) && !coversAnnexA(id);

interface Props {
  frameworks: FrameworkDefinition[];
  primaryKey: FrameworkKey;
  soaData: SoASavedData;
  setSoAData: (updater: (prev: SoASavedData) => SoASavedData) => void;
  treatmentData: TreatmentState;
  linkageMap: RiskLinkageMap;
  dbAnswerMap: Record<string, ComplianceStatus>;
  lang: Lang;
}

interface FrameworkStats {
  total: number;
  applicable: number;
  notApplicable: number;
  excluded: number;
  missingJustification: number;
}

export default function SoAMultiFramework({
  frameworks,
  primaryKey,
  soaData,
  setSoAData,
  treatmentData,
  linkageMap,
  dbAnswerMap,
  lang,
}: Props) {
  const de = lang === "de";
  const [statsByFw, setStatsByFw] = useState<Record<string, FrameworkStats>>({});
  const [openFw, setOpenFw] = useState<Record<string, boolean>>({});


  const toggle = (key: string) =>
    setOpenFw(prev => ({ ...prev, [key]: !prev[key] }));

  const totals = useMemo<FrameworkStats>(() => {
    return Object.values(statsByFw).reduce<FrameworkStats>(
      (acc, s) => ({
        total: acc.total + s.total,
        applicable: acc.applicable + s.applicable,
        notApplicable: acc.notApplicable + s.notApplicable,
        excluded: acc.excluded + s.excluded,
        missingJustification: acc.missingJustification + s.missingJustification,
      }),
      { total: 0, applicable: 0, notApplicable: 0, excluded: 0, missingJustification: 0 },
    );
  }, [statsByFw]);

  const reportStats = (key: string, s: FrameworkStats) => {
    setStatsByFw(prev => {
      const cur = prev[key];
      if (
        cur &&
        cur.total === s.total &&
        cur.applicable === s.applicable &&
        cur.notApplicable === s.notApplicable &&
        cur.excluded === s.excluded &&
        cur.missingJustification === s.missingJustification
      ) {
        return prev;
      }
      return { ...prev, [key]: s };
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {de ? "Anwendbarkeitserklärung (SoA)" : "Statement of Applicability (SoA)"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Ein Katalog je aktivem Framework (Scope & Kontext). Ergebnisse der Risikobehandlung (Phase 04) sind eingebettet: ausgeschlossene und umgesetzte Kontrollen sind markiert und fließen automatisch in die Roadmap ein. ISO 27001: Die SoA umfasst nur Annex-A-Kontrollen (6.1.3 d); die Managementsystem-Klauseln 4–10 sind Pflicht und werden separat ausgewiesen."
            : "One catalog per active framework (Scope & Context). Risk-treatment results (Phase 04) are embedded: excluded and implemented controls are flagged and flow into the Roadmap automatically. ISO 27001: the SoA covers Annex A controls only (6.1.3 d); management-system clauses 4–10 are mandatory and reported separately."}
        </p>
      </div>


      {/* Aggregate strip across all active frameworks */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">
              {de ? "Gesamt über " : "Total across "}
              <span className="text-primary">{frameworks.length}</span>
              {de ? " Framework(s)" : " framework(s)"}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MiniStat label={de ? "Kontrollen" : "Controls"} value={totals.total} tone="neutral" />
            <MiniStat label={de ? "Anwendbar" : "Applicable"} value={totals.applicable} tone="ok" />
            <MiniStat label={de ? "Nicht anwendbar" : "Not applicable"} value={totals.notApplicable} tone="muted" />
            <MiniStat label={de ? "Ausgeschlossen" : "Excluded"} value={totals.excluded} tone="warn" />
            <MiniStat label={de ? "Begründung fehlt" : "Missing just."} value={totals.missingJustification} tone="danger" />
          </div>
        </CardContent>
      </Card>


      {/* One section per framework */}
      <div className="space-y-3">
        {frameworks.map(fw => (
          <FrameworkSection
            key={fw.key}
            fw={fw}
            isPrimary={fw.key === primaryKey}
            isOpen={openFw[fw.key] ?? false}
            onToggle={() => toggle(fw.key)}
            soaData={soaData}
            setSoAData={setSoAData}
            treatmentData={treatmentData}
            linkageMap={linkageMap}
            dbAnswerMap={dbAnswerMap}
            lang={lang}
            onStats={reportStats}
          />
        ))}
      </div>
    </div>
  );
}

// ── Per-framework section ──

interface SectionProps {
  fw: FrameworkDefinition;
  isPrimary: boolean;
  isOpen: boolean;
  onToggle: () => void;
  soaData: SoASavedData;
  setSoAData: (updater: (prev: SoASavedData) => SoASavedData) => void;
  treatmentData: TreatmentState;
  linkageMap: RiskLinkageMap;
  dbAnswerMap: Record<string, ComplianceStatus>;
  lang: Lang;
  onStats: (key: string, s: FrameworkStats) => void;
}

function FrameworkSection({
  fw,
  isPrimary,
  isOpen,
  onToggle,
  soaData,
  setSoAData,
  treatmentData,
  linkageMap,
  dbAnswerMap,
  lang,
  onStats,
}: SectionProps) {
  const de = lang === "de";
  const { categories: rawCategories, loading } = useFrameworkCatalog(fw.key);
  const fwDbValue = FRAMEWORK_DB_VALUE[fw.key];

  // Hydrate categories with assessment answers scoped to this framework.
  const categories = useMemo<NIS2Category[]>(() => {
    return rawCategories.map(cat => ({
      ...cat,
      questions: (cat.questions ?? []).map(q => ({
        ...q,
        status: dbAnswerMap[`${fwDbValue}:${q.id}`] ?? null,
      })),
    }));
  }, [rawCategories, dbAnswerMap, fwDbValue]);

  // Extract only this framework's overrides (namespaced by `${fw.key}:${controlId}`).
  const scopedSoAData = useMemo<SoASavedData>(() => {
    const prefix = `${fw.key}:`;
    const controls: SoASavedData["controls"] = {};
    for (const [k, v] of Object.entries(soaData.controls ?? {})) {
      if (k.startsWith(prefix)) controls[k.slice(prefix.length)] = v;
    }
    return { controls };
  }, [soaData, fw.key]);

  const fullProjection = useMemo<SoAProjection>(() => {
    return buildSoAProjection({
      categories,
      savedSoAData: scopedSoAData,
      treatmentData,
      linkageMap,
    });
  }, [categories, scopedSoAData, treatmentData, linkageMap]);

  // ISO 27001: Eine SoA umfasst nach 6.1.3 d) NUR Annex-A-Kontrollen. Die Klauseln 4–10
  // (Managementsystem, Pflicht, nicht ausschließbar) werden aus der Liste genommen und
  // separat als Info-Box ausgewiesen; alle Zähler laufen nur über Annex A.
  const isIso = fw.key === "ISO27001";
  const clauseControls = useMemo<SoAProjectedControl[]>(
    () => (isIso ? fullProjection.systemControls.filter(c => isPureClause(c.id)) : []),
    [fullProjection, isIso],
  );
  const projection = useMemo<SoAProjection>(() => {
    if (!isIso) return fullProjection;
    // In der SoA bleibt jede Kontrolle, die mindestens eine Annex-A-Kontrolle
    // abdeckt — auch wenn ihre erste Referenz eine Klausel ist (Y5).
    const keep = (c: SoAProjectedControl) => !isPureClause(c.id);
    const cats = fullProjection.categories
      .map(cat => {
        const controls = cat.controls.filter(keep);
        return {
          ...cat,
          controls,
          totalCount: controls.length,
          applicableCount: controls.filter(c => c.applicable && !c.isExcluded).length,
        };
      })
      .filter(cat => cat.controls.length > 0);
    const systemControls = fullProjection.systemControls.filter(keep);
    return {
      ...fullProjection,
      categories: cats,
      systemControls,
      allControls: [...systemControls, ...fullProjection.manualControls],
    };
  }, [fullProjection, isIso]);

  const stats: FrameworkStats = useMemo(() => {
    if (!isIso) {
      return {
        total: projection.stats.total,
        applicable: projection.stats.applicable,
        notApplicable: projection.stats.notApplicable,
        excluded: projection.stats.excludedCount,
        missingJustification: projection.stats.missingJustification,
      };
    }
    const annex = projection.systemControls;
    const effApp = (c: SoAProjectedControl) => c.applicable && !c.isExcluded;
    return {
      total: annex.length,
      applicable: annex.filter(effApp).length,
      notApplicable: annex.filter(c => !effApp(c)).length,
      excluded: annex.filter(c => c.isExcluded).length,
      missingJustification: annex.filter(c => c.missingJustification).length,
    };
  }, [projection, isIso]);

  // Altbestand: Klausel-Anforderungen, die früher (als sie noch in der SoA-Liste standen)
  // als „nicht anwendbar" gespeichert wurden. Klauseln sind Pflicht → Markierung ist
  // unzulässig; wird angezeigt und kann auf einen Klick zurückgesetzt werden (kein Verstecken).
  const staleClauseNa = useMemo(
    () => clauseControls.filter(c => c.applicableSource === "saved_override" && !c.applicable),
    [clauseControls],
  );
  const resetStaleClauseNa = () => {
    const keys = new Set(staleClauseNa.map(c => `${fw.key}:${c.id}`));
    setSoAData(prev => {
      const controls = { ...(prev.controls ?? {}) };
      for (const k of keys) {
        const cur = controls[k];
        if (!cur) continue;
        controls[k] = { ...cur, applicable: true };
      }
      return { ...prev, controls };
    });
  };

  useEffect(() => {
    onStats(fw.key, stats);
  }, [fw.key, stats, onStats]);

  const label = de ? fw.shortDe : fw.shortEn;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{label}</span>
            <span className="text-[11px] text-muted-foreground">{fw.standard}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {loading && (
            <Badge variant="outline" className="text-[10px]">
              {de ? "Lädt…" : "Loading…"}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {de ? "Gesamt" : "Total"}: {stats.total}
          </Badge>
          <Badge variant="outline" className="text-[10px] st-ja-border st-ja-text">
            {de ? "Anwendbar" : "Applicable"}: {stats.applicable}
          </Badge>
          <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
            {de ? "N/A" : "N/A"}: {stats.notApplicable}
          </Badge>
          <Badge variant="outline" className="text-[10px] st-teilweise-border st-teilweise-text">
            {de ? "Ausgeschlossen" : "Excluded"}: {stats.excluded}
          </Badge>
          {stats.missingJustification > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {de ? "Begründung fehlt" : "Missing just."}: {stats.missingJustification}
            </Badge>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border p-3 bg-muted/10 space-y-3">
          {isIso && clauseControls.length > 0 && (
            <ClauseInfoBox
              controls={clauseControls}
              staleNa={staleClauseNa}
              onResetStaleNa={resetStaleClauseNa}
              de={de}
            />
          )}
          {loading && rawCategories.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              {de ? "Katalog wird geladen…" : "Loading catalog…"}
            </div>
          ) : (
            <SoAPanel
              projection={projection}
              soaData={soaData}
              setSoAData={setSoAData}
              lang={lang}
              primaryFrameworkLabel={label}
              namespace={fw.key}
              embedded
            />
          )}
        </div>
      )}
    </Card>
  );
}

// ── ISO 27001: Managementsystem-Klauseln 4–10 (Pflicht, nicht Teil der SoA) ──

function ClauseInfoBox({
  controls,
  staleNa,
  onResetStaleNa,
  de,
}: {
  controls: SoAProjectedControl[];
  staleNa: SoAProjectedControl[];
  onResetStaleNa: () => void;
  de: boolean;
}) {
  const [open, setOpen] = useState(false);
  const n = controls.length;
  const done = controls.filter(c => c.implStatus === "ja").length;
  const partial = controls.filter(c => c.implStatus === "teilweise").length;

  /**
   * Diese Box zeigt AUSSCHLIESSLICH die Managementsystem-Klauseln 4–10, die
   * nicht Gegenstand der Anwendbarkeitserklärung sind. Klauseln haben genau
   * eine Referenz, deshalb wird hier nach der ersten (einzigen) Referenz
   * gruppiert. Die Mehrfach-Referenz-Logik für die 93 Annex-A-Kontrollen
   * gehört in die SoA-Liste selbst (`groupByAnnex` in SoAPanel) — nicht hierher.
   */
  const groups = useMemo(() => {
    const m = new Map<string, { ref: string; title: string; items: SoAProjectedControl[] }>();
    for (const c of controls) {
      const e = isoEntry(c.id);
      const ref = e?.ref ?? c.id;
      if (!m.has(ref)) m.set(ref, { ref, title: e ? (de ? e.titleDe : e.titleEn) : "", items: [] });
      m.get(ref)!.items.push(c);
    }
    return Array.from(m.values()).sort((a, b) => annexSortKey(a.ref) - annexSortKey(b.ref));
  }, [controls, de]);

  const statusBadge = (c: SoAProjectedControl) => {
    const s = c.implStatus;
    const cls = s === "ja" ? "st-ja-border st-ja-text"
      : s === "teilweise" ? "st-teilweise-border st-teilweise-text"
      : s === "nein" ? "border-destructive/40 text-destructive"
      : "border-border text-muted-foreground";
    const label = s === "ja" ? (de ? "Umgesetzt" : "Implemented")
      : s === "teilweise" ? (de ? "Teilweise" : "Partial")
      : s === "nein" ? (de ? "Nicht umgesetzt" : "Not implemented")
      : (de ? "Nicht bewertet" : "Not assessed");
    return <Badge variant="outline" className={`text-[10px] shrink-0 ${cls}`}>{label}</Badge>;
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
        <Lock className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">
          {de ? "Managementsystem-Klauseln 4–10 (Pflicht, nicht ausschließbar)" : "Management-system clauses 4–10 (mandatory, cannot be excluded)"}
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          {de
            ? `${n} Anforderungen, davon ${done} erfüllt${partial > 0 ? `, ${partial} teilweise` : ""}`
            : `${n} requirements, ${done} met${partial > 0 ? `, ${partial} partial` : ""}`}
        </span>
        <span className="flex-1" />
        {staleNa.length > 0 && (
          <Badge variant="destructive" className="text-[10px] gap-1">
            <AlertTriangle className="h-3 w-3" />
            {staleNa.length} {de ? "unzulässig „n. a.“" : "invalid \"n/a\""}
          </Badge>
        )}
      </button>

      {open && (
        <div className="border-t border-primary/20 px-3 py-2 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            {de
              ? "Die Klauseln 4–10 beschreiben das ISMS selbst (Kontext, Führung, Planung, Unterstützung, Betrieb, Bewertung, Verbesserung). Sie sind nach ISO/IEC 27001 zwingend und nicht Gegenstand der Anwendbarkeitserklärung — bewertet werden sie in der Gap-Analyse (Phase 03)."
              : "Clauses 4–10 describe the ISMS itself (context, leadership, planning, support, operation, evaluation, improvement). They are mandatory under ISO/IEC 27001 and not subject to the Statement of Applicability — they are assessed in the gap analysis (Phase 03)."}
          </p>
          {staleNa.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-2.5 py-2 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span className="flex-1 min-w-[200px]">
                {de
                  ? `${staleNa.length} Klausel-Anforderung(en) wurden früher als „nicht anwendbar" gespeichert (${staleNa.map(c => isoEntry(c.id)?.ref ?? c.id).slice(0, 6).join(", ")}${staleNa.length > 6 ? ", …" : ""}). Das ist für Klauseln unzulässig.`
                  : `${staleNa.length} clause requirement(s) were previously saved as "not applicable" (${staleNa.map(c => isoEntry(c.id)?.ref ?? c.id).slice(0, 6).join(", ")}${staleNa.length > 6 ? ", …" : ""}). This is not permitted for clauses.`}
              </span>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onResetStaleNa}>
                {de ? "Auf „anwendbar“ zurücksetzen" : "Reset to \"applicable\""}
              </Button>
            </div>
          )}
          <div className="divide-y divide-border rounded-md border border-border bg-background/60">
            {groups.map(g => (
              <div key={g.ref} className="px-2.5 py-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-semibold text-primary">{g.ref}</span>
                  <span className="font-medium text-foreground truncate">{g.title}</span>
                  <span className="ml-auto text-[10.5px] text-muted-foreground tabular-nums shrink-0">
                    {g.items.filter(c => c.implStatus === "ja").length}/{g.items.length}
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {g.items.map(c => (
                    <li key={c.id} className="flex items-start gap-2 text-[11px] text-muted-foreground" title={c.id}>
                      <span className="flex-1 min-w-0">{de ? c.name : c.nameEn}</span>
                      {statusBadge(c)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini stat ──

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "danger" | "muted" | "neutral";
}) {
  const toneCls =
    tone === "ok" ? "st-ja-text" :
    tone === "warn" ? "st-teilweise-text" :
    tone === "danger" ? "text-destructive" :
    tone === "muted" ? "text-muted-foreground" :
    "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background/60 p-2">
      <div className={`text-xl font-bold ${toneCls}`}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
