import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RotateCcw, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DEFAULT_SENSITIVITY_LEVELS,
  displayLabel,
  type SensitivityLevel,
} from "@/lib/sensitivityLevels";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  levels: SensitivityLevel[];
  lang: "de" | "en";
  onSave: (next: SensitivityLevel[]) => void;
}

const TIER_LABEL: Record<number, { de: string; en: string }> = {
  1: { de: "Stufe 1 (am niedrigsten)", en: "Tier 1 (lowest)" },
  2: { de: "Stufe 2",                  en: "Tier 2" },
  3: { de: "Stufe 3",                  en: "Tier 3" },
  4: { de: "Stufe 4 (am höchsten)",    en: "Tier 4 (highest)" },
};

const SensitivityManagerDialog = ({ open, onOpenChange, levels, lang, onSave }: Props) => {
  const de = lang === "de";
  const [draft, setDraft] = useState<SensitivityLevel[]>(levels);
  const [newLabel, setNewLabel] = useState("");
  const [newTier, setNewTier] = useState<1 | 2 | 3 | 4>(2);

  useEffect(() => { setDraft(levels); }, [levels, open]);

  const addLevel = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (draft.some(l => l.label.toLowerCase() === label.toLowerCase())) return;
    setDraft([...draft, { label, tier: newTier }]);
    setNewLabel(""); setNewTier(2);
  };

  const removeLevel = (idx: number) => {
    if (draft[idx]?.builtin) return;
    setDraft(draft.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, tier: 1 | 2 | 3 | 4) => {
    setDraft(draft.map((l, i) => i === idx ? { ...l, tier } : l));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {de ? "Datensensibilitäts-Stufen verwalten" : "Manage Data Sensitivity Levels"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-start gap-1.5">
            <p className="text-xs text-muted-foreground flex-1">
              {de
                ? "Definieren Sie eigene Klassifizierungen (z.B. \"Geheim\", \"TLP:RED\", \"PII\"). Jede eigene Bezeichnung wird einer Stufe von 1 bis 4 zugeordnet. Höhere Stufe = strengere Maßnahmen."
                : "Define your own classifications (e.g. \"Secret\", \"TLP:RED\", \"PII\"). Each custom label is mapped to a tier from 1 to 4. Higher tier = stricter measures."}
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5" aria-label="info">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="left" className="w-80 text-xs space-y-2">
                <p className="font-semibold">
                  {de ? "Warum nur Stufen 1 bis 4?" : "Why only tiers 1 to 4?"}
                </p>
                <p className="text-muted-foreground">
                  {de
                    ? "Die zentrale Control-Bibliothek (Step 6, u. a. ISO 27001, NIS2, DORA) ist intern auf eine 4-stufige Sensibilitätsskala kalibriert (1 = öffentlich … 4 = streng vertraulich). Jeder Control wird ab einer bestimmten Stufe ausgelöst."
                    : "The central control library (Step 6, incl. ISO 27001, NIS2, DORA) is internally calibrated to a 4-tier sensitivity scale (1 = public … 4 = highly confidential). Each control is triggered from a defined tier upward."}
                </p>
                <p className="text-muted-foreground">
                  {de
                    ? "Stufen über 4 (z.B. 5 oder 6) würden keine zusätzlichen Controls aktivieren — sie würden lediglich auf Stufe 4 abgebildet. Sie können jedoch beliebig viele eigene Bezeichnungen anlegen und sie auf Stufe 4 mappen (z.B. \"Geheim\" → Stufe 4, \"Streng geheim\" → Stufe 4)."
                    : "Tiers above 4 (e.g. 5 or 6) would not unlock any additional controls — they would simply collapse to tier 4. You can however create as many custom labels as you like and map them all to tier 4 (e.g. \"Secret\" → tier 4, \"Top Secret\" → tier 4)."}
                </p>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            {draft.map((l, idx) => (
              <div key={`${l.label}-${idx}`} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                <span className="text-sm font-medium flex-1 truncate">{displayLabel(l, lang)}</span>
                {l.builtin && <Badge variant="outline" className="text-[10px]">{de ? "Standard" : "Default"}</Badge>}
                <Select value={String(l.tier)} onValueChange={v => updateTier(idx, Number(v) as 1 | 2 | 3 | 4)}>
                  <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {([1, 2, 3, 4] as const).map(t => (
                      <SelectItem key={t} value={String(t)}>{TIER_LABEL[t][lang]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  disabled={l.builtin}
                  onClick={() => removeLevel(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t">
            <Label className="text-xs">{de ? "Neue Stufe hinzufügen" : "Add new level"}</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder={de ? "z.B. TLP:RED, Geheim, PII" : "e.g. TLP:RED, Secret, PII"}
                className="text-sm"
              />
              <Select value={String(newTier)} onValueChange={v => setNewTier(Number(v) as 1 | 2 | 3 | 4)}>
                <SelectTrigger className="h-9 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {([1, 2, 3, 4] as const).map(t => (
                    <SelectItem key={t} value={String(t)}>{TIER_LABEL[t][lang]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={addLevel} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />{de ? "Hinzufügen" : "Add"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="outline" size="sm" className="gap-1.5"
            onClick={() => setDraft([...DEFAULT_SENSITIVITY_LEVELS])}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {de ? "Standard wiederherstellen" : "Reset to defaults"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {de ? "Abbrechen" : "Cancel"}
            </Button>
            <Button onClick={() => { onSave(draft); onOpenChange(false); }}>
              {de ? "Speichern" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SensitivityManagerDialog;
