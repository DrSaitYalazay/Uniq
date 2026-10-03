/**
 * capabilityMap — maps any framework control_id to a canonical capability tag.
 *
 * We use capability tags (governance, iam, incident_mgmt, …) as the join key
 * between gap findings and reusable content (recommendation sentences,
 * regulatory article mappings, timeline buckets). This keeps the same
 * narrative logic working across ISO 27001, NIS2, BSI, DORA, NIST CSF, …
 *
 * The inference order is:
 *   1. explicit `capability_tag` in control.meta (highest priority)
 *   2. framework-specific prefix rules (ISO A.5.x, NIS2 Art., NIST GV.OC.x)
 *   3. keyword scan of the requirement text (fallback)
 *   4. "risk_mgmt" default (never returns empty)
 */

import type { ControlRow } from "./assessmentEngine";

export type CapabilityTag =
  | "governance" | "risk_mgmt" | "asset_mgmt" | "identity_access_mgmt"
  | "supplier_security" | "incident_mgmt" | "business_continuity"
  | "compliance_audit" | "awareness_training" | "network_security"
  | "endpoint_security" | "vulnerability_mgmt" | "cryptography"
  | "monitoring_logging" | "data_protection" | "personnel_security"
  | "physical_security" | "secure_development";

const CAP_HUMAN: Record<CapabilityTag, { de: string; en: string }> = {
  governance:           { de: "Governance & Leitung",            en: "Governance & Leadership" },
  risk_mgmt:            { de: "Risikomanagement",                en: "Risk Management" },
  asset_mgmt:           { de: "Asset-Management",                en: "Asset Management" },
  identity_access_mgmt: { de: "Identitäts- & Zugriffskontrolle", en: "Identity & Access Management" },
  supplier_security:    { de: "Lieferantensicherheit",           en: "Supplier Security" },
  incident_mgmt:        { de: "Incident Management",             en: "Incident Management" },
  business_continuity:  { de: "Business Continuity",             en: "Business Continuity" },
  compliance_audit:     { de: "Compliance & Audit",              en: "Compliance & Audit" },
  awareness_training:   { de: "Awareness & Schulung",            en: "Awareness & Training" },
  network_security:     { de: "Netzwerksicherheit",              en: "Network Security" },
  endpoint_security:    { de: "Endpoint-Sicherheit",             en: "Endpoint Security" },
  vulnerability_mgmt:   { de: "Schwachstellenmanagement",        en: "Vulnerability Management" },
  cryptography:         { de: "Kryptografie",                    en: "Cryptography" },
  monitoring_logging:   { de: "Monitoring & Logging",            en: "Monitoring & Logging" },
  data_protection:      { de: "Datenschutz & -sicherheit",       en: "Data Protection" },
  personnel_security:   { de: "Personalsicherheit",              en: "Personnel Security" },
  physical_security:    { de: "Physische Sicherheit",            en: "Physical Security" },
  secure_development:   { de: "Sichere Entwicklung",             en: "Secure Development" },
};

export function humanCap(tag: CapabilityTag, de: boolean): string {
  return CAP_HUMAN[tag] ? (de ? CAP_HUMAN[tag].de : CAP_HUMAN[tag].en) : tag;
}

// ── ISO/IEC 27001 Annex A prefix map (A.5.x) ───────────────────────────────
// Chapter 5 = Organizational, 6 = People, 7 = Physical, 8 = Technological.
const ISO_A5_MAP: Record<string, CapabilityTag> = {
  "A.5.1": "governance", "A.5.2": "governance", "A.5.3": "governance",
  "A.5.4": "governance", "A.5.5": "governance", "A.5.6": "supplier_security",
  "A.5.7": "risk_mgmt",  "A.5.8": "risk_mgmt",  "A.5.9": "asset_mgmt",
  "A.5.10": "asset_mgmt","A.5.11": "asset_mgmt","A.5.12": "asset_mgmt",
  "A.5.13": "asset_mgmt","A.5.14": "data_protection","A.5.15": "identity_access_mgmt",
  "A.5.16": "identity_access_mgmt","A.5.17": "identity_access_mgmt",
  "A.5.18": "identity_access_mgmt","A.5.19": "supplier_security",
  "A.5.20": "supplier_security","A.5.21": "supplier_security",
  "A.5.22": "supplier_security","A.5.23": "supplier_security",
  "A.5.24": "incident_mgmt","A.5.25": "incident_mgmt","A.5.26": "incident_mgmt",
  "A.5.27": "incident_mgmt","A.5.28": "incident_mgmt","A.5.29": "business_continuity",
  "A.5.30": "business_continuity","A.5.31": "compliance_audit","A.5.32": "compliance_audit",
  "A.5.33": "data_protection","A.5.34": "data_protection","A.5.35": "compliance_audit",
  "A.5.36": "compliance_audit","A.5.37": "governance",
};

