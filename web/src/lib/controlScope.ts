/**
 * controlScope — heuristic classification of a control into Organization vs Asset scope.
 *
 * Rationale (based on Vanta/Drata/OneTrust patterns): a control is either
 * governed once for the whole ISMS (policies, training, supplier mgmt) or
 * exercised per asset (MFA, patching, backup, hardening). We show a small
 * "Org" / "Asset" / "Beide" badge next to each control so the user knows
 * whether their answer covers everything or should later be differentiated
 * per asset. Inference uses framework-native prefixes + tag hints — no DB
 * changes required.
 */

import type { ControlRow } from "./assessmentEngine";

export type ControlScopeKind = "org" | "asset" | "mixed";

export function inferControlScope(c: ControlRow): ControlScopeKind {
  // Live-ISO-IDs kommen als „a5-15" / „c6-05" — in das Annex-A-Themenformat
  // „A.5.15" normalisieren, damit die ISO-Regexe unten überhaupt greifen
  // (sonst fällt alles auf „mixed"/Beide).
  const id = (c.id ?? "").toUpperCase().replace(/^([AC])(\d+)-(\d+)$/, "$1.$2.$3");
  const tags = new Set((c.tags ?? []).map(t => t.toLowerCase()));

  // Explicit tag hints win
  if (tags.has("asset") || tags.has("technical") || tags.has("technisch")) return "asset";
  if (tags.has("organization") || tags.has("organisation") ||
      tags.has("governance") || tags.has("policy") || tags.has("policies") ||
      tags.has("process") || tags.has("prozess")) return "org";

  // ISO/IEC 27001 Annex A (2022) themes
  if (/^A\.5\./.test(id) || /^A\.6\./.test(id)) return "org";       // Organizational + People
  if (/^A\.7\./.test(id)) return "asset";                            // Physical
  if (/^A\.8\./.test(id)) return "asset";                            // Technological

  // BSI IT-Grundschutz: prefix families
  if (/^(ISMS|ORP|CON|OPS|DER)\./.test(id)) return "org";
  if (/^(SYS|APP|NET|IND|INF)\./.test(id)) return "asset";

  // NIST CSF 2.0 functions
  if (/^GV\./.test(id) || /^ID\./.test(id)) return "org";
  if (/^PR\./.test(id) || /^DE\./.test(id) || /^RS\./.test(id) || /^RC\./.test(id)) return "mixed";

  // NIS2 article 21(2) sub-points
  // (a) risk analysis, (b) incident handling, (c) BCM, (e) supply chain,
  // (i) HR/access policies — organizational.
  // (d) supply chain security posture, (f) vuln disclosure, (g) crypto,
  // (h) access control, (j) MFA/comms — asset-touching.
  const nis2 = id.match(/^NIS2[-_]?21[-_]?2[-_]?([A-J])$/);
  if (nis2) {
    if ("ABCEI".includes(nis2[1])) return "org";
    return "asset";
  }

  // DORA chapters
  if (/^DORA[-_]?(GOV|GOVERNANCE|RISK|INCIDENT|3RD|THIRD)/.test(id)) return "org";
  if (/^DORA[-_]?(ICT|CRYPTO|IAM|LOGGING|NETWORK)/.test(id)) return "asset";

  // GDPR / AI Act / privacy — org by default (policy/process heavy)
  if (id.startsWith("GDPR") || id.startsWith("AIACT") || id.startsWith("ISO27701")) return "org";

  return "mixed";
}

export function scopeLabel(k: ControlScopeKind, de: boolean): string {
  if (k === "org")   return de ? "Organisation" : "Organization";
  if (k === "asset") return de ? "Asset"        : "Asset";
  return de ? "Beide" : "Both";
}

export function scopeTooltip(k: ControlScopeKind, de: boolean): string {
  if (k === "org") {
    return de
      ? "Diese Kontrolle wird einmalig auf ISMS-Ebene beantwortet (Richtlinien, Prozesse, Governance)."
      : "Answered once at the ISMS level (policies, processes, governance).";
  }
  if (k === "asset") {
    return de
      ? "Diese Kontrolle wird pro Asset ausgeübt (z. B. MFA, Patching, Backup). Antwort gilt als Klassen-Default und kann später pro Asset überschrieben werden."
      : "Exercised per asset (e.g. MFA, patching, backup). Your answer is the class default and can be overridden per asset later.";
  }
  return de
    ? "Kontrolle hat organisatorische UND asset-bezogene Facetten (z. B. Access-Policy als Regel + technische MFA-Umsetzung)."
    : "Has both organizational AND asset facets (e.g. access policy as a rule + technical MFA enforcement).";
}
