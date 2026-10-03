/**
 * RiskHeatmap — N×M SVG matrix (impact × likelihood). Bucketizes a
 * RiskAnalysisResult into cells and shades by risk_level. Accepts an
 * optional ColorPalette; falls back to semantic HSL tokens.
 */
import type { RiskAnalysisResult, RiskObject, RiskLevel, ColorPalette } from "@/lib/riskEngine";

interface Props {
  result: RiskAnalysisResult;
  de: boolean;
  palette?: ColorPalette;
  onCellClick?: (risks: RiskObject[]) => void;
  /** Per-cell manual color override, keyed by `${likelihood}-${impact}`. */
  cellOverrides?: Record<string, RiskLevel>;
  /** Called when the user clicks a cell to cycle its color. */
  onCellCycle?: (likelihood: number, impact: number) => void;
  /** Risikoappetit: gibt true zurück, wenn die Zelle ÜBER dem Appetit liegt. */
  isOverAppetite?: (likelihood: number, impact: number, level: "low" | "medium" | "high" | "critical") => boolean;
  /** Linien-Modus aktiv: Klick schaltet Zelle akzeptabel↔über-Appetit statt Farbe. */
  appetiteEdit?: boolean;
  /** Klick im Linien-Modus. */
  onToggleAppetiteCell?: (likelihood: number, impact: number) => void;
}

const FALLBACK_FILL: Record<string, string> = {
  critical: "hsl(var(--destructive) / 0.85)",
  high:     "hsl(var(--destructive) / 0.45)",
  medium:   "hsl(var(--accent) / 0.55)",
  low:      "hsl(var(--muted) / 0.7)",
  empty:    "hsl(var(--muted) / 0.25)",
};

function levelFillMap(palette?: ColorPalette): Record<string, string> {
  if (!palette) return FALLBACK_FILL;
  return {
    critical: palette.critical,
    high:     palette.high,
    medium:   palette.medium,
    low:      palette.low,
    empty:    "hsl(var(--muted) / 0.25)",
  };
}

function cellLevel(cells: RiskObject[]): "critical" | "high" | "medium" | "low" | "empty" {
  if (cells.some(r => r.risk_level === "critical")) return "critical";
  if (cells.some(r => r.risk_level === "high"))     return "high";
  if (cells.some(r => r.risk_level === "medium"))   return "medium";
  if (cells.length > 0)                              return "low";
  return "empty";
}

function scoreFor(l: number, i: number, formula: "multiply" | "sum" | "max"): number {
  if (formula === "sum") return l + i;
  if (formula === "max") return Math.max(l, i);
  return l * i;
}

function levelForScore(score: number, t: { low_max: number; medium_max: number; high_max: number }): "critical" | "high" | "medium" | "low" {
  if (score <= t.low_max) return "low";
  if (score <= t.medium_max) return "medium";
  if (score <= t.high_max) return "high";
  return "critical";
}


