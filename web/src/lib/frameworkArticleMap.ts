/**
 * frameworkArticleMap — cross-regulation article map keyed by capability tag.
 *
 * Lifted from the NIS2Suite riskReportNarrative content library so the same
 * regulator-facing citations power UniqSuite's gap and (later) risk reports.
 */

import type { CapabilityTag } from "./capabilityMap";

export interface RegulatoryRefs {
  nis2: string[];
  gdpr: string[];
  dora: string[];
  kritis: string[];
  iso: string[];
}

const T: Record<CapabilityTag, RegulatoryRefs> = {
  governance:           { nis2: ["Art. 20", "Art. 21(1)"],           gdpr: ["Art. 5(2)", "Art. 24"],         dora: ["Art. 5"],             kritis: [],                iso: ["4.1", "5.1", "5.3"] },
  risk_mgmt:            { nis2: ["Art. 21(1)", "Art. 21(2)(a)"],     gdpr: ["Art. 32(1)", "Art. 35"],        dora: ["Art. 6", "Art. 8"],   kritis: ["§ 8a BSIG"],     iso: ["6.1", "8.2", "8.3"] },
  asset_mgmt:           { nis2: ["Art. 21(2)(a)"],                   gdpr: ["Art. 30"],                      dora: ["Art. 8(1)"],          kritis: ["§ 8a BSIG"],     iso: ["A.5.9", "A.5.10", "A.5.12"] },
  identity_access_mgmt: { nis2: ["Art. 21(2)(i)", "Art. 21(2)(j)"],  gdpr: ["Art. 32(1)(b)"],                dora: ["Art. 9(4)(c)"],       kritis: [],                iso: ["A.5.15", "A.5.16", "A.5.17", "A.5.18"] },
  supplier_security:    { nis2: ["Art. 21(2)(d)", "Art. 22"],        gdpr: ["Art. 28"],                      dora: ["Art. 28-30"],         kritis: [],                iso: ["A.5.19", "A.5.20", "A.5.21"] },
  incident_mgmt:        { nis2: ["Art. 21(2)(b)", "Art. 23"],        gdpr: ["Art. 33", "Art. 34"],           dora: ["Art. 17-23"],         kritis: ["§ 8b BSIG"],     iso: ["A.5.24", "A.5.25", "A.5.26"] },
  business_continuity:  { nis2: ["Art. 21(2)(c)"],                   gdpr: ["Art. 32(1)(c)"],                dora: ["Art. 11", "Art. 12"], kritis: [],                iso: ["A.5.29", "A.5.30", "A.8.13", "A.8.14"] },
  compliance_audit:     { nis2: ["Art. 21(2)(f)", "Art. 32"],        gdpr: ["Art. 5(2)", "Art. 24(1)"],      dora: ["Art. 6(5)"],          kritis: [],                iso: ["9.2", "9.3", "A.5.35"] },
  awareness_training:   { nis2: ["Art. 21(2)(g)", "Art. 20(2)"],     gdpr: ["Art. 39(1)(b)"],                dora: ["Art. 13(6)"],         kritis: [],                iso: ["7.2", "7.3", "A.6.3"] },
  network_security:     { nis2: ["Art. 21(2)(e)"],                   gdpr: ["Art. 32(1)(b)"],                dora: ["Art. 9(2)"],          kritis: [],                iso: ["A.8.20", "A.8.21", "A.8.22", "A.8.23"] },
  endpoint_security:    { nis2: ["Art. 21(2)(e)"],                   gdpr: ["Art. 32(1)(b)"],                dora: ["Art. 9(2)"],          kritis: [],                iso: ["A.8.1", "A.8.7", "A.8.8"] },
  vulnerability_mgmt:   { nis2: ["Art. 21(2)(e)", "Art. 21(2)(f)"],  gdpr: ["Art. 32(1)(d)"],                dora: ["Art. 10"],            kritis: [],                iso: ["A.8.8", "A.8.9"] },
  cryptography:         { nis2: ["Art. 21(2)(h)"],                   gdpr: ["Art. 32(1)(a)"],                dora: ["Art. 9(4)(b)"],       kritis: [],                iso: ["A.8.24"] },
  monitoring_logging:   { nis2: ["Art. 21(2)(b)", "Art. 23"],        gdpr: ["Art. 32(1)(d)", "Art. 33(5)"],  dora: ["Art. 10(1)"],         kritis: ["§ 8a BSIG"],     iso: ["A.8.15", "A.8.16", "A.8.17"] },
  data_protection:      { nis2: ["Art. 21(2)(h)"],                   gdpr: ["Art. 5", "Art. 25", "Art. 32"], dora: ["Art. 9(4)(b)"],       kritis: [],                iso: ["A.5.33", "A.5.34", "A.8.11"] },
  personnel_security:   { nis2: ["Art. 21(2)(i)"],                   gdpr: ["Art. 29", "Art. 32(4)"],        dora: ["Art. 13"],            kritis: [],                iso: ["A.6.1", "A.6.2", "A.6.5"] },
  physical_security:    { nis2: ["Art. 21(2)(c)", "Art. 21(2)(e)"],  gdpr: ["Art. 32(1)(b)"],                dora: ["Art. 9(3)"],          kritis: [],                iso: ["A.7.1", "A.7.2", "A.7.4"] },
  secure_development:   { nis2: ["Art. 21(2)(e)"],                   gdpr: ["Art. 25"],                      dora: ["Art. 8(2)", "Art. 16"], kritis: [],              iso: ["A.8.25", "A.8.28", "A.8.29"] },
};

