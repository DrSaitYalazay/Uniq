/**
 * Mapping from ISO/IEC 27001:2022 Annex A controls to NIS2 Directive references.
 * Returns a short, citable reference string covering the relevant NIS2 articles
 * (mainly Art. 21(2) sub-letters and Art. 23) plus the German implementation

 *
/*
 * Used in roadmap / SoA / gap reports so every control shows a NIS2 reference
 * next to its ISO reference.
 */

const NIS2_BY_CONTROL: Record<string, string> = {
  // ===== A.5 Organizational =====
  "A.5.1":  "NIS2 Art. 21(2)(a), Art. 20",
  "A.5.2":  "NIS2 Art. 20, Art. 21(2)(a)",
  "A.5.3":  "NIS2 Art. 21(2)(a)(i)",
  "A.5.4":  "NIS2 Art. 20(1)(2)",
  "A.5.5":  "NIS2 Art. 23(1)(4)",
  "A.5.6":  "NIS2 Art. 29 (Informationsaustausch)",
  "A.5.7":  "NIS2 Art. 21(2)(a), Art. 29",
  "A.5.8":  "NIS2 Art. 21(2)(e)",
  "A.5.9":  "NIS2 Art. 21(2)(i)",
  "A.5.10": "NIS2 Art. 21(2)(i)",
  "A.5.11": "NIS2 Art. 21(2)(i)",
  "A.5.12": "NIS2 Art. 21(2)(i)",
  "A.5.13": "NIS2 Art. 21(2)(i)",
  "A.5.14": "NIS2 Art. 21(2)(j) (sichere Kommunikation)",
  "A.5.15": "NIS2 Art. 21(2)(i) (Zugangskontrolle)",
  "A.5.16": "NIS2 Art. 21(2)(i), (j)",
  "A.5.17": "NIS2 Art. 21(2)(j) (MFA)",
  "A.5.18": "NIS2 Art. 21(2)(i)",
  "A.5.19": "NIS2 Art. 21(2)(d) (Lieferkette)",
  "A.5.20": "NIS2 Art. 21(2)(d)",
  "A.5.21": "NIS2 Art. 21(2)(d), Art. 22",
  "A.5.22": "NIS2 Art. 21(2)(d)",
  "A.5.23": "NIS2 Art. 21(2)(d), (e)",
  "A.5.24": "NIS2 Art. 21(2)(b), Art. 23",
  "A.5.25": "NIS2 Art. 21(2)(b), Art. 23",
  "A.5.26": "NIS2 Art. 21(2)(b), Art. 23",
  "A.5.27": "NIS2 Art. 21(2)(b), Art. 23(4)",
  "A.5.28": "NIS2 Art. 21(2)(b), Art. 23",
  "A.5.29": "NIS2 Art. 21(2)(c) (BC)",
  "A.5.30": "NIS2 Art. 21(2)(c) (Krisenmanagement)",
  "A.5.31": "NIS2 Art. 21(1) (Aufsicht)",
  "A.5.32": "NIS2 Art. 21(2)(a)",
  "A.5.33": "NIS2 Art. 21(2)(a), Art. 32",
  "A.5.34": "NIS2 Erwägungsgrund 121, DSGVO Art. 32",
  "A.5.35": "NIS2 Art. 21(2)(f) (Wirksamkeitsbewertung)",
  "A.5.36": "NIS2 Art. 21(2)(f), Art. 32",
  "A.5.37": "NIS2 Art. 21(2)(a)",
  // ===== A.6 People =====
  "A.6.1":  "NIS2 Art. 21(2)(i) (HR-Sicherheit)",
  "A.6.2":  "NIS2 Art. 21(2)(i)",
  "A.6.3":  "NIS2 Art. 21(2)(g) (Cyberhygiene & Schulung), Art. 20(2)",
  "A.6.4":  "NIS2 Art. 21(2)(i)",
  "A.6.5":  "NIS2 Art. 21(2)(i)",
  "A.6.6":  "NIS2 Art. 21(2)(i)",
  "A.6.7":  "NIS2 Art. 21(2)(g), (i)",
  "A.6.8":  "NIS2 Art. 21(2)(b), Art. 23 (Meldepflicht)",
  // ===== A.7 Physical =====
  "A.7.1":  "NIS2 Art. 21(2)(e) (physische Sicherheit)",
  "A.7.2":  "NIS2 Art. 21(2)(e)",
  "A.7.3":  "NIS2 Art. 21(2)(e)",
  "A.7.4":  "NIS2 Art. 21(2)(e)",
  "A.7.5":  "NIS2 Art. 21(2)(c), (e) (Umweltbedrohungen)",
  "A.7.6":  "NIS2 Art. 21(2)(e)",
  "A.7.7":  "NIS2 Art. 21(2)(g)",
  "A.7.8":  "NIS2 Art. 21(2)(e)",
  "A.7.9":  "NIS2 Art. 21(2)(e), (i)",
  "A.7.10": "NIS2 Art. 21(2)(i) (Medien)",
  "A.7.11": "NIS2 Art. 21(2)(c) (Versorgung)",
  "A.7.12": "NIS2 Art. 21(2)(e)",
  "A.7.13": "NIS2 Art. 21(2)(e)",
  "A.7.14": "NIS2 Art. 21(2)(i) (sichere Entsorgung)",
  // ===== A.8 Technological =====
  "A.8.1":  "NIS2 Art. 21(2)(i) (Endgeräte)",
  "A.8.2":  "NIS2 Art. 21(2)(i), (j) (privilegierte Zugriffe)",
  "A.8.3":  "NIS2 Art. 21(2)(i)",
  "A.8.4":  "NIS2 Art. 21(2)(e)",
  "A.8.5":  "NIS2 Art. 21(2)(j) (sichere Authentifizierung / MFA)",
  "A.8.6":  "NIS2 Art. 21(2)(c) (Kapazität)",
  "A.8.7":  "NIS2 Art. 21(2)(g) (Malware-Schutz)",
  "A.8.8":  "NIS2 Art. 21(2)(e) (Schwachstellenmanagement)",
  "A.8.9":  "NIS2 Art. 21(2)(e), (a)",
  "A.8.10": "NIS2 Art. 21(2)(i)",
  "A.8.11": "NIS2 Art. 21(2)(h) (Pseudonymisierung)",
  "A.8.12": "NIS2 Art. 21(2)(e), (i)",
  "A.8.13": "NIS2 Art. 21(2)(c) (Backup)",
  "A.8.14": "NIS2 Art. 21(2)(c) (Redundanz)",
  "A.8.15": "NIS2 Art. 21(2)(b), (f) (Protokollierung)",
  "A.8.16": "NIS2 Art. 21(2)(b), (f) (Monitoring)",
  "A.8.17": "NIS2 Art. 21(2)(b)",
  "A.8.18": "NIS2 Art. 21(2)(i)",
  "A.8.19": "NIS2 Art. 21(2)(e)",
  "A.8.20": "NIS2 Art. 21(2)(e) (Netzwerksicherheit)",
  "A.8.21": "NIS2 Art. 21(2)(e)",
  "A.8.22": "NIS2 Art. 21(2)(e) (Segmentierung)",
  "A.8.23": "NIS2 Art. 21(2)(e), (g)",
  "A.8.24": "NIS2 Art. 21(2)(h) (Kryptographie)",
  "A.8.25": "NIS2 Art. 21(2)(e) (sicherer SDLC)",
  "A.8.26": "NIS2 Art. 21(2)(e)",
  "A.8.27": "NIS2 Art. 21(2)(e)",
  "A.8.28": "NIS2 Art. 21(2)(e)",
  "A.8.29": "NIS2 Art. 21(2)(e), (f)",
  "A.8.30": "NIS2 Art. 21(2)(d), (e)",
  "A.8.31": "NIS2 Art. 21(2)(e)",
  "A.8.32": "NIS2 Art. 21(2)(e) (Änderungsmgmt)",
  "A.8.33": "NIS2 Art. 21(2)(e), (i)",
  "A.8.34": "NIS2 Art. 21(2)(f)",
};

const NIS2_BY_THEME: Record<string, string> = {
  "A.5": "NIS2 Art. 21(2)(a) (Governance & Policies)",
  "A.6": "NIS2 Art. 21(2)(g), (i) (Personal & Schulung)",
  "A.7": "NIS2 Art. 21(2)(e) (physische Sicherheit)",
  "A.8": "NIS2 Art. 21(2)(e), (i) (technische Maßnahmen)",
};

/** Returns the NIS2 reference for an ISO control or theme. */
export function mapIsoToNis2(isoRef?: string | null): string {
  if (!isoRef) return "NIS2 Art. 21(2) (Risikomanagementmaßnahmen)";
  const direct = NIS2_BY_CONTROL[isoRef];
  if (direct) return direct;
  const theme = isoRef.match(/^A\.\d+/)?.[0];
  if (theme && NIS2_BY_THEME[theme]) return NIS2_BY_THEME[theme];
  return "NIS2 Art. 21(2)";
}
