import { useState, useEffect, useCallback, useMemo } from "react";
import { CHART_SEVERITY, CHART_TONE, CHART_GRID, CHART_AXIS } from "@/lib/chartPalette";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { Boxes, Server, Network, Plus, Trash2, Save, Loader2, Lightbulb, FileSpreadsheet, Download, PlugZap, Cable, HelpCircle, UserX, AlertTriangle, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { InfoHint } from "@/components/dashboard/InfoHint";
import { loadSensitivityLevels, displayLabel } from "@/lib/sensitivityLevels";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import AppHeader from "@/components/AppHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { ModeToggle } from "@/components/ModeToggle";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import InspirationDialog from "@/components/inventory/InspirationDialog";
import CsvImportDialog from "@/components/inventory/CsvImportDialog";
import RestImportDialog from "@/components/inventory/RestImportDialog";
import { downloadCsv, objectsToCsv } from "@/lib/csv";
import PersonSelect from "@/components/inventory/PersonSelect";
import CriticalityWizard, { type CriticalityAssessment } from "@/components/inventory/CriticalityWizard";
import FieldInfo from "@/components/common/FieldInfo";
import DependencyGraph from "@/components/inventory/DependencyGraph";
import QuickDependencyDialog from "@/components/inventory/QuickDependencyDialog";
import ExportMenu from "@/components/common/ExportMenu";
import {
  exportInventoryReportPdf, exportInventoryReportDocx, exportInventoryReportXlsx,
} from "@/lib/inventoryReport";



// ---------- Types ----------
interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  category: string;
  criticality: number;
  owner: string | null;
  rto_hours: number | null;
  rpo_hours: number | null;
  criticality_assessment: CriticalityAssessment | null;
}
interface AssetRow {
  id: string;
  service_id: string;
  asset_name: string;
  asset_type: string;
  owner: string | null;
  environment: string;
  data_sensitivity: string | null;
  external_exposure: boolean | null;
  vendor: string | null;
  zok_ids: string[];
  instance_count: number;
  inherited_criticality: boolean;
}
interface DependencyRow {
  id: string;
  source_type: string;
  source_id: string | null;
  source_label: string;
  target_type: string;
  target_id: string | null;
  target_label: string;
  dependency_type: string;
  criticality: number;
  is_spof: boolean;
  supplier_country: string | null;
  notes: string | null;
}

// ---------- Constants ----------
const CATEGORIES = [
  { code: "Business", de: "Kern-Geschäftsprozess", en: "Core Business" },
  { code: "Support",  de: "Unterstützungsprozess", en: "Support Process" },
  { code: "IT",       de: "IT-Service",            en: "IT Service" },
];
const CRIT_LABELS = ["Vernachlässigbar", "Niedrig", "Mittel", "Hoch", "Kritisch"];
const CRIT_LABELS_EN = ["Negligible", "Low", "Medium", "High", "Critical"];
const CRIT_COLOR = ["bg-muted", "st-ja-tint st-ja-text", "st-teilweise-tint st-teilweise-text", "bg-orange-500/20 text-orange-700 dark:text-orange-300", "bg-destructive/20 text-destructive"];

const ASSET_TYPES: { code: string; de: string; en: string; hint_de: string; hint_en: string }[] = [
  { code: "Server",      de: "Server",           en: "Server",           hint_de: "Physische oder virtuelle Server (z. B. Windows Server, Linux-VM).", hint_en: "Physical or virtual servers (e.g. Windows Server, Linux VM)." },
  { code: "Application", de: "Anwendung",        en: "Application",      hint_de: "Installierte Fachanwendung (z. B. SAP, DATEV, KIS).",             hint_en: "Installed business application (e.g. SAP, DATEV, HIS)." },
  { code: "Database",    de: "Datenbank",        en: "Database",         hint_de: "DBMS-Instanz (z. B. Oracle, MSSQL, PostgreSQL).",                   hint_en: "DBMS instance (e.g. Oracle, MSSQL, PostgreSQL)." },
  { code: "Network",     de: "Netzwerk-Komponente", en: "Network Component", hint_de: "Firewall, Switch, Router, WLAN-Controller.",                  hint_en: "Firewall, switch, router, WLAN controller." },
  { code: "Endpoint",    de: "Endgerät (Gruppe)", en: "Endpoint (group)", hint_de: "Notebooks/Workstations als Gruppen-Asset, nicht einzeln.",         hint_en: "Notebooks/workstations as a group asset, not individually." },
  { code: "Cloud",       de: "Cloud-Ressource",  en: "Cloud Resource",   hint_de: "IaaS/PaaS-Ressource (AWS EC2, Azure Storage …).",                  hint_en: "IaaS/PaaS resource (AWS EC2, Azure Storage …)." },
  { code: "SaaS",        de: "SaaS-Dienst",      en: "SaaS Service",     hint_de: "Extern gehostete Anwendung (Microsoft 365, Salesforce …).",         hint_en: "Externally hosted application (Microsoft 365, Salesforce …)." },
  { code: "Data",        de: "Datenbestand",     en: "Data Set",         hint_de: "Fachlicher Datenbestand (Patientendaten, Kundendaten).",           hint_en: "Business data set (patient data, customer data)." },
  { code: "AI Model",    de: "KI-Modell",        en: "AI Model",         hint_de: "Trainiertes/eingesetztes KI-Modell (LLM, Klassifikator).",         hint_en: "Trained/deployed AI model (LLM, classifier)." },
  { code: "Document",    de: "Dokument",         en: "Document",         hint_de: "Formal geführtes Dokument (Vertrag, Richtlinie).",                 hint_en: "Formally managed document (contract, policy)." },
  { code: "Other",       de: "Sonstiges",        en: "Other",            hint_de: "Alles, was in keine andere Kategorie passt.",                      hint_en: "Anything that does not fit another category." },
];

