import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Plus, Check, X, Filter, PenLine, ShieldAlert, Database, Loader2 } from "lucide-react";
import { searchCatalogRisks, getThreatCategories, type IndexedRisk } from "@/data/allRisksIndex";
import { zokNodes } from "@/data/zielobjektkategorien";
import type { ManualRisk, DbRiskRow } from "@/lib/manualRisks";
import { dbRiskTitle } from "@/lib/manualRisks";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export interface RiskPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Catalog risk IDs already added (so we can mark them). */
  addedCatalogIds: Set<string>;
  /** Add a catalog risk by its IndexedRisk entry. */
  onAddCatalog: (ir: IndexedRisk) => void;
  /** Add a risk text from the DB table `risks` (Stichwortsuche). Optional — Tab erscheint nur, wenn gesetzt. */
  onAddDb?: (row: DbRiskRow) => void;
  /** Save (add or update) a custom risk. */
  onSaveCustom: (risk: ManualRisk) => void;
  /** Available assets for asset-scoped selection. */
  assets: { id: string; asset_name: string }[];
  lang: "de" | "en";
  /** Matrix max likelihood/impact (axis sizes). */
  maxL: number;
  maxI: number;
  /** When set, opens directly in custom-edit mode pre-filled. */
  editing?: ManualRisk | null;
}

const THREAT_CATS = getThreatCategories();

