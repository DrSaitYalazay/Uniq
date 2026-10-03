import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Shield, AlertTriangle, CheckCircle2, XCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  SoAProjection,
  SoAProjectedControl,
  SoASavedData,
  SoAReasonType,
} from "@/lib/soaProjection";
import { SOA_REASON_LABEL } from "@/lib/soaProjection";
import type { Lang } from "@/contexts/LanguageContext";
import AiActSystemMatrix from "@/components/roadmap/AiActSystemMatrix";
import {
  isoEntry, annexSortKey, isoRefsAll, annexRefTitles, isoClauseRefs,
  isMandatoryClauseControl, type IsoAnnexEntry,
} from "@/data/isoAnnexMap";

type FilterKey = "all" | "applicable" | "not_applicable" | "excluded" | "missing_just";

/**
 * ISO 27001: Kontrollen nach Annex-A-Kontrolle (A.5.1 … A.8.34) bündeln.
 *
 * Es werden ALLE ISO-Referenzen einer Prüfkontrolle ausgewertet, nicht nur die
 * erste. Grund: acht der 93 Annex-A-Kontrollen (A.5.2, A.5.4, A.7.9, A.8.10,
 * A.8.12, A.8.18, A.8.19, A.8.31) kommen im Katalog ausschließlich als
 * Zweitreferenz vor. Nach der ersten Referenz allein hätte die SoA nur 85
 * Überschriften — ISO/IEC 27001 6.1.3 d verlangt aber eine Aussage zu JEDER
 * Annex-A-Kontrolle. Eine Prüfkontrolle kann dadurch unter zwei Überschriften
 * erscheinen; die Zähler laufen weiter über die flache, eindeutige Liste.
 */
function groupByAnnex(controls: SoAProjectedControl[]): { ref: string; label: string; entry?: IsoAnnexEntry; controls: SoAProjectedControl[] }[] {
  const m = new Map<string, { ref: string; label: string; entry?: IsoAnnexEntry; controls: SoAProjectedControl[] }>();
  const put = (ref: string, c: SoAProjectedControl) => {
    if (!m.has(ref)) m.set(ref, { ref, label: ref, entry: isoEntry(c.id), controls: [] });
    m.get(ref)!.controls.push(c);
  };
  for (const c of controls) {
    const refs = isoRefsAll(c.id).filter(r => r.startsWith("A."));
    if (refs.length === 0) {
      // Klausel-Kontrolle oder unbekannte ID: unter ihrer eigenen Referenz führen.
      put(isoEntry(c.id)?.ref ?? c.id, c);
      continue;
    }
    for (const ref of refs) put(ref, c);
  }
  // Titel/Eintrag der Überschrift selbst, nicht der ersten Kontrolle darunter.
  for (const g of m.values()) {
    const t = annexRefTitles(g.ref);
    if (t) g.entry = { ref: g.ref, titleDe: t[0], titleEn: t[1], kind: g.ref.startsWith("A.") ? "annex" : "clause" };
  }
  return Array.from(m.values()).sort((a, b) => annexSortKey(a.ref) - annexSortKey(b.ref));
}

interface Props {
  projection: SoAProjection;
  soaData: SoASavedData;
  setSoAData: (updater: (prev: SoASavedData) => SoASavedData) => void;
  lang: Lang;
  primaryFrameworkLabel: string;
  /** When set, control overrides are namespaced under `${namespace}:${controlId}` inside soaData.controls. */
  namespace?: string;
  /** Hide the outer title + summary strip so a parent can render them once. */
  embedded?: boolean;
}

