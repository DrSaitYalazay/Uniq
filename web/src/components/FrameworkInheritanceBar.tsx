import { useEffect, useState } from "react";
import { Layers, Check, X, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFrameworkInheritance } from "@/hooks/useFrameworkInheritance";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Global banner: cross-framework answer inheritance.
 *
 * Rendered once in AppLayout, above every pipeline page. Only visible when
 * the user has more than one framework enabled — otherwise inheritance has
 * no meaning and the bar stays hidden.
 */

const FrameworkInheritanceBar = () => {
  const { user, tenantId } = useAuth();
  const { lang } = useLanguage();
  const de = lang === "de";
  const { mode, appliedAt, isActive, isApplied, setMode, apply, reset } =
    useFrameworkInheritance();

  const [enabledFrameworks, setEnabledFrameworks] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("company_profiles")
        .select("enabled_frameworks")
        .eq("user_id", tenantId ?? user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setEnabledFrameworks(((data?.enabled_frameworks ?? []) as string[]).filter(Boolean));
    })();
    return () => { cancelled = true; };
  }, [user, tenantId]);

  // Framework-neutral: Übernahme über Kontroll-Knoten (same-as), kein Hub.
  // Nur zeigen, wenn mindestens zwei Frameworks aktiv sind (sonst nichts zu erben).
  if (enabledFrameworks.length < 2) return null;

  const statusLabel = isApplied
    ? de ? "Übernommen" : "Applied"
    : mode === "preview"
      ? de ? "Vorschau" : "Preview"
      : de ? "Aus" : "Off";

  const statusColor = isApplied
    ? "st-ja-tint st-ja-text st-ja-border"
    : mode === "preview"
      ? "st-teilweise-tint st-teilweise-text st-teilweise-border"
      : "bg-muted text-muted-foreground border-border";

  const appliedDate = appliedAt ? new Date(appliedAt).toLocaleDateString(de ? "de-DE" : "en-GB") : null;

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Layers size={16} className="text-primary shrink-0" />
          <span className="font-medium">
            {de ? "Framework-Übernahme" : "Framework inheritance"}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={de ? "Info" : "Info"}
                className="text-muted-foreground hover:text-foreground"
              >
                <Info size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="w-80 text-xs leading-relaxed">
              {de ? (
                <>
                  <p className="font-semibold mb-1">Wie funktioniert das?</p>
                  <p className="mb-2">
                    Kontrollen sind über framework-neutrale Kontroll-Knoten (same-as)
                    verknüpft — KEIN Framework ist Hub. Eine Antwort in einem Framework
                    wird in inhaltsgleiche Kontrollen anderer Frameworks (z. B. NIS2, DORA)
                    übernommen, die denselben Knoten teilen.
                  </p>
                  <p className="mb-2">
                    <strong>Aus:</strong> nur direkt beantwortete Kontrollen zählen.<br />
                    <strong>Vorschau:</strong> Übernahme wird angezeigt, aber nicht gespeichert.<br />
                    <strong>Übernommen:</strong> Auswahl dauerhaft aktiv, mit Zeitstempel.
                  </p>
                  <p className="text-muted-foreground">
                    Aggregation: <strong>„schlechtester Wert gewinnt"</strong> (nein &gt; teilweise &gt; ja).
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">How does this work?</p>
                  <p className="mb-2">
                    Controls are linked via framework-neutral control nodes (same-as) —
                    NO framework is a hub. An answer in one framework is inherited into
                    equivalent controls of other frameworks (e.g. NIS2, DORA) that share
                    the same node.
                  </p>
                  <p className="mb-2">
                    <strong>Off:</strong> only directly answered controls count.<br />
                    <strong>Preview:</strong> inheritance shown, not persisted.<br />
                    <strong>Applied:</strong> selection is kept with a timestamp.
                  </p>
                  <p className="text-muted-foreground">
                    Aggregation: <strong>"worst wins"</strong> (no &gt; partial &gt; yes).
                  </p>
                </>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${statusColor}`}>
          {statusLabel}
          {isApplied && appliedDate ? ` · ${appliedDate}` : ""}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{de ? "Andere Frameworks einbeziehen" : "Include other frameworks"}</span>
            <Switch
              checked={isActive}
              onCheckedChange={(v) => setMode(v ? "preview" : "off")}
              aria-label={de ? "Übernahme umschalten" : "Toggle inheritance"}
            />
          </div>

          {mode === "preview" && (
            <Button size="sm" variant="default" onClick={apply} className="h-7 text-xs gap-1">
              <Check size={14} />
              {de ? "Übernehmen" : "Apply"}
            </Button>
          )}

          {isApplied && (
            <Button size="sm" variant="outline" onClick={reset} className="h-7 text-xs gap-1">
              <X size={14} />
              {de ? "Zurücksetzen" : "Reset"}
            </Button>
          )}
        </div>

        <div className="w-full text-[10px] text-muted-foreground">
          {de
            ? `Aktive Frameworks: ${enabledFrameworks.join(", ") || "keine"} · Verknüpfung: Kontroll-Knoten (same-as)`
            : `Active frameworks: ${enabledFrameworks.join(", ") || "none"} · Linking: control nodes (same-as)`}
        </div>
      </div>
    </div>
  );
};

export default FrameworkInheritanceBar;
