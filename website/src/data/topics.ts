/**
 * Wissensseiten zu den Bausteinen der sechs Schritte (/de/wissen/…, /en/knowledge/…).
 * Normbezüge nur, wo sie eindeutig sind (ISO/IEC 27001:2022, BSIG i. d. F. des NIS2UmsuCG).
 * Aussagen zu UniqSuite nur über Funktionen, die es gibt (siehe steps.ts, features.ts).
 */
import type { Lang } from '../config';

export type TopicKey = 'scope' | 'entity' | 'inventory' | 'supply' | 'gap' | 'measures' | 'risk' | 'treat' | 'soa' | 'policy' | 'audit' | 'review';
export type Topic = {
  key: TopicKey;
  step: number; // Index in steps
  glyph: string;
  name: string; // kurzer Name (Navigation, Karten)
  title: string;
  sub: string;
  lead: string;
  what: string;
  how: string[];
  mistakes: string[];
  evidence: string[];
  refs: string[];
  help: string;
  faq: { q: string; a: string }[];
};

export const topicOrder: TopicKey[] = ['scope', 'entity', 'inventory', 'supply', 'gap', 'measures', 'risk', 'treat', 'soa', 'policy', 'audit', 'review'];
const slugs: Record<Lang, Record<TopicKey, string>> = {
  de: { scope: 'geltungsbereich', entity: 'nis2-betroffenheit', inventory: 'asset-inventar', supply: 'lieferkette', gap: 'gap-analyse', measures: 'mindestmassnahmen-nis2', risk: 'risikoanalyse', treat: 'risikobehandlung', soa: 'erklaerung-zur-anwendbarkeit', policy: 'leitlinie-und-richtlinien', audit: 'internes-audit', review: 'managementbewertung' },
  en: { scope: 'isms-scope', entity: 'nis2-scope-check', inventory: 'asset-inventory', supply: 'supply-chain-security', gap: 'gap-analysis', measures: 'nis2-minimum-measures', risk: 'risk-assessment', treat: 'risk-treatment', soa: 'statement-of-applicability', policy: 'information-security-policy', audit: 'internal-audit', review: 'management-review' },
};
export const topicSlug = (lang: Lang, k: TopicKey) => slugs[lang][k];
export const topicHub = (lang: Lang) => (lang === 'de' ? '/de/wissen/' : '/en/knowledge/');
export const topicHref = (lang: Lang, k: TopicKey) => `${topicHub(lang)}${slugs[lang][k]}/`;

