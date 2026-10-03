/**
 * Sparkline — winzige Trendlinie ohne Achsen für KPI-Kacheln (M9).
 * Zeigt nur bei >= 2 Datenpunkten etwas an (sonst null) — kein leerer Kasten.
 */
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export function Sparkline({
  data, domain = [0, 100], color = "hsl(var(--accent))", height = 30,
}: { data: number[]; domain?: [number, number]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const d = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={d} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={domain} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
