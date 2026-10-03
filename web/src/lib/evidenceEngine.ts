/**
 * evidenceEngine — Nachweis-Modell (Spec ITEM 04 / ARCHITECTURE §2.3).
 *
 * Prüffester Nachweis mit Typ, Gültigkeit (Frische) und Datei/Link, plus
 * Wiederverwendung über Kontroll-Knoten ("prove once"): hängt ein Nachweis an
 * einer Kontrolle, gilt er automatisch als geerbter Nachweis für alle
 * Ko-Mitglieder desselben Knotens (control_node_member).
 *
 * Additiv — das bestehende `answers.evidence`-Textfeld (Kurz-Notiz) bleibt
 * unberührt. Alle DB-Zugriffe laufen über das vorhandene Client-Muster
 * (`@/integrations/supabase/client`): `client.from(table)…`,
 * `client.storage.from(bucket)…`. RLS scoped bereits nach tenant.
 */

import { supabase } from "@/integrations/supabase/client";

/** Der App-weite Datenbank-/Storage-Client (Supabase-Drop-in über cy-api). */
export type EvidenceClient = typeof supabase;

export type EvidenceKind =
  | "document"
  | "screenshot"
  | "log"
  | "ticket"
  | "attestation"
  | "link"
  | "other";

/** Zeile der Tabelle `public.evidence`. */
export interface Evidence {
  id: string;
  tenant_id: string;
  title: string;
  kind: EvidenceKind;
  /** Pfad im Storage-Bucket 'evidence' (`<tenant_id>/<uuid>-<name>`) oder null. */
  storage_path: string | null;
  external_url: string | null;
  description: string | null;
  /** ISO-Timestamp der Erhebung. */
  collected_at: string;
  /** date (YYYY-MM-DD) — Frische; NULL = zeitlos. */
  valid_until: string | null;
  collected_by: string | null;
  created_at: string;
}

/** Zeile der n:m-Verknüpfungstabelle `public.answer_evidence`. */
export interface AnswerEvidenceLink {
  evidence_id: string;
  tenant_id: string;
  framework: string;
  control_id: string;
}

/** Eingabe zum Anlegen eines Nachweises (id/tenant/timestamps setzt die DB). */
export interface EvidenceInput {
  title: string;
  kind: EvidenceKind;
  storage_path?: string | null;
  external_url?: string | null;
  description?: string | null;
  /** YYYY-MM-DD oder null (zeitlos). */
  valid_until?: string | null;
  collected_by?: string | null;
}

/** Kontroll-Knoten-Mitglied, wie von useAssessment geladen. */
export interface NodeMember {
  node_id: string;
  framework: string;
  control_id: string;
}

/** Ein über den Knoten geerbter Nachweis inkl. Quell-Kontrolle (für Badge). */
export interface InheritedEvidence {
  evidence: Evidence;
  sourceFramework: string;
  sourceControlId: string;
  nodeId: string;
}

export type Freshness = "ok" | "expiring" | "expired";

/** Frische-Ampel: NULL valid_until = 'ok' (zeitlos). */
export const FRESHNESS_WINDOW_DAYS = 30;

/** Maximale Dateigröße für Evidence-Uploads (12 MB, vgl. company-logos). */
export const MAX_EVIDENCE_BYTES = 12 * 1024 * 1024;

/** Bucket-Name im /storage-Dienst. */
export const EVIDENCE_BUCKET = "evidence";

const pairKey = (framework: string, controlId: string) => `${framework}::${controlId}`;

/**
 * Frische-Ampel eines Nachweises.
 * - abgelaufen (`expired`): valid_until < heute
 * - läuft ab (`expiring`): valid_until < heute + 30 Tage
 * - aktuell (`ok`): sonst; NULL valid_until = 'ok' (zeitlos)
 */
