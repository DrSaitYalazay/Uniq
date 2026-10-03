import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFramework, FRAMEWORKS } from "@/contexts/FrameworkContext";
import { FRAMEWORK_DB_VALUE } from "@/data/frameworkCatalogs";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildUmsetzungView, type RawControl } from "@/lib/implementationEngine";
import { useImplementationStatus } from "@/hooks/useImplementationStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { LegalBadges } from "@/components/LegalBadges";
import { Scale, CheckCircle2, Loader2 } from "lucide-react";

/**
 * DeltaObligationsCard — surfaces framework-specific delta obligations
 * (Meldepflichten, DPIA, SBOM, CVD …) in the Roadmap view so leadership
 * sees legal duties alongside the mapped Now/Next/Later bundles.
 * Uses the same engine as Step 12 for consistency.
 */
export function DeltaObligationsCard() {
  const { active } = useFramework();
  const { lang } = useLanguage();
  const de = lang === "de";
  const { getStatus } = useImplementationStatus();
  const [controls, setControls] = useState<RawControl[]>([]);
  const [loading, setLoading] = useState(true);

  // DB-Code verwenden (BSI, nicht BSI_ITGS).
  const activeKeys = useMemo(() => active.map(f => FRAMEWORK_DB_VALUE[f.key] ?? f.key), [active]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeKeys.length === 0) { setControls([]); setLoading(false); return; }
      setLoading(true);
      const all: RawControl[] = [];
      for (let from = 0; from < 100000; from += 1000) {
        const { data, error } = await supabase
          .from("controls")
          .select("id, framework, req_de, req_en, effort_pt, meta")
          .in("framework", activeKeys)
          .order("id")
          .range(from, from + 999);
        if (error) break;
        const rows = (data ?? []) as RawControl[];
        all.push(...rows);
        if (rows.length < 1000) break;
      }
      if (!cancelled) {
        setControls(all);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeKeys.join(",")]);

  const view = useMemo(() => buildUmsetzungView(controls, activeKeys), [controls, activeKeys]);
  const totalDelta = Object.values(view.deltaByFramework).reduce((s, arr) => s + arr.length, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4" />
            {de ? "Framework-Pflichten (Rechtsquellen)" : "Framework obligations (legal sources)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            {de ? "Lade Delta-Pflichten …" : "Loading delta obligations …"}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalDelta === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Scale className="h-4 w-4" />
          {de ? "Framework-Pflichten (Rechtsquellen)" : "Framework obligations (legal sources)"}
          <Badge variant="secondary" className="ml-2">{totalDelta}</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          {de
            ? "Nicht dedupliziert — z. B. NIS2 72h ≠ DORA 4h ≠ DSGVO 72h sind juristisch getrennt. Klick auf Rechtsquelle öffnet Originaltext."
            : "Not deduplicated — e.g. NIS2 72h ≠ DORA 4h ≠ GDPR 72h are legally distinct. Click a source to open the original text."}
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {activeKeys
            .filter(fw => (view.deltaByFramework[fw]?.length ?? 0) > 0)
            .map(fw => {
              const items = view.deltaByFramework[fw] ?? [];
              const done = items.filter(i => getStatus(i.bundle_key) === "fertig").length;
              return (
                <AccordionItem key={fw} value={fw}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-semibold">{FRAMEWORKS[fw]?.displayName ?? fw}</span>
                      <Badge variant="secondary">{items.length}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto mr-3 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 st-ja-text" />
                        {done}/{items.length} {de ? "fertig" : "done"}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {items.map(t => {
                        const status = getStatus(t.bundle_key);
                        return (
                          <div key={t.bundle_key} className="border-b border-border/40 last:border-0 py-2">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <code className="text-[10px] text-muted-foreground">{t.control_id}</code>
                              <LegalBadges stufe={t.trigger} legalRef={t.legalRef} quelle={t.quelle} de={de} />
                              {status === "fertig" && (
                                <Badge variant="outline" className="text-[10px] st-ja-tint st-ja-text st-ja-border">
                                  {de ? "Fertig" : "Done"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm">{de ? t.title : t.titleEn}</div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