function isoTagFromId(id: string): CapabilityTag | null {
  if (ISO_A5_MAP[id]) return ISO_A5_MAP[id];
  if (id.startsWith("A.6")) return "personnel_security";
  if (id.startsWith("A.7")) return "physical_security";
  if (id.startsWith("A.8.1") || id.startsWith("A.8.2") || id.startsWith("A.8.3")
      || id.startsWith("A.8.4") || id.startsWith("A.8.5")) return "endpoint_security";
  if (id.startsWith("A.8.6") || id.startsWith("A.8.7") || id.startsWith("A.8.8")
      || id.startsWith("A.8.9")) return "vulnerability_mgmt";
  if (id.startsWith("A.8.10") || id.startsWith("A.8.11") || id.startsWith("A.8.12")) return "data_protection";
  if (id.startsWith("A.8.13") || id.startsWith("A.8.14")) return "business_continuity";
  if (id.startsWith("A.8.15") || id.startsWith("A.8.16") || id.startsWith("A.8.17")) return "monitoring_logging";
  if (id.startsWith("A.8.18") || id.startsWith("A.8.19") || id.startsWith("A.8.20")
      || id.startsWith("A.8.21") || id.startsWith("A.8.22") || id.startsWith("A.8.23")) return "network_security";
  if (id.startsWith("A.8.24")) return "cryptography";
  if (id.startsWith("A.8.25") || id.startsWith("A.8.26") || id.startsWith("A.8.27")
      || id.startsWith("A.8.28") || id.startsWith("A.8.29") || id.startsWith("A.8.30")
      || id.startsWith("A.8.31") || id.startsWith("A.8.32") || id.startsWith("A.8.33")) return "secure_development";
  if (id.startsWith("A.8.34")) return "compliance_audit";
  return null;
}

// NIST CSF 2.0 function/category prefix map.
function nistTagFromId(id: string): CapabilityTag | null {
  const m = id.match(/NIST-([A-Z]{2})\.([A-Z]{2})/);
  if (!m) return null;
  const cat = `${m[1]}.${m[2]}`;
  const table: Record<string, CapabilityTag> = {
    "GV.OC": "governance", "GV.RM": "risk_mgmt", "GV.RR": "governance",
    "GV.PO": "governance", "GV.OV": "compliance_audit", "GV.SC": "supplier_security",
    "ID.AM": "asset_mgmt", "ID.RA": "risk_mgmt", "ID.IM": "risk_mgmt",
    "PR.AA": "identity_access_mgmt", "PR.AT": "awareness_training",
    "PR.DS": "data_protection", "PR.PS": "endpoint_security",
    "PR.IR": "network_security",
    "DE.CM": "monitoring_logging", "DE.AE": "monitoring_logging",
    "RS.MA": "incident_mgmt", "RS.AN": "incident_mgmt",
    "RS.CO": "incident_mgmt", "RS.MI": "incident_mgmt",
    "RC.RP": "business_continuity", "RC.CO": "business_continuity",
  };
  return table[cat] ?? null;
}

// Keyword scan fallback (DE + EN, order matters — more specific first).
const KEYWORD_RULES: Array<[RegExp, CapabilityTag]> = [
  [/\bmfa\b|zugriff|access|passwort|password|privileg|iam|identität|identity/i, "identity_access_mgmt"],
  [/lieferant|supplier|third[- ]?party|dienstleister|vendor/i, "supplier_security"],
  [/vorfall|incident|meldung|report(ing)?|24h|72h|krise/i, "incident_mgmt"],
  [/business.?continuity|bcm|bcp|rto|rpo|wiederanlauf|dr\b|disaster/i, "business_continuity"],
  [/awareness|schulung|training|phishing|sensibilis/i, "awareness_training"],
  [/netz|network|firewall|segment|vlan|zero.?trust/i, "network_security"],
  [/endpoint|edr|patch|hardening|malware|virenschutz|antivirus/i, "endpoint_security"],
  [/schwachstell|vulnerab|scan|pentest|cve/i, "vulnerability_mgmt"],
  [/krypto|crypto|encryption|verschlüssel|schlüssel|key mgmt/i, "cryptography"],
  [/log|siem|monitor|überwach|detection|alerting/i, "monitoring_logging"],
  [/personal|hr\b|hintergrund|background check|nda|offboarding/i, "personnel_security"],
  [/zutritt|physisch|physical|besucher|visitor|gelände|premise/i, "physical_security"],
  [/entwickl|develop|sdlc|ssdlc|code review|sast|dast|container/i, "secure_development"],
  [/datenschutz|privacy|gdpr|dsgvo|personenbezogen|personal data/i, "data_protection"],
  [/audit|prüfung|effektivität|effectiveness|internal audit/i, "compliance_audit"],
  [/asset|inventar|inventory|klassifi|classification/i, "asset_mgmt"],
  [/leit(ung|linie)|policy|governance|geschäftsleit|management commit|verantwort/i, "governance"],
  [/risiko|risk\b/i, "risk_mgmt"],
];

export function capabilityFor(ctrl: ControlRow): CapabilityTag {
  // 1. Explicit meta.capability_tag
  const meta = (ctrl as any).meta as Record<string, unknown> | undefined;
  const explicit = meta?.capability_tag;
  if (typeof explicit === "string" && explicit in CAP_HUMAN) return explicit as CapabilityTag;

  // 2. Prefix rules
  const id = ctrl.id;
  if (id.startsWith("A.")) {
    const t = isoTagFromId(id);
    if (t) return t;
  }
  if (id.startsWith("NIST-")) {
    const t = nistTagFromId(id);
    if (t) return t;
  }

  // 3. Keyword scan on requirement text
  const text = `${ctrl.req_de ?? ""} ${ctrl.req_en ?? ""}`;
  for (const [re, tag] of KEYWORD_RULES) if (re.test(text)) return tag;

  // 4. Fallback
  return "risk_mgmt";
}
