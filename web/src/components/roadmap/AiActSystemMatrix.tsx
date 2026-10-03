/**
 * AI-Act-SoA: Matrix System × Rolle × Kontrolle und Rollenkonsistenz
 * (SoA-Prüfbericht 02.10.2026, Befunde C-5 und C-7).
 *
 * Quelle der Systeme ist das KI-Register (KI-Governance). Ohne erfasste Systeme
 * bleibt nur die vereinfachte Prüfung auf Katalogebene (Art. 16 ↔ Art. 9–15).
 */
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Cpu, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useToolData } from "@/hooks/useToolData";
import { KI_TOOL_KEY, KI_LS_KEY, ROLLE_META, KLASSE_LABEL, type KiGovernanceState } from "@/lib/kiGovernance";
import type { SoAProjection, SoAProjectedControl } from "@/lib/soaProjection";
import {
  activeSystems, buildAiActMatrix, summarizeMatrix, matrixConsistency, aiactFamily,
  type ConsistencyIssue,
} from "@/lib/aiActMatrix";

const fmt = (iso: string, de: boolean) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "—";
  const [y, m, d] = iso.split("-");
  return de ? `${d}.${m}.${y}` : iso;
};

const STATUS_TXT: Record<string, { de: string; en: string; cls: string }> = {
  ja: { de: "Umgesetzt", en: "Implemented", cls: "st-ja-text" },
  teilweise: { de: "Teilweise", en: "Partial", cls: "st-teilweise-text" },
  nein: { de: "Nicht umgesetzt", en: "Not implemented", cls: "st-nein-text" },
  spaeter: { de: "Gilt später", en: "Applies later", cls: "text-blue-700" },
  offen: { de: "Nicht bewertet", en: "Not assessed", cls: "text-muted-foreground" },
  na: { de: "Nicht anwendbar", en: "Not applicable", cls: "text-muted-foreground" },
};

/** Vereinfachte Prüfung ohne Register (Katalogebene): Art. 16 anwendbar ↔ Art. 9–15 „n. a." ohne Begründungsart. */
function catalogRoleWarnings(ctrls: SoAProjectedControl[]): SoAProjectedControl[] {
  const fam = (c: SoAProjectedControl) => aiactFamily(c);
  const providerDuty = ctrls.some(c => ["A-03", "A-07", "A-10", "A-11"].includes(fam(c)) && c.applicable && !c.isExcluded);
  if (!providerDuty) return [];
  return ctrls.filter(c => ["A-03", "A-04", "A-05", "A-06", "A-07", "A-08", "A-09"].includes(fam(c))
    && !c.applicable && !c.isExcluded && (!c.justification || !c.reasonType));
}

