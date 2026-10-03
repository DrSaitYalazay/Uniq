import { useState, useMemo, useEffect } from "react";
import { isoEntry, isIsoClause } from "@/data/isoAnnexMap";
import {
  isoAuditCriteriaForControl, ISO_SCOPE_RULE, ISO_SEVERITY_RULE,
  ISO_NO_AUTOMATIC_PASS, ISO_CONTROL_SELECTION_RULE, ISO_ANNEX_SELECTION_RULE,
} from "@/data/isoAuditCriteria";
import { severityView, severityLabel, severityToneClass, severityApplies } from "@/lib/severityGrading";
import { readinessControl } from "@/data/readinessControls";
import { catalogMetaOf } from "@/data/frameworkCatalogs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Info, Link2, Gauge, Building2, Server, GitBranch, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnswerStatus, ControlRow, CoverageDecision, EffectiveAnswer, Reifegrad, Severity, SeveritySource } from "@/lib/assessmentEngine";
import { REIFEGRAD_LABELS } from "@/lib/assessmentEngine";
import { inferControlScope, scopeLabel, scopeTooltip, type ControlScopeKind } from "@/lib/controlScope";
import { AssetOverridePanel, type AssessmentAsset } from "./AssetOverridePanel";
import { EvidencePanel } from "@/components/EvidencePanel";
import type { ControlHealth } from "@/lib/controlHealthEngine";


interface Props {
  control: ControlRow;
  effective: EffectiveAnswer;
  de: boolean;
  usesMaturity: boolean;
  onSetStatus: (s: AnswerStatus | null) => void;
  onSetNote: (v: string) => void;
  onSetReifegrad: (r: number | null) => void;
  assets?: AssessmentAsset[];
  assetEffective?: Map<string, EffectiveAnswer>;
  assetOverrideIds?: Set<string>;
  onSetAssetStatus?: (assetId: string, s: AnswerStatus | null) => void;
  onSetAssetReifegrad?: (assetId: string, r: Reifegrad | null) => void;
  /** Abgeleiteter kontinuierlicher Control-Status (Engine E3). Optional & additiv:
   *  fehlt er (heute: keine control_tests) ⇒ es wird KEIN Badge gezeigt. */
  health?: ControlHealth;
  /** Y7: gespeicherte Einstufung des Befunds (Prüferentscheid), falls vorhanden. */
  severityStored?: { severity?: Severity | null; severity_source?: SeveritySource | null; severity_note?: string | null };
  /** Y7: Einstufung setzen. `null` = Prüferentscheid zurücknehmen (zurück zum Vorschlag). */
  onSetSeverity?: (value: Severity | null, note: string) => void;
  /** Y8: gespeicherter Deckungsentscheid für diese Kontrolle (framework-übergreifende Übernahme). */
  coverageStored?: { decision: CoverageDecision; scope_note: string | null; period_from: string | null; period_to: string | null; evidence_note: string | null };
  /** Y8: Deckungsentscheid speichern; `null` setzt zurück auf „offen". */
  onSetCoverage?: (decision: CoverageDecision | null, detail: { scopeNote: string; periodFrom: string | null; periodTo: string | null; evidenceNote: string }) => void;
}

/**
 * Additives Health-Badge — nur wenn ein wertbares CCM-Signal vorliegt
 * (Test-Resultat ODER Nachweis). Ohne Signal (reine Selbstauskunft) ⇒ null,
 * damit die Bestands-UI unverändert bleibt.
 */
function healthBadge(
  h: ControlHealth | undefined,
  de: boolean,
): { label: string; cls: string } | null {
  if (!h) return null;
  if (h.testState === "none" && h.evidenceState === "none") return null;
  if (h.testState === "fail") {
    return { label: de ? "Test fehlgeschlagen" : "Test failed", cls: "st-nein-border st-nein-text st-nein-tint" };
  }
  if (h.evidenceState === "stale") {
    return { label: de ? "Nachweis fällig" : "Evidence due", cls: "st-teilweise-border st-teilweise-text st-teilweise-tint" };
  }
  if (h.badge === "verified") {
    return { label: de ? "verifiziert" : "verified", cls: "st-ja-border st-ja-text st-ja-tint" };
  }
  if (h.evidenceState === "expiring") {
    return { label: de ? "Nachweis läuft ab" : "Evidence expiring", cls: "st-teilweise-border st-teilweise-text st-teilweise-tint" };
  }
  return null;
}

