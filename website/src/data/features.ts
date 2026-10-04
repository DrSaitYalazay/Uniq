/**
 * Funktionsseiten (/de/funktionen/…, /en/features/…). Nur Funktionen, die es in
 * UniqSuite gibt (Quelle: Broschüre, White Paper, Demo-Mandant). Normbezüge nur,
 * wo sie eindeutig sind.
 */
export type Feature = {
  slug: string;
  img: string;
  label: string;
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
      label: 'Management-Dashboard',
      title: 'Der Stand auf einer Seite',
      sub: 'Für die Geschäftsleitung gemacht.',
      short: 'Gesamtstand, Trend und offene Punkte, ohne Tabellen.',
      lead: 'Die Geschäftsleitung trägt die Verantwortung für die Informationssicherheit. Das Dashboard zeigt ihr in wenigen Sekunden, wo das Unternehmen steht und wo es hakt.',
      why: 'In vielen Häusern erfährt die Leitung vom Stand der Sicherheit über Folien, die jemand einmal im Quartal zusammenstellt. Bis sie vorgelegt werden, sind sie veraltet. Wer überwachen soll, braucht einen Stand, der sich mit jeder erledigten Maßnahme selbst aktualisiert.',
      can: [
        'Den Gesamtstand und den Stand je Regelwerk auf einen Blick sehen, mit Verlauf über die Zeit.',
        'Sofort erkennen, was Aufmerksamkeit braucht: überfällige Maßnahmen, fällige Meldungen, offene Pflichten.',
        'Von jeder Kennzahl direkt zu den Einzelheiten springen.',
        'Den Vorstandsbericht als PDF, Word oder Excel erzeugen.',
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
      slug: 'vorfaelle',
      img: 'incident',
      label: 'Vorfälle',
      title: 'Wenn etwas passiert',
      sub: 'Einmal erfassen, keine Frist verpassen.',
      short: 'Meldepflichten erkennen, Fristen mitzählen.',
      lead: 'Bei einem erheblichen Sicherheitsvorfall laufen die Uhren ab dem Moment, in dem Sie davon wissen. UniqSuite sagt Ihnen, was zu melden ist und bis wann.',
      why: 'Im Ernstfall hat niemand Zeit, Gesetzestexte zu lesen. Nach dem BSIG ist eine frühe Erstmeldung binnen 24 Stunden fällig, die Meldung mit erster Bewertung binnen 72 Stunden und die Abschlussmeldung einen Monat danach. Wer zusätzlich unter den Cyber Resilience Act fällt oder Hochrisiko-KI betreibt, hat weitere Meldewege.',
      can: [
        'Einen Vorfall einmal erfassen, mit Zeitpunkt der Kenntnis, Auswirkungen und betroffenen Diensten.',
        'Sehen, welche Meldepflichten sich aus Ihren Regelwerken ergeben.',
        'Die Fristen-Timer im Blick behalten: 24 Stunden, 72 Stunden, ein Monat.',
        'Maßnahmen und Erkenntnisse aus dem Vorfall direkt in den Maßnahmenplan übernehmen.',
      ],
      gain: [
        'Keine verpasste Meldung, weil jemand die Frist falsch berechnet hat.',
        'Ein vollständiger Verlauf, falls die Aufsicht später nachfragt.',
      ],
      refs: [
        'BSIG § 32: Meldepflichten bei erheblichen Sicherheitsvorfällen',
        'BSIG § 30 Abs. 2 Nr. 2: Bewältigung von Sicherheitsvorfällen',
        'ISO/IEC 27001, Anhang A 5.24 bis 5.28: Umgang mit Informationssicherheitsvorfällen',
        'CRA Art. 14: Meldepflichten der Hersteller',
      ],
      steps: [4, 5],
    },
    {
      slug: 'lieferkette',
      img: 'supplier',
      label: 'Lieferkette',
      title: 'Lieferanten im Blick',
      sub: 'Wer Zugriff hat, wird mitbewertet.',
      short: 'Kritikalität, Kontrollen und Prüftermine je Lieferant.',
      lead: 'Viele Angriffe kommen über Dienstleister. Deshalb verlangen NIS2 und ISO 27001, dass Sie Ihre Lieferanten kennen und ihre Sicherheit regelmäßig bewerten.',
      why: 'Lieferantenbewertungen landen oft in einer Tabelle, die nach dem ersten Durchgang niemand mehr anfasst. Dann weiß man im Audit nicht mehr, wann ein wichtiger Dienstleister zuletzt geprüft wurde und mit welchem Ergebnis.',
      can: [
        'Für jeden Lieferanten festhalten, wie kritisch er für Ihre Dienste ist.',
        'Erfassen, welche Kontrollen greifen und welche fehlen.',
        'Einen Risikowert berechnen lassen und einen Prüfzyklus festlegen.',
        'Lieferanten aus dem Inventar übernehmen, ohne sie doppelt anzulegen.',
      ],
      gain: [
        'Sie wissen jederzeit, welcher Lieferant als nächstes geprüft werden muss.',
        'Die Lieferkette erscheint mit ihrem Stand im Dashboard und in den Berichten.',
      ],
      refs: [
        'BSIG § 30 Abs. 2 Nr. 4: Sicherheit der Lieferkette',
        'ISO/IEC 27001, Anhang A 5.19 bis 5.22: Informationssicherheit in Lieferantenbeziehungen',
      ],
      steps: [1, 3],
    },
    {
      slug: 'richtlinien',
      img: 'policies',
      label: 'Richtlinien',
      title: 'Richtlinien, die man freigeben kann',
      sub: 'Vorlagen, die schon passen.',
      short: 'Vorlagen mit Bezug zu den Anforderungen.',
      lead: 'Jedes Managementsystem braucht schriftliche Regeln. UniqSuite liefert Vorlagen, die bereits auf die Anforderungen zugeschnitten sind.',
      why: 'Richtlinien von Grund auf zu schreiben kostet Wochen. Aus dem Internet kopierte Muster passen selten zur eigenen Organisation, und im Audit fällt auf, wenn eine Richtlinie Dinge verspricht, die niemand tut.',
      can: [
        'Mit einer Vorlage starten, die zeigt, welche Anforderungen sie abdeckt.',
        'Die Vorlage an Ihre Organisation anpassen.',
        'Die Richtlinie zur Freigabe geben und den Stand festhalten.',
      ],
      gain: [
        'Sie sehen, welche Anforderung durch welche Richtlinie abgedeckt ist.',
        'Prüfer finden die freigegebenen Fassungen an einer Stelle.',
      ],
      refs: [
        'ISO/IEC 27001, Abschnitt 5.2 und Anhang A 5.1: Informationssicherheitspolitik und Richtlinien',
        'BSIG § 30 Abs. 2 Nr. 1: Konzepte zur Risikoanalyse und Sicherheit für Informationssysteme',
      ],
      steps: [2, 4],
    },
    {
      slug: 'ki-governance',
      img: 'ai',
      label: 'KI-Governance',
      title: 'KI sauber erfassen',
      sub: 'Register, Einstufung, Unterlagen.',
      short: 'KI-Register, Einstufung nach dem AI Act, Pflichtdokumente.',
      lead: 'Der EU AI Act gilt unabhängig von NIS2. Viele Organisationen setzen KI längst ein und wissen nicht genau, wo. Hier fangen Sie an.',
      why: 'Die ersten Pflichten des AI Act gelten bereits, etwa die KI-Kompetenz der Beschäftigten und die Verbote bestimmter Praktiken. Weitere folgen. Ohne Überblick über die eingesetzten Systeme lässt sich weder die Einstufung noch die passende Dokumentation klären.',
      can: [
        'Ein Register Ihrer KI-Systeme anlegen, mit Zweck, Anbieter und Verantwortlichen.',
        'Jedes System nach dem AI Act einstufen lassen.',
        'Sehen, welche Unterlagen je Rolle und Risikoklasse vorgeschrieben sind.',
        'Mit ISO/IEC 42001 ein Managementsystem für KI aufbauen.',
      ],
      gain: [
        'Ein belastbarer Überblick, welche KI wo eingesetzt wird.',
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
    {
      slug: 'audit',
      img: 'audit',
      label: 'Audit',
      title: 'Bereit für den Prüfer',
      sub: 'Befunde, Korrekturen, Nachweise.',
      short: 'Alles, was der Prüfer sehen will, an einer Stelle.',
      lead: 'Ein Audit ist entspannter, wenn die Nachweise nicht erst gesucht werden müssen. In UniqSuite liegen sie dort, wo die Arbeit passiert ist.',
      why: 'Prüfer wollen sehen, dass Abweichungen erkannt und behoben werden. Wer Befunde in E-Mails und Korrekturen in Tabellen verfolgt, verbringt die Woche vor dem Audit mit Suchen.',
      can: [
        'Interne und externe Audits planen und die Befunde erfassen.',
        'Zu jedem Befund eine Korrekturmaßnahme mit Zuständigen und Frist anlegen.',
        'Nachweise direkt an Anforderungen und Maßnahmen hängen.',
        'Den Auditbericht auf Knopfdruck erzeugen.',
      ],
      gain: [
        'Der Prüfer bekommt einen Bericht statt eines Ordners.',
        'Sie sehen von Runde zu Runde, ob Ihr Managementsystem besser wird.',
      ],
      refs: [
        'ISO/IEC 27001, Abschnitt 9.2: internes Audit',
        'ISO/IEC 27001, Abschnitt 10.2: Nichtkonformität und Korrekturmaßnahmen',
        'BSIG § 30 Abs. 2 Nr. 6: Bewertung der Wirksamkeit der Maßnahmen',
      ],
      steps: [5],
    },
  ],
  en: [
    {
      slug: 'dashboard',
      img: 'dashboard',
      label: 'Management dashboard',
      title: 'Your status on one page',
      sub: 'Made for management.',
      short: 'Overall status, trend and open items, no spreadsheets.',
      lead: 'Management is accountable for information security. The dashboard shows them in seconds where the organisation stands and where things are stuck.',
      why: 'In many organisations, management learns about the security status from slides someone puts together once a quarter. By the time they are presented, they are out of date. Anyone who has to oversee needs a status that updates itself with every measure completed.',
      can: [
        'See the overall status and the status per framework at a glance, with the trend over time.',
        'Spot straight away what needs attention: overdue measures, due reports, open obligations.',
        'Jump from any figure straight to the details.',
        'Create the board report as PDF, Word or Excel.',
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
      slug: 'incidents',
      img: 'incident',
      label: 'Incidents',
      title: 'When something happens',
      sub: 'Record it once, miss no deadline.',
      short: 'Identify reporting duties, track the deadlines.',
      lead: 'With a significant security incident, the clock starts the moment you know about it. UniqSuite tells you what has to be reported and by when.',
      why: 'In an emergency nobody has time to read legislation. Under the BSIG, an early warning is due within 24 hours, the notification with an initial assessment within 72 hours and the final report one month later. If the Cyber Resilience Act also applies to you, or you operate high-risk AI, there are further reporting channels.',
      can: [
        'Record an incident once, with the time you became aware, the impact and the services affected.',
        'See which reporting duties follow from your frameworks.',
        'Keep the deadline timers in view: 24 hours, 72 hours, one month.',
        'Move measures and lessons from the incident straight into the plan.',
      ],
      gain: [
        'No missed report because someone got the deadline wrong.',
        'A complete history if the authority asks later.',
      ],
      refs: [
        'BSIG section 32: reporting duties for significant security incidents',
        'BSIG section 30(2) no. 2: incident handling',
        'ISO/IEC 27001, Annex A 5.24 to 5.28: information security incident management',
        'CRA Art. 14: reporting obligations of manufacturers',
      ],
      steps: [4, 5],
    },
    {
      slug: 'supply-chain',
      img: 'supplier',
      label: 'Supply chain',
      title: 'Suppliers in view',
      sub: 'Whoever has access gets assessed too.',
      short: 'Criticality, controls and review dates per supplier.',
      lead: 'Many attacks come in through service providers. That is why NIS2 and ISO 27001 require you to know your suppliers and assess their security regularly.',
      why: 'Supplier assessments often end up in a spreadsheet that nobody touches after the first round. Then, in the audit, nobody knows when an important provider was last checked or with what result.',
      can: [
        'Record for each supplier how critical it is for your services.',
        'Capture which controls are in place and which are missing.',
        'Have a risk score calculated and set a review cycle.',
        'Take suppliers over from the inventory without creating them twice.',
      ],
      gain: [
        'You always know which supplier is due for review next.',
        'The supply chain shows up with its status in the dashboard and the reports.',
      ],
      refs: [
        'BSIG section 30(2) no. 4: supply chain security',
        'ISO/IEC 27001, Annex A 5.19 to 5.22: information security in supplier relationships',
      ],
      steps: [1, 3],
    },
    {
      slug: 'policies',
      img: 'policies',
      label: 'Policies',
      title: 'Policies ready for sign-off',
      sub: 'Templates that already fit.',
      short: 'Templates linked to the requirements.',
      lead: 'Every management system needs written rules. UniqSuite provides templates that are already tailored to the requirements.',
      why: 'Writing policies from scratch takes weeks. Templates copied from the internet rarely fit your own organisation, and an auditor notices when a policy promises things nobody does.',
      can: [
        'Start from a template that shows which requirements it covers.',
        'Adapt the template to your organisation.',
        'Submit the policy for approval and record its status.',
      ],
      gain: [
        'You see which requirement is covered by which policy.',
        'Auditors find the approved versions in one place.',
      ],
      refs: [
        'ISO/IEC 27001, clause 5.2 and Annex A 5.1: information security policy and topic-specific policies',
        'BSIG section 30(2) no. 1: policies on risk analysis and information system security',
      ],
      steps: [2, 4],
    },
    {
      slug: 'ai-governance',
      img: 'ai',
      label: 'AI governance',
      title: 'AI properly recorded',
      sub: 'Register, classification, documents.',
      short: 'AI register, AI Act classification, required documents.',
      lead: 'The EU AI Act applies independently of NIS2. Many organisations already use AI without knowing exactly where. This is where you start.',
      why: 'The first AI Act obligations already apply, such as AI literacy for staff and the ban on certain practices. More follow. Without an overview of the systems in use, neither the classification nor the right documentation can be settled.',
      can: [
        'Build a register of your AI systems, with purpose, provider and owners.',
        'Have each system classified under the AI Act.',
        'See which documents are required per role and risk class.',
        'Build a management system for AI with ISO/IEC 42001.',
      ],
      gain: [
        'A reliable overview of which AI is used where.',
        'Clear next steps instead of general uncertainty.',
      ],
      refs: [
        'AI Act Art. 4: AI literacy',
        'AI Act Art. 5: prohibited practices',
        'AI Act Art. 6 and Annex III: classification as high-risk AI',
        'AI Act Art. 50: transparency obligations',
        'ISO/IEC 42001: artificial intelligence management system',
      ],
      steps: [0, 2],
    },
    {
      slug: 'audit',
      img: 'audit',
      label: 'Audit',
      title: 'Ready for the auditor',
      sub: 'Findings, corrections, evidence.',
      short: 'Everything the auditor wants to see, in one place.',
      lead: 'An audit is more relaxed when the evidence does not have to be hunted down first. In UniqSuite it sits where the work was done.',
      why: 'Auditors want to see that deviations are spotted and fixed. If you track findings in emails and corrections in spreadsheets, you spend the week before the audit searching.',
      can: [
        'Plan internal and external audits and record the findings.',
        'Create a corrective action with an owner and a deadline for each finding.',
        'Attach evidence directly to requirements and measures.',
        'Create the audit report at the push of a button.',
      ],
      gain: [
        'The auditor gets a report instead of a folder.',
        'You see from round to round whether your management system is improving.',
      ],
      refs: [
        'ISO/IEC 27001, clause 9.2: internal audit',
        'ISO/IEC 27001, clause 10.2: nonconformity and corrective action',
        'BSIG section 30(2) no. 6: assessing the effectiveness of the measures',
      ],
      steps: [5],
    },
  ],
};

export const featureBase = { de: '/de/funktionen/', en: '/en/features/' } as const;
export const featureHref = (lang: 'de' | 'en', i: number) => `${featureBase[lang]}${features[lang][i].slug}/`;
