-- ============================================================================
-- ISO42001 (111) + NIST_AI_RMF (29): muss, binding und Fundstellen
--
-- Beide Kataloge trugen muss = NULL. Die Kennzahl "Kritische Luecken" zaehlt ueber
-- muss='true'; fuer diese beiden Rahmenwerke konnte sie deshalb nie etwas anzeigen.
--
-- Die Unterscheidung ist nicht erfunden, sondern am ISO-27001-Katalog GEMESSEN:
--   annex_kind='clause' -> muss=true (80/80),  annex_kind='annex' -> muss=false (236/238).
-- Traegt auf ISO 42001, weil dort dieselbe SoA-Mechanik gilt (Kl. 6.1.3 d):
-- Anhang-A-Kontrollen sind mit Begruendung ausschliessbar, Klauseln 4-10 nicht.
--
-- NIST AI RMF kennt keine Pflichtebene: das Rahmenwerk ist per National AI
-- Initiative Act 2020 ausdrücklich freiwillig, die EO 14110 (die es referenzierte)
-- wurde am 20.01.2025 aufgehoben. Daher alle 29 Kontrollen binding='H'.
--
-- Normgrundlage ISO 42001 am Normtext selbst geprueft (Erstausgabe 2023-12):
-- Anhang A ist normativ, Tabelle A.1 enthaelt 38 Kontrollen in A.2-A.10.
-- ============================================================================

