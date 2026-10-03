/**
 * controlSeverity — app-weite, datengetriebene Severity-Ableitung.
 *
 * Quelle ist AUTORITATIV: die Formulierung der Norm selbst (Modalverben im
 * Anforderungstext). Kein Raten — nur was im req-Text steht:
 *   - „muss/müssen/verpflichtet/shall/required/must/ist zu/sind zu"  → verpflichtend
 *   - „soll/sollte/should/empfohlen/recommended"                     → empfohlen
 *   - „kann/können/may/optional"                                     → optional
 *   - neutral (kein Modalverb, z. B. TISAX-Reifegradfragen)          → verpflichtend
 *     (eine im Standard gelistete Kontrolle ist per Default gefordert)
 *
 * Daraus folgt der Vorschlag für den Audit-Befund (ISO-19011-Konvention):
 *   fehlend (nein) + verpflichtend        → MAJOR (Abwesenheit einer Pflichtkontrolle)
 *   fehlend (nein) + empfohlen/optional   → MINOR
 *   teilweise (schwach)                   → MINOR (isolierte Lücke; MAJOR nur bei kritischem Restrisiko)
 *
 * Wird ein Kontroll-Feld `muss` serverseitig befüllt, hat es Vorrang.
 * Verknüpfte Risiko-Stufe (maxRiskRank 0..4) hebt teilweise→major nur bei „kritisch".
 */

export type MandatoryLevel = "mandatory" | "recommended" | "optional";
export type FindingSeverity = "major" | "minor";

export interface SeverityControlInput {
  req_de?: string | null;
  req_en?: string | null;
  muss?: string | null;
}

const RE_MUST = /\bmuss\b|\bmüssen\b|verpflicht|\bshall\b|\brequired\b|\bmust\b|\bist zu\b|\bsind zu\b/i;
const RE_SHOULD = /\bsoll\b|\bsollte\b|\bsollten\b|\bsollen\b|\bshould\b|empfohlen|recommended/i;
const RE_MAY = /\bkann\b|\bkönnen\b|\bmay\b|\boptional\b/i;

/** Verpflichtungsgrad einer Kontrolle aus dem Norm-Wortlaut (bzw. `muss`-Feld). */
export function controlMandatoryLevel(c: SeverityControlInput): MandatoryLevel {
  if (c.muss != null && String(c.muss).trim() !== "") {
    const m = String(c.muss).toLowerCase().trim();
    // Boolean-Kodierung (Seeds: 'true'/'false', z. B. ISO: Klausel 4–10 = true, Annex A = false)
    if (m === "true" || m === "1" || m === "ja" || m === "yes") return "mandatory";
    if (m === "false" || m === "0" || m === "nein" || m === "no") return "recommended";
    if (/muss|mandatory|required|pflicht/.test(m)) return "mandatory";
    if (/soll|recommend|empfohlen/.test(m)) return "recommended";
    if (/kann|optional/.test(m)) return "optional";
  }
  const t = `${c.req_de ?? ""} ${c.req_en ?? ""}`;
  // „muss" gewinnt vor „soll"/„kann", falls mehrere vorkommen.
  if (RE_MUST.test(t)) return "mandatory";
  if (RE_SHOULD.test(t)) return "recommended";
  if (RE_MAY.test(t)) return "optional";
  return "mandatory"; // neutral: im Standard gelistet = per Default gefordert
}

export const MANDATORY_LABEL: Record<MandatoryLevel, { de: string; en: string }> = {
  mandatory:   { de: "Muss", en: "Must" },
  recommended: { de: "Soll", en: "Should" },
  optional:    { de: "Kann", en: "May" },
};

/**
 * Severity-Vorschlag je Befund. `status` = effektiver Kontrollstatus,
 * `maxRiskRank` = höchste verknüpfte Risiko-Stufe (0 unbekannt … 4 kritisch).
 */
export function suggestFindingSeverity(
  status: "nein" | "teilweise",
  control: SeverityControlInput,
  maxRiskRank = 0,
): FindingSeverity {
  if (status === "teilweise") return maxRiskRank >= 4 ? "major" : "minor";
  // fehlend:
  const lvl = controlMandatoryLevel(control);
  if (lvl === "mandatory") return "major";
  // empfohlen/optional fehlend: minor — außer bereits kritisches Restrisiko verknüpft.
  return maxRiskRank >= 4 ? "major" : "minor";
}
