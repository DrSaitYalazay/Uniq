/**
 * QuestionCard — UniqSuite-Überblick der Gap-Analyse: EINE Anforderung pro Karte,
 * Antwort mit einem Klick (Umgesetzt / Teilweise / Nicht umgesetzt).
 * „Nicht anwendbar" ist ein kleiner Link und verlangt eine Begründung (SoA-Pflicht).
 * Reifegrad, Nachweise, Notizen und Asset-Bewertung gibt es im Detail.
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnswerStatus, ControlRow, EffectiveAnswer } from "@/lib/assessmentEngine";
import { familiesOf } from "@/lib/assessmentEngine";
import { readinessControl } from "@/data/readinessControls";
import { Textarea } from "@/components/ui/textarea";

type Scope = "open" | "all";

interface Props {
  controls: ControlRow[];
  effective: Map<string, EffectiveAnswer>;
  de: boolean;
  isMust: (c: ControlRow) => boolean;
  onSetStatus: (controlId: string, s: AnswerStatus | null) => void;
  onSetNote: (controlId: string, v: string) => void;
}

const ANSWERS: { value: AnswerStatus; de: string; en: string; cls: string; icon: string }[] = [
  { value: "ja",        de: "Umgesetzt",       en: "Implemented",     cls: "st-ja-border st-ja-tint st-ja-text",                icon: "✓" },
  { value: "teilweise", de: "Teilweise",       en: "Partial",         cls: "st-teilweise-border st-teilweise-tint st-teilweise-text", icon: "◐" },
  { value: "nein",      de: "Nicht umgesetzt", en: "Not implemented", cls: "st-nein-border st-nein-tint st-nein-text",          icon: "✕" },
];

/** Offen = unbeantwortet, teilweise oder nicht umgesetzt (dieselbe Lesart wie der Filter „Offen" im Detail). */
const isOpen = (e: EffectiveAnswer | undefined) => !e?.status || e.status === "teilweise" || e.status === "nein";

