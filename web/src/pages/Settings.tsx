import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Shield, Save, Loader2, Trash2, AlertTriangle, Database, Bell, Crown, CheckCircle2, Users, Download, Clock, SlidersHorizontal } from "lucide-react";
import { getTierName, getTierBadgeClass, getFeaturesByTier } from "@/lib/tierConfig";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";
import MFASettings from "@/components/MFASettings";
import TeamManagement from "@/components/TeamManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoldIcon from "@/components/GoldIcon";
import DemoDataLoader from "@/components/DemoDataLoader";
import { useEngineConfig } from "@/hooks/useEngineConfig";

const ALL_LOCAL_KEYS = [
  "cws-data",
  "cws-data-comments",
  "cws-sector-data",
  "cws-step-data",
];

const SegmentDeleteRow = ({ label, description, onDelete, de }: { label: string; description: string; onDelete: () => Promise<void>; de: boolean }) => {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    await onDelete();
    setLoading(false);
    setConfirming(false);
  };

  return (
    <div className="flex items-center justify-between py-3 gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            {de ? "Abbrechen" : "Cancel"}
          </button>
        )}
        <button
          onClick={handleClick}
          disabled={loading}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
            confirming
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
          }`}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          {confirming ? (de ? "Bestätigen" : "Confirm") : (de ? "Löschen" : "Delete")}
        </button>
      </div>
    </div>
  );
};

const Settings = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user, tenantId, isPro, isPremium, isXl, isAdmin, isLecturer } = useAuth();
  // V-5: Alles löschen darf nur, wem der Mandant gehört (Org-Owner bzw.
  // Einzelnutzer) — der Server (wipe_tenant_data) prüft dasselbe.
  const isTenantOwner = !!user && (tenantId ?? user.id) === user.id;
  const de = lang === "de";
  const activeFeatureTier = isXl || isAdmin ? "xl" : isLecturer || isPremium ? "enterprise" : isPro ? "core" : "free";
  const { config: engineConfig, setResidualModel, setGapContext, loading: engineLoading } = useEngineConfig();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [marketingCategories, setMarketingCategories] = useState<string[]>([]);
  const [savingMarketing, setSavingMarketing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const url = `${import.meta.env.VITE_CY_API_URL || ''}/functions/export-user-data`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `uniqsuite-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success(de ? "Export heruntergeladen" : "Export downloaded");
    } catch (e: any) {
      toast.error(e.message ?? (de ? "Export fehlgeschlagen" : "Export failed"));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setEmail(user.email || "");
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name, email, marketing_consent, marketing_consent_categories")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setDisplayName(data.display_name || "");
      setMarketingConsent(data.marketing_consent || false);
      setMarketingCategories((data.marketing_consent_categories as string[]) || []);
    }
    setLoadingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(de ? "Profil gespeichert" : "Profile saved");
    }
    setSaving(false);
  };

  const handleDeleteAllData = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    // Step 2: actually delete EVERYTHING for this tenant via the server-side
    // wipe RPC — exhaustive, atomic, and impossible to silently miss tables.
    setDeleting(true);
    ALL_LOCAL_KEYS.forEach(k => localStorage.removeItem(k));
    if (user) {
      try {
        const { clearAllTenantData } = await import("@/lib/tenantWipe");
        const counts = await clearAllTenantData();
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        toast.success(
          de
            ? `Alle Daten wurden gelöscht (${total} Datensätze über ${Object.keys(counts).length} Tabellen)`
            : `All data has been deleted (${total} records across ${Object.keys(counts).length} tables)`,
        );
      } catch (e: any) {
        toast.error((de ? "Fehler beim Löschen: " : "Delete failed: ") + (e?.message ?? "unknown"));
        setDeleting(false);
        return;
      }
    }
    setDeleting(false);
    setDeleteStep(0);
    window.location.reload();
  };


  if (!user) return null;

  return (
    <div className="min-h-screen bg-background font-body">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {de ? "Zurück" : "Back"}
        </button>

        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            {de ? "Mein Konto" : "My Account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {de ? "Profil und Sicherheitseinstellungen verwalten" : "Manage profile and security settings"}
          </p>
        </div>

        <DemoDataLoader />

        <button
          onClick={() => navigate("/settings/integrations")}
          className="w-full text-left rounded-lg border bg-card p-4 hover:border-accent transition-colors flex items-center justify-between"
        >
          <div>
            <div className="font-medium text-sm">{de ? "Integrationen (ServiceNow, Intune, REST)" : "Integrations (ServiceNow, Intune, REST)"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {de ? "Externe CMDBs & Device-Management-Systeme anbinden" : "Connect external CMDBs & device management systems"}
            </div>
          </div>
          <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
        </button>



        <Tabs defaultValue={new URLSearchParams(window.location.search).get("tab") || "profile"} className="w-full">
          <TabsList className="w-full grid grid-cols-7">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{de ? "Profil" : "Profile"}</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{de ? "Team" : "Team"}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{de ? "Meldungen" : "Alerts"}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">{de ? "Sicherheit" : "Security"}</span>
            </TabsTrigger>
            <TabsTrigger value="versions" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">{de ? "Versionen" : "Versions"}</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">{de ? "Daten" : "Data"}</span>
            </TabsTrigger>
            <TabsTrigger value="engines" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">{de ? "Engines" : "Engines"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {de ? "Persönliche Informationen" : "Personal Information"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {de ? "Ihre Kontodaten bearbeiten" : "Edit your account details"}
                  </p>
                </div>
              </div>

              {loadingProfile ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-muted rounded-lg" />
                  <div className="h-10 bg-muted rounded-lg" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">{de ? "Anzeigename" : "Display Name"}</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={de ? "Ihr Name" : "Your name"}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">
                      {de ? "E-Mail kann nicht geändert werden" : "Email cannot be changed"}
                    </p>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full eu-gradient text-primary-foreground py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {de ? "Speichern" : "Save"}
                  </button>
                </>
              )}
            </div>

            {/* Plan Card */}
            <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  {isLecturer || isPremium ? <Crown className="h-6 w-6 text-secondary-readable" /> : <Shield className="h-6 w-6 text-primary" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {de ? "Ihr Plan" : "Your Plan"}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getTierBadgeClass(isPro, isLecturer || isPremium, isXl || isAdmin)}`}>
                    {isLecturer || isPremium ? <Crown className="h-3 w-3" /> : isPro ? <Shield className="h-3 w-3" /> : null}
                    {getTierName(isPro, isPremium, isAdmin, de, isXl, isLecturer)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {getFeaturesByTier(activeFeatureTier).map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isLecturer || isPremium
                      ? <GoldIcon icon={CheckCircle2} size={14} className="flex-shrink-0" />
                      : <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
                    {de ? f.labelDe : f.labelEn}
                  </div>
                ))}
              </div>

              {!isPro && (
                <a
                  href="mailto:info@cyberwerksuite.com?subject=Upgrade%20auf%20Core"
                  className="block text-center w-full eu-gradient text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {de ? "Upgrade auf Core" : "Upgrade to Core"}
                </a>
              )}
              {isPro && !isPremium && !isLecturer && (
                <a
                  href="mailto:info@cyberwerksuite.com?subject=Enterprise%20Anfrage"
                  className="block text-center w-full gold-gradient text-accent-foreground py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {de ? "Enterprise anfragen" : "Request Enterprise"}
                </a>
              )}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4 mt-4">
            <TeamManagement />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">Notifications will be rebuilt.</div>

            <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {de ? "Marketing-Benachrichtigungen" : "Marketing Notifications"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {de ? "Wählen Sie, worüber Sie informiert werden möchten" : "Choose what you'd like to be notified about"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: "newsletter", labelDe: "Newsletter & neue Artikel", labelEn: "Newsletter & new articles", descDe: "Erhalten Sie Updates zu neuen Blog-Artikeln", descEn: "Get updates about new blog articles" },
                  { key: "products", labelDe: "Produkte & Tools", labelEn: "Products & tools", descDe: "Informationen über neue Features und Produkte", descEn: "Information about new features and products" },
                  { key: "training", labelDe: "Schulungen & Bootcamps", labelEn: "Training & bootcamps", descDe: "Einladungen zu Schulungen und Bootcamps", descEn: "Invitations to training and bootcamps" },
                ].map((cat) => (
                  <label key={cat.key} className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={marketingCategories.includes(cat.key)}
                      onChange={(e) => {
                        setMarketingCategories(prev =>
                          e.target.checked ? [...prev, cat.key] : prev.filter(k => k !== cat.key)
                        );
                        setMarketingConsent(e.target.checked ? true : marketingCategories.filter(k => k !== cat.key).length > 0);
                      }}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                    <div>
                      <span className="text-sm font-semibold text-foreground">{de ? cat.labelDe : cat.labelEn}</span>
                      <p className="text-xs text-muted-foreground">{de ? cat.descDe : cat.descEn}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={async () => {
                  if (!user) return;
                  setSavingMarketing(true);
                  const hasAny = marketingCategories.length > 0;
                  await supabase.from("profiles").update({
                    marketing_consent: hasAny,
                    marketing_consent_date: new Date().toISOString(),
                    marketing_consent_categories: marketingCategories,
                  }).eq("user_id", user.id);
                  setSavingMarketing(false);
                  toast.success(de ? "Einstellungen gespeichert" : "Settings saved");
                }}
                disabled={savingMarketing}
                className="w-full eu-gradient text-primary-foreground py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {savingMarketing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {de ? "Speichern" : "Save"}
              </button>

              <p className="text-[10px] text-muted-foreground text-center">
                {de
                  ? "Gemäß DSGVO können Sie Ihre Einwilligung jederzeit widerrufen."
                  : "In accordance with GDPR, you can withdraw your consent at any time."}
              </p>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4 mt-4">
            <MFASettings />
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">Snapshots will be rebuilt.</div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data" className="space-y-4 mt-4">
            {/* GDPR Art. 20 — Data portability */}
            <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {de ? "Alle Daten herunterladen" : "Download All Data"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {de
                      ? "DSGVO Art. 20 — Recht auf Datenübertragbarkeit. Alle Organisationsdaten als JSON."
                      : "GDPR Art. 20 — Right to data portability. All organisation data as JSON."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                disabled={exporting}
                className="w-full eu-gradient text-primary-foreground py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting
                  ? (de ? "Wird vorbereitet..." : "Preparing...")
                  : (de ? "Export als JSON herunterladen" : "Download export as JSON")}
              </button>
              <p className="text-[10px] text-muted-foreground text-center">
                {de
                  ? "Enthält Profile, Unternehmen, Services, Assets, Abhängigkeiten, Bewertungen, Audits, Findings, KVP-Maßnahmen und Tool-Daten."
                  : "Includes profiles, company, services, assets, dependencies, assessments, audits, findings, improvements and tool data."}
              </p>
            </div>

            {/* Individual segment deletion */}
            <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Database className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {de ? "Einzelne Bereiche zurücksetzen" : "Reset Individual Sections"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {de ? "Daten einzelner Bereiche gezielt löschen" : "Delete data from specific sections"}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border">
                {[
                  {
                    labelDe: "Konformitätscheck",
                    labelEn: "Compliance Check",
                    descDe: "Alle Kontrollantworten und Kommentare",
                    descEn: "All control answers and comments",
                    keys: ["cws-data", "cws-data-comments"],
                    toolKey: "compliance-check",
                  },
                  {
                    labelDe: "Umsetzungsleitfaden",
                    labelEn: "Implementation Guide",
                    descDe: "Sektorspezifische und Schritt-Bewertungen",
                    descEn: "Sector-specific and step assessments",
                    keys: ["cws-sector-data", "cws-step-data"],
                    toolKey: "implementation-guide",
                  },
                ].map((segment) => (
                  <SegmentDeleteRow
                    key={segment.toolKey}
                    label={de ? segment.labelDe : segment.labelEn}
                    description={de ? segment.descDe : segment.descEn}
                    onDelete={async () => {
                      segment.keys.forEach((k) => localStorage.removeItem(k));
                      if (user) {
                        await supabase
                          .from("user_tool_data")
                          .delete()
                          .eq("user_id", tenantId ?? user.id)

                          .eq("tool_key", segment.toolKey);
                      }
                      toast.success(de ? `${segment.labelDe} zurückgesetzt` : `${segment.labelEn} reset`);
                    }}
                    de={de}
                  />
                ))}
              </div>
            </div>

            {/* Delete all */}
            <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {de ? "Alle Daten zurücksetzen" : "Reset All Data"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {de ? "Alle gespeicherten Bewertungsdaten unwiderruflich löschen" : "Permanently delete all saved assessment data"}
                  </p>
                </div>
              </div>

              {!isTenantOwner ? (
                <p className="text-sm text-muted-foreground">
                  {de
                    ? "Alle Daten der Organisation kann nur die Inhaberin bzw. der Inhaber zurücksetzen."
                    : "Only the organisation's owner can reset all of its data."}
                </p>
              ) : deleteStep === 0 ? (
                <button
                  onClick={handleDeleteAllData}
                  className="w-full bg-destructive/10 text-destructive py-3 rounded-lg text-sm font-bold hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {de ? "Alle Daten zurücksetzen" : "Reset All Data"}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm font-bold text-destructive mb-1">
                      {de ? "Sind Sie wirklich sicher?" : "Are you really sure?"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {de
                        ? "Diese Aktion kann nicht rückgängig gemacht werden."
                        : "This action cannot be undone."}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteStep(0)}
                      className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg text-sm font-semibold hover:bg-muted/80 transition-colors"
                    >
                      {de ? "Abbrechen" : "Cancel"}
                    </button>
                    <button
                      onClick={handleDeleteAllData}
                      disabled={deleting}
                      className="flex-1 bg-destructive text-destructive-foreground py-3 rounded-lg text-sm font-bold hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {de ? "Endgültig löschen" : "Delete permanently"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Engines Tab — marktreife Risiko-Engines (Beta, org-weit) */}
          <TabsContent value="engines" className="space-y-4 mt-4">
            <div className="bg-card rounded-2xl border border-border card-elevated p-6 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <SlidersHorizontal className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {de ? "Engine-Einstellungen" : "Engine settings"}
                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded st-teilweise-tint st-teilweise-text">Beta</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {de
                      ? "Organisationsweit. Standard = bisheriges Verhalten. Änderungen wirken sofort auf Risiko- & Gap-Analyse."
                      : "Organization-wide. Default = current behavior. Changes affect risk & gap analysis immediately."}
                  </p>
                </div>
              </div>

              {engineLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 bg-muted rounded-xl" />
                  <div className="h-16 bg-muted rounded-xl" />
                </div>
              ) : (
                <>
                  {/* E2 — Residual-Risiko-Modell */}
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {de ? "Residual-Risiko-Modell" : "Residual-risk model"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {de
                          ? "Multiplikativ berücksichtigt die Wirksamkeit umgesetzter Kontrollen (Control-Effectiveness) je Capability, statt nur Abzüge zu addieren."
                          : "Multiplicative accounts for the effectiveness of implemented controls per capability instead of only subtracting deductions."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setResidualModel("legacy")}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                          engineConfig.residual_model === "legacy"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        {de ? "Legacy (Standard)" : "Legacy (default)"}
                      </button>
                      <button
                        onClick={() => setResidualModel("multiplicative")}
                        className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                          engineConfig.residual_model === "multiplicative"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                        }`}
                      >
                        {de ? "Multiplikativ (E2)" : "Multiplicative (E2)"}
                      </button>
                    </div>
                  </div>

                  {/* E5 — Kontext-/Risiko-Gewichtung der Gap-Severity */}
                  <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border p-4 hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={engineConfig.gap_context}
                      onChange={(e) => setGapContext(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                    />
                    <div>
                      <span className="text-sm font-semibold text-foreground">
                        {de ? "Kontextbasierte Gap-Severity (E5)" : "Context-based gap severity (E5)"}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {de
                          ? "Gewichtet Lücken nach Asset-Kritikalität, Single-Point-of-Failure und Bedrohungslage statt fester 2×2-Tabelle. Aus = bisheriges Verhalten."
                          : "Weights gaps by asset criticality, single-point-of-failure and threat level instead of a fixed 2×2 table. Off = current behavior."}
                      </p>
                    </div>
                  </label>

                  <p className="text-[10px] text-muted-foreground">
                    {de
                      ? "Hinweis: Beide Optionen sind additiv und verändern keine gespeicherten Antworten — nur die Auswertung. Zurückschalten stellt das Standardverhalten wieder her."
                      : "Note: both options are additive and do not alter stored answers — only the analysis. Switching back restores default behavior."}
                  </p>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
