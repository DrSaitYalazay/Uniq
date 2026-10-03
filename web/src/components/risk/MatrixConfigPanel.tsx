/**
 * MatrixConfigPanel — Formula, palette and threshold configuration for the
 * 5×5 risk matrix. Emits a full RiskMatrixConfig via onChange; thresholds
 * are recomputed automatically when formula changes so the user rarely
 * needs to touch them.
 */
import { useMemo } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  colorPalettes, themeMatrixPalette, DEFAULT_RISK_CONFIG, buildScaleForSize,
  getDefaultThresholds, getMaxScore,
  type ColorPalette, type RiskMatrixConfig,
} from "@/lib/riskEngine";

interface Props {
  config: RiskMatrixConfig;
  palette: ColorPalette;
  onConfigChange: (c: RiskMatrixConfig) => void;
  onPaletteChange: (p: ColorPalette) => void;
  de: boolean;
}

const FORMULAS: { value: "multiply" | "sum" | "max"; de: string; en: string }[] = [
  { value: "multiply", de: "Multiplikation (L × I)", en: "Multiplication (L × I)" },
  { value: "sum",      de: "Addition (L + I)",       en: "Addition (L + I)" },
  { value: "max",      de: "Maximum (max L, I)",     en: "Maximum (max L, I)" },
];

const SIZES = [3, 4, 5] as const;

export function MatrixConfigPanel({ config, palette, onConfigChange, onPaletteChange, de }: Props) {
  const dims = config.dimensions ?? { rows: 5, cols: 5 };
  const maxScore = useMemo(
    () => getMaxScore(config.formula, dims.cols, dims.rows),
    [config.formula, dims.cols, dims.rows],
  );

  const setFormula = (formula: "multiply" | "sum" | "max") => {
    onConfigChange({
      ...config,
      formula,
      thresholds: getDefaultThresholds(formula, dims.cols, dims.rows),
    });
  };

  const setSize = (size: number) => {
    onConfigChange({
      ...config,
      dimensions: { rows: size, cols: size },
      likelihoodScale: buildScaleForSize(size, "likelihood"),
      impactScale: buildScaleForSize(size, "impact"),
      thresholds: getDefaultThresholds(config.formula, size, size),
    });
  };

  const setThreshold = (key: "low_max" | "medium_max" | "high_max", value: number) => {
    onConfigChange({ ...config, thresholds: { ...config.thresholds, [key]: value } });
  };

  const resetDefaults = () => {
    onConfigChange(DEFAULT_RISK_CONFIG);
    onPaletteChange(themeMatrixPalette());
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-foreground">
          {de ? "Matrix-Konfiguration" : "Matrix configuration"}
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-[10px] text-muted-foreground hover:text-foreground underline"
        >
          {de ? "Standard wiederherstellen" : "Reset to defaults"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {/* Formula */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">
            {de ? "Formel" : "Formula"}
          </label>
          <Select value={config.formula} onValueChange={v => setFormula(v as any)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FORMULAS.map(f => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {de ? f.de : f.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Size */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground">
            {de ? "Größe" : "Size"}
          </label>
          <Select value={String(dims.cols)} onValueChange={v => setSize(Number(v))}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SIZES.map(s => (
                <SelectItem key={s} value={String(s)} className="text-xs">
                  {s} × {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Palette */}
        <div className="space-y-1 col-span-2">
          <label className="text-[10px] font-semibold text-muted-foreground">
            {de ? "Farbpalette" : "Color palette"}
          </label>
          <Select
            value={palette.id}
            onValueChange={v => {
              // Immer frisch abrufen: die Themenfarbe folgt Akzent und Diagramm-Modus.
              const p = colorPalettes().find(x => x.id === v);
              if (p) onPaletteChange(p);
            }}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {colorPalettes().map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.low }} />
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.medium }} />
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.high }} />
                    <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.critical }} />
                    <span className="ml-1">{de ? p.labelDe : p.labelEn}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Thresholds */}
      <div className="grid grid-cols-3 gap-2">
        <ThresholdField label={de ? "Niedrig ≤" : "Low ≤"} value={config.thresholds.low_max} max={maxScore}
                        onChange={v => setThreshold("low_max", v)} />
        <ThresholdField label={de ? "Mittel ≤" : "Medium ≤"} value={config.thresholds.medium_max} max={maxScore}
                        onChange={v => setThreshold("medium_max", v)} />
        <ThresholdField label={de ? "Hoch ≤" : "High ≤"} value={config.thresholds.high_max} max={maxScore}
                        onChange={v => setThreshold("high_max", v)} />
      </div>
      <div className="text-[10px] text-muted-foreground">
        {de ? `Maximal möglicher Score: ${maxScore}. Werte darüber = Kritisch.` : `Maximum possible score: ${maxScore}. Above = Critical.`}
      </div>
    </div>
  );
}

function ThresholdField({
  label, value, max, onChange,
}: {
  label: string; value: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-muted-foreground">{label}</label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="h-8 text-xs"
      />
    </div>
  );
}