export function articlesFor(cap: CapabilityTag): RegulatoryRefs {
  return T[cap] ?? { nis2: [], gdpr: [], dora: [], kritis: [], iso: [] };
}

/** Returns article citations relevant to the scoped frameworks only. */
export function scopedArticles(cap: CapabilityTag, scopedFrameworks: string[]): string[] {
  const refs = articlesFor(cap);
  const out: string[] = [];
  const has = (fw: string) => scopedFrameworks.some(f => f.toUpperCase().includes(fw));
  if (has("NIS2"))                     refs.nis2.forEach(a => out.push(`NIS2 ${a}`));
  if (has("GDPR") || has("DSGVO") || has("27701")) refs.gdpr.forEach(a => out.push(`GDPR ${a}`));
  if (has("DORA"))                     refs.dora.forEach(a => out.push(`DORA ${a}`));
  if (has("KRITIS") || has("BSI"))     refs.kritis.forEach(a => out.push(a));
  return out.slice(0, 4);
}

/** Capability-specific, single-sentence executive recommendation. */
const CAP_RECOMMENDATION: Record<CapabilityTag, { de: string; en: string }> = {
  governance:           { de: "Verantwortlichkeiten, Leitlinien und Berichtswege auf Geschäftsleitungsebene formal verankern und jährlich überprüfen.", en: "Formally anchor responsibilities, policies and reporting lines at executive level and review annually." },
  risk_mgmt:            { de: "Risikomanagementprozess mit klaren Kriterien, Risikoeignerschaft und periodischer Neubewertung etablieren.", en: "Establish a risk management process with clear criteria, risk ownership and periodic re-assessment." },
  asset_mgmt:           { de: "Vollständiges, klassifiziertes Asset-Inventar mit Eigentümern und Schutzbedarf aufbauen und laufend pflegen.", en: "Build and maintain a complete, classified asset inventory with owners and protection needs." },
  identity_access_mgmt: { de: "Least-Privilege, MFA für privilegierte Konten und periodische Zugriffsrezertifizierungen verbindlich umsetzen.", en: "Enforce least-privilege, MFA for privileged accounts and periodic access recertifications." },
  supplier_security:    { de: "Lieferantenrisiken, vertragliche Sicherheitsanforderungen und Nachweise zentral steuern.", en: "Centrally manage supplier risks, contractual security requirements and evidence." },
  incident_mgmt:        { de: "Vorfallprozess mit 24/72h-Meldepflichten, Eskalation und regelmäßigen Tabletop-Übungen operationalisieren.", en: "Operationalise an incident process with 24/72h reporting, escalation and regular tabletop exercises." },
  business_continuity:  { de: "BIA, RTO/RPO und getestete Wiederanlaufpläne für kritische Dienste etablieren.", en: "Establish BIA, RTO/RPO and tested recovery plans for critical services." },
  compliance_audit:     { de: "Internes Audit- und Wirksamkeitsprüfprogramm mit Maßnahmen-Tracking einrichten.", en: "Set up an internal audit and effectiveness program with action tracking." },
  personnel_security:   { de: "Pre-Employment-Checks, Vertraulichkeitsverpflichtungen und Offboarding-Prozesse durchsetzen.", en: "Enforce pre-employment checks, confidentiality obligations and offboarding processes." },
  awareness_training:   { de: "Verbindliches, rollenbasiertes Awareness-Programm mit Phishing-Simulationen und Nachweispflicht ausrollen.", en: "Roll out a mandatory, role-based awareness program with phishing simulations and evidence." },
  physical_security:    { de: "Zutrittskontrollen, Besucherregelungen und Schutz der Versorgungsinfrastruktur dokumentiert umsetzen.", en: "Document and implement access controls, visitor rules and protection of supply infrastructure." },
  endpoint_security:    { de: "Hardening, EDR und zentrales Patch-Management auf allen Endgeräten flächendeckend durchsetzen.", en: "Enforce hardening, EDR and centralised patch management across all endpoints." },
  network_security:     { de: "Segmentierung, Egress-Kontrolle und sichere Remote-Zugänge nach Zero-Trust-Prinzipien umsetzen.", en: "Implement segmentation, egress control and secure remote access following zero-trust principles." },
  cryptography:         { de: "Krypto-Inventar, Schlüsselmanagement-Prozess und Verschlüsselung at-rest/in-transit verbindlich regeln.", en: "Govern crypto inventory, key management and at-rest/in-transit encryption." },
  vulnerability_mgmt:   { de: "Regelmäßige Scans, SLA-basiertes Patching und Verifikation für kritische Schwachstellen etablieren.", en: "Establish regular scans, SLA-based patching and verification for critical vulnerabilities." },
  secure_development:   { de: "SSDLC, Code-Review und Abhängigkeits-/Container-Scanning in die Pipelines integrieren.", en: "Integrate SSDLC, code review and dependency/container scanning into pipelines." },
  monitoring_logging:   { de: "Zentrales Logging, SIEM-Korrelation und 24/7-Detektionsfähigkeit für kritische Systeme sicherstellen.", en: "Ensure central logging, SIEM correlation and 24/7 detection capability for critical systems." },
  data_protection:      { de: "Datenklassifizierung, DLP und Aufbewahrungs-/Löschkonzepte konsequent umsetzen.", en: "Consistently implement data classification, DLP and retention/deletion concepts." },
};

export function recommendationFor(cap: CapabilityTag, de: boolean): string {
  return de ? CAP_RECOMMENDATION[cap].de : CAP_RECOMMENDATION[cap].en;
}

/** Timeline bucket (days-to-action) for a capability. Governance/incident/BCM
 *  push earlier; secure-dev/awareness push later. */
export function timelineBucketFor(cap: CapabilityTag, isCritical: boolean): 30 | 90 | 180 | 365 {
  if (isCritical) return 30;
  const early: CapabilityTag[]  = ["governance", "incident_mgmt", "risk_mgmt", "identity_access_mgmt"];
  const middle: CapabilityTag[] = ["asset_mgmt", "business_continuity", "supplier_security", "monitoring_logging", "vulnerability_mgmt"];
  const late: CapabilityTag[]   = ["cryptography", "data_protection", "network_security", "endpoint_security", "physical_security", "personnel_security"];
  if (early.includes(cap)) return 30;
  if (middle.includes(cap)) return 90;
  if (late.includes(cap)) return 180;
  return 365;
}
