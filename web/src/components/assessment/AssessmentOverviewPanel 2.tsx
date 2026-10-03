/**
 * AssessmentOverviewPanel — cross-framework aggregate view.
 *
 * Shown as the first "Übersicht" tab in Phase 3. Gives the user a
 * one-glance summary of every enabled framework so they can spot which
 * framework needs attention before drilling into a specific tab.
 */

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  PieChart, Pie, Cell, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
} from "recharts";
import type { ControlRow, EffectiveAnswer, FrameworkStats } from "@/lib/assessmentEngine";
import { familyOf, computeStats } from "@/lib/assessmentEngine";

interface FrameworkPayload {
  framework: string;
  shortLabel: string;
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
  stats: FrameworkStats;
}

interface Props {
  frameworks: FrameworkPayload[];
  de: boolean;
  onSelectFramework: (fw: string) => void;
}

import { CHART_STATUS, CHART_STATUS_OHNE } from "@/lib/chartPalette";
import { FrameworkMiniGrid, type FwMiniItem } from "@/components/FrameworkMiniGrid";
const STATUS_COLORS = {
  ja:        CHART_STATUS.ja,
  teilweise: CHART_STATUS.teilweise,
  nein:      CHART_STATUS.nein,
  na:        CHART_STATUS.na,
  ohne:      CHART_STATUS_OHNE,
};

