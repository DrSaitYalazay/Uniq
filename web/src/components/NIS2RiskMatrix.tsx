import { useMemo } from "react";
import { AlertTriangle, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToolData } from "@/hooks/useToolData";
import ToolSaveBar from "@/components/ToolSaveBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "cws-risk-matrix";

type RiskClassKey = "low" | "medium" | "high" | "critical";

interface RiskRow {
  id: string;
  scenarioDe: string;
  scenarioEn: string;
  owner: string;
  treatmentDe: string;
  treatmentEn: string;
  impact: number;
  likelihood: number;
  notes: string;
}

interface RiskMatrixState {
  levelsDe: string[];
  levelsEn: string[];
  cells: RiskClassKey[][];
  rows: RiskRow[];
}

const riskClassLabels: Record<RiskClassKey, { de: string; en: string }> = {
  low: { de: "Niedrig", en: "Low" },
  medium: { de: "Mittel", en: "Medium" },
  high: { de: "Hoch", en: "High" },
  critical: { de: "Kritisch", en: "Critical" },
};

const riskClassStyles: Record<RiskClassKey, string> = {
  low: "bg-success/15 text-success border-success/20",
  medium: "bg-accent text-accent-foreground border-primary/15",
  high: "bg-partial/15 text-partial border-partial/25",
  critical: "bg-destructive/15 text-destructive border-destructive/25",
};

const defaultState: RiskMatrixState = {
  levelsDe: ["Niedrig", "Mittel", "Hoch"],
  levelsEn: ["Low", "Medium", "High"],
  cells: [
    ["low", "medium", "medium"],
    ["medium", "high", "critical"],
    ["medium", "critical", "critical"],
  ],
  rows: [
    {
      id: "risk-1",
      scenarioDe: "Ausfall kritischer IT-Systeme durch Ransomware",
      scenarioEn: "Failure of critical IT systems due to ransomware",
      owner: "CISO / IT-Leitung",
      treatmentDe: "Backup-Strategie & Offline-Kopien",
      treatmentEn: "Backup strategy & offline copies",
      impact: 2,
      likelihood: 1,
      notes: "",
    },
    {
      id: "risk-2",
      scenarioDe: "Diebstahl von Zugangsdaten durch Phishing",
      scenarioEn: "Theft of credentials via phishing",
      owner: "IT-Sicherheit",
      treatmentDe: "MFA-Einführung & Security Awareness",
      treatmentEn: "MFA implementation & security awareness",
      impact: 1,
      likelihood: 2,
      notes: "",
    },
    {
      id: "risk-3",
      scenarioDe: "Datenabfluss durch Fehlkonfiguration von Cloud-Diensten",
      scenarioEn: "Data leakage due to cloud service misconfiguration",
      owner: "Cloud Architect",
      treatmentDe: "Regelmäßige Audits & IAM-Review",
      treatmentEn: "Regular audits & IAM review",
      impact: 2,
      likelihood: 1,
      notes: "",
    },
    {
      id: "risk-4",
      scenarioDe: "Unterbrechung der Lieferkette durch kritische Software-Zulieferer",
      scenarioEn: "Supply chain disruption caused by critical software vendors",
      owner: "Einkauf / Compliance",
      treatmentDe: "Lieferantenprüfung & Exit-Plan",
      treatmentEn: "Vendor due diligence & exit plan",
      impact: 1,
      likelihood: 1,
      notes: "",
    },
  ],
};

const priorityLabel = (riskClass: RiskClassKey) => {
  if (riskClass === "critical") return "P1";
  if (riskClass === "high") return "P1";
  if (riskClass === "medium") return "P2";
  return "P3";
};

