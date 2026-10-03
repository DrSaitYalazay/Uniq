-- ============================================================================
-- AI-Act-Kontrollkatalog — Umsetzung des SoA-Prüfberichts vom 02.10.2026
-- („SoA Control Catalogue — Correction Report for the Tool Developers").
--
-- Rechtsstand: VO (EU) 2024/1689 i. d. F. VO (EU) 2026/1744 (konsolidiert
-- 27.07.2026); Leitlinien zu Art. 50, C(2026) 5054 vom 20.07.2026.
--
--  A  4 neue Kontrollen (A-01.6, A-01.7, A-01.8, E-08)
--     + Aufteilungen: A-02.4 (Anhang-I-Weg), E-05b (Händler), T-21b (¶87)
--     IDs E-05 und T-21 bleiben bestehen (Importeur bzw. ¶68), damit vorhandene
--     Antworten der Mandanten nicht verloren gehen.
--  B  Korrigierte Texte (DE + EN), Rechtsgrundlagen und Kennzeichnungen
--  C  Katalogdaten für das Werkzeug: meta.applies_from (Geltungsbeginn),
--     meta.role, meta.policy_flag, meta.statutory_trigger, meta.evidence_hint,
--     meta.book_codes, meta.family; A-50.1 als nicht bewertete Übersicht
--     (meta.scored = false, meta.rollup_of)
--  Risiken: Delta-Risikotexte (DR-…) für neue und inhaltlich geänderte Kontrollen
--
-- Idempotent. Läuft NACH allen übrigen KI-Seeds (ai_controls_fix, ai_new_controls,
-- ai_risk_texts, ki_sec_consolidation, aiact_muss_legalref, ki_risiken_luecke),
-- weil ai_controls_fix bei jedem Deploy die alten englischen Texte erneut setzt.
-- Offene Punkte des Berichts (amtlicher EUR-Lex-Text nicht abrufbar) sind in
-- meta.applies_from_note als „offen" vermerkt.
-- ============================================================================
BEGIN;

-- ── Hilfsfunktion: meta zusammenführen ──────────────────────────────────────
CREATE OR REPLACE FUNCTION pg_temp.m(fw text, cid text, patch jsonb) RETURNS void LANGUAGE sql AS $f$
  UPDATE public.controls SET meta = COALESCE(meta, '{}'::jsonb) || patch WHERE framework = fw AND id = cid;
$f$;
CREATE OR REPLACE FUNCTION pg_temp.t(cid text, de text, en text, ref text) RETURNS void LANGUAGE sql AS $f$
  UPDATE public.controls
     SET req_de = de, req_en = en,
         meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object('legal_ref', ref, 'binding_source', 'AI Act, konsolidiert 27.07.2026', 'review', 'SoA-Prüfbericht 02.10.2026')
   WHERE framework = 'AIACT' AND id = cid;
$f$;
CREATE OR REPLACE FUNCTION pg_temp.r(cid text, de text, en text) RETURNS void LANGUAGE sql AS $f$
  INSERT INTO public.risks (risk_id, quelle, text_de, text_en, primary_control_framework, primary_control_id)
  VALUES ('DR-' || cid, 'Delta-Pack', de, en, 'AIACT', cid)
  ON CONFLICT (risk_id) DO UPDATE SET text_de = EXCLUDED.text_de, text_en = EXCLUDED.text_en,
                                      primary_control_framework = 'AIACT', primary_control_id = EXCLUDED.primary_control_id;
  INSERT INTO public.control_risk (framework, control_id, risk_id, link_typ)
  VALUES ('AIACT', cid, 'DR-' || cid, 'delta')
  ON CONFLICT (framework, control_id, risk_id) DO NOTHING;
$f$;

-- ════════════════════════════════════════════════════════════════════════════
-- A · Neue Kontrollen
-- ════════════════════════════════════════════════════════════════════════════
INSERT INTO public.controls (framework, id, req_de, req_en, muss, meta) VALUES
 ('AIACT', 'AIACT-A-01.6',
  $$Ist sichergestellt, dass kein KI-System in Verkehr gebracht, für diesen Zweck in Betrieb genommen oder verwendet wird, das Datenbanken zur Gesichtserkennung durch das ungezielte Auslesen von Gesichtsbildern aus dem Internet oder von Überwachungsaufnahmen erstellt oder erweitert (Art. 5 Abs. 1 Buchst. e)?$$,
  $$Is it ensured that no AI system is placed on the market, put into service for this purpose or used to create or expand facial recognition databases through the untargeted scraping of facial images from the internet or CCTV footage (Article 5(1)(e))?$$,
  'true', '{"coverage":"delta","iso_ids":[]}'::jsonb),
 ('AIACT', 'AIACT-A-01.7',
  $$Ist sichergestellt, dass kein KI-System in Verkehr gebracht, in Betrieb genommen oder verwendet wird, um realistische Bilder, Videos, Audio- oder vergleichbare Inhalte der Intimbereiche einer identifizierbaren Person oder einer identifizierbaren Person bei sexuell expliziten Handlungen ohne deren freiwillige, spezifische, informierte, unmissverständliche und ausdrückliche Einwilligung zu erzeugen oder zu manipulieren — und dass bei selbst bereitgestellten Systemen eine solche Erzeugung weder bestimmungsgemäßer Zweck noch ein vernünftigerweise vorhersehbares und reproduzierbares Ergebnis ohne angemessene Schutzvorkehrungen ist (Art. 5 Abs. 1 Buchst. ba, Abs. 1a, 1b)?$$,
  $$Is it ensured that no AI system is placed on the market, put into service or used to generate or manipulate realistic images, videos, audio or similar material of an identifiable natural person's intimate parts or of an identifiable natural person engaged in sexually explicit activities without that person's freely given, specific, informed, unambiguous and explicit consent — and, for systems the organisation provides, that the generation is neither the intended purpose nor a reasonably foreseeable and reproducible outcome lacking adequate safeguards (Article 5(1)(ba), 5(1a), 5(1b))?$$,
  'true', '{"coverage":"delta","iso_ids":[]}'::jsonb),
 ('AIACT', 'AIACT-A-01.8',
  $$Ist sichergestellt, dass kein KI-System in Verkehr gebracht, in Betrieb genommen oder verwendet wird, um Darstellungen sexuellen Kindesmissbrauchs oder entsprechende Darbietungen im Sinne von Art. 2 Buchst. c und e der Richtlinie 2011/93/EU zu erzeugen oder zu manipulieren — und dass bei selbst bereitgestellten Systemen eine solche Erzeugung weder bestimmungsgemäßer Zweck noch ein vernünftigerweise vorhersehbares und reproduzierbares Ergebnis ohne angemessene Schutzvorkehrungen ist (Art. 5 Abs. 1 Buchst. bb, Abs. 1a)?$$,
  $$Is it ensured that no AI system is placed on the market, put into service or used to generate or manipulate child sexual abuse material or a related performance within the meaning of Article 2, points (c) and (e), of Directive 2011/93/EU — and, for systems the organisation provides, that such generation is neither the intended purpose nor a reasonably foreseeable and reproducible outcome lacking adequate safeguards (Article 5(1)(bb), 5(1a))?$$,
  'true', '{"coverage":"delta","iso_ids":[]}'::jsonb),
 ('AIACT', 'AIACT-E-08',
  $$Werden vor Inbetriebnahme oder Verwendung eines Hochrisiko-KI-Systems am Arbeitsplatz die Arbeitnehmervertretungen und die betroffenen Beschäftigten darüber informiert, dass sie der Verwendung unterliegen werden (Art. 26 Abs. 7), und werden natürliche Personen darüber informiert, dass sie einem Hochrisiko-KI-System nach Anhang III unterliegen, das sie betreffende Entscheidungen trifft oder dabei unterstützt (Art. 26 Abs. 11)?$$,
  $$Before a high-risk AI system is put into service or used at the workplace, are workers' representatives and the affected workers informed that they will be subject to its use (Article 26(7)), and are natural persons informed that they are subject to an Annex III high-risk AI system that makes or assists decisions relating to them (Article 26(11))?$$,
  'true', '{"coverage":"delta","iso_ids":[]}'::jsonb),
 ('AIACT', 'AIACT-A-02.4',
  $$Wurde jedes KI-System auf den Weg über Anhang I geprüft — Sicherheitsbauteil eines Produkts oder selbst ein Produkt, das einer Konformitätsbewertung durch Dritte unterliegt —, unter Berücksichtigung von Art. 6 Abs. 1a bis 1c (Funktionen ohne Sicherheitsbezug sind keine Sicherheitsbauteile; eine Drittbewertung allein wegen anderer als Gesundheits- und Sicherheitsrisiken genügt nicht)?$$,
  $$Has each AI system been checked for the Annex I product route — safety component of, or itself, a product subject to third-party conformity assessment — taking into account Article 6(1a)–(1c) (non-safety functions are not safety components; third-party assessment solely for non-health-and-safety risks does not qualify)?$$,
  'true', '{"coverage":"delta","iso_ids":[]}'::jsonb),
 ('AIACT', 'AIACT-E-05b',
  $$Prüft die Organisation als Händler vor der Bereitstellung eines Hochrisiko-KI-Systems die CE-Kennzeichnung, die EU-Konformitätserklärung und die Betriebsanleitung sowie, dass Anbieter und Einführer Art. 16 Buchst. b und c und Art. 23 Abs. 3 erfüllt haben (Art. 24 Abs. 1)?$$,
  $$Before making a high-risk AI system available, does the organisation as distributor verify the CE marking, the EU declaration of conformity and instructions for use, and that the provider and importer have complied with Article 16(b), (c) and Article 23(3) (Article 24(1))?$$,
  'true', '{"coverage":"delta","iso_ids":[]}'::jsonb),
 ('AIACT', 'AIACT-T-21b',
  $$Wird die Erleichterung für streng technische Industrie-/B2B-Ausgaben nur genutzt, wenn die drei kumulativen Bedingungen der Leitlinien ¶87 je System geprüft und dokumentiert sind (streng technische Ausgabe; nur von einem begrenzten, vorab festgelegten Kreis von Fachleuten bei Anbieter und Betreiber wahrgenommen; keine Weitergabe nach außen, mit Schutz gegen Missbrauch)?$$,
  $$Where the industrial / business-to-business relief is relied on, have the three cumulative conditions of Guidelines §87 (strictly technical output; perceived only by a limited pre-defined group of professionals within provider and deployer; not shared outside, with safeguards against misuse) been assessed and recorded for each system?$$,
  'false', '{"coverage":"delta","iso_ids":[],"section":"Art. 50 Transparenz · Art. 50(2) Markierung"}'::jsonb)
ON CONFLICT (framework, id) DO UPDATE SET req_de = EXCLUDED.req_de, req_en = EXCLUDED.req_en, muss = EXCLUDED.muss,
  meta = COALESCE(public.controls.meta, '{}'::jsonb) || EXCLUDED.meta;

SELECT pg_temp.m('AIACT','AIACT-A-01.6', jsonb_build_object('legal_ref','AI Act Art. 5 Abs. 1 Buchst. e (ungezieltes Auslesen von Gesichtsbildern)',
  'applicability_condition','Gilt für jede Organisation (Verbot); bei fehlender Gesichts-/Biometrieverarbeitung als „umgesetzt" mit dokumentiertem Negativbefund.',
  'evidence_hint','Eintrag im KI-Inventar ohne Gesichtsdatenbank; bei Video/Biometrie dokumentierter Zweck und Datenquelle; Beschaffungsklausel gegen ausgelesene Trainingsdaten.'));
SELECT pg_temp.m('AIACT','AIACT-A-01.7', jsonb_build_object('legal_ref','AI Act Art. 5 Abs. 1 Buchst. ba, Abs. 1a, 1b i. d. F. VO (EU) 2026/1744 (nicht einvernehmliche intime Inhalte)',
  'applicability_condition','Überall, wo generative Bild-, Video- oder Audiofunktionen bereitgestellt oder genutzt werden (auch Chat-Werkzeuge mit Bildgenerierung).',
  'evidence_hint','Anbieter: Schutzmaßnahmen, Red-Team-Ergebnisse, Melde- und Korrekturprozess. Betreiber: Nutzungsrichtlinie, technische Filter, Protokollprüfung.'));
SELECT pg_temp.m('AIACT','AIACT-A-01.8', jsonb_build_object('legal_ref','AI Act Art. 5 Abs. 1 Buchst. bb, Abs. 1a i. d. F. VO (EU) 2026/1744; RL 2011/93/EU Art. 2 Buchst. c, e',
  'applicability_condition','Wie A-01.7.',
  'evidence_hint','Wie A-01.7, zusätzlich Hash-Abgleich/Klassifikatoren, wenn nutzergenerierte Ausgaben gehostet werden.'));
SELECT pg_temp.m('AIACT','AIACT-E-08', jsonb_build_object('legal_ref','AI Act Art. 26 Abs. 7, Abs. 11',
  'applicability_condition','Mindestens ein Hochrisiko-KI-System am Arbeitsplatz oder für Entscheidungen über natürliche Personen.',
  'evidence_hint','Information an Betriebsrat/Beschäftigte mit Datum; Informationstext für Betroffene (kombinierbar mit DSGVO Art. 13/14 und Art. 50 Abs. 3); in Deutschland Betriebsvereinbarung nach § 87 Abs. 1 Nr. 6 BetrVG.'));
SELECT pg_temp.m('AIACT','AIACT-A-02.4', jsonb_build_object('legal_ref','AI Act Art. 6 Abs. 1, Abs. 1a–1c i. d. F. VO (EU) 2026/1744; Anhang I'));
SELECT pg_temp.m('AIACT','AIACT-E-05b', jsonb_build_object('legal_ref','AI Act Art. 24 Abs. 1'));
SELECT pg_temp.m('AIACT','AIACT-T-21b', jsonb_build_object('legal_ref','AI Act Art. 50(2); Guidelines ¶87'));

-- ════════════════════════════════════════════════════════════════════════════
-- B · Korrekturen (Texte DE + EN, Rechtsgrundlage)
-- ════════════════════════════════════════════════════════════════════════════
SELECT pg_temp.t('AIACT-A-01.1',
 $$Ist sichergestellt, dass kein KI-System natürliche Personen über einen gewissen Zeitraum anhand ihres sozialen Verhaltens oder bekannter, abgeleiteter oder vorhergesagter persönlicher Merkmale bewertet oder einstuft, wenn die daraus folgende Bewertung zu einer Schlechterstellung in sachfremden sozialen Zusammenhängen oder zu einer ungerechtfertigten oder unverhältnismäßigen Schlechterstellung führt (Art. 5 Abs. 1 Buchst. c)? [Optionale interne Vorgabe: kein Social Scoring jeglicher Art.]$$,
 $$Is it ensured that no AI system is used to evaluate or classify natural persons over time on the basis of social behaviour or known, inferred or predicted personal or personality characteristics where the resulting score leads to detrimental or unfavourable treatment in unrelated social contexts or treatment that is unjustified or disproportionate (Article 5(1)(c))? [Optional internal policy: no social scoring of any kind.]$$,
 'AI Act Art. 5 Abs. 1 Buchst. c (Social Scoring mit Schlechterstellung)');
SELECT pg_temp.t('AIACT-A-01.2',
 $$Ist sichergestellt, dass keine biometrische Echtzeit-Fernidentifizierung in öffentlich zugänglichen Räumen zu Strafverfolgungszwecken eingesetzt wird, außer in den engen Ausnahmen und unter den Genehmigungsvoraussetzungen von Art. 5 Abs. 1 Buchst. h und Abs. 2 bis 7? Wurde eine biometrische Fernidentifizierung zu anderen Zwecken als Hochrisiko (Anhang III Nr. 1 Buchst. a) eingestuft und gegen Art. 9 DSGVO geprüft? [Optionale interne Vorgabe: keine biometrische Fernidentifizierung.]$$,
 $$Is it ensured that no real-time remote biometric identification system is used in publicly accessible spaces for law-enforcement purposes, save under the narrow exceptions and prior-authorisation conditions of Article 5(1)(h) and 5(2)–(7)? Where remote biometric identification is used for any other purpose, has it been classified as high-risk (Annex III point 1(a)) and checked against Article 9 GDPR? [Optional internal policy: no remote biometric identification at all.]$$,
 'AI Act Art. 5 Abs. 1 Buchst. h, Abs. 2–7; Anhang III Nr. 1 Buchst. a; DSGVO Art. 9');
SELECT pg_temp.t('AIACT-A-01.3',
 $$Ist sichergestellt, dass kein KI-System unterschwellige, gezielt manipulative oder täuschende Techniken einsetzt oder Schwächen aufgrund von Alter, Behinderung oder einer besonderen sozialen oder wirtschaftlichen Lage ausnutzt, mit dem Ziel oder der Wirkung, das Verhalten wesentlich zu verzerren, sodass ein erheblicher Schaden entsteht oder hinreichend wahrscheinlich ist (Art. 5 Abs. 1 Buchst. a und b)?$$,
 $$Is it ensured that no AI system deploys subliminal, purposefully manipulative or deceptive techniques, or exploits vulnerabilities due to age, disability or a specific social or economic situation, with the objective or effect of materially distorting behaviour in a manner that causes or is reasonably likely to cause significant harm (Article 5(1)(a)–(b))?$$,
 'AI Act Art. 5 Abs. 1 Buchst. a, b (Manipulation, Ausnutzung von Schwächen — mit Erheblichkeitsschwellen)');
SELECT pg_temp.t('AIACT-A-01.4',
 $$Ist sichergestellt, dass kein KI-System eingesetzt wird, um das Risiko einer Straftat durch eine natürliche Person ausschließlich auf Grundlage von Profiling oder der Bewertung von Persönlichkeitsmerkmalen einzuschätzen oder vorherzusagen — ausgenommen Systeme, die eine menschliche Bewertung unterstützen, die bereits auf objektiven und überprüfbaren, unmittelbar mit einer kriminellen Tätigkeit verbundenen Tatsachen beruht (Art. 5 Abs. 1 Buchst. d)?$$,
 $$Is it ensured that no AI system is used to assess or predict the risk of a natural person committing a criminal offence based solely on profiling or on assessing personality traits and characteristics, with the exception of systems supporting a human assessment already based on objective and verifiable facts directly linked to a criminal activity (Article 5(1)(d))?$$,
 'AI Act Art. 5 Abs. 1 Buchst. d (Straftatprognose — mit Ausnahme für unterstützende Systeme)');
SELECT pg_temp.t('AIACT-A-02.2',
 $$Wurde jedes KI-System gegen alle acht Bereiche des Anhangs III geprüft, und wurde bei einem Treffer die Ausnahme nach Art. 6 Abs. 3 geprüft und das Ergebnis vor dem Inverkehrbringen oder der Inbetriebnahme dokumentiert (Art. 6 Abs. 2 bis 4)?$$,
 $$Has each AI system been checked against all eight Annex III areas, and where an Annex III match exists, has the Article 6(3) derogation been assessed and the conclusion documented before placing on the market or putting into service (Article 6(2)–(4))?$$,
 'AI Act Art. 6 Abs. 2–4; Anhang III');
SELECT pg_temp.t('AIACT-A-02.5',
 $$Wird bei einer wesentlichen Änderung eines KI-Systems oder seines Verwendungszwecks die Einstufung erneut durchgeführt, das Ergebnis im KI-Inventar festgehalten und den betroffenen Betreibern mitgeteilt (bei Ergebnissen nach Art. 6 Abs. 3 auch in der Registrierung nach Art. 49 Abs. 2), und wird geprüft, ob die Organisation dadurch nach Art. 25 Abs. 1 zum Anbieter geworden ist?$$,
 $$When an AI system is substantially modified or its intended purpose changes, is the classification re-run, the result recorded in the inventory and communicated to the deployers concerned (and, for Article 6(3) conclusions, reflected in the EU-database registration under Article 49(2)), and is it checked whether the organisation has become the provider under Article 25(1)?$$,
 'AI Act Art. 25 Abs. 1, Art. 49 Abs. 2, Art. 6 Abs. 4');
SELECT pg_temp.t('AIACT-A-03.3',
 $$Wird das Hochrisiko-KI-System vor dem Inverkehrbringen oder der Inbetriebnahme anhand vorab festgelegter Metriken und probabilistischer Schwellenwerte getestet, die seinem bestimmungsgemäßen Zweck entsprechen (Art. 9 Abs. 6 bis 8), und wird ein Test unter Realbedingungen, falls gewählt, nach Art. 60 durchgeführt (siehe E-07)?$$,
 $$Is the high-risk AI system tested, against pre-defined metrics and probabilistic thresholds appropriate to its intended purpose, before placing on the market or putting into service (Article 9(6)–(8)); and where testing in real-world conditions is chosen, is it conducted under Article 60 (see E-07)?$$,
 'AI Act Art. 9 Abs. 6–8 (Wortlaut offen: Artikelseite nicht erneut abgerufen); Art. 60');
SELECT pg_temp.t('AIACT-A-06.2',
 $$Sind die automatisch erzeugten Protokolle gegen unbefugte Änderung und Löschung geschützt, mit einer dem Risiko angemessenen Integritätsprüfung (z. B. WORM-Speicher, Hashwerte oder Signaturen), und ist der Zugriff darauf beschränkt und selbst protokolliert?$$,
 $$Are the automatically generated logs protected against unauthorised modification and deletion, with integrity verification (e.g., write-once storage, hashing or signing) proportionate to the risk, and is access to them restricted and itself logged?$$,
 'AI Act Art. 12 Abs. 1, Art. 15 (Wortlaut Art. 15 offen); ISO/IEC 27001:2022 A.8.15');
SELECT pg_temp.t('AIACT-A-06.3',
 $$Ist für die vom Hochrisiko-KI-System automatisch erzeugten Protokolle, die der Kontrolle der Organisation unterliegen, eine dem bestimmungsgemäßen Zweck angemessene Aufbewahrungsfrist von mindestens sechs Monaten festgelegt — soweit Unions- oder nationales Recht, insbesondere Datenschutzrecht, nichts anderes vorsieht —, und ist die Rolle festgehalten (Anbieter: Art. 19; Betreiber: Art. 26 Abs. 6)?$$,
 $$For the logs automatically generated by the high-risk AI system that are under the organisation's control, is a retention period defined that is appropriate to the intended purpose and at least six months, unless Union or national law (in particular data-protection law) provides otherwise, and is the role (provider: Article 19; deployer: Article 26(6)) recorded?$$,
 'AI Act Art. 19 Abs. 1, Art. 26 Abs. 6');
SELECT pg_temp.t('AIACT-A-11.2',
 $$Wurde für jedes Hochrisiko-KI-System die EU-Konformitätserklärung ausgestellt (maschinenlesbar, physisch oder elektronisch unterzeichnet), wird sie aktuell gehalten, und ist gesichert, dass sie zehn Jahre nach dem Inverkehrbringen oder der Inbetriebnahme für die zuständigen Behörden bereitgehalten wird (Art. 47 Abs. 1 und 4; Art. 18 Abs. 1 Buchst. e)?$$,
 $$Has the EU declaration of conformity been drawn up (machine-readable, physically or electronically signed) for each high-risk AI system, kept up to date, and is its retention at the disposal of the national competent authorities for ten years after placing on the market or putting into service secured (Article 47(1), (4); Article 18(1)(e))?$$,
 'AI Act Art. 47 Abs. 1, 4; Art. 18 Abs. 1');
SELECT pg_temp.t('AIACT-A-11.4',
 $$Wurde der zutreffende Registrierungsweg ermittelt und vor dem Inverkehrbringen bzw. der Inbetriebnahme abgeschlossen: Registrierung des Anhang-III-Systems durch den Anbieter (Art. 49 Abs. 1), Registrierung einer Einstufung „kein Hochrisiko" nach Art. 6 Abs. 3 (Art. 49 Abs. 2), Registrierung der Verwendung durch einen Betreiber, der Behörde ist (Art. 49 Abs. 3), Registrierung im gesicherten Teil für Anhang III Nr. 1, 6 und 7 (Art. 49 Abs. 4) oder nationale Registrierung für Anhang III Nr. 2 (Art. 49 Abs. 5)?$$,
 $$Has the applicable registration route been identified and completed before placing on the market / putting into service: provider registration of the Annex III system (Article 49(1)), registration of an Article 6(3) 'not high-risk' conclusion (Article 49(2)), registration of use by a public-authority deployer (Article 49(3)), secure-section registration for Annex III points 1, 6, 7 (Article 49(4)), or national registration for Annex III point 2 (Article 49(5))?$$,
 'AI Act Art. 49 Abs. 1–5 (Anhang-I-Systeme werden nicht nach Art. 49 registriert)');
SELECT pg_temp.t('AIACT-A-12.5',
 $$Wird die Grundrechte-Folgenabschätzung aktualisiert, sobald sich eines ihrer Elemente geändert hat oder nicht mehr aktuell ist (Art. 27 Abs. 2) — und als interne Vorgabe mindestens jährlich überprüft —, mit Verweisen auf die DSFA, soweit Art. 27 Abs. 4 dies zulässt?$$,
 $$Is the fundamental-rights impact assessment updated whenever any of its elements has changed or is no longer up to date (Article 27(2)) — and, as an internal target, reviewed at least annually — with cross-references to the DPIA where permitted by Article 27(4)?$$,
 'AI Act Art. 27 Abs. 2, Abs. 4 i. d. F. VO (EU) 2026/1744');
SELECT pg_temp.t('AIACT-A-14.5',
 $$Wird für jedes KI-Modell mit allgemeinem Verwendungszweck, das als Modell mit systemischem Risiko eingestuft ist — über die Vermutung von 10²⁵ FLOP Trainingsrechenleistung (Art. 51 Abs. 2) oder durch Entscheidung der Kommission (Art. 51 Abs. 1 Buchst. b, Art. 52) —, eine Modellbewertung einschließlich Angriffstests durchgeführt und dokumentiert (Art. 55 Abs. 1 Buchst. a)?$$,
 $$For each general-purpose AI model classified as having systemic risk — by the 10^25 FLOP training-compute presumption (Article 51(2)) or by Commission decision (Article 51(1)(b), Article 52) — is model evaluation including adversarial testing carried out and documented (Article 55(1)(a))?$$,
 'AI Act Art. 51 Abs. 1–3, Art. 52; Art. 55 Abs. 1 Buchst. a (Wortlaut Art. 55 offen)');
SELECT pg_temp.t('AIACT-A-50.1',
 $$Übersicht Art. 50 Transparenzpflichten — wird aus den Einzelkontrollen T-01 bis T-43 abgeleitet und nicht gesondert bewertet.$$,
 $$Article 50 transparency — overview derived from T-01…T-43; not scored separately.$$,
 'AI Act Art. 50 Abs. 1–5 (Übersicht; Bewertung in den T-Kontrollen)');
SELECT pg_temp.t('AIACT-E-02',
 $$Kann eine natürliche Person, über die die Organisation als Betreiber auf Grundlage der Ausgabe eines Hochrisiko-KI-Systems nach Anhang III (außer Nr. 2) eine Entscheidung trifft, die Rechtswirkungen entfaltet oder sie ähnlich erheblich beeinträchtigt, eine klare und aussagekräftige Erläuterung der Rolle des KI-Systems und der wesentlichen Elemente der Entscheidung erhalten (Art. 86 Abs. 1) — vorbehaltlich der Ausnahmen nach Art. 86 Abs. 2 und nur, soweit das Recht nicht bereits durch anderes Unionsrecht gewährt wird (Art. 86 Abs. 3)?$$,
 $$Where the organisation as deployer takes a decision on the basis of the output of an Annex III high-risk AI system (other than point 2) that produces legal effects or similarly significantly affects a natural person, can that person obtain clear and meaningful explanations of the role of the AI system and the main elements of the decision (Article 86(1)), subject to the exceptions in Article 86(2) and only insofar as the right is not already provided under other Union law (Article 86(3))?$$,
 'AI Act Art. 86 Abs. 1–3; DSGVO Art. 22, Art. 15');
SELECT pg_temp.t('AIACT-E-03',
 $$Werden Betroffene in den Transparenzhinweisen über ihr Recht informiert, Beschwerde bei der zuständigen Marktüberwachungsbehörde einzulegen (Art. 85), und beschreibt — sofern die Organisation als Betreiber zur Grundrechte-Folgenabschätzung verpflichtet ist — diese Abschätzung die interne Governance und den Beschwerdemechanismus (Art. 27 Abs. 1 Buchst. f)?$$,
 $$Are affected persons informed, in the transparency notices, of their right to complain to the competent market surveillance authority (Article 85) — and, where the organisation is a deployer obliged to carry out a fundamental-rights impact assessment, does the assessment describe the internal governance arrangements and complaint mechanism (Article 27(1)(f))?$$,
 'AI Act Art. 85 (Recht der Betroffenen); Art. 27 Abs. 1 Buchst. f (Pflicht nur für FRIA-pflichtige Betreiber)');
SELECT pg_temp.t('AIACT-E-04',
 $$Hat die Organisation, sofern sie als Anbieter außerhalb der Union niedergelassen ist und ein Hochrisiko-KI-System (Art. 22) oder ein KI-Modell mit allgemeinem Verwendungszweck ohne Open-Source-Ausnahme (Art. 54) bereitstellt, einen in der Union niedergelassenen Bevollmächtigten durch schriftliches Mandat mit den Aufgaben nach Art. 22 Abs. 3 bzw. Art. 54 Abs. 3 bestellt? Prüft sie als Einführer eines Hochrisiko-KI-Systems, dass der Anbieter einen solchen Bevollmächtigten bestellt hat (Art. 23 Abs. 1 Buchst. d)?$$,
 $$Where the organisation is a provider established outside the Union of a high-risk AI system (Article 22) or of a general-purpose AI model not covered by the open-source exception (Article 54), has an authorised representative established in the Union been appointed by written mandate covering the tasks in Article 22(3) / Article 54(3)? Where the organisation imports a high-risk AI system, has it verified that the provider appointed such a representative (Article 23(1)(d))?$$,
 'AI Act Art. 22 Abs. 1, 3; Art. 54 Abs. 1, 3, 6; Art. 23 Abs. 1 Buchst. d');
SELECT pg_temp.t('AIACT-E-05',
 $$Prüft die Organisation als Einführer vor dem Inverkehrbringen eines Hochrisiko-KI-Systems die Konformitätsbewertung, die technische Dokumentation, die CE-Kennzeichnung mit EU-Konformitätserklärung und Betriebsanleitung sowie die Bestellung eines Bevollmächtigten (Art. 23 Abs. 1), gibt sie ihren Namen und ihre Anschrift an (Art. 23 Abs. 3) und bewahrt sie Bescheinigung, Betriebsanleitung und Konformitätserklärung zehn Jahre auf (Art. 23 Abs. 5)?$$,
 $$Before placing a high-risk AI system on the market, does the organisation as importer verify the conformity assessment, the technical documentation, the CE marking with EU declaration of conformity and instructions for use, and the appointment of an authorised representative (Article 23(1)); indicate its name and address (23(3)); and keep the certificate, instructions and declaration for ten years (23(5))?$$,
 'AI Act Art. 23 Abs. 1, 3, 5 (Händlerpflichten: E-05b)');
SELECT pg_temp.t('AIACT-E-06',
 $$Besteht ein Prozess, der — wenn die Organisation als Anbieter der Auffassung ist oder Grund zur Annahme hat, dass ein von ihr in Verkehr gebrachtes oder in Betrieb genommenes Hochrisiko-KI-System nicht konform ist — unverzüglich die geeignete Korrekturmaßnahme auswählt und ergreift (Herstellen der Konformität, Rücknahme, Deaktivierung oder Rückruf), die Händler sowie gegebenenfalls Betreiber, Bevollmächtigten und Einführer informiert (Art. 20 Abs. 1) und — wenn das System ein Risiko im Sinne von Art. 79 Abs. 1 darstellt — die Ursachen untersucht und die zuständige Marktüberwachungsbehörde sowie gegebenenfalls die notifizierte Stelle informiert (Art. 20 Abs. 2)?$$,
 $$Where the organisation as provider considers or has reason to consider that a high-risk AI system it has placed on the market or put into service is not in conformity, does a process immediately select and take the appropriate corrective action (bring into conformity, withdraw, disable or recall), inform the distributors and, where applicable, deployers, authorised representative and importers (Article 20(1)), and — where the system presents a risk within the meaning of Article 79(1) — investigate the causes and inform the competent market surveillance authority and, where applicable, the notified body (Article 20(2))?$$,
 'AI Act Art. 20 Abs. 1–2; Art. 79 Abs. 1');
SELECT pg_temp.t('AIACT-E-07',
 $$Wird jeder Test eines Hochrisiko-KI-Systems eingeordnet als (a) interner technischer Test, (b) Teilnahme an einem KI-Reallabor nach einem Reallaborplan (Art. 57 bis 59) oder (c) Test unter Realbedingungen außerhalb eines Reallabors — und sind für (c) alle Bedingungen nach Art. 60 Abs. 4 erfüllt und dokumentiert (genehmigter Testplan, Registrierung, Niederlassung in der Union oder rechtlicher Vertreter, Dauer höchstens sechs Monate plus eine Verlängerung, Schutz schutzbedürftiger Personen, Vereinbarung mit Betreibern, informierte Einwilligung nach Art. 61, qualifizierte Aufsicht, Umkehrbarkeit der Ausgaben)?$$,
 $$Is each test of a high-risk AI system classified as (a) an internal technical test, (b) participation in an AI regulatory sandbox under a sandbox plan (Articles 57–59), or (c) testing in real-world conditions outside a sandbox — and for (c), are all Article 60(4) conditions met and documented (approved real-world testing plan, registration, Union establishment or legal representative, duration of at most six months plus one extension, protection of vulnerable subjects, deployer agreement, informed consent under Article 61, qualified oversight, reversibility of outputs)?$$,
 'AI Act Art. 60 Abs. 1–4 i. d. F. VO (EU) 2026/1744, Art. 61; Art. 57–59 (Wortlaut offen)');
SELECT pg_temp.t('AIACT-T-15',
 $$Werden Fälle von Art. 50 Abs. 1 nur ausgenommen, wenn die KI-Ausgabe von einem Menschen als Hauptgesprächspartner ordnungsgemäß geprüft und versendet wird — nicht schon, wenn ein Mensch nur eingreifen könnte —, wird dies dokumentiert, und werden Art. 50 Abs. 2 und 4 für die erzeugten Inhalte weiterhin gesondert geprüft?$$,
 $$Are cases set aside from Article 50(1) only where the AI output is properly reviewed and sent by a human who is the main interlocutor — not merely where a human could intervene — and is this documented, with Article 50(2) and (4) still analysed separately for the generated content?$$,
 'AI Act Art. 50(1), 50(2), 50(4); Guidelines ¶30(iii)');
SELECT pg_temp.t('AIACT-T-21',
 $$Ist für Ausgaben, die nur in geschlossenen Industrie- oder Produktentwicklungs-Abläufen verwendet werden, festgehalten, dass nur die endgültige KI-erzeugte Text-, Audio-, Bild- oder Videoausgabe des Ablaufs markiert und erkennbar sein muss (Leitlinien ¶68)?$$,
 $$For outputs used only in closed-loop industrial or product-development workflows, is it recorded that only the final AI-generated text, audio, image or video output of the workflow must be marked and detectable (Guidelines §68)?$$,
 'AI Act Art. 50(2); Guidelines ¶68 (B2B-Erleichterung ¶87: T-21b)');
SELECT pg_temp.t('AIACT-T-22',
 $$Wird die Erleichterung für flüchtige Echtzeitinhalte nur genutzt, wenn der Inhalt in Echtzeit erzeugt, sofort konsumiert und weder aufgezeichnet, gespeichert noch weiterverbreitet wird, die Markierung technisch nicht machbar ist und die betroffenen Personen (z. B. durch einen Hinweis im Erlebnis oder je Sitzung) darüber informiert werden, dass der Inhalt KI-generiert ist (Leitlinien ¶88)?$$,
 $$Where the relief for ephemeral real-time content is relied on, is the content generated in real time, consumed immediately and neither recorded, stored nor disseminated further; is marking technically infeasible; and are the persons exposed made aware (e.g., in-experience disclosure or session-level notification) that the content is AI-generated (Guidelines §88)?$$,
 'AI Act Art. 50(2); Guidelines ¶88');
SELECT pg_temp.t('AIACT-T-34',
 $$Trägt bei Berufung auf die redaktionelle Ausnahme eine juristische oder natürliche Person (oder eine benannte redaktionelle Funktion) die letzte Verantwortung für die Veröffentlichung, und sind deren Identität und Kontaktdaten öffentlich und leicht auffindbar, z. B. in Nutzungsbedingungen, Impressum oder Kolophon (Leitlinien ¶138)?$$,
 $$Where the editorial exception is relied on, does a legal or natural person (or an identified editorial function) hold ultimate responsibility for the publication, and are its identity and contact details publicly and easily findable, e.g., in the terms, legal notice or colophon (Guidelines §138)?$$,
 'AI Act Art. 50(4); Guidelines ¶138');
SELECT pg_temp.t('AIACT-T-42',
 $$Werden Texte, die vor dem 2. August 2026 erzeugt, aber an oder nach diesem Tag veröffentlicht werden, gekennzeichnet, soweit sie unter Art. 50 Abs. 4 Unterabs. 2 fallen (Veröffentlichung zur Information der Öffentlichkeit über Angelegenheiten von öffentlichem Interesse, redaktionelle Ausnahme nicht erfüllt), und ist dokumentiert, dass vor diesem Datum erzeugte Ausgaben nach Art. 50 Abs. 2 und Deepfakes nach Art. 50 Abs. 4 nicht rückwirkend markiert werden müssen (Kennzeichnung ohne unverhältnismäßigen Aufwand empfohlen, Leitlinien ¶154)?$$,
 $$Is text generated before 2 August 2026 but published on or after that date labelled where it falls within Article 50(4), second subparagraph (published to inform the public on matters of public interest, editorial exception not met); and is it recorded that outputs under Article 50(2) and deep fakes under Article 50(4) generated before that date need not be marked retroactively, labelling being encouraged without disproportionate effort (Guidelines §154)?$$,
 'AI Act Art. 50(2), 50(4); Guidelines ¶153-154');

-- Nur Kennzeichnung / Nachweis-Hinweis
SELECT pg_temp.m('AIACT','AIACT-A-01.5', jsonb_build_object('policy_flag','interne_praxis',
  'evidence_hint','Dokumentierter Negativbefund je Anwendung, datiert und freigegeben (Art. 5 schreibt keine Form vor).'));
SELECT pg_temp.m('AIACT','AIACT-A-08.6', jsonb_build_object('policy_flag','interne_praxis',
  'legal_ref','AI Act Art. 26 Abs. 2 (Zuweisung der Aufsicht an kompetente Personen — Verankerung in Stellenbeschreibungen ist interne Praxis)'));
SELECT pg_temp.m('AIACT','AIACT-A-13.1', jsonb_build_object(
  'evidence_hint','Plan als Teil der technischen Dokumentation nach Anhang IV; an die Vorlage der Kommission anpassen, sobald veröffentlicht (Art. 72 Abs. 3: Leitfaden mit Vorlage bis 2. September 2027).'));
SELECT pg_temp.m('AIACT','AIACT-A-03.7', jsonb_build_object('policy_flag','interne_vorgabe',
  'statutory_trigger','Art. 9 Abs. 2: kontinuierlicher, iterativer Prozess über den gesamten Lebenszyklus', 'internal_target','mindestens jährliche Überprüfung'));
SELECT pg_temp.m('AIACT','AIACT-A-12.5', jsonb_build_object('policy_flag','interne_vorgabe',
  'statutory_trigger','Art. 27 Abs. 2: Aktualisierung, sobald sich ein Element geändert hat oder nicht mehr aktuell ist', 'internal_target','mindestens jährliche Überprüfung'));

-- A-50.1: nicht bewertete Übersicht über T-09…T-43 (keine Doppelzählung)
SELECT pg_temp.m('AIACT','AIACT-A-50.1', jsonb_build_object('scored', false, 'rollup', true,
  'rollup_of', (SELECT jsonb_agg(id ORDER BY id) FROM public.controls WHERE framework='AIACT' AND id ~ '^AIACT-T-(09|1[0-9]|2[0-9]|3[0-9]|4[0-3])b?$')));

-- ════════════════════════════════════════════════════════════════════════════
-- C · Katalogdaten: Familie, Geltungsbeginn, Rolle, Buch-Zuordnung
-- ════════════════════════════════════════════════════════════════════════════
-- Familie (Gruppierung in SoA/Bericht; T-07/T-08 sind Art.-5-Prüfungen → A-01)
UPDATE public.controls SET meta = COALESCE(meta,'{}'::jsonb) || jsonb_build_object('family',
  CASE WHEN id IN ('AIACT-T-07','AIACT-T-08') THEN 'A-01'
       WHEN id ~ '^AIACT-A-\d\d' THEN substring(id from '^AIACT-(A-\d\d)')
       WHEN id ~ '^AIACT-E-' THEN 'E'
       WHEN id ~ '^AIACT-T-' THEN 'T'
       ELSE NULL END)
 WHERE framework='AIACT';

-- Geltungsbeginn (Art. 113 i. d. F. VO (EU) 2026/1744 — amtlicher Text nicht abgerufen: offen)
UPDATE public.controls c SET meta = COALESCE(meta,'{}'::jsonb) || v.patch_txt::jsonb
FROM (VALUES
  ('^AIACT-E-01$',                     '{"applies_from":"2025-02-02"}'),
  ('^AIACT-A-01\.[1-6]$',              '{"applies_from":"2025-02-02"}'),
  ('^AIACT-T-0[78]$',                  '{"applies_from":"2025-02-02"}'),
  ('^AIACT-A-01\.[78]$',               '{"applies_from":"2026-12-02","applies_from_note":"Art. 5 Abs. 1 Buchst. ba/bb, Abs. 1a/1b ab 2. Dezember 2026 (Art. 113 Buchst. a i. d. F. VO (EU) 2026/1744; amtlicher Text offen)"}'),
  ('^AIACT-A-(0[2-9]|10|12)\.',        '{"applies_from":"2027-12-02","applies_from_note":"Kapitel III Abschnitte 1–3: Anhang III ab 2. Dezember 2027, Anhang I ab 2. August 2028 (Art. 113 Buchst. c i. d. F. VO (EU) 2026/1744; amtlicher Text offen)"}'),
  ('^AIACT-E-0[2568]b?$',              '{"applies_from":"2027-12-02","applies_from_note":"An die Hochrisiko-Einstufung gebunden: Anhang III ab 2. Dezember 2027, Anhang I ab 2. August 2028"}'),
  ('^AIACT-A-11\.',                    '{"applies_from":"2027-12-02","applies_from_formal":"2026-08-02","applies_from_note":"Formal 2. August 2026 (Kapitel III Abschnitt 5), praktisch an die Einstufung ab 2. Dezember 2027 gebunden — offen, beide Daten erfasst"}'),
  ('^AIACT-A-13\.',                    '{"applies_from":"2027-12-02","applies_from_formal":"2026-08-02","applies_from_note":"Art. 72–73 formal ab 2. August 2026, praktisch an die Hochrisiko-Einstufung gebunden — offen, beide Daten erfasst"}'),
  ('^AIACT-A-14\.',                    '{"applies_from":"2025-08-02","applies_from_note":"Kapitel V ab 2. August 2025; vor diesem Datum in Verkehr gebrachte Modelle bis 2. August 2027 (Art. 111 Abs. 3)"}'),
  ('^AIACT-E-04$',                     '{"applies_from":"2025-08-02","applies_from_note":"Art. 54 (GPAI) ab 2. August 2025; Art. 22 (Hochrisiko) ab 2. Dezember 2027"}'),
  ('^AIACT-E-03$',                     '{"applies_from":"2026-08-02","applies_from_note":"Art. 85 ab 2. August 2026; Art. 27 Abs. 1 Buchst. f ab 2. Dezember 2027"}'),
  ('^AIACT-E-07$',                     '{"applies_from":"2026-08-02"}'),
  ('^AIACT-A-50\.1$',                  '{"applies_from":"2026-08-02"}'),
  ('^AIACT-T-(0[1-35]|09|1[0-6]|2[3-9]|3[0-9]|4[1-3])$', '{"applies_from":"2026-08-02"}'),
  ('^AIACT-T-(04|1[7-9]|2[0-2]|21b|40)$', '{"applies_from":"2026-08-02","applies_from_note":"Generative Systeme, die vor dem 2. August 2026 in Verkehr gebracht wurden: ab 2. Dezember 2026 (Art. 111 Abs. 4)"}')
) AS v(re, patch_txt)
WHERE c.framework='AIACT' AND c.id ~ v.re;

-- Rolle(n) der adressierten Organisation
UPDATE public.controls SET meta = COALESCE(meta,'{}'::jsonb) || jsonb_build_object('role',
  CASE
    WHEN id ~ '^AIACT-A-01\.' OR id IN ('AIACT-T-07','AIACT-T-08','AIACT-E-01') THEN '["anbieter","betreiber"]'::jsonb
    WHEN id ~ '^AIACT-A-02\.' THEN '["anbieter","betreiber"]'::jsonb
    WHEN id IN ('AIACT-A-06.3') THEN '["anbieter","betreiber"]'::jsonb
    WHEN id IN ('AIACT-A-08.6') OR id ~ '^AIACT-A-12\.' OR id IN ('AIACT-E-02','AIACT-E-03','AIACT-E-08') THEN '["betreiber"]'::jsonb
    WHEN id ~ '^AIACT-A-(0[3-9]|1[01]|13)\.' OR id IN ('AIACT-E-06','AIACT-E-07') THEN '["anbieter"]'::jsonb
    WHEN id ~ '^AIACT-A-14\.' THEN '["gpai_anbieter"]'::jsonb
    WHEN id = 'AIACT-E-04' THEN '["anbieter","einfuehrer","gpai_anbieter"]'::jsonb
    WHEN id = 'AIACT-E-05' THEN '["einfuehrer"]'::jsonb
    WHEN id = 'AIACT-E-05b' THEN '["haendler"]'::jsonb
    WHEN id ~ '^AIACT-T-(09|1[0-9]|2[0-2]|21b)$' THEN '["anbieter"]'::jsonb
    WHEN id ~ '^AIACT-T-(2[3-9]|3[0-4])$' THEN '["betreiber"]'::jsonb
    WHEN id ~ '^AIACT-T-' THEN '["anbieter","betreiber"]'::jsonb
    ELSE NULL END)
 WHERE framework='AIACT';
-- A-08.6 betrifft die Zuweisung durch den Betreiber (Art. 26 Abs. 2)
SELECT pg_temp.m('AIACT','AIACT-A-08.6', '{"role":["betreiber"]}'::jsonb);

-- Zuordnung zu den Kontrollcodes des Buchs (viele-zu-viele, als Daten — nie über das ID-Suffix verknüpfen)
UPDATE public.controls c SET meta = COALESCE(meta,'{}'::jsonb) || jsonb_build_object('book_codes', v.codes::jsonb)
FROM (VALUES
  ('^AIACT-E-01$','["C-06","D-08"]'), ('^AIACT-E-02$','["B-03","B-04"]'), ('^AIACT-E-03$','["A-12","B-04"]'),
  ('^AIACT-E-04$','["A-11","A-14"]'), ('^AIACT-E-05b?$','["A-11","C-08","D-05"]'), ('^AIACT-E-06$','["A-11","A-13","D-06"]'),
  ('^AIACT-E-07$','["A-03","E-06"]'), ('^AIACT-E-08$','["F-01","B-04","C-07"]'),
  ('^AIACT-T-0[125]$','["C-02","A-02"]'), ('^AIACT-T-0[78]$','["A-01"]'),
  ('^AIACT-T-(0[34]|09|[1-4][0-9]|21b)$','["B-04","C-07"]'), ('^AIACT-A-50\.1$','["B-04","C-07"]'),
  ('^AIACT-A-01\.','["A-01"]'), ('^AIACT-A-02\.','["A-02"]'), ('^AIACT-A-03\.','["A-03","D-01"]'),
  ('^AIACT-A-04\.','["A-04","F-04"]'), ('^AIACT-A-05\.','["A-05"]'), ('^AIACT-A-06\.','["A-06","E-03"]'),
  ('^AIACT-A-07\.','["A-07"]'), ('^AIACT-A-08\.','["A-08","B-03"]'), ('^AIACT-A-09\.','["A-09","D-04","E-06"]'),
  ('^AIACT-A-10\.','["A-10","C-01","C-04"]'), ('^AIACT-A-11\.','["A-11","C-02"]'), ('^AIACT-A-12\.','["A-12","B-02","C-05"]'),
  ('^AIACT-A-13\.','["A-13","D-06","E-07"]'), ('^AIACT-A-14\.','["A-14","F-03"]')
) AS v(re, codes)
WHERE c.framework='AIACT' AND c.id ~ v.re;

-- ════════════════════════════════════════════════════════════════════════════
-- Risiken: Delta-Risikotexte (neu bzw. an die korrigierten Bedingungen angepasst)
-- ════════════════════════════════════════════════════════════════════════════
SELECT pg_temp.r('AIACT-A-01.6',
 'Risiko bei Nichterfüllung: Ein System baut eine Gesichtsdatenbank aus ungezielt gesammelten Bildern (Internet, Kameras) auf oder erweitert sie — verbotene Praxis seit 2. Februar 2025, Bußgeldrahmen des Art. 99 Abs. 3.',
 'Risk of non-compliance: a system creates or expands a facial database from untargeted scraped images (internet, CCTV) — prohibited since 2 February 2025, fines under Article 99(3).');
SELECT pg_temp.r('AIACT-A-01.7',
 'Risiko bei Nichterfüllung: Ein bereitgestelltes oder genutztes generatives System erzeugt intime Darstellungen identifizierbarer Personen ohne Einwilligung; ohne Schutzvorkehrungen ab 2. Dezember 2026 verboten, zusätzlich Persönlichkeitsrechts- und Strafbarkeitsrisiken.',
 'Risk of non-compliance: a generative system provided or used produces intimate depictions of identifiable persons without consent; prohibited from 2 December 2026 where safeguards are lacking, plus personality-rights and criminal exposure.');
SELECT pg_temp.r('AIACT-A-01.8',
 'Risiko bei Nichterfüllung: Ein generatives System kann Darstellungen sexuellen Kindesmissbrauchs erzeugen oder manipulieren; ab 2. Dezember 2026 verboten, strafrechtliche Folgen und schwerster Reputationsschaden.',
 'Risk of non-compliance: a generative system can generate or manipulate child sexual abuse material; prohibited from 2 December 2026, criminal liability and severe reputational damage.');
SELECT pg_temp.r('AIACT-E-08',
 'Risiko bei Nichterfüllung: Beschäftigte, Betriebsrat oder betroffene Personen werden über den Einsatz eines Hochrisiko-KI-Systems nicht informiert; Verstoß gegen Art. 26 Abs. 7/11, Mitbestimmungskonflikte (§ 87 Abs. 1 Nr. 6 BetrVG) und Stopp des Einsatzes.',
 'Risk of non-compliance: workers, works council or affected persons are not informed about the use of a high-risk AI system; breach of Article 26(7)/(11), co-determination conflicts and a halt of the deployment.');
SELECT pg_temp.r('AIACT-A-02.4',
 'Risiko bei Nichterfüllung: Ein KI-System, das Sicherheitsbauteil eines Produkts nach Anhang I ist, wird nicht als Hochrisiko erkannt; Konformitätsbewertung und Pflichten ab 2. August 2028 fehlen.',
 'Risk of non-compliance: an AI system that is a safety component of an Annex I product is not recognised as high-risk; conformity assessment and duties applying from 2 August 2028 are missed.');
SELECT pg_temp.r('AIACT-E-05b',
 'Risiko bei Nichterfüllung (Händlerpflichten): Ein Hochrisiko-KI-System ohne CE-Kennzeichnung, Konformitätserklärung oder Betriebsanleitung wird bereitgestellt; eigene Pflichtverletzung nach Art. 24.',
 'Risk of non-compliance (distributor duties): a high-risk AI system without CE marking, declaration of conformity or instructions is made available; own breach under Article 24.');
SELECT pg_temp.r('AIACT-T-21b',
 'Risiko bei Nichterfüllung: Die B2B-Erleichterung (¶87) wird genutzt, obwohl eine der drei Bedingungen fehlt; unmarkierte Ausgaben gelangen nach außen und verletzen Art. 50 Abs. 2.',
 'Risk of non-compliance: the B2B relief (§87) is used although one of the three conditions is missing; unmarked outputs leave the organisation and breach Article 50(2).');
SELECT pg_temp.r('AIACT-T-21',
 'Risiko bei Nichterfüllung (geschlossene Abläufe, ¶68): Die Endausgabe eines Ablaufs wird nicht markiert, weil Zwischenausgaben ausgenommen sind; Verstoß gegen Art. 50 Abs. 2.',
 'Risk of non-compliance (closed-loop workflows, §68): the final output of a workflow is not marked because intermediate outputs are out of scope; breach of Article 50(2).');
SELECT pg_temp.r('AIACT-A-01.1',
 'Risiko bei Nichterfüllung: Ein Bewertungsmodell stuft Personen über die Zeit nach Sozialverhalten oder Persönlichkeitsmerkmalen ein und führt zu Schlechterstellung in sachfremden Zusammenhängen oder zu unverhältnismäßiger Benachteiligung — verbotene Praxis nach Art. 5 Abs. 1 Buchst. c.',
 'Risk of non-compliance: a scoring model rates people over time on social behaviour or personal characteristics and leads to detrimental treatment in unrelated contexts or disproportionate treatment — prohibited under Article 5(1)(c).');
SELECT pg_temp.r('AIACT-A-01.2',
 'Risiko bei Nichterfüllung: Biometrische Fernidentifizierung wird eingesetzt, ohne dass Strafverfolgungszweck, Ausnahme und Genehmigung geprüft sind, oder ohne Hochrisiko-Einstufung und Prüfung nach Art. 9 DSGVO bei anderen Zwecken.',
 'Risk of non-compliance: remote biometric identification is used without checking law-enforcement purpose, exception and authorisation, or, for other purposes, without high-risk classification and an Article 9 GDPR check.');
SELECT pg_temp.r('AIACT-A-01.3',
 'Risiko bei Nichterfüllung: Ein System verzerrt durch Manipulation oder Ausnutzung von Schwächen das Verhalten wesentlich und verursacht erheblichen Schaden — verbotene Praxis nach Art. 5 Abs. 1 Buchst. a/b.',
 'Risk of non-compliance: a system materially distorts behaviour through manipulation or exploitation of vulnerabilities and causes significant harm — prohibited under Article 5(1)(a)/(b).');
SELECT pg_temp.r('AIACT-A-01.4',
 'Risiko bei Nichterfüllung: Ein System prognostiziert Straftatrisiken einzelner Personen allein aus Profiling oder Persönlichkeitsmerkmalen — verbotene Praxis nach Art. 5 Abs. 1 Buchst. d.',
 'Risk of non-compliance: a system predicts the risk of individuals committing offences solely from profiling or personality traits — prohibited under Article 5(1)(d).');
SELECT pg_temp.r('AIACT-A-02.2',
 'Risiko bei Nichterfüllung: Ein Anhang-III-Treffer wird übersehen oder die Ausnahme nach Art. 6 Abs. 3 ohne Dokumentation in Anspruch genommen; Hochrisiko-Pflichten und Registrierung nach Art. 49 Abs. 2 fehlen.',
 'Risk of non-compliance: an Annex III match is overlooked or the Article 6(3) derogation is relied on without documentation; high-risk duties and the Article 49(2) registration are missed.');
SELECT pg_temp.r('AIACT-A-06.3',
 'Risiko bei Nichterfüllung: Protokolle unter eigener Kontrolle werden kürzer als sechs Monate oder ohne Zweckbezug aufbewahrt bzw. länger, als das Datenschutzrecht erlaubt; Nachweis- und Datenschutzverstoß.',
 'Risk of non-compliance: logs under own control are kept for less than six months or without regard to purpose, or longer than data-protection law allows; evidence and data-protection breach.');
SELECT pg_temp.r('AIACT-A-11.4',
 'Risiko bei Nichterfüllung: Der falsche Registrierungsweg wird gewählt (z. B. EU-Datenbank statt nationaler Registrierung für Anhang III Nr. 2) oder die Registrierung einer Art.-6-Abs.-3-Einstufung unterbleibt.',
 'Risk of non-compliance: the wrong registration route is used (e.g., EU database instead of national registration for Annex III point 2) or the registration of an Article 6(3) conclusion is omitted.');
SELECT pg_temp.r('AIACT-A-14.5',
 'Risiko bei Nichterfüllung: Ein Modell mit systemischem Risiko (Vermutung oder Kommissionsentscheidung) wird ohne Modellbewertung und Angriffstests bereitgestellt; Verstoß gegen Art. 55.',
 'Risk of non-compliance: a model with systemic risk (presumption or Commission decision) is made available without model evaluation and adversarial testing; breach of Article 55.');
SELECT pg_temp.r('AIACT-E-02',
 'Risiko bei Nichterfüllung (Art. 86): Betroffene einer erheblichen Entscheidung auf Grundlage eines Anhang-III-Systems erhalten keine Erläuterung; Beschwerden und Anfechtung der Entscheidung.',
 'Risk of non-compliance (Article 86): persons subject to a significant decision based on an Annex III system receive no explanation; complaints and challenges to the decision.');
SELECT pg_temp.r('AIACT-E-03',
 'Risiko bei Nichterfüllung: Betroffene kennen ihr Beschwerderecht bei der Marktüberwachungsbehörde nicht; FRIA-pflichtige Betreiber haben keinen beschriebenen internen Beschwerdemechanismus (Art. 27 Abs. 1 Buchst. f).',
 'Risk of non-compliance: affected persons are unaware of their right to complain to the market surveillance authority; FRIA-obliged deployers lack a described internal complaint mechanism (Article 27(1)(f)).');
SELECT pg_temp.r('AIACT-E-04',
 'Risiko bei Nichterfüllung: Ein Drittstaaten-Anbieter eines Hochrisiko-Systems oder GPAI-Modells hat keinen Bevollmächtigten in der Union, oder der Einführer prüft dies nicht; das System darf nicht bereitgestellt werden.',
 'Risk of non-compliance: a third-country provider of a high-risk system or GPAI model has no authorised representative in the Union, or the importer does not verify this; the system must not be made available.');
SELECT pg_temp.r('AIACT-E-05',
 'Risiko bei Nichterfüllung (Einführerpflichten): Ein nicht konformes Hochrisiko-KI-System wird eingeführt; Unterlagen fehlen über die zehnjährige Aufbewahrung; eigene Haftung nach Art. 23.',
 'Risk of non-compliance (importer duties): a non-conforming high-risk AI system is imported; documents are not kept for ten years; own liability under Article 23.');
SELECT pg_temp.r('AIACT-E-06',
 'Risiko bei Nichterfüllung: Bei Nichtkonformität wird keine geeignete Korrekturmaßnahme ergriffen oder die Lieferkette nicht informiert; bei einem Risiko nach Art. 79 Abs. 1 unterbleibt die Meldung an die Behörde.',
 'Risk of non-compliance: no appropriate corrective action is taken on non-conformity or the supply chain is not informed; where an Article 79(1) risk exists, the authority is not notified.');
SELECT pg_temp.r('AIACT-E-07',
 'Risiko bei Nichterfüllung: Ein Test unter Realbedingungen läuft ohne genehmigten Plan, Registrierung oder informierte Einwilligung, oder ein Reallabor wird mit einem internen Test verwechselt; Verstoß gegen Art. 60/61.',
 'Risk of non-compliance: a real-world test runs without an approved plan, registration or informed consent, or a sandbox is confused with an internal test; breach of Articles 60/61.');
SELECT pg_temp.r('AIACT-T-22',
 'Risiko bei Nichterfüllung: Die Echtzeit-Erleichterung wird genutzt, obwohl Inhalte gespeichert oder weitergegeben werden oder die Betroffenen nicht informiert sind; Verstoß gegen Art. 50 Abs. 2.',
 'Risk of non-compliance: the real-time relief is used although content is stored or shared or persons are not informed; breach of Article 50(2).');

-- A-50.1 ist nicht mehr bewertbar → kein eigenes Delta-Risiko mehr in der Risikoableitung
DELETE FROM public.control_risk WHERE framework='AIACT' AND control_id='AIACT-A-50.1';

-- Plausibilitätsprüfung: neue Kontrollen vorhanden, Übersicht nicht bewertet
DO $chk$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.controls WHERE framework='AIACT'
    AND id IN ('AIACT-A-01.6','AIACT-A-01.7','AIACT-A-01.8','AIACT-E-08','AIACT-A-02.4','AIACT-E-05b','AIACT-T-21b');
  IF n <> 7 THEN RAISE EXCEPTION 'aiact_soa_pruefung: % von 7 neuen Kontrollen vorhanden', n; END IF;
  SELECT count(*) INTO n FROM public.controls WHERE framework='AIACT' AND (meta->>'applies_from') IS NULL AND COALESCE(meta->>'scored','true') <> 'false';
  IF n > 0 THEN RAISE NOTICE 'aiact_soa_pruefung: % bewertete AIACT-Kontrollen ohne applies_from', n; END IF;
END $chk$;

COMMIT;
