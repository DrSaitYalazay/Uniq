import { useState, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sparkles, Layers, Upload, Download, HelpCircle, ArrowLeftRight,
  ArrowUp, ArrowDown, Link2, ChevronDown, Plus, X, GitBranch,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── Types ────────────────────────────────────────────── */

export interface AssetLite {
  id: string;
  asset_name: string;
  asset_type: string;
  service_id: string;
  service_name?: string;
}

interface DepRow {
  id: string;
  source_type: string; source_id: string | null; source_label: string;
  target_type: string; target_id: string | null; target_label: string;
  dependency_type: string; criticality: number; is_spof: boolean;
  supplier_country: string | null; notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assets: AssetLite[];
  existingDeps: DepRow[];
  tenantId: string;
  de: boolean;
  onCreated: (rows: DepRow[]) => void;
}

/* ─── Suggestion engine (type-agnostic) ────────────────── */

interface SuggestionRule {
  sourceTypes: string[];
  targetTypes: string[];
  reason: { de: string; en: string };
}

const SUGGESTION_RULES: SuggestionRule[] = [
  { sourceTypes: ["Application"], targetTypes: ["Server"],
    reason: { de: "Anwendung läuft auf einem Server.", en: "Application runs on a server." } },
  { sourceTypes: ["Database"], targetTypes: ["Server"],
    reason: { de: "Datenbank läuft auf einem Server.", en: "Database runs on a server." } },
  { sourceTypes: ["Application", "Database", "Server"], targetTypes: ["Cloud"],
    reason: { de: "Komponente wird in der Cloud gehostet.", en: "Component is hosted in the cloud." } },
  { sourceTypes: ["Application"], targetTypes: ["Database"],
    reason: { de: "Anwendung liest/schreibt Daten in die Datenbank.", en: "Application reads/writes data to the database." } },
  { sourceTypes: ["Application"], targetTypes: ["Application"],
    reason: { de: "Anwendungen tauschen Daten über APIs aus.", en: "Applications exchange data via APIs." } },
  { sourceTypes: ["IoT", "OT/ICS"], targetTypes: ["Application", "Database"],
    reason: { de: "Sensor-/OT-Daten fließen in Anwendungen.", en: "Sensor / OT data flows into applications." } },
  { sourceTypes: ["Application", "Server", "Database"], targetTypes: ["Network"],
    reason: { de: "Komponente kommuniziert über das Netzwerk.", en: "Component communicates via network." } },
  { sourceTypes: ["IoT", "OT/ICS", "Endpoint", "Mobile Device"], targetTypes: ["Network"],
    reason: { de: "Gerät über Netzwerk angebunden.", en: "Device connected via network." } },
  { sourceTypes: ["Application", "Server", "Database", "Cloud", "Endpoint"], targetTypes: ["Security Tool"],
    reason: { de: "Komponente wird durch Security Tool überwacht.", en: "Component is monitored by security tool." } },
  { sourceTypes: ["Endpoint", "Mobile Device"], targetTypes: ["Application"],
    reason: { de: "Endgerät greift auf Anwendung zu.", en: "Endpoint accesses application." } },
  { sourceTypes: ["Application", "Cloud"], targetTypes: ["External"],
    reason: { de: "Komponente nutzt externe Dienste/APIs.", en: "Component consumes external services/APIs." } },
];

interface Suggestion {
  source_asset_id: string;
  target_asset_id: string;
  reason: { de: string; en: string };
}

function computeSuggestions(assets: AssetLite[], existing: Set<string>): Suggestion[] {
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  for (const rule of SUGGESTION_RULES) {
    const srcs = assets.filter(a => rule.sourceTypes.includes(a.asset_type));
    const tgts = assets.filter(a => rule.targetTypes.includes(a.asset_type));
    for (const s of srcs) {
      const sameSvc = tgts.filter(t => t.service_id === s.service_id && t.id !== s.id);
      const candidates = sameSvc.length > 0 ? sameSvc : tgts.filter(t => t.id !== s.id);
      for (const t of candidates) {
        const key = `${s.id}|${t.id}`;
        if (existing.has(key) || seen.has(key)) continue;
        seen.add(key);
        out.push({ source_asset_id: s.id, target_asset_id: t.id, reason: rule.reason });
      }
    }
  }
  return out;
}

/* ─── CSV helpers ─────────────────────────────────────── */

function detectDelim(h: string) { return (h.match(/;/g) || []).length > (h.match(/,/g) || []).length ? ";" : ","; }
function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') inQ = false; else cur += ch; }
    else { if (ch === '"') inQ = true; else if (ch === delim) { out.push(cur); cur = ""; } else cur += ch; }
  }
  out.push(cur); return out.map(s => s.trim());
}
function downloadCsvTemplate() {
  const csv = `source_asset,target_asset,notes\n"CRM Production","PostgreSQL Cluster","CRM uses primary DB"\n"PostgreSQL Cluster","Backup Storage","Nightly backups"\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "dependencies-template.csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}

/* ─── NodePicker ──────────────────────────────────────── */

function NodePicker({
  assets, selected, onToggle, onClear, placeholder, de, align = "start",
}: {
  assets: AssetLite[]; selected: Set<string>;
  onToggle: (id: string) => void; onClear: () => void;
  placeholder: string; de: boolean; align?: "start" | "center" | "end";
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? assets.filter(a => a.asset_name.toLowerCase().includes(s) || (a.service_name ?? "").toLowerCase().includes(s)) : assets;
  }, [assets, q]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 text-xs justify-between w-full">
          <span className="truncate">
            {selected.size === 0 ? placeholder : `${selected.size} ${de ? "ausgewählt" : "selected"}`}
          </span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align={align}>
        <Input placeholder={de ? "Suchen…" : "Search…"} value={q} onChange={(e) => setQ(e.target.value)} className="h-7 text-xs mb-2" />
        <ScrollArea className="h-64">
          <div className="space-y-0.5">
            {filtered.map(a => (
              <label key={a.id} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted/40 cursor-pointer text-xs">
                <Checkbox checked={selected.has(a.id)} onCheckedChange={() => onToggle(a.id)} />
                <span className="truncate flex-1">{a.asset_name}</span>
                <span className="text-muted-foreground text-[10px]">{a.asset_type}</span>
              </label>
            ))}
            {filtered.length === 0 && <p className="text-xs text-muted-foreground p-2">{de ? "Keine Treffer" : "No matches"}</p>}
          </div>
        </ScrollArea>
        {selected.size > 0 && (
          <Button variant="ghost" size="sm" className="w-full h-7 text-xs mt-1" onClick={onClear}>
            {de ? "Auswahl leeren" : "Clear"}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/* ─── Main dialog ─────────────────────────────────────── */

export default function QuickDependencyDialog({ open, onOpenChange, assets, existingDeps, tenantId, de, onCreated }: Props) {
  const [tab, setTab] = useState<"suggest" | "bulk" | "csv">("suggest");
  const [busy, setBusy] = useState(false);

  const assetMap = useMemo(() => {
    const m: Record<string, AssetLite> = {};
    assets.forEach(a => { m[a.id] = a; });
    return m;
  }, [assets]);

  const existingKeys = useMemo(() => {
    const s = new Set<string>();
    existingDeps.forEach(d => { if (d.source_id && d.target_id) s.add(`${d.source_id}|${d.target_id}`); });
    return s;
  }, [existingDeps]);

  const insertRow = (src: AssetLite, tgt: AssetLite, notes: string) => ({
    user_id: tenantId,
    source_type: "asset", source_id: src.id, source_label: src.asset_name,
    target_type: "asset", target_id: tgt.id, target_label: tgt.asset_name,
    dependency_type: "technical", criticality: 0, is_spof: false, notes: notes || null,
  });

  /* ── Tab 1: Suggestions + quick create with 2/3 columns ── */
  const allSuggestions = useMemo(() => computeSuggestions(assets, existingKeys), [assets, existingKeys]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const assetTypesInSug = useMemo(() => {
    const s = new Set<string>();
    allSuggestions.forEach(sg => {
      const a = assetMap[sg.source_asset_id]; if (a) s.add(a.asset_type);
    });
    return Array.from(s).sort();
  }, [allSuggestions, assetMap]);

  const filteredSug = useMemo(() => typeFilter === "all"
    ? allSuggestions
    : allSuggestions.filter(s => assetMap[s.source_asset_id]?.asset_type === typeFilter),
  [allSuggestions, typeFilter, assetMap]);

  const toggleAcc = (k: string) => setAccepted(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleFlip = (k: string) => setFlipped(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const applySuggestions = async () => {
    const list = filteredSug.filter(s => accepted.has(`${s.source_asset_id}|${s.target_asset_id}`));
    if (list.length === 0) { toast.error(de ? "Nichts ausgewählt" : "Nothing selected"); return; }
    setBusy(true);
    const inserts = list.map(s => {
      const k = `${s.source_asset_id}|${s.target_asset_id}`;
      const flip = flipped.has(k);
      const src = assetMap[flip ? s.target_asset_id : s.source_asset_id];
      const tgt = assetMap[flip ? s.source_asset_id : s.target_asset_id];
      return insertRow(src, tgt, de ? s.reason.de : s.reason.en);
    });
    const { data, error } = await supabase.from("dependencies").insert(inserts).select();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onCreated((data || []) as DepRow[]);
    setAccepted(new Set()); setFlipped(new Set());
    toast.success(de ? `${data?.length ?? 0} Abhängigkeiten erstellt` : `${data?.length ?? 0} dependencies created`);
    onOpenChange(false);
  };

  /* ── Quick multi-column create (2 or 3 columns) ── */
  const [colCount, setColCount] = useState<2 | 3>(2);
  const [col1, setCol1] = useState<Set<string>>(new Set());
  const [col2, setCol2] = useState<Set<string>>(new Set());
  const [col3, setCol3] = useState<Set<string>>(new Set());
  const [qaNotes, setQaNotes] = useState("");

  const toggleSet = (set: Set<string>, id: string) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n; };

  const plannedPairs = useMemo(() => {
    const out: { src: AssetLite; tgt: AssetLite }[] = [];
    const cols = colCount === 3 ? [col1, col2, col3] : [col1, col2];
    for (let i = 0; i < cols.length - 1; i++) {
      const A = cols[i], B = cols[i + 1];
      A.forEach(a => B.forEach(b => {
        if (a === b) return;
        if (existingKeys.has(`${a}|${b}`)) return;
        const sa = assetMap[a], sb = assetMap[b];
        if (sa && sb) out.push({ src: sa, tgt: sb });
      }));
    }
    // dedupe
    const seen = new Set<string>();
    return out.filter(p => { const k = `${p.src.id}|${p.tgt.id}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }, [col1, col2, col3, colCount, assetMap, existingKeys]);

  const submitQuick = async () => {
    if (plannedPairs.length === 0) { toast.error(de ? "Keine neuen Verbindungen" : "No new links"); return; }
    setBusy(true);
    const inserts = plannedPairs.map(p => insertRow(p.src, p.tgt, qaNotes));
    const { data, error } = await supabase.from("dependencies").insert(inserts).select();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onCreated((data || []) as DepRow[]);
    toast.success(de ? `${data?.length ?? 0} Verbindung(en) hinzugefügt` : `${data?.length ?? 0} link(s) added`);
    setCol1(new Set()); setCol2(new Set()); setCol3(new Set()); setQaNotes("");
  };

  /* ── Tab 2: Bulk-Picker (fan-out / chain) ── */
  const [bulkMode, setBulkMode] = useState<"fanout" | "chain">("fanout");
  const [bulkSourceId, setBulkSourceId] = useState<string>("");
  const [bulkTargets, setBulkTargets] = useState<Set<string>>(new Set());
  const [chainOrder, setChainOrder] = useState<string[]>([]);
  const [bulkSearch, setBulkSearch] = useState("");

  const bulkFiltered = useMemo(() => {
    const q = bulkSearch.trim().toLowerCase();
    const base = bulkMode === "fanout" && bulkSourceId
      ? assets.filter(a => a.id !== bulkSourceId && !existingKeys.has(`${bulkSourceId}|${a.id}`))
      : assets;
    return q ? base.filter(a => a.asset_name.toLowerCase().includes(q)) : base;
  }, [assets, bulkMode, bulkSourceId, bulkSearch, existingKeys]);

  const toggleBulkTgt = (id: string) => {
    setBulkTargets(prev => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); setChainOrder(o => o.filter(x => x !== id)); }
      else { n.add(id); setChainOrder(o => o.includes(id) ? o : [...o, id]); }
      return n;
    });
  };
  const moveChain = (i: number, dir: -1 | 1) => setChainOrder(o => {
    const j = i + dir; if (j < 0 || j >= o.length) return o;
    const n = [...o]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });

  const applyBulk = async () => {
    let inserts: any[] = [];
    if (bulkMode === "fanout") {
      if (!bulkSourceId || bulkTargets.size === 0) { toast.error(de ? "Quelle und Ziele wählen" : "Pick source and targets"); return; }
      const src = assetMap[bulkSourceId]; if (!src) return;
      inserts = Array.from(bulkTargets).map(tid => {
        const tgt = assetMap[tid]; return tgt ? insertRow(src, tgt, "") : null;
      }).filter(Boolean);
    } else {
      if (chainOrder.length < 2) { toast.error(de ? "Min. 2 Assets" : "Need 2+ assets"); return; }
      for (let i = 0; i < chainOrder.length - 1; i++) {
        const a = assetMap[chainOrder[i]], b = assetMap[chainOrder[i + 1]];
        if (!a || !b) continue;
        if (existingKeys.has(`${a.id}|${b.id}`)) continue;
        inserts.push(insertRow(a, b, ""));
      }
    }
    if (inserts.length === 0) { toast.info(de ? "Nichts zu erstellen" : "Nothing to create"); return; }
    setBusy(true);
    const { data, error } = await supabase.from("dependencies").insert(inserts).select();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onCreated((data || []) as DepRow[]);
    setBulkSourceId(""); setBulkTargets(new Set()); setChainOrder([]);
    toast.success(de ? `${data?.length ?? 0} erstellt` : `${data?.length ?? 0} created`);
    onOpenChange(false);
  };

  /* ── Tab 3: CSV ── */
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvPreview, setCsvPreview] = useState<{ valid: { src: AssetLite; tgt: AssetLite; notes: string }[]; warnings: string[] } | null>(null);
  const assetByName = useMemo(() => {
    const m: Record<string, AssetLite> = {};
    assets.forEach(a => { m[a.asset_name.toLowerCase()] = a; });
    return m;
  }, [assets]);

  const handleCsv = async (file: File) => {
    const text = (await file.text()).replace(/^\uFEFF/, "").trim();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { toast.error("CSV empty"); return; }
    const delim = detectDelim(lines[0]);
    const headers = parseCsvLine(lines[0], delim).map(h => h.toLowerCase());
    const iSrc = headers.findIndex(h => ["source_asset", "source", "from", "quelle"].includes(h));
    const iTgt = headers.findIndex(h => ["target_asset", "target", "to", "ziel"].includes(h));
    const iNotes = headers.findIndex(h => ["notes", "description", "beschreibung"].includes(h));
    if (iSrc < 0 || iTgt < 0) { toast.error("Missing source_asset/target_asset columns"); return; }
    const valid: { src: AssetLite; tgt: AssetLite; notes: string }[] = [];
    const warns: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i], delim);
      const sName = (cols[iSrc] ?? "").trim(), tName = (cols[iTgt] ?? "").trim();
      const notes = iNotes >= 0 ? (cols[iNotes] ?? "").trim() : "";
      if (!sName || !tName) { warns.push(`Row ${i + 1}: missing name`); continue; }
      const src = assetByName[sName.toLowerCase()], tgt = assetByName[tName.toLowerCase()];
      if (!src) { warns.push(`Row ${i + 1}: source "${sName}" not found`); continue; }
      if (!tgt) { warns.push(`Row ${i + 1}: target "${tName}" not found`); continue; }
      if (existingKeys.has(`${src.id}|${tgt.id}`)) { warns.push(`Row ${i + 1}: already exists`); continue; }
      valid.push({ src, tgt, notes });
    }
    setCsvPreview({ valid, warnings: warns });
  };

  const applyCsv = async () => {
    if (!csvPreview || csvPreview.valid.length === 0) return;
    setBusy(true);
    const inserts = csvPreview.valid.map(r => insertRow(r.src, r.tgt, r.notes));
    const { data, error } = await supabase.from("dependencies").insert(inserts).select();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    onCreated((data || []) as DepRow[]);
    setCsvPreview(null); if (fileRef.current) fileRef.current.value = "";
    toast.success(de ? `${data?.length ?? 0} importiert` : `${data?.length ?? 0} imported`);
    onOpenChange(false);
  };

  /* ── Render ── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {de ? "Abhängigkeiten schnell hinzufügen" : "Add dependencies quickly"}
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground"><HelpCircle className="h-4 w-4" /></button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="start" className="w-[380px] text-xs leading-relaxed">
                <p className="font-semibold mb-1">{de ? "Drei Wege:" : "Three ways:"}</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li><b className="text-foreground">{de ? "Vorschläge" : "Suggestions"}:</b> {de ? "System schlägt typische Verbindungen anhand der Asset-Typen vor." : "System suggests typical links from asset types."}</li>
                  <li><b className="text-foreground">Bulk-Picker:</b> {de ? "Fan-out (1 → viele) oder Kette (A → B → C → …)." : "Fan-out (1 → many) or chain (A → B → C → …)."}</li>
                  <li><b className="text-foreground">CSV:</b> {de ? "Vorlage herunterladen, ausfüllen, importieren." : "Download template, fill, import."}</li>
                </ul>
              </PopoverContent>
            </Popover>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="suggest" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              {de ? "Vorschläge" : "Suggestions"}
              {allSuggestions.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">{allSuggestions.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-1.5 text-xs">
              <Layers className="h-3.5 w-3.5" />{de ? "Bulk-Picker" : "Bulk picker"}
            </TabsTrigger>
            <TabsTrigger value="csv" className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" />CSV
            </TabsTrigger>
          </TabsList>

          {/* ── Suggestions + quick multi-column ── */}
          <TabsContent value="suggest" className="flex-1 overflow-hidden flex flex-col mt-3">
            {/* Manual quick create */}
            <div className="border border-primary/30 bg-primary/5 rounded-md p-3 mb-3">
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <Link2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold">{de ? "Neue Verbindung erstellen" : "Create new link"}</span>
                <span className="text-[10px] text-muted-foreground">{de ? "(aus vorhandenen Assets)" : "(from existing assets)"}</span>
                <div className="ml-auto inline-flex rounded-md border border-border overflow-hidden text-[10px]">
                  <button type="button" onClick={() => setColCount(2)}
                    className={`px-2 py-1 ${colCount === 2 ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/40"}`}>
                    2 {de ? "Spalten" : "cols"}
                  </button>
                  <button type="button" onClick={() => setColCount(3)}
                    className={`px-2 py-1 border-l border-border ${colCount === 3 ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/40"}`}>
                    3 {de ? "Spalten" : "cols"}
                  </button>
                </div>
                {plannedPairs.length > 0 && (
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                    {plannedPairs.length} {de ? "neu" : "new"}
                  </Badge>
                )}
              </div>

              <div className={`grid gap-2 items-center ${colCount === 3
                ? "grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr]"
                : "grid-cols-1 md:grid-cols-[1fr_auto_1fr]"}`}>
                <NodePicker assets={assets} selected={col1} de={de}
                  onToggle={(id) => setCol1(p => toggleSet(p, id))}
                  onClear={() => setCol1(new Set())}
                  placeholder={de ? "Quellen wählen…" : "Pick sources…"} align="start" />
                <span className="text-primary font-bold text-lg text-center">→</span>
                <NodePicker assets={assets} selected={col2} de={de}
                  onToggle={(id) => setCol2(p => toggleSet(p, id))}
                  onClear={() => setCol2(new Set())}
                  placeholder={colCount === 3 ? (de ? "Mitte wählen…" : "Pick middle…") : (de ? "Ziele wählen…" : "Pick targets…")}
                  align={colCount === 3 ? "center" : "end"} />
                {colCount === 3 && (
                  <>
                    <span className="text-primary font-bold text-lg text-center">→</span>
                    <NodePicker assets={assets} selected={col3} de={de}
                      onToggle={(id) => setCol3(p => toggleSet(p, id))}
                      onClear={() => setCol3(new Set())}
                      placeholder={de ? "Ziele wählen…" : "Pick targets…"} align="end" />
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Input placeholder={de ? "Beschreibung (optional)" : "Description (optional)"}
                  value={qaNotes} onChange={(e) => setQaNotes(e.target.value)}
                  className="h-8 text-xs flex-1" />
                <Button size="sm" className="h-8 text-xs" onClick={submitQuick} disabled={busy || plannedPairs.length === 0}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {de ? `${plannedPairs.length} hinzufügen` : `Add ${plannedPairs.length}`}
                </Button>
              </div>
              {colCount === 3 && (
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {de ? "3 Spalten: erzeugt A → B und B → C für jede Kombination." : "3 columns: creates A → B and B → C for every combination."}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-xs text-muted-foreground flex-1">
                {de ? "Vom System vorgeschlagene Abhängigkeiten basierend auf Asset-Typen." : "System-suggested dependencies based on asset types."}
              </p>
              {assetTypesInSug.length > 0 && (
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-7 text-xs rounded border border-border bg-background px-2">
                  <option value="all">{de ? "Alle Typen" : "All types"}</option>
                  {assetTypesInSug.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
              <Button size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => setAccepted(new Set(filteredSug.map(s => `${s.source_asset_id}|${s.target_asset_id}`)))}>
                {de ? "Alle auswählen" : "Select all"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs"
                onClick={() => { setAccepted(new Set()); setFlipped(new Set()); }}>
                {de ? "Zurücksetzen" : "Reset"}
              </Button>
              <span className="text-xs text-muted-foreground">{accepted.size} / {filteredSug.length}</span>
            </div>

            <ScrollArea className="flex-1 border rounded-md min-h-[220px]">
              {filteredSug.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {de ? "Keine neuen Vorschläge — alle typischen Abhängigkeiten existieren bereits oder es gibt nicht genug Assets." : "No new suggestions."}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredSug.slice(0, 200).map(s => {
                    const k = `${s.source_asset_id}|${s.target_asset_id}`;
                    const flip = flipped.has(k);
                    const oS = assetMap[s.source_asset_id], oT = assetMap[s.target_asset_id];
                    if (!oS || !oT) return null;
                    const src = flip ? oT : oS, tgt = flip ? oS : oT;
                    return (
                      <div key={k} className="flex items-start gap-2 p-2 hover:bg-muted/30 text-xs">
                        <Checkbox checked={accepted.has(k)} onCheckedChange={() => toggleAcc(k)} className="mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold">{src.asset_name}</span>
                            <span className="text-muted-foreground">[{src.asset_type}]</span>
                            <button type="button" onClick={() => toggleFlip(k)}
                              title={de ? "Richtung umkehren" : "Reverse direction"}
                              className={`inline-flex items-center justify-center h-5 w-5 rounded border transition-colors ${
                                flip ? "border-primary/50 bg-primary/10 text-primary"
                                     : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}>
                              <ArrowLeftRight className="h-3 w-3" />
                            </button>
                            <span className="text-primary font-bold">→</span>
                            <span className="font-semibold">{tgt.asset_name}</span>
                            <span className="text-muted-foreground">[{tgt.asset_type}]</span>
                          </div>
                          <p className="text-muted-foreground mt-0.5">
                            {de ? s.reason.de : s.reason.en}
                            {flip && <span className="ml-1 text-primary font-medium">· {de ? "Richtung umgekehrt" : "reversed"}</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {filteredSug.length > 200 && (
                    <div className="p-2 text-center text-[10px] text-muted-foreground">
                      … {filteredSug.length - 200} {de ? "weitere ausgeblendet" : "more hidden"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{de ? "Abbrechen" : "Cancel"}</Button>
              <Button onClick={applySuggestions} disabled={busy || accepted.size === 0}>
                {de ? `${accepted.size} hinzufügen` : `Add ${accepted.size}`}
              </Button>
            </div>
          </TabsContent>

          {/* ── Bulk-Picker ── */}
          <TabsContent value="bulk" className="flex-1 overflow-hidden flex flex-col mt-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
                <button type="button" onClick={() => setBulkMode("fanout")}
                  className={`px-3 py-1.5 ${bulkMode === "fanout" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/40"}`}>
                  {de ? "Fan-out (1 → viele)" : "Fan-out (1 → many)"}
                </button>
                <button type="button" onClick={() => { setBulkMode("chain"); setBulkSourceId(""); }}
                  className={`px-3 py-1.5 border-l border-border flex items-center gap-1 ${bulkMode === "chain" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted/40"}`}>
                  <GitBranch className="h-3 w-3" />{de ? "Kette" : "Chain"}
                </button>
              </div>
            </div>

            {bulkMode === "fanout" && (
              <div className="space-y-1 mb-2">
                <Label className="text-xs">{de ? "Quelle" : "Source"}</Label>
                <select value={bulkSourceId} onChange={(e) => { setBulkSourceId(e.target.value); setBulkTargets(new Set()); setChainOrder([]); }}
                  className="w-full h-9 text-xs rounded border border-border bg-background px-2">
                  <option value="">{de ? "Quell-Asset wählen…" : "Pick source asset…"}</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_name} [{a.asset_type}]</option>)}
                </select>
              </div>
            )}

            <Input placeholder={de ? "Assets suchen…" : "Search assets…"} value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)} className="h-8 text-xs mb-2" />

            <ScrollArea className="flex-1 border rounded-md min-h-[200px]">
              {bulkMode === "fanout" && !bulkSourceId ? (
                <p className="p-4 text-xs text-muted-foreground text-center">{de ? "Bitte zuerst Quelle wählen." : "Pick a source first."}</p>
              ) : (
                <div className="divide-y">
                  {bulkFiltered.map(a => (
                    <label key={a.id} className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/30 cursor-pointer">
                      <Checkbox checked={bulkTargets.has(a.id)} onCheckedChange={() => toggleBulkTgt(a.id)} />
                      <span className="flex-1 truncate">{a.asset_name}</span>
                      <span className="text-muted-foreground text-[10px]">{a.asset_type}</span>
                      {bulkMode === "chain" && bulkTargets.has(a.id) && (
                        <Badge variant="secondary" className="text-[10px]">#{chainOrder.indexOf(a.id) + 1}</Badge>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>

            {bulkMode === "chain" && chainOrder.length > 0 && (
              <div className="mt-2 border rounded-md p-2 max-h-40 overflow-auto">
                <p className="text-[10px] text-muted-foreground mb-1">{de ? "Reihenfolge (oben → unten = Richtung)" : "Order (top → bottom = direction)"}</p>
                <ol className="space-y-1">
                  {chainOrder.map((id, i) => {
                    const a = assetMap[id]; if (!a) return null;
                    return (
                      <li key={id} className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px]">{i + 1}</Badge>
                        <span className="flex-1 truncate">{a.asset_name}</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveChain(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveChain(i, 1)} disabled={i === chainOrder.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => toggleBulkTgt(id)}><X className="h-3 w-3" /></Button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{de ? "Abbrechen" : "Cancel"}</Button>
              <Button onClick={applyBulk} disabled={busy || (bulkMode === "fanout" ? bulkTargets.size === 0 : chainOrder.length < 2)}>
                {bulkMode === "fanout"
                  ? (de ? `${bulkTargets.size} hinzufügen` : `Add ${bulkTargets.size}`)
                  : (de ? `Kette (${Math.max(chainOrder.length - 1, 0)})` : `Chain (${Math.max(chainOrder.length - 1, 0)})`)}
              </Button>
            </div>
          </TabsContent>

          {/* ── CSV ── */}
          <TabsContent value="csv" className="flex-1 overflow-hidden flex flex-col mt-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={downloadCsvTemplate}>
                <Download className="h-3.5 w-3.5 mr-1" />{de ? "Vorlage herunterladen" : "Download template"}
              </Button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsv(f); }} />
              <Button size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1" />{de ? "CSV wählen" : "Pick CSV"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {de
                ? "Spalten: source_asset, target_asset, notes (optional). Namen müssen exakt bestehenden Assets entsprechen."
                : "Columns: source_asset, target_asset, notes (optional). Names must match existing assets exactly."}
            </p>

            <ScrollArea className="flex-1 border rounded-md min-h-[220px] p-2">
              {!csvPreview ? (
                <p className="p-4 text-xs text-muted-foreground text-center">{de ? "Noch keine Datei geladen." : "No file loaded yet."}</p>
              ) : (
                <>
                  <p className="text-xs mb-2">
                    <b>{csvPreview.valid.length}</b> {de ? "gültige Zeilen" : "valid rows"}
                    {csvPreview.warnings.length > 0 && <span className="text-muted-foreground"> · {csvPreview.warnings.length} {de ? "Warnungen" : "warnings"}</span>}
                  </p>
                  <ul className="divide-y text-xs">
                    {csvPreview.valid.slice(0, 100).map((r, i) => (
                      <li key={i} className="flex items-center gap-2 py-1">
                        <span className="truncate flex-1">{r.src.asset_name}</span>
                        <span className="text-primary">→</span>
                        <span className="truncate flex-1">{r.tgt.asset_name}</span>
                      </li>
                    ))}
                  </ul>
                  {csvPreview.warnings.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-[10px] text-muted-foreground cursor-pointer">{de ? "Warnungen zeigen" : "Show warnings"}</summary>
                      <ul className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                        {csvPreview.warnings.slice(0, 50).map((w, i) => <li key={i}>· {w}</li>)}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>{de ? "Abbrechen" : "Cancel"}</Button>
              <Button onClick={applyCsv} disabled={busy || !csvPreview || csvPreview.valid.length === 0}>
                {de ? `${csvPreview?.valid.length ?? 0} importieren` : `Import ${csvPreview?.valid.length ?? 0}`}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
