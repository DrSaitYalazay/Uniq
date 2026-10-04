/**
 * Implementation (Umsetzung) — the only writable "live status" page.
 *
 * Two blocks:
 *  A. Gemeinsame Kontrollen  — mapped controls, deduped by ISO ref.
 *  B. Framework-spezifische Pflichten — delta controls per framework, no dedup.
 *
 * Status changes here do NOT rewrite Assessment/SoA snapshots — those stay
 * frozen as audit history. This page owns the live "wo stehen wir jetzt".
 */
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ExportMenu from "@/components/common/ExportMenu";
import { useSearchParams } from "react-router-dom";

// EINE Framework-Label-Quelle: DB-Code → FrameworkKey (BSI→BSI_ITGS) → FRAMEWORKS-Def.
const fwDef = (code: string) => FRAMEWORKS[(code === "BSI" ? "BSI_ITGS" : code) as FrameworkKey];
import { supabase } from "@/integrations/supabase/client";
import { useFramework, FRAMEWORKS, type FrameworkKey } from "@/contexts/FrameworkContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ModeToggle } from "@/components/ModeToggle";
import { useAssessmentMode } from "@/hooks/useAssessmentMode";
import { useImplementationStatus, isOverdue, todayIso, type ImplStatus } from "@/hooks/useImplementationStatus";
import { useComplianceOverview } from "@/hooks/useComplianceOverview";
import { useToolData } from "@/hooks/useToolData";
import { PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL, type Person, type PersonnelRegistry } from "@/lib/personnel";
import PersonSelect from "@/components/PersonSelect";
import { buildUmsetzungView, type RawControl, type SharedTask, type DeltaTask } from "@/lib/implementationEngine";
import { bundleGruppe, buildControlIndex, gruppeSortKey } from "@/lib/controlGrouping";
import { familyOf } from "@/lib/assessmentEngine";
import { generateExecutionPDF, generateExecutionWord, generateExecutionExcel, type ExecutionReportData } from "@/lib/executionReportGenerator";
import { getReportBrandName } from "@/lib/reportBrand";
import { FileDown } from "lucide-react";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Wrench, CheckCircle2, Loader2, AlertOctagon, Circle, Paperclip, CalendarClock } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import { LegalBadges } from "@/components/LegalBadges";


import { CHART_EMPTY, CHART_IMPL, CHART_STATUS } from "@/lib/chartPalette";
import { insideSliceLabel } from "@/lib/chartLabels";
import { isoRefOf, isoRefOfMany, isoThemeOf, isoThemeOfMany, type IsoTheme } from "@/data/isoThemes";
import { annexBucketLabel, annexFamilyLabel } from "@/data/isoAnnexMap";
import { IsoThemeGroups, type ThemeTopic } from "@/components/assessment/IsoThemeGroups";
const STATUS_META: Record<ImplStatus, { de: string; en: string; color: string; Icon: any }> = {
  offen:      { de: "Offen",     en: "Open",       color: "text-muted-foreground", Icon: Circle },
  laufend:    { de: "Laufend",   en: "In progress", color: "st-teilweise-text",        Icon: Loader2 },
  fertig:     { de: "Fertig",    en: "Done",       color: "st-ja-text",      Icon: CheckCircle2 },
  blockiert:  { de: "Blockiert", en: "Blocked",    color: "text-destructive",      Icon: AlertOctagon },
};

// Gruppenschlüssel aus bundle_key ableiten (Buchstabe + erste Zahl, normalisiert):
// Die frühere Gruppierung stand hier: `isoChapter()` schnitt aus dem
// Bündelschlüssel ein Präfix ("a5-15" → "a5") und schlug es in einer Tabelle
// GROUP_META nach, die nur a5–a8 und c4–c10 kannte. Das war der Schlüsselraum
// der ALTEN ISO-27001-Prüffragen. Seit der v6/v7-Umstellung ist ein
// Bündelschlüssel eine Kontroll-ID des neuen Katalogs ("C41.6", "ISO-ROLES",
// "D04-03", "BC-BIA"), also traf die Tabelle nie — und die Seite zeigte den
// rohen Code als Überschrift plus „Weitere Kontrollen" darunter.
//
// Jetzt geht die Umsetzung durch dieselbe Gruppierung wie die Bewertung
// (familyOf → meta.topic T01–T18). Siehe lib/controlGrouping.ts; geprüft über
// alle 4407 Kontrollen in outputs/etikett_waechter.cjs.

function StatusPicker({
  value, onChange, de,
}: { value: ImplStatus; onChange: (v: ImplStatus) => void; de: boolean }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as ImplStatus)}>
      <SelectTrigger className="h-8 w-32 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_META) as ImplStatus[]).map(s => (
          <SelectItem key={s} value={s}>{de ? STATUS_META[s].de : STATUS_META[s].en}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Editierbare Felder einer Aufgabenzeile (Teilmenge von ImplStatusRow). */
type TaskRowPatch = Partial<{ status: ImplStatus; owner: string | null; due_date: string | null; completed_at: string | null; evidence_url: string | null }>;

function TaskRow({
  bundleKey, title, subtitle, effort, badges, statusRow, onPatch, de, people, onAddPerson, focused = false, today, details, deferred = false, select,
}: {
  bundleKey: string;
  /** Auswahlfeld für Sammelaktionen (nur bei gemeinsamen Kontrollen gesetzt). */
  select?: { checked: boolean; onChange: (v: boolean) => void };
  focused?: boolean;
  /**
   * Zeile liegt weiter unten in einer langen Liste: Layout und Paint erst,
   * wenn sie in die Naehe des Sichtfensters kommt (content-visibility). Die
   * Groessenangabe verhindert das Springen der Bildlaufleiste.
   */
  deferred?: boolean;
  title: string;
  subtitle?: string;
  /** Aufklappbarer Inhalt unter der Zeile (bei Bündeln: die enthaltenen Anforderungen). */
  details?: React.ReactNode;
  effort: number;
  badges: React.ReactNode;
  statusRow: { status: ImplStatus; owner: string | null; due_date: string | null; completed_at: string | null; evidence_url: string | null };
  onPatch: (patch: TaskRowPatch) => void;
  de: boolean;
  people: Person[];
  onAddPerson: (p: Person) => void;
  /** ISO-Datum von heute (vom Parent, damit alle Zeilen denselben Stichtag nutzen). */
  today: string;
}) {
  const meta = STATUS_META[statusRow.status];
  const Icon = meta.Icon;
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focused && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focused]);
  // P6.8: gleiche Regel wie KPI-Kachel/Filter/Dashboard (isOverdue aus dem Hook).
  const overdue = isOverdue(statusRow, statusRow.status, today);
  // P6.3: Nachweis lokal puffern, erst bei Blur/Enter speichern (kein Debounce-Spam je Tastendruck).
  const [evidenceDraft, setEvidenceDraft] = useState(statusRow.evidence_url ?? "");
  useEffect(() => { setEvidenceDraft(statusRow.evidence_url ?? ""); }, [statusRow.evidence_url]);
  const commitEvidence = () => {
    const v = evidenceDraft.trim();
    if ((statusRow.evidence_url ?? "") !== v) onPatch({ evidence_url: v || null });
  };
  const hasEvidence = !!(statusRow.evidence_url ?? "").trim();
  const missingEvidence = statusRow.status === "fertig" && !hasEvidence;
  return (
    <div
      ref={rowRef}
      className={`border-b border-border/50 last:border-0 ${
        focused ? "rounded-md ring-2 ring-accent bg-accent/10 px-2 -mx-2" : ""
      } ${deferred ? "[content-visibility:auto] [contain-intrinsic-size:auto_none_auto_64px]" : ""}`}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto_auto] gap-3 items-center py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {select && (
            <input type="checkbox" checked={select.checked}
                   onChange={e => select.onChange(e.target.checked)}
                   aria-label={de ? `${bundleKey} auswählen` : `Select ${bundleKey}`}
                   className="h-3.5 w-3.5 accent-primary" />
          )}
          <code className="text-xs text-muted-foreground">{bundleKey}</code>
          {badges}
          {hasEvidence && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 st-ja-border st-ja-text" title={statusRow.evidence_url ?? ""}>
              {de ? "Nachweis ✓" : "Evidence ✓"}
            </Badge>
          )}
          {missingEvidence && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 st-teilweise-border st-teilweise-text" title={de ? "Fertig gemeldet, aber kein Nachweis hinterlegt — im Audit nicht belastbar." : "Reported done, but no evidence linked — not defensible in an audit."}>
              {de ? "ohne Nachweis" : "no evidence"}
            </Badge>
          )}
          {overdue && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/50 text-destructive">
              {de ? "überfällig" : "overdue"}
            </Badge>
          )}
        </div>
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
      </div>
      <label className="flex flex-col gap-0.5 w-14">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground text-right">{de ? "Aufwand" : "Effort"}</span>
        <span className="h-8 flex items-center justify-end text-xs tabular-nums text-muted-foreground">{effort.toFixed(1)} PT</span>
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{de ? "Zuständig" : "Owner"}</span>
        <PersonSelect
          value={statusRow.owner ?? ""}
          onChange={v => onPatch({ owner: v || null })}
          people={people}
          onAddPerson={onAddPerson}
          de={de}
          placeholder={de ? "— wählen —" : "— select —"}
          className="w-40"
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{de ? "Frist" : "Due"}</span>
        <Input
          type="date"
          value={statusRow.due_date ?? ""}
          onChange={e => onPatch({ due_date: e.target.value || null })}
          className={`h-8 w-36 text-xs ${overdue ? "border-destructive text-destructive" : ""}`}
          title={overdue ? (de ? "Frist überschritten — Aufgabe nicht fertig" : "Due date passed — task not done") : undefined}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{de ? "Abschluss" : "Completed"}</span>
        <Input
          type="date"
          value={statusRow.completed_at ?? ""}
          onChange={e => onPatch({ completed_at: e.target.value || null })}
          className="h-8 w-36 text-xs"
          title={de ? "Tatsächliches Erledigungsdatum — Basis der Fortschrittskurve" : "Actual completion date — basis of the progress curve"}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Paperclip size={9} />{de ? "Nachweis" : "Evidence"}</span>
        <Input
          type="text"
          value={evidenceDraft}
          onChange={e => setEvidenceDraft(e.target.value)}
          onBlur={commitEvidence}
          onKeyDown={e => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
          placeholder={de ? "URL / DMS-Referenz" : "URL / DMS reference"}
          className={`h-8 w-40 text-xs ${missingEvidence ? "st-teilweise-border" : ""}`}
          title={de ? "Link oder Dokumentenreferenz (z. B. DMS://ISMS/…); wird beim Verlassen des Feldes gespeichert" : "Link or document reference (e.g. DMS://ISMS/…); saved when leaving the field"}
        />
      </label>
      <label className="flex flex-col gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Status</span>
        <div className="flex items-center gap-2 h-8">
          <Icon size={14} className={`${meta.color} ${statusRow.status === "laufend" ? "animate-spin" : ""}`} />
          <StatusPicker value={statusRow.status} onChange={s => onPatch({ status: s })} de={de} />
        </div>
      </label>
    </div>
    {details}
    </div>
  );
}

/**
 * Lange Listen stückweise mounten.
 *
 * Eine Gruppe kann hunderte Aufgaben tragen (IT-Grundschutz allein 998, ISO
 * 27001 318). Jede Zeile bringt Auswahlfeld, zwei Datumsfelder, Nachweisfeld
 * und die aufklappbaren Anforderungen mit. Alle auf einmal zu mounten liess
 * die Seite beim Öffnen einer grossen Gruppe sekundenlang stehen — gemessen am
 * 20.09.2026, nachdem die Framework-Auswahl alles aufgeklappt hatte.
 * Gezeigt wird ein Block, der Rest kommt auf Klick.
 */
/**
 * Der Kontrollkatalog ist fuer alle Mandanten derselbe und aendert sich nur mit
 * einem Deploy. Einmal geladen, bleibt er fuer diese Sitzung im Speicher —
 * sonst laedt jeder Besuch der Seite rund 4 400 Zeilen erneut ueber das Netz.
 */
let katalogCache: RawControl[] | null = null;

function ZeilenListe<T>({ items, render, de, block = 25 }: {
  items: T[];
  render: (t: T, index: number) => React.ReactNode;
  de: boolean;
  block?: number;
}) {
  const [limit, setLimit] = useState(block);
  // Andere Liste (anderer Filter, andere Gruppe) → wieder beim ersten Block anfangen.
  useEffect(() => { setLimit(block); }, [items.length, block]);
  const rest = items.length - limit;
  return (
    <>
      {items.slice(0, limit).map((t, i) => render(t, i))}
      {rest > 0 && (
        <button type="button"
                onClick={() => setLimit(l => l + block * 2)}
                className="w-full mt-1 py-2 rounded border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent/5">
          {de
            ? `Weitere ${Math.min(block * 2, rest)} von ${items.length} anzeigen`
            : `Show ${Math.min(block * 2, rest)} more of ${items.length}`}
        </button>
      )}
    </>
  );
}

/**
 * Was steckt in einem Bündel? — aufklappbar, einzeln markierbar.
 *
 * Ein Bündel fasst zusammen, was auf dieselbe Kontrolle zeigt. Bei ISO 27001 und
 * NIS2 sind das zwei wortgleiche Kopien; bei den übrigen Frameworks können es
 * VERSCHIEDENE Anforderungen sein, die dasselbe Ziel adressieren — gemessen am
 * 17.09.2026 lagen unter dem Schlüssel „C46.1" 40 unterschiedliche KRITIS-/DORA-
 * Fragen (Zutrittskontrolle, Leitwarte, Serverraum …), auf dem Schirm als EINE
 * Zeile mit dem Titel einer davon. Ein Datum dort setzte alle 40 auf fertig.
 *
 * Entscheidung Dr. Sait: Bündel bleibt, aber sein Inhalt ist sichtbar und jede
 * enthaltene Anforderung einzeln zu setzen. Die Aufgabenzahl ändert sich nicht,
 * verdeckt wird nichts mehr.
 */
