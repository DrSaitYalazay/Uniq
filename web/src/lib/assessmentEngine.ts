/**
 * assessmentEngine — pure helpers for Phase 3 (Bewertung / Gap Analysis).
 *
 * Framework-neutral: Kontrollen sind über Kontroll-Knoten (control_node, same-as)
 * verknüpft — KEIN Framework ist Hub. Eine Antwort wird direkt gegen ihr eigenes
 * Framework gespeichert; hat eine Kontrolle keine eigene Antwort, projizieren wir
 * über den gemeinsamen Knoten-Anker (node_id) die Antworten inhaltsgleicher
 * Kontrollen. control_iso dient nur als Fallback-Anker für Kontrollen, die noch
 * in keinem strikten Knoten sind. Weakest link wins: nein < teilweise < ja.
 * `na` ist frameworkspezifisch und wird NICHT über Knoten geerbt.
 */

import {
  catalogSubgroupTitle,
  catalogTopicLabel,
  isCatalogTopic,
} from "@/data/catalogTopics";
import { annexFamilyLabel, isoRefsAll } from "@/data/isoAnnexMap";

export type AnswerStatus = "ja" | "teilweise" | "nein" | "na";
export type Reifegrad = 0 | 1 | 2 | 3 | 4 | 5;

export interface ControlRow {
  id: string;
  framework: string;
  sub_sector: string | null;
  req_de: string | null;
  req_en: string | null;
  muss: string | null;
  tags: string[] | null;
  meta: Record<string, unknown> | null;
  /** Aufwand in Personentagen (Umsetzung/Roadmap — EINE Quelle für PT). */
  effort_pt?: number | null;
}

export interface AnswerRow {
  framework: string;
  control_id: string;
  antwort: AnswerStatus | null;
  reifegrad?: Reifegrad | null;
  evidence: string | null;
  note: string | null;
  updated_at?: string;
  /** null = organization-scope answer; uuid = per-asset override */
  asset_id?: string | null;
  /**
   * Y7 · Abweichungsgrad des Befunds — GETRENNT von der Risikopriorität.
   * `severity_source: "vorschlag"` = Katalogvorschlag (meta.default_absent /
   * meta.default_partial), noch nicht bestätigt; `"pruefer"` = bestätigt oder
   * überschrieben, dann ist `severity_note` Pflicht (DB-CHECK).
   */
  severity?: Severity | null;
  severity_source?: SeveritySource | null;
  severity_note?: string | null;
}

/** Abweichungsgrad eines Auditbefunds. „keine" = Mangel ohne Normabweichung. */
export type Severity = "major" | "minor" | "keine";
/** Herkunft des Abweichungsgrads: Katalogvorschlag oder Prüferentscheid. */
export type SeveritySource = "vorschlag" | "pruefer";

export interface IsoMapping {
  framework: string;
  control_id: string;
  iso_id: string;
}

/**
 * Relationstyp einer Kontrolle zu ihrem Anker (STRM / OSCAL Control Mapping Model).
 * Knoten-Mitgliedschaft und control_iso-Fallback bedeuten immer `equal` (volle Vererbung).
 * `subset-of`/`intersects-with` decken die Quelle nur teilweise ab → Projektion deckelt "ja" → "teilweise".
 * `superset-of` (Anker umfasst die Quelle ganz) vererbt voll.
 */
export type ControlRelation = "equal" | "subset-of" | "superset-of" | "intersects-with";

/**
 * Projektions-Modus (E4). Default `'lww'` ⇒ byte-identisch zum Bestandsverhalten
 * (Last-Write-Wins). `'weighted'` gewichtet jeden Anker-Kandidaten mit einer
 * Konfidenz (rel_base × strength × source × decay) und wählt den glaubwürdigsten
 * statt den neuesten Kandidaten. Opt-in, additiv.
 */
export type ProjectionMode = "lww" | "weighted";

/**
 * Konflikt-Signal (E4.3): zwei glaubwürdige Anker (conf ≥ 0.6) widersprechen sich
 * hart (Status-Rang-Differenz ≥ 2 — also ja vs nein). Deterministisch aus den
 * Antworten ableitbar, KEINE neue Tabelle. `resolution` nennt den Modus, mit dem
 * der angezeigte Gewinner bestimmt wurde.
 */
export interface ProjectionConflict {
  anchors: { anchorId: string; framework: string; status: AnswerStatus; conf: number }[];
  resolution: ProjectionMode;
}

export interface AnchorRef {
  anchorId: string;
  relation: ControlRelation;
  /** control_mapping.strength (0..10). Fehlt ⇒ 10 (conf-neutral). Nur im `weighted`-Modus wirksam. */
  strength?: number;
  /** control_mapping.source (curated | tfidf_opus | import). Fehlt ⇒ 'curated' (conf-neutral). Nur `weighted`. */
  source?: string;
}

export interface EffectiveAnswer {
  status: AnswerStatus | null;
  reifegrad: Reifegrad | null;
  origin: "explicit" | "inherited" | "empty";
  inheritedFrom?: string[]; // anchor ids used for projection (Anzeige/Reports, unverändert)
  /** Qualität einer geerbten Projektion: "full" (equal/superset) oder "partial" (subset/intersects). */
  projectionQuality?: "full" | "partial";
  /** Herkunft der wirksamen (geerbten) Antwort inkl. Relationstyp — für Tooltips/Audit. */
  inheritedVia?: { anchorId: string; relation: ControlRelation }[];
  /** Konfidenz-Score des Gewinners (nur `weighted`-Modus gesetzt). */
  confidence?: number;
  /** Konflikt zwischen glaubwürdigen Ankern (nur `weighted`-Modus, E4.3). */
  conflict?: ProjectionConflict;
  /**
   * Y8 · Deckungsprüfung offen.
   *
   * Ein „ja" aus einem ANDEREN Framework wurde übernommen, ohne dass
   * Geltungsbereich, Bewertungszeitraum und Nachweisdeckung für dieses
   * Framework bestätigt sind. Der Status ist dann auf „teilweise" gedeckelt —
   * eine schmalere NIS2-Prüfung deckt nur den passenden Teil eines ISO-Umfangs
   * (Katalogvertrag `scope`). `scopeReviewFrom` nennt die Herkunft.
   */
  scopeReviewPending?: boolean;
  scopeReviewFrom?: { framework: string; controlId: string; status: AnswerStatus };
  note: string | null;
  evidence: string | null;
}