-- 1) Die 31 C-Prüffragen: jede einzeln gelesen, Fundstelle und Bindung gesetzt
UPDATE public.controls c SET
  muss = CASE v.binding WHEN 'R' THEN 'true' ELSE 'false' END,
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object('binding',v.binding,'binding_source','ISO/IEC 42001:2023 (Erstausgabe 2023-12; kein Amendment, EN-Übernahme EN ISO/IEC 42001:2026 unverändert)','legal_ref',v.ref)
FROM (VALUES
  ('ISO42001-C-01.1','R','ISO/IEC 42001:2023 Kl. 4.3 (Festlegung des Geltungsbereichs des KI-Managementsystems)'),
  ('ISO42001-C-01.2','R','ISO/IEC 42001:2023 Kl. 5.2 (KI-Politik; von der obersten Leitung festzulegen)'),
  ('ISO42001-C-01.3','R','ISO/IEC 42001:2023 Kl. 5.3 (Rollen, Verantwortlichkeiten und Befugnisse)'),
  ('ISO42001-C-01.4','R','ISO/IEC 42001:2023 Kl. 4.2 (Erfordernisse und Erwartungen interessierter Parteien)'),
  ('ISO42001-C-02.1','H','ISO/IEC 42001:2023 Anhang A, A.4.2 (Ressourcendokumentation) — die 13 Pflichtfelder sind eigene Setzung'),
  ('ISO42001-C-02.2','H','ISO/IEC 42001:2023 Anhang A, A.6.2.5 (Einsatz von KI-Systemen) — der Genehmigungsprozess ist abgeleitet'),
  ('ISO42001-C-02.3','H','ISO/IEC 42001:2023 Anhang A, A.6.2 (KI-System-Lebenszyklus) — die Außerbetriebnahme ist abgeleitet; vgl. NIST GOVERN 1.7'),
  ('ISO42001-C-02.4','H','ISO/IEC 42001:2023 Anhang A, A.4.2 — der Quartalsrhythmus ist eigene Setzung'),
  ('ISO42001-C-03.1','R','ISO/IEC 42001:2023 Kl. 6.2 (KI-Ziele; messbar, soweit praktikabel)'),
  ('ISO42001-C-03.2','R','ISO/IEC 42001:2023 Kl. 9.1 (Überwachung, Messung, Analyse und Bewertung)'),
  ('ISO42001-C-03.3','R','ISO/IEC 42001:2023 Kl. 9.3 (Managementbewertung) — der Jahresrhythmus ist eigene Konkretisierung der ''geplanten Abstände'''),
  ('ISO42001-C-03.4','H','ISO/IEC 42001:2023 Kl. 7.1 (Ressourcen) — die Verankerung im Jahresbudget ist eigene Setzung'),
  ('ISO42001-C-04.1','R','ISO/IEC 42001:2023 Kl. 9.2 und 9.2.2 (Internes Audit und Auditprogramm)'),
  ('ISO42001-C-04.2','R','ISO/IEC 42001:2023 Kl. 10.2 (Nichtkonformität und Korrekturmaßnahme)'),
  ('ISO42001-C-04.3','H','ISO/IEC 42001:2023 Kl. 10.1 (fortlaufende Verbesserung) — ein benannter Lessons-Learned-Prozess ist abgeleitet'),
  ('ISO42001-C-04.4','H','ISO/IEC 42001:2023 Kl. 10.1 — ein systematisches Vorschlagswesen ist abgeleitet'),
  ('ISO42001-C-05.1','R','ISO/IEC 42001:2023 Kl. 6.1.4 und 8.4 (Folgenabschätzung für KI-Systeme) — die Beschränkung auf Hochrisiko stammt aus dem AI Act, nicht aus der Norm'),
  ('ISO42001-C-05.2','H','ISO/IEC 42001:2023 Anhang A, A.2.2 (KI-Politik) — verbindliche Ethikgrundsätze sind eigene Setzung'),
  ('ISO42001-C-05.3','H','BetrVG §§ 87, 90, 92a, 95 (Mitbestimmung) — keine Anforderung der ISO/IEC 42001'),
  ('ISO42001-C-05.4','H','eigene Setzung (externer KI-Ethikbeirat bzw. unabhängiges Peer-Review) — keine Anforderung der ISO/IEC 42001'),
  ('ISO42001-C-05.5','H','ISO/IEC 42001:2023 Anhang A, A.3.3 (Meldung von Bedenken) — der Eskalationsweg ist abgeleitet'),
  ('ISO42001-C-06.1','R','ISO/IEC 42001:2023 Kl. 7.2 (Kompetenz; erforderliche Kompetenz ist zu bestimmen)'),
  ('ISO42001-C-06.2','R','ISO/IEC 42001:2023 Kl. 7.2 (Kompetenz; dokumentierte Information als Nachweis ist aufzubewahren) — ''zentral und auswertbar'' ist eigene Konkretisierung'),
  ('ISO42001-C-06.3','H','eigene Setzung (geregelte Hinzuziehung externer KI-Compliance-Expertise)'),
  ('ISO42001-C-07.1','R','ISO/IEC 42001:2023 Kl. 7.4 (Kommunikation, intern und extern)'),
  ('ISO42001-C-07.2','H','ISO/IEC 42001:2023 Anhang A, A.9.2 (Prozesse für den verantwortungsvollen Einsatz) — die interne Nutzungsrichtlinie ist abgeleitet'),
  ('ISO42001-C-07.3','H','ISO/IEC 42001:2023 Anhang A, A.8.4 (Kommunikation von Vorfällen) — die interne Lessons-Learned-Weitergabe ist abgeleitet'),
  ('ISO42001-C-07.4','H','ISO/IEC 42001:2023 Anhang A, A.8.3 und A.8.5 (externe Berichterstattung; Information interessierter Parteien) — der Beschwerdeweg ist abgeleitet'),
  ('ISO42001-C-08.1','H','ISO/IEC 42001:2023 Anhang A, A.10.3 (Lieferanten) — die 14 Prüffragen sind eigene Setzung'),
  ('ISO42001-C-08.2','H','ISO/IEC 42001:2023 Anhang A, A.10.3 (Lieferanten) — die AGB-Analyse ist abgeleitet'),
  ('ISO42001-C-08.3','H','ISO/IEC 42001:2023 Anhang A, A.10.3 (Lieferanten) — die Transparenz über Unterauftragnehmer ist abgeleitet')
) AS v(id,binding,ref)
WHERE c.framework = 'ISO42001' AND c.id = v.id;

-- 2) Die 5 echten Klausel-IDs: normativer Teil der Norm -> Pflicht
UPDATE public.controls c SET
  muss = 'true',
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object('binding','R','binding_source','ISO/IEC 42001:2023 (Erstausgabe 2023-12; kein Amendment, EN-Übernahme EN ISO/IEC 42001:2026 unverändert)','legal_ref',v.ref)
FROM (VALUES
  ('ISO42001-5.2','ISO/IEC 42001:2023 Kl. 5.2 (KI-Politik)'),
  ('ISO42001-5.3','ISO/IEC 42001:2023 Kl. 5.3 (Rollen, Verantwortlichkeiten und Befugnisse)'),
  ('ISO42001-6.1.4','ISO/IEC 42001:2023 Kl. 6.1.4 (Folgenabschätzung für KI-Systeme)'),
  ('ISO42001-8.3','ISO/IEC 42001:2023 Kl. 8.3 (KI-Risikobehandlung)'),
  ('ISO42001-9.2','ISO/IEC 42001:2023 Kl. 9.2 (Internes Audit)')
) AS v(id,ref)
WHERE c.framework = 'ISO42001' AND c.id = v.id;