function BuendelInhalt({ mitglieder, de, textVon, kurzVon, statusVon, onStatus }: {
  mitglieder: string[];
  de: boolean;
  textVon: (memberId: string) => string;
  kurzVon: (framework: string) => string;
  statusVon: (memberId: string) => ImplStatus;
  onStatus: (memberId: string, s: ImplStatus) => void;
}) {
  const [offen, setOffen] = useState(false);
  if (mitglieder.length < 2) return null;
  const fertig = mitglieder.filter(m => statusVon(m) === "fertig").length;
  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={() => setOffen(o => !o)}
        className="text-[11px] text-accent-readable hover:underline inline-flex items-center gap-1">
        <ChevronDown size={11} className={`transition-transform ${offen ? "" : "-rotate-90"}`} />
        {de
          ? `Enthaltene Anforderungen (${mitglieder.length}) · ${fertig} erledigt`
          : `Included requirements (${mitglieder.length}) · ${fertig} done`}
      </button>
      {offen && (
        <div className="mt-1 ml-3 border-l-2 border-l-accent/25 pl-3 space-y-1.5">
          {mitglieder.map(mid => {
            const [fw, ...rest] = mid.split(":");
            const id = rest.join(":");
            const st = statusVon(mid);
            const M = STATUS_META[st];
            return (
              <div key={mid} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">{kurzVon(fw)}</Badge>
                    <code className="text-[10px] text-muted-foreground">{id}</code>
                  </div>
                  <div className="text-xs text-foreground">{textVon(mid)}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <M.Icon size={12} className={`${M.color} ${st === "laufend" ? "animate-spin" : ""}`} />
                  <StatusPicker value={st} onChange={s => onStatus(mid, s)} de={de} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface AuditActionLite { id: string; framework: string; controlId: string; controlReq: string; severity: string; measure: string; createdAt: string; done: boolean; owner?: string; due?: string; doneAt?: string; }
/** Aus dem Audit (Phase 07) übergebene Korrekturmaßnahmen. Rendert nur, wenn vorhanden.
 *  KVP-Schleife: Abhaken hier schließt den Audit-Befund (Sync in AuditWorkbench);
 *  Owner + Frist werden je Maßnahme gepflegt; „Zur Aufgabe" springt auf die Aufgabenzeile. */
// UniqSuite-Überblick „Maßnahmen": allgemein halten — Details stehen im Detail-Modus.
const SHOW_EVIDENCE_BAR = false;

function AuditActionsCard({ de, actions, setActions, people, onAddPerson, onFocus, compact = false, onShowAll }: {
  de: boolean; actions: AuditActionLite[]; compact?: boolean; onShowAll?: () => void;
  setActions: (fn: (d: { actions: AuditActionLite[] }) => { actions: AuditActionLite[] }) => void;
  people: Person[]; onAddPerson: (p: Person) => void; onFocus: (controlId: string) => void;
}) {
  if (actions.length === 0) return null;
  const patchA = (id: string, p: Partial<AuditActionLite>) => setActions(d => ({ actions: (d.actions ?? []).map(a => a.id === id ? { ...a, ...p } : a) }));
  const setDone = (id: string, done: boolean) => patchA(id, { done, doneAt: done ? new Date().toISOString() : undefined });
  const remove = (id: string) => setActions(d => ({ actions: (d.actions ?? []).filter(a => a.id !== id) }));
  const open = actions.filter(a => !a.done).length;
  const today = new Date().toISOString().slice(0, 10);
  const sevCls = (sv: string) => sv === "major" ? "bg-destructive/15 text-destructive" : sv === "beobachtung" ? "bg-slate-500/15 text-slate-600" : "st-teilweise-tint st-teilweise-text";
  // UniqSuite-Überblick: nur die offenen Korrekturmaßnahmen, höchstens drei, ohne Bearbeitung.
  if (compact) {
    const offen = actions.filter(a => !a.done);
    const ueberfaellig = offen.filter(a => !!a.due && a.due < today).length;
    if (offen.length === 0) return null;
    return (
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          <AlertOctagon size={15} className="text-primary" />{de ? "Korrekturmaßnahmen aus dem Audit" : "Corrective actions from the audit"}
          <Badge variant="outline" className="text-[10px]">{offen.length} {de ? "offen" : "open"}</Badge>
          {ueberfaellig > 0 && <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">{ueberfaellig} {de ? "überfällig" : "overdue"}</Badge>}
        </CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {offen.slice(0, 3).map(a => {
            const overdue = !!a.due && a.due < today;
            return (
              <div key={a.id} className="flex items-center gap-2 text-sm border-b border-border/50 last:border-0 pb-1.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${sevCls(a.severity)}`}>{a.severity}</span>
                <span className="flex-1 min-w-0 truncate" title={a.measure}>{a.measure}</span>
                {a.due && <span className={`text-[11px] tabular-nums shrink-0 ${overdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>{new Date(a.due).toLocaleDateString(de ? "de-DE" : "en-GB")}</span>}
              </div>
            );
          })}
          {onShowAll && (
            <button type="button" onClick={onShowAll} className="text-xs font-semibold text-accent-readable hover:underline pt-1">
              {offen.length > 3
                ? (de ? `Alle ${offen.length} bearbeiten im Detail →` : `Edit all ${offen.length} in Detail →`)
                : (de ? "Bearbeiten im Detail →" : "Edit in Detail →")}
            </button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
        <AlertOctagon size={15} className="text-primary" />{de ? "Korrekturmaßnahmen aus dem Audit" : "Corrective actions from the audit"}
        <Badge variant="outline" className="text-[10px]">{open} {de ? "offen" : "open"}</Badge>
        <span className="text-[10px] font-normal text-muted-foreground">{de ? "Abhaken schließt den Audit-Befund (Phase 06)." : "Ticking closes the audit finding (phase 06)."}</span>
      </CardTitle></CardHeader>
      <CardContent className="space-y-1.5">
        {actions.map(a => {
          const overdue = !a.done && !!a.due && a.due < today;
          return (
            <div key={a.id} className="flex items-start gap-2 text-xs border-b border-border/50 last:border-0 pb-1.5">
              <input type="checkbox" checked={a.done} onChange={e => setDone(a.id, e.target.checked)} className="mt-0.5" title={de ? "Erledigt — schließt den Audit-Befund" : "Done — closes the audit finding"} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${sevCls(a.severity)}`}>{a.severity}</span>
                  <button type="button" onClick={() => onFocus(a.controlId)} className="font-mono text-[10px] text-primary hover:underline" title={de ? "Zur Aufgabe springen" : "Jump to task"}>{a.framework} · {a.controlId} ↗</button>
                  {overdue && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">{de ? "überfällig" : "overdue"}</span>}
                  {a.done && a.doneAt && <span className="text-[9px] text-muted-foreground">{de ? "erledigt am" : "done on"} {new Date(a.doneAt).toLocaleDateString(de ? "de-DE" : "en-GB")}</span>}
                </div>
                <div className={`${a.done ? "line-through text-muted-foreground" : ""}`}>{a.measure}</div>
                {/* UniqSuite: Anforderungstext nur zeigen, wenn die Maßnahme ihn nicht schon wörtlich enthält. */}
                {!(a.measure ?? "").startsWith((a.controlReq ?? "").slice(0, 40)) && (
                  <div className="text-[10px] text-muted-foreground truncate">{a.controlReq}</div>
                )}
              </div>
              <label className="flex flex-col gap-0.5 shrink-0">
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{de ? "Zuständig" : "Owner"}</span>
                <PersonSelect value={a.owner ?? ""} onChange={v => patchA(a.id, { owner: v || undefined })} people={people} onAddPerson={onAddPerson} de={de} placeholder={de ? "— wählen —" : "— select —"} className="w-40" />
              </label>
              <label className="flex flex-col gap-0.5 shrink-0">
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{de ? "Frist" : "Due"}</span>
                <Input type="date" value={a.due ?? ""} onChange={e => patchA(a.id, { due: e.target.value || undefined })} className={`h-8 w-36 text-xs ${overdue ? "border-destructive text-destructive" : ""}`} />
              </label>
              <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive shrink-0 mt-1" title={de ? "Entfernen" : "Remove"}>✕</button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** embedded: als Abschnitt „Maßnahmen & Umsetzung" in Phase 05 (Plan & Umsetzung) —
 *  ohne eigene Seitenüberschrift und Ansichtsumschalter (die liefert die Phase). */
export default function Implementation({ embedded = false }: { embedded?: boolean } = {}) {
  const { active } = useFramework();
  const { lang } = useLanguage();
  const de = lang === "de";
  const { mode, setMode } = useAssessmentMode();
  // Deep-Link aus Roadmap/Dashboard: /implementation?focus=<control-id>&iso=<isoRef>
  // → Expertenliste, Filter auf die Maßnahme, Zeile hervorheben und hinscrollen.
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get("focus") ?? "";
  const focusIso = searchParams.get("iso") ?? "";
  const { rows, loading: statusLoading, update, getStatus } = useImplementationStatus();
  // Merkezî Personen-Register — tek okuma, PersonSelect'lere prop olarak geçer.
  const { data: personnel, setData: setPersonnel } = useToolData<PersonnelRegistry>(PERSONNEL_TOOL_KEY, PERSONNEL_LS_KEY, DEFAULT_PERSONNEL);
  const people = personnel.people ?? [];
  // Korrekturmaßnahmen aus dem Audit (Phase 07) — Karte oben + Badge an der Aufgabenzeile.
  const { data: auditActionsData, setData: setAuditActionsData } = useToolData<{ actions: AuditActionLite[] }>("audit-actions", "cws-audit-actions", { actions: [] });
  const auditActions = auditActionsData.actions ?? [];
  const auditByControl = useMemo(() => { const m = new Map<string, AuditActionLite>(); for (const a of auditActions) m.set(`${a.framework}:${a.controlId}`, a); return m; }, [auditActions]);
  const auditBadge = useCallback((memberIds: string[]) => {
    const hit = memberIds.map(id => auditByControl.get(id)).find(Boolean);
    if (!hit) return null;
    return <Badge key="audit" variant="outline" className={`text-[10px] px-1.5 py-0 ${hit.done ? "st-ja-border st-ja-text" : "border-destructive/50 text-destructive"}`} title={hit.measure}>{de ? "Audit-Befund" : "Audit finding"} · {hit.severity}{hit.done ? " ✓" : ""}</Badge>;
  }, [auditByControl, de]);
  const addPerson = (p: Person) => setPersonnel(d => ({ people: [...(d.people ?? []), p] }));

  const [allControls, setAllControls] = useState<RawControl[]>([]);
  const [loading, setLoading] = useState(true);

  // DB-Code-Raum verwenden (controls.framework), NICHT FrameworkKey — sonst lädt
  // z. B. BSI (DB „BSI" vs Key „BSI_ITGS") KEINE Kontrollen und fehlt in Umsetzung.
  const activeKeys = useMemo(() => active.map(f => (f.key === "BSI_ITGS" ? "BSI" : f.key)), [active]);

  /**
   * Der Katalog wird EINMAL je Sitzung geladen, die Framework-Auswahl filtert
   * danach im Browser.
   *
   * Vorher hing dieser Abruf an `activeKeys` und holte bei JEDER Auswahl zwei
   * Listen: die Kontrollen der gewaehlten Frameworks UND den gesamten Katalog
   * (rund 4 400 Zeilen samt meta-Feld, in Seiten zu 1 000). Das waren bei jedem
   * Klick auf ein Framework mehrere Netzabrufe hintereinander, bevor ueberhaupt
   * etwas zu sehen war. Der volle Katalog wird ohnehin gebraucht (Gruppen,
   * „auch in"-Hinweise), die gefilterte Liste ist eine Teilmenge davon.
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const PAGE = 1000;
      const fetchAll = async (filter?: string[]) => {
        const out: RawControl[] = [];
        let from = 0;
        for (let i = 0; i < 20; i++) {
          let q = supabase
            .from("controls")
            .select("id, framework, req_de, req_en, effort_pt, meta")
            .order("id")
            .range(from, from + PAGE - 1);
          if (filter && filter.length) q = q.in("framework", filter);
          const { data, error } = await q;
          if (error || !data) break;
          out.push(...(data as RawControl[]));
          if (data.length < PAGE) break;
          from += PAGE;
        }
        return out;
      };
      const all_ = katalogCache ?? await fetchAll();
      katalogCache = all_;
      if (!cancelled) { setAllControls(all_); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  /** Die aktiven Kontrollen sind eine Teilmenge des geladenen Katalogs. */
  const controls = useMemo(() => {
    if (activeKeys.length === 0) return [];
    const aktiv = new Set(activeKeys);
    return allControls.filter(c => aktiv.has(c.framework));
  }, [allControls, activeKeys]);

  // ── Gap → Umsetzung: Bewertungsergebnis fließt als Basis-Status ein ──────────
  // (umgesetzt→fertig, teilweise→laufend, sonst offen). Eine EXPLIZITE Umsetzung
  // (laufend/fertig/blockiert) hat als spätere Phase Vorrang. So gibt es nur zwei
  // Eingabeorte (Gap + Umsetzung); Änderungen in Gap wirken sofort.
  // overlay:false — sonst überlagert das persistierte umsetzung-effective die
  // Gap-Basis und der Status kann nie mehr heruntergesetzt werden (Ratchet).
  const { overview: gapOverview, gapDateByControl } = useComplianceOverview({ overlay: false });
  // Live-Konformität (Gap ∪ Umsetzung, „spätere Phase gewinnt") — IDENTISCH zum
  // Management-Dashboard. Der Umsetzungsgrad unten nutzt genau diesen Wert, damit
  // beide Ansichten dieselbe Kennzahl zeigen; die Aufgaben-Erledigung (fertig/total)
  // bleibt als sekundäre Info.
  const { overview: liveOverview } = useComplianceOverview();

  const view = useMemo(
    () => buildUmsetzungView(controls, activeKeys, allControls),
    [controls, activeKeys, allControls],
  );
  const gapByMember = useMemo(() => {
    const m = new Map<string, "ja" | "teilweise" | "nein" | "na">();
    for (const o of gapOverview) {
      o.effective.forEach((eff, cid) => {
        if (eff.status) m.set(`${o.framework}:${cid}`, eff.status as any);
      });
    }
    return m;
  }, [gapOverview]);

  const gapDerivedStatus = useCallback((memberIds: string[]): ImplStatus => {
    // „na" (nicht anwendbar) zählt nicht als Bewertung.
    const st = memberIds.map(id => gapByMember.get(id)).filter(s => s && s !== "na") as string[];
    if (st.length === 0) return "offen";
    if (st.every(s => s === "ja")) return "fertig";
    if (st.some(s => s === "ja" || s === "teilweise")) return "laufend";
    return "offen";
  }, [gapByMember]);

  const effStatus = useCallback((bundleKey: string, memberIds: string[]): ImplStatus => {
    const explicit = rows[bundleKey]?.status;
    if (explicit && explicit !== "offen") return explicit;   // spätere Phase gewinnt
    // Einzeln gesetzte Mitglieder eines Bündels zählen mit (seit die enthaltenen
    // Anforderungen aufklappbar und einzeln markierbar sind). Sonst könnte man
    // alle 40 Mitglieder auf fertig setzen und das Bündel stünde weiter auf offen.
    if (memberIds.length > 1) {
      const mSt = memberIds.map(id => rows[id]?.status).filter(Boolean) as ImplStatus[];
      if (mSt.some(s => s === "blockiert")) return "blockiert";
      if (mSt.length === memberIds.length && mSt.every(s => s === "fertig")) return "fertig";
      if (mSt.some(s => s === "fertig" || s === "laufend")) return "laufend";
    }
    return gapDerivedStatus(memberIds);
  }, [rows, gapDerivedStatus]);

  const allBundles = useMemo(
    () => [...view.shared, ...Object.values(view.deltaByFramework).flat()] as Array<{ bundle_key: string; memberControlIds: string[]; title: string; titleEn: string; effort_pt: number }>,
    [view],
  );

  // ── SoA-Geltungsbereich: „nicht anwendbar" / ausgeschlossen aus dem Nenner ────
  const { data: soaScope } = useToolData<{ controls: Record<string, { applicable?: boolean }> }>(
    "soa", "nis2suite-soa", { controls: {} },
  );
  const { data: treatmentScope } = useToolData<{ excludedControls?: Array<{ control_id: string }> }>(
    "risk-treatment", "risk-treatment", { excludedControls: [] },
  );
  const outOfScope = useMemo(() => {
    const s = new Set<string>();
    const add = (id: string) => {
      s.add(id);
      // SoA schreibt mit FrameworkKey-Namespace (z. B. „BSI_ITGS:ISMS.1.A1"),
      // Member-IDs nutzen den DB-Code („BSI:…"). Auch die reine Control-ID
      // aufnehmen, damit die Ausklammerung frameworkübergreifend greift.
      if (id.includes(":")) s.add(id.slice(id.indexOf(":") + 1));
    };
    for (const [id, v] of Object.entries(soaScope.controls ?? {})) {
      if (v && v.applicable === false) add(id);
    }
    for (const e of (treatmentScope.excludedControls ?? [])) add(e.control_id);
    return s;
  }, [soaScope, treatmentScope]);
  const isOutOfScope = useCallback((memberIds: string[]): boolean => {
    if (outOfScope.size === 0 || memberIds.length === 0) return false;
    return memberIds.every(m => {
      const cid = m.includes(":") ? m.slice(m.indexOf(":") + 1) : m;
      return outOfScope.has(m) || outOfScope.has(cid);
    });
  }, [outOfScope]);

  // In-Scope-Bündel = Nenner (SoA-kapsam dışı düşülmüş).
  const scopedBundles = useMemo(
    () => allBundles.filter(t => {
      const ids = t.memberControlIds ?? [];
      if (isOutOfScope(ids)) return false;
      // Bündel, deren Mitglieder allesamt „na" sind, gehören nicht in den Nenner.
      if (ids.length > 0 && ids.every(id => gapByMember.get(id) === "na")) return false;
      return true;
    }),
    [allBundles, isOutOfScope, gapByMember],
  );

  const effSummary = useMemo(() => {
    const c = { offen: 0, laufend: 0, fertig: 0, blockiert: 0 };
    for (const t of scopedBundles) c[effStatus(t.bundle_key, t.memberControlIds ?? [])]++;
    return c;
  }, [scopedBundles, effStatus]);

  // ── P6.2: EINE PT-Summenquelle für beide Kacheln ────────────────────────────
  // Ursache der früheren Differenz („Restaufwand … von 197 PT gesamt" vs. „PT netto
  // 202"): `view.totalPtNetto` (implementationEngine) summiert ALLE Bündel des
  // Programms, `ptRest.total` nur `scopedBundles` — also OHNE die per SoA/Risiko-
  // behandlung ausgeklammerten und OHNE die komplett „n.a." bewerteten Bündel.
  // Die 5 PT waren genau der Aufwand dieser ausgeklammerten Bündel. Jetzt lesen
  // beide Kacheln aus diesem einen useMemo: netto = In-Scope-Summe, brutto = je
  // Framework gezählte Mitglieder derselben In-Scope-Bündel (gleicher Nenner).
  // Restaufwand: nur NICHT fertige Bündel, laufende zählen zur Hälfte.
  const ptSums = useMemo(() => {
    const ptByMember = new Map<string, number>();
    for (const c of controls) {
      const v = Number(c.effort_pt ?? 0);
      ptByMember.set(`${c.framework}:${c.id}`, Number.isFinite(v) ? v : 0);
    }
    let rest = 0, netto = 0, brutto = 0;
    for (const t of scopedBundles) {
      const pt = Number((t as { effort_pt?: number | null }).effort_pt ?? 0) || 0;
      netto += pt;
      for (const m of (t.memberControlIds ?? [])) brutto += ptByMember.get(m) ?? 0;
      const st = effStatus(t.bundle_key, t.memberControlIds ?? []);
      if (st === "fertig") continue;
      rest += st === "laufend" ? pt * 0.5 : pt;
    }
    // Zur Transparenz: was gegenüber dem Gesamtprogramm abgezogen wurde.
    const excludedNetto = Math.max(0, view.totalPtNetto - netto);
    return { rest, total: netto, netto, brutto, excludedNetto };
  }, [scopedBundles, effStatus, controls, view.totalPtNetto]);
  const ptRest = ptSums;

  // ── P6.8 / P6.3: Überfällig + Fertig-ohne-Nachweis (eine Regel, eine Zahl) ──
  const today = todayIso();
  const overdueKeys = useMemo(() => {
    const s = new Set<string>();
    for (const t of scopedBundles) {
      if (isOverdue(rows[t.bundle_key], effStatus(t.bundle_key, t.memberControlIds ?? []), today)) s.add(t.bundle_key);
    }
    return s;
  }, [scopedBundles, rows, effStatus, today]);
  const noEvidenceKeys = useMemo(() => {
    const s = new Set<string>();
    for (const t of scopedBundles) {
      if (effStatus(t.bundle_key, t.memberControlIds ?? []) === "fertig" && !(rows[t.bundle_key]?.evidence_url ?? "").trim()) s.add(t.bundle_key);
    }
    return s;
  }, [scopedBundles, rows, effStatus]);

  // CHG-13: Datensatz für den Umsetzungs-Bericht (executionReportGenerator).
  // Aus den bereits berechneten Live-Daten (scopedBundles + effStatus + Overview).
  const execReportData = useMemo<ExecutionReportData>(() => {
    const total = scopedBundles.length;
    const { fertig, laufend, offen, blockiert } = effSummary;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    const statusOf = (t: { bundle_key: string; memberControlIds?: string[] }) => effStatus(t.bundle_key, t.memberControlIds ?? []);
    const chartData = activeKeys.map((fw) => {
      const inFw = scopedBundles.filter((t) => (t.memberControlIds ?? []).some((m) => m.startsWith(`${fw}:`)));
      let completed = 0, inProgress = 0, notStarted = 0;
      for (const t of inFw) { const s = statusOf(t); if (s === "fertig") completed++; else if (s === "laufend") inProgress++; else notStarted++; }
      return { name: fwDef(fw)?.short ?? fw, completed, inProgress, notStarted, overdue: 0 };
    });
    const todayStr = todayIso();
    let overdueCount = 0;
    let quickWinCount = 0;
    const actionItems = scopedBundles.slice(0, 500).map((t) => {
      const st = statusOf(t);
      const row = rows[t.bundle_key];
      const due = row?.due_date ?? "";
      const overdueRow = isOverdue(row, st, todayStr); // P6.8: dieselbe Regel wie KPI/Filter
      if (overdueRow) overdueCount++;
      // Quick Win = geringer Aufwand (≤ 2 PT) und noch nicht fertig.
      if (st !== "fertig" && (t.effort_pt ?? 0) > 0 && (t.effort_pt ?? 0) <= 2) quickWinCount++;
      return {
        id: t.bundle_key,
        name: t.title ?? t.bundle_key,
        nameEn: t.titleEn ?? t.title ?? t.bundle_key,
        actionStatus: st,
        actionOwner: row?.owner ?? "",
        actionDueDate: due,
        isOverdue: overdueRow,
        priority: "",
        linkedToHighRisk: false,
      };
    });
    const criticalCount = gapOverview.reduce((a, o) => a + (o.stats.criticalOpen || 0), 0);
    // Kontrollumfang so aufbauen, dass die Gleichung aufgeht:
    // BASELINE − entbehrlich − soaExcluded + soaAdded = finalScope.
    const baseline = allBundles.length;
    const soaExcluded = baseline - total;
    return {
      controlScope: { BASELINE: baseline, entbehrlich: 0, soaExcluded, soaAdded: 0, finalScope: total, implemented: fertig, partial: laufend, notImpl: offen + blockiert },
      // KONTROLL-basierte Zahlen — genau die des Bildschirms (Überblick/Dashboard).
      // Ohne diesen Block rechnete der Bericht nur Aufgaben (1490) und der
      // Bildschirm Kontrollen (1738): drei Summen an einem Tag, keine Kennzeichnung.
      controlBased: (() => {
        const ja = liveOverview.reduce((a, o) => a + (((o.stats as any).ja) || 0), 0);
        const tw = liveOverview.reduce((a, o) => a + (((o.stats as any).teilweise) || 0), 0);
        const app = liveOverview.reduce((a, o) => a + (((o.stats as any).applicable) || 0), 0);
        return {
          applicable: app,
          implemented: ja,
          partial: tw,
          open: Math.max(0, app - ja - tw),
          // livePct wird WEITER UNTEN deklariert — hier nicht referenzieren
          // (temporal dead zone → ReferenceError zur Laufzeit, den kein
          //  Bundler meldet). Gleiche Formel, lokal gerechnet.
          gradePct: app > 0 ? Math.round(((ja + 0.5 * tw) / app) * 100) : 0,
          noEvidence: noEvidenceKeys.size,
          overdue: overdueCount,
        };
      })(),
      actionStats: { total, completed: fertig, inProgress: laufend, blocked: blockiert, notStarted: offen, completedPct: pct(fertig), inProgressPct: pct(laufend), blockedPct: pct(blockiert), notStartedPct: pct(offen) },
      chartData,
      insights: [],
      actionItems,
      criticalCount,
      quickWinCount,
      overdueCount,
      blockedCount: blockiert,
      userNotes: "",
    };
  }, [scopedBundles, allBundles, rows, effSummary, effStatus, activeKeys, gapOverview, liveOverview, noEvidenceKeys]);

  // ── Fortschritts-Datensatz (Single Source) für die Dashboard-Auswertung ──────
  // Je effektiv umgesetzter/laufender Aufgabe ein Ereignis {Datum, Gewicht}.
  // Datum = expliziter Abschluss (completed_at) → sonst Gap-Antwortdatum → sonst
  // Status-Änderungsdatum → sonst heute. Gewicht: fertig=1, laufend=0.5.
  // Roh-Ereignisse (mit Bündelschlüssel); Datum wird erst im Effekt „eingefroren".
  const computedEvents = useMemo(() => {
    const out: Array<{ k: string; w: number; cand: string; explicit: string; stamped: string; f: string[] }> = [];
    for (const t of scopedBundles) {
      const st = effStatus(t.bundle_key, t.memberControlIds ?? []);
      if (st !== "fertig" && st !== "laufend") continue;
      const w = st === "fertig" ? 1 : 0.5;
      const r = rows[t.bundle_key];
      const explicit = r?.completed_at ?? "";
      const stamped = r?.first_implemented_at ?? "";
      let latest = "";
      for (const id of (t.memberControlIds ?? [])) {
        const gd = gapDateByControl.get(id);
        if (gd && gd > latest) latest = gd;
      }
      const cand = latest ? latest.slice(0, 10)
        : (r?.last_status_change_at ? r.last_status_change_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
      // Frameworks der Mitglieder (`FW:id`) — gemeinsame Bündel („a5-21") tragen keinen
      // Framework-Präfix im Schlüssel; das Dashboard filtert den Verlauf darüber.
      const f = [...new Set((t.memberControlIds ?? []).map(m => m.split(":")[0]).filter(Boolean))];
      out.push({ k: t.bundle_key, w, cand, explicit, stamped, f });
    }
    return out;
  }, [scopedBundles, effStatus, rows, gapDateByControl]);

  // Effektive Umsetzung je Kontroll-Mitglied (`${fw}:${id}` → ja/teilweise) —
  // damit die Compliance-Kennzahl „spätere Phase gewinnt" berücksichtigt und
  // ALLE Dashboard-Zahlen aus EINER Quelle konsistent sind.
  const effectiveMembers = useMemo(() => {
    // NUR der explizite Umsetzungs-Status wird als „spätere Phase" persistiert.
    // Gap-abgeleitete Status stehen bereits in den Gap-Antworten; sie hier erneut
    // einzuspeisen würde den Gap-Wert verfälschen (nein→teilweise) und den Ratchet
    // auslösen.
    const m: Record<string, "ja" | "teilweise"> = {};
    for (const t of scopedBundles) {
      const st = rows[t.bundle_key]?.status;
      if (st === "fertig") for (const id of (t.memberControlIds ?? [])) m[id] = "ja";
      else if (st === "laufend") for (const id of (t.memberControlIds ?? [])) { if (m[id] !== "ja") m[id] = "teilweise"; }
    }
    return m;
  }, [scopedBundles, rows]);
  const { setData: setEffPersist, loading: effLoading } = useToolData<{ members: Record<string, "ja" | "teilweise"> }>(
    "umsetzung-effective", "umsetzung-effective", { members: {} },
  );
  const effMemSig = useRef("");
  useEffect(() => {
    if (loading || statusLoading || effLoading) return;
    const sig = JSON.stringify(effectiveMembers);
    if (sig === effMemSig.current) return;
    effMemSig.current = sig;
    setEffPersist({ members: effectiveMembers });
  }, [effectiveMembers, loading, statusLoading, effLoading, setEffPersist]);

  const { data: savedProgress, setData: setProgressPersist, loading: progLoading } =
    useToolData<{ total: number; events: Array<{ k: string; d: string; w: number; f?: string[] }> }>(
      "umsetzung-progress", "umsetzung-progress", { total: 0, events: [] },
    );
  const progSig = useRef("");
  useEffect(() => {
    if (loading || statusLoading || progLoading) return;
    // Datum einfrieren (immutable): expliziter completed_at > bereits gespeichertes
    // Datum > berechneter Kandidat. So verschiebt sich ein historisches Datum NICHT,
    // wenn eine Gap-Antwort später erneut gespeichert wird (updated_at ändert sich).
    // Nur gültige Tagesangaben übernehmen: frühere API-Versionen lieferten DATE-Spalten
    // als Zeitstempel ("2026-08-22T22:00:00.000Z"); solche Altwerte fallen auf den
    // Kandidaten zurück, statt das Dashboard dauerhaft leer zu halten.
    const day = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "");
    const prev = new Map((savedProgress.events ?? []).map(e => [e.k, day(e.d)]));
    const events = computedEvents.map(e => ({ k: e.k, w: e.w, f: e.f, d: day(e.explicit) || day(e.stamped) || prev.get(e.k) || e.cand }));
    const next = { total: scopedBundles.length, events };
    const sig = JSON.stringify(next);
    if (sig === progSig.current) return;
    progSig.current = sig;
    setProgressPersist(next);
  }, [computedEvents, scopedBundles.length, savedProgress.events, loading, statusLoading, setProgressPersist]);

  // ── Block-A Filter/Gruppierung (400+ Kontrollen handhabbar machen) ──
  const [fSearch, setFSearch] = useState("");
  const focusApplied = useRef<string>("");
  useEffect(() => {
    if (!focusId || focusApplied.current === focusId) return;
    focusApplied.current = focusId;
    if (mode !== "expert") setMode("expert");
    // Bündel-Keys sind DB-Codes (z. B. "a5-15" sequenziell, "NIS2:scope-09"), NICHT die
    // Annex-Nummer "A.5.15" → primär über die Kontroll-ID (Mitglied `FW:id`) suchen.
    setFSearch(focusId || focusIso);
    setFStatus("all"); setFFw("all");
  }, [focusId, focusIso, mode, setMode]);
  /** Trifft das Bündel den Deep-Link? (Mitglied `FW:id`, Bündel-Key oder ISO-Referenz) */
  const isFocused = useCallback((bundleKey: string, members: string[]) => {
    if (!focusId && !focusIso) return false;
    const tail = `:${focusId}`;
    if (focusId && (bundleKey === focusId || members.some(m => m === focusId || m.endsWith(tail)))) return true;
    if (focusIso && (bundleKey === focusIso || bundleKey.endsWith(`:${focusIso}`))) return true;
    return false;
  }, [focusId, focusIso]);
  // Status-Filter: echte Status + zwei abgeleitete Sichten (P6.8 überfällig, P6.3 fertig ohne Nachweis).
  type StatusFilter = "all" | ImplStatus | "overdue" | "no_evidence";
  const [fStatus, setFStatus] = useState<StatusFilter>("all");
  const [fFw, setFFw] = useState<"all" | string>("all");
  // Zweites Framework für den Vergleich „A ∩ B": nur die Kontrollen, die BEIDE
  // tragen (Wunsch Dr. Sait 25.09.2026: bei zwei gewählten Frameworks sehen, wie
  // viele Kontrollen gemeinsam sind, und nur diese bearbeiten). "none" = aus.
  const [fFw2, setFFw2] = useState<string>("none");
  const pairActive = fFw !== "all" && fFw2 !== "none" && fFw2 !== fFw;
  useEffect(() => { if (fFw === "all" || fFw2 === fFw) setFFw2("none"); }, [fFw, fFw2]);
  // Gruppenfilter: dieselbe Gruppierung wie die Ueberschriften, damit Framework-
  // und Gruppenfilter KOMBINIERBAR sind (Wunsch Dr. Sait 17.09.2026: "hem
  // framework filtresi hem grup filtresi olabilmeli").
  const [fGroup, setFGroup] = useState<"all" | string>("all");

  // Index ueber ALLE Kontrollen — der Buendelschluessel ist eine Kontroll-ID
  // aus dem NIS2/ISO-Raum; ohne Aufloesung gaebe es nur den Code.
  const ctrlIndex = useMemo(() => buildControlIndex(allControls), [allControls]);
  // Mitglieder eines Bündels heissen `FW:id`. Über die blosse ID ginge es nicht:
  // ISO 27001 und NIS2 führen 224 Kontrollen unter DERSELBEN ID.
  const ctrlByMember = useMemo(() => {
    const m = new Map<string, RawControl>();
    for (const c of allControls) m.set(`${c.framework}:${c.id}`, c);
    return m;
  }, [allControls]);
  // Kontroll-ID -> meta.topic, damit familyOf() auch fuer Frameworks ohne
  // eigenes Thema (KRITIS, DORA, SOC2 …) das Thema der referenzierten
  // NIS2/ISO-Kontrolle findet statt im Sammeltopf zu landen.
  const themaIndex = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of allControls) {
      const t = (c.meta as any)?.topic;
      if (typeof t === "string" && t) m.set(c.id, t);
    }
    return m;
  }, [allControls]);

  /** Gruppenname einer Delta-Aufgabe (Block B) — dieselbe Quelle wie Block A. */
  const deltaGruppe = useCallback((t: DeltaTask): string => {
    const c = ctrlIndex.get(t.control_id);
    if (c) {
      const f = familyOf(c as any, de, themaIndex);
      if (f.label && f.label !== f.id) return f.label;
    }
    return de ? "Ohne Themenzuordnung" : "No topic assigned";
  }, [ctrlIndex, themaIndex, de]);

  const filteredShared = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    return view.shared.filter(t => {
      if (fFw !== "all" && !t.frameworks.includes(fFw as FrameworkKey)) return false;
      if (pairActive && !t.frameworks.includes(fFw2 as FrameworkKey)) return false;
      if (fGroup !== "all" && bundleGruppe(t.bundle_key, ctrlIndex, de, t.memberControlIds).label !== fGroup) return false;
      if (fStatus === "overdue") { if (!overdueKeys.has(t.bundle_key)) return false; }
      else if (fStatus === "no_evidence") { if (!noEvidenceKeys.has(t.bundle_key)) return false; }
      else if (fStatus !== "all" && effStatus(t.bundle_key, t.memberControlIds) !== fStatus) return false;
      if (q) {
        const hay = `${t.bundle_key} ${t.title} ${t.titleEn} ${t.memberControlIds.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [view.shared, fSearch, fStatus, fFw, fFw2, pairActive, fGroup, ctrlIndex, de, effStatus, overdueKeys, noEvidenceKeys]);

  /** Anzahl gemeinsamer Kontrollen von A und B — unabhängig von Suche/Status/Gruppe. */
  const pairCount = useMemo(
    () => pairActive ? view.shared.filter(t => t.frameworks.includes(fFw as FrameworkKey) && t.frameworks.includes(fFw2 as FrameworkKey)).length : 0,
    [view.shared, pairActive, fFw, fFw2],
  );

  // Alle vorkommenden Gruppennamen — aus BEIDEN Bloecken, damit der Filter
  // auch greift, wenn ein Framework (z. B. ISO 27001) gar keine gemeinsamen
  // Buendel bildet und komplett in Block B liegt.
  const alleGruppen = useMemo(() => {
    const set = new Set<string>();
    for (const t of view.shared) set.add(bundleGruppe(t.bundle_key, ctrlIndex, de, t.memberControlIds).label);
    for (const fw of activeKeys) for (const t of (view.deltaByFramework[fw] ?? [])) set.add(deltaGruppe(t));
    return [...set].sort((a, b) => a.localeCompare(b, de ? "de" : "en"));
  }, [view, activeKeys, ctrlIndex, de, deltaGruppe]);

  const sharedGroups = useMemo(() => {
    const map = new Map<string, { label: string; items: SharedTask[] }>();
    for (const t of filteredShared) {
      const g = bundleGruppe(t.bundle_key, ctrlIndex, de, t.memberControlIds);
      const e = map.get(g.id) ?? map.set(g.id, { label: g.label, items: [] }).get(g.id)!;
      e.items.push(t);
    }
    return Array.from(map.entries())
      .sort((a, b) => gruppeSortKey(a[0]).localeCompare(gruppeSortKey(b[0]), undefined, { numeric: true }))
      .map(([id, v]) => [id, v.items, v.label] as [string, SharedTask[], string]);
  }, [filteredShared, ctrlIndex, de]);

  /**
   * Block B je Framework — dieselben Filter wie Block A, einmal berechnet.
   *
   * Der Framework-Filter wirkte hier bisher NICHT: wer „nur ISO 27001" waehlte,
   * bekam die uebrigen Frameworks trotzdem angezeigt. Ausserdem lief die
   * Filterung bei jedem Rendern erneut ueber alle Delta-Aufgaben.
   */
  const deltaGefiltert = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    const out: Record<string, DeltaTask[]> = {};
    for (const fw of activeKeys) {
      // Framework-eigene Pflichten sind nie gemeinsam — im A∩B-Vergleich leer.
      if (pairActive || (fFw !== "all" && fw !== fFw)) { out[fw] = []; continue; }
      out[fw] = (view.deltaByFramework[fw] ?? []).filter(i => {
        if (fStatus === "overdue") { if (!overdueKeys.has(i.bundle_key)) return false; }
        else if (fStatus === "no_evidence") { if (!noEvidenceKeys.has(i.bundle_key)) return false; }
        else if (fStatus !== "all" && effStatus(i.bundle_key, i.memberControlIds ?? []) !== fStatus) return false;
        if (fGroup !== "all" && deltaGruppe(i) !== fGroup) return false;
        if (q && !`${i.control_id} ${i.title} ${i.titleEn}`.toLowerCase().includes(q)) return false;
        return true;
      });
    }
    return out;
  }, [view, activeKeys, fSearch, fStatus, fFw, pairActive, fGroup, overdueKeys, noEvidenceKeys, effStatus, deltaGruppe]);

  // ── Auf-/Zuklappen, alle Ebenen an einem Ort ──────────────────────────────
  // Grafiken, die beiden Hauptabschnitte, die Kapitel in Block A, die Frameworks
  // in Block B und deren Gruppen. Getrennte Zustände, damit das Zuklappen eines
  // Hauptabschnitts die Wahl darin NICHT verwirft: wer „Framework-spezifische
  // Pflichten" schließt und wieder öffnet, findet dieselben Frameworks offen vor.
  const [openCharts, setOpenCharts] = useState(true);
  // Im Detail-Modus startet die Kennzahlenkarte zugeklappt: dort ist die
  // Aufgabenliste die Hauptsache. Beim Wechsel zurück in den Überblick geht sie
  // wieder auf. Ein Klick des Nutzers gilt, bis der Modus erneut wechselt.
  const letzterModus = useRef(mode);
  useEffect(() => {
    if (letzterModus.current === mode) return;
    letzterModus.current = mode;
    setOpenCharts(mode !== "expert");
  }, [mode]);
  const [openSections, setOpenSections] = useState<string[]>(["shared", "delta"]);
  const [openSharedGroups, setOpenSharedGroups] = useState<string[]>([]);
  const [openFw, setOpenFw] = useState<string[]>([]);
  const [openFwGroups, setOpenFwGroups] = useState<string[]>([]);

  /** Alle Gruppenschlüssel aus Block B — `${Framework}::${Gruppe}`. */
  const alleFwGruppen = useMemo(() => {
    const out: string[] = [];
    for (const fw of activeKeys)
      for (const g of new Set((view.deltaByFramework[fw] ?? []).map(deltaGruppe))) out.push(`${fw}::${g}`);
    return out;
  }, [view, activeKeys, deltaGruppe]);

  const alleAufklappen = useCallback(() => {
    setOpenCharts(true);
    setOpenSections(["shared", "delta"]);
    setOpenSharedGroups(sharedGroups.map(([ch]) => ch));
    setOpenFw([...activeKeys]);
    setOpenFwGroups(alleFwGruppen);
  }, [sharedGroups, activeKeys, alleFwGruppen]);

  const alleZuklappen = useCallback(() => {
    setOpenCharts(false);
    setOpenSections([]);
    setOpenSharedGroups([]);
    setOpenFw([]);
    setOpenFwGroups([]);
  }, []);

  /**
   * Aufklappen nur bei der TEXTSUCHE — und nur dort, wo es Treffer gibt.
   *
   * Vorher klappte jede Filteraenderung ALLES auf: ein Klick auf „Framework:
   * ISO 27001" mountete in einem Zug alle Gruppen aller Frameworks, also
   * hunderte bis ueber tausend Aufgabenzeilen mit je einem Auswahlfeld, zwei
   * Datumsfeldern und einem Nachweisfeld. Die Seite hing, und statt der
   * gewuenschten zugeklappten Gliederung standen sofort alle Details da.
   * Die Auswahlfelder filtern jetzt nur noch; geoeffnet wird per Klick.
   * Bei sehr vielen Treffern (Suche nach einem einzelnen Buchstaben) bleiben
   * die Gruppen zu — sonst waere das Aufklappen wieder der teure Fall.
   */
  const filterSig = `${fSearch.trim()}|${fStatus}|${fFw}|${pairActive ? fFw2 : ""}|${fGroup}`;
  // Auswahl für Sammelaktionen (Bündel-Keys aus Block A). Bei jeder
  // Filteränderung geleert, damit nie unsichtbare Zeilen mitgeändert werden.
  const [sel, setSel] = useState<Set<string>>(() => new Set());
  useEffect(() => { setSel(new Set()); }, [filterSig]);
  const selItems = useMemo(() => filteredShared.filter(t => sel.has(t.bundle_key)), [filteredShared, sel]);
  const toggleSel = useCallback((k: string, v: boolean) => setSel(s => {
    const n = new Set(s); if (v) n.add(k); else n.delete(k); return n;
  }), []);
  const letzteFilterSig = useRef(filterSig);
  useEffect(() => {
    if (letzteFilterSig.current === filterSig) return;
    letzteFilterSig.current = filterSig;
    if (fSearch.trim() === "") return;
    const deltaTreffer = Object.entries(deltaGefiltert).filter(([, items]) => items.length > 0);
    const treffer = filteredShared.length + deltaTreffer.reduce((a, [, items]) => a + items.length, 0);
    setOpenSections(["shared", "delta"]);
    if (treffer > 300) return;
    setOpenSharedGroups(sharedGroups.map(([ch]) => ch));
    setOpenFw(deltaTreffer.map(([fw]) => fw));
    setOpenFwGroups(deltaTreffer.flatMap(([fw, items]) =>
      [...new Set(items.map(deltaGruppe))].map(g => `${fw}::${g}`)));
  }, [filterSig, fSearch, sharedGroups, filteredShared, deltaGefiltert, deltaGruppe]);

  /**
   * Fortschritt je Thema über BEIDE Blöcke.
   *
   * Vorher speiste sich diese Liste allein aus `sharedGroups`, also nur aus den
   * gemeinsamen Kontrollen. Bei einer Auswahl ohne Überschneidung blieb sie leer,
   * bei ISO 27001 + NIS2 zeigte sie 88 von 586 Aufgaben — ein Fortschrittsbalken,
   * der den größten Teil der Arbeit nicht kennt. Jede Aufgabe kommt genau einmal
   * vor (ein Bündel ist EINE Aufgabe), doppelt gezählt wird nichts.
   */
  const gruppenFortschritt = useMemo(() => {
    type Auf = { bundle_key: string; memberControlIds?: string[] };
    const m = new Map<string, Auf[]>();
    const dazu = (label: string, t: Auf) => (m.get(label) ?? m.set(label, []).get(label)!).push(t);
    for (const t of view.shared) dazu(bundleGruppe(t.bundle_key, ctrlIndex, de, t.memberControlIds).label, t);
    for (const fw of activeKeys) for (const t of (view.deltaByFramework[fw] ?? [])) dazu(deltaGruppe(t), t);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], de ? "de" : "en"));
  }, [view, activeKeys, ctrlIndex, de, deltaGruppe]);

  /** Überblick: Aufgaben je ISO-27001-Bereich (Kap. 4–10, A.5–A.8) und darin je Thema. */
  const themenIso = useMemo(() => {
    const m = new Map<IsoTheme, Map<string, { done: number; total: number }>>();
    const dazu = (th: IsoTheme, label: string, fertig: boolean) => {
      const inner = m.get(th) ?? m.set(th, new Map()).get(th)!;
      const e = inner.get(label) ?? inner.set(label, { done: 0, total: 0 }).get(label)!;
      e.total++; if (fertig) e.done++;
    };
    // Thema im Bereich = die ISO-Referenz der Aufgabe (Anhang-A-Kontrolle bzw. Kapitel 4–10);
    // nur Aufgaben ohne ISO-Bezug behalten ihr bisheriges Thema.
    const lang = de ? "de" : "en";
    const ohneIso = (fw: string | undefined) =>
      `${(fw && fwDef(fw)?.short) || fw || ""} · ${de ? "ohne direkte ISO-Entsprechung" : "no direct ISO counterpart"}`;
    const thema = (ref: string | undefined, fw: string | undefined) =>
      !ref ? ohneIso(fw) : ref.startsWith("A.") ? annexBucketLabel(ref, lang) : annexFamilyLabel(ref.split(".")[0], lang);
    for (const t of view.shared) {
      const ids = t.memberControlIds ?? [];
      const th = isoThemeOfMany(ids);
      dazu(th, thema(isoRefOfMany(ids, th), t.frameworks?.[0]), effStatus(t.bundle_key, ids) === "fertig");
    }
    for (const fw of activeKeys) for (const t of (view.deltaByFramework[fw] ?? [])) {
      const th = isoThemeOf(t.control_id);
      dazu(th, thema(isoRefOf(t.control_id), t.framework), effStatus(t.bundle_key, (t as any).memberControlIds ?? []) === "fertig");
    }
    const out = new Map<IsoTheme, ThemeTopic[]>();
    for (const [th, inner] of m) out.set(th, [...inner.entries()].map(([label, e]) => ({ label, num: e.done, den: e.total, ratio: `${e.done}/${e.total}` })));
    return out;
  }, [view, activeKeys, de, effStatus]);

  const summary = useMemo(() => {
    const counts = { offen: 0, laufend: 0, fertig: 0, blockiert: 0 };
    const track = (k: string) => counts[getStatus(k)]++;
    view.shared.forEach(t => track(t.bundle_key));
    Object.values(view.deltaByFramework).flat().forEach(t => track(t.bundle_key));
    return counts;
  }, [view, getStatus, rows]);

  const totalTasks = scopedBundles.length;
  const doneRatio = totalTasks > 0 ? Math.round((effSummary.fertig / totalTasks) * 100) : 0;
  // Umsetzungsgrad = kontrollbasierte Live-Konformität (identisch zum Dashboard).
  const livePct = useMemo(() => {
    const num = liveOverview.reduce((a, o) => a + ((o.stats as any).ja || 0) + 0.5 * ((o.stats as any).teilweise || 0), 0);
    const den = liveOverview.reduce((a, o) => a + ((o.stats as any).applicable || 0), 0);
    return den > 0 ? Math.round((num / den) * 100) : 0;
  }, [liveOverview]);

  const patch = (bundleKey: string) => (p: TaskRowPatch) => {
    const today = new Date().toISOString().slice(0, 10);
    const cur = rows[bundleKey];
    const extra: Partial<{ completed_at: string | null; first_implemented_at: string | null }> = {};
    // Beim Setzen auf „Fertig" ohne Datum automatisch heute als Abschlussdatum.
    if (p.status === "fertig" && !cur?.completed_at && p.completed_at === undefined) extra.completed_at = today;
    // Unveränderlicher Erst-Anker: einmal setzen bei erstem fertig/laufend.
    if ((p.status === "fertig" || p.status === "laufend") && !cur?.first_implemented_at) {
      extra.first_implemented_at = (p.completed_at ?? extra.completed_at ?? today) as string;
    }
    update(bundleKey, { ...p, ...extra });
  };

  // Gruppen-Aktion: EIN Abschlussdatum für alle Aufgaben eines Kapitels setzen
  // (setzt zugleich Status = fertig) — spart das Einzeln-Ausfüllen.
  // P6.5: läuft NUR über den Bestätigungsdialog (Pflicht-Notiz ≥ 10 Zeichen, wird
  // als `note` an jede betroffene Zeile geschrieben — Audit-Spur für Massen-Fertig).
  const setGroupCompleted = (bundleKeys: string[], date: string, note: string) => {
    for (const k of bundleKeys) {
      update(k, {
        completed_at: date, status: "fertig", note,
        ...(rows[k]?.first_implemented_at ? {} : { first_implemented_at: date }),
      });
    }
  };
  // Dialog-Zustand: welche Bündel, welches Datum, welche Notiz. Nur Bündel, die
  // noch nicht fertig sind, werden umgestellt (Zahl im Dialog = echte Änderungen).
  const [bulkDone, setBulkDone] = useState<{ label: string; keys: string[]; date: string } | null>(null);
  const [bulkNote, setBulkNote] = useState("");
  const openBulkDone = (label: string, items: Array<{ bundle_key: string; memberControlIds?: string[] }>, date: string) => {
    const keys = items
      .filter(i => effStatus(i.bundle_key, i.memberControlIds ?? []) !== "fertig")
      .map(i => i.bundle_key);
    setBulkNote("");
    setBulkDone({ label, keys, date });
  };
  const confirmBulkDone = () => {
    if (!bulkDone || bulkNote.trim().length < 10) return;
    setGroupCompleted(bulkDone.keys, bulkDone.date, bulkNote.trim());
    setBulkDone(null);
  };

  // Sammelaktion für die ausgewählten gemeinsamen Kontrollen: Status, Zuständig
  // oder Frist — immer mit Bestätigung. „Fertig" läuft über den Dialog oben
  // (Pflicht-Notiz), damit die Audit-Spur dieselbe bleibt.
  const [bulkEdit, setBulkEdit] = useState<{ was: string; keys: string[]; p: TaskRowPatch } | null>(null);
  const selLabel = de ? `${selItems.length} ausgewählte gemeinsame Kontrollen` : `${selItems.length} selected shared controls`;
  const startBulk = (was: string, p: TaskRowPatch) => {
    if (selItems.length === 0) return;
    if (p.status === "fertig") { openBulkDone(selLabel, selItems, todayIso()); return; }
    setBulkEdit({ was, keys: selItems.map(t => t.bundle_key), p });
  };
  const confirmBulkEdit = () => {
    if (!bulkEdit) return;
    for (const k of bulkEdit.keys) patch(k)(bulkEdit.p);
    setBulkEdit(null);
  };

  const row = (bundleKey: string) => {
    const r = rows[bundleKey];
    return {
      status: (r?.status ?? "offen") as ImplStatus,
      owner: r?.owner ?? null,
      due_date: r?.due_date ?? null,
      completed_at: r?.completed_at ?? null,
      evidence_url: r?.evidence_url ?? null,
    };
  };

  if (loading || statusLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="animate-spin" size={16} />
        {de ? "Lade Umsetzungsstand…" : "Loading implementation status…"}
      </div>
    );
  }

  return (
    <div className={embedded ? "space-y-6" : "p-6 max-w-7xl mx-auto space-y-6"}>
      <header className="space-y-1">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          {embedded ? (
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="text-primary" size={18} />
              {de ? "Maßnahmen — Status, Zuständige, Fristen" : "Measures — status, owners, due dates"}
            </h2>
          ) : (
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="text-primary" size={22} />
            {de ? "Umsetzung — Live-Status" : "Implementation — Live Status"}
          </h1>
          )}
          <div className="flex items-center gap-2">
            <ExportMenu
              label={embedded ? (de ? "Umsetzungsbericht" : "Implementation report") : (de ? "Bericht" : "Report")}
              onPdf={() => generateExecutionPDF(execReportData, de ? "de" : "en", getReportBrandName(de))}
              onWord={() => generateExecutionWord(execReportData, de ? "de" : "en", getReportBrandName(de))}
              onExcel={() => generateExecutionExcel(execReportData, de ? "de" : "en")}
            />
            {!embedded && <ModeToggle de={de} />}
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          {de
            ? "Live-Ebene der Umsetzung. Statusänderungen hier überschreiben keine Gap-Antworten, heben aber den effektiven Stand in Dashboard, SoA/Roadmap und Berichten an („spätere Phase gewinnt“)."
            : "Live implementation layer. Status changes here never overwrite Gap answers but raise the effective state on the Dashboard, in SoA/Roadmap and in reports (\"later phase wins\")."}
        </p>
      </header>

      <AuditActionsCard de={de} actions={auditActions} setActions={setAuditActionsData as any} people={people} onAddPerson={addPerson}
        onFocus={(cid) => { setSearchParams({ focus: cid }); }}
        compact={mode !== "expert"} onShowAll={() => setMode("expert")} />

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">{de ? "Aufgaben (netto)" : "Tasks (net)"}</div>
          <div className="text-xl font-bold tabular-nums">{totalTasks}</div>
        </CardContent></Card>
        {mode === "expert" && <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">{de ? "Restaufwand (PT)" : "Remaining effort (PD)"}</div>
          <div className="text-xl font-bold tabular-nums text-primary">{Math.round(ptRest.rest)}</div>
          <div className="text-[10px] text-muted-foreground">
            {de ? `von ${Math.round(ptSums.netto)} PT netto · laufend ½` : `of ${Math.round(ptSums.netto)} PD net · running ½`}
          </div>
        </CardContent></Card>}
        {mode === "expert" && (
          <Card><CardContent className="p-3">
            <div className="text-xs text-muted-foreground">{de ? "PT brutto / netto" : "PD gross / net"}</div>
            <div className="text-xl font-bold tabular-nums">{Math.round(ptSums.brutto)} / {Math.round(ptSums.netto)}</div>
            <div className="text-[10px] text-muted-foreground" title={de ? `Gesamtprogramm ohne Scope-Abzug: ${Math.round(view.totalPtNetto)} PT netto` : `Whole programme without scope deduction: ${Math.round(view.totalPtNetto)} PD net`}>
              {de ? "brutto = je Framework gezählt" : "gross = counted per framework"}
              {ptSums.excludedNetto > 0 && (de ? ` · ${Math.round(ptSums.excludedNetto)} PT n.a./außer Scope abgezogen` : ` · ${Math.round(ptSums.excludedNetto)} PD n/a/out of scope deducted`)}
            </div>
          </CardContent></Card>
        )}
        <Card className={overdueKeys.size > 0 ? "border-destructive/40" : ""}><CardContent className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><CalendarClock size={11} />{de ? "Überfällig" : "Overdue"}</div>
          <div className={`text-xl font-bold tabular-nums ${overdueKeys.size > 0 ? "text-destructive" : ""}`}>{overdueKeys.size}</div>
          <div className="text-[10px] text-muted-foreground">{de ? "Frist < heute, nicht fertig" : "due < today, not done"}</div>
        </CardContent></Card>
        {mode === "expert" && <Card className={noEvidenceKeys.size > 0 ? "st-teilweise-border" : ""}><CardContent className="p-3">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Paperclip size={11} />{de ? "Fertig ohne Nachweis" : "Done w/o evidence"}</div>
          <div className={`text-xl font-bold tabular-nums ${noEvidenceKeys.size > 0 ? "st-teilweise-text" : ""}`}>{noEvidenceKeys.size}</div>
          <div className="text-[10px] text-muted-foreground">{de ? "im Audit nicht belastbar" : "not defensible in audit"}</div>
        </CardContent></Card>}
        {/* UniqSuite: „Umsetzungsgrad" steht als Mitte des Umsetzungs-Rings direkt darunter — keine zweite Kachel. */}
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">{de ? "Laufend" : "Running"}</div>
          <div className="text-xl font-bold tabular-nums st-teilweise-text">{effSummary.laufend}</div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="text-xs text-muted-foreground">{de ? "Blockiert" : "Blocked"}</div>
          <div className="text-xl font-bold tabular-nums text-destructive">{effSummary.blockiert}</div>
        </CardContent></Card>
      </div>

      {/* Alles auf-/zuklappen — betrifft ALLE Ebenen: Grafiken, die beiden
          Hauptabschnitte, die Kapitel darin, die Frameworks und deren Gruppen.
          Wunsch Dr. Sait 17.09.2026: „Üstte Alle öffnen / Alle schließen olsun;
          tüm seviyeleri yönetsin." */}
      {mode === "expert" && <div className="flex items-center gap-2">
        <button type="button" onClick={alleAufklappen}
                className="h-8 px-2.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent/5">
          {de ? "Alle öffnen" : "Expand all"}
        </button>
        <button type="button" onClick={alleZuklappen}
                className="h-8 px-2.5 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent/5">
          {de ? "Alle schließen" : "Collapse all"}
        </button>
      </div>}

      {/* KENNZAHLEN — in beiden Modi vorhanden, aber NICHT in derselben Form.
          Zwei Wünsche, die sich zunächst widersprachen:
            · „detail kısmına geçince grafikler gidiyor neden" → sie müssen bleiben
            · „überblick ile detail aynı olmuş" → sie dürfen nicht dasselbe sein
          Erster Anlauf zeigte in beiden Modi denselben Block; gemessen waren die
          fünf Abschnitte identisch, Detail war nur Überblick plus zwei Listen.
          Jetzt: im Überblick die ganze grafische Auswertung (Ring, Framework-
          Kacheln, Themenfortschritt), im Detail EIN kompakter Streifen — dort ist
          die Arbeitsliste die Hauptsache, die Kennzahl nur der Randwert. Im Detail
          startet die Karte zudem zugeklappt. */}
      <Collapsible open={openCharts} onOpenChange={setOpenCharts}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer select-none rounded-t-lg hover:bg-accent/5">
              <CardTitle className="text-base flex items-center gap-2">
                <ChevronDown size={16} className={`shrink-0 transition-transform text-muted-foreground ${openCharts ? "" : "-rotate-90"}`} />
                {mode === "expert"
                  ? (de ? "Kennzahlen kompakt" : "Key figures, compact")
                  : (de ? "Überblick" : "Overview")}
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  {mode === "expert"
                    ? (de
                        ? "Eine Zeile Stand, damit die Aufgabenliste den Platz behält. Ganze Auswertung: auf Überblick wechseln."
                        : "One line of status so the task list keeps the space. Full breakdown: switch to Overview.")
                    : (de
                        ? "Folgt der Framework-Auswahl. Gemeinsame Kontrollen werden nicht doppelt gezählt."
                        : "Follows the framework selection. Shared controls are not counted twice.")}
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-3">
          {(() => {
            // KONTROLLBASIERT (nicht aufgabenbasiert): gleiche Grundlage wie der
            // Umsetzungsgrad oben, das Management-Dashboard und die Framework-Kacheln
            // darunter — sonst zeigt dieselbe Seite zwei verschiedene Prozentwelten.
            const ctrlJa = liveOverview.reduce((a, o) => a + ((o.stats as any).ja || 0), 0);
            const ctrlTeil = liveOverview.reduce((a, o) => a + ((o.stats as any).teilweise || 0), 0);
            const ctrlApp = liveOverview.reduce((a, o) => a + ((o.stats as any).applicable || 0), 0);
            const offen = Math.max(0, ctrlApp - ctrlJa - ctrlTeil);
            // Farben AUSSCHLIESSLICH aus der Palette (chartPalette). Vorher standen
            // hier zusätzlich feste Tailwind-Klassen (bg-emerald/amber/red-500);
            // Donut folgte damit der Themenfarbe, Statusbalken und Legende blieben
            // aber fest amber/grün/rot — im Themenwechsel sichtbar inkonsistent.
            const seg = [
              { label: de ? "Umgesetzt" : "Implemented", n: ctrlJa, color: CHART_IMPL.fertig },
              { label: de ? "Teilweise" : "Partial", n: ctrlTeil, color: CHART_IMPL.laufend },
              { label: de ? "Lücken" : "Gaps", n: offen, color: CHART_IMPL.offen },
            ];
            const tot = Math.max(1, ctrlApp);
            const pieData = seg.filter(s => s.n > 0);

            // ── DETAIL: ein Streifen, keine Auswertung ──────────────────────
            // Dieselben Zahlen wie im Überblick, aber eine Zeile statt fünf
            // Abschnitten: kein Ring, keine Framework-Kacheln, keine
            // Themenliste (die steht als Akkordeon darunter und wäre doppelt).
            if (mode === "expert") {
              const belegt = Math.max(0, effSummary.fertig - noEvidenceKeys.size);
              return (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="flex items-baseline gap-1.5 shrink-0">
                    <span className="text-2xl font-bold tabular-nums text-primary">{livePct}%</span>
                    <span className="text-xs text-muted-foreground">{de ? "umgesetzt" : "implemented"}</span>
                  </div>
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex h-3 w-full rounded-full overflow-hidden border border-border">
                      {seg.map((sg, i) => sg.n > 0
                        ? <div key={i} style={{ width: `${(sg.n / tot) * 100}%`, background: sg.color }} title={`${sg.label}: ${sg.n}`} />
                        : null)}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-muted-foreground">
                      {seg.map((sg, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-sm" style={{ background: sg.color }} />
                          {sg.label} <b className="text-foreground tabular-nums">{sg.n}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                  {gapOverview.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {gapOverview.map(fw => (
                        <Badge key={fw.framework} variant="outline" className="text-[10px] px-1.5 py-0 border-accent/40">
                          {fwDef(fw.framework)?.short ?? fw.framework}
                          <span className="ml-1 tabular-nums font-semibold text-accent-readable">{fw.stats.compliancePct}%</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {de
                      ? `${belegt} mit Nachweis · ${noEvidenceKeys.size} ohne · ${Math.max(0, totalTasks - effSummary.fertig)} offen`
                      : `${belegt} with evidence · ${noEvidenceKeys.size} without · ${Math.max(0, totalTasks - effSummary.fertig)} open`}
                  </span>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {/* data-report-chart: Word-/PDF-Export nimmt DIESEN Behälter auf,
                    nicht nur das <svg>. Prozentwert, Statusbalken und Legende
                    stehen als HTML daneben — ohne den Behälter landete im
                    Word-Bericht ein leerer Ring (Befund Dr. Sait 2026-09-12). */}
                <div className="flex flex-col md:flex-row md:items-center gap-8"
                     data-report-chart
                     data-report-title={de ? "Umsetzungsstatus (kontrollbasiert)" : "Implementation status (control-based)"}>
                  <div className="w-full md:w-80 shrink-0" style={{ height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <Pie data={pieData} dataKey="n" nameKey="label" cx="50%" cy="50%"
                             innerRadius={58} outerRadius={100} paddingAngle={2} isAnimationActive={false}
                             labelLine={false}
                             label={insideSliceLabel("percent", 0.06)}>
                          {pieData.map((s, i) => <Cell key={i} fill={s.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                        </Pie>
                        {/* Mitte = DIE eine Kennzahl (Umsetzungsgrad, wie Dashboard) */}
                        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="central" fill="hsl(var(--foreground))" style={{ fontSize: 24, fontWeight: 800 }}>{livePct}%</text>
                        <text x="50%" y="59%" textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground))" style={{ fontSize: 10 }}>{de ? "Umsetzungsgrad" : "implemented"}</text>
                        <RTooltip formatter={(v: any, n: any) => [`${v} · ${Math.round((Number(v) / tot) * 100)}%`, n]}
                                  contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground mb-2">{de ? "Umsetzungsstatus" : "Implementation status"}</div>
                  <div className="flex h-4 w-full rounded-full overflow-hidden border border-border">
                    {seg.map((sg, i) => sg.n > 0 ? <div key={i} style={{ width: `${(sg.n / tot) * 100}%`, background: sg.color }} title={`${sg.label}: ${sg.n}`} /> : null)}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    {seg.map((sg, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: sg.color }} />{sg.label}: <b className="text-foreground">{sg.n}</b>
                      </span>
                    ))}
                  </div>
                  </div>
                </div>
                {/* „Fertig" ist nicht „belegt" — Wunsch Dr. Sait 17.09.2026:
                    „'Tamamlandı' ile 'kanıtla doğrulandı' ayrı gösterilmeli."
                    BEWUSST auf Aufgabenbasis und so beschriftet: der Ring darueber
                    zaehlt Kontrollen, ein Nachweis haengt aber an der Aufgabe.
                    Beide Basen in EINEN Balken zu mischen waere die bequemere,
                    aber falsche Darstellung. */}
                {/* UniqSuite-Überblick: „Erledigt und belastbar" steht im Detail (Kennzahlen-Streifen). */}
                {SHOW_EVIDENCE_BAR && <div className="space-y-2">
                  <div className="text-sm font-semibold text-foreground">
                    {de ? "Erledigt und im Audit belastbar" : "Done and defensible in audit"}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {de ? `— Aufgabenbasis (${totalTasks} Aufgaben im Scope)` : `— task basis (${totalTasks} tasks in scope)`}
                    </span>
                  </div>
                  {(() => {
                    const belegt = Math.max(0, effSummary.fertig - noEvidenceKeys.size);
                    const ohne = Math.min(effSummary.fertig, noEvidenceKeys.size);
                    const offenAufg = Math.max(0, totalTasks - effSummary.fertig);
                    const seg2 = [
                      { label: de ? "Fertig mit Nachweis" : "Done with evidence", n: belegt, color: CHART_IMPL.fertig },
                      { label: de ? "Fertig ohne Nachweis" : "Done without evidence", n: ohne, color: CHART_IMPL.laufend },
                      { label: de ? "Noch offen" : "Still open", n: offenAufg, color: CHART_IMPL.offen },
                    ];
                    const t2 = Math.max(1, totalTasks);
                    return (
                      <>
                        <div className="flex h-4 w-full rounded-full overflow-hidden border border-border">
                          {seg2.map((s, i) => s.n > 0 ? <div key={i} style={{ width: `${(s.n / t2) * 100}%`, background: s.color }} title={`${s.label}: ${s.n}`} /> : null)}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {seg2.map((s, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: s.color }} />{s.label}: <b className="text-foreground">{s.n}</b>
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>}
                {gapOverview.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                      {de ? "Umsetzung je Framework" : "Implementation by framework"}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {de ? "— Anteil umgesetzt je gewähltem Framework" : "— implemented share per selected framework"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {gapOverview.map(fw => {
                        const s = fw.stats;
                        const fwLabel = fwDef(fw.framework)?.displayName ?? fw.framework;
                        // Noch gar nicht bewertete Anforderungen sichtbar machen: sonst
                        // summieren sich Umgesetzt+Teilweise+Offen NICHT auf „Anwendbar"
                        // und die Kachel wirkt weiter fortgeschritten als sie ist.
                        const unbewertet = Math.max(0, (s.applicable ?? 0) - (s.ja ?? 0) - (s.teilweise ?? 0) - (s.nein ?? 0));
                        const donut = [
                          { name: de ? "Umgesetzt" : "Implemented", value: s.ja,        color: CHART_STATUS.ja },
                          { name: de ? "Teilweise" : "Partial",     value: s.teilweise, color: CHART_STATUS.teilweise },
                          { name: de ? "Nicht umgesetzt" : "Not implemented", value: s.nein,      color: CHART_STATUS.nein },
                          { name: de ? "Nicht bewertet" : "Not assessed", value: unbewertet, color: CHART_STATUS.offen },
                          { name: "N.a.",                           value: s.na,        color: CHART_STATUS.na },
                        ].filter(d => d.value > 0);
                        const donutData = donut.length ? donut : [{ name: "-", value: 1, color: CHART_EMPTY }];
                        return (
                          <div key={fw.framework}
                               data-report-chart
                               data-report-title={fwLabel}
                               className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 hover:border-accent hover:shadow-sm transition-all">
                            <div className="relative w-24 h-24 shrink-0">
                              <ResponsiveContainer>
                                <PieChart>
                                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={44} paddingAngle={2}>
                                    {donutData.map((d, i) => <Cell key={i} fill={d.color} stroke="hsl(var(--card))" strokeWidth={2} />)}
                                  </Pie>
                                  <RTooltip contentStyle={{ fontSize: 12, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-lg font-bold tabular-nums text-foreground">{s.compliancePct}%</span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-foreground truncate" title={fwLabel}>{fwLabel}</div>
                              <div className="mt-1.5 space-y-1 text-xs">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_STATUS.ja }} /><span className="text-muted-foreground">{de ? "Umgesetzt" : "Implemented"}</span><b className="ml-auto tabular-nums text-foreground">{s.ja}</b></div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_STATUS.teilweise }} /><span className="text-muted-foreground">{de ? "Teilweise" : "Partial"}</span><b className="ml-auto tabular-nums text-foreground">{s.teilweise}</b></div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_STATUS.nein }} /><span className="text-muted-foreground">{de ? "Nicht umgesetzt" : "Not implemented"}</span><b className="ml-auto tabular-nums text-foreground">{s.nein}</b></div>
                                {unbewertet > 0 && (
                                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_STATUS.offen }} /><span className="text-muted-foreground">{de ? "Nicht bewertet" : "Not assessed"}</span><b className="ml-auto tabular-nums text-foreground">{unbewertet}</b></div>
                                )}
                                <div className="flex items-center justify-between pt-1 mt-1 border-t border-border"><span className="text-muted-foreground">{de ? "Anwendbar" : "Applicable"}</span><b className="tabular-nums text-foreground">{s.applicable}</b></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* UniqSuite-Überblick: Fortschritt in der Gliederung von ISO/IEC 27001 —
                    5 Bereiche zugeklappt, Themen beim Aufklappen. Gilt für alle Frameworks. */}
                {themenIso.size > 0 && <IsoThemeGroups de={de} topics={themenIso} />}
                {mode !== "expert" && (
                  <div className="text-[11px] text-muted-foreground border-t border-border pt-2">
                    {de ? "Zum Setzen von Status, Verantwortlichen und Terminen auf " : "To set status, owners and dates, switch to "}
                    <span className="font-semibold text-foreground">Detail</span>
                    {de ? " wechseln." : " above."}
                  </div>
                )}
              </div>
            );
          })()}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Block A: Gemeinsame Kontrollen — einklappbar; Filter UND Liste
          verschwinden zusammen. Nur im Detail-Modus, der Überblick steht oben. */}
      {mode === "expert" && (
      <Collapsible open={openSections.includes("shared")}
                   onOpenChange={o => setOpenSections(s => o ? [...new Set([...s, "shared"])] : s.filter(x => x !== "shared"))}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer select-none rounded-t-lg hover:bg-accent/5">
            <CardTitle className="text-base flex items-center gap-2">
              <ChevronDown size={16} className={`shrink-0 transition-transform text-muted-foreground ${openSections.includes("shared") ? "" : "-rotate-90"}`} />
              {de ? "Gemeinsame Kontrollen" : "Shared controls"}
              <Badge variant="secondary" className="ml-2">{view.shared.length}</Badge>
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {de
                  ? "Gleiche Anforderung in mehreren Frameworks = eine Aufgabe. Einmal erledigt, gilt sie überall."
                  : "Same requirement in several frameworks = one task. Done once, it counts everywhere."}
              </span>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
        <CardContent className="space-y-3">
          {/* Filter-Leiste */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={fSearch}
              onChange={e => setFSearch(e.target.value)}
              placeholder={de ? "Suche (ISO-Ref, Titel, Control-ID)…" : "Search (ISO ref, title, control id)…"}
              className="h-8 w-64 text-xs"
            />
            <Select value={fStatus} onValueChange={v => setFStatus(v as any)}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{de ? "Alle Status" : "All statuses"}</SelectItem>
                {(Object.keys(STATUS_META) as ImplStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{de ? STATUS_META[s].de : STATUS_META[s].en}</SelectItem>
                ))}
                <SelectItem value="overdue">{de ? `Überfällig (${overdueKeys.size})` : `Overdue (${overdueKeys.size})`}</SelectItem>
                <SelectItem value="no_evidence">{de ? `Fertig ohne Nachweis (${noEvidenceKeys.size})` : `Done w/o evidence (${noEvidenceKeys.size})`}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fFw} onValueChange={v => setFFw(v)}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{de ? "Alle Frameworks" : "All frameworks"}</SelectItem>
                {activeKeys.map(fw => (
                  <SelectItem key={fw} value={fw}>{fwDef(fw)?.short ?? fw}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Zweites Framework: nur Kontrollen, die BEIDE tragen (A ∩ B). */}
            {fFw !== "all" && activeKeys.length >= 2 && (
              <Select value={fFw2} onValueChange={v => setFFw2(v)}>
                <SelectTrigger className="h-8 w-44 text-xs" aria-label={de ? "Mit zweitem Framework vergleichen" : "Compare with a second framework"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{de ? "∩ zweites Framework…" : "∩ second framework…"}</SelectItem>
                  {activeKeys.filter(fw => fw !== fFw).map(fw => (
                    <SelectItem key={fw} value={fw}>∩ {fwDef(fw)?.short ?? fw}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Gruppenfilter — unabhaengig vom Framework-Filter, beide wirken
                zusammen (z. B. „nur ISO 27001" UND „nur A.8 Technologische
                Massnahmen"). Speist sich aus BEIDEN Bloecken. */}
            <Select value={fGroup} onValueChange={v => setFGroup(v)}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">{de ? "Alle Gruppen" : "All groups"}</SelectItem>
                {alleGruppen.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(fSearch.trim() || fStatus !== "all" || fFw !== "all" || fGroup !== "all") && (
              <button type="button"
                      onClick={() => { setFSearch(""); setFStatus("all"); setFFw("all"); setFFw2("none"); setFGroup("all"); }}
                      className="h-8 px-2 rounded border border-border text-xs text-muted-foreground hover:text-foreground">
                {de ? "Filter zurücksetzen" : "Reset filters"}
              </button>
            )}
            <span className="text-xs text-muted-foreground ml-auto tabular-nums">
              {filteredShared.length} / {view.shared.length}
            </span>
          </div>

          {pairActive && (
            <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm" role="status">
              <b>{fwDef(fFw)?.short ?? fFw} ∩ {fwDef(fFw2)?.short ?? fFw2}:</b>{" "}
              <b className="tabular-nums">{pairCount}</b>{" "}
              {de ? "gemeinsame Kontrollen" : "shared controls"}
              {filteredShared.length !== pairCount && (
                <span className="text-muted-foreground">
                  {" · "}{de ? `davon ${filteredShared.length} nach Filtern` : `${filteredShared.length} after filters`}
                </span>
              )}
              <span className="block text-xs text-muted-foreground">
                {de ? "Eine Antwort bzw. ein Umsetzungsstand gilt für beide Frameworks." : "One answer or implementation status counts for both frameworks."}
              </span>
            </div>
          )}

          {/* Sammelaktionen für ausgewählte gemeinsame Kontrollen */}
          {filteredShared.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-1.5 bg-muted/30">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox"
                       className="h-3.5 w-3.5 accent-primary"
                       checked={selItems.length > 0 && selItems.length === filteredShared.length}
                       ref={el => { if (el) el.indeterminate = selItems.length > 0 && selItems.length < filteredShared.length; }}
                       onChange={e => setSel(e.target.checked ? new Set(filteredShared.map(t => t.bundle_key)) : new Set())} />
                {de ? `Alle ${filteredShared.length} auswählen` : `Select all ${filteredShared.length}`}
              </label>
              {selItems.length > 0 && (
                <>
                  <span className="text-xs font-semibold tabular-nums ml-1">{de ? `${selItems.length} ausgewählt:` : `${selItems.length} selected:`}</span>
                  <Select value="" onValueChange={v => { const s = v as ImplStatus; startBulk(`Status → ${de ? STATUS_META[s].de : STATUS_META[s].en}`, { status: s }); }}>
                    <SelectTrigger className="h-8 w-36 text-xs" aria-label={de ? "Status für Auswahl setzen" : "Set status for selection"}>
                      <SelectValue placeholder={de ? "Status setzen…" : "Set status…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_META) as ImplStatus[]).map(s => (
                        <SelectItem key={s} value={s}>{de ? STATUS_META[s].de : STATUS_META[s].en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <PersonSelect
                    value=""
                    onChange={v => { if (v) startBulk(`${de ? "Zuständig" : "Owner"} → ${v}`, { owner: v }); }}
                    people={people}
                    onAddPerson={addPerson}
                    de={de}
                    placeholder={de ? "Zuständig setzen…" : "Set owner…"}
                    className="w-44"
                  />
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    {de ? "Frist:" : "Due:"}
                    <input type="date" value=""
                           onChange={e => { const d = e.target.value; if (d) startBulk(`${de ? "Frist" : "Due"} → ${new Date(d + "T00:00:00").toLocaleDateString(de ? "de-DE" : "en-GB")}`, { due_date: d }); }}
                           className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                           aria-label={de ? "Frist für Auswahl setzen" : "Set due date for selection"} />
                  </label>
                  <button type="button" onClick={() => setSel(new Set())}
                          className="h-8 px-2 rounded border border-border text-xs text-muted-foreground hover:text-foreground ml-auto">
                    {de ? "Auswahl aufheben" : "Clear selection"}
                  </button>
                </>
              )}
            </div>
          )}

          {view.shared.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">
              {de ? "Keine mappable Kontrollen für die aktiven Frameworks." : "No mappable controls for the active frameworks."}
            </div>
          ) : filteredShared.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">
              {de ? "Keine Kontrollen entsprechen den Filtern." : "No controls match the filters."}
            </div>
          ) : (
            // Kontrolliert statt key+defaultValue: „Alle öffnen/schließen" oben muss
            // auch diese Ebene erreichen, und ein Remount über `key` warf bei jedem
            // Filterwechsel die Wahl des Nutzers weg.
            // (Ein {/* … */}-Kommentar ist hier kein Kommentar, sondern ein
            //  Objekt-Ausdruck — er bricht den Ternär-Zweig.)
            <Accordion type="multiple" className="w-full"
                       value={openSharedGroups} onValueChange={setOpenSharedGroups}>
              {sharedGroups.map(([ch, items, gLabel]) => {
                const done = items.filter(i => effStatus(i.bundle_key, (i as any).memberControlIds ?? []) === "fertig").length;
                return (
                  <AccordionItem key={ch} value={ch}>
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-semibold text-foreground truncate">{gLabel}</span>
                        <Badge variant="secondary" className="shrink-0">{items.length}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto mr-3 shrink-0">
                          {done}/{items.length} {de ? "fertig" : "done"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap items-center gap-2 py-2 px-1 mb-1 border-b border-border/50 rounded-t bg-accent/5">
                        <span className="text-[11px] font-medium text-foreground">{de ? "Ganzes Kapitel erledigt am:" : "Whole chapter completed on:"}</span>
                        <input type="date"
                               value=""
                               onChange={e => { if (e.target.value) openBulkDone(gLabel, items, e.target.value); }}
                               className="h-8 rounded border border-border bg-background px-2 text-xs"
                               title={de ? "Öffnet eine Bestätigung: alle Aufgaben dieses Kapitels auf Fertig mit diesem Abschlussdatum" : "Opens a confirmation: all tasks in this chapter to Done with this completion date"} />
                        <span className="text-[10px] text-muted-foreground">{de ? "setzt alle auf Fertig (mit Bestätigung + Notiz)" : "sets all to Done (confirmation + note)"}</span>
                      </div>
                      <ZeilenListe items={items} de={de} render={(t, zi) => (
                        <TaskRow
                          key={t.bundle_key}
                          deferred={zi >= 8}
                          today={today}
                          bundleKey={t.bundle_key}
                          title={de ? t.title : t.titleEn}
                          // Kein ID-Auszug mehr als Untertitel: die enthaltenen
                          // Anforderungen stehen jetzt vollständig und mit Text
                          // in der aufklappbaren Liste darunter.
                          details={
                            <BuendelInhalt
                              mitglieder={t.memberControlIds}
                              de={de}
                              kurzVon={fw => fwDef(fw)?.short ?? fw}
                              textVon={mid => {
                                const c = ctrlByMember.get(mid);
                                return (de ? c?.req_de ?? c?.req_en : c?.req_en ?? c?.req_de) ?? mid;
                              }}
                              statusVon={mid => (rows[mid]?.status ?? "offen") as ImplStatus}
                              onStatus={(mid, s) => patch(mid)({ status: s })}
                            />
                          }
                          effort={t.effort_pt}
                          badges={<>{t.frameworks.map(fw => (
                            <Badge key={fw} variant="outline" className="text-[10px] px-1.5 py-0">
                              {fwDef(fw)?.short ?? fw}
                            </Badge>
                          ))}{auditBadge((t as any).memberControlIds ?? [])}</>}
                          statusRow={{ ...row(t.bundle_key), status: effStatus(t.bundle_key, (t as any).memberControlIds ?? []) }}
                          onPatch={patch(t.bundle_key)}
                          de={de}
                          people={people}
                          onAddPerson={addPerson}
                          focused={isFocused(t.bundle_key, (t as any).memberControlIds ?? [])}
                          select={{ checked: sel.has(t.bundle_key), onChange: v => toggleSel(t.bundle_key, v) }}
                        />
                      )} />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
        </CollapsibleContent>
      </Card>
      </Collapsible>
      )}

      {/* Block B: Framework-spezifische Pflichten — ebenfalls einklappbar.
          Ein Klick auf die Überschrift blendet ALLE Frameworks darunter aus; die
          Zustände der inneren Ebenen bleiben dabei stehen und sind beim
          Wiederaufklappen unverändert da (Wunsch Dr. Sait 17.09.2026:
          „Açılınca önceki açılma durumları korunsun"). Der Überblick liegt oben. */}
      {mode === "expert" && (
      <Collapsible open={openSections.includes("delta")}
                   onOpenChange={o => setOpenSections(s => o ? [...new Set([...s, "delta"])] : s.filter(x => x !== "delta"))}>
      <Card>
        <CollapsibleTrigger asChild>
        <CardHeader className="pb-3 cursor-pointer select-none rounded-t-lg hover:bg-accent/5">
          <CardTitle className="text-base flex items-center gap-2">
            <ChevronDown size={16} className={`shrink-0 transition-transform text-muted-foreground ${openSections.includes("delta") ? "" : "-rotate-90"}`} />
            {de ? "Framework-spezifische Pflichten" : "Framework-specific obligations"}
            <span className="text-xs font-normal text-muted-foreground ml-2">
              {(() => {
                const exs: string[] = [];
                if (activeKeys.includes("NIS2")) exs.push("NIS2 72h");
                if (activeKeys.includes("DORA")) exs.push("DORA 4h");
                if (activeKeys.includes("GDPR")) exs.push(de ? "DSGVO 72h" : "GDPR 72h");
                const example = exs.length >= 2 ? ` — ${de ? "z. B." : "e.g."} ${exs.join(" ≠ ")} ${de ? "sind juristisch getrennt" : "are legally distinct"}` : "";
                return de ? `Nicht dedupliziert${example}.` : `Not deduplicated${example}.`;
              })()}
            </span>
          </CardTitle>
        </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
        <CardContent>
          {pairActive && (
            <p className="text-xs text-muted-foreground pb-2">
              {de
                ? `Vergleich ${fwDef(fFw)?.short ?? fFw} ∩ ${fwDef(fFw2)?.short ?? fFw2} aktiv: framework-spezifische Pflichten sind nie gemeinsam und werden hier ausgeblendet.`
                : `Comparison ${fwDef(fFw)?.short ?? fFw} ∩ ${fwDef(fFw2)?.short ?? fFw2} active: framework-specific obligations are never shared and are hidden here.`}
            </p>
          )}
          <Accordion type="multiple" className="w-full" value={openFw} onValueChange={setOpenFw}>
            {activeKeys
              .filter(fw => (view.deltaByFramework[fw]?.length ?? 0) > 0)
              .map(fw => {
                const allItems = view.deltaByFramework[fw] ?? [];
                // Gefiltert wird zentral in `deltaGefiltert` (oben) — mit
                // denselben Filtern wie Block A, Framework-Filter eingeschlossen.
                const items = deltaGefiltert[fw] ?? [];
                const done = allItems.filter(i => effStatus(i.bundle_key, (i as any).memberControlIds ?? []) === "fertig").length;
                if (items.length === 0) return null;
                // Innerhalb des Frameworks nach ECHTER Gruppe bündeln — dieselbe
                // Quelle wie Block A, damit beide Blöcke dieselben Überschriften
                // tragen und der Gruppenfilter überall dasselbe meint.
                const gruppen = (() => {
                  const m = new Map<string, DeltaTask[]>();
                  for (const i of items) {
                    const g = deltaGruppe(i);
                    (m.get(g) ?? m.set(g, []).get(g)!).push(i);
                  }
                  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], de ? "de" : "en"));
                })();
                // EBENE 1 — Framework: gefuellte Flaeche (bg-muted), fette
                // Grundschrift, 4px neutraler Balken, Ueberzeile "Framework".
                // EBENE 2 darunter ist das Gegenteil: keine Fuellung, 2px
                // Kupferbalken, kleinere Schrift. Vorher waren beide Ebenen
                // typografisch identisch und nicht auseinanderzuhalten.
                // Die Unterscheidung liegt BEWUSST nicht nur in der Farbe: im
                // Dunkelmodus ist --primary selbst die Akzentfarbe und waere von der
                // Gruppenebene nicht zu trennen. Beide Ebenen folgen der im
                // AccentColorPicker gewaehlten Farbe; unterschieden wird ueber
                // Fuellung (Ebene 1 gefuellt, Ebene 2 nicht), Balkenstaerke
                // (4px voll vs. 2px 35 %) und Schriftgrad. Das traegt in beiden
                // Modi und bei jeder gewaehlten Akzentfarbe.
                return (
                  <AccordionItem key={fw} value={fw} className="border-b-0 mb-1.5">
                    <AccordionTrigger className="text-sm px-3 rounded-lg bg-accent/10 border border-accent/25 border-l-[4px] border-l-accent hover:bg-accent/[0.16] data-[state=open]:rounded-b-none">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-readable shrink-0">
                          {de ? "Framework" : "Framework"}
                        </span>
                        <span className="text-base font-bold text-foreground truncate">{fwDef(fw)?.displayName ?? fw}</span>
                        <Badge variant="secondary" className="shrink-0 font-semibold">{items.length}{items.length !== allItems.length ? ` / ${allItems.length}` : ""}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto mr-3 shrink-0">
                          {done}/{allItems.length} {de ? "fertig" : "done"}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="rounded-b-lg border border-t-0 border-accent/25 border-l-[4px] border-l-accent bg-card px-3 pt-2">
                      <div className="flex flex-wrap items-center gap-2 py-2 px-1 mb-2 border-b border-border/50 rounded-t bg-accent/5">
                        <span className="text-[11px] font-medium text-foreground">{de ? "Ganzes Framework erledigt am:" : "Whole framework completed on:"}</span>
                        <input type="date"
                               value=""
                               onChange={e => { if (e.target.value) openBulkDone(fwDef(fw)?.displayName ?? fw, allItems, e.target.value); }}
                               className="h-8 rounded border border-border bg-background px-2 text-xs"
                               title={de ? "Öffnet eine Bestätigung: alle Aufgaben dieses Frameworks auf Fertig mit diesem Abschlussdatum" : "Opens a confirmation: all tasks of this framework to Done with this completion date"} />
                        <span className="text-[10px] text-muted-foreground">{de ? "setzt alle auf Fertig (mit Bestätigung + Notiz)" : "sets all to Done (confirmation + note)"}</span>
                      </div>
                      <Accordion type="multiple" className="w-full"
                                 value={openFwGroups} onValueChange={setOpenFwGroups}>
                      {gruppen.map(([gName, gItems]) => {
                        const gDone = gItems.filter(i => effStatus(i.bundle_key, i.memberControlIds ?? []) === "fertig").length;
                        // EBENE 2 — Gruppe im Framework: ohne Fuellung, duenner
                        // Akzentbalken, kleinere Schrift, Umriss-Badge.
                        return (
                        <AccordionItem key={gName} value={`${fw}::${gName}`} className="border-b border-border/40">
                          <AccordionTrigger className="text-sm py-2.5 pl-3 pr-1 border-l-2 border-l-accent/35 hover:bg-accent/[0.05]">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-[13px] font-medium text-foreground truncate">{gName}</span>
                              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 border-accent/40 text-accent-readable">{gItems.length}</Badge>
                              <span className="text-xs text-muted-foreground ml-auto mr-3 shrink-0">
                                {gDone}/{gItems.length} {de ? "fertig" : "done"}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* Gruppenweise markieren — dieselbe Geste wie bei den
                                gemeinsamen Kontrollen. */}
                            <div className="flex flex-wrap items-center gap-2 py-2 px-1 mb-1 border-b border-border/50 rounded-t bg-accent/5">
                              <span className="text-[11px] font-medium text-foreground">{de ? "Ganze Gruppe erledigt am:" : "Whole group completed on:"}</span>
                              <input type="date"
                                     value=""
                                     onChange={e => { if (e.target.value) openBulkDone(`${fwDef(fw)?.short ?? fw} · ${gName}`, gItems, e.target.value); }}
                                     className="h-8 rounded border border-border bg-background px-2 text-xs" />
                              <span className="text-[10px] text-muted-foreground">{de ? "setzt alle auf Fertig (mit Bestätigung + Notiz)" : "sets all to Done (confirmation + note)"}</span>
                            </div>
                      <ZeilenListe items={gItems} de={de} render={(t, zi) => (
                        <TaskRow
                          key={t.bundle_key}
                          deferred={zi >= 8}
                          today={today}
                          bundleKey={t.control_id}
                          title={de ? t.title : t.titleEn}
                          effort={t.effort_pt}
                          badges={
                            <>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {fwDef(fw)?.short ?? fw}
                              </Badge>
                              <LegalBadges stufe={t.trigger} legalRef={t.legalRef} quelle={t.quelle} de={de} />
                              {t.alsoIn && t.alsoIn.length > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                                  title={de ? "Gleiche ISO-Referenz in weiteren Frameworks" : "Same ISO reference in other frameworks"}
                                >
                                  <span className="opacity-70">{de ? "auch:" : "also:"}</span>
                                  {t.alsoIn.map(x => (
                                    <Badge key={x} variant="secondary" className="text-[10px] px-1.5 py-0 opacity-70">
                                      {fwDef(x)?.short ?? x}
                                    </Badge>
                                  ))}
                                </span>
                              )}
                            </>
                          }
                          statusRow={{ ...row(t.bundle_key), status: effStatus(t.bundle_key, (t as any).memberControlIds ?? []) }}
                          onPatch={patch(t.bundle_key)}
                          de={de}
                          people={people}
                          onAddPerson={addPerson}
                          focused={isFocused(t.bundle_key, (t as any).memberControlIds ?? [])}
                        />
                      )} />
                          </AccordionContent>
                        </AccordionItem>
                        );
                      })}
                      </Accordion>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
          {activeKeys.every(fw => (view.deltaByFramework[fw]?.length ?? 0) === 0) && (
            <div className="text-sm text-muted-foreground py-4">
              {de ? "Keine framework-spezifischen Delta-Pflichten in den aktiven Frameworks." : "No framework-specific delta obligations in active frameworks."}
            </div>
          )}
        </CardContent>
        </CollapsibleContent>
      </Card>
      </Collapsible>
      )}

      {/* P6.5: Bestätigung für Massen-Fertig (Pflicht-Notiz ≥ 10 Zeichen → note je Zeile) */}
      <AlertDialog open={!!bulkDone} onOpenChange={o => { if (!o) setBulkDone(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{de ? "Aufgaben auf Fertig setzen?" : "Set tasks to Done?"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  <b className="text-foreground">{bulkDone?.keys.length ?? 0}</b>{" "}
                  {de ? "Aufgaben werden auf Fertig gesetzt" : "tasks will be set to Done"}
                  {" · "}{bulkDone?.label}{" · "}
                  {de ? "Abschluss am" : "completed on"}{" "}
                  <b className="text-foreground">{bulkDone?.date ? new Date(bulkDone.date + "T00:00:00").toLocaleDateString(de ? "de-DE" : "en-GB") : "—"}</b>
                </p>
                {bulkDone && bulkDone.keys.length === 0 && (
                  <p className="text-muted-foreground">{de ? "Alle betroffenen Aufgaben sind bereits fertig — nichts zu tun." : "All affected tasks are already done — nothing to do."}</p>
                )}
                <p className="text-muted-foreground">
                  {de
                    ? "Bereits fertige Aufgaben bleiben unverändert. Die Notiz wird an jede betroffene Aufgabe geschrieben (Audit-Spur: Wer/Warum). Nachweise müssen weiterhin je Aufgabe hinterlegt werden."
                    : "Tasks already done stay unchanged. The note is written to every affected task (audit trail: who/why). Evidence still has to be linked per task."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground" htmlFor="bulk-done-note">
              {de ? "Begründung / Notiz (Pflicht, mind. 10 Zeichen)" : "Reason / note (required, min. 10 characters)"}
            </label>
            <Textarea
              id="bulk-done-note"
              value={bulkNote}
              onChange={e => setBulkNote(e.target.value)}
              rows={3}
              placeholder={de ? "z. B. Kapitel im internen Audit 2026-Q3 geprüft, Nachweise im DMS unter ISMS/Umsetzung." : "e.g. chapter verified in internal audit 2026-Q3, evidence in DMS under ISMS/Implementation."}
              className="text-sm"
            />
            <div className={`text-[10px] ${bulkNote.trim().length >= 10 ? "text-muted-foreground" : "text-destructive"}`}>
              {bulkNote.trim().length}/10 {de ? "Zeichen" : "characters"}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{de ? "Abbrechen" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              disabled={!bulkDone || bulkDone.keys.length === 0 || bulkNote.trim().length < 10}
              onClick={e => { e.preventDefault(); confirmBulkDone(); }}
            >
              {de ? `${bulkDone?.keys.length ?? 0} Aufgaben auf Fertig setzen` : `Set ${bulkDone?.keys.length ?? 0} tasks to Done`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sammelaktion (Status/Zuständig/Frist) für ausgewählte gemeinsame Kontrollen */}
      <AlertDialog open={!!bulkEdit} onOpenChange={o => { if (!o) setBulkEdit(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{de ? "Auswahl ändern?" : "Change selection?"}</AlertDialogTitle>
            <AlertDialogDescription>
              <b className="text-foreground">{bulkEdit?.keys.length ?? 0}</b>{" "}
              {de ? "gemeinsame Kontrollen" : "shared controls"}{" · "}
              <b className="text-foreground">{bulkEdit?.was}</b>.{" "}
              {de ? "Gilt für alle Frameworks, die diese Kontrollen teilen." : "Applies to every framework sharing these controls."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{de ? "Abbrechen" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={e => { e.preventDefault(); confirmBulkEdit(); }}>
              {de ? `${bulkEdit?.keys.length ?? 0} ändern` : `Change ${bulkEdit?.keys.length ?? 0}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