const de: Topic[] = [
  {
    key: 'scope', step: 0, glyph: 'scope', name: 'Geltungsbereich',
    title: 'Geltungsbereich (Scope)', sub: 'Wofür Ihr Managementsystem gilt.',
    lead: 'Der Geltungsbereich legt fest, welche Standorte, Organisationseinheiten, Dienste und Schnittstellen zu Ihrem Managementsystem gehören. Alles Weitere baut darauf auf.',
    what: 'ISO/IEC 27001 verlangt in Abschnitt 4.3, die Grenzen und die Anwendbarkeit des ISMS zu bestimmen und als dokumentierte Information verfügbar zu halten. Grundlage sind der Kontext der Organisation (4.1), die Anforderungen interessierter Parteien (4.2) und die Schnittstellen zu Tätigkeiten anderer. Unter NIS2 lässt sich der Rahmen nicht frei zuschneiden: Die Maßnahmen nach § 30 BSIG gelten für die Systeme, Komponenten und Prozesse, die Sie für die Erbringung Ihrer Dienste nutzen.',
    how: [
      'Interne und externe Themen sammeln, die Ihre Informationssicherheit beeinflussen.',
      'Interessierte Parteien und ihre Anforderungen festhalten: Kunden, Behörden, Versicherer, Mutterkonzern.',
      'Standorte, Einheiten, Dienste und Schnittstellen festlegen und Ausschlüsse begründen.',
      'Den Geltungsbereich von der Leitung freigeben lassen und bei Änderungen anpassen.',
    ],
    mistakes: ['Der Scope ist so eng geschnitten, dass kritische Dienste fehlen.', 'Schnittstellen zu Dienstleistern und Cloud-Diensten sind nicht beschrieben.', 'Ausschlüsse stehen ohne Begründung im Dokument.'],
    evidence: ['Dokumentierter Geltungsbereich mit Version und Freigabe', 'Liste der interessierten Parteien mit ihren Anforderungen', 'Übersicht der Schnittstellen und Abhängigkeiten'],
    refs: ['ISO/IEC 27001, Abschnitt 4.1 bis 4.3', 'ISO/IEC 27001, Abschnitt 5.3: Rollen und Verantwortlichkeiten', 'BSIG § 30 Abs. 1'],
    help: 'UniqSuite fragt Branche, Größe, Standorte und Dienste in fester Reihenfolge ab und erzeugt daraus einen Scope-Bericht. Die folgenden Schritte zeigen nur, was in diesem Rahmen gilt.',
    faq: [
      { q: 'Darf der Geltungsbereich nur einen Teil des Unternehmens umfassen?', a: 'Bei ISO 27001 ja, wenn die Grenzen klar beschrieben und begründet sind. Die gesetzlichen Pflichten aus NIS2 hängen davon aber nicht ab.' },
      { q: 'Wann wird der Geltungsbereich überprüft?', a: 'Bei jeder wesentlichen Änderung, etwa neuen Standorten, Diensten oder Dienstleistern, und spätestens in der Managementbewertung.' },
    ],
  },
  {
    key: 'entity', step: 0, glyph: 'entity', name: 'NIS2-Betroffenheit',
    title: 'NIS2-Betroffenheit und Registrierung', sub: 'Ob und wie NIS2 für Sie gilt.',
    lead: 'Bevor Sie Maßnahmen planen, klären Sie, ob Sie eine besonders wichtige Einrichtung, eine wichtige Einrichtung oder gar nicht betroffen sind. Davon hängen Pflichten, Aufsicht und Bußgeldrahmen ab.',
    what: 'Die Einordnung richtet sich nach § 28 BSIG: nach dem Sektor gemäß den Anlagen 1 und 2, nach der Größe gemessen an Beschäftigten, Jahresumsatz und Bilanzsumme, und nach Sonderfällen, die unabhängig von der Größe erfasst sind. Wer betroffen ist, registriert sich nach § 33 BSIG beim BSI. Die Prüfung ist Ihre eigene Aufgabe; das BSI bietet dafür eine Betroffenheitsprüfung an.',
    how: [
      'Ihre Tätigkeiten den Sektoren und Einrichtungsarten der Anlagen 1 und 2 zuordnen.',
      'Die Größe bestimmen und dabei Partner- und verbundene Unternehmen richtig einrechnen.',
      'Das Ergebnis schriftlich festhalten und begründen.',
      'Beim BSI registrieren und die Angaben aktuell halten.',
    ],
    mistakes: ['Nur die Hauptbranche wird betrachtet, Nebentätigkeiten fallen unter den Tisch.', 'Verbundene Unternehmen fehlen bei der Größenberechnung.', 'Das Ergebnis ist nirgends begründet.'],
    evidence: ['Dokumentierte Betroffenheitsprüfung mit Begründung', 'Registrierungsbestätigung des BSI', 'Aktuelle Kontaktdaten für die Erreichbarkeit'],
    refs: ['BSIG § 28: besonders wichtige und wichtige Einrichtungen', 'BSIG § 33: Registrierungspflicht', 'BSIG Anlagen 1 und 2: Sektoren und Einrichtungsarten'],
    help: 'Die Einstiegsfragen in UniqSuite ordnen Ihre Organisation ein und zeigen, welche Regelwerke in Frage kommen. Das Ergebnis steht im Scope-Bericht.',
    faq: [
      { q: 'Was tun, wenn wir die Registrierung verpasst haben?', a: 'Holen Sie sie unverzüglich nach. Die Pflichten gelten unabhängig davon seit dem 6. Dezember 2025.' },
      { q: 'Ist die Einstufung endgültig?', a: 'Nein. Ändern sich Tätigkeiten oder Größe, kann sich die Einordnung ändern. Prüfen Sie sie regelmäßig.' },
    ],
  },
  {
    key: 'inventory', step: 1, glyph: 'inventory', name: 'Asset-Inventar',
    title: 'Asset-Inventar', sub: 'Was Sie schützen und wovon es abhängt.',
    lead: 'Das Inventar listet Dienste, Informationen, Systeme, Räume und Dienstleister – mit Verantwortlichen und Abhängigkeiten. Ohne Inventar bleibt jede Risikoanalyse allgemein.',
    what: 'ISO/IEC 27001 verlangt in Anhang A 5.9 ein Inventar der Informationen und anderer zugehöriger Werte einschließlich der Eigentümer. Das BSI-Gesetz nennt das Management von Anlagen in § 30 Abs. 2 Nr. 9. Entscheidend ist nicht die Länge der Liste, sondern dass Sie wissen, welcher Dienst an welchem System und welchem Dienstleister hängt.',
    how: [
      'Mit den Diensten beginnen, nicht mit der Hardware.',
      'Zu jedem Dienst Systeme, Daten, Räume und Dienstleister erfassen.',
      'Verantwortliche und Kritikalität festlegen.',
      'Das Inventar bei jeder Änderung nachführen.',
    ],
    mistakes: ['Das Inventar ist eine Hardware-Liste aus der Buchhaltung.', 'Cloud- und SaaS-Dienste fehlen.', 'Niemand ist für die Einträge verantwortlich.'],
    evidence: ['Aktuelles Inventar mit Eigentümern', 'Abhängigkeitsübersicht für kritische Dienste', 'Nachweis der regelmäßigen Pflege'],
    refs: ['ISO/IEC 27001, Anhang A 5.9 und 5.10', 'ISO/IEC 27001, Anhang A 5.12: Klassifizierung von Informationen', 'BSIG § 30 Abs. 2 Nr. 9'],
    help: 'UniqSuite zeigt die Abhängigkeiten als Übersicht. Dienstleister aus dem Inventar stehen im Lieferanten-Check bereit, ohne doppelte Pflege.',
    faq: [
      { q: 'Wie detailliert muss das Inventar sein?', a: 'So detailliert, dass Sie Risiken je Dienst bewerten können. Für den Anfang reichen die wichtigsten Dienste und alles, worauf sie angewiesen sind.' },
      { q: 'Gehören Cloud-Dienste hinein?', a: 'Ja. Ein SaaS-Dienst, in dem Ihre Daten liegen, ist ein Wert wie jeder Server – mit Dienstleister und Vertrag.' },
    ],
  },
  {
    key: 'supply', step: 1, glyph: 'supplier', name: 'Lieferkette',
    title: 'Sicherheit der Lieferkette', sub: 'Dienstleister nach Kritikalität steuern.',
    lead: 'Viele Vorfälle beginnen bei einem Dienstleister. NIS2 und ISO 27001 verlangen deshalb, Lieferanten nach Kritikalität zu bewerten und Sicherheitsanforderungen vertraglich festzuhalten.',
    what: 'Das BSI-Gesetz nennt die Sicherheit der Lieferkette ausdrücklich als Mindestmaßnahme (§ 30 Abs. 2 Nr. 4), einschließlich der sicherheitsbezogenen Aspekte der Beziehungen zu unmittelbaren Anbietern und Diensteanbietern. ISO/IEC 27001 deckt das in Anhang A 5.19 bis 5.23 ab, bis zur Nutzung von Cloud-Diensten.',
    how: [
      'Lieferanten aus dem Inventar übernehmen.',
      'Nach Kritikalität für Ihre Dienste einstufen.',
      'Sicherheitsanforderungen und Meldepflichten in die Verträge schreiben.',
      'Kritische Lieferanten regelmäßig prüfen: Fragebogen, Nachweise, Zertifikate.',
    ],
    mistakes: ['Alle Lieferanten werden gleich behandelt.', 'Verträge enthalten keine Pflicht, Vorfälle zu melden.', 'Die Prüfung findet einmal statt und nie wieder.'],
    evidence: ['Lieferantenregister mit Kritikalität', 'Bewertungen mit Prüfterminen', 'Vertragsklauseln zu Sicherheit und Vorfallmeldung'],
    refs: ['BSIG § 30 Abs. 2 Nr. 4', 'ISO/IEC 27001, Anhang A 5.19 bis 5.23'],
    help: 'Der Lieferanten-Check in UniqSuite hält Kritikalität, greifende und fehlende Kontrollen sowie den Prüfzyklus je Lieferant fest.',
    faq: [
      { q: 'Reicht das ISO-Zertifikat eines Lieferanten?', a: 'Es ist ein guter Nachweis, wenn sein Geltungsbereich die Leistung umfasst, die Sie beziehen. Prüfen Sie den Scope des Zertifikats.' },
      { q: 'Müssen wir alle Lieferanten prüfen?', a: 'Abgestuft nach Kritikalität: kritische gründlich, unkritische mit wenig Aufwand.' },
    ],
  },
  {
    key: 'gap', step: 2, glyph: 'gap', name: 'Gap-Analyse',
    title: 'Gap-Analyse', sub: 'Soll gegen Ist, je Regelwerk.',
    lead: 'Die Gap-Analyse vergleicht, was ein Regelwerk verlangt, mit dem, was bei Ihnen umgesetzt ist. Am Ende stehen der Umsetzungsstand je Regelwerk und eine Liste der Lücken.',
    what: 'Für jede Anforderung halten Sie fest: erfüllt, teilweise, nicht erfüllt oder nicht anwendbar – jeweils mit Begründung. Bei ISO/IEC 27001 bilden die 93 Maßnahmen aus Anhang A die Grundlage der späteren Erklärung zur Anwendbarkeit, bei NIS2 die zehn Bereiche aus § 30 Abs. 2 BSIG. Die Gap-Analyse ersetzt keine Risikoanalyse. Sie zeigt, wo Sie anfangen.',
    how: [
      'Die geltenden Anforderungen aus dem Rahmen ableiten.',
      'Je Anforderung den Stand und eine Begründung erfassen.',
      '„Nicht anwendbar“ nur mit nachvollziehbarer Begründung wählen.',
      'Lücken priorisieren und in den Maßnahmenplan übernehmen.',
    ],
    mistakes: ['„Teilweise“ wird zur Komfortantwort.', 'Ausschlüsse haben keine Begründung.', 'Jedes Regelwerk wird getrennt analysiert, obwohl sich die Anforderungen decken.'],
    evidence: ['Bewertete Anforderungsliste mit Begründungen', 'Umsetzungsstand je Regelwerk', 'Priorisierte Lückenliste'],
    refs: ['ISO/IEC 27001, Anhang A', 'BSIG § 30 Abs. 2', 'Für ISO/IEC 42001, AI Act und CRA gilt dasselbe Vorgehen mit den jeweiligen Katalogen.'],
    help: 'UniqSuite stellt eine Frage pro Anforderung. Gilt eine Antwort für mehrere Regelwerke, zählt im Zweifel die schwächste Umsetzung. Der Stand je Regelwerk wird nach jeder Antwort neu berechnet.',
    faq: [
      { q: 'Wie lange dauert eine Gap-Analyse?', a: 'Das hängt von Größe und Vorarbeit ab. Gut vorbereitet schaffen Sie einen ersten vollständigen Durchgang in wenigen Arbeitstagen.' },
      { q: 'Wer beantwortet die Fragen?', a: 'Die Fachleute, die es wissen: IT, Personal, Einkauf, Gebäude. Die Informationssicherheit koordiniert und prüft die Begründungen.' },
    ],
  },
  {
    key: 'measures', step: 2, glyph: 'list', name: 'Zehn Mindestmaßnahmen',
    title: 'Die zehn Mindestmaßnahmen nach § 30 BSIG', sub: 'Was NIS2 konkret verlangt.',
    lead: '§ 30 BSIG übernimmt die Mindestmaßnahmen aus Art. 21 Abs. 2 der NIS2-Richtlinie. Sie müssen geeignet, verhältnismäßig und wirksam sein und einem gefahrenübergreifenden Ansatz folgen.',
    what: 'Die Maßnahmen sollen Störungen der Verfügbarkeit, Integrität und Vertraulichkeit der Systeme, Komponenten und Prozesse vermeiden, die Sie für Ihre Dienste nutzen, und die Auswirkungen von Vorfällen möglichst gering halten. Was angemessen ist, richtet sich nach Ihrer Risikoexposition, Ihrer Größe, den Umsetzungskosten sowie Eintrittswahrscheinlichkeit und Schwere möglicher Vorfälle.',
    how: [
      'Risikoanalyse und Sicherheitskonzepte',
      'Bewältigung von Sicherheitsvorfällen',
      'Betriebskontinuität, Backup-Management und Krisenmanagement',
      'Sicherheit der Lieferkette',
      'Sicherheit bei Erwerb, Entwicklung und Wartung, einschließlich Schwachstellenmanagement',
      'Bewertung der Wirksamkeit der Maßnahmen',
      'Cyberhygiene und Schulungen',
      'Kryptografie und Verschlüsselung',
      'Personalsicherheit, Zugriffskontrolle und Management von Anlagen',
      'Multi-Faktor-Authentifizierung, gesicherte Kommunikation und Notfallkommunikation',
    ],
    mistakes: ['Die Risikoanalyse lässt die Lieferkette aus.', 'Es gibt kein Kriterium für „erheblich“ und keinen geübten Meldeweg.', 'Die Wiederherstellung aus dem Backup wurde nie getestet.'],
    evidence: ['Freigegebene Leitlinie und aktueller Risikobericht', 'Vorfallregister und Meldevorlagen', 'Restore-Testprotokolle und Schulungsnachweise, auch für die Leitung'],
    refs: ['BSIG § 30 Abs. 1 und 2', 'Richtlinie (EU) 2022/2555, Art. 21', 'Durchführungsverordnung (EU) 2024/2690 für bestimmte digitale Dienste'],
    help: 'UniqSuite bildet die zehn Bereiche als prüfbare Anforderungen ab und zeigt, wo sie sich mit ISO 27001 decken.',
    faq: [
      { q: 'Gibt es verbindliche technische Vorgaben?', a: 'Für bestimmte digitale Dienste ja, in der Durchführungsverordnung (EU) 2024/2690. Für alle anderen gilt: geeignet, verhältnismäßig und wirksam, gemessen an Ihrem Risiko.' },
      { q: 'Deckt ISO 27001 alle zehn ab?', a: 'Inhaltlich weitgehend. Die Zuordnung ist eine fachliche Einschätzung, keine amtliche Konkordanz.' },
    ],
  },
  {
    key: 'risk', step: 3, glyph: 'risk', name: 'Risikoanalyse',
    title: 'Risikoanalyse', sub: 'Was schiefgehen kann und was es kostet.',
    lead: 'Die Risikoanalyse beantwortet, was passieren kann, wie wahrscheinlich es ist und welche Folgen es hätte. Sie ist der Kern jedes ISMS und eine Pflicht unter NIS2.',
    what: 'ISO/IEC 27001 verlangt in Abschnitt 6.1.2 eine festgelegte Methode mit Kriterien für die Risikoakzeptanz, die bei Wiederholung zu konsistenten, gültigen und vergleichbaren Ergebnissen führt. Risiken werden identifiziert, Risikoeigentümern zugeordnet, analysiert und bewertet. Abschnitt 8.2 verlangt, die Beurteilung in geplanten Abständen und bei wesentlichen Änderungen zu wiederholen.',
    how: [
      'Methode und Kriterien für die Risikoakzeptanz festlegen.',
      'Risiken je Dienst und Wert identifizieren, gefahrenübergreifend.',
      'Eintrittswahrscheinlichkeit und Auswirkung bewerten.',
      'Risikoeigentümer benennen und die Ergebnisse priorisieren.',
    ],
    mistakes: ['Eine Risikoliste ohne Methode: Die Bewertungen sind nicht vergleichbar.', 'Nur Cyberangriffe, keine Ausfälle durch Strom, Personal oder Lieferanten.', 'Einmal erstellt, nie aktualisiert.'],
    evidence: ['Dokumentierte Methode mit Akzeptanzkriterien', 'Risikoregister mit Risikoeigentümern', 'Nachweis der regelmäßigen Wiederholung'],
    refs: ['ISO/IEC 27001, Abschnitt 6.1.2 und 8.2', 'BSIG § 30 Abs. 1 und Abs. 2 Nr. 1', 'ISO/IEC 27005 als Leitfaden'],
    help: 'Die Bewertung in UniqSuite folgt festen Regeln. Zwei Personen, die gleich antworten, kommen zum gleichen Ergebnis. Den Risikobericht erzeugen Sie als PDF, Word oder Excel.',
    faq: [
      { q: 'Welche Methode ist die richtige?', a: 'Die Norm schreibt keine vor. Wichtig ist, dass sie dokumentiert ist und reproduzierbare Ergebnisse liefert. Eine einfache Matrix aus Wahrscheinlichkeit und Auswirkung reicht oft.' },
      { q: 'Wie oft wird die Analyse wiederholt?', a: 'In geplanten Abständen, in der Praxis meist jährlich, und immer bei wesentlichen Änderungen.' },
    ],
  },
  {
    key: 'treat', step: 3, glyph: 'treat', name: 'Risikobehandlung',
    title: 'Risikobehandlung', sub: 'Mindern, vermeiden, übertragen oder tragen.',
    lead: 'Für jedes bewertete Risiko entscheiden Sie, was passiert. Daraus entsteht der Risikobehandlungsplan – mit Maßnahmen, Zuständigen und Fristen.',
    what: 'Abschnitt 6.1.3 von ISO/IEC 27001 verlangt, Behandlungsoptionen auszuwählen, die nötigen Maßnahmen festzulegen und mit Anhang A abzugleichen, damit keine notwendige Maßnahme übersehen wird. Die Risikoeigentümer genehmigen den Plan und akzeptieren die Restrisiken. Abschnitt 8.3 verlangt, den Plan umzusetzen und die Ergebnisse zu dokumentieren.',
    how: [
      'Für jedes Risiko eine Option wählen.',
      'Maßnahmen festlegen und mit Anhang A abgleichen.',
      'Zuständige und Fristen bestimmen.',
      'Restrisiken von den Risikoeigentümern akzeptieren lassen.',
    ],
    mistakes: ['Risiken werden „akzeptiert“, ohne dass jemand mit Befugnis zustimmt.', 'Maßnahmen haben keine Frist und keine Zuständigen.', 'Das Restrisiko wird nach der Umsetzung nicht neu bewertet.'],
    evidence: ['Risikobehandlungsplan', 'Genehmigung und Restrisikoakzeptanz durch die Risikoeigentümer', 'Umsetzungsnachweise'],
    refs: ['ISO/IEC 27001, Abschnitt 6.1.3 und 8.3', 'BSIG § 38 Abs. 1: Umsetzung und Überwachung durch die Geschäftsleitung'],
    help: 'In UniqSuite wählen Sie die Behandlung direkt am Risiko. Maßnahmen landen mit Zuständigen und Fristen im Plan und erscheinen im Dashboard.',
    faq: [
      { q: 'Dürfen wir ein hohes Risiko akzeptieren?', a: 'Ja, wenn es bewusst, begründet und mit Zustimmung der zuständigen Leitung geschieht. Unter NIS2 müssen Ihre Maßnahmen insgesamt trotzdem angemessen sein.' },
      { q: 'Was heißt Risikoübertragung?', a: 'Zum Beispiel eine Versicherung oder die Auslagerung an einen Dienstleister. Die Verantwortung für die Informationssicherheit bleibt bei Ihnen.' },
    ],
  },
  {
    key: 'soa', step: 4, glyph: 'soa', name: 'Erklärung zur Anwendbarkeit',
    title: 'Erklärung zur Anwendbarkeit (SoA)', sub: 'Welche Maßnahmen gelten, und warum.',
    lead: 'Die Erklärung zur Anwendbarkeit zeigt für jede der 93 Maßnahmen aus Anhang A, ob sie gilt, warum, und ob sie umgesetzt ist. Sie gehört zu den wichtigsten Dokumenten im ISO-27001-Audit.',
    what: 'ISO/IEC 27001 verlangt in Abschnitt 6.1.3 d) eine Erklärung zur Anwendbarkeit mit den notwendigen Maßnahmen, der Begründung für ihre Aufnahme, dem Umsetzungsstand und der Begründung für den Ausschluss von Maßnahmen aus Anhang A. Sie verbindet Risikobehandlung und Umsetzung: Jede aufgenommene Maßnahme sollte auf ein Risiko oder eine Anforderung zurückgehen.',
    how: [
      'Alle 93 Maßnahmen aus Anhang A durchgehen.',
      'Je Maßnahme „anwendbar“ oder „nicht anwendbar“ mit Begründung festhalten.',
      'Den Umsetzungsstand eintragen.',
      'Version und Freigabe dokumentieren und die SoA bei Änderungen pflegen.',
    ],
    mistakes: ['Ausschlüsse mit „nicht relevant“ statt mit einer Begründung.', 'Maßnahmen ohne Bezug zu einem Risiko oder einer Anforderung.', 'Einmal fürs Audit geschrieben und danach nicht mehr gepflegt.'],
    evidence: ['Freigegebene SoA mit Version', 'Verweise auf Risiken und Nachweise', 'Änderungshistorie'],
    refs: ['ISO/IEC 27001, Abschnitt 6.1.3 d)', 'ISO/IEC 27001, Anhang A: 93 Maßnahmen', 'ISO/IEC 42001 verlangt eine eigene Erklärung zur Anwendbarkeit für ihren Anhang A'],
    help: 'In UniqSuite entsteht die Erklärung zur Anwendbarkeit aus Ihren Antworten und Begründungen. Sie müssen sie nicht von Hand schreiben.',
    faq: [
      { q: 'Wie viele Maßnahmen dürfen wir ausschließen?', a: 'Es gibt keine Quote. Jeder Ausschluss braucht eine nachvollziehbare Begründung, etwa weil es keine eigene Softwareentwicklung gibt.' },
      { q: 'Braucht NIS2 eine SoA?', a: 'Das Gesetz verlangt sie nicht ausdrücklich. Als Nachweis, welche Maßnahmen Sie warum umsetzen, ist sie aber sehr nützlich.' },
    ],
  },
  {
    key: 'policy', step: 4, glyph: 'policies', name: 'Leitlinie und Richtlinien',
    title: 'Leitlinie und Richtlinien', sub: 'Der Kurs der Leitung, schriftlich.',
    lead: 'Die Leitlinie zur Informationssicherheit setzt den Kurs der Leitung, themenspezifische Richtlinien regeln die Einzelheiten. Beide müssen freigegeben, bekannt gemacht und regelmäßig überprüft werden.',
    what: 'ISO/IEC 27001 verlangt in Abschnitt 5.2 eine Informationssicherheitspolitik der obersten Leitung mit Zielen und der Verpflichtung, Anforderungen zu erfüllen und fortlaufend besser zu werden. Anhang A 5.1 ergänzt themenspezifische Richtlinien, die von der Leitung genehmigt, veröffentlicht, den Beschäftigten mitgeteilt und in geplanten Abständen überprüft werden.',
    how: [
      'Eine Leitlinie mit Zielen und der Verantwortung der Leitung schreiben.',
      'Themenspezifische Richtlinien ergänzen, etwa zu Zugriff, Kryptografie, Backup und mobilen Geräten.',
      'Freigeben, bekannt machen und die Kenntnisnahme dokumentieren.',
      'In geplanten Abständen und bei Änderungen überprüfen.',
    ],
    mistakes: ['Richtlinien aus Vorlagen, die niemand lebt.', 'Keine Freigabe durch die Leitung.', 'Die Beschäftigten kennen die Regeln nicht.'],
    evidence: ['Freigegebene Leitlinie mit Datum und Version', 'Verzeichnis der Richtlinien', 'Nachweise über Bekanntgabe und Kenntnisnahme'],
    refs: ['ISO/IEC 27001, Abschnitt 5.2', 'ISO/IEC 27001, Anhang A 5.1', 'BSIG § 30 Abs. 2 Nr. 1: Konzepte zur Risikoanalyse und zur Sicherheit in der Informationstechnik'],
    help: 'In UniqSuite starten Sie mit einer Vorlage, die zeigt, welche Anforderungen sie abdeckt, passen sie an und geben sie frei. Der Stand bleibt festgehalten.',
    faq: [
      { q: 'Wie viele Richtlinien brauchen wir?', a: 'So viele, wie Ihre Risiken und Maßnahmen verlangen. Lieber wenige, die gelebt werden, als ein Ordner, den niemand liest.' },
      { q: 'Wer gibt die Leitlinie frei?', a: 'Die oberste Leitung. Unter NIS2 passt das zu ihrer Pflicht, die Maßnahmen umzusetzen und zu überwachen.' },
    ],
  },
  {
    key: 'audit', step: 5, glyph: 'audit', name: 'Internes Audit',
    title: 'Internes Audit', sub: 'Selbst prüfen, bevor andere es tun.',
    lead: 'Im internen Audit prüfen Sie, ob Ihr Managementsystem die Anforderungen erfüllt und wirksam umgesetzt ist – bevor ein externer Prüfer kommt.',
    what: 'ISO/IEC 27001 verlangt in Abschnitt 9.2 interne Audits in geplanten Abständen nach einem Auditprogramm mit Häufigkeit, Methoden, Verantwortlichkeiten und Berichterstattung. Auditoren müssen objektiv und unparteiisch sein, die Ergebnisse gehen an die zuständige Leitung. Unter NIS2 gehört die Bewertung der Wirksamkeit zu den Mindestmaßnahmen (§ 30 Abs. 2 Nr. 6 BSIG).',
    how: [
      'Ein Auditprogramm für den Zyklus planen.',
      'Kriterien und Umfang je Audit festlegen.',
      'Mit Interviews, Stichproben und Nachweisen prüfen.',
      'Befunde berichten und Korrekturmaßnahmen einleiten.',
    ],
    mistakes: ['Der Auditor prüft die eigene Arbeit.', 'Das Audit bleibt eine Dokumentenprüfung ohne Stichprobe im Betrieb.', 'Befunde haben keine Korrekturmaßnahme und keine Frist.'],
    evidence: ['Auditprogramm und Auditplan', 'Auditberichte mit Befunden', 'Nachverfolgung der Korrekturmaßnahmen'],
    refs: ['ISO/IEC 27001, Abschnitt 9.2', 'ISO/IEC 27001, Abschnitt 10.2: Nichtkonformität und Korrekturmaßnahmen', 'BSIG § 30 Abs. 2 Nr. 6', 'ISO 19011 als Leitfaden für Audits'],
    help: 'In UniqSuite planen Sie Audits, erfassen Befunde und legen zu jedem eine Korrekturmaßnahme mit Zuständigen und Frist an. Den Auditbericht erzeugen Sie auf Knopfdruck.',
    faq: [
      { q: 'Wer darf intern auditieren?', a: 'Jemand, der objektiv und unparteiisch ist, also nicht die eigene Arbeit prüft. Das können Beschäftigte aus anderen Bereichen oder externe Auditoren sein.' },
      { q: 'Wie oft wird auditiert?', a: 'In geplanten Abständen. Üblich ist, alle Bereiche innerhalb eines Zertifizierungszyklus abzudecken und wichtige Bereiche jährlich.' },
    ],
  },
  {
    key: 'review', step: 5, glyph: 'review', name: 'Managementbewertung',
    title: 'Managementbewertung', sub: 'Die Leitung entscheidet, was sich ändert.',
    lead: 'In der Managementbewertung prüft die oberste Leitung, ob das Managementsystem noch passt, angemessen und wirksam ist – und entscheidet, was sich ändern muss.',
    what: 'ISO/IEC 27001 verlangt in Abschnitt 9.3 eine Bewertung in geplanten Abständen. Eingaben sind unter anderem der Stand früherer Beschlüsse, Änderungen im Kontext, Rückmeldungen zur Leistung wie Nichtkonformitäten, Messergebnisse, Auditergebnisse und Zielerreichung, die Ergebnisse der Risikobeurteilung und Verbesserungsmöglichkeiten. Ergebnis sind Entscheidungen zu Verbesserungen und Änderungsbedarf. Unter NIS2 passt das zur Pflicht der Geschäftsleitung, die Umsetzung zu überwachen (§ 38 BSIG).',
    how: [
      'Termin und Teilnehmende festlegen, die Leitung ist dabei.',
      'Eingaben vorbereiten: Kennzahlen, Auditergebnisse, Vorfälle, Risiken.',
      'Entscheiden: Ressourcen, Ziele, Änderungen.',
      'Beschlüsse mit Verantwortlichen und Fristen protokollieren.',
    ],
    mistakes: ['Eine Präsentation ohne Entscheidungen.', 'Die Leitung nimmt nur per E-Mail Kenntnis.', 'Beschlüsse werden nicht nachverfolgt.'],
    evidence: ['Protokoll mit allen geforderten Eingaben', 'Beschlüsse mit Verantwortlichen und Fristen', 'Nachweis der Umsetzung im nächsten Zyklus'],
    refs: ['ISO/IEC 27001, Abschnitt 9.3', 'ISO/IEC 27001, Abschnitt 10.1: fortlaufende Verbesserung', 'BSIG § 38 Abs. 1'],
    help: 'Der Bericht für die Geschäftsleitung in UniqSuite fasst Stand, Trend, offene Maßnahmen und Risiken zusammen – eine gute Vorlage für die Managementbewertung.',
    faq: [
      { q: 'Wie oft findet sie statt?', a: 'In geplanten Abständen, in der Praxis mindestens einmal im Jahr.' },
      { q: 'Reicht ein Monatsbericht?', a: 'Er erleichtert die Überwachung, ersetzt aber nicht die förmliche Bewertung mit Entscheidungen.' },
    ],
  },
];

