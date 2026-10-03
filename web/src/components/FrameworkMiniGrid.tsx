/**
 * FrameworkMiniGrid — wiederverwendbares „Aufschlüsselung je Framework"-Raster
 * im Umsetzung-Standard: pro Framework ein kleiner Donut (mit %-Wert in der Mitte)
 * und die Zahlen daneben. EINE Quelle, damit alle Seiten identisch aussehen.
 */
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip } from "recharts";

import { CHART_EMPTY } from "@/lib/chartPalette";
export interface FwMiniItem {
  key: string;
  label: string;
  /** Prozentwert in der Donut-Mitte (0–100). */
  pct: number;
  /** Donut-Segmente (nur value>0 werden gezeichnet). */
  donut: { name: string; value: number; color: string }[];
  /** Zeilen mit Farb-Swatch + Zahl rechts. */
  rows: { label: string; value: number | string; color: string }[];
  /** Optionale Fußzeile (z. B. „Anwendbar: N"). */
  footer?: { label: string; value: number | string };
  /** Optionaler Klick (z. B. Framework fokussieren). */
  onClick?: () => void;
}

export function FrameworkMiniGrid({ items, title, subtitle }: { items: FwMiniItem[]; title?: string; subtitle?: string }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {title && (
        <div className="text-sm font-semibold text-foreground">
          {title}
          {subtitle && <span className="ml-2 text-xs font-normal text-muted-foreground">{subtitle}</span>}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map(it => {
          const data = it.donut.filter(d => d.value > 0);
          const dd = data.length ? data : [{ name: "-", value: 1, color: CHART_EMPTY }];
          const Tag: any = it.onClick ? "button" : "div";
          return (
            <Tag
              key={it.key}
              onClick={it.onClick}
              className={`flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 hover:border-accent hover:shadow-sm transition-all ${it.onClick ? "text-left w-full cursor-pointer" : ""}`}
            >
              <div className="relative w-24 h-24 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={dd} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={44} paddingAngle={2}>
                      {dd.map((d, i) => <Cell key={i} fill={(d as any).color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                    </Pie>
                    <RTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold tabular-nums text-foreground">{it.pct}%</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground truncate" title={it.label}>{it.label}</div>
                <div className="mt-1.5 space-y-1 text-xs">
                  {it.rows.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: r.color }} />
                      <span className="text-muted-foreground">{r.label}</span>
                      <b className="ml-auto tabular-nums text-foreground">{r.value}</b>
                    </div>
                  ))}
                  {it.footer && (
                    <div className="flex items-center justify-between pt-1 mt-1 border-t border-border">
                      <span className="text-muted-foreground">{it.footer.label}</span>
                      <b className="tabular-nums text-foreground">{it.footer.value}</b>
                    </div>
                  )}
                </div>
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
