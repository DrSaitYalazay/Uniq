import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFramework, FRAMEWORKS } from "@/contexts/FrameworkContext";
import { FRAMEWORK_DB_VALUE } from "@/data/frameworkCatalogs";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildUmsetzungView, type RawControl, type DeltaTask } from "@/lib/implementationEngine";
import { useImplementationStatus } from "@/hooks/useImplementationStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/dashboard/InfoHint";
import { ArrowRight, Scale, Loader2 } from "lucide-react";

/**
 * DashboardDeltaBacklog — executive view of open framework-specific
 * obligations (MUSS first). Deep-links into the Umsetzung page.
 */
export default function DashboardDeltaBacklog({ frameworkFilter = null }: { frameworkFilter?: string | null } = {}) {
  const { active } = useFramework();
  const { lang } = useLanguage();
  const de = lang === "de";
  const { rows, loading: statusLoading } = useImplementationStatus();

  const [controls, setControls] = useState<RawControl[]>([]);
  const [loading, setLoading] = useState(true);
  // CHG-10: als „nicht anwendbar" (n.a.) bewertete Kontrollen sind KEINE offene
  // Pflicht und werden abgezogen. `na` ist frameworkspezifisch (nicht projiziert),
  // daher genügt die eigene Org-Antwort. Key = „FRAMEWORK:control_id".
  const [naSet, setNaSet] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("answers").select("framework, control_id")
        .eq("antwort", "na").is("asset_id", null);
      if (cancelled) return;
      const s = new Set<string>();
      for (const r of (data ?? []) as { framework: string; control_id: string }[]) s.add(`${r.framework}:${r.control_id}`);
      setNaSet(s);
    })();
    return () => { cancelled = true; };
  }, []);

  // DB-Code verwenden (BSI, nicht BSI_ITGS), sonst lädt controls 0 BSI-Zeilen.
  const activeKeys = useMemo(() => {
    const keys = active.map(f => FRAMEWORK_DB_VALUE[f.key] ?? f.key);
    return frameworkFilter ? keys.filter(k => k === frameworkFilter) : keys;
  }, [active, frameworkFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (activeKeys.length === 0) { setControls([]); setLoading(false); return; }
      setLoading(true);
      // Paginiert laden — BSI+KRITIS+ISO+DORA übersteigen die 1000er-Grenze.
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

  const allDelta = useMemo(() => {
    return Object.values(view.deltaByFramework).flat();
  }, [view]);

  const openDelta = useMemo(() => {
    const isOpen = (t: DeltaTask) => (rows[t.bundle_key]?.status ?? "offen") !== "fertig";
    const isNa = (t: DeltaTask) => naSet.has(`${t.framework}:${t.control_id}`);
    return allDelta.filter((t) => isOpen(t) && !isNa(t)).sort((a, b) => {
      const sa = (a.trigger ?? "").toUpperCase();
      const sb = (b.trigger ?? "").toUpperCase();
      if (sa !== sb) {
        if (sa === "MUSS") return -1;
        if (sb === "MUSS") return 1;
      }
      return a.framework.localeCompare(b.framework);
    });
  }, [allDelta, rows]);

  // Management: keine Einzel-Liste, sondern Zahl + Aufschlüsselung je Framework.
  const byFw = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of openDelta) m.set(t.framework, (m.get(t.framework) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [openDelta]);
  const maxFw = Math.max(1, ...byFw.map(r => r[1]));
  const overallLoading = loading || statusLoading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              {de ? "Offene Pflichten aus Ihren Frameworks" : "Open obligations from your frameworks"}
              {!overallLoading && (
                <Badge variant="secondary" className="ml-2">{openDelta.length} {de ? "offen" : "open"}</Badge>
              )}
              <InfoHint
                title={de ? "Was ist das?" : "What is this?"}
                text={de
                  ? "Diese Liste zeigt die noch offenen Pflicht-Anforderungen (MUSS zuerst), die sich direkt aus Ihren aktiven Normen/Gesetzen ergeben — z. B. NIS2, DORA, ISO 27001. „Delta\" = die Lücke zwischen Pflicht und aktuellem Umsetzungsstand.\n\nJede Zeile: Kontroll-Nr., Framework-Kürzel, Rechtsquelle (anklickbar) und die Kurzbeschreibung. Über „Zur Umsetzung\" bearbeiten Sie die Punkte."
                  : "This list shows the still-open mandatory requirements (MUST first) that follow directly from your active standards/laws — e.g. NIS2, DORA, ISO 27001. \"Delta\" = the gap between obligation and current implementation status.\n\nEach row: control no., framework tag, legal source (clickable) and a short description. Use \"Go to Implementation\" to work them off."}
              />
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {de
                ? "Wichtigste offene Pflicht-Anforderungen aus Ihren aktiven Frameworks (MUSS zuerst). Klick auf die Rechtsquelle öffnet den Originaltext."
                : "Most important open mandatory requirements from your active frameworks (MUST first). Click a source to open the original text."}
            </p>
          </div>
          <Link to="/implementation" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
            {de ? "Zur Umsetzung" : "Go to Implementation"} <ArrowRight className="size-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {overallLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            {de ? "Lade Delta-Backlog …" : "Loading delta backlog …"}
          </div>
        )}
        {!overallLoading && openDelta.length === 0 && (
          <div className="text-sm text-muted-foreground py-4">
            {de
              ? "Keine offenen Delta-Pflichten in den aktiven Frameworks."
              : "No open delta obligations in active frameworks."}
          </div>
        )}
        {!overallLoading && openDelta.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground tabular-nums">{openDelta.length}</span>
              <span className="text-sm text-muted-foreground">
                {de ? "offene Pflicht-Anforderungen (MUSS zuerst)" : "open mandatory requirements (MUST first)"}
              </span>
            </div>
            <div className="space-y-2">
              {byFw.map(([fw, n]) => (
                <Link key={fw} to="/implementation" className="flex items-center gap-3 group">
                  <span className="text-xs text-foreground w-28 shrink-0 truncate group-hover:text-accent">{FRAMEWORKS[fw]?.short ?? fw}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary group-hover:bg-accent transition-colors" style={{ width: `${Math.round((n / maxFw) * 100)}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{n}</span>
                </Link>
              ))}
            </div>
            <Link to="/implementation" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
              {de ? "Details in der Umsetzung öffnen" : "Open details in Implementation"} <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