-- 3) Die 14 echten Anhang-A-IDs: normativ, aber über die SoA ausschließbar -> keine Pflicht
--    Titel woertlich aus Tabelle A.1 der Norm.
UPDATE public.controls c SET
  muss = 'false',
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object('binding','H','binding_source','ISO/IEC 42001:2023 (Erstausgabe 2023-12; kein Amendment, EN-Übernahme EN ISO/IEC 42001:2026 unverändert)','legal_ref',v.ref)
FROM (VALUES
  ('ISO42001-A.10.2','ISO/IEC 42001:2023 Anhang A, A.10.2 (Zuordnung von Verantwortlichkeiten (Allocation of responsibilities))'),
  ('ISO42001-A.10.4','ISO/IEC 42001:2023 Anhang A, A.10.4 (Kunden (Customers))'),
  ('ISO42001-A.4.4','ISO/IEC 42001:2023 Anhang A, A.4.4 (Werkzeug-Ressourcen (Tooling resources))'),
  ('ISO42001-A.4.5','ISO/IEC 42001:2023 Anhang A, A.4.5 (System- und Rechenressourcen (System and computing resources))'),
  ('ISO42001-A.6.2','ISO/IEC 42001:2023 Anhang A, A.6.2 (Gruppenüberschrift ''KI-System-Lebenszyklus'' — in Tabelle A.1 KEINE Einzelkontrolle)'),
  ('ISO42001-A.6.2.2','ISO/IEC 42001:2023 Anhang A, A.6.2.2 (Anforderungen und Spezifikation des KI-Systems)'),
  ('ISO42001-A.6.2.3','ISO/IEC 42001:2023 Anhang A, A.6.2.3 (Dokumentation von Entwurf und Entwicklung des KI-Systems)'),
  ('ISO42001-A.6.2.7','ISO/IEC 42001:2023 Anhang A, A.6.2.7 (Technische Dokumentation des KI-Systems)'),
  ('ISO42001-A.6.2.8','ISO/IEC 42001:2023 Anhang A, A.6.2.8 (Aufzeichnung von Ereignisprotokollen des KI-Systems)'),
  ('ISO42001-A.7.3','ISO/IEC 42001:2023 Anhang A, A.7.3 (Beschaffung von Daten (Acquisition of data))'),
  ('ISO42001-A.7.4','ISO/IEC 42001:2023 Anhang A, A.7.4 (Qualität der Daten für KI-Systeme)'),
  ('ISO42001-A.7.6','ISO/IEC 42001:2023 Anhang A, A.7.6 (Datenaufbereitung (Data preparation))'),
  ('ISO42001-A.8.2','ISO/IEC 42001:2023 Anhang A, A.8.2 (Systemdokumentation und Informationen für Nutzende)'),
  ('ISO42001-A.9.2','ISO/IEC 42001:2023 Anhang A, A.9.2 (Prozesse für den verantwortungsvollen Einsatz von KI)')
) AS v(id,ref)
WHERE c.framework = 'ISO42001' AND c.id = v.id;

-- 4) Buchstaben-Kontrollen, deren vorhandene Fundstelle auf eine KLAUSEL zeigt -> Pflicht
--    (G-01..G-06, R-01..R-07, S-03 — jede einzeln gelesen und die Zuordnung bestaetigt)
UPDATE public.controls c SET
  muss = 'true',
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object('binding','R','binding_source','ISO/IEC 42001:2023 (Erstausgabe 2023-12; kein Amendment, EN-Übernahme EN ISO/IEC 42001:2026 unverändert)')
WHERE c.framework = 'ISO42001'
  AND c.id ~ '^ISO42001-[A-Z]-[0-9]'
  AND c.meta->>'legal_ref' LIKE '%ISO 42001 Kl.%'
  AND c.id <> 'ISO42001-G-05';