/**
 * Y8 · Auflösung der Deckungsentscheidung.
 *
 * `"voll"` = geprüft und deckungsgleich → das geerbte „ja" gilt voll.
 * `"teilweise"` = nur ein Teil des Umfangs ist gedeckt → „teilweise".
 * `"offen"` / kein Eintrag = noch nicht geprüft → ebenfalls „teilweise",
 * zusätzlich als offener Prüfpunkt markiert.
 */
export type CoverageDecision = "voll" | "teilweise" | "offen";
export type CoverageResolver = (framework: string, controlId: string) => CoverageDecision;

/** Maturity labels (CMMI/VDA-ISA-inspired). Applied only to frameworks with uses_maturity=true. */
export const REIFEGRAD_LABELS: Record<Reifegrad, { de: string; en: string; hint: string }> = {
  0: { de: "0 – Unvollständig",  en: "0 – Incomplete",  hint: "Nicht umgesetzt / kein Prozess" },
  1: { de: "1 – Ad hoc",         en: "1 – Performed",   hint: "Ergebnis erreicht, aber nicht wiederholbar" },
  2: { de: "2 – Gesteuert",      en: "2 – Managed",     hint: "Geplant, überwacht, dokumentiert" },
  3: { de: "3 – Etabliert",      en: "3 – Established", hint: "Standardisiert, unternehmensweit definiert" },
  4: { de: "4 – Vorhersagbar",   en: "4 – Predictable", hint: "Quantitativ gemessen und gesteuert" },
  5: { de: "5 – Optimierend",    en: "5 – Optimizing",  hint: "Kontinuierlich verbessert (KVP)" },
};


const STATUS_RANK: Record<AnswerStatus, number> = { nein: 0, teilweise: 1, ja: 2, na: 3 };

/** Weakest link across a set of statuses, ignoring `na`. */
export function worstStatus(statuses: AnswerStatus[]): AnswerStatus | null {
  const eligible = statuses.filter((s) => s !== "na");
  if (eligible.length === 0) return null;
  return eligible.reduce((acc, s) => (STATUS_RANK[s] < STATUS_RANK[acc] ? s : acc));
}

/**
 * Compute effective answer for a control — WEAKEST-LINK (strengster Status gewinnt).
 *
 * Quellen-agnostisch, aber NICHT zeitbasiert: über alle Kontrollen, die denselben
 * framework-neutralen Knoten (control_node_member, same-as) teilen, gewinnt der
 * STRENGSTE Status (nein < teilweise < ja). Ein späteres „ja" auf einer Schwester-
 * Kontrolle verdeckt ein bestehendes „nein" also NICHT — konsistent zur UI-Aussage
 * „Weakest-Link-Prinzip". `na` ist frameworkspezifisch und wird weder vererbt noch
 * überschrieben. Bei Gleichstand bleibt die eigene Antwort (origin „explicit").
 * Eine Kontrolle ohne Knoten ⇒ unabhängig (nur eigene Antwort).
 *
 * (Früher Last-Write-Wins: `worstStatus`/`STATUS_RANK` existierten, wurden aber nie
 *  aufgerufen; das widersprach der UI-Doktrin und konnte ein „nein" durch ein
 *  späteres „ja" verstecken. Behoben 2026-09-03, CHG-07.)
 */
