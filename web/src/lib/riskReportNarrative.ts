/**
 * Risk Report Narrative — deterministic text generators.
 *
 * No LLM, no randomness. Every sentence is derived from the engine result so
 * the same input always produces the same narrative. Used by riskReportPdf.ts
 * (and reusable for Word) to make reports executive-readable.
 */

import type { RiskAnalysisResult, RiskObject, RiskLevel, RiskMatrixConfig } from "@/lib/riskEngine";
import { scoreAndLevel, riskLevelLabel } from "@/lib/riskEngine";
import { effectiveResidualLI, acceptanceGateStatus, strategyLabel, STATUS_OPTIONS, type TreatmentObject } from "@/lib/treatmentEngine";
import { neutralizeNis2Text } from "@/lib/frameworkFlags";

type Lang = "de" | "en";

// ── Bericht-Neutralisierung ─────────────────────────────────────────────────
// (1) NIS2-Zitate entfallen, wenn NIS2 nicht aktiv ist (grammatiksicher via
//     neutralizeNis2Text). (2) Tool-interne „Schritt N" / „Step N" verweise
//     gehören nicht in den Kundenbericht → Phasennamen bzw. Parenthese entfernen.
const PHASE_DE: Record<string, string> = {
  "7": "Gap-Analyse", "9": "Risikobehandlung", "10": "SoA", "11": "Reifegradanalyse",
  "12": "Umsetzung", "14": "Richtlinien", "16": "KPI-Überwachung", "17": "internen Audit", "18": "KVP",
};
const PHASE_EN: Record<string, string> = {
  "7": "gap analysis", "9": "risk treatment", "10": "SoA", "11": "maturity analysis",
  "12": "implementation", "14": "policies", "16": "KPI monitoring", "17": "internal audit", "18": "CIP",
};
function stripStepRefs(text: string): string {
  return text
    // „ (Schritt 7)" / „ (Step 7)" — Parenthese ganz entfernen
    .replace(/\s*\((?:Schritt|Step)\s*\d+\)/gi, "")
    // Bare „Schritt N" / „Step N" → Phasenname
    .replace(/\bSchritt\s*(\d+)\b/gi, (_m, n: string) => PHASE_DE[n] ?? "der nächsten Phase")
    .replace(/\bStep\s*(\d+)\b/gi, (_m, n: string) => PHASE_EN[n] ?? "the next phase")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}
function nz(text: string): string {
  return stripStepRefs(neutralizeNis2Text(text));
}

// ── Capability label translation (DE labels are already on the gap object) ──
function capLabel(risk: RiskObject, lang: Lang): string {
  // capability_tag is a stable id; gap_title carries the human label.
  // For grouping we use the tag, for display we fall back to first 3 words of title.
  if (lang === "de") {
    const t = risk.gap_title.split(":")[0];
    return t.length > 0 ? t : risk.capability_tag;
  }
  const t = risk.gap_title_en.split(":")[0];
  return t.length > 0 ? t : risk.capability_tag;
}

// ─────────────────────────────────────────────────────────────────────────
// 1. Executive narrative — 3-5 sentences derived from real data
// ─────────────────────────────────────────────────────────────────────────

export interface ExecutiveNarrative {
  paragraphs: string[];
  bullets: { label: string; value: string }[];
}