const ENVIRONMENTS: { code: string; de: string; en: string; hint_de: string; hint_en: string }[] = [
  { code: "Production",  de: "Produktion",       en: "Production",       hint_de: "Live-Betrieb — Ausfall wirkt direkt auf Endnutzer.",               hint_en: "Live operation — outage directly affects end users." },
  { code: "Staging",     de: "Test / Staging",   en: "Test / Staging",   hint_de: "Vorproduktion für Abnahmetests, produktionsähnlich.",              hint_en: "Pre-production for acceptance testing, production-like." },
  { code: "Development", de: "Entwicklung",      en: "Development",      hint_de: "Entwickler-Umgebung, keine Echtdaten.",                            hint_en: "Developer environment, no real data." },
  { code: "DR",          de: "DR (Notfallumgebung)", en: "DR (Disaster Recovery)", hint_de: "Disaster-Recovery-Standort — übernimmt bei Ausfall der Produktion.", hint_en: "Disaster-Recovery site — takes over if production fails." },
];
// ---------- Component ----------
const Inventory = () => {
  const { lang } = useLanguage();
  const { mode } = useAssessmentMode();
  const { user } = useAuth();
  const de = lang === "de";
  const t = (d: string, e: string) => (de ? d : e);
  const critLabel = (n: number) => (de ? CRIT_LABELS : CRIT_LABELS_EN)[Math.max(0, Math.min(4, n))];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("services");
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [deps, setDeps] = useState<DependencyRow[]>([]);
  const [sectorKey, setSectorKey] = useState<string | null>(null);
  const [inspOpen, setInspOpen] = useState(false);
  const [restOpen, setRestOpen] = useState(false);
  const [depView, setDepView] = useState<"table" | "graph">("table");
  const [quickDepOpen, setQuickDepOpen] = useState(false);

  const [csvOpen, setCsvOpen] = useState<null | "services" | "assets" | "dependencies">(null);
  const [wizardFor, setWizardFor] = useState<string | null>(null);
  // P2.A.1: Asset-Liste auf „ohne Owner" einschränken.
  const [assetsNoOwnerOnly, setAssetsNoOwnerOnly] = useState(false);
  // Datenklassen (Builtin Public/Normal/Confidential/Highly Confidential + eigene) —
  // gespeichert wird das LABEL in assets.data_sensitivity; die Risiko-Engine/Reports
  // lösen es über tierFor() in eine Stufe 1–4 auf.
  const sensitivityLevels = useMemo(() => loadSensitivityLevels(user?.id ?? null), [user?.id]);


  // ---------- Load ----------
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [s, a, d, prof] = await Promise.all([
      supabase.from("services").select("*").order("created_at"),
      supabase.from("assets").select("id,service_id,asset_name,asset_type,owner,environment,data_sensitivity,external_exposure,vendor,zok_ids,instance_count,inherited_criticality").order("created_at"),
      supabase.from("dependencies").select("*").order("created_at"),
      supabase.from("company_profiles").select("sector").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (s.data) setServices(s.data as unknown as ServiceRow[]);
    if (a.data) setAssets(a.data as AssetRow[]);
    if (d.data) {
      // P2.B.1: Quelle darf Asset ODER Service sein (DB-CHECK erlaubt service/asset/
      // supplier). Früher wurden Service-Quellen stillschweigend verworfen (13 statt
      // 16 bei der Beispielfirma). Ziel bleibt Asset; Lieferanten-Quellen werden
      // ebenfalls gezeigt (nur lesbar), damit die Zahl mit der DB übereinstimmt.
      setDeps((d.data as DependencyRow[]).filter((row) => row.target_type === "asset"));
    }
    setSectorKey((prof.data as any)?.sector ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ---------- Export helpers ----------
  const exportCurrent = () => {
    if (tab === "services") {
      downloadCsv("services.csv", objectsToCsv(
        services.map((s) => ({ name: s.name, category: s.category, criticality: s.criticality, description: s.description ?? "", owner: s.owner ?? "", rto_hours: s.rto_hours ?? "", rpo_hours: s.rpo_hours ?? "" })),
        ["name", "category", "criticality", "description", "owner", "rto_hours", "rpo_hours"],
      ));
    } else if (tab === "assets") {
      const svcName = new Map(services.map((s) => [s.id, s.name]));
      downloadCsv("assets.csv", objectsToCsv(
        assets.map((a) => ({ service_name: svcName.get(a.service_id) ?? "", asset_name: a.asset_name, asset_type: a.asset_type, environment: a.environment, vendor: a.vendor ?? "", data_sensitivity: a.data_sensitivity ?? "", external_exposure: String(!!a.external_exposure), instance_count: a.instance_count })),
        ["service_name", "asset_name", "asset_type", "environment", "vendor", "data_sensitivity", "external_exposure", "instance_count"],
      ));
    } else {
      downloadCsv("dependencies.csv", objectsToCsv(
        deps.map((d) => ({ source_type: d.source_type, source: d.source_label, target_asset: d.target_label, is_spof: String(!!d.is_spof), notes: d.notes ?? "" })),
        ["source_type", "source", "target_asset", "is_spof", "notes"],
      ));
    }
  };

  // ---------- Services CRUD ----------
  const addService = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("services").insert({
      user_id: user.id,
      name: de ? "Neuer Service" : "New Service",
      category: "Business",
      criticality: 2,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setServices((prev) => [...prev, data as unknown as ServiceRow]);
  };
  const updateService = (id: string, patch: Partial<ServiceRow>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };
  const saveService = async (s: ServiceRow) => {
    setSaving(true);
    const { error } = await supabase.from("services").update({
      name: s.name, description: s.description, category: s.category,
      criticality: s.criticality, owner: s.owner, rto_hours: s.rto_hours, rpo_hours: s.rpo_hours,
      criticality_assessment: s.criticality_assessment as any,
    }).eq("id", s.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success(t("Gespeichert", "Saved"));
  };
  const deleteService = async (id: string) => {
    if (!confirm(t("Service löschen? Zugehörige Assets bleiben, verlieren aber die Verknüpfung.", "Delete service? Related assets remain but lose the link."))) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  // ---------- Assets CRUD ----------
  const addAsset = async (serviceId: string) => {
    if (!user) return;
    const { data, error } = await supabase.from("assets").insert({
      user_id: user.id,
      service_id: serviceId,
      asset_name: de ? "Neues Asset" : "New Asset",
      asset_type: "Application",
      environment: "Production",
      inherited_criticality: true,
      zok_ids: [],
      instance_count: 1,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setAssets((prev) => [...prev, data as AssetRow]);
  };
  const updateAsset = (id: string, patch: Partial<AssetRow>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };
  const saveAsset = async (a: AssetRow) => {
    setSaving(true);
    const { error } = await supabase.from("assets").update({
      asset_name: a.asset_name, asset_type: a.asset_type, owner: a.owner,
      environment: a.environment, data_sensitivity: a.data_sensitivity,
      external_exposure: a.external_exposure, vendor: a.vendor, instance_count: a.instance_count,
    }).eq("id", a.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success(t("Gespeichert", "Saved"));
  };
  const deleteAsset = async (id: string) => {
    if (!confirm(t("Asset löschen?", "Delete asset?"))) return;
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  // ---------- Dependencies CRUD ----------
  const addDependency = async () => {
    if (!user) return;
    if (assets.length < 2) {
      toast.error(t("Bitte zuerst mindestens zwei Assets anlegen.", "Please create at least two assets first."));
      return;
    }
    const [source, target] = assets;
    const { data, error } = await supabase.from("dependencies").insert({
      user_id: user.id,
      source_type: "asset",
      source_id: source.id,
      source_label: source.asset_name,
      target_type: "asset",
      target_id: target.id,
      target_label: target.asset_name,
      dependency_type: "technical",
      criticality: 0,
      is_spof: false,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setDeps((prev) => [...prev, data as DependencyRow]);
  };
  const updateDep = (id: string, patch: Partial<DependencyRow>) => {
    setDeps((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };
  const saveDep = async (d: DependencyRow) => {
    if (!d.source_id || !d.target_id) {
      toast.error(t("Bitte Quelle und Ziel-Asset wählen.", "Please select source and target asset."));
      return;
    }
    if (d.source_type === "asset" && d.source_id === d.target_id) {
      toast.error(t("Ein Asset kann nicht von sich selbst abhängen.", "An asset cannot depend on itself."));
      return;
    }
    setSaving(true);
    // source_type/is_spof werden VERBATIM gespeichert (früher hart "asset"/false —
    // dadurch war SPOF nie persistierbar und Service-Quellen wurden umgeschrieben).
    const { error } = await supabase.from("dependencies").update({
      source_type: d.source_type || "asset", source_id: d.source_id, source_label: d.source_label,
      target_type: "asset", target_id: d.target_id, target_label: d.target_label,
      dependency_type: d.dependency_type || "technical", criticality: d.criticality ?? 0, is_spof: !!d.is_spof,
      supplier_country: d.supplier_country ?? null, notes: d.notes,
    }).eq("id", d.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success(t("Gespeichert", "Saved"));
  };
  // P2.B.1: SPOF-Schalter wirkt sofort (kein extra „Speichern"-Klick nötig) — die
  // Risiko-Engine (Phase 04) liest is_spof direkt aus der DB.
  const toggleSpof = async (d: DependencyRow, value: boolean) => {
    updateDep(d.id, { is_spof: value });
    const { error } = await supabase.from("dependencies").update({ is_spof: value }).eq("id", d.id);
    if (error) { toast.error(error.message); updateDep(d.id, { is_spof: !value }); }
  };
  const deleteDep = async (id: string) => {
    if (!confirm(t("Abhängigkeit löschen?", "Delete dependency?"))) return;
    const { error } = await supabase.from("dependencies").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setDeps((prev) => prev.filter((d) => d.id !== id));
  };

  // ---------- Derived ----------
  const assetsByService = (sid: string) => assets.filter((a) => a.service_id === sid);
  const serviceNameById = new Map(services.map((s) => [s.id, s.name]));
  const assetOptionLabel = (a: AssetRow) => {
    const serviceName = serviceNameById.get(a.service_id);
    return serviceName ? `${a.asset_name} · ${serviceName}` : a.asset_name;
  };
  const criticalCount = services.filter((s) => s.criticality >= 3).length;
  // P2.A.1 / P2.B.1: Kennzahlen für Überblick + Filter.
  const hasOwner = (a: AssetRow) => !!(a.owner ?? "").trim();
  const assetsNoOwner = assets.filter((a) => !hasOwner(a)).length;
  const spofCount = deps.filter((d) => !!d.is_spof).length;
  const assetsExposed = assets.filter((a) => !!a.external_exposure).length;
  const assetsByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assets) m.set(a.asset_type, (m.get(a.asset_type) ?? 0) + 1);
    return Array.from(m.entries())
      .map(([code, n]) => { const meta = ASSET_TYPES.find((x) => x.code === code); return { code, name: meta ? (de ? meta.de : meta.en) : code, n }; })
      .sort((a, b) => b.n - a.n);
  }, [assets, de]);
  const sensLabel = (v: string | null) => (v ? displayLabel(v, de ? "de" : "en") : "");

  const runInventoryExport = async (fmt: "pdf" | "docx" | "xlsx") => {
    const payload = {
      services: services.map(s => ({
        id: s.id, name: s.name, description: s.description, category: s.category,
        criticality: s.criticality, owner: s.owner, rto_hours: s.rto_hours, rpo_hours: s.rpo_hours,
      })),
      assets: assets.map(a => ({
        id: a.id, service_id: a.service_id, asset_name: a.asset_name, asset_type: a.asset_type,
        owner: a.owner, environment: a.environment, data_sensitivity: a.data_sensitivity,
        external_exposure: a.external_exposure, vendor: a.vendor,
        instance_count: a.instance_count, inherited_criticality: a.inherited_criticality,
      })),
      dependencies: deps.map(d => ({
        id: d.id, source_label: d.source_label, target_label: d.target_label,
        source_type: d.source_type, target_type: d.target_type,
        dependency_type: d.dependency_type, criticality: d.criticality, is_spof: d.is_spof,
        supplier_country: d.supplier_country, notes: d.notes,
      })),
      de,
      authorName: "",
    };
    if (fmt === "pdf") await exportInventoryReportPdf(payload);
    else if (fmt === "docx") await exportInventoryReportDocx(payload);
    else await exportInventoryReportXlsx(payload);
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="min-h-screen">
        {/* AppHeader artık AppLayout'ta global */}
        <main className="max-w-6xl mx-auto p-6 flex items-center justify-center h-96">
          <Loader2 className="animate-spin text-accent" size={32} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* AppHeader artık AppLayout'ta global */}
      <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("Phase 2 · Inventar", "Phase 2 · Inventory")}</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("Services, Assets und Abhängigkeiten — Grundlage für Gap-Analyse und Risiko-Engine.",
                 "Services, assets and dependencies — foundation for gap analysis and risk engine.")}
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <ModeToggle de={de} />
            {/* UniqSuite: im Überblick stehen diese Zahlen in den Kennzahl-Kacheln — Kopf-Badges nur im Detail. */}
            {mode === "expert" && <>
            <Badge variant="outline" className="text-xs">{services.length} Services</Badge>
            <Badge variant="outline" className="text-xs">{assets.length} Assets</Badge>
            <Badge variant="outline" className="text-xs">{deps.length} {t("Abhängigkeiten","Dependencies")}</Badge>
            {criticalCount > 0 && <Badge className="text-xs bg-destructive/20 text-destructive">{criticalCount} {t("kritisch","critical")}</Badge>}
            </>}
            <ExportMenu
              onPdf={() => runInventoryExport("pdf")}
              onWord={() => runInventoryExport("docx")}
              onExcel={() => runInventoryExport("xlsx")}
            />
          </div>
        </div>

        {/* Quick-load toolbar — Import/Integration ist Detail-Tooling.
            Überblick zeigt die reine Inventarliste. */}
        <div className={`rounded-lg border bg-card p-3 flex-wrap gap-2 items-center ${mode === "expert" ? "flex" : "hidden"}`}>
          <span className="text-xs font-semibold text-muted-foreground mr-2">
            {t("Schnell-Import:", "Quick import:")}
          </span>
          <Button size="sm" variant="default" onClick={() => setInspOpen(true)} className="gap-1.5">
            <Lightbulb size={14}/>{t("Inspirations-Checkliste", "Inspiration Checklist")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCsvOpen(tab === "deps" ? "dependencies" : (tab as "services" | "assets"))} className="gap-1.5">
            <FileSpreadsheet size={14}/>CSV — {tab === "services" ? "Services" : tab === "assets" ? "Assets" : t("Abhängigkeiten","Dependencies")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRestOpen(true)} className="gap-1.5" disabled={tab !== "assets"}>
            <PlugZap size={14}/>{t("REST Import", "REST Import")}
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/settings/integrations">
              <Cable size={14}/>{t("Persistente Connectors", "Persistent Connectors")}
            </Link>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={t("Import-Optionen erklären", "Explain import options")}
                className="size-7 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary flex items-center justify-center transition-colors"
              >
                <HelpCircle size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" className="w-96 text-xs leading-relaxed">
              <p className="font-semibold text-sm mb-2">
                {t("Wie kann ich Daten importieren?", "How can I import data?")}
              </p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                    <Lightbulb size={12} className="text-primary" />
                    {t("Inspirations-Checkliste", "Inspiration Checklist")}
                  </div>
                  <p className="text-muted-foreground">
                    {t(
                      "Branchen-typische Services und Assets als Vorlage. Klicken → auswählen → mit einem Klick zum Inventar hinzufügen. Ideal für den ersten Aufbau.",
                      "Industry-typical services and assets as templates. Click → select → add to inventory in one click. Best for a first setup.",
                    )}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                    <FileSpreadsheet size={12} className="text-primary" />
                    CSV Import
                  </div>
                  <p className="text-muted-foreground mb-1">
                    {t(
                      "Excel/CSV-Datei per Drag & Drop hochladen. Der Dialog zeigt Ihnen das Spaltenschema und ein Muster zum Herunterladen. Getrennt für Services, Assets und Abhängigkeiten — wählen Sie zuerst den passenden Tab.",
                      "Drag & drop an Excel/CSV file. The dialog shows the expected column schema and a downloadable template. Separate for services, assets and dependencies — pick the matching tab first.",
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {t(
                      "Tipp: Export CSV (rechts) gibt Ihnen die aktuelle Struktur als Vorlage.",
                      "Tip: Export CSV (right) gives you the current structure as a template.",
                    )}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                    <PlugZap size={12} className="text-primary" />
                    REST Import
                  </div>
                  <p className="text-muted-foreground">
                    {t(
                      "Einmaliger Abruf aus einer beliebigen JSON-REST-API (z. B. CMDB, Asset-Datenbank, interne Tools). Sie geben URL, Header und JSON-Pfad an, mappen Felder auf Asset-Spalten — Daten werden importiert, aber NICHT synchronisiert. Nur für Assets verfügbar.",
                      "One-off pull from any JSON REST API (e.g. CMDB, asset database, internal tools). Provide URL, headers and JSON path, map fields to asset columns — data is imported but NOT synced. Available for Assets only.",
                    )}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                    <Cable size={12} className="text-primary" />
                    {t("Persistente Connectors", "Persistent Connectors")}
                  </div>
                  <p className="text-muted-foreground">
                    {t(
                      "Dauerhafte Verbindung zu Systemen wie Microsoft Intune oder ServiceNow. Nach dem Einrichten in „Einstellungen → Integrationen“ werden Assets regelmäßig automatisch synchronisiert — Änderungen im Quellsystem landen ohne manuellen Import hier.",
                      "Permanent connection to systems like Microsoft Intune or ServiceNow. Once set up in \"Settings → Integrations\", assets are re-synced automatically — changes in the source system land here without manual imports.",
                    )}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                    <Download size={12} className="text-primary" />
                    Export CSV
                  </div>
                  <p className="text-muted-foreground">
                    {t(
                      "Aktuellen Tab (Services, Assets oder Abhängigkeiten) als CSV herunterladen — für Backup, externe Bearbeitung oder Weiterreichen an das Audit-Team.",
                      "Download the current tab (services, assets or dependencies) as CSV — for backup, external editing or handing over to the audit team.",
                    )}
                  </p>
                </div>
              </div>

              <p className="mt-3 pt-2 border-t border-border text-[10px] text-muted-foreground">
                {t(
                  "Alle Importe respektieren Ihre Mandanten-Isolation (RLS). Daten anderer Nutzer werden nie angezeigt oder überschrieben.",
                  "All imports respect your tenant isolation (RLS). Data from other users is never shown or overwritten.",
                )}
              </p>
            </PopoverContent>
          </Popover>

          <Button size="sm" variant="ghost" onClick={exportCurrent} className="gap-1.5 ml-auto">
            <Download size={14}/>{t("Export CSV", "Export CSV")}
          </Button>
        </div>


        {/* ── ÜBERBLICK: grafische Management-Zusammenfassung statt Editier-Tabs ── */}
        {mode !== "expert" && (() => {
          const dist = [0, 1, 2, 3, 4].map(l => services.filter(s => s.criticality === l).length);
          const maxDist = Math.max(1, ...dist);
          const topCritical = [...services]
            .filter(s => s.criticality >= 3)
            .sort((a, b) => b.criticality - a.criticality)
            .slice(0, 6);
          const kpi: Array<{ label: string; value: number; tone?: string; hint?: { title: string; text: string } }> = [
            { label: "Services", value: services.length },
            { label: "Assets", value: assets.length },
            { label: t("Abhängigkeiten", "Dependencies"), value: deps.length },
            { label: t("kritisch", "critical"), value: criticalCount, tone: "text-destructive" },
            { label: t("Assets ohne Owner", "Assets without owner"), value: assetsNoOwner, tone: assetsNoOwner > 0 ? "st-teilweise-text" : undefined,
              hint: { title: t("Assets ohne Owner", "Assets without owner"), text: t("Jedes Asset braucht eine verantwortliche Person (ISO 27001 A.5.9). Ohne Owner bleiben Risiken und Maßnahmen ohne Adressat. Pflege: Detail → Assets → Owner.", "Every asset needs a responsible person (ISO 27001 A.5.9). Without an owner, risks and actions have no addressee. Maintain: Detail → Assets → Owner.") } },
            { label: "SPOF", value: spofCount, tone: spofCount > 0 ? "text-destructive" : undefined,
              hint: { title: t("Single Point of Failure", "Single point of failure"), text: t("Kritikalität, Abhängigkeiten und SPOF erhöhen den Impact in der Risikoanalyse (Phase 04). SPOF = Abhängigkeit ohne Redundanz: Fällt die Quelle aus, steht das Ziel-Asset.", "Criticality, dependencies and SPOF raise the impact in the risk analysis (phase 04). SPOF = dependency without redundancy: if the source fails, the target asset is down.") } },
          ];
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
                {kpi.map((k, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className={`text-2xl font-bold ${k.tone ?? "text-foreground"}`}>{k.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">{k.label}{k.hint && <InfoHint title={k.hint.title} text={k.hint.text} />}</div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex flex-col md:flex-row md:items-center gap-6">
                {(() => {
                  const donut = [0, 1, 2, 3, 4]
                    .map(l => ({ name: `${l} · ${critLabel(l)}`, n: dist[l], color: l >= 3 ? CHART_SEVERITY.hoch : l === 2 ? CHART_SEVERITY.mittel : CHART_SEVERITY.niedrig }))
                    .filter(d => d.n > 0);
                  return (
                    <div className="w-full md:w-56 shrink-0" style={{ height: 200 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={donut} dataKey="n" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={2}>
                            {donut.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                          </Pie>
                          <RTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-base font-semibold text-foreground mb-1">{t("Services nach Kritikalität", "Services by criticality")}</div>
                  {dist.map((n, l) => {
                    const bar = l >= 3 ? "st-nein-bg" : l === 2 ? "st-teilweise-bg" : "st-ja-bg";
                    const pill = l >= 3 ? "st-nein-border st-nein-tint st-nein-text"
                      : l === 2 ? "st-teilweise-border st-teilweise-tint st-teilweise-text"
                      : "st-ja-border st-ja-tint st-ja-text";
                    return (
                      <div key={l} className="flex items-center gap-3">
                        <span className="text-sm text-foreground w-32 shrink-0 font-medium">{l} · {critLabel(l)}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.round((n / maxDist) * 100)}%` }} />
                        </div>
                        <span className={`shrink-0 rounded-lg border px-2.5 py-0.5 text-sm font-bold tabular-nums ${pill}`}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* P2.A.1: zweite Grafik — Assets nach Typ (Balken, eine Themenfarbe) */}
              {assets.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="text-base font-semibold text-foreground">{t("Assets nach Typ", "Assets by type")}</div>
                    <div className="flex items-center gap-2 text-xs">
                      {/* UniqSuite: „ohne Owner" steht schon als Kennzahl-Kachel oben. */}
                      <span className="rounded-lg border border-border px-2.5 py-0.5 font-medium tabular-nums text-muted-foreground">
                        <Globe size={11} className="inline mr-1 -mt-0.5" />{assetsExposed} {t("extern erreichbar", "externally exposed")}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: Math.max(160, assetsByType.length * 30 + 40) }}>
                    <ResponsiveContainer>
                      <BarChart data={assetsByType} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 8 }}>
                        <CartesianGrid horizontal={false} stroke={CHART_GRID} strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} axisLine={false} tickLine={false} />
                        <RTooltip cursor={{ fill: "hsl(var(--muted))" }} formatter={(v: any) => [v, t("Assets", "Assets")]}
                                  contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                        <Bar dataKey="n" fill={CHART_TONE.t1} radius={[0, 4, 4, 0]} maxBarSize={22}>
                          <LabelList dataKey="n" position="right" style={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {topCritical.length > 0 && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-2">
                  <div className="text-sm font-semibold text-foreground">{t("Kritischste Services", "Most critical services")}</div>
                  <div className="flex flex-wrap gap-2">
                    {topCritical.map(s => (
                      <span key={s.id} className={`text-xs px-2.5 py-1 rounded-full border ${CRIT_COLOR[s.criticality]}`}>
                        {s.name} · {critLabel(s.criticality)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground">
                {t("Zum Bearbeiten, Importieren und für den Abhängigkeits-Graphen auf ", "To edit, import and view the dependency graph, switch to ")}
                <span className="font-semibold text-foreground">Detail</span>
                {t(" wechseln.", " above.")}
              </div>
            </div>
          );
        })()}

        {mode === "expert" && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="services"><Boxes size={14} className="mr-1.5"/>Services</TabsTrigger>
            <TabsTrigger value="assets"><Server size={14} className="mr-1.5"/>Assets</TabsTrigger>
            <TabsTrigger value="deps"><Network size={14} className="mr-1.5"/>{t("Abhäng.","Depend.")}</TabsTrigger>
          </TabsList>

          {/* ---------- SERVICES ---------- */}
          <TabsContent value="services" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {t("Definieren Sie Ihre kritischen Geschäfts- und IT-Services. Kritikalität vererbt sich auf Assets.",
                   "Define your critical business and IT services. Criticality propagates to assets.")}
              </p>
              <Button onClick={addService} size="sm"><Plus size={14} className="mr-1"/>{t("Service","Service")}</Button>
            </div>

            {services.length === 0 && (
              <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">
                {t("Noch keine Services. Klicken Sie oben auf „Service“ um zu beginnen.", "No services yet. Click 'Service' above to start.")}
              </CardContent></Card>
            )}

            {services.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Boxes size={18} className="text-accent"/>
                      <Input value={s.name} onChange={(e) => updateService(s.id, { name: e.target.value })}
                             className="text-base font-semibold border-0 shadow-none px-0 h-auto focus-visible:ring-0" />
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* UniqSuite: Kritikalität steht im Feld „Kritikalität (0-4)" der Karte — kein zweites Badge. */}
                      <Button size="sm" variant="outline" onClick={() => saveService(s)} disabled={saving}><Save size={14}/></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteService(s.id)}><Trash2 size={14}/></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs inline-flex items-center gap-1">
                        {t("Kategorie","Category")}
                        <FieldInfo
                          title={t("Service-Kategorie","Service category")}
                          body={t(
                            "Kern-Geschäftsprozess = direkte Wertschöpfung. Unterstützungs­prozess = intern (HR, Buchhaltung). IT-Service = technische Plattform.",
                            "Core Business = direct value creation. Support Process = internal (HR, accounting). IT Service = technical platform."
                          )}
                        />
                      </Label>
                      <Select value={s.category} onValueChange={(v) => updateService(s.id, { category: v })}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => <SelectItem key={c.code} value={c.code}>{de ? c.de : c.en}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs inline-flex items-center gap-1">
                        {t("Kritikalität","Criticality")} (0-4)
                        <FieldInfo
                          title={t("Kritikalität","Criticality")}
                          body={t(
                            "0 = vernachlässigbar, 4 = existenz­bedrohend. Klicken Sie den Button für den 7-Fragen-Assistenten oder überschreiben Sie manuell.",
                            "0 = negligible, 4 = existential. Click the button for the 7-question wizard or override manually."
                          )}
                        />
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between h-10"
                        onClick={() => setWizardFor(s.id)}
                      >
                        <span>{s.criticality} · {critLabel(s.criticality)}</span>
                        <span className="text-xs text-muted-foreground">
                          {s.criticality_assessment?.mode === "manual"
                            ? t("manuell", "manual")
                            : s.criticality_assessment
                              ? t("Wizard", "Wizard")
                              : t("bewerten →", "assess →")}
                        </span>
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs inline-flex items-center gap-1">
                        {t("Verantwortlich","Owner")}
                        <FieldInfo
                          title={t("Verantwortliche Person","Responsible person")}
                          body={t(
                            "Fachlich verantwortliche Person aus Phase 1 (Personen). Nicht in der Liste? Zuerst in Phase 1 anlegen.",
                            "Business owner from Phase 1 (Personnel). Not in the list? Add them in Phase 1 first."
                          )}
                        />
                      </Label>
                      <PersonSelect value={s.owner} onChange={(v) => updateService(s.id, { owner: v })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs inline-flex items-center gap-1">
                          RTO (h)
                          <FieldInfo
                            title={t("RTO — Recovery Time Objective","RTO — Recovery Time Objective")}
                            body={t(
                              "Maximal tolerierbare Ausfallzeit in Stunden, bis der Service wieder verfügbar sein muss.",
                              "Maximum tolerable downtime in hours until the service must be available again."
                            )}
                          />
                        </Label>
                        <Input type="number" value={s.rto_hours ?? ""} onChange={(e) => updateService(s.id, { rto_hours: e.target.value ? parseInt(e.target.value) : null })}/>
                      </div>
                      <div>
                        <Label className="text-xs inline-flex items-center gap-1">
                          RPO (h)
                          <FieldInfo
                            title={t("RPO — Recovery Point Objective","RPO — Recovery Point Objective")}
                            body={t(
                              "Maximal tolerierbarer Daten­verlust in Stunden (Abstand zum letzten wiederherstellbaren Backup).",
                              "Maximum tolerable data loss in hours (distance to the last recoverable backup)."
                            )}
                          />
                        </Label>
                        <Input type="number" value={s.rpo_hours ?? ""} onChange={(e) => updateService(s.id, { rpo_hours: e.target.value ? parseInt(e.target.value) : null })}/>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{t("Beschreibung","Description")}</Label>
                    <Textarea rows={2} value={s.description ?? ""} onChange={(e) => updateService(s.id, { description: e.target.value })}/>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {assetsByService(s.id).length} {t("verknüpfte Assets","linked assets")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ---------- ASSETS ---------- */}
          <TabsContent value="assets" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {t("Assets werden pro Service gruppiert. Kritikalität wird vom Service vererbt.",
                   "Assets are grouped per service. Criticality is inherited from the service.")}
              </p>
              {/* P2.A.1: KPI + Filter „ohne Owner" */}
              <button
                type="button"
                onClick={() => setAssetsNoOwnerOnly((v) => !v)}
                aria-pressed={assetsNoOwnerOnly}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  assetsNoOwnerOnly ? "st-teilweise-border st-teilweise-tint st-teilweise-text"
                  : assetsNoOwner > 0 ? "st-teilweise-border st-teilweise-text hover:bg-amber-500/10"
                  : "border-border text-muted-foreground"}`}
                title={t("Nur Assets ohne verantwortliche Person anzeigen", "Show only assets without a responsible person")}
              >
                <UserX size={13} />{t("Ohne Owner", "Without owner")}: <b className="tabular-nums">{assetsNoOwner}</b>
                {assetsNoOwnerOnly && <span className="opacity-70">· {t("Filter aktiv", "filter on")}</span>}
              </button>
            </div>

            {services.length === 0 && (
              <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">
                {t("Zuerst Services im vorherigen Tab anlegen.", "Create services in the previous tab first.")}
              </CardContent></Card>
            )}

            {assetsNoOwnerOnly && assetsNoOwner === 0 && assets.length > 0 && (
              <Card><CardContent className="text-center py-8 text-muted-foreground text-sm">
                {t("Alle Assets haben einen Owner.", "All assets have an owner.")}
              </CardContent></Card>
            )}

            {services.map((s) => {
              const items = assetsByService(s.id).filter((a) => !assetsNoOwnerOnly || !hasOwner(a));
              if (assetsNoOwnerOnly && items.length === 0) return null;
              return (
                <Card key={s.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Boxes size={16} className="text-accent"/>{s.name}
                        <Badge className={CRIT_COLOR[s.criticality]} variant="outline">{critLabel(s.criticality)}</Badge>
                        <Badge variant="outline" className="text-xs">{items.length}</Badge>
                      </CardTitle>
                      <Button size="sm" onClick={() => addAsset(s.id)}><Plus size={14} className="mr-1"/>Asset</Button>
                    </div>
                  </CardHeader>
                  {items.length > 0 && (
                    <CardContent className="space-y-2">
                      {items.map((a) => (
                        <div key={a.id} className={`space-y-2 border rounded-lg p-3 ${!hasOwner(a) ? "st-teilweise-border" : "border-border/50"}`}>
                        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-2 items-end">
                          <div>
                            <Label className="text-xs">{t("Name","Name")}</Label>
                            <Input value={a.asset_name} onChange={(e) => updateAsset(a.id, { asset_name: e.target.value })}/>
                          </div>
                          <div>
                            <Label className="text-xs inline-flex items-center gap-1">
                              {t("Typ","Type")}
                              <FieldInfo
                                title={t("Asset-Typ","Asset type")}
                                body={t(
                                  "Klassifiziert die Art des Assets. Wählt später die passenden Kontrollen (z. B. bekommen Server andere Anforderungen als Endgeräte).",
                                  "Classifies the kind of asset. Later drives which controls apply (e.g. servers get different requirements than endpoints)."
                                )}
                              />
                            </Label>
                            <Select value={a.asset_type} onValueChange={(v) => updateAsset(a.id, { asset_type: v })}>
                              <SelectTrigger><SelectValue/></SelectTrigger>
                              <SelectContent>
                                {ASSET_TYPES.map((at) => (
                                  <SelectItem key={at.code} value={at.code}>
                                    <span className="flex flex-col">
                                      <span>{de ? at.de : at.en}</span>
                                      <span className="text-[10px] text-muted-foreground">{de ? at.hint_de : at.hint_en}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs inline-flex items-center gap-1">
                              {t("Umgebung","Environment")}
                              <FieldInfo
                                title={t("Umgebung","Environment")}
                                body={t(
                                  "Betriebs­stufe: Produktion (live), Staging (Tests), Entwicklung, DR = Disaster Recovery (Notfall­standort, übernimmt bei Ausfall).",
                                  "Operational stage: Production (live), Staging (tests), Development, DR = Disaster Recovery (fail-over site that takes over on outage)."
                                )}
                              />
                            </Label>
                            <Select value={a.environment} onValueChange={(v) => updateAsset(a.id, { environment: v })}>
                              <SelectTrigger><SelectValue/></SelectTrigger>
                              <SelectContent>
                                {ENVIRONMENTS.map((env) => (
                                  <SelectItem key={env.code} value={env.code}>
                                    <span className="flex flex-col">
                                      <span>{de ? env.de : env.en}</span>
                                      <span className="text-[10px] text-muted-foreground">{de ? env.hint_de : env.hint_en}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs inline-flex items-center gap-1">
                              {t("Anbieter","Vendor")}
                              <FieldInfo
                                title={t("Anbieter / Hersteller","Vendor / Manufacturer")}
                                body={t(
                                  "Hersteller oder Betreiber des Assets (z. B. Microsoft, SAP, AWS). Wichtig für Patch-Verantwortung und Dritt­parteien­risiko.",
                                  "Manufacturer or operator of the asset (e.g. Microsoft, SAP, AWS). Relevant for patch responsibility and third-party risk."
                                )}
                              />
                            </Label>
                            <Input value={a.vendor ?? ""} onChange={(e) => updateAsset(a.id, { vendor: e.target.value })}/>
                          </div>
                          <div>
                            <Label className="text-xs inline-flex items-center gap-1">
                              {t("Anzahl","Count")}
                              <FieldInfo
                                title={t("Instanz-Anzahl","Instance count")}
                                body={t(
                                  "Anzahl gleichartiger Geräte in dieser Gruppe (z. B. 250 Notebooks, 40 RTUs). Für einzelne Systeme (Core-DB, SCADA-Master) bei 1 lassen. Optional – wird für Roadmap-Aufwand und KPI-Kennzahlen genutzt.",
                                  "Number of identical devices in this group (e.g. 250 notebooks, 40 RTUs). Leave at 1 for singleton systems (Core DB, SCADA master). Optional – used for roadmap effort and KPI metrics."
                                )}
                              />
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={a.instance_count ?? 1}
                              onChange={(e) => updateAsset(a.id, { instance_count: Math.max(1, Number(e.target.value) || 1) })}
                            />
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => saveAsset(a)} disabled={saving}><Save size={14}/></Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteAsset(a.id)}><Trash2 size={14}/></Button>
                          </div>
                        </div>
                        {/* P2.A.1: Owner / Datenklasse / extern erreichbar — Felder, die die
                            Risiko-Engine (Phase 04) liest, waren bisher nur per CSV setzbar. */}
                        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-2 items-end">
                          <div>
                            <Label className="text-xs inline-flex items-center gap-1">
                              {t("Verantwortlich (Owner)","Owner")}
                              {!hasOwner(a) && <Badge variant="outline" className="text-[9px] px-1 py-0 st-teilweise-border st-teilweise-text">{t("fehlt","missing")}</Badge>}
                              <FieldInfo
                                title={t("Asset-Owner","Asset owner")}
                                body={t(
                                  "Verantwortliche Person aus Phase 1 (Personen). Pflicht nach ISO 27001 A.5.9 — Risiken und Maßnahmen zu diesem Asset werden dieser Person zugeordnet.",
                                  "Responsible person from Phase 1 (Personnel). Required by ISO 27001 A.5.9 — risks and actions for this asset are assigned to this person."
                                )}
                              />
                            </Label>
                            <PersonSelect value={a.owner} onChange={(v) => updateAsset(a.id, { owner: v || null })} />
                          </div>
                          <div>
                            <Label className="text-xs inline-flex items-center gap-1">
                              {t("Datenklasse","Data class")}
                              <FieldInfo
                                title={t("Datenklasse (Schutzbedarf Vertraulichkeit)","Data class (confidentiality need)")}
                                body={t(
                                  "Öffentlich → Normal/intern → Vertraulich → Streng vertraulich. Erhöht den Impact in der Risikoanalyse (Phase 04) und steuert Kontrollen wie Verschlüsselung und Zugriffsbeschränkung.",
                                  "Public → Normal/internal → Confidential → Highly confidential. Raises the impact in the risk analysis (phase 04) and drives controls such as encryption and access restriction."
                                )}
                              />
                            </Label>
                            <Select value={a.data_sensitivity ?? "__none__"} onValueChange={(v) => updateAsset(a.id, { data_sensitivity: v === "__none__" ? null : v })}>
                              <SelectTrigger><SelectValue placeholder={t("— wählen —","— select —")}/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">— {t("nicht klassifiziert","not classified")} —</SelectItem>
                                {a.data_sensitivity && !sensitivityLevels.some((l) => l.label === a.data_sensitivity) && (
                                  <SelectItem value={a.data_sensitivity}>{sensLabel(a.data_sensitivity)} · {t("veraltet","legacy")}</SelectItem>
                                )}
                                {sensitivityLevels.map((l) => (
                                  <SelectItem key={l.label} value={l.label}>
                                    {l.label === "Normal" ? t("Normal (intern)", "Normal (internal)") : displayLabel(l, de ? "de" : "en")}
                                    <span className="ml-1 text-[10px] text-muted-foreground">· {t("Stufe","tier")} {l.tier}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs inline-flex items-center gap-1">
                              {t("Extern erreichbar","Externally exposed")}
                              <FieldInfo
                                title={t("Externe Erreichbarkeit","External exposure")}
                                body={t(
                                  "Aus dem Internet erreichbar (Webportal, VPN-Gateway, SaaS). Erhöht die Eintrittswahrscheinlichkeit in der Risikoanalyse (Phase 04).",
                                  "Reachable from the internet (web portal, VPN gateway, SaaS). Raises the likelihood in the risk analysis (phase 04)."
                                )}
                              />
                            </Label>
                            <div className="h-10 flex items-center gap-2">
                              <Switch checked={!!a.external_exposure} onCheckedChange={(v) => updateAsset(a.id, { external_exposure: v })} aria-label={t("Extern erreichbar","Externally exposed")} />
                              <span className={`text-xs ${a.external_exposure ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                                {a.external_exposure ? <><Globe size={12} className="inline mr-1 -mt-0.5" />{t("ja — Internet","yes — internet")}</> : t("nein — nur intern","no — internal only")}
                              </span>
                            </div>
                          </div>
                          <div className="md:col-span-2 text-[10px] text-muted-foreground self-center">
                            {t("Owner, Datenklasse und externe Erreichbarkeit fließen in die Risikoanalyse (Phase 04) ein. Speichern mit dem Disketten-Symbol.", "Owner, data class and external exposure feed the risk analysis (phase 04). Save with the disk icon.")}
                          </div>
                        </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          {/* ---------- DEPENDENCIES ---------- */}
          <TabsContent value="deps" className="space-y-4 mt-4">
            <div className="flex justify-between items-center gap-2 flex-wrap">
              <div className="flex-1 min-w-[240px]" />
              <div className="inline-flex rounded-md border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDepView("table")}
                  className={`px-3 py-1.5 text-xs font-medium ${depView === "table" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >{t("Tabelle","Table")}</button>
                <button
                  type="button"
                  onClick={() => setDepView("graph")}
                  className={`px-3 py-1.5 text-xs font-medium border-l ${depView === "graph" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >{t("Graph","Graph")}</button>
              </div>
              <Button onClick={() => setQuickDepOpen(true)} size="sm" variant="outline" className="gap-1.5">
                <Cable size={14}/>{t("Schnell erstellen","Quick add")}
              </Button>
              <Button onClick={addDependency} size="sm" disabled={assets.length < 2}><Plus size={14} className="mr-1"/>{t("Abhängigkeit","Dependency")}</Button>
            </div>

            {deps.length === 0 && (
              <Card><CardContent className="text-center py-12 text-muted-foreground text-sm">
                {t("Noch keine Abhängigkeiten erfasst.","No dependencies recorded yet.")}
              </CardContent></Card>
            )}

            {deps.length > 0 && depView === "graph" && (
              <DependencyGraph
                assets={assets.map((a) => ({ id: a.id, asset_name: a.asset_name, asset_type: a.asset_type, service_name: serviceNameById.get(a.service_id) ?? null }))}
                deps={deps.filter((d) => d.source_type === "asset")}
                de={de}
              />
            )}

            {depView === "table" && (<>
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="rounded-md border border-border px-2 py-0.5 tabular-nums">{deps.length} {t("gesamt","total")}</span>
              <span className="rounded-md border border-border px-2 py-0.5 tabular-nums">{deps.filter((d) => d.source_type === "asset").length} Asset → Asset</span>
              <span className="rounded-md border border-border px-2 py-0.5 tabular-nums">{deps.filter((d) => d.source_type === "service").length} Service → Asset</span>
              <span className={`rounded-md border px-2 py-0.5 tabular-nums ${spofCount > 0 ? "border-destructive/50 text-destructive" : "border-border"}`}>
                <AlertTriangle size={11} className="inline mr-1 -mt-0.5" />SPOF: {spofCount}
              </span>
              <InfoHint title="SPOF" text={t("Kritikalität, Abhängigkeiten und SPOF erhöhen den Impact in der Risikoanalyse (Phase 04). Schalter je Zeile: Abhängigkeit ohne Redundanz = Single Point of Failure.", "Criticality, dependencies and SPOF raise the impact in the risk analysis (phase 04). Toggle per row: dependency without redundancy = single point of failure.")} />
            </div>

            {deps.map((d) => (
              <Card key={d.id} className={d.is_spof ? "border-destructive/40" : ""}>
                <CardContent className="pt-5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1.4fr_1.4fr_1fr_auto_auto] gap-3 items-end">
                    <div>
                      <Label className="text-xs">{t("Quelle","Source")}</Label>
                      {/* P2.B.1: Quelltyp — Asset oder Service (DB erlaubt beides; Lieferant nur lesbar) */}
                      <Select
                        value={d.source_type === "service" ? "service" : d.source_type === "supplier" ? "supplier" : "asset"}
                        onValueChange={(v) => updateDep(d.id, { source_type: v, source_id: null, source_label: "" })}
                        disabled={d.source_type === "supplier"}>
                        <SelectTrigger className="w-28"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          {d.source_type === "supplier" && <SelectItem value="supplier">{t("Lieferant","Supplier")}</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs inline-flex items-center gap-1">
                        {d.source_type === "service" ? t("Quell-Service","Source service") : d.source_type === "supplier" ? t("Lieferant","Supplier") : t("Quell-Asset","Source asset")}
                        {d.source_type === "service" && <Badge variant="outline" className="text-[9px] px-1 py-0 border-accent/50 text-accent">Service</Badge>}
                        {d.source_type === "supplier" && <Badge variant="outline" className="text-[9px] px-1 py-0">{t("Lieferant","Supplier")}</Badge>}
                      </Label>
                      {d.source_type === "supplier" ? (
                        <Input value={d.source_label} readOnly className="bg-muted/40" />
                      ) : d.source_type === "service" ? (
                        <Select
                          value={d.source_id ?? ""}
                          onValueChange={(v) => {
                            const svc = services.find((s) => s.id === v);
                            updateDep(d.id, { source_type: "service", source_id: v, source_label: svc?.name ?? d.source_label });
                          }}>
                          <SelectTrigger><SelectValue placeholder={t("— Service wählen —","— select service —")}/></SelectTrigger>
                          <SelectContent>
                            {services.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={d.source_id ?? ""}
                          onValueChange={(v) => {
                            const asset = assets.find((a) => a.id === v);
                            updateDep(d.id, { source_type: "asset", source_id: v, source_label: asset?.asset_name ?? d.source_label });
                          }}>
                          <SelectTrigger><SelectValue placeholder={t("— Asset wählen —","— select asset —")}/></SelectTrigger>
                          <SelectContent>
                            {assets.map((a) => <SelectItem key={a.id} value={a.id}>{assetOptionLabel(a)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">{t("Ziel-Asset","Target asset")}</Label>
                      <Select
                        value={d.target_id ?? ""}
                        onValueChange={(v) => {
                          const asset = assets.find((a) => a.id === v);
                          updateDep(d.id, { target_type: "asset", target_id: v, target_label: asset?.asset_name ?? d.target_label });
                        }}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          {assets.map((a) => <SelectItem key={a.id} value={a.id}>{assetOptionLabel(a)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">{t("Notizen","Notes")}</Label>
                      <Input value={d.notes ?? ""} onChange={(e) => updateDep(d.id, { notes: e.target.value })}/>
                    </div>
                    <div>
                      <Label className="text-xs inline-flex items-center gap-1">
                        SPOF
                        {d.is_spof && <Badge className="text-[9px] px-1 py-0 bg-destructive/15 text-destructive border-0"><AlertTriangle size={9} className="inline mr-0.5 -mt-0.5" />SPOF</Badge>}
                      </Label>
                      <div className="h-10 flex items-center">
                        <Switch checked={!!d.is_spof} onCheckedChange={(v) => toggleSpof(d, v)} aria-label="Single Point of Failure"
                                title={t("Single Point of Failure — wird sofort gespeichert", "Single point of failure — saved immediately")} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => saveDep(d)} disabled={saving || d.source_type === "supplier"}><Save size={14}/></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteDep(d.id)}><Trash2 size={14}/></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </>)}
          </TabsContent>

        </Tabs>
        )}

        <InspirationDialog
          open={inspOpen} onOpenChange={setInspOpen}
          tenantId={user?.id ?? null} detectedSectorKey={sectorKey}
          de={de} onApplied={load}
        />
        <RestImportDialog
          open={restOpen} onOpenChange={setRestOpen}
          tenantId={user?.id ?? null} services={services.map((s) => ({ id: s.id, name: s.name }))}
          de={de} onImported={load}
        />
        <CsvImportDialog
          open={csvOpen !== null} onOpenChange={(v) => !v && setCsvOpen(null)}
          kind={csvOpen ?? "services"} tenantId={user?.id ?? null}
          de={de} onImported={load}
        />

        {wizardFor && (() => {
          const svc = services.find((x) => x.id === wizardFor);
          if (!svc) return null;
          return (
            <CriticalityWizard
              open={!!wizardFor}
              onOpenChange={(o) => !o && setWizardFor(null)}
              initial={svc.criticality_assessment ?? null}
              currentValue={svc.criticality}
              serviceName={svc.name}
              onSave={async (value, assessment) => {
                updateService(svc.id, { criticality: value, criticality_assessment: assessment });
                const { error } = await supabase.from("services").update({
                  criticality: value,
                  criticality_assessment: assessment as any,
                }).eq("id", svc.id);
                if (error) toast.error(error.message);
                else toast.success(t("Kritikalität aktualisiert", "Criticality updated"));
              }}
            />
          );
        })()}

        <QuickDependencyDialog
          open={quickDepOpen}
          onOpenChange={setQuickDepOpen}
          assets={assets.map((a) => ({
            id: a.id,
            asset_name: a.asset_name,
            asset_type: a.asset_type,
            service_id: a.service_id,
            service_name: serviceNameById.get(a.service_id) ?? t("Kein Service", "No service"),
          }))}
          existingDeps={deps}
          tenantId={user?.id ?? ""}
          de={de}
          onCreated={(rows) => setDeps((prev) => [...prev, ...rows])}
        />
      </main>
    </div>
  );
};

export default Inventory;
