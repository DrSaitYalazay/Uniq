/**
 * QuantRiskPanel — FAIR quantitatives Risiko (E1) · sichtbares Feature.
 *
 * Rein additive Sektion für die Risk-Seite. Je Risiko lässt sich optional ein
 * FAIR-Szenario erfassen (light oder full). Aus erfassten Szenarien berechnet die
 * `fairEngine` on-demand (seed 12345, 20000 Draws):
 *   • je Szenario: ALE-Statistik (Min/Mean/P10/P50/P90/Max) + Loss-Exceedance-Kurve
 *   • Portfolio: Aggregation (ρ-Regler) → Gesamt-Exposure, Portfolio-LEC, Top-Treiber
 *     und optionale Risk-Appetite-Kurve mit Breach-Markierung.
 *
 * Ohne erfasste Szenarien ändert dieses Panel nirgends eine Zahl — es zeigt nur
 * seinen leeren Zustand. Persistenz der Szenario-Eingaben via useQuantRisk;
 * Läufe werden hier berechnet (quant_runs-Persistenz nicht nötig).
 */

import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { Calculator, Trash2, Save, TrendingUp, AlertTriangle } from "lucide-react";
import {
  simulateScenario, aggregatePortfolio, evaluateAppetite,
  type ScenarioResult, type LecPoint, type AppetitePoint, type Pert3, type LossForm,
  type FairFullInput,
} from "@/lib/fairEngine";
import type { FairInput } from "@/lib/riskQuantEngine";
import { useQuantRisk, type QuantScenario, type QuantMode } from "@/hooks/useQuantRisk";
import type { RiskObject } from "@/lib/riskEngine";

interface Props {
  risks: RiskObject[];
  de: boolean;
}

const DRAWS = 20000;
const SEED = 12345;
const PAGE_SIZE = 8;

const LOSS_FORMS: LossForm[] = [
  "productivity", "response", "replacement", "fines", "competitive", "reputation",
];
const LOSS_LABELS: Record<LossForm, { de: string; en: string }> = {
  productivity: { de: "Produktivität", en: "Productivity" },
  response:     { de: "Reaktion", en: "Response" },
  replacement:  { de: "Wiederbeschaffung", en: "Replacement" },
  fines:        { de: "Bußgelder", en: "Fines & Judgments" },
  competitive:  { de: "Wettbewerb", en: "Competitive advantage" },
  reputation:   { de: "Reputation", en: "Reputation" },
};