-- 5) Alle uebrigen ISO42001-Kontrollen: Anhang-A-Fundstelle oder gar kein 42001-Anker -> keine Pflicht
UPDATE public.controls c SET
  muss = 'false',
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object('binding','H','binding_source','ISO/IEC 42001:2023 (Erstausgabe 2023-12; kein Amendment, EN-Übernahme EN ISO/IEC 42001:2026 unverändert)')
WHERE c.framework = 'ISO42001' AND c.meta->>'binding' IS NULL;

-- 6a) KORREKTUR G-01: "Amd. 1:2024" existiert für ISO/IEC 42001 NICHT.
--     Die Klimawandel-Pruefung steht bereits im Originaltext der Erstausgabe 2023-12
--     (Kl. 4.1, letzter Satz). Betroffen war nur die Fundstelle, nicht die Frage.
--     Gegenprobe: ISO/IEC 27001:2022 hat das Amendment wirklich — dort bleibt der Zusatz richtig.
UPDATE public.controls c SET
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object(
    'legal_ref', replace(c.meta->>'legal_ref',
      'ISO 42001 Kl. 4.1 (inkl. Amd. 1:2024)',
      'ISO/IEC 42001:2023 Kl. 4.1 (die Klimawandel-Prüfung steht bereits in der Erstausgabe 2023-12; ein Amendment 1:2024 existiert für ISO/IEC 42001 nicht)'))
WHERE c.framework = 'ISO42001' AND c.id = 'ISO42001-G-01';

-- 6b) Katalogweiter Scan: derselbe Fundstellen-Baustein darf bei 42001 nirgends stehen.
UPDATE public.controls c SET
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object(
    'legal_ref', replace(c.meta->>'legal_ref', '42001 Kl. 4.1 (inkl. Amd. 1:2024)', '42001:2023 Kl. 4.1'))
WHERE c.meta->>'legal_ref' LIKE '%42001%Amd. 1:2024%';

-- 6c) KORREKTUR G-05: Die Frage zielt auf die aktive Erkennung nicht inventarisierter
--     ("Schatten-")KI ueber Beschaffungs-, SaaS- und Netzwerkdaten. Kl. 4.3 verlangt die
--     Festlegung des Geltungsbereichs — nicht diesen Suchprozess. Also keine Klauselpflicht.
UPDATE public.controls c SET
  muss = 'false',
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object(
    'binding','H',
    'binding_source', 'ISO/IEC 42001:2023 (Erstausgabe 2023-12; kein Amendment, EN-Übernahme EN ISO/IEC 42001:2026 unverändert)',
    'legal_ref','ISO/IEC 42001:2023 Anhang A, A.4.2 (Ressourcendokumentation) i. V. m. Kl. 4.3 — die aktive Schatten-KI-Erkennung ist eigene Setzung')
WHERE c.framework = 'ISO42001' AND c.id = 'ISO42001-G-05';

-- 7) NIST_AI_RMF: die 25 Unterkategorie-Kontrollen bekommen ihre Fundstelle.
--    Bei vier IDs weicht der Inhalt von der ID ab (Ma1.1 seit 19.09.2026); die ID bleibt (Fremdschluessel in
--    control_iso/Knoten/Antworten), die FUNDSTELLE wird richtiggestellt und der
--    Unterschied in meta.id_hinweis festgehalten, damit ihn niemand spaeter "zurueckrepariert".
UPDATE public.controls c SET
  muss = 'false',
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object(
    'binding','H','binding_source','NIST AI RMF 1.0 (NIST AI 100-1, 26.01.2023) — per National AI Initiative Act 2020 ausdrücklich freiwillig','legal_ref',v.ref)
    || CASE WHEN v.hinweis <> '' THEN jsonb_build_object('id_hinweis', v.hinweis) ELSE '{}'::jsonb END
