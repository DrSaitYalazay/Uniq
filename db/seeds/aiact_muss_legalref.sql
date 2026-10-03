-- ============================================================================
-- AIACT — muss + fehlende legal_ref (13.09.2026)
--
-- REGEL (aus dem NIS2-Katalog GEMESSEN, nicht erfunden — 268/268 ohne Verstoss):
--   meta.binding = 'R' (Rechtspflicht) → muss = 'true'
--   meta.binding = 'H' (hergeleitet)   → muss = 'false'
-- 'R' heisst: die Norm schreibt genau diese Pflicht ausdruecklich und konkret.
-- 'H' heisst: wir haben eine allgemeine Pflicht in eine pruefbare Kontrolle
-- uebersetzt. Die Bedingtheit (Rolle, Risikoklasse) gehoert NICHT ins muss-Feld,
-- sondern in die Anwendbarkeitsschicht — genau wie bei NIS2, wo die nur fuer
-- TLD-Registries geltenden Pflichten trotzdem muss='true' tragen.
--
-- Vorher: alle 124 AIACT-Kontrollen hatten muss = NULL. Folge: 'Kritische
-- Luecken' (criticalOpen zaehlt ueber muss='true') konnte fuer den AI Act
-- NIEMALS etwas anzeigen — auch nicht die Verbote des Art. 5.
-- 75 Kontrollen hatten ausserdem keine Fundstelle.
--
-- Artikelnummern gegen die konsolidierte Fassung 02024R1689-20260727 geprueft;
-- die Omnibus-Verordnung (EU) 2026/1744 hat die Nummerierung NICHT veraendert.
--
-- KORREKTUR nebenbei: A-12.4 verwies auf 'Artikel 27 Absatz 5'. Die Mitteilung
-- an die Marktueberwachungsbehoerde steht in Art. 27 Abs. 3; Abs. 5 betrifft den
-- Fragebogen des KI-Buero. Fundstelle berichtigt.
--
-- Idempotent. Keine Antworten betroffen.
-- ============================================================================