export function projectAnswer(
  control: ControlRow,
  spokeAnswer: AnswerRow | undefined,
  // Wert je Anker: strengster je Framework (Array) ODER Einzel-Row (Legacy/Asset-Map).
  isoAnswerByControl: Map<string, AnswerRow | AnswerRow[]>,
  isoAnchorsBySpokeControl: Map<string, AnchorRef[]>,
  opts?: { mode?: ProjectionMode; now?: number; coverage?: CoverageResolver },
): EffectiveAnswer {
  // E4: opt-in Konfidenz-Modus. Default 'lww' fällt in den unveränderten
  // Bestandspfad unten durch → byte-identisch zum heutigen Verhalten (B-KERN).
  if (opts?.mode === "weighted") {
    return projectAnswerWeighted(control, spokeAnswer, isoAnswerByControl, isoAnchorsBySpokeControl, opts.now, opts.coverage);
  }

  // Eigene „na" ist eine bewusste per-Kontroll-Aussage („für dieses Framework nicht
  // anwendbar") und wird NICHT durch Knoten-Geschwister überschrieben (weder von
  // strengeren noch von späteren Antworten).
  if (spokeAnswer?.antwort === "na") {
    return {
      status: "na",
      reifegrad: (spokeAnswer.reifegrad ?? null) as Reifegrad | null,
      origin: "explicit",
      note: spokeAnswer.note ?? null,
      evidence: spokeAnswer.evidence ?? null,
    };
  }

  // Rang für Weakest-Link: nein(0) < teilweise(1) < ja(2); „na"/leer zählt nicht.
  const rank = (r?: AnswerRow) => (r?.antwort && r.antwort !== "na") ? STATUS_RANK[r.antwort] : 99;

  // Kandidat 1: eigene direkte Antwort dieser Kontrolle.
  let best: AnswerRow | undefined = (spokeAnswer && spokeAnswer.antwort) ? spokeAnswer : undefined;
  let bestRank = rank(best);
  // Relationstyp, über den die GEWINNENDE Antwort vererbt wird. Eigene Antwort = "equal".
  let bestRelation: ControlRelation = "equal";
  let bestAnchorId: string | null = null;

  // Kandidat 2..n: Anker-Status je framework-neutralem Knoten (control_node_member,
  // same-as) + control_mapping. WEAKEST-LINK: der STRENGSTE Status über alle den
  // Knoten teilenden Frameworks gewinnt. Bei Gleichstand bleibt die eigene Antwort
  // (best wurde zuerst gesetzt; nur ein STRENGERER Anker ersetzt sie). Kontrolle
  // ohne Knoten ⇒ [] ⇒ unabhängig (nur eigene Antwort, keine Vererbung).
  const anchors: AnchorRef[] = isoAnchorsBySpokeControl.get(`${control.framework}::${control.id}`) ?? [];
  for (const ref of anchors) {
    // Je Anker können MEHRERE Kandidaten liegen (strengster je Framework).
    // Backward-kompatibel: Einzel-Row wird zu [Row] normalisiert.
    const raw = isoAnswerByControl.get(ref.anchorId);
    const cands = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const a of cands) {
      // „na" ist frameworkspezifisch und wird NICHT über Knoten geerbt.
      if (!a?.antwort || a.antwort === "na") continue;
      // Intra-Framework-Geschwister-Schutz: Ein Anker-Status, der aus DEMSELBEN
      // Framework, aber einer ANDEREN Kontrolle stammt, darf NICHT auf diese
      // Kontrolle einfließen. Eine einzelne BSI-Anforderung zu markieren, darf ihre
      // Baustein-Geschwister (die nur denselben Knoten teilen) nicht automatisch
      // mit-ausfüllen. Framework-ÜBERGREIFENDE Vererbung (ISO↔BSI↔NIS2 …) bleibt intakt.
      // Fix F-01: Da jetzt ALLE Framework-Kandidaten vorliegen, verdeckt ein
      // strengeres Geschwister aus demselben Framework die Cross-FW-Antwort nicht mehr.
      if (a.framework === control.framework && a.control_id !== control.id) continue;
      if (rank(a) < bestRank) { best = a; bestRank = rank(a); bestRelation = ref.relation; bestAnchorId = ref.anchorId; }
    }
  }

  if (!best || !best.antwort) {
    return {
      status: null,
      reifegrad: (spokeAnswer?.reifegrad ?? null) as Reifegrad | null,
      origin: "empty",
      note: spokeAnswer?.note ?? null,
      evidence: spokeAnswer?.evidence ?? null,
    };
  }

  const isOwn = best === spokeAnswer;

  // Relations-bewusste Deckelung (ARCHITECTURE §2.2): Ein GEERBTES "ja" über einen
  // nur teilweise überdeckenden Anker (subset-of / intersects-with) wird auf
  // "teilweise" gedeckelt. equal/superset-of vererben voll; "teilweise"/"nein"
  // bleiben unverändert. Bei relation="equal" (Knoten/control_iso, also für ALLE
  // Bestandsdaten solange control_mapping leer ist) greift dieser Zweig NIE →
  // Verhalten bleibt byte-identisch zu vorher.
  const partial = !isOwn && (bestRelation === "subset-of" || bestRelation === "intersects-with");
  let status: AnswerStatus = best.antwort;
  if (partial && status === "ja") status = "teilweise";

  /**
   * Y8 · Deckungsdeckel bei framework-ÜBERGREIFENDER Übernahme.
   *
   * Codex-Befund: „Eine positive NIS2-Antwort auf einer geteilten Kontrolle
   * darf für ISO nicht automatisch voll/100 % erzeugen." Genau das tat der
   * Pfad oben: bei relation="equal" (alle same-as-Knoten) wurde ein fremdes
   * „ja" unverändert übernommen und als projectionQuality "full" ausgegeben.
   *
   * Ein same-as-Knoten sagt nur, dass beide Kontrollen INHALTLICH dasselbe
   * verlangen — nicht, dass die Prüfung dieselben Einheiten, denselben
   * Zeitraum und dieselbe Nachweistiefe abgedeckt hat. Solange das nicht
   * bestätigt ist, gilt „teilweise"; der offene Punkt bleibt sichtbar, statt
   * still als Erfüllung zu zählen. Innerhalb EINES Frameworks (eigene
   * Antwort) greift der Deckel nicht.
   */
  let scopeReviewPending = false;
  let scopeReviewFrom: EffectiveAnswer["scopeReviewFrom"];
  const crossFramework = !isOwn && best.framework !== control.framework;
  if (crossFramework && status === "ja") {
    const decision = opts?.coverage ? opts.coverage(control.framework, control.id) : "offen";
    if (decision !== "voll") {
      status = "teilweise";
      scopeReviewPending = decision === "offen";
      scopeReviewFrom = { framework: best.framework, controlId: best.control_id, status: best.antwort };
    }
  }

  return {
    status,
    scopeReviewPending: scopeReviewPending || undefined,
    scopeReviewFrom,
    // B-04: Reifegrad ist frameworkspezifisch. Bei Vererbung NICHT den Reifegrad
    // des fremden Frameworks übernehmen — nur die eigene Angabe (sonst null).
    reifegrad: (isOwn ? (best.reifegrad ?? spokeAnswer?.reifegrad ?? null) : (spokeAnswer?.reifegrad ?? null)) as Reifegrad | null,
    origin: isOwn ? "explicit" : "inherited",
    inheritedFrom: isOwn ? undefined : anchors.map((a) => a.anchorId),
    // Y8: Ein gedeckeltes „ja" ist keine volle Projektion — sonst stünde im
    // Bericht „voll übernommen", während der Status auf „teilweise" liegt.
    projectionQuality: isOwn ? undefined : (partial || scopeReviewFrom ? "partial" : "full"),
    inheritedVia: isOwn || bestAnchorId == null ? undefined : [{ anchorId: bestAnchorId, relation: bestRelation }],
    note: spokeAnswer?.note ?? best.note ?? null,
    evidence: spokeAnswer?.evidence ?? best.evidence ?? null,
  };
}

// ===========================================================================
// E4 · weighted projection — Konfidenz-gewichtete Vererbung
// ===========================================================================

/** rel_base je Relationstyp (E4.2, research §3.3-Ordnung). */
const REL_BASE: Record<ControlRelation, number> = {
  equal: 1.0,
  "superset-of": 0.9,
  "intersects-with": 0.6,
  "subset-of": 0.5,
};

/** src-Gewicht je control_mapping.source (E4.2). Unbekannt/fehlt ⇒ curated (1.0). */
function srcWeight(source?: string): number {
  switch (source) {
    case "tfidf_opus": return 0.85;
    case "import": return 0.7;
    case "curated": return 1.0;
    default: return 1.0; // conf-neutral, wenn Quelle fehlt
  }
}

/** decay = 2^(−Δdays/365), Halbwertszeit 1 Jahr, gedeckelt bei ≥ 0.125 (E4.2). */
function decayFactor(deltaMs: number): number {
  const days = Math.max(0, deltaMs) / 86_400_000;
  return Math.max(0.125, Math.pow(2, -days / 365));
}

interface WeightedCandidate {
  row: AnswerRow;
  status: AnswerStatus;
  conf: number;
  relation: ControlRelation;
  anchorId: string | null; // null ⇒ eigene explizite Antwort
  framework: string;
  isOwn: boolean;
  ts: number;
}

/**
 * Konfidenz-gewichtete Projektion (E4). Jeder Kandidat bekommt conf = rel_base ×
 * (strength/10) × src × decay. Gewinner = höchste conf; bei Gleichstand (±0.05)
 * der neuere (LWW-Tiebreak). Eigene explizite Antwort (conf = 1.0 × decay) gewinnt
 * bei Gleichstand immer (explicit-first). Die subset/intersects-Deckelung (ja →
 * teilweise) bleibt erhalten. Widersprüche glaubwürdiger Anker ⇒ EffectiveAnswer.conflict.
 */
