/**
 * AuditTrendChart — Mini-Trend „Befunde je Audit" (Überblick-Modus).
 * Gestapelte Balken je Audit: Major / Minor / erledigt — Statusfarben aus chartPalette.
 */
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend, CartesianGrid } from "recharts";
import { CHART_STATUS } from "@/lib/chartPalette";
import { countAuditFindings, sortAudits, type AuditRecord } from "./auditProgram";

export function AuditTrendChart({ de, audits, activeId }: { de: boolean; audits: AuditRecord[]; activeId?: string }) {
  const data = useMemo(() => sortAudits(audits).map(a => {
    const c = countAuditFindings(a);
    const year = a.datum ? a.datum.slice(0, 4) : "";
    const short = a.titel.length > 18 ? a.titel.slice(0, 17) + "…" : a.titel;
    return { id: a.id, name: `${short}${year && !a.titel.includes(year) ? ` (${year})` : ""}${a.id === activeId ? " •" : ""}`, Major: c.major, Minor: c.minor, erledigt: c.erledigt, ofi: c.ofi, total: c.total };
  }), [audits, activeId]);
  if (data.length === 0) return null;
  const lblDone = de ? "Erledigt" : "Resolved";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-sm font-semibold text-foreground">{de ? "Befunde je Audit" : "Findings per audit"}
        <span className="ml-2 text-xs font-normal text-muted-foreground">{de ? "— Trend über die Audit-Historie (offene Major/Minor, erledigt); • = geöffnetes Audit" : "— trend across audit history (open major/minor, resolved); • = opened audit"}</span>
      </div>
      <div style={{ height: Math.max(160, 40 + data.length * 34) }} className="mt-2">
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
            <RTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              formatter={(v: any, n: any) => [v, n === "erledigt" ? lblDone : n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v: string) => v === "erledigt" ? lblDone : v} />
            <Bar dataKey="Major" stackId="a" fill={CHART_STATUS.nein} />
            <Bar dataKey="Minor" stackId="a" fill={CHART_STATUS.teilweise} />
            <Bar dataKey="erledigt" stackId="a" fill={CHART_STATUS.ja} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AuditTrendChart;
