-- ============================================================================
-- NIS2 70 — Teil 2: Delta-Risiken + same-as-Knotennetz. Idempotent.
-- Läuft NACH nis2_70_backbone.sql (die 70 Kontrollen müssen existieren).
-- ============================================================================
BEGIN;

-- ---------------------------------------------------------------------------
-- (1) Delta-Risiken: je delta-Kontrolle ein DR-<id> + control_risk-Verknüpfung.
--     Bestehende DR- (mit kuratiertem Text) bleiben unangetastet (DO NOTHING).
-- ---------------------------------------------------------------------------
INSERT INTO public.risks (risk_id, quelle, text_de, primary_control_framework) VALUES
  ('DR-scope-01', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 2(1); Annexes I–II): Wurde jede juristische Person der Gruppe einzeln anhand der Sektorlisten (Annex I/II zuerst, Größe zweitens) auf Anwendbarkeit geprüft?', 'NIS2'),
  ('DR-scope-02', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 2(1); Rec. 2003/361/EC): Wurde der Größentest anhand der Kommissionsempfehlung 2003/361/EC (mittleres Unternehmen als Auslöser) durchgeführt, nicht per Faustregel?', 'NIS2'),
  ('DR-scope-03', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Rec. 2003/361/EC Art. 3, 6): Wurden Beschäftigten- und Finanzzahlen inkl. Partner- (pro rata) und verbundener Unternehmen (voll) berechnet, nicht nur der Einzelentity?', 'NIS2'),
  ('DR-reg-02', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 3(1)–(2)): Ist für jede Entity im Anwendungsbereich die Klasse (essential/important) nach Art. 3 dokumentiert?', 'NIS2'),
  ('DR-scope-05', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 2(2)(a),(3),(4)): Wurden die größenunabhängigen Typen (TK-Anbieter, Vertrauensdienste, TLD/DNS, kritische Einrichtungen nach RL 2022/2557, Domain-Registrierungsdienste) separat identifiziert?', 'NIS2'),
  ('DR-scope-06', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 2(2)(b)–(f)): Wurden die größenunabhängigen Gründe (Alleinanbieter, öffentliche Sicherheit, systemisches Risiko, nationale/regionale Kritikalität, Zentralverwaltung) bewertet und das Ergebnis festgehalten?', 'NIS2'),
  ('DR-scope-07', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 2(7)–(11)): Wurden die Ausnahmen (nationale Sicherheit/Verteidigung/Strafverfolgung 2(7)–(8), Vertrauensdienst 2(9), DORA-Ausnahme 2(10), Geheimhaltung 2(11)) je Provision geprüft?', 'NIS2'),
  ('DR-scope-08', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 4(1)–(2)): Wurde bei sektorspezifischem Unionsrecht mindestens gleichwertiger Wirkung (z. B. DORA) geprüft, ob Art. 21, Art. 23 oder beide verdrängt sind?', 'NIS2'),
  ('DR-scope-09', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 26(1)(a)–(c)): Wurde der zuständige Mitgliedstaat nach der korrekten Regel des Art. 26(1) bestimmt?', 'NIS2'),
  ('DR-scope-10', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 26(2)): Wurde für die Digitalanbieter-Typen die Hauptniederlassung nach dem Test des Art. 26(2) bestimmt?', 'NIS2'),
  ('DR-scope-11', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 26(3)): Hat eine nicht in der Union niedergelassene Entity der Art.-26(1)(b)-Typen einen Vertreter in einem Mitgliedstaat benannt, in dem sie Dienste anbietet?', 'NIS2'),
  ('DR-scope-12', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Praxis; vgl. Art. 3(4)): Wird der Anwendungsbereich bei geänderten Fakten (Merger, Schwellenüberschreitung, neuer/eingestellter Dienst) neu bewertet, nicht nur einmalig zu Beginn?', 'NIS2'),
  ('DR-scope-13', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Evidenzpraxis): Wird das Ergebnis der Scope-Bewertung datiert, unterschrieben und aufbewahrt — auch für als „out of scope" bewertete Entities mit Begründung?', 'NIS2'),
  ('DR-reg-01', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 3(4)): Hat die Entity mindestens Name, Anschrift, aktuelle Kontaktdaten (E-Mail, IP-Bereiche, Telefon), Sektor/Subsektor und die betroffenen Mitgliedstaaten an die Behörde übermittelt?', 'NIS2'),
  ('DR-reg-15', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 3(4)): Meldet ein Prozess jede Änderung dieser Registrierungsdaten unverzüglich, spätestens binnen zwei Wochen?', 'NIS2'),
  ('DR-reg-16', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Lesart Art. 2, 3(3)): Ist festgehalten, dass die Liste essential/important eine Behördenpflicht ist und das Gelistetsein (oder Fehlen) die Pflichten nicht auslöst — der Scope folgt aus Art. 2 und 3?', 'NIS2'),
  ('DR-reg-17', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 27(2)): Haben Entities der Art.-27-Typen die Zusatz-Registrierungsdaten (Anschrift der Haupt- und weiterer Niederlassungen in der Union bzw. des Vertreters) übermittelt?', 'NIS2'),
  ('DR-reg-18', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 27(3)): Werden Änderungen der Art.-27-Registrierungsdaten unverzüglich, spätestens binnen drei Monaten gemeldet?', 'NIS2'),
  ('DR-reg-19', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 28(1)–(5)): Führen TLD-Registries und Domain-Registrierungsdienste korrekte Registrierungsdaten in einer eigenen Datenbank, veröffentlichen die nicht-personenbezogenen Daten und beantworten Zugriffsanfragen binnen 72 Stunden?', 'NIS2'),
  ('DR-nis2-gov-05', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 20(1)): Hat das Leitungsorgan die Cybersicherheits-Risikomanagementmaßnahmen förmlich (datierter Beschluss, keine Präsentation) gebilligt?', 'NIS2'),
  ('DR-gov-03', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 20(1)): Übt das Leitungsorgan die Überwachung der Umsetzung nachweislich aus (stehender TOP, Protokolle, Berichtslinie bis zur Spitze)?', 'NIS2'),
  ('DR-nis2-gov-06', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 20(1)): Ist festgehalten, dass Mitglieder des Leitungsorgans für Art.-21-Verstöße haftbar sein können und wie diese Haftung im nationalen und Gesellschaftsrecht ausgestaltet ist?', 'NIS2'),
  ('DR-gov-01', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 20(2)): Haben die Mitglieder des Leitungsorgans eine Schulung mit belegter Teilnahme absolviert, die ausreichende Kenntnisse zur Risikoerkennung und -bewertung vermittelt?', 'NIS2'),
  ('DR-art21-27', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 21(1)): Sind die Maßnahmen als angemessen und verhältnismäßig dokumentiert (All-Hazards, Stand der Technik/Standards, Kosten, Größe, Risikoexposition, Eintritts-/Schwerewahrscheinlichkeit), lesbar für einen Prüfer?', 'NIS2'),
  ('DR-art21-46', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 21(5); DVO 2024/2690 Art. 2(2)): Werden bei DVO-2024/2690-Typen sämtliche technischen/methodischen Anforderungen umgesetzt und Nichtanwendungen (where appropriate/applicable) nach Art. 2(2) nachvollziehbar begründet und dokumentiert?', 'NIS2'),
  ('DR-sup-05', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 22(1); Art. 21(3)): Werden die Ergebnisse einer koordinierten EU-Risikobewertung kritischer Lieferketten für die betroffenen Dienste berücksichtigt?', 'NIS2'),
  ('DR-nis2-sig-01', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(3)): Ist ein erheblicher Sicherheitsvorfall schriftlich anhand des RL-eigenen Tests definiert, mit benanntem Entscheider und benanntem Stellvertreter?', 'NIS2'),
  ('DR-nis2-sig-02', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(3)): Ist festgehalten, dass „geeignet, zu verursachen" genügt (schwere Betriebsstörung/finanzieller Schaden bzw. erheblicher Schaden bei Dritten) und realisierter Schaden nicht erforderlich ist?', 'NIS2'),
  ('DR-nis2-sig-03', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(11); DVO 2024/2690): Entscheiden dort, wo die Kommission Erheblichkeitsschwellen für den Entity-Typ festgelegt hat, diese Schwellen (nicht eine Hausregel), und läuft die 24-Stunden-Uhr ab Kenntnisnahme des erheblichen Vorfalls?', 'NIS2'),
  ('DR-nis2-sig-04', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 DVO 2024/2690 Art. 4): Werden einzeln nicht erhebliche wiederkehrende Vorfälle zusammen bewertet (mind. 2× in 6 Monaten, gleiche mutmaßliche Ursache, gemeinsam über der Schadensschwelle) und als ein erheblicher Vorfall behandelt?', 'NIS2'),
  ('DR-inc-comm-1', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(4)(a)): Erreicht die Frühwarnung das CSIRT bzw. die zuständige Behörde unverzüglich und in jedem Fall binnen 24 Stunden nach Kenntnisnahme?', 'NIS2'),
  ('DR-notif-57', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(4)(a)): Gibt die Frühwarnung an, ob der Vorfall im Verdacht steht, durch rechtswidrige/böswillige Handlungen verursacht zu sein, und ob er grenzüberschreitende Auswirkungen haben könnte?', 'NIS2'),
  ('DR-inc-comm-2', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(4)(b)): Folgt die Vorfallmeldung binnen 72 Stunden nach Kenntnisnahme und aktualisiert die Frühwarnung mit Erstbewertung (Schwere, Auswirkung, ggf. Kompromittierungsindikatoren)?', 'NIS2'),
  ('DR-notif-59', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(4)(c)): Wird auf Anfrage des CSIRT/der Behörde ein Zwischenbericht bereitgestellt?', 'NIS2'),
  ('DR-inc-comm-3', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(4)(d)): Wird der Abschlussbericht spätestens einen Monat nach der Vorfallmeldung eingereicht (detaillierte Beschreibung, Schwere/Auswirkung, Bedrohungstyp/Ursache, angewandte/laufende Minderungsmaßnahmen, grenzüberschreitende Auswirkung)?', 'NIS2'),
  ('DR-notif-61', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(4)(e)): Tritt bei noch laufendem Vorfall an die Stelle des Abschlussberichts ein Fortschrittsbericht, gefolgt vom Abschlussbericht binnen eines Monats nach Bewältigung?', 'NIS2'),
  ('DR-nis2-notif-01', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(1)–(2)): Werden die Dienstempfänger, wo angemessen, über erhebliche Vorfälle mit Auswirkung auf den Dienst sowie über erhebliche Cyberbedrohungen samt möglicher Gegenmaßnahmen informiert?', 'NIS2'),
  ('DR-notif-63', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 23(4) UAbs. 2): Halten Vertrauensdiensteanbieter für Vorfälle mit erheblicher Auswirkung auf ihre Vertrauensdienste die auf 24 Stunden verkürzte Meldefrist (statt 72 h) ein?', 'NIS2'),
  ('DR-notif-64', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Evidenz für Art. 23(4)): Werden der Zeitpunkt der Kenntnisnahme und der Absendezeitpunkt jedes Berichts erfasst (Frühwarnung/Meldung ab Kenntnis, Abschluss ab Meldung bzw. ab Bewältigung)?', 'NIS2'),
  ('DR-notif-65', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Operative Praxis): Wurde der Meldeweg außerhalb der Geschäftszeiten mindestens einmal Ende-zu-Ende geprobt (inkl. Freitagabend)?', 'NIS2'),
  ('DR-supv-66', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 32(1)–(2); Art. 33(1)–(2)): Ist festgehalten, dass essential entities proaktiv beaufsichtigt werden (Vor-Ort-/Ferninspektionen, Audits, Security-Scans, Informations-/Nachweisanforderungen) und important entities ex post?', 'NIS2'),
  ('DR-supv-67', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 32(2)(g); Art. 33(2)(f)): Können Nachweise der Umsetzung der Cybersicherheitspolitik auf Anfrage erbracht werden, und kann die Entity benennen, wer sie erbringen würde?', 'NIS2'),
  ('DR-supv-69', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 34(4)–(5)): Versteht das Leitungsorgan die Bußgeldrahmen des Art. 34 (mind. 10 Mio € / 2 % weltweiter Jahresumsatz für essential, 7 Mio € / 1,4 % für important, je höherer Wert) als gesetzliche Obergrenze bei Art.-21-/23-Verstößen, nicht als Tarif?', 'NIS2'),
  ('DR-supv-70', 'Delta-Pack', 'Risiko bei Nichterfüllung (NIS2 Art. 32(5); vgl. Art. 33(4)): Ist festgehalten, dass Suspendierung von Zertifizierung/Zulassung und vorübergehendes Management-Tätigkeitsverbot nur essential entities erreichen — und nur nach erfolglosen Maßnahmen nach Art. 32(4)(a)–(d),(f) und verstrichener Nachfrist; öffentliche Verwaltung ist von beidem ausgenommen?', 'NIS2')
