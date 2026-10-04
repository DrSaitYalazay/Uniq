/**
 * SetupWizard — UniqSuite-Ersteinrichtung in drei Fragen:
 *   1. Firma & Branche   2. Paket (Frameworks)   3. Mitarbeiterzahl
 * Schreibt company_profiles (wie Phase 01 „Scope & Kontext") und meldet die
 * Framework-Auswahl über den frameworkBus an alle offenen Seiten. Alles Weitere
 * (Logo, Umsatz, Personen, KRITIS …) bleibt in Phase 01 bearbeitbar.
 *
 * SetupGate zeigt den Assistenten statt der Kinder, solange für den Mandanten
 * noch kein Profil mit mindestens einem Framework existiert.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { emitFrameworksUpdated } from "@/lib/frameworkBus";
import { setCompanyBrand } from "@/lib/companyBrand";
import { visibleFrameworkCodes } from "@/config/uniqFeatures";
import ShieldLogo from "@/components/ShieldLogo";

const SECTORS: { de: string; en: string }[] = [
  { de: "Energie", en: "Energy" },
  { de: "Gesundheit", en: "Health" },
  { de: "Verkehr & Logistik", en: "Transport & logistics" },
  { de: "Digitale Infrastruktur & IT-Dienste", en: "Digital infrastructure & IT services" },
  { de: "Finanzwesen & Versicherung", en: "Finance & insurance" },
  { de: "Öffentliche Verwaltung", en: "Public administration" },
  { de: "Wasser & Abwasser", en: "Water & wastewater" },
  { de: "Produktion & Industrie", en: "Manufacturing & industry" },
  { de: "Lebensmittel", en: "Food" },
  { de: "Chemie", en: "Chemicals" },
  { de: "Handel & Dienstleistung", en: "Retail & services" },
  { de: "Sonstige", en: "Other" },
];

type Base = "NIS2" | "ISO27001" | "BOTH";
const BASES: { id: Base; de: string; en: string; descDe: string; descEn: string }[] = [
  { id: "NIS2", de: "NIS2", en: "NIS2", descDe: "Gesetzliche Pflicht für wichtige und besonders wichtige Einrichtungen.", descEn: "Legal duty for important and essential entities." },
  { id: "ISO27001", de: "ISO 27001", en: "ISO 27001", descDe: "Zertifizierbares Informationssicherheits-Managementsystem.", descEn: "Certifiable information security management system." },
  { id: "BOTH", de: "NIS2 + ISO 27001", en: "NIS2 + ISO 27001", descDe: "Beides zusammen — gleiche Anforderungen werden nur einmal bewertet.", descEn: "Both together — identical requirements are assessed once." },
];
const ADDONS: { code: string; de: string; en: string }[] = [
  { code: "AIACT", de: "EU AI Act", en: "EU AI Act" },
  { code: "ISO42001", de: "ISO 42001 (KI-Managementsystem)", en: "ISO 42001 (AI management system)" },
  { code: "CRA", de: "Cyber Resilience Act (Produkte mit digitalen Elementen)", en: "Cyber Resilience Act (products with digital elements)" },
];

const sizeOf = (n: number) => n < 10 ? "micro" : n < 50 ? "small" : n < 250 ? "medium" : n < 1000 ? "large" : "enterprise";

export function SetupGate({ de, children }: { de: boolean; children: ReactNode }) {
  const { user, getTenantId } = useAuth();
  const [state, setState] = useState<"loading" | "needed" | "done">("loading");
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const tenantId = (await getTenantId()) || user.id;
      const { data } = await supabase
        .from("company_profiles")
        .select("id, enabled_frameworks")
        .eq("user_id", tenantId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setProfileId((data as any)?.id ?? null);
      const fws = visibleFrameworkCodes(((data as any)?.enabled_frameworks ?? []) as string[]);
      setState(fws.length > 0 ? "done" : "needed");
    })();
    return () => { cancelled = true; };
  }, [user, getTenantId]);

  // Während des Ladens den normalen Inhalt zeigen — kein Flackern für eingerichtete Mandanten.
  if (state !== "needed") return <>{children}</>;
  return <SetupWizard de={de} profileId={profileId} onDone={() => setState("done")} />;
}

function SetupWizard({ de, profileId, onDone }: { de: boolean; profileId: string | null; onDone: () => void }) {
  const { user, getTenantId } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("");
  const [base, setBase] = useState<Base | null>(null);
  const [addons, setAddons] = useState<string[]>([]);
  const [employees, setEmployees] = useState("");
  const [saving, setSaving] = useState(false);

  const n = Number(employees);
  const canNext = step === 0 ? company.trim().length >= 2 && !!sector
    : step === 1 ? !!base
    : Number.isFinite(n) && n > 0;

  const save = async () => {
    if (!user || !base) return;
    setSaving(true);
    const tenantId = (await getTenantId()) || user.id;
    const frameworks = [...(base === "BOTH" ? ["NIS2", "ISO27001"] : [base]), ...addons];
    const payload = {
      user_id: tenantId,
      company_name: company.trim(),
      sector,
      company_size: sizeOf(n),
      employee_count: Math.round(n),
      enabled_frameworks: frameworks,
      kritis_sub_sectors: [] as string[],
    };
    const { error } = profileId
      ? await supabase.from("company_profiles").update(payload).eq("id", profileId)
      : await supabase.from("company_profiles").insert({ ...payload, country: "EU" });
    setSaving(false);
    if (error) {
      toast.error(de ? "Speichern fehlgeschlagen — bitte erneut versuchen." : "Saving failed — please try again.");
      return;
    }
    setCompanyBrand({ companyName: company.trim() });
    emitFrameworksUpdated({ enabled_frameworks: frameworks, kritis_sub_sectors: [] });
    toast.success(de ? "Eingerichtet — jetzt die Anforderungen bewerten." : "Set up — now assess the requirements.");
    onDone();
    navigate(`/assessment?fw=${encodeURIComponent(frameworks[0])}`);
  };

  const steps = de ? ["Firma", "Paket", "Größe"] : ["Company", "Package", "Size"];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldLogo size={40} />
          <div>
            <h1 className="text-xl font-bold text-foreground">{de ? "Willkommen bei UniqSuite" : "Welcome to UniqSuite"}</h1>
            <p className="text-sm text-muted-foreground">{de ? "Drei Fragen, dann geht es los." : "Three questions, then you're ready."}</p>
          </div>
        </div>

        <ol className="flex items-center gap-2 text-xs" aria-label={de ? "Fortschritt" : "Progress"}>
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2 flex-1">
              <span className={`size-6 shrink-0 rounded-full grid place-items-center font-semibold ${
                i < step ? "bg-accent text-accent-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={i === step ? "font-semibold text-foreground" : "text-muted-foreground"}>{label}</span>
              {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">{de ? "Wie heißt Ihre Organisation?" : "What is your organisation called?"}</span>
              <input value={company} onChange={e => setCompany(e.target.value)} autoFocus
                className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm" placeholder={de ? "z. B. Stadtwerke Musterstadt" : "e.g. Example Utilities Ltd"} />
            </label>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{de ? "In welcher Branche sind Sie tätig?" : "Which sector are you in?"}</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTORS.map(s => {
                  const v = de ? s.de : s.en;
                  const on = sector === v;
                  return (
                    <button key={s.de} type="button" onClick={() => setSector(v)} aria-pressed={on}
                      className={`min-h-11 rounded-lg border px-3 py-2 text-sm text-left transition-colors ${on ? "border-accent bg-accent/10 text-foreground font-semibold" : "border-border hover:bg-muted/60"}`}>
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{de ? "Was wollen Sie nachweisen?" : "What do you need to demonstrate?"}</span>
              <div className="grid gap-2">
                {BASES.map(b => {
                  const on = base === b.id;
                  return (
                    <button key={b.id} type="button" onClick={() => setBase(b.id)} aria-pressed={on}
                      className={`rounded-lg border px-4 py-3 text-left transition-colors ${on ? "border-accent bg-accent/10" : "border-border hover:bg-muted/60"}`}>
                      <div className="text-sm font-semibold text-foreground">{de ? b.de : b.en}</div>
                      <div className="text-xs text-muted-foreground">{de ? b.descDe : b.descEn}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-foreground">{de ? "Zusätzlich (optional)" : "In addition (optional)"}</span>
              <div className="grid gap-1.5">
                {ADDONS.map(a => {
                  const on = addons.includes(a.code);
                  return (
                    <label key={a.code} className="flex items-center gap-2.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={on} className="size-4 accent-[hsl(var(--accent))]"
                        onChange={() => setAddons(x => on ? x.filter(c => c !== a.code) : [...x, a.code])} />
                      {de ? a.de : a.en}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-foreground">{de ? "Wie viele Mitarbeitende hat Ihre Organisation?" : "How many employees does your organisation have?"}</span>
            <input type="number" min={1} inputMode="numeric" value={employees} onChange={e => setEmployees(e.target.value)} autoFocus
              className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm" placeholder={de ? "z. B. 120" : "e.g. 120"} />
            <span className="block text-xs text-muted-foreground">
              {de ? "Bestimmt die Größenklasse. Logo, Umsatz und Personen ergänzen Sie später unter „Scope & Kontext“."
                  : "Sets the size class. Logo, revenue and people can be added later under “Scope & Context”."}
            </span>
          </label>
        )}

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="h-10 px-3 rounded-lg border border-border text-sm inline-flex items-center gap-1 disabled:opacity-0">
            <ChevronLeft className="size-4" />{de ? "Zurück" : "Back"}
          </button>
          {step < 2 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext}
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-40">
              {de ? "Weiter" : "Next"}<ChevronRight className="size-4" />
            </button>
          ) : (
            <button type="button" onClick={save} disabled={!canNext || saving}
              className="h-10 px-4 rounded-lg copper-button text-primary-foreground text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40">
              {saving && <Loader2 className="size-4 animate-spin" />}{de ? "Fertig — loslegen" : "Done — let's start"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