-- 1) Die 75 ohne Fundstelle: legal_ref + binding + muss
UPDATE public.controls c
   SET muss = CASE v.binding WHEN 'R' THEN 'true' ELSE 'false' END,
       meta = COALESCE(c.meta,'{}'::jsonb)
              || jsonb_build_object('legal_ref', v.ref, 'binding', v.binding,
                                    'binding_source', 'AI Act, konsolidiert 27.07.2026')
  FROM (VALUES
  ('A-01.1','R','AI Act Art. 5 Abs. 1 Buchst. c (Social Scoring)'),
  ('A-01.2','R','AI Act Art. 5 Abs. 1 Buchst. h (biometrische Echtzeit-Fernidentifizierung)'),
  ('A-01.3','R','AI Act Art. 5 Abs. 1 Buchst. a (unterschwellige/manipulative Techniken)'),
  ('A-01.4','R','AI Act Art. 5 Abs. 1 Buchst. d (vorausschauende Polizeiarbeit)'),
  ('A-01.5','H','AI Act Art. 5 (Nachweisführung — die Verordnung verlangt die Dokumentation der Prüfung selbst nicht)'),
  ('A-02.1','R','AI Act Art. 6 Abs. 4 (dokumentierte Einstufungsbewertung)'),
  ('A-02.2','H','AI Act Anhang III (systematische Prüfung aller Bereiche — Prüfmethodik)'),
  ('A-02.3','H','AI Act Art. 6 (Neubewertung bei Änderung — abgeleitet)'),
  ('A-02.5','H','AI Act Art. 6 (Kommunikation der Einstufung — abgeleitet)'),
  ('A-03.1','R','AI Act Art. 9 Abs. 1-2 (Einrichtung, Dokumentation, gesamter Lebenszyklus)'),
  ('A-03.2','H','AI Act Art. 9 Abs. 2 Buchst. a (Risikoarten-Taxonomie — eigene Systematik)'),
  ('A-03.3','R','AI Act Art. 9 Abs. 2 Buchst. b (Bewertung unter bestimmungsgemäßer Verwendung und vorhersehbarer Fehlanwendung)'),
  ('A-03.4','R','AI Act Art. 9 Abs. 2 Buchst. d (geeignete, gezielte Risikomanagementmaßnahmen)'),
  ('A-03.5','R','AI Act Art. 9 Abs. 5 (vertretbares Restrisiko)'),
  ('A-03.6','R','AI Act Art. 9 Abs. 5 (erwartbare Kenntnisse und Fähigkeiten der Betreiber)'),
  ('A-03.7','H','AI Act Art. 9 Abs. 2 (regelmäßige Überprüfung — „jährlich“ ist eigene Setzung)'),
  ('A-04.1','R','AI Act Art. 10 Abs. 2 Buchst. f (Untersuchung auf Verzerrungen)'),
  ('A-04.2','R','AI Act Art. 10 Abs. 2 Buchst. b-c (Herkunft, Umfang, Vorverarbeitung)'),
  ('A-04.3','R','AI Act Art. 10 Abs. 3 (Relevanz, Repräsentativität, Fehlerfreiheit, Vollständigkeit)'),
  ('A-04.4','R','AI Act Art. 10 Abs. 3 (Repräsentativität, auch für Subgruppen)'),
  ('A-04.5','H','AI Act Art. 10 (Versionierung der Datensätze — abgeleitet)'),
  ('A-04.6','H','AI Act Art. 10 (Lizenzprüfung bezogener Datensätze — abgeleitet)'),
  ('A-04.7','H','AI Act Art. 10 (Neubewertung nach Modell-Update — abgeleitet)'),
  ('A-05.1','R','AI Act Art. 11 i. V. m. Anhang IV Nr. 1 (Zweckbestimmung)'),
  ('A-05.2','R','AI Act Anhang IV Nr. 2 (Architektur und Komponenten)'),
  ('A-05.3','R','AI Act Anhang IV Nr. 2 Buchst. g und Nr. 3 (Leistungsmetriken)'),
  ('A-05.4','H','AI Act Anhang IV (Versionshistorie des Modells — abgeleitet)'),
  ('A-05.5','R','AI Act Anhang IV Nr. 3 (bekannte Einschränkungen, vorhersehbare Fehlanwendung)'),
  ('A-05.6','H','AI Act Anhang IV (externe Abhängigkeiten und Drittkomponenten — abgeleitet)'),
  ('A-06.1','R','AI Act Art. 12 Abs. 1 (automatische Aufzeichnung über die Lebensdauer)'),
  ('A-06.2','H','AI Act Art. 12 (Manipulationsschutz der Protokolle — abgeleitet)'),
  ('A-06.3','R','AI Act Art. 19 Abs. 1 (Aufbewahrung mindestens sechs Monate)'),
  ('A-07.1','R','AI Act Art. 13 Abs. 1-2 (Betriebsanleitung wird den Betreibern beigefügt)'),
  ('A-07.2','R','AI Act Art. 13 Abs. 3 Buchst. b (Leistungsfähigkeit und Grenzen)'),
  ('A-07.3','R','AI Act Art. 13 Abs. 3 Buchst. e (Wartung und Pflege)'),
  ('A-07.4','H','AI Act Art. 13 (Meldewege bei Fehlfunktion — abgeleitet)'),
  ('A-07.5','H','AI Act Art. 13 (Aktualisierung bei Systemänderungen — abgeleitet)'),
  ('A-08.1','R','AI Act Art. 14 Abs. 4 Buchst. d (Eingreifen und Außerkraftsetzen der Ausgabe)'),
  ('A-08.2','R','AI Act Art. 14 Abs. 4 Buchst. a (Fähigkeiten und Grenzen richtig verstehen)'),
  ('A-08.3','R','AI Act Art. 14 Abs. 4 Buchst. b (Automatisierungsbias)'),
  ('A-08.4','H','AI Act Art. 14 (Dokumentation der Override-Entscheidungen — abgeleitet)'),
  ('A-08.5','R','AI Act Art. 14 Abs. 4 Buchst. e (Unterbrechen mittels Stopptaste o. Ä.)'),
  ('A-08.6','H','AI Act Art. 14 (Verankerung in Stellenbeschreibungen — abgeleitet)'),
  ('A-09.1','R','AI Act Art. 15 Abs. 2-3 (Genauigkeitsgrade und -metriken, Angabe in der Betriebsanleitung)'),
  ('A-09.2','R','AI Act Art. 15 Abs. 5 (Robustheit gegen Angriffe, u. a. Data Poisoning und adversarielle Beispiele)'),
  ('A-09.3','R','AI Act Art. 15 Abs. 5 (Cybersicherheit); Konformitätsvermutung über Art. 42 Abs. 3 bei Erfüllung von Art. 12 Abs. 1 CRA'),
  ('A-09.4','H','AI Act Art. 15 (fortlaufende Leistungsüberwachung — abgeleitet, vgl. Art. 72)'),
  ('A-09.5','H','AI Act Art. 15 (KI-bezogener Incident-Response-Prozess — abgeleitet, vgl. Art. 73)'),
  ('A-09.6','H','AI Act Art. 15 (Penetrationstests und Red-Teaming — abgeleitet)'),
  ('A-10.1','R','AI Act Art. 17 Abs. 1 (dokumentiertes Qualitätsmanagementsystem)'),
  ('A-10.2','R','AI Act Art. 17 Abs. 1 Buchst. e (Prüf- und Validierungsverfahren)'),
  ('A-10.3','H','AI Act Art. 17 (Management-Review — abgeleitet)'),
  ('A-10.4','H','AI Act Art. 17 (kontinuierliche Verbesserung — abgeleitet)'),
  ('A-10.5','H','AI Act Art. 17 (Einbindung von Lieferanten — abgeleitet)'),
  ('A-11.1','R','AI Act Art. 43 (Konformitätsbewertungsverfahren)'),
  ('A-11.2','R','AI Act Art. 47 Abs. 1 (EU-Konformitätserklärung, Aufbewahrung zehn Jahre)'),
  ('A-11.3','R','AI Act Art. 48 (CE-Kennzeichnung)'),
  ('A-11.4','R','AI Act Art. 49 (Registrierung in der EU-Datenbank)'),
  ('A-11.5','R','AI Act Art. 43 Abs. 4 (erneute Bewertung bei wesentlicher Änderung)'),
  ('A-11.6','R','AI Act Art. 21 (Zusammenarbeit mit den zuständigen Behörden)'),
  ('A-12.1','R','AI Act Art. 27 Abs. 1 Buchst. d (Risiken für die Grundrechte betroffener Personen)'),
  ('A-12.2','R','AI Act Art. 27 Abs. 1 Buchst. d (Art und Umfang der möglichen Beeinträchtigung)'),
  ('A-12.3','R','AI Act Art. 27 Abs. 1 Buchst. f (Governance- und Abhilfemaßnahmen)'),
  ('A-12.4','R','AI Act Art. 27 Abs. 3 (Mitteilung des Ergebnisses an die Marktüberwachungsbehörde)'),
  ('A-12.5','H','AI Act Art. 27 Abs. 2 (Aktualisierung bei Änderung — „jährlich“ ist eigene Setzung)'),
  ('A-13.1','R','AI Act Art. 72 Abs. 1-3 (System und Plan zur Beobachtung nach dem Inverkehrbringen)'),
  ('A-13.2','H','AI Act Art. 72 (Schwellenwerte für Nachtraining/Rückzug — abgeleitet)'),
  ('A-13.3','R','AI Act Art. 73 Abs. 1 (Meldung schwerwiegender Vorfälle)'),
  ('A-13.4','H','AI Act Art. 72 (Monitoring auf Modell-Drift — abgeleitet)'),
  ('A-14.1','H','AI Act Art. 3 Nr. 63 und Art. 51 (Einstufungsprüfung — Vorfrage, keine eigenständige Pflicht)'),
  ('A-14.2','R','AI Act Art. 53 Abs. 1 Buchst. a i. V. m. Anhang XI (technische Dokumentation des GPAI-Modells)'),
  ('A-14.3','R','AI Act Art. 53 Abs. 1 Buchst. d (öffentliche Zusammenfassung der Trainingsinhalte)'),
  ('A-14.4','R','AI Act Art. 53 Abs. 1 Buchst. c (Urheberrechts-Strategie)'),
  ('A-14.5','R','AI Act Art. 55 Abs. 1 Buchst. a i. V. m. Art. 51 Abs. 2 (Modellbewertung inkl. adversarieller Tests bei systemischem Risiko)'),
  ('A-50.1','R','AI Act Art. 50 Abs. 1, 2 und 4 (Interaktionshinweis, maschinenlesbare Kennzeichnung, Offenlegung)')
  ) AS v(cid, binding, ref)
 WHERE c.framework = 'AIACT' AND c.id = 'AIACT-' || v.cid;

