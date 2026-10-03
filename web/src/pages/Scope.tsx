import { useState, useEffect, useRef, useCallback } from "react";
import { CHART_STATUS } from "@/lib/chartPalette";
import { Building2, Layers, Users, Save, Loader2, ImageIcon, Upload, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FrameworkInheritanceButton from "@/components/FrameworkInheritanceButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { useLanguage } from "@/contexts/LanguageContext";
import { ModeToggle } from "@/components/ModeToggle";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { emitFrameworksUpdated } from "@/lib/frameworkBus";


import AccentColorPicker from "@/components/AccentColorPicker";
import ThemeModePicker from "@/components/ThemeModePicker";
import CompanyInitialLogo from "@/components/CompanyInitialLogo";
import PersonnelManager from "@/components/PersonnelManager";
import ExportMenu from "@/components/common/ExportMenu";
import {
  hydrateCompanyBrandFromCloud,
  uploadCompanyLogo,
  removeCompanyLogo,
  setCompanyBrand,
  getCompanyBrand,
} from "@/lib/companyBrand";
import { exportScopeReportPdf, exportScopeReportDocx, exportScopeReportXlsx } from "@/lib/scopeReport";
import { PERSONNEL_TOOL_KEY, type PersonnelRegistry } from "@/lib/personnel";
import {
  SCOPE_GATE_TOOL_KEY,
  gatesForFrameworks,
  loadScopeGates,
  readScopeGatesLocal,
  writeScopeGatesLocal,
  applyScopeGate,
  type ScopeGateState,
  type GateAnswer,
} from "@/lib/applicabilityGates";

interface FrameworkRow {
  code: string;
  name_de: string;
  name_en: string;
  role: string;
  sort_order: number | null;
}

interface CompanyProfile {
  id?: string;
  company_name: string;
  sector: string;
  company_size: string;
  employee_count: number | null;
  annual_revenue: number | null;
  enabled_frameworks: string[];
  kritis_sub_sectors: string[];
}

const EMPTY_PROFILE: CompanyProfile = {
  company_name: "",
  sector: "",
  company_size: "",
  employee_count: null,
  annual_revenue: null,
  enabled_frameworks: [],
  kritis_sub_sectors: [],
};

const KRITIS_SECTORS = [
  { code: "energy",     de: "Energie",              en: "Energy" },
  { code: "water",      de: "Wasser",               en: "Water" },
  { code: "food",       de: "Ernährung",            en: "Food" },
  { code: "health",     de: "Gesundheit",           en: "Health" },
  { code: "finance",    de: "Finanzen & Versich.",  en: "Finance & Insurance" },
  { code: "transport",  de: "Transport & Verkehr",  en: "Transport & Traffic" },
  { code: "ict",        de: "IT & Telekommunikation", en: "IT & Telecom" },
  { code: "media",      de: "Medien & Kultur",      en: "Media & Culture" },
  { code: "gov",        de: "Staat & Verwaltung",   en: "Government" },
  { code: "waste",      de: "Siedlungsabfall",      en: "Municipal waste" },
];

const FRAMEWORK_DESC: Record<string, { de: string; en: string }> = {
  ISO27001: {
    de: "ISO/IEC 27001:2022 · zertifizierbares ISMS · Annex-A-Kontrollen (A.5–A.8) als gemeinsame Referenz vieler Frameworks.",
    en: "ISO/IEC 27001:2022 · certifiable ISMS · Annex A controls (A.5–A.8) shared as reference by many frameworks.",
  },
  ISO27017: {
    de: "ISO/IEC 27017:2015 · Cloud-spezifische Sicherheitskontrollen für Anbieter & Kunden.",
    en: "ISO/IEC 27017:2015 · cloud-specific security controls for providers & customers.",
  },
  ISO27018: {
    de: "ISO/IEC 27018:2019 · Schutz personenbezogener Daten (PII) in Public Clouds.",
    en: "ISO/IEC 27018:2019 · protection of PII in public clouds.",
  },
  TR03183: {
    de: "BSI TR-03183 · technische CRA-Anforderungen: SBOM, Schwachstellenmeldung (CVD), Update-Pflichten.",
    en: "BSI TR-03183 · technical CRA requirements: SBOM, vulnerability disclosure (CVD), update duties.",
  },
  BSI: {
    de: "Risiko-Anker · Grundschutz-Bausteine & Gefährdungskatalog.",
    en: "Risk anchor · Grundschutz modules & threat catalog.",
  },
  NIS2: {
    de: "EU-Richtlinie für wesentliche/wichtige Einrichtungen (Melde­pflicht, TOMs).",
    en: "EU directive for essential/important entities (reporting, TOMs).",
  },
  DORA: {
    de: "Digital Operational Resilience Act — Finanzsektor, ICT-Risiken & Dritt­parteien.",
    en: "Digital Operational Resilience Act — financial sector ICT & third parties.",
  },
  MaRisk: {
    de: "MaRisk + BAIT — bankaufsichtliche Anforderungen an IT & Risiko­management.",
    en: "MaRisk + BAIT — supervisory requirements for banking IT & risk management.",
  },
  KRITIS: {
    de: "Kritische Infrastrukturen (B3S) — Sub-Sektor-Auswahl erforderlich.",
    en: "Critical infrastructures (B3S) — sub-sector selection required.",
  },
  TISAX: {
    de: "Automotive-Standard (ENX/VDA-ISA 6.0.2) für Lieferanten & OEMs.",
    en: "Automotive standard (ENX/VDA-ISA 6.0.2) for suppliers & OEMs.",
  },
  AIACT: {
    de: "EU AI Act (VO 2024/1689) · Verbindliches EU-Recht · Risiko­klassen (verboten / hoch / begrenzt / minimal), Konformitäts­bewertung, CE-Kennzeichnung, GPAI-Pflichten.",
    en: "EU AI Act (Reg. 2024/1689) · Binding EU law · Risk classes (prohibited/high/limited/minimal), conformity assessment, CE marking, GPAI obligations.",
  },
  ISO42001: {
    de: "ISO/IEC 42001:2023 · AI Management System (AIMS) · zertifizierbares Management­system für KI-Governance, Risiko, Lebenszyklus.",
    en: "ISO/IEC 42001:2023 · AI Management System (AIMS) · certifiable management system for AI governance, risk, lifecycle.",
  },
  NIST_AI_RMF: {
    de: "NIST AI RMF 1.0 (US-Framework) · Govern / Map / Measure / Manage · Trustworthy-AI-Prinzipien, häufig für US-Marktzugang.",
    en: "NIST AI RMF 1.0 (US framework) · Govern / Map / Measure / Manage · Trustworthy AI principles, often required for US market access.",
  },
  GDPR: {
    de: "DSGVO · Verarbeitungs­verzeichnis (Art. 30), TOMs (Art. 32), Melde­pflicht 72h (Art. 33), DSFA (Art. 35), AV-Verträge (Art. 28).",
    en: "GDPR · Records of processing (Art. 30), TOMs (Art. 32), 72h breach notification (Art. 33), DPIA (Art. 35), processor agreements (Art. 28).",
  },
  ISO27701: {
    de: "ISO/IEC 27701:2019 · Privacy Information Management System (PIMS) · Erweiterung zu ISO 27001 für PII-Controller & Processor.",
    en: "ISO/IEC 27701:2019 · Privacy Information Management System (PIMS) · extension of ISO 27001 for PII controllers & processors.",
  },
  BCM22301: {
    de: "ISO 22301:2019 · Business Continuity Management System (BCMS) · BIA, Strategie, Notfall­pläne, Übungen, KVP.",
    en: "ISO 22301:2019 · Business Continuity Management System (BCMS) · BIA, strategy, contingency plans, exercises, continual improvement.",
  },
  BSI200_4: {
    de: "BSI-Standard 200-4 · Notfall­management nach BSI · Praxisleitfaden, BAO, BC-/DR-Handbuch, Wieder­anlauf­pläne.",
    en: "BSI Standard 200-4 · Business continuity per BSI · practical guide, crisis org, BC/DR handbook, recovery plans.",
  },
  CRA: {
    de: "EU Cyber Resilience Act (VO 2024/2847) · Produkte mit digitalen Elementen · Secure-by-Design, SBOM, Schwachstellen­management, 24h-Meldung an ENISA. Pflicht ab Dez 2027 für Hersteller/Importeure/Händler.",
    en: "EU Cyber Resilience Act (Reg. 2024/2847) · Products with digital elements · Secure-by-design, SBOM, vulnerability handling, 24h ENISA notification. Mandatory from Dec 2027 for manufacturers/importers/distributors.",
  },
  NIST_CSF: {
    de: "NIST Cybersecurity Framework 2.0 · 6 Funktionen (GOVERN / IDENTIFY / PROTECT / DETECT / RESPOND / RECOVER) · 106 Outcomes als Bewertungs­basis, 121 Implementation Examples als Vertiefung.",
    en: "NIST Cybersecurity Framework 2.0 · 6 functions (GOVERN / IDENTIFY / PROTECT / DETECT / RESPOND / RECOVER) · 106 outcomes as scoring baseline, 121 implementation examples as depth.",
  },
};



const Scope = () => {
  const { lang } = useLanguage();
  const { mode } = useAssessmentMode();
  const { user, getTenantId } = useAuth();
  const de = lang === "de";

  const [profile, setProfile] = useState<CompanyProfile>(EMPTY_PROFILE);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [frameworks, setFrameworks] = useState<FrameworkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(() => getCompanyBrand().logoDataUrl);
  const [logoPath, setLogoPath] = useState<string | null>(() => getCompanyBrand().logoPath);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const tenantIdRef = useRef<string | null>(null);
  const persistTimer = useRef<number | null>(null);
  const [frameworksSaving, setFrameworksSaving] = useState(false);
  const [frameworksSavedAt, setFrameworksSavedAt] = useState<number | null>(null);
  // Vorab-Fragen zum Anwendungsbereich (z. B. TLD-Registry nach NIS2 Art. 28).
  const [scopeGates, setScopeGates] = useState<ScopeGateState>(() => readScopeGatesLocal());
  const [gateSaving, setGateSaving] = useState<string | null>(null);

  // Vorab-Antworten laden, sobald der Mandant bekannt ist.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tenantId = tenantIdRef.current || (user ? (await getTenantId()) || user.id : null);
      if (!tenantId) return;
      const state = await loadScopeGates(tenantId);
      if (!cancelled) setScopeGates(state);
    })();
    return () => { cancelled = true; };
  }, [user, getTenantId, loading]);

  /**
   * Antwort auf eine Scope-Frage speichern und die abhängigen Kontrollen
   * konsistent halten: „Nein" markiert sie als nicht anwendbar (SoA),
   * „Ja" nimmt eine frühere automatische Markierung zurück.
   */
  const setScopeGate = useCallback(async (gateId: string, answer: GateAnswer) => {
    const tenantId = tenantIdRef.current || (user ? (await getTenantId()) || user.id : null);
    if (!tenantId) return;
    setGateSaving(gateId);
    const next = { ...scopeGates, [gateId]: answer };
    setScopeGates(next);
    writeScopeGatesLocal(next);
    try {
      const { error } = await supabase
        .from("org_tool_data")
        .upsert(
          { tenant_id: tenantId, tool_key: SCOPE_GATE_TOOL_KEY, data: next, updated_by: user?.id },
          { onConflict: "tenant_id,tool_key" },
        );
      if (error) throw error;
      const res = await applyScopeGate(tenantId, gateId, answer, user?.id);
      if (res.marked > 0) {
        toast.success(de
          ? `${res.marked} Kontrollen als „nicht anwendbar" gesetzt (Anwendungsbereich).`
          : `${res.marked} controls set to “not applicable” (scope).`);
      } else if (res.cleared > 0) {
        toast.success(de
          ? `${res.cleared} Kontrollen wieder zur Beantwortung freigegeben.`
          : `${res.cleared} controls re-opened for assessment.`);
      } else {
        toast.success(de ? "Gespeichert." : "Saved.");
      }
      emitFrameworksUpdated({ enabled_frameworks: profile.enabled_frameworks });
    } catch {
      toast.error(de ? "Konnte nicht gespeichert werden." : "Could not be saved.");
    } finally {
      setGateSaving(null);
    }
  }, [scopeGates, user, getTenantId, de, profile.enabled_frameworks]);

  // Fetch framework catalog once
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("frameworks")
        .select("code, name_de, name_en, role, sort_order")
        .order("sort_order", { ascending: true, nullsFirst: false });
      setFrameworks((data as FrameworkRow[]) ?? []);
    })();
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const tenantId = (await getTenantId()) || userId;
    tenantIdRef.current = tenantId;

    const { data: row } = await supabase
      .from("company_profiles")
      .select("id, company_name, sector, company_size, employee_count, annual_revenue, enabled_frameworks, kritis_sub_sectors")
      .eq("user_id", tenantId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (row) {
      setProfileId(row.id);
      setProfile({
        id: row.id,
        company_name: row.company_name ?? "",
        sector: row.sector ?? "",
        company_size: row.company_size ?? "",
        employee_count: row.employee_count,
        annual_revenue: row.annual_revenue,
        enabled_frameworks: row.enabled_frameworks ?? [],
        kritis_sub_sectors: row.kritis_sub_sectors ?? [],
      });
    }
    await hydrateCompanyBrandFromCloud(tenantId);
    const brand = getCompanyBrand();
    setLogoDataUrl(brand.logoDataUrl);
    setLogoPath(brand.logoPath);
  }, [getTenantId]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    (async () => {
      await loadProfile(user.id);
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [user, loadProfile]);

  /**
   * Persist ONLY the framework selection (and dependent KRITIS sub-sectors)
   * — used by every checkbox toggle so the choice is instantly reflected
   * in Phase 3 (Assessment) and every downstream phase, without waiting
   * for the user to click the big "Save" button.
   */
  const persistFrameworks = useCallback((
    nextFrameworks: string[],
    nextKritis: string[],
  ) => {
    if (!user) return;
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistTimer.current = window.setTimeout(async () => {
      const tenantId = tenantIdRef.current ?? user.id;
      const kritisSubs = nextFrameworks.includes("KRITIS") ? nextKritis : [];
      setFrameworksSaving(true);

      let error;
      if (profileId) {
        ({ error } = await supabase
          .from("company_profiles")
          .update({ enabled_frameworks: nextFrameworks, kritis_sub_sectors: kritisSubs })
          .eq("id", profileId));
      } else {
        // No profile row yet — create a minimal one so the selection sticks.
        const res = await supabase
          .from("company_profiles")
          .insert({
            user_id: tenantId,
            company_name: profile.company_name?.trim() ?? "",
            country: "EU",
            enabled_frameworks: nextFrameworks,
            kritis_sub_sectors: kritisSubs,
          })
          .select()
          .single();

        error = res.error;
        if (!res.error && res.data) setProfileId(res.data.id);
      }

      setFrameworksSaving(false);
      if (error) {
        toast.error(de ? "Framework-Auswahl konnte nicht gespeichert werden" : "Could not save framework selection");
      } else {
        setFrameworksSavedAt(Date.now());
        emitFrameworksUpdated({
          enabled_frameworks: nextFrameworks,
          kritis_sub_sectors: kritisSubs,
        });
      }
    }, 350);
  }, [user, profileId, de]);

  const saveProfile = async () => {

    if (!user) return;

    // Enforce KRITIS sub-sector selection when KRITIS is active
    if (profile.enabled_frameworks.includes("KRITIS") && profile.kritis_sub_sectors.length === 0) {
      toast.error(de
        ? "Bitte mindestens einen KRITIS Sub-Sektor auswählen."
        : "Please select at least one KRITIS sub-sector.");
      return;
    }

    setSaving(true);
    const tenantId = tenantIdRef.current ?? user.id;

    // Never persist sub-sectors when KRITIS itself is not enabled
    const kritisSubs = profile.enabled_frameworks.includes("KRITIS") ? profile.kritis_sub_sectors : [];

    const payload = {
      user_id: tenantId,
      company_name: profile.company_name.trim(),
      country: "EU",
      sector: profile.sector,
      company_size: profile.company_size,
      employee_count: profile.employee_count,
      annual_revenue: profile.annual_revenue,
      enabled_frameworks: profile.enabled_frameworks,
      kritis_sub_sectors: kritisSubs,
      logo_url: logoPath,
    };

    let error;
    if (profileId) {
      ({ error } = await supabase.from("company_profiles").update(payload).eq("id", profileId));
    } else {
      const res = await supabase.from("company_profiles").insert(payload).select().single();
      error = res.error;
      if (!res.error && res.data) setProfileId(res.data.id);
    }

    if (error) {
      toast.error(de ? "Fehler beim Speichern" : "Save error");
    } else {
      setCompanyBrand({
        companyName: profile.company_name.trim(),
        logoDataUrl,
        logoPath,
      });
      toast.success(de ? "Profil gespeichert ✓" : "Profile saved ✓");
    }
    setSaving(false);
  };


  const handleLogoFile = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error(de ? "Bitte ein Bild wählen" : "Please choose an image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(de ? "Datei zu groß (max. 2 MB)" : "File too large (max 2 MB)");
      return;
    }
    setLogoUploading(true);
    try {
      const tenantId = tenantIdRef.current ?? user.id;
      const { path, dataUrl } = await uploadCompanyLogo(tenantId, file);
      setLogoPath(path);
      setLogoDataUrl(dataUrl);
      if (profileId) {
        await supabase.from("company_profiles").update({ logo_url: path }).eq("id", profileId);
      }
      toast.success(de ? "Logo hochgeladen ✓" : "Logo uploaded ✓");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "unknown";
      toast.error((de ? "Upload fehlgeschlagen: " : "Upload failed: ") + msg);
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    setLogoUploading(true);
    try {
      await removeCompanyLogo(logoPath);
      setLogoPath(null);
      setLogoDataUrl(null);
      if (profileId) {
        await supabase.from("company_profiles").update({ logo_url: null }).eq("id", profileId);
      }
    } finally {
      setLogoUploading(false);
    }
  };

  const toggleFramework = (code: string) => {
    setProfile(p => {
      const enabled = p.enabled_frameworks.includes(code)
        ? p.enabled_frameworks.filter(c => c !== code)
        : [...p.enabled_frameworks, code];
      const nextKritis = enabled.includes("KRITIS") ? p.kritis_sub_sectors : [];
      persistFrameworks(enabled, nextKritis);
      return { ...p, enabled_frameworks: enabled, kritis_sub_sectors: nextKritis };
    });
  };


  const toggleKritis = (code: string) => {
    setProfile(p => {
      const nextKritis = p.kritis_sub_sectors.includes(code)
        ? p.kritis_sub_sectors.filter(c => c !== code)
        : [...p.kritis_sub_sectors, code];
      persistFrameworks(p.enabled_frameworks, nextKritis);
      return { ...p, kritis_sub_sectors: nextKritis };
    });
  };


  const runScopeExport = async (fmt: "pdf" | "docx" | "xlsx") => {
    if (!user) return;
    let people: PersonnelRegistry["people"] = [];
    try {
      const { data } = await supabase
        .from("user_tool_data")
        .select("data")
        .eq("user_id", user.id)
        .eq("tool_key", PERSONNEL_TOOL_KEY)
        .maybeSingle();
      const raw = (data?.data as unknown) as PersonnelRegistry | null;
      people = raw?.people ?? [];
    } catch { people = []; }
    const payload = {
      profile: {
        company_name: profile.company_name,
        sector: profile.sector,
        company_size: profile.company_size,
        employee_count: profile.employee_count,
        annual_revenue: profile.annual_revenue,
        enabled_frameworks: profile.enabled_frameworks,
        kritis_sub_sectors: profile.kritis_sub_sectors,
      },
      people,
      de,
      authorName: "",
    };
    if (fmt === "pdf") await exportScopeReportPdf(payload);
    else if (fmt === "docx") await exportScopeReportDocx(payload);
    else await exportScopeReportXlsx(payload);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showKritis = profile.enabled_frameworks.includes("KRITIS");
  // Vorabfragen nur zeigen, wenn das zugehörige Framework aktiv ist
  // (TLD-Frage ist ausschließlich für NIS2 relevant).
  const scopeGateDefs = gatesForFrameworks(profile.enabled_frameworks);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {de ? "Phase 1 — Scope & Kontext" : "Phase 1 — Scope & Context"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {de
              ? "Firma, Frameworks und Personen sind die Grundlage aller weiteren Phasen."
              : "Company, frameworks and people are the foundation for every following phase."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle de={de} />
          <ExportMenu
            onPdf={() => runScopeExport("pdf")}
            onWord={() => runScopeExport("docx")}
            onExcel={() => runScopeExport("xlsx")}
          />
        </div>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" /> {de ? "Firma" : "Company"}</TabsTrigger>
          <TabsTrigger value="frameworks" className="gap-2"><Layers className="h-4 w-4" /> Frameworks</TabsTrigger>
          <TabsTrigger value="people" className="gap-2"><Users className="h-4 w-4" /> {de ? "Personen" : "People"}</TabsTrigger>
        </TabsList>

        {/* ─────────── Tab 1: Firma ─────────── */}
        <TabsContent value="company" className="space-y-4 mt-4">
          {/* ÜBERBLICK: kompaktes Profil-Summary mit Vollständigkeits-Grafik. */}
          {mode !== "expert" && (() => {
            const fields = [
              { l: de ? "Firmenname" : "Company name", v: profile.company_name || "" },
              { l: de ? "Branche / Sektor" : "Sector", v: profile.sector || "" },
              { l: de ? "Größe" : "Size", v: profile.company_size || "" },
              { l: de ? "Mitarbeiter" : "Employees", v: profile.employee_count != null ? String(profile.employee_count) : "" },
              { l: de ? "Jahresumsatz (€)" : "Annual revenue (€)", v: profile.annual_revenue != null ? Number(profile.annual_revenue).toLocaleString(de ? "de-DE" : "en-GB") : "" },
            ];
            const filled = fields.filter(f => f.v !== "").length;
            const pct = Math.round((filled / fields.length) * 100);
            const ringColor = pct >= 80 ? CHART_STATUS.ja : pct >= 40 ? CHART_STATUS.teilweise : CHART_STATUS.nein;
            return (
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="shrink-0 mx-auto sm:mx-0 relative" style={{ width: 132, height: 132 }}>
                <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${ringColor} ${pct * 3.6}deg, hsl(var(--muted)) 0deg)` }} />
                <div className="absolute inset-[13px] rounded-full bg-card flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground tabular-nums">{pct}%</span>
                  <span className="text-[10px] text-muted-foreground">{de ? "Profil ausgefüllt" : "Profile filled"}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-semibold text-foreground mb-2">{de ? "Unternehmensprofil" : "Company profile"}</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fields.map((f, i) => (
                    <div key={i}>
                      <div className="text-[11px] text-muted-foreground">{f.l}</div>
                      <div className={`text-sm font-medium truncate ${f.v ? "text-foreground" : "text-muted-foreground/50"}`} title={String(f.v || "—")}>{f.v || "—"}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] text-muted-foreground border-t border-border pt-2 mt-3">
                  {de ? "Zum Bearbeiten von Firmendaten, Logo und Akzentfarbe auf " : "To edit company data, logo and accent colour, switch to "}
                  <span className="font-semibold text-foreground">Detail</span>
                  {de ? " wechseln." : " above."}
                </div>
              </div>
            </div>
            );
          })()}

          {mode === "expert" && (<>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> {de ? "Firmendaten" : "Company data"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">{de ? "Firmenname" : "Company name"}</Label>
                <Input
                  placeholder={de ? "z.B. Muster GmbH" : "e.g. Acme Corp"}
                  value={profile.company_name}
                  onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">{de ? "Branche / Sektor" : "Sector"}</Label>
                  <Input
                    placeholder={de ? "z.B. Automotive, Health, Finance" : "e.g. Automotive, Health, Finance"}
                    value={profile.sector}
                    onChange={e => setProfile(p => ({ ...p, sector: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">{de ? "Unternehmensgröße" : "Company size"}</Label>
                  <Select
                    value={profile.company_size || undefined}
                    onValueChange={v => setProfile(p => ({ ...p, company_size: v }))}
                  >
                    <SelectTrigger><SelectValue placeholder={de ? "Auswählen…" : "Choose…"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="micro">Micro (&lt; 10)</SelectItem>
                      <SelectItem value="small">Small (10–49)</SelectItem>
                      <SelectItem value="medium">Medium (50–249)</SelectItem>
                      <SelectItem value="large">Large (250–999)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">{de ? "Mitarbeiterzahl" : "Employee count"}</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={profile.employee_count ?? ""}
                    onChange={e => setProfile(p => ({ ...p, employee_count: e.target.value ? Number(e.target.value) : null }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">{de ? "Jahresumsatz (€)" : "Annual revenue (€)"}</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={profile.annual_revenue ?? ""}
                    onChange={e => setProfile(p => ({ ...p, annual_revenue: e.target.value ? Number(e.target.value) : null }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logo — optionales Branding = Detail-Tooling; Überblick bleibt schlank. */}
          <Card className={mode === "expert" ? "" : "hidden"}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                {de ? "Firmenlogo" : "Company logo"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {de
                  ? "Erscheint in der Kopfzeile und in allen Berichten. Ohne Upload wird der Anfangsbuchstabe des Firmennamens in der Akzentfarbe verwendet. PNG · JPG · SVG · WebP (max. 2 MB)."
                  : "Shown in the header and in every report. Without an upload, the company name's initial in the accent color is used. PNG · JPG · SVG · WebP (max 2 MB)."}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4 items-stretch">
                <div className="rounded-xl border border-border shadow-sm flex items-center justify-center bg-white" style={{ minHeight: 140, padding: 14 }}>
                  {logoDataUrl ? (
                    <img src={logoDataUrl} alt={de ? "Logo Vorschau" : "Logo preview"} style={{ maxWidth: "100%", maxHeight: 112, objectFit: "contain" }} />
                  ) : profile.company_name?.trim() ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <CompanyInitialLogo name={profile.company_name} size={72} />
                      <span className="text-[11px] text-center leading-tight">
                        {de ? "Standard: Anfangsbuchstabe in Akzentfarbe" : "Default: initial in accent color"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                      <ImageIcon className="h-6 w-6 opacity-50" />
                      <span className="text-[11px]">{de ? "Vorschau" : "Preview"}</span>
                    </div>
                  )}
                </div>
                <label
                  className="upload-zone group min-h-[140px]"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("upload-zone--active"); }}
                  onDragLeave={(e) => e.currentTarget.classList.remove("upload-zone--active")}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("upload-zone--active");
                    const f = e.dataTransfer.files?.[0];
                    if (f) void handleLogoFile(f);
                  }}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleLogoFile(f);
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="h-11 w-11 rounded-full flex items-center justify-center bg-white shadow-[0_4px_14px_-4px_hsl(var(--accent-h)_var(--accent-s)_45%/0.5)] border border-[hsl(var(--accent-h)_var(--accent-s)_45%/0.4)]">
                      {logoUploading ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Upload className="h-5 w-5 text-accent" />}
                    </div>
                    <div className="space-y-0.5 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {logoDataUrl
                          ? (de ? "Logo ersetzen" : "Replace logo")
                          : (de ? "Logo hierher ziehen oder klicken" : "Drop logo here or click")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">PNG · JPG · SVG · WebP — max. 2 MB</p>
                    </div>
                    {logoDataUrl && (
                      <button
                        type="button"
                        disabled={logoUploading}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); void handleLogoRemove(); }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-destructive hover:underline"
                      >
                        <X className="h-3 w-3" /> {de ? "Entfernen" : "Remove"}
                      </button>
                    )}
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <AccentColorPicker de={de} />
          <ThemeModePicker de={de} />
          </>)}
        </TabsContent>

        {/* ─────────── Tab 2: Frameworks ─────────── */}
        <TabsContent value="frameworks" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" /> {de ? "Aktivierte Frameworks" : "Active frameworks"}
                <span className="ml-auto text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                  {frameworksSaving ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> {de ? "Speichere …" : "Saving …"}</>
                  ) : frameworksSavedAt ? (
                    <><Check className="h-3 w-3 text-accent" /> {de ? "Automatisch gespeichert" : "Auto-saved"}</>
                  ) : null}
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {de
                  ? "Wählen Sie alle Frameworks, für die Sie Compliance-Nachweise erbringen möchten. Jede Auswahl wird automatisch gespeichert und ist sofort in Phase 3 (Bewertung) wirksam. Inhaltsgleiche Kontrollen sind über framework-neutrale Kontroll-Knoten (same-as) verknüpft — eine Antwort wird automatisch auf alle Frameworks übertragen, die denselben Knoten teilen. Kein Framework ist Hub."
                  : "Select every framework you want to demonstrate compliance for. Each change is auto-saved and instantly effective in Phase 3 (Assessment). Equivalent controls are linked via framework-neutral control nodes (same-as) — an answer propagates automatically to every framework sharing the same node. No framework is a hub."}
              </p>
              {/* Cross-Framework-Übernahme: kompakter Button (nur wenn >1 Framework) */}
              <div className="pt-1"><FrameworkInheritanceButton /></div>
            </CardHeader>

            <CardContent>
              {(() => {
                const GROUPS: Record<string, { de: string; en: string; descDe: string; descEn: string; children: string[] }> = {
                  AI: {
                    de: "KI-Governance",
                    en: "AI Governance",
                    descDe: "Wählen Sie einen oder mehrere KI-Standards. Kombinieren Sie EU-Recht (AI Act) mit einem zertifizierbaren Management­system (ISO 42001) und/oder dem US-Framework (NIST AI RMF).",
                    descEn: "Pick one or more AI standards. Combine EU law (AI Act) with a certifiable management system (ISO 42001) and/or the US framework (NIST AI RMF).",
                    children: ["AIACT", "ISO42001", "NIST_AI_RMF"],
                  },
                  PRIVACY: {
                    de: "Datenschutz",
                    en: "Privacy",
                    descDe: "DSGVO ist EU-Recht. ISO/IEC 27701 ist der zertifizierbare Zusatz zu ISO 27001 für PII-Verantwortliche und Auftrags­verarbeiter.",
                    descEn: "GDPR is EU law. ISO/IEC 27701 is the certifiable ISO 27001 extension for PII controllers and processors.",
                    children: ["GDPR", "ISO27701"],
                  },
                  BCM: {
                    de: "Business Continuity",
                    en: "Business Continuity",
                    descDe: "ISO 22301 ist das international zertifizierbare BCMS. BSI 200-4 ist der deutsche Praxis­leitfaden für Notfall­management.",
                    descEn: "ISO 22301 is the internationally certifiable BCMS. BSI 200-4 is the German practical guide for emergency management.",
                    children: ["BCM22301", "BSI200_4"],
                  },
                };

                const groupedCodes = new Set(Object.values(GROUPS).flatMap(g => g.children));
                const soloFrameworks = frameworks.filter(fw => !groupedCodes.has(fw.code));
                const childMeta = (code: string) => frameworks.find(f => f.code === code);

                const toggleGroup = (groupKey: string) => {
                  const g = GROUPS[groupKey];
                  const anyOn = g.children.some(c => profile.enabled_frameworks.includes(c));
                  setProfile(p => {
                    const nextFrameworks = anyOn
                      ? p.enabled_frameworks.filter(c => !g.children.includes(c))
                      : [...p.enabled_frameworks, g.children[0]];
                    persistFrameworks(nextFrameworks, p.kritis_sub_sectors);
                    return { ...p, enabled_frameworks: nextFrameworks };
                  });
                };


                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {soloFrameworks.map(fw => {
                        const active = profile.enabled_frameworks.includes(fw.code);
                        return (
                          <label
                            key={fw.code}
                            className={[
                              "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                              active
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/50 hover:bg-muted/40",
                            ].join(" ")}
                          >
                            <Checkbox
                              checked={active}
                              onCheckedChange={() => toggleFramework(fw.code)}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold truncate">{de ? fw.name_de : fw.name_en}</div>
                              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                {fw.code}
                              </div>
                              {FRAMEWORK_DESC[fw.code] && (
                                <p className="text-[11px] leading-snug text-muted-foreground mt-1.5">
                                  {de ? FRAMEWORK_DESC[fw.code].de : FRAMEWORK_DESC[fw.code].en}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {/* Grouped multi-standard frameworks */}
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(GROUPS).map(([key, g]) => {
                        const activeChildren = g.children.filter(c => profile.enabled_frameworks.includes(c));
                        const groupActive = activeChildren.length > 0;
                        const invalid = groupActive && activeChildren.length === 0;
                        return (
                          <div
                            key={key}
                            className={[
                              "rounded-lg border p-3 transition-colors",
                              invalid
                                ? "border-destructive/50 bg-destructive/5"
                                : groupActive
                                  ? "border-accent bg-accent/5"
                                  : "border-border hover:border-accent/50",
                            ].join(" ")}
                          >
                            <label className="flex items-start gap-3 cursor-pointer">
                              <Checkbox
                                checked={groupActive}
                                onCheckedChange={() => toggleGroup(key)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold flex items-center gap-2">
                                  {de ? g.de : g.en}
                                  {groupActive && (
                                    <span className="text-[10px] font-normal text-accent uppercase tracking-wider">
                                      {activeChildren.length} {de ? "aktiv" : "active"}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] leading-snug text-muted-foreground mt-1">
                                  {de ? g.descDe : g.descEn}
                                </p>
                              </div>
                            </label>

                            {groupActive && (
                              <div className="mt-3 ml-7 space-y-2 border-l-2 border-accent/30 pl-3">
                                {g.children.map(code => {
                                  const meta = childMeta(code);
                                  if (!meta) return null;
                                  const on = profile.enabled_frameworks.includes(code);
                                  return (
                                    <label key={code} className="flex items-start gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={on}
                                        onCheckedChange={() => toggleFramework(code)}
                                        className="mt-0.5"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold">{de ? meta.name_de : meta.name_en}</div>
                                        {FRAMEWORK_DESC[code] && (
                                          <p className="text-[11px] leading-snug text-muted-foreground mt-0.5">
                                            {de ? FRAMEWORK_DESC[code].de : FRAMEWORK_DESC[code].en}
                                          </p>
                                        )}
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

                    {showKritis && (
                      <div className={[
                        "rounded-lg border p-3 space-y-2",
                        profile.kritis_sub_sectors.length === 0
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-accent/40 bg-accent/5",
                      ].join(" ")}>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          {de ? "KRITIS Sub-Sektoren" : "KRITIS sub-sectors"}
                          <span className="text-[10px] font-normal text-destructive uppercase tracking-wider">
                            {de ? "Pflicht" : "Required"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {de
                            ? "KRITIS alleine reicht nicht — bitte mindestens einen Sektor auswählen. Nur die aktivierten Sektoren steuern die B3S-Kontrollen in den Folgephasen."
                            : "KRITIS alone is not sufficient — please select at least one sector. Only activated sectors drive the B3S controls in later phases."}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {KRITIS_SECTORS.map(s => (
                            <label key={s.code} className="flex items-center gap-2 text-xs cursor-pointer">
                              <Checkbox
                                checked={profile.kritis_sub_sectors.includes(s.code)}
                                onCheckedChange={() => toggleKritis(s.code)}
                              />
                              <span>{de ? s.de : s.en}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vorab-Fragen zum Anwendungsbereich: nur für die Frameworks,
                        bei denen sie überhaupt etwas ändern. Wer „Nein" antwortet,
                        bekommt die betroffenen Kontrollen nicht gestellt; in der SoA
                        stehen sie als „nicht anwendbar" mit Begründung. */}
                    {scopeGateDefs.map(g => {
                      const answer = scopeGates[g.id];
                      const busy = gateSaving === g.id;
                      return (
                        <div
                          key={g.id}
                          className={[
                            "rounded-lg border p-3 space-y-2",
                            answer ? "border-accent/40 bg-accent/5" : "border-border bg-muted/30",
                          ].join(" ")}
                        >
                          <div className="text-sm font-semibold">
                            {de ? "Anwendungsbereich – Vorabfrage" : "Scope – preliminary question"}
                          </div>
                          <p className="text-xs">{de ? g.questionDe : g.questionEn}</p>
                          <p className="text-[11px] text-muted-foreground">{de ? g.hintDe : g.hintEn}</p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(["yes", "no", "unknown"] as GateAnswer[]).map(v => (
                              <Button
                                key={v}
                                type="button"
                                size="sm"
                                disabled={busy}
                                variant={answer === v ? "default" : "outline"}
                                onClick={() => setScopeGate(g.id, v)}
                              >
                                {busy && answer === v && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                                {v === "yes" ? (de ? "Ja" : "Yes")
                                  : v === "no" ? (de ? "Nein" : "No")
                                  : (de ? "Unklar" : "Unclear")}
                              </Button>
                            ))}
                          </div>
                          {answer === "no" && (
                            <p className="text-[11px] text-muted-foreground">
                              {de
                                ? `${g.controlIds.length} Kontrollen dieser Gruppe werden nicht gefragt und in der SoA als „nicht anwendbar" geführt.`
                                : `${g.controlIds.length} controls in this group are not asked and appear as “not applicable” in the SoA.`}
                            </p>
                          )}
                          {answer === "unknown" && (
                            <p className="text-[11px] text-destructive">
                              {de
                                ? "Bitte vor der Bewertung klären — solange bleiben die Kontrollen offen."
                                : "Please clarify before the assessment — until then the controls stay open."}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>


        {/* ─────────── Tab 3: People ─────────── */}
        <TabsContent value="people" className="space-y-4 mt-4">
          <PersonnelManager />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end sticky bottom-4">
        <Button onClick={saveProfile} disabled={saving} size="lg" className="gap-2 shadow-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {de ? "Profil speichern" : "Save profile"}
        </Button>
      </div>
    </div>
  );
};

export default Scope;