const STATUS_META: { value: AnswerStatus; de: string; en: string; cls: string; icon: string }[] = [
  { value: "ja",        de: "Umgesetzt", en: "Implemented", cls: "bg-success text-success-foreground",         icon: "✓" },
  { value: "teilweise", de: "Teilweise", en: "Partial",     cls: "bg-warning text-warning-foreground",          icon: "◐" },
  { value: "nein",      de: "Nicht umgesetzt", en: "Not implemented",        cls: "bg-destructive text-destructive-foreground",  icon: "✕" },
  { value: "na",        de: "N.a.",      en: "N/A",         cls: "bg-muted text-muted-foreground",              icon: "—" },
];


export function ControlRowItem({
  control,
  effective,
  de,
  usesMaturity,
  onSetStatus,
  onSetNote,
  onSetReifegrad,
  assets = [],
  assetEffective = new Map(),
  assetOverrideIds = new Set(),
  onSetAssetStatus,
  onSetAssetReifegrad,
  health,
  severityStored,
  onSetSeverity,
  coverageStored,
  onSetCoverage,
}: Props) {
  const [notesOpen, setNotesOpen] = useState(!!effective.note);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeNote, setGradeNote] = useState(severityStored?.severity_note ?? "");
  const [covOpen, setCovOpen] = useState(false);
  const [covScope, setCovScope] = useState(coverageStored?.scope_note ?? "");
  const [covEvidence, setCovEvidence] = useState(coverageStored?.evidence_note ?? "");
  const [covFrom, setCovFrom] = useState(coverageStored?.period_from ?? "");
  const [covTo, setCovTo] = useState(coverageStored?.period_to ?? "");
  const hBadge = healthBadge(health, de);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const label = de ? (control.req_de ?? control.req_en) : (control.req_en ?? control.req_de);
  // ISO 27001: interne ID (a5-04) ist eine Prüffragen-Nummer, KEINE Annex-Nummer →
  // Anzeige „A.5.1 · Informationssicherheitsrichtlinien", ID nur im Tooltip/Info.
  const isIso = control.framework === "ISO27001";
  const annex = isIso ? isoEntry(control.id) : undefined;
  const annexTitle = annex ? (de ? annex.titleDe : annex.titleEn) : "";
  // MUSS: DB-Flag ODER (ISO, solange muss=NULL) Klausel 4–10 laut Annex-Map. SOLL-Badge nur ISO Annex A.
  const isMust = control.muss === "true" || (control.muss as unknown) === true || control.muss === "MUSS"
    || (control.muss == null && isIso && isIsoClause(control.id));
  const isSoll = isIso && !isMust && annex?.kind === "annex";
  const tags = control.tags ?? [];
  // P3.X.8: „N.a." nur mit Pflichtbegründung (SoA, ISO 27001 6.1.3 d) — Notizfeld
  // automatisch öffnen, solange keine Begründung vorliegt (auch nach Massenaktion).
  const naWithoutNote = effective.status === "na" && !(effective.note ?? "").trim();
  useEffect(() => { if (naWithoutNote) setNotesOpen(true); }, [naWithoutNote]);
  const scope: ControlScopeKind = useMemo(() => inferControlScope(control), [control]);
  const scopeMeta = {
    org:   { icon: Building2, cls: "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10" },
    asset: { icon: Server,    cls: "st-ja-border st-ja-text st-ja-tint" },
    mixed: { icon: GitBranch, cls: "border-purple-500/40 text-purple-600 dark:text-purple-400 bg-purple-500/10" },
  }[scope];
  const ScopeIcon = scopeMeta.icon;
  const showAssetOverrides = scope !== "org" && assets.length > 0 && !!onSetAssetStatus && !!onSetAssetReifegrad;
  // Y7: Zusätzliche Prüfkriterien des Katalogs — je ISO-Anforderung, zu der
  // diese Kontrolle beiträgt. Ohne sie bewertet der Prüfer nur den Kurztext.
  const criteria = useMemo(() => (isIso ? isoAuditCriteriaForControl(control.id) : []), [isIso, control.id]);
  // Y7: Abweichungsgrad — nur bei einem Mangel („Offen"/„Teilweise") relevant.
  const sev = severityView(control, effective.status, severityStored);
  // K2: Vorbereitungskontrolle — ein fehlendes Ereignis hebt sie nicht auf.
  const readiness = readinessControl(control.id);
  // Katalogangaben (z. B. AI Act): Geltungsbeginn, Rolle, Bedingung, Nachweis-Hinweis.
  const cat = useMemo(() => catalogMetaOf((control as any).meta), [control]);
  const today = new Date().toISOString().slice(0, 10);
  const appliesLater = !!cat?.appliesFrom && cat.appliesFrom > today;
  const dayDe = (iso?: string) => (iso ? iso.split("-").reverse().join(".") : "");
  const ROLE: Record<string, [string, string]> = { anbieter: ["Anbieter", "Provider"], betreiber: ["Betreiber", "Deployer"], einfuehrer: ["Einführer", "Importer"], haendler: ["Händler", "Distributor"], gpai_anbieter: ["GPAI-Anbieter", "GPAI provider"] };
  const showGrade = !!onSetSeverity && severityApplies(effective.status);
  useEffect(() => { setGradeNote(severityStored?.severity_note ?? ""); }, [severityStored?.severity_note]);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        {annex ? (
          <span
            className="shrink-0 inline-flex items-center gap-1.5 max-w-[40%]"
            title={`${de ? "Interne Prüffrage" : "Internal check item"} ${control.id} · ${annex.ref} ${annexTitle}`}
          >
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              {annex.ref}
            </span>
            <span className="hidden md:inline text-[11px] text-muted-foreground truncate">{annexTitle}</span>
          </span>
        ) : (
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
            {control.id}
          </span>
        )}
        <p className="flex-1 min-w-0 text-sm text-card-foreground leading-relaxed">{label}</p>
        <div className="flex items-center gap-1 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <button aria-label={de ? "Anwendungsbereich" : "Scope"}>
                <Badge variant="outline" className={`text-[10px] gap-1 cursor-help ${scopeMeta.cls}`}>
                  <ScopeIcon className="h-2.5 w-2.5" />
                  {scopeLabel(scope, de)}
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 text-xs leading-relaxed" side="top" align="end">
              <p className="font-semibold mb-1">{scopeLabel(scope, de)}</p>
              <p className="text-muted-foreground">{scopeTooltip(scope, de)}</p>
            </PopoverContent>
          </Popover>
          {isMust && (
            <Badge
              variant="destructive"
              className="text-[10px]"
              title={isIso ? (de ? "Managementsystem-Klausel 4–10: Pflicht, nicht per SoA ausschließbar" : "Management-system clause 4–10: mandatory, cannot be excluded via SoA") : undefined}
            >
              {de ? "Muss" : "Must"}
            </Badge>
          )}
          {isSoll && (
            <Badge
              variant="outline"
              className="text-[10px] border-sky-500/40 text-sky-700 dark:text-sky-300"
              title={de ? "Annex-A-Kontrolle: per Anwendbarkeitserklärung (SoA) mit Begründung ausschließbar" : "Annex A control: can be excluded via the Statement of Applicability (SoA) with justification"}
            >
              {de ? "Soll" : "Should"}
            </Badge>
          )}
          {hBadge && (
            <Badge variant="outline" className={`text-[10px] ${hBadge.cls}`}>{hBadge.label}</Badge>
          )}
          {appliesLater && (
            <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-700 dark:text-blue-300"
                   title={cat?.appliesFromNote ?? (de ? "Die Pflicht gilt erst ab diesem Datum." : "The duty applies only from this date.")}>
              {de ? "Gilt ab " : "Applies from "}{dayDe(cat?.appliesFrom)}
            </Badge>
          )}
          {cat?.policyFlag && (
            <Badge variant="outline" className="text-[10px]" title={cat.statutoryTrigger ?? undefined}>
              {cat.policyFlag === "interne_vorgabe" ? (de ? "Interne Vorgabe" : "Internal target") : (de ? "Interne Praxis" : "Internal practice")}
            </Badge>
          )}
          {tags.slice(0, 2).map(t => (
            <Badge key={t} variant="outline" className="text-[10px] capitalize">{t}</Badge>
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground p-1" aria-label="Info">
                <Info className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-xs space-y-2">
              {annex ? (
                <div>
                  <div className="font-semibold">{annex.ref} · {annexTitle}</div>
                  <div className="text-[10.5px] text-muted-foreground font-mono">
                    {de ? "Interne Prüffrage" : "Internal check item"}: {control.id}
                    {" · "}
                    {annex.kind === "clause"
                      ? (de ? "Klausel (Pflicht)" : "Clause (mandatory)")
                      : (de ? "Annex A (SoA)" : "Annex A (SoA)")}
                  </div>
                </div>
              ) : (
                <div className="font-semibold">{control.id}</div>
              )}
              {/* Zuerst die Sprache der Oberfläche, darunter kursiv die andere.
                  Vorher stand hier fest req_de oben und req_en kursiv darunter —
                  englischsprachige Nutzer bekamen also Deutsch zuerst. */}
              <div className="text-muted-foreground leading-relaxed">{de ? (control.req_de ?? control.req_en) : (control.req_en ?? control.req_de)}</div>
              {(de ? control.req_en : control.req_de) && (de ? control.req_en : control.req_de) !== (de ? control.req_de : control.req_en) && (
                <div className="text-muted-foreground italic">{de ? control.req_en : control.req_de}</div>
              )}
              {cat && (cat.legalRef || cat.appliesFrom || cat.role?.length || cat.applicabilityCondition || cat.evidenceHint || cat.statutoryTrigger) && (
                <div className="pt-2 border-t border-border space-y-1 text-[11px]">
                  {cat.legalRef && <div><span className="font-semibold">{de ? "Rechtsgrundlage" : "Legal basis"}:</span> {cat.legalRef}</div>}
                  {cat.appliesFrom && <div><span className="font-semibold">{de ? "Gilt ab" : "Applies from"}:</span> {dayDe(cat.appliesFrom)}{cat.appliesFromNote ? ` — ${cat.appliesFromNote}` : ""}</div>}
                  {cat.role?.length ? <div><span className="font-semibold">{de ? "Rolle" : "Role"}:</span> {cat.role.map(r => ROLE[r]?.[de ? 0 : 1] ?? r).join(", ")}</div> : null}
                  {cat.applicabilityCondition && <div><span className="font-semibold">{de ? "Anwendbar, wenn" : "Applies where"}:</span> {cat.applicabilityCondition}</div>}
                  {cat.statutoryTrigger && <div><span className="font-semibold">{de ? "Gesetzlicher Auslöser" : "Statutory trigger"}:</span> {cat.statutoryTrigger}{cat.internalTarget ? ` · ${de ? "interne Vorgabe" : "internal target"}: ${cat.internalTarget}` : ""}</div>}
                  {cat.evidenceHint && <div><span className="font-semibold">{de ? "Nachweis" : "Evidence"}:</span> {cat.evidenceHint}</div>}
                </div>
              )}
              {effective.inheritedFrom && effective.inheritedFrom.length > 0 && (
                <div className="pt-2 border-t border-border flex items-start gap-1.5 text-[11px]">
                  <Link2 className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{de ? "Kontroll-Knoten (same-as):" : "Control nodes (same-as):"} {effective.inheritedFrom.join(", ")}</span>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_META.map(opt => {
          const active = effective.status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => {
                const next = active ? null : opt.value;
                // K2: Ein fehlendes Ereignis hebt eine Vorbereitungspflicht nicht
                // auf. „N.a." wird hier nicht verboten — aber der Nutzer muss die
                // Katalogklausel gesehen und bestätigt haben, damit „es ist nichts
                // passiert" nicht stillschweigend zum Ausschluss wird.
                if (next === "na" && readiness) {
                  const ok = window.confirm(de
                    ? `${control.id} ist eine Vorbereitungskontrolle.\n\nEin fehlendes Ereignis nimmt sie NICHT aus dem Anwendungsbereich. Zu prüfen sind die festgelegten Regelungen, Zuständigkeiten und ein angemessener Durchgang; was fehlt, ist eine Ausführungsstichprobe.\n\nKatalogklausel:\n${readiness.clause}\n\nTrotzdem als „nicht anwendbar“ erklären? Dann ist eine Begründung Pflicht, die einen anderen Grund als das fehlende Ereignis nennt.`
                    : `${control.id} is a readiness control.\n\nThe absence of an event does NOT take it out of scope. What must be assessed are the defined arrangements, responsibilities and a proportionate walkthrough; what is missing is an execution sample.\n\nCatalogue clause:\n${readiness.clause}\n\nDeclare it not applicable anyway? A justification naming a reason other than the missing event is then mandatory.`);
                  if (!ok) return;
                }
                onSetStatus(next);
                // P3.X.8: „N.a." ohne Begründung → Notizfeld sofort öffnen (Pflicht, SoA).
                if (next === "na" && !(effective.note ?? "").trim()) setNotesOpen(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                active
                  ? `${opt.cls} ring-2 ring-offset-1 ring-offset-card scale-105 shadow`
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="mr-1">{opt.icon}</span>{de ? opt.de : opt.en}
            </button>
          );
        })}
        {effective.origin === "inherited" && (
          <Badge variant="outline" className="text-[10px] gap-1">
            <Link2 className="h-3 w-3" /> {de ? "über Kontroll-Knoten übernommen" : "inherited via control node"}
          </Badge>
        )}
        {effective.origin === "inherited" && effective.projectionQuality === "partial" && !effective.scopeReviewFrom && (
          <Badge variant="outline" className="text-[10px] gap-1 st-teilweise-border st-teilweise-text">
            {de ? "geerbt (teilweise Überdeckung)" : "inherited (partial coverage)"}
          </Badge>
        )}
        {/* Y8: Ein „ja" aus einem anderen Framework ist gedeckelt, solange
            Umfang, Zeitraum und Nachweisdeckung nicht bestätigt sind. */}
        {effective.scopeReviewFrom && (
          <Badge
            variant="outline"
            className="text-[10px] gap-1 st-teilweise-border st-teilweise-text"
            title={de
              ? `„${effective.scopeReviewFrom.status}" aus ${effective.scopeReviewFrom.framework} (${effective.scopeReviewFrom.controlId}) übernommen. Ein gleicher Wortlaut belegt nicht denselben Geltungsbereich, Zeitraum und Nachweisumfang — bis zur Deckungsprüfung gilt „teilweise".`
              : `Taken from ${effective.scopeReviewFrom.framework} (${effective.scopeReviewFrom.controlId}). Identical wording does not prove the same scope, period and evidence coverage — until the coverage review it counts as partial.`}
          >
            {coverageStored?.decision === "teilweise"
              ? (de ? "Deckung: teilweise" : "coverage: partial")
              : (de ? "Deckung offen" : "coverage open")}
          </Badge>
        )}
        <span className="flex-1" />
        {showAssetOverrides && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={() => setAssetsOpen((v) => !v)}
            aria-expanded={assetsOpen}
          >
            <Server className="h-3 w-3" />
            Assets {assetOverrideIds.size > 0 ? `${assetOverrideIds.size}/${assets.length}` : assets.length}
            <ChevronDown className={`h-3 w-3 transition-transform ${assetsOpen ? "" : "-rotate-90"}`} />
          </Button>
        )}
        {criteria.length > 0 && (
          <button
            onClick={() => setCriteriaOpen(v => !v)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
            aria-expanded={criteriaOpen}
            title={de
              ? "Zusätzliche Prüfkriterien des Katalogs zu den ISO-Anforderungen, zu denen diese Kontrolle beiträgt"
              : "Additional audit criteria from the catalogue for the ISO requirements this control contributes to"}
          >
            {de ? "Prüfkriterien" : "Audit criteria"} ({criteria.length}) {criteriaOpen ? "▲" : "▼"}
          </button>
        )}
        <button
          onClick={() => setNotesOpen((v) => !v)}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          {de ? "Kommentar" : "Comment"} {notesOpen ? "▲" : "▼"}
        </button>
      </div>

      {/* ── Y7 · Zusätzliche Prüfkriterien (123 Anforderungen des Katalogs) ────
          Der Kurztext einer Kontrolle sagt, WAS gefordert ist; diese Kriterien
          sagen, WORAUF beim Prüfen zu achten ist — und dass eine Zuordnung
          allein kein Prüfergebnis ist. Text im Originalwortlaut des Katalogs,
          wie die ISO-Kontrolltexte selbst. */}
      {criteriaOpen && criteria.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5 text-[11.5px] leading-relaxed">
          <div className="font-medium text-muted-foreground">
            {de ? "Zusätzliche Prüfkriterien" : "Additional audit criteria"}
          </div>
          {criteria.map(c => (
            <div key={c.ref} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  {c.ref.startsWith("A.") ? c.ref : (de ? `Klausel ${c.ref}` : `Clause ${c.ref}`)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {de ? "Beitrag zur Anforderung" : "contributes to requirement"}
                </span>
              </div>
              <p className="text-card-foreground">{c.criteria}</p>
            </div>
          ))}
          {/* K1: Auswahlbegründung steht VOR der Bewertung; eine Zuordnung ist
              kein Prüfergebnis. Beide Regeln kommen aus dem Katalogvertrag. */}
          <div className="pt-2 border-t border-border space-y-1.5 text-[10.5px] text-muted-foreground">
            <p>{ISO_SCOPE_RULE}</p>
            <p>{ISO_NO_AUTOMATIC_PASS}</p>
            {annex?.kind === "annex" && <p>{ISO_CONTROL_SELECTION_RULE}</p>}
            {annex?.kind === "annex" && <p>{ISO_ANNEX_SELECTION_RULE}</p>}
          </div>
        </div>
      )}

      {/* ── Y8 · Deckungsprüfung bei framework-übergreifender Übernahme ───────
          Das „ja" kommt aus einem anderen Framework. Bevor es hier als voll
          erfüllt zählt, muss festgehalten sein, WELCHE Einheiten, WELCHER
          Zeitraum und WELCHE Nachweise geprüft wurden. Ohne diese Angabe
          bleibt der Status „teilweise" — nicht 100 %. */}
      {effective.scopeReviewFrom && onSetCoverage && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground">
              {de ? "Deckungsprüfung" : "Coverage review"}
            </span>
            <Badge variant="outline" className="text-[10px] gap-1">
              <Link2 className="h-3 w-3" />
              {effective.scopeReviewFrom.framework} · {effective.scopeReviewFrom.controlId}
            </Badge>
            <Badge variant="outline" className={`text-[10px] ${
              coverageStored?.decision === "voll" ? "st-ja-border st-ja-text"
                : coverageStored?.decision === "teilweise" ? "st-teilweise-border st-teilweise-text"
                : "border-dashed"
            }`}>
              {coverageStored?.decision === "voll" ? (de ? "voll gedeckt" : "fully covered")
                : coverageStored?.decision === "teilweise" ? (de ? "teilweise gedeckt" : "partially covered")
                : (de ? "noch nicht geprüft" : "not yet reviewed")}
            </Badge>
            <span className="flex-1" />
            <button
              onClick={() => setCovOpen(v => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
              aria-expanded={covOpen}
            >
              {de ? "prüfen" : "review"} {covOpen ? "▲" : "▼"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {de
              ? "Die Antwort stammt aus einem anderen Rahmenwerk. Eine schmalere Prüfung deckt nur den passenden Teil dieses Geltungsbereichs; bis zur Bestätigung zählt die Kontrolle als teilweise umgesetzt."
              : "The answer comes from another framework. A narrower assessment covers only the matching part of this scope; until confirmed the control counts as partially implemented."}
          </p>
          {covOpen && (
            <div className="space-y-2">
              <Textarea
                value={covScope}
                onChange={(e) => setCovScope(e.target.value)}
                placeholder={de
                  ? "Geltungsbereich: welche Einheiten, Standorte, Dienste wurden geprüft? (Pflicht für „voll gedeckt“)"
                  : "Scope: which entities, sites and services were assessed? (required for full coverage)"}
                className="text-xs min-h-[54px]"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-[11px] text-muted-foreground">{de ? "Zeitraum" : "Period"}</label>
                <Input type="date" value={covFrom} onChange={(e) => setCovFrom(e.target.value)} className="h-7 w-36 text-xs" />
                <span className="text-[11px] text-muted-foreground">–</span>
                <Input type="date" value={covTo} onChange={(e) => setCovTo(e.target.value)} className="h-7 w-36 text-xs" />
              </div>
              <Textarea
                value={covEvidence}
                onChange={(e) => setCovEvidence(e.target.value)}
                placeholder={de
                  ? "Nachweisdeckung: welche Nachweise belegen diesen Umfang, und welcher Teil fehlt noch?"
                  : "Evidence coverage: which evidence supports this scope, and which part is still missing?"}
                className="text-xs min-h-[54px]"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {([
                  ["voll", de ? "Voll gedeckt" : "Fully covered"],
                  ["teilweise", de ? "Teilweise gedeckt" : "Partially covered"],
                ] as const).map(([v, label]) => (
                  <Button
                    key={v}
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-pressed={coverageStored?.decision === v}
                    className={`h-7 text-[11px] px-2.5 border ${
                      coverageStored?.decision === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => onSetCoverage(v, {
                      scopeNote: covScope,
                      periodFrom: covFrom || null,
                      periodTo: covTo || null,
                      evidenceNote: covEvidence,
                    })}
                  >
                    {label}
                  </Button>
                ))}
                {coverageStored && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 border border-dashed border-border hover:bg-muted"
                    onClick={() => onSetCoverage(null, { scopeNote: "", periodFrom: null, periodTo: null, evidenceNote: "" })}
                  >
                    {de ? "Entscheid zurücknehmen" : "Withdraw decision"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Y7 · Abweichungsgrad (Haupt-/Nebenabweichung) ─────────────────────
          Getrennt von der Risikopriorität: hier wird das Gewicht des
          FESTGESTELLTEN Mangels gegen die Norm eingestuft, nicht die Wirkung
          eines Szenarios. Der Katalogwert ist ein Vorschlag und bleibt als
          solcher sichtbar, bis der Prüfer ihn mit Begründung bestätigt. */}
      {showGrade && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground">
              {de ? "Abweichungsgrad" : "Nonconformity grade"}
            </span>
            <Badge variant="outline" className={`text-[10px] ${severityToneClass(sev.value)}`}>
              {severityLabel(sev.value, de ? "de" : "en")}
            </Badge>
            {sev.pending && (
              <Badge variant="outline" className="text-[10px] border-dashed"
                     title={ISO_SEVERITY_RULE}>
                {de ? "Katalogvorschlag — nicht bestätigt" : "catalogue suggestion — not confirmed"}
              </Badge>
            )}
            {sev.source === "pruefer" && (
              <Badge variant="outline" className="text-[10px] st-ja-border st-ja-text">
                {de ? "durch Prüfer entschieden" : "decided by auditor"}
              </Badge>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground" aria-label="Info">
                  <Info className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-xs space-y-2 leading-relaxed">
                <p className="font-semibold">{de ? "Abweichungsgrad ≠ Risikopriorität" : "Nonconformity grade ≠ risk priority"}</p>
                <p className="text-muted-foreground">
                  {de
                    ? "Die Risikopriorität bewertet die mögliche Wirkung eines Szenarios. Der Abweichungsgrad bewertet das Gewicht des festgestellten Mangels gegenüber der Norm. Beide werden getrennt geführt und setzen sich nicht gegenseitig."
                    : "Risk priority rates the potential impact of a scenario. The nonconformity grade rates the weight of the observed deficiency against the standard. Both are kept separate and never set one another."}
                </p>
                <p className="text-[10.5px] text-muted-foreground pt-1 border-t border-border">{ISO_SEVERITY_RULE}</p>
              </PopoverContent>
            </Popover>
            <span className="flex-1" />
            <button
              onClick={() => setGradeOpen(v => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
              aria-expanded={gradeOpen}
            >
              {sev.source === "pruefer" ? (de ? "ändern" : "change") : (de ? "einstufen" : "grade")} {gradeOpen ? "▲" : "▼"}
            </button>
          </div>
          {gradeOpen && (
            <div className="space-y-2">
              <div className="flex items-center gap-1 flex-wrap">
                {(["major", "minor", "keine"] as const).map(v => (
                  <Button
                    key={v}
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-pressed={sev.source === "pruefer" && sev.value === v}
                    className={`h-7 text-[11px] px-2.5 border ${
                      sev.source === "pruefer" && sev.value === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                    onClick={() => {
                      const note = gradeNote.trim();
                      if (!note) return;          // Begründung ist Pflicht (DB-CHECK)
                      onSetSeverity?.(v, note);
                    }}
                  >
                    {severityLabel(v, de ? "de" : "en")}
                  </Button>
                ))}
                {sev.source === "pruefer" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] px-2.5 border border-dashed border-border hover:bg-muted"
                    onClick={() => onSetSeverity?.(null, "")}
                    title={de
                      ? "Entscheid zurücknehmen — es gilt wieder der Katalogvorschlag"
                      : "Withdraw the decision — the catalogue suggestion applies again"}
                  >
                    {de ? "Entscheid zurücknehmen" : "Withdraw decision"}
                  </Button>
                )}
              </div>
              <Textarea
                value={gradeNote}
                onChange={(e) => setGradeNote(e.target.value)}
                placeholder={de
                  ? "Begründung der Einstufung (Pflicht): Welches Normergebnis wird verfehlt und in welchem Umfang?"
                  : "Justification for the grade (required): which required outcome is missed, and to what extent?"}
                className={`text-xs min-h-[60px] ${!gradeNote.trim() ? "border-destructive/60" : ""}`}
              />
              {!gradeNote.trim() && (
                <p className="text-[11px] text-destructive font-medium" role="alert">
                  {de
                    ? "Ohne Begründung wird die Einstufung nicht gespeichert — ein Befundgrad ohne Begründung ist im Audit nicht belastbar."
                    : "Without a justification the grade is not saved — an ungrounded grade does not hold up in an audit."}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {showAssetOverrides && assetsOpen && (
        <AssetOverridePanel
          assets={assets}
          effectiveByAsset={assetEffective}
          overrideIds={assetOverrideIds}
          de={de}
          usesMaturity={usesMaturity}
          orgEffective={effective}
          onSetStatus={onSetAssetStatus}
          onSetReifegrad={onSetAssetReifegrad}
          onApplyDefaultToAll={() => {
            assets.forEach((asset) => {
              onSetAssetStatus(asset.id, effective.status);
              onSetAssetReifegrad(asset.id, effective.reifegrad as Reifegrad | null);
            });
          }}
          onClearAll={() => {
            assets.forEach((asset) => {
              onSetAssetStatus(asset.id, null);
            });
          }}
        />
      )}

      {usesMaturity && (effective.status === "ja" || effective.status === "teilweise") && (() => {
        const sel = effective.reifegrad;
        // Reifegrad-Farbskala: 0–1 rot, 2 amber, 3 gelb, 4–5 grün.
        const fillCls = sel == null ? "bg-muted"
          : sel <= 1 ? "bg-destructive"
          : sel === 2 ? "st-teilweise-bg"
          : sel === 3 ? "st-teilweise-bg"
          : "st-ja-bg";
        const badgeCls = sel == null ? "border-border text-muted-foreground"
          : sel <= 1 ? "border-destructive/40 text-destructive"
          : sel === 2 ? "st-teilweise-border st-teilweise-text"
          : sel === 3 ? "st-teilweise-border st-teilweise-text"
          : "st-ja-border st-ja-text";
        return (
        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" />
            {de ? "Reifegrad" : "Maturity level"}
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground" aria-label="Info">
                  <Info className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 text-xs space-y-1.5">
                {([0,1,2,3,4,5] as const).map(k => (
                  <div key={k}><span className="font-semibold">{de ? REIFEGRAD_LABELS[k].de : REIFEGRAD_LABELS[k].en}</span> — <span className="text-muted-foreground">{REIFEGRAD_LABELS[k].hint}</span></div>
                ))}
              </PopoverContent>
            </Popover>
            {sel != null && (
              <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeCls}`}>
                {sel} · {de ? REIFEGRAD_LABELS[sel].de : REIFEGRAD_LABELS[sel].en}
              </span>
            )}
          </div>

          {/* Reifegrad-Leiter: aufsteigende Balken, gefüllt bis zum gewählten Level */}
          <div className="flex items-end gap-1.5">
            {([0,1,2,3,4,5] as const).map(k => {
              const filled = sel != null && k <= sel;
              const active = sel === k;
              return (
                <button
                  key={k}
                  onClick={() => onSetReifegrad(active ? null : k)}
                  title={`${de ? REIFEGRAD_LABELS[k].de : REIFEGRAD_LABELS[k].en} — ${REIFEGRAD_LABELS[k].hint}`}
                  aria-pressed={active}
                  className="group flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded-md transition-all ${filled ? fillCls : "bg-muted group-hover:bg-muted-foreground/25"} ${active ? "ring-2 ring-primary/50 ring-offset-1 ring-offset-background" : ""}`}
                    style={{ height: `${12 + k * 6}px` }}
                  />
                  <span className={`text-[10px] font-semibold tabular-nums ${active ? "text-foreground" : "text-muted-foreground"}`}>{k}</span>
                </button>
              );
            })}
          </div>

          {sel != null && (
            <div className="text-[11px] text-muted-foreground leading-snug">
              {REIFEGRAD_LABELS[sel].hint}
            </div>
          )}
        </div>
        );
      })()}

      {notesOpen && (
        <div className="space-y-1">
          <Textarea
            value={effective.note ?? ""}
            onChange={(e) => onSetNote(e.target.value)}
            placeholder={effective.status === "na"
              ? (de ? "Begründung für Nicht-Anwendbarkeit (Pflicht, wird in die SoA übernommen) …" : "Justification for non-applicability (required, carried into the SoA) …")
              : (de ? "Nachweis / Begründung …" : "Evidence / rationale …")}
            aria-invalid={naWithoutNote || undefined}
            className={`text-xs min-h-[70px] ${naWithoutNote ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {naWithoutNote && (
            <p className="text-[11px] text-destructive font-medium" role="alert">
              {de
                ? "Begründung für Nicht-Anwendbarkeit ist Pflicht (SoA, ISO 27001 6.1.3 d)."
                : "A justification for non-applicability is mandatory (SoA, ISO 27001 6.1.3 d)."}
            </p>
          )}
        </div>
      )}

      {notesOpen && (
        <EvidencePanel framework={control.framework} controlId={control.id} />
      )}

    </div>
  );
}