-- 2) Die 49 mit vorhandener Fundstelle: nur binding + muss
--    (E-03 steht seit 19.09.2026 bei 'H': Art. 85 ist ein Recht der Betroffenen,
--    keine Pflicht des Unternehmens — siehe Abschnitt 4.)
UPDATE public.controls
   SET muss = 'true',
       meta = COALESCE(meta,'{}'::jsonb) || '{"binding":"R","binding_source":"AI Act, konsolidiert 27.07.2026"}'::jsonb
 WHERE framework = 'AIACT'
   AND id IN ('AIACT-E-01','AIACT-E-02','AIACT-E-04','AIACT-E-05','AIACT-E-06','AIACT-E-07','AIACT-T-01','AIACT-T-04','AIACT-T-07','AIACT-T-08','AIACT-T-09','AIACT-T-12','AIACT-T-14','AIACT-T-17','AIACT-T-18','AIACT-T-24','AIACT-T-25','AIACT-T-26','AIACT-T-30','AIACT-T-31','AIACT-T-33','AIACT-T-35','AIACT-T-39','AIACT-T-40','AIACT-T-42');

UPDATE public.controls
   SET muss = 'false',
       meta = COALESCE(meta,'{}'::jsonb) || '{"binding":"H","binding_source":"AI Act, konsolidiert 27.07.2026"}'::jsonb
 WHERE framework = 'AIACT'
   AND id IN ('AIACT-E-03','AIACT-T-02','AIACT-T-03','AIACT-T-05','AIACT-T-10','AIACT-T-11','AIACT-T-13','AIACT-T-15','AIACT-T-16','AIACT-T-19','AIACT-T-20','AIACT-T-21','AIACT-T-22','AIACT-T-23','AIACT-T-27','AIACT-T-28','AIACT-T-29','AIACT-T-32','AIACT-T-34','AIACT-T-36','AIACT-T-37','AIACT-T-38','AIACT-T-41','AIACT-T-43');

