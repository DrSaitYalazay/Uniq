import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw } from "lucide-react";
import { FormulaWeights, FormulaThresholds, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS } from "@/lib/criticalityEngine";

interface FormulaSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weights: FormulaWeights;
  thresholds: FormulaThresholds;
  lang: "de" | "en";
  onSave: (weights: FormulaWeights, thresholds: FormulaThresholds, note: string) => void;
}

const FACTOR_LABELS: Record<keyof FormulaWeights, { de: string; en: string }> = {
  operational_impact: { de: "Betriebliche Auswirkung", en: "Operational Impact" },
  affected_users: { de: "Betroffene Nutzer", en: "Affected Users" },
  data_sensitivity: { de: "Datensensibilität", en: "Data Sensitivity" },
  dependency_importance: { de: "Abhängigkeitsbedeutung", en: "Dependency Importance" },
  legal_exposure: { de: "Regulatorische Exposition", en: "Legal Exposure" },
  third_party_exposure: { de: "Drittanbieter-Exposition", en: "Third-Party Exposure" },
  availability_requirement: { de: "Verfügbarkeitsanforderung", en: "Availability Requirement" },
};

const FormulaSettingsDialog = ({ open, onOpenChange, weights: initWeights, thresholds: initThresholds, lang, onSave }: FormulaSettingsDialogProps) => {
  const de = lang === "de";
  const [weights, setWeights] = useState<FormulaWeights>(initWeights);
  const [thresholds, setThresholds] = useState<FormulaThresholds>(initThresholds);
  const [note, setNote] = useState("");

  useEffect(() => {
    setWeights(initWeights);
    setThresholds(initThresholds);
    setNote("");
  }, [open, initWeights, initThresholds]);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = Math.abs(totalWeight - 1) < 0.01;

  const factors = Object.keys(weights) as (keyof FormulaWeights)[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{de ? "Formeleinstellungen" : "Formula Settings"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">{de ? "Gewichtungen" : "Weights"}</h4>
            <div className="space-y-2">
              {factors.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <Label className="text-xs w-40 shrink-0">{FACTOR_LABELS[f][lang]}</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={weights[f]}
                    onChange={(e) => setWeights({ ...weights, [f]: parseFloat(e.target.value) || 0 })}
                    className="w-24 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">{(weights[f] * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <p className={`text-xs mt-2 ${isValid ? "st-ja-text" : "text-destructive"}`}>
              {de ? "Summe:" : "Total:"} {(totalWeight * 100).toFixed(0)}%
              {!isValid && (de ? " (muss 100% sein)" : " (must be 100%)")}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">{de ? "Schwellenwerte" : "Thresholds"}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label className="text-xs w-40">Low → Medium</Label>
                <Input
                  type="number" step="0.1" value={thresholds.low_max}
                  onChange={(e) => setThresholds({ ...thresholds, low_max: parseFloat(e.target.value) || 0 })}
                  className="w-24 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs w-40">Medium → High</Label>
                <Input
                  type="number" step="0.1" value={thresholds.medium_max}
                  onChange={(e) => setThresholds({ ...thresholds, medium_max: parseFloat(e.target.value) || 0 })}
                  className="w-24 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs w-40">High → Critical</Label>
                <Input
                  type="number" step="0.1" value={thresholds.high_max}
                  onChange={(e) => setThresholds({ ...thresholds, high_max: parseFloat(e.target.value) || 0 })}
                  className="w-24 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">{de ? "Änderungsnotiz" : "Change Note"}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={de ? "Grund für die Änderung..." : "Reason for change..."}
              className="text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setWeights(DEFAULT_WEIGHTS); setThresholds(DEFAULT_THRESHOLDS); }}
            className="gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {de ? "Standard wiederherstellen" : "Restore Defaults"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {de ? "Abbrechen" : "Cancel"}
            </Button>
            <Button
              disabled={!isValid}
              onClick={() => { onSave(weights, thresholds, note); onOpenChange(false); }}
            >
              {de ? "Speichern" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormulaSettingsDialog;
