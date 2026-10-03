/**
 * OSCAL-Export (ITEM 22)
 *
 * Reine JSON-Serialisierung in OSCAL-1.2-kompatible Strukturen. Deckt drei Modelle ab:
 *   1. Catalog                — Kontroll-Katalog je Framework
 *   2. Control Mapping Model   — control_node + control_mapping (Relationstypen)
 *   3. Assessment Results      — effektive Antworten als Findings (nein/teilweise)
 *
 * WICHTIG:
 *  - KEINE Imports aus DB-/Client-Code. Alle Daten werden als Argumente übergeben.
 *  - Rein funktional, KEINE Seiteneffekte, KEIN Netzwerk, KEIN Datei-I/O.
 *  - Die Verdrahtung (Export-Button in Settings/Assessment, JSON-Download,
 *    Datenbeschaffung aus den Hooks) erfolgt SEPARAT; diese Datei liefert nur
 *    die reine Serialisierung.
 *
 * OSCAL-Referenz: https://pages.nist.gov/OSCAL/ (Modelle Catalog, Mapping, Assessment Results).
 */

const OSCAL_VERSION = "1.2.0";

// ── Hilfsfunktionen ──

/**
 * Deterministische, RFC-4122-ähnliche UUID aus einem Seed-String (FNV-1a).
 * OSCAL verlangt UUIDs; wir leiten sie stabil aus fachlichen Schlüsseln ab, damit
 * wiederholte Exporte derselben Daten identische Dokumente erzeugen (diff-freundlich).
 * KEINE Kryptographie — nur ein stabiler Identifier.
 */
function stableUuid(seed: string): string {
  // 128 bit über vier FNV-1a-Läufe mit unterschiedlichen Präfixen einsammeln.
  const chunk = (salt: string): string => {
    let h = 0x811c9dc5;
    const s = salt + seed;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  };
  const a = chunk("a");
  const b = chunk("b");
  const c = chunk("c");
  const d = chunk("d");
  const hex = (a + b + c + d).slice(0, 32);
  // Version-4- und Variant-Nibbles setzen (rein kosmetisch für Schema-Konformität).
  return (
    hex.slice(0, 8) +
    "-" +
    hex.slice(8, 12) +
    "-4" +
    hex.slice(13, 16) +
    "-8" +
    hex.slice(17, 20) +
    "-" +
    hex.slice(20, 32)
  );
}

/** Aktueller Zeitstempel; als Parameter überschreibbar, damit Tests deterministisch sein können. */
function nowIso(fixed?: string): string {
  return fixed ?? new Date().toISOString();
}

// ── 1. Catalog ──

export interface OscalControlInput {
  id: string;
  title: string;
}

/**
 * Serialisiert einen Framework-Kontrollkatalog in ein OSCAL-1.2-Catalog-JSON.
 * Alle Kontrollen landen in einer Gruppe je Framework (flache, aber gültige Struktur).
 *
 * @param framework  Framework-Kennung (z. B. "ISO27001", "NIS2").
 * @param controls   Liste { id, title }.
 * @param fixedTimestamp  optionaler fester ISO-Timestamp (für reproduzierbare Tests).
 */
export function toOscalCatalog(
  framework: string,
  controls: OscalControlInput[],
  fixedTimestamp?: string,
): object {
  return {
    catalog: {
      uuid: stableUuid("catalog:" + framework),
      metadata: {
        title: `${framework} — Kontrollkatalog`,
        "last-modified": nowIso(fixedTimestamp),
        version: "1.0.0",
        "oscal-version": OSCAL_VERSION,
      },
      groups: [
        {
          id: sanitizeId(framework),
          title: framework,
          controls: controls.map((c) => ({
            id: sanitizeId(`${framework}-${c.id}`),
            title: c.title,
            props: [
              { name: "label", value: c.id },
              { name: "framework", value: framework, ns: "urn:isms:controlmapping" },
            ],
          })),
        },
      ],
    },
  };
}

// ── 2. Control Mapping Model ──

export type SourceRelation =
  | "equal"
  | "subset-of"
  | "superset-of"
  | "intersects-with";

/** OSCAL-Mapping-Relationstyp. `equal` → `equivalent-to`, Rest bleibt namensgleich. */
export type OscalRelation =
  | "equivalent-to"
  | "subset-of"
  | "superset-of"
  | "intersects-with";

export interface ControlMappingInput {
  sourceFramework: string;
  sourceId: string;
  targetKey: string;
  relation: SourceRelation;
}

