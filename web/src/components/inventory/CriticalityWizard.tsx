import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calculator, PencilLine } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface CriticalityAssessment {
  q1: number; q2: number; q3: number; q4: number; q5: number; q6: number; q7: number;
  score: number;         // 0-4 from wizard (weighted)
  mode: "wizard" | "manual";
  manual_value?: number; // only if mode==='manual'
  override_reason?: string;
  updated_at?: string;
}

// Weights sum to 1.0 — Menschenleben & rechtl. Pflicht am höchsten
const WEIGHTS = { q1: 0.22, q2: 0.15, q3: 0.15, q4: 0.12, q5: 0.18, q6: 0.08, q7: 0.10 };

export function computeScore(a: Pick<CriticalityAssessment, "q1"|"q2"|"q3"|"q4"|"q5"|"q6"|"q7">): number {
  const raw = a.q1*WEIGHTS.q1 + a.q2*WEIGHTS.q2 + a.q3*WEIGHTS.q3 + a.q4*WEIGHTS.q4 + a.q5*WEIGHTS.q5 + a.q6*WEIGHTS.q6 + a.q7*WEIGHTS.q7;
  return Math.round(Math.max(0, Math.min(4, raw)));
}

const OPTIONS = [
  { v: 0, de: "0 · Keine", en: "0 · None" },
  { v: 1, de: "1 · Gering", en: "1 · Low" },
  { v: 2, de: "2 · Mittel", en: "2 · Medium" },
  { v: 3, de: "3 · Hoch", en: "3 · High" },
  { v: 4, de: "4 · Sehr hoch", en: "4 · Very high" },
];

const QUESTIONS = [
  { key: "q1", de: "Auswirkung auf Menschenleben / Gesundheit", en: "Impact on human life / health" },
  { key: "q2", de: "Wirtschaftlicher Schaden bei Ausfall",     en: "Economic damage if service fails" },
  { key: "q3", de: "Anzahl betroffener Nutzer / Bürger",       en: "Number of users / citizens affected" },
  { key: "q4", de: "Abhängigkeit anderer Services vom Service", en: "Other services depending on this one" },
  { key: "q5", de: "Rechtliche / regulatorische Pflicht (NIS2, DORA, KRITIS …)", en: "Legal / regulatory obligation (NIS2, DORA, KRITIS …)" },
  { key: "q6", de: "Reputationsschaden bei Vorfall",           en: "Reputational damage in case of incident" },
  { key: "q7", de: "Wiederherstellungszeit-Toleranz (RTO)",     en: "Recovery time tolerance (RTO)" },
] as const;

const CRIT_LABELS_DE = ["–", "Niedrig", "Mittel", "Hoch", "Kritisch"];
const CRIT_LABELS_EN = ["–", "Low", "Medium", "High", "Critical"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: CriticalityAssessment | null;
  currentValue: number;
  serviceName: string;
  onSave: (value: number, assessment: CriticalityAssessment) => void;
}

const empty: CriticalityAssessment = { q1: 2, q2: 2, q3: 2, q4: 2, q5: 2, q6: 2, q7: 2, score: 2, mode: "wizard" };

export default function CriticalityWizard({ open, onOpenChange, initial, currentValue, serviceName, onSave }: Props) {
  const { lang } = useLanguage();
  const de = lang === "de";
  const t = (d: string, e: string) => (de ? d : e);

  const [a, setA] = useState<CriticalityAssessment>(initial ?? { ...empty, score: currentValue, q1: currentValue, q2: currentValue, q3: currentValue, q4: currentValue, q5: currentValue, q6: currentValue, q7: currentValue });
  const [manualMode, setManualMode] = useState<boolean>((initial?.mode ?? "manual") === "manual");
  const [manualVal, setManualVal] = useState<number>(initial?.manual_value ?? currentValue);
  const [reason, setReason] = useState<string>(initial?.override_reason ?? "");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setA(initial);
      setManualMode(initial.mode === "manual");
      setManualVal(initial.manual_value ?? currentValue);
      setReason(initial.override_reason ?? "");
    }
  }, [open, initial, currentValue]);

  const wizardScore = computeScore(a);
  const finalValue = manualMode ? manualVal : wizardScore;
  const critLabels = de ? CRIT_LABELS_DE : CRIT_LABELS_EN;

  const canSave = true;

  const handleSave = () => {
    const payload: CriticalityAssessment = {
      ...a,
      score: wizardScore,
      mode: manualMode ? "manual" : "wizard",
      manual_value: manualMode ? manualVal : undefined,
      override_reason: manualMode ? reason.trim() : undefined,
      updated_at: new Date().toISOString(),
    };
    onSave(finalValue, payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator size={18} className="text-accent" />
            {t("Kritikalitäts-Assessment", "Criticality Assessment")}
          </DialogTitle>
          <DialogDescription>
            {t(`Bewerten Sie „${serviceName}“ anhand von 7 Kriterien. Ergebnis ist ein gewichteter Score (0-4).`,
               `Assess "${serviceName}" using 7 criteria. Result is a weighted score (0-4).`)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Calculator size={14} className="text-muted-foreground" />
            <span>{t("Detail-Assessment (7 Kriterien)", "Detailed assessment (7 criteria)")}</span>
          </div>
          <Switch checked={!manualMode} onCheckedChange={(v) => setManualMode(!v)} />
        </div>

        {!manualMode && (
          <div className="space-y-3">
            {QUESTIONS.map((q, i) => (
              <div key={q.key} className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-2 md:items-center">
                <Label className="text-sm">
                  <span className="text-muted-foreground mr-1">{i + 1}.</span>
                  {de ? q.de : q.en}
                </Label>
                <Select
                  value={String((a as any)[q.key])}
                  onValueChange={(v) => setA({ ...a, [q.key]: parseInt(v) } as CriticalityAssessment)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPTIONS.map((o) => (
                      <SelectItem key={o.v} value={String(o.v)}>{de ? o.de : o.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {manualMode && (
          <div className="space-y-3">
            <div>
              <Label className="text-sm">{t("Kritikalität (0-4)", "Criticality (0-4)")}</Label>
              <Select value={String(manualVal)} onValueChange={(v) => setManualVal(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[0,1,2,3,4].map((n) => <SelectItem key={n} value={String(n)}>{n} · {critLabels[n]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">
                {t("Begründung (optional)", "Justification (optional)")}
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("Warum weicht die Bewertung vom Wizard ab?", "Why does this deviate from the wizard result?")}
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="rounded-md border p-3 flex items-center justify-between bg-card">
          <div className="text-xs text-muted-foreground">
            {t("Wizard-Ergebnis:", "Wizard result:")} <Badge variant="outline" className="ml-1">{wizardScore} · {critLabels[wizardScore]}</Badge>
          </div>
          <div className="text-sm font-semibold">
            {t("Endwert:", "Final:")}{" "}
            <Badge className="ml-1">{finalValue} · {critLabels[finalValue]}</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("Abbrechen", "Cancel")}</Button>
          <Button onClick={handleSave} disabled={!canSave}>{t("Übernehmen", "Apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