const NIS2RiskMatrix = () => {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { data, setData, saveToCloud, resetAndDeleteCloud, loading, lastSaved } = useToolData<RiskMatrixState>(
    "nis2-risk-matrix",
    STORAGE_KEY,
    defaultState,
  );

  const levels = de ? data.levelsDe : data.levelsEn;

  const getRiskClass = (impact: number, likelihood: number): RiskClassKey => {
    return data.cells[impact]?.[likelihood] ?? "medium";
  };

  const summary = useMemo(() => {
    return data.rows.reduce(
      (acc, row) => {
        const riskClass = getRiskClass(row.impact, row.likelihood);
        acc.total += 1;
        acc[riskClass] += 1;
        return acc;
      },
      { total: 0, low: 0, medium: 0, high: 0, critical: 0 } as Record<"total" | RiskClassKey, number>,
    );
  }, [data.rows, data.cells]);

  const updateLevel = (index: number, value: string) => {
    setData((prev) => {
      const next = {
        ...prev,
        levelsDe: [...prev.levelsDe],
        levelsEn: [...prev.levelsEn],
      };

      if (de) next.levelsDe[index] = value;
      else next.levelsEn[index] = value;

      return next;
    });
  };

  const updateCell = (impactIndex: number, likelihoodIndex: number, value: RiskClassKey) => {
    setData((prev) => ({
      ...prev,
      cells: prev.cells.map((row, rowIndex) =>
        rowIndex === impactIndex
          ? row.map((cell, cellIndex) => (cellIndex === likelihoodIndex ? value : cell))
          : row,
      ),
    }));
  };

  const updateRow = (id: string, patch: Partial<RiskRow>) => {
    setData((prev) => ({
      ...prev,
      rows: prev.rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    }));
  };

  const addRow = () => {
    setData((prev) => ({
      ...prev,
      rows: [
        ...prev.rows,
        {
          id: crypto.randomUUID(),
          scenarioDe: "Neues Risikoszenario",
          scenarioEn: "New risk scenario",
          owner: "",
          treatmentDe: "",
          treatmentEn: "",
          impact: 1,
          likelihood: 1,
          notes: "",
        },
      ],
    }));
  };

  const removeRow = (id: string) => {
    setData((prev) => ({
      ...prev,
      rows: prev.rows.filter((row) => row.id !== id),
    }));
  };

  return (
    <section className="bg-card rounded-2xl border border-border card-elevated p-5 sm:p-6 mb-8 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
            <ShieldAlert className="h-3.5 w-3.5" />
            {de ? "RISIKOMANAGEMENT" : "RISK MANAGEMENT"}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground">
              {de ? "NIS2 Risikomatrix & Bewertung" : "NIS2 Risk Matrix & Assessment"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {de
                ? "Für NIS2 ist eine nachvollziehbare Bewertung von Eintrittswahrscheinlichkeit und Auswirkung entscheidend. Diese Matrix ist bewusst pragmatisch aufgebaut: kleine und mittlere Organisationen können Risiken schnell erfassen, priorisieren und an ihre eigene Realität anpassen."
                : "For NIS2, a traceable assessment of likelihood and impact is essential. This matrix is intentionally pragmatic: small and mid-sized organizations can capture, prioritize, and adapt risks to their own operating reality quickly."}
            </p>
          </div>
        </div>
      </div>

      <ToolSaveBar
        onSave={saveToCloud}
        onReset={resetAndDeleteCloud}
        loading={loading}
        lastSaved={lastSaved}
      />

      <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-background/40 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {de ? "Matrix-Konfiguration" : "Matrix Configuration"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {de
                  ? "Passen Sie Bewertungsstufen und Risikoklassen an Ihre interne Methodik an."
                  : "Adjust impact levels and risk classes to fit your internal methodology."}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {levels.map((level, index) => (
                <div key={`${level}-${index}`} className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {de ? `Stufe ${index + 1}` : `Level ${index + 1}`}
                  </label>
                  <Input value={level} onChange={(event) => updateLevel(index, event.target.value)} />
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-4 bg-muted/30">
                <div className="p-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  {de ? "Impact ↓ / Likelihood →" : "Impact ↓ / Likelihood →"}
                </div>
                {levels.map((level, index) => (
                  <div key={`likelihood-${index}`} className="p-3 text-center text-xs font-semibold text-foreground border-l border-border/60">
                    {level}
                  </div>
                ))}
              </div>

              {levels.map((impactLevel, impactIndex) => (
                <div key={`impact-${impactIndex}`} className="grid grid-cols-4 border-t border-border/60">
                  <div className="p-3 text-xs font-semibold text-foreground bg-muted/20">
                    {impactLevel}
                  </div>

                  {levels.map((_, likelihoodIndex) => {
                    const cellValue = data.cells[impactIndex]?.[likelihoodIndex] ?? "medium";
                    return (
                      <div key={`cell-${impactIndex}-${likelihoodIndex}`} className="p-2 border-l border-border/60 bg-card">
                        <Select value={cellValue} onValueChange={(value: RiskClassKey) => updateCell(impactIndex, likelihoodIndex, value)}>
                          <SelectTrigger className={cn("h-9 text-xs border", riskClassStyles[cellValue])}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(riskClassLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {de ? label.de : label.en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {([
              ["critical", summary.critical],
              ["high", summary.high],
              ["medium", summary.medium],
              ["low", summary.low],
            ] as [RiskClassKey, number][]).map(([key, value]) => (
              <div key={key} className={cn("rounded-2xl border p-4", riskClassStyles[key])}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs font-semibold mt-1">{de ? riskClassLabels[key].de : riskClassLabels[key].en}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-bold text-foreground">
              {de ? "Empfohlene Nutzung" : "Recommended Use"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {de
                ? "Beginnen Sie mit allen Risiken, die als „Kritisch“ oder „Hoch“ eingestuft sind. Für diese Einträge sollten Verantwortliche, Maßnahmen und eine dokumentierte Entscheidung zur Behandlung oder Akzeptanz festgelegt werden."
                : "Start with all risks classified as “Critical” or “High”. For those items, define an owner, treatment action, and a documented decision on mitigation or acceptance."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
            <p className="text-sm font-bold text-foreground">
              {de ? "Warum diese Matrix?" : "Why this matrix?"}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {de
                ? "Die gewählte 3×3-Struktur ist für NIS2-Programme meist der beste Kompromiss aus Einfachheit, Dokumentierbarkeit und Management-Tauglichkeit. Sie reicht aus, um Maßnahmen zu priorisieren, ohne Teams mit einer zu komplexen Methodik auszubremsen."
                : "The chosen 3×3 structure is usually the best balance for NIS2 programs: simple enough to use, structured enough to document, and clear enough for management prioritization without slowing teams down."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {de ? "Risikoregister" : "Risk Register"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {de
                ? "Bearbeiten Sie Szenarien, Verantwortliche und Maßnahmen direkt. Die Risikoklasse wird aus der Matrix berechnet."
                : "Edit scenarios, owners, and treatments directly. The risk class is calculated from the matrix."}
            </p>
          </div>

          <Button variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4" />
            {de ? "Risiko hinzufügen" : "Add risk"}
          </Button>
        </div>

        <div className="space-y-3">
          {data.rows.map((row, index) => {
            const riskClass = getRiskClass(row.impact, row.likelihood);

            return (
              <div key={row.id} className="rounded-2xl border border-border bg-background/40 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {de ? `Risiko ${index + 1}` : `Risk ${index + 1}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", riskClassStyles[riskClass])}>
                        {de ? riskClassLabels[riskClass].de : riskClassLabels[riskClass].en}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        {priorityLabel(riskClass)}
                      </span>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} aria-label={de ? "Risiko löschen" : "Delete risk"}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid lg:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{de ? "Szenario (DE)" : "Scenario (DE)"}</label>
                    <Input value={row.scenarioDe} onChange={(event) => updateRow(row.id, { scenarioDe: event.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{de ? "Scenario (EN)" : "Scenario (EN)"}</label>
                    <Input value={row.scenarioEn} onChange={(event) => updateRow(row.id, { scenarioEn: event.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{de ? "Verantwortlich" : "Owner"}</label>
                    <Input value={row.owner} onChange={(event) => updateRow(row.id, { owner: event.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{de ? "Auswirkung" : "Impact"}</label>
                      <Select value={String(row.impact)} onValueChange={(value) => updateRow(row.id, { impact: Number(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level, levelIndex) => (
                            <SelectItem key={`impact-option-${levelIndex}`} value={String(levelIndex)}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">{de ? "Wahrscheinlichkeit" : "Likelihood"}</label>
                      <Select value={String(row.likelihood)} onValueChange={(value) => updateRow(row.id, { likelihood: Number(value) })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map((level, levelIndex) => (
                            <SelectItem key={`likelihood-option-${levelIndex}`} value={String(levelIndex)}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{de ? "Maßnahme (DE)" : "Treatment (DE)"}</label>
                    <Input value={row.treatmentDe} onChange={(event) => updateRow(row.id, { treatmentDe: event.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">{de ? "Treatment (EN)" : "Treatment (EN)"}</label>
                    <Input value={row.treatmentEn} onChange={(event) => updateRow(row.id, { treatmentEn: event.target.value })} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{de ? "Notizen / Begründung" : "Notes / Rationale"}</label>
                  <Textarea
                    value={row.notes}
                    onChange={(event) => updateRow(row.id, { notes: event.target.value })}
                    placeholder={de ? "Akzeptanz, Frist, Nachweis oder nächste Maßnahme dokumentieren..." : "Document acceptance, deadline, evidence, or next treatment action..."}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-partial/25 bg-partial/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-partial mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {de
            ? "Tipp: Nutzen Sie diese Matrix als kompaktes Risikoregister für Leitungsfreigaben, Maßnahmenplanung und jährliche Neubewertungen im Rahmen Ihres NIS2-Programms."
            : "Tip: Use this matrix as a compact risk register for management sign-off, treatment planning, and annual reassessments within your NIS2 program."}
        </p>
      </div>
    </section>
  );
};

export default NIS2RiskMatrix;