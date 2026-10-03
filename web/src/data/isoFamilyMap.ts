// OTOMATİK ÜRETİLDİ — ISO-Referenz → capability (familyId), abgeleitet aus der
// kuratierten controlMetadata (familyId) via ISO-Anker (Mehrheitsvotum). Erweitert die
// Risiko-Stufen-Zuordnung im Audit von ~7% auf alle ISO-verankerten Kontrollen.
// Kein Raten — Propagation der menschlich kuratierten Family-Zuordnungen über den ISO-Hub.
//
// S1 (2026-09-13): Schlüssel ist jetzt die ISO-27001:2022-REFERENZ ("A.5.7", "6.1.2"),
// nicht mehr die alte Katalog-Id ("a5-15"). Grund: control_iso.iso_id führt seit S1 die
// Referenz selbst. Die alten Ids waren mehrdeutig — "a5-15" war bei BSI/KRITIS/DORA/
// MaRisk/TISAX die 15. Prüffrage (= A.5.7 Threat Intelligence), bei SOC2/CRA/GDPR & Co.
// dagegen die Annex-Nummer A.5.15 (Zugangssteuerung). Mehrere Prüffragen derselben
// Kontrolle wurden per Mehrheitsvotum zusammengeführt.

import { isoEntry } from "@/data/isoAnnexMap";

export const ISO_FAMILY_BY_REF: Record<string, string> = {
  "A.5.1": "governance",
  "A.5.2": "governance",
  "A.5.3": "governance",
  "A.5.4": "governance",
  "A.5.7": "risk_mgmt",
  "A.5.8": "risk_mgmt",
  "A.5.9": "asset_mgmt",
  "A.5.10": "asset_mgmt",
  "A.5.11": "asset_mgmt",
  "A.5.12": "asset_mgmt",
  "A.5.13": "asset_mgmt",
  "A.5.14": "asset_mgmt",
  "A.5.15": "identity_access_mgmt",
  "A.5.16": "identity_access_mgmt",
  "A.5.17": "identity_access_mgmt",
  "A.5.18": "identity_access_mgmt",
  "A.5.19": "supplier_security",
  "A.5.20": "supplier_security",
  "A.5.21": "supplier_security",
  "A.5.22": "supplier_security",
  "A.5.23": "supplier_security",
  "A.5.24": "incident_mgmt",
  "A.5.25": "incident_mgmt",
  "A.5.26": "incident_mgmt",
  "A.5.27": "incident_mgmt",
  "A.5.28": "incident_mgmt",
  "A.5.29": "business_continuity",
  "A.5.30": "business_continuity",
  "A.5.31": "compliance_audit",
  "A.5.32": "compliance_audit",
  "A.5.33": "compliance_audit",
  "A.5.34": "compliance_audit",
  "A.5.35": "compliance_audit",
  "A.5.36": "compliance_audit",
  "A.5.37": "compliance_audit",
  "A.6.1": "awareness_training",
  "A.6.2": "awareness_training",
  "A.6.3": "awareness_training",
  "A.6.4": "awareness_training",
  "A.6.5": "awareness_training",
  "A.6.6": "awareness_training",
  "A.6.7": "awareness_training",
  "A.6.8": "awareness_training",
  "A.7.1": "physical_security",
  "A.7.2": "physical_security",
  "A.7.3": "physical_security",
  "A.7.4": "physical_security",
  "A.7.5": "physical_security",
  "A.7.6": "physical_security",
  "A.7.7": "physical_security",
  "A.7.8": "physical_security",
  "A.7.9": "physical_security",
  "A.7.10": "physical_security",
  "A.7.11": "physical_security",
  "A.7.12": "physical_security",
  "A.7.13": "physical_security",
  "A.7.14": "physical_security",
  "A.8.1": "endpoint_security",
  "A.8.2": "endpoint_security",
  "A.8.3": "endpoint_security",
  "A.8.4": "endpoint_security",
  "A.8.5": "endpoint_security",
  "A.8.6": "vulnerability_mgmt",
  "A.8.7": "vulnerability_mgmt",
  "A.8.8": "vulnerability_mgmt",
  "A.8.9": "vulnerability_mgmt",
  "A.8.10": "vulnerability_mgmt",
  "A.8.11": "vulnerability_mgmt",
  "A.8.12": "vulnerability_mgmt",
  "A.8.13": "vulnerability_mgmt",
  "A.8.14": "vulnerability_mgmt",
  "A.8.15": "network_security",
  "A.8.16": "network_security",
  "A.8.17": "network_security",
  "A.8.18": "network_security",
  "A.8.19": "network_security",
  "A.8.20": "network_security",
  "A.8.21": "network_security",
  "A.8.22": "network_security",
  "A.8.23": "network_security",
  "A.8.24": "cryptography",
  "A.8.25": "cryptography",
  "A.8.26": "cryptography",
  "A.8.27": "cryptography",
  "A.8.28": "cryptography",
  "A.8.29": "cryptography",
  "A.8.30": "cryptography",
  "A.8.31": "cryptography",
  "A.8.32": "cryptography",
  "A.8.33": "cryptography",
  "A.8.34": "cryptography"
};

