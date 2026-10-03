import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerStatus } from "@/lib/assessmentEngine";

/** Mindestlänge der Pflichtbegründung für Massenaktionen (P3.X.6 / P3.X.8). */
export const BULK_NOTE_MIN_CHARS = 10;

export interface BulkStatusRequest {
  status: AnswerStatus;
  /** Betroffene Kontroll-IDs. */
  ids: string[];
  /** Anzeigename des Bausteins/Themas. */
  groupLabel: string;
  /** Anzahl bereits bewerteter Anforderungen, die mit ABWEICHENDEM Status überschrieben würden. */
  overwrite: number;
}

interface Props {
  request: BulkStatusRequest | null;
  de: boolean;
  onCancel: () => void;
  /** Bestätigung mit Pflichtnotiz (bei „na"/„ja") bzw. ohne Notiz (bei „teilweise"/„nein"). */
  onConfirm: (req: BulkStatusRequest, note: string) => void;
}

const STATUS_LABEL: Record<AnswerStatus, { de: string; en: string }> = {
  ja:        { de: "Umgesetzt", en: "Implemented" },
  teilweise: { de: "Teilweise", en: "Partial" },
  nein:      { de: "Nicht umgesetzt", en: "Not implemented" },
  na:        { de: "N.a.",      en: "N/A" },
};

/** Status, bei denen eine Pflichtnotiz verlangt wird. */
export function bulkNeedsNote(status: AnswerStatus): boolean {
  return status === "na" || status === "ja";
}

/**
 * Bestätigungsdialog für „Alle → …"-Massenbuttons.
 *  • „Alle → N.a.": Pflichtbegründung (SoA: Nicht-Anwendbarkeit muss begründet sein, ISO 27001 6.1.3 d).
 *  • „Alle → Umsetzt": Pflichtnotiz (Nachweis/Begründung, verhindert „Alles grün" ohne Beleg).
 *  • „Teilweise"/„Offen": nur Bestätigung, wenn Bewertetes überschrieben würde.
 */
export function BulkStatusDialog({ request, de, onCancel, onConfirm }: Props) {
  const [note, setNote] = useState("");
  useEffect(() => { setNote(""); }, [request]);
  if (!request) return null;

  const needsNote = bulkNeedsNote(request.status);
  const trimmed = note.trim();
  const tooShort = needsNote && trimmed.length < BULK_NOTE_MIN_CHARS;
  const label = de ? STATUS_LABEL[request.status].de : STATUS_LABEL[request.status].en;
  const n = request.ids.length;

  const title = request.status === "na"
    ? (de ? `${n} Anforderung(en) auf „Nicht anwendbar" setzen` : `Set ${n} requirement(s) to "Not applicable"`)
    : request.status === "ja"
      ? (de ? `${n} Anforderung(en) auf „Umgesetzt" setzen` : `Set ${n} requirement(s) to "Implemented"`)
      : (de ? `${n} Anforderung(en) auf „${label}" setzen` : `Set ${n} requirement(s) to "${label}"`);

  const hint = request.status === "na"
    ? (de
        ? "Begründung für Nicht-Anwendbarkeit ist Pflicht (SoA, ISO 27001 6.1.3 d). Die Begründung wird als Kommentar in jede Anforderung ohne eigene Notiz übernommen."
        : "A justification for non-applicability is mandatory (SoA, ISO 27001 6.1.3 d). It is stored as the comment of every requirement that has no note of its own.")
    : request.status === "ja"
      ? (de
          ? "Bitte Nachweis/Begründung angeben, warum alle Anforderungen dieses Bausteins als umgesetzt gelten (Audit-Nachweis). Wird als Kommentar in jede Anforderung ohne eigene Notiz übernommen."
          : "Please state the evidence/rationale why all requirements of this block count as implemented (audit evidence). Stored as the comment of every requirement without its own note.")
      : null;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-xs">
            {de ? "Baustein/Thema: " : "Block/topic: "}<span className="font-medium text-foreground">{request.groupLabel}</span>
          </DialogDescription>
        </DialogHeader>

        {request.overwrite > 0 && (
          <div className="flex items-start gap-2 rounded-md border st-teilweise-border st-teilweise-tint px-3 py-2 text-xs st-teilweise-text">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              {de
                ? `${request.overwrite} bereits bewertete Anforderung${request.overwrite > 1 ? "en" : ""} mit abweichendem Status wird überschrieben.`
                : `${request.overwrite} already-assessed requirement${request.overwrite > 1 ? "s" : ""} with a different status will be overwritten.`}
            </span>
          </div>
        )}

        {needsNote && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {request.status === "na"
                ? (de ? "Begründung (Pflicht)" : "Justification (required)")
                : (de ? "Nachweis / Begründung (Pflicht)" : "Evidence / rationale (required)")}
            </label>
            <Textarea
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={request.status === "na"
                ? (de ? "z. B. Keine eigene Softwareentwicklung – Kontrolle betrifft nur Entwicklungsprozesse." : "e.g. No in-house software development – control only concerns development processes.")
                : (de ? "z. B. Richtlinie v2.1 freigegeben am …, Nachweis im DMS unter …" : "e.g. Policy v2.1 approved on …, evidence in DMS under …")}
              className="text-xs min-h-[80px]"
            />
            <p className={`text-[11px] ${tooShort ? "text-destructive" : "text-muted-foreground"}`}>
              {hint}{" "}
              <span className="tabular-nums">({trimmed.length}/{BULK_NOTE_MIN_CHARS} {de ? "Zeichen min." : "chars min."})</span>
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onCancel}>{de ? "Abbrechen" : "Cancel"}</Button>
          <Button size="sm" disabled={tooShort} onClick={() => onConfirm(request, trimmed)}>
            {de ? `Alle → ${label}` : `All → ${label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