FROM (VALUES
  ('NAIRMF-G1.1','NIST AI RMF 1.0 (NIST AI 100-1), GOVERN 1.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-G1.2','NIST AI RMF 1.0 (NIST AI 100-1), GOVERN 1.2 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-G2.1','NIST AI RMF 1.0 (NIST AI 100-1), GOVERN 2.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-G3.1','NIST AI RMF 1.0 (NIST AI 100-1), GOVERN 3.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-G4.1','NIST AI RMF 1.0 (NIST AI 100-1), GOVERN 4.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-G5.1','NIST AI RMF 1.0 (NIST AI 100-1), GOVERN 5.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-G6.1','NIST AI RMF 1.0 (NIST AI 100-1), GOVERN 6.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-M1.1','NIST AI RMF 1.0 (NIST AI 100-1), MAP 1.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-M1.2','NIST AI RMF 1.0 (NIST AI 100-1), MAP 1.2 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-M2.1','NIST AI RMF 1.0 (NIST AI 100-1), MAP 2.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-M3.1','NIST AI RMF 1.0 (NIST AI 100-1), MAP 3.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-M4.1','NIST AI RMF 1.0 (NIST AI 100-1), MAP 4.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-M5.1','NIST AI RMF 1.0 (NIST AI 100-1), MAP 5.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Ma1.1','NIST AI RMF 1.0 (NIST AI 100-1), MANAGE 1.2 und 1.3 — freiwilliges Rahmenwerk','Die Frage zielt auf die Priorisierung (MANAGE 1.2) und die Behandlungsentscheidung je Risiko (MANAGE 1.3); MANAGE 1.1 ist die Entscheidung, ob Entwicklung oder Einsatz fortgesetzt wird.'),
  ('NAIRMF-Ma2.1','NIST AI RMF 1.0 (NIST AI 100-1), MANAGE 2.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Ma2.3','NIST AI RMF 1.0 (NIST AI 100-1), MANAGE 2.4 — freiwilliges Rahmenwerk','Die Frage zielt auf Abschalt-/Deaktivierungsmechanismen; das ist MANAGE 2.4. MANAGE 2.3 behandelt Response/Recovery bei zuvor unbekannten Risiken.'),
  ('NAIRMF-Ma3.1','NIST AI RMF 1.0 (NIST AI 100-1), MANAGE 3.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Ma4.1','NIST AI RMF 1.0 (NIST AI 100-1), MANAGE 4.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Ma4.3','NIST AI RMF 1.0 (NIST AI 100-1), MANAGE 4.3 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Me1.1','NIST AI RMF 1.0 (NIST AI 100-1), MEASURE 1.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Me2.1','NIST AI RMF 1.0 (NIST AI 100-1), MEASURE 2.5 — freiwilliges Rahmenwerk','Die Frage zielt auf Validität und Zuverlässigkeit; das ist MEASURE 2.5. MEASURE 2.1 behandelt Testsets, Metriken und TEVV-Werkzeuge.'),
  ('NAIRMF-Me2.5','NIST AI RMF 1.0 (NIST AI 100-1), MEASURE 2.9 und 2.11 — freiwilliges Rahmenwerk','Die Frage bündelt Erklärbarkeit (MEASURE 2.9) und Fairness/Bias (MEASURE 2.11); MEASURE 2.5 ist Validität/Zuverlässigkeit.'),
  ('NAIRMF-Me2.7','NIST AI RMF 1.0 (NIST AI 100-1), MEASURE 2.7 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Me3.1','NIST AI RMF 1.0 (NIST AI 100-1), MEASURE 3.1 — freiwilliges Rahmenwerk',''),
  ('NAIRMF-Me4.1','NIST AI RMF 1.0 (NIST AI 100-1), MEASURE 4.1 — freiwilliges Rahmenwerk','')
) AS v(id,ref,hinweis)
WHERE c.framework = 'NIST_AI_RMF' AND c.id = v.id;

-- 7b) Die 4 N-0x-Kontrollen (eigene Zusatzfragen mit vorhandener Fundstelle): nur Bindung setzen.
UPDATE public.controls c SET
  muss = 'false',
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object('binding','H','binding_source','NIST AI RMF 1.0 (NIST AI 100-1, 26.01.2023) — per National AI Initiative Act 2020 ausdrücklich freiwillig')
WHERE c.framework = 'NIST_AI_RMF' AND c.meta->>'binding' IS NULL;