export function RiskHeatmap({ result, de, palette, onCellClick, cellOverrides, onCellCycle, isOverAppetite, appetiteEdit, onToggleAppetiteCell }: Props) {
  const fill = levelFillMap(palette);
  const dims = result.config.dimensions ?? { rows: 5, cols: 5 };
  const cellW = 60, cellH = 44, padL = 88, padT = 22, padB = 34;
  const w = padL + dims.cols * cellW + 12;
  const h = padT + dims.rows * cellH + padB;


  const buckets: RiskObject[][][] = Array.from({ length: dims.rows }, () =>
    Array.from({ length: dims.cols }, () => [] as RiskObject[]),
  );
  for (const r of result.risks) {
    const li = Math.min(dims.cols - 1, Math.max(0, r.likelihood - 1));
    const ii = Math.min(dims.rows - 1, Math.max(0, r.impact - 1));
    // impact axis is Y — display high impact at top
    const row = dims.rows - 1 - ii;
    buckets[row][li].push(r);
  }

  // Über-Appetit-Raster (je Zelle) — für Grenzlinie + Hervorhebung.
  const over: boolean[][] = Array.from({ length: dims.rows }, (_r, ri) =>
    Array.from({ length: dims.cols }, (_c, ci) => {
      if (!isOverAppetite) return false;
      const likelihood = ci + 1;
      const impact = dims.rows - ri;
      const key = `${likelihood}-${impact}`;
      const ovLvl = cellOverrides?.[key];
      const lvl = ovLvl ?? levelForScore(scoreFor(likelihood, impact, result.config.formula), result.config.thresholds);
      return isOverAppetite(likelihood, impact, lvl);
    }),
  );

  return (
    <div className="w-full overflow-x-auto">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={de ? "Risikomatrix 5×5" : "5×5 Risk matrix"}>
        {/* Axis titles */}
        <text x={padL + (dims.cols * cellW) / 2} y={h - 6} textAnchor="middle"
              fontSize="11" fill="hsl(var(--muted-foreground))">
          {de ? "Eintrittswahrscheinlichkeit →" : "Likelihood →"}
        </text>
        <text x={12} y={padT + (dims.rows * cellH) / 2}
              transform={`rotate(-90 12 ${padT + (dims.rows * cellH) / 2})`}
              textAnchor="middle" fontSize="11" fill="hsl(var(--muted-foreground))">
          {de ? "Auswirkung →" : "Impact →"}
        </text>

        {/* Cells */}
        {buckets.map((row, ri) => row.map((cells, ci) => {
          const likelihood = ci + 1;
          const impact = dims.rows - ri;
          const key = `${likelihood}-${impact}`;
          const override = cellOverrides?.[key];
          const baseScore = scoreFor(likelihood, impact, result.config.formula);
          const baseLevel = levelForScore(baseScore, result.config.thresholds);
          const autoLvl = cells.length > 0 ? cellLevel(cells) : baseLevel;
          const lvl = override ?? autoLvl;
          const x = padL + ci * cellW;
          const y = padT + ri * cellH;
          const hasRisks = cells.length > 0;
          const isOver = over[ri][ci];
          const clickable = appetiteEdit ? !!onToggleAppetiteCell : (!!onCellCycle || (hasRisks && !!onCellClick));
          const handleClick = () => {
            if (appetiteEdit && onToggleAppetiteCell) { onToggleAppetiteCell(likelihood, impact); return; }
            if (onCellCycle) onCellCycle(likelihood, impact);
            else if (hasRisks && onCellClick) onCellClick(cells);
          };
          return (
            <g key={`${ri}-${ci}`}
               style={{ cursor: clickable ? "pointer" : "default" }}
               onClick={handleClick}>
              <rect x={x} y={y} width={cellW - 2} height={cellH - 2}
                    rx={4} fill={fill[lvl]}
                    fillOpacity={override ? 1 : hasRisks ? 1 : 0.45}
                    stroke={override ? "hsl(var(--foreground))" : "hsl(var(--border))"}
                    strokeWidth={override ? 1.2 : 0.5} />
              {isOver && (
                <rect x={x} y={y} width={cellW - 2} height={cellH - 2} rx={4}
                      fill="hsl(var(--destructive) / 0.10)" stroke="none" pointerEvents="none" />
              )}
              {hasRisks && (
                <text x={x + (cellW - 2) / 2} y={y + (cellH - 2) / 2 + 4}
                      textAnchor="middle" fontSize="13" fontWeight="700"
                      fill="hsl(var(--foreground))">
                  {cells.length}
                </text>
              )}
            </g>
          );
        }))}

        {/* Risikoappetit-Grenze — gestrichelte rote Linie zwischen akzeptabel und über-Appetit */}
        {isOverAppetite && over.flatMap((row, ri) => row.flatMap((isOv, ci) => {
          if (isOv) return [] as any[];
          const x = padL + ci * cellW;
          const y = padT + ri * cellH;
          const segs: any[] = [];
          if (ri > 0 && over[ri - 1][ci]) segs.push(
            <line key={`ft-${ri}-${ci}`} x1={x} y1={y} x2={x + cellW - 2} y2={y}
                  stroke="hsl(var(--destructive))" strokeWidth={2.5} strokeDasharray="5 3" pointerEvents="none" />);
          if (ci < dims.cols - 1 && over[ri][ci + 1]) segs.push(
            <line key={`fr-${ri}-${ci}`} x1={x + cellW - 2} y1={y} x2={x + cellW - 2} y2={y + cellH - 2}
                  stroke="hsl(var(--destructive))" strokeWidth={2.5} strokeDasharray="5 3" pointerEvents="none" />);
          return segs;
        }))}

        {/* Column labels (likelihood 1..cols) */}
        {Array.from({ length: dims.cols }).map((_, ci) => (
          <text key={`cl-${ci}`} x={padL + ci * cellW + (cellW - 2) / 2}
                y={padT - 6} textAnchor="middle" fontSize="10"
                fill="hsl(var(--muted-foreground))">{ci + 1}</text>
        ))}
        {/* Row labels (impact rows -> reverse) */}
        {Array.from({ length: dims.rows }).map((_, ri) => (
          <text key={`rl-${ri}`} x={padL - 8}
                y={padT + ri * cellH + (cellH - 2) / 2 + 4}
                textAnchor="end" fontSize="10"
                fill="hsl(var(--muted-foreground))">{dims.rows - ri}</text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
        {(["critical", "high", "medium", "low"] as const).map(l => (
          <div key={l} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: fill[l] }} />
            {de
              ? ({ critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" } as const)[l]
              : ({ critical: "Critical", high: "High", medium: "Medium", low: "Low" } as const)[l]}
          </div>
        ))}
      </div>
    </div>
  );
}
