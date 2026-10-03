/**
 * ToolStatusChart — kleine Überblick-Grafik (Donut oder Balken) für Werkzeuge.
 * Produktregel: jeder Überblick hat eine Hauptgrafik in Statusfarben
 * (`CHART_STATUS` / `CHART_SEVERITY` aus @/lib/chartPalette), kein Regenbogen.
 *
 * Verwendung:
 *   <ToolStatusChart title="Dokumente" items={[{ label: "gültig", value: 7, color: CHART_STATUS.ja }, …]} />
 */
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { CHART_EMPTY, CHART_AXIS } from "@/lib/chartPalette";

export interface ToolChartItem { label: string; value: number; color: string }

interface Props {
  title: string;
  subtitle?: string;
  items: ToolChartItem[];
  variant?: "donut" | "bar";
  /** Text in der Donut-Mitte (Standard: Summe). */
  centerLabel?: string;
  emptyText?: string;
  className?: string;
}

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  fontSize: 12,
};

export default function ToolStatusChart({ title, subtitle, items, variant = "donut", centerLabel, emptyText, className }: Props) {
  const total = items.reduce((a, b) => a + b.value, 0);
  const data = items.filter(i => i.value > 0);
  const empty = total === 0;

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className ?? ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative w-full sm:w-44 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            {variant === "bar" ? (
              <BarChart data={empty ? [{ label: "—", value: 0 }] : data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="label" width={84} tick={{ fontSize: 10, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "hsl(var(--muted)/0.4)" }} contentStyle={tooltipStyle} formatter={(v: number) => [String(v), ""]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                  {(empty ? [{ color: CHART_EMPTY }] : data).map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={empty ? [{ label: "", value: 1, color: CHART_EMPTY }] : data}
                  dataKey="value" nameKey="label"
                  cx="50%" cy="50%" innerRadius={40} outerRadius={62}
                  paddingAngle={empty ? 0 : 3} strokeWidth={0} cornerRadius={3}
                  isAnimationActive={false}
                >
                  {(empty ? [{ color: CHART_EMPTY }] : data).map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                {!empty && <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [String(v), n]} />}
              </PieChart>
            )}
          </ResponsiveContainer>
          {variant === "donut" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-lg font-bold leading-none">{centerLabel ?? total}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && <div className="text-[11px] text-muted-foreground mb-2">{subtitle}</div>}
          {empty ? (
            <div className="text-xs text-muted-foreground">{emptyText ?? "—"}</div>
          ) : (
            <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
              {items.map(i => (
                <li key={i.label} className="flex items-center gap-2 text-xs">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: i.color }} />
                  <span className="text-muted-foreground truncate">{i.label}</span>
                  <span className="ml-auto font-semibold tabular-nums">{i.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