ON CONFLICT (risk_id) DO NOTHING;

INSERT INTO public.control_risk (framework, control_id, risk_id, link_typ) VALUES
  ('NIS2', 'scope-01', 'DR-scope-01', 'delta'),
  ('NIS2', 'scope-02', 'DR-scope-02', 'delta'),
  ('NIS2', 'scope-03', 'DR-scope-03', 'delta'),
  ('NIS2', 'reg-02', 'DR-reg-02', 'delta'),
  ('NIS2', 'scope-05', 'DR-scope-05', 'delta'),
  ('NIS2', 'scope-06', 'DR-scope-06', 'delta'),
  ('NIS2', 'scope-07', 'DR-scope-07', 'delta'),
  ('NIS2', 'scope-08', 'DR-scope-08', 'delta'),
  ('NIS2', 'scope-09', 'DR-scope-09', 'delta'),
  ('NIS2', 'scope-10', 'DR-scope-10', 'delta'),
  ('NIS2', 'scope-11', 'DR-scope-11', 'delta'),
  ('NIS2', 'scope-12', 'DR-scope-12', 'delta'),
  ('NIS2', 'scope-13', 'DR-scope-13', 'delta'),
  ('NIS2', 'reg-01', 'DR-reg-01', 'delta'),
  ('NIS2', 'reg-15', 'DR-reg-15', 'delta'),
  ('NIS2', 'reg-16', 'DR-reg-16', 'delta'),
  ('NIS2', 'reg-17', 'DR-reg-17', 'delta'),
  ('NIS2', 'reg-18', 'DR-reg-18', 'delta'),
  ('NIS2', 'reg-19', 'DR-reg-19', 'delta'),
  ('NIS2', 'nis2-gov-05', 'DR-nis2-gov-05', 'delta'),
  ('NIS2', 'gov-03', 'DR-gov-03', 'delta'),
  ('NIS2', 'nis2-gov-06', 'DR-nis2-gov-06', 'delta'),
  ('NIS2', 'gov-01', 'DR-gov-01', 'delta'),
  ('NIS2', 'art21-27', 'DR-art21-27', 'delta'),
  ('NIS2', 'art21-46', 'DR-art21-46', 'delta'),
  ('NIS2', 'sup-05', 'DR-sup-05', 'delta'),
  ('NIS2', 'nis2-sig-01', 'DR-nis2-sig-01', 'delta'),
  ('NIS2', 'nis2-sig-02', 'DR-nis2-sig-02', 'delta'),
  ('NIS2', 'nis2-sig-03', 'DR-nis2-sig-03', 'delta'),
  ('NIS2', 'nis2-sig-04', 'DR-nis2-sig-04', 'delta'),
  ('NIS2', 'inc-comm-1', 'DR-inc-comm-1', 'delta'),
  ('NIS2', 'notif-57', 'DR-notif-57', 'delta'),
  ('NIS2', 'inc-comm-2', 'DR-inc-comm-2', 'delta'),
  ('NIS2', 'notif-59', 'DR-notif-59', 'delta'),
  ('NIS2', 'inc-comm-3', 'DR-inc-comm-3', 'delta'),
  ('NIS2', 'notif-61', 'DR-notif-61', 'delta'),
  ('NIS2', 'nis2-notif-01', 'DR-nis2-notif-01', 'delta'),
  ('NIS2', 'notif-63', 'DR-notif-63', 'delta'),
  ('NIS2', 'notif-64', 'DR-notif-64', 'delta'),
  ('NIS2', 'notif-65', 'DR-notif-65', 'delta'),
  ('NIS2', 'supv-66', 'DR-supv-66', 'delta'),
  ('NIS2', 'supv-67', 'DR-supv-67', 'delta'),
  ('NIS2', 'supv-69', 'DR-supv-69', 'delta'),
  ('NIS2', 'supv-70', 'DR-supv-70', 'delta')