export function QuestionCard({ controls, effective, de, isMust, onSetStatus, onSetNote }: Props) {
  const [scope, setScope] = useState<Scope>("open");
  // Die Reihenfolge wird beim Wechsel des Umfangs eingefroren — sonst springt die
  // Karte nach jeder Antwort, weil die beantwortete Anforderung aus „Offen" fällt.
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [naOpen, setNaOpen] = useState(false);
  const [naText, setNaText] = useState("");

  const byId = useMemo(() => new Map(controls.map(c => [c.id, c])), [controls]);

  useEffect(() => {
    // MUSS zuerst, dann nach ID — die wichtigsten Lücken kommen zuerst auf den Tisch.
    const list = controls
      .filter(c => scope === "all" || isOpen(effective.get(c.id)))
      .sort((a, b) => Number(isMust(b)) - Number(isMust(a)) || a.id.localeCompare(b.id, undefined, { numeric: true }))
      .map(c => c.id);
    setOrder(list);
    setIdx(0);
    // effective bewusst NICHT in den Abhängigkeiten (siehe oben: Reihenfolge einfrieren).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, controls]);

  const current = order[idx] ? byId.get(order[idx]) : undefined;
  const eff = current ? effective.get(current.id) : undefined;
  const openLeft = controls.filter(c => isOpen(effective.get(c.id))).length;

  useEffect(() => { setNaOpen(false); setNaText(eff?.note ?? ""); }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => setIdx(i => Math.min(i + 1, Math.max(order.length - 1, 0)));
  const prev = () => setIdx(i => Math.max(i - 1, 0));

  const answer = (s: AnswerStatus) => {
    if (!current) return;
    onSetStatus(current.id, eff?.status === s ? null : s);
    if (eff?.status !== s) window.setTimeout(next, 250);
  };

  const saveNa = () => {
    if (!current || naText.trim().length < 10) return;
    onSetStatus(current.id, "na");
    onSetNote(current.id, naText.trim());
    setNaOpen(false);
    window.setTimeout(next, 250);
  };

  const fam = current ? familiesOf(current, de)[0]?.label : undefined;
  const readiness = current ? readinessControl(current.id) : undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-base font-semibold text-foreground">
          {de ? "Anforderung bewerten" : "Assess requirement"}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {de ? `${openLeft} offen` : `${openLeft} open`}
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-border overflow-hidden text-[11px] font-semibold" role="group">
          {(["open", "all"] as Scope[]).map(s => (
            <button key={s} type="button" onClick={() => setScope(s)} aria-pressed={scope === s}
              className={`px-2.5 py-1 ${scope === s ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted/60"}`}>
              {s === "open" ? (de ? "Nur offene" : "Open only") : (de ? "Alle" : "All")}
            </button>
          ))}
        </div>
      </div>

      {!current ? (
        <div className="text-center text-sm text-muted-foreground py-8">
          {scope === "open"
            ? (de ? "Keine offenen Anforderungen — alles bewertet." : "No open requirements — everything is assessed.")
            : (de ? "Noch keine Kontrollen." : "No controls yet.")}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="font-mono font-semibold text-foreground">{current.id}</span>
              {isMust(current) && <span className="px-1.5 py-0.5 rounded-full st-nein-tint st-nein-text font-semibold">MUSS</span>}
              {fam && <span className="text-muted-foreground truncate">{fam}</span>}
              <span className="ml-auto text-muted-foreground tabular-nums">
                {de ? `${idx + 1} von ${order.length}` : `${idx + 1} of ${order.length}`}
              </span>
            </div>
            <p className="text-base sm:text-lg leading-snug text-foreground">
              {(de ? current.req_de : current.req_en || current.req_de) ?? current.id}
            </p>
            {eff?.origin === "inherited" && (
              <p className="text-[11px] text-muted-foreground">
                {de ? "Antwort übernommen aus einem gleichen Kontrollpunkt eines anderen Frameworks." : "Answer inherited from an equivalent control in another framework."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ANSWERS.map(a => {
              const active = eff?.status === a.value;
              return (
                <button key={a.value} type="button" onClick={() => answer(a.value)} aria-pressed={active}
                  className={`h-12 rounded-xl border text-sm font-semibold transition-all ${
                    active ? `${a.cls} ring-2 ring-current ring-offset-1 ring-offset-card shadow` : "border-border bg-background text-foreground hover:bg-muted/60"
                  }`}>
                  <span className="mr-1.5">{a.icon}</span>{de ? a.de : a.en}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs">
              {eff?.status === "na" ? (
                <span className="text-muted-foreground">{de ? "Als nicht anwendbar erklärt." : "Declared not applicable."}</span>
              ) : readiness ? (
                <span className="text-muted-foreground" title={readiness.clause}>
                  {de ? "Vorbereitungspflicht — „nicht anwendbar“ nur im Detail." : "Readiness duty — “not applicable” only in Detail."}
                </span>
              ) : (
                <button type="button" onClick={() => setNaOpen(o => !o)} className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {de ? "Nicht anwendbar …" : "Not applicable …"}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={prev} disabled={idx === 0}
                className="h-8 px-2 rounded-md border border-border text-xs inline-flex items-center gap-1 disabled:opacity-40 hover:bg-muted/60">
                <ChevronLeft className="h-3.5 w-3.5" />{de ? "Zurück" : "Back"}
              </button>
              <button type="button" onClick={next} disabled={idx >= order.length - 1}
                className="h-8 px-2 rounded-md border border-border text-xs inline-flex items-center gap-1 disabled:opacity-40 hover:bg-muted/60">
                {de ? "Weiter" : "Next"}<ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {naOpen && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <label className="text-xs font-medium text-foreground" htmlFor="na-reason">
                {de ? "Begründung (Pflicht, mindestens 10 Zeichen — erscheint in der SoA)" : "Justification (required, at least 10 characters — shown in the SoA)"}
              </label>
              <Textarea id="na-reason" value={naText} onChange={e => setNaText(e.target.value)} rows={2} className="text-sm" />
              <div className="flex justify-end">
                <button type="button" onClick={saveNa} disabled={naText.trim().length < 10}
                  className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40">
                  {de ? "Als nicht anwendbar speichern" : "Save as not applicable"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
