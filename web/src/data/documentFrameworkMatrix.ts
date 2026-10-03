import type { FrameworkKey } from "@/contexts/FrameworkContext";
import ALL_POLICY_TEMPLATES from "./policyTemplates";

// OTOMATİK ÜRETİLDİ — kaynak: dokument_framework_matrix.csv (Komplettpaket 2026-07-04).
// 152 Dokumente × 17 Frameworks (inkl. KRITIS_DACHG). Pflichtstufe je Zelle: Muss/SoA-abhängig/Empfohlen; leere Zellen = nicht gefordert.

export type Pflichtstufe = "Muss" | "SoA-abhängig" | "Empfohlen";

export interface MatrixDoc {
  docId: string;
  typ: string;
  nameDe: string;
  kategorie: string;
  werkzeug: string;
  frameworks: Partial<Record<string, Pflichtstufe>>;
  /**
   * Aktualitätshinweis zur Rechtslage — nur dort gesetzt, wo die Pflichtstufe
   * allein irreführend wäre. Beispiel: eine Pflicht, deren Rechtsgrundlage in
   * Kraft ist, deren ADRESSAT aber noch nicht feststeht, weil die zugehörige
   * Rechtsverordnung fehlt. „Muss" ist dann fachlich richtig und für den
   * heutigen Tag trotzdem missverständlich.
   */
  hinweis?: { de: string; en: string };
}

/**
 * Anzeigename einer Matrixzeile — IMMER über die Dokumentvorlage.
 *
 * `nameDe` in dieser Datei ist eine Zweitschrift desselben Namens und lief
 * auseinander: 13 Zeilen trugen einen anderen Titel als die Vorlage, darunter
 * „KRITIS-Registrierung & Kontaktstelle (§8b)" (die Vorschrift heißt seit der
 * BSIG-Neufassung § 33) und „Datenpannen-Meldeverfahren (72h)" (die Frist gilt
 * nur „sofern machbar"). Ein Dokument hat EINEN Namen; die Vorlage führt ihn,
 * die Matrix zeigt ihn nur an. `nameDe` bleibt als Rückfall bestehen, falls
 * eine Zeile einmal keine Vorlage hat.
 */
export function matrixDocName(row: MatrixDoc, de: boolean = true): string {
  const t = ALL_POLICY_TEMPLATES.find((x) => x.id.toUpperCase() === row.docId.toUpperCase());
  if (!t) return row.nameDe;
  return de ? t.name : (t.nameEn || t.name);
}

