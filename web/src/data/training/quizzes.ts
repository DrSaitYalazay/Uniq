// Quiz content per role-track (DE/EN), 5 questions each
export interface QuizQuestion {
  id: string;
  questionDe: string;
  questionEn: string;
  optionsDe: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationDe: string;
  explanationEn: string;
}

export interface RoleQuiz {
  roleTrack: "management" | "it" | "all" | "procurement" | "developer" | "ot";
  titleDe: string;
  titleEn: string;
  questions: QuizQuestion[];
}

export const TRAINING_QUIZZES: RoleQuiz[] = [
  {
    roleTrack: "management",
    titleDe: "Quiz: Geschäftsleitung & NIS2",
    titleEn: "Quiz: Management & NIS2",
    questions: [
      {
        id: "m1",
        questionDe: "Welche Pflicht trifft die Geschäftsleitung gemäß Art. 20 NIS2?",
        questionEn: "Which duty does NIS2 Art. 20 impose on management?",
        optionsDe: [
          "Nur Budgetfreigabe für IT",
          "Billigung & Überwachung der Risikomaßnahmen (nicht delegierbar)",
          "Reine Unterzeichnung der Policies",
          "Keine — Aufgabe ist vollständig delegierbar",
        ],
        optionsEn: [
          "Only approve IT budget",
          "Approve & oversee risk measures (non-delegable)",
          "Only sign off policies",
          "None — fully delegable",
        ],
        correctIndex: 1,
        explanationDe: "Art. 20(1) verpflichtet das Leitungsorgan zur Billigung UND Überwachung — beides nicht delegierbar.",
        explanationEn: "Art. 20(1) requires the management body to approve AND oversee — both non-delegable.",
      },
      {
        id: "m2",
        questionDe: "Wie hoch ist die Höchstsanktion für besonders wichtige Einrichtungen nach § 65 BSIG?",
        questionEn: "What is the maximum sanction for particularly important entities under § 65 BSIG?",
        optionsDe: ["1 Mio. € / 0,5 % Umsatz", "5 Mio. € / 1 % Umsatz", "10 Mio. € / 2 % Umsatz", "20 Mio. € / 4 % Umsatz"],
        optionsEn: ["€1M / 0.5% turnover", "€5M / 1% turnover", "€10M / 2% turnover", "€20M / 4% turnover"],
        correctIndex: 2,
        explanationDe: "§ 65 BSIG sieht bis zu 10 Mio. € oder 2 % des weltweiten Jahresumsatzes vor (höherer Wert) für besonders wichtige Einrichtungen.",
        explanationEn: "§ 65 BSIG allows up to €10M or 2% of global annual turnover (whichever higher) for particularly important entities.",
      },
      {
        id: "m3",
        questionDe: "Welche Schulungspflicht gilt für das Leitungsorgan selbst?",
        questionEn: "What training duty applies to the management body itself?",
        optionsDe: [
          "Keine — nur Mitarbeiter müssen geschult werden",
          "Einmalig zu Beginn",
          "Regelmäßige eigene Teilnahme an Cybersicherheits-Schulungen",
          "Nur bei Vorfällen",
        ],
        optionsEn: [
          "None — only staff must be trained",
          "Once at the start",
          "Regular personal attendance in cybersecurity training",
          "Only after incidents",
        ],
        correctIndex: 2,
        explanationDe: "Art. 20(2): Mitglieder des Leitungsorgans MÜSSEN regelmäßig Schulungen absolvieren.",
        explanationEn: "Art. 20(2): Members of the management body MUST regularly undergo training.",
      },
      {
        id: "m4",
        questionDe: "Was ist Risk Appetite?",
        questionEn: "What is risk appetite?",
        optionsDe: [
          "Eine technische Firewall-Regel",
          "Schriftlich festgelegte Risikobereitschaft des Unternehmens",
          "Versicherungssumme",
          "Anzahl akzeptierter Vorfälle pro Jahr",
        ],
        optionsEn: [
          "A technical firewall rule",
          "Formally documented willingness to accept risk",
          "Insurance sum",
          "Number of accepted incidents per year",
        ],
        correctIndex: 1,
        explanationDe: "Risk Appetite ist die formal dokumentierte, vom Vorstand festgelegte Risikobereitschaft.",
        explanationEn: "Risk appetite is the formally documented willingness to accept risk, set by the board.",
      },
      {
        id: "m5",
        questionDe: "Welche Meldefrist gilt für Frühwarnung bei meldepflichtigen Vorfällen?",
        questionEn: "What is the early-warning notification deadline for reportable incidents?",
        optionsDe: ["6 Stunden", "24 Stunden", "72 Stunden", "1 Woche"],
        optionsEn: ["6 hours", "24 hours", "72 hours", "1 week"],
        correctIndex: 1,
        explanationDe: "Art. 23(4)(a): Frühwarnung an CSIRT/BSI binnen 24 Stunden ab Kenntnis.",
        explanationEn: "Art. 23(4)(a): Early warning to CSIRT/BSI within 24 hours of awareness.",
      },
    ],
  },
  {
    roleTrack: "all",
    titleDe: "Quiz: Mitarbeiter — Cyber-Awareness",
    titleEn: "Quiz: Employees — Cyber Awareness",
    questions: [
      {
        id: "e1",
        questionDe: "Was tun Sie bei einer verdächtigen E-Mail mit Link?",
        questionEn: "What do you do with a suspicious email containing a link?",
        optionsDe: [
          "Klicken, um zu prüfen",
          "Antworten und Absender fragen",
          "Nicht klicken, IT/Security melden",
          "Weiterleiten an Kollegen",
        ],
        optionsEn: [
          "Click to check",
          "Reply asking the sender",
          "Do not click, report to IT/Security",
          "Forward to colleagues",
        ],
        correctIndex: 2,
        explanationDe: "Nie klicken — sofortige Meldung an IT/Security via Phishing-Button oder Helpdesk.",
        explanationEn: "Never click — report immediately to IT/Security via phishing button or helpdesk.",
      },
      {
        id: "e2",
        questionDe: "Welches Passwort ist am sichersten?",
        questionEn: "Which password is most secure?",
        optionsDe: ["Sommer2024!", "Passwort123", "Lange Passphrase + MFA aktiv", "Geburtsdatum + Name"],
        optionsEn: ["Summer2024!", "Password123", "Long passphrase + MFA enabled", "Birthdate + name"],
        correctIndex: 2,
        explanationDe: "Lange Passphrasen (≥12 Zeichen) zusammen mit Multi-Faktor-Authentifizierung bieten besten Schutz.",
        explanationEn: "Long passphrases (≥12 chars) plus MFA provide the best protection.",
      },
      {
        id: "e3",
        questionDe: "Sie finden einen USB-Stick im Parkhaus. Was tun Sie?",
        questionEn: "You find a USB stick in the parking lot. What do you do?",
        optionsDe: [
          "Einstecken, um den Eigentümer zu finden",
          "Nicht einstecken, an IT/Security übergeben",
          "Mit nach Hause nehmen",
          "Daten löschen und nutzen",
        ],
        optionsEn: [
          "Plug in to find the owner",
          "Do not plug in, hand to IT/Security",
          "Take home",
          "Wipe and use",
        ],
        correctIndex: 1,
        explanationDe: "Klassische Angriffsvektor (BadUSB). Nie unbekannte Datenträger einstecken.",
        explanationEn: "Classic attack vector (BadUSB). Never plug in unknown media.",
      },
      {
        id: "e4",
        questionDe: "Innerhalb welcher Zeit muss ein Sicherheitsvorfall intern gemeldet werden?",
        questionEn: "Within what time must a security incident be reported internally?",
        optionsDe: ["Sofort / ohne Verzögerung", "Nach einer Woche", "Am Monatsende", "Nur wenn Daten verloren gingen"],
        optionsEn: ["Immediately / without delay", "After a week", "End of month", "Only if data was lost"],
        correctIndex: 0,
        explanationDe: "Sofortige interne Meldung — die gesetzliche 24-h-Frühwarnfrist (§ 32 BSIG / Art. 23 NIS2) beginnt erst, wenn die Einrichtung Kenntnis von einem erheblichen Vorfall erlangt. Nur durch die sofortige Meldung können Verantwortliche die Erheblichkeit bewerten und die Frist wahren.",
        explanationEn: "Report internally without delay — the statutory 24h early-warning clock (§ 32 BSIG / Art. 23 NIS2) only starts once the entity becomes aware of a significant incident. Immediate internal reporting is what enables management to assess significance and meet the deadline.",
      },
      {
        id: "e5",
        questionDe: "Welche Daten sind besonders schützenswert?",
        questionEn: "Which data is especially worth protecting?",
        optionsDe: [
          "Nur Finanzdaten",
          "Personenbezogene Daten, Geschäftsgeheimnisse, Anmeldedaten",
          "Nur E-Mail-Adressen",
          "Nichts davon",
        ],
        optionsEn: [
          "Only financial data",
          "Personal data, trade secrets, credentials",
          "Only email addresses",
          "None of these",
        ],
        correctIndex: 1,
        explanationDe: "Alle drei Kategorien sind kritisch — Schutz durch Need-to-Know und Verschlüsselung.",
        explanationEn: "All three categories are critical — protect via need-to-know and encryption.",
      },
    ],
  },
  {
    roleTrack: "it",
    titleDe: "Quiz: IT-Team — Technische Schutzmaßnahmen",
    titleEn: "Quiz: IT Team — Technical Safeguards",
    questions: [
      {
        id: "i1",
        questionDe: "Was ist die 3-2-1-Backup-Regel?",
        questionEn: "What is the 3-2-1 backup rule?",
        optionsDe: [
          "3 Backups pro Tag, 2 pro Woche, 1 pro Monat",
          "3 Kopien, 2 Medien, 1 offsite",
          "3 Admins, 2 Tools, 1 Zentrale",
          "3 Jahre Aufbewahrung",
        ],
        optionsEn: [
          "3 backups/day, 2/week, 1/month",
          "3 copies, 2 media, 1 offsite",
          "3 admins, 2 tools, 1 central",
          "3 years retention",
        ],
        correctIndex: 1,
        explanationDe: "3 Kopien auf 2 unterschiedlichen Medien, davon 1 außer Haus / offline.",
        explanationEn: "3 copies on 2 different media types, 1 of which offsite / offline.",
      },
      {
        id: "i2",
        questionDe: "Welche Frist gilt nach Art. 21 für die Behebung kritischer Schwachstellen (Patch-SLA empfohlen)?",
        questionEn: "Recommended remediation SLA for critical vulnerabilities?",
        optionsDe: ["72 Stunden / 14 Tage", "1 Monat", "1 Quartal", "Jährlich beim Audit"],
        optionsEn: ["72 hours / 14 days", "1 month", "1 quarter", "Annually at audit"],
        correctIndex: 0,
        explanationDe: "Best Practice: Critical/CVSS≥9 binnen 72h, High binnen 14 Tagen.",
        explanationEn: "Best practice: Critical/CVSS≥9 within 72h, High within 14 days.",
      },
      {
        id: "i3",
        questionDe: "Was bedeutet Least Privilege?",
        questionEn: "What does Least Privilege mean?",
        optionsDe: [
          "Alle Mitarbeiter erhalten Admin-Rechte",
          "Minimal nötige Berechtigungen für die Aufgabe",
          "Nur Geschäftsleitung darf zugreifen",
          "Keine Berechtigungen, alle anfragen",
        ],
        optionsEn: [
          "All staff get admin rights",
          "Only the minimum permissions needed for the task",
          "Only management may access",
          "No permissions, request everything",
        ],
        correctIndex: 1,
        explanationDe: "Jeder Nutzer/Service erhält nur die Rechte, die für die Aufgabe zwingend nötig sind.",
        explanationEn: "Each user/service gets only the rights strictly required for the task.",
      },
      {
        id: "i4",
        questionDe: "Welcher Log-Typ ist für Forensik nach einem Vorfall am wichtigsten?",
        questionEn: "Which log type matters most for post-incident forensics?",
        optionsDe: [
          "Nur Webserver-Access-Logs",
          "Authentifizierung, EDR/Endpoint, Netzwerk-Flow, Firewall — zeitgleich verfügbar",
          "Nur Datenbank-Audit",
          "Logs sind unwichtig",
        ],
        optionsEn: [
          "Only webserver access logs",
          "Authentication, EDR/endpoint, netflow, firewall — concurrently available",
          "Only DB audit",
          "Logs are irrelevant",
        ],
        correctIndex: 1,
        explanationDe: "Korrelation mehrerer Quellen mit synchroner Zeit (NTP) ist entscheidend für Root-Cause.",
        explanationEn: "Correlation across multiple sources with synced time (NTP) is key for root cause.",
      },
      {
        id: "i5",
        questionDe: "Was gehört zu Hardening eines Servers?",
        questionEn: "What belongs to server hardening?",
        optionsDe: [
          "Default-Passwörter behalten",
          "Unnötige Dienste deaktivieren, Patches, Konfig-Baseline, Logging aktivieren",
          "RDP für alle öffnen",
          "Antivirus deinstallieren",
        ],
        optionsEn: [
          "Keep default passwords",
          "Disable unused services, patch, config baseline, enable logging",
          "Open RDP to everyone",
          "Uninstall antivirus",
        ],
        correctIndex: 1,
        explanationDe: "CIS Benchmarks / BSI SYS.1.x liefern Härtungs-Baselines.",
        explanationEn: "CIS Benchmarks / BSI SYS.1.x provide hardening baselines.",
      },
    ],
  },
];

export const getQuizForTrack = (roleTrack: string): RoleQuiz | undefined => {
  // Fallback: 'all' for unmapped tracks
  return TRAINING_QUIZZES.find(q => q.roleTrack === roleTrack) || TRAINING_QUIZZES.find(q => q.roleTrack === "all");
};

export const PASS_THRESHOLD = 0.8; // 4/5
