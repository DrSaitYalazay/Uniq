/**
 * Gruppenüberschriften für Kontroll-Bündel — EINE Quelle für alle Seiten.
 *
 * WARUM ES DIESE DATEI GIBT
 * Die Seite „Umsetzung" hatte eine eigene Gruppierung: `isoChapter()` schnitt aus
 * dem Bündelschlüssel ein Präfix ("a5-15" → "a5") und schlug es in einer Tabelle
 * GROUP_META nach, die nur a5–a8 und c4–c10 kannte — den Schlüsselraum der ALTEN
 * ISO-27001-Prüffragen. Seit der v6/v7-Umstellung ist ein Bündelschlüssel aber
 * eine Kontroll-ID des neuen Katalogs: "C41.6", "ISO-ROLES", "D04-03",
 * "BC-BIA", "ASSET-OFFSITE". Die Tabelle kannte davon nichts, also zeigte die
 * Oberfläche den rohen Code als Überschrift und darunter „Weitere Kontrollen".
 *
 * Die Bewertungsseite macht es seit Y9 richtig: `familyOf()` in assessmentEngine
 * liest `meta.topic` (T01–T18) und liefert einen sprechenden Namen. Nur war das
 * nie auf die Umsetzung übertragen worden. Statt die Tabelle zu flicken, geht
 * die Umsetzung jetzt durch dieselbe Funktion — ein zweiter Grupperungspfad
 * würde beim nächsten Katalogwechsel genauso stillschweigend veralten.
 *
 * REGEL (gilt für die ganze Anwendung)
 * Eine Gruppenüberschrift, die ein Nutzer liest, ist NIE ein interner Code.
 * Kein "C22", kein "a5", kein "D04-03", kein "T07" ohne Klartext, kein
 * „Weitere Kontrollen" als Ersatz für einen fehlenden Namen. Fehlt der Name,
 * ist das ein Datenfehler und muss auffallen — nicht in der Anzeige versanden.
 * Geprüft wird das maschinell über alle 4407 Kontrollen (siehe
 * outputs/etikett_waechter.cjs, Deploy-Gate).
 */

import { familyOf, type ControlRow } from "@/lib/assessmentEngine";

/** Was die Oberfläche braucht, um eine Gruppe zu beschriften. */
export interface Gruppe {
  /** Stabiler Schlüssel für Accordion-State und Sortierung. */
  id: string;
  /** Der Text, den der Nutzer liest. Enthält den Klartext, nie nur einen Code. */
  label: string;
  /** true, wenn kein echter Name gefunden wurde — die Oberfläche darf das zeigen,
   *  der Wächter schlägt darauf an. */
  unbenannt: boolean;
}

/** Minimalform, die zum Gruppieren reicht (Seiten laden nur diese Felder). */
export type GruppierbareKontrolle = Pick<ControlRow, "id" | "framework"> & {
  meta?: Record<string, unknown> | null;
};

/**
 * Index über ALLE Kontrollen, um einen Bündelschlüssel aufzulösen.
 * Ein Bündelschlüssel ist die Kontroll-ID, auf die `meta.iso_ids` zeigt — die
 * liegt immer im NIS2/ISO-27001-Raum (am 17.09.2026 gemessen: 3874 von 3874
 * Verweisen treffen eine existierende Kontrolle, keiner geht ins Leere).
 * ISO 27001 gewinnt bei Gleichstand, weil das Bündel die ISO-Kontrolle IST.
 */
export function buildControlIndex(alle: GruppierbareKontrolle[]): Map<string, GruppierbareKontrolle> {
  const idx = new Map<string, GruppierbareKontrolle>();
  for (const c of alle) {
    const vorhanden = idx.get(c.id);
    if (!vorhanden || (c.framework === "ISO27001" && vorhanden.framework !== "ISO27001")) {
      idx.set(c.id, c);
    }
  }
  return idx;
}

/**
 * Gruppe für einen Bündelschlüssel. Fällt in dieser Reihenfolge zurück:
 *   1. die Kontrolle hinter dem Schlüssel → familyOf() (meta.topic, ISO-Annex, …)
 *   2. ein Mitglied des Bündels → dessen familyOf()
 *   3. unbenannt (Datenfehler, wird sichtbar gemacht statt versteckt)
 */
export function bundleGruppe(
  bundleKey: string,
  index: Map<string, GruppierbareKontrolle>,
  de: boolean,
  memberControlIds: string[] = [],
): Gruppe {
  const direkt = index.get(bundleKey);
  if (direkt) {
    const f = familyOf(direkt as ControlRow, de);
    if (f.label && f.label !== f.id) return { id: f.id, label: f.label, unbenannt: false };
  }

  // Bündelmitglieder heißen "FRAMEWORK:CONTROL_ID".
  for (const m of memberControlIds) {
    const id = m.includes(":") ? m.slice(m.indexOf(":") + 1) : m;
    const c = index.get(id);
    if (!c) continue;
    const f = familyOf(c as ControlRow, de);
    if (f.label && f.label !== f.id) return { id: f.id, label: f.label, unbenannt: false };
  }

  return {
    id: bundleKey,
    label: de ? "Ohne Themenzuordnung" : "No topic assigned",
    unbenannt: true,
  };
}

/** Sortierschlüssel: Themen T01–T18 in Katalogreihenfolge, danach alphabetisch. */
export function gruppeSortKey(id: string): string {
  return /^T\d{2}$/.test(id) ? `0${id}` : `1${id}`;
}
