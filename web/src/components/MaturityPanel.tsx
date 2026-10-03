/**
 * MaturityPanel — additive Reifegrad-Ansicht (Spec-ITEM 11).
 *
 * Zeigt je Familie IST / Ziel / Gap für EIN Framework. Rein additiv: greift auf
 * dieselben Kontrollen + EffectiveAnswer-Map zu wie das Assessment, ändert aber
 * keine Compliance-Zahl. Ziele kommen aus public.maturity_targets (useMaturityTargets).
 *
 * Badge:
 *  • „erfasst"    (derived=false) — echte, erfasste Reifegrade (uses_maturity-Framework).
 *  • „abgeleitet" (derived=true)  — Pseudo-Score aus dem Konformitätsstatus.
 */
import { useMemo, useState } from "react";
import { Card, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Gauge, ChevronDown } from "lucide-react";
import type { ControlRow, EffectiveAnswer } from "@/lib/assessmentEngine";
import { computeFrameworkMaturityV3 } from "@/lib/maturityV2";
import { useMaturityTargets } from "@/hooks/useMaturityTargets";

interface Props {
  framework: string;
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
  usesMaturity: boolean;
  de?: boolean;
}

export function MaturityPanel({ framework, controls, effective, usesMaturity, de = true }: Props) {
  const { targets } = useMaturityTargets(framework);
  const [open, setOpen] = useState(false);

  // H1: gewichteter Reifegrad-Rollup (V3). Kontroll-Gewicht nach Wichtigkeit
  // (MUSS = 1.0, sonst 0.5) — wichtige Kontrollen zählen mehr als das frühere
  // ungewichtete Familien-Mittel. derivedCap = 5 lässt die Ableitungs-Skala
  // unverändert; nur die Gewichtung ändert sich gegenüber V2.
  const result = useMemo(
    () => {
      const weights = new Map(controls.map(c => [c.id, c.muss === "true" ? 1.0 : 0.5]));
      return computeFrameworkMaturityV3({ framework, usesMaturity, controls, effective, targets, weights, derivedCap: 5 });
    },
    [framework, usesMaturity, controls, effective, targets],
  );

  if (result.groups.length === 0) return null;

  const gapTone = (gap: number | null) => {
    if (gap == null) return "text-muted-foreground";
    if (gap > 0) return "text-destructive font-medium";
    return "text-success font-medium";
  };
  const fmtGap = (gap: number | null) => {
    if (gap == null) return "—";
    if (gap <= 0) return de ? "erreicht" : "met";
    return `+${gap.toFixed(1)}`;
  };

  const meterColor = result.overall < 2 ? "bg-destructive"
    : result.overall < 3 ? "st-teilweise-bg"
    : result.overall < 4 ? "st-teilweise-bg"
    : "st-ja-bg";

  return (
    <Card className="card-elevated overflow-hidden">
      {/* Kopf = Akkordeon-Auslöser. Zugeklappt: Gesamt-Reifegrad + Meter.
          Aufgeklappt: Detailtabelle je Familie. Default: zu (spart Platz). */}
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-accent/5 transition-colors">
        <Gauge className="h-4 w-4 text-accent shrink-0" />
        <div className="min-w-0">
          <div className="text-base font-semibold text-foreground flex items-center gap-2">
            {de ? "Reifegrad-Übersicht" : "Maturity overview"}
            <Badge variant={result.derived ? "outline" : "secondary"} className="text-[10px]">
              {result.derived ? (de ? "abgeleitet" : "derived") : (de ? "erfasst" : "captured")}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground">
            {open
              ? (de ? "Klicken zum Einklappen" : "Click to collapse")
              : (de ? `Ø über ${result.groups.length} Familien — klicken für Details` : `avg over ${result.groups.length} families — click for details`)}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {/* Olgunluk-metre: yükselen renkli barlar 1..5 */}
          <div className="flex items-end gap-0.5" title={`${result.overall.toFixed(1)}/5`}>
            {[1, 2, 3, 4, 5].map(k => (
              <div key={k} className={`w-2 rounded-sm ${result.overall >= k - 0.5 ? meterColor : "bg-muted"}`}
                   style={{ height: `${8 + k * 4}px` }} />
            ))}
          </div>
          <span className="text-lg font-bold tabular-nums text-foreground">
            {result.overall.toFixed(1)}<span className="text-xs text-muted-foreground">/5</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
        </div>
      </button>
      {open && (
      <CardContent className="pt-0">
        <CardDescription className="text-xs mb-3">
          {result.derived
            ? (de
                ? "Pseudo-Reifegrad aus dem Konformitätsstatus (ja = 5, teilweise = 2.5). Kein erfasster Reifegrad für dieses Framework."
                : "Pseudo maturity derived from compliance status (yes = 5, partial = 2.5). No captured maturity for this framework.")
            : (de
                ? "IST = Mittelwert der erfassten Reifegrade je Familie (nur bewertete Kontrollen)."
                : "Actual = mean of captured maturity levels per family (assessed controls only).")}
        </CardDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{de ? "Familie" : "Family"}</TableHead>
              <TableHead className="text-right w-20">{de ? "Ist" : "Actual"}</TableHead>
              <TableHead className="text-right w-20">{de ? "Ziel" : "Target"}</TableHead>
              <TableHead className="text-right w-24">Gap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.groups.map((g) => (
              <TableRow key={g.family}>
                <TableCell className="text-sm">
                  {g.family}
                  <span className="ml-1.5 text-[11px] text-muted-foreground">({g.count})</span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{g.ist.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {g.target == null ? "—" : g.target.toFixed(1)}
                </TableCell>
                <TableCell className={`text-right tabular-nums ${gapTone(g.gap)}`}>
                  {fmtGap(g.gap)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      )}
    </Card>
  );
}

export default MaturityPanel;
