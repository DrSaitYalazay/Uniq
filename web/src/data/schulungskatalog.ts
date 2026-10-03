// OTOMATİK ÜRETİLDİ — kaynak: schulungskatalog_frameworkbasiert.csv (Komplettpaket 2026-07-04).
// 46 Schulungsthemen, rollenbasiert, framework-getaggt (framework_muss = Pflicht-Frameworks).

export interface SchulungThema { topicId: string; titelDe: string; titelEn: string; pflicht: string; rollen: string[]; lernziel: string; frameworkMuss: string[]; }

export const SCHULUNGSKATALOG: SchulungThema[] = [
  {
    "topicId": "g01",
    "titelDe": "NIS2-Richtlinie & nationale Umsetzung",
    "titelEn": "NIS2 Directive & National Implementation",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "NIS2-Pflichten, Betroffenheit und nationale Umsetzung verstehen.",
    "frameworkMuss": [
      "NIS2",
      "KRITIS"
    ]
  },
  {
    "topicId": "g02",
    "titelDe": "Geschäftsleitungs­verantwortung (Art. 20)",
    "titelEn": "Management Responsibility (Art. 20)",
    "pflicht": "Muss",
    "rollen": [
      "management"
    ],
    "lernziel": "Persönliche Haftung und Aufsichtspflichten der Leitung kennen.",
    "frameworkMuss": [
      "NIS2",
      "DORA",
      "MaRisk"
    ]
  },
  {
    "topicId": "g03",
    "titelDe": "ISMS-Grundlagen & PDCA-Zyklus",
    "titelEn": "ISMS Fundamentals & PDCA Cycle",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "ISMS-Aufbau und PDCA-Zyklus anwenden können.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "g04",
    "titelDe": "Rollen & Verantwortlich­keiten (CISO, ISB, DSB, IRT)",
    "titelEn": "Roles & Responsibilities (CISO, ISO, DPO, IRT)",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "management",
      "it"
    ],
    "lernziel": "Sicherheitsrollen (CISO/ISB/DSB/IRT) und Zuständigkeiten kennen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "GDPR",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "a01",
    "titelDe": "E-Mail-Sicherheit & Phishing-Abwehr",
    "titelEn": "Email Security & Phishing Defense",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "management",
      "it"
    ],
    "lernziel": "Phishing erkennen und richtig melden.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "a02",
    "titelDe": "Social Engineering, Vishing & Deepfake",
    "titelEn": "Social Engineering, Vishing & Deepfake",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "management",
      "it"
    ],
    "lernziel": "Social Engineering, Vishing und Deepfakes abwehren.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "a03",
    "titelDe": "Passwort-, MFA- & Zugangshygiene",
    "titelEn": "Password, MFA & Access Hygiene",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "management",
      "it"
    ],
    "lernziel": "Sichere Passwörter, MFA und Zugangshygiene praktizieren.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "a04",
    "titelDe": "Sicheres Arbeiten (Clean Desk, Mobile, Remote, VPN)",
    "titelEn": "Secure Working (Clean Desk, Mobile, Remote, VPN)",
    "pflicht": "Muss",
    "rollen": [
      "all"
    ],
    "lernziel": "Sicheres Arbeiten mobil, remote und am Arbeitsplatz umsetzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "a05",
    "titelDe": "Wechseldatenträger & Datenträger­entsorgung",
    "titelEn": "Removable Media & Data Disposal",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "it"
    ],
    "lernziel": "Wechseldatenträger sicher nutzen und Daten sicher entsorgen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "a06",
    "titelDe": "Cloud, Kollaborationstools & Schatten-IT",
    "titelEn": "Cloud, Collaboration Tools & Shadow IT",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "management",
      "it"
    ],
    "lernziel": "Cloud/Kollaboration sicher nutzen, Schatten-IT vermeiden.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "a07",
    "titelDe": "Datenschutz im Alltag (DSGVO-Basis)",
    "titelEn": "Data Protection in Daily Work (GDPR Basics)",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "management",
      "it"
    ],
    "lernziel": "Datenschutz-Grundlagen (DSGVO) im Arbeitsalltag anwenden.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "GDPR",
      "ISO27701",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "i01",
    "titelDe": "NIS2-Meldepflichten (Art. 23)",
    "titelEn": "NIS2 Reporting Obligations (Art. 23)",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "NIS2-Meldefristen (24h/72h/1M) und Meldewege beherrschen.",
    "frameworkMuss": [
      "NIS2",
      "KRITIS"
    ]
  },
  {
    "topicId": "i02",
    "titelDe": "Incident-Response-Plan & Krisen­management",
    "titelEn": "Incident Response Plan & Crisis Management",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "Incident-Response-Plan und Krisenrollen anwenden.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "i03",
    "titelDe": "Ransomware-Playbook",
    "titelEn": "Ransomware Playbook",
    "pflicht": "Muss",
    "rollen": [
      "it",
      "management"
    ],
    "lernziel": "Ransomware-Vorfälle nach Playbook behandeln.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "i04",
    "titelDe": "Forensik-Grundlagen & Beweissicherung",
    "titelEn": "Forensic Basics & Evidence Preservation",
    "pflicht": "Optional",
    "rollen": [
      "it"
    ],
    "lernziel": "Beweise gerichtsfest sichern (Forensik-Grundlagen).",
    "frameworkMuss": []
  },
  {
    "topicId": "i05",
    "titelDe": "Krisen­kommunikation",
    "titelEn": "Crisis Communication",
    "pflicht": "Muss",
    "rollen": [
      "management"
    ],
    "lernziel": "In Krisen intern und extern angemessen kommunizieren.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "i06",
    "titelDe": "Meldekultur, Vorfallmeldung & Hinweisgeber­schutz",
    "titelEn": "Reporting Culture, Incident Reporting & Whistleblower Protection",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "management"
    ],
    "lernziel": "Meldekultur leben und Hinweisgeberschutz kennen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "i07",
    "titelDe": "Krisen­verhalten für die Belegschaft",
    "titelEn": "Crisis Behaviour for All Staff",
    "pflicht": "Muss",
    "rollen": [
      "all"
    ],
    "lernziel": "Als Mitarbeitende im Krisenfall richtig handeln.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "r01",
    "titelDe": "Risiko­management nach NIS2 (Art. 21(1))",
    "titelEn": "Risk Management per NIS2 (Art. 21(1))",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "Risikomanagement nach NIS2 Art. 21(1) durchführen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "r02",
    "titelDe": "BCM, BIA, RTO/RPO & Notfall­übungen",
    "titelEn": "BCM, BIA, RTO/RPO & Exercises",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "BCM, BIA, RTO/RPO verstehen und üben.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "ISO22301",
      "BSI200_4",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "r03",
    "titelDe": "Backup-Strategie 3-2-1, Air-Gap & Restore-Tests",
    "titelEn": "Backup Strategy 3-2-1, Air-Gap & Restore Tests",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "Backup-Strategie 3-2-1 und Restore-Tests umsetzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "ISO22301",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "r04",
    "titelDe": "Wirksamkeitsmessung, internes Audit & Management-Review",
    "titelEn": "Effectiveness Measurement, Internal Audit & Management Review",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "Wirksamkeit messen, Audits und Management-Review durchführen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t01",
    "titelDe": "Netzwerk­segmentierung, Zero-Trust & Firewalls",
    "titelEn": "Network Segmentation, Zero-Trust & Firewalls",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "Netzwerksegmentierung und Zero-Trust umsetzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t02",
    "titelDe": "Patch- & Schwachstellen­management",
    "titelEn": "Patch & Vulnerability Management",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "Patch- und Schwachstellenmanagement betreiben.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "CRA",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t03",
    "titelDe": "Kryptografie & Schlüssel­management (Art. 21(2)(h))",
    "titelEn": "Cryptography & Key Management (Art. 21(2)(h))",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "Kryptografie und Schlüsselmanagement korrekt einsetzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t04",
    "titelDe": "Monitoring, Logging, SIEM, EDR/NDR",
    "titelEn": "Monitoring, Logging, SIEM, EDR/NDR",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "Monitoring, Logging, SIEM und EDR/NDR nutzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t05",
    "titelDe": "Sichere Konfiguration & Hardening",
    "titelEn": "Secure Configuration & Hardening",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "Systeme sicher konfigurieren und härten.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t06",
    "titelDe": "Identity & Access Management (RBAC, PAM, JIT)",
    "titelEn": "Identity & Access Management (RBAC, PAM, JIT)",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "IAM mit RBAC, PAM und JIT umsetzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t07",
    "titelDe": "Asset- & Konfigurations­management (Inventar, CMDB)",
    "titelEn": "Asset & Configuration Management (Inventory, CMDB)",
    "pflicht": "Muss",
    "rollen": [
      "it"
    ],
    "lernziel": "Assets inventarisieren und Konfigurationen verwalten.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "t08",
    "titelDe": "Datenklassifizierung & Informations­schutz",
    "titelEn": "Data Classification & Information Protection",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "it"
    ],
    "lernziel": "Daten klassifizieren und schützen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "GDPR",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "s01",
    "titelDe": "Lieferanten-Risikobewertung & Vertragsklauseln (Art. 21(2)(d))",
    "titelEn": "Supplier Risk Assessment & Contract Clauses",
    "pflicht": "Muss",
    "rollen": [
      "procurement",
      "it",
      "management"
    ],
    "lernziel": "Lieferantenrisiken bewerten und Vertragsklauseln setzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF"
    ]
  },
  {
    "topicId": "s02",
    "titelDe": "SBOM, Open-Source & Dritt-Audits",
    "titelEn": "SBOM, Open Source & Third-Party Audits",
    "pflicht": "Optional",
    "rollen": [
      "procurement",
      "it",
      "developer"
    ],
    "lernziel": "SBOM, Open-Source-Risiken und Dritt-Audits handhaben.",
    "frameworkMuss": [
      "CRA"
    ]
  },
  {
    "topicId": "x01",
    "titelDe": "OT/ICS-Sicherheit (Purdue, Safety vs. Security)",
    "titelEn": "OT/ICS Security (Purdue, Safety vs Security)",
    "pflicht": "Optional",
    "rollen": [
      "ot",
      "it"
    ],
    "lernziel": "OT/ICS-Sicherheit (Safety vs. Security) verstehen.",
    "frameworkMuss": [
      "BSI",
      "KRITIS"
    ]
  },
  {
    "topicId": "x02",
    "titelDe": "DevSecOps & sichere Softwareentwicklung",
    "titelEn": "DevSecOps & Secure Software Development",
    "pflicht": "Optional",
    "rollen": [
      "developer",
      "it"
    ],
    "lernziel": "DevSecOps und sichere Softwareentwicklung anwenden.",
    "frameworkMuss": [
      "CRA"
    ]
  },
  {
    "topicId": "x03",
    "titelDe": "KI-Sicherheit & Umgang mit GenAI",
    "titelEn": "AI Security & GenAI Usage",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "it",
      "developer",
      "management"
    ],
    "lernziel": "KI-/GenAI-Risiken erkennen und sicher nutzen — KI-Kompetenz nach Art. 4 AI Act (Pflicht seit 02.02.2025).",
    "frameworkMuss": [
      "ISO42001",
      "AIACT"
    ]
  },
  {
    "topicId": "x04",
    "titelDe": "DSGVO & NIS2 — Doppel­meldepflicht",
    "titelEn": "GDPR & NIS2 — Double Reporting Duty",
    "pflicht": "Optional",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "DSGVO- und NIS2-Doppelmeldepflicht koordinieren.",
    "frameworkMuss": [
      "NIS2",
      "GDPR"
    ]
  },
  {
    "topicId": "p01",
    "titelDe": "Physische Sicherheit & Zutritts­kontrolle",
    "titelEn": "Physical Security & Access Control",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "it",
      "management"
    ],
    "lernziel": "Physische Sicherheit und Zutrittskontrolle umsetzen.",
    "frameworkMuss": [
      "ISO27001",
      "BSI",
      "NIS2",
      "DORA",
      "KRITIS",
      "TISAX",
      "MaRisk",
      "SOC2",
      "NIST_CSF",
      "KRITIS_DACHG"
    ]
  },
  {
    "topicId": "td-dora",
    "titelDe": "DORA-Meldepflichten & Register of Information",
    "titelEn": "DORA: Reporting Duties & Register of Information",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "DORA-Meldewege und Informationsregister beherrschen.",
    "frameworkMuss": [
      "DORA"
    ]
  },
  {
    "topicId": "td-tlpt",
    "titelDe": "Threat-Led Penetration Testing (TLPT) Awareness",
    "titelEn": "Threat-Led Penetration Testing (TLPT) Awareness",
    "pflicht": "Muss",
    "rollen": [
      "it",
      "management"
    ],
    "lernziel": "TLPT-Anforderungen und Ablauf verstehen.",
    "frameworkMuss": [
      "DORA"
    ]
  },
  {
    "topicId": "td-gdpr",
    "titelDe": "DSGVO-Vertiefung: Betroffenenrechte, DSFA, AVV",
    "titelEn": "GDPR Deep Dive: Data Subject Rights & DPIA",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "Betroffenenrechte, DSFA und AVV rechtssicher umsetzen.",
    "frameworkMuss": [
      "GDPR",
      "ISO27701"
    ]
  },
  {
    "topicId": "td-aiact",
    "titelDe": "EU-AI-Act: Konformität, FRIA, Hochrisiko-Pflichten",
    "titelEn": "EU AI Act: Conformity, FRIA, High-Risk Duties",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it",
      "developer"
    ],
    "lernziel": "AI-Act-Pflichten (Konformität, FRIA) kennen.",
    "frameworkMuss": [
      "ISO42001",
      "AIACT"
    ]
  },
  {
    "topicId": "td-kritis",
    "titelDe": "KRITIS: Prüfnachweis (§ 39 BSIG, ehem. §8a) & Störungsmeldung an BSI",
    "titelEn": "KRITIS: Audit Evidence (BSIG) & BSI Incident Reporting",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "KRITIS-Nachweis und Störungsmeldung an BSI beherrschen.",
    "frameworkMuss": [
      "KRITIS"
    ]
  },
  {
    "topicId": "td-cra",
    "titelDe": "CRA: Konformität, CVD & SBOM für Produkte",
    "titelEn": "CRA: Conformity, CVD & SBOM for Products",
    "pflicht": "Muss",
    "rollen": [
      "developer",
      "it",
      "procurement"
    ],
    "lernziel": "CRA-Produktpflichten (CVD, SBOM) anwenden.",
    "frameworkMuss": [
      "CRA"
    ]
  },
  {
    "topicId": "td-marisk",
    "titelDe": "MaRisk/DORA: Auslagerung & aufsichtl. Anzeigen",
    "titelEn": "MaRisk/DORA: Outsourcing & Supervisory Notifications",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "it"
    ],
    "lernziel": "MaRisk-Auslagerung, DORA-Drittparteien und BaFin-Anzeigen verstehen (BAIT aufgehoben).",
    "frameworkMuss": [
      "MaRisk"
    ]
  },
  {
    "topicId": "td-tisax",
    "titelDe": "TISAX: Prototypenschutz & Erprobungsträger",
    "titelEn": "TISAX: Prototype Protection & Test Vehicles",
    "pflicht": "Muss",
    "rollen": [
      "all",
      "it"
    ],
    "lernziel": "Prototypen-Schutzklassen, Kennzeichnung, Foto-/Zutrittsregeln und Umgang mit Erprobungsträgern anwenden.",
    "frameworkMuss": [
      "TISAX"
    ]
  },
  {
    "topicId": "td-kritisdachg",
    "titelDe": "KRITIS-DachG: Physische Resilienz & Meldepflichten",
    "titelEn": "KRITIS Umbrella Act: Physical Resilience & Reporting",
    "pflicht": "Muss",
    "rollen": [
      "management",
      "ot"
    ],
    "lernziel": "Resilienzplan, physische Sicherungsmaßnahmen, personelle Sicherheit und Meldewege nach KRITIS-DachG kennen.",
    "frameworkMuss": [
      "KRITIS_DACHG"
    ]
  }
];
