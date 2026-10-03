// ─────────────────────────────────────────────────────────────────────────────
// National transposition registry for the NIS2 Directive (EU) 2022/2555.
//
// HOW TO ADD A NEW COUNTRY:
//   Add an entry to NATIONAL_LAWS below. Leave any field empty string ("") if
//   you don't have the exact reference yet — the UI/PDF will fall back to the
//   generic NIS2 wording. Only entries that are explicitly filled in are shown.
//
// All references shown on screen and in PDF/Word reports are derived from this
// table. If a user's country is not in the table, ONLY NIS2 Art. 23 references
// are shown (no national-law references at all).
// ─────────────────────────────────────────────────────────────────────────────

export interface NationalLawRef {
  /** ISO-3166 alpha-2 country code (uppercase). */
  country: string;
  /** Short law name shown in chips/badges (e.g. "BSIG", "NISG", "Wbni"). */
  short: string;
  /** Full law name shown once in InfoTips (e.g. "BSI-Gesetz"). */
  full: { de: string; en: string };
  /** Competent authority short name (e.g. "BSI", "GovCERT.AT"). */
  authority: string;
  /** Citation for the section that defines mandatory notification content
   *  (NIS2 Art. 23(4)) — e.g. "§ 32 Abs. 2 BSIG". Empty = omit. */
  mandatoryContentRef: string;
  /** Citation for the section requiring recipient notification
   *  (NIS2 Art. 23(2)) — e.g. "§ 35 BSIG". Empty = omit. */
  recipientNotificationRef: string;
  /** Citations for the 24h / 72h / 1-month deadlines. Empty = omit. */
  earlyWarning24hRef: string;
  followUp72hRef: string;
  finalReport1mRef: string;
  intermediateRef: string;
}

const NATIONAL_LAWS: Record<string, NationalLawRef> = {
  // No national transpositions are cited. The tool presents all references
  // uniformly as NIS2 Directive (EU) 2022/2555 articles, regardless of the
  // user's country. To re-introduce country-specific citations, add entries
  // following the NationalLawRef shape above.
};

/** Returns the national-law entry for a country, or null if none registered. */
export function getNationalLaw(country: string | null | undefined): NationalLawRef | null {
  if (!country) return null;
  return NATIONAL_LAWS[country.toUpperCase()] ?? null;
}

/** Returns the competent authority short name, or a generic CSIRT fallback. */
export function getAuthorityName(country: string | null | undefined, lang: "de" | "en"): string {
  const law = getNationalLaw(country);
  if (law) return law.authority;
  return lang === "en" ? "national CSIRT" : "nationales CSIRT";
}

/** Combine an NIS2 article citation with the national-law citation when present. */
export function refWithNational(nis2: string, nationalCitation: string): string {
  if (!nationalCitation) return nis2;
  return `${nis2} / ${nationalCitation}`;
}

/** Subtitle used on register cover (PDF/Word) and InfoTips. */
export function registerSubtitle(country: string | null | undefined, lang: "de" | "en"): string {
  const law = getNationalLaw(country);
  if (law) {
    return lang === "en"
      ? `NIS2 Directive (EU) 2022/2555 — Art. 23  ·  national transposition: ${law.short} (${law.country})`
      : `NIS2-Richtlinie (EU) 2022/2555 — Art. 23  ·  nationale Umsetzung: ${law.short} (${law.country})`;
  }
  return lang === "en"
    ? "NIS2 Directive (EU) 2022/2555 — Art. 23"
    : "NIS2-Richtlinie (EU) 2022/2555 — Art. 23";
}
