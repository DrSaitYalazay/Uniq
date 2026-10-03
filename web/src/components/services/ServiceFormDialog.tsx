import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Info } from "lucide-react";
import ScoringFactorInput from "./ScoringFactorInput";
import CalculationNotes from "./CalculationNotes";
import MismatchWarning from "./MismatchWarning";
import {
  CriticalityInputs,
  FormulaWeights,
  FormulaThresholds,
  calculateCriticality,
  classificationBadgeColor,
  DEFAULT_WEIGHTS,
  DEFAULT_THRESHOLDS,
} from "@/lib/criticalityEngine";

interface ServiceData {
  id?: string;
  service_name: string;
  description: string;
  countries: string[];
  business_unit: string;
  user_marked_critical: boolean;
}

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceData | null;
  inputs: CriticalityInputs;
  weights: FormulaWeights;
  thresholds: FormulaThresholds;
  lang: "de" | "en";
  onSave: (service: ServiceData, inputs: CriticalityInputs) => void;
  onOverride: (serviceId: string, systemClass: string, userClass: string, reason: string) => void;
}

const ServiceFormDialog = ({
  open, onOpenChange, service: initialService, inputs: initialInputs,
  weights, thresholds, lang, onSave, onOverride,
}: ServiceFormDialogProps) => {
  const de = lang === "de";
  
  const [service, setService] = useState<ServiceData>({
    service_name: "", description: "", countries: [], business_unit: "", user_marked_critical: false,
  });
  const [inputs, setInputs] = useState<CriticalityInputs>({
    operational_impact: 1, affected_users: 1, data_sensitivity: 1,
    dependency_importance: 1, legal_exposure: 1, third_party_exposure: 1, availability_requirement: 1,
  });
  const [scoringOpen, setScoringOpen] = useState(false);

  useEffect(() => {
    if (initialService) setService(initialService);
    else setService({ service_name: "", description: "", countries: [], business_unit: "", user_marked_critical: false });
    setInputs(initialInputs);
  }, [initialService, initialInputs, open]);

  const result = useMemo(
    () => calculateCriticality(inputs, weights, thresholds, lang),
    [inputs, weights, thresholds, lang]
  );

  // Treat scoring as "not filled yet" when every factor is still at the default minimum (1).
  // Prevents a misleading "Low" verdict and a false mismatch warning before the user opens
  // the Bewertung tab.
  const scoringUntouched = useMemo(
    () => Object.values(inputs).every((v) => v === 1),
    [inputs]
  );

  const scoringOptions = {
    operational_impact: [
      { value: 1, label: de ? "Keine wesentliche Auswirkung" : "No material impact" },
      { value: 2, label: de ? "Begrenzte Störung" : "Limited disruption" },
      { value: 3, label: de ? "Schwere Störung" : "Major disruption" },
      { value: 4, label: de ? "Schwere / existenzielle Störung" : "Severe / existential disruption" },
    ],
    affected_users: [
      { value: 1, label: de ? "Sehr gering" : "Very low" },
      { value: 2, label: de ? "Gering" : "Low" },
      { value: 3, label: de ? "Mittel" : "Medium" },
      { value: 4, label: de ? "Hoch" : "High" },
      { value: 5, label: de ? "Sehr hoch" : "Very high" },
    ],
    data_sensitivity: [
      { value: 1, label: de ? "Keine sensiblen Daten" : "No sensitive data" },
      { value: 2, label: de ? "Interne Geschäftsdaten" : "Internal business data" },
      { value: 3, label: de ? "Personenbezogene Daten" : "Personal data" },
      { value: 4, label: de ? "Sensible / besondere Kategorien" : "Sensitive / special category data" },
      { value: 5, label: de ? "Missionskritische / regulierte Daten" : "Mission-critical / regulated data" },
    ],
    dependency_importance: [
      { value: 1, label: de ? "Eigenständig" : "Standalone" },
      { value: 2, label: de ? "Einige abhängige Systeme" : "Some dependent systems" },
      { value: 3, label: de ? "Viele abhängige Systeme" : "Many dependent systems" },
      { value: 4, label: de ? "Kernabhängigkeit für mehrere Dienste" : "Core dependency for multiple services" },
    ],
    legal_exposure: [
      { value: 1, label: de ? "Keine" : "None" },
      { value: 2, label: de ? "Gering" : "Minor" },
      { value: 3, label: de ? "Relevant" : "Relevant" },
      { value: 4, label: de ? "Hoch" : "High" },
    ],
    third_party_exposure: [
      { value: 1, label: de ? "Keine" : "None" },
      { value: 2, label: de ? "Begrenzt" : "Limited" },
      { value: 3, label: de ? "Mittel" : "Medium" },
      { value: 4, label: de ? "Hoch" : "High" },
    ],
    availability_requirement: [
      { value: 1, label: de ? "Nicht kritisch" : "Non-critical" },
      { value: 2, label: de ? "Wichtig" : "Important" },
      { value: 3, label: de ? "Hohe Verfügbarkeit erforderlich" : "High availability required" },
      { value: 4, label: de ? "Nahezu dauerhafte Verfügbarkeit" : "Near-continuous availability required" },
    ],
  };

  const factorLabels: Record<string, string> = {
    operational_impact: de ? "Betriebliche Auswirkung" : "Operational Impact",
    affected_users: de ? "Betroffene Nutzer/Kunden" : "Affected Users/Customers",
    data_sensitivity: de ? "Datensensibilität" : "Data Sensitivity",
    dependency_importance: de ? "Abhängigkeitsbedeutung" : "Dependency Importance",
    legal_exposure: de ? "Regulatorische Exposition" : "Legal/Regulatory Exposure",
    third_party_exposure: de ? "Drittanbieter-Exposition" : "Third-Party Exposure",
    availability_requirement: de ? "Verfügbarkeitsanforderung" : "Availability Requirement",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {service.id
              ? (de ? "Dienst bearbeiten" : "Edit Service")
              : (de ? "Neuen Dienst hinzufügen" : "Add New Service")}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic">
          <TabsList className="w-full">
            <TabsTrigger value="basic" className="flex-1">{de ? "Grunddaten" : "Basic Info"}</TabsTrigger>
            <TabsTrigger value="scoring" className="flex-1">{de ? "Bewertung" : "Scoring"}</TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">{de ? "Berechnungsdetails" : "Calculation Notes"}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>{de ? "Dienstname" : "Service Name"} *</Label>
              <Input
                value={service.service_name}
                onChange={(e) => setService({ ...service, service_name: e.target.value })}
                placeholder={de ? "z.B. E-Mail-Service" : "e.g. Email Service"}
              />
            </div>
            <div className="space-y-2">
              <Label>{de ? "Beschreibung" : "Description"}</Label>
              <Textarea
                value={service.description}
                onChange={(e) => setService({ ...service, description: e.target.value })}
                placeholder={de ? "Kurze Beschreibung des Dienstes..." : "Short description of the service..."}
              />
            </div>
            <div className="space-y-2">
              <Label>{de ? "Geschäftseinheit / Verantwortlicher" : "Business Unit / Owner"}</Label>
              <Input
                value={service.business_unit}
                onChange={(e) => setService({ ...service, business_unit: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Switch
                checked={service.user_marked_critical}
                onCheckedChange={(v) => setService({ ...service, user_marked_critical: v })}
              />
              <div>
                <Label className="font-medium">
                  {de ? "Als kritisch markieren" : "Mark as Critical"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {de
                    ? "Manuelle Einstufung — das System berechnet zusätzlich einen eigenen Score"
                    : "Manual classification — the system also calculates its own score"}
                </p>
              </div>
            </div>

            {/* Live result preview — only after the user has actually scored at least one factor */}
            {scoringUntouched ? (
              <div className="p-3 rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                {de
                  ? 'Noch keine Bewertung erfasst. Öffnen Sie den Tab „Bewertung", um die System-Einstufung zu berechnen.'
                  : 'No scoring entered yet. Open the "Scoring" tab to compute the system classification.'}
              </div>
            ) : (
              <>
                <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">{de ? "System-Ergebnis:" : "System Result:"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{result.score.toFixed(2)}</span>
                    <Badge variant="outline" className={classificationBadgeColor(result.classification)}>
                      {result.classification}
                    </Badge>
                  </div>
                </div>

                <MismatchWarning
                  userMarked={service.user_marked_critical}
                  systemClassification={result.classification}
                  lang={lang}
                  onAccept={() => setService({ ...service, user_marked_critical: result.classification === "High" || result.classification === "Critical" })}
                  onOverride={(cls, reason) => {
                    if (service.id) onOverride(service.id, result.classification, cls, reason);
                  }}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="scoring" className="mt-4">
            <div className="space-y-1">
              {(Object.keys(scoringOptions) as (keyof typeof scoringOptions)[]).map((factor) => (
                <ScoringFactorInput
                  key={factor}
                  label={factorLabels[factor]}
                  value={inputs[factor]}
                  options={scoringOptions[factor]}
                  onChange={(v) => setInputs({ ...inputs, [factor]: v })}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <CalculationNotes result={result} lang={lang} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {de ? "Abbrechen" : "Cancel"}
          </Button>
          <Button
            disabled={!service.service_name.trim()}
            onClick={() => { onSave(service, inputs); onOpenChange(false); }}
          >
            {de ? "Speichern" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceFormDialog;
