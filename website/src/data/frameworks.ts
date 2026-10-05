/**
 * Regelwerksseiten (/de/regelwerke/…, /en/frameworks/…): was das Regelwerk verlangt,
 * für wen es gilt, welche Fristen laufen. Fakten nur mit Quelle (Rechtstext, Norm,
 * BSI, EU-Kommission); Stand Oktober 2026. Keine Rechtsberatung.
 */
import type { Lang } from '../config';

export type Fw = 'nis2' | 'iso27001' | 'aiact' | 'iso42001' | 'cra';
export type Framework = {
  fw: Fw;
  slug: string;
  name: string;
  kind: string;
  title: string;
  sub: string;
  lead: string;
  facts: { k: string; v: string }[];
  whoTitle: string;
  who: string[];
  whatTitle: string;
  what: { h: string; t: string }[];
  dates: { d: string; t: string }[];
  overlap: string;
  faq: { q: string; a: string }[];
  sources: string[];
};

export const fwOrder: Fw[] = ['nis2', 'iso27001', 'aiact', 'iso42001', 'cra'];
const slugs: Record<Fw, string> = { nis2: 'nis2', iso27001: 'iso-27001', aiact: 'ai-act', iso42001: 'iso-42001', cra: 'cyber-resilience-act' };
export const fwHref = (lang: Lang, fw: Fw) => (lang === 'de' ? `/de/regelwerke/${slugs[fw]}/` : `/en/frameworks/${slugs[fw]}/`);