const en: Topic[] = [
  {
    key: 'scope', step: 0, glyph: 'scope', name: 'ISMS scope',
    title: 'ISMS scope', sub: 'What your management system covers.',
    lead: 'The scope defines which sites, organisational units, services and interfaces belong to your management system. Everything else builds on it.',
    what: 'ISO/IEC 27001 clause 4.3 requires you to determine the boundaries and applicability of the ISMS and keep them as documented information. The basis is the context of the organisation (4.1), the requirements of interested parties (4.2) and the interfaces with activities performed by others. Under NIS2 you cannot cut the scope freely: the measures under Section 30 BSIG apply to the systems, components and processes you use to provide your services.',
    how: [
      'Collect the internal and external issues that affect your information security.',
      'Record interested parties and their requirements: customers, authorities, insurers, parent company.',
      'Define sites, units, services and interfaces, and justify exclusions.',
      'Have management approve the scope and update it when things change.',
    ],
    mistakes: ['The scope is so narrow that critical services are missing.', 'Interfaces with service providers and cloud services are not described.', 'Exclusions appear without justification.'],
    evidence: ['Documented scope with version and approval', 'List of interested parties and their requirements', 'Overview of interfaces and dependencies'],
    refs: ['ISO/IEC 27001, clauses 4.1 to 4.3', 'ISO/IEC 27001, clause 5.3: roles and responsibilities', 'Section 30(1) BSIG'],
    help: 'UniqSuite asks for sector, size, sites and services in a fixed order and produces a scope report. The following steps only show what applies within this scope.',
    faq: [
      { q: 'Can the scope cover only part of the company?', a: 'For ISO 27001, yes, if the boundaries are clearly described and justified. The legal obligations under NIS2 do not depend on it, though.' },
      { q: 'When is the scope reviewed?', a: 'With every significant change, such as new sites, services or providers, and at the latest in the management review.' },
    ],
  },
  {
    key: 'entity', step: 0, glyph: 'entity', name: 'NIS2 scope check',
    title: 'NIS2 scope check and registration', sub: 'Whether and how NIS2 applies to you.',
    lead: 'Before planning measures, establish whether you are an essential entity, an important entity or not in scope. Obligations, supervision and the range of fines depend on it.',
    what: 'Classification follows Section 28 BSIG: the sector according to Annexes 1 and 2, size measured by employees, annual turnover and balance sheet total, and special cases covered regardless of size. Entities in scope register with the BSI under Section 33 BSIG. The assessment is your own responsibility; the BSI offers an online check for it.',
    how: [
      'Map your activities to the sectors and entity types of Annexes 1 and 2.',
      'Determine your size, counting partner and linked enterprises correctly.',
      'Record the result in writing and justify it.',
      'Register with the BSI and keep the details current.',
    ],
    mistakes: ['Only the main business is considered and side activities are overlooked.', 'Linked enterprises are missing from the size calculation.', 'The result is not justified anywhere.'],
    evidence: ['Documented scope check with justification', 'BSI registration confirmation', 'Current contact details for reachability'],
    refs: ['Section 28 BSIG: essential and important entities', 'Section 33 BSIG: registration', 'BSIG Annexes 1 and 2: sectors and entity types'],
    help: 'The opening questions in UniqSuite classify your organisation and show which frameworks may apply. The result goes into the scope report.',
    faq: [
      { q: 'What if we missed the registration?', a: 'Register without delay. The obligations have applied regardless since 6 December 2025.' },
      { q: 'Is the classification final?', a: 'No. If your activities or size change, the classification can change too. Review it regularly.' },
    ],
  },
  {
    key: 'inventory', step: 1, glyph: 'inventory', name: 'Asset inventory',
    title: 'Asset inventory', sub: 'What you protect and what it depends on.',
    lead: 'The inventory lists services, information, systems, premises and providers – with owners and dependencies. Without it, every risk assessment stays generic.',
    what: 'ISO/IEC 27001 Annex A 5.9 requires an inventory of information and other associated assets, including owners. The BSI Act names asset management in Section 30(2) No. 9. What matters is not the length of the list but knowing which service depends on which system and which provider.',
    how: [
      'Start with services, not hardware.',
      'For each service, record systems, data, premises and providers.',
      'Assign owners and criticality.',
      'Update the inventory with every change.',
    ],
    mistakes: ['The inventory is a hardware list from accounting.', 'Cloud and SaaS services are missing.', 'Nobody owns the entries.'],
    evidence: ['Current inventory with owners', 'Dependency overview for critical services', 'Evidence of regular maintenance'],
    refs: ['ISO/IEC 27001, Annex A 5.9 and 5.10', 'ISO/IEC 27001, Annex A 5.12: classification of information', 'Section 30(2) No. 9 BSIG'],
    help: 'UniqSuite shows dependencies as an overview. Providers from the inventory are ready in the supplier check, with no duplicate entry.',
    faq: [
      { q: 'How detailed must the inventory be?', a: 'Detailed enough to assess risks per service. To start, the most important services and everything they depend on are enough.' },
      { q: 'Do cloud services belong in it?', a: 'Yes. A SaaS service holding your data is an asset like any server – with a provider and a contract.' },
    ],
  },
  {
    key: 'supply', step: 1, glyph: 'supplier', name: 'Supply chain',
    title: 'Supply chain security', sub: 'Managing providers by criticality.',
    lead: 'Many incidents start at a service provider. NIS2 and ISO 27001 therefore require you to assess suppliers by criticality and put security requirements into contracts.',
    what: 'The BSI Act explicitly lists supply chain security as a minimum measure (Section 30(2) No. 4), including the security aspects of relationships with direct suppliers and service providers. ISO/IEC 27001 covers it in Annex A 5.19 to 5.23, up to the use of cloud services.',
    how: [
      'Take suppliers over from the inventory.',
      'Rate them by criticality for your services.',
      'Write security requirements and incident reporting into contracts.',
      'Review critical suppliers regularly: questionnaires, evidence, certificates.',
    ],
    mistakes: ['All suppliers are treated the same.', 'Contracts contain no duty to report incidents.', 'The review happens once and never again.'],
    evidence: ['Supplier register with criticality', 'Assessments with review dates', 'Contract clauses on security and incident reporting'],
    refs: ['Section 30(2) No. 4 BSIG', 'ISO/IEC 27001, Annex A 5.19 to 5.23'],
    help: 'The supplier check in UniqSuite records criticality, the controls in place and missing, and the review cycle for each supplier.',
    faq: [
      { q: 'Is a supplier’s ISO certificate enough?', a: 'It is good evidence if its scope covers the service you buy. Check the scope of the certificate.' },
      { q: 'Do we have to review every supplier?', a: 'Graded by criticality: critical ones thoroughly, non-critical ones with little effort.' },
    ],
  },
  {
    key: 'gap', step: 2, glyph: 'gap', name: 'Gap analysis',
    title: 'Gap analysis', sub: 'Target against actual, per framework.',
    lead: 'A gap analysis compares what a framework requires with what you have in place. The result is your implementation status per framework and a list of gaps.',
    what: 'For each requirement you record: met, partly met, not met or not applicable – each with a justification. For ISO/IEC 27001 the 93 controls in Annex A form the basis of the later Statement of Applicability; for NIS2 it is the ten areas in Section 30(2) BSIG. A gap analysis does not replace a risk assessment. It shows where to start.',
    how: [
      'Derive the applicable requirements from your scope.',
      'Record status and justification for each requirement.',
      'Choose “not applicable” only with a traceable reason.',
      'Prioritise gaps and move them into the action plan.',
    ],
    mistakes: ['“Partly” becomes the comfortable answer.', 'Exclusions have no justification.', 'Each framework is analysed separately although the requirements overlap.'],
    evidence: ['Assessed requirement list with justifications', 'Implementation status per framework', 'Prioritised gap list'],
    refs: ['ISO/IEC 27001, Annex A', 'Section 30(2) BSIG', 'The same approach applies to ISO/IEC 42001, the AI Act and the CRA with their own catalogues.'],
    help: 'UniqSuite asks one question per requirement. If an answer applies to several frameworks, the weakest implementation counts when in doubt. The status per framework is recalculated after every answer.',
    faq: [
      { q: 'How long does a gap analysis take?', a: 'It depends on size and prior work. Well prepared, you can complete a first full pass in a few working days.' },
      { q: 'Who answers the questions?', a: 'The people who know: IT, HR, purchasing, facilities. Information security coordinates and reviews the justifications.' },
    ],
  },
  {
    key: 'measures', step: 2, glyph: 'list', name: 'Ten minimum measures',
    title: 'The ten minimum measures under Section 30 BSIG', sub: 'What NIS2 requires in concrete terms.',
    lead: 'Section 30 BSIG adopts the minimum measures from Art. 21(2) of the NIS2 Directive. They must be appropriate, proportionate and effective, and follow an all-hazards approach.',
    what: 'The measures aim to prevent disruption to the availability, integrity and confidentiality of the systems, components and processes you use for your services, and to keep the impact of incidents as low as possible. What is appropriate depends on your risk exposure, your size, the cost of implementation and the likelihood and severity of possible incidents.',
    how: [
      'Risk analysis and information system security policies',
      'Incident handling',
      'Business continuity, backup management and crisis management',
      'Supply chain security',
      'Security in acquisition, development and maintenance, including vulnerability handling',
      'Assessing the effectiveness of measures',
      'Cyber hygiene and training',
      'Cryptography and encryption',
      'Human resources security, access control and asset management',
      'Multi-factor authentication, secured communications and emergency communications',
    ],
    mistakes: ['The risk analysis leaves out the supply chain.', 'There is no criterion for “significant” and no practised reporting route.', 'Restoring from backup has never been tested.'],
    evidence: ['Approved policy and current risk report', 'Incident register and reporting templates', 'Restore test records and training records, including management'],
    refs: ['Section 30(1) and (2) BSIG', 'Directive (EU) 2022/2555, Art. 21', 'Implementing Regulation (EU) 2024/2690 for certain digital services'],
    help: 'UniqSuite maps the ten areas as testable requirements and shows where they overlap with ISO 27001.',
    faq: [
      { q: 'Are there binding technical requirements?', a: 'For certain digital services, yes, in Implementing Regulation (EU) 2024/2690. For everyone else: appropriate, proportionate and effective, measured against your risk.' },
      { q: 'Does ISO 27001 cover all ten?', a: 'Largely, in substance. The mapping is a professional assessment, not an official concordance.' },
    ],
  },
  {
    key: 'risk', step: 3, glyph: 'risk', name: 'Risk assessment',
    title: 'Risk assessment', sub: 'What can go wrong and what it would cost.',
    lead: 'A risk assessment answers what can happen, how likely it is and what the consequences would be. It is the core of every ISMS and an obligation under NIS2.',
    what: 'ISO/IEC 27001 clause 6.1.2 requires a defined method with risk acceptance criteria that produces consistent, valid and comparable results when repeated. Risks are identified, assigned to risk owners, analysed and evaluated. Clause 8.2 requires the assessment to be repeated at planned intervals and when significant changes occur.',
    how: [
      'Define the method and the risk acceptance criteria.',
      'Identify risks per service and asset, across all hazards.',
      'Assess likelihood and impact.',
      'Name risk owners and prioritise the results.',
    ],
    mistakes: ['A risk list without a method: the ratings are not comparable.', 'Only cyber attacks, no outages from power, staff or suppliers.', 'Created once, never updated.'],
    evidence: ['Documented method with acceptance criteria', 'Risk register with risk owners', 'Evidence of regular repetition'],
    refs: ['ISO/IEC 27001, clauses 6.1.2 and 8.2', 'Section 30(1) and (2) No. 1 BSIG', 'ISO/IEC 27005 as guidance'],
    help: 'Ratings in UniqSuite follow fixed rules. Two people who answer the same way get the same result. You generate the risk report as PDF, Word or Excel.',
    faq: [
      { q: 'Which method is the right one?', a: 'The standard does not prescribe one. What matters is that it is documented and gives reproducible results. A simple likelihood-impact matrix is often enough.' },
      { q: 'How often is the assessment repeated?', a: 'At planned intervals, in practice usually once a year, and always after significant changes.' },
    ],
  },
  {
    key: 'treat', step: 3, glyph: 'treat', name: 'Risk treatment',
    title: 'Risk treatment', sub: 'Reduce, avoid, transfer or accept.',
    lead: 'For every assessed risk you decide what happens. The result is the risk treatment plan – with measures, owners and deadlines.',
    what: 'ISO/IEC 27001 clause 6.1.3 requires you to select treatment options, determine the necessary controls and compare them with Annex A so that no necessary control is overlooked. Risk owners approve the plan and accept the residual risks. Clause 8.3 requires the plan to be implemented and the results documented.',
    how: [
      'Choose an option for each risk.',
      'Define controls and compare them with Annex A.',
      'Assign owners and deadlines.',
      'Have risk owners accept the residual risks.',
    ],
    mistakes: ['Risks are “accepted” without anyone with authority agreeing.', 'Measures have no deadline and no owner.', 'Residual risk is not reassessed after implementation.'],
    evidence: ['Risk treatment plan', 'Approval and acceptance of residual risk by risk owners', 'Evidence of implementation'],
    refs: ['ISO/IEC 27001, clauses 6.1.3 and 8.3', 'Section 38(1) BSIG: implementation and oversight by management'],
    help: 'In UniqSuite you choose the treatment directly on the risk. Measures go into the plan with owners and deadlines and show up on the dashboard.',
    faq: [
      { q: 'Can we accept a high risk?', a: 'Yes, if it is done consciously, with a justification and the agreement of the responsible management. Under NIS2 your measures must still be appropriate overall.' },
      { q: 'What does risk transfer mean?', a: 'For example insurance or outsourcing to a provider. Accountability for information security stays with you.' },
    ],
  },
  {
    key: 'soa', step: 4, glyph: 'soa', name: 'Statement of Applicability',
    title: 'Statement of Applicability (SoA)', sub: 'Which controls apply, and why.',
    lead: 'The Statement of Applicability shows for each of the 93 controls in Annex A whether it applies, why, and whether it is implemented. It is one of the most important documents in an ISO 27001 audit.',
    what: 'ISO/IEC 27001 clause 6.1.3 d) requires a Statement of Applicability containing the necessary controls, the justification for including them, whether they are implemented, and the justification for excluding any Annex A controls. It links risk treatment and implementation: every included control should trace back to a risk or a requirement.',
    how: [
      'Go through all 93 controls in Annex A.',
      'Mark each as applicable or not applicable, with a justification.',
      'Record the implementation status.',
      'Document version and approval, and maintain the SoA as things change.',
    ],
    mistakes: ['Exclusions say “not relevant” instead of giving a reason.', 'Controls have no link to a risk or requirement.', 'Written once for the audit and never maintained.'],
    evidence: ['Approved SoA with version', 'References to risks and evidence', 'Change history'],
    refs: ['ISO/IEC 27001, clause 6.1.3 d)', 'ISO/IEC 27001, Annex A: 93 controls', 'ISO/IEC 42001 requires its own Statement of Applicability for its Annex A'],
    help: 'In UniqSuite the Statement of Applicability is built from your answers and justifications. You do not have to write it by hand.',
    faq: [
      { q: 'How many controls can we exclude?', a: 'There is no quota. Every exclusion needs a traceable justification, for example because there is no in-house software development.' },
      { q: 'Does NIS2 require an SoA?', a: 'The law does not require one explicitly. As evidence of which measures you implement and why, it is very useful.' },
    ],
  },
  {
    key: 'policy', step: 4, glyph: 'policies', name: 'Policies',
    title: 'Information security policy and topic-specific policies', sub: 'Management’s direction, in writing.',
    lead: 'The information security policy sets management’s direction, and topic-specific policies cover the details. Both must be approved, communicated and reviewed regularly.',
    what: 'ISO/IEC 27001 clause 5.2 requires an information security policy from top management, with objectives and a commitment to meet requirements and to improve continually. Annex A 5.1 adds topic-specific policies that are approved by management, published, communicated to staff and reviewed at planned intervals.',
    how: [
      'Write a policy with objectives and management’s accountability.',
      'Add topic-specific policies, for example on access, cryptography, backup and mobile devices.',
      'Approve, communicate and record acknowledgement.',
      'Review at planned intervals and when things change.',
    ],
    mistakes: ['Policies from templates that nobody follows.', 'No approval by management.', 'Staff do not know the rules.'],
    evidence: ['Approved policy with date and version', 'Register of policies', 'Evidence of communication and acknowledgement'],
    refs: ['ISO/IEC 27001, clause 5.2', 'ISO/IEC 27001, Annex A 5.1', 'Section 30(2) No. 1 BSIG: policies on risk analysis and information system security'],
    help: 'In UniqSuite you start from a template that shows which requirements it covers, adapt it and send it for approval. The status is recorded.',
    faq: [
      { q: 'How many policies do we need?', a: 'As many as your risks and measures call for. A few that people follow beat a folder nobody reads.' },
      { q: 'Who approves the policy?', a: 'Top management. Under NIS2 this fits its duty to implement and oversee the measures.' },
    ],
  },
  {
    key: 'audit', step: 5, glyph: 'audit', name: 'Internal audit',
    title: 'Internal audit', sub: 'Check yourself before others do.',
    lead: 'In an internal audit you check whether your management system meets the requirements and is effectively implemented – before an external auditor arrives.',
    what: 'ISO/IEC 27001 clause 9.2 requires internal audits at planned intervals under an audit programme with frequency, methods, responsibilities and reporting. Auditors must be objective and impartial, and results go to the relevant management. Under NIS2, assessing effectiveness is one of the minimum measures (Section 30(2) No. 6 BSIG).',
    how: [
      'Plan an audit programme for the cycle.',
      'Set criteria and scope for each audit.',
      'Audit with interviews, samples and evidence.',
      'Report findings and start corrective action.',
    ],
    mistakes: ['The auditor checks their own work.', 'The audit stays a document review without sampling in operations.', 'Findings have no corrective action and no deadline.'],
    evidence: ['Audit programme and audit plan', 'Audit reports with findings', 'Follow-up of corrective actions'],
    refs: ['ISO/IEC 27001, clause 9.2', 'ISO/IEC 27001, clause 10.2: nonconformity and corrective action', 'Section 30(2) No. 6 BSIG', 'ISO 19011 as guidance for auditing'],
    help: 'In UniqSuite you plan audits, record findings and create a corrective action with owner and deadline for each. You generate the audit report at the push of a button.',
    faq: [
      { q: 'Who may audit internally?', a: 'Someone objective and impartial, who does not audit their own work. That can be staff from other areas or external auditors.' },
      { q: 'How often do we audit?', a: 'At planned intervals. It is common to cover all areas within a certification cycle and important areas every year.' },
    ],
  },
  {
    key: 'review', step: 5, glyph: 'review', name: 'Management review',
    title: 'Management review', sub: 'Management decides what changes.',
    lead: 'In the management review, top management checks whether the management system is still suitable, adequate and effective – and decides what needs to change.',
    what: 'ISO/IEC 27001 clause 9.3 requires a review at planned intervals. Inputs include the status of previous decisions, changes in context, feedback on performance such as nonconformities, measurement results, audit results and the fulfilment of objectives, the results of risk assessment and opportunities for improvement. The output is decisions on improvements and needed changes. Under NIS2 this matches management’s duty to oversee implementation (Section 38 BSIG).',
    how: [
      'Set the date and participants; management attends.',
      'Prepare the inputs: metrics, audit results, incidents, risks.',
      'Decide: resources, objectives, changes.',
      'Minute decisions with owners and deadlines.',
    ],
    mistakes: ['A presentation without decisions.', 'Management only takes note by email.', 'Decisions are not followed up.'],
    evidence: ['Minutes covering all required inputs', 'Decisions with owners and deadlines', 'Evidence of implementation in the next cycle'],
    refs: ['ISO/IEC 27001, clause 9.3', 'ISO/IEC 27001, clause 10.1: continual improvement', 'Section 38(1) BSIG'],
    help: 'The management report in UniqSuite summarises status, trend, open measures and risks – a good basis for the management review.',
    faq: [
      { q: 'How often does it take place?', a: 'At planned intervals, in practice at least once a year.' },
      { q: 'Is a monthly report enough?', a: 'It makes oversight easier but does not replace the formal review with decisions.' },
    ],
  },
];

export const topics: Record<Lang, Topic[]> = { de, en };
export const topicsForStep = (lang: Lang, step: number) => topics[lang].filter((t) => t.step === step);