-- 3) A-12.4: falsche Absatzangabe im Fragetext berichtigen (27(5) -> 27(3))
UPDATE public.controls
   SET req_de = replace(req_de, 'Artikel 27 Absatz 5', 'Artikel 27 Absatz 3'),
       req_en = replace(COALESCE(req_en,''), 'Article 27(5)', 'Article 27(3)')
 WHERE framework = 'AIACT' AND id = 'AIACT-A-12.4';

-- 4) KORREKTUREN 19.09.2026 (gegen den Normtext geprueft)
--    E-01: Art. 4 wurde durch die VO (EU) 2026/1744 geaendert. Verlangt sind
--          Massnahmen, die die Entwicklung der KI-Kompetenz unterstuetzen; ein
--          bestimmtes Niveau muss nicht garantiert werden. Teilnahmenachweis und
--          Wirksamkeitsbewertung schreibt Art. 4 NICHT vor (die alte Frage schon).
--    E-03: Art. 85 gibt Betroffenen ein Beschwerderecht bei der Behoerde; eine
--          Pflicht des Unternehmens, diesen Weg zu benennen, enthaelt er nicht -> H.
--    E-05: Art. 23 Abs. 1 / Art. 24 Abs. 1 nennen keine Pruefung der Registrierung
--          und keine Dokumentation des Pruefergebnisses; Pflicht ist die
--          Aufbewahrung der Unterlagen durch den Einfuehrer (Art. 23 Abs. 5).
--    Die Quelltexte in ai_new_controls.sql sind gleich berichtigt; diese UPDATEs
--    ziehen den Bestand nach (dort ON CONFLICT DO NOTHING). Idempotent.
UPDATE public.controls
   SET req_de = 'Hat das Unternehmen Maßnahmen ergriffen, die die Entwicklung der KI-Kompetenz seines Personals und anderer in seinem Auftrag mit Betrieb und Nutzung von KI-Systemen befasster Personen unterstützen – abgestimmt auf deren Kenntnisse, Erfahrung und Ausbildung, den Einsatzkontext und die betroffenen Personen (Art. 4 i. d. F. der VO (EU) 2026/1744; ein bestimmtes Kompetenzniveau muss nicht garantiert werden)?',
       req_en = 'Has the organisation taken measures that support the development of AI literacy of its staff and other persons dealing with the operation and use of AI systems on its behalf – tailored to their knowledge, experience and training, the context of use and the persons affected (Article 4 as amended by Regulation (EU) 2026/1744; no particular level of AI literacy has to be guaranteed)?',
       meta = COALESCE(meta,'{}'::jsonb) || jsonb_build_object('legal_ref','AI Act Art. 4 i. d. F. VO (EU) 2026/1744; ISO 42001 Kl. 7.2-7.3, A.4.6')
 WHERE framework = 'AIACT' AND id = 'AIACT-E-01';

