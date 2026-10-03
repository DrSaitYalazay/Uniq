/**
 * Unified Control Catalogue v7 — Themen T01–T18.
 *
 * Der Katalog (ISO 27001 318 / NIS2 268) trägt seine Gruppierung in
 * `meta.topic` (T01…T18) und `meta.subgroup` ("I-ACC · Identity and access
 * control"). Vor dieser Datei las die Gruppierungslogik `meta.family` bzw.
 * `meta.thema` — Felder, die der v7-Seed gar nicht schreibt. Folge: ALLE
 * Controls landeten im Sammel-Bucket "{Framework} · spezifisch"
 * ("Ø über 1 Familien", "Schwächste Kategorie = ISO27001 · spezifisch",
 * Radar "Zu wenige Domänen").
 *
 * Einzige Quelle der Wahrheit für Themen-Titel. Reihenfolge = Katalogreihenfolge
 * (Geltungsbereich → Governance → … → Wirksamkeit), nicht alphabetisch.
 */

export type TopicLabel = { de: string; en: string };

export const CATALOG_TOPIC_LABELS: Record<string, TopicLabel> = {
  T01: { de: "Geltungsbereich, Registrierung & Domänendaten", en: "Scope, registration & domain data" },
  T02: { de: "Governance & Management-Verantwortung",         en: "Governance & management responsibility" },
  T03: { de: "Risikomanagement & Sicherheitsrichtlinien",     en: "Risk management & security policies" },
  T04: { de: "Assets, Klassifizierung & Informationsschutz",  en: "Assets, classification & information handling" },
  T05: { de: "Personalsicherheit",                            en: "Personnel security" },
  T06: { de: "Awareness & Schulung",                          en: "Awareness & training" },
  T07: { de: "Identitäten, Zugriff & Authentisierung",        en: "Identity, access & authentication" },
  T08: { de: "Netz- & Systemhygiene",                         en: "Network & system hygiene" },
  T09: { de: "Kryptografie & sichere Kommunikation",          en: "Cryptography & secure communications" },
  T10: { de: "Beschaffung, Entwicklung & Änderungen",         en: "Acquisition, development & change" },
  T11: { de: "Schwachstellen- & Patch-Management",            en: "Vulnerability & patch management" },
  T12: { de: "Protokollierung & Detektion",                   en: "Logging & detection" },
  T13: { de: "Vorfallbehandlung",                             en: "Incident response" },
  T14: { de: "Meldepflichten & Informationsaustausch",        en: "Reporting duties & information sharing" },
  T15: { de: "Business Continuity & Wiederherstellung",       en: "Business continuity & recovery" },
  T16: { de: "Lieferkette & Dienstleister",                   en: "Supply chain & suppliers" },
  T17: { de: "Physische & umgebungsbezogene Sicherheit",      en: "Physical & environmental security" },
  T18: { de: "Wirksamkeit, Verbesserung & Aufsicht",          en: "Effectiveness, improvement & supervision" },
};

/** Reihenfolge für Achsen/Akkordeon — Katalogreihenfolge, nicht alphabetisch. */
export const CATALOG_TOPIC_ORDER: string[] = Object.keys(CATALOG_TOPIC_LABELS);

/** true, wenn der String eine Katalog-Themen-ID ist ("T07"). */
export function isCatalogTopic(v: unknown): v is string {
  return typeof v === "string" && /^T\d{2}$/.test(v) && v in CATALOG_TOPIC_LABELS;
}

/** Sortierschlüssel; unbekannte Themen hinten. */
export function catalogTopicSortKey(topic: string): number {
  const i = CATALOG_TOPIC_ORDER.indexOf(topic);
  return i < 0 ? 999 : i;
}

/** Langtitel eines Themas ohne Code, z. B. "Identitäten, Zugriff & Authentisierung". */
export function catalogTopicTitle(topic: string, de: boolean = true): string | null {
  const l = CATALOG_TOPIC_LABELS[topic];
  if (!l) return null;
  return de ? l.de : l.en;
}

/** Anzeigeform mit Code, z. B. "T07 · Identitäten, Zugriff & Authentisierung". */
export function catalogTopicLabel(topic: string, de: boolean = true): string {
  const t = catalogTopicTitle(topic, de);
  return t ? `${topic} · ${t}` : topic;
}

/**
 * Untergruppen-Titel aus `meta.subgroup`. Der Katalog speichert
 * "I-ACC · Identity and access control" — der Code vorn ist intern, der
 * Manager liest nur den Klartext.
 *
 * `subgroupDe` ist der deutsche Wert aus `meta.subgroup_de`, den der
 * Deutsch-Seed (nis2_iso_deutsch.sql) für NIS2 und ISO 27001 mitliefert.
 * Ohne ihn gab der deutsche Modus die englische Untergruppe aus: die
 * Sonderbehandlung unten griff nur für "ISO-specific outcome", alle anderen
 * Werte wurden unübersetzt durchgereicht ("Identity and access control").
 * Fehlt der deutsche Wert — alle übrigen Kataloge führen ihn nicht —, bleibt
 * es beim bisherigen Verhalten.
 */
export function catalogSubgroupTitle(
  subgroup: unknown,
  de: boolean = true,
  subgroupDe?: unknown,
): string | null {
  if (de && typeof subgroupDe === "string" && subgroupDe.trim()) {
    const rawDe = subgroupDe.trim();
    const sepDe = rawDe.indexOf(" · ");
    return sepDe > 0 ? rawDe.slice(sepDe + 3) : rawDe;
  }
  if (typeof subgroup !== "string" || !subgroup.trim()) return null;
  const raw = subgroup.trim();
  if (raw === "ISO-specific outcome") {
    return de ? "ISO-spezifische Anforderung" : "ISO-specific outcome";
  }
  const sep = raw.indexOf(" · ");
  return sep > 0 ? raw.slice(sep + 3) : raw;
}