/**
 * Übersetzt die interne Relations-Semantik (control_mapping / Knoten-Mitgliedschaft)
 * auf die OSCAL-Relationsvokabeln.
 */
function toOscalRelation(rel: SourceRelation): OscalRelation {
  switch (rel) {
    case "equal":
      return "equivalent-to";
    case "subset-of":
      return "subset-of";
    case "superset-of":
      return "superset-of";
    case "intersects-with":
      return "intersects-with";
    default:
      return "intersects-with";
  }
}

/**
 * Serialisiert Kontroll-Mappings in ein OSCAL-Control-Mapping-Model-JSON.
 * Jede Zeile wird zu einem Map-Eintrag mit einem Source- und einem Target-Endpunkt.
 *
 * @param mappings         Liste der gerichteten Mappings.
 * @param fixedTimestamp   optionaler fester ISO-Timestamp (für reproduzierbare Tests).
 */
export function toOscalControlMapping(
  mappings: ControlMappingInput[],
  fixedTimestamp?: string,
): object {
  return {
    "mapping-collection": {
      uuid: stableUuid("mapping-collection"),
      metadata: {
        title: "ISMS — Control Mapping",
        "last-modified": nowIso(fixedTimestamp),
        version: "1.0.0",
        "oscal-version": OSCAL_VERSION,
      },
      mappings: [
        {
          uuid: stableUuid("mapping"),
          source: { type: "catalog", href: "#source-catalog" },
          target: { type: "catalog", href: "#target-catalog" },
          maps: mappings.map((m, i) => ({
            uuid: stableUuid(
              `map:${m.sourceFramework}:${m.sourceId}:${m.targetKey}:${i}`,
            ),
            relationship: toOscalRelation(m.relation),
            sources: [
              {
                "type": "control",
                "id-ref": sanitizeId(`${m.sourceFramework}-${m.sourceId}`),
              },
            ],
            targets: [
              {
                "type": "control",
                "id-ref": sanitizeId(m.targetKey),
              },
            ],
          })),
        },
      ],
    },
  };
}

// ── 3. Assessment Results ──

export type FindingStatus = "ja" | "teilweise" | "nein" | "na";

export interface AssessmentFindingInput {
  framework: string;
  controlId: string;
  status: FindingStatus;
}

/**
 * Serialisiert effektive Antworten in ein OSCAL-Assessment-Results-JSON.
 * Es werden NUR Findings für offene/teil-offene Kontrollen erzeugt (nein/teilweise);
 * "ja" und "na" gelten als konform bzw. nicht anwendbar und liefern kein Finding.
 *
 * @param findings         Liste der effektiven Antworten.
 * @param fixedTimestamp   optionaler fester ISO-Timestamp (für reproduzierbare Tests).
 */
export function toOscalAssessmentResults(
  findings: AssessmentFindingInput[],
  fixedTimestamp?: string,
): object {
  const ts = nowIso(fixedTimestamp);
  const relevant = findings.filter(
    (f) => f.status === "nein" || f.status === "teilweise",
  );

  return {
    "assessment-results": {
      uuid: stableUuid("assessment-results"),
      metadata: {
        title: "ISMS — Assessment Results",
        "last-modified": ts,
        version: "1.0.0",
        "oscal-version": OSCAL_VERSION,
      },
      "import-ap": { href: "#assessment-plan" },
      results: [
        {
          uuid: stableUuid("result"),
          title: "Kontroll-Bewertung",
          description: "Abgeleitete Findings aus effektiven Antworten (nein/teilweise).",
          start: ts,
          findings: relevant.map((f) => ({
            uuid: stableUuid(`finding:${f.framework}:${f.controlId}`),
            title: `${f.framework} ${f.controlId}: ${f.status}`,
            target: {
              type: "objective-id",
              "target-id": sanitizeId(`${f.framework}-${f.controlId}`),
              status: {
                state: "not-satisfied",
                reason: f.status === "teilweise" ? "partial" : "not-implemented",
              },
            },
            props: [
              { name: "framework", value: f.framework, ns: "urn:isms:controlmapping" },
              { name: "answer", value: f.status, ns: "urn:isms:controlmapping" },
            ],
          })),
        },
      ],
    },
  };
}

// ── gemeinsame Hilfe ──

/**
 * Normalisiert einen fachlichen Schlüssel zu einem OSCAL-tauglichen Token-Id
 * (NCName-ähnlich): erlaubt Buchstaben/Ziffern/Punkt/Bindestrich/Unterstrich,
 * ersetzt alles andere durch "-".
 */
function sanitizeId(raw: string): string {
  const s = raw.trim().replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return s.length > 0 ? s : "x";
}