UPDATE public.risks
   SET text_de = 'Risiko bei Nichterfüllung (KI-Kompetenz Art. 4): Ohne Maßnahmen zur Förderung der KI-Kompetenz drohen Fehlbedienung und blindes Vertrauen in KI-Ausgaben sowie ein Verstoß gegen Art. 4 (anwendbar seit 2. Februar 2025, geändert durch VO (EU) 2026/1744).'
 WHERE risk_id = 'DR-AIACT-E-01';

UPDATE public.controls
   SET meta = COALESCE(meta,'{}'::jsonb) || jsonb_build_object('legal_ref','AI Act Art. 85 (Beschwerderecht der Betroffenen – keine Pflicht des Unternehmens, den Weg zu benennen); ISO 42001 A.8.3')
 WHERE framework = 'AIACT' AND id = 'AIACT-E-03';

UPDATE public.risks
   SET text_de = 'Risiko bei Nichterfüllung (Beschwerderecht Art. 85): Betroffene kennen ihren Beschwerdeweg nicht; Beschwerden gehen ohne vorherige Klärung an die Behörde; Reputations- und Aufsichtsrisiko.'
 WHERE risk_id = 'DR-AIACT-E-03';

UPDATE public.controls
   SET req_de = 'Prüfen Einführer und Händler vor der Bereitstellung eines Hochrisiko-KI-Systems die in Art. 23 Abs. 1 bzw. Art. 24 Abs. 1 genannten Punkte (u. a. Konformitätsbewertung, technische Dokumentation, CE-Kennzeichnung, EU-Konformitätserklärung, Betriebsanleitung, Bevollmächtigter), und bewahren Einführer die Unterlagen zehn Jahre auf (Art. 23 Abs. 5)?',
       req_en = 'Do importers and distributors verify the items listed in Article 23(1) and Article 24(1) respectively (including conformity assessment, technical documentation, CE marking, EU declaration of conformity, instructions for use, authorised representative) before making a high-risk AI system available, and do importers keep the documents for ten years (Article 23(5))?'
 WHERE framework = 'AIACT' AND id = 'AIACT-E-05';