function projectAnswerWeighted(
  control: ControlRow,
  spokeAnswer: AnswerRow | undefined,
  isoAnswerByControl: Map<string, AnswerRow | AnswerRow[]>,
  isoAnchorsBySpokeControl: Map<string, AnchorRef[]>,
  nowMs?: number,
  coverage?: CoverageResolver,
): EffectiveAnswer {
  const now = nowMs ?? Date.now();
  const ts = (r?: AnswerRow) => (r?.updated_at ? Date.parse(r.updated_at) : 0);
  const candidates: WeightedCandidate[] = [];

  // Kandidat 1: eigene direkte Antwort — conf = 1.0 × decay (equal, strength10, curated).
  if (spokeAnswer && spokeAnswer.antwort) {
    const t = ts(spokeAnswer);
    candidates.push({
      row: spokeAnswer,
      status: spokeAnswer.antwort,
      conf: 1.0 * decayFactor(now - t),
      relation: "equal",
      anchorId: null,
      framework: control.framework,
      isOwn: true,
      ts: t,
    });
  }

  // Kandidat 2..n: Anker-Kanten (framework-übergreifend, node-only). Anchor-Auflösung
  // wie im LWW-Pfad (nur Knoten-Mitgliedschaft; kein control_iso/ISO-Selbstanker).
  const anchors: AnchorRef[] = isoAnchorsBySpokeControl.get(`${control.framework}::${control.id}`) ?? [];
  for (const ref of anchors) {
    const raw = isoAnswerByControl.get(ref.anchorId);
    const cands = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const a of cands) {
      // „na" ist frameworkspezifisch und wird NICHT über Knoten geerbt.
      if (!a?.antwort || a.antwort === "na") continue;
      // Intra-Framework-Geschwister-Schutz (identisch zum LWW-Pfad).
      if (a.framework === control.framework && a.control_id !== control.id) continue;
      const strength = ref.strength ?? 10;
      const t = ts(a);
      const conf = REL_BASE[ref.relation] * (strength / 10) * srcWeight(ref.source) * decayFactor(now - t);
      candidates.push({
        row: a,
        status: a.antwort,
        conf,
        relation: ref.relation,
        anchorId: ref.anchorId,
        framework: a.framework,
        isOwn: false,
        ts: t,
      });
    }
  }

  if (candidates.length === 0) {
    return {
      status: null,
      reifegrad: (spokeAnswer?.reifegrad ?? null) as Reifegrad | null,
      origin: "empty",
      note: spokeAnswer?.note ?? null,
      evidence: spokeAnswer?.evidence ?? null,
    };
  }

  // Gewinner-Wahl: höchste conf; Tie (±0.05) ⇒ explicit-first, dann neuerer (LWW).
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i];
    if (Math.abs(c.conf - best.conf) > 0.05) {
      if (c.conf > best.conf) best = c;
    } else {
      // Gleichstand: eigene explizite Antwort gewinnt immer, sonst der neuere.
      if (c.isOwn !== best.isOwn) {
        if (c.isOwn) best = c;
      } else if (c.ts > best.ts) {
        best = c;
      }
    }
  }

  const isOwn = best.isOwn;
  const partial = !isOwn && (best.relation === "subset-of" || best.relation === "intersects-with");
  let status: AnswerStatus = best.status;
  if (partial && status === "ja") status = "teilweise";

  // Y8: derselbe Deckungsdeckel wie im LWW-Pfad — beide Modi müssen dieselbe
  // Zahl liefern, sonst hängt die Erfüllungsquote am Projektionsmodus.
  let scopeReviewPending = false;
  let scopeReviewFrom: EffectiveAnswer["scopeReviewFrom"];
  if (!isOwn && best.framework !== control.framework && status === "ja") {
    const decision = coverage ? coverage(control.framework, control.id) : "offen";
    if (decision !== "voll") {
      status = "teilweise";
      scopeReviewPending = decision === "offen";
      scopeReviewFrom = { framework: best.framework, controlId: best.row.control_id, status: best.status };
    }
  }

  // Konflikt (E4.3): ≥ 2 Kandidaten mit conf ≥ 0.6, deren Status-Rang (nein=0 <
  // teilweise=1 < ja=2) um ≥ 2 differiert (ja vs nein). `na` zählt nicht mit.
  let conflict: ProjectionConflict | undefined;
  const strong = candidates.filter((c) => c.conf >= 0.6 && c.status !== "na");
  outer: for (let i = 0; i < strong.length; i++) {
    for (let j = i + 1; j < strong.length; j++) {
      if (Math.abs(STATUS_RANK[strong[i].status] - STATUS_RANK[strong[j].status]) >= 2) {
        conflict = {
          anchors: strong.map((c) => ({
            anchorId: c.anchorId ?? control.id,
            framework: c.framework,
            status: c.status,
            conf: c.conf,
          })),
          resolution: "weighted",
        };
        break outer;
      }
    }
  }

  return {
    status,
    reifegrad: (best.row.reifegrad ?? spokeAnswer?.reifegrad ?? null) as Reifegrad | null,
    origin: isOwn ? "explicit" : "inherited",
    inheritedFrom: isOwn ? undefined : anchors.map((a) => a.anchorId),
    projectionQuality: isOwn ? undefined : (partial || scopeReviewFrom ? "partial" : "full"),
    scopeReviewPending: scopeReviewPending || undefined,
    scopeReviewFrom,
    inheritedVia: isOwn || best.anchorId == null ? undefined : [{ anchorId: best.anchorId, relation: best.relation }],
    confidence: best.conf,
    conflict,
    note: spokeAnswer?.note ?? best.row.note ?? null,
    evidence: spokeAnswer?.evidence ?? best.row.evidence ?? null,
  };
}

/**
 * Baut die Anker-Antwort-Map (anchorId → Kandidaten) per WEAKEST-LINK je Framework.
 *
 * Je Anker wird PRO FRAMEWORK die strengste Antwort behalten (nein < teilweise < ja;
 * bei Gleichstand die neueste). Rückgabe: anchorId → AnswerRow[] (ein Eintrag je
 * Framework, das den Knoten belegt).
 *
 * Fix F-01: Früher wurde je Anker nur EINE (global strengste) Antwort gespeichert.
 * War das ein Intra-Framework-Geschwister, verdeckte der Geschwister-Guard in
 * projectAnswer die Cross-Framework-Antwort → Kontrolle fälschlich „leer" statt
 * „teilweise". Durch die Kandidatenliste je Framework bleibt die Cross-FW-Antwort
 * erhalten und wird korrekt projiziert (Richtung konservativ, nie zu hoch).
 *
 * @param anchorsFor  (framework, controlId) → anchorId[]
 */
