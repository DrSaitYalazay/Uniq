-- ============================================================================
-- KI_SEC — Konsolidierung der beiden KI-Overlay-Kataloge (13.09.2026)
--
-- BEFUND (live gemessen, Entscheidung Dr. Sait):
--   ISO27001_AI (35) und BSI_AI (25) waren im Produkt NICHT ERREICHBAR — beide
--   Codes fehlen in FrameworkKey/FRAMEWORK_DB_VALUE, also konnte sie niemand
--   auswählen: 0 Antworten, in keinem Mandanten aktiv, seit dem 04.07.2026 nie
--   überarbeitet (req_en 60/60 leer, legal_ref 60/60 leer, E-07.1 zitierte noch
--   den aufgehobenen § 8b BSIG).
--
--   Inhaltlich stellte sich bei der Einzelprüfung aller 60 heraus: 45 fragen
--   etwas ab, das der Basiskatalog bereits abfragt (nur mit „KI" davor) —
--   z. B. D-03.4 Temperatur/Feuchte = BSI GEB.8.4/GEB.10.1.2, E-04.2 PAM = 18
--   ISO-Kontrollen, D-07.2 war sogar wortgleich mit D-03.3 im selben Katalog.
--   15 Kontrollen haben dagegen einen KI-EIGENEN Gegenstand (Modell, Prompt,
--   Trainingsdaten, Modell-Repository, KI-Lieferkette) oder eine KI-eigene
--   Methode und kommen in KEINEM anderen Framework vor: von 21 geprüften
--   KI-Technikbegriffen fehlen 15 in AIACT+ISO42001+NIST vollständig.
--
-- ENTSCHEIDUNG: 45 löschen, 15 in EINEN ehrlich benannten Katalog überführen.
--   Die 15 gehören NICHT unter ISO 42001 oder den AI Act — keine dieser Normen
--   verlangt FIDO2, Container-Isolierung oder die OWASP-Liste. Eine Kontrolle
--   unter eine Norm zu hängen, die sie nicht fordert, wäre derselbe Fehler wie
--   der heute behobene Doppelraum in control_iso.
--
-- IDs bleiben (D-…/E-…), damit control_iso/control_risk/control_node_member/
-- control_effect per control_id umgehängt werden können und die Herkunft
-- nachvollziehbar bleibt.
--
-- Idempotent. Keine Antworten betroffen (0 Zeilen in answers).
-- ============================================================================

-- 1) Zielframework -----------------------------------------------------------
INSERT INTO public.frameworks (code, name_de, name_en, role, uses_maturity, color, sort_order)
VALUES ('KI_SEC',
        'KI-Sicherheit (CWS-Härtung)',
        'AI Security (CWS Hardening)',
        'spoke', false, '#7C3AED', 115)
ON CONFLICT (code) DO UPDATE
  SET name_de = EXCLUDED.name_de, name_en = EXCLUDED.name_en, role = EXCLUDED.role;