ON CONFLICT (framework, control_id, risk_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- (2) same-as-Knotennetz für die 70 NIS2-Kontrollen — ADDITIV (kein DELETE):
--     bereits korrekt verknüpfte (beibehaltene) Kontrollen bleiben unangetastet;
--     nur NIS2-Kontrollen OHNE Knoten werden ergänzt. So gehen die aus dem
--     Alt-Katalog übernommenen, richtigen Verknüpfungen nicht verloren und die
--     Reihenfolge zu overrides.sql ist unkritisch.
-- ---------------------------------------------------------------------------

-- (2a) Gemappte Kontrollen (iso_ids gesetzt) OHNE Knoten treten dem Knoten ihrer
--      primären ISO-Referenz bei -> teilen Knoten mit ISO27001 (und darüber BSI).
INSERT INTO public.control_node_member (node_id, framework, control_id)
SELECT im.node_id, 'NIS2', c.id
FROM public.controls c
CROSS JOIN LATERAL (SELECT (c.meta->'iso_ids'->>0) AS iso0) p
JOIN public.control_node_member im
  ON im.framework = 'ISO27001' AND im.control_id = p.iso0
WHERE c.framework = 'NIS2'
  AND jsonb_array_length(COALESCE(c.meta->'iso_ids', '[]'::jsonb)) > 0
  AND NOT EXISTS (SELECT 1 FROM public.control_node_member m
                  WHERE m.framework = 'NIS2' AND m.control_id = c.id)
ON CONFLICT (framework, control_id) DO NOTHING;

-- (2b) Rest (delta-Kontrollen + gemappte ohne ISO-Knoten): Einzelknoten je Kontrolle.
INSERT INTO public.control_node (node_id, label)
SELECT 'NIS2-' || c.id, 'NIS2 ' || c.id
FROM public.controls c
WHERE c.framework = 'NIS2'
  AND NOT EXISTS (SELECT 1 FROM public.control_node_member m
                  WHERE m.framework = 'NIS2' AND m.control_id = c.id)
ON CONFLICT (node_id) DO NOTHING;

INSERT INTO public.control_node_member (node_id, framework, control_id)
SELECT 'NIS2-' || c.id, 'NIS2', c.id
FROM public.controls c
WHERE c.framework = 'NIS2'
  AND NOT EXISTS (SELECT 1 FROM public.control_node_member m
                  WHERE m.framework = 'NIS2' AND m.control_id = c.id)
ON CONFLICT (framework, control_id) DO NOTHING;

-- (1b) Lückenschluss: jede NIS2-Kontrolle OHNE zugeordnetes Risiko bekommt ein
--      DR-<id> ("Risiko bei Nichterfüllung …"). Betrifft die teilw-Kontrollen
--      ohne bestehende control_risk-Verknüpfung (reg-20, art21-45, sup-47, supv-68).
INSERT INTO public.risks (risk_id, quelle, text_de, primary_control_framework)
SELECT 'DR-' || c.id, 'Delta-Pack',
       'Risiko bei Nichterfüllung (NIS2): ' || c.req_de, 'NIS2'
FROM public.controls c
WHERE c.framework = 'NIS2'
  AND NOT EXISTS (SELECT 1 FROM public.control_risk cr
                  WHERE cr.framework = 'NIS2' AND cr.control_id = c.id)
ON CONFLICT (risk_id) DO NOTHING;

INSERT INTO public.control_risk (framework, control_id, risk_id, link_typ)
SELECT 'NIS2', c.id, 'DR-' || c.id, 'delta'
FROM public.controls c
WHERE c.framework = 'NIS2'
  AND NOT EXISTS (SELECT 1 FROM public.control_risk cr
                  WHERE cr.framework = 'NIS2' AND cr.control_id = c.id)
ON CONFLICT (framework, control_id, risk_id) DO NOTHING;

COMMIT;