export function buildAnchorAnswerMap(
  answers: Record<string, AnswerRow>,
  anchorsFor: (framework: string, controlId: string) => string[],
): Map<string, AnswerRow[]> {
  const ts = (r?: AnswerRow) => (r?.updated_at ? Date.parse(r.updated_at) : 0);
  // anchorId → framework → strengste Antwort dieses Frameworks
  const perFw = new Map<string, Map<string, AnswerRow>>();
  for (const key of Object.keys(answers)) {
    const row = answers[key];
    if ((row.asset_id ?? null) !== null || !row.antwort || row.antwort === "na") continue; // nur Org-Ebene, beantwortet, „na" nicht über Knoten erben
    for (const anchorId of anchorsFor(row.framework, row.control_id)) {
      let fwMap = perFw.get(anchorId);
      if (!fwMap) { fwMap = new Map<string, AnswerRow>(); perFw.set(anchorId, fwMap); }
      const prev = fwMap.get(row.framework);
      // Weakest-Link je Framework: strengste Antwort gewinnt; bei Gleichstand die neueste.
      if (!prev
          || STATUS_RANK[row.antwort] < STATUS_RANK[prev.antwort]
          || (STATUS_RANK[row.antwort] === STATUS_RANK[prev.antwort] && ts(row) >= ts(prev))) {
        fwMap.set(row.framework, row);
      }
    }
  }
  const out = new Map<string, AnswerRow[]>();
  for (const [anchorId, fwMap] of perFw) out.set(anchorId, [...fwMap.values()]);
  return out;
}


/** ISO 27001:2022 – Family/clause labels used for readable accordion headers. */
const ISO_FAMILY_LABELS: Record<string, { de: string; en: string }> = {
  "4":   { de: "4 Kontext der Organisation",     en: "4 Context of the organization" },
  "5":   { de: "5 Führung",                       en: "5 Leadership" },
  "6":   { de: "6 Planung",                       en: "6 Planning" },
  "7":   { de: "7 Unterstützung",                 en: "7 Support" },
  "8":   { de: "8 Betrieb",                       en: "8 Operation" },
  "9":   { de: "9 Bewertung der Leistung",        en: "9 Performance evaluation" },
  "10":  { de: "10 Verbesserung",                 en: "10 Improvement" },
  "A.5": { de: "A.5 Organisatorische Maßnahmen",  en: "A.5 Organizational controls" },
  "A.6": { de: "A.6 Personenbezogene Maßnahmen",  en: "A.6 People controls" },
  "A.7": { de: "A.7 Physische Maßnahmen",         en: "A.7 Physical controls" },
  "A.8": { de: "A.8 Technologische Maßnahmen",    en: "A.8 Technological controls" },
};

/** BSI IT-Grundschutz — top-level layer/prefix labels. */
const BSI_LAYER_LABELS: Record<string, { de: string; en: string }> = {
  ISMS: { de: "ISMS – Sicherheitsmanagement",           en: "ISMS – Security management" },
  ORP:  { de: "ORP – Organisation & Personal",           en: "ORP – Organisation & personnel" },
  CON:  { de: "CON – Konzeption & Vorgehensweise",        en: "CON – Concepts & approach" },
  OPS:  { de: "OPS – Betrieb",                            en: "OPS – Operations" },
  DER:  { de: "DER – Detektion & Reaktion",               en: "DER – Detection & response" },
  APP:  { de: "APP – Anwendungen",                        en: "APP – Applications" },
  SYS:  { de: "SYS – IT-Systeme",                         en: "SYS – IT systems" },
  IND:  { de: "IND – Industrielle IT (OT)",               en: "IND – Industrial IT (OT)" },
  NET:  { de: "NET – Netze & Kommunikation",              en: "NET – Networks & communication" },
  INF:  { de: "INF – Infrastruktur",                      en: "INF – Infrastructure" },
  ARCH: { de: "ARCH – Architektur",                       en: "ARCH – Architecture" },
  ASST: { de: "ASST – Assets & Inventar",                 en: "ASST – Assets & inventory" },
  GEB:  { de: "GEB – Gebäude",                            en: "GEB – Buildings" },
  SENS: { de: "SENS – Sensitive Bereiche",                en: "SENS – Sensitive areas" },
  GC:   { de: "GC – Governance & Compliance",             en: "GC – Governance & compliance" },
};

/** Framework-agnostic short group label for a numeric main clause / article. */
/** Annex-SL Management-System-Kapitel (4–10) — lesbare Titel, damit "Kapitel 8"
 *  nicht kryptisch bleibt. Gilt für ISO-MS-Frameworks (ISO 22301, BSI 200-4 …). */
const MGMT_CLAUSE_LABELS: Record<string, { de: string; en: string }> = {
  "4":  { de: "Kontext der Organisation", en: "Context of the organization" },
  "5":  { de: "Führung",                  en: "Leadership" },
  "6":  { de: "Planung",                  en: "Planning" },
  "7":  { de: "Unterstützung",            en: "Support" },
  "8":  { de: "Betrieb",                  en: "Operation" },
  "9":  { de: "Bewertung der Leistung",   en: "Performance evaluation" },
  "10": { de: "Verbesserung",             en: "Improvement" },
};

function clauseLabel(kind: "clause" | "article" | "art", num: string, de: boolean): string {
  if (kind === "article" || kind === "art") return (de ? "Art. " : "Article ") + num;
  const base = (de ? "Kapitel " : "Chapter ") + num;
  const t = MGMT_CLAUSE_LABELS[num];
  return t ? `${base} · ${de ? t.de : t.en}` : base;
}

/** NIS2 Art. 21(2) Maßnahmen a–j — lesbare Kategorienamen (Quelle: uniqsuite NIS2-Katalog,
 *  autoritativ). Ersetzt kryptische ID-Präfixe (gov/inc/reg/sup/cry…) durch echte Titel. */
