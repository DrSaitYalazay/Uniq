/**
 * EvidencePanel — Nachweise an einer Kontrolle (Spec ITEM 04 / ARCHITECTURE §2.3).
 *
 * Zeigt eigene Nachweise + über den Kontroll-Knoten geerbte Nachweise
 * (mit Quell-Badge), eine Frische-Ampel (grün/gelb/rot) und erlaubt das
 * Anhängen per Datei-Upload (Bucket 'evidence'), Link oder Attestation.
 *
 * Rein additiv: das `answers.evidence`-Textfeld (Kurz-Notiz) wird NICHT
 * berührt. Diese Komponente wird in diesem Schritt nur bereitgestellt und
 * (noch) nicht in Seiten eingebunden.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Paperclip,
  Link2,
  ShieldCheck,
  Trash2,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import {
  freshness,
  listEvidenceForControl,
  resolveInheritedEvidence,
  createEvidence,
  uploadEvidenceFile,
  deleteEvidence,
  unlink,
  downloadEvidenceFile,
  type Evidence,
  type EvidenceKind,
  type Freshness,
  type InheritedEvidence,
  type NodeMember,
} from "@/lib/evidenceEngine";

interface Props {
  framework: string;
  controlId: string;
}

type AddMode = "file" | "link" | "attestation" | null;

const FRESH_META: Record<Freshness, { dot: string; label: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  ok: { dot: "st-ja-bg", label: "aktuell", badge: "secondary" },
  expiring: { dot: "st-teilweise-bg", label: "läuft ab", badge: "outline" },
  expired: { dot: "st-nein-bg", label: "abgelaufen", badge: "destructive" },
};

const KIND_LABELS: Record<EvidenceKind, string> = {
  document: "Dokument",
  screenshot: "Screenshot",
  log: "Log",
  ticket: "Ticket",
  attestation: "Attestierung",
  link: "Link",
  other: "Sonstiges",
};

function FreshnessDot({ e }: { e: Evidence }) {
  const f = freshness(e);
  const meta = FRESH_META[f];
  const title = e.valid_until
    ? `${meta.label} — gültig bis ${String(e.valid_until).slice(0, 10)}`
    : "zeitlos (kein Ablauf)";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${e.valid_until ? meta.dot : "bg-muted-foreground/40"}`}
      title={title}
      aria-label={title}
    />
  );
}

export function EvidencePanel({ framework, controlId }: Props) {
  const { tenantId, user } = useAuth();

  const [own, setOwn] = useState<Evidence[]>([]);
  const [inherited, setInherited] = useState<InheritedEvidence[]>([]);
  const [nodeMembers, setNodeMembers] = useState<NodeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState<AddMode>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<EvidenceKind>("document");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [validUntil, setValidUntil] = useState("");

  const resetForm = useCallback(() => {
    setMode(null);
    setTitle("");
    setKind("document");
    setUrl("");
    setFile(null);
    setValidUntil("");
  }, []);

  const reload = useCallback(async () => {
    if (!tenantId) {
      setOwn([]);
      setInherited([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Knoten-Mitglieder einmal laden (für geerbte Nachweise).
      let members = nodeMembers;
      if (members.length === 0) {
        const { data } = await supabase
          .from("control_node_member")
          .select("node_id, framework, control_id");
        members = (data ?? []) as NodeMember[];
        setNodeMembers(members);
      }
      const [ownRows, inheritedRows] = await Promise.all([
        listEvidenceForControl(supabase, tenantId, framework, controlId),
        resolveInheritedEvidence(supabase, framework, controlId, members),
      ]);
      // Bereits direkt verknüpfte Nachweise nicht doppelt als "geerbt" zeigen.
      const ownIds = new Set(ownRows.map((e) => e.id));
      setOwn(ownRows);
      setInherited(inheritedRows.filter((i) => !ownIds.has(i.evidence.id)));
    } catch (err: any) {
      toast.error(`Nachweise laden fehlgeschlagen: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [tenantId, framework, controlId, nodeMembers]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, framework, controlId]);

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (mode === "file") return !!file;
    if (mode === "link") return !!url.trim();
    return mode === "attestation";
  }, [mode, title, file, url]);

  const handleSave = useCallback(async () => {
    if (!tenantId || !canSave || !mode) return;
    setBusy(true);
    try {
      let storagePath: string | null = null;
      let external_url: string | null = null;
      let effectiveKind: EvidenceKind = kind;

      if (mode === "file") {
        storagePath = await uploadEvidenceFile(supabase, tenantId, file as File);
      } else if (mode === "link") {
        external_url = url.trim();
        effectiveKind = "link";
      } else if (mode === "attestation") {
        effectiveKind = "attestation";
      }

      await createEvidence(
        supabase,
        tenantId,
        {
          title: title.trim(),
          kind: effectiveKind,
          storage_path: storagePath,
          external_url,
          valid_until: validUntil ? validUntil : null,
          collected_by: user?.id ?? null,
        },
        { framework, controlId },
      );
      toast.success("Nachweis angehängt ✓");
      resetForm();
      await reload();
    } catch (err: any) {
      toast.error(`Anhängen fehlgeschlagen: ${err?.message ?? String(err)}`);
    } finally {
      setBusy(false);
    }
  }, [tenantId, canSave, mode, kind, file, url, title, validUntil, user, framework, controlId, resetForm, reload]);

  const handleDelete = useCallback(
    async (e: Evidence) => {
      setBusy(true);
      try {
        await deleteEvidence(supabase, e.id);
        toast.success("Nachweis gelöscht");
        await reload();
      } catch (err: any) {
        toast.error(`Löschen fehlgeschlagen: ${err?.message ?? String(err)}`);
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  const handleUnlink = useCallback(
    async (e: Evidence) => {
      setBusy(true);
      try {
        await unlink(supabase, e.id, framework, controlId);
        toast.success("Verknüpfung entfernt");
        await reload();
      } catch (err: any) {
        toast.error(`Entfernen fehlgeschlagen: ${err?.message ?? String(err)}`);
      } finally {
        setBusy(false);
      }
    },
    [framework, controlId, reload],
  );

  const handleOpenFile = useCallback(async (storagePath: string) => {
    let objectUrl: string | null = null;
    try {
      objectUrl = await downloadEvidenceFile(supabase, storagePath);
      window.open(objectUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      toast.error(`Datei öffnen fehlgeschlagen: ${err?.message ?? String(err)}`);
    } finally {
      // Kurz warten, damit der neue Tab die Blob-URL laden konnte, dann freigeben.
      if (objectUrl) {
        const u = objectUrl;
        setTimeout(() => URL.revokeObjectURL(u), 60_000);
      }
    }
  }, []);

  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Nachweise
          {(own.length > 0 || inherited.length > 0) && (
            <Badge variant="secondary" className="ml-1">
              {own.length + inherited.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
          </div>
        ) : (
          <>
            {/* Eigene Nachweise */}
            {own.length === 0 && inherited.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Noch keine Nachweise. Hängen Sie Datei, Link oder Attestierung an.
              </p>
            )}

            {own.length > 0 && (
              <ul className="space-y-2">
                {own.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-3 rounded-md border bg-card p-2.5"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <FreshnessDot e={e} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{e.title}</span>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {KIND_LABELS[e.kind]}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {e.valid_until && <span>gültig bis {String(e.valid_until).slice(0, 10)}</span>}
                          {e.external_url && (
                            <a
                              href={e.external_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" /> Link
                            </a>
                          )}
                          {e.storage_path && (
                            <button
                              type="button"
                              onClick={() => handleOpenFile(e.storage_path as string)}
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <FileText className="h-3 w-3" /> Datei
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => handleUnlink(e)}
                        title="Verknüpfung zu dieser Kontrolle lösen"
                      >
                        Trennen
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        onClick={() => handleDelete(e)}
                        title="Nachweis endgültig löschen"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Geerbte Nachweise (über Kontroll-Knoten) */}
            {inherited.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Geerbte Nachweise
                </p>
                <ul className="space-y-2">
                  {inherited.map((i) => (
                    <li
                      key={`${i.evidence.id}:${i.sourceFramework}:${i.sourceControlId}`}
                      className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-2.5"
                    >
                      <FreshnessDot e={i.evidence} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium">{i.evidence.title}</span>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {KIND_LABELS[i.evidence.kind]}
                          </Badge>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            geerbt · {i.sourceFramework} {i.sourceControlId}
                          </Badge>
                        </div>
                        {i.evidence.valid_until && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            gültig bis {String(i.evidence.valid_until).slice(0, 10)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Anhängen */}
            {mode === null ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setMode("file")}>
                  <Paperclip className="mr-1.5 h-4 w-4" /> Datei
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMode("link")}>
                  <Link2 className="mr-1.5 h-4 w-4" /> Link
                </Button>
                <Button variant="outline" size="sm" onClick={() => setMode("attestation")}>
                  <ShieldCheck className="mr-1.5 h-4 w-4" /> Attestierung
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ev-title" className="text-xs">Titel</Label>
                  <Input
                    id="ev-title"
                    value={title}
                    onChange={(ev) => setTitle(ev.target.value)}
                    placeholder="z. B. Berechtigungskonzept 2026"
                  />
                </div>

                {mode === "file" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ev-file" className="text-xs">Datei (max. 12 MB)</Label>
                    <Input
                      id="ev-file"
                      type="file"
                      onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
                    />
                    <div className="pt-1">
                      <Select value={kind} onValueChange={(v) => setKind(v as EvidenceKind)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Typ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Dokument</SelectItem>
                          <SelectItem value="screenshot">Screenshot</SelectItem>
                          <SelectItem value="log">Log</SelectItem>
                          <SelectItem value="ticket">Ticket</SelectItem>
                          <SelectItem value="other">Sonstiges</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {mode === "link" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="ev-url" className="text-xs">URL</Label>
                    <Input
                      id="ev-url"
                      value={url}
                      onChange={(ev) => setUrl(ev.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                )}

                {mode === "attestation" && (
                  <p className="text-xs text-muted-foreground">
                    Attestierung / Selbsterklärung ohne Datei — z. B. Bestätigung der Leitung.
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="ev-valid" className="text-xs">
                    Gültig bis (optional — leer = zeitlos)
                  </Label>
                  <Input
                    id="ev-valid"
                    type="date"
                    value={validUntil}
                    onChange={(ev) => setValidUntil(ev.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={resetForm} disabled={busy}>
                    Abbrechen
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={!canSave || busy}>
                    {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    Anhängen
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default EvidencePanel;