// ── Formatierung ──
function eur(v: number, de: boolean): string {
  if (!isFinite(v)) return "—";
  return new Intl.NumberFormat(de ? "de-DE" : "en-US", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(v || 0);
}
function eurShort(v: number, de: boolean): string {
  if (!isFinite(v)) return "";
  const abs = Math.abs(v);
  const loc = de ? "de-DE" : "en-US";
  if (abs >= 1e9) return `${(v / 1e9).toLocaleString(loc, { maximumFractionDigits: 1 })} Mrd €`;
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString(loc, { maximumFractionDigits: 1 })} Mio €`;
  if (abs >= 1e3) return `${(v / 1e3).toLocaleString(loc, { maximumFractionDigits: 0 })} Tsd €`;
  return `${Math.round(v)} €`;
}
function pct(p: number): string {
  return `${(p * 100).toFixed(p < 0.01 ? 2 : p < 0.1 ? 1 : 0)} %`;
}

// ── kleine Eingabefelder ──
function NumField({
  label, value, onChange, step = 1, min,
}: { label: string; value: number; onChange: (n: number) => void; step?: number; min?: number }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <input
        type="number" value={Number.isFinite(value) ? value : 0} step={step} min={min}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="h-8 w-full rounded border border-border bg-background px-2 text-[12px]"
      />
    </label>
  );
}

// PERT-Zeile (min/likely/max)
function PertRow({
  title, p, onChange, step = 1,
}: { title: string; p: Pert3; onChange: (p: Pert3) => void; step?: number }) {
  return (
    <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] items-end gap-2">
      <div className="text-[11px] font-medium text-foreground pb-1.5">{title}</div>
      <NumField label="Min" value={p.min} step={step} onChange={n => onChange({ ...p, min: n })} />
      <NumField label="Likely" value={p.likely} step={step} onChange={n => onChange({ ...p, likely: n })} />
      <NumField label="Max" value={p.max} step={step} onChange={n => onChange({ ...p, max: n })} />
    </div>
  );
}

const EMPTY_PERT: Pert3 = { min: 0, likely: 0, max: 0 };
const DEFAULT_LIGHT: FairInput = {
  lefMin: 0.1, lefLikely: 0.5, lefMax: 2,
  lmMin: 5000, lmLikely: 25000, lmMax: 150000,
} as FairInput;

// ── Szenario-Editor (je Risiko) ──
function ScenarioEditor({
  risk, existing, de, onSave, onDelete,
}: {
  risk: RiskObject;
  existing?: QuantScenario;
  de: boolean;
  onSave: (s: QuantScenario) => void;
  onDelete: () => void;
}) {
  const [mode, setMode] = useState<QuantMode>(existing?.mode ?? "light");
  const [light, setLight] = useState<FairInput>(
    existing && existing.mode === "light" ? (existing.inputs as FairInput) : { ...DEFAULT_LIGHT },
  );
  const [full, setFull] = useState<FairFullInput>(
    existing && existing.mode === "full"
      ? (existing.inputs as FairFullInput)
      : { tef: { ...EMPTY_PERT, likely: 1 }, vuln: { min: 0, likely: 0.5, max: 1 }, primary: {} },
  );
  const [group, setGroup] = useState<string>(existing?.correlation_group ?? "");
  const [showFull, setShowFull] = useState<boolean>((existing?.mode ?? "light") === "full");

  const save = () => {
    onSave({
      risk_id: risk.risk_id,
      mode,
      inputs: mode === "light" ? light : full,
      correlation_group: group.trim() || null,
    });
  };

  const setPrimary = (f: LossForm, p: Pert3) =>
    setFull(prev => ({ ...prev, primary: { ...prev.primary, [f]: p } }));

  return (
    <div className="space-y-4">
      {/* Modus-Umschalter */}
      <div className="flex items-center gap-2">
        {(["light", "full"] as QuantMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); if (m === "full") setShowFull(true); }}
            className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
              mode === m ? "bg-primary text-primary-foreground border-primary"
                         : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "light" ? (de ? "Vereinfacht (LEF × LM)" : "Light (LEF × LM)")
                           : (de ? "Voll (TEF/Vuln + Verluste)" : "Full (TEF/Vuln + losses)")}
          </button>
        ))}
      </div>

      {mode === "light" ? (
        <div className="space-y-3 rounded-lg border border-border bg-background/60 p-3">
          <div className="text-[11px] font-semibold text-foreground">
            {de ? "Verlustereignis-Frequenz (Ereignisse/Jahr)" : "Loss Event Frequency (events/year)"}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Min" value={light.lefMin} step={0.1} onChange={n => setLight(p => ({ ...p, lefMin: n }))} />
            <NumField label="Likely" value={light.lefLikely} step={0.1} onChange={n => setLight(p => ({ ...p, lefLikely: n }))} />
            <NumField label="Max" value={light.lefMax} step={0.1} onChange={n => setLight(p => ({ ...p, lefMax: n }))} />
          </div>
          <div className="text-[11px] font-semibold text-foreground pt-1">
            {de ? "Verlusthöhe je Ereignis (EUR)" : "Loss Magnitude per event (EUR)"}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumField label="Min" value={light.lmMin} step={1000} onChange={n => setLight(p => ({ ...p, lmMin: n }))} />
            <NumField label="Likely" value={light.lmLikely} step={1000} onChange={n => setLight(p => ({ ...p, lmLikely: n }))} />
            <NumField label="Max" value={light.lmMax} step={1000} onChange={n => setLight(p => ({ ...p, lmMax: n }))} />
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-background/60 p-3">
          <button
            onClick={() => setShowFull(s => !s)}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            {showFull ? (de ? "Voll-Editor einklappen" : "Collapse full editor")
                      : (de ? "Voll-Editor ausklappen" : "Expand full editor")}
          </button>
          {showFull && (
            <div className="space-y-3">
              <PertRow title={de ? "TEF (Bedrohungs-Frequenz /Jahr)" : "TEF (threat event freq. /yr)"}
                       p={full.tef ?? EMPTY_PERT} step={0.1}
                       onChange={p => setFull(prev => ({ ...prev, tef: p }))} />
              <PertRow title={de ? "Verwundbarkeit (0–1)" : "Vulnerability (0–1)"}
                       p={full.vuln ?? EMPTY_PERT} step={0.05}
                       onChange={p => setFull(prev => ({ ...prev, vuln: p }))} />
              <div className="text-[11px] font-semibold text-foreground pt-1 border-t border-border">
                {de ? "Primärverluste je Form (EUR)" : "Primary losses per form (EUR)"}
              </div>
              {LOSS_FORMS.map(f => (
                <PertRow key={f} title={LOSS_LABELS[f][de ? "de" : "en"]}
                         p={full.primary?.[f] ?? EMPTY_PERT} step={1000}
                         onChange={p => setPrimary(f, p)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Korrelationsgruppe + Aktionen */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">
            {de ? "Korrelationsgruppe (optional)" : "Correlation group (optional)"}
          </span>
          <input
            type="text" value={group} onChange={e => setGroup(e.target.value)}
            placeholder={de ? "z. B. Ransomware" : "e.g. ransomware"}
            className="h-8 w-48 rounded border border-border bg-background px-2 text-[12px]"
          />
        </label>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1" onClick={save}>
          <Save className="h-3.5 w-3.5" /> {de ? "Szenario speichern" : "Save scenario"}
        </Button>
        {existing && (
          <Button size="sm" variant="outline" className="h-8 gap-1 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" /> {de ? "Löschen" : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── ALE-Statistik + LEC (je Szenario) ──
function ScenarioResultView({ result, de }: { result: ScenarioResult; de: boolean }) {
  const s = result.stats;
  const cells: { label: string; value: number; tone?: string }[] = [
    { label: "Min", value: s.min },
    { label: "Ø (Mean)", value: s.mean, tone: "text-primary" },
    { label: "P10", value: s.p10 },
    { label: "P50", value: s.p50 },
    { label: "P90", value: s.p90, tone: "text-destructive/80" },
    { label: "Max", value: s.max, tone: "text-destructive" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {cells.map(c => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-2">
            <div className={`text-[13px] font-bold ${c.tone ?? "text-foreground"}`}>{eurShort(c.value, de)}</div>
            <div className="text-[10px] text-muted-foreground">{c.label} ALE</div>
          </div>
        ))}
      </div>
      <LecChart lec={result.lec} de={de} />
    </div>
  );
}

// ── Loss-Exceedance-Kurve (recharts) ──
function LecChart({
  lec, appetite, de,
}: { lec: LecPoint[]; appetite?: AppetitePoint[]; de: boolean }) {
  const data = useMemo(
    () => lec.map(pt => ({ x: pt.x, p: pt.p })),
    [lec],
  );
  const breaches = useMemo(
    () => (appetite && appetite.length ? evaluateAppetite(lec, appetite).breaches : []),
    [lec, appetite],
  );
  // Appetit-Kurve auf denselben x-Stützpunkten interpolieren (Anzeige).
  const appetiteData = useMemo(() => {
    if (!appetite || appetite.length === 0) return null;
    const { breaches: _b } = evaluateAppetite(lec, appetite);
    void _b;
    const pts = [...appetite].sort((a, b) => a.loss_eur - b.loss_eur);
    const first = pts[0], last = pts[pts.length - 1];
    const at = (x: number) => {
      if (x <= first.loss_eur) return first.max_annual_prob;
      if (x >= last.loss_eur) return last.max_annual_prob;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (x >= a.loss_eur && x <= b.loss_eur) {
          const t = (Math.log(x) - Math.log(a.loss_eur)) / (Math.log(b.loss_eur) - Math.log(a.loss_eur));
          const pa = Math.max(a.max_annual_prob, 1e-12), pb = Math.max(b.max_annual_prob, 1e-12);
          return pa * Math.pow(pb / pa, t);
        }
      }
      return last.max_annual_prob;
    };
    return lec.map(pt => ({ x: pt.x, a: at(pt.x) }));
  }, [lec, appetite]);

  const merged = useMemo(() => {
    if (!appetiteData) return data;
    return data.map((d, i) => ({ ...d, a: appetiteData[i]?.a }));
  }, [data, appetiteData]);

  if (data.length === 0) {
    return <div className="text-[11px] text-muted-foreground italic">{de ? "Keine Kurve." : "No curve."}</div>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          {breaches.map((b, i) => (
            <ReferenceArea key={i} x1={b.from} x2={b.to} fill="hsl(var(--destructive))" fillOpacity={0.08} />
          ))}
          <XAxis
            dataKey="x" type="number" scale="log" domain={["auto", "auto"]}
            tickFormatter={(v: number) => eurShort(v, de)}
            tick={{ fontSize: 10 }}
            label={{ value: de ? "Jahresverlust (EUR, log)" : "Annual loss (EUR, log)", position: "insideBottom", offset: -12, fontSize: 11 }}
          />
          <YAxis
            domain={[0, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)} %`}
            tick={{ fontSize: 10 }}
            label={{ value: de ? "P(Verlust > x)" : "P(loss > x)", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "p" || name === (de ? "Überschreitung" : "Exceedance")
                ? [pct(value), de ? "Überschreitung" : "Exceedance"]
                : [pct(value), de ? "Appetit" : "Appetite"]}
            labelFormatter={(v: number) => eur(v, de)}
            contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
          />
          {appetiteData && <Legend wrapperStyle={{ fontSize: 11 }} />}
          <Line type="monotone" dataKey="p" name={de ? "Überschreitung" : "Exceedance"}
                stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
          {appetiteData && (
            <Line type="monotone" dataKey="a" name={de ? "Appetit" : "Appetite"}
                  stroke="hsl(var(--destructive))" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Hauptpanel ──
export function QuantRiskPanel({ risks, de }: Props) {
  const { loading, error, scenarios, upsertScenario, deleteScenario } = useQuantRisk();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [rho, setRho] = useState(0.6);
  const [appetiteOn, setAppetiteOn] = useState(false);
  const [appetite, setAppetite] = useState<AppetitePoint[]>([
    { loss_eur: 100000, max_annual_prob: 0.2 },
    { loss_eur: 1000000, max_annual_prob: 0.02 },
  ]);

  const titleFor = (r: RiskObject) => (de ? r.gap_title : r.gap_title_en) || r.risk_id;

  // Ergebnisse je erfasstem Szenario (on-demand, seed-fix, deterministisch).
  const results = useMemo(() => {
    const m = new Map<string, ScenarioResult>();
    for (const [rid, sc] of scenarios) {
      try {
        m.set(rid, simulateScenario(sc.inputs as any, DRAWS, SEED));
      } catch {
        /* defekte Eingaben überspringen — keine Auswirkung anderswo */
      }
    }
    return m;
  }, [scenarios]);

  // Portfolio-Aggregation über alle erfassten Szenarien.
  const riskById = useMemo(() => {
    const m = new Map<string, RiskObject>();
    for (const r of risks) m.set(r.risk_id, r);
    return m;
  }, [risks]);

  const portfolio = useMemo(() => {
    const arr: { id: string; samples: Float64Array; group?: string | null }[] = [];
    for (const [rid, sc] of scenarios) {
      const res = results.get(rid);
      if (!res) continue;
      const label = riskById.get(rid) ? titleFor(riskById.get(rid)!) : rid;
      arr.push({ id: label, samples: res.samples, group: sc.correlation_group ?? null });
    }
    if (arr.length === 0) return null;
    return aggregatePortfolio(arr, rho, SEED);
  }, [scenarios, results, riskById, rho, de]);

  const appetiteForCurve = appetiteOn ? appetite : undefined;

  // Risiken mit Szenario zuerst, dann Rest.
  const ordered = useMemo(() => {
    const withSc = risks.filter(r => scenarios.has(r.risk_id));
    const without = risks.filter(r => !scenarios.has(r.risk_id));
    return [...withSc, ...without];
  }, [risks, scenarios]);

  const shown = ordered.slice(0, visible);
  const hasMore = ordered.length > visible;
  const count = scenarios.size;

  return (
    <div className="space-y-5">
      {/* Kopf / Erklärung */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calculator className="h-4 w-4 text-copper" />
          {de ? "Quantitatives Risiko (FAIR)" : "Quantitative risk (FAIR)"}
          {count > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {count} {de ? "Szenarien" : "scenarios"}
            </Badge>
          )}
        </div>
        <p className="text-[12px] text-muted-foreground mt-1">
          {de
            ? "Optional je Risiko ein FAIR-Szenario erfassen. Aus den Szenarien werden Monte-Carlo-Läufe (20.000 Iterationen, fester Seed) berechnet: ALE-Verteilung, Loss-Exceedance-Kurve und Portfolio-Exposure in Euro. Diese Sektion ist rein additiv — ohne Szenarien ändert sich an der qualitativen Analyse nichts."
            : "Optionally capture a FAIR scenario per risk. From the scenarios, Monte-Carlo runs (20,000 iterations, fixed seed) produce the ALE distribution, loss-exceedance curve and portfolio exposure in euro. This section is purely additive — without scenarios, the qualitative analysis is unchanged."}
        </p>
        {error && (
          <div className="mt-2 text-[11px] text-destructive">{error}</div>
        )}
      </div>

      {loading && (
        <div className="text-xs text-muted-foreground italic">
          {de ? "Szenarien werden geladen…" : "Loading scenarios…"}
        </div>
      )}

      {/* Portfolio-Sektion */}
      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <div className="text-sm font-medium text-foreground">
            {de ? "Noch keine quantitativen Szenarien" : "No quantitative scenarios yet"}
          </div>
          <div className="text-[12px] text-muted-foreground mt-1">
            {de
              ? "€-Exposure ab dem ersten Szenario — erfassen Sie unten je Risiko ein FAIR-Szenario."
              : "€ exposure starts with the first scenario — capture a FAIR scenario per risk below."}
          </div>
        </div>
      ) : portfolio && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-foreground">
              {de ? "Portfolio-Exposure" : "Portfolio exposure"}
            </div>
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {de ? "Korrelation ρ" : "Correlation ρ"}
              <input type="range" min={0} max={1} step={0.05} value={rho}
                     onChange={e => setRho(parseFloat(e.target.value))} className="w-32" />
              <span className="font-mono text-foreground w-8">{rho.toFixed(2)}</span>
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-lg font-bold text-primary">{eur(portfolio.stats.mean, de)}</div>
              <div className="text-[10px] text-muted-foreground">{de ? "Ø Jahres-ALE (Portfolio)" : "Avg annual ALE (portfolio)"}</div>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-lg font-bold text-destructive/80">{eur(portfolio.stats.p90, de)}</div>
              <div className="text-[10px] text-muted-foreground">P90 (Portfolio)</div>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-lg font-bold text-foreground">{eur(portfolio.stats.p50, de)}</div>
              <div className="text-[10px] text-muted-foreground">P50 (Median)</div>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="text-lg font-bold text-destructive">{eur(portfolio.stats.max, de)}</div>
              <div className="text-[10px] text-muted-foreground">Max</div>
            </div>
          </div>

          {/* Appetit-Steuerung */}
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
            <label className="flex items-center gap-1.5 text-[11px] text-foreground">
              <input type="checkbox" checked={appetiteOn} onChange={e => setAppetiteOn(e.target.checked)} />
              {de ? "Risikoappetit-Kurve" : "Risk-appetite curve"}
            </label>
            {appetiteOn && appetite.map((ap, i) => (
              <div key={i} className="flex items-end gap-1">
                <NumField label={`${de ? "Verlust" : "Loss"} €`} value={ap.loss_eur} step={10000}
                          onChange={n => setAppetite(prev => prev.map((x, j) => j === i ? { ...x, loss_eur: n } : x))} />
                <NumField label={de ? "max. p/J" : "max p/yr"} value={ap.max_annual_prob} step={0.01}
                          onChange={n => setAppetite(prev => prev.map((x, j) => j === i ? { ...x, max_annual_prob: n } : x))} />
              </div>
            ))}
            {appetiteOn && (() => {
              const ev = evaluateAppetite(portfolio.lec, appetite);
              return ev.ok ? (
                <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary">
                  {de ? "im Appetit" : "within appetite"}
                </Badge>
              ) : (
                <Badge className="text-[10px] bg-destructive/85 text-destructive-foreground gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {ev.breaches.length} {de ? "Überschreitung(en)" : "breach(es)"}
                </Badge>
              );
            })()}
          </div>

          {/* Portfolio-LEC */}
          <LecChart lec={portfolio.lec} appetite={appetiteForCurve} de={de} />

          {/* Top-Treiber */}
          <div>
            <div className="text-[12px] font-semibold text-foreground mb-2">
              {de ? "Top-Treiber (Exposure-Anteil)" : "Top drivers (exposure share)"}
            </div>
            <div className="space-y-1.5">
              {portfolio.groups.slice(0, 8).map((g, i) => (
                <div key={g.id + i} className="flex items-center gap-2">
                  <div className="text-[11px] text-muted-foreground w-5">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-foreground truncate">{g.id}</span>
                      <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                        {eurShort(g.exposure, de)} · {pct(g.share)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted mt-0.5 overflow-hidden">
                      <div className="h-full bg-copper" style={{ width: `${Math.min(100, g.share * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Je-Risiko-Editorliste */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-foreground">
          {de ? "Szenarien je Risiko" : "Scenarios per risk"}
        </div>
        {risks.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">
            {de ? "Keine Risiken vorhanden." : "No risks available."}
          </div>
        ) : (
          <>
            <Accordion type="multiple" className="space-y-2">
              {shown.map(r => {
                const sc = scenarios.get(r.risk_id);
                const res = sc ? results.get(r.risk_id) : undefined;
                return (
                  <AccordionItem key={r.risk_id} value={r.risk_id}
                                 className="rounded-lg border border-border bg-card overflow-hidden">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex flex-wrap items-center gap-2 text-left flex-1 pr-2">
                        <span className="font-semibold text-foreground text-sm">{titleFor(r)}</span>
                        {sc ? (
                          <>
                            <Badge variant="secondary" className="text-[10px]">
                              {sc.mode === "light" ? (de ? "vereinfacht" : "light") : (de ? "voll" : "full")}
                            </Badge>
                            {res && (
                              <Badge variant="outline" className="text-[10px]">
                                Ø {eurShort(res.stats.mean, de)} · P90 {eurShort(res.stats.p90, de)}
                              </Badge>
                            )}
                            {sc.correlation_group && (
                              <Badge variant="outline" className="text-[10px]">⚭ {sc.correlation_group}</Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            {de ? "kein Szenario" : "no scenario"}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 space-y-4">
                      <ScenarioEditor
                        risk={r} existing={sc} de={de}
                        onSave={s => upsertScenario(s)}
                        onDelete={() => deleteScenario(r.risk_id)}
                      />
                      {res && (
                        <div className="border-t border-border pt-3">
                          <ScenarioResultView result={res} de={de} />
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            {hasMore && (
              <div className="flex justify-center pt-1">
                <Button size="sm" variant="outline"
                        onClick={() => setVisible(v => Math.min(ordered.length, v + PAGE_SIZE))}>
                  {de ? `Weitere ${Math.min(PAGE_SIZE, ordered.length - visible)} anzeigen`
                      : `Show ${Math.min(PAGE_SIZE, ordered.length - visible)} more`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuantRiskPanel;