export function AssessmentOverviewPanel({ frameworks, de, onSelectFramework }: Props) {
  // 1) Framework compliance comparison
  const complianceBarData = useMemo(() =>
    frameworks.map(f => ({
      name: f.shortLabel,
      framework: f.framework,
      pct: f.stats.compliancePct,
      progress: f.stats.progressPct,
    })),
  [frameworks]);

  // 1b) Per-Framework mini-donut grid (Umsetzung-Standard)
  const fwItems = useMemo<FwMiniItem[]>(() =>
    frameworks.map(f => {
      const s = f.stats;
      const ohne = Math.max(0, s.total - s.ja - s.teilweise - s.nein - s.na);
      return {
        key: f.framework,
        label: f.shortLabel || f.framework,
        pct: s.compliancePct,
        donut: [
          { name: de ? "Umgesetzt" : "Implemented", value: s.ja,        color: CHART_STATUS.ja },
          { name: de ? "Teilweise" : "Partial",     value: s.teilweise, color: CHART_STATUS.teilweise },
          { name: de ? "Offen" : "Open",            value: s.nein,      color: CHART_STATUS.nein },
          { name: "N.a.",                           value: s.na,        color: CHART_STATUS.na },
          { name: de ? "Unbeantwortet" : "Unanswered", value: ohne,     color: CHART_STATUS_OHNE },
        ],
        rows: [
          { label: de ? "Umgesetzt" : "Implemented", value: s.ja,        color: CHART_STATUS.ja },
          { label: de ? "Teilweise" : "Partial",     value: s.teilweise, color: CHART_STATUS.teilweise },
          { label: de ? "Offen" : "Open",            value: s.nein,      color: CHART_STATUS.nein },
        ],
        footer: { label: de ? "Anwendbar" : "Applicable", value: s.applicable },
        onClick: () => onSelectFramework(f.framework),
      };
    }),
  [frameworks, de, onSelectFramework]);

  // 2) Aggregate status donut (union of all controls, dedup by id across frameworks)
  const aggregateStatus = useMemo(() => {
    let ja = 0, teil = 0, nein = 0, na = 0, ohne = 0, total = 0;
    for (const f of frameworks) {
      total += f.stats.total;
      ja += f.stats.ja;
      teil += f.stats.teilweise;
      nein += f.stats.nein;
      na += f.stats.na;
    }
    ohne = Math.max(0, total - ja - teil - nein - na);
    return [
      { name: de ? "Umgesetzt" : "Implemented", value: ja,    color: STATUS_COLORS.ja },
      { name: de ? "Teilweise" : "Partial",     value: teil,  color: STATUS_COLORS.teilweise },
      { name: de ? "Offen"     : "Open",        value: nein,  color: STATUS_COLORS.nein },
      { name: de ? "N.a."      : "N/A",         value: na,    color: STATUS_COLORS.na },
      { name: de ? "Unbeantwortet" : "Unanswered", value: ohne, color: STATUS_COLORS.ohne },
    ].filter(d => d.value > 0);
  }, [frameworks, de]);

  // 3) Capability radar — merge families across all frameworks
  const radarData = useMemo(() => {
    const buckets = new Map<string, { label: string; ja: number; teil: number; total: number; na: number }>();
    for (const f of frameworks) {
      for (const c of f.controls) {
        const fam = familyOf(c, de);
        const key = fam.label.toLowerCase();
        if (!buckets.has(key)) buckets.set(key, { label: fam.label, ja: 0, teil: 0, total: 0, na: 0 });
        const b = buckets.get(key)!;
        b.total += 1;
        const s = f.effective.get(c.id)?.status;
        if (s === "ja") b.ja += 1;
        else if (s === "teilweise") b.teil += 1;
        else if (s === "na") b.na += 1;
      }
    }
    return Array.from(buckets.values())
      .map(b => {
        const applicable = b.total - b.na;
        const pct = applicable > 0 ? Math.round(((b.ja + 0.5 * b.teil) / applicable) * 100) : 0;
        return { capability: shortAxisLabel(b.label, de), fullLabel: b.label, value: pct, total: b.total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [frameworks, de]);



  // Aggregate KPI banner
  const kpi = useMemo(() => {
    let ja = 0, teil = 0, nein = 0, na = 0, total = 0, criticalOpen = 0, answered = 0;
    for (const f of frameworks) {
      ja += f.stats.ja; teil += f.stats.teilweise; nein += f.stats.nein;
      na += f.stats.na; total += f.stats.total;
      criticalOpen += f.stats.criticalOpen;
      answered += f.stats.answered;
    }
    const applicable = total - na;
    const compliancePct = applicable > 0 ? Math.round(((ja + 0.5 * teil) / applicable) * 100) : 0;
    const progressPct = total > 0 ? Math.round((answered / total) * 100) : 0;
    return { compliancePct, progressPct, criticalOpen, applicable, total, answered };
  }, [frameworks]);

  if (frameworks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {de ? "Keine aktivierten Frameworks — bitte in Scope aktivieren." : "No frameworks activated — enable in Scope."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI banner */}
      <div className="rounded-xl border border-border bg-card p-4 card-elevated">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiBox label={de ? "Konformität gesamt" : "Overall compliance"} value={`${kpi.compliancePct}%`} sub={`${frameworks.length} ${de ? "Frameworks" : "frameworks"}`} />
          <KpiBox label={de ? "Fortschritt"   : "Progress"}       value={`${kpi.progressPct}%`}  sub={`${kpi.answered}/${kpi.total}`} />
          <KpiBox label={de ? "Kritische Lücken" : "Critical gaps"} value={String(kpi.criticalOpen)} sub={de ? "Muss offen" : "must open"} tone="destructive" />
          <KpiBox label={de ? "Anwendbar" : "Applicable"} value={String(kpi.applicable)} sub={de ? "gesamt (ohne N.a.)" : "total (excl. N/A)"} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {de
            ? "Bewertungsstand aus Phase 3 (Gap-Analyse). Fortschritt aus Phase 6 (Umsetzung) wird im Dashboard, in SoA/Roadmap und in Berichten angerechnet („spätere Phase gewinnt“)."
            : "Assessment state from Phase 3 (Gap Analysis). Progress from Phase 6 (Implementation) is credited on the Dashboard, in SoA/Roadmap and in reports (\"later phase wins\")."}
        </p>
      </div>

      {/* Framework compliance bar */}
      <div className="rounded-xl border border-border bg-card p-4 card-elevated">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">
            {de ? "Konformität pro Framework" : "Compliance per framework"}
          </h3>
          <span className="text-[11px] text-muted-foreground">
            {de ? "Klick öffnet Framework-Tab" : "Click opens framework tab"}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(220, frameworks.length * 38)}>
          <BarChart data={complianceBarData} layout="vertical" margin={{ left: 4, right: 36, top: 4, bottom: 4 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={100} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11, borderRadius: 8 }}
              formatter={(v: number, key: string) => [`${v}%`, key === "pct" ? (de ? "Konformität" : "Compliance") : (de ? "Fortschritt" : "Progress")]}
            />
            <Bar
              dataKey="pct"
              radius={[0, 4, 4, 0]}
              onClick={(d: any) => d?.framework && onSelectFramework(d.framework)}
              cursor="pointer"
            >
              {complianceBarData.map((d, i) => (
                <Cell key={i} fill={d.pct >= 75 ? CHART_STATUS.ja : d.pct >= 40 ? CHART_STATUS.teilweise : CHART_STATUS.nein} />
              ))}
              <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-Framework mini-donut grid (Umsetzung-Standard) */}
      <div className="rounded-xl border border-border bg-card p-4 card-elevated">
        <FrameworkMiniGrid
          items={fwItems}
          title={de ? "Aufschlüsselung je Framework" : "Breakdown by framework"}
          subtitle={de ? "— Konformität & Statusverteilung je Framework (Klick öffnet Tab)" : "— compliance & status split per framework (click opens tab)"}
        />
      </div>

      {/* Two-column: donut + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {de ? "Status-Verteilung (aggregiert)" : "Status distribution (aggregated)"}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={aggregateStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
                {aggregateStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 text-[10.5px] justify-center mt-1">
            {aggregateStatus.map(d => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 card-elevated">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            {de ? "Capability-Radar (Top 10)" : "Capability radar (top 10)"}
          </h3>
          {radarData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
              {de ? "Keine Daten" : "No data"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} margin={{ top: 12, right: 40, bottom: 12, left: 40 }} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="capability"
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 11, borderRadius: 8 }}
                  labelFormatter={(_label, payload) => (payload && payload[0]?.payload?.fullLabel) || _label}
                  formatter={(v: number) => [`${v}%`, de ? "Konformität" : "Compliance"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
          {radarData.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
              {radarData.map(d => (
                <div key={d.fullLabel} className="flex items-baseline gap-1.5 text-[10.5px] leading-snug">
                  <span className="font-semibold text-foreground shrink-0">{d.capability}</span>
                  {d.fullLabel && d.fullLabel !== d.capability && (
                    <span className="text-muted-foreground truncate">— {d.fullLabel}</span>
                  )}
                  <span className="ml-auto tabular-nums text-muted-foreground shrink-0">{d.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "destructive" }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${tone === "destructive" ? "text-destructive" : "text-foreground"}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/**
 * Compact 1-2 word radar axis label. The tooltip keeps the full label; the
 * axis label must remain meaningful and must not cut words mid-way.
 */
function shortAxisLabel(full: string, de: boolean): string {
  const src = full.trim();

  const exact = semanticAxisLabel(src, de);
  if (exact) return exact;

  // Strip a leading code prefix like "A.8 ", "5 ", "ARCH – ".
  // Keep a readable domain name, not a broken fragment.
  const dashSplit = src.split(/\s[–—-]\s/);
  if (dashSplit.length > 1) {
    const code = dashSplit[0].trim();
    const mappedCode = semanticAxisLabel(code, de);
    if (mappedCode) return mappedCode;
    if (code.length <= 6) return code;
    return compactWords(dashSplit[1], 2, de);
  }

  // Prefix codes like "A.8", "5", "10", "Art.", "Kapitel", "Chapter"
  const m = src.match(/^((?:A\.)?\d+(?:\.\d+)?|Art\.?|Kapitel|Chapter)\s+(.+)$/i);
  if (m) {
    const prefix = m[1];
    const rest = m[2];
    if (/^(Art\.?|Kapitel|Chapter)$/i.test(prefix)) {
      const parts = rest.split(/\s+/);
      return `${prefix} ${parts[0] ?? ""}`.trim();
    }
    const mappedPrefix = semanticAxisLabel(prefix, de);
    if (mappedPrefix) return mappedPrefix;
    return `${prefix} ${compactWords(rest, 1, de)}`.trim();
  }
  return compactWords(src, 2, de);
}

function semanticAxisLabel(text: string, de: boolean): string | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—-]/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();

  const labels: Array<[RegExp, string, string]> = [
    [/^4( |$)|context of the organization|kontext der organisation/, "4 Kontext", "4 Context"],
    [/^5( |$)|leadership|fuhrung/, "5 Führung", "5 Leadership"],
    [/^6( |$)|planning|planung/, "6 Planung", "6 Planning"],
    [/^7( |$)|support|unterstutzung/, "7 Support", "7 Support"],
    [/^8( |$)/, "8 Betrieb", "8 Operation"],
    [/^9( |$)|performance evaluation|bewertung der leistung/, "9 Leistung", "9 Performance"],
    [/^10( |$)|improvement|verbesserung/, "10 Verbesserung", "10 Improvement"],
    [/^a\.5( |$)|organizational controls|organisatorische massnahmen/, "A.5 Organisation", "A.5 Organization"],
    [/^a\.6( |$)|people controls|personenbezogene massnahmen/, "A.6 Personal", "A.6 People"],
    [/^a\.7( |$)|physical controls|physische massnahmen/, "A.7 Physisch", "A.7 Physical"],
    [/^a\.8( |$)|technological controls|technologische massnahmen/, "A.8 Technologie", "A.8 Technology"],

    [/^isms( |$)|security management|sicherheitsmanagement/, "ISMS Mgmt", "ISMS Mgmt"],
    [/^orp( |$)|organisation and personal|organisation personal/, "Organisation", "Organization"],
    [/^con( |$)|concepts and approach|konzeption vorgehensweise/, "Konzepte", "Concepts"],
    [/^ops( |$)|operations|betrieb/, "Betrieb", "Operations"],
    [/^der( |$)|detection and response|detektion reaktion/, "Detektion", "Detection"],
    [/^app( |$)|applications|anwendungen/, "Anwendungen", "Applications"],
    [/^sys( |$)|it systems|it systeme/, "IT-Systeme", "IT Systems"],
    [/^ind( |$)|industrial it|industrielle it|\bot\b/, "OT", "OT"],
    [/^net( |$)|networks and communication|netze kommunikation/, "Netze", "Networks"],
    [/^inf( |$)|infrastructure|infrastruktur/, "Infrastruktur", "Infrastructure"],
    [/^arch( |$)|architecture|architektur/, "Architektur", "Architecture"],
    [/^asst( |$)|assets and inventory|assets inventar/, "Assets", "Assets"],
    [/^geb( |$)|buildings|gebaude/, "Gebäude", "Buildings"],
    [/^sens( |$)|sensitive areas|sensitive bereiche/, "Sensibel", "Sensitive"],
    [/^gc( |$)|governance and compliance/, "Governance", "Governance"],

    [/identity|access|zugriff|iam|identitat/, "IAM", "IAM"],
    [/mfa|authentifizierung|authentication/, "MFA", "MFA"],
    [/supplier|lieferant/, "Lieferanten", "Suppliers"],
    [/incident|vorfall/, "Vorfälle", "Incidents"],
    [/business continuity|bcm/, "BCM", "BCM"],
    [/compliance|audit/, "Audit", "Audit"],
    [/personnel security|personalsicherheit/, "Personal", "Personnel"],
    [/awareness|schulung|training/, "Awareness", "Awareness"],
    [/endpoint|endgerat/, "Endgeräte", "Endpoints"],
    [/network security|netzwerksicherheit/, "Netzwerk", "Network"],
    [/cryptography|kryptographie/, "Krypto", "Crypto"],
    [/vulnerability|schwachstellen/, "Schwachstellen", "Vulnerabilities"],
    [/secure development|sichere entwicklung/, "Entwicklung", "Development"],
    [/monitoring|logging|uberwachung/, "Logging", "Logging"],
    [/data security|datenklassifizierung|datensicherheit/, "Datensicherheit", "Data Security"],
    [/risk management|risikomanagement/, "Risiko", "Risk"],
    [/asset management/, "Assets", "Assets"],
    [/governance/, "Governance", "Governance"],
  ];

  for (const [pattern, deLabel, enLabel] of labels) {
    if (pattern.test(normalized)) return de ? deLabel : enLabel;
  }

  return null;
}

function compactWords(text: string, n: number, de: boolean): string {
  const cleaned = text
    .replace(/\b(controls?|maßnahmen|massnahmen|management|security|sicherheit)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const picked = words.slice(0, n).join(" ");

  if (picked.length <= 18) return picked;

  const semantic = semanticAxisLabel(picked, de);
  if (semantic) return semantic;

  const shortestWholeWord = words.find((word) => word.length <= 18);
  return shortestWholeWord ?? (de ? "Bereich" : "Area");
}