const de: Framework[] = [
  {
    fw: 'nis2', slug: slugs.nis2, name: 'NIS2', kind: 'Gesetz · NIS2UmsuCG / BSI-Gesetz',
    title: 'NIS2 in Deutschland', sub: 'Pflichten für wichtige und besonders wichtige Einrichtungen.',
    lead: 'Die NIS2-Richtlinie der EU gilt in Deutschland über das neue BSI-Gesetz. Seit dem 6. Dezember 2025 müssen betroffene Unternehmen Risiken steuern, erhebliche Vorfälle melden, sich beim BSI registrieren und ihre Geschäftsleitung in die Pflicht nehmen.',
    facts: [
      { k: 'Rechtsgrundlage', v: 'Richtlinie (EU) 2022/2555, umgesetzt durch das NIS2UmsuCG (BGBl. 2025 I Nr. 301)' },
      { k: 'Gilt seit', v: '6. Dezember 2025, ohne Übergangsfrist' },
      { k: 'Aufsicht', v: 'Bundesamt für Sicherheit in der Informationstechnik (BSI)' },
      { k: 'Bußgelder', v: 'Bis 10 Mio. € (besonders wichtige) bzw. 7 Mio. € (wichtige Einrichtungen); bei über 500 Mio. € Umsatz bis 2 % bzw. 1,4 % des weltweiten Umsatzes (§ 65 BSIG)' },
    ],
    whoTitle: 'Für wen NIS2 gilt',
    who: [
      'Unternehmen in 18 Sektoren, darunter Energie, Transport, Gesundheit, digitale Infrastruktur, Abfallwirtschaft, Chemie, Lebensmittel und verarbeitendes Gewerbe.',
      'In der Regel ab 50 Beschäftigten oder mehr als 10 Mio. € Jahresumsatz und Bilanzsumme. Große Unternehmen in Sektoren hoher Kritikalität gelten als besonders wichtig.',
      'Einige Anbieter sind unabhängig von der Größe erfasst, etwa Anbieter von DNS-Diensten oder qualifizierte Vertrauensdiensteanbieter.',
      'Ob Sie betroffen sind, prüfen Sie selbst. Das BSI bietet dafür eine Betroffenheitsprüfung an.',
    ],
    whatTitle: 'Was NIS2 verlangt',
    what: [
      { h: 'Risikomanagement (§ 30 BSIG)', t: 'Zehn Mindestmaßnahmen, darunter Risikoanalyse, Vorfallsbehandlung, Notfallplanung, Lieferkettensicherheit, Zugriffskontrolle und Schulungen.' },
      { h: 'Meldepflichten (§ 32 BSIG)', t: 'Erhebliche Sicherheitsvorfälle: frühe Erstmeldung in 24 Stunden, Meldung mit erster Bewertung in 72 Stunden, Abschlussmeldung spätestens einen Monat nach der Meldung.' },
      { h: 'Registrierung (§ 33 BSIG)', t: 'Registrierung beim BSI innerhalb von drei Monaten. Die Frist lief im März 2026 ab. Wer sich noch nicht registriert hat, holt das unverzüglich nach.' },
      { h: 'Geschäftsleitung (§ 38 BSIG)', t: 'Die Leitung muss die Maßnahmen umsetzen, ihre Umsetzung überwachen und regelmäßig an Schulungen teilnehmen. Bei schuldhaften Pflichtverletzungen haftet sie der Einrichtung für den Schaden.' },
    ],
    dates: [
      { d: '16. Jan. 2023', t: 'Richtlinie (EU) 2022/2555 tritt in Kraft' },
      { d: '6. Dez. 2025', t: 'NIS2UmsuCG und neues BSI-Gesetz gelten' },
      { d: 'März 2026', t: 'Registrierungsfrist beim BSI abgelaufen' },
    ],
    overlap: 'UniqSuite führt Sie Thema für Thema durch die Anforderungen: von der Registrierung über die zehn Mindestmaßnahmen bis zu den Pflichten der Leitung. Stufen Sie einen Vorfall als erheblich ein, zeigt UniqSuite die fälligen Meldungen und überwacht die Fristen.',
    faq: [
      { q: 'Reicht eine ISO-27001-Zertifizierung für NIS2?', a: 'Nein. Sie ist ein starkes Indiz für funktionierendes Risikomanagement, ersetzt aber weder die Meldepflichten noch die Registrierung oder die Pflichten der Geschäftsleitung.' },
      { q: 'Gibt es ein NIS2-Zertifikat?', a: 'Nein. Das Gesetz kennt keine allgemeine Zertifizierung. Sie müssen die Umsetzung auf Nachfrage des BSI belegen können.' },
      { q: 'Gilt NIS2 für Kommunen?', a: 'Für die Kommunalverwaltung gelten die Regelungen Ihres Bundeslandes. Kommunale Unternehmen können dagegen unmittelbar unter das BSI-Gesetz fallen.' },
      { q: 'Wir sind Zulieferer einer betroffenen Einrichtung. Gilt NIS2 auch für uns?', a: 'Nicht unmittelbar, solange Sie selbst nicht unter das BSI-Gesetz fallen. Betroffene Einrichtungen müssen aber die Sicherheit ihrer Lieferkette steuern (§ 30 Abs. 2 Nr. 4 BSIG). Rechnen Sie deshalb mit Sicherheitsanforderungen in Verträgen und Lieferantenbewertungen.' },
      { q: 'Womit sollten wir anfangen?', a: 'Prüfen Sie zuerst, ob Ihre Einrichtung betroffen ist, und registrieren Sie sich dann beim BSI. Richten Sie danach einen Meldeprozess ein, der die 24-Stunden-Frist einhält, und planen Sie die Risikomanagementmaßnahmen nach § 30 BSIG. Wo Sie stehen, zeigt der kostenlose Quick-Check von UniqSuite in etwa zwei Minuten, ohne Anmeldung.' },
    ],
    sources: ['Richtlinie (EU) 2022/2555', 'NIS2UmsuCG, BGBl. 2025 I Nr. 301', 'BSI: NIS-2-Betroffenheitsprüfung und Registrierung'],
  },
  {
    fw: 'iso27001', slug: slugs.iso27001, name: 'ISO/IEC 27001', kind: 'Internationale Norm · zertifizierbar',
    title: 'ISO/IEC 27001:2022', sub: 'Das Managementsystem für Informationssicherheit.',
    lead: 'ISO/IEC 27001 beschreibt, wie eine Organisation Informationssicherheit planvoll steuert: Risiken erkennen, Maßnahmen festlegen, Wirksamkeit prüfen, besser werden. Ein akkreditierter Zertifizierer bestätigt das nach einem Audit.',
    facts: [
      { k: 'Aktuelle Fassung', v: 'ISO/IEC 27001:2022; die Übergangsfrist von der Fassung 2013 endete am 31. Oktober 2025' },
      { k: 'Aufbau', v: 'Abschnitte 4 bis 10 (Managementsystem) und Anhang A mit 93 Maßnahmen' },
      { k: 'Anhang A', v: '37 organisatorische, 8 personenbezogene, 14 physische und 34 technologische Maßnahmen' },
      { k: 'Zertifikat', v: 'Drei Jahre gültig, mit jährlichen Überwachungsaudits' },
    ],
    whoTitle: 'Für wen ISO 27001 passt',
    who: [
      'Jede Organisation, unabhängig von Größe und Branche, die Informationssicherheit nachvollziehbar steuern will.',
      'Unternehmen, deren Kunden oder Auftraggeber einen Nachweis verlangen, etwa in Ausschreibungen oder Lieferantenbewertungen.',
      'Einrichtungen unter NIS2, die ihr Risikomanagement auf ein bewährtes Gerüst stellen wollen.',
    ],
    whatTitle: 'Was ISO 27001 verlangt',
    what: [
      { h: 'Kontext und Geltungsbereich', t: 'Interessierte Parteien, Anforderungen und Grenzen des ISMS festlegen und begründen.' },
      { h: 'Risikobeurteilung und -behandlung', t: 'Eine dokumentierte Methode, ein Risikoregister und ein Behandlungsplan mit verantwortlichen Personen.' },
      { h: 'Erklärung zur Anwendbarkeit', t: 'Für jede der 93 Maßnahmen: anwendbar oder nicht, mit Begründung und Umsetzungsstand.' },
      { h: 'Bewertung und Verbesserung', t: 'Kennzahlen, interne Audits, Managementbewertung und Korrekturmaßnahmen, Jahr für Jahr.' },
    ],
    dates: [
      { d: 'Okt. 2022', t: 'ISO/IEC 27001:2022 veröffentlicht' },
      { d: '31. Okt. 2025', t: 'Zertifikate nach der Fassung 2013 sind ausgelaufen' },
    ],
    overlap: 'UniqSuite führt Sie durch die Abschnitte 4 bis 10 und die 93 Maßnahmen aus Anhang A und erstellt daraus Ihre Erklärung zur Anwendbarkeit. Wo ein anderes Regelwerk dieselbe Anforderung stellt, zählt Ihre Antwort dort mit.',
    faq: [
      { q: 'Müssen alle 93 Maßnahmen umgesetzt werden?', a: 'Nein. Sie entscheiden anhand Ihrer Risiken, welche gelten, und begründen Ausschlüsse in der Erklärung zur Anwendbarkeit.' },
      { q: 'Wie lange dauert der Weg zum Zertifikat?', a: 'Das hängt von Größe und Vorarbeit ab. Entscheidend ist, dass das ISMS einige Monate gelebt wurde, bevor das Zertifizierungsaudit stattfindet.' },
      { q: 'Ist ISO 27001 gesetzlich vorgeschrieben?', a: 'Nein, die Norm ist freiwillig. Das BSI-Gesetz verlangt von NIS2-Einrichtungen, die einschlägigen europäischen und internationalen Normen zu berücksichtigen, schreibt aber keine bestimmte Norm vor (§ 30 Abs. 2 BSIG).' },
      { q: 'Was ist der Unterschied zum IT-Grundschutz des BSI?', a: 'IT-Grundschutz ist die Methodik des BSI, mit der Sie auch die Anforderungen von ISO 27001 erfüllen. Bei einer ISO-27001-Zertifizierung auf der Basis von IT-Grundschutz prüft ein vom BSI zertifizierter Auditor, und das BSI stellt das Zertifikat aus.' },
      { q: 'Was ändert die Klima-Ergänzung von 2024?', a: 'Mit ISO/IEC 27001:2022/Amd 1:2024 müssen Sie bei der Bestimmung Ihres Kontexts prüfen, ob der Klimawandel ein relevantes Thema ist (Abschnitt 4.1). Ein Hinweis in Abschnitt 4.2 ergänzt, dass interessierte Parteien Anforderungen zum Klimawandel haben können.' },
    ],
    sources: ['ISO/IEC 27001:2022, iso.org', 'IAF MD 26 (Übergang auf die Fassung 2022)'],
  },
  {
    fw: 'aiact', slug: slugs.aiact, name: 'EU AI Act', kind: 'Verordnung (EU) 2024/1689',
    title: 'Die KI-Verordnung der EU', sub: 'Regeln für alle, die KI anbieten oder einsetzen.',
    lead: 'Der AI Act ordnet KI nach Risiko. Manche Praktiken sind verboten, Hochrisiko-KI unterliegt strengen Pflichten, für andere Systeme gelten Transparenzregeln. Die Pflichten treten gestaffelt in Kraft, einige gelten schon.',
    facts: [
      { k: 'Rechtsgrundlage', v: 'Verordnung (EU) 2024/1689, geändert durch die Verordnung (EU) 2026/1744' },
      { k: 'In Kraft seit', v: '1. August 2024; Pflichten gestaffelt bis 2028' },
      { k: 'Rollen', v: 'Anbieter, Betreiber, Einführer, Händler – wer KI nur im eigenen Betrieb nutzt, ist Betreiber' },
      { k: 'Bußgelder', v: 'Bis 35 Mio. € oder 7 % des weltweiten Umsatzes bei verbotenen Praktiken; bis 15 Mio. € oder 3 % bei anderen Pflichten (Art. 99)' },
    ],
    whoTitle: 'Für wen der AI Act gilt',
    who: [
      'Anbieter, die KI-Systeme entwickeln oder unter eigenem Namen in Verkehr bringen.',
      'Betreiber, die KI-Systeme im eigenen Betrieb nutzen, vom Chat-Assistenten bis zur Bewerberauswahl.',
      'Auch Unternehmen außerhalb der EU, wenn ihre KI in der EU genutzt wird.',
    ],
    whatTitle: 'Was der AI Act verlangt',
    what: [
      { h: 'Verbotene Praktiken (Art. 5)', t: 'Etwa Social Scoring oder manipulative Techniken. Gilt seit dem 2. Februar 2025. Ab dem 2. Dezember 2026 ist auch KI verboten, die nicht einvernehmliche intime Bilder oder Darstellungen sexuellen Kindesmissbrauchs erzeugt.' },
      { h: 'KI-Kompetenz (Art. 4)', t: 'Wer KI anbietet oder betreibt, ergreift Maßnahmen, um die KI-Kompetenz der Beschäftigten zu fördern. Gilt seit dem 2. Februar 2025.' },
      { h: 'Transparenz (Art. 50)', t: 'Menschen müssen erkennen können, dass sie mit KI sprechen oder KI-erzeugte Inhalte sehen. Gilt seit dem 2. August 2026. Systeme, die vorher in Verkehr gebracht wurden, müssen KI-Inhalte ab dem 2. Dezember 2026 kennzeichnen.' },
      { h: 'Hochrisiko-KI', t: 'Risikomanagement, Datenqualität, Protokollierung, menschliche Aufsicht und Konformitätsbewertung. Für Anhang III ab dem 2. Dezember 2027.' },
    ],
    dates: [
      { d: '2. Feb. 2025', t: 'Verbote und KI-Kompetenz gelten' },
      { d: '2. Aug. 2025', t: 'Pflichten für KI-Modelle mit allgemeinem Verwendungszweck' },
      { d: '2. Aug. 2026', t: 'Transparenzpflichten nach Art. 50' },
      { d: '2. Dez. 2026', t: 'Neues Verbot nach Art. 5; Kennzeichnung nach Art. 50 Abs. 2 auch für ältere Systeme' },
      { d: '2. Dez. 2027', t: 'Hochrisiko-KI nach Anhang III (verschoben durch die Verordnung (EU) 2026/1744)' },
      { d: '2. Aug. 2028', t: 'Hochrisiko-KI in Produkten nach Anhang I (verschoben durch die Verordnung (EU) 2026/1744)' },
    ],
    overlap: 'UniqSuite beginnt mit einem KI-Register: welche Systeme es gibt, wer sie nutzt, welche Rolle Sie haben und in welche Risikoklasse sie fallen. Daraus ergibt sich, welche Pflichten des AI Act Sie für jedes System prüfen.',
    faq: [
      { q: 'Wir nutzen nur einen Chat-Assistenten. Betrifft uns das?', a: 'Ja, als Betreiber. Schon heute müssen Sie Maßnahmen ergreifen, um die KI-Kompetenz Ihrer Beschäftigten zu fördern, und je nach Einsatz kommen Transparenzpflichten hinzu.' },
      { q: 'Gilt der AI Act zusätzlich zu NIS2?', a: 'Ja. Beide gelten unabhängig voneinander. Viele Maßnahmen, etwa Zugriffskontrolle und Protokollierung, helfen aber bei beiden.' },
      { q: 'Wann gilt ein KI-System als hochriskant?', a: 'Wenn es in einem der Bereiche aus Anhang III eingesetzt wird, etwa bei der Auswahl von Bewerbern oder der Prüfung der Kreditwürdigkeit. Hochriskant ist auch KI, die Sicherheitsbauteil eines Produkts nach Anhang I oder selbst ein solches Produkt ist, wenn das Produkt von Dritten geprüft werden muss. Ein System aus Anhang III ist ausnahmsweise nicht hochriskant, wenn es kein erhebliches Risiko für Gesundheit, Sicherheit oder Grundrechte birgt. Erstellt es Profile von Personen, ist es immer hochriskant (Art. 6).' },
      { q: 'Wie weisen wir die KI-Kompetenz nach?', a: 'Ein Zertifikat verlangt die Verordnung nicht. Dokumentieren Sie Ihre Maßnahmen, etwa Art und Umfang der Schulungen und wer daran teilgenommen hat.' },
      { q: 'Was gilt für Behörden und öffentliche Stellen?', a: 'Einrichtungen des öffentlichen Rechts und private Einrichtungen, die öffentliche Dienste erbringen, müssen vor dem Einsatz eines Hochrisiko-KI-Systems nach Anhang III eine Grundrechte-Folgenabschätzung durchführen (Art. 27). Ausgenommen sind Systeme für kritische Infrastruktur. Die Pflicht gilt ab dem 2. Dezember 2027.' },
    ],
    sources: ['Verordnung (EU) 2024/1689', 'Verordnung (EU) 2026/1744'],
  },
  {
    fw: 'iso42001', slug: slugs.iso42001, name: 'ISO/IEC 42001', kind: 'Internationale Norm · zertifizierbar',
    title: 'ISO/IEC 42001:2023', sub: 'Das Managementsystem für künstliche Intelligenz.',
    lead: 'ISO/IEC 42001 ist die erste zertifizierbare Norm für ein Managementsystem für künstliche Intelligenz. Sie folgt der einheitlichen Struktur der ISO-Managementsystemnormen und enthält eigene Maßnahmen für Daten, Lebenszyklus und Folgenabschätzung von KI-Systemen.',
    facts: [
      { k: 'Veröffentlicht', v: 'Dezember 2023' },
      { k: 'Aufbau', v: 'Abschnitte 4 bis 10 (Managementsystem) und Anhang A mit 38 Maßnahmen in 9 Maßnahmenzielen (A.2 bis A.10)' },
      { k: 'Besonderheit', v: 'Folgenabschätzung für KI-Systeme: Auswirkungen auf Personen und Gesellschaft' },
      { k: 'Zertifikat', v: 'Durch Zertifizierungsstellen, die für ISO/IEC 42001 akkreditiert sind; die Anforderungen an diese Stellen regelt ISO/IEC 42006' },
    ],
    whoTitle: 'Für wen ISO 42001 passt',
    who: [
      'Organisationen, die KI entwickeln, anbieten oder im eigenen Betrieb einsetzen.',
      'Unternehmen, die sich auf den AI Act vorbereiten und dafür ein geordnetes Gerüst suchen.',
      'Organisationen, die Kunden oder Auftraggebern nachweisen wollen, dass sie KI verantwortungsvoll steuern.',
    ],
    whatTitle: 'Was ISO 42001 verlangt',
    what: [
      { h: 'KI-Richtlinie und Rollen', t: 'Eine Leitlinie für KI, klare Zuständigkeiten und Wege, Bedenken zu melden.' },
      { h: 'Folgenabschätzung', t: 'Auswirkungen eines KI-Systems auf Personen, Gruppen und Gesellschaft bewerten und dokumentieren.' },
      { h: 'Lebenszyklus und Daten', t: 'Anforderungen, Entwicklung, Prüfung, Betrieb und Herkunft sowie Qualität der Daten steuern.' },
      { h: 'Nutzung und Dritte', t: 'Bestimmungsgemäße Nutzung, Information der Betroffenen und Regeln für Lieferanten und Kunden.' },
    ],
    dates: [
      { d: 'Dez. 2023', t: 'ISO/IEC 42001:2023 veröffentlicht' },
    ],
    overlap: 'UniqSuite führt Sie in klaren Fragen durch die Anforderungen der Norm. Ihr KI-Register aus der KI-Governance dient dabei als Nachweis für das KI-Inventar. Wo dieselbe Anforderung auch in einem anderen Regelwerk gilt, zählt Ihre Antwort dort mit.',
    faq: [
      { q: 'Ersetzt ISO 42001 den AI Act?', a: 'Nein. Die Norm ist freiwillig, der AI Act ist Gesetz. Sie hilft aber, viele Pflichten des AI Act geordnet umzusetzen und zu belegen.' },
      { q: 'Brauchen wir dafür ISO 27001?', a: 'Nein, ISO 42001 steht für sich. Beide Normen folgen derselben Grundstruktur für Managementsysteme. Wer ISO 27001 schon hat, kann deshalb Abläufe wie Dokumentenlenkung, interne Audits und Managementbewertung gemeinsam nutzen.' },
      { q: 'Woran erkennen wir eine geeignete Zertifizierungsstelle?', a: 'Achten Sie auf eine Akkreditierung für ISO/IEC 42001. Welche Anforderungen solche Stellen und ihre Auditoren erfüllen müssen, legt seit Juli 2025 die Norm ISO/IEC 42006 fest.' },
      { q: 'Welche Normen helfen bei der Umsetzung?', a: 'ISO/IEC 42005 gibt Hinweise zur Folgenabschätzung für KI-Systeme, ISO/IEC 23894 zum Risikomanagement für KI. Beide sind Leitfäden, die ISO 42001 ergänzen.' },
      { q: 'Womit fangen wir an?', a: 'Erfassen Sie zuerst Ihre KI-Systeme und legen Sie den Geltungsbereich fest. Darauf bauen KI-Leitlinie, Risikobeurteilung und Folgenabschätzung auf. Wo Sie stehen, zeigt der kostenlose Quick-Check von UniqSuite in etwa zwei Minuten, ohne Anmeldung.' },
    ],
    sources: ['ISO/IEC 42001:2023, iso.org'],
  },
  {
    fw: 'cra', slug: slugs.cra, name: 'Cyber Resilience Act', kind: 'Verordnung (EU) 2024/2847',
    title: 'Der Cyber Resilience Act', sub: 'Sicherheit für Produkte mit digitalen Elementen.',
    lead: 'Der CRA verlangt, dass Hardware und Software mit digitalen Elementen über ihren ganzen Lebenszyklus sicher sind. Hersteller müssen Schwachstellen behandeln, Updates liefern und Vorfälle melden. Die ersten Meldepflichten gelten seit September 2026.',
    facts: [
      { k: 'Rechtsgrundlage', v: 'Verordnung (EU) 2024/2847, in Kraft seit dem 10. Dezember 2024' },
      { k: 'Meldepflichten', v: 'Seit dem 11. September 2026 (Art. 14)' },
      { k: 'Gilt vollständig', v: 'Ab dem 11. Dezember 2027, mit CE-Kennzeichnung nach CRA' },
      { k: 'Bußgelder', v: 'Bis 15 Mio. € oder 2,5 % des weltweiten Jahresumsatzes, je nachdem, was höher ist' },
    ],
    whoTitle: 'Für wen der CRA gilt',
    who: [
      'Hersteller von Produkten mit digitalen Elementen, von Software bis zum vernetzten Gerät.',
      'Importeure und Händler, die solche Produkte in der EU anbieten.',
      'Nicht erfasst sind Bereiche mit eigenen Regeln, etwa Medizinprodukte, Fahrzeuge oder Luftfahrt.',
    ],
    whatTitle: 'Was der CRA verlangt',
    what: [
      { h: 'Sicherheit von Anfang an', t: 'Grundlegende Anforderungen aus Anhang I: sichere Voreinstellungen, Schutz vor unbefugtem Zugriff, möglichst kleine Angriffsfläche.' },
      { h: 'Schwachstellenmanagement', t: 'Schwachstellen erkennen, dokumentieren und zügig mit Sicherheitsupdates beheben, über den gesamten Unterstützungszeitraum.' },
      { h: 'Meldepflichten (Art. 14)', t: 'Aktiv ausgenutzte Schwachstellen und schwere Vorfälle: Frühwarnung in 24 Stunden, Meldung in 72 Stunden, Abschlussbericht spätestens 14 Tage, nachdem eine Korrektur verfügbar ist (Schwachstelle), bzw. einen Monat nach der Meldung (Vorfall) – an das koordinierende CSIRT und die ENISA.' },
      { h: 'Konformität', t: 'Technische Dokumentation, Konformitätsbewertung und CE-Kennzeichnung, bevor ein Produkt in Verkehr kommt.' },
    ],
    dates: [
      { d: '10. Dez. 2024', t: 'CRA tritt in Kraft' },
      { d: '11. Sep. 2026', t: 'Meldepflichten für Hersteller gelten' },
      { d: '11. Dez. 2027', t: 'Alle Pflichten gelten, CE-Kennzeichnung nach CRA' },
    ],
    overlap: 'UniqSuite führt Sie durch die Anforderungen des CRA: vom Unterstützungszeitraum über die Software-Stückliste bis zur Konformitätserklärung. Stufen Sie einen Vorfall als aktiv ausgenutzte Schwachstelle oder schweren Vorfall ein, zeigt UniqSuite die fälligen Meldungen und ihre Fristen.',
    faq: [
      { q: 'Wir verkaufen nur Software. Gilt der CRA?', a: 'In vielen Fällen ja. Reine Software kann ein Produkt mit digitalen Elementen sein. Ausnahmen gibt es etwa für bestimmte Open-Source-Software außerhalb einer Geschäftstätigkeit.' },
      { q: 'Gelten die Meldepflichten auch für ältere Produkte?', a: 'Ja. Die Meldepflichten seit September 2026 gelten auch für Produkte, die bereits vor Dezember 2027 in Verkehr gebracht wurden.' },
      { q: 'Wie lange müssen wir Sicherheitsupdates liefern?', a: 'Während des gesamten Unterstützungszeitraums, und der beträgt mindestens fünf Jahre. Ist ein Produkt voraussichtlich kürzer in Gebrauch, richtet er sich nach dieser Nutzungsdauer (Art. 13 Abs. 8). Jedes bereitgestellte Sicherheitsupdate muss mindestens zehn Jahre lang verfügbar bleiben (Art. 13 Abs. 9).' },
      { q: 'Brauchen wir eine Prüfung durch Dritte?', a: 'Für Produkte ohne besondere Einstufung genügt die interne Kontrolle durch den Hersteller. Wichtige Produkte der Klasse I, etwa Router oder Passwortmanager, brauchen eine Prüfung durch Dritte, wenn Sie harmonisierte Normen nicht vollständig anwenden. Für Klasse II, etwa Firewalls, ist sie immer nötig (Art. 32).' },
      { q: 'Womit fangen Hersteller an?', a: 'Prüfen Sie, welche Ihrer Produkte unter den CRA fallen und ob sie als wichtig oder kritisch eingestuft sind, und richten Sie einen Prozess für die bereits geltenden Meldepflichten ein. Bauen Sie außerdem eine Software-Stückliste (SBOM) in maschinenlesbarer Form auf, wie Anhang I sie verlangt. Wo Sie stehen, zeigt der kostenlose Quick-Check von UniqSuite in etwa zwei Minuten, ohne Anmeldung.' },
    ],
    sources: ['Verordnung (EU) 2024/2847', 'EU-Kommission: Meldepflichten nach dem CRA'],
  },
];