export const DOCUMENT_FRAMEWORK_MATRIX: MatrixDoc[] = [
  {
    "docId": "P01",
    "typ": "Richtlinie",
    "nameDe": "Informationssicherheitsrichtlinie",
    "kategorie": "Governance & Risiko",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "ISO42001": "Muss",
      "AIACT": "Empfohlen",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P02",
    "typ": "Richtlinie",
    "nameDe": "Risikomanagement-Richtlinie",
    "kategorie": "Governance & Risiko",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "ISO42001": "Muss",
      "AIACT": "Muss",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P03",
    "typ": "Richtlinie",
    "nameDe": "Risikobewertungsmethodik-Richtlinie",
    "kategorie": "Governance & Risiko",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "ISO42001": "Muss",
      "AIACT": "Muss",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P04",
    "typ": "Richtlinie",
    "nameDe": "Compliance- & Regulierungs-Richtlinie",
    "kategorie": "Governance & Risiko",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "SoA-abhängig",
      "BSI200_4": "SoA-abhängig",
      "ISO42001": "SoA-abhängig",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P05",
    "typ": "Richtlinie",
    "nameDe": "Interne Audit-Richtlinie",
    "kategorie": "Governance & Risiko",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "ISO42001": "Muss",
      "AIACT": "Empfohlen",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Muss"
    }
  },
  {
    "docId": "P06",
    "typ": "Richtlinie",
    "nameDe": "Kontrollwirksamkeit & Überprüfungs-Richtlinie",
    "kategorie": "Governance & Risiko",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "ISO42001": "Muss",
      "AIACT": "Empfohlen",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Muss"
    }
  },
  {
    "docId": "P07",
    "typ": "Richtlinie",
    "nameDe": "Asset-Management-Richtlinie",
    "kategorie": "Asset-Management",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P08",
    "typ": "Richtlinie",
    "nameDe": "IT-Asset-Inventar & Abhängigkeits-Richtlinie",
    "kategorie": "Asset-Management",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P09",
    "typ": "Richtlinie",
    "nameDe": "Kritische Dienste Identifikations-Richtlinie",
    "kategorie": "Asset-Management",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P10",
    "typ": "Richtlinie",
    "nameDe": "Zugriffskontroll-Richtlinie",
    "kategorie": "Zugriffssteuerung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P11",
    "typ": "Richtlinie",
    "nameDe": "Identitäts- & Authentifizierungs-Richtlinie",
    "kategorie": "Zugriffssteuerung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P12",
    "typ": "Richtlinie",
    "nameDe": "Privileged Access Management-Richtlinie",
    "kategorie": "Zugriffssteuerung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P13",
    "typ": "Richtlinie",
    "nameDe": "Passwort-Richtlinie",
    "kategorie": "Zugriffssteuerung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P14",
    "typ": "Richtlinie",
    "nameDe": "Benutzer-Onboarding-Richtlinie",
    "kategorie": "Zugriffssteuerung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P15",
    "typ": "Richtlinie",
    "nameDe": "Benutzer-Offboarding-Richtlinie",
    "kategorie": "Zugriffssteuerung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P16",
    "typ": "Richtlinie",
    "nameDe": "Netzwerksicherheits-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P17",
    "typ": "Richtlinie",
    "nameDe": "Endpoint-Sicherheits-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P18",
    "typ": "Richtlinie",
    "nameDe": "Systemhärtungs-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P19",
    "typ": "Richtlinie",
    "nameDe": "Sicherheits-Konfigurationsbaseline-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P20",
    "typ": "Richtlinie",
    "nameDe": "Malware-Schutz-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P21",
    "typ": "Richtlinie",
    "nameDe": "Schwachstellenmanagement-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P22",
    "typ": "Richtlinie",
    "nameDe": "Patch-Management-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P23",
    "typ": "Richtlinie",
    "nameDe": "Mobile Device Management (MDM)-Richtlinie",
    "kategorie": "Geräte & Medien",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "Empfohlen",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P24",
    "typ": "Richtlinie",
    "nameDe": "Medienhandhabung & Datenträger-Richtlinie",
    "kategorie": "Geräte & Medien",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "Empfohlen",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P25",
    "typ": "Richtlinie",
    "nameDe": "Clean Desk & Clear Screen-Richtlinie",
    "kategorie": "Geräte & Medien",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "Empfohlen",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P26",
    "typ": "Richtlinie",
    "nameDe": "Überwachungs- & Erkennungs-Richtlinie",
    "kategorie": "Überwachung & Erkennung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P27",
    "typ": "Richtlinie",
    "nameDe": "Protokollierungs-Richtlinie",
    "kategorie": "Überwachung & Erkennung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Muss",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P28",
    "typ": "Richtlinie",
    "nameDe": "Security Event Management-Richtlinie",
    "kategorie": "Überwachung & Erkennung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P29",
    "typ": "Richtlinie",
    "nameDe": "Sicherheitsüberwachungsstrategie-Richtlinie",
    "kategorie": "Überwachung & Erkennung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P30",
    "typ": "Richtlinie",
    "nameDe": "Incident-Response-Richtlinie",
    "kategorie": "Vorfallmanagement",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Muss",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Muss",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Muss",
      "SOC2": "Muss",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P31",
    "typ": "Richtlinie",
    "nameDe": "Vorfallmeldungs-Richtlinie",
    "kategorie": "Vorfallmanagement",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Muss",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Muss",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Muss",
      "SOC2": "Muss",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P32",
    "typ": "Richtlinie",
    "nameDe": "Vorfallbearbeitungsverfahren",
    "kategorie": "Vorfallmanagement",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P33",
    "typ": "Richtlinie",
    "nameDe": "Vorfallklassifizierung & Schweregrad-Richtlinie",
    "kategorie": "Vorfallmanagement",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P34",
    "typ": "Richtlinie",
    "nameDe": "Business Continuity-Richtlinie",
    "kategorie": "Geschäftskontinuität",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Muss",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P35",
    "typ": "Richtlinie",
    "nameDe": "Disaster Recovery-Richtlinie",
    "kategorie": "Geschäftskontinuität",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Muss",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P36",
    "typ": "Richtlinie",
    "nameDe": "Backup-Richtlinie",
    "kategorie": "Geschäftskontinuität",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Muss",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P37",
    "typ": "Richtlinie",
    "nameDe": "Datenschutz-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "Muss",
      "ISO27701": "Muss",
      "KRITIS": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "Muss",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P38",
    "typ": "Richtlinie",
    "nameDe": "Datenklassifizierungs-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P39",
    "typ": "Richtlinie",
    "nameDe": "Datenaufbewahrungs-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P40",
    "typ": "Richtlinie",
    "nameDe": "Datenarchivierungs-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P41",
    "typ": "Richtlinie",
    "nameDe": "Verschlüsselungs-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P42",
    "typ": "Richtlinie",
    "nameDe": "Lieferantensicherheits-Richtlinie",
    "kategorie": "Lieferantensicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P43",
    "typ": "Richtlinie",
    "nameDe": "Third-Party-Risikomanagement-Richtlinie",
    "kategorie": "Lieferantensicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P44",
    "typ": "Richtlinie",
    "nameDe": "Sicherheitsbewusstsein & Schulungs-Richtlinie",
    "kategorie": "Personal & Bewusstsein",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "Muss",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "CRA": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Muss",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P45",
    "typ": "Richtlinie",
    "nameDe": "Acceptable Use-Richtlinie",
    "kategorie": "Personal & Bewusstsein",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P46",
    "typ": "Richtlinie",
    "nameDe": "Remote-Work-Richtlinie",
    "kategorie": "Personal & Bewusstsein",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P47",
    "typ": "Richtlinie",
    "nameDe": "Sichere Entwicklungs-Richtlinie",
    "kategorie": "Entwicklung & Änderung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "Empfohlen",
      "ISO42001": "SoA-abhängig",
      "AIACT": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P48",
    "typ": "Richtlinie",
    "nameDe": "Änderungsmanagement-Richtlinie",
    "kategorie": "Entwicklung & Änderung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "Empfohlen",
      "ISO42001": "SoA-abhängig",
      "AIACT": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P49",
    "typ": "Richtlinie",
    "nameDe": "Physische & Umgebungssicherheits-Richtlinie",
    "kategorie": "Physische Sicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "Empfohlen",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "Empfohlen",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P50",
    "typ": "Richtlinie",
    "nameDe": "Sichere KI-Nutzungs-Richtlinie",
    "kategorie": "Künstliche Intelligenz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "ISO42001": "Muss",
      "AIACT": "Muss",
      "CRA": "Empfohlen"
    }
  },
  {
    "docId": "P51",
    "typ": "Richtlinie",
    "nameDe": "OT/ICS-Sicherheitsrichtlinie",
    "kategorie": "OT/ICS-Sicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "KRITIS": "SoA-abhängig",
      "TISAX": "Empfohlen",
      "CRA": "Empfohlen",
      "NIST_CSF": "Empfohlen",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P52",
    "typ": "Richtlinie",
    "nameDe": "Threat-Intelligence-Richtlinie",
    "kategorie": "Überwachung & Erkennung",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "Empfohlen",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P53",
    "typ": "Richtlinie",
    "nameDe": "Cloud-Service-Nutzungs-Richtlinie",
    "kategorie": "Lieferantensicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "P54",
    "typ": "Richtlinie",
    "nameDe": "Informationslöschungs-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P55",
    "typ": "Richtlinie",
    "nameDe": "Datenmaskierungs-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P56",
    "typ": "Richtlinie",
    "nameDe": "Data-Leakage-Prevention-Richtlinie",
    "kategorie": "Datenschutz",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "KRITIS": "Empfohlen",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "P57",
    "typ": "Richtlinie",
    "nameDe": "Web-Filtering-Richtlinie",
    "kategorie": "Netzwerk- & Systemsicherheit",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "CRA": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig"
    }
  },
  {
    "docId": "D01",
    "typ": "Nachweis",
    "nameDe": "Erklärung zur Anwendbarkeit (SoA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "ISO27701": "Muss",
      "ISO42001": "Muss",
      "TISAX": "Empfohlen",
      "SOC2": "Empfohlen"
    }
  },
  {
    "docId": "D02",
    "typ": "Nachweis",
    "nameDe": "Risikobehandlungsplan (RTP)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D03",
    "typ": "Nachweis",
    "nameDe": "ISMS-Geltungsbereich (Scope)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "ISO27701": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "ISO42001": "Muss",
      "TISAX": "Muss",
      "SOC2": "Muss"
    }
  },
  {
    "docId": "D04",
    "typ": "Nachweis",
    "nameDe": "Management-Review-Protokoll",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "ISO27701": "Muss",
      "ISO22301": "Muss",
      "ISO42001": "Muss",
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D05",
    "typ": "Verfahren",
    "nameDe": "Verfahren für Korrektur- & Verbesserungsmaßnahmen",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "ISO27701": "Muss",
      "ISO22301": "Muss",
      "ISO42001": "Muss",
      "SOC2": "Muss"
    }
  },
  {
    "docId": "D06",
    "typ": "Nachweis",
    "nameDe": "Sicherheitsleitlinie (BSI)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "BSI": "Muss",
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D07",
    "typ": "Nachweis",
    "nameDe": "Strukturanalyse",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "BSI": "Muss",
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D08",
    "typ": "Nachweis",
    "nameDe": "Schutzbedarfsfeststellung",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "BSI": "Muss",
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D09",
    "typ": "Nachweis",
    "nameDe": "Modellierung & IT-Grundschutz-Check",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "BSI": "Muss",
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D10",
    "typ": "Nachweis",
    "nameDe": "Realisierungsplan",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "BSI": "Muss",
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D11",
    "typ": "Nachweis",
    "nameDe": "Registrierung bei der zuständigen Behörde",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "NIS2": "Muss",
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D12",
    "typ": "Nachweis",
    "nameDe": "Selbsteinstufung wesentlich/wichtig",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "NIS2": "Muss"
    }
  },
  {
    "docId": "D13",
    "typ": "Nachweis",
    "nameDe": "Nachweis Geschäftsleitungs-Schulung",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "schulung",
    "frameworks": {
      "NIS2": "Muss"
    }
  },
  {
    "docId": "D14",
    "typ": "Verfahren",
    "nameDe": "Meldeverfahren an die Behörde (NIS2 Artikel 23)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "incident_management",
    "frameworks": {
      "NIS2": "Muss",
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D15",
    "typ": "Nachweis",
    "nameDe": "IKT-Risikomanagementrahmen",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D16",
    "typ": "Register",
    "nameDe": "Informationsregister ICT-Drittparteien",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "drittparteien",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D17",
    "typ": "Nachweis",
    "nameDe": "TLPT-Programm",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D18",
    "typ": "Nachweis",
    "nameDe": "Ausstiegsstrategien für kritische IKT-Dienste",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "drittparteien",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D19",
    "typ": "Nachweis",
    "nameDe": "Strategie für digitale operationale Resilienz-Tests",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D20",
    "typ": "Register",
    "nameDe": "Verzeichnis von Verarbeitungstätigkeiten (VVT)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D21",
    "typ": "Nachweis",
    "nameDe": "Datenschutz-Folgenabschätzung (DSFA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss",
      "AIACT": "Empfohlen"
    }
  },
  {
    "docId": "D22",
    "typ": "Vertragsvorlage",
    "nameDe": "Auftragsverarbeitungsvertrag (AVV/DPA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D23",
    "typ": "Verfahren",
    "nameDe": "Betroffenenrechte-Verfahren",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D24",
    "typ": "Verfahren",
    "nameDe": "Datenpannen-Meldeverfahren (Artikel 33/34 DSGVO)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D25",
    "typ": "Register",
    "nameDe": "KI-Systemregister",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "ISO42001": "Muss",
      "AIACT": "Muss"
    }
  },
  {
    "docId": "D26",
    "typ": "Nachweis",
    "nameDe": "KI-Auswirkungsabschätzung / FRIA",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "ISO42001": "Muss",
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO Art. 27: nur für bestimmte Betreiber von Hochrisiko-KI (Einrichtungen des öffentlichen Rechts, private Anbieter öffentlicher Dienste, Anhang III Nr. 5 b/c); anwendbar ab 02.12.2027 (VO (EU) 2026/1744). Für ISO/IEC 42001 entspricht dem die KI-Systemauswirkungsabschätzung (6.1.4).",
      "en": "AI Act Art. 27: only certain deployers of high-risk AI (bodies governed by public law, private entities providing public services, Annex III 5(b)/(c)); applies from 2 Dec 2027 (Regulation (EU) 2026/1744). Under ISO/IEC 42001 the counterpart is the AI system impact assessment (6.1.4)."
    }
  },
  {
    "docId": "D27",
    "typ": "Nachweis",
    "nameDe": "Technische Dokumentation Anhang IV",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D28",
    "typ": "Nachweis",
    "nameDe": "EU-Konformitätserklärung & CE (KI)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D29",
    "typ": "Nachweis",
    "nameDe": "Post-Market-Monitoring-Plan (KI)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D30",
    "typ": "Nachweis",
    "nameDe": "Technische Dokumentation & EU-Konformitätserklärung (CRA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "CRA": "Muss"
    }
  },
  {
    "docId": "D31",
    "typ": "Richtlinie",
    "nameDe": "Schwachstellen-Offenlegung (CVD) & SBOM",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "CRA": "Muss"
    }
  },
  {
    "docId": "D32",
    "typ": "Nachweis",
    "nameDe": "Prototypenschutz-Konzept",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "TISAX": "Muss"
    }
  },
  {
    "docId": "D33",
    "typ": "Register",
    "nameDe": "Auslagerungsregister & -konzept",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "drittparteien",
    "frameworks": {
      "DORA": "Empfohlen",
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D34",
    "typ": "Nachweis",
    "nameDe": "Business-Impact-Analyse (BIA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "NIS2": "Empfohlen",
      "DORA": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "TISAX": "Muss",
      "MaRisk": "Muss",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "D35",
    "typ": "Nachweis",
    "nameDe": "Notfallhandbuch & Wiederanlaufpläne",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "DORA": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss"
    }
  },
  {
    "docId": "D36",
    "typ": "Nachweis",
    "nameDe": "Übungs- & Testkonzept (BCM)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "DORA": "Empfohlen",
      "KRITIS": "Muss",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "D37",
    "typ": "Nachweis",
    "nameDe": "Systembeschreibung (SOC 2)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "SOC2": "Muss"
    }
  },
  {
    "docId": "D38",
    "typ": "Nachweis",
    "nameDe": "Informationssicherheitsziele",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "ISO27701": "Muss",
      "ISO22301": "Muss",
      "ISO42001": "Muss"
    }
  },
  {
    "docId": "D39",
    "typ": "Nachweis",
    "nameDe": "Risikobewertungsbericht",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "DORA": "Muss",
      "ISO27701": "Muss",
      "KRITIS": "Muss",
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D40",
    "typ": "Nachweis",
    "nameDe": "Kompetenznachweis-Register",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "schulung",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "ISO27701": "Muss",
      "ISO22301": "Muss",
      "ISO42001": "Muss",
      "SOC2": "Muss"
    }
  },
  {
    "docId": "D41",
    "typ": "Nachweis",
    "nameDe": "Internes Audit-Programm & Auditbericht",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "NIS2": "Muss",
      "ISO27701": "Muss",
      "ISO22301": "Muss",
      "ISO42001": "Muss",
      "MaRisk": "Muss",
      "SOC2": "Muss"
    }
  },
  {
    "docId": "D42",
    "typ": "Nachweis",
    "nameDe": "Überwachungs- & Messergebnisse",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "BSI": "Muss",
      "ISO27701": "Muss",
      "ISO22301": "Muss",
      "ISO42001": "Muss",
      "SOC2": "Muss"
    }
  },
  {
    "docId": "D43",
    "typ": "Nachweis",
    "nameDe": "Beschluss des Leitungsorgans (Billigung der Maßnahmen)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "NIS2": "Muss",
      "DORA": "Empfohlen"
    }
  },
  {
    "docId": "D44",
    "typ": "Richtlinie",
    "nameDe": "IKT-Geschäftsfortführungsleitlinie",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D45",
    "typ": "Verfahren",
    "nameDe": "IKT-Backup- & Wiederherstellungsverfahren",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "DORA": "Muss",
      "MaRisk": "Empfohlen"
    }
  },
  {
    "docId": "D46",
    "typ": "Richtlinie",
    "nameDe": "Vertragsklauseln-Rahmen für IKT-Drittparteien",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "drittparteien",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D47",
    "typ": "Nachweis",
    "nameDe": "Konzentrationsrisiko-Bewertung",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "drittparteien",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D48",
    "typ": "Verfahren",
    "nameDe": "Vorfallklassifizierung & Meldebericht an Aufsicht",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "incident_management",
    "frameworks": {
      "DORA": "Muss"
    }
  },
  {
    "docId": "D49",
    "typ": "Nachweis",
    "nameDe": "Post-Incident-Review",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "incident_management",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Muss"
    }
  },
  {
    "docId": "D50",
    "typ": "Nachweis",
    "nameDe": "Datenschutzerklärung / Transparenzinformationen",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D51",
    "typ": "Nachweis",
    "nameDe": "TOM-Dokumentation (Art. 32)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D52",
    "typ": "Register",
    "nameDe": "Drittland-Transfer-Verzeichnis & Garantien (SCC)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Empfohlen"
    }
  },
  {
    "docId": "D53",
    "typ": "Nachweis",
    "nameDe": "Bestellung & Meldung Datenschutzbeauftragter",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D54",
    "typ": "Register",
    "nameDe": "Einwilligungsmanagement / Consent-Records",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D55",
    "typ": "Nachweis",
    "nameDe": "KRITIS-Nachweis nach § 39 BSIG",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "KRITIS": "Muss"
    },
    "hinweis": {
      "de": "Kein kurzfristiger Termin: das Bundesamt setzt den ersten Nachweistermin, frühestens drei Jahre nachdem die Anlage erstmals oder erneut als kritische Anlage gilt, danach alle drei Jahre (§ 39 Absatz 1). Bestandsbetreiber: drei Jahre nach dem letzten Nachweis alter Fassung (§ 39 Absatz 3). Nicht anwendbar auf Festlegungen nach § 5 Absatz 7 KRITIS-DachG (§ 39 Absatz 4).",
      "en": "No near-term due date: the Federal Office sets the first evidence date, at the earliest three years after the facility first or again qualifies as a critical facility, and every three years thereafter (section 39(1)). Existing operators: three years after the last evidence under the former rules (section 39(3)). Does not apply to designations under KRITIS-DachG section 5(7) (section 39(4))."
    }
  },
  {
    "docId": "D56",
    "typ": "Nachweis",
    "nameDe": "Nachweis Systeme zur Angriffserkennung (SzA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D57",
    "typ": "Nachweis",
    "nameDe": "KRITIS-Registrierung & Kontaktstelle (§ 33 BSIG)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D58",
    "typ": "Verfahren",
    "nameDe": "Störungsmeldung an das BSI (KRITIS)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "incident_management",
    "frameworks": {
      "KRITIS": "Muss"
    }
  },
  {
    "docId": "D59",
    "typ": "Nachweis",
    "nameDe": "B3S-Umsetzungsnachweis",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "KRITIS": "Muss",
      "NIS2": "SoA-abhängig"
    },
    "hinweis": {
      "de": "§ 30 Absatz 8 BSIG öffnet branchenspezifische Sicherheitsstandards für alle besonders wichtigen Einrichtungen und ihre Branchenverbände; § 30 Absatz 9 ist die auf kritische Anlagen bezogene Variante. Ein B3S bleibt freiwillig — er belegt die Erfüllung, statt die Nachweispflicht zu ersetzen.",
      "en": "Section 30(8) BSIG opens sector-specific security standards to all essential entities and their sector associations; section 30(9) is the variant tied to critical facilities. Using a B3S remains voluntary — it evidences compliance rather than replacing the evidence duty."
    }
  },
  {
    "docId": "D60",
    "typ": "Nachweis",
    "nameDe": "Daten-Governance-Nachweis (Trainingsdaten)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "ISO42001": "Muss",
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D61",
    "typ": "Nachweis",
    "nameDe": "EU-Datenbank-Registrierung (KI)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D62",
    "typ": "Nachweis",
    "nameDe": "Gebrauchsanweisung (KI)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "ISO42001": "Empfohlen",
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D63",
    "typ": "Nachweis",
    "nameDe": "Konzept menschliche Aufsicht (KI)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "ISO42001": "Muss",
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D64",
    "typ": "Nachweis",
    "nameDe": "Produkt-Cybersicherheits-Risikobewertung (CRA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "CRA": "Muss"
    }
  },
  {
    "docId": "D65",
    "typ": "Verfahren",
    "nameDe": "Schwachstellenbehandlung & Support-Zeitraum (CRA)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "CRA": "Muss"
    }
  },
  {
    "docId": "D66",
    "typ": "Nachweis",
    "nameDe": "IT-Strategie",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D67",
    "typ": "Nachweis",
    "nameDe": "Notfallkonzept (MaRisk)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D68",
    "typ": "Nachweis",
    "nameDe": "Berechtigungskonzept",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "DORA": "Empfohlen",
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D69",
    "typ": "Nachweis",
    "nameDe": "Informationsrisikomanagement-Konzept",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D70",
    "typ": "Richtlinie",
    "nameDe": "IDV-Richtlinie (Individuelle Datenverarbeitung)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D71",
    "typ": "Nachweis",
    "nameDe": "Business-Continuity-Strategie",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "DORA": "Empfohlen",
      "KRITIS": "Empfohlen",
      "ISO22301": "Muss",
      "BSI200_4": "Muss"
    }
  },
  {
    "docId": "D72",
    "typ": "Nachweis",
    "nameDe": "Krisenkommunikationsplan",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "NIS2": "Muss",
      "DORA": "Muss",
      "KRITIS": "Empfohlen",
      "ISO22301": "Muss",
      "BSI200_4": "Muss",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "P58",
    "typ": "Richtlinie",
    "nameDe": "Personalsicherheits-Richtlinie (Screening & Beschäftigung)",
    "kategorie": "Personal & Bewusstsein",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "ISO27701": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO42001": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "SoA-abhängig",
      "KRITIS_DACHG": "Muss"
    }
  },
  {
    "docId": "P59",
    "typ": "Richtlinie",
    "nameDe": "Dokumentierte Betriebsverfahren (SOPs)",
    "kategorie": "Governance & Risiko",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "ISO22301": "Empfohlen",
      "BSI200_4": "Empfohlen",
      "TISAX": "SoA-abhängig",
      "MaRisk": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen"
    }
  },
  {
    "docId": "D73",
    "typ": "Nachweis",
    "nameDe": "Qualitätsmanagementsystem für Hochrisiko-KI (Art. 17)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "ki_governance",
    "frameworks": {
      "ISO42001": "Empfohlen",
      "AIACT": "Muss"
    },
    "hinweis": {
      "de": "KI-VO: nur für Hochrisiko-KI-Systeme; anwendbar ab 02.12.2027 (Anhang III) bzw. 02.08.2028 (KI in Produkten nach Anhang I) — Fristen geändert durch VO (EU) 2026/1744.",
      "en": "AI Act: high-risk AI systems only; applies from 2 Dec 2027 (Annex III) or 2 Aug 2028 (AI in Annex I products) — dates amended by Regulation (EU) 2026/1744."
    }
  },
  {
    "docId": "D74",
    "typ": "Register",
    "nameDe": "Datenpannen-Register (Art. 33 Abs. 5)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "NIS2": "Empfohlen",
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D75",
    "typ": "Nachweis",
    "nameDe": "Management Assertion (SOC 2)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "SOC2": "Muss"
    }
  },
  {
    "docId": "D76",
    "typ": "Nachweis",
    "nameDe": "Nutzerinformationen & Anleitung (CRA Anhang II)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "CRA": "Muss"
    }
  },
  {
    "docId": "D77",
    "typ": "Nachweis",
    "nameDe": "Risikostrategie (MaRisk AT 4.2)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "DORA": "Empfohlen",
      "MaRisk": "Muss"
    }
  },
  {
    "docId": "D78",
    "typ": "Vertragsvorlage",
    "nameDe": "Vereinbarung über gemeinsame Verantwortlichkeit (Art. 26)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "datenschutz",
    "frameworks": {
      "GDPR": "Muss",
      "ISO27701": "Muss"
    }
  },
  {
    "docId": "D79",
    "typ": "Nachweis",
    "nameDe": "NIST-CSF-Organisationsprofil & Aktionsplan",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "policy_engine",
    "frameworks": {
      "NIST_CSF": "Muss"
    }
  },
  {
    "docId": "D80",
    "typ": "Nachweis",
    "nameDe": "Registrierung Betreiber kritischer Anlagen (KRITIS-DachG)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "KRITIS_DACHG": "Muss"
    },
    "hinweis": {
      "de": "Rechtsgrundlage in Kraft, Adressat aber noch offen: die Rechtsverordnung nach § 4 Absatz 3 und § 5 Absatz 1 KRITIS-DachG ist nicht erlassen, daher gilt bislang keine Anlage als kritisch. Die Registrierungsfrist des § 8 wurde durch Artikel 8 des Gesetzes vom 21.07.2026 gestrichen und nicht ersetzt; die Pflichten der §§ 12 und 13 beginnen erst 9 beziehungsweise 10 Monate nach einer Registrierung.",
      "en": "Legal basis in force but the addressee is still open: the regulation under KRITIS-DachG sections 4(3) and 5(1) has not been adopted, so no facility yet qualifies as critical. The section 8 registration deadline was deleted by Article 8 of the Act of 21 July 2026 and not replaced; the section 12 and 13 duties begin only 9 and 10 months after a registration."
    }
  },
  {
    "docId": "D81",
    "typ": "Nachweis",
    "nameDe": "Risikoanalyse & -bewertung physische Resilienz (KRITIS-DachG)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "KRITIS": "Empfohlen",
      "KRITIS_DACHG": "Muss"
    },
    "hinweis": {
      "de": "Rechtsgrundlage in Kraft, Adressat aber noch offen: die Rechtsverordnung nach § 4 Absatz 3 und § 5 Absatz 1 KRITIS-DachG ist nicht erlassen, daher gilt bislang keine Anlage als kritisch. Die Registrierungsfrist des § 8 wurde durch Artikel 8 des Gesetzes vom 21.07.2026 gestrichen und nicht ersetzt; die Pflichten der §§ 12 und 13 beginnen erst 9 beziehungsweise 10 Monate nach einer Registrierung.",
      "en": "Legal basis in force but the addressee is still open: the regulation under KRITIS-DachG sections 4(3) and 5(1) has not been adopted, so no facility yet qualifies as critical. The section 8 registration deadline was deleted by Article 8 of the Act of 21 July 2026 and not replaced; the section 12 and 13 duties begin only 9 and 10 months after a registration."
    }
  },
  {
    "docId": "D82",
    "typ": "Nachweis",
    "nameDe": "Resilienzplan (KRITIS-DachG)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "bcm",
    "frameworks": {
      "KRITIS": "Empfohlen",
      "KRITIS_DACHG": "Muss"
    },
    "hinweis": {
      "de": "Rechtsgrundlage in Kraft, Adressat aber noch offen: die Rechtsverordnung nach § 4 Absatz 3 und § 5 Absatz 1 KRITIS-DachG ist nicht erlassen, daher gilt bislang keine Anlage als kritisch. Die Registrierungsfrist des § 8 wurde durch Artikel 8 des Gesetzes vom 21.07.2026 gestrichen und nicht ersetzt; die Pflichten der §§ 12 und 13 beginnen erst 9 beziehungsweise 10 Monate nach einer Registrierung.",
      "en": "Legal basis in force but the addressee is still open: the regulation under KRITIS-DachG sections 4(3) and 5(1) has not been adopted, so no facility yet qualifies as critical. The section 8 registration deadline was deleted by Article 8 of the Act of 21 July 2026 and not replaced; the section 12 and 13 duties begin only 9 and 10 months after a registration."
    }
  },
  {
    "docId": "D83",
    "typ": "Register",
    "nameDe": "Vorfall- & Meldungsregister (Incident Register)",
    "kategorie": "Framework-spezifisch",
    "werkzeug": "incident_management",
    "frameworks": {
      "ISO27001": "Empfohlen",
      "BSI": "Empfohlen",
      "NIS2": "Muss",
      "DORA": "Muss",
      "KRITIS": "Muss",
      "ISO22301": "Empfohlen",
      "AIACT": "Empfohlen",
      "TISAX": "Empfohlen",
      "MaRisk": "Empfohlen",
      "CRA": "Empfohlen",
      "SOC2": "Empfohlen",
      "KRITIS_DACHG": "Empfohlen"
    }
  },
  {
    "docId": "D84",
    "typ": "Nachweis",
    "nameDe": "Verfahren zur Lenkung dokumentierter Informationen",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "ISO27701": "Muss",
      "ISO42001": "Muss",
      "ISO22301": "Muss",
      "BSI": "Muss",
      "BSI200_4": "Muss",
      "TISAX": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "Empfohlen",
      "KRITIS": "Empfohlen",
      "MaRisk": "Muss",
      "AIACT": "SoA-abhängig",
      "CRA": "Empfohlen"
    }
  },
  {
    "docId": "D85",
    "typ": "Nachweis",
    "nameDe": "Kontext- und Interessengruppenbewertung des ISMS",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "ISO27701": "Muss",
      "ISO42001": "Muss",
      "ISO22301": "Muss",
      "BSI": "Muss",
      "BSI200_4": "Empfohlen",
      "TISAX": "Muss",
      "SOC2": "Muss",
      "NIST_CSF": "Empfohlen",
      "DORA": "Empfohlen"
    }
  },
  {
    "docId": "D86",
    "typ": "Nachweis",
    "nameDe": "Kommunikationsplan für Informationssicherheit",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "ISO27701": "Muss",
      "ISO42001": "Muss",
      "ISO22301": "Muss",
      "BSI": "Muss",
      "BSI200_4": "Empfohlen",
      "TISAX": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Muss",
      "MaRisk": "Empfohlen",
      "AIACT": "SoA-abhängig"
    }
  },
  {
    "docId": "D87",
    "typ": "Nachweis",
    "nameDe": "Plan für Änderungen am ISMS",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "Muss",
      "ISO27701": "Muss",
      "ISO42001": "Muss",
      "ISO22301": "Muss",
      "BSI": "Muss",
      "BSI200_4": "Muss",
      "TISAX": "Empfohlen",
      "SOC2": "Muss",
      "NIST_CSF": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "MaRisk": "SoA-abhängig"
    }
  },
  {
    "docId": "D88",
    "typ": "Nachweis",
    "nameDe": "Vereinbarung zur sicheren Informationsübertragung",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen",
      "KRITIS": "Empfohlen",
      "MaRisk": "Empfohlen"
    }
  },
  {
    "docId": "D89",
    "typ": "Nachweis",
    "nameDe": "Verfahren für Domänenregistrierungsdaten",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27701": "Empfohlen",
      "NIS2": "SoA-abhängig",
      "GDPR": "Empfohlen"
    },
    "hinweis": {
      "de": "Nur für TLD-Namenregistries und Domänennamen-Registrierungsdienste. Die deutsche Umsetzung (§§ 49–51 BSIG) knüpft an den Einrichtungstyp an, nicht an die Anlagenschwelle; die Veröffentlichungsfrist des § 49 Absatz 3 und § 50 Absatz 2 (6. März 2026) ist bereits verstrichen.",
      "en": "Only for TLD name registries and domain name registration service providers. The German transposition (sections 49-51 BSIG) attaches to the entity type, not to the facility threshold; the publication deadline in sections 49(3) and 50(2) (6 March 2026) has already passed."
    }
  },
  {
    "docId": "D90",
    "typ": "Nachweis",
    "nameDe": "Benennung eines NIS2-Vertreters in der Union",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "NIS2": "SoA-abhängig"
    },
    "hinweis": {
      "de": "Nur für die in NIS2 Artikel 26 Absatz 1 Buchstabe b genannten Einrichtungsarten ohne Niederlassung in der Union, die Dienste in der Union anbieten. Ein Betreiber einer kritischen Anlage wird davon nicht erfasst.",
      "en": "Only for the entity types listed in NIS2 Article 26(1)(b) that have no establishment in the Union while offering services in the Union. An operator of a critical facility is not covered by this duty."
    }
  },
  {
    "docId": "D91",
    "typ": "Nachweis",
    "nameDe": "Teilnahme und Schutzregeln für Cybersicherheits-Informationsaustausch",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "ISO27701": "Empfohlen",
      "BSI": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen",
      "NIS2": "SoA-abhängig",
      "DORA": "SoA-abhängig",
      "GDPR": "Empfohlen"
    }
  },
  {
    "docId": "D92",
    "typ": "Nachweis",
    "nameDe": "Bearbeitung behördlicher Sicherheitsanfragen und Anordnungen",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "ISO27701": "SoA-abhängig",
      "BSI": "Empfohlen",
      "TISAX": "Empfohlen",
      "SOC2": "Empfohlen",
      "NIST_CSF": "Empfohlen",
      "NIS2": "Empfohlen",
      "DORA": "Empfohlen",
      "GDPR": "Empfohlen",
      "KRITIS": "Empfohlen",
      "KRITIS_DACHG": "Empfohlen",
      "MaRisk": "Empfohlen",
      "AIACT": "SoA-abhängig",
      "CRA": "Empfohlen"
    }
  },
  {
    "docId": "D93",
    "typ": "Nachweis",
    "nameDe": "Sicherheitsplan für Projekte und Systembeschaffung",
    "kategorie": "Ergänzende Richtlinien und Nachweise",
    "werkzeug": "policy_engine",
    "frameworks": {
      "ISO27001": "SoA-abhängig",
      "ISO27701": "Empfohlen",
      "ISO42001": "SoA-abhängig",
      "BSI": "SoA-abhängig",
      "TISAX": "SoA-abhängig",
      "SOC2": "SoA-abhängig",
      "NIST_CSF": "Empfohlen",
      "NIS2": "SoA-abhängig",
      "DORA": "Muss",
      "GDPR": "Empfohlen",
      "KRITIS": "SoA-abhängig",
      "KRITIS_DACHG": "Empfohlen",
      "MaRisk": "SoA-abhängig",
      "AIACT": "SoA-abhängig",
      "CRA": "Empfohlen"
    }
  }
];