export default function AiActSystemMatrix({ projection, de }: { projection: SoAProjection; de: boolean }) {
  const { data } = useToolData<KiGovernanceState>(KI_TOOL_KEY, KI_LS_KEY, { systeme: [] });
  const systems = data.systeme ?? [];
  const active = useMemo(() => activeSystems(systems), [systems]);
  const ctrls = projection.systemControls;
  const rows = useMemo(() => buildAiActMatrix(ctrls, systems), [ctrls, systems]);
  const summary = useMemo(() => summarizeMatrix(rows), [rows]);
  const issues = useMemo(() => matrixConsistency(ctrls, systems), [ctrls, systems]);
  const fallback = useMemo(() => (active.length ? [] : catalogRoleWarnings(ctrls)), [active.length, ctrls]);
  const [openSys, setOpenSys] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const L = (x: { de: string; en: string }) => (de ? x.de : x.en);
  const byKind = (k: ConsistencyIssue["kind"]) => issues.filter(i => i.kind === k);
  const konflikt = byKind("konflikt"), pruefen = byKind("pruefen"), angaben = byKind("angaben");

  return (
    <div className="space-y-3">
      {/* Rollenkonsistenz (C-7) */}
      {active.length === 0 && fallback.length > 0 && (
        <div className="rounded-lg border st-teilweise-border p-3 text-xs space-y-1" role="status">
          <div className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />
            {de ? "Rollen-Prüfung (AI Act)" : "Role check (AI Act)"}</div>
          <p className="text-muted-foreground">
            {de
              ? `Anbieterpflichten nach Art. 16 sind als anwendbar markiert, aber ${fallback.length} Anforderung(en) aus Art. 9–15 stehen ohne Begründungsart auf „nicht anwendbar": ${fallback.slice(0, 6).map(c => c.id.replace("AIACT-", "")).join(", ")}${fallback.length > 6 ? " …" : ""}. Für eine Prüfung je System bitte die KI-Systeme im KI-Register erfassen.`
              : `Provider duties under Art. 16 are marked applicable, but ${fallback.length} requirement(s) from Art. 9–15 are "not applicable" without a reason type: ${fallback.slice(0, 6).map(c => c.id.replace("AIACT-", "")).join(", ")}${fallback.length > 6 ? " …" : ""}. Record the AI systems in the AI register for a per-system check.`}
          </p>
        </div>
      )}

      {active.length > 0 && issues.length > 0 && (
        <div className={`rounded-lg border p-3 text-xs space-y-2 ${konflikt.length ? "border-destructive/50" : "st-teilweise-border"}`} role="status">
          <div className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />
            {de ? "Rollenkonsistenz je System (AI Act)" : "Role consistency per system (AI Act)"}
            <span className="font-normal text-muted-foreground">
              · {konflikt.length} {de ? "Konflikt(e)" : "conflict(s)"} · {pruefen.length} {de ? "zu prüfen" : "to check"} · {angaben.length} {de ? "Angaben fehlen" : "missing details"}
            </span>
          </div>
          <ul className="space-y-0.5">
            {[...konflikt, ...pruefen, ...angaben].slice(0, showAll ? undefined : 8).map((i, n) => (
              <li key={n} className={i.kind === "konflikt" ? "text-destructive" : i.kind === "pruefen" ? "st-teilweise-text" : "text-muted-foreground"}>
                {i.kind === "konflikt" ? (de ? "Konflikt: " : "Conflict: ") : i.kind === "pruefen" ? (de ? "Prüfen: " : "Check: ") : (de ? "Angaben: " : "Details: ")}{L(i.text)}
              </li>
            ))}
          </ul>
          {issues.length > 8 && (
            <button className="text-primary underline" onClick={() => setShowAll(v => !v)}>
              {showAll ? (de ? "weniger" : "less") : (de ? `alle ${issues.length} anzeigen` : `show all ${issues.length}`)}
            </button>
          )}
        </div>
      )}

      {/* Matrix System × Rolle × Kontrolle (C-5) */}
      <div className="rounded-lg border border-border bg-card p-3 text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold flex items-center gap-1.5 text-sm"><Cpu className="h-4 w-4 text-primary" />
            {de ? "KI-Systeme × Rolle × Kontrolle" : "AI systems × role × control"}</div>
          <Link to="/ki-governance" className="text-primary underline">{de ? "KI-Register öffnen" : "Open AI register"}</Link>
        </div>
        {active.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-1.5"><Info className="h-3.5 w-3.5" />
            {de ? "Im KI-Register sind keine aktiven KI-Systeme erfasst. Die Matrix entsteht aus Register (Rolle, Risikoklasse) und Katalog." : "No active AI systems recorded in the AI register. The matrix is built from the register (role, risk class) and the catalogue."}</p>
        ) : (
          <>
            <p className="text-muted-foreground">
              {de
                ? "Je System: welche Kontrollen in seiner Rolle und Risikoklasse greifen. Der Umsetzungsstatus stammt aus der Gap-Analyse und gilt je Kontrolle für die Organisation."
                : "Per system: which controls apply in its role and risk class. Implementation status comes from the gap analysis and applies per control for the organisation."}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="py-1 pr-2" />
                    <th className="py-1 pr-2">ID</th>
                    <th className="py-1 pr-2">{de ? "System · Version" : "System · version"}</th>
                    <th className="py-1 pr-2">{de ? "Rolle" : "Role"}</th>
                    <th className="py-1 pr-2">{de ? "Klasse" : "Class"}</th>
                    <th className="py-1 pr-2">{de ? "Verantwortlich" : "Owner"}</th>
                    <th className="py-1 pr-2">{de ? "Bewertet" : "Assessed"}</th>
                    <th className="py-1 pr-2">{de ? "Freigabe" : "Approved by"}</th>
                    <th className="py-1 pr-2 text-right">{de ? "Anw." : "Appl."}</th>
                    <th className="py-1 pr-2 text-right st-ja-text">{de ? "Umg." : "Impl."}</th>
                    <th className="py-1 pr-2 text-right st-teilweise-text">{de ? "Teilw." : "Part."}</th>
                    <th className="py-1 pr-2 text-right st-nein-text">{de ? "Offen" : "Open"}</th>
                    <th className="py-1 pr-2 text-right text-blue-700">{de ? "Später" : "Later"}</th>
                    <th className="py-1 text-right">{de ? "N. bew." : "N. ass."}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map(s => {
                    const open = openSys === s.systemId;
                    const sysRows = rows.filter(r => r.systemId === s.systemId);
                    const naByReason = new Map<string, number>();
                    for (const r of sysRows) if (!r.applies && r.reason) naByReason.set(L(r.reason), (naByReason.get(L(r.reason)) ?? 0) + 1);
                    return [
                      <tr key={s.systemId} className="border-b border-border/60 align-top cursor-pointer hover:bg-muted/30" onClick={() => setOpenSys(open ? null : s.systemId)}>
                        <td className="py-1 pr-1">{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</td>
                        <td className="py-1 pr-2 font-mono">{s.systemId}</td>
                        <td className="py-1 pr-2 font-medium">{s.name}{s.version ? <span className="text-muted-foreground"> · {s.version}</span> : null}</td>
                        <td className="py-1 pr-2">{L(ROLLE_META[s.rolle])}</td>
                        <td className="py-1 pr-2">{L(KLASSE_LABEL[s.risikoklasse])}</td>
                        <td className="py-1 pr-2">{s.owner || <span className="text-destructive">—</span>}</td>
                        <td className="py-1 pr-2">{s.assessedAt ? fmt(s.assessedAt, de) : <span className="text-destructive">—</span>}</td>
                        <td className="py-1 pr-2">{s.approvedBy || <span className="text-destructive">—</span>}</td>
                        <td className="py-1 pr-2 text-right font-semibold">{s.applicable}</td>
                        <td className="py-1 pr-2 text-right">{s.implemented}</td>
                        <td className="py-1 pr-2 text-right">{s.partial}</td>
                        <td className="py-1 pr-2 text-right">{s.open}</td>
                        <td className="py-1 pr-2 text-right">{s.later}</td>
                        <td className="py-1 text-right">{s.notAssessed}</td>
                      </tr>,
                      open && (
                        <tr key={s.systemId + "-d"} className="border-b border-border/60">
                          <td />
                          <td colSpan={13} className="py-2 space-y-2">
                            {s.evidence.length > 0 && (
                              <div><span className="font-semibold">{de ? "Nachweise: " : "Evidence: "}</span>
                                {s.evidence.map((e, k) => /^https?:\/\//.test(e)
                                  ? <a key={k} href={e} target="_blank" rel="noreferrer" className="text-primary underline mr-2 break-all">{e}</a>
                                  : <span key={k} className="mr-2">{e}</span>)}
                              </div>
                            )}
                            <div className="grid gap-x-4 gap-y-0.5 md:grid-cols-2">
                              {sysRows.filter(r => r.applies).map(r => (
                                <div key={r.controlId} className="flex gap-2">
                                  <span className="font-mono shrink-0 w-24">{r.controlId.replace("AIACT-", "")}</span>
                                  <span className="flex-1 truncate" title={de ? r.controlName : r.controlNameEn}>{de ? r.controlName : r.controlNameEn}</span>
                                  <span className={`shrink-0 ${STATUS_TXT[r.status]?.cls ?? ""}`}>{L(STATUS_TXT[r.status] ?? STATUS_TXT.offen)}</span>
                                </div>
                              ))}
                            </div>
                            {naByReason.size > 0 && (
                              <div className="text-muted-foreground">
                                <span className="font-semibold">{de ? "Nicht anwendbar für dieses System: " : "Not applicable for this system: "}</span>
                                {Array.from(naByReason.entries()).map(([t, n]) => `${n} × ${t}`).join(" · ")}
                              </div>
                            )}
                          </td>
                        </tr>
                      ),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