const NIS2_MEASURE_LABELS: Record<string, { de: string; en: string }> = {
  a: { de: "Risikoanalyse & Sicherheitskonzepte",            en: "Risk analysis & security policies" },
  b: { de: "Vorfallbehandlung & Meldepflichten (Art. 23)",   en: "Incident handling & reporting (Art. 23)" },
  c: { de: "Business Continuity, Backup & Krisenmanagement",  en: "Business continuity, backup & crisis mgmt" },
  d: { de: "Lieferkettensicherheit",                          en: "Supply chain security" },
  e: { de: "Sichere Beschaffung, Entwicklung & Wartung",      en: "Secure acquisition, development & maintenance" },
  f: { de: "Wirksamkeit & Schwachstellen-/Patch-Management",  en: "Effectiveness & vulnerability/patch mgmt" },
  g: { de: "Cyberhygiene, Schulung & Monitoring",             en: "Cyber hygiene, training & monitoring" },
  h: { de: "Kryptographie & Verschlüsselung",                 en: "Cryptography & encryption" },
  i: { de: "Personalsicherheit, Zugriffskontrolle & Assets",  en: "HR security, access control & assets" },
  j: { de: "MFA & sichere Kommunikation",                     en: "MFA & secure communications" },
};
/** NIS2-ID-Präfix → Maßnahme a–j (aus uniqsuite-Katalog). */
const NIS2_PREFIX_TO_MEASURE: Record<string, string> = {
  a: "a", org: "a", gov: "a", reg: "a", risk: "a", ai: "a",
  b: "b", inc: "b",
  c: "c", cont: "c",
  d: "d", sup: "d",
  e: "e", tech: "e", dev: "e", ot: "e",
  f: "f", vul: "f",
  g: "g", i: "g", ppl: "g", aw: "g", awr: "g", j: "g",
  h: "h", cry: "h",
  phy: "i",
  iam: "j", ep: "j", net: "j",
};

/**
 * Derive a family bucket id + human label for grouping controls in the accordion.
 *
 * `themaIndex` löst `meta.iso_ids` auf: der erste Eintrag ist die Kontroll-ID im
 * NIS2/ISO-Raum, und DIE trägt ein Thema T01–T18. Ohne diesen Index landeten
 * 2485 von 4407 Kontrollen im Sammeltopf „{Framework} · spezifisch" — bei
 * KRITIS, DORA, SOC2, MaRisk, CRA, GDPR und NIST_AI_RMF sogar ALLE. Der
 * Etiketten-Wächter (outputs/etikett_waechter.cjs) hat das über den
 * vollständigen Katalog gemessen; punktuelle Tests hatten es dreimal übersehen.
 * Der Parameter ist optional, damit alte Aufrufer unverändert funktionieren.
 */
export function familyOf(
  control: ControlRow,
  de: boolean = true,
  themaIndex?: Map<string, string>,
): { id: string; label: string } {
  const meta = (control.meta ?? {}) as any;
  const metaFamily = meta.family as string | undefined;
  const metaLabel = meta.family_label as string | { de?: string; en?: string } | undefined;
  const thema = meta.thema as string | undefined;

  // AI Act und ISO 42001 tragen ihre Gliederung als Klartext in `meta.section`
  // ("Art. 50 Transparenz · Art. 50(1) Interaktion", "Risiko-Kern & SoA").
  // Das ist bereits der echte Abschnittsname — nichts abzuleiten.
  const section = meta.section as string | undefined;
  if (typeof section === "string" && /[A-Za-zÄÖÜäöü]{3}/.test(section)) {
    return { id: section, label: section };
  }

  if (metaFamily) {
    let label = metaFamily;
    if (typeof metaLabel === "string") label = metaLabel;
    else if (metaLabel && typeof metaLabel === "object") label = (de ? metaLabel.de : metaLabel.en) ?? label;
    return { id: metaFamily, label };
  }

  // Unified Catalogue v7: ISO-Controls tragen ihre Annex-/Kapitel-Referenz in
  // `meta.annex` ("A.5.31", "4.1") + `meta.annex_kind`. Die ID ist dort NICHT
  // mehr "a5-31", sondern sprechend ("ISO-LEGAL-REQUIREMENTS", "C29.4") — der
  // ID-Präfix-Parser unten greift deshalb nicht. Annex zuerst auswerten.
  if (control.framework === "ISO27001" && typeof meta.annex === "string" && meta.annex.trim()) {
    const a = meta.annex.trim();
    const annexM = a.match(/^A\.(\d+)/i);
    const key = annexM ? `A.${annexM[1]}` : (a.match(/^(\d+)/)?.[1] ?? null);
    if (key) {
      const known = ISO_FAMILY_LABELS[key];
      if (known) return { id: key, label: de ? known.de : known.en };
      return { id: key, label: key.startsWith("A.") ? `ISO ${key}` : clauseLabel("clause", key, de) };
    }
  }

  // Unified Catalogue v7: jedes Control trägt ein Thema T01–T18 (`meta.topic`).
  // Das ist die framework-neutrale Gruppierung des Katalogs und greift für NIS2
  // (IDs wie "C12.1" passen in kein Präfix-Schema) sowie als ISO-Rückfall.
  if (isCatalogTopic(meta.topic)) {
    return { id: meta.topic, label: catalogTopicLabel(meta.topic, de) };
  }

  // Kein eigenes Thema? Dann das Thema der Kontrolle nehmen, auf die
  // `meta.iso_ids` zeigt. Genau dafür ist die Zuordnung da: KRITIS GES-0171
  // verweist auf C41.6, und C41.6 gehört zu T07 „Identitäten, Zugriff &
  // Authentisierung". Am 17.09.2026 treffen 3874 von 3874 Verweisen eine
  // existierende Kontrolle — die Auflösung geht nie ins Leere.
  if (themaIndex) {
    const roh = (meta.iso_ids ?? meta.iso) as unknown;
    const liste = Array.isArray(roh) ? roh : typeof roh === "string" ? [roh] : [];
    for (const r of liste) {
      const topic = themaIndex.get(String(r).trim());
      if (topic && isCatalogTopic(topic)) {
        return { id: topic, label: catalogTopicLabel(topic, de) };
      }
    }
  }

  if (control.framework === "ISO27001") {
    const m = control.id.match(/^(A\.\d+|\d+)/);
    if (m) {
      const key = m[1];
      const known = ISO_FAMILY_LABELS[key];
      return { id: key, label: known ? (de ? known.de : known.en) : `ISO ${key}` };
    }
  }

  if (control.framework === "BSI") {
    // BSI IDs look like "ARCH.9.4" → layer = "ARCH". Prefer meta.thema for a readable label.
    const layer = control.id.split(".")[0];
    const layerMeta = BSI_LAYER_LABELS[layer];
    const layerLabel = layerMeta ? (de ? layerMeta.de : layerMeta.en) : `BSI ${layer}`;
    const label = thema ? `${layerLabel} · ${thema}` : layerLabel;
    return { id: layer, label };
  }

  // AIACT & CRA: eigene "Art. N"-Gruppierung entfernt (für Manager kryptisch ohne Titel).
  // Sie fallen jetzt auf die lesbare ISO-Anker-Familie zurück; AI/CRA-spezifische Controls
  // ohne ISO-Anker landen im lesbaren Sammel-Bucket "{Framework} · spezifisch" (siehe unten).

  if (control.framework === "BCM22301") {
    // "BCM22301-8.4.2a" → main clause "8"
    const m = control.id.match(/BCM22301-(\d+)/);
    if (m) return { id: m[1], label: clauseLabel("clause", m[1], de) };
  }

  if (control.framework === "BSI200_4") {
    const m = control.id.match(/BSI2004-(\d+)/);
    if (m) return { id: m[1], label: clauseLabel("clause", m[1], de) };
  }

  if (control.framework === "NIS2") {
    // NIS2-IDs wie "gov-01", "inc-03", "sup-02" → Art. 21(2)-Maßnahme mit lesbarem Titel.
    const pre = control.id.split(/[-.\s_/]/)[0].toLowerCase();
    const measure = NIS2_PREFIX_TO_MEASURE[pre];
    if (measure) {
      const l = NIS2_MEASURE_LABELS[measure];
      return { id: measure, label: de ? l.de : l.en };
    }
  }

  if (control.framework === "NIST_CSF") {
    const fn = (meta.function as string | undefined) ?? control.id.split(".")[0].replace(/^NIST-/, "");
    const labels: Record<string, { de: string; en: string }> = {
      GOVERN:   { de: "GOVERN – Steuern",       en: "GOVERN" },
      IDENTIFY: { de: "IDENTIFY – Identifizieren", en: "IDENTIFY" },
      PROTECT:  { de: "PROTECT – Schützen",     en: "PROTECT" },
      DETECT:   { de: "DETECT – Erkennen",      en: "DETECT" },
      RESPOND:  { de: "RESPOND – Reagieren",    en: "RESPOND" },
      RECOVER:  { de: "RECOVER – Wiederherstellen", en: "RECOVER" },
    };
    const l = labels[fn];
    return { id: fn, label: l ? (de ? l.de : l.en) : `NIST ${fn}` };
  }


  if (thema) {
    return { id: thema, label: thema };
  }

  if (control.sub_sector) {
    return { id: control.sub_sector, label: control.sub_sector };
  }

  // Fallback: nach ISO-Anker-FAMILIE gruppieren (aus meta.iso_ids), wenn das Framework
  // keine eigene Kategorie hat (z. B. DORA "DORA-001", MaRisk "MR-001"). Sonst würden
  // ALLE Controls in EINEN Framework-Eimer fallen → "Schwächste Kategorie = DORA" (sinnlos).
  const metaIsoIds = meta.iso_ids as string[] | undefined;
  if (Array.isArray(metaIsoIds) && metaIsoIds.length > 0) {
    const m = String(metaIsoIds[0]).match(/^([ac])(\d+)-/i);
    if (m) {
      const isAnnex = m[1].toLowerCase() === "a";
      const key = isAnnex ? `A.${m[2]}` : m[2];
      const known = ISO_FAMILY_LABELS[key];
      if (known) return { id: key, label: de ? known.de : known.en };
      return { id: key, label: isAnnex ? `ISO A.${m[2]}` : clauseLabel("clause", m[2], de) };
    }
  }

  // Letzter Fallback: kein Native-Schema, kein ISO-Anker → Framework-spezifische
  // Anforderung. KEINE kryptischen ID-Kürzel mehr (Manager-lesbar) — ein sauberer,
  // sprechender Sammel-Bucket je Framework.
  return {
    id: `${control.framework}::spezifisch`,
    label: de ? `${control.framework} · spezifisch` : `${control.framework} · specific`,
  };
}