export function RiskPicker({
  open, onOpenChange, addedCatalogIds, onAddCatalog, onAddDb, onSaveCustom,
  assets, lang, maxL, maxI, editing,
}: RiskPickerProps) {
  const de = lang === "de";
  const [tab, setTab] = useState<string>(editing ? "custom" : "catalog");

  // ── DB tab state (Tabelle `risks`, Stichwortsuche per ILIKE) ──
  const [dbQuery, setDbQuery] = useState("");
  const [dbRows, setDbRows] = useState<DbRiskRow[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  useEffect(() => {
    if (!onAddDb || tab !== "db") return;
    const q = dbQuery.trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      setDbLoading(true); setDbError(null);
      try {
        // Ein ILIKE-Filter auf die Sprachspalte (Gateway-Whitelist: ilike). Ohne
        // Stichwort: die ersten 60 aktiven Einträge (Stöbern).
        let qb: any = supabase
          .from("risks")
          .select("risk_id, text_de, text_en, stufe, typ, quelle, primary_control_framework, primary_control_id")
          .eq("status", "active");
        if (q) qb = qb.ilike(de ? "text_de" : "text_en", `%${q}%`);
        const { data, error } = await qb.order("risk_id").limit(60);
        if (cancelled) return;
        if (error) { setDbError(error.message ?? String(error)); setDbRows([]); }
        else setDbRows((data ?? []) as DbRiskRow[]);
      } catch (e: any) {
        if (!cancelled) { setDbError(e?.message ?? String(e)); setDbRows([]); }
      } finally {
        if (!cancelled) setDbLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [dbQuery, tab, de, onAddDb]);

  // ── Catalog tab state ──
  const [query, setQuery] = useState("");
  const [cia, setCia] = useState<string>("all");
  const [threat, setThreat] = useState<string>("all");
  const [zokFilter, setZokFilter] = useState<string>("all");
  const [showOnlyUnselected, setShowOnlyUnselected] = useState(true);

  const results = useMemo<IndexedRisk[]>(() => searchCatalogRisks({
    query,
    cia: cia === "all" ? undefined : (cia as "C" | "I" | "A"),
    threatCategory: threat === "all" ? undefined : threat,
    zokId: zokFilter === "all" ? undefined : (zokFilter as IndexedRisk["zok_ids"][number]),
    excludeIds: showOnlyUnselected ? addedCatalogIds : undefined,
    limit: 200,
  }), [query, cia, threat, zokFilter, showOnlyUnselected, addedCatalogIds]);

  // ── Custom tab state ──
  const blank = (): ManualRisk => ({
    id: "",
    source: "custom",
    title_de: "", title_en: "",
    description_de: "", description_en: "",
    likelihood: Math.max(1, Math.ceil(maxL / 2)),
    impact: Math.max(1, Math.ceil(maxI / 2)),
    scope: "organization",
    asset_id: null,
    asset_name: null,
    threat_category: "",
    cia: ["C", "I", "A"],
    created_at: new Date().toISOString(),
  });
  const [draft, setDraft] = useState<ManualRisk>(editing ?? blank());

  useEffect(() => {
    if (open) {
      setTab(editing ? "custom" : "catalog");
      setDraft(editing ?? blank());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  function toggleCia(c: "C" | "I" | "A") {
    setDraft(d => ({
      ...d,
      cia: d.cia?.includes(c) ? d.cia.filter(x => x !== c) : [...(d.cia ?? []), c],
    }));
  }

  function handleSaveCustom() {
    if (!draft.title_de.trim()) return;
    const asset = draft.scope === "asset" && draft.asset_id
      ? assets.find(a => a.id === draft.asset_id) : null;
    onSaveCustom({
      ...draft,
      title_en: draft.title_en.trim() || draft.title_de.trim(),
      description_en: draft.description_en.trim() || draft.description_de.trim(),
      asset_id: asset?.id ?? null,
      asset_name: asset?.asset_name ?? null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            {editing
              ? (de ? "Eigenes Risiko bearbeiten" : "Edit Custom Risk")
              : (de ? "Risiko hinzufügen" : "Add Risk")}
          </DialogTitle>
          <DialogDescription>
            {de
              ? "Wählen Sie ein typisches Risiko aus dem Katalog (ISO 27002 / BSI IT-Grundschutz) oder erfassen Sie ein eigenes Risiko manuell."
              : "Pick a typical risk from the catalog (ISO 27002 / BSI IT-Grundschutz) or capture your own risk manually."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full">
            <TabsTrigger value="catalog" disabled={!!editing} className="flex-1 gap-1.5 text-xs">
              <Search className="h-3 w-3" />
              {de ? "Aus Katalog" : "From Catalog"}
            </TabsTrigger>
            {onAddDb && (
              <TabsTrigger value="db" disabled={!!editing} className="flex-1 gap-1.5 text-xs">
                <Database className="h-3 w-3" />
                {de ? "Risikotexte (Datenbank)" : "Risk texts (database)"}
              </TabsTrigger>
            )}
            <TabsTrigger value="custom" className="flex-1 gap-1.5 text-xs">
              <PenLine className="h-3 w-3" />
              {de ? "Eigenes Risiko" : "Custom Risk"}
            </TabsTrigger>
          </TabsList>

          {/* ── DB TAB (Tabelle `risks`) ── */}
          {onAddDb && (
            <TabsContent value="db" className="flex-1 flex flex-col min-h-0 space-y-3 mt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={de ? "Stichwort im Risikotext (z. B. Ransomware, Backup, Lieferant)…" : "Keyword in risk text (e.g. ransomware, backup, supplier)…"}
                  value={dbQuery}
                  onChange={(e) => setDbQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
                {dbQuery && (
                  <button onClick={() => setDbQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{de ? "Quelle: Risikokatalog der Datenbank (Bedrohung → Folge → Rechtsfolge)" : "Source: database risk catalog (threat → consequence → legal consequence)"}</span>
                <span>{dbLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `${dbRows.length} ${de ? "Treffer" : "results"}${dbRows.length === 60 ? " (max)" : ""}`}</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain border rounded-lg">
                {dbError ? (
                  <div className="p-6 text-center text-sm text-destructive">{dbError}</div>
                ) : dbRows.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {dbLoading ? (de ? "Suche läuft…" : "Searching…") : (de ? "Keine Risikotexte gefunden." : "No risk texts found.")}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {dbRows.map(row => {
                      const isAdded = addedCatalogIds.has(row.risk_id);
                      const text = de ? row.text_de : (row.text_en || row.text_de);
                      return (
                        <button
                          key={row.risk_id}
                          onClick={() => !isAdded && onAddDb(row)}
                          disabled={isAdded}
                          className={cn(
                            "w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3",
                            isAdded ? "st-ja-tint cursor-default" : "hover:bg-accent/30",
                          )}
                        >
                          {isAdded
                            ? <Check className="h-4 w-4 st-ja-text mt-0.5 flex-shrink-0" />
                            : <Plus className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                              <span className="text-muted-foreground font-mono text-[10px] mr-0.5">{row.risk_id}</span>
                              <span>{dbRiskTitle(text)}</span>
                              {row.stufe && (
                                <span className={cn("text-[9px] font-semibold px-1 py-0 rounded",
                                  row.stufe === "hoch" ? "bg-destructive/15 text-destructive" : row.stufe === "mittel" ? "st-teilweise-tint st-teilweise-text" : "st-ja-tint st-ja-text")}>
                                  {row.stufe}
                                </span>
                              )}
                              {isAdded && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded st-ja-tint st-ja-text ml-auto">
                                  {de ? "Hinzugefügt" : "Added"}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{text}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* ── CATALOG TAB ── */}
          <TabsContent value="catalog" className="flex-1 flex flex-col min-h-0 space-y-3 mt-3">
            {/* Prominent search bar — mirrors Massnahme picker UX */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={de ? "Risiko suchen (Titel, Beschreibung, Bedrohung, ZOK)..." : "Search risk (title, description, threat, ZOK)..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
                autoFocus
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Compact filter row — collapsible, secondary to search */}
            <details className="group">
              <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground select-none">
                <Filter className="h-3 w-3" />
                {de ? "Filter" : "Filters"}
                <span className="ml-auto">
                  {results.length} {de ? "Treffer" : "results"}{results.length === 200 && " (max)"}
                </span>
              </summary>
              <div className="flex flex-wrap items-center gap-2 mt-2 pb-1">
                <Select value={cia} onValueChange={setCia}>
                  <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{de ? "Alle CIA" : "All CIA"}</SelectItem>
                    <SelectItem value="C">C — {de ? "Vertraulichkeit" : "Confidentiality"}</SelectItem>
                    <SelectItem value="I">I — {de ? "Integrität" : "Integrity"}</SelectItem>
                    <SelectItem value="A">A — {de ? "Verfügbarkeit" : "Availability"}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={threat} onValueChange={setThreat}>
                  <SelectTrigger className="w-[170px] h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">{de ? "Alle Bedrohungen" : "All threats"}</SelectItem>
                    {THREAT_CATS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={zokFilter} onValueChange={setZokFilter}>
                  <SelectTrigger className="w-[180px] h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">{de ? "Alle ZOK" : "All ZOKs"}</SelectItem>
                    <SelectItem value="__isms__">{de ? "ISMS (verbundweit)" : "ISMS (org-wide)"}</SelectItem>
                    {zokNodes.map(n => (
                      <SelectItem key={n.id} value={n.id}>{de ? n.label_de : n.label_en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={showOnlyUnselected ? "default" : "outline"}
                  size="sm" className="h-7 text-xs"
                  onClick={() => setShowOnlyUnselected(v => !v)}
                >
                  {de ? "Nur nicht hinzugefügte" : "Only not-added"}
                </Button>
              </div>
            </details>

            {/* Compact flat list — mirrors Massnahme picker */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain border rounded-lg">
              {results.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {de ? "Keine Risiken gefunden." : "No risks found."}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {results.map(ir => {
                    const r = ir.risk;
                    const isAdded = addedCatalogIds.has(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => !isAdded && onAddCatalog(ir)}
                        disabled={isAdded}
                        className={cn(
                          "w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3",
                          isAdded
                            ? "st-ja-tint cursor-default"
                            : "hover:bg-accent/30",
                        )}
                      >
                        {isAdded ? (
                          <Check className="h-4 w-4 st-ja-text mt-0.5 flex-shrink-0" />
                        ) : (
                          <Plus className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium flex items-center gap-1.5 flex-wrap">
                            <span className="text-muted-foreground font-mono text-[10px] mr-0.5">{r.id}</span>
                            <span>{de ? r.title_de : r.title_en}</span>
                            {r.cia.map(c => (
                              <span key={c} className="text-[9px] font-semibold px-1 py-0 rounded bg-primary/15 text-primary">{c}</span>
                            ))}
                            {isAdded && (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded st-ja-tint st-ja-text ml-auto">
                                {de ? "Hinzugefügt" : "Added"}
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {r.threat_category} · L{r.typical_likelihood}·I{r.typical_impact} · {(de ? ir.zok_labels_de : ir.zok_labels_en).slice(0, 2).join(", ")}
                            {ir.zok_labels_de.length > 2 && ` +${ir.zok_labels_de.length - 2}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── CUSTOM TAB ── */}
          <TabsContent value="custom" className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
            <p className="text-xs text-muted-foreground">
              {de
                ? "Definieren Sie ein eigenes Risiko. Es wird im Risikoregister mit dem Marker 'Manuell' gekennzeichnet und in Berichten klar von automatisch generierten Risiken getrennt."
                : "Define your own risk. It will appear in the risk register marked as 'Manual' and is clearly separated from auto-generated risks in reports."}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">{de ? "Titel (Deutsch) *" : "Title (German) *"}</label>
                <Input value={draft.title_de} onChange={e => setDraft(d => ({ ...d, title_de: e.target.value }))}
                  className="h-8 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">{de ? "Titel (Englisch)" : "Title (English)"}</label>
                <Input value={draft.title_en} onChange={e => setDraft(d => ({ ...d, title_en: e.target.value }))}
                  className="h-8 text-sm mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium">{de ? "Beschreibung (Deutsch)" : "Description (German)"}</label>
              <Textarea value={draft.description_de} onChange={e => setDraft(d => ({ ...d, description_de: e.target.value }))}
                className="min-h-[60px] text-sm mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium">{de ? "Beschreibung (Englisch)" : "Description (English)"}</label>
              <Textarea value={draft.description_en} onChange={e => setDraft(d => ({ ...d, description_en: e.target.value }))}
                className="min-h-[60px] text-sm mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">{de ? `Likelihood (1–${maxL}) *` : `Likelihood (1–${maxL}) *`}</label>
                <Input type="number" min={1} max={maxL}
                  value={draft.likelihood}
                  onChange={e => setDraft(d => ({ ...d, likelihood: Math.max(1, Math.min(maxL, Number(e.target.value) || 1)) }))}
                  className="h-8 text-sm mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium">{de ? `Impact (1–${maxI}) *` : `Impact (1–${maxI}) *`}</label>
                <Input type="number" min={1} max={maxI}
                  value={draft.impact}
                  onChange={e => setDraft(d => ({ ...d, impact: Math.max(1, Math.min(maxI, Number(e.target.value) || 1)) }))}
                  className="h-8 text-sm mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">{de ? "Geltungsbereich *" : "Scope *"}</label>
                <Select value={draft.scope} onValueChange={(v) => setDraft(d => ({ ...d, scope: v as "asset" | "organization", asset_id: v === "organization" ? null : d.asset_id }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">{de ? "Organisation (verbundweit)" : "Organization (org-wide)"}</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {draft.scope === "asset" && assets.length > 0 && (
                <div>
                  <label className="text-xs font-medium">Asset</label>
                  <Select value={draft.asset_id ?? ""} onValueChange={(v) => setDraft(d => ({ ...d, asset_id: v }))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder={de ? "Asset wählen..." : "Select asset..."} /></SelectTrigger>
                    <SelectContent>
                      {assets.map(a => <SelectItem key={a.id} value={a.id}>{a.asset_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">{de ? "Bedrohungskategorie" : "Threat category"}</label>
                <Input list="threat-cats" value={draft.threat_category ?? ""}
                  onChange={e => setDraft(d => ({ ...d, threat_category: e.target.value }))}
                  placeholder={de ? "z.B. Phishing, Ransomware..." : "e.g. Phishing, Ransomware..."}
                  className="h-8 text-sm mt-1" />
                <datalist id="threat-cats">
                  {THREAT_CATS.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-medium">CIA</label>
                <div className="flex gap-1.5 mt-1.5">
                  {(["C", "I", "A"] as const).map(c => (
                    <button key={c} type="button"
                      onClick={() => toggleCia(c)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all",
                        draft.cia?.includes(c)
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-background border-border text-muted-foreground hover:border-primary/30"
                      )}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleSaveCustom} disabled={!draft.title_de.trim()}
              className="w-full gap-1.5" size="sm">
              <Plus className="h-3.5 w-3.5" />
              {editing ? (de ? "Änderungen speichern" : "Save changes") : (de ? "Risiko hinzufügen" : "Add risk")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
