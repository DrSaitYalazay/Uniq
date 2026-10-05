/**
 * Inhalte der sechs Schrittseiten (/de/schritte/…, /en/steps/…).
 * Reihenfolge und Bilder entsprechen t.pdca.phases. Normbezüge nur dort, wo sie
 * eindeutig sind (ISO/IEC 27001:2022, BSIG in der Fassung des NIS2UmsuCG).
 */
export type Step = {
  slug: string;
  img: string;
  cycle: string;
  title: string;
  sub: string;
  lead: string;
  why: string;
  how: string[];
  tool: string[];
  result: string;
  refs: string[];
};

export const steps: Record<'de' | 'en', Step[]> = {
  de: [
    {
      slug: 'rahmen',
      img: 'scope',
      cycle: 'Plan',
      title: 'Rahmen festlegen',
      sub: 'Wer Sie sind und welche Regelwerke Sie umsetzen.',
      lead: 'Bevor es um Maßnahmen geht, muss klar sein, wofür Sie überhaupt verantwortlich sind.',
      why: 'Fehlt am Anfang ein klarer Rahmen, wird später über Dinge diskutiert, die nie gefragt waren. Ein sauber beschriebener Rahmen spart diese Runden und ist das Erste, wonach ein Prüfer fragt.',
      how: [
        'Sie geben Branche und Größe an und wählen das Paket, also die Regelwerke, die Sie umsetzen wollen. AI Act, ISO 42001 oder Cyber Resilience Act schalten Sie bei Bedarf dazu.',
        'Eine kurze Vorabfrage klärt, ob Sonderpflichten für Sie gelten. Was nicht zutrifft, führt UniqSuite als „nicht anwendbar“ mit Begründung.',
        'Sie tragen die Beteiligten ein, etwa Geschäftsleitung, Informationssicherheitsbeauftragte und Fachverantwortliche, und vergeben Rollen.',
      ],
      tool: [
        'Die Fragen kommen in einer festen Reihenfolge. Sie müssen nicht wissen, welcher Normabschnitt gerade gemeint ist.',
        'Was Sie hier festlegen, steuert die folgenden Schritte. Die Gap-Analyse zeigt danach die Anforderungen der gewählten Regelwerke.',
      ],
      result: 'einen Scope-Bericht, den Sie der Geschäftsleitung vorlegen und im Audit verwenden können.',
      refs: [
        'ISO/IEC 27001, Abschnitt 4: Kontext der Organisation, interessierte Parteien, Anwendungsbereich',
        'ISO/IEC 27001, Abschnitt 5.3: Rollen und Verantwortlichkeiten',
        'BSIG § 28: Einordnung als besonders wichtige oder wichtige Einrichtung',
        'BSIG § 33: Registrierungspflicht',
      ],
    },
    {
      slug: 'inventar',
      img: 'inventory',
      cycle: 'Plan',
      title: 'Inventar',
      sub: 'Was Sie schützen müssen.',
      lead: 'Schutz beginnt mit einer Liste. Hier tragen Sie zusammen, welche Dienste Sie erbringen und worauf sie sich stützen.',
      why: 'Ein Risiko lässt sich nur für etwas bewerten, das man kennt. Wer weiß, dass die Lohnabrechnung an einem bestimmten Server und einem externen Dienstleister hängt, kann gezielt fragen, was passiert, wenn einer davon ausfällt. Ohne Inventar bleibt jede Risikoanalyse allgemein.',
      how: [
        'Sie legen Ihre wichtigsten Dienste an, also das, was Ihre Kunden oder Bürger tatsächlich von Ihnen bekommen.',
        'Zu jedem Dienst erfassen Sie Systeme, Anwendungen, Daten und Dienstleister, auf die er angewiesen ist.',
        'Für jeden Eintrag bestimmen Sie, wie kritisch er ist und wer dafür verantwortlich ist.',
      ],
      tool: [
        'UniqSuite zeigt die Abhängigkeiten als Übersicht. Sie sehen auf einen Blick, welche Dienste an einem einzelnen System hängen.',
        'Zu jedem System halten Sie fest, welcher Dienstleister es betreibt. So sehen Sie, welche Dienste von welchem Dienstleister abhängen.',
      ],
      result: 'ein Inventar mit Abhängigkeiten und Verantwortlichen, das als Grundlage für Gap-Analyse und Risiken dient.',
      refs: [
        'ISO/IEC 27001, Anhang A 5.9: Inventar der Informationen und anderer zugehöriger Werte',
        'BSIG § 30 Abs. 2 Nr. 9: Konzepte für die Sicherheit des Personals, die Zugriffskontrolle und die Verwaltung von IKT-Systemen, -Produkten und -Prozessen',
      ],
    },
    {
      slug: 'gap-analyse',
      img: 'gap',
      cycle: 'Plan',
      title: 'Gap-Analyse',
      sub: 'Was schon da ist und was fehlt.',
      lead: 'Jetzt gehen Sie die Anforderungen durch, Thema für Thema. Die Übersicht zeigt die größten Lücken zuerst, damit das Wichtigste nicht am Ende liegen bleibt.',
      why: 'Die Normen sind lang und überschneiden sich. Wer sie nebeneinander abarbeitet, beantwortet dieselbe Frage drei- oder viermal. In UniqSuite sind gleiche Anforderungen zu gemeinsamen Prüfpunkten zusammengefasst. Eine Antwort zählt in jedem Regelwerk, das denselben Punkt verlangt.',
      how: [
        'Sie sehen eine Anforderung pro Karte, in verständlicher Sprache und mit dem Bezug zur Norm.',
        'Sie antworten mit einem Klick: umgesetzt, teilweise umgesetzt oder nicht umgesetzt. Bei Bedarf hängen Sie einen Nachweis an.',
        'Ist eine Anforderung für Sie nicht anwendbar, schreiben Sie kurz, warum. Diese Begründung landet später in der Erklärung zur Anwendbarkeit.',
        'Wer tiefer gehen will, wechselt in die Detailansicht mit Reifegrad und Nachweisen.',
      ],
      tool: [
        'Gilt eine Antwort für mehrere Regelwerke, zählt immer die schwächste Umsetzung. So rechnet sich niemand den Stand schön.',
        'Der Umsetzungsstand je Regelwerk wird laufend berechnet. Sie sehen nach jeder Antwort, wo Sie stehen.',
      ],
      result: 'Ihren Umsetzungsstand je Regelwerk und eine Liste der offenen Lücken.',
      refs: [
        'ISO/IEC 27001, Anhang A: die 93 Maßnahmen, Grundlage der Erklärung zur Anwendbarkeit',
        'BSIG § 30 Abs. 2: die zehn Bereiche der Risikomanagementmaßnahmen',
        'Für AI Act, ISO/IEC 42001 und CRA gilt dasselbe Vorgehen mit den jeweiligen Katalogen.',
      ],
    },
    {
      slug: 'risiken',
      img: 'risk',
      cycle: 'Plan',
      title: 'Risiken',
      sub: 'Was passieren kann, und wie schlimm es wäre.',
      lead: 'Aus jeder Lücke wird ein Risiko. Sie bewerten, wie wahrscheinlich ein Schaden ist und wie schwer er wöge, und entscheiden, was Sie dagegen tun.',
      why: 'Nicht jede Lücke ist gleich gefährlich. Eine fehlende Richtlinie wiegt anders als ein ungeschützter Fernzugang. Die Risikoanalyse sorgt dafür, dass Sie Geld und Zeit dort einsetzen, wo es den größten Unterschied macht, und dass Sie diese Entscheidung begründen können.',
      how: [
        'UniqSuite schlägt zu jeder Lücke ein Risiko vor. Sie übernehmen es, passen es an oder ergänzen eigene Risiken.',
        'Sie bewerten Eintrittswahrscheinlichkeit und Auswirkung auf einer festen Skala.',
        'Für jedes Risiko wählen Sie eine Behandlung: reduzieren, vermeiden, übertragen oder bewusst tragen.',
      ],
      tool: [
        'Die Bewertung folgt festen Regeln. Zwei Personen, die gleich antworten, kommen zum gleichen Ergebnis.',
        'Den Risikobericht erstellen Sie auf Knopfdruck als PDF, Word oder Excel.',
      ],
      result: 'einen Risikobericht mit bewerteten Risiken und Ihre Entscheidung, wie Sie jedes Risiko behandeln.',
      refs: [
        'ISO/IEC 27001, Abschnitt 6.1.2: Informationssicherheitsrisikobeurteilung',
        'ISO/IEC 27001, Abschnitt 6.1.3: Informationssicherheitsrisikobehandlung',
        'BSIG § 30 Abs. 1 und Abs. 2 Nr. 1: Risikomanagementmaßnahmen und Konzepte zur Risikoanalyse',
      ],
    },
    {
      slug: 'umsetzung',
      img: 'plan',
      cycle: 'Do',
      title: 'Plan und Umsetzung',
      sub: 'Wer macht was bis wann.',
      lead: 'Aus den Risiken werden Aufgaben. Jede bekommt eine verantwortliche Person, eine Frist und einen Status, und genau so wird sie nachverfolgt.',
      why: 'Eine Analyse nützt wenig, wenn Maßnahmen in Protokollen stehen und niemand sie nachhält. Nach dem BSIG muss die Geschäftsleitung die Maßnahmen umsetzen und ihre Umsetzung überwachen. Dafür braucht sie eine Liste, die stimmt.',
      how: [
        'Sie legen zu jedem Risiko eine oder mehrere Maßnahmen an oder übernehmen die Vorschläge von UniqSuite.',
        'Sie vergeben Zuständige, Fristen und Prioritäten.',
        'Die Verantwortlichen aktualisieren den Status selbst. Nachweise hängen sie direkt an die Maßnahme.',
      ],
      tool: [
        'Was erledigt ist, erscheint sofort im Dashboard und in den Berichten. Niemand muss Folien nachpflegen.',
        'Die Erklärung zur Anwendbarkeit entsteht aus Ihren Antworten und Begründungen. Sie müssen sie nicht von Hand schreiben.',
      ],
      result: 'die Erklärung zur Anwendbarkeit, einen Umsetzungsbericht und einen Bericht für die Geschäftsleitung.',
      refs: [
        'ISO/IEC 27001, Abschnitt 6.1.3: Risikobehandlungsplan und Erklärung zur Anwendbarkeit',
        'ISO/IEC 27001, Abschnitt 8: Betrieb',
        'BSIG § 38 Abs. 1: Die Geschäftsleitung setzt die Risikomanagementmaßnahmen um und überwacht ihre Umsetzung',
      ],
    },
    {
      slug: 'audit',
      img: 'audit',
      cycle: 'Check · Act',
      title: 'Audit und Verbesserung',
      sub: 'Nachweisen und besser werden.',
      lead: 'Hier schließt sich der Kreis. Sie halten fest, was interne und externe Prüfungen gefunden haben, und verfolgen die Korrekturen bis zum Ende.',
      why: 'Ein Managementsystem lebt davon, dass es sich selbst überprüft. Prüfer schauen deshalb weniger darauf, ob alles perfekt ist, als darauf, ob Abweichungen erkannt und behoben werden. Wer das sauber dokumentiert, geht entspannter in jedes Audit.',
      how: [
        'Sie planen interne Audits und erfassen die Befunde, auch die aus externen Prüfungen.',
        'Zu jedem Befund legen Sie eine Korrekturmaßnahme mit Zuständigen und Frist an.',
        'Wenn alles nachgewiesen ist, starten Sie die nächste Runde mit dem aktuellen Stand als Ausgangspunkt.',
      ],
      tool: [
        'Befunde, Korrekturen und Nachweise liegen an einer Stelle. Der Prüfer bekommt einen Bericht statt eines Ordners.',
        'Ihr Verlauf bleibt erhalten. Sie sehen, wie sich der Stand von Runde zu Runde entwickelt.',
      ],
      result: 'einen Auditbericht mit Befunden, Korrekturmaßnahmen und deren Status.',
      refs: [
        'ISO/IEC 27001, Abschnitt 9.2 und 9.3: internes Audit und Managementbewertung',
        'ISO/IEC 27001, Abschnitt 10: fortlaufende Verbesserung, Nichtkonformität und Korrekturmaßnahmen',
        'BSIG § 30 Abs. 2 Nr. 6: Bewertung der Wirksamkeit der Maßnahmen',
      ],
    },
  ],
  en: [
    {
      slug: 'scope',
      img: 'scope',
      cycle: 'Plan',
      title: 'Set the scope',
      sub: 'Who you are and which frameworks you implement.',
      lead: 'Before anyone talks about measures, it has to be clear what you are actually responsible for.',
      why: 'Without a clear scope at the start, teams later argue about things nobody asked for. A clearly described scope saves those rounds, and it is the first thing an auditor asks for.',
      how: [
        'You enter your sector and size and choose the package, meaning the frameworks you want to implement. You can add the AI Act, ISO 42001 or the Cyber Resilience Act as needed.',
        'A short preliminary question settles whether special duties apply to you. Anything that does not apply is recorded as ‘not applicable’, with a reason.',
        'You add the people involved, such as management, the information security officer and the people responsible in each area, and assign roles.',
      ],
      tool: [
        'The questions come in a fixed order. You do not need to know which clause of the standard is meant.',
        'What you set here drives the following steps. The gap analysis then shows the requirements of the frameworks you selected.',
      ],
      result: 'a scope report you can present to management and use in the audit.',
      refs: [
        'ISO/IEC 27001, clause 4: context of the organisation, interested parties, scope',
        'ISO/IEC 27001, clause 5.3: roles and responsibilities',
        'German BSI Act (BSIG) section 28: classification as an essential or important entity',
        'BSIG section 33: registration duty',
      ],
    },
    {
      slug: 'inventory',
      img: 'inventory',
      cycle: 'Plan',
      title: 'Inventory',
      sub: 'What you need to protect.',
      lead: 'Protection starts with a list. Here you collect which services you provide and what they rely on.',
      why: 'You can only assess the risk to something you know about. If you know that payroll depends on a particular server and an external provider, you can ask what happens when one of them fails. Without an inventory, every risk analysis stays vague.',
      how: [
        'You create your most important services, meaning what your customers or citizens actually get from you.',
        'For each service you record the systems, applications, data and suppliers it depends on.',
        'For each entry you set how critical it is and who is responsible for it.',
      ],
      tool: [
        'UniqSuite shows the dependencies as an overview. You see at a glance which services hang on a single system.',
        'For each system you record which supplier runs it, so you can see which services depend on which supplier.',
      ],
      result: 'an inventory with dependencies and owners, the basis for the gap analysis and the risks.',
      refs: [
        'ISO/IEC 27001, Annex A 5.9: inventory of information and other associated assets',
        'BSIG section 30(2) no. 9: concepts for personnel security, access control and the management of ICT systems, products and processes',
      ],
    },
    {
      slug: 'gap-analysis',
      img: 'gap',
      cycle: 'Plan',
      title: 'Gap analysis',
      sub: 'What is already there and what is missing.',
      lead: 'Now you go through the requirements, topic by topic. The overview shows the biggest gaps first, so the important things are not left until the end.',
      why: 'The standards are long and they overlap. Working through them side by side means answering the same question three or four times. In UniqSuite, equivalent requirements are grouped into shared control points. One answer counts in every framework that asks for the same point.',
      how: [
        'You see one requirement per card, in plain language and with its reference to the standard.',
        'You answer with one click: implemented, partly implemented or not implemented. Where needed, you attach evidence.',
        'If a requirement does not apply to you, you write briefly why. That reason later goes into the Statement of Applicability.',
        'To go deeper, switch to the detail view with maturity level and evidence.',
      ],
      tool: [
        'If one answer covers several frameworks, the weakest implementation always counts. Nobody can talk the status up.',
        'The implementation status per framework is calculated as you go. After every answer you see where you stand.',
      ],
      result: 'your implementation status per framework and a list of open gaps.',
      refs: [
        'ISO/IEC 27001, Annex A: the 93 controls, the basis of the Statement of Applicability',
        'BSIG section 30(2): the ten areas of risk management measures',
        'For the AI Act, ISO/IEC 42001 and the CRA, the same approach applies with their own catalogues.',
      ],
    },
    {
      slug: 'risks',
      img: 'risk',
      cycle: 'Plan',
      title: 'Risks',
      sub: 'What could happen, and how bad it would be.',
      lead: 'Every gap becomes a risk. You assess how likely damage is and how serious it would be, and decide what to do about it.',
      why: 'Not every gap is equally dangerous. A missing policy weighs differently from unprotected remote access. The risk analysis makes sure you spend time and money where it makes the biggest difference, and that you can justify that decision.',
      how: [
        'UniqSuite suggests a risk for each gap. You accept it, adjust it or add your own.',
        'You rate likelihood and impact on a fixed scale.',
        'For each risk you choose a treatment: reduce, avoid, transfer or consciously accept.',
      ],
      tool: [
        'The assessment follows fixed rules. Two people who answer the same way reach the same result.',
        'You create the risk report at the push of a button as PDF, Word or Excel.',
      ],
      result: 'a risk report with assessed risks, and your decision on how to treat each one.',
      refs: [
        'ISO/IEC 27001, clause 6.1.2: information security risk assessment',
        'ISO/IEC 27001, clause 6.1.3: information security risk treatment',
        'BSIG section 30(1) and (2) no. 1: risk management measures and policies on risk analysis',
      ],
    },
    {
      slug: 'implementation',
      img: 'plan',
      cycle: 'Do',
      title: 'Plan and implementation',
      sub: 'Who does what by when.',
      lead: 'Risks turn into tasks. Each one gets an owner, a deadline and a status, and that is exactly how it is followed up.',
      why: 'An analysis helps little if measures sit in meeting notes and nobody follows them up. Under the BSIG, management has to implement the measures and oversee their implementation. For that it needs a list that is accurate.',
      how: [
        'For each risk you create one or more measures, or adopt the ones UniqSuite suggests.',
        'You assign owners, deadlines and priorities.',
        'The owners update the status themselves and attach evidence directly to the measure.',
      ],
      tool: [
        'Whatever is done shows up straight away in the dashboard and the reports. Nobody has to update slides.',
        'The Statement of Applicability is built from your answers and reasons. You do not have to write it by hand.',
      ],
      result: 'the Statement of Applicability, an implementation report and a report for management.',
      refs: [
        'ISO/IEC 27001, clause 6.1.3: risk treatment plan and Statement of Applicability',
        'ISO/IEC 27001, clause 8: operation',
        'BSIG section 38(1): management implements the risk management measures and oversees their implementation',
      ],
    },
    {
      slug: 'audit',
      img: 'audit',
      cycle: 'Check · Act',
      title: 'Audit and improvement',
      sub: 'Prove it, then get better.',
      lead: 'This is where the cycle closes. You record what internal and external audits found and follow the corrections through to the end.',
      why: 'A management system lives on checking itself. That is why auditors look less at whether everything is perfect and more at whether deviations are spotted and fixed. If you document that properly, every audit becomes more relaxed.',
      how: [
        'You plan internal audits and record the findings, including those from external audits.',
        'For each finding you create a corrective action with an owner and a deadline.',
        'Once everything is evidenced, you start the next round with the current status as the starting point.',
      ],
      tool: [
        'Findings, corrections and evidence sit in one place. The auditor gets a report instead of a folder.',
        'Your history is kept. You see how the status develops from round to round.',
      ],
      result: 'an audit report with findings, corrective actions and their status.',
      refs: [
        'ISO/IEC 27001, clauses 9.2 and 9.3: internal audit and management review',
        'ISO/IEC 27001, clause 10: continual improvement, nonconformity and corrective action',
        'BSIG section 30(2) no. 6: assessing the effectiveness of the measures',
      ],
    },
  ],
};

export const stepBase = { de: '/de/schritte/', en: '/en/steps/' } as const;
export const stepHref = (lang: 'de' | 'en', i: number) => `${stepBase[lang]}${steps[lang][i].slug}/`;