export default function SoAPanel({ projection, soaData, setSoAData, lang, primaryFrameworkLabel, namespace, embedded }: Props) {
  const de = lang === "de";
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  /** Aufklapp-Zustand je Annex-A-Kontrolle (die 93). Standard: zu — entschieden
   *  wird auf Norm-Ebene, die Prüfkontrollen darunter sieht man nur bei Bedarf. */
  const [openAnnex, setOpenAnnex] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  /** P5.S.4: „Nicht anwendbar" für eine Kontrolle, die ein Risiko ≥ Hoch behandelt → Warn-Dialog. */
  const [riskyNa, setRiskyNa] = useState<SoAProjectedControl | null>(null);
  // ISO 27001: interne IDs (a5-04) sind Prüffragen-Nummern → Anzeige/Gruppierung über Annex-Map.
  const isIso = namespace === "ISO27001";

  const s = projection.stats;


  const toggleCat = (id: string) =>
    setOpenCats(prev => ({ ...prev, [id]: !prev[id] }));

  const updateControl = (id: string, patch: Partial<{ applicable: boolean; justification: string; reasonType: SoAReasonType }>) => {
    const storageKey = namespace ? `${namespace}:${id}` : id;
    setSoAData(prev => {
      const current = prev.controls?.[storageKey] ?? { applicable: true, justification: "" };
      const next = { ...current, ...patch };
      return {
        ...prev,
        controls: { ...(prev.controls ?? {}), [storageKey]: next },
      };
    });
  };


  const matchesFilter = (c: SoAProjectedControl) => {
    if (filter === "applicable") return c.applicable && !c.isExcluded;
    if (filter === "not_applicable") return !c.applicable;
    if (filter === "excluded") return c.isExcluded;
    if (filter === "missing_just") return c.missingJustification;
    return true;
  };

  const matchesSearch = (c: SoAProjectedControl) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const ann = isIso ? isoEntry(c.id) : undefined;
    return (
      c.id.toLowerCase().includes(q) ||
      (de ? c.name : c.nameEn).toLowerCase().includes(q) ||
      (de ? c.categoryTitle : c.categoryTitleEn).toLowerCase().includes(q) ||
      (!!ann && `${ann.ref} ${ann.titleDe} ${ann.titleEn}`.toLowerCase().includes(q))
    );
  };

  /** Anwendbarkeit setzen — bei „nicht anwendbar" + Risiko ≥ Hoch erst warnen (P5.S.4). */
  const requestApplicable = (c: SoAProjectedControl, checked: boolean) => {
    if (!checked && c.linkedToHighRisk) { setRiskyNa(c); return; }
    updateControl(c.id, { applicable: checked });
  };

  /**
   * Vollständige Mitgliedschaft je Annex-A-Überschrift — aus den UNGEFILTERTEN
   * Kategorien. Filter und Suche verkleinern nur die Anzeige; eine Entscheidung
   * auf Norm-Ebene muss trotzdem für die ganze Überschrift gelten, sonst ändert
   * der Nutzer unbemerkt nur die sichtbare Teilmenge.
   */
  const annexMembers = useMemo(() => {
    const m = new Map<string, SoAProjectedControl[]>();
    for (const cat of projection.categories) {
      for (const c of cat.controls) {
        const refs = isoRefsAll(c.id).filter(r => r.startsWith("A."));
        const keys = refs.length ? refs : [isoEntry(c.id)?.ref ?? c.id];
        for (const k of keys) {
          if (!m.has(k)) m.set(k, []);
          if (!m.get(k)!.some(x => x.id === c.id)) m.get(k)!.push(c);
        }
      }
    }
    return m;
  }, [projection.categories]);

  const annexKey = (ref: string) => (namespace ? `${namespace}:${ref}` : ref);

  /** Gespeicherte Entscheidung der Überschrift; ohne Eintrag gilt „anwendbar". */
  const annexDecision = (ref: string) => soaData?.annex?.[annexKey(ref)];
  const annexApplicable = (ref: string) => annexDecision(ref)?.applicable ?? true;

  /**
   * Entscheidung auf Annex-A-Ebene (die 93 Kontrollen der Norm).
   *
   * Die Entscheidung wird AN DER ÜBERSCHRIFT gespeichert, nicht in den
   * Prüfkontrollen — eine Prüfkontrolle kann zu mehreren Annex-A-Kontrollen
   * gehören (z. B. DATA-DELETE → A.5.33 und A.8.10). Würde man direkt in die
   * Kontrolle schreiben, würde ein „nicht anwendbar" bei A.8.10 die Überschrift
   * A.5.33 mit umkippen.
   *
   * Die Anwendbarkeit der Prüfkontrolle wird abgeleitet: anwendbar, sobald
   * MINDESTENS EINE ihrer Überschriften anwendbar ist. Umsetzungsstatus und
   * Nachweise bleiben genau ein Datensatz je Prüfkontrolle (werden hier nicht
   * berührt). „Nicht anwendbar" verlangt eine Begründung (ISO 6.1.3 d).
   */
  const setAnnexApplicable = (ref: string, checked: boolean) => {
    const titles = annexRefTitles(ref);
    const title = titles ? (de ? titles[0] : titles[1]) : ref;
    const members = annexMembers.get(ref) ?? [];
    let justification = "";

    if (!checked) {
      const highRisk = members.filter(c => c.linkedToHighRisk);
      if (highRisk.length > 0) {
        const ok = window.confirm(de
          ? `${ref} · ${title}: ${highRisk.length} Kontrolle(n) dieser Überschrift behandeln ein Risiko der Stufe „Hoch“ oder höher. Trotzdem als „nicht anwendbar“ erklären?`
          : `${ref} · ${title}: ${highRisk.length} control(s) under this heading treat a risk rated "high" or above. Declare not applicable anyway?`);
        if (!ok) return;
      }
      // Y6: Kontrollen, die zugleich eine Pflicht-Klausel (4–10) bedienen,
      // bleiben trotz Ausschluss dieser Überschrift anwendbar. Das vorher
      // sagen, damit der Ausschluss nicht als Stilllegung missverstanden wird.
      const clauseBound = members.filter(c => isMandatoryClauseControl(c.id));
      if (clauseBound.length > 0) {
        window.alert(de
          ? `Hinweis zu ${ref} · ${title}:\n\n${clauseBound.length} von ${members.length} Prüfkontrolle(n) dieser Überschrift tragen zugleich zu einer Pflicht-Klausel (ISO/IEC 27001 4–10) bei. Diese bleiben anwendbar — der Ausschluss gilt nur für die Annex-A-Referenz ${ref}.\n\nBetroffen: ${clauseBound.slice(0, 8).map(c => `${c.id} → ${isoClauseRefs(c.id).join(", ")}`).join("\n")}${clauseBound.length > 8 ? `\n… und ${clauseBound.length - 8} weitere` : ""}`
          : `Note on ${ref} · ${title}:\n\n${clauseBound.length} of ${members.length} check control(s) under this heading also contribute to a mandatory clause (ISO/IEC 27001 4–10). Those stay applicable — the exclusion applies to Annex A reference ${ref} only.\n\nAffected: ${clauseBound.slice(0, 8).map(c => `${c.id} → ${isoClauseRefs(c.id).join(", ")}`).join("\n")}${clauseBound.length > 8 ? `\n… and ${clauseBound.length - 8} more` : ""}`);
      }
      const input = window.prompt(de
        ? `Begründung für „nicht anwendbar“ — ${ref} · ${title}\n(ISO/IEC 27001 6.1.3 d verlangt eine Begründung für jeden Ausschluss.)`
        : `Justification for "not applicable" — ${ref} · ${title}\n(ISO/IEC 27001 6.1.3 d requires a justification for every exclusion.)`, annexDecision(ref)?.justification ?? "");
      if (input === null) return;                       // abgebrochen
      if (!input.trim()) {
        window.alert(de
          ? `Ohne Begründung kann ${ref} nicht auf „nicht anwendbar“ gesetzt werden.`
          : `Without a justification ${ref} cannot be set to "not applicable".`);
        return;
      }
      justification = input.trim();
    }

    setSoAData(prev => {
      const nextAnnex = { ...(prev.annex ?? {}) };
      nextAnnex[annexKey(ref)] = { applicable: checked, justification };

      // Abgeleitete Anwendbarkeit je betroffener Prüfkontrolle neu berechnen.
      const nextControls = { ...(prev.controls ?? {}) };
      for (const c of members) {
        const headings = isoRefsAll(c.id).filter(r => r.startsWith("A."));
        const scope = headings.length ? headings : [ref];
        const decisions = scope.map(r => nextAnnex[annexKey(r)]);
        // Y6: Der Referenzentscheid einer Überschrift darf einen ANDEREN
        // geltenden Beitrag derselben Prüfkontrolle nicht mit abschalten.
        // Die Kontrolle bleibt anwendbar, solange
        //  (a) mindestens eine ihrer Annex-A-Überschriften anwendbar ist ODER
        //  (b) sie zu einer Klausel 4–10 beiträgt. Die Klauseln sind Pflicht;
        //      ISO/IEC 27001 6.1.3 d erlaubt Ausschlüsse nur für Annex A. Ein
        //      „nicht anwendbar" bei A.5.33 darf deshalb keine Kontrolle
        //      stilllegen, die zugleich 7.5.3 bedient.
        const clauseRefs = isoClauseRefs(c.id);
        const annexApplicableSomewhere = scope.some((_, i) => decisions[i]?.applicable ?? true);
        const applicable = annexApplicableSomewhere || clauseRefs.length > 0;
        const reasons = scope
          .map((r, i) => (decisions[i] && decisions[i]!.applicable === false && decisions[i]!.justification)
            ? `${r}: ${decisions[i]!.justification}` : "")
          .filter(Boolean);
        // Bleibt nur wegen einer Pflicht-Klausel anwendbar → im Text festhalten,
        // damit im Bericht nachvollziehbar ist, WARUM sie trotz Ausschluss steht.
        const clauseNote = (!annexApplicableSomewhere && clauseRefs.length > 0)
          ? (de
              ? `Bleibt anwendbar über Pflicht-Klausel ${clauseRefs.join(", ")} (ISO/IEC 27001 4–10 sind nicht ausschließbar). Ausgeschlossene Annex-Referenz(en): ${reasons.join(" | ")}`
              : `Remains applicable via mandatory clause ${clauseRefs.join(", ")} (ISO/IEC 27001 4–10 cannot be excluded). Excluded Annex reference(s): ${reasons.join(" | ")}`)
          : "";
        const key = namespace ? `${namespace}:${c.id}` : c.id;
        const cur = nextControls[key] ?? { applicable: true, justification: "" };
        nextControls[key] = {
          ...cur,
          applicable,
          justification: applicable
            ? (clauseNote || cur.justification)
            : reasons.join(" | "),
        };
      }
      return { ...prev, annex: nextAnnex, controls: nextControls };
    });
  };

  const filteredCategories = useMemo(() => {
    return projection.categories
      .map(cat => ({
        ...cat,
        controls: cat.controls.filter(c => matchesFilter(c) && matchesSearch(c)),
      }))
      .filter(cat => cat.controls.length > 0);
  }, [projection.categories, filter, search, de]);

  const filteredCustom = useMemo(
    () => projection.manualControls.filter(c => matchesFilter(c) && matchesSearch(c)),
    [projection.manualControls, filter, search, de]
  );

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    filteredCategories.forEach(c => { all[c.id] = true; });
    if (filteredCustom.length) all["__custom"] = true;
    setOpenCats(all);
  };
  const collapseAll = () => { setOpenCats({}); setOpenAnnex({}); };

  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {de ? "Anwendbarkeitserklärung (SoA)" : "Statement of Applicability (SoA)"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {de
                ? `Katalog: ${primaryFrameworkLabel}. Legen Sie pro Kontrolle fest, ob sie für Ihre Organisation anwendbar ist, und dokumentieren Sie die Begründung. Nicht anwendbare und ausgeschlossene Kontrollen werden aus der Roadmap entfernt.`
                : `Catalog: ${primaryFrameworkLabel}. For each control decide if it applies to your organisation and document the justification. Non-applicable and excluded controls are removed from the Roadmap.`}
            </p>
          </div>
        </div>
      )}

      {!embedded && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label={de ? "Gesamt" : "Total"} value={s.total} tone="neutral" />
          <StatCard label={de ? "Anwendbar" : "Applicable"} value={s.applicable} tone="ok" />
          <StatCard label={de ? "Nicht anwendbar" : "Not applicable"} value={s.notApplicable} tone="muted" />
          <StatCard label={de ? "Ausgeschlossen" : "Excluded"} value={s.excludedCount} tone="warn" />
          <StatCard label={de ? "Begründung fehlt" : "Missing justification"} value={s.missingJustification} tone="danger" />
          {s.notYetApplicable > 0 && (
            <StatCard label={de ? "Gilt später (Pflicht beginnt erst)" : "Applies later (duty not yet in force)"} value={s.notYetApplicable} tone="neutral" />
          )}
        </div>
      )}

      {/* AI Act: Matrix System × Rolle × Kontrolle + Rollenkonsistenz (C-5/C-7) */}
      {namespace === "AIACT" && <AiActSystemMatrix projection={projection} de={de} />}


      {/* Controls: filter + search */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={de ? "Kontrolle suchen…" : "Search control…"}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", de ? "Alle" : "All"],
              ["applicable", de ? "Anwendbar" : "Applicable"],
              ["not_applicable", de ? "Nicht anwendbar" : "Not applicable"],
              ["excluded", de ? "Ausgeschlossen" : "Excluded"],
              ["missing_just", de ? "Begründung fehlt" : "Missing just."],
            ] as [FilterKey, string][]
          ).map(([k, label]) => (
            <Button
              key={k}
              variant={filter === k ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setFilter(k)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={expandAll}>
            {de ? "Alle öffnen" : "Expand all"}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={collapseAll}>
            {de ? "Alle schließen" : "Collapse all"}
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {filteredCategories.length === 0 && filteredCustom.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {de ? "Keine Kontrollen für aktuellen Filter." : "No controls for current filter."}
            </CardContent>
          </Card>
        )}

        {filteredCategories.map(cat => {
          const isOpen = openCats[cat.id] ?? false;
          return (
            <Card key={cat.id} className="overflow-hidden">
              <button
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{cat.article}</span>
                    <span className="font-semibold text-sm text-foreground truncate">
                      {de ? cat.title : cat.titleEn}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {cat.controls.length}
                </Badge>
              </button>
              {isOpen && !isIso && (
                <div className="border-t border-border divide-y divide-border">
                  {cat.controls.map(c => (
                    <ControlRow
                      key={c.id}
                      control={c}
                      de={de}
                      onChange={(patch) => updateControl(c.id, patch)}
                      onApplicable={(checked) => requestApplicable(c, checked)}
                    />
                  ))}
                </div>
              )}
              {isOpen && isIso && (
                <div className="border-t border-border">
                  {groupByAnnex(cat.controls).map(grp => {
                    // Zähler und Entscheidung immer über die VOLLE Mitgliedschaft
                    // der Überschrift, nicht über die gefilterte Anzeige.
                    const members = annexMembers.get(grp.ref) ?? grp.controls;
                    const applicableN = members.filter(c => c.applicable && !c.isExcluded).length;
                    const total = members.length;
                    const decided = annexDecision(grp.ref);
                    // Zustand: gespeicherte Norm-Entscheidung hat Vorrang; ohne
                    // Entscheidung aus den Kontrollen ableiten.
                    const groupState: "yes" | "no" | "mixed" = decided
                      ? (decided.applicable ? "yes" : "no")
                      : applicableN === total ? "yes" : applicableN === 0 ? "no" : "mixed";
                    const hiddenN = total - grp.controls.length;
                    // Y6: Mitglieder, die zugleich eine Pflicht-Klausel bedienen —
                    // ein Ausschluss dieser Überschrift schaltet sie NICHT ab.
                    const clauseBoundN = members.filter(c => isMandatoryClauseControl(c.id)).length;
                    const annexOpenKey = `${cat.id}::${grp.ref}`;
                    const annexOpen = openAnnex[annexOpenKey] ?? false;
                    return (
                      <div key={grp.ref} className="border-b border-border last:border-b-0">
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
                          <button
                            type="button"
                            onClick={() => setOpenAnnex(s => ({ ...s, [annexOpenKey]: !annexOpen }))}
                            className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            aria-expanded={annexOpen}
                            title={de
                              ? `${total} Prüfkontrolle(n) ein-/ausklappen`
                              : `Expand/collapse ${total} check control(s)`}
                          >
                            {annexOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">{grp.ref}</span>
                            <span className="text-sm font-medium text-foreground truncate">
                              {grp.entry ? (de ? grp.entry.titleDe : grp.entry.titleEn) : grp.ref}
                            </span>
                            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                              {applicableN}/{total} {de ? "anwendbar" : "applicable"}
                            </span>
                            {hiddenN > 0 && (
                              <span className="text-[10px] text-muted-foreground shrink-0"
                                    title={de
                                      ? `${hiddenN} Kontrolle(n) sind durch Filter/Suche ausgeblendet. Die Entscheidung gilt trotzdem für alle ${total}.`
                                      : `${hiddenN} control(s) hidden by filter/search. The decision still applies to all ${total}.`}>
                                ({de ? `${hiddenN} ausgeblendet` : `${hiddenN} hidden`})
                              </span>
                            )}
                            {groupState === "mixed" && (
                              <Badge variant="outline" className="text-[10px] st-teilweise-border st-teilweise-text shrink-0">
                                {de ? "gemischt" : "mixed"}
                              </Badge>
                            )}
                            {clauseBoundN > 0 && (
                              <Badge variant="outline" className="text-[10px] shrink-0"
                                     title={de
                                       ? `${clauseBoundN} Prüfkontrolle(n) dieser Überschrift tragen zugleich zu einer Pflicht-Klausel (ISO/IEC 27001 4–10) bei. Ein Ausschluss von ${grp.ref} schaltet sie nicht ab — die Klauseln sind nicht ausschließbar.`
                                       : `${clauseBoundN} check control(s) under this heading also contribute to a mandatory clause (ISO/IEC 27001 4–10). Excluding ${grp.ref} does not switch them off — clauses cannot be excluded.`}>
                                {de ? `${clauseBoundN}× Pflicht-Klausel` : `${clauseBoundN}× mandatory clause`}
                              </Badge>
                            )}
                          </button>
                          {/* Entscheidung auf Norm-Ebene (93 Annex-A-Kontrollen) — greift auf alle
                              Prüfkontrollen dieser Überschrift durch. */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-pressed={groupState === "yes"}
                              className={`h-7 text-[11px] px-2.5 border ${
                                groupState === "yes"
                                  ? "st-ja-bg text-white st-ja-border"
                                  : "border-transparent hover:border-emerald-500/40 hover:bg-emerald-500/10"
                              }`}
                              onClick={() => setAnnexApplicable(grp.ref, true)}
                            >
                              {de ? "Anwendbar" : "Applicable"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              aria-pressed={groupState === "no"}
                              className={`h-7 text-[11px] px-2.5 border ${
                                groupState === "no"
                                  ? "bg-muted-foreground text-background border-muted-foreground"
                                  : "border-transparent hover:border-muted-foreground/40 hover:bg-muted"
                              }`}
                              onClick={() => setAnnexApplicable(grp.ref, false)}
                            >
                              {de ? "Nicht anwendbar" : "Not applicable"}
                            </Button>
                          </div>
                        </div>
                        {annexOpen && (
                          <div className="divide-y divide-border">
                            {grp.controls.map(c => (
                              <ControlRow
                                key={c.id}
                                control={c}
                                de={de}
                                annex={grp.entry}
                                onChange={(patch) => updateControl(c.id, patch)}
                                onApplicable={(checked) => requestApplicable(c, checked)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}

        {filteredCustom.length > 0 && (
          <Card className="overflow-hidden border-secondary/40">
            <button
              onClick={() => toggleCat("__custom")}
              className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
            >
              {(openCats["__custom"] ?? false) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <div className="flex-1">
                <span className="font-semibold text-sm text-foreground">
                  {de ? "Benutzerdefinierte Kontrollen" : "User-defined controls"}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {filteredCustom.length}
              </Badge>
            </button>
            {(openCats["__custom"] ?? false) && (
              <div className="border-t border-border divide-y divide-border">
                {filteredCustom.map(c => (
                  <ControlRow
                    key={c.id}
                    control={c}
                    de={de}
                    onChange={(patch) => updateControl(c.id, patch)}
                    onApplicable={(checked) => requestApplicable(c, checked)}
                  />
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* P5.S.4 — Warn-Dialog: Kontrolle behandelt ein Risiko ≥ Hoch, soll aber ausgeschlossen werden */}
      <AlertDialog open={!!riskyNa} onOpenChange={(o) => { if (!o) setRiskyNa(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {de ? "Diese Kontrolle behandelt ein hohes Risiko — trotzdem ausschließen?" : "This control treats a high risk — exclude it anyway?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-xs space-y-2">
                {riskyNa && (
                  <p>
                    <span className="font-mono font-semibold text-foreground">
                      {isIso ? isoEntry(riskyNa.id)?.ref ?? riskyNa.id : riskyNa.id}
                    </span>
                    {" · "}{de ? riskyNa.name : riskyNa.nameEn}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {de
                    ? "Die Kontrolle ist in der Risikobehandlung (Phase 04) als gewählte/vorgeschlagene Maßnahme für mindestens ein Risiko der Stufe Hoch oder Kritisch geführt. Wird sie als „nicht anwendbar“ markiert, bleibt dieses Risiko ohne diese Maßnahme — die SoA kennzeichnet den Eintrag als „Risikoreiche NA“."
                    : "This control is listed in risk treatment (Phase 04) as a selected/suggested measure for at least one High or Critical risk. Marking it as not applicable leaves that risk without this measure — the SoA flags the entry as a \"risky NA\"."}
                </p>
                {riskyNa && riskyNa.linkedRisks.filter(r => r.risk_level === "high" || r.risk_level === "critical").length > 0 && (
                  <ul className="list-disc pl-4 space-y-0.5">
                    {riskyNa.linkedRisks
                      .filter(r => r.risk_level === "high" || r.risk_level === "critical")
                      .slice(0, 5)
                      .map(r => (
                        <li key={r.risk_id}>
                          <span className="font-mono text-[10.5px]">{r.risk_id}</span>
                          {" · "}
                          <span className={r.risk_level === "critical" ? "text-destructive font-semibold" : "st-teilweise-text font-semibold"}>
                            {r.risk_level === "critical" ? (de ? "Kritisch" : "Critical") : (de ? "Hoch" : "High")}
                          </span>
                          {" · "}{de ? r.description : (r.description_en || r.description)}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{de ? "Abbrechen (bleibt anwendbar)" : "Cancel (stays applicable)"}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (riskyNa) updateControl(riskyNa.id, { applicable: false }); setRiskyNa(null); }}
            >
              {de ? "Trotzdem ausschließen" : "Exclude anyway"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Sub-components ──

function StatCard({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "danger" | "muted" | "neutral" }) {
  const toneCls =
    tone === "ok" ? "st-ja-text" :
    tone === "warn" ? "st-teilweise-text" :
    tone === "danger" ? "text-destructive" :
    tone === "muted" ? "text-muted-foreground" :
    "text-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className={`text-2xl font-bold ${toneCls}`}>{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function ControlRow({
  control,
  de,
  annex,
  onChange,
  onApplicable,
}: {
  control: SoAProjectedControl;
  de: boolean;
  /** ISO 27001: zugeordnete Annex-Kontrolle (Anzeige „A.5.1 · Titel", interne ID im Tooltip). */
  annex?: IsoAnnexEntry;
  onChange: (patch: Partial<{ applicable: boolean; justification: string; reasonType: SoAReasonType }>) => void;
  /** Anwendbarkeit umschalten (läuft über den Risiko-Check P5.S.4). */
  onApplicable: (checked: boolean) => void;
}) {
  const label = de ? control.name : control.nameEn;
  const effectiveApplicable = control.applicable && !control.isExcluded;

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {annex ? (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 bg-primary/10 rounded text-primary font-semibold"
                title={`${de ? "Interne Prüffrage" : "Internal check item"} ${control.id} · ${annex.ref} ${de ? annex.titleDe : annex.titleEn}`}
              >
                {annex.ref}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                {control.id}
              </span>
            )}
            {control.linkedToHighRisk && effectiveApplicable && (
              <Badge variant="outline" className="text-[10px] gap-1 st-teilweise-border st-teilweise-text"
                     title={de ? "Behandelt ein Risiko der Stufe Hoch/Kritisch (Phase 04)" : "Treats a High/Critical risk (Phase 04)"}>
                <AlertTriangle className="h-3 w-3" />
                {de ? "Risiko ≥ Hoch" : "Risk ≥ High"}
              </Badge>
            )}
            {control.isExcluded && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <XCircle className="h-3 w-3" />
                {de ? "Ausgeschlossen (Risikobehandlung, Phase 04)" : "Excluded (risk treatment, Phase 04)"}
              </Badge>
            )}
            {control.isRiskyExclusion && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                {de ? "Risikoreiche NA" : "Risky NA"}
              </Badge>
            )}
            {control.isRollup && (
              <Badge variant="outline" className="text-[10px]" title={de ? "Status aus den Einzelkontrollen abgeleitet; zählt nicht mit." : "Status derived from the individual controls; not counted."}>
                {de ? "Übersicht · nicht gezählt" : "Overview · not counted"}
              </Badge>
            )}
            {control.notYetApplicable && control.catalog?.appliesFrom && (
              <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-700 dark:text-blue-300"
                     title={control.catalog.appliesFromNote ?? ""}>
                {de ? "Gilt ab " : "Applies from "}{control.catalog.appliesFrom.split("-").reverse().join(".")}
              </Badge>
            )}
            {control.catalog?.policyFlag && (
              <Badge variant="outline" className="text-[10px]">
                {control.catalog.policyFlag === "interne_vorgabe" ? (de ? "Interne Vorgabe" : "Internal target") : (de ? "Interne Praxis" : "Internal practice")}
              </Badge>
            )}
            {effectiveApplicable && control.implStatus === "ja" && (
              <Badge variant="outline" className="text-[10px] gap-1 st-ja-border st-ja-text">
                <CheckCircle2 className="h-3 w-3" />
                {de ? "Umgesetzt" : "Implemented"}
              </Badge>
            )}
          </div>
          <div className="text-sm text-foreground mt-1">{label}</div>
          {(control.catalog?.legalRef || control.catalog?.role?.length) && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {control.catalog?.legalRef}
              {control.catalog?.role?.length ? ` · ${de ? "Rolle" : "Role"}: ${control.catalog.role.map(r => ({ anbieter: de ? "Anbieter" : "Provider", betreiber: de ? "Betreiber" : "Deployer", einfuehrer: de ? "Einführer" : "Importer", haendler: de ? "Händler" : "Distributor", gpai_anbieter: de ? "GPAI-Anbieter" : "GPAI provider" } as Record<string, string>)[r] ?? r).join(", ")}` : ""}
            </div>
          )}
        </div>

        {/* Applicability toggle — disabled if excluded in risk treatment (Phase 04) (that decision is authoritative) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-medium ${effectiveApplicable ? "st-ja-text" : "text-muted-foreground"}`}>
            {effectiveApplicable ? (de ? "Anwendbar" : "Applicable") : (de ? "Nicht anwendbar" : "Not applicable")}
          </span>
          <Switch
            checked={control.applicable}
            disabled={control.isExcluded}
            onCheckedChange={(checked) => onApplicable(checked)}
            aria-label={de ? "Anwendbarkeit umschalten" : "Toggle applicability"}
          />
        </div>
      </div>

      {/* Justification — required when not applicable.
          K1 (Katalogvertrag control_selection_record): Auch bei einer
          ANWENDBAREN Annex-A-Kontrolle gehört die Auswahlbegründung ins
          Protokoll — warum diese Umsetzung, welche Pflichten gelten, welche
          gleichwertige Alternative geprüft wurde. Deshalb fragt der
          Platzhalter das hier ab, statt nur „optionale Begründung" zu sagen. */}
      {(!control.applicable || control.isExcluded || control.justification) && (
        <div className="space-y-1.5">
          {!control.applicable && !control.isExcluded && (
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor={`rt-${control.id}`} className="text-muted-foreground">{de ? "Begründungsart" : "Reason type"}</label>
              <select
                id={`rt-${control.id}`}
                value={control.reasonType ?? ""}
                onChange={(e) => onChange({ reasonType: (e.target.value || undefined) as SoAReasonType })}
                className="h-7 rounded border border-border bg-background px-1.5 text-xs"
              >
                <option value="">{de ? "— wählen —" : "— choose —"}</option>
                {(Object.keys(SOA_REASON_LABEL) as SoAReasonType[]).map(k => (
                  <option key={k} value={k}>{SOA_REASON_LABEL[k][de ? "de" : "en"]}</option>
                ))}
              </select>
            </div>
          )}
          <Textarea
            value={control.isExcluded ? control.exclusionReason : control.justification}
            disabled={control.isExcluded}
            onChange={(e) => onChange({ justification: e.target.value })}
            placeholder={
              control.isExcluded
                ? (de ? "Ausschlussgrund aus der Risikobehandlung (Phase 04)" : "Exclusion reason from risk treatment (Phase 04)")
                : !control.applicable
                  ? (de ? "Begründung für Nicht-Anwendbarkeit (Pflicht für Audit)" : "Justification for non-applicability (required for audit)")
                  : (de
                      ? "Auswahlbegründung: warum diese Umsetzung, welche Pflichten gelten, welche gleichwertige Alternative geprüft wurde"
                      : "Selection rationale: why this implementation, which obligations apply, which equivalent alternative was considered")
            }
            className="min-h-[60px] text-xs"
          />
          {control.missingJustification && (
            <p className="text-[11px] text-destructive mt-1">
              {de ? "⚠ Begründung ist für Audit-Nachweis erforderlich." : "⚠ Justification is required as audit evidence."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
