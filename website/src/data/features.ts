/**
 * Die fünf Werkzeuge (/de/funktionen/…, /en/features/…), in der Reihenfolge der Seitenleiste in UniqSuite:
 * Management Dashboard, Policy Engine, Incident Management Registry, Supply Chain Controller, AI Registry.
 * Inhalte am Code der Anwendung geprüft (pages/Dashboard, Policies, IncidentManagement, SupplierCheck,
 * KiGovernance). Normbezüge nur, wo sie eindeutig sind.
 */
export type Feature = {
  slug: string;
  img: string; // Grafik- und Symbolschlüssel
  label: string; // Produktname des Werkzeugs
  title: string;
  sub: string;
  short: string;
  lead: string;
  why: string;
  can: string[];
  gain: string[];
  refs: string[];
  steps: number[]; // passende Schritte (Index in steps)
};

export const features: Record<'de' | 'en', Feature[]> = {
  de: [
    {
      slug: 'dashboard',
      img: 'dashboard',
      label: 'Management Dashboard',
      title: 'Ihr Stand auf einer Seite',
      sub: 'Für die Geschäftsleitung gemacht.',
      short: 'Sicherheitslage, Handlungsbedarf und Fristen auf einen Blick.',
      lead: 'Die Geschäftsleitung trägt die Verantwortung für die Informationssicherheit. Das Management Dashboard zeigt ihr in wenigen Sekunden, wo das Unternehmen steht und was als Nächstes zu tun ist.',
      why: 'In vielen Häusern erfährt die Leitung vom Stand der Sicherheit über Folien, die jemand einmal im Quartal zusammenstellt. Bis sie vorgelegt werden, sind sie veraltet. Wer überwachen soll, braucht einen Stand, der sich mit jeder erledigten Maßnahme selbst aktualisiert.',
      can: [
        'Die Sicherheitslage als einen Wert mit Ampel und Verlauf sehen, dazu den Stand je Regelwerk.',
        'Handlungsbedarf und überfällige Fristen sofort erkennen und mit einem Klick dorthin springen.',
        'Zwischen Überblick und Detailansicht wechseln und nach Regelwerk filtern.',
        'Den Vorstandsbericht als PDF erzeugen und die übrigen Berichte direkt öffnen.',
      ],
      gain: [
        'Die Leitung kann ihre Überwachungspflicht nachweisbar wahrnehmen.',
        'Niemand muss Zahlen von Hand zusammentragen. Sie entstehen aus der täglichen Arbeit.',
      ],
      refs: [
        'BSIG § 38 Abs. 1: Die Geschäftsleitung setzt die Risikomanagementmaßnahmen um und überwacht ihre Umsetzung',
        'ISO/IEC 27001, Abschnitt 9.1 und 9.3: Überwachung, Messung und Managementbewertung',
      ],
      steps: [4, 5],
    },
    {
      slug: 'richtlinien',
      img: 'policies',
      label: 'Policy Engine',
      title: 'Richtlinien auf Knopfdruck',
      sub: 'Aus Vorlagen und belegten Regelungen.',
      short: 'Erzeugt Ihre Richtlinien passend zu Ihren Regelwerken.',
      lead: 'Jedes Managementsystem braucht schriftliche Regeln. Die Policy Engine erzeugt sie aus Vorlagen mit belegten Regelungen, passend zu den Regelwerken, die Sie gewählt haben.',
      why: 'Richtlinien von Grund auf zu schreiben kostet Wochen. Aus dem Internet kopierte Muster passen selten zur eigenen Organisation, und im Audit fällt auf, wenn eine Richtlinie Dinge verspricht, die niemand tut.',
      can: [
        'Aus einem Katalog von über 150 Vorlagen genau die Richtlinien erhalten, die zu Ihren Regelwerken gehören.',
        'Die empfohlenen Regelungen auswählen, anpassen und um eigene ergänzen.',
        'Zweck, Geltungsbereich, Verantwortliche, Genehmigung, Version und Prüftermine pflegen.',
        'Jede Richtlinie als Word oder PDF ausgeben, auf Wunsch mit Begründung, Anwendbarkeit und Quellen.',
      ],
      gain: [
        'Sie sehen den Umsetzungsgrad je Kategorie und je Regelwerk.',
        'Prüfer finden die freigegebenen Fassungen mit Version an einer Stelle.',
      ],
      refs: [
        'ISO/IEC 27001, Abschnitt 5.2 und Anhang A 5.1: Informationssicherheitspolitik und Richtlinien',
        'BSIG § 30 Abs. 2 Nr. 1: Konzepte zur Risikoanalyse und Sicherheit für Informationssysteme',
      ],
      steps: [2, 4],
    },
    {
      slug: 'vorfaelle',
      img: 'incident',
      label: 'Incident Management Registry',
      title: 'Im Ernstfall wissen, was zu tun ist',
      sub: 'Meldewege, Fristen, Register.',
      short: 'Zeigt Meldepflichten, Meldestellen und Fristen und führt das Register.',
      lead: 'Bei einem erheblichen Sicherheitsvorfall laufen die Uhren ab dem Moment, in dem Sie davon wissen. Die Incident Management Registry zeigt Ihnen, wen Sie benachrichtigen, auf welchem Weg und bis wann.',
      why: 'Im Ernstfall hat niemand Zeit, Gesetzestexte zu lesen. Nach dem BSIG ist eine frühe Erstmeldung binnen 24 Stunden fällig, die Meldung mit erster Bewertung binnen 72 Stunden und die Abschlussmeldung einen Monat danach. Wer zusätzlich unter den Cyber Resilience Act oder den AI Act fällt, hat weitere Meldewege.',
      can: [
        'Einen Vorfall einmal erfassen: Schwere, Status und die Zeitpunkte von Eintritt, Erkennung, Eindämmung und Behebung.',
        'Mit wenigen Fragen klären, welche Meldepflichten greifen. Was noch unbekannt ist, zählt vorsichtshalber als ja.',
        'Die Fristen-Timer mit Ampel im Blick behalten, bei NIS2 etwa 24 Stunden, 72 Stunden und einen Monat.',
        'Im Meldestellen-Verzeichnis sehen, an wen die Meldung geht, zum Beispiel an das Meldeportal des BSI.',
        'Vorfallbericht und Registerbericht als PDF erzeugen, mit den Pflichtinhalten nach NIS2 Art. 23.',
      ],
      gain: [
        'Keine verpasste Meldung, weil jemand die Frist falsch berechnet hat.',
        'Ein vollständiges Register mit Kennzahlen wie der Zeit bis zur Erkennung und Behebung, falls die Aufsicht nachfragt.',
      ],
      refs: [
        'BSIG § 32: Meldepflichten bei erheblichen Sicherheitsvorfällen',
        'BSIG § 30 Abs. 2 Nr. 2: Bewältigung von Sicherheitsvorfällen',
        'ISO/IEC 27001, Anhang A 5.24 bis 5.28: Umgang mit Informationssicherheitsvorfällen',
        'CRA Art. 14: Meldepflichten der Hersteller',
        'AI Act Art. 73: Meldung schwerwiegender Vorfälle',
      ],
      steps: [4, 5],
    },
    {
      slug: 'lieferkette',
      img: 'supplier',
      label: 'Supply Chain Controller',
      title: 'Lieferanten unter Kontrolle',
      sub: 'Register, Prüffragen, Risikowert.',
      short: 'Kritikalität, Kontrollen, Zertifikate und Prüftermine je Lieferant.',
      lead: 'Viele Angriffe kommen über Dienstleister. Deshalb verlangen NIS2 und ISO 27001, dass Sie Ihre Lieferanten kennen und ihre Sicherheit regelmäßig bewerten. Der Supply Chain Controller hält alles dazu an einer Stelle.',
      why: 'Lieferantenbewertungen landen oft in einer Tabelle, die nach dem ersten Durchgang niemand mehr anfasst. Dann weiß man im Audit nicht mehr, wann ein wichtiger Dienstleister zuletzt geprüft wurde und mit welchem Ergebnis.',
      can: [
        'Jeden Lieferanten mit Leistung, Kritikalität und Art des Datenzugriffs erfassen.',
        'Bis zu elf Prüffragen nach ISO/IEC 27001, NIS2 und DSGVO beantworten. Kritische Kontrollen sind markiert.',
        'Zertifikate wie ISO/IEC 27001, SOC 2, C5, TISAX und ISO/IEC 27017 festhalten.',
        'Einen Risikowert von 0 bis 100 berechnen lassen und den nächsten Prüftermin im Blick behalten.',
      ],
      gain: [
        'Sie wissen jederzeit, welcher Lieferant als nächstes geprüft werden muss.',
        'Das Risiko Ihrer Lieferkette steht gesammelt in einer Übersicht.',
      ],
      refs: [
        'BSIG § 30 Abs. 2 Nr. 4: Sicherheit der Lieferkette',
        'ISO/IEC 27001, Anhang A 5.19 bis 5.23: Informationssicherheit in Lieferantenbeziehungen',
        'DSGVO Art. 28: Auftragsverarbeitung',
      ],
      steps: [1, 3],
    },
    {
      slug: 'ki-governance',
      img: 'ai',
      label: 'AI Registry',
      title: 'Jede KI erfasst und eingestuft',
      sub: 'Register, Risikoklasse, Pflichtdokumente.',
      short: 'KI-Systeme registrieren, nach dem AI Act einstufen, Unterlagen erzeugen.',
      lead: 'Der EU AI Act gilt unabhängig von NIS2. Die AI Registry hält fest, welche KI Sie wo einsetzen, stuft sie ein und zeigt, welche Unterlagen noch fehlen.',
      why: 'Die ersten Pflichten des AI Act gelten bereits, etwa die KI-Kompetenz der Beschäftigten und die Verbote bestimmter Praktiken. Weitere folgen. Ohne Überblick über die eingesetzten Systeme lässt sich weder die Einstufung noch die passende Dokumentation klären.',
      can: [
        'KI-Systeme mit Zweck, Rolle, Verantwortlichen, Version, Lebenszyklus und Freigabe registrieren.',
        'Die Risikoklasse ergibt sich aus Ihren Angaben zu Anhang III, den verbotenen Praktiken nach Art. 5 und den Transparenzpflichten nach Art. 50.',
        'Sehen, welche Pflichtdokumente je Rolle und Risikoklasse fehlen, und sie vorbefüllt als Word oder PDF erzeugen.',
        'Das Register als PDF oder Excel ausgeben und die Fristen des AI Act im Blick behalten.',
      ],
      gain: [
        'Ein belastbarer Überblick, welche KI wo eingesetzt wird und welches Risiko sie trägt.',
        'Klare nächste Schritte statt allgemeiner Unsicherheit.',
      ],
      refs: [
        'AI Act Art. 4: KI-Kompetenz',
        'AI Act Art. 5: verbotene Praktiken',
        'AI Act Art. 6 und Anhang III: Einstufung als Hochrisiko-KI',
        'AI Act Art. 50: Transparenzpflichten',
        'ISO/IEC 42001: Managementsystem für künstliche Intelligenz',
      ],
      steps: [0, 2],
    },
  ],
  en: [
    {
      slug: 'dashboard',
      img: 'dashboard',
      label: 'Management Dashboard',
      title: 'Your status on one page',
      sub: 'Made for management.',
      short: 'Security posture, action needed and deadlines at a glance.',
      lead: 'Management is accountable for information security. The Management Dashboard shows them in seconds where the organisation stands and what to do next.',
      why: 'In many organisations, management learns about the security status from slides someone puts together once a quarter. By the time they are presented, they are out of date. Anyone who has to oversee needs a status that updates itself with every measure completed.',
      can: [
        'See your security posture as one score with traffic light and trend, plus the status per framework.',
        'Spot action needed and overdue deadlines straight away and jump there in one click.',
        'Switch between overview and detail and filter by framework.',
        'Create the board report as PDF and open the other reports directly.',
      ],
      gain: [
        'Management can show that it fulfils its duty to oversee.',
        'Nobody has to collect figures by hand. They come from the daily work.',
      ],
      refs: [
        'BSIG section 38(1): management implements the risk management measures and oversees their implementation',
        'ISO/IEC 27001, clauses 9.1 and 9.3: monitoring, measurement and management review',
      ],
      steps: [4, 5],
    },
    {
      slug: 'policies',
      img: 'policies',
      label: 'Policy Engine',
      title: 'Policies at the push of a button',
      sub: 'From templates and sourced clauses.',
      short: 'Generates your policies to match your frameworks.',
      lead: 'Every management system needs written rules. The Policy Engine generates them from templates with sourced clauses, matched to the frameworks you have chosen.',
      why: 'Writing policies from scratch takes weeks. Templates copied from the internet rarely fit your own organisation, and in the audit it shows when a policy promises things nobody does.',
      can: [
        'Get exactly the policies that belong to your frameworks, from a catalogue of more than 150 templates.',
        'Select the recommended clauses, adapt them and add your own.',
        'Maintain purpose, scope, owners, approval, version and review dates.',
        'Export each policy as Word or PDF, optionally with rationale, applicability and sources.',
      ],
      gain: [
        'You see the implementation level per category and per framework.',
        'Auditors find the approved versions in one place.',
      ],
      refs: [
        'ISO/IEC 27001, clause 5.2 and Annex A 5.1: information security policy and topic-specific policies',
        'BSIG section 30(2) no. 1: policies on risk analysis and information system security',
      ],
      steps: [2, 4],
    },
    {
      slug: 'incidents',
      img: 'incident',
      label: 'Incident Management Registry',
      title: 'Know what to do when it counts',
      sub: 'Reporting channels, deadlines, register.',
      short: 'Shows reporting duties, authorities and deadlines, and keeps the register.',
      lead: 'In a significant security incident, the clock starts the moment you know about it. The Incident Management Registry shows you whom to notify, through which channel and by when.',
      why: 'In an emergency nobody has time to read legislation. Under the German BSI Act, an early warning is due within 24 hours, the notification with an initial assessment within 72 hours and the final report one month later. If the Cyber Resilience Act or the AI Act also applies to you, there are further reporting channels.',
      can: [
        'Record an incident once: severity, status and the times of occurrence, detection, containment and resolution.',
        'Find out with a few questions which reporting duties apply. Anything still unknown counts as yes, to be safe.',
        'Keep the deadline timers with traffic light in view, for NIS2 for example 24 hours, 72 hours and one month.',
        'See in the directory of reporting authorities where the report goes, for example the BSI reporting portal.',
        'Create the incident report and the register report as PDF, with the mandatory content under NIS2 Art. 23.',
      ],
      gain: [
        'No missed report because someone miscalculated a deadline.',
        'A complete register with figures such as time to detect and time to resolve, in case the authority asks.',
      ],
      refs: [
        'BSIG section 32: reporting obligations for significant security incidents',
        'BSIG section 30(2) no. 2: incident handling',
        'ISO/IEC 27001, Annex A 5.24 to 5.28: management of information security incidents',
        'CRA Art. 14: reporting obligations of manufacturers',
        'AI Act Art. 73: reporting of serious incidents',
      ],
      steps: [4, 5],
    },
    {
      slug: 'supply-chain',
      img: 'supplier',
      label: 'Supply Chain Controller',
      title: 'Suppliers under control',
      sub: 'Register, review questions, risk score.',
      short: 'Criticality, controls, certificates and review dates per supplier.',
      lead: 'Many attacks come in through service providers. That is why NIS2 and ISO 27001 require you to know your suppliers and assess their security regularly. The Supply Chain Controller keeps all of it in one place.',
      why: 'Supplier assessments often end up in a spreadsheet nobody touches after the first round. Then, in the audit, nobody knows when an important provider was last reviewed and with what result.',
      can: [
        'Record each supplier with service, criticality and type of data access.',
        'Answer up to eleven review questions based on ISO/IEC 27001, NIS2 and the GDPR. Critical controls are marked.',
        'Record certificates such as ISO/IEC 27001, SOC 2, C5, TISAX and ISO/IEC 27017.',
        'Get a risk score from 0 to 100 and keep the next review date in view.',
      ],
      gain: [
        'You always know which supplier is due for review next.',
        'The risk of your supply chain is collected in one overview.',
      ],
      refs: [
        'BSIG section 30(2) no. 4: supply chain security',
        'ISO/IEC 27001, Annex A 5.19 to 5.23: information security in supplier relationships',
        'GDPR Art. 28: processors',
      ],
      steps: [1, 3],
    },
    {
      slug: 'ai-governance',
      img: 'ai',
      label: 'AI Registry',
      title: 'Every AI recorded and classified',
      sub: 'Register, risk class, mandatory documents.',
      short: 'Register AI systems, classify them under the AI Act, create the documents.',
      lead: 'The EU AI Act applies independently of NIS2. The AI Registry records which AI you use where, classifies it and shows which documents are still missing.',
      why: 'The first obligations of the AI Act already apply, such as AI literacy of staff and the bans on certain practices. More will follow. Without an overview of the systems in use, neither the classification nor the right documentation can be settled.',
      can: [
        'Register AI systems with purpose, role, owner, version, lifecycle stage and approval.',
        'The risk class follows from your answers on Annex III, the prohibited practices under Art. 5 and the transparency duties under Art. 50.',
        'See which mandatory documents are missing per role and risk class, and create them pre-filled as Word or PDF.',
        'Export the register as PDF or Excel and keep the AI Act deadlines in view.',
      ],
      gain: [
        'A reliable overview of which AI is used where and what risk it carries.',
        'Clear next steps instead of general uncertainty.',
      ],
      refs: [
        'AI Act Art. 4: AI literacy',
        'AI Act Art. 5: prohibited practices',
        'AI Act Art. 6 and Annex III: classification as high-risk AI',
        'AI Act Art. 50: transparency obligations',
        'ISO/IEC 42001: AI management system',
      ],
      steps: [0, 2],
    },
  ],
};

export const featureBase = { de: '/de/funktionen/', en: '/en/features/' } as const;
export const featureHref = (lang: 'de' | 'en', i: number) => `${featureBase[lang]}${features[lang][i].slug}/`;