export function freshness(e: Evidence, now: Date = new Date()): Freshness {
  if (!e.valid_until) return "ok";
  // Tages-genau vergleichen (valid_until ist ein date).
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parts = String(e.valid_until).slice(0, 10).split("-");
  const due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (due.getTime() < today.getTime()) return "expired";
  const window = new Date(today);
  window.setDate(window.getDate() + FRESHNESS_WINDOW_DAYS);
  if (due.getTime() < window.getTime()) return "expiring";
  return "ok";
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/** Eigene Nachweise, die direkt an (framework, controlId) hängen. */
export async function listEvidenceForControl(
  client: EvidenceClient,
  tenantId: string,
  framework: string,
  controlId: string,
): Promise<Evidence[]> {
  const { data: links, error } = await client
    .from("answer_evidence")
    .select("evidence_id")
    .eq("tenant_id", tenantId)
    .eq("framework", framework)
    .eq("control_id", controlId);
  if (error) throw error;
  const ids = Array.from(new Set((links ?? []).map((l: any) => l.evidence_id as string)));
  if (ids.length === 0) return [];
  const { data: rows, error: e2 } = await client
    .from("evidence")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", ids)
    .order("collected_at", { ascending: false });
  if (e2) throw e2;
  return (rows ?? []) as Evidence[];
}

/**
 * Legt einen Nachweis an und verknüpft ihn optional direkt mit einer Kontrolle.
 * Gibt die erzeugte Evidence-Zeile zurück.
 */
export async function createEvidence(
  client: EvidenceClient,
  tenantId: string,
  input: EvidenceInput,
  link?: { framework: string; controlId: string },
): Promise<Evidence> {
  const payload = {
    tenant_id: tenantId,
    title: input.title,
    kind: input.kind,
    storage_path: input.storage_path ?? null,
    external_url: input.external_url ?? null,
    description: input.description ?? null,
    valid_until: input.valid_until ?? null,
    collected_by: input.collected_by ?? null,
  };
  const { data, error } = await client
    .from("evidence")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  const created = data as Evidence;
  if (link) {
    const { error: e2 } = await client.from("answer_evidence").insert({
      evidence_id: created.id,
      tenant_id: tenantId,
      framework: link.framework,
      control_id: link.controlId,
    });
    if (e2) throw e2;
  }
  return created;
}

/**
 * Lädt eine Datei in den 'evidence'-Bucket (Pfad `<tenant_id>/<uuid>-<name>`)
 * und liefert den Storage-Pfad zurück. Wirft bei > 12 MB.
 */
export async function uploadEvidenceFile(
  client: EvidenceClient,
  tenantId: string,
  file: File,
): Promise<string> {
  if (!tenantId) throw new Error("missing tenantId");
  if (file.size > MAX_EVIDENCE_BYTES) {
    throw new Error("Datei zu groß (max. 12 MB) / File too large (max. 12 MB)");
  }
  const uuid =
    typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeName = (file.name || "datei").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `${tenantId}/${uuid}-${safeName}`;
  const { error } = await client.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

/**
 * Lädt eine Nachweis-Datei authentifiziert aus dem (privaten) 'evidence'-Bucket
 * und liefert eine kurzlebige Object-URL (`URL.createObjectURL`) zum Öffnen.
 *
 * Der Bucket ist privat (RLS-gated); ein plain `<a href getPublicUrl>` scheitert,
 * weil der Browser bei `<a>`-Navigation keinen `Authorization`-Header sendet.
 * Der Storage-Shim `download()` geht dagegen über `apiFetch` und hängt den
 * Bearer-Token an. Der Aufrufer MUSS die zurückgegebene URL nach Gebrauch mit
 * `URL.revokeObjectURL` wieder freigeben.
 */
export async function downloadEvidenceFile(
  client: EvidenceClient,
  storagePath: string,
): Promise<string> {
  const { data, error } = await client.storage.from(EVIDENCE_BUCKET).download(storagePath);
  if (error) throw new Error((error as any)?.message ?? "Download fehlgeschlagen");
  if (!data) throw new Error("Leere Antwort beim Download");
  return URL.createObjectURL(data as Blob);
}

/** Verknüpft einen bestehenden Nachweis mit einer weiteren Kontrolle. */
export async function linkEvidence(
  client: EvidenceClient,
  evidenceId: string,
  framework: string,
  controlId: string,
): Promise<void> {
  // tenant_id (NOT NULL) aus der Evidence ableiten → Signatur bleibt schlank.
  const { data: ev, error } = await client
    .from("evidence")
    .select("tenant_id")
    .eq("id", evidenceId)
    .single();
  if (error) throw error;
  const { error: e2 } = await client.from("answer_evidence").insert({
    evidence_id: evidenceId,
    tenant_id: (ev as any).tenant_id,
    framework,
    control_id: controlId,
  });
  if (e2) throw e2;
}

/** Löst die Verknüpfung eines Nachweises von genau einer Kontrolle. */
export async function unlink(
  client: EvidenceClient,
  evidenceId: string,
  framework: string,
  controlId: string,
): Promise<void> {
  const { error } = await client
    .from("answer_evidence")
    .delete()
    .eq("evidence_id", evidenceId)
    .eq("framework", framework)
    .eq("control_id", controlId);
  if (error) throw error;
}

/**
 * Löscht einen Nachweis vollständig (Datei im Bucket + Zeile; answer_evidence
 * kaskadiert via FK ON DELETE CASCADE).
 */
export async function deleteEvidence(
  client: EvidenceClient,
  evidenceId: string,
): Promise<void> {
  const { data: ev } = await client
    .from("evidence")
    .select("storage_path")
    .eq("id", evidenceId)
    .maybeSingle();
  const storagePath = (ev as any)?.storage_path as string | null | undefined;
  if (storagePath) {
    try {
      await client.storage.from(EVIDENCE_BUCKET).remove([storagePath]);
    } catch {
      // best-effort — Zeile wird trotzdem gelöscht
    }
  }
  const { error } = await client.from("evidence").delete().eq("id", evidenceId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Knoten-Reuse ("geerbter Nachweis")
// ---------------------------------------------------------------------------

/**
 * Liefert Nachweise von Ko-Mitgliedern DESSELBEN Kontroll-Knotens wie
 * (framework, controlId) — für die "geerbter Nachweis"-Anzeige. Jeder Eintrag
 * trägt seine Quell-Kontrolle (framework/control_id + node_id) mit.
 *
 * RLS scoped die Abfragen bereits auf den Tenant, daher kein tenant-Filter
 * nötig. `nodeMembers` ist die von useAssessment geladene Mitglieder-Liste.
 */
export async function resolveInheritedEvidence(
  client: EvidenceClient,
  framework: string,
  controlId: string,
  nodeMembers: NodeMember[],
): Promise<InheritedEvidence[]> {
  // Knoten, denen (framework, controlId) angehört.
  const myNodeIds = new Set(
    nodeMembers
      .filter((m) => m.framework === framework && m.control_id === controlId)
      .map((m) => m.node_id),
  );
  if (myNodeIds.size === 0) return [];

  // Ko-Mitglieder (Self ausgeschlossen).
  const coMembers = nodeMembers.filter(
    (m) =>
      myNodeIds.has(m.node_id) &&
      !(m.framework === framework && m.control_id === controlId),
  );
  if (coMembers.length === 0) return [];

  const coByKey = new Map<string, NodeMember>();
  for (const m of coMembers) coByKey.set(pairKey(m.framework, m.control_id), m);

  const frameworks = Array.from(new Set(coMembers.map((m) => m.framework)));
  const controlIds = Array.from(new Set(coMembers.map((m) => m.control_id)));

  const { data: links, error } = await client
    .from("answer_evidence")
    .select("evidence_id, framework, control_id")
    .in("framework", frameworks)
    .in("control_id", controlIds);
  if (error) throw error;

  // Nur exakte (framework, control_id)-Paare der Ko-Mitglieder behalten.
  const relevant = (links ?? []).filter((l: any) =>
    coByKey.has(pairKey(l.framework, l.control_id)),
  );
  if (relevant.length === 0) return [];

  const ids = Array.from(new Set(relevant.map((l: any) => l.evidence_id as string)));
  const { data: rows, error: e2 } = await client
    .from("evidence")
    .select("*")
    .in("id", ids);
  if (e2) throw e2;

  const byId = new Map<string, Evidence>();
  for (const r of (rows ?? []) as Evidence[]) byId.set(r.id, r);

  const out: InheritedEvidence[] = [];
  for (const l of relevant as any[]) {
    const ev = byId.get(l.evidence_id);
    if (!ev) continue;
    const src = coByKey.get(pairKey(l.framework, l.control_id));
    if (!src) continue;
    out.push({
      evidence: ev,
      sourceFramework: l.framework,
      sourceControlId: l.control_id,
      nodeId: src.node_id,
    });
  }
  return out;
}
