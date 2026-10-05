/**
 * Berichte, die UniqSuite erzeugt (/de/berichte/…, /en/reports/…).
 * Inhalte geprüft am Code der Anwendung (web/src/lib/*Report*, soaGenerator, executionReportGenerator,
 * AuditWorkbench, ManagementSummaryCard). Nur Berichte, die in UniqSuite erreichbar sind.
 */
import type { Lang } from '../config';

export type RepKey = 'gap' | 'soa' | 'risk' | 'impl' | 'audit' | 'board';
export type Format = 'pdf' | 'word' | 'excel' | 'csv';
export type Report = {
  key: RepKey;
  step?: number; // Index in steps
  topic?: 'gap' | 'soa' | 'risk' | 'audit' | 'treat';
  feature?: number; // Index in features
  formats: Format[];
  name: string; // kurz (Karten, Navigation)
  title: string;
  sub: string;
  lead: string;
  what: string;
  chapters: { h: string; t: string }[];
  uses: string[];
  extra: { h: string; t: string };
  faq: { q: string; a: string }[];
};

export const reportOrder: RepKey[] = ['gap', 'soa', 'risk', 'impl', 'audit', 'board'];
const slugs: Record<Lang, Record<RepKey, string>> = {
  de: { gap: 'gap-analyse-bericht', soa: 'erklaerung-zur-anwendbarkeit-soa', risk: 'risikoanalyse-bericht', impl: 'umsetzungsbericht', audit: 'audit-bericht', board: 'vorstandsbericht' },
  en: { gap: 'gap-analysis-report', soa: 'statement-of-applicability-report', risk: 'risk-analysis-report', impl: 'implementation-report', audit: 'audit-report', board: 'board-report' },
};
export const reportHub = (lang: Lang) => (lang === 'de' ? '/de/berichte/' : '/en/reports/');
export const reportSlug = (lang: Lang, k: RepKey) => slugs[lang][k];
export const reportHref = (lang: Lang, k: RepKey) => `${reportHub(lang)}${slugs[lang][k]}/`;
export const formatLabel: Record<Format, string> = { pdf: 'PDF', word: 'Word', excel: 'Excel', csv: 'CSV' };

/** Texte für den Abschnitt auf der Startseite und die Übersichtsseite */
export const reportsUi = {
  de: {
    kicker: 'Berichte',
    h2a: 'Sechs Berichte,',
    h2b: 'auf Knopfdruck.',
    intro: 'Gap-Analyse, Erklärung zur Anwendbarkeit, Risikoanalyse, Umsetzung, Audit und Vorstandsbericht entstehen aus den Daten, die Sie in UniqSuite ohnehin pflegen. Mit Ihrem Firmennamen, je nach Bericht als PDF, Word, Excel oder CSV. Gap-Analyse-, Risiko-, Audit- und Vorstandsbericht zeigen im PDF auch Ihr Logo.',
    hint: 'Klicken Sie auf einen Bericht und sehen Sie, was drinsteht.',
    open: 'Bericht ansehen',
    all: 'Alle Berichte',
    sample: 'Beispielwerte',
    company: 'Muster GmbH',
  },
  en: {
    kicker: 'Reports',
    h2a: 'Six reports,',
    h2b: 'at the push of a button.',
    intro: 'Gap analysis, Statement of Applicability, risk analysis, implementation, audit and board report are built from the data you already keep in UniqSuite. With your company name, in the PDF also with your logo, as PDF, Word or Excel depending on the report.',
    hint: 'Click a report to see what is inside.',
    open: 'View report',
    all: 'All reports',
    sample: 'Sample values',
    company: 'Sample Ltd',
  },
} as const;

