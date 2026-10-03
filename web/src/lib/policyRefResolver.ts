/**
 * policyRefResolver — interne Dokument-/Klausel-IDs im Klauseltext auflösen.
 *
 * Der Katalog verweist im Fließtext auf andere Regelungen über ihre INTERNE ID:
 *
 *   „Interne Eskalationsziele verschieben keine gesetzlichen Meldefristen nach p31."
 *   „Sitzungslaufzeit, Abmeldung und erneute Authentisierung folgen p10-c23."
 *   „Löschung und Rückgabe folgen p39/p54 sowie tatsächlichen Aufbewahrungspflichten."
 *
 * Für den Leser der exportierten Richtlinie ist „p31" bedeutungslos und wird im
 * schlimmsten Fall für eine Rechtsnorm gehalten. Diese Funktion ersetzt die ID
 * beim RENDERN durch den Titel — der Katalogtext selbst bleibt unverändert, damit
 * Querverweise maschinell prüfbar und beim Umbenennen einer Richtlinie automatisch
 * korrekt bleiben.
 *
 * Bewusst konservativ: ersetzt wird nur, was im Katalog tatsächlich existiert.
 * Eine unbekannte Zeichenfolge bleibt unangetastet, damit hier niemals Text
 * verschwindet oder falsch benannt wird.
 */

import ALL_POLICY_TEMPLATES from "@/data/policyTemplates";
import CLAUSE_TEMPLATES from "@/data/policyClauseTemplates";

type Bezeichnung = { de: string; en: string };

let CACHE: Map<string, Bezeichnung> | null = null;

/** id (kleingeschrieben) → Titel. Dokument-IDs und Klausel-IDs in EINER Tabelle. */
function lookup(): Map<string, Bezeichnung> {
  if (CACHE) return CACHE;
  const map = new Map<string, Bezeichnung>();
  for (const t of ALL_POLICY_TEMPLATES) {
    if (t?.id) map.set(t.id.toLowerCase(), { de: t.name, en: t.nameEn || t.name });
  }
  for (const list of Object.values(CLAUSE_TEMPLATES)) {
    for (const c of list as { id: string; title: string; titleEn: string }[]) {
      if (c?.id) map.set(c.id.toLowerCase(), { de: c.title, en: c.titleEn || c.title });
    }
  }
  CACHE = map;
  return map;
}

/** Nur für Tests: erzwingt den Neuaufbau der Tabelle. */
export function resetPolicyRefCache(): void {
  CACHE = null;
}

/**
 * Muster: `p01`, `D42`, `p49-c05` — genau zwei Ziffern, Klauselteil optional.
 * Wortgrenzen fangen die Schreibweisen des Katalogs mit ab: „(D05)", „p39/p54",
 * „nach p17 und p20", „p11-c20 statt pauschal".
 */
const REF = /\b([pPdD]\d{2})(-c\d{2})?\b/g;

/**
 * Ersetzt bekannte IDs durch ihren Titel in Anführungszeichen.
 * `text` unverändert zurück, wenn nichts Bekanntes vorkommt.
 */
export function resolvePolicyRefs(text: string | null | undefined, de: boolean): string {
  if (!text) return text ?? "";
  if (!/[pPdD]\d{2}/.test(text)) return text; // schneller Ausweg für den Normalfall
  const map = lookup();
  return text.replace(REF, (ganz, kopf: string, schwanz: string | undefined) => {
    const key = (kopf + (schwanz ?? "")).toLowerCase();
    const treffer = map.get(key);
    if (!treffer) return ganz; // unbekannt ⇒ unangetastet lassen
    const titel = de ? treffer.de : treffer.en;
    return de ? `„${titel}“` : `“${titel}”`;
  });
}

/**
 * Prüfhilfe für den Build: liefert alle IDs eines Textes, die NICHT auflösbar
 * sind. Leeres Array = jeder Verweis im Text hat ein Ziel.
 */
export function unresolvedPolicyRefs(text: string | null | undefined): string[] {
  if (!text) return [];
  const map = lookup();
  const offen: string[] = [];
  for (const m of text.matchAll(REF)) {
    const key = (m[1] + (m[2] ?? "")).toLowerCase();
    if (!map.has(key)) offen.push(m[0]);
  }
  return offen;
}