export function buildExecutiveNarrative(result: RiskAnalysisResult, lang: Lang): ExecutiveNarrative {
  const de = lang === "de";
  const { risks, summary } = result;
  const criticals = risks.filter(r => r.risk_level === "critical");
  const highs = risks.filter(r => r.risk_level === "high");
  const topBucket = [...criticals, ...highs];

  // Cluster top risks by capability_tag
  const clusters = new Map<string, { label: string; count: number }>();
  for (const r of topBucket) {
    const k = r.capability_tag || "_";
    const label = capLabel(r, lang);
    const cur = clusters.get(k);
    if (cur) cur.count++; else clusters.set(k, { label, count: 1 });
  }
  const sortedClusters = [...clusters.values()].sort((a, b) => b.count - a.count);
  const topClusters = sortedClusters.slice(0, 3);

  const orgWideCriticals = criticals.filter(r => r.scope === "organization").length;
  const missingCriticals = criticals.filter(r => r.missing_count > 0).length;
  const top3 = risks.slice(0, 3);

  const paragraphs: string[] = [];

  // P1 — distribution
  if (summary.totalRisks === 0) {
    paragraphs.push(de
      ? "Es wurden keine Risiken identifiziert. Bitte stellen Sie sicher, dass die Gap-Analyse (Schritt 7) abgeschlossen ist."
      : "No risks were identified. Please ensure the gap analysis (Step 7) is complete.");
    return { paragraphs: paragraphs.map(nz), bullets: [] };
  }

  if (topClusters.length > 0 && topBucket.length > 0) {
    const focus = topClusters.map(c => `${c.count} ${de ? "in" : "in"} ${c.label}`).join(", ");
    paragraphs.push(de
      ? `Die Analyse zeigt eine deutliche Konzentration kritischer und hoher Risiken: ${focus}. Insgesamt entfallen ${topBucket.length} der ${summary.totalRisks} bewerteten Risiken auf die priorisierten Stufen Kritisch und Hoch.`
      : `The analysis shows a clear concentration of critical and high risks: ${focus}. In total ${topBucket.length} of ${summary.totalRisks} assessed risks fall into the prioritized Critical and High levels.`);
  } else {
    paragraphs.push(de
      ? `Insgesamt wurden ${summary.totalRisks} Risiken bewertet, ohne erkennbaren kritischen Schwerpunkt — die Risikolage ist breit verteilt.`
      : `A total of ${summary.totalRisks} risks were assessed without a clear critical concentration — the risk posture is broadly distributed.`);
  }

  // P2 — common root cause
  if (criticals.length > 0) {
    const orgPct = Math.round((orgWideCriticals / criticals.length) * 100);
    const missPct = Math.round((missingCriticals / criticals.length) * 100);
    if (orgPct >= 50 && missPct >= 50) {
      paragraphs.push(de
        ? `Gemeinsame Ursache der kritischen Risiken: organisationsweite Geltung in Verbindung mit fehlenden (nicht implementierten) Kontrollen — ${orgPct}% sind org-weit, ${missPct}% basieren auf fehlenden Kontrollen.`
        : `Common root cause of critical risks: organization-wide scope combined with missing (not implemented) controls — ${orgPct}% are org-wide and ${missPct}% stem from missing controls.`);
    } else if (orgPct >= 50) {
      paragraphs.push(de
        ? `Die kritischen Risiken sind überwiegend organisationsweit (${orgPct}%) — das deutet auf strukturelle Governance-Lücken statt isolierter technischer Schwächen hin.`
        : `Critical risks are predominantly organization-wide (${orgPct}%) — this points to structural governance gaps rather than isolated technical weaknesses.`);
    } else if (missPct >= 50) {
      paragraphs.push(de
        ? `${missPct}% der kritischen Risiken basieren auf vollständig fehlenden Kontrollen — die Behandlung erfordert primär Neueinführung, nicht Verbesserung bestehender Maßnahmen.`
        : `${missPct}% of critical risks stem from entirely missing controls — treatment requires primarily new implementation, not improvement of existing measures.`);
    } else {
      paragraphs.push(de
        ? `Die kritischen Risiken sind heterogen — sie verteilen sich auf Asset- und Organisationsebene und auf fehlende wie schwache Kontrollen.`
        : `Critical risks are heterogeneous — they spread across asset and organization scope and across missing and weak controls.`);
    }
  }

  // P3 — first-30-days actionables
  if (top3.length > 0) {
    const titles = top3.map(r => `„${de ? r.gap_title : r.gap_title_en}"`).join(de ? ", " : ", ");
    paragraphs.push(de
      ? `Empfohlener Fokus für die ersten 30 Tage: Behandlung der drei höchstbewerteten Risiken (${titles}). Diese repräsentieren den unmittelbaren Handlungsbedarf vor Beginn der formalen Risikobehandlung in Schritt 9.`
      : `Recommended focus for the first 30 days: treat the three highest-scored risks (${titles}). These represent the immediate action required before formal risk treatment starts in Step 9.`);
  }

  // P4 — management decisions
  const decisionCount = criticals.filter(r => r.missing_count > 0).length;
  if (decisionCount > 0) {
    paragraphs.push(de
      ? `Managemententscheidung erforderlich: ${decisionCount} kritische Kontrollen sind als „Fehlend" eingestuft und benötigen vor Schritt 9 eine formale Verantwortlichkeit, Budget-Zusage und Zeithorizont der Geschäftsleitung.`
      : `Management decision required: ${decisionCount} critical controls are classified as "Missing" and need formal ownership, budget approval and a timeline from executive management before Step 9 starts.`);
  }

  const bullets = [
    { label: de ? "Risiken gesamt" : "Total risks", value: String(summary.totalRisks) },
    { label: de ? "Kritisch + Hoch" : "Critical + High", value: `${summary.bySeverity.critical + summary.bySeverity.high}` },
    { label: de ? "Org-weit" : "Org-wide", value: String(summary.byScope.organization) },
    { label: de ? "Asset-bezogen" : "Asset-scoped", value: String(summary.byScope.asset) },
  ];

  return { paragraphs: paragraphs.map(nz), bullets };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Top-Risk insight: Why critical / Business impact / Immediate action
// ─────────────────────────────────────────────────────────────────────────

export interface TopRiskInsight {
  whyCritical: string;
  businessImpact: string;
  immediateAction: string;
}

export function buildTopRiskInsight(risk: RiskObject, lang: Lang): TopRiskInsight {
  const de = lang === "de";
  const scopeTxt = risk.scope === "organization"
    ? (de ? "organisationsweit" : "organization-wide")
    : (de ? "Asset-bezogen" : "asset-scoped");

  // Why critical — combine scope + finding counts + level
  const findingTxt = risk.missing_count > 0 && risk.weak_count > 0
    ? (de ? `${risk.missing_count} fehlende und ${risk.weak_count} schwache Kontrolle(n)` : `${risk.missing_count} missing and ${risk.weak_count} weak control(s)`)
    : risk.missing_count > 0
      ? (de ? `${risk.missing_count} vollständig fehlende Kontrolle(n)` : `${risk.missing_count} entirely missing control(s)`)
      : (de ? `${risk.weak_count} nur teilweise umgesetzte Kontrolle(n)` : `${risk.weak_count} only partially implemented control(s)`);

  const levelDe: Record<RiskLevel, string> = { critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" };
  const overrideTxt = risk.risk_overridden
    ? (de ? " L/I wurden manuell angepasst." : " L/I were adjusted manually.")
    : "";
  const whyCritical = risk.risk_source === "manual"
    ? (de
        ? `Manuell erfasstes Risiko (${risk.catalog_risks.length > 0 || risk.scenarios.length > 0 ? "aus Katalog übernommen" : "frei erfasst"}). Einstufung „${levelDe[risk.risk_level]}" beruht auf der Einschätzung Likelihood ${risk.likelihood} × Impact ${risk.impact} = Score ${risk.risk_score}, ${scopeTxt}e Geltung.`
        : `Manually captured risk (${risk.catalog_risks.length > 0 || risk.scenarios.length > 0 ? "taken from catalog" : "free-form"}). Rated "${risk.risk_level}" based on the assessment likelihood ${risk.likelihood} × impact ${risk.impact} = score ${risk.risk_score}, ${scopeTxt} scope.`)
    : (de
        ? `Einstufung „${levelDe[risk.risk_level]}" beruht auf ${findingTxt}, ${scopeTxt}er Geltung und einem Score von ${risk.risk_score}. Likelihood ${risk.likelihood} × Impact ${risk.impact}.${overrideTxt}`
        : `Rated "${risk.risk_level}" based on ${findingTxt}, ${scopeTxt} scope and a score of ${risk.risk_score}. Likelihood ${risk.likelihood} × Impact ${risk.impact}.${overrideTxt}`);

  // Business impact — bevorzugt der konkrete Katalogtext (Tabelle `risks`),
  // sonst Ableitung aus Geltungsbereich/Bereich.
  const isGov = risk.scope === "organization";
  let businessImpact: string;
  const top = risk.scenarios?.[0];
  if (top && (de ? top.text_de : top.text_en)) {
    businessImpact = de ? top.text_de : top.text_en;
  } else if (isGov) {
    businessImpact = de
      ? `Bei Eintritt: Verstoß gegen NIS2 Art. 21 (Risikomanagement-Maßnahmen). Mögliche Folgen: Bußgeldrisiko bis 2% des weltweiten Jahresumsatzes (NIS2 Art. 34), persönliche Haftung der Geschäftsleitung sowie Eskalation gegenüber Aufsichtsbehörde und Vertragspartnern.`
      : `If realised: breach of NIS2 Art. 21 (risk management measures). Possible consequences: fines up to 2% of global annual turnover (NIS2 Art. 34), personal liability of executive management and escalation toward the supervisory authority and contractual partners.`;
  } else if (risk.service_name) {
    businessImpact = de
      ? `Bei Eintritt: Beeinträchtigung des kritischen Dienstes „${risk.service_name}". Mögliche Folgen: Ausfall- und Reputationsschaden, Meldepflicht nach NIS2 Art. 23 (Erstmeldung innerhalb von 24h) sowie Vertragsstrafen.`
      : `If realised: impact on the critical service "${risk.service_name}". Possible consequences: outage and reputation damage, mandatory incident notification per NIS2 Art. 23 (initial report within 24h) and contractual penalties.`;
  } else {
    businessImpact = de
      ? `Bei Eintritt: Kompromittierung des Assets „${risk.asset_name ?? "—"}" mit Auswirkung auf abhängige Dienste. Mögliche Folgen: Datenverlust, Wiederanlauf-Aufwand und Meldepflicht je nach Kritikalität.`
      : `If realised: compromise of asset "${risk.asset_name ?? "—"}" affecting dependent services. Possible consequences: data loss, recovery effort and notification obligations depending on criticality.`;
  }

  // Immediate action — single concrete sentence based on finding type
  let immediateAction: string;
  if (isGov && risk.missing_count > 0) {
    immediateAction = de
      ? `Diese Woche: Verantwortlichen benennen, Entwurf der Richtlinie aus Schritt 14 anstoßen und einen Termin zur Verabschiedung in der Geschäftsleitung setzen.`
      : `This week: appoint an owner, kick off the policy draft from Step 14 and schedule a sign-off meeting with executive management.`;
  } else if (risk.missing_count > 0) {
    immediateAction = de
      ? `Diese Woche: kompensierende Maßnahme (z. B. Überwachung, Zugriffsbeschränkung) festlegen, bis die fehlende Kontrolle in Schritt 9 formal behandelt wird.`
      : `This week: define a compensating control (e.g. monitoring, access restriction) until the missing control is formally treated in Step 9.`;
  } else {
    immediateAction = de
      ? `Diese Woche: bestehende Implementierung dokumentieren und Lücke gegenüber Soll-Zustand bewerten — ggf. Quick-Win in Schritt 12 einplanen.`
      : `This week: document the existing implementation and assess the gap against the target state — schedule a quick win in Step 12 if applicable.`;
  }

  return { whyCritical: nz(whyCritical), businessImpact: nz(businessImpact), immediateAction: nz(immediateAction) };
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Timeline-based "Next Steps"
// ─────────────────────────────────────────────────────────────────────────

export interface TimelineItem {
  text: string;
  owner: string;     // suggested owner role
  due: string;       // human-readable due window
}

export interface NextStepsPlan {
  sofort: TimelineItem[];        // 0–30 days  (critical)
  kurzfristig: TimelineItem[];   // 30–90 days (high)
  mittelfristig: TimelineItem[]; // 90–180 days (medium)
  langfristig: TimelineItem[];   // >180 days / next audit cycle (low)
}

function fmtDate(d: Date, de: boolean): string {
  return d.toLocaleDateString(de ? "de-DE" : "en-US", { day: "2-digit", month: "short", year: "numeric" });
}

export function buildNextStepsPlan(result: RiskAnalysisResult, lang: Lang): NextStepsPlan {
  const de = lang === "de";
  const today = new Date();
  const d30 = new Date(today.getTime() + 30 * 86400000);
  const d90 = new Date(today.getTime() + 90 * 86400000);
  const d180 = new Date(today.getTime() + 180 * 86400000);

  const criticals = result.risks.filter(r => r.risk_level === "critical");
  const orgGov = criticals.filter(r => r.scope === "organization");
  const top3 = result.risks.slice(0, 3);
  const assetCriticals = result.risks.filter(r => r.scope === "asset" && (r.risk_level === "critical" || r.risk_level === "high")).slice(0, 5);

  const sofort: TimelineItem[] = [];
  if (orgGov.length > 0) {
    sofort.push({
      text: de
        ? `Verantwortliche für ${orgGov.length} kritische Governance-Lücken benennen`
        : `Appoint owners for ${orgGov.length} critical governance gaps`,
      owner: de ? "Geschäftsleitung / CISO" : "Executive Management / CISO",
      due: fmtDate(d30, de),
    });
  }
  for (const r of top3) {
    sofort.push({
      text: de
        ? `Sofort-Risiko behandeln: „${r.gap_title}" (Score ${r.risk_score})`
        : `Address immediate risk: "${r.gap_title_en}" (score ${r.risk_score})`,
      owner: r.scope === "organization" ? (de ? "CISO" : "CISO") : (de ? "Asset-Owner" : "Asset Owner"),
      due: fmtDate(d30, de),
    });
  }
  if (orgGov.some(r => /incident|melde|vorfall/i.test(r.gap_title) || /incident|notification/i.test(r.gap_title_en))) {
    sofort.push({
      text: de
        ? "Incident-Meldeprozess (24h NIS2 Art. 23) formal beschließen"
        : "Formally adopt incident notification process (24h NIS2 Art. 23)",
      owner: de ? "CISO + Rechtsabteilung" : "CISO + Legal",
      due: fmtDate(d30, de),
    });
  }

  const kurzfristig: TimelineItem[] = [
    {
      text: de
        ? "Risk Treatment Plan in Schritt 9 generieren und für jedes kritische/hohe Risiko Strategie festlegen"
        : "Generate Risk Treatment Plan in Step 9 and set strategy for every critical/high risk",
      owner: de ? "CISO" : "CISO",
      due: fmtDate(d90, de),
    },
  ];
  if (assetCriticals.length > 0) {
    kurzfristig.push({
      text: de
        ? `Kritische Asset-Kontrollen priorisieren (${assetCriticals.length} Top-Assets identifiziert)`
        : `Prioritize critical asset controls (${assetCriticals.length} top assets identified)`,
      owner: de ? "Asset-Owner / IT-Leitung" : "Asset Owners / IT Lead",
      due: fmtDate(d90, de),
    });
  }
  kurzfristig.push({
    text: de
      ? "Lieferantenverzeichnis prüfen und vertragliche NIS2-Klauseln nachziehen"
      : "Review supplier inventory and update contracts with NIS2 clauses",
    owner: de ? "Einkauf + CISO" : "Procurement + CISO",
    due: fmtDate(d90, de),
  });

  const mittelfristig: TimelineItem[] = [
    {
      text: de
        ? "Statement of Applicability (SoA) in Schritt 10 verabschieden"
        : "Adopt Statement of Applicability (SoA) in Step 10",
      owner: de ? "CISO + Geschäftsleitung" : "CISO + Executive Management",
      due: fmtDate(d180, de),
    },
    {
      text: de
        ? "Umsetzungsplan mit Fristen, Budget und KPIs in Schritt 12 etablieren"
        : "Establish implementation plan with deadlines, budget and KPIs in Step 12",
      owner: de ? "PMO / CISO" : "PMO / CISO",
      due: fmtDate(d180, de),
    },
    {
      text: de
        ? "Internes Audit (Schritt 17) zur Wirksamkeitsprüfung der Maßnahmen einplanen"
        : "Schedule internal audit (Step 17) to verify measure effectiveness",
      owner: de ? "Internal Audit" : "Internal Audit",
      due: fmtDate(d180, de),
    },
  ];

  // Long-term bucket (>180 days / next audit cycle) — for low-severity gaps
  // that should not crowd the medium-term work but still need a parking slot.
  const d365 = new Date(today.getTime() + 365 * 86400000);
  const lowCount = result.risks.filter(r => r.risk_level === "low").length;
  const langfristig: TimelineItem[] = [
    {
      text: de
        ? `Niedrige Restrisiken im nächsten Audit-Zyklus erneut bewerten${lowCount > 0 ? ` (${lowCount} Risiken)` : ""}`
        : `Re-assess low residual risks in the next audit cycle${lowCount > 0 ? ` (${lowCount} risks)` : ""}`,
      owner: de ? "Internal Audit / CISO" : "Internal Audit / CISO",
      due: fmtDate(d365, de),
    },
    {
      text: de
        ? "Wirksamkeit der umgesetzten Maßnahmen messen und KVP-Zyklus (Schritt 18) starten"
        : "Measure effectiveness of implemented controls and start CIP cycle (Step 18)",
      owner: de ? "CISO + Quality" : "CISO + Quality",
      due: fmtDate(d365, de),
    },
  ];

  const clean = (arr: TimelineItem[]) => arr.map(it => ({ ...it, text: nz(it.text) }));
  return { sofort: clean(sofort), kurzfristig: clean(kurzfristig), mittelfristig: clean(mittelfristig), langfristig: clean(langfristig) };
}

// ─────────────────────────────────────────────────────────────────────────
// 4. De-duplicate measures within a domain — generic vs. specific split
// ─────────────────────────────────────────────────────────────────────────

const GENERIC_PATTERNS_DE = [
  /verantwortlich.{0,15}benenn/i,
  /dokumentier.{0,20}richtlinie/i,
  /quartalsweise.{0,20}überprüf/i,
  /regelmäßig.{0,20}überprüf/i,
];

export function isGenericMeasure(text: string): boolean {
  return GENERIC_PATTERNS_DE.some(p => p.test(text));
}

export function genericFooterMeasures(lang: Lang): string[] {
  const de = lang === "de";
  return de
    ? [
        "Verantwortlichen für den Themenbereich benennen.",
        "Dokumentierte Richtlinie verabschieden und kommunizieren.",
        "Wirksamkeit quartalsweise überprüfen und dokumentieren.",
      ]
    : [
        "Appoint an owner for the topic area.",
        "Adopt and communicate a documented policy.",
        "Review and document effectiveness on a quarterly basis.",
      ];
}

// ─────────────────────────────────────────────────────────────────────────
// 5. Key Insight — single management headline + bullet consequences
// ─────────────────────────────────────────────────────────────────────────

export interface KeyInsight {
  headline: string;
  consequences: string[];
}

const CAP_HUMAN: Record<string, { de: string; en: string }> = {
  governance:           { de: "Governance",                       en: "Governance" },
  risk_mgmt:            { de: "Risikomanagement",                 en: "Risk Management" },
  asset_mgmt:           { de: "Asset-Management",                 en: "Asset Management" },
  identity_access_mgmt: { de: "Identitäts- & Zugriffsmanagement", en: "Identity & Access Management" },
  supplier_security:    { de: "Lieferantensicherheit",            en: "Supplier Security" },
  incident_mgmt:        { de: "Incident-Management",              en: "Incident Management" },
  business_continuity:  { de: "Business Continuity",              en: "Business Continuity" },
  compliance_audit:     { de: "Compliance & Audit",               en: "Compliance & Audit" },
  awareness_training:   { de: "Awareness & Training",             en: "Awareness & Training" },
  network_security:     { de: "Netzwerksicherheit",               en: "Network Security" },
  endpoint_security:    { de: "Endpoint-Sicherheit",              en: "Endpoint Security" },
  vulnerability_mgmt:   { de: "Schwachstellenmanagement",         en: "Vulnerability Management" },
  cryptography:         { de: "Kryptografie",                     en: "Cryptography" },
  monitoring_logging:   { de: "Monitoring & Logging",             en: "Monitoring & Logging" },
  data_protection:      { de: "Datenschutz",                      en: "Data Protection" },
  personnel_security:   { de: "Personalsicherheit",               en: "Personnel Security" },
  physical_security:    { de: "Physische Sicherheit",             en: "Physical Security" },
};
function humanCap(tag: string, lang: Lang): string {
  if (CAP_HUMAN[tag]) return CAP_HUMAN[tag][lang];
  // Fallback: Title-Case the tag so unknown keys never render as lowercase snake_case.
  return tag.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function buildKeyInsight(result: RiskAnalysisResult, lang: Lang): KeyInsight {
  const de = lang === "de";
  const topBucket = result.risks.filter(r => r.risk_level === "critical" || r.risk_level === "high");
  if (topBucket.length === 0) {
    return {
      headline: de
        ? "Es bestehen aktuell keine kritischen oder hohen Risiken — der Schwerpunkt liegt auf Aufrechterhaltung der Wirksamkeit."
        : "No critical or high risks are currently present — focus shifts to maintaining control effectiveness.",
      consequences: [],
    };
  }
  const tags = new Map<string, number>();
  for (const r of topBucket) tags.set(r.capability_tag, (tags.get(r.capability_tag) ?? 0) + 1);
  const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => humanCap(t, lang));
  const orgPct = Math.round(
    (topBucket.filter(r => r.scope === "organization").length / topBucket.length) * 100
  );

  const focusList = topTags.length > 1
    ? topTags.slice(0, -1).join(", ") + (de ? " und " : " and ") + topTags[topTags.length - 1]
    : topTags[0] ?? "";

  const headline = de
    ? `Die aktuelle Risikolage wird durch fehlende oder schwache Strukturen in ${focusList} bestimmt — überwiegend auf Organisationsebene (${orgPct}%) und mit Wirkung auf mehrere kritische Dienste gleichzeitig.`
    : `The current risk exposure is driven by missing or weak structures in ${focusList} — predominantly at organisation level (${orgPct}%) and affecting multiple critical services simultaneously.`;

  const consequences = de
    ? [
        "Verstoß gegen NIS2-Meldepflichten (24h Frühwarnung / 72h Vollmeldung gem. Art. 23).",
        "Erhöhte Wahrscheinlichkeit von Betriebsunterbrechungen kritischer Dienste.",
        "Fehlende koordinierte Reaktion bei Vorfällen — verlängerte Wiederanlaufzeit.",
        "Bußgeldrisiko bis 2 % des weltweiten Jahresumsatzes (NIS2 Art. 34) und persönliche Haftung der Geschäftsleitung (Art. 20).",
      ]
    : [
        "Failure to comply with NIS2 reporting obligations (24h early warning / 72h full report per Art. 23).",
        "Increased likelihood of operational disruption to critical services.",
        "Lack of coordinated response during incidents — extended recovery time.",
        "Fines up to 2% of global annual turnover (NIS2 Art. 34) and personal liability of executive management (Art. 20).",
      ];

  return { headline, consequences };
}

// ─────────────────────────────────────────────────────────────────────────
// 6. Top 5 Management Actions (0–30 days) — derived from the actual top risks
// ─────────────────────────────────────────────────────────────────────────

export interface ManagementAction {
  title: string;
  rationale: string;
  affectedAreas: string;   // affected services/assets/scope summary
  dueWindow: string;       // localized due window (e.g. "0–30 Tage")
  nis2Refs: string;        // localized NIS2 article references
  gdprRefs: string;        // GDPR article references (empty if none)
  doraRefs: string;        // DORA article references (empty if none)
  kritisRefs: string;      // KRITIS references (empty if none)
}

const DUE_WINDOW_BY_TAG: Record<string, { de: string; en: string }> = {
  incident_mgmt:        { de: "0–30 Tage",   en: "0–30 days" },
  governance:           { de: "0–30 Tage",   en: "0–30 days" },
  identity_access_mgmt: { de: "0–30 Tage",   en: "0–30 days" },
  supplier_security:    { de: "30–60 Tage",  en: "30–60 days" },
  business_continuity:  { de: "30–90 Tage",  en: "30–90 days" },
  risk_mgmt:            { de: "0–30 Tage",   en: "0–30 days" },
  asset_mgmt:           { de: "0–30 Tage",   en: "0–30 days" },
  awareness_training:   { de: "30–90 Tage",  en: "30–90 days" },
  network_security:     { de: "30–60 Tage",  en: "30–60 days" },
  monitoring_logging:   { de: "30–90 Tage",  en: "30–90 days" },
};

export function buildTop5ManagementActions(result: RiskAnalysisResult, lang: Lang): ManagementAction[] {
  const de = lang === "de";
  const topBucket = result.risks.filter(r => r.risk_level === "critical" || r.risk_level === "high");
  const seenCaps = new Set<string>();
  const actions: ManagementAction[] = [];

  // Capability-driven action templates — fired only if the cap actually appears in top risks
  const ACTION_LIB: Record<string, { de: { title: string; rationale: string }; en: { title: string; rationale: string } }> = {
    incident_mgmt: {
      de: { title: "Formalen Incident-Meldeprozess etablieren", rationale: "24h-Frühwarnung, Eskalationspfade und Verantwortlichkeiten gemäß NIS2 Art. 23 definieren." },
      en: { title: "Establish a formal incident reporting process", rationale: "Define 24h early-warning flow, escalation paths and responsibilities per NIS2 Art. 23." },
    },
    supplier_security: {
      de: { title: "Lieferanten-Risikomanagement-Rahmen einführen", rationale: "Top-10 kritische Lieferanten identifizieren, klassifizieren und vertraglich absichern." },
      en: { title: "Implement a supplier risk management framework", rationale: "Identify, classify and contractually secure the top-10 critical suppliers." },
    },
    governance: {
      de: { title: "Governance- und Entscheidungsstrukturen formalisieren", rationale: "Ownership für Richtlinien, Risikoakzeptanz und Kontrollen auf Geschäftsleitungsebene benennen." },
      en: { title: "Formalise governance and decision structures", rationale: "Assign ownership for policies, risk acceptance and controls at executive level." },
    },
    business_continuity: {
      de: { title: "Business-Continuity-Parameter festlegen (RTO/RPO)", rationale: "Wiederanlaufziele für jeden kritischen Dienst beschließen und dokumentieren." },
      en: { title: "Define business continuity parameters (RTO/RPO)", rationale: "Decide and document recovery targets for every critical service." },
    },
    identity_access_mgmt: {
      de: { title: "Zentrales Identity- & Access-Management einführen", rationale: "Least-Privilege, MFA für privilegierte Konten und Joiner-Mover-Leaver-Lifecycle umsetzen." },
      en: { title: "Implement central Identity & Access Management", rationale: "Enforce least-privilege, MFA for privileged accounts and joiner-mover-leaver lifecycle." },
    },
    risk_mgmt: {
      de: { title: "Risikomanagement-Methodik finalisieren", rationale: "Bewertungskriterien, Risikoeigentum und Akzeptanzschwellen verbindlich machen." },
      en: { title: "Finalise risk management methodology", rationale: "Make scoring criteria, risk ownership and acceptance thresholds binding." },
    },
    asset_mgmt: {
      de: { title: "Asset-Inventar vervollständigen und klassifizieren", rationale: "Eigentümer, Schutzbedarf und ZOK-Zuordnung für jedes kritische Asset hinterlegen." },
      en: { title: "Complete and classify the asset inventory", rationale: "Set owner, protection need and ZOK mapping for every critical asset." },
    },
    awareness_training: {
      de: { title: "Verbindliches rollenbasiertes Awareness-Programm starten", rationale: "Pflicht-Module mit Phishing-Simulation und Nachweispflicht ausrollen." },
      en: { title: "Launch a mandatory role-based awareness program", rationale: "Roll out compulsory modules with phishing simulation and evidence." },
    },
    network_security: {
      de: { title: "Netzsegmentierung und Egress-Kontrolle priorisieren", rationale: "Laterale Bewegung nach Initial-Compromise verhindern; OT/IT-Trennung sicherstellen." },
      en: { title: "Prioritise network segmentation and egress control", rationale: "Prevent lateral movement after initial compromise; enforce OT/IT separation." },
    },
    monitoring_logging: {
      de: { title: "Zentrales Logging und Detektion einrichten", rationale: "SIEM-Korrelation und 24/7-Detektionsfähigkeit für kritische Systeme sicherstellen." },
      en: { title: "Set up central logging and detection", rationale: "Ensure SIEM correlation and 24/7 detection capability for critical systems." },
    },
  };

  // Pre-index risks per capability for area enrichment.
  const risksByCap = new Map<string, RiskObject[]>();
  for (const r of topBucket) {
    const arr = risksByCap.get(r.capability_tag);
    if (arr) arr.push(r); else risksByCap.set(r.capability_tag, [r]);
  }

  function buildAreas(cap: string): string {
    const rs = risksByCap.get(cap) ?? [];
    const services = new Set(rs.map(r => r.service_name).filter(Boolean) as string[]);
    const orgCount = rs.filter(r => r.scope === "organization").length;
    const assetCount = rs.filter(r => r.scope === "asset").length;
    const parts: string[] = [];
    if (services.size > 0) {
      const list = [...services].slice(0, 3).join(", ");
      parts.push(de
        ? `${services.size} kritische Dienste (${list}${services.size > 3 ? " …" : ""})`
        : `${services.size} critical services (${list}${services.size > 3 ? " …" : ""})`);
    }
    if (orgCount > 0) parts.push(de ? `${orgCount} org-weit` : `${orgCount} org-wide`);
    if (assetCount > 0) parts.push(de ? `${assetCount} asset-bezogen` : `${assetCount} asset-scoped`);
    return parts.length > 0 ? parts.join(" · ") : (de ? "Organisationsweit" : "Organisation-wide");
  }

  function buildEnriched(cap: string, base: { title: string; rationale: string }): ManagementAction {
    const due = DUE_WINDOW_BY_TAG[cap]?.[lang] ?? (de ? "0–90 Tage" : "0–90 days");
    const refs = (NIS2_ARTICLES_BY_CAP[cap] ?? []).join(", ");
    const reg = REGULATION_MAPPING_BY_CAP[cap] ?? { nis2: [], gdpr: [], dora: [], kritis: [] };
    return {
      title: base.title,
      rationale: base.rationale,
      affectedAreas: buildAreas(cap),
      dueWindow: due,
      nis2Refs: refs || (de ? "Allgemeine Sorgfaltspflicht" : "General duty of care"),
      gdprRefs: reg.gdpr.join(", "),
      doraRefs: reg.dora.join(", "),
      kritisRefs: reg.kritis.join(", "),
    };
  }

  for (const r of topBucket) {
    if (actions.length >= 5) break;
    if (seenCaps.has(r.capability_tag)) continue;
    const tpl = ACTION_LIB[r.capability_tag]?.[lang];
    if (!tpl) continue;
    seenCaps.add(r.capability_tag);
    actions.push(buildEnriched(r.capability_tag, tpl));
  }

  // Backfill from any remaining library entries if we have <5
  const fallbackOrder = ["governance", "incident_mgmt", "supplier_security", "business_continuity", "identity_access_mgmt"];
  for (const cap of fallbackOrder) {
    if (actions.length >= 5) break;
    if (seenCaps.has(cap)) continue;
    const tpl = ACTION_LIB[cap]?.[lang];
    if (!tpl) continue;
    seenCaps.add(cap);
    actions.push(buildEnriched(cap, tpl));
  }

  // NIS2-Zitate nur, wenn NIS2 aktiv ist; sonst neutralisieren.
  return actions.map(a => ({
    ...a,
    title: nz(a.title),
    rationale: nz(a.rationale),
    nis2Refs: nz(a.nis2Refs),
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// 7. Root Cause Analysis bullets
// ─────────────────────────────────────────────────────────────────────────

export function buildRootCauses(result: RiskAnalysisResult, lang: Lang): string[] {
  const de = lang === "de";
  const criticals = result.risks.filter(r => r.risk_level === "critical");
  const orgPct = criticals.length > 0
    ? Math.round((criticals.filter(r => r.scope === "organization").length / criticals.length) * 100)
    : 0;
  const missPct = criticals.length > 0
    ? Math.round((criticals.filter(r => r.missing_count > 0).length / criticals.length) * 100)
    : 0;

  const causes: string[] = [];
  if (orgPct >= 50) {
    causes.push(de
      ? `Fehlende formalisierte Prozesse auf Organisationsebene (${orgPct}% der kritischen Risiken sind verbundweit).`
      : `Missing formalised processes at organisation level (${orgPct}% of critical risks are organisation-wide).`);
  } else {
    causes.push(de
      ? "Schwerpunkt liegt auf einzelnen Assets — Governance ist grundsätzlich vorhanden, aber technische Umsetzung lückenhaft."
      : "Focus is on individual assets — governance exists but technical implementation is patchy.");
  }
  if (missPct >= 50) {
    causes.push(de
      ? `Fehlende Ownership und Verantwortlichkeit (${missPct}% der kritischen Kontrollen sind als „Fehlend" eingestuft).`
      : `Missing ownership and accountability (${missPct}% of critical controls are classified as "Missing").`);
  } else {
    causes.push(de
      ? "Teilweise umgesetzte kritische Kontrollen — Ownership existiert, aber Wirksamkeit ist nicht nachgewiesen."
      : "Partially implemented critical controls — ownership exists, but effectiveness is unproven.");
  }
  causes.push(de
    ? "Unzureichende Integration zwischen Diensten, Assets und Governance — Risiken werden nicht durchgängig nachverfolgt."
    : "Insufficient integration between services, assets and governance — risks are not consistently tracked end-to-end.");
  causes.push(de
    ? "Kritische Risiken sind nicht isoliert, sondern miteinander verbunden — Behandlung muss bündelweise statt einzeln erfolgen."
    : "Critical risks are not isolated but interconnected — treatment must be bundled rather than handled individually.");

  return causes;
}

// ─────────────────────────────────────────────────────────────────────────
// 8. Per-risk Business Impact bullets + Priority window
// ─────────────────────────────────────────────────────────────────────────

export function buildBusinessImpactBullets(risk: RiskObject, lang: Lang): string[] {
  const de = lang === "de";
  const isOrg = risk.scope === "organization";
  const out: string[] = [];

  if (isOrg) {
    out.push(de ? "Compliance-Verstoß (NIS2 Art. 21 / 23)" : "Compliance violation (NIS2 Art. 21 / 23)");
  }
  out.push(de ? "Betriebsunterbrechung kritischer Dienste" : "Operational disruption of critical services");
  if (risk.capability_tag === "data_protection" || risk.capability_tag === "cryptography") {
    out.push(de ? "Datenverlust oder unautorisierte Offenlegung" : "Data loss or unauthorised disclosure");
  } else if (risk.capability_tag === "incident_mgmt") {
    out.push(de ? "Verzögerte Vorfallreaktion und Eskalationsversagen" : "Delayed incident response and escalation failure");
  } else {
    out.push(de ? "Reputationsschaden gegenüber Kunden und Aufsichtsbehörden" : "Reputational damage with customers and regulators");
  }
  if (risk.risk_level === "critical") {
    out.push(de
      ? "Bußgeldrisiko und persönliche Haftung der Geschäftsleitung"
      : "Fine exposure and personal liability of executive management");
  }
  return out;
}

export function buildPriorityWindow(risk: RiskObject, lang: Lang): { label: string; color: "critical" | "high" | "medium" | "low" } {
  const de = lang === "de";
  if (risk.risk_level === "critical") {
    return { label: de ? "Sofort (0–30 Tage)" : "Immediate (0–30 days)", color: "critical" };
  }
  if (risk.risk_level === "high") {
    return { label: de ? "Kurzfristig (30–90 Tage)" : "Short-term (30–90 days)", color: "high" };
  }
  if (risk.risk_level === "medium") {
    return { label: de ? "Mittelfristig (90–180 Tage)" : "Mid-term (90–180 days)", color: "medium" };
  }
  // low — separate bucket so priority differentiation is preserved
  return { label: de ? "Langfristig (>180 Tage / nächster Audit-Zyklus)" : "Long-term (>180 days / next audit cycle)", color: "low" };
}

/* ── Friendly, domain-based risk titles ────────────────────────────────
 * Multi-dimensional title matrix:
 *   capability  ×  control-type  ×  asset-context
 * so two risks in the same domain produce distinct, decision-grade headlines.
 */
const RISK_FRIENDLY_NAME: Record<string, { de: string; en: string }> = {
  governance: { de: "Fehlende Steuerung & Verantwortlichkeiten", en: "Missing Governance & Accountability" },
  risk_mgmt: { de: "Unzureichendes Risikomanagement", en: "Insufficient Risk Management" },
  asset_mgmt: { de: "Lückenhaftes Asset-Inventar", en: "Incomplete Asset Inventory" },
  identity_access_mgmt: { de: "Schwaches Identitäts- & Zugriffsmanagement", en: "Weak Identity & Access Management" },
  supplier_security: { de: "Lieferanten nicht gesteuert", en: "Suppliers Not Managed" },
  incident_mgmt: { de: "Kein Incident-Response-Prozess", en: "No Incident Response Process" },
  business_continuity: { de: "Kein Business-Continuity-Plan (BCP)", en: "No Business Continuity Plan (BCP)" },
  compliance_audit: { de: "Fehlende interne Audits & Wirksamkeitsprüfung", en: "Missing Internal Audit & Effectiveness Reviews" },
  personnel_security: { de: "Lücken in der Personalsicherheit", en: "Personnel Security Gaps" },
  awareness_training: { de: "Fehlendes Awareness-Programm", en: "Missing Awareness Program" },
  physical_security: { de: "Schwächen in der physischen Sicherheit", en: "Physical Security Weaknesses" },
  endpoint_security: { de: "Unzureichende Endgerätesicherheit", en: "Insufficient Endpoint Security" },
  network_security: { de: "Unzureichende Netzwerksegmentierung & -sicherheit", en: "Insufficient Network Segmentation & Security" },
  cryptography: { de: "Schwaches Krypto- & Schlüsselmanagement", en: "Weak Cryptography & Key Management" },
  vulnerability_mgmt: { de: "Fehlendes Schwachstellen-Management", en: "Missing Vulnerability Management" },
  secure_development: { de: "Fehlender sicherer Entwicklungsprozess", en: "Missing Secure Development Process" },
  monitoring_logging: { de: "Fehlende Detektion & Monitoring", en: "Missing Detection & Monitoring" },
  data_protection: { de: "Lücken im Datenschutz & DLP", en: "Data Protection & DLP Gaps" },
};

/** Detect a control-type sub-modifier from gap title + supporting findings.
 *  Returns null when nothing distinct is detected so the base title is kept. */
type ControlType =
  | "mfa" | "rbac" | "lifecycle" | "privileged"
  | "segmentation" | "egress" | "remote_access" | "firewall"
  | "logging" | "siem" | "detection"
  | "patching" | "scanning"
  | "encryption" | "key_mgmt"
  | "backup" | "rto_rpo"
  | "notification_24h" | "playbook"
  | "supplier_contract" | "third_party_assessment";

const CONTROL_TYPE_PATTERNS: { type: ControlType; rx: RegExp }[] = [
  { type: "mfa",                  rx: /\b(mfa|multi-?factor|2fa|zweifaktor)\b/i },
  { type: "privileged",           rx: /\b(privileg|admin|pam|root)\b/i },
  { type: "rbac",                 rx: /\b(rbac|rollen|berechtigung|least.?privilege|access review)\b/i },
  { type: "lifecycle",            rx: /\b(joiner|mover|leaver|lifecycle|onboard|offboard|provisioning)\b/i },
  { type: "segmentation",         rx: /\b(segment|vlan|micro-?segment|zoning|ot.?\/?it|ot-it)\b/i },
  { type: "egress",               rx: /\b(egress|ausgehend|proxy|dns.?filter)\b/i },
  { type: "remote_access",        rx: /\b(remote.?access|vpn|fernzugriff|rdp)\b/i },
  { type: "firewall",             rx: /\b(firewall|perimeter|next-?gen)\b/i },
  { type: "siem",                 rx: /\b(siem|korrelation|correlation)\b/i },
  { type: "logging",              rx: /\b(log|protokoll|logging|audit.?trail)\b/i },
  { type: "detection",            rx: /\b(detekt|detection|edr|xdr|ids|ips)\b/i },
  { type: "patching",             rx: /\b(patch|update.?management)\b/i },
  { type: "scanning",             rx: /\b(scan|schwachstellen.?scan|vulnerability scan)\b/i },
  { type: "encryption",           rx: /\b(verschlüssel|encryption|tls|at-?rest|in-?transit)\b/i },
  { type: "key_mgmt",             rx: /\b(schlüsselmanagement|key management|hsm|kms)\b/i },
  { type: "backup",               rx: /\b(backup|datensicherung|recovery|wiederherstell)\b/i },
  { type: "rto_rpo",              rx: /\b(rto|rpo|wiederanlauf|recovery time)\b/i },
  { type: "notification_24h",     rx: /\b(24.?h|72.?h|meldepflicht|notification|art\.?\s*23)\b/i },
  { type: "playbook",             rx: /\b(playbook|runbook|reaktionsplan|response plan)\b/i },
  { type: "supplier_contract",    rx: /\b(vertrag|sla|klausel|contract|dpa)\b/i },
  { type: "third_party_assessment", rx: /\b(third.?party|drittpartei|lieferanten.?bewertung|supplier assessment)\b/i },
];

function detectControlType(risk: RiskObject): ControlType | null {
  const haystack = [
    risk.gap_title, risk.gap_title_en,
    ...risk.supporting_findings.flatMap(f => [f.control_title, f.control_title_en, f.measure_text, f.measure_text_en]),
  ].join(" ");
  for (const { type, rx } of CONTROL_TYPE_PATTERNS) if (rx.test(haystack)) return type;
  return null;
}

/** Per-domain × control-type headline overrides. */
const SUBTITLE_BY_CAP_AND_TYPE: Partial<Record<string, Partial<Record<ControlType, { de: string; en: string }>>>> = {
  identity_access_mgmt: {
    mfa:        { de: "Keine MFA für privilegierte Konten", en: "No MFA for privileged accounts" },
    privileged: { de: "Privilegierte Zugriffe nicht kontrolliert (PAM fehlt)", en: "Privileged access uncontrolled (no PAM)" },
    rbac:       { de: "Keine rollenbasierten Berechtigungen / Least-Privilege", en: "No role-based access / least-privilege" },
    lifecycle:  { de: "Joiner-Mover-Leaver-Prozess fehlt", en: "Joiner-Mover-Leaver lifecycle missing" },
  },
  network_security: {
    segmentation:  { de: "Fehlende Netzsegmentierung — laterale Bewegung möglich", en: "No network segmentation — lateral movement possible" },
    egress:        { de: "Unkontrollierter ausgehender Datenverkehr (Egress)", en: "Uncontrolled outbound traffic (egress)" },
    remote_access: { de: "Ungesicherter Fernzugriff (VPN/RDP)", en: "Unsecured remote access (VPN/RDP)" },
    firewall:      { de: "Perimeterkontrollen unzureichend", en: "Insufficient perimeter controls" },
  },
  monitoring_logging: {
    siem:      { de: "Keine zentrale Log-Korrelation (SIEM)", en: "No central log correlation (SIEM)" },
    logging:   { de: "Sicherheitsrelevante Logs werden nicht erfasst", en: "Security-relevant logs are not collected" },
    detection: { de: "Keine 24/7-Detektionsfähigkeit (EDR/SOC)", en: "No 24/7 detection capability (EDR/SOC)" },
  },
  vulnerability_mgmt: {
    patching: { de: "Kein verbindlicher Patch-Prozess", en: "No binding patch process" },
    scanning: { de: "Keine regelmäßigen Schwachstellen-Scans", en: "No regular vulnerability scans" },
  },
  cryptography: {
    encryption: { de: "Daten nicht durchgängig verschlüsselt (at-rest / in-transit)", en: "Data not consistently encrypted (at-rest / in-transit)" },
    key_mgmt:   { de: "Schlüsselmanagement nicht etabliert (HSM/KMS fehlt)", en: "No key management established (HSM/KMS missing)" },
  },
  business_continuity: {
    backup:  { de: "Keine getesteten Backups / Wiederherstellung", en: "No tested backups / recovery" },
    rto_rpo: { de: "RTO/RPO nicht definiert", en: "RTO/RPO not defined" },
  },
  incident_mgmt: {
    notification_24h: { de: "24h-Meldepflicht (NIS2 Art. 23) nicht operationalisiert", en: "24h reporting obligation (NIS2 Art. 23) not operationalised" },
    playbook:         { de: "Keine Incident-Playbooks / Eskalationspfade", en: "No incident playbooks / escalation paths" },
  },
  supplier_security: {
    supplier_contract:        { de: "Keine NIS2-Klauseln in Lieferantenverträgen", en: "No NIS2 clauses in supplier contracts" },
    third_party_assessment:   { de: "Keine Drittparteien-Risikobewertung", en: "No third-party risk assessment" },
  },
};

/** Detect asset context (SCADA/RTU/Cloud/IT) from asset name + type for asset-scoped risks. */
function assetContextLabel(risk: RiskObject, lang: Lang): string | null {
  const name = (risk.asset_name ?? "").toLowerCase();
  if (!name) return null;
  if (/scada/.test(name))                    return lang === "de" ? "SCADA-Server" : "SCADA server";
  if (/\brtu\b|gateway/.test(name))          return lang === "de" ? "RTU-Gateway" : "RTU gateway";
  if (/\bplc\b|steuerung/.test(name))        return lang === "de" ? "PLC-Steuerung" : "PLC controller";
  if (/\bhmi\b/.test(name))                  return "HMI";
  if (/cloud|aws|azure|gcp|saas/.test(name)) return lang === "de" ? "Cloud-Dienst" : "cloud service";
  if (/datenbank|database|\bdb\b|sql/.test(name)) return lang === "de" ? "Datenbank" : "database";
  if (/server/.test(name))                   return lang === "de" ? "Server" : "server";
  if (/firewall|router|switch/.test(name))   return lang === "de" ? "Netzkomponente" : "network component";
  if (/endpoint|laptop|workstation/.test(name)) return lang === "de" ? "Endgerät" : "endpoint";
  return null;
}

/** Returns a decision-grade risk title using the title matrix. */
export function friendlyRiskTitle(risk: RiskObject, lang: Lang): string {
  const ctype = detectControlType(risk);
  const subtitle = ctype ? SUBTITLE_BY_CAP_AND_TYPE[risk.capability_tag]?.[ctype] : undefined;
  const base = subtitle?.[lang] ?? RISK_FRIENDLY_NAME[risk.capability_tag]?.[lang]
    ?? (lang === "de" ? risk.gap_title : risk.gap_title_en);

  if (risk.scope === "asset") {
    const ctx = assetContextLabel(risk, lang);
    if (ctx) return `${base} — ${ctx}${risk.asset_name ? ` „${risk.asset_name}"` : ""}`;
    if (risk.asset_name) return `${base} — „${risk.asset_name}"`;
  }
  return base;
}

/* ── Scenario-aware Business Impact (overrides generic bullets) ─────── */

const SCENARIO_BY_CAP: Partial<Record<string, { de: string[]; en: string[] }>> = {
  identity_access_mgmt: {
    de: ["Privilege Abuse durch kompromittierte Admin-Konten", "Insider-Risiko bei fehlender Funktionstrennung", "Account Takeover ohne MFA"],
    en: ["Privilege abuse via compromised admin accounts", "Insider risk from missing segregation of duties", "Account takeover without MFA"],
  },
  network_security: {
    de: ["Laterale Bewegung nach initialem Zugriff", "Ransomware-Ausbreitung über flache Netze", "OT/IT-Übersprung in industrielle Steuerungen"],
    en: ["Lateral movement after initial intrusion", "Ransomware spread across flat networks", "OT/IT crossover into industrial control systems"],
  },
  supplier_security: {
    de: ["Supply-Chain-Kompromittierung über Drittanbieter", "Datenabfluss durch unkontrollierten Lieferantenzugriff", "Ausfall durch Single-Source-Abhängigkeit"],
    en: ["Supply-chain compromise via third parties", "Data exfiltration through uncontrolled supplier access", "Outage from single-source dependency"],
  },
  incident_mgmt: {
    de: ["Verstoß gegen 24h-Meldepflicht (NIS2 Art. 23)", "Verzögerte Eskalation und Reputationsschaden", "Beweismittelverlust durch fehlende Forensik"],
    en: ["Breach of 24h reporting duty (NIS2 Art. 23)", "Delayed escalation and reputation damage", "Loss of evidence due to missing forensics"],
  },
  business_continuity: {
    de: ["Verlängerter Ausfall kritischer Dienste (RTO überschritten)", "Datenverlust über RPO hinaus", "Vertragsstrafen durch SLA-Verletzung"],
    en: ["Prolonged outage of critical services (RTO exceeded)", "Data loss beyond RPO", "Contractual penalties from SLA breach"],
  },
  monitoring_logging: {
    de: ["Angriffe bleiben unentdeckt (Mean Time to Detect ↑)", "Keine Beweissicherung für Aufsichtsbehörde", "Wiederholte Vorfälle durch fehlende Lessons Learned"],
    en: ["Attacks remain undetected (MTTD ↑)", "No evidence preservation for regulators", "Repeat incidents from missing lessons learned"],
  },
  vulnerability_mgmt: {
    de: ["Ausnutzung bekannter CVEs (n-day-Exploits)", "Ransomware über ungepatchte Endpoints", "Compliance-Verstoß durch veraltete Komponenten"],
    en: ["Exploitation of known CVEs (n-day exploits)", "Ransomware via unpatched endpoints", "Compliance breach from outdated components"],
  },
  cryptography: {
    de: ["Datenabfluss durch unverschlüsselte Übertragung", "Schlüsselverlust ohne Recovery-Möglichkeit", "Compliance-Verstoß (DSGVO Art. 32)"],
    en: ["Data exfiltration through unencrypted transit", "Key loss without recovery path", "Compliance breach (GDPR Art. 32)"],
  },
  data_protection: {
    de: ["DSGVO-Bußgeld bis 4 % Konzernumsatz", "Meldepflicht binnen 72h (DSGVO Art. 33)", "Vertrauensverlust bei betroffenen Personen"],
    en: ["GDPR fine up to 4% of group turnover", "72h notification duty (GDPR Art. 33)", "Loss of trust with data subjects"],
  },
  governance: {
    de: ["Persönliche Haftung der Geschäftsleitung (NIS2 Art. 20)", "Fehlende Risikoakzeptanz-Entscheidungen blockieren Maßnahmen", "Aufsichtsbehörde stellt Mängel im Audit fest"],
    en: ["Personal liability of executive management (NIS2 Art. 20)", "Missing risk acceptance decisions block treatment", "Supervisor identifies deficiencies during audit"],
  },
  awareness_training: {
    de: ["Phishing-Erfolg durch ungeschulte Mitarbeitende", "Social-Engineering-Angriffe auf Schlüsselrollen", "Versäumte Meldung sicherheitsrelevanter Ereignisse"],
    en: ["Phishing success against untrained staff", "Social engineering targeting key roles", "Missed reporting of security-relevant events"],
  },
  endpoint_security: {
    de: ["Malware-Infektion über kompromittierte Endgeräte", "BYOD-Datenabfluss ohne MDM-Kontrolle", "Persistenz von Angreifern auf nicht überwachten Hosts"],
    en: ["Malware infection via compromised endpoints", "BYOD data leakage without MDM control", "Attacker persistence on unmonitored hosts"],
  },
  asset_mgmt: {
    de: ["Schatten-IT bleibt unbehandelt im Risikobild", "Falsche Schutzbedarfszuordnung führt zu Überschuss/Defizit", "Audit-Befund: kein vollständiges Inventar"],
    en: ["Shadow IT remains untreated in risk picture", "Wrong protection-need assignment causes over/under-protection", "Audit finding: incomplete inventory"],
  },
};

/** Returns scenario-driven business impact bullets (overrides generic version). */
export function buildBusinessImpactScenarios(risk: RiskObject, lang: Lang): string[] {
  const de = lang === "de";
  const scenarios = SCENARIO_BY_CAP[risk.capability_tag]?.[de ? "de" : "en"];
  if (!scenarios) return buildBusinessImpactBullets(risk, lang);
  const out = [...scenarios];
  if (risk.risk_level === "critical") {
    out.push(de
      ? "Bußgeldrisiko bis 2 % Konzernumsatz (NIS2 Art. 34)"
      : "Fine exposure up to 2% group turnover (NIS2 Art. 34)");
  }
  return out;
}

/* ── Action-based immediate action (replaces generic „Teilumsetzung analysieren") ── */

const ACTION_BY_CAP_AND_TYPE: Partial<Record<string, Partial<Record<ControlType, { de: string; en: string }>>>> = {
  identity_access_mgmt: {
    mfa:        { de: "MFA für alle privilegierten Konten innerhalb von 30 Tagen erzwingen.", en: "Enforce MFA on all privileged accounts within 30 days." },
    privileged: { de: "PAM-Lösung für Admin-Zugriffe einführen und Sessions aufzeichnen.", en: "Deploy PAM for admin access and record sessions." },
    rbac:       { de: "Rollen-Matrix definieren und Least-Privilege durchsetzen.", en: "Define role matrix and enforce least-privilege." },
    lifecycle:  { de: "Joiner-Mover-Leaver-Workflow mit HR koppeln und automatisieren.", en: "Couple Joiner-Mover-Leaver workflow with HR and automate it." },
  },
  network_security: {
    segmentation:  { de: "OT/IT-Trennung umsetzen und kritische Zonen isolieren.", en: "Implement OT/IT separation and isolate critical zones." },
    egress:        { de: "Egress-Whitelisting an Perimeter aktivieren.", en: "Activate egress whitelisting at the perimeter." },
    remote_access: { de: "VPN/RDP nur über MFA + Jump-Host zulassen.", en: "Permit VPN/RDP only via MFA + jump host." },
  },
  monitoring_logging: {
    siem:      { de: "SIEM mit Use-Cases für kritische Assets in Betrieb nehmen.", en: "Operationalise SIEM with use cases for critical assets." },
    logging:   { de: "Sicherheitslogs zentral sammeln und 12 Monate aufbewahren.", en: "Collect security logs centrally and retain for 12 months." },
    detection: { de: "EDR auf allen kritischen Hosts ausrollen, 24/7-Alarmierung sicherstellen.", en: "Roll out EDR on all critical hosts; ensure 24/7 alerting." },
  },
  vulnerability_mgmt: {
    patching: { de: "Patch-SLA festlegen (kritisch ≤ 7 Tage) und durchsetzen.", en: "Set and enforce patch SLA (critical ≤ 7 days)." },
    scanning: { de: "Authentifizierte Schwachstellen-Scans wöchentlich planen.", en: "Schedule authenticated vulnerability scans weekly." },
  },
  cryptography: {
    encryption: { de: "TLS 1.2+ erzwingen und ruhende Daten auf kritischen Systemen verschlüsseln.", en: "Enforce TLS 1.2+ and encrypt data at rest on critical systems." },
    key_mgmt:   { de: "HSM-/KMS-basiertes Schlüsselmanagement mit Rotationspolitik einführen.", en: "Introduce HSM/KMS-based key management with rotation policy." },
  },
  business_continuity: {
    backup:  { de: "Restore-Test für kritische Dienste innerhalb von 30 Tagen durchführen.", en: "Run restore test for critical services within 30 days." },
    rto_rpo: { de: "RTO/RPO je kritischem Dienst formell beschließen.", en: "Formally decide RTO/RPO per critical service." },
  },
  incident_mgmt: {
    notification_24h: { de: "Incident-Meldeworkflow (24h/72h NIS2) mit Rechtsabteilung verabschieden.", en: "Adopt incident reporting workflow (24h/72h NIS2) with legal." },
    playbook:         { de: "Top-3 Playbooks (Ransomware, BEC, Datenabfluss) erstellen und testen.", en: "Create and test top-3 playbooks (ransomware, BEC, data leak)." },
  },
  supplier_security: {
    supplier_contract:      { de: "NIS2-Klauseln in Lieferantenverträge aufnehmen.", en: "Add NIS2 clauses to supplier contracts." },
    third_party_assessment: { de: "Top-10 Lieferanten innerhalb von 60 Tagen risikobewerten.", en: "Risk-assess top-10 suppliers within 60 days." },
  },
  awareness_training: {
    // generic key — captured via fallback below
  },
};

/* ── Block 2: Closing-posture modifiers ──
 * Same control gap → different closing action depending on whether the
 * organisation has nothing in place ("introduce"), a partial implementation
 * ("strengthen"), or full implementation that lacks evidence
 * ("operationalize"). Posture is derived from missing/weak counts on the
 * RiskObject so the engine remains deterministic.
 */
export type ClosingPosture = "introduce" | "strengthen" | "operationalize";

export function derivePosture(risk: RiskObject): ClosingPosture {
  const missing = risk.missing_count ?? 0;
  const weak = risk.weak_count ?? 0;
  const total = missing + weak;
  if (total === 0) return "operationalize";
  if (missing >= weak * 2) return "introduce";
  if (weak >= missing * 2) return "strengthen";
  // Mixed gap profile — treat as strengthen (faster ROI than full re-introduction).
  return missing > weak ? "introduce" : "strengthen";
}

const POSTURE_LABEL: Record<ClosingPosture, { de: string; en: string }> = {
  introduce:      { de: "Neueinführung",     en: "Introduce" },
  strengthen:     { de: "Lückenschluss",     en: "Close gap" },
  operationalize: { de: "Wirksamkeitsnachweis", en: "Prove effectiveness" },
};

/** Posture-specific clarifying suffix appended to the base action. */
const POSTURE_SUFFIX: Record<ClosingPosture, { de: string; en: string }> = {
  introduce: {
    de: "Eigentümer benennen, Pilotbereich definieren und in 30 Tagen messbar starten.",
    en: "Appoint an owner, define a pilot scope, and start measurably within 30 days.",
  },
  strengthen: {
    de: "Bestehende Teilumsetzung auf alle in Scope-Assets ausweiten und formal dokumentieren.",
    en: "Extend the existing partial implementation to all in-scope assets and document it formally.",
  },
  operationalize: {
    de: "Wirksamkeit über KPI/Stichprobenaudit nachweisen und Steuerung in Schritt 16/17 verankern.",
    en: "Prove effectiveness via KPI/sample audit and anchor governance in steps 16/17.",
  },
};

/** Lightweight verb retargeting so an "introduce"-toned base reads naturally
 *  for a "strengthen" or "operationalize" posture. Pure string mapping —
 *  no per-template duplication required. */
function retargetVerb(base: string, posture: ClosingPosture, lang: Lang): string {
  if (posture === "introduce") return base;
  const de = lang === "de";
  if (posture === "strengthen") {
    if (de) return base
      .replace(/\beinführen\b/gi, "ausweiten")
      .replace(/\beinrichten\b/gi, "vervollständigen")
      .replace(/\baufsetzen\b/gi, "formalisieren")
      .replace(/\bausrollen\b/gi, "auf vollständige Abdeckung bringen")
      .replace(/\bin Betrieb nehmen\b/gi, "auf alle kritischen Assets ausweiten")
      .replace(/\baktivieren\b/gi, "lückenlos aktivieren");
    return base
      .replace(/\bdeploy\b/gi, "extend deployment of")
      .replace(/\bintroduce\b/gi, "extend")
      .replace(/\broll out\b/gi, "extend rollout of")
      .replace(/\boperationalise\b/gi, "complete coverage of")
      .replace(/\bactivate\b/gi, "fully activate");
  }
  // operationalize
  if (de) return base
    .replace(/\beinführen\b/gi, "auf Wirksamkeit prüfen")
    .replace(/\bausrollen\b/gi, "über Audit-Stichprobe verifizieren")
    .replace(/\bin Betrieb nehmen\b/gi, "messbar steuern (KPI + Audit)")
    .replace(/\baktivieren\b/gi, "wirksamkeitsgeprüft halten");
  return base
    .replace(/\bdeploy\b/gi, "evidence the operation of")
    .replace(/\broll out\b/gi, "audit-verify the rollout of")
    .replace(/\boperationalise\b/gi, "evidence and steer (KPI + audit)")
    .replace(/\bactivate\b/gi, "keep effectiveness-tested");
}

/** Returns an action-based immediate-action sentence. Falls back to a
 *  domain-aware default when no specific control-type was detected.
 *  Block 2: applies posture-aware closing variant (introduce / strengthen /
 *  operationalize) so "nein"-dominant and "teilweise"-dominant gaps get
 *  semantically distinct guidance. */
export function buildActionBasedNextStep(risk: RiskObject, lang: Lang): string {
  const de = lang === "de";
  const ctype = detectControlType(risk);
  const specific = ctype ? ACTION_BY_CAP_AND_TYPE[risk.capability_tag]?.[ctype] : undefined;

  const FALLBACK: Record<string, { de: string; en: string }> = {
    governance:           { de: "Verantwortlichen benennen und Richtlinien-Entwurf in 14 Tagen vorlegen.", en: "Appoint owner and submit policy draft within 14 days." },
    risk_mgmt:            { de: "Bewertungskriterien und Akzeptanzschwellen verbindlich beschließen.", en: "Adopt binding scoring criteria and acceptance thresholds." },
    asset_mgmt:           { de: "Inventar-Lücken in 30 Tagen schließen, Eigentümer eintragen.", en: "Close inventory gaps in 30 days; assign owners." },
    awareness_training:   { de: "Pflicht-Training inkl. Phishing-Test in 60 Tagen ausrollen.", en: "Roll out mandatory training incl. phishing test in 60 days." },
    personnel_security:   { de: "Hintergrundprüfung und NDA-Pflicht für Schlüsselrollen einführen.", en: "Introduce background check and NDA duty for key roles." },
    physical_security:    { de: "Zutrittskontrolle für kritische Räume binnen 30 Tagen prüfen.", en: "Audit physical access to critical rooms within 30 days." },
    secure_development:   { de: "Secure-SDLC-Mindestanforderungen verbindlich festlegen.", en: "Define mandatory minimum Secure-SDLC requirements." },
    data_protection:      { de: "DLP-Regeln für sensible Daten definieren und aktivieren.", en: "Define and activate DLP rules for sensitive data." },
    compliance_audit:     { de: "Internen Audit-Zyklus binnen 60 Tagen einplanen.", en: "Schedule internal audit cycle within 60 days." },
    endpoint_security:    { de: "EDR-Rollout auf allen Endgeräten in 60 Tagen abschließen.", en: "Complete EDR rollout on all endpoints within 60 days." },
  };
  const baseEntry = specific ?? FALLBACK[risk.capability_tag];
  const base = baseEntry
    ? baseEntry[lang]
    : (de
        ? "Verantwortlichen benennen und konkrete Maßnahme mit Frist in Schritt 9 festlegen."
        : "Appoint owner and define a concrete measure with deadline in Step 9.");

  const posture = derivePosture(risk);
  const label = POSTURE_LABEL[posture][lang];
  const retargeted = retargetVerb(base, posture, lang);
  const suffix = POSTURE_SUFFIX[posture][lang];
  return `[${label}] ${retargeted} ${suffix}`;
}



/* ─────────────────────────────────────────────────────────────────────
 * 9. Consolidation — collapse capability-level duplicates into groups
 * ─────────────────────────────────────────────────────────────────── */

import type { RiskFindingDetail } from "@/lib/riskEngine";

const SEVERITY_ORDER: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export interface ConsolidatedRiskGroup {
  key: string;
  capability_tag: string;
  scope: "asset" | "organization";
  representative: RiskObject;
  risks: RiskObject[];
  affected_assets: string[];          // unique asset names
  affected_services: string[];        // unique service names
  findings: RiskFindingDetail[];      // deduplicated by control_id
  risk_level: RiskLevel;
  max_score: number;
  total_finding_count: number;
}

/** Groups risks by capability_tag (one card per domain). Keeps org and asset
 *  scopes separate so an org-level governance group doesn't swallow asset risks. */
export function consolidateRisks(result: RiskAnalysisResult): ConsolidatedRiskGroup[] {
  const buckets = new Map<string, RiskObject[]>();
  for (const r of result.risks) {
    const key = `${r.capability_tag || "_"}::${r.scope}`;
    const arr = buckets.get(key);
    if (arr) arr.push(r); else buckets.set(key, [r]);
  }

  const groups: ConsolidatedRiskGroup[] = [];
  for (const [key, risks] of buckets.entries()) {
    risks.sort((a, b) => b.risk_score - a.risk_score);
    const representative = risks[0];
    const max_score = representative.risk_score;
    const risk_level = risks.reduce<RiskLevel>(
      (acc, r) => (SEVERITY_ORDER[r.risk_level] > SEVERITY_ORDER[acc] ? r.risk_level : acc),
      "low",
    );
    const seenControls = new Set<string>();
    const findings: RiskFindingDetail[] = [];
    for (const r of risks) {
      for (const f of r.supporting_findings) {
        if (seenControls.has(f.control_id)) continue;
        seenControls.add(f.control_id);
        findings.push(f);
      }
    }
    const assetSet = new Set<string>();
    const serviceSet = new Set<string>();
    for (const r of risks) {
      if (r.asset_name) assetSet.add(r.asset_name);
      if (r.service_name) serviceSet.add(r.service_name);
    }
    groups.push({
      key,
      capability_tag: representative.capability_tag,
      scope: representative.scope,
      representative,
      risks,
      affected_assets: [...assetSet],
      affected_services: [...serviceSet],
      findings,
      risk_level,
      max_score,
      total_finding_count: risks.reduce((s, r) => s + r.finding_count, 0),
    });
  }

  // Sort: by severity then score
  groups.sort((a, b) => {
    const sev = SEVERITY_ORDER[b.risk_level] - SEVERITY_ORDER[a.risk_level];
    if (sev !== 0) return sev;
    return b.max_score - a.max_score;
  });
  return groups;
}

/** Returns a consolidated, decision-grade title for a group. */
export function consolidatedGroupTitle(group: ConsolidatedRiskGroup, lang: Lang): string {
  const base = friendlyRiskTitle(group.representative, lang);
  // Strip asset suffix from representative's title for the consolidated header
  // (we'll list affected assets separately).
  if (group.scope === "asset" && group.affected_assets.length > 1) {
    const baseNoAsset = RISK_FRIENDLY_NAME[group.capability_tag]?.[lang] ?? base;
    return baseNoAsset;
  }
  return base;
}

/* ─────────────────────────────────────────────────────────────────────
 * 10. Measure-text improver — replace generic phrasing with concrete action
 * ─────────────────────────────────────────────────────────────────── */

const GENERIC_PATTERNS_EXTENDED = [
  /teilumsetzung/i,
  /vervollständig/i,
  /verbessern/i,
  /analysier/i,
  /überprüf/i,
  /dokumentier/i,
  /benenn/i,
  /etablier/i,
  /implementier(?!ung\s+\w)/i,
  /sicherstell/i,
  /complete\s+the/i,
  /improve/i,
  /analyse/i,
  /review/i,
  /document/i,
  /appoint/i,
  /establish/i,
];

function isWeakMeasure(text: string): boolean {
  if (!text) return true;
  if (text.length < 20) return true;
  // weak if it matches a generic pattern AND has fewer than 8 words
  const words = text.split(/\s+/).length;
  if (words < 6) return true;
  return GENERIC_PATTERNS_EXTENDED.some(p => p.test(text)) && words < 12;
}

/** Returns a sharper measure: if the existing one is generic/short,
 *  swap in the action-based next step for that risk. */
export function improveMeasureText(
  measure: string,
  risk: RiskObject,
  lang: Lang,
): string {
  if (!isWeakMeasure(measure)) return measure;
  return buildActionBasedNextStep(risk, lang);
}

/* ─────────────────────────────────────────────────────────────────────
 * 11. Decision Panel — one-page management decision summary (page 1)
 * ─────────────────────────────────────────────────────────────────── */

export interface DecisionPanel {
  topRiskDriver: string;
  topDriverWhy: string;          // "Weil"-line: why this driver was chosen (data-backed)
  biggestRisk: string;
  immediateFocus: string;
  riskLevel: string;
  riskLevelColor: "critical" | "high" | "medium" | "low";
  strategy: string;
  trend: string;
  exposure: string;
  criticalCount: number;
  highCount: number;
  coveragePct: number;           // share of risks at Critical+High level (0–100)
  coverageLabel: string;         // localized "X von Y Risiken kritisch/hoch"
  nis2Articles: string[];        // intersected NIS2 articles for top clusters
}

// NIS2 article mapping per capability_tag (deterministic build-time table).
export const NIS2_ARTICLES_BY_CAP: Record<string, string[]> = {
  governance:           ["Art. 20", "Art. 21"],
  risk_mgmt:            ["Art. 21"],
  asset_mgmt:           ["Art. 21"],
  identity_access_mgmt: ["Art. 21(2)(i)", "Art. 21(2)(j)"],
  supplier_security:    ["Art. 21(2)(d)"],
  incident_mgmt:        ["Art. 21(2)(b)", "Art. 23"],
  business_continuity:  ["Art. 21(2)(c)"],
  compliance_audit:     ["Art. 21(2)(f)"],
  awareness_training:   ["Art. 21(2)(g)"],
  network_security:     ["Art. 21(2)(e)"],
  endpoint_security:    ["Art. 21(2)(e)"],
  vulnerability_mgmt:   ["Art. 21(2)(e)"],
  cryptography:         ["Art. 21(2)(h)"],
  monitoring_logging:   ["Art. 21(2)(b)"],
  data_protection:      ["Art. 21(2)(h)"],
  personnel_security:   ["Art. 21(2)(i)"],
  physical_security:    ["Art. 21(2)(c)"],
  secure_development:   ["Art. 21(2)(e)"],
};

/**
 * Cross-regulation mapping per capability_tag.
 * Deterministic build-time table covering NIS2, GDPR, DORA, KRITIS / BSI-KritisV.
 * Empty array = capability has no direct obligation under that regime.
 */
export const REGULATION_MAPPING_BY_CAP: Record<string, {
  nis2: string[];
  gdpr: string[];
  dora: string[];
  kritis: string[];
}> = {
  governance:           { nis2: ["Art. 20", "Art. 21(1)"],         gdpr: ["Art. 5(2)", "Art. 24"],          dora: ["Art. 5"],            kritis: [] },
  risk_mgmt:            { nis2: ["Art. 21(1)", "Art. 21(2)(a)"],   gdpr: ["Art. 32(1)", "Art. 35"],         dora: ["Art. 6", "Art. 8"],  kritis: [] },
  asset_mgmt:           { nis2: ["Art. 21(2)(a)"],                 gdpr: ["Art. 30"],                       dora: ["Art. 8(1)"],         kritis: [] },
  identity_access_mgmt: { nis2: ["Art. 21(2)(i)", "Art. 21(2)(j)"],gdpr: ["Art. 32(1)(b)"],                 dora: ["Art. 9(4)(c)"],      kritis: [] },
  supplier_security:    { nis2: ["Art. 21(2)(d)", "Art. 22"],      gdpr: ["Art. 28"],                       dora: ["Art. 28-30"],        kritis: [] },
  incident_mgmt:        { nis2: ["Art. 21(2)(b)", "Art. 23"],      gdpr: ["Art. 33", "Art. 34"],            dora: ["Art. 17-23"],        kritis: [] },
  business_continuity:  { nis2: ["Art. 21(2)(c)"],                 gdpr: ["Art. 32(1)(c)"],                 dora: ["Art. 11", "Art. 12"],kritis: [] },
  compliance_audit:     { nis2: ["Art. 21(2)(f)", "Art. 32"],      gdpr: ["Art. 5(2)", "Art. 24(1)"],       dora: ["Art. 6(5)"],         kritis: [] },
  awareness_training:   { nis2: ["Art. 21(2)(g)", "Art. 20(2)"],   gdpr: ["Art. 39(1)(b)"],                 dora: ["Art. 13(6)"],        kritis: [] },
  network_security:     { nis2: ["Art. 21(2)(e)"],                 gdpr: ["Art. 32(1)(b)"],                 dora: ["Art. 9(2)"],         kritis: [] },
  endpoint_security:    { nis2: ["Art. 21(2)(e)"],                 gdpr: ["Art. 32(1)(b)"],                 dora: ["Art. 9(2)"],         kritis: [] },
  vulnerability_mgmt:   { nis2: ["Art. 21(2)(e)", "Art. 21(2)(f)"],gdpr: ["Art. 32(1)(d)"],                 dora: ["Art. 10"],           kritis: [] },
  cryptography:         { nis2: ["Art. 21(2)(h)"],                 gdpr: ["Art. 32(1)(a)"],                 dora: ["Art. 9(4)(b)"],      kritis: [] },
  monitoring_logging:   { nis2: ["Art. 21(2)(b)", "Art. 23"],      gdpr: ["Art. 32(1)(d)", "Art. 33(5)"],   dora: ["Art. 10(1)"],        kritis: [] },
  data_protection:      { nis2: ["Art. 21(2)(h)"],                 gdpr: ["Art. 5", "Art. 25", "Art. 32"],  dora: ["Art. 9(4)(b)"],      kritis: [] },
  personnel_security:   { nis2: ["Art. 21(2)(i)"],                 gdpr: ["Art. 29", "Art. 32(4)"],         dora: ["Art. 13"],           kritis: [] },
  physical_security:    { nis2: ["Art. 21(2)(c)", "Art. 21(2)(e)"],gdpr: ["Art. 32(1)(b)"],                 dora: ["Art. 9(3)"],         kritis: [] },
  secure_development:   { nis2: ["Art. 21(2)(e)"],                 gdpr: ["Art. 25"],                       dora: ["Art. 8(2)", "Art. 16"],kritis: [] },
};

export function buildDecisionPanel(result: RiskAnalysisResult, lang: Lang): DecisionPanel {
  const de = lang === "de";
  const summary = result.summary;
  const topBucket = result.risks.filter(r => r.risk_level === "critical" || r.risk_level === "high");

  // Top capability tags by frequency
  const tagCount = new Map<string, number>();
  for (const r of topBucket) tagCount.set(r.capability_tag, (tagCount.get(r.capability_tag) ?? 0) + 1);
  const sortedTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]);
  const top1 = sortedTags[0]?.[0];
  const top3 = sortedTags.slice(0, 3);
  const top3Tags = top3.map(([t]) => humanCap(t, lang));

  const topRiskDriver = top1
    ? (de ? `Fehlende Steuerung in ${humanCap(top1, lang)}` : `Missing control in ${humanCap(top1, lang)}`)
    : (de ? "Keine kritischen Treiber identifiziert" : "No critical drivers identified");

  // "Weil"-line: data-backed justification of why these clusters are the drivers.
  const clustersCount = top3.length;
  const hkInClusters = top3.reduce((s, [, n]) => s + n, 0);
  const totalHk = topBucket.length;
  const articleSet = new Set<string>();
  for (const [tag] of top3) (NIS2_ARTICLES_BY_CAP[tag] ?? []).forEach(a => articleSet.add(a));
  const articles = [...articleSet];
  const topDriverWhy = clustersCount > 0 && totalHk > 0
    ? (de
        ? `Diese ${clustersCount} Cluster verursachen ${hkInClusters} von ${totalHk} Hoch/Kritisch-Befunden${articles.length > 0 ? ` und decken ${articles.length} NIS2-Artikel ab (${articles.join(", ")})` : ""}.`
        : `These ${clustersCount} clusters cause ${hkInClusters} of ${totalHk} High/Critical findings${articles.length > 0 ? ` and span ${articles.length} NIS2 articles (${articles.join(", ")})` : ""}.`)
    : (de
        ? "Keine signifikante Cluster-Bildung — Risiken sind breit verteilt."
        : "No significant clustering — risks are broadly distributed.");

  const hasIncident = sortedTags.some(([t]) => t === "incident_mgmt");
  const hasGov = sortedTags.some(([t]) => t === "governance" || t === "risk_mgmt");
  const biggestRisk = de
    ? (hasIncident
        ? "NIS2-Meldepflichtverletzung (24h/72h) + Betriebsunterbrechung kritischer Dienste"
        : hasGov
          ? "Fehlende Governance-Struktur + regulatorische Sanktionen nach NIS2"
          : "Betriebsunterbrechung kritischer Dienste mit regulatorischer Wirkung")
    : (hasIncident
        ? "NIS2 reporting breach (24h/72h) + operational disruption of critical services"
        : hasGov
          ? "Missing governance structure + regulatory sanctions under NIS2"
          : "Operational disruption of critical services with regulatory impact");

  const immediateFocus = top3Tags.length > 0
    ? top3Tags.join(de ? " · " : " · ")
    : (de ? "Aufrechterhaltung bestehender Kontrollen" : "Maintain existing controls");

  let riskLevelColor: DecisionPanel["riskLevelColor"] = "low";
  let riskLevel: string;
  if (summary.bySeverity.critical > 0) {
    riskLevelColor = "critical";
    riskLevel = de ? "KRITISCH" : "CRITICAL";
  } else if (summary.bySeverity.high > 0) {
    riskLevelColor = "high";
    riskLevel = de ? "HOCH" : "HIGH";
  } else if (summary.bySeverity.medium > 0) {
    riskLevelColor = "medium";
    riskLevel = de ? "MITTEL" : "MEDIUM";
  } else {
    riskLevelColor = "low";
    riskLevel = de ? "NIEDRIG" : "LOW";
  }

  const orgShare = topBucket.length > 0
    ? topBucket.filter(r => r.scope === "organization").length / topBucket.length
    : 0;
  const strategy = de
    ? (orgShare >= 0.5
        ? "Governance & Prozesse stabilisieren → danach technische Maßnahmen optimieren"
        : "Technische Quick-Wins parallel zu Prozessverankerung umsetzen")
    : (orgShare >= 0.5
        ? "Stabilise governance & processes first → then optimise technical controls"
        : "Deliver technical quick-wins in parallel with process anchoring");

  const trend = topBucket.length >= 5
    ? (de ? "↑ steigend ohne Maßnahmen" : "↑ rising without action")
    : topBucket.length > 0
      ? (de ? "→ stabil-kritisch" : "→ stable-critical")
      : (de ? "↓ kontrolliert" : "↓ controlled");

  const affectedServices = new Set(result.risks.map(r => r.service_name).filter(Boolean));
  const exposure = affectedServices.size > 1
    ? (de ? `${affectedServices.size} kritische Dienste betroffen` : `${affectedServices.size} critical services affected`)
    : affectedServices.size === 1
      ? (de ? "1 kritischer Dienst betroffen" : "1 critical service affected")
      : (de ? "Organisationsweite Wirkung" : "Organisation-wide impact");

  const coveragePct = summary.totalRisks > 0
    ? Math.round((totalHk / summary.totalRisks) * 100)
    : 0;
  const coverageLabel = summary.totalRisks > 0
    ? (de
        ? `${totalHk} von ${summary.totalRisks} Risiken kritisch/hoch (${coveragePct}%)`
        : `${totalHk} of ${summary.totalRisks} risks critical/high (${coveragePct}%)`)
    : (de ? "Keine Risiken bewertet" : "No risks assessed");

  return {
    topRiskDriver,
    topDriverWhy,
    biggestRisk,
    immediateFocus,
    riskLevel,
    riskLevelColor,
    strategy,
    trend,
    exposure,
    criticalCount: summary.bySeverity.critical,
    highCount: summary.bySeverity.high,
    coveragePct,
    coverageLabel,
    nis2Articles: articles,
  };
}

/* ─────────────────────────────────────────────────────────────────────
 * 12. Risk Story Line — narrative attack chain ("if not closed, then…")
 * ─────────────────────────────────────────────────────────────────── */

export interface RiskStoryLine {
  intro: string;
  steps: string[];
  outcome: string;
}

export function buildRiskStoryLine(result: RiskAnalysisResult, lang: Lang): RiskStoryLine | null {
  const de = lang === "de";
  const topBucket = result.risks.filter(r => r.risk_level === "critical" || r.risk_level === "high");
  if (topBucket.length === 0) return null;

  const tags = new Set(topBucket.map(r => r.capability_tag));
  const steps: string[] = [];

  if (tags.has("identity_access_mgmt")) {
    steps.push(de
      ? "Ein Angreifer nutzt schwache Identitäts- und Zugriffskontrollen (IAM) als Eintrittspunkt."
      : "An attacker exploits weak identity & access controls (IAM) as the entry point.");
  } else if (tags.has("vulnerability_mgmt") || tags.has("endpoint_security")) {
    steps.push(de
      ? "Ein Angreifer nutzt eine ungepatchte Schwachstelle auf einem Endpoint als Eintrittspunkt."
      : "An attacker exploits an unpatched endpoint vulnerability as the entry point.");
  } else if (tags.has("supplier_security")) {
    steps.push(de
      ? "Ein kompromittierter Lieferant dient als Eintrittsweg in die Organisation."
      : "A compromised supplier serves as the entry path into the organisation.");
  } else {
    steps.push(de
      ? "Ein Angreifer findet einen Eintrittspunkt aufgrund fehlender Basisschutzkontrollen."
      : "An attacker finds an entry point due to missing baseline controls.");
  }

  if (tags.has("network_security")) {
    steps.push(de
      ? "Mangels Netzwerksegmentierung bewegt sich der Angreifer lateral zwischen Systemen."
      : "Without network segmentation, the attacker moves laterally between systems.");
  } else {
    steps.push(de
      ? "Der Angreifer eskaliert Berechtigungen und erreicht kritische Systeme."
      : "The attacker escalates privileges and reaches critical systems.");
  }

  if (tags.has("monitoring_logging")) {
    steps.push(de
      ? "Fehlendes Monitoring & Logging verzögern die Erkennung um Tage oder Wochen."
      : "Missing monitoring & logging delay detection by days or weeks.");
  }

  if (tags.has("incident_mgmt")) {
    steps.push(de
      ? "Ohne dokumentierten Incident-Prozess kann die Organisation nicht innerhalb von 24h an die zuständige Behörde melden (NIS2 Art. 23)."
      : "Without a documented incident process, the organisation cannot report to the competent authority within 24h (NIS2 Art. 23).");
  }

  if (tags.has("business_continuity")) {
    steps.push(de
      ? "Fehlende Business-Continuity-Pläne verlängern den Betriebsausfall erheblich."
      : "Missing business continuity plans significantly extend the operational outage.");
  }

  const intro = de
    ? "Wenn diese Lücken nicht geschlossen werden, entsteht typischerweise folgende Wirkungskette:"
    : "If these gaps are not closed, the following impact chain typically materialises:";

  const outcome = de
    ? "Ergebnis: Bußgelder (bis 2 % des weltweiten Jahresumsatzes), Betriebsunterbrechung kritischer Dienste, Reputationsverlust und persönliche Haftung der Geschäftsleitung (NIS2 Art. 20)."
    : "Outcome: fines (up to 2% of global annual turnover), disruption of critical services, reputational damage and personal liability of executive management (NIS2 Art. 20).";

  return { intro, steps, outcome };
}

/* ─────────────────────────────────────────────────────────────────────
 * 13. "Umsetzung in 3 Schritten" — repeatable execution recipe
 * ─────────────────────────────────────────────────────────────────── */

export function buildThreeStepImplementation(risk: RiskObject, lang: Lang): string[] {
  const de = lang === "de";
  const tag = risk.capability_tag;

  const owner = (() => {
    if (tag === "governance" || tag === "compliance_audit" || tag === "risk_mgmt")
      return de ? "CISO / Geschäftsleitung" : "CISO / Executive Management";
    if (tag === "supplier_security")
      return de ? "Einkauf / CISO" : "Procurement / CISO";
    if (tag === "awareness_training" || tag === "data_protection")
      return de ? "HR / Datenschutzbeauftragter" : "HR / Data Protection Officer";
    if (tag === "business_continuity" || tag === "incident_mgmt")
      return de ? "IT-Leitung / Krisenstab" : "IT Lead / Crisis Team";
    return de ? "CISO / IT-Leitung" : "CISO / IT Lead";
  })();

  return de
    ? [
        `Verantwortlichen benennen (${owner}) und Mandat schriftlich festhalten.`,
        "Prozess definieren, dokumentieren und gegen Standard (ISO 27001 / NIS2) abgleichen.",
        "Technische Umsetzung + regelmäßige Wirksamkeitsprüfung (mind. jährlich, Nachweis archivieren).",
      ]
    : [
        `Appoint a responsible owner (${owner}) and document the mandate in writing.`,
        "Define the process, document it and align it with the relevant standard (ISO 27001 / NIS2).",
        "Implement technical controls + periodic effectiveness review (at least annually, archive evidence).",
      ];
}

/* ─────────────────────────────────────────────────────────────────────
 * 14. Area breakdown — capability_tag × severity for stacked bar/table
 * ─────────────────────────────────────────────────────────────────── */

export interface AreaBreakdownRow {
  capability_tag: string;
  label: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export function buildAreaBreakdown(result: RiskAnalysisResult, lang: Lang): AreaBreakdownRow[] {
  const map = new Map<string, AreaBreakdownRow>();
  for (const r of result.risks) {
    const key = r.capability_tag || "_";
    let row = map.get(key);
    if (!row) {
      row = {
        capability_tag: key,
        label: humanCap(key, lang),
        critical: 0, high: 0, medium: 0, low: 0, total: 0,
      };
      map.set(key, row);
    }
    row[r.risk_level] += 1;
    row.total += 1;
  }
  return [...map.values()].sort((a, b) => {
    // critical+high first, then total
    const ah = a.critical * 100 + a.high * 10 + a.total;
    const bh = b.critical * 100 + b.high * 10 + b.total;
    return bh - ah;
  });
}

// ─────────────────────────────────────────────────────────────────────────
// 10. Behandlung / Restrisiko / Akzeptanz — berichtsfertige Zeilen (P4.B.2/B.3)
// ─────────────────────────────────────────────────────────────────────────
// Der Risiko-Bericht (riskReport*.ts) gibt heute nur die Analyse aus. Diese
// Funktion liefert je Risiko die Behandlungsdaten (Strategie, Status, Rest-L/I,
// Rest-Score/-Stufe, Restrisiko-Akzeptanz, Akzeptanz-Begründung/Freigabe) als
// flache Zeilen, damit der Bericht sie ohne weitere Logik tabellieren kann.

export interface TreatmentRegisterRow {
  risk_id: string;
  title: string;
  source: "engine" | "manual";
  level: string;
  score: number;
  strategy: string;
  status: string;
  residual_li: string;          // "L 2 × I 3" (oder "—" wenn nicht erfasst)
  residual_score: number;
  residual_level: string;
  residual_accepted_by: string;
  residual_accepted_at: string;
  acceptance_required: boolean;
  acceptance_ok: boolean;
  acceptance_justification: string;
  acceptance_approver: string;
  acceptance_date: string;
}

export function buildTreatmentRegisterRows(
  result: RiskAnalysisResult,
  treatments: TreatmentObject[],
  lang: Lang,
  config: RiskMatrixConfig = result.config,
): TreatmentRegisterRow[] {
  const de = lang === "de";
  const tMap = new Map(treatments.map(t => [t.risk_id, t]));
  return result.risks.map(r => {
    const t = tMap.get(r.risk_id);
    const eff = effectiveResidualLI(r, t);
    const s = scoreAndLevel(eff.likelihood, eff.impact, config);
    const gate = t ? acceptanceGateStatus(r, t) : { required: false, ok: true, missing: [] as string[] };
    const statusOpt = STATUS_OPTIONS.find(o => o.value === t?.status);
    return {
      risk_id: r.risk_id,
      title: de ? r.gap_title : r.gap_title_en,
      source: r.risk_source === "manual" ? "manual" : "engine",
      level: riskLevelLabel(r.risk_level, lang),
      score: r.risk_score,
      strategy: t ? strategyLabel(t.strategy, lang) : "—",
      status: statusOpt ? (de ? statusOpt.labelDe : statusOpt.labelEn) : "—",
      residual_li: eff.captured ? `L ${eff.likelihood} × I ${eff.impact}` : "—",
      residual_score: s.score,
      residual_level: riskLevelLabel(s.level, lang),
      residual_accepted_by: t?.residual_accepted_by ?? "",
      residual_accepted_at: t?.residual_accepted_at ?? "",
      acceptance_required: gate.required,
      acceptance_ok: gate.ok,
      acceptance_justification: t?.acceptance_justification ?? "",
      acceptance_approver: t?.acceptance_approver ?? "",
      acceptance_date: t?.acceptance_date ?? "",
    };
  });
}
