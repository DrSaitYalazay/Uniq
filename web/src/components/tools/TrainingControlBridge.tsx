/**
 * TrainingControlBridge — Konsistenz-Brücke Schulungen → Kontrollen.
 *
 * Sind die Pflichtschulungen einer Zielgruppe zu ≥ 80 % abgeschlossen, wird ein
 * Hinweis-Block angeboten: „Nachweis für Kontrollen … als erfüllt vorschlagen".
 * Der Button legt NUR einen Vorschlag im Blob `tool-suggestions` ab
 * (`{ suggestions: [{ id, source:"trainings", framework, controlId, text, createdAt, status:"offen" }] }`).
 * Es wird KEINE Gap-Antwort automatisch verändert.
 *
 * Kontroll-IDs (sequenzielle Katalog-IDs, nicht Annex-Nummern) siehe
 * TRAINING_CONTROL_TARGETS in @/lib/tools/toolLinks (gegen db/seeds/catalog.sql geprüft).
 *
 * Datenquelle: Blob `training` (TrainingTab). Da der DB-Client kein Realtime hat,
 * wird zusätzlich der localStorage-Spiegel von useToolData (`nis2_training`)
 * beobachtet, damit Häkchen im TrainingTab sofort hier sichtbar sind.
 */
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFramework } from "@/contexts/FrameworkContext";
import { useToolData } from "@/hooks/useToolData";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, Info, Users, Briefcase, Network, Truck, Code2, Cpu } from "lucide-react";
import { CATEGORIES, type Role } from "@/data/training/categories";
import { TOPIC_FRAMEWORKS } from "@/data/training/topicFrameworks";
import {
  type SuggestionState, type ToolSuggestion, SUGGESTIONS_DEFAULT, SUGGESTIONS_TOOL_KEY, SUGGESTIONS_LS_KEY,
  TRAINING_TOOL_KEY, TRAINING_LS_KEY, TRAINING_CONTROL_TARGETS,
} from "@/lib/tools/toolLinks";

interface TrainingBlob { completions?: Record<string, { completed: boolean; completionDate: string }> }
const TRAINING_DEFAULT: TrainingBlob = { completions: {} };
const THRESHOLD = 80;

const ROLES: { id: Role; de: string; en: string; icon: React.ReactNode }[] = [
  { id: "all", de: "Alle Mitarbeiter", en: "All employees", icon: <Users size={13} /> },
  { id: "management", de: "Geschäftsleitung", en: "Management", icon: <Briefcase size={13} /> },
  { id: "it", de: "IT-Team", en: "IT team", icon: <Network size={13} /> },
  { id: "procurement", de: "Einkauf & Vertrag", en: "Procurement & contracts", icon: <Truck size={13} /> },
  { id: "developer", de: "Entwickler", en: "Developers", icon: <Code2 size={13} /> },
  { id: "ot", de: "OT/ICS-Personal", en: "OT/ICS staff", icon: <Cpu size={13} /> },
];

