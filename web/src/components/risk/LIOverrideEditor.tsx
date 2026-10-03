/**
 * LIOverrideEditor — P4.M.3: Klick auf „L n × I m" im Analyse-Accordion öffnet
 * ein Popover, in dem Likelihood/Impact (1–Matrixgröße) manuell gesetzt werden.
 * Pflicht-Begründung, optional „angepasst von" (Personen-Register). Persistenz
 * liegt beim Aufrufer (Risk.tsx → useToolData "manual-risks" → overrides).
 *
 * Der Trigger sitzt INNERHALB eines AccordionTrigger-Buttons: Klicks/Tasten
 * werden gestoppt, damit das Accordion nicht mit-toggelt (auch aus dem Portal).
 */
import { useEffect, useState, type SyntheticEvent } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, RotateCcw } from "lucide-react";
import PersonSelect from "@/components/PersonSelect";
import type { Person } from "@/lib/personnel";
import { riskLevelLabel, scoreAndLevel, type RiskObject, type RiskMatrixConfig } from "@/lib/riskEngine";
import type { RiskOverride } from "@/lib/manualRisks";

const MIN_REASON = 10;

interface Props {
  risk: RiskObject;
  config: RiskMatrixConfig;
  /** Aktuell gespeicherter Override (undefined = Engine-Werte). */
  override?: RiskOverride;
  people: Person[];
  onAddPerson: (p: Person) => void;
  onSave: (o: RiskOverride) => void;
  onReset: () => void;
  de: boolean;
  /** Engine-Originalwerte (vor Override) für die Anzeige „Engine: L a × I b". */
  engineLikelihood?: number;
  engineImpact?: number;
}

export function LIOverrideEditor({
  risk, config, override, people, onAddPerson, onSave, onReset, de, engineLikelihood, engineImpact,
}: Props) {
  const dims = config.dimensions ?? { rows: 5, cols: 5 };
  const [open, setOpen] = useState(false);
  const [l, setL] = useState<number>(risk.likelihood);
  const [i, setI] = useState<number>(risk.impact);
  const [reason, setReason] = useState<string>(override?.reason ?? "");
  const [by, setBy] = useState<string>(override?.set_by ?? "");

  useEffect(() => {
    if (open) {
      setL(risk.likelihood); setI(risk.impact);
      setReason(override?.reason ?? ""); setBy(override?.set_by ?? "");
    }
  }, [open, risk.likelihood, risk.impact, override?.reason, override?.set_by]);

  const preview = scoreAndLevel(l, i, config);
  const canSave = reason.trim().length >= MIN_REASON;
  const stop = (e: SyntheticEvent) => { e.stopPropagation(); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          onClick={stop}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(o => !o); } }}
          title={de ? "Likelihood/Impact manuell anpassen" : "Adjust likelihood/impact manually"}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium cursor-pointer transition-colors ${
            risk.risk_overridden
              ? "border-copper/60 bg-copper/10 text-copper hover:bg-copper/20"
              : "border-border bg-background text-foreground hover:border-copper/60 hover:text-copper"
          }`}
        >
          L {risk.likelihood} × I {risk.impact}
          <Pencil className="h-2.5 w-2.5 opacity-70" />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3" onClick={stop} onKeyDown={stop}>
        <div className="space-y-2.5" onClick={stop}>
          <div className="text-xs font-semibold text-foreground">
            {de ? "L/I manuell setzen" : "Set L/I manually"}
          </div>
          {(engineLikelihood !== undefined && engineImpact !== undefined) && (
            <div className="text-[11px] text-muted-foreground">
              {de ? "Engine-Wert:" : "Engine value:"} L {engineLikelihood} × I {engineImpact}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-muted-foreground">
              {de ? "Eintrittswahrscheinlichkeit (L)" : "Likelihood (L)"}
              <select value={l} onChange={e => setL(Number(e.target.value))}
                      className="mt-1 w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground">
                {Array.from({ length: dims.cols }, (_, k) => k + 1).map(v => (
                  <option key={v} value={v}>
                    {v} — {config.likelihoodScale.find(s => s.value === v)?.[de ? "labelDe" : "labelEn"] ?? ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-muted-foreground">
              {de ? "Auswirkung (I)" : "Impact (I)"}
              <select value={i} onChange={e => setI(Number(e.target.value))}
                      className="mt-1 w-full h-8 rounded border border-border bg-background px-2 text-xs text-foreground">
                {Array.from({ length: dims.rows }, (_, k) => k + 1).map(v => (
                  <option key={v} value={v}>
                    {v} — {config.impactScale.find(s => s.value === v)?.[de ? "labelDe" : "labelEn"] ?? ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">{de ? "Ergebnis:" : "Result:"}</span>
            <Badge variant="outline" className="text-[10px]">Score {preview.score}</Badge>
            <Badge variant="outline" className="text-[10px]">{riskLevelLabel(preview.level, de ? "de" : "en")}</Badge>
          </div>
          <label className="block text-[11px] text-muted-foreground">
            {de ? "Begründung (Pflicht, ≥ 10 Zeichen)" : "Justification (required, ≥ 10 chars)"}
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                      className="mt-1 text-xs"
                      placeholder={de
                        ? "z. B. Kompensierende Maßnahme aktiv; Asset nur intern erreichbar …"
                        : "e.g. compensating control active; asset reachable internally only …"} />
          </label>
          <div className="text-[11px] text-muted-foreground">
            {de ? "Angepasst von (optional)" : "Adjusted by (optional)"}
            <PersonSelect value={by} onChange={setBy} people={people} onAddPerson={onAddPerson} de={de} className="mt-1" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            {override ? (
              <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] gap-1"
                      onClick={() => { onReset(); setOpen(false); }}>
                <RotateCcw className="h-3 w-3" />
                {de ? "Engine-Wert wiederherstellen" : "Restore engine value"}
              </Button>
            ) : <span />}
            <Button type="button" size="sm" className="h-7 text-[11px]" disabled={!canSave}
                    onClick={() => {
                      onSave({ likelihood: l, impact: i, reason: reason.trim(), set_by: by || undefined, set_at: new Date().toISOString().slice(0, 10) });
                      setOpen(false);
                    }}>
              {de ? "Übernehmen" : "Apply"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
