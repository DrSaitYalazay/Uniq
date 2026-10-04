import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Server } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ControlRowItem } from "./ControlRowItem";
import { QuestionCard } from "./QuestionCard";
import { FEATURES } from "@/config/uniqFeatures";
import { AssessmentFilters, type StatusFilter } from "./AssessmentFilters";
import { FrameworkChartsPanel } from "./FrameworkChartsPanel";
import type { AssessmentAsset } from "./AssetOverridePanel";
import type { AnswerStatus, ControlRow, EffectiveAnswer, FrameworkStats } from "@/lib/assessmentEngine";
import { familiesOf, subFamilyOf } from "@/lib/assessmentEngine";
import { inferControlScope } from "@/lib/controlScope";
import type { ControlHealth } from "@/lib/controlHealthEngine";
import { isReadinessControl } from "@/data/readinessControls";
import { isoEntry, isIsoClause, annexFamily, annexFamilyLabel, annexSortKey, isoRefsAll, annexRefTitles, isoClauseRefs, isMandatoryClauseControl } from "@/data/isoAnnexMap";
import type { CoverageDecision, Severity, SeveritySource } from "@/lib/assessmentEngine";
import type { CoverageReviewRow } from "@/hooks/useCoverageReview";
import { BulkStatusDialog, bulkNeedsNote, type BulkStatusRequest } from "./BulkStatusDialog";


const SUB_GROUP_THRESHOLD = 8;

/** MUSS-Kennzeichen: DB-Flag ODER (ISO 27001) Managementsystem-Klausel 4–10 laut Annex-Map
 *  (Fallback, solange `iso_meta_annex.sql` noch nicht deployt ist). */
function isMustControl(c: ControlRow): boolean {
  if (c.muss === "true" || (c.muss as unknown) === true || c.muss === "MUSS") return true;
  if (c.muss === "false") return false;
  return c.framework === "ISO27001" && isIsoClause(c.id);
}


interface Props {
  framework: string;
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
  stats: FrameworkStats;
  de: boolean;
  usesMaturity: boolean;
  onSetStatus: (controlId: string, s: AnswerStatus | null) => void;
  onSetNote: (controlId: string, v: string) => void;
  onSetReifegrad: (controlId: string, r: number | null) => void;
  /** Massenaktion; `note` = Pflichtbegründung aus dem Bestätigungsdialog (bei „na"/„ja"),
   *  wird in Anforderungen OHNE eigene Notiz übernommen. */
  onBulkStatus: (controlIds: string[], s: AnswerStatus, note?: string) => void;
  assets?: AssessmentAsset[];
  getAssetEffective?: (control: ControlRow, assetId: string, orgEffective: EffectiveAnswer) => EffectiveAnswer;
  isAssetOverride?: (controlId: string, assetId: string) => boolean;
  onSetAssetStatus?: (controlId: string, assetId: string, s: AnswerStatus | null) => void;
  onSetAssetReifegrad?: (controlId: string, assetId: string, r: number | null) => void;
  /** Additiv & optional: abgeleiteter Control-Status je `framework::controlId`
   *  (useControlHealth). Fehlt er ⇒ keine Health-Badges. */
  healthByControl?: Map<string, ControlHealth>;
  /** "simple" = Bausteinebene (Bulk je Baustein prominent, Details eingeklappt),
   *  "expert" = Kontrollebene (heutiges Verhalten). Default "expert". */
  mode?: "simple" | "expert";
  /** Y7: gespeicherte Einstufung je Kontroll-ID (aus public.answers). */
  severityByControl?: Map<string, { severity?: Severity | null; severity_source?: SeveritySource | null; severity_note?: string | null }>;
  /** Y7: Einstufung setzen; `value === null` nimmt den Prüferentscheid zurück. */
  onSetSeverity?: (controlId: string, value: Severity | null, note: string) => void;
  /** Y8: gespeicherter Deckungsentscheid je Kontroll-ID (aus public.coverage_review). */
  coverageByControl?: (controlId: string) => CoverageReviewRow | undefined;
  /** Y8: Deckungsentscheid speichern; `null` setzt auf „offen" zurück. */
  onSetCoverage?: (controlId: string, decision: CoverageDecision | null, detail: { scopeNote: string; periodFrom: string | null; periodTo: string | null; evidenceNote: string }) => void;
  /** Sprung aus dem Tab „Alle": diese Anforderung filtern, aufklappen und hinscrollen. */
  focus?: { controlId: string; nonce: number };
}

