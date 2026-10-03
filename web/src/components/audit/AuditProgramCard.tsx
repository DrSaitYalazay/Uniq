/**
 * AuditProgramCard — Karte „Audit-Programm" (ISO 27001 9.2): Tabelle aller Audits
 * mit Aktionen Neues Audit / Öffnen / Starten / Abschließen / Löschen.
 *
 * Reine Präsentation + Dialoge; die Zustandsänderung macht die Workbench
 * (Callbacks). Abgeschlossene Audits sind read-only (nur Öffnen zum Ansehen).
 */
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarClock, CheckCircle2, FolderOpen, Play, Plus, Trash2, ListChecks } from "lucide-react";
import {
  AUDIT_STATUS_LABEL, AUDIT_TYP_LABEL, addMonthsIso, countAuditFindings, defaultAuditTitle, sortAudits, todayIso,
  type AuditRecord, type AuditTyp,
} from "./auditProgram";

export interface NewAuditInput { typ: AuditTyp; titel: string; datum: string; auditor: string; scopeFrameworks: string[] }

interface Props {
  de: boolean;
  audits: AuditRecord[];
  activeId: string | undefined;
  auditableFrameworks: string[];
  fwLabel: (code: string) => string;
  onCreate: (input: NewAuditInput) => void;
  onOpen: (id: string) => void;
  onStart: (id: string) => void;
  onClose: (id: string, naechstesAudit: string, createDeadline: boolean) => Promise<void> | void;
  onDelete: (id: string) => void;
}

const inputCls = "w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground";