-- 2) Die 15 Kontrollen -------------------------------------------------------
-- Quellen einzeln verifiziert (Recherche 13.09.2026):
--   • IT-Grundschutz-Kompendium Edition 2023 — es gibt KEINEN KI-Baustein;
--     KI deckt das BSI ausschließlich über separate Publikationen ab.
--   • BSI-Standard 200-2 „IT-Grundschutz-Methodik" — Kap. 8.2 Schutzbedarfs-
--     feststellung, Kap. 8.3 Modellierung.
--   • Cloud-KI: C5 enthält KEINE KI-Kriterien. Die KI-Erweiterung ist der
--     „AI Cloud Service Compliance Criteria Catalogue (AIC4)" (02.02.2021),
--     bewusst nicht fortgeschrieben, keine Zertifizierung; C5 ist Voraus-
--     setzung. Nachfolger in Arbeit: BSI A5 (Community Draft 03.08.2026).
--   • OWASP: aktuelle Fassung ist „OWASP Top 10 for LLM Applications 2026"
--     (v1.0, August 2026); die Fassung 2025 ist archiviert.
INSERT INTO public.controls (framework, id, req_de, req_en, muss, source, meta) VALUES

 ('KI_SEC','D-02.4',
  'Ist der Zugang zu Trainingsdaten und Modell-Repositories zusätzlich durch Mehr-Faktor-Authentifizierung und IP-Einschränkung geschützt?',
  'Is access to training data and model repositories additionally protected by multi-factor authentication and IP restriction?',
  'false','KI-SEC-15-v1',
  '{"topic":"T07","subgroup":"KI-Zugriff","legal_ref":"OWASP Top 10 for LLM Applications 2026, LLM04 Supply Chain; ISO/IEC 27001:2022 A.5.15, A.8.3","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Trainingsdaten und Modell-Repositories sind KI-eigene Bestände: wer sie verändert, verändert das Modellverhalten, ohne eine Anwendung anzufassen. Der allgemeine Zugriffsschutz des Basiskatalogs adressiert diese Bestände nicht ausdrücklich."}'::jsonb),

 ('KI_SEC','D-02.5',
  'Ist über ein zentrales Gateway sichergestellt, dass ausschließlich freigegebene KI-Dienste erreichbar sind?',
  'Does a central gateway ensure that only approved AI services can be reached?',
  'false','KI-SEC-15-v1',
  '{"topic":"T07","subgroup":"KI-Zugriff","legal_ref":"BSI, Kriterienkatalog zur Integration von extern bereitgestellten generativen KI-Modellen in eigene Anwendungen (24.06.2025)","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Adressiert Schatten-KI: Beschäftigte nutzen nicht freigegebene KI-Dienste und geben dabei Unternehmensinformationen preis. Eine allgemeine Web-/Nutzungsrichtlinie erfasst diesen Kanal nicht."}'::jsonb),

 ('KI_SEC','D-04.1',
  'Bestehen wirksame Schutzmaßnahmen gegen Prompt Injection durch Filterung der Eingaben und Validierung der Ausgaben?',
  'Are effective safeguards against prompt injection in place, filtering inputs and validating outputs?',
  'false','KI-SEC-15-v1',
  '{"topic":"T08","subgroup":"KI-Angriffsflächen","legal_ref":"OWASP Top 10 for LLM Applications 2026, LLM01 Prompt Injection; LLM10 Improper Output Handling","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Prompt Injection hat kein Gegenstück in der klassischen Anwendungssicherheit: Anweisung und Daten teilen sich denselben Kanal. Weder AI Act noch ISO 42001 noch der Basiskatalog fragen das ab."}'::jsonb),

 ('KI_SEC','D-04.2',
  'Werden KI-Workloads durch Container-Isolierung voneinander getrennt betrieben?',
  'Are AI workloads operated separately from one another through container isolation?',
  'false','KI-SEC-15-v1',
  '{"topic":"T08","subgroup":"KI-Angriffsflächen","legal_ref":"BSI IT-Grundschutz-Kompendium Edition 2023, SYS.1.6 Containerisierung","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Mehrere Modelle oder Mandanten auf derselben Laufzeitumgebung können sich über gemeinsame Ressourcen beeinflussen. SYS.1.6 liefert die Anforderungen; der KI-Bezug stellt sicher, dass die Modelle in der Betrachtung nicht fehlen."}'::jsonb),

 ('KI_SEC','D-04.3',
  'Sind auf API-Ebene Ratenbegrenzung und Anomalie-Erkennung aktiviert, um Missbrauch der KI-Dienste früh zu erkennen?',
  'Are rate limiting and anomaly detection enabled at API level to detect misuse of AI services early?',
  'false','KI-SEC-15-v1',
  '{"topic":"T08","subgroup":"KI-Angriffsflächen","legal_ref":"OWASP Top 10 for LLM Applications 2026, LLM06 Unbounded Consumption (inkl. Denial of Wallet)","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Bei nutzungsabhängig abgerechneten KI-Diensten erzeugt Missbrauch unmittelbar Kosten, nicht nur Last. Diese Kostenseite fehlt in der klassischen Verfügbarkeitsbetrachtung."}'::jsonb),

 ('KI_SEC','D-04.4',
  'Werden Ein- und Ausgaben der KI-Systeme so protokolliert, dass eine Entscheidung nachvollzogen werden kann?',
  'Are AI system inputs and outputs logged such that a decision can be reconstructed?',
  'false','KI-SEC-15-v1',
  '{"topic":"T14","subgroup":"KI-Protokollierung","legal_ref":"BSI IT-Grundschutz-Kompendium Edition 2023, OPS.1.1.5 Protokollierung","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Prompt und Antwort sind der eigentliche Vorgang eines KI-Systems. Ein allgemeines Protokollierungskonzept erfasst Systemereignisse, nicht den Inhalt der Interaktion. Aufbewahrung und Zugriff sind datenschutzrechtlich abzuwägen."}'::jsonb),

 ('KI_SEC','D-04.5',
  'Wird die Herkunft vortrainierter Modelle nachvollziehbar belegt und bewertet?',
  'Is the provenance of pre-trained models documented and assessed in a verifiable way?',
  'false','KI-SEC-15-v1',
  '{"topic":"T13","subgroup":"KI-Lieferkette","legal_ref":"OWASP Top 10 for LLM Applications 2026, LLM04 Supply Chain (deckt ausdrücklich vortrainierte Modelle, Datensätze und Modellartefakte ab)","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Ein übernommenes Modell bringt fremde Trainingsdaten und fremdes Verhalten mit, ohne dass eine Lieferantenprüfung dies sichtbar macht. Die Lieferantenkontrollen des Basiskatalogs bewerten Organisationen, nicht Modellartefakte."}'::jsonb),

 ('KI_SEC','D-06.1',
  'Sind KI-spezifische Vorfallstypen ausdrücklich im Vorfallbehandlungsplan berücksichtigt?',
  'Are AI-specific incident types explicitly covered by the incident response plan?',
  'false','KI-SEC-15-v1',
  '{"topic":"T14","subgroup":"KI-Vorfälle","legal_ref":"BSI IT-Grundschutz-Kompendium Edition 2023, DER.2.1 Behandlung von Sicherheitsvorfällen","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Modellmanipulation, Prompt Injection oder Datenabfluss über Antworten passen in kein bestehendes Vorfallsraster. Ohne eigenen Typ werden sie als Anwendungsstörung behandelt und falsch eskaliert."}'::jsonb),

 ('KI_SEC','D-07.1',
  'Sind für den Ausfall von KI-Systemen Rückfallverfahren festgelegt, mit denen der Prozess ohne KI weiterläuft?',
  'Are fallback procedures defined for AI system outages so the process continues without AI?',
  'false','KI-SEC-15-v1',
  '{"topic":"T15","subgroup":"KI-Fortführung","legal_ref":"BSI-Standard 200-4 Business Continuity Management","source":"CWS-Härtung","herkunft":"ISO27001_AI","description":"Die Notfallplanung fragt nach Wiederanlauf des Systems. Hier geht es um die andere Frage: ob der Geschäftsprozess ohne das KI-System überhaupt durchführbar bleibt — sonst entsteht eine unbemerkte Einzelabhängigkeit."}'::jsonb),

 ('KI_SEC','E-01.1',
  'Sind die eingesetzten KI-Systeme in die IT-Grundschutz-Modellierung aufgenommen worden?',
  'Have the AI systems in use been included in the IT-Grundschutz modelling?',
  'true','KI-SEC-15-v1',
  '{"topic":"T01","subgroup":"KI im Grundschutz","legal_ref":"BSI-Standard 200-2 IT-Grundschutz-Methodik, Kapitel 8.3 Modellierung eines Informationsverbunds","source":"CWS-Härtung","herkunft":"BSI_AI","description":"Das IT-Grundschutz-Kompendium (Edition 2023) enthält keinen KI-Baustein. KI-Systeme fallen daher bei der Modellierung leicht heraus und erscheinen in keiner Baustein-Zuordnung. Pflicht für alle, die nach IT-Grundschutz arbeiten."}'::jsonb),

 ('KI_SEC','E-01.2',
  'Wurde für die KI-Systeme eine Schutzbedarfsfeststellung durchgeführt?',
  'Has a protection requirements analysis been carried out for the AI systems?',
  'true','KI-SEC-15-v1',
  '{"topic":"T01","subgroup":"KI im Grundschutz","legal_ref":"BSI-Standard 200-2 IT-Grundschutz-Methodik, Kapitel 8.2 Schutzbedarfsfeststellung","source":"CWS-Härtung","herkunft":"BSI_AI","description":"Ohne festgestellten Schutzbedarf lässt sich für ein KI-System kein Sicherheitsniveau begründen. Zu berücksichtigen ist, dass das Modell den Schutzbedarf der Daten erbt, mit denen es trainiert wurde. Pflicht für alle, die nach IT-Grundschutz arbeiten."}'::jsonb),

 ('KI_SEC','E-01.4',
  'Wurden bei der Nutzung von Cloud-KI-Diensten die AIC4-Kriterien geprüft und deren Erfüllung bewertet?',
  'For cloud AI services, have the AIC4 criteria been examined and their fulfilment assessed?',
  'false','KI-SEC-15-v1',
  '{"topic":"T13","subgroup":"KI-Lieferkette","legal_ref":"BSI, AI Cloud Service Compliance Criteria Catalogue (AIC4), 02.02.2021 — Erweiterung des C5; C5 ist Voraussetzung","source":"CWS-Härtung","herkunft":"BSI_AI","hinweis":{"de":"AIC4 wird vom BSI bewusst nicht fortgeschrieben und ist nicht zertifizierbar; der C5 selbst enthält keine KI-Kriterien. Nachfolger in Arbeit: BSI A5 (Community Draft 03.08.2026).","en":"The BSI deliberately does not update AIC4 and no certification exists; C5 itself contains no AI criteria. Successor in progress: BSI A5 (community draft, 3 Aug 2026)."},"description":"Der C5 bewertet den Cloud-Betrieb, nicht das KI-Modell. Für KI-Cloud-Dienste ist AIC4 der einschlägige Kriterienkatalog — mit dem oben genannten Vorbehalt."}'::jsonb),

 ('KI_SEC','E-02.1',
  'Sind KI-Modelle und die zugehörigen Frameworks in das Patch- und Änderungsmanagement einbezogen?',
  'Are AI models and their frameworks included in patch and change management?',
  'false','KI-SEC-15-v1',
  '{"topic":"T09","subgroup":"KI-Betrieb","legal_ref":"BSI IT-Grundschutz-Kompendium Edition 2023, OPS.1.1.3 Patch- und Änderungsmanagement","source":"CWS-Härtung","herkunft":"BSI_AI","description":"Modellgewichte und KI-Bibliotheken sind veränderliche Bestandteile mit eigenen Schwachstellen, tauchen in der Softwareinventur aber oft nicht auf und laufen dadurch am Patch-Prozess vorbei."}'::jsonb),

 ('KI_SEC','E-02.2',
  'Ist ein Testverfahren definiert, das Aktualisierungen von KI-Modellen vor dem Produktiveinsatz systematisch prüft?',
  'Is there a defined test procedure that systematically checks AI model updates before production use?',
  'false','KI-SEC-15-v1',
  '{"topic":"T09","subgroup":"KI-Betrieb","legal_ref":"BSI IT-Grundschutz-Kompendium Edition 2023, OPS.1.1.6 Software-Tests und -Freigaben","source":"CWS-Härtung","herkunft":"BSI_AI","description":"Ein Modellwechsel kann das Verhalten ändern, ohne dass sich eine Codezeile ändert. Ein klassischer Regressionstest bildet das nicht ab; geprüft werden muss die Ausgabequalität gegen feste Fälle."}'::jsonb),

 ('KI_SEC','E-06.4',
  'Wird die OWASP-Liste der zehn wichtigsten Risiken für LLM-Anwendungen als Sicherheitsreferenz genutzt und sind die dort beschriebenen Risiken in den Schutzmaßnahmen berücksichtigt?',
  'Is the OWASP Top 10 for LLM Applications used as a security reference, and are the risks it describes reflected in the safeguards?',
  'false','KI-SEC-15-v1',
  '{"topic":"T08","subgroup":"KI-Angriffsflächen","legal_ref":"OWASP Top 10 for LLM Applications 2026 (v1.0, August 2026)","source":"CWS-Härtung","herkunft":"BSI_AI","hinweis":{"de":"Die Fassung 2025 ist von OWASP archiviert; acht der zehn Einträge haben in der Fassung 2026 neue Positionen.","en":"OWASP has archived the 2025 edition; eight of the ten entries changed position in the 2026 edition."},"description":"Dient als Vollständigkeitsprüfung gegen eine gepflegte externe Risikoliste, damit die eigenen KI-Schutzmaßnahmen nicht nur die selbst erkannten Angriffswege abdecken."}'::jsonb)