export function AssessmentPanel({
  framework, controls, effective, stats, de, usesMaturity,
  onSetStatus, onSetNote, onSetReifegrad, onBulkStatus,
  assets = [], getAssetEffective, isAssetOverride, onSetAssetStatus, onSetAssetReifegrad,
  healthByControl, mode = "expert", severityByControl, onSetSeverity,
  coverageByControl, onSetCoverage, focus,
}: Props) {
  const isIso = framework === "ISO27001";

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [openFamilies, setOpenFamilies] = useState<Record<string, boolean>>({});
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});
  /** Offener Bestätigungsdialog für „Alle → …" (P3.X.6 / P3.X.8). */
  const [bulkReq, setBulkReq] = useState<BulkStatusRequest | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Sprung aus „Alle": Filter zurücksetzen, nach der ID suchen, Gruppen öffnen, hinscrollen.
  useEffect(() => {
    if (!focus) return;
    setFilter("all");
    setTag(null);
    setSearch(focus.controlId);
    const t = window.setTimeout(() => {
      const el = rootRef.current?.querySelector(`[data-control-id="${CSS.escape(focus.controlId)}"]`) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-accent", "rounded-lg");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-accent", "rounded-lg"), 2500);
    }, 150);
    return () => window.clearTimeout(t);
  }, [focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  // Solange die Sprung-Suche aktiv ist: Treffer aufgeklappt und auch im Überblick-Modus sichtbar.
  const focusActive = !!focus && search === focus.controlId;
  const simple = mode === "simple" && !focusActive;


  const availableTags = useMemo(() => {
    const s = new Set<string>();
    controls.forEach(c => (c.tags ?? []).forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [controls]);

  const mustAvailable = useMemo(
    () => controls.some(c => isMustControl(c)),
    [controls],
  );


  const filteredControls = useMemo(() => {
    const q = search.trim().toLowerCase();
    return controls.filter(c => {
      const eff = effective.get(c.id);
      const s = eff?.status ?? null;
      if (filter === "open" && !(s === "nein" || s === null)) return false;
      if (filter === "partial" && s !== "teilweise") return false;
      if (filter === "done" && s !== "ja") return false;
      if (filter === "na" && s !== "na") return false;
      if (filter === "must" && !isMustControl(c)) return false;
      if (tag && !(c.tags ?? []).includes(tag)) return false;
      if (q) {
        // ISO: auch Annex-Referenz + Titel durchsuchbar („A.5.1", „Richtlinien").
        const ann = isIso ? isoEntry(c.id) : undefined;
        const hay = `${c.id} ${c.req_de ?? ""} ${c.req_en ?? ""} ${ann ? `${ann.ref} ${ann.titleDe} ${ann.titleEn}` : ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [controls, effective, filter, search, tag, isIso]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: ControlRow[] }>();
    const push = (id: string, label: string, c: ControlRow) => {
      if (!map.has(id)) map.set(id, { label, items: [] });
      const g = map.get(id)!;
      if (!g.items.some(x => x.id === c.id)) g.items.push(c);
    };
    for (const c of filteredControls) {
      // Codex-Prüfung Y5: bei ISO entschied früher NUR die erste Referenz über
      // die Familie. Kontrollen, die zusätzlich eine andere Annex-A-Kontrolle
      // abdecken, tauchten dort nie auf — die Gap-Ansicht zeigte 85 statt 93
      // Überschriften. `familiesOf` zählt jede Referenz und ist dieselbe
      // Quelle, die Reifegrad und „Schwächste Kategorien" benutzen (vorher
      // lebte diese Logik hier als Kopie und nannte deshalb eine andere
      // Grundgesamtheit). Eine Kontrolle kann unter zwei Familien erscheinen;
      // der Status bleibt EIN Datensatz, es entsteht keine zweite Antwort.
      for (const f of familiesOf(c, de)) push(f.id, f.label, c);
    }
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g })).sort((a, b) =>
      isIso ? annexSortKey(a.id) - annexSortKey(b.id) : a.id.localeCompare(b.id, undefined, { numeric: true }));
  }, [filteredControls, de, isIso]);


  const familyStats = (items: ControlRow[]) => {
    let ans = 0, ja = 0, part = 0;
    for (const c of items) {
      const e = effective.get(c.id);
      if (e?.status) ans++;
      if (e?.status === "ja") ja++;
      else if (e?.status === "teilweise") part++;
    }
    const applicable = items.filter(c => effective.get(c.id)?.status !== "na").length;
    const pct = applicable > 0 ? Math.round(((ja + 0.5 * part) / applicable) * 100) : 0;
    return { ans, total: items.length, pct };
  };

  const scopedAssetCount = (items: ControlRow[]) => items.filter((item) => inferControlScope(item) !== "org").length;

  const renderControlItem = (c: ControlRow) => {
    const orgEffective = effective.get(c.id) ?? { status: null, reifegrad: null, origin: "empty", note: null, evidence: null };
    const assetMap = new Map<string, EffectiveAnswer>();
    const overrideSet = new Set<string>();

    if (assets.length > 0 && getAssetEffective) {
      assets.forEach((asset) => {
        assetMap.set(asset.id, getAssetEffective(c, asset.id, orgEffective));
        if (isAssetOverride?.(c.id, asset.id)) overrideSet.add(asset.id);
      });
    }

    return (
      <div key={c.id} data-control-id={c.id}>
      <ControlRowItem
        control={c}
        effective={orgEffective}
        de={de}
        usesMaturity={usesMaturity}
        onSetStatus={(s) => onSetStatus(c.id, s)}
        onSetNote={(v) => onSetNote(c.id, v)}
        onSetReifegrad={(r) => onSetReifegrad(c.id, r)}
        assets={assets}
        assetEffective={assetMap}
        assetOverrideIds={overrideSet}
        onSetAssetStatus={onSetAssetStatus ? (assetId, s) => onSetAssetStatus(c.id, assetId, s) : undefined}
        onSetAssetReifegrad={onSetAssetReifegrad ? (assetId, r) => onSetAssetReifegrad(c.id, assetId, r) : undefined}
        health={healthByControl?.get(`${framework}::${c.id}`)}
        severityStored={severityByControl?.get(c.id)}
        onSetSeverity={onSetSeverity ? (v, note) => onSetSeverity(c.id, v, note) : undefined}
        coverageStored={coverageByControl?.(c.id)}
        onSetCoverage={onSetCoverage ? (d, detail) => onSetCoverage(c.id, d, detail) : undefined}
      />
      </div>
    );
  };

  return (
    <div className="space-y-4" ref={rootRef}>
      {/* Header stats */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 card-elevated">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label={de ? "Beantwortungsgrad" : "Answered"} value={`${stats.progressPct}%`} sub={`${stats.answered}/${stats.total}`} />
          <StatBox label={de ? "Konformität" : "Compliance"} value={`${stats.compliancePct}%`} sub={de ? "gewichtet" : "weighted"} />
          <StatBox label={de ? "Kritische Lücken" : "Critical gaps"} value={String(stats.criticalOpen)} sub={de
            ? `MUSS nicht umgesetzt${(stats.criticalUnanswered ?? 0) > 0 ? ` · ${stats.criticalUnanswered} MUSS unbeantwortet` : ""}${(stats.criticalLater ?? 0) > 0 ? ` · ${stats.criticalLater} gelten erst später` : ""}`
            : `MUST not implemented${(stats.criticalUnanswered ?? 0) > 0 ? ` · ${stats.criticalUnanswered} MUST unanswered` : ""}${(stats.criticalLater ?? 0) > 0 ? ` · ${stats.criticalLater} apply later` : ""}`} tone="destructive" />
          <StatBox label={de ? "Nicht anwendbar" : "Not applicable"} value={String(stats.na)} sub={de ? "N.a." : "N/A"} />
        </div>
        {/* UniqSuite: Fortschrittsbalken „Konformität/Fortschritt" wiederholten die Kennzahlen oben — entfallen. */}
      </div>

      <FrameworkChartsPanel controls={controls} effective={effective} stats={stats} de={de} mode={simple ? "simple" : "expert"} />



      {/* Filter/Suche/Tags sind Detail-Werkzeuge — im Überblick ausgeblendet. */}
      {!simple && (
        <AssessmentFilters
          filter={filter} onFilter={setFilter}
          search={search} onSearch={setSearch}
          tag={tag} onTag={setTag}
          availableTags={availableTags}
          de={de}
          mustAvailable={mustAvailable}
          frameworkLabel={framework}
        />
      )}


      {/* UniqSuite-Überblick: eine Anforderung pro Karte (Umgesetzt / Teilweise / Nicht umgesetzt).
          Der frühere Fortschrittskasten („X von Y Bausteinen bewertet") wiederholte den Beantwortungsgrad. */}
      {simple && (
        <QuestionCard controls={controls} effective={effective} de={de} isMust={isMustControl}
          onSetStatus={onSetStatus} onSetNote={onSetNote} />
      )}

      {/* ── ÜBERBLICK: grafischer Themen-Überblick statt editierbarer Liste ── */}
      {simple && (() => {
        const rows = groups
          .map(g => ({ g, s: familyStats(g.items) }))
          .sort((a, b) => a.s.pct - b.s.pct);
        if (rows.length === 0) {
          return (
            <div className="text-center text-sm text-muted-foreground py-10 border border-dashed border-border rounded-xl">
              {de ? "Noch keine Kontrollen." : "No controls yet."}
            </div>
          );
        }
        return (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="text-base font-semibold text-foreground">
                {de ? "Konformität je Thema" : "Compliance by topic"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {de ? "sortiert: größte Lücke zuerst" : "sorted: biggest gap first"}
              </div>
            </div>
            <div className="space-y-2.5">
              {rows.map(({ g, s }) => {
                const bar = s.ans === 0 ? "bg-muted-foreground/40"
                  : s.pct >= 75 ? "st-ja-bg" : s.pct >= 40 ? "st-teilweise-bg" : "st-nein-bg";
                const card = s.ans === 0 ? "border-border bg-muted/30 text-muted-foreground"
                  : s.pct >= 75 ? "st-ja-border st-ja-tint st-ja-text"
                  : s.pct >= 40 ? "st-teilweise-border st-teilweise-tint st-teilweise-text"
                  : "st-nein-border st-nein-tint st-nein-text";
                const statusLabel = s.ans === 0 ? (de ? "unbeantwortet" : "unanswered")
                  : s.pct >= 100 ? (de ? "umgesetzt" : "implemented")
                  : (de ? "teilweise" : "partial");
                return (
                  <div key={g.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-3 py-2.5 hover:border-accent hover:shadow-sm transition-all">
                    <span className="text-sm md:text-base text-foreground flex-1 min-w-0 truncate font-semibold" title={g.label}>{g.label}</span>
                    <div className="w-28 sm:w-44 h-2.5 rounded-full bg-muted overflow-hidden shrink-0">
                      <div className={`h-full rounded-full ${bar} transition-all duration-500`} style={{ width: `${Math.max(s.pct, 2)}%` }} />
                    </div>
                    <div className={`shrink-0 rounded-lg border px-2.5 py-1 text-right leading-tight ${card}`}>
                      <span className="text-base font-bold tabular-nums">{s.pct}%</span>
                      <span className="block text-[10px] text-muted-foreground tabular-nums">{s.ans}/{s.total}</span>
                    </div>
                    <span className={`hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded-full border w-20 text-center shrink-0 ${
                      s.ans === 0 ? "border-border text-muted-foreground"
                      : s.pct >= 100 ? "st-ja-border st-ja-text"
                      : "st-teilweise-border st-teilweise-text"
                    }`}>{statusLabel}</span>
                  </div>
                );
              })}
            </div>

          </div>
        );
      })()}

      {/* ISO 27001 wird auch im Überblick bis zur Norm-Ebene gezeigt: Annex A hat
          93 Kontrollen, und genau auf dieser Ebene will der Nutzer entscheiden.
          Für alle anderen Frameworks bleibt der Überblick auf Themenebene. */}
      {/* UniqSuite: im Überblick bewertet die Karte oben — auch für ISO 27001 keine zweite Liste. */}
      {!simple && (
      <div className="space-y-3">
        {(() => { return null; })()}
        {groups.map(g => {
          const fs = familyStats(g.items);
          const open = openFamilies[g.id] ?? focusActive;
          // M2-c „Konsistenz-Brücke": aus den bereits bewerteten Anforderungen den
          // dominanten Status ableiten und als Vorschlag NUR auf die offenen Lücken
          // anwenden (überschreibt nie bereits Bewertetes). Bindeglied Einfach↔Detail.
          const brAnswered = g.items.map(i => effective.get(i.id)?.status).filter(Boolean) as AnswerStatus[];
          const brUnanswered = g.items.filter(i => !effective.get(i.id)?.status).map(i => i.id);
          const brCount = brAnswered.reduce<Record<string, number>>((m, s) => { m[s] = (m[s] ?? 0) + 1; return m; }, {});
          const brDominant = (Object.entries(brCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as AnswerStatus | null;
          const brMixed = Object.keys(brCount).length > 1;
          const brLabel = (s: AnswerStatus) => s === "ja" ? (de ? "Umgesetzt" : "Done") : s === "teilweise" ? (de ? "Teilweise" : "Partial") : s === "nein" ? (de ? "Nicht umgesetzt" : "Not implemented") : (de ? "N.a." : "N/A");
          /**
           * Y6 — Referenzentscheid ist nicht Umsetzungsstatus.
           *
           * „Alle → N.a." an einer Überschrift darf nur Kontrollen treffen, die
           * WIRKLICH zu dieser Überschrift gehören, und niemals Kontrollen mit
           * Pflicht-Bezug:
           *  1. Pflicht-Klausel (ISO/IEC 27001 4–10): nicht ausschließbar, ISO
           *     6.1.3 d erlaubt Ausschlüsse nur für Annex A.
           *  2. Geteilter Beitrag: die Kontrolle trägt AUSSERHALB dieser
           *     Überschrift zu einer weiteren Referenz bei. Beispiel A.5.23
           *     (Cloud): c39.3 bedient auch A.8.24 (Kryptographie), sup-loc
           *     auch A.5.19. Ein N.a. an der Cloud-Überschrift würde damit die
           *     allgemeine Schlüsselverwaltung bzw. das Lieferanten-Thema
           *     mit abschalten, obwohl deren Überschriften anwendbar bleiben.
           *     Der Umsetzungsstatus gehört der KONTROLLE, nicht einer ihrer
           *     Überschriften — Sammelaktionen dürfen deshalb nur Kontrollen
           *     treffen, deren Beiträge vollständig in diesem Bereich liegen.
           */
          const refInScope = (ref: string, scope: string) => ref === scope || ref.startsWith(`${scope}.`);
          const naGuard = (items: ControlRow[], scopeRef?: string) => {
            const clause: ControlRow[] = [];
            const shared: ControlRow[] = [];
            const readiness: ControlRow[] = [];
            const allowed: ControlRow[] = [];
            for (const c of items) {
              // K2 (framework-unabhaengig): Ein fehlendes Ereignis nimmt eine
              // Vorbereitungskontrolle nicht aus dem Anwendungsbereich. Solche
              // Kontrollen sind nie Teil eines Sammel-N.a.; sie werden einzeln
              // gegen ihre Regelungen und Zustaendigkeiten geprueft.
              if (isReadinessControl(c.id)) { readiness.push(c); continue; }
              if (!isIso) { allowed.push(c); continue; }
              if (isMandatoryClauseControl(c.id)) { clause.push(c); continue; }
              const outside = scopeRef
                ? isoRefsAll(c.id).filter(r => !refInScope(r, scopeRef))
                : [];
              if (outside.length > 0) { shared.push(c); continue; }
              allowed.push(c);
            }
            return { allowed, clause, shared, readiness };
          };
          /** Referenzen einer Kontrolle, die AUSSERHALB des Bereichs liegen — für die Begründung. */
          const outsideRefs = (id: string, scopeRef?: string) =>
            scopeRef ? isoRefsAll(id).filter(r => !refInScope(r, scopeRef)) : [];
          const renderBulkButtons = (items: ControlRow[], size: "sm" | "xs" = "sm", groupLabel: string = g.label, scopeRef?: string) => {
            const activeBulk: AnswerStatus | null = (["ja","teilweise","nein","na"] as AnswerStatus[])
              .find(s => items.length > 0 && items.every(i => effective.get(i.id)?.status === s)) ?? null;
            const btn = (s: AnswerStatus, label: string, base: string, activeCls: string) => {
              const isActive = activeBulk === s;
              return (
                <Button
                  key={s}
                  variant="ghost"
                  size="sm"
                  aria-pressed={isActive}
                  className={`${size === "xs" ? "h-7 text-[11px] px-2.5" : "h-8 text-xs px-3"} border transition-all ${
                    isActive
                      ? `${activeCls} shadow-sm ring-2 ring-offset-1 ring-offset-muted/40`
                      : `border-transparent ${base}`
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    let ids = items.map(i => i.id);
                    // Toggle-Fall: alle haben bereits genau diesen Status → Klick löscht
                    // (handleBulk in Assessment.tsx) — kein Dialog nötig.
                    if (isActive) { onBulkStatus(ids, s); return; }
                    // Y6: „Alle → N.a." nur auf die Kontrollen anwenden, die an
                    // dieser Überschrift überhaupt ausgeschlossen werden dürfen.
                    if (s === "na") {
                      const gate = naGuard(items, scopeRef);
                      if (gate.allowed.length === 0) {
                        window.alert(de
                          ? `Für „${groupLabel}" kann kein Sammel-N.a. gesetzt werden.\n\n${gate.clause.length > 0 ? `${gate.clause.length} Kontrolle(n) bedienen eine Pflicht-Klausel (ISO/IEC 27001 4–10) und sind nicht ausschließbar.\n` : ""}${gate.shared.length > 0 ? `${gate.shared.length} Kontrolle(n) tragen zugleich außerhalb dieser Überschrift bei; ihr Status wird dort bewertet.\n` : ""}${gate.readiness.length > 0 ? `${gate.readiness.length} Vorbereitungskontrolle(n): Ein fehlendes Ereignis hebt die Anforderung nicht auf.\n` : ""}\nEinzelne Kontrollen können weiterhin direkt bewertet werden.`
                          : `Bulk N/A is not available for "${groupLabel}".\n\n${gate.clause.length > 0 ? `${gate.clause.length} control(s) serve a mandatory clause (ISO/IEC 27001 4–10) and cannot be excluded.\n` : ""}${gate.shared.length > 0 ? `${gate.shared.length} control(s) also contribute outside this heading; their status is assessed there.\n` : ""}${gate.readiness.length > 0 ? `${gate.readiness.length} readiness control(s): the absence of an event does not remove the requirement.\n` : ""}\nIndividual controls can still be assessed directly.`);
                        return;
                      }
                      if (gate.clause.length > 0 || gate.shared.length > 0 || gate.readiness.length > 0) {
                        const detail = [
                          gate.clause.length > 0
                            ? (de
                                ? `• ${gate.clause.length} Pflicht-Klausel-Kontrolle(n) (${gate.clause.slice(0, 5).map(c => `${c.id} → ${isoClauseRefs(c.id).join(", ")}`).join("; ")}${gate.clause.length > 5 ? " …" : ""})`
                                : `• ${gate.clause.length} mandatory-clause control(s) (${gate.clause.slice(0, 5).map(c => `${c.id} → ${isoClauseRefs(c.id).join(", ")}`).join("; ")}${gate.clause.length > 5 ? " …" : ""})`)
                            : "",
                          gate.shared.length > 0
                            ? (de
                                ? `• ${gate.shared.length} Kontrolle(n) mit Beitrag außerhalb dieser Überschrift (${gate.shared.slice(0, 5).map(c => `${c.id} → ${outsideRefs(c.id, scopeRef).join(", ")}`).join("; ")}${gate.shared.length > 5 ? " …" : ""})`
                                : `• ${gate.shared.length} control(s) contributing outside this heading (${gate.shared.slice(0, 5).map(c => `${c.id} → ${outsideRefs(c.id, scopeRef).join(", ")}`).join("; ")}${gate.shared.length > 5 ? " …" : ""})`)
                            : "",
                          gate.readiness.length > 0
                            ? (de
                                ? `• ${gate.readiness.length} Vorbereitungskontrolle(n) (${gate.readiness.slice(0, 5).map(c => c.id).join("; ")}${gate.readiness.length > 5 ? " …" : ""}) — fehlendes Ereignis ist kein Ausschlussgrund`
                                : `• ${gate.readiness.length} readiness control(s) (${gate.readiness.slice(0, 5).map(c => c.id).join("; ")}${gate.readiness.length > 5 ? " …" : ""}) — a missing event is not a reason for exclusion`)
                            : "",
                        ].filter(Boolean).join("\n");
                        const ok = window.confirm(de
                          ? `„${groupLabel}": ${gate.allowed.length} von ${items.length} Kontrolle(n) werden auf N.a. gesetzt.\n\nAusgenommen bleiben:\n${detail}\n\nFortfahren?`
                          : `"${groupLabel}": ${gate.allowed.length} of ${items.length} control(s) will be set to N/A.\n\nExcluded:\n${detail}\n\nContinue?`);
                        if (!ok) return;
                      }
                      ids = gate.allowed.map(i => i.id);
                    }
                    // Massen-Override absichern: nur warnen, wenn bereits bewertete
                    // Anforderungen mit ABWEICHENDEM Status überschrieben würden.
                    // Zählt über die TATSÄCHLICH betroffenen ids (nach Y6-Filter),
                    // nicht über alle sichtbaren Kontrollen.
                    const overwrite = ids.filter(id => {
                      const st = effective.get(id)?.status;
                      return st && st !== s;
                    }).length;
                    // P3.X.8 „Alle → N.a." / P3.X.6 „Alle → Umgesetzt": Bestätigung + Pflichtnotiz.
                    // „Teilweise"/„Offen": Bestätigung nur bei Überschreiben (wie bisher).
                    if (bulkNeedsNote(s) || overwrite > 0) {
                      setBulkReq({ status: s, ids, groupLabel, overwrite });
                      return;
                    }
                    onBulkStatus(ids, s);
                  }}
                >
                  {label}
                </Button>
              );
            };
            return (
              <div className={`${simple ? "flex flex-wrap" : "hidden md:flex"} items-center gap-1`} onClick={(e) => e.stopPropagation()}>
                {btn("ja",        de ? "Alle → Umgesetzt" : "All → Done",    "hover:border-success/40 hover:bg-success/10 hover:text-success",                        "bg-success text-success-foreground border-success ring-success/40")}
                {btn("teilweise", de ? "Alle → Teilweise" : "All → Partial", "hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-600",                  "st-teilweise-bg text-white st-teilweise-border ring-amber-400/40")}
                {btn("nein",      de ? "Alle → Nicht umgesetzt" : "All → Not implemented",           "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",            "bg-destructive text-destructive-foreground border-destructive ring-destructive/40")}
                {btn("na",        de ? "Alle → N.a." : "All → N/A",          "hover:border-muted-foreground/40 hover:bg-muted hover:text-foreground",                 "bg-muted-foreground text-background border-muted-foreground ring-muted-foreground/40")}
              </div>
            );
          };
          return (
            <div key={g.id} className="rounded-xl border border-border overflow-hidden">
              <div
                onClick={simple && !isIso ? undefined : () => setOpenFamilies(s => ({ ...s, [g.id]: !open }))}
                className={`w-full flex items-center gap-3 px-4 py-3 bg-muted/40 transition-colors ${simple && !isIso ? "" : "hover:bg-accent/10 cursor-pointer"}`}
              >
                {(!simple || isIso) && <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />}
                <span className="font-semibold text-base text-foreground text-left">{g.label}</span>
                <span className="text-sm text-muted-foreground">{fs.ans}/{fs.total} · {fs.pct}%</span>
                {simple && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    fs.ans === 0 ? "border-border text-muted-foreground"
                    : fs.pct >= 100 ? "st-ja-border st-ja-text"
                    : "st-teilweise-border st-teilweise-text"
                  }`}>
                    {fs.ans === 0 ? (de ? "Unbeantwortet" : "Unanswered") : fs.pct >= 100 ? (de ? "Umgesetzt" : "Done") : (de ? "In Bearbeitung" : "In progress")}
                  </span>
                )}
                {assets.length > 0 && scopedAssetCount(g.items) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                    <Server className="h-3 w-3" /> {assets.length} Assets
                  </span>
                )}
                <div className="flex-1" />
                {!simple && brDominant && (
                  <span
                    className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                      brMixed ? "st-teilweise-border st-teilweise-text" : "st-ja-border st-ja-text"
                    }`}
                    title={de ? "Konsistenz der bereits bewerteten Anforderungen in diesem Baustein" : "Consistency of already-assessed requirements in this block"}
                  >
                    {brMixed ? (de ? "gemischt" : "mixed") : (de ? "einheitlich" : "uniform")}
                  </span>
                )}
                {!simple && brDominant && brUnanswered.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-3 border border-dashed border-primary/40 text-primary hover:bg-primary/10"
                    title={de
                      ? `${brUnanswered.length} offene Anforderung(en) auf den dominanten Status „${brLabel(brDominant)}" setzen (Vorschlag, überschreibt nichts Bewertetes).`
                      : `Set ${brUnanswered.length} open requirement(s) to the dominant status "${brLabel(brDominant)}" (suggestion, overwrites nothing assessed).`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // „N.a."/„Umgesetzt" nur mit Pflichtnotiz (gleiche Regel wie Massenbuttons).
                      if (bulkNeedsNote(brDominant)) {
                        setBulkReq({ status: brDominant, ids: brUnanswered, groupLabel: g.label, overwrite: 0 });
                        return;
                      }
                      const ok = window.confirm(de
                        ? `${brUnanswered.length} offene Anforderung(en) in „${g.label}" auf „${brLabel(brDominant)}" setzen? Bereits bewertete bleiben unverändert.`
                        : `Set ${brUnanswered.length} open requirement(s) in "${g.label}" to "${brLabel(brDominant)}"? Already-assessed ones stay unchanged.`);
                      if (!ok) return;
                      onBulkStatus(brUnanswered, brDominant);
                    }}
                  >
                    {de ? `Lücken füllen → ${brLabel(brDominant)}` : `Fill gaps → ${brLabel(brDominant)}`}
                  </Button>
                )}
                {/* Familien-Ebene (A.5, A.8, Klausel 6 …): scopeRef = Familie,
                    damit ein Sammel-N.a. keine Kontrolle trifft, deren
                    Primärreferenz in einer anderen Familie liegt. */}
                {FEATURES.bulkAssessment && renderBulkButtons(g.items, "sm", g.label, isIso ? g.id : undefined)}

              </div>


              {/* Kontroll-Detailebene im Detail-Modus — und bei ISO 27001 auch im
                  Überblick, dort aber als Annex-A-Ebene (die 93): pro Überschrift
                  ein Bulk-Setzer, die Prüfkontrollen darunter nur auf Aufklappen. */}
              {(!simple || isIso) && open && (
                <div className="p-3 space-y-3 bg-background">
                  {(() => {
                    // ISO 27001 (Befund UI-1): Unterordner = echte Annex-Kontrolle / Klausel
                    // („A.5.1 · Informationssicherheitsrichtlinien", „6.1.3 · …") statt
                    // sequenzieller Zehnerblöcke „A.5.1–10", die Annex-Nummern vortäuschen.
                    const isoSubs = isIso ? (() => {
                      const m = new Map<string, { label: string; items: ControlRow[] }>();
                      // Wie oben: ALLE Referenzen, aber nur die, die zu dieser
                      // Familie gehören — sonst erschiene eine Kontrolle unter
                      // einer Überschrift, die nicht zur geöffneten Familie passt.
                      const inFamily = (r: string) =>
                        r.startsWith("A.") ? r.split(".").slice(0, 2).join(".") === g.id : r.split(".")[0] === g.id;
                      for (const c of g.items) {
                        const refs = isoRefsAll(c.id).filter(inFamily);
                        const keys = refs.length ? refs : [isoEntry(c.id)?.ref ?? c.id];
                        for (const id of keys) {
                          const t = annexRefTitles(id);
                          const label = t ? `${id} · ${de ? t[0] : t[1]}` : id;
                          if (!m.has(id)) m.set(id, { label, items: [] });
                          const bucket = m.get(id)!;
                          if (!bucket.items.some(x => x.id === c.id)) bucket.items.push(c);
                        }
                      }
                      return Array.from(m.entries())
                        .map(([id, s]) => ({ id, ...s }))
                        .sort((a, b) => annexSortKey(a.id) - annexSortKey(b.id));
                    })() : null;

                    // Only split into sub-accordions when the family is large
                    // (ISO: immer je Annex-Kontrolle, sobald ≥ 2 Kontrollen vorhanden).
                    if (isoSubs ? isoSubs.length <= 1 : g.items.length <= SUB_GROUP_THRESHOLD) {
                      return g.items.map(c => renderControlItem(c));
                    }

                    // Build sub-buckets.
                    const subMap = new Map<string, { label: string; items: ControlRow[] }>();
                    const unbucketed: ControlRow[] = [];
                    for (const c of (isoSubs ? [] : g.items)) {
                      const sf = subFamilyOf(c, { id: g.id, label: g.label }, de);
                      if (!sf) { unbucketed.push(c); continue; }
                      if (!subMap.has(sf.id)) subMap.set(sf.id, { label: sf.label, items: [] });
                      subMap.get(sf.id)!.items.push(c);
                    }
                    // Enrich the sub-group label with a representative title:
                    // 1) exact-id parent control if it exists, else
                    // 2) the title of the shortest-id item in the bucket
                    //    (e.g. BSI "KONF.1" → first item "KONF.1.1 Verfahren und Regelungen").
                    const controlById = new Map(g.items.map(c => [c.id, c] as const));
                    const titleOf = (c: ControlRow) =>
                      (de ? c.req_de : (c.req_en || c.req_de)) || "";
                    const subs = isoSubs ?? Array.from(subMap.entries())
                      .map(([id, s]) => {
                        const exact = controlById.get(id);
                        const rep = exact ?? [...s.items].sort(
                          (a, b) => a.id.length - b.id.length ||
                                    a.id.localeCompare(b.id, undefined, { numeric: true })
                        )[0];
                        const title = rep ? titleOf(rep).split(/[\n·—–-]/)[0].trim() : "";
                        const label = title ? `${s.label} · ${title}` : s.label;
                        return { id, label, items: s.items };
                      })
                      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));


                    // Fallback: if splitting produced only one bucket, render flat.
                    if (subs.length <= 1) {
                      return g.items.map(c => renderControlItem(c));
                    }

                    return (
                      <>
                        {subs.map(sg => {
                          const subKey = `${g.id}::${sg.id}`;
                          const subOpen = openSubs[subKey] ?? focusActive;
                          const sfs = familyStats(sg.items);
                          return (
                            <div key={subKey} className="rounded-lg border border-border/70 overflow-hidden">
                              <div
                                onClick={() => setOpenSubs(s => ({ ...s, [subKey]: !subOpen }))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 bg-muted/25 hover:bg-muted/50 transition-colors cursor-pointer"
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${subOpen ? "" : "-rotate-90"}`} />
                                <span className="text-sm font-medium text-foreground text-left">{sg.label}</span>
                                <span className="text-xs text-muted-foreground">{sfs.ans}/{sfs.total} · {sfs.pct}%</span>
                                {assets.length > 0 && scopedAssetCount(sg.items) > 0 && (
                                  <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                                    <Server className="h-3 w-3" /> {assets.length} Assets
                                  </span>
                                )}
                                <div className="flex-1" />
                                {/* scopeRef = die Überschrift selbst (A.5.23, 6.1.3 …);
                                    Y6-Filter braucht sie, um Zweitbeiträge zu erkennen. */}
                                {FEATURES.bulkAssessment && renderBulkButtons(sg.items, "xs", sg.label, isIso ? sg.id : undefined)}

                              </div>
                              {subOpen && (
                                <div className="p-3 space-y-3 bg-background">
                                  {sg.items.map(c => renderControlItem(c))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {unbucketed.length > 0 && (
                          <div className="pt-2 space-y-3">
                              {unbucketed.map(c => renderControlItem(c))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10 border border-dashed border-border rounded-xl">
            {de ? "Keine Kontrollen passen zum Filter." : "No controls match the filter."}
          </div>
        )}
      </div>
      )}

      <BulkStatusDialog
        request={bulkReq}
        de={de}
        onCancel={() => setBulkReq(null)}
        onConfirm={(req, note) => {
          setBulkReq(null);
          onBulkStatus(req.ids, req.status, note || undefined);
        }}
      />
    </div>
  );
}

function StatBox({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "destructive" }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${tone === "destructive" ? "text-destructive" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
