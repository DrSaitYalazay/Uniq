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
      { h: 'Meldepflichten (§ 32 BSIG)', t: 'Erhebliche Sicherheitsvorfälle: frühe Erstmeldung in 24 Stunden, Meldung mit erster Bewertung in 72 Stunden, Abschlussmeldung nach einem Monat.' },
      { h: 'Registrierung (§ 33 BSIG)', t: 'Registrierung beim BSI innerhalb von drei Monaten. Die Frist lief im März 2026 ab; wer noch fehlt, registriert sich unverzüglich.' },
      { h: 'Geschäftsleitung (§ 38 BSIG)', t: 'Die Leitung muss die Maßnahmen umsetzen, ihre Umsetzung überwachen und regelmäßig an Schulungen teilnehmen. Bei Verstößen haftet sie.' },
    ],
    dates: [
      { d: '16. Jan. 2023', t: 'Richtlinie (EU) 2022/2555 tritt in Kraft' },
      { d: '6. Dez. 2025', t: 'NIS2UmsuCG und neues BSI-Gesetz gelten' },
      { d: 'März 2026', t: 'Registrierungsfrist beim BSI abgelaufen' },
    ],
    overlap: 'Wer ein ISMS nach ISO 27001 betreibt, hat viel schon erledigt. Neu sind vor allem die Meldepflichten, die Registrierung und die persönliche Verantwortung der Leitung.',
    faq: [
      { q: 'Reicht eine ISO-27001-Zertifizierung für NIS2?', a: 'Nein. Sie ist ein starkes Indiz für funktionierendes Risikomanagement, ersetzt aber weder die Meldepflichten noch die Registrierung oder die Pflichten der Geschäftsleitung.' },
      { q: 'Gibt es ein NIS2-Zertifikat?', a: 'Nein. Das Gesetz kennt keine allgemeine Zertifizierung. Sie müssen die Umsetzung auf Nachfrage des BSI belegen können.' },
      { q: 'Gilt NIS2 für Kommunen?', a: 'Für die Kommunalverwaltung gelten die Regelungen Ihres Bundeslandes. Kommunale Unternehmen können dagegen unmittelbar unter das BSI-Gesetz fallen.' },
    ],
    sources: ['Richtlinie (EU) 2022/2555', 'NIS2UmsuCG, BGBl. 2025 I Nr. 301', 'BSI: NIS-2-Betroffenheitsprüfung und Registrierung'],
  },
  {
    fw: 'iso27001', slug: slugs.iso27001, name: 'ISO/IEC 27001', kind: 'Internationale Norm · zertifizierbar',
    title: 'ISO/IEC 27001:2022', sub: 'Das Managementsystem für Informationssicherheit.',
    lead: 'ISO/IEC 27001 beschreibt, wie eine Organisation Informationssicherheit planvoll steuert: Risiken erkennen, Maßnahmen festlegen, Wirksamkeit prüfen, besser werden. Ein akkreditierter Zertifizierer bestätigt das nach einem Audit.',
    facts: [
      { k: 'Aktuelle Fassung', v: 'ISO/IEC 27001:2022; die Übergangsfrist von der Fassung 2013 endete am 31. Oktober 2025' },
      { k: 'Aufbau', v: 'Kapitel 4 bis 10 (Managementsystem) und Anhang A mit 93 Maßnahmen' },
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
    overlap: 'ISO 27001 ist das Rückgrat: Viele Anforderungen aus NIS2, ISO 42001 und dem CRA lassen sich auf dieselben Maßnahmen abbilden. Einmal sauber bewertet, zählt die Antwort mehrfach.',
    faq: [
      { q: 'Müssen alle 93 Maßnahmen umgesetzt werden?', a: 'Nein. Sie entscheiden anhand Ihrer Risiken, welche gelten, und begründen Ausschlüsse in der Erklärung zur Anwendbarkeit.' },
      { q: 'Wie lange dauert der Weg zum Zertifikat?', a: 'Das hängt von Größe und Vorarbeit ab. Entscheidend ist, dass das ISMS einige Monate gelebt wurde, bevor das Zertifizierungsaudit stattfindet.' },
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
      { k: 'Rollen', v: 'Anbieter, Betreiber, Einführer, Händler – die meisten Unternehmen sind Betreiber' },
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
      { h: 'Verbotene Praktiken (Art. 5)', t: 'Etwa Social Scoring oder manipulative Techniken. Gilt seit dem 2. Februar 2025.' },
      { h: 'KI-Kompetenz (Art. 4)', t: 'Wer KI anbietet oder betreibt, sorgt für ausreichende Kenntnisse bei den Beschäftigten. Gilt seit dem 2. Februar 2025.' },
      { h: 'Transparenz (Art. 50)', t: 'Menschen müssen erkennen können, dass sie mit KI sprechen oder KI-erzeugte Inhalte sehen. Gilt ab dem 2. August 2026.' },
      { h: 'Hochrisiko-KI', t: 'Risikomanagement, Datenqualität, Protokollierung, menschliche Aufsicht und Konformitätsbewertung. Für Anhang III ab dem 2. Dezember 2027.' },
    ],
    dates: [
      { d: '2. Feb. 2025', t: 'Verbote und KI-Kompetenz gelten' },
      { d: '2. Aug. 2025', t: 'Pflichten für KI-Modelle mit allgemeinem Verwendungszweck' },
      { d: '2. Aug. 2026', t: 'Transparenzpflichten nach Art. 50' },
      { d: '2. Dez. 2027', t: 'Hochrisiko-KI nach Anhang III (verschoben durch die Verordnung (EU) 2026/1744)' },
      { d: '2. Aug. 2028', t: 'Hochrisiko-KI in Produkten nach Anhang I' },
    ],
    overlap: 'Der erste Schritt ist fast immer ein KI-Register: Welche Systeme gibt es, wer nutzt sie, in welche Risikoklasse fallen sie. ISO 42001 liefert dazu das passende Managementsystem.',
    faq: [
      { q: 'Wir nutzen nur einen Chat-Assistenten. Betrifft uns das?', a: 'Ja, als Betreiber. Mindestens die KI-Kompetenz der Beschäftigten ist schon heute Pflicht, und je nach Einsatz kommen Transparenzpflichten hinzu.' },
      { q: 'Gilt der AI Act zusätzlich zu NIS2?', a: 'Ja. Beide gelten unabhängig voneinander. Viele Maßnahmen, etwa Zugriffskontrolle und Protokollierung, helfen aber bei beiden.' },
    ],
    sources: ['Verordnung (EU) 2024/1689', 'Verordnung (EU) 2026/1744'],
  },
  {
    fw: 'iso42001', slug: slugs.iso42001, name: 'ISO/IEC 42001', kind: 'Internationale Norm · zertifizierbar',
    title: 'ISO/IEC 42001:2023', sub: 'Das Managementsystem für künstliche Intelligenz.',
    lead: 'ISO/IEC 42001 ist die erste zertifizierbare Norm für den verantwortungsvollen Umgang mit KI. Sie ist aufgebaut wie ISO 27001, mit eigenen Maßnahmen für Daten, Lebenszyklus und Folgenabschätzung von KI-Systemen.',
    facts: [
      { k: 'Veröffentlicht', v: 'Dezember 2023' },
      { k: 'Aufbau', v: 'Kapitel 4 bis 10 wie bei ISO 27001, dazu Anhang A mit 38 Maßnahmen in 9 Bereichen' },
      { k: 'Besonderheit', v: 'Folgenabschätzung für KI-Systeme: Auswirkungen auf Personen und Gesellschaft' },
      { k: 'Zertifikat', v: 'Durch akkreditierte Stellen, wie bei ISO 27001' },
    ],
    whoTitle: 'Für wen ISO 42001 passt',
    who: [
      'Organisationen, die KI entwickeln, anbieten oder im eigenen Betrieb einsetzen.',
      'Unternehmen, die sich auf den AI Act vorbereiten und dafür ein geordnetes Gerüst suchen.',
      'Wer bereits ein ISMS nach ISO 27001 hat und KI darin mitsteuern will.',
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
    overlap: 'Kapitelstruktur, Risikologik und Auditablauf entsprechen ISO 27001. Ein bestehendes ISMS lässt sich erweitern, statt ein zweites System aufzubauen.',
    faq: [
      { q: 'Ersetzt ISO 42001 den AI Act?', a: 'Nein. Die Norm ist freiwillig, der AI Act ist Gesetz. Sie hilft aber, viele Pflichten des AI Act geordnet umzusetzen und zu belegen.' },
      { q: 'Brauchen wir dafür ISO 27001?', a: 'Nein, ISO 42001 steht für sich. Wer ISO 27001 schon hat, spart jedoch viel Arbeit, weil Aufbau und Abläufe gleich sind.' },
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
      { h: 'Meldepflichten (Art. 14)', t: 'Aktiv ausgenutzte Schwachstellen und schwere Vorfälle: Frühwarnung in 24 Stunden, Meldung in 72 Stunden, Abschlussbericht danach – an CSIRT und ENISA.' },
      { h: 'Konformität', t: 'Technische Dokumentation, Konformitätsbewertung und CE-Kennzeichnung, bevor ein Produkt in Verkehr kommt.' },
    ],
    dates: [
      { d: '10. Dez. 2024', t: 'CRA tritt in Kraft' },
      { d: '11. Sep. 2026', t: 'Meldepflichten für Hersteller gelten' },
      { d: '11. Dez. 2027', t: 'Alle Pflichten gelten, CE-Kennzeichnung nach CRA' },
    ],
    overlap: 'Schwachstellen- und Vorfallmanagement nach ISO 27001 und NIS2 tragen viel. Neu sind die produktbezogenen Pflichten: Unterstützungszeitraum, Dokumentation und CE-Kennzeichnung.',
    faq: [
      { q: 'Wir verkaufen nur Software. Gilt der CRA?', a: 'In vielen Fällen ja. Reine Software kann ein Produkt mit digitalen Elementen sein. Ausnahmen gibt es etwa für bestimmte Open-Source-Software außerhalb einer Geschäftstätigkeit.' },
      { q: 'Gelten die Meldepflichten auch für ältere Produkte?', a: 'Ja. Die Meldepflichten seit September 2026 gelten auch für Produkte, die bereits vor Dezember 2027 in Verkehr gebracht wurden.' },
    ],
    sources: ['Verordnung (EU) 2024/2847', 'EU-Kommission: CRA reporting obligations'],
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
      { h: 'Reporting (Section 32 BSIG)', t: 'Significant incidents: early warning within 24 hours, notification with an initial assessment within 72 hours, final report after one month.' },
      { h: 'Registration (Section 33 BSIG)', t: 'Registration with the BSI within three months. The deadline passed in March 2026; anyone still missing registers without delay.' },
      { h: 'Management (Section 38 BSIG)', t: 'Management must implement the measures, oversee their implementation and attend training regularly. It is liable for breaches.' },
    ],
    dates: [
      { d: '16 Jan 2023', t: 'Directive (EU) 2022/2555 enters into force' },
      { d: '6 Dec 2025', t: 'NIS2UmsuCG and the new BSI Act apply' },
      { d: 'March 2026', t: 'BSI registration deadline passed' },
    ],
    overlap: 'If you run an ISMS under ISO 27001, much of the work is done. What is new is mainly reporting, registration and the personal accountability of management.',
    faq: [
      { q: 'Is ISO 27001 certification enough for NIS2?', a: 'No. It is strong evidence of working risk management, but it does not replace reporting, registration or the duties of management.' },
      { q: 'Is there a NIS2 certificate?', a: 'No. The law has no general certification. You must be able to demonstrate implementation when the BSI asks.' },
      { q: 'Does NIS2 apply to municipalities?', a: 'Municipal administrations fall under the rules of their federal state. Municipal companies, however, can fall directly under the BSI Act.' },
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
    overlap: 'ISO 27001 is the backbone: many requirements from NIS2, ISO 42001 and the CRA map onto the same controls. Assessed properly once, the answer counts several times.',
    faq: [
      { q: 'Do all 93 controls have to be implemented?', a: 'No. You decide based on your risks which apply, and justify exclusions in the Statement of Applicability.' },
      { q: 'How long does certification take?', a: 'It depends on size and prior work. What matters is that the ISMS has been operated for some months before the certification audit.' },
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
      { k: 'Roles', v: 'Provider, deployer, importer, distributor – most companies are deployers' },
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
      { h: 'Prohibited practices (Art. 5)', t: 'Such as social scoring or manipulative techniques. Applies since 2 February 2025.' },
      { h: 'AI literacy (Art. 4)', t: 'Providers and deployers ensure sufficient AI literacy among their staff. Applies since 2 February 2025.' },
      { h: 'Transparency (Art. 50)', t: 'People must be able to tell that they are dealing with AI or seeing AI-generated content. Applies from 2 August 2026.' },
      { h: 'High-risk AI', t: 'Risk management, data quality, logging, human oversight and conformity assessment. For Annex III from 2 December 2027.' },
    ],
    dates: [
      { d: '2 Feb 2025', t: 'Prohibitions and AI literacy apply' },
      { d: '2 Aug 2025', t: 'Obligations for general-purpose AI models' },
      { d: '2 Aug 2026', t: 'Transparency obligations under Art. 50' },
      { d: '2 Dec 2027', t: 'High-risk AI under Annex III (postponed by Regulation (EU) 2026/1744)' },
      { d: '2 Aug 2028', t: 'High-risk AI in products under Annex I' },
    ],
    overlap: 'The first step is almost always an AI register: which systems exist, who uses them, which risk class they fall into. ISO 42001 provides the matching management system.',
    faq: [
      { q: 'We only use a chat assistant. Does this affect us?', a: 'Yes, as a deployer. AI literacy of your staff is already mandatory today, and depending on the use, transparency obligations apply as well.' },
      { q: 'Does the AI Act apply on top of NIS2?', a: 'Yes. Both apply independently. Many measures, such as access control and logging, help with both.' },
    ],
    sources: ['Regulation (EU) 2024/1689', 'Regulation (EU) 2026/1744'],
  },
  {
    fw: 'iso42001', slug: slugs.iso42001, name: 'ISO/IEC 42001', kind: 'International standard · certifiable',
    title: 'ISO/IEC 42001:2023', sub: 'The management system for artificial intelligence.',
    lead: 'ISO/IEC 42001 is the first certifiable standard for the responsible use of AI. It is built like ISO 27001, with its own controls for data, the life cycle and the impact assessment of AI systems.',
    facts: [
      { k: 'Published', v: 'December 2023' },
      { k: 'Structure', v: 'Clauses 4 to 10 as in ISO 27001, plus Annex A with 38 controls in 9 areas' },
      { k: 'Distinctive feature', v: 'AI system impact assessment: effects on individuals and society' },
      { k: 'Certificate', v: 'Issued by accredited bodies, as with ISO 27001' },
    ],
    whoTitle: 'Who ISO 42001 suits',
    who: [
      'Organisations that develop, provide or use AI in their own operations.',
      'Companies preparing for the AI Act and looking for an orderly framework.',
      'Anyone who already runs an ISMS under ISO 27001 and wants to manage AI within it.',
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
    overlap: 'Clause structure, risk logic and audit process match ISO 27001. An existing ISMS can be extended instead of building a second system.',
    faq: [
      { q: 'Does ISO 42001 replace the AI Act?', a: 'No. The standard is voluntary, the AI Act is law. It does help to implement and evidence many AI Act obligations in an orderly way.' },
      { q: 'Do we need ISO 27001 for it?', a: 'No, ISO 42001 stands on its own. If you already have ISO 27001, you save a lot of work because structure and processes are the same.' },
    ],
    sources: ['ISO/IEC 42001:2023, iso.org'],
  },
  {
    fw: 'cra', slug: slugs.cra, name: 'Cyber Resilience Act', kind: 'Regulation (EU) 2024/2847',
    title: 'The Cyber Resilience Act', sub: 'Security for products with digital elements.',
    lead: 'The CRA requires hardware and software with digital elements to be secure across their whole life cycle. Manufacturers must handle vulnerabilities, deliver updates and report incidents. The first reporting obligations apply since September 2026.',
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
      'Not covered are areas with their own rules, such as medical devices, vehicles or aviation.',
    ],
    whatTitle: 'What the CRA requires',
    what: [
      { h: 'Security by design', t: 'Essential requirements from Annex I: secure defaults, protection against unauthorised access, a minimal attack surface.' },
      { h: 'Vulnerability handling', t: 'Identify, document and promptly fix vulnerabilities with security updates throughout the support period.' },
      { h: 'Reporting (Art. 14)', t: 'Actively exploited vulnerabilities and severe incidents: early warning within 24 hours, notification within 72 hours, final report afterwards – to the CSIRT and ENISA.' },
      { h: 'Conformity', t: 'Technical documentation, conformity assessment and CE marking before a product is placed on the market.' },
    ],
    dates: [
      { d: '10 Dec 2024', t: 'CRA enters into force' },
      { d: '11 Sep 2026', t: 'Reporting obligations for manufacturers apply' },
      { d: '11 Dec 2027', t: 'All obligations apply, CE marking under the CRA' },
    ],
    overlap: 'Vulnerability and incident management under ISO 27001 and NIS2 carry a lot of the load. What is new are the product obligations: support period, documentation and CE marking.',
    faq: [
      { q: 'We only sell software. Does the CRA apply?', a: 'In many cases, yes. Standalone software can be a product with digital elements. There are exceptions, for example for certain open-source software outside a commercial activity.' },
      { q: 'Do the reporting obligations cover older products?', a: 'Yes. The reporting obligations since September 2026 also apply to products placed on the market before December 2027.' },
    ],
    sources: ['Regulation (EU) 2024/2847', 'European Commission: CRA reporting obligations'],
  },
];

export const frameworks: Record<Lang, Framework[]> = { de, en };