// ISO/IEC 27001 Managementsystem-Klauseln 4–10 → Capability (autoritativ aus der Normstruktur).
// c4 Kontext / c5 Führung / c7 Unterstützung = Governance; c6 Planung / c8 Betrieb = Risikomanagement;
// c9 Bewertung / c10 Verbesserung = Audit/KVP. Deckt die c-Anker ab, die kuratierte Annex-A-Kontrollen
// nicht berühren (v. a. BSI-Crosswalk → 100 % BSI-Abdeckung).
const CLAUSE_FAMILY: Record<string, string> = {
  c4: "governance", c5: "governance", c6: "risk_mgmt", c7: "governance",
  c8: "risk_mgmt", c9: "compliance_audit", c10: "compliance_audit",
};

/** Klausel-Referenz ("6.1.2", "4.3") → Family über die Kapitelnummer. */
function familyFromClauseRef(ref: string): string | undefined {
  const m = /^(\d+)\./.exec(ref);
  return m ? CLAUSE_FAMILY["c" + m[1]] : undefined;
}

/**
 * Capability/Family einer Kontrolle aus ihren ISO-Ankern.
 *
 * Zwei Eingangsformate, beide kommen im Audit-Workbench zusammen:
 *   • control_iso.iso_id  — seit S1 die Referenz selbst ("A.5.15", "6.1.2")
 *   • controls.meta.iso_ids — v7-Kontroll-Ids des ISO-Katalogs ("C29.4", "BC-BIA"),
 *     die erst über isoAnnexMap auf ihre Referenz gebracht werden müssen.
 */
export function familyFromIsoIds(isoIds: string[] | undefined | null): string | null {
  if (!isoIds || !isoIds.length) return null;
  const c: Record<string, number> = {};
  for (const raw of isoIds) {
    const i = String(raw ?? "").trim();
    if (!i) continue;
    // 1) Referenz-Raum: "A.5.15" (Annex) / "6.1.2" (Klausel)
    let f: string | undefined = ISO_FAMILY_BY_REF[i] ?? (/^\d/.test(i) ? familyFromClauseRef(i) : undefined);
    // 2) v7-Kontroll-Id → Referenz → Family
    if (!f) {
      const ref = isoEntry(i)?.ref;
      if (ref) f = ISO_FAMILY_BY_REF[ref] ?? (/^\d/.test(ref) ? familyFromClauseRef(ref) : undefined);
    }
    if (f) c[f] = (c[f] ?? 0) + 1;
  }
  let best: string | null = null, bestN = 0;
  for (const [f, n] of Object.entries(c)) if (n > bestN) { best = f; bestN = n; }
  return best;
}