/**
 * ALLE Familien einer Kontrolle — nicht nur die primäre.
 *
 * Eine ISO-Kontrolle kann mehrere Annex-/Klausel-Referenzen bedienen:
 * `C22.2` („Security Responsibilities Have Sufficient Staff, Funding and Tools")
 * gehört zu 5.1 (primär), 7.1 und A.5.4. 99 der 318 ISO-Kontrollen sind so.
 *
 * Das Akkordeon der Gap-Analyse zählt seit Y5 jede Referenz — sonst fehlten
 * 8 Annex-A-Überschriften komplett (A.5.2, A.5.4, A.7.9, A.8.10, A.8.12,
 * A.8.18, A.8.19, A.8.31 sind bei KEINER Kontrolle die primäre Referenz), und
 * die Gap-Ansicht zeigte 85 statt 93. Reifegrad und „Schwächste Kategorien"
 * zählten dagegen nur die primäre Referenz und nannten deshalb für dieselbe
 * Familie eine andere Grundgesamtheit (A.5: 106 statt 121). Diese Funktion ist
 * die gemeinsame Quelle, damit im selben Bildschirm nur EINE Zahl steht.
 *
 * Der Status bleibt EIN Datensatz — eine Kontrolle erscheint in mehreren
 * Familien, erzeugt aber keine zweite Antwort.
 */
export function familiesOf(control: ControlRow, de: boolean = true): { id: string; label: string }[] {
  if (control.framework === "ISO27001") {
    const out = new Map<string, { id: string; label: string }>();
    for (const r of isoRefsAll(control.id)) {
      const key = r.startsWith("A.") ? r.split(".").slice(0, 2).join(".") : r.split(".")[0];
      if (!key || out.has(key)) continue;
      const known = ISO_FAMILY_LABELS[key];
      out.set(key, { id: key, label: known ? (de ? known.de : known.en) : annexFamilyLabel(key, de ? "de" : "en") });
    }
    if (out.size > 0) return Array.from(out.values());
  }
  return [familyOf(control, de)];
}


/**
 * Sub-family bucket (level 2) — used when a family has too many controls to
 * scan at once. Returns null when no useful split exists.
 */