-- 8) OWASP LLM Top 10: gueltig ist die Ausgabe 2026 (v1.0, August 2026).
--    KORREKTUR 19.09.2026: Hier stand ein regexp_replace, das nur das Jahr
--    ':2025' -> ':2026' tauschte. Die Ausgabe 2026 hat aber acht der zehn
--    Eintraege neu nummeriert; dadurch zeigten 12 von 17 Fundstellen auf das
--    falsche Risiko (z. B. 'LLM03:2026' = Excessive Agency statt Supply Chain).
--    Jetzt: feste Endwerte je Kontrolle — idempotent, unabhaengig vom Vorzustand.
--    Zuordnung 2025 -> 2026 (Liste der Ausgabe 2026):
--      01 Prompt Injection -> 01 | 02 Sensitive Information Disclosure -> 02
--      03 Supply Chain -> 04     | 04 Data and Model Poisoning -> 05
--      05 Improper Output Handling -> 10 | 06 Excessive Agency -> 03
--      07 System Prompt Leakage -> 08 (Hidden Context Exposure)
--      08 Vector and Embedding Weaknesses -> 09 | 09 Misinformation -> 07
--      10 Unbounded Consumption -> 06
UPDATE public.controls c SET
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object('legal_ref', v.ref)
FROM (VALUES
  ('ISO42001','ISO42001-S-13','OWASP LLM01:2026; MITRE ATLAS AML.T0051; AI Act Art. 15(5)'),
  ('ISO42001','ISO42001-S-14','OWASP LLM01:2026 (indirekt); MITRE ATLAS AML.T0051'),
  ('ISO42001','ISO42001-S-15','OWASP LLM10:2026; MITRE ATLAS AML.T0050; CWE-79/77/94'),
  ('ISO42001','ISO42001-S-16','OWASP LLM02:2026; MITRE ATLAS AML.T0024/T0057; ISO 27001 A.8.12'),
  ('ISO42001','ISO42001-S-17','OWASP LLM06:2026; MITRE ATLAS AML.T0029; ISO 27017'),
  ('ISO42001','ISO42001-S-18','OWASP LLM04:2026; CycloneDX ML-BOM; AI Act Art. 11/53; ISO 27001 A.5.21'),
  ('ISO42001','ISO42001-S-19','OWASP LLM04/05:2026; MITRE ATLAS AML.T0018; SLSA/Sigstore; ISO 27001 A.8.31'),
  ('ISO42001','ISO42001-S-20','OWASP LLM05:2026; MITRE ATLAS AML.T0020/T0019; NIST AI 100-2'),
  ('ISO42001','ISO42001-S-21','MITRE ATLAS AML.T0024.002/T0044; OWASP LLM02:2026; ISO 27001 A.8.12'),
  ('ISO42001','ISO42001-S-22','OWASP LLM09:2026'),
  ('ISO42001','ISO42001-S-23','OWASP LLM08:2026; MITRE ATLAS AML.T0056'),
  ('ISO42001','ISO42001-S-24','OWASP LLM01/02/10:2026; MITRE ATLAS AML.M0015'),
  ('ISO42001','ISO42001-S-25','OWASP LLM02:2026; ISO 27001 A.8.12/A.8.15'),
  ('ISO42001','ISO42001-S-26','OWASP LLM03:2026; MITRE ATLAS AML.T0053'),
  ('ISO42001','ISO42001-S-27','OWASP LLM03:2026; MITRE ATLAS AML.T0053; ISO 27001 A.5.3; AI Act Art. 14'),
  ('ISO42001','ISO42001-S-28','OWASP LLM03/10:2026; MITRE ATLAS AML.T0050; ISO 27001 A.8.31'),
  ('NIST_AI_RMF','NAIRMF-N-03','NIST MEASURE 2.3, 2.9; NIST AI 600-1 (Confabulation); OWASP LLM07:2026')
) AS v(fw,id,ref)
WHERE c.framework = v.fw AND c.id = v.id;

-- 9) Aktualitaetshinweis: das AI RMF wird derzeit revidiert (White House AI Action Plan,
--    Juli 2025). NIST ist dabei angewiesen, Bezuege zu Diversity/Equity/Inclusion und
--    Klimawandel zu entfernen. Das trifft genau GOVERN 3.1 (Vielfalt) und MEASURE 2.12
--    (Umweltwirkung). Wer darauf eine Kundenzusage stuetzt, muss das wissen.
UPDATE public.controls c SET
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object(
    'aktualitaet','Diese Unterkategorie steht in der laufenden Revision des NIST AI RMF zur Streichung an (AI Action Plan, Juli 2025). Vor Zusagen den Stand prüfen.')
WHERE c.framework = 'NIST_AI_RMF' AND c.id IN ('NAIRMF-G3.1');