export function AuditProgramCard({ de, audits, activeId, auditableFrameworks, fwLabel, onCreate, onOpen, onStart, onClose, onDelete }: Props) {
  const sorted = useMemo(() => sortAudits(audits), [audits]);
  const fmtDate = (d?: string) => d ? new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString(de ? "de-DE" : "en-GB") : "—";

  // ── Dialog: Neues Audit ──
  const [newOpen, setNewOpen] = useState(false);
  const [nTyp, setNTyp] = useState<AuditTyp>("intern");
  const [nTitel, setNTitel] = useState("");
  const [nTitelTouched, setNTitelTouched] = useState(false);
  const [nDatum, setNDatum] = useState(todayIso());
  const [nAuditor, setNAuditor] = useState("");
  const [nFws, setNFws] = useState<Set<string>>(new Set());
  const openNew = () => {
    setNTyp("intern"); setNTitel(defaultAuditTitle("intern", todayIso(), de)); setNTitelTouched(false);
    setNDatum(todayIso()); setNAuditor(""); setNFws(new Set(auditableFrameworks)); setNewOpen(true);
  };
  const changeTyp = (t: AuditTyp) => { setNTyp(t); if (!nTitelTouched) setNTitel(defaultAuditTitle(t, nDatum, de)); };
  const changeDatum = (d: string) => { setNDatum(d); if (!nTitelTouched) setNTitel(defaultAuditTitle(nTyp, d, de)); };
  const submitNew = () => {
    if (!nTitel.trim()) return;
    onCreate({ typ: nTyp, titel: nTitel.trim(), datum: nDatum, auditor: nAuditor.trim(), scopeFrameworks: [...nFws] });
    setNewOpen(false);
  };

  // ── Dialog: Abschließen ──
  const [closeId, setCloseId] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState("");
  const [withDeadline, setWithDeadline] = useState(true);
  const [closing, setClosing] = useState(false);
  const closeRec = audits.find(a => a.id === closeId) ?? null;
  const openClose = (rec: AuditRecord) => { setCloseId(rec.id); setNextDate(addMonthsIso(rec.datum || todayIso(), 12)); setWithDeadline(true); };
  const submitClose = async () => {
    if (!closeRec) return;
    setClosing(true);
    try { await onClose(closeRec.id, nextDate, withDeadline); setCloseId(null); }
    finally { setClosing(false); }
  };

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2"><ListChecks size={15} className="text-primary" />{de ? "Audit-Programm" : "Audit programme"}</div>
          <p className="text-[11px] text-muted-foreground">{de ? "Alle internen und externen Audits mit Historie (ISO 27001 9.2). Der Arbeitsbereich unten zeigt das geöffnete Audit." : "All internal and external audits with history (ISO 27001 9.2). The workspace below shows the opened audit."}</p>
        </div>
        <button onClick={openNew} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5">
          <Plus size={14} />{de ? "Neues Audit" : "New audit"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-1.5 pr-2 font-medium">{de ? "Titel" : "Title"}</th>
              <th className="py-1.5 pr-2 font-medium">{de ? "Typ" : "Type"}</th>
              <th className="py-1.5 pr-2 font-medium">{de ? "Datum" : "Date"}</th>
              <th className="py-1.5 pr-2 font-medium">{de ? "Auditor" : "Auditor"}</th>
              <th className="py-1.5 pr-2 font-medium">Status</th>
              <th className="py-1.5 pr-2 font-medium" title={de ? "Dokumentierte Befunde: Major / Minor / erledigt" : "Documented findings: major / minor / resolved"}>{de ? "Befunde" : "Findings"}</th>
              <th className="py-1.5 pr-2 font-medium">{de ? "Urteil" : "Verdict"}</th>
              <th className="py-1.5 font-medium text-right">{de ? "Aktionen" : "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(a => {
              const c = countAuditFindings(a);
              const isActive = a.id === activeId;
              const closed = a.status === "abgeschlossen";
              const st = AUDIT_STATUS_LABEL[a.status];
              return (
                <tr key={a.id} className={`border-b border-border/50 last:border-0 ${isActive ? "bg-primary/5" : ""}`}>
                  <td className="py-1.5 pr-2">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      {a.titel || "—"}
                      {isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">{de ? "geöffnet" : "open"}</span>}
                    </div>
                    {a.scopeFrameworks.length > 0 && <div className="text-[10px] text-muted-foreground">{a.scopeFrameworks.map(fwLabel).join(", ")}</div>}
                    {closed && a.naechstesAudit && <div className="text-[10px] text-muted-foreground flex items-center gap-1"><CalendarClock size={10} />{de ? "Nächstes Audit" : "Next audit"}: {fmtDate(a.naechstesAudit)}</div>}
                  </td>
                  <td className="py-1.5 pr-2 whitespace-nowrap">{de ? AUDIT_TYP_LABEL[a.typ].de : AUDIT_TYP_LABEL[a.typ].en}</td>
                  <td className="py-1.5 pr-2 whitespace-nowrap">{fmtDate(a.datum)}{closed && a.abgeschlossenAm ? <div className="text-[10px] text-muted-foreground">{de ? "abgeschl." : "closed"} {fmtDate(a.abgeschlossenAm)}</div> : null}</td>
                  <td className="py-1.5 pr-2">{a.auditor || "—"}</td>
                  <td className="py-1.5 pr-2 whitespace-nowrap"><span className={`px-1.5 py-0.5 rounded-full text-[10px] ${st.cls}`}>{de ? st.de : st.en}</span></td>
                  <td className="py-1.5 pr-2 whitespace-nowrap">
                    <span className="text-destructive font-semibold" title="Major">{c.major}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="st-teilweise-text font-semibold" title="Minor">{c.minor}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="st-ja-text font-semibold" title={de ? "Erledigt" : "Resolved"}>{c.erledigt}</span>
                    {c.ofi > 0 && <span className="text-muted-foreground"> (+{c.ofi} OFI)</span>}
                  </td>
                  <td className="py-1.5 pr-2 max-w-[200px] truncate" title={a.urteil}>{a.urteil || "—"}</td>
                  <td className="py-1.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {!isActive && (
                        <button onClick={() => onOpen(a.id)} className="rounded-md border border-border px-2 py-1 flex items-center gap-1 hover:bg-muted" title={de ? "Im Arbeitsbereich öffnen" : "Open in workspace"}>
                          <FolderOpen size={12} />{de ? "Öffnen" : "Open"}
                        </button>
                      )}
                      {a.status === "geplant" && (
                        <button onClick={() => onStart(a.id)} className="rounded-md border border-border px-2 py-1 flex items-center gap-1 hover:bg-muted" title={de ? "Audit starten (Status laufend)" : "Start audit (status in progress)"}>
                          <Play size={12} />{de ? "Starten" : "Start"}
                        </button>
                      )}
                      {!closed && (
                        <button onClick={() => openClose(a)} className="rounded-md border st-ja-border st-ja-text px-2 py-1 flex items-center gap-1 hover:bg-emerald-500/10" title={de ? "Audit abschließen (Urteil erforderlich)" : "Complete audit (verdict required)"}>
                          <CheckCircle2 size={12} />{de ? "Abschließen" : "Complete"}
                        </button>
                      )}
                      {c.total === 0 && audits.length > 1 && (
                        confirmDelete === a.id ? (
                          <span className="inline-flex items-center gap-1">
                            <button onClick={() => { onDelete(a.id); setConfirmDelete(null); }} className="rounded-md bg-destructive text-destructive-foreground px-2 py-1">{de ? "Wirklich löschen" : "Really delete"}</button>
                            <button onClick={() => setConfirmDelete(null)} className="rounded-md border border-border px-2 py-1">{de ? "Abbrechen" : "Cancel"}</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDelete(a.id)} className="rounded-md border border-border px-2 py-1 text-muted-foreground hover:text-destructive" title={de ? "Löschen (nur ohne Befunde)" : "Delete (only without findings)"}>
                            <Trash2 size={12} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className="py-3 text-center text-muted-foreground">{de ? "Noch kein Audit angelegt." : "No audit yet."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog: Neues Audit */}
      <Dialog open={newOpen} onOpenChange={o => { if (!o) setNewOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{de ? "Neues Audit anlegen" : "Create new audit"}</DialogTitle>
            <DialogDescription>{de ? "Das neue Audit wird geöffnet; Befunde werden dort dokumentiert." : "The new audit is opened; findings are documented there."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Typ" : "Type"}
              <select value={nTyp} onChange={e => changeTyp(e.target.value as AuditTyp)} className={inputCls}>
                {(Object.keys(AUDIT_TYP_LABEL) as AuditTyp[]).map(t => <option key={t} value={t}>{de ? AUDIT_TYP_LABEL[t].de : AUDIT_TYP_LABEL[t].en}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Titel" : "Title"}
              <input value={nTitel} onChange={e => { setNTitel(e.target.value); setNTitelTouched(true); }} className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Datum" : "Date"}
                <input type="date" value={nDatum} onChange={e => changeDatum(e.target.value)} className={inputCls} />
              </label>
              <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Auditor" : "Auditor"}
                <input value={nAuditor} onChange={e => setNAuditor(e.target.value)} className={inputCls} placeholder={de ? "Name / Organisation" : "Name / organisation"} />
              </label>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>{de ? "Frameworks (aus den aktiven)" : "Frameworks (from the active ones)"}</div>
              {auditableFrameworks.length === 0 ? (
                <div className="text-[11px]">{de ? "Keine aktiven Frameworks mit Kontrollen." : "No active frameworks with controls."}</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {auditableFrameworks.map(fw => {
                    const on = nFws.has(fw);
                    return (
                      <button key={fw} type="button" onClick={() => { const n = new Set(nFws); on ? n.delete(fw) : n.add(fw); setNFws(n); }}
                        className={`text-xs px-2.5 py-1 rounded-full border ${on ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border bg-background text-muted-foreground"}`}>
                        {fwLabel(fw)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setNewOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm">{de ? "Abbrechen" : "Cancel"}</button>
            <button onClick={submitNew} disabled={!nTitel.trim()} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-semibold disabled:opacity-50">{de ? "Anlegen & öffnen" : "Create & open"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Abschließen */}
      <Dialog open={!!closeRec} onOpenChange={o => { if (!o && !closing) setCloseId(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{de ? "Audit abschließen" : "Complete audit"}</DialogTitle>
            <DialogDescription>{closeRec?.titel}</DialogDescription>
          </DialogHeader>
          {closeRec && (
            <div className="space-y-3 text-sm">
              {!closeRec.urteil.trim() ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                  {de ? "Pflicht: Bitte zuerst das Gesamturteil im Audit-Kopf ausfüllen (Audit öffnen → Feld „Gesamturteil“)." : "Required: fill in the overall verdict in the audit header first (open audit → field “Overall verdict”)."}
                </div>
              ) : (
                <div className="rounded-md border border-border bg-muted/30 p-2 text-xs">
                  <span className="text-muted-foreground">{de ? "Gesamturteil" : "Overall verdict"}: </span><b>{closeRec.urteil}</b>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {(() => { const c = countAuditFindings(closeRec); return de
                  ? `Dokumentierte Befunde: ${c.total} (Major ${c.major} · Minor ${c.minor} · erledigt ${c.erledigt}). Danach ist das Audit schreibgeschützt; der Bericht bleibt exportierbar.`
                  : `Documented findings: ${c.total} (major ${c.major} · minor ${c.minor} · resolved ${c.erledigt}). Afterwards the audit is read-only; the report remains exportable.`; })()}
              </div>
              <label className="text-xs text-muted-foreground flex flex-col gap-1">{de ? "Nächstes Audit (Vorschlag: +12 Monate)" : "Next audit (suggested: +12 months)"}
                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className={inputCls} />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={withDeadline} onChange={e => setWithDeadline(e.target.checked)} />
                {de ? "Frist „Nächstes internes Audit“ in der Fristen-Engine anlegen" : "Create deadline “Next internal audit” in the deadline engine"}
              </label>
            </div>
          )}
          <DialogFooter>
            <button onClick={() => setCloseId(null)} disabled={closing} className="rounded-md border border-border px-3 py-1.5 text-sm">{de ? "Abbrechen" : "Cancel"}</button>
            <button onClick={submitClose} disabled={closing || !closeRec || !closeRec.urteil.trim() || !nextDate}
              className="rounded-md st-ja-bg text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
              <CheckCircle2 size={14} />{closing ? (de ? "Schließt…" : "Closing…") : (de ? "Abschließen" : "Complete")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AuditProgramCard;