const en: Framework[] = [
  {
    fw: 'nis2', slug: slugs.nis2, name: 'NIS2', kind: 'Law · German NIS2 Implementation Act / BSI Act',
    title: 'NIS2 in Germany', sub: 'Obligations for important and essential entities.',
    lead: 'The EU NIS2 Directive applies in Germany through the new BSI Act. Since 6 December 2025, entities in scope must manage cyber risks, report significant incidents, register with the BSI and hold their management accountable.',
    facts: [
      { k: 'Legal basis', v: 'Directive (EU) 2022/2555, transposed by the NIS2UmsuCG (Federal Law Gazette 2025 I No. 301)' },
      { k: 'Applies since', v: '6 December 2025, with no transition period' },
      { k: 'Supervision', v: 'Federal Office for Information Security (BSI)' },
      { k: 'Fines', v: 'Up to €10m (essential) or €7m (important entities); above €500m turnover up to 2% or 1.4% of worldwide turnover (Section 65 BSIG)' },
    ],
    whoTitle: 'Who NIS2 applies to',
    who: [
      'Companies in 18 sectors, including energy, transport, health, digital infrastructure, waste management, chemicals, food and manufacturing.',
      'As a rule from 50 employees or more than €10m in annual turnover and balance sheet total. Large companies in sectors of high criticality count as essential.',
      'Some providers are covered regardless of size, such as DNS service providers or qualified trust service providers.',
      'Whether you are in scope is for you to assess. The BSI offers an online check for this.',
    ],
    whatTitle: 'What NIS2 requires',
    what: [
      { h: 'Risk management (Section 30 BSIG)', t: 'Ten minimum measures, including risk analysis, incident handling, business continuity, supply chain security, access control and training.' },
      { h: 'Reporting (Section 32 BSIG)', t: 'Significant incidents: early warning within 24 hours, notification with an initial assessment within 72 hours, final report no later than one month after the notification.' },
      { h: 'Registration (Section 33 BSIG)', t: 'Registration with the BSI within three months. The deadline passed in March 2026. If you have not registered yet, do so without delay.' },
      { h: 'Management (Section 38 BSIG)', t: 'Management must implement the measures, oversee their implementation and attend training regularly. If it culpably breaches these duties, it is liable to the entity for the damage.' },
    ],
    dates: [
      { d: '16 Jan 2023', t: 'Directive (EU) 2022/2555 enters into force' },
      { d: '6 Dec 2025', t: 'NIS2UmsuCG and the new BSI Act apply' },
      { d: 'March 2026', t: 'BSI registration deadline passed' },
    ],
    overlap: 'UniqSuite takes you through the requirements topic by topic, from registration through the ten minimum measures to the duties of management. Classify an incident as significant and UniqSuite shows the reports that are due and tracks the deadlines.',
    faq: [
      { q: 'Is ISO 27001 certification enough for NIS2?', a: 'No. It is strong evidence of working risk management, but it does not replace reporting, registration or the duties of management.' },
      { q: 'Is there a NIS2 certificate?', a: 'No. The law has no general certification. You must be able to demonstrate implementation when the BSI asks.' },
      { q: 'Does NIS2 apply to municipalities?', a: 'Municipal administrations fall under the rules of their federal state. Municipal companies, however, can fall directly under the BSI Act.' },
      { q: 'We supply an entity in scope. Does NIS2 apply to us?', a: 'Not directly, as long as you are not in scope of the BSI Act yourself. Entities in scope must, however, manage the security of their supply chain (Section 30(2) no. 4 BSIG). Expect security requirements in contracts and supplier assessments as a result.' },
      { q: 'Where should we start?', a: 'First check whether your organisation is in scope, then register with the BSI. Next, set up a reporting process that meets the 24-hour deadline and plan the risk management measures under Section 30 BSIG. The free UniqSuite quick check shows where you stand in about two minutes, with no sign-up.' },
    ],
    sources: ['Directive (EU) 2022/2555', 'NIS2UmsuCG, BGBl. 2025 I No. 301', 'BSI: NIS2 scope check and registration'],
  },
  {
    fw: 'iso27001', slug: slugs.iso27001, name: 'ISO/IEC 27001', kind: 'International standard · certifiable',
    title: 'ISO/IEC 27001:2022', sub: 'The management system for information security.',
    lead: 'ISO/IEC 27001 describes how an organisation manages information security with a plan: identify risks, choose controls, check that they work, improve. An accredited certification body confirms this after an audit.',
    facts: [
      { k: 'Current edition', v: 'ISO/IEC 27001:2022; the transition period from the 2013 edition ended on 31 October 2025' },
      { k: 'Structure', v: 'Clauses 4 to 10 (management system) and Annex A with 93 controls' },
      { k: 'Annex A', v: '37 organisational, 8 people, 14 physical and 34 technological controls' },
      { k: 'Certificate', v: 'Valid for three years, with annual surveillance audits' },
    ],
    whoTitle: 'Who ISO 27001 suits',
    who: [
      'Any organisation, regardless of size or sector, that wants to manage information security in a traceable way.',
      'Companies whose customers ask for evidence, for example in tenders or supplier assessments.',
      'Entities under NIS2 that want to build their risk management on a proven framework.',
    ],
    whatTitle: 'What ISO 27001 requires',
    what: [
      { h: 'Context and scope', t: 'Define and justify interested parties, requirements and the boundaries of the ISMS.' },
      { h: 'Risk assessment and treatment', t: 'A documented method, a risk register and a treatment plan with named owners.' },
      { h: 'Statement of Applicability', t: 'For each of the 93 controls: applicable or not, with justification and implementation status.' },
      { h: 'Evaluation and improvement', t: 'Metrics, internal audits, management review and corrective action, year after year.' },
    ],
    dates: [
      { d: 'Oct 2022', t: 'ISO/IEC 27001:2022 published' },
      { d: '31 Oct 2025', t: 'Certificates to the 2013 edition have expired' },
    ],
    overlap: 'UniqSuite takes you through clauses 4 to 10 and the 93 controls in Annex A and builds your Statement of Applicability from them. Where another framework asks for the same thing, your answer counts there too.',
    faq: [
      { q: 'Do all 93 controls have to be implemented?', a: 'No. You decide based on your risks which apply, and justify exclusions in the Statement of Applicability.' },
      { q: 'How long does certification take?', a: 'It depends on size and prior work. What matters is that the ISMS has been operated for some months before the certification audit.' },
      { q: 'Is ISO 27001 required by law?', a: 'No, the standard is voluntary. The BSI Act requires NIS2 entities to take relevant European and international standards into account, but it does not prescribe a particular standard (Section 30(2) BSIG).' },
      { q: 'How does it differ from the BSI’s IT-Grundschutz?', a: 'IT-Grundschutz is the BSI’s methodology, and it also meets the requirements of ISO 27001. For ISO 27001 certification on the basis of IT-Grundschutz, an auditor certified by the BSI carries out the audit and the BSI issues the certificate.' },
      { q: 'What does the 2024 climate amendment change?', a: 'Under ISO/IEC 27001:2022/Amd 1:2024, you must determine whether climate change is a relevant issue when you establish your context (clause 4.1). A note in clause 4.2 adds that interested parties can have requirements related to climate change.' },
    ],
    sources: ['ISO/IEC 27001:2022, iso.org', 'IAF MD 26 (transition to the 2022 edition)'],
  },
  {
    fw: 'aiact', slug: slugs.aiact, name: 'EU AI Act', kind: 'Regulation (EU) 2024/1689',
    title: 'The EU AI Act', sub: 'Rules for everyone who provides or uses AI.',
    lead: 'The AI Act classifies AI by risk. Some practices are banned, high-risk AI faces strict obligations, and other systems must meet transparency rules. Obligations apply in stages, and some already apply.',
    facts: [
      { k: 'Legal basis', v: 'Regulation (EU) 2024/1689, amended by Regulation (EU) 2026/1744' },
      { k: 'In force since', v: '1 August 2024; obligations phased in until 2028' },
      { k: 'Roles', v: 'Provider, deployer, importer, distributor – if you only use AI in your own operations, you are a deployer' },
      { k: 'Fines', v: 'Up to €35m or 7% of worldwide turnover for prohibited practices; up to €15m or 3% for other obligations (Art. 99)' },
    ],
    whoTitle: 'Who the AI Act applies to',
    who: [
      'Providers that develop AI systems or place them on the market under their own name.',
      'Deployers that use AI systems in their own operations, from chat assistants to candidate screening.',
      'Companies outside the EU too, if their AI is used in the EU.',
    ],
    whatTitle: 'What the AI Act requires',
    what: [
      { h: 'Prohibited practices (Art. 5)', t: 'Such as social scoring or manipulative techniques. Has applied since 2 February 2025. From 2 December 2026, AI that generates non-consensual intimate images or child sexual abuse material is also prohibited.' },
      { h: 'AI literacy (Art. 4)', t: 'Providers and deployers take measures to support AI literacy among their staff. Has applied since 2 February 2025.' },
      { h: 'Transparency (Art. 50)', t: 'People must be able to tell that they are dealing with AI or seeing AI-generated content. Has applied since 2 August 2026. Systems placed on the market before that date must mark AI content from 2 December 2026.' },
      { h: 'High-risk AI', t: 'Risk management, data quality, logging, human oversight and conformity assessment. For Annex III from 2 December 2027.' },
    ],
    dates: [
      { d: '2 Feb 2025', t: 'Prohibitions and AI literacy apply' },
      { d: '2 Aug 2025', t: 'Obligations for general-purpose AI models' },
      { d: '2 Aug 2026', t: 'Transparency obligations under Art. 50' },
      { d: '2 Dec 2026', t: 'New prohibition under Art. 5; marking under Art. 50(2) also for older systems' },
      { d: '2 Dec 2027', t: 'High-risk AI under Annex III (postponed by Regulation (EU) 2026/1744)' },
      { d: '2 Aug 2028', t: 'High-risk AI in products under Annex I (postponed by Regulation (EU) 2026/1744)' },
    ],
    overlap: 'UniqSuite starts with an AI register: which systems exist, who uses them, what your role is and which risk class they fall into. This shows which AI Act obligations you check for each system.',
    faq: [
      { q: 'We only use a chat assistant. Does this affect us?', a: 'Yes, as a deployer. You must already take measures to support the AI literacy of your staff, and depending on the use, transparency obligations apply as well.' },
      { q: 'Does the AI Act apply on top of NIS2?', a: 'Yes. Both apply independently. Many measures, such as access control and logging, help with both.' },
      { q: 'When is an AI system high-risk?', a: 'When it is used in one of the areas listed in Annex III, such as selecting job candidates or assessing creditworthiness. AI that is a safety component of a product under Annex I, or is itself such a product, is high-risk too if the product requires third-party assessment. By way of exception, an Annex III system is not high-risk if it poses no significant risk to health, safety or fundamental rights. If it profiles individuals, it is always high-risk (Art. 6).' },
      { q: 'How do we demonstrate AI literacy?', a: 'The Regulation does not require a certificate. Document your measures, for example the type and scope of training and who took part.' },
      { q: 'What applies to public authorities?', a: 'Bodies governed by public law and private entities providing public services must carry out a fundamental rights impact assessment before deploying a high-risk AI system under Annex III (Art. 27). Systems for critical infrastructure are excluded. The obligation applies from 2 December 2027.' },
    ],
    sources: ['Regulation (EU) 2024/1689', 'Regulation (EU) 2026/1744'],
  },
  {
    fw: 'iso42001', slug: slugs.iso42001, name: 'ISO/IEC 42001', kind: 'International standard · certifiable',
    title: 'ISO/IEC 42001:2023', sub: 'The management system for artificial intelligence.',
    lead: 'ISO/IEC 42001 is the first certifiable standard for an artificial intelligence management system. It follows the harmonised structure of ISO management system standards and has its own controls for data, the life cycle and the impact assessment of AI systems.',
    facts: [
      { k: 'Published', v: 'December 2023' },
      { k: 'Structure', v: 'Clauses 4 to 10 (management system) and Annex A with 38 controls in 9 control objectives (A.2 to A.10)' },
      { k: 'Distinctive feature', v: 'AI system impact assessment: effects on individuals and society' },
      { k: 'Certificate', v: 'Issued by certification bodies accredited for ISO/IEC 42001; ISO/IEC 42006 sets the requirements for these bodies' },
    ],
    whoTitle: 'Who ISO 42001 suits',
    who: [
      'Organisations that develop, provide or use AI in their own operations.',
      'Companies preparing for the AI Act and looking for an orderly framework.',
      'Organisations that want to show customers or clients that they manage AI responsibly.',
    ],
    whatTitle: 'What ISO 42001 requires',
    what: [
      { h: 'AI policy and roles', t: 'A policy for AI, clear responsibilities and ways to raise concerns.' },
      { h: 'Impact assessment', t: 'Assess and document the effects of an AI system on individuals, groups and society.' },
      { h: 'Life cycle and data', t: 'Manage requirements, development, testing, operation and the provenance and quality of data.' },
      { h: 'Use and third parties', t: 'Intended use, information for those affected and rules for suppliers and customers.' },
    ],
    dates: [
      { d: 'Dec 2023', t: 'ISO/IEC 42001:2023 published' },
    ],
    overlap: 'UniqSuite takes you through the requirements of the standard in plain questions. Your AI register from AI Governance serves as the evidence for the AI inventory. Where the same requirement also applies in another framework, your answer counts there too.',
    faq: [
      { q: 'Does ISO 42001 replace the AI Act?', a: 'No. The standard is voluntary, the AI Act is law. It does help to implement and evidence many AI Act obligations in an orderly way.' },
      { q: 'Do we need ISO 27001 for it?', a: 'No, ISO 42001 stands on its own. Both standards follow the same basic structure for management systems, so if you already have ISO 27001 you can share processes such as document control, internal audits and management review.' },
      { q: 'How do we recognise a suitable certification body?', a: 'Look for accreditation for ISO/IEC 42001. Since July 2025, ISO/IEC 42006 has set out the requirements that such bodies and their auditors must meet.' },
      { q: 'Which standards help with implementation?', a: 'ISO/IEC 42005 gives guidance on impact assessments for AI systems, and ISO/IEC 23894 on risk management for AI. Both are guidance documents that complement ISO 42001.' },
      { q: 'Where do we start?', a: 'First record your AI systems and define the scope. The AI policy, risk assessment and impact assessment build on this. The free UniqSuite quick check shows where you stand in about two minutes, with no sign-up.' },
    ],
    sources: ['ISO/IEC 42001:2023, iso.org'],
  },
  {
    fw: 'cra', slug: slugs.cra, name: 'Cyber Resilience Act', kind: 'Regulation (EU) 2024/2847',
    title: 'The Cyber Resilience Act', sub: 'Security for products with digital elements.',
    lead: 'The CRA requires hardware and software with digital elements to be secure across their whole life cycle. Manufacturers must handle vulnerabilities, deliver updates and report incidents. The first reporting obligations have applied since September 2026.',
    facts: [
      { k: 'Legal basis', v: 'Regulation (EU) 2024/2847, in force since 10 December 2024' },
      { k: 'Reporting', v: 'Since 11 September 2026 (Art. 14)' },
      { k: 'Fully applicable', v: 'From 11 December 2027, with CE marking under the CRA' },
      { k: 'Fines', v: 'Up to €15m or 2.5% of worldwide annual turnover, whichever is higher' },
    ],
    whoTitle: 'Who the CRA applies to',
    who: [
      'Manufacturers of products with digital elements, from software to connected devices.',
      'Importers and distributors that make such products available in the EU.',
      'Areas with their own rules, such as medical devices, vehicles or aviation, are outside its scope.',
    ],
    whatTitle: 'What the CRA requires',
    what: [
      { h: 'Security by design', t: 'Essential requirements from Annex I: secure defaults, protection against unauthorised access, a minimal attack surface.' },
      { h: 'Vulnerability handling', t: 'Identify, document and promptly fix vulnerabilities with security updates throughout the support period.' },
      { h: 'Reporting (Art. 14)', t: 'Actively exploited vulnerabilities and severe incidents: early warning within 24 hours, notification within 72 hours, final report 14 days after a fix is available (vulnerability) or one month after the notification (incident) – to the coordinating CSIRT and ENISA.' },
      { h: 'Conformity', t: 'Technical documentation, conformity assessment and CE marking before a product is placed on the market.' },
    ],
    dates: [
      { d: '10 Dec 2024', t: 'CRA enters into force' },
      { d: '11 Sep 2026', t: 'Reporting obligations for manufacturers apply' },
      { d: '11 Dec 2027', t: 'All obligations apply, CE marking under the CRA' },
    ],
    overlap: 'UniqSuite takes you through the CRA requirements, from the support period and the software bill of materials to the declaration of conformity. Classify an event as an actively exploited vulnerability or a severe incident and UniqSuite shows the reports that are due and their deadlines.',
    faq: [
      { q: 'We only sell software. Does the CRA apply?', a: 'In many cases, yes. Standalone software can be a product with digital elements. There are exceptions, for example for certain open-source software outside a commercial activity.' },
      { q: 'Do the reporting obligations cover older products?', a: 'Yes. The reporting obligations that have applied since September 2026 also cover products placed on the market before December 2027.' },
      { q: 'How long do we have to provide security updates?', a: 'Throughout the support period, which must be at least five years. If a product is expected to be in use for less time, the support period matches that expected use time (Art. 13(8)). Each security update provided must remain available for at least ten years (Art. 13(9)).' },
      { q: 'Do we need a third-party assessment?', a: 'For products without a special classification, the manufacturer’s internal control is enough. Important products of class I, such as routers or password managers, need a third-party assessment if you do not fully apply harmonised standards. For class II, such as firewalls, it is always required (Art. 32).' },
      { q: 'Where should manufacturers start?', a: 'Check which of your products fall under the CRA and whether they are classed as important or critical, and set up a process for the reporting obligations that already apply. Also build a software bill of materials (SBOM) in a machine-readable format, as Annex I requires. The free UniqSuite quick check shows where you stand in about two minutes, with no sign-up.' },
    ],
    sources: ['Regulation (EU) 2024/2847', 'European Commission: CRA reporting obligations'],
  },
];

export const frameworks: Record<Lang, Framework[]> = { de, en };
