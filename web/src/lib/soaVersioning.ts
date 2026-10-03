/**
 * soaVersioning — SoA-Versionsstände mit Datum/Freigabe (J1).
 *
 * ISO-27001-Auditoren verlangen eine nachvollziehbare Historie der
 * Anwendbarkeitserklärung: welche Version wurde WANN von WEM freigegeben und
 * mit welchem Stand (anwendbar / N/A je Kontrolle + Begründung).
 *
 * Speicherung org-scoped in `org_tool_data` unter tool_key "soa-versions" als
 * append-only Array. Rein additiv — verändert keine bestehende SoA-Logik.
 */

export interface SoAVersionSnapshotControl {
  framework: string;
  controlId: string;
  applicable: boolean;
  justification: string;
}

export interface SoAVersion {
  /** Fortlaufende Versionsnummer (1, 2, 3 …). */
  version: number;
  /** ISO-Zeitstempel der Freigabe. */
  created_at: string;
  /** Anzeigename/E-Mail der freigebenden Person (optional). */
  approved_by?: string | null;
  /** Freitext-Notiz zur Version (z. B. „Erstfreigabe vor Audit"). */
  note?: string;
  /** Kennzahlen zum Zeitpunkt der Freigabe. */
  stats: { total: number; applicable: number; notApplicable: number; missingJustification: number };
  /** Kompakter Stand je Kontrolle (für Diff/Audit-Nachweis). */
  controls: SoAVersionSnapshotControl[];
}

type DataClient = {
  from: (t: string) => any;
};

const TABLE = "org_tool_data";
const KEY = "soa-versions";

/** Alle gespeicherten SoA-Versionen (aufsteigend nach version). */
export async function listSoAVersions(client: DataClient, tenantId: string): Promise<SoAVersion[]> {
  const { data, error } = await client
    .from(TABLE)
    .select("data")
    .eq("tenant_id", tenantId)
    .eq("tool_key", KEY)
    .maybeSingle();
  if (error) throw new Error(error.message || "listSoAVersions failed");
  const arr = (data?.data?.versions ?? []) as SoAVersion[];
  return Array.isArray(arr) ? arr.slice().sort((a, b) => a.version - b.version) : [];
}

/**
 * Friert den aktuellen SoA-Stand als neue Version ein (Version = max+1).
 * Idempotent im Sinne der PK (tenant_id, tool_key): das Array wird ersetzt.
 */
export async function saveSoAVersion(
  client: DataClient,
  tenantId: string,
  snapshot: { stats: SoAVersion["stats"]; controls: SoAVersionSnapshotControl[]; note?: string; approved_by?: string | null },
): Promise<SoAVersion> {
  const existing = await listSoAVersions(client, tenantId);
  const nextNo = existing.reduce((m, v) => Math.max(m, v.version), 0) + 1;
  const version: SoAVersion = {
    version: nextNo,
    created_at: new Date().toISOString(),
    approved_by: snapshot.approved_by ?? null,
    note: snapshot.note?.trim() || undefined,
    stats: snapshot.stats,
    controls: snapshot.controls,
  };
  const versions = [...existing, version];
  const { error } = await client
    .from(TABLE)
    .upsert({ tenant_id: tenantId, tool_key: KEY, data: { versions }, updated_at: new Date().toISOString() },
            { onConflict: "tenant_id,tool_key" });
  if (error) throw new Error(error.message || "saveSoAVersion failed");
  return version;
}
