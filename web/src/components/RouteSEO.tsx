import { useLocation, matchPath } from "react-router-dom";
import SEO from "./SEO";

type Meta = { title: string; description: string; noindex?: boolean };

// Tool / pipeline routes — auth-gated, noindex but unique titles to satisfy
// "metadata quality" checks and avoid sharing the homepage meta.
const ROUTE_META: Record<string, Meta> = {
  "/context": {
    title: "Unternehmenskontext – UniqSuite",
    description: "Schritt 1: Unternehmensprofil, Branche und Standort als Grundlage der regulatorischen Betroffenheitspruefung erfassen.",
    noindex: true,
  },
  "/betroffenheit": {
    title: "Betroffenheitspruefung – UniqSuite",
    description: "Schritt 2: Pruefung der regulatorischen Betroffenheit (u. a. NIS2, DORA, KRITIS) nach Sektoren und Schwellenwerten.",
    noindex: true,
  },
  "/services": {
    title: "Service-Kritikalitaet – UniqSuite",
    description: "Schritt 3: Geschaeftsservices erfassen und mit dem hybriden 0-4 Scoring-Modell als kritisch einstufen.",
    noindex: true,
  },
  "/assets": {
    title: "Asset-Inventar – UniqSuite",
    description: "Schritt 4: Asset-Inventar pro Service mit Eigentuemer, Klassifizierung und Vererbung der Kritikalitaet pflegen.",
    noindex: true,
  },
  "/dependencies": {
    title: "Abhaengigkeitsanalyse – UniqSuite",
    description: "Schritt 5: Service- und Lieferantenabhaengigkeiten visualisieren und Single-Points-of-Failure aufdecken.",
    noindex: true,
  },
  "/baseline": {
    title: "Baseline-Assessment – UniqSuite",
    description: "Schritt 6: Aktuellen Reifegrad der ISO-27001- und framework-spezifischen Controls organisationsweit bewerten.",
    noindex: true,
  },
  "/umsetzung": {
    title: "Umsetzung – UniqSuite",
    description: "Setup und Steuerung der Compliance-Umsetzung im Unternehmen.",
    noindex: true,
  },
  "/check": {
    title: "Compliance-Check – UniqSuite",
    description: "Schritt 7: Detaillierter Compliance-Check pro Kategorie zur Identifikation von Gaps gegenueber den aktiven Frameworks.",
    noindex: true,
  },
  "/overview": {
    title: "Gap-Analyse Uebersicht – UniqSuite",
    description: "Konsolidierte Sicht auf alle Compliance-Gaps mit Schweregrad, betroffenen Capabilities und priorisierten Massnahmen.",
    noindex: true,
  },
  "/risk-matrix": {
    title: "Risikomatrix – UniqSuite",
    description: "Schritt 8: Automatisch generierte Risiken in einer konfigurierbaren 5x5-Matrix mit Eintrittswahrscheinlichkeit und Auswirkung.",
    noindex: true,
  },
  "/decisions": {
    title: "Risikobehandlung – UniqSuite",
    description: "Schritt 9: Risikostrategien (Akzeptieren, Mitigieren, Transferieren, Vermeiden) und Massnahmenplanung.",
    noindex: true,
  },
  "/soa": {
    title: "Statement of Applicability – UniqSuite",
    description: "Schritt 10: SoA mit Status, Begruendungen und Verbindung zu Assessment- und Treatment-Daten.",
    noindex: true,
  },
  "/maturity": {
    title: "Reifegrad-Modell – UniqSuite",
    description: "Schritt 11: Reifegrad pro Domaene und Compliance-Kategorie mit Dual-View und Zielwerten.",
    noindex: true,
  },
  "/execution": {
    title: "Massnahmen-Tracking – UniqSuite",
    description: "Schritt 12: Umsetzung steuern mit Status Offen, Laufend, Fertig und Initiative-Gruppierung.",
    noindex: true,
  },
  "/incidents": {
    title: "Incident-Register – UniqSuite",
    description: "Schritt 13: Sicherheitsvorfaelle mit Meldepflichten (u. a. NIS2 24h/72h, DSGVO 72h, DORA) und Checkliste verwalten.",
    noindex: true,
  },
  "/policies": {
    title: "Richtlinien & Policies – UniqSuite",
    description: "Schritt 14: Modulare Richtlinien (c00-IDs) mit eingebetteter Schulungsverifizierung und Exportoptionen.",
    noindex: true,
  },
  "/roadmap": {
    title: "Umsetzungs-Roadmap – UniqSuite",
    description: "Schritt 15: Sequenzierte Now/Next/Later-Roadmap mit Bundle-Konsolidierung und rollenbasiertem Aufwand.",
    noindex: true,
  },
  "/kpis": {
    title: "KPI-Dashboard – UniqSuite",
    description: "Schritt 16: 18 ISMS-Kennzahlen mit taeglichen Snapshots und Trendverfolgung.",
    noindex: true,
  },
  "/management-report": {
    title: "Management-Report – UniqSuite",
    description: "Auswertungen und Berichte fuer die Geschaeftsleitung zur Compliance-Umsetzung.",
    noindex: true,
  },
  "/audit": {
    title: "Audit-Management – UniqSuite",
    description: "Schritt 17: Interne Audits, Findings und Korrekturmassnahmen mit Auditor- und Status-Logik.",
    noindex: true,
  },
  "/kvp": {
    title: "KVP & Act-Phase – UniqSuite",
    description: "Schritt 18: Kontinuierliche Verbesserung mit Signalen aus Risiko, KPIs und Audit.",
    noindex: true,
  },
  "/settings": {
    title: "Einstellungen – UniqSuite",
    description: "Konto-, Sprach- und Benachrichtigungseinstellungen verwalten.",
    noindex: true,
  },
  "/admin": {
    title: "Admin-Panel – UniqSuite",
    description: "Administrationsbereich fuer UniqSuite.",
    noindex: true,
  },
  "/lecturer": {
    title: "Dozenten-Workspace – UniqSuite",
    description: "Arbeitsbereich fuer Dozenten und Trainer.",
    noindex: true,
  },
  "/cookie-einstellungen": {
    title: "Cookie-Einstellungen – UniqSuite",
    description: "Cookie-Praeferenzen verwalten und Einwilligungen anpassen.",
  },
  "/reset-password": {
    title: "Passwort zuruecksetzen – UniqSuite",
    description: "Setzen Sie Ihr Passwort fuer den UniqSuite-Zugang zurueck.",
    noindex: true,
  },
  "/unsubscribe": {
    title: "Newsletter abmelden – UniqSuite",
    description: "Vom UniqSuite-Newsletter und Marketing-E-Mails abmelden.",
    noindex: true,
  },
  "/accept-invite": {
    title: "Einladung annehmen – UniqSuite",
    description: "Einladung zu einem UniqSuite-Arbeitsbereich annehmen.",
    noindex: true,
  },
};

// Dynamic patterns
const PATTERN_META: Array<{ pattern: string; build: (params: Record<string, string | undefined>) => Meta }> = [
  {
    pattern: "/check/:categoryId",
    build: (p) => ({
      title: `Compliance-Check: ${p.categoryId ?? "Kategorie"} – UniqSuite`,
      description: `Detaillierter Compliance-Check der Kategorie ${p.categoryId ?? ""} mit Status, Gaps und Findings.`,
      noindex: true,
    }),
  },
];

const RouteSEO = () => {
  const { pathname } = useLocation();

  let meta: Meta | undefined = ROUTE_META[pathname];
  if (!meta) {
    for (const { pattern, build } of PATTERN_META) {
      const match = matchPath(pattern, pathname);
      if (match) {
        meta = build(match.params);
        break;
      }
    }
  }

  if (!meta) return null;
  return <SEO title={meta.title} description={meta.description} path={pathname} noindex={meta.noindex} />;
};

export default RouteSEO;