export default function TrainingControlBridge() {
  const { lang } = useLanguage();
  const de = lang === "de";
  const { active } = useFramework();
  const activeKeys = useMemo(() => active.map(f => f.key as string), [active]);

  const { data: cloud } = useToolData<TrainingBlob>(TRAINING_TOOL_KEY, TRAINING_LS_KEY, TRAINING_DEFAULT);
  const { data: sugg, setData: setSugg, loading: suggLoading } = useToolData<SuggestionState>(SUGGESTIONS_TOOL_KEY, SUGGESTIONS_LS_KEY, SUGGESTIONS_DEFAULT);

  // localStorage-Spiegel (gleiche Seite, kein Realtime): alle 2 s vergleichen.
  const [mirror, setMirror] = useState<TrainingBlob | null>(null);
  useEffect(() => {
    let last = "";
    const tick = () => {
      try {
        const raw = localStorage.getItem(TRAINING_LS_KEY);
        if (raw && raw !== last) { last = raw; setMirror(JSON.parse(raw)); }
      } catch { /* ignore */ }
    };
    tick();
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, []);
  const completions = (mirror ?? cloud)?.completions ?? {};

  // Je Zielgruppe: Pflichtschulungen (nur aktive Frameworks, wie im TrainingTab) und Abschlussquote.
  const perRole = useMemo(() => {
    const topics = CATEGORIES.flatMap(c => c.topics).filter(t => {
      if (!t.mandatory) return false;
      const fw = (TOPIC_FRAMEWORKS as Record<string, string[]>)[t.id] ?? [];
      return fw.length === 0 || activeKeys.length === 0 || fw.some(f => activeKeys.includes(f));
    });
    return ROLES.map(r => {
      const mine = topics.filter(t => t.roles.includes(r.id));
      const done = mine.filter(t => completions[t.id]?.completed).length;
      const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
      return { role: r, total: mine.length, done, pct, ready: mine.length > 0 && pct >= THRESHOLD };
    }).filter(x => x.total > 0);
  }, [activeKeys, completions]);

  const existing = useMemo(() => {
    const m = new Map<string, ToolSuggestion>();
    for (const s of sugg?.suggestions ?? []) if (s.source === "trainings") m.set(s.id, s);
    return m;
  }, [sugg]);

  const targetsFor = (role: Role) => TRAINING_CONTROL_TARGETS.filter(t => t.roles.includes(role) && (activeKeys.length === 0 || activeKeys.includes(t.framework)));
  const suggestionId = (role: Role, framework: string, controlId: string) => `trainings:${role}:${framework}:${controlId}`;

  const propose = (role: Role, pct: number, done: number, total: number) => {
    const roleMeta = ROLES.find(r => r.id === role)!;
    const targets = targetsFor(role);
    if (!targets.length) { toast.info(de ? "Für die aktiven Frameworks gibt es keine passende Kontrolle." : "No matching control for the active frameworks."); return; }
    const now = new Date().toISOString();
    const items: ToolSuggestion[] = targets.map(t => ({
      id: suggestionId(role, t.framework, t.controlId),
      source: "trainings",
      framework: t.framework,
      controlId: t.controlId,
      controlLabel: t.label,
      text: de
        ? `Pflichtschulungen „${roleMeta.de}" zu ${pct} % abgeschlossen (${done}/${total}) — Nachweis für ${t.label}; als erfüllt vorschlagen.`
        : `Mandatory trainings "${roleMeta.en}" ${pct}% complete (${done}/${total}) — evidence for ${t.label}; propose as fulfilled.`,
      createdAt: now,
      status: "offen",
      meta: { role, pct, done, total },
    }));
    let added = 0;
    setSugg(prev => {
      const list = [...(prev?.suggestions ?? [])];
      for (const it of items) {
        const idx = list.findIndex(x => x.id === it.id);
        if (idx >= 0) { list[idx] = { ...list[idx], text: it.text, meta: it.meta }; }
        else { list.push(it); added++; }
      }
      return { ...prev, suggestions: list };
    });
    toast.success(de
      ? `${added} Vorschlag/Vorschläge abgelegt (${items.length - added} aktualisiert). Gap-Antworten wurden nicht verändert.`
      : `${added} suggestion(s) stored (${items.length - added} updated). Gap answers were not changed.`);
  };

  const readyRoles = perRole.filter(x => x.ready);
  if (perRole.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck size={16} className="text-primary" />
        {de ? "Nachweis für Kontrollen (Schulungen → Gap-Analyse)" : "Evidence for controls (trainings → gap analysis)"}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {de
          ? `Ab ${THRESHOLD} % abgeschlossener Pflichtschulungen je Zielgruppe kann ein Nachweis-Vorschlag für die passenden Kontrollen abgelegt werden (ISO 27001 A.6.3 Awareness/Schulung, NIS2 Art. 20/21). Der Vorschlag ändert keine Gap-Antwort — er wird nur als offener Hinweis gespeichert.`
          : `Once ${THRESHOLD}% of mandatory trainings per audience are complete, an evidence suggestion for the matching controls can be stored (ISO 27001 A.6.3 awareness/training, NIS2 Art. 20/21). The suggestion does not change any gap answer — it is stored as an open hint only.`}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {perRole.map(({ role, total, done, pct, ready }) => {
          const targets = targetsFor(role.id);
          const stored = targets.map(t => existing.get(suggestionId(role.id, t.framework, t.controlId))).filter(Boolean) as ToolSuggestion[];
          return (
            <div key={role.id} className={`rounded-lg border p-3 space-y-1.5 ${ready ? "st-ja-border st-ja-tint" : "border-border bg-muted/20"}`}>
              <div className="flex items-center gap-2 text-xs font-semibold">
                {role.icon}{de ? role.de : role.en}
                <span className={`ml-auto tabular-nums ${ready ? "st-ja-text" : "text-muted-foreground"}`}>{done}/{total} · {pct} %</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${ready ? "st-ja-bg" : "st-teilweise-bg"}`} style={{ width: `${pct}%` }} />
              </div>
              {ready ? (
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground">
                    {de ? "Kontrollen: " : "Controls: "}{targets.map(t => t.label).join(" · ") || "—"}
                  </div>
                  {stored.length === targets.length && targets.length > 0 ? (
                    <div className="text-[11px] st-ja-text inline-flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {de ? `Vorschlag abgelegt (${stored[0].createdAt.slice(0, 10)}) · Status: ${stored.map(s => s.status).join(", ")}` : `Suggestion stored (${stored[0].createdAt.slice(0, 10)}) · status: ${stored.map(s => s.status).join(", ")}`}
                      <button onClick={() => propose(role.id, pct, done, total)} className="underline ml-1">{de ? "aktualisieren" : "refresh"}</button>
                    </div>
                  ) : (
                    <button onClick={() => propose(role.id, pct, done, total)} disabled={suggLoading}
                      className="rounded-md bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50">
                      <ShieldCheck size={12} />{de ? "Als erfüllt vorschlagen" : "Propose as fulfilled"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Info size={11} />{de ? `Noch ${Math.max(0, Math.ceil(total * THRESHOLD / 100) - done)} Pflichtschulung(en) bis ${THRESHOLD} %.` : `${Math.max(0, Math.ceil(total * THRESHOLD / 100) - done)} more mandatory training(s) to reach ${THRESHOLD}%.`}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {readyRoles.length === 0 && (
        <p className="text-[11px] text-muted-foreground">{de ? "Noch keine Zielgruppe über der Schwelle." : "No audience above the threshold yet."}</p>
      )}
    </div>
  );
}
