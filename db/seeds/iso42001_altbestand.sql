-- ============================================================================
-- ISO42001-Altbestand: 19 Kontrollen sprachlich und sachlich richtigstellen
--
-- Aufgefallen beim Druck des KI-Katalogs: diese 19 Kontrollen tragen
-- ASCII-Umlaute ("fuer", "Qualitaet"), sind Stichworte statt Prueffragen und
-- mischen Englisch und Deutsch — waehrend die uebrigen 260 Kontrollen
-- durchgaengig deutsche Fragen sind.
--
-- Schwerer wiegt: beim Abgleich gegen den Normtext zeigen FUENF Kennungen auf
-- die falsche Stelle. Der vorige Seed hatte ihnen die amtlichen Titel der
-- FALSCHEN Kontrolle zugeschrieben und den Fehler damit verschlimmert, weil er
-- jetzt belegt aussah. Die Kennung bleibt (Fremdschluessel), Fundstelle und
-- Text werden korrigiert, die Abweichung steht in meta.id_hinweis.
-- ============================================================================

-- 1) Text (und wo noetig Fundstelle plus Hinweis) richtigstellen
UPDATE public.controls c SET
  req_de = v.frage,
  meta = COALESCE(c.meta,'{}'::jsonb)
         || CASE WHEN v.ref     <> '' THEN jsonb_build_object('legal_ref',  v.ref)     ELSE '{}'::jsonb END
         || CASE WHEN v.hinweis <> '' THEN jsonb_build_object('id_hinweis', v.hinweis) ELSE '{}'::jsonb END
FROM (VALUES
  ('ISO42001-5.2','Hat die oberste Leitung eine KI-Politik festgelegt, die zum Zweck der Organisation passt, und liegt sie als dokumentierte Information vor?','',''),
  ('ISO42001-5.3','Sind die Rollen und Befugnisse für das KI-Managementsystem zugewiesen und bekannt gemacht, einschließlich benannter Verantwortlicher für KI-Betrieb, KI-Risiko und ethische Fragen?','',''),
  ('ISO42001-6.1.4','Ist ein wiederholbares Verfahren zur Bewertung von KI-Risiken festgelegt, das Verzerrung, Erklärbarkeit, Robustheit und Sicherheit ausdrücklich einbezieht?','ISO/IEC 42001:2023 Kl. 6.1.2 (KI-Risikobewertung)','Der Text beschreibt eine Risikobewertung; das ist Klausel 6.1.2. Klausel 6.1.4 regelt die Folgenabschätzung und wird von einer eigenen Kontrolle abgedeckt.'),
  ('ISO42001-8.3','Wird für KI-Systeme eine Folgenabschätzung durchgeführt und dokumentiert, die Auswirkungen auf einzelne Personen, auf Gruppen und auf die Gesellschaft betrachtet?','ISO/IEC 42001:2023 Kl. 8.4 (Durchführung der Folgenabschätzung für KI-Systeme)','Der Text beschreibt eine Folgenabschätzung; das ist Klausel 8.4. Klausel 8.3 regelt die Umsetzung der Risikobehandlung.'),
  ('ISO42001-9.2','Besteht ein internes Auditprogramm für das KI-Managementsystem, und werden die Feststellungen dokumentiert?','',''),
  ('ISO42001-A.4.4','Sind die Werkzeuge für Entwicklung, Betrieb und Überwachung von KI-Systemen dokumentiert, und werden sie verwaltet?','',''),
  ('ISO42001-A.4.5','Sind die System- und Rechenressourcen für KI-Systeme dokumentiert, und werden sie verwaltet?','',''),
  ('ISO42001-A.6.2','Ist für KI-gestützte Entscheidungen eine menschliche Aufsicht eingerichtet, die tatsächlich eingreifen kann?','ISO/IEC 42001:2023 Anhang A, A.9.2 (Prozesse für den verantwortungsvollen Einsatz von KI)','A.6.2 ist in Tabelle A.1 eine Gruppenüberschrift und keine Einzelkontrolle. Inhaltlich gehört die Frage zum verantwortungsvollen Einsatz nach A.9.2.'),
  ('ISO42001-A.6.2.2','Sind die Anforderungen und Spezifikationen für KI-Systeme dokumentiert festgelegt?','',''),
  ('ISO42001-A.6.2.3','Sind Entwurf und Entwicklung der KI-Systeme dokumentiert?','',''),
  ('ISO42001-A.6.2.7','Wird die technische Dokumentation der KI-Systeme erstellt und aktuell gehalten?','',''),
  ('ISO42001-A.6.2.8','Werden Ereignisprotokolle der KI-Systeme aufgezeichnet?','',''),
  ('ISO42001-A.7.3','Sind Beschaffung und Auswahl der Daten für KI-Systeme geregelt und nachvollziehbar dokumentiert?','',''),
  ('ISO42001-A.7.4','Sind Anforderungen an die Datenqualität festgelegt, und werden Herkunft, Verzerrungsprüfung und Repräsentativität der Trainingsdaten belegt?','',''),
  ('ISO42001-A.7.6','Folgt die Datenaufbereitung für KI-Systeme festgelegten Kriterien?','',''),
  ('ISO42001-A.8.2','Erhalten Nutzende die nötige Systemdokumentation, und werden sie darüber informiert, dass sie mit einem KI-System arbeiten?','',''),
  ('ISO42001-A.9.2','Werden KI-Systeme von Dritten vor dem Einsatz geprüft und vertraglich abgesichert?','ISO/IEC 42001:2023 Anhang A, A.10.3 (Lieferanten)','Der Text betrifft Lieferanten; das ist A.10.3. A.9.2 regelt die Prozesse für den verantwortungsvollen Einsatz.'),
  ('ISO42001-A.10.2','Werden KI-Systeme im Betrieb laufend überwacht, insbesondere auf Abweichungen im Modellverhalten und auf nachlassende Leistung?','ISO/IEC 42001:2023 Anhang A, A.6.2.6 (Betrieb und Überwachung von KI-Systemen)','Der Text betrifft Betrieb und Überwachung; das ist A.6.2.6. A.10.2 regelt die Zuordnung von Verantwortlichkeiten gegenüber Dritten.'),
  ('ISO42001-A.10.4','Sind die Erwartungen an Kunden und die Informationspflichten ihnen gegenüber bei KI-Systemen geregelt?','','')
) AS v(id,frage,ref,hinweis)
WHERE c.framework = 'ISO42001' AND c.id = v.id;

-- 2) (entfernt 19.09.2026) Hier wurden drei Fundstellen nur im Jahr von
--    ':2025' auf ':2026' umgeschrieben. Die Ausgabe 2026 nummeriert aber neu;
--    die richtigen Endwerte setzt jetzt iso42001_nist_muss_anker.sql, Abschnitt 8.

-- 3) Sicherheitsnetz: keine ASCII-Umlaute mehr in den 19 Texten.
--    Bewusst NUR auf diese Kennungen begrenzt — ein katalogweites Ersetzen
--    wuerde englische Woerter wie "queue" oder "value" zerstoeren.