export function subFamilyOf(
  control: ControlRow,
  family: { id: string; label: string },
  de: boolean = true,
): { id: string; label: string } | null {
  const meta = (control.meta ?? {}) as any;

  // Explicit metadata wins.
  if (meta.subfamily) {
    const lbl = meta.subfamily_label;
    let label = String(meta.subfamily);
    if (typeof lbl === "string") label = lbl;
    else if (lbl && typeof lbl === "object") label = (de ? lbl.de : lbl.en) ?? label;
    return { id: String(meta.subfamily), label };
  }

  // Unified Catalogue v7: `meta.subgroup` ("I-ACC · Identity and access control")
  // ist die vom Katalog vorgesehene zweite Ebene. Ohne diesen Zweig landeten
  // NIS2-IDs wie "C12.1" im Zahlen-Bucket "1–10" (für den Leser sinnlos).
  {
    const sub = meta.subgroup as unknown;
    const title = catalogSubgroupTitle(sub, de, meta.subgroup_de as unknown);
    if (title) {
      const code = String(sub).split(" · ")[0];
      return { id: `${family.id}::${code}`, label: title };
    }
  }

  // BSI IT-Grundschutz — e.g. "KONF.1.2.3" → sub bucket "KONF.1" (per Baustein).
  if (control.framework === "BSI") {
    const parts = control.id.split(".");
    if (parts.length >= 2) {
      const id = `${parts[0]}.${parts[1]}`;
      return { id, label: id };
    }
    return null;
  }

  // ISO 27001 Annex A — "a5-01".."a5-37" → chunks of 10.
  if (control.framework === "ISO27001") {
    const m = control.id.match(/^([aA]\d+)[.\-_](\d+)/);
    if (m) {
      const clause = m[1].toUpperCase().replace(/^A/, "A.");
      const n = parseInt(m[2], 10);
      const lo = Math.floor((n - 1) / 10) * 10 + 1;
      const hi = lo + 9;
      return { id: `${family.id}-${lo}`, label: `${clause}.${lo}–${hi}` };
    }
    return null;
  }

  // KRITIS / TISAX / MaRisk / DORA — often "X.Y.Z" → sub = "X.Y".
  const dotParts = control.id.split(".");
  if (dotParts.length >= 3) {
    return { id: `${dotParts[0]}.${dotParts[1]}`, label: `${dotParts[0]}.${dotParts[1]}` };
  }

  // Dash-segmented IDs (e.g. NIS2 "nis2-gov-05", AI Act "eu-ai-art-15",
  // GDPR "gdpr-art-32") — group by the mid segment(s) before the trailing number.
  const dashSegs = control.id.split(/[-_]/);
  if (dashSegs.length >= 3 && /^\d+$/.test(dashSegs[dashSegs.length - 1])) {
    const key = dashSegs.slice(0, -1).join("-");
    return { id: key, label: key.toUpperCase() };
  }

  // Fallback: dash-numbered ids (e.g. "a-01") — chunk by 10.
  const dm = control.id.match(/^([A-Za-z]+)[\-_](\d+)/);
  if (dm) {
    const prefix = dm[1];
    const n = parseInt(dm[2], 10);
    const lo = Math.floor((n - 1) / 10) * 10 + 1;
    const hi = lo + 9;
    return { id: `${family.id}-${lo}`, label: `${prefix}-${String(lo).padStart(2, "0")}–${String(hi).padStart(2, "0")}` };
  }

  // Last-resort: chunk by 10 based on any trailing number in the id.
  const tail = control.id.match(/(\d+)\s*$/);
  if (tail) {
    const n = parseInt(tail[1], 10);
    const lo = Math.floor((n - 1) / 10) * 10 + 1;
    const hi = lo + 9;
    return { id: `${family.id}-${lo}`, label: `${lo}–${hi}` };
  }

  return null;
}







export interface FrameworkStats {
  total: number;
  answered: number;
  ja: number;
  teilweise: number;
  nein: number;
  na: number;
  applicable: number; // total - na
  compliancePct: number; // (ja + 0.5·teilweise) / applicable
  progressPct: number;
  criticalOpen: number; // muss='true' and status='nein'
  /**
   * muss='true' und GAR KEINE Antwort. Bewusst NICHT in `criticalOpen`
   * eingerechnet: diese Kennzahl speist Dashboard-Hero, Vorstandsbericht und
   * Excel, ihre Definition bleibt stabil. Aber eine unbeantwortete MUSS-
   * Anforderung ist auch nicht nachgewiesen — sie darf nicht unsichtbar sein
   * (betrifft u. a. die 13 Vorbereitungskontrollen aus K2). Optional, damit
   * aggregiert gebaute Stats-Objekte (z. B. Gesamtzeile im Gap-Bericht)
   * weiter gueltig bleiben.
   */
  criticalUnanswered?: number;
  /**
   * SoA-Prüfbericht C-6: MUSS-Kontrollen, deren gesetzliche Pflicht erst
   * später gilt (`meta.applies_from` > heute), offen oder unbeantwortet.
   * Sie stehen NICHT in `criticalOpen`/`criticalUnanswered` — eine noch nicht
   * geltende Pflicht ist keine kritische Lücke —, werden aber getrennt
   * ausgewiesen, damit sie nicht verschwinden. Compliance-% bleibt unverändert.
   */
  criticalLater?: number;
}

/** Heutiges Datum als YYYY-MM-DD (lokal). */
export function todayIso(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Gilt die Pflicht dieser Kontrolle erst nach `today`? */
export function dutyNotYetApplicable(c: Pick<ControlRow, "meta">, today: string = todayIso()): boolean {
  const af = (c.meta as any)?.applies_from;
  return typeof af === "string" && /^\d{4}-\d{2}-\d{2}$/.test(af) && af > today;
}

/** Nicht bewertete Übersichtszeile (meta.scored === false, z. B. AIACT-A-50.1). */
export function isUnscoredRow(c: Pick<ControlRow, "meta">): boolean {
  return (c.meta as any)?.scored === false;
}

export function computeStats(
  controlsIn: ControlRow[],
  effective: Map<string, EffectiveAnswer>,
  today: string = todayIso(),
): FrameworkStats {
  // Übersichtszeilen (C-10) werden aus den Einzelkontrollen abgeleitet und nicht gezählt.
  const controls = controlsIn.filter(c => !isUnscoredRow(c));
  let ja = 0, teilweise = 0, nein = 0, na = 0, answered = 0, criticalOpen = 0, criticalUnanswered = 0, criticalLater = 0;
  for (const c of controls) {
    const e = effective.get(c.id);
    const s = e?.status ?? null;
    if (s) answered++;
    if (s === "ja") ja++;
    else if (s === "teilweise") teilweise++;
    else if (s === "nein") nein++;
    else if (s === "na") na++;
    if (c.muss !== "true" || (s !== "nein" && s !== null)) continue;
    if (dutyNotYetApplicable(c, today)) criticalLater++;
    else if (s === "nein") criticalOpen++;
    else criticalUnanswered++;
  }
  const total = controls.length;
  const applicable = total - na;
  const compliancePct = applicable > 0 ? Math.round(((ja + 0.5 * teilweise) / applicable) * 100) : 0;
  const progressPct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return { total, answered, ja, teilweise, nein, na, applicable, compliancePct, progressPct, criticalOpen, criticalUnanswered, criticalLater };
}
