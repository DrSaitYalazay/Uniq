/**
 * FrameworkInheritanceButton — kompakter Button + Popover für die
 * Cross-Framework-Antwortübernahme. Ersetzt den früheren Vollbreiten-Banner
 * oben auf jeder Seite. Wird NUR in Phase 1 (Scope → Tab Frameworks) angezeigt.
 *
 * Szenario (warum es das gibt): Wer z. B. ISO 27001 nutzt und SPÄTER ein
 * weiteres Framework hinzufügt (NIS2/DORA…), muss die inhaltlich gleichen
 * Kontrollen nicht erneut beantworten — die vorhandenen Antworten werden über
 * das ISO-27001-Mapping in das neue Framework übernommen. Man beantwortet nur
 * noch die Unterschiede (Deltas). Standard: AUS (nichts wird automatisch übernommen).
 */
import { useEffect, useState } from "react";
import { Layers, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFrameworkInheritance } from "@/hooks/useFrameworkInheritance";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { visibleFrameworkCodes } from "@/config/uniqFeatures";


export default function FrameworkInheritanceButton() {
  const { user, tenantId } = useAuth();
  const { lang } = useLanguage();
  const de = lang === "de";
  const { mode, appliedAt, isActive, isApplied, setMode, apply, reset } = useFrameworkInheritance();
  const [enabledFrameworks, setEnabledFrameworks] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("company_profiles").select("enabled_frameworks")
        .eq("user_id", tenantId ?? user.id)
        .order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (cancelled) return;
      setEnabledFrameworks(visibleFrameworkCodes(((data?.enabled_frameworks ?? []) as string[]).filter(Boolean)));
    })();
    return () => { cancelled = true; };
  }, [user, tenantId]);

  // Cross-Framework-Übernahme ergibt nur Sinn, wenn mindestens zwei Frameworks
  // aktiv sind — framework-neutral, kein Hub vorausgesetzt.
  if (enabledFrameworks.length < 2) return null;

  const statusLabel = isApplied ? (de ? "Übernommen" : "Applied") : mode === "preview" ? (de ? "Vorschau" : "Preview") : (de ? "Aus" : "Off");
  const statusColor = isApplied ? "st-ja-tint st-ja-text st-ja-border"
    : mode === "preview" ? "st-teilweise-tint st-teilweise-text st-teilweise-border"
    : "bg-muted text-muted-foreground border-border";
  const appliedDate = appliedAt ? new Date(appliedAt).toLocaleDateString(de ? "de-DE" : "en-GB") : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8">
          <Layers size={14} className="text-primary" />
          {de ? "Framework-Übernahme" : "Framework inheritance"}
          <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
            {statusLabel}{isApplied && appliedDate ? ` · ${appliedDate}` : ""}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-96 text-xs leading-relaxed space-y-2">
        <p className="font-semibold text-sm">{de ? "Wozu dient das?" : "What is this for?"}</p>
        <p>
          {de
            ? "Wenn Sie zu einem bestehenden Framework (z. B. ISO 27001) SPÄTER ein weiteres hinzufügen (z. B. NIS2, weil Sie neu darunter fallen oder das Modul dazukaufen), füllt diese Funktion die inhaltlich gleichen Kontrollen im neuen Framework automatisch mit Ihren bereits gegebenen Antworten. Sie beantworten dann nur noch die Unterschiede (Deltas)."
            : "If you ADD another framework later (e.g. NIS2) to an existing one (e.g. ISO 27001) — because you newly fall under it or purchase the module — this feature auto-fills the equivalent controls in the new framework with your existing answers. You then only answer the differences (deltas)."}
        </p>
        <p className="text-muted-foreground">
          {de ? "Die Übernahme läuft framework-neutral über die Kontroll-Knoten (same-as): inhaltsgleiche Kontrollen teilen sich einen Knoten, KEIN Framework ist Hub. Aggregation: der strengste Status je Knoten gewinnt (Weakest-Link, nein < teilweise < ja); geerbtes 'ja' über nur teilweise überdeckende Beziehungen wird auf 'teilweise' gedeckelt."
              : "Inheritance runs framework-neutrally over the control nodes (same-as): equivalent controls share a node, NO framework is a hub. Aggregation: the strictest status per node wins (weakest-link, no < partial < yes); an inherited 'yes' via an only-partially-covering relation is capped to 'partial'."}
        </p>
        <div className="rounded-md bg-muted/50 p-2 text-muted-foreground">
          <strong>{de ? "Aus:" : "Off:"}</strong> {de ? "nur direkt beantwortete Kontrollen." : "only directly answered controls."}<br />
          <strong>{de ? "Vorschau:" : "Preview:"}</strong> {de ? "Übernahme wird gezeigt, nicht gespeichert." : "inheritance shown, not saved."}<br />
          <strong>{de ? "Übernommen:" : "Applied:"}</strong> {de ? "dauerhaft aktiv, mit Zeitstempel." : "kept permanently, with timestamp."}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border">
          <span className="flex items-center gap-2">
            <span>{de ? "Andere Frameworks einbeziehen" : "Include other frameworks"}</span>
            <Switch checked={isActive} onCheckedChange={v => setMode(v ? "preview" : "off")} aria-label={de ? "Übernahme umschalten" : "Toggle inheritance"} />
          </span>
          <div className="flex items-center gap-1.5">
            {mode === "preview" && (
              <Button size="sm" variant="default" onClick={apply} className="h-7 text-xs gap-1"><Check size={13} />{de ? "Übernehmen" : "Apply"}</Button>
            )}
            {isApplied && (
              <Button size="sm" variant="outline" onClick={reset} className="h-7 text-xs gap-1"><X size={13} />{de ? "Zurücksetzen" : "Reset"}</Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {de ? `Aktive Frameworks: ${enabledFrameworks.join(", ") || "keine"} · Verknüpfung: Kontroll-Knoten (same-as)` : `Active: ${enabledFrameworks.join(", ") || "none"} · Linking: control nodes (same-as)`}
        </p>
      </PopoverContent>
    </Popover>
  );
}
