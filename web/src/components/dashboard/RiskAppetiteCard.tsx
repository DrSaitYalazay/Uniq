/**
 * RiskAppetiteCard — Dashboard-Kachel: „Wie viele Risiken liegen über dem
 * akzeptablen Appetit?" Liest denselben org-weiten Appetit (APPETITE_KEY) wie
 * die Risiko-Seite und dieselbe Risiko-Ableitung (useRiskAnalysis). Bewusst
 * akzeptierte Risiken (Behandlung = „Akzeptieren") werden separat ausgewiesen.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Gauge, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/dashboard/InfoHint";
import { useRiskAnalysis } from "@/hooks/useRiskAnalysis";
import { useToolData } from "@/hooks/useToolData";
import { useFramework } from "@/contexts/FrameworkContext";
import { DEFAULT_RISK_CONFIG, riskLevelLabel } from "@/lib/riskEngine";
import {
  APPETITE_KEY, DEFAULT_APPETITE, isOverAppetite, type AppetiteState,
} from "@/lib/riskAppetite";

const TREATMENT_KEY = "risk-treatment";
interface TreatmentLite { risk_id: string; strategy?: string }
interface TreatmentStateLite { treatments?: TreatmentLite[] }

export default function RiskAppetiteCard({ de }: { de: boolean }) {
  const { active } = useFramework();
  const { loading, result } = useRiskAnalysis(DEFAULT_RISK_CONFIG);
  const { data: appetite } = useToolData<AppetiteState>(APPETITE_KEY, APPETITE_KEY, DEFAULT_APPETITE);
  const { data: treatment } = useToolData<TreatmentStateLite>(TREATMENT_KEY, TREATMENT_KEY, { treatments: [] });

  const stat = useMemo(() => {
    if (!result) return null;
    const acceptedIds = new Set(
      (treatment.treatments ?? []).filter(t => t.strategy === "accept").map(t => t.risk_id),
    );
    let over = 0, overUnaccepted = 0;
    for (const r of result.risks) {
      if (isOverAppetite(appetite, r.likelihood, r.impact, r.risk_level)) {
        over++;
        if (!acceptedIds.has(r.risk_id)) overUnaccepted++;
      }
    }
    return { total: result.risks.length, over, overUnaccepted, accepted: over - overUnaccepted };
  }, [result, appetite, treatment.treatments]);

  const appetiteLabel = appetite.mode === "line"
    ? (de ? "Grenze frei definiert" : "Custom frontier")
    : (de ? `akzeptabel bis ${riskLevelLabel(appetite.classLevel, "de")}` : `acceptable up to ${riskLevelLabel(appetite.classLevel, "en")}`);

  const big = stat?.overUnaccepted ?? 0;
  const danger = big > 0;
  const sev = result?.bySeverity;
  const SEV = [
    { k: "critical", c: "st-nein-bg" },
    { k: "high", c: "bg-orange-500" },
    { k: "medium", c: "st-teilweise-bg" },
    { k: "low", c: "st-ja-bg" },
  ] as const;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="size-4 text-accent" />
            {de ? "Risiko-Appetit" : "Risk appetite"}
            <InfoHint
              title={de ? "Was zeigt diese Kachel?" : "What does this show?"}
              text={de
                ? "Wie viele bewertete Risiken über der von Ihnen festgelegten Toleranz (akzeptables Risiko) liegen und noch nicht behandelt sind. Die Grenze setzen Sie in der Risikoanalyse (nach Klasse oder frei gezeichnet)."
                : "How many assessed risks exceed the tolerance you defined (\"acceptable risk\") and are not yet treated. Set the frontier in the Risk analysis (by class or freely drawn)."}
            />
          </CardTitle>
          <Link to="/decision" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
            {de ? "Zur Analyse" : "To analysis"} <ArrowRight className="size-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {de ? "Noch kein Framework ausgewählt." : "No framework selected yet."}
          </p>
        ) : loading || !stat ? (
          <p className="text-sm text-muted-foreground">
            {de ? "Risiken werden berechnet…" : "Calculating risks…"}
          </p>
        ) : stat.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            {de ? "Noch keine Risiken abgeleitet." : "No risks derived yet."}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold tabular-nums ${danger ? "st-nein-text" : "st-ja-text"}`}>
                {big}
              </span>
              <span className="text-sm text-muted-foreground">
                {de ? `von ${stat.total} Risiken über Appetit` : `of ${stat.total} risks over appetite`}
              </span>
            </div>

            {/* Anteil über Appetit vs. im Rahmen */}
            <div>
              <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted">
                <div className="st-nein-bg h-full" style={{ width: `${Math.round((stat.over / stat.total) * 100)}%` }} />
                <div className="st-ja-bg h-full" style={{ width: `${Math.round(((stat.total - stat.over) / stat.total) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full st-nein-bg" />{de ? "über Appetit" : "over appetite"} <b className="text-foreground tabular-nums">{stat.over}</b></span>
                <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full st-ja-bg" />{de ? "im Rahmen" : "within"} <b className="text-foreground tabular-nums">{stat.total - stat.over}</b></span>
              </div>
            </div>

            {/* Verteilung nach Schweregrad */}
            {sev && (
              <div>
                <div className="text-[11px] font-medium text-muted-foreground mb-1">{de ? "Risiken nach Schweregrad" : "Risks by severity"}</div>
                <div className="h-2 w-full rounded-full overflow-hidden flex bg-muted">
                  {SEV.map(s => sev[s.k] > 0 ? (
                    <div key={s.k} className={`${s.c} h-full`} style={{ width: `${Math.round((sev[s.k] / stat.total) * 100)}%` }} title={`${riskLevelLabel(s.k, de ? "de" : "en")}: ${sev[s.k]}`} />
                  ) : null)}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-1.5">
                  {SEV.map(s => (
                    <span key={s.k} className="inline-flex items-center gap-1.5">
                      <span className={`size-2 rounded-full ${s.c} shrink-0`} />
                      <span className="capitalize">{riskLevelLabel(s.k, de ? "de" : "en")}</span>
                      <span className="ml-auto tabular-nums font-semibold text-foreground">{sev[s.k]}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              {stat.accepted > 0 && (
                <span>{de ? `${stat.accepted} bewusst akzeptiert · ` : `${stat.accepted} consciously accepted · `}</span>
              )}
              <span className="capitalize">{appetiteLabel}</span>
              {!danger && (
                <span className="st-ja-text"> · {de ? "✓ alles im Rahmen" : "✓ all within tolerance"}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