export const reports: Record<Lang, Report[]> = {
  de: [
    {
      key: 'gap', step: 2, topic: 'gap', formats: ['pdf', 'word', 'excel'],
      name: 'Gap-Analyse',
      title: 'Gap-Analyse-Bericht', sub: 'Wo Sie stehen, je Regelwerk.',
      lead: 'Der Gap-Analyse-Bericht zeigt, wie weit Ihr Unternehmen die Anforderungen von NIS2, ISO/IEC 27001, AI Act, ISO/IEC 42001 und Cyber Resilience Act erfüllt. Mit kritischen Lücken, einer Rangfolge und einem Zeitplan für die nächsten Schritte.',
      what: 'Sie wählen beim Erstellen, welche Regelwerke in den Bericht gehören, wer ihn verantwortet und welche Vertraulichkeitsstufe er trägt. Der Bericht beginnt mit einer gemeinsamen Zusammenfassung über alle Regelwerke und widmet danach jedem Regelwerk ein eigenes Kapitel. Wo eine Kontrolle mehrere Regelwerke abdeckt, steht im Bericht, aus welcher Anforderung sie übernommen wurde.',
      chapters: [
        { h: 'Deckblatt', t: 'Firmenname (im PDF mit Logo), Verfasser und Datum. Die Vertraulichkeitsstufe (öffentlich, intern, vertraulich, streng vertraulich) steht auf Wunsch als Vermerk in der Fußzeile.' },
        { h: 'Zusammenfassung', t: 'Regelwerke im Umfang, Kontrollen gesamt, Gesamt-Compliance und kritische MUSS-Lücken. Dazu das Compliance-Profil als Netzdiagramm, die Statusverteilung und eine Tabelle je Regelwerk.' },
        { h: 'Kritikalität', t: 'Kritische Dienste, hochkritische Assets und Single Points of Failure aus Ihrem Inventar, damit die Lücken im richtigen Licht stehen.' },
        { h: 'Management-Zusammenfassung', t: 'Der Stand in ganzen Sätzen, nach festen Regeln aus Ihren Antworten erzeugt.' },
        { h: 'Rangfolge Top 20', t: 'Die zwanzig wichtigsten Lücken, gewichtet nach der Kritikalität der betroffenen Dienste.' },
        { h: 'Zeitplan', t: 'Nächste Schritte in vier Zeitfenstern: sofort (0–30 Tage), kurzfristig (30–90), mittelfristig (90–180) und langfristig (über 180 Tage), jeweils mit Gesetzesbezug und Empfehlung.' },
        { h: 'Kapitel je Regelwerk', t: 'Offene Punkte nach Bereichen: Anforderung, MUSS-Kennzeichen, Status, Artikelbezug, Empfehlung und Ihre Notiz.' },
        { h: 'Legende und Begriffe', t: 'Damit auch Leser ohne Vorwissen den Bericht verstehen.' },
      ],
      uses: ['Den Stand an die Geschäftsleitung berichten', 'Budget und Reihenfolge der Maßnahmen begründen', 'Ausgangspunkt für Risikoanalyse und Maßnahmenplan', 'Mehrere Regelwerke in einem Dokument vergleichen'],
      extra: { h: 'In Excel weiterarbeiten', t: 'Die Excel-Fassung enthält je Regelwerk ein Tabellenblatt mit allen Anforderungen: Bereich, Status, Reifegrad, Verankerung, Empfehlung, Herkunft und Notiz. Mit Filter, bereit für die eigene Auswertung.' },
      faq: [
        { q: 'Kann ein Bericht mehrere Regelwerke enthalten?', a: 'Ja. Sie wählen die Regelwerke beim Erstellen aus. Der Bericht enthält eine gemeinsame Zusammenfassung und für jedes Regelwerk ein eigenes Kapitel.' },
        { q: 'In welchen Formaten gibt es den Gap-Analyse-Bericht?', a: 'Als PDF, als Word-Dokument und als Excel-Datei. Alle drei tragen Ihren Firmennamen, das PDF zeigt zusätzlich Ihr Logo auf dem Deckblatt.' },
        { q: 'Woher kommen die Empfehlungen im Bericht?', a: 'Jede Anforderung ist einem Themenfeld zugeordnet, etwa Risikomanagement oder Lieferantensicherheit, und zu jedem Themenfeld ist eine Empfehlung hinterlegt. Die Zusammenfassung in Worten entsteht nach festen Regeln aus Ihren Antworten, sodass zwei gleiche Stände zum gleichen Text führen.' },
        { q: 'In welcher Sprache entsteht der Bericht?', a: 'In der Sprache, in der Sie UniqSuite gerade nutzen: Deutsch oder Englisch. Für die andere Sprache stellen Sie die Oberfläche um und erzeugen den Bericht neu.' },
        { q: 'Welche Daten fließen in den Bericht ein?', a: 'Ihre Antworten aus der Gap-Analyse, also derselbe Stand, den Sie am Bildschirm sehen. Dazu Dienste, Assets und Abhängigkeiten aus Ihrem Inventar, nach deren Kritikalität die Rangfolge gewichtet wird.' },
      ],
    },
    {
      key: 'soa', step: 4, topic: 'soa', formats: ['pdf', 'word', 'excel'],
      name: 'Anwendbarkeit (SoA)',
      title: 'Erklärung zur Anwendbarkeit', sub: 'Jede Maßnahme mit Begründung.',
      lead: 'Die Erklärung zur Anwendbarkeit (Statement of Applicability, SoA) listet jede Maßnahme mit Anwendbarkeit, Begründung und Umsetzungsstand, so wie ISO/IEC 27001 Abschnitt 6.1.3 d) es verlangt. UniqSuite erzeugt sie aus Ihren Antworten.',
      what: 'Die SoA entsteht für Ihr führendes Regelwerk. Bei ISO/IEC 27001 ist sie die Erklärung zur Anwendbarkeit im Sinne von Abschnitt 6.1.3 d). Auch ISO/IEC 42001 verlangt in Abschnitt 6.1.3 eine Erklärung zur Anwendbarkeit; dafür liefert UniqSuite den Kontrollkatalog in derselben Form, ebenso für NIS2, AI Act und Cyber Resilience Act. Maßnahmen, die Sie in der Risikobehandlung ergänzt haben, und abgelehnte Maßnahmen stehen in eigenen Abschnitten. Bevor die Datei entsteht, prüft UniqSuite, dass Übersicht und Tabellen dieselben Zahlen zeigen.',
      chapters: [
        { h: 'Kopf', t: 'Firmenname, Titel und Datum, beim AI Act zusätzlich der Rechtsstand.' },
        { h: 'Übersicht', t: 'Gesamt, anwendbar, umgesetzt, teilweise, nicht umgesetzt, nicht bewertet, gilt später, nicht anwendbar und ausgeschlossen, mit einer kurzen Erklärung jeder Stufe.' },
        { h: 'Tabellen je Kategorie', t: 'ID, Maßnahme, Anwendbarkeit, Status und Begründung. Unter jeder Maßnahme Verantwortlicher, Rolle und, falls zutreffend, der Tag, ab dem sie gilt.' },
        { h: 'Fehlende Begründungen', t: 'Steht bei einer Maßnahme noch keine Begründung, markiert die SoA das in Rot: „Begründung fehlt – vor Freigabe ergänzen“.' },
        { h: 'Ergänzte Maßnahmen', t: 'Maßnahmen, die Sie aus der Risikobehandlung hinzugefügt haben.' },
        { h: 'Abgelehnte Maßnahmen', t: 'Mit dem Grund der Ablehnung, nachvollziehbar für jeden Prüfer.' },
        { h: 'KI-Systeme (AI Act)', t: 'Bei registrierten KI-Systemen eine Matrix aus System, Rolle und Kontrolle mit Verantwortlichen, Freigabe und Nachweisen.' },
      ],
      uses: ['Pflichtdokument im Zertifizierungsaudit nach ISO/IEC 27001', 'Nachweis, welche NIS2-Maßnahmen Sie warum umsetzen', 'Brücke zwischen Risikobehandlung und Umsetzung', 'Grundlage für die Freigabe durch die Leitung'],
      extra: { h: 'Versionen freigeben', t: 'In UniqSuite geben Sie Stände der SoA als Version frei. Jede Version hält fest, wer freigegeben hat, wann, und für jede Maßnahme Anwendbarkeit und Begründung.' },
      faq: [
        { q: 'Für welches Regelwerk wird die SoA erstellt?', a: 'Für Ihr führendes Regelwerk. Bei ISO/IEC 27001 als Erklärung zur Anwendbarkeit nach Abschnitt 6.1.3 d). ISO/IEC 42001 verlangt in Abschnitt 6.1.3 ebenfalls eine Erklärung zur Anwendbarkeit; dafür, wie für NIS2, AI Act und Cyber Resilience Act, erstellt UniqSuite den Kontrollkatalog in derselben Form.' },
        { q: 'Was passiert, wenn eine Begründung fehlt?', a: 'Stufen Sie eine Maßnahme als nicht anwendbar ein, ohne sie zu begründen, markiert die SoA das in Rot: „Begründung fehlt – vor Freigabe ergänzen“. So sehen Sie vor dem Audit, wo noch etwas zu tun ist.' },
        { q: 'Kann ich die SoA nachbearbeiten?', a: 'Ja. Neben dem PDF gibt es eine Word-Datei und eine Excel-Datei mit allen Maßnahmen, Begründungen, Verantwortlichen und Rechtsgrundlagen.' },
        { q: 'Wann kann ich eine Version der SoA freigeben?', a: 'Sobald jede als nicht anwendbar eingestufte Maßnahme eine Begründung hat. Die Version erhält eine fortlaufende Nummer und hält Datum, freigebende Person und eine optionale Notiz fest.' },
        { q: 'Woraus setzt sich die SoA zusammen?', a: 'Den Umsetzungsstand liefert Ihre Gap-Analyse, Verantwortliche und Fristen kommen aus der Risikobehandlung. Die Anwendbarkeit schlägt UniqSuite aus Ihren Antworten vor, Ihre eigene Entscheidung und Begründung haben Vorrang.' },
      ],
    },
    {
      key: 'risk', step: 3, topic: 'risk', formats: ['pdf', 'word', 'excel'],
      name: 'Risikoanalyse',
      title: 'Risikoanalyse-Bericht', sub: 'Risiken, Matrix und Sofortmaßnahmen.',
      lead: 'Der Risikoanalyse-Bericht zeigt Ihre Risiken in einer Risikomatrix, die zehn wichtigsten im Detail und die nächsten Schritte mit vorgeschlagener Rolle und Zieltermin. Die Risiken gehen direkt aus Ihrer Gap-Analyse hervor.',
      what: 'Offene Anforderungen aus der Gap-Analyse werden zu Risiken, bewertet nach Eintrittswahrscheinlichkeit und Auswirkung. Der Bericht ordnet sie in die Risikomatrix ein, zeigt die Grenze Ihres Risikoappetits und erklärt für die wichtigsten Risiken, warum sie kritisch sind und was sofort zu tun ist. Wo Sie Restrisiken berechnet haben, steht neben dem inhärenten Risiko auch das Restrisiko.',
      chapters: [
        { h: 'Deckblatt', t: 'Firmenname (im PDF mit Logo), Verfasser, Datum und Zahl der Risiken. Die Vertraulichkeitsstufe steht auf Wunsch als Vermerk in der Fußzeile.' },
        { h: 'Zusammenfassung', t: 'Risiken gesamt, kritisch, hoch, mittel und niedrig, der durchschnittliche Score und der Stand in Worten.' },
        { h: 'Risikomatrix', t: 'Heatmap aus Eintrittswahrscheinlichkeit und Auswirkung, mit der Zahl der Risiken je Feld und der Grenze des Risikoappetits als gestrichelte Linie.' },
        { h: 'Top-10-Risiken', t: 'Stufe, Score, Geltungsbereich, betroffener Dienst, inhärent und residual, warum kritisch, Auswirkung aufs Geschäft und Sofortmaßnahme.' },
        { h: 'Zeitplan', t: 'Nächste Schritte in vier Zeitfenstern, jeweils mit vorgeschlagener Rolle und Zieltermin.' },
        { h: 'Legende und Begriffe', t: 'Stufen, Score und Fachbegriffe kurz erklärt.' },
      ],
      uses: ['Risikobeurteilung nach ISO/IEC 27001 Abschnitt 6.1.2 dokumentieren', 'Risikomanagement nach NIS2 nachweisen', 'Der Leitung die Risiken verständlich vorlegen', 'Prioritäten für die Risikobehandlung setzen'],
      extra: { h: 'In Excel weiterarbeiten', t: 'Die Excel-Fassung enthält alle Risiken mit Eintrittswahrscheinlichkeit × Auswirkung, Scope, Asset und Dienst, dazu die Heatmap und den Zeitplan als eigene Blätter.' },
      faq: [
        { q: 'Woher kommen die Risiken im Bericht?', a: 'Aus Ihrer Gap-Analyse. Offene Anforderungen werden zu Risiken und nach Eintrittswahrscheinlichkeit und Auswirkung bewertet. So passen Gap-Analyse und Risikoanalyse immer zusammen.' },
        { q: 'Zeigt der Bericht auch Restrisiken?', a: 'Ja, sobald Sie Restrisiken berechnet haben. Die Top-10-Risiken zeigen dann das inhärente und das residuale Risiko nebeneinander.' },
        { q: 'Wie groß ist die Risikomatrix?', a: 'Standardmäßig 5 × 5. Die Matrix im Bericht folgt der Einstellung in UniqSuite.' },
        { q: 'Kann ich eigene Risiken ergänzen?', a: 'Ja. Sie übernehmen typische Risiken aus dem Katalog oder formulieren eigene. Sie stehen im Bericht neben den Risiken aus der Gap-Analyse.' },
        { q: 'Kann ich die Bewertung eines Risikos ändern?', a: 'Ja. Sie passen Eintrittswahrscheinlichkeit und Auswirkung je Risiko an und geben dazu eine Begründung an. Der Bericht übernimmt die angepassten Werte.' },
      ],
    },
    {
      key: 'impl', step: 4, topic: 'treat', formats: ['pdf', 'word', 'excel'],
      name: 'Umsetzung',
      title: 'Umsetzungsbericht', sub: 'Was fertig ist, was läuft, was fehlt.',
      lead: 'Der Umsetzungsbericht zeigt, wie weit Ihre Maßnahmen sind: fertig, laufend, offen, überfällig. Und er zeigt, was als fertig gemeldet ist, aber noch keinen Nachweis hat.',
      what: 'Der Bericht zählt auf zwei Wegen: nach Aufgaben und nach Kontrollen. So sehen Sie den Fortschritt so, wie Ihr Team arbeitet, und so, wie ein Prüfer fragt. Ist NIS2 aktiv, zeigt er den Fortschritt zusätzlich nach den zehn Bereichen aus Artikel 21 Absatz 2. Für die Planung gibt es daneben den Roadmap-Bericht mit Phasen, Bündeln und Ressourcen.',
      chapters: [
        { h: 'Kennzahlen', t: 'Umsetzung in Prozent, fertig, laufend, offen, kritisch, Quick Wins und überfällig.' },
        { h: 'Über diesen Bericht', t: 'Woher die Zahlen kommen und wie sie entstehen.' },
        { h: 'Kontrollumfang', t: 'Zwei Zählbasen, Aufgaben und Kontrollen, mit Umsetzungsgrad und dem Wert „fertig ohne Nachweis“.' },
        { h: 'Fortschritt nach Fähigkeiten', t: 'Wo Ihre Organisation schon stark ist und wo noch nicht.' },
        { h: 'Fortschritt nach NIS2 Art. 21 Abs. 2', t: 'Die zehn Mindestmaßnahmen einzeln, wenn NIS2 aktiv ist.' },
        { h: 'Erkenntnisse und Notizen', t: 'Auffälligkeiten im Fortschritt und Ihre eigenen Anmerkungen.' },
        { h: 'Maßnahmentabelle', t: 'ID, Kontrolle, Priorität, Verantwortlich, fällig, Status und Risiko.' },
      ],
      uses: ['Fortschritt im Projekt-Jour-fixe zeigen', 'Überfällige Maßnahmen früh erkennen', 'Nachweise vor dem Audit vervollständigen', 'Der Leitung die Umsetzung belegen'],
      extra: { h: 'Roadmap-Bericht dazu', t: 'Für die Planung erzeugt UniqSuite den Roadmap-Bericht „Jetzt / Nächste / Später“ mit Phasenübersicht, Bündeln, Ressourcen je Verantwortlichem und Maßnahmenregister, als PDF, Word oder Excel.' },
      faq: [
        { q: 'Was bedeutet „fertig ohne Nachweis“?', a: 'Maßnahmen, die als erledigt markiert sind, für die aber noch kein Nachweis hinterlegt ist. Der Bericht zeigt sie, damit Sie sie vor dem Audit schließen.' },
        { q: 'Warum zählt der Bericht doppelt?', a: 'Eine Aufgabe kann mehrere Kontrollen erfüllen und eine Kontrolle mehrere Aufgaben brauchen. Beide Sichten zusammen geben ein ehrliches Bild.' },
        { q: 'In welchen Formaten gibt es den Umsetzungsbericht?', a: 'Als PDF, Word und Excel. Die Excel-Datei enthält Kennzahlen und alle Maßnahmen mit Filter.' },
        { q: 'Woraus entsteht der Umsetzungsbericht?', a: 'Aus den anwendbaren Kontrollen Ihrer Erklärung zur Anwendbarkeit, aus der Risikobehandlung und aus der Reifegrad-Baseline. Jede Kontrolle wird zu einer Maßnahme mit Status, Verantwortlichem, Fälligkeit und Priorität.' },
        { q: 'Wann gilt eine Maßnahme als überfällig?', a: 'Wenn ihr Fälligkeitsdatum verstrichen ist und die Kontrolle noch nicht als umgesetzt gilt. Die Kennzahlen weisen diese Maßnahmen gesondert aus.' },
      ],
    },
    {
      key: 'audit', step: 5, topic: 'audit', formats: ['pdf', 'word', 'csv'],
      name: 'Audit',
      title: 'Audit-Bericht', sub: 'Feststellungen, Maßnahmen, Freigabe.',
      lead: 'Der Audit-Bericht hält Rahmen, Feststellungen und Korrekturmaßnahmen eines Audits fest. Mit Bewertung nach Major, Minor und Verbesserungspotenzial und mit Unterschriftenzeilen für Auditor und Leitung.',
      what: 'Ob internes Audit, externes Audit, Lieferantenaudit oder Zertifizierungsaudit: Der Bericht folgt immer derselben Ordnung. UniqSuite schlägt für jeden Befund eine Bewertung vor, die Entscheidung trifft der Auditor. Jeder Befund kann mit Risiken, Korrekturmaßnahmen, Verantwortlichen, Fristen und Nachweisen verknüpft sein. Frühere Audits stehen als Historie im Bericht.',
      chapters: [
        { h: 'Audit-Rahmen', t: 'Audit, Auditor, Datum, Gesamturteil, geprüfte Regelwerke und Grundlage.' },
        { h: 'Ergebnis auf einen Blick', t: 'Befunde gesamt, Major, Minor, Beobachtungen (OFI) und erledigte Punkte.' },
        { h: 'Feststellungen', t: 'Regelwerk und Kontrolle, Anforderung, Status, Befund, verknüpfte Risiken, Maßnahmen und Nachweis.' },
        { h: 'Prüfliste', t: 'Weitere offene Punkte mit dem vorgeschlagenen Schweregrad.' },
        { h: 'Methodik und Bewertungsskala', t: 'Major und Minor wie in Zertifizierungsaudits nach ISO/IEC 17021-1, dazu Beobachtungen (Verbesserungspotenzial, OFI).' },
        { h: 'Historie', t: 'Frühere Audits mit Datum, Typ, Urteil und Zahl der Befunde.' },
        { h: 'Freigabe', t: 'Unterschriftenzeilen für Auditor und Leitung oder Auftraggeber, jeweils mit Datum.' },
      ],
      uses: ['Internes Audit nach ISO/IEC 27001 Abschnitt 9.2 dokumentieren', 'Lieferanten prüfen und das Ergebnis festhalten', 'Korrekturmaßnahmen bis zum Abschluss verfolgen', 'Vorbereitung auf das Zertifizierungsaudit'],
      extra: { h: 'Befunde als Tabelle', t: 'Alle Befunde lassen sich zusätzlich als CSV-Datei ausgeben, etwa für eine eigene Maßnahmenliste.' },
      faq: [
        { q: 'Wer entscheidet, ob ein Befund Major oder Minor ist?', a: 'UniqSuite schlägt eine Bewertung vor, der Auditor entscheidet. Die Skala ist im Bericht erklärt.' },
        { q: 'Welche Audits lassen sich abbilden?', a: 'Interne und externe Audits, Lieferantenaudits und Zertifizierungsaudits.' },
        { q: 'Kann der Bericht unterschrieben werden?', a: 'Ja. Der Bericht endet mit Unterschriftenzeilen für den Auditor und für die Leitung oder den Auftraggeber.' },
        { q: 'Woher kommen die Befunde?', a: 'Aus Ihrer Gap-Analyse. Auf Knopfdruck lädt UniqSuite die nicht oder teilweise umgesetzten Anforderungen der Regelwerke, die zum Audit gehören.' },
        { q: 'Wie hängen Audit und Umsetzung zusammen?', a: 'Korrekturmaßnahmen aus einem Befund übergeben Sie mit Verantwortlichem und Frist an die Umsetzung. Ist die Maßnahme dort erledigt, gilt auch der Befund als erledigt.' },
      ],
    },
    {
      key: 'board', feature: 0, formats: ['pdf'],
      name: 'Vorstandsbericht',
      title: 'Vorstandsbericht', sub: 'Die Sicherheitslage auf einen Blick.',
      lead: 'Der Vorstandsbericht fasst die Sicherheitslage kompakt zusammen: eine Kennzahl von 0 bis 100, was jetzt zu tun ist, welche Fristen überfällig sind und wie weit jedes Regelwerk umgesetzt ist.',
      what: 'Nach § 38 Abs. 1 BSIG muss die Geschäftsleitung besonders wichtiger und wichtiger Einrichtungen die Maßnahmen zum Risikomanagement umsetzen und ihre Umsetzung überwachen. Dafür braucht sie keinen langen Bericht, sondern einen klaren Überblick. Den liefert der Vorstandsbericht, jederzeit auf Knopfdruck und immer mit dem aktuellen Stand.',
      chapters: [
        { h: 'Sicherheitslage', t: 'Ein Wert von 0 bis 100 mit Ampel, die Zahl der offenen kritischen MUSS-Anforderungen und das Datum.' },
        { h: 'Handlungsbedarf', t: 'Was als Nächstes entschieden oder angestoßen werden muss.' },
        { h: 'Überfällige Fristen', t: 'Termine, die überschritten sind.' },
        { h: 'Compliance je Regelwerk', t: 'Konformität, offene kritische MUSS-Anforderungen und Anforderungen, die erst später gelten.' },
        { h: 'Legende', t: 'Die Begriffe des Berichts kurz erklärt.' },
      ],
      uses: ['Vorstand, Geschäftsführung oder Aufsichtsrat informieren', 'Überwachung nach § 38 BSIG belegen', 'Entscheidungen über Budget und Prioritäten vorbereiten', 'Stand vor Sitzungen in Minuten aktualisieren'],
      extra: { h: 'Immer aktuell', t: 'Der Bericht entsteht aus dem Dashboard. Was sich in UniqSuite ändert, steht beim nächsten Klick im Bericht.' },
      faq: [
        { q: 'Für wen ist der Vorstandsbericht gedacht?', a: 'Für Geschäftsführung, Vorstand und Aufsichtsrat. Er zeigt kompakt, wo die Organisation steht und was zu entscheiden ist.' },
        { q: 'Wie oft sollte er erstellt werden?', a: 'So oft Sie ihn brauchen. Er entsteht auf Knopfdruck aus dem aktuellen Stand, etwa vor jeder Sitzung der Geschäftsleitung.' },
        { q: 'In welchem Format gibt es den Vorstandsbericht?', a: 'Als PDF, mit Ihrem Firmennamen und Logo.' },
        { q: 'Wie entsteht die Kennzahl von 0 bis 100?', a: 'Umgesetzte Anforderungen zählen voll, teilweise umgesetzte zur Hälfte, bezogen auf alle anwendbaren Anforderungen. Anders als im Gap-Analyse-Bericht zählt hier auch die dokumentierte Umsetzung mit, wie im Dashboard.' },
        { q: 'Was bedeutet die Ampel?', a: 'Ab 80 steht sie auf Grün („gut aufgestellt“), ab 50 auf Gelb („auf gutem Weg“), darunter auf Rot („erhöhter Handlungsbedarf“).' },
      ],
    },
  ],
  en: [
    {
      key: 'gap', step: 2, topic: 'gap', formats: ['pdf', 'word', 'excel'],
      name: 'Gap analysis',
      title: 'Gap analysis report', sub: 'Where you stand, per framework.',
      lead: 'The gap analysis report shows how far your organisation meets the requirements of NIS2, ISO/IEC 27001, the AI Act, ISO/IEC 42001 and the Cyber Resilience Act. With critical gaps, a ranking and a timeline for the next steps.',
      what: 'When you create the report, you choose which frameworks it covers, who prepared it and its confidentiality level. It opens with a joint summary across all frameworks and then gives each framework its own chapter. Where one control covers several frameworks, the report shows which requirement it was carried over from.',
      chapters: [
        { h: 'Cover page', t: 'Company name (with logo in the PDF), author and date. If you choose one, the confidentiality level (public, internal, confidential, strictly confidential) appears as a note in the footer.' },
        { h: 'Executive summary', t: 'Frameworks in scope, total controls, overall compliance and critical MUST gaps. Plus the compliance profile as a radar chart, the status distribution and a table per framework.' },
        { h: 'Criticality', t: 'Critical services, highly critical assets and single points of failure from your inventory, so the gaps are seen in context.' },
        { h: 'Management narrative', t: 'Your status in plain sentences, generated from your answers by fixed rules.' },
        { h: 'Top 20 ranking', t: 'The twenty most important gaps, weighted by the criticality of the services affected.' },
        { h: 'Timeline', t: 'Next steps in four time windows: immediate (0–30 days), short term (30–90), medium term (90–180) and long term (over 180 days), each with legal reference and recommendation.' },
        { h: 'One chapter per framework', t: 'Open items by area: requirement, MUST flag, status, article reference, recommendation and your note.' },
        { h: 'Legend and terms', t: 'So that readers without background knowledge can follow the report.' },
      ],
      uses: ['Report your status to management', 'Justify budget and the order of measures', 'Starting point for risk analysis and the action plan', 'Compare several frameworks in one document'],
      extra: { h: 'Keep working in Excel', t: 'The Excel version has one sheet per framework with every requirement: area, status, maturity, legal anchor, recommendation, origin and note. Filter-ready for your own analysis.' },
      faq: [
        { q: 'Can one report cover several frameworks?', a: 'Yes. You choose the frameworks when you create the report. It contains a joint summary and a separate chapter for each framework.' },
        { q: 'Which formats does the gap analysis report come in?', a: 'PDF, Word and Excel. All three carry your company name; the PDF also shows your logo on the cover page.' },
        { q: 'Where do the recommendations come from?', a: 'Every requirement is assigned to a topic area, such as risk management or supplier security, and each topic area has a recommendation. The written summary is generated from your answers by fixed rules, so the same status always produces the same text.' },
        { q: 'Which language is the report in?', a: 'The language you are currently using UniqSuite in: German or English. For the other language, switch the interface and create the report again.' },
        { q: 'Which data goes into the report?', a: 'Your answers from the gap analysis, the same status you see on screen. Plus services, assets and dependencies from your inventory, whose criticality weights the ranking.' },
      ],
    },
    {
      key: 'soa', step: 4, topic: 'soa', formats: ['pdf', 'word', 'excel'],
      name: 'Applicability (SoA)',
      title: 'Statement of Applicability', sub: 'Every control with its justification.',
      lead: 'The Statement of Applicability (SoA) lists every control with its applicability, justification and implementation status, as ISO/IEC 27001 clause 6.1.3 d) requires. UniqSuite builds it from your answers.',
      what: 'The SoA is created for your lead framework. For ISO/IEC 27001 it is the Statement of Applicability in the sense of clause 6.1.3 d). ISO/IEC 42001 also requires a Statement of Applicability in clause 6.1.3; for it, as for NIS2, the AI Act and the Cyber Resilience Act, UniqSuite provides the control catalogue in the same form. Controls you added during risk treatment and rejected controls have their own sections. Before the file is created, UniqSuite checks that the overview and the tables show the same numbers.',
      chapters: [
        { h: 'Header', t: 'Company name, title and date; for the AI Act also the legal baseline.' },
        { h: 'Overview', t: 'Total, applicable, implemented, partial, not implemented, not assessed, applies later, not applicable and excluded, with a short explanation of each status.' },
        { h: 'Tables per category', t: 'ID, control, applicability, status and justification. Below each control: owner, role and, where relevant, the date from which it applies.' },
        { h: 'Missing justifications', t: 'If a control has no justification yet, the SoA marks it in red: “Justification missing – add before approval”.' },
        { h: 'Added controls', t: 'Controls you added from risk treatment.' },
        { h: 'Rejected controls', t: 'With the reason for rejection, traceable for any auditor.' },
        { h: 'AI systems (AI Act)', t: 'For registered AI systems, a matrix of system, role and control with owners, approval and evidence.' },
      ],
      uses: ['Mandatory document in the ISO/IEC 27001 certification audit', 'Evidence of which NIS2 measures you implement and why', 'Link between risk treatment and implementation', 'Basis for approval by management'],
      extra: { h: 'Approve versions', t: 'In UniqSuite you approve states of the SoA as versions. Each version records who approved it, when, and the applicability and justification of every control.' },
      faq: [
        { q: 'Which framework is the SoA created for?', a: 'For your lead framework. For ISO/IEC 27001 as the Statement of Applicability under clause 6.1.3 d). ISO/IEC 42001 also requires a Statement of Applicability in clause 6.1.3; for it, as for NIS2, the AI Act and the Cyber Resilience Act, UniqSuite creates the control catalogue in the same form.' },
        { q: 'What happens if a justification is missing?', a: 'If you mark a control as not applicable without a justification, the SoA flags it in red: “Justification missing – add before approval”. You see before the audit where work is left.' },
        { q: 'Can I edit the SoA afterwards?', a: 'Yes. Besides the PDF there is a Word file and an Excel file with every control, justification, owner and legal basis.' },
        { q: 'When can I approve a version of the SoA?', a: 'As soon as every control marked as not applicable has a justification. The version gets a sequential number and records the date, the approver and an optional note.' },
        { q: 'What is the SoA built from?', a: 'The implementation status comes from your gap analysis; owners and due dates come from risk treatment. UniqSuite suggests applicability from your answers, and your own decision and justification take precedence.' },
      ],
    },
    {
      key: 'risk', step: 3, topic: 'risk', formats: ['pdf', 'word', 'excel'],
      name: 'Risk analysis',
      title: 'Risk analysis report', sub: 'Risks, matrix and immediate actions.',
      lead: 'The risk analysis report shows your risks in a risk matrix, the ten most important in detail and the next steps with a suggested role and target date. The risks come straight from your gap analysis.',
      what: 'Open requirements from the gap analysis become risks, rated by likelihood and impact. The report places them in the risk matrix, shows the boundary of your risk appetite and explains for the most important risks why they are critical and what to do now. Where you have calculated residual risk, it appears next to the inherent risk.',
      chapters: [
        { h: 'Cover page', t: 'Company name (with logo in the PDF), author, date and number of risks. If you choose one, the confidentiality level appears as a note in the footer.' },
        { h: 'Executive summary', t: 'Total risks, critical, high, medium and low, the average score and the status in words.' },
        { h: 'Risk matrix', t: 'Heatmap of likelihood and impact, with the number of risks per cell and your risk appetite boundary as a dashed line.' },
        { h: 'Top 10 risks', t: 'Level, score, scope, affected service, inherent and residual, why critical, business impact and immediate action.' },
        { h: 'Timeline', t: 'Next steps in four time windows, each with a suggested role and target date.' },
        { h: 'Legend and terms', t: 'Levels, score and technical terms briefly explained.' },
      ],
      uses: ['Document the risk assessment under ISO/IEC 27001 clause 6.1.2', 'Evidence risk management under NIS2', 'Present the risks to management in plain terms', 'Set priorities for risk treatment'],
      extra: { h: 'Keep working in Excel', t: 'The Excel version lists every risk with likelihood × impact, scope, asset and service, plus the heatmap and the timeline as separate sheets.' },
      faq: [
        { q: 'Where do the risks in the report come from?', a: 'From your gap analysis. Open requirements become risks and are rated by likelihood and impact, so gap analysis and risk analysis always match.' },
        { q: 'Does the report show residual risk?', a: 'Yes, once you have calculated residual risk. The top 10 risks then show inherent and residual risk side by side.' },
        { q: 'How large is the risk matrix?', a: '5 × 5 by default. The matrix in the report follows the setting in UniqSuite.' },
        { q: 'Can I add my own risks?', a: 'Yes. You can adopt typical risks from the catalogue or write your own. They appear in the report alongside the risks from the gap analysis.' },
        { q: 'Can I change how a risk is rated?', a: 'Yes. You can adjust likelihood and impact for each risk and give a reason. The report uses the adjusted values.' },
      ],
    },
    {
      key: 'impl', step: 4, topic: 'treat', formats: ['pdf', 'word', 'excel'],
      name: 'Implementation',
      title: 'Implementation report', sub: 'What is done, running and missing.',
      lead: 'The implementation report shows how far your measures have come: done, in progress, open, overdue. And it shows what has been reported as done but still has no evidence.',
      what: 'The report counts in two ways: by task and by control. You see progress the way your team works and the way an auditor asks. With NIS2 active, it also shows progress across the ten areas of Article 21(2). For planning, the roadmap report adds phases, bundles and resources.',
      chapters: [
        { h: 'Key figures', t: 'Implementation in per cent, done, in progress, open, critical, quick wins and overdue.' },
        { h: 'About this report', t: 'Where the figures come from and how they are produced.' },
        { h: 'Control scope', t: 'Two counting bases, tasks and controls, with implementation level and the figure “done without evidence”.' },
        { h: 'Progress by capability', t: 'Where your organisation is already strong and where not yet.' },
        { h: 'Progress by NIS2 Art. 21(2)', t: 'The ten minimum measures one by one, when NIS2 is active.' },
        { h: 'Insights and notes', t: 'Patterns in the progress and your own comments.' },
        { h: 'Measures table', t: 'ID, control, priority, owner, due date, status and risk.' },
      ],
      uses: ['Show progress in the project meeting', 'Spot overdue measures early', 'Complete evidence before the audit', 'Show management how implementation is going'],
      extra: { h: 'Roadmap report alongside', t: 'For planning, UniqSuite creates the roadmap report “Now / Next / Later” with phase overview, bundles, resources per owner and a register of measures, as PDF, Word or Excel.' },
      faq: [
        { q: 'What does “done without evidence” mean?', a: 'Measures marked as done that have no evidence attached yet. The report lists them so you can close them before the audit.' },
        { q: 'Why does the report count twice?', a: 'One task can fulfil several controls, and one control can need several tasks. Together, both views give an honest picture.' },
        { q: 'Which formats does the implementation report come in?', a: 'PDF, Word and Excel. The Excel file contains key figures and every measure, ready to filter.' },
        { q: 'What is the implementation report built from?', a: 'From the applicable controls in your Statement of Applicability, from risk treatment and from the maturity baseline. Each control becomes a measure with status, owner, due date and priority.' },
        { q: 'When is a measure overdue?', a: 'When its due date has passed and the control is not yet implemented. The key figures show these measures separately.' },
      ],
    },
    {
      key: 'audit', step: 5, topic: 'audit', formats: ['pdf', 'word', 'csv'],
      name: 'Audit',
      title: 'Audit report', sub: 'Findings, actions, sign-off.',
      lead: 'The audit report records the scope, findings and corrective actions of an audit. With ratings as major, minor or opportunity for improvement, and signature lines for the auditor and management.',
      what: 'Internal audit, external audit, supplier audit or certification audit: the report always follows the same structure. UniqSuite suggests a rating for each finding; the auditor decides. Every finding can be linked to risks, corrective actions, owners, deadlines and evidence. Earlier audits appear as history in the report.',
      chapters: [
        { h: 'Audit scope', t: 'Audit, auditor, date, overall verdict, frameworks audited and basis.' },
        { h: 'Results at a glance', t: 'Total findings, major, minor, observations (OFI) and items closed.' },
        { h: 'Findings', t: 'Framework and control, requirement, status, finding, linked risks, actions and evidence.' },
        { h: 'Checklist', t: 'Further open items with the suggested severity.' },
        { h: 'Method and rating scale', t: 'Major and minor as used in certification audits under ISO/IEC 17021-1, plus observations (opportunities for improvement, OFI).' },
        { h: 'History', t: 'Earlier audits with date, type, verdict and number of findings.' },
        { h: 'Sign-off', t: 'Signature lines for the auditor and for management or the client, each with date.' },
      ],
      uses: ['Document the internal audit under ISO/IEC 27001 clause 9.2', 'Audit suppliers and record the result', 'Track corrective actions to closure', 'Prepare for the certification audit'],
      extra: { h: 'Findings as a table', t: 'All findings can also be exported as a CSV file, for example for your own action list.' },
      faq: [
        { q: 'Who decides whether a finding is major or minor?', a: 'UniqSuite suggests a rating; the auditor decides. The scale is explained in the report.' },
        { q: 'Which audits can I record?', a: 'Internal and external audits, supplier audits and certification audits.' },
        { q: 'Can the report be signed?', a: 'Yes. The report ends with signature lines for the auditor and for management or the client.' },
        { q: 'Where do the findings come from?', a: 'From your gap analysis. At the push of a button, UniqSuite loads the requirements that are not or only partly implemented in the frameworks within the audit scope.' },
        { q: 'How does the audit connect to implementation?', a: 'You hand corrective actions from a finding over to implementation, with owner and deadline. Once the action is done there, the finding is closed as well.' },
      ],
    },
    {
      key: 'board', feature: 0, formats: ['pdf'],
      name: 'Board report',
      title: 'Board report', sub: 'Your security posture at a glance.',
      lead: 'The board report sums up your security posture in compact form: a score from 0 to 100, what needs doing now, which deadlines are overdue and how far each framework has been implemented.',
      what: 'Under section 38(1) of the German BSI Act (BSIG), management of essential and important entities must implement the risk management measures and oversee their implementation. For that it needs a clear overview rather than a long report. The board report provides it, at the push of a button and always up to date.',
      chapters: [
        { h: 'Security posture', t: 'A score from 0 to 100 with traffic light, the number of open critical MUST requirements and the date.' },
        { h: 'Action needed', t: 'What needs to be decided or set in motion next.' },
        { h: 'Overdue deadlines', t: 'Dates that have passed.' },
        { h: 'Compliance per framework', t: 'Conformity, open critical MUST requirements and requirements that apply later.' },
        { h: 'Legend', t: 'The terms of the report briefly explained.' },
      ],
      uses: ['Inform the board, managing directors or supervisory board', 'Evidence oversight under section 38 BSIG', 'Prepare decisions on budget and priorities', 'Refresh the status before meetings in minutes'],
      extra: { h: 'Always current', t: 'The report is created from the dashboard. Whatever changes in UniqSuite is in the report with the next click.' },
      faq: [
        { q: 'Who is the board report for?', a: 'For managing directors, the board and the supervisory board. In compact form it shows where the organisation stands and what needs deciding.' },
        { q: 'How often should it be created?', a: 'As often as you need it. It is created at the push of a button from the current status, for example before every management meeting.' },
        { q: 'Which format does the board report come in?', a: 'PDF, with your company name and logo.' },
        { q: 'How is the score from 0 to 100 calculated?', a: 'Implemented requirements count in full and partly implemented ones count half, measured against all applicable requirements. Unlike the gap analysis report, documented implementation also counts here, as on the dashboard.' },
        { q: 'What does the traffic light mean?', a: 'From 80 it shows green (“on track”), from 50 amber (“making progress”), below that red (“needs attention”).' },
      ],
    },
  ],
};