ON CONFLICT (framework, id) DO UPDATE
  SET req_de = EXCLUDED.req_de, req_en = EXCLUDED.req_en, muss = EXCLUDED.muss,
      source = EXCLUDED.source, meta = EXCLUDED.meta;

-- 3) Abhängige Zeilen der 15 umhängen ---------------------------------------
INSERT INTO public.control_iso (framework, control_id, iso_id)
SELECT 'KI_SEC', ci.control_id, ci.iso_id
FROM public.control_iso ci
WHERE ci.framework IN ('ISO27001_AI','BSI_AI')
  AND EXISTS (SELECT 1 FROM public.controls k WHERE k.framework='KI_SEC' AND k.id = ci.control_id)
ON CONFLICT DO NOTHING;

INSERT INTO public.control_risk (framework, control_id, risk_id, link_typ)
SELECT 'KI_SEC', cr.control_id, cr.risk_id, cr.link_typ
FROM public.control_risk cr
WHERE cr.framework IN ('ISO27001_AI','BSI_AI')
  AND EXISTS (SELECT 1 FROM public.controls k WHERE k.framework='KI_SEC' AND k.id = cr.control_id)
ON CONFLICT DO NOTHING;

INSERT INTO public.control_node_member (node_id, framework, control_id)
SELECT nm.node_id, 'KI_SEC', nm.control_id
FROM public.control_node_member nm
WHERE nm.framework IN ('ISO27001_AI','BSI_AI')
  AND EXISTS (SELECT 1 FROM public.controls k WHERE k.framework='KI_SEC' AND k.id = nm.control_id)
ON CONFLICT DO NOTHING;

INSERT INTO public.control_effect (framework, control_id, dimension, kind, base_eff)
SELECT 'KI_SEC', ce.control_id, ce.dimension, ce.kind, ce.base_eff
FROM public.control_effect ce
WHERE ce.framework IN ('ISO27001_AI','BSI_AI')
  AND EXISTS (SELECT 1 FROM public.controls k WHERE k.framework='KI_SEC' AND k.id = ce.control_id)
ON CONFLICT DO NOTHING;

-- 4) Alt-Kataloge entfernen (Kindzeilen per FK-Cascade) ----------------------
DELETE FROM public.controls   WHERE framework IN ('ISO27001_AI','BSI_AI');
DELETE FROM public.frameworks WHERE code      IN ('ISO27001_AI','BSI_AI');
UPDATE public.company_profiles
   SET enabled_frameworks = array_remove(array_remove(enabled_frameworks,'ISO27001_AI'),'BSI_AI')
 WHERE enabled_frameworks && ARRAY['ISO27001_AI','BSI_AI'];
