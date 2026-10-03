-- ============================================================================
-- Die 20 KI-Kontrollen ohne jedes Risiko
--
-- 259 der 279 KI-Kontrollen tragen ein Risiko (381 Verknuepfungen, 286
-- Risikotexte). Die restlichen 20 sind exakt der unfertige Altbestand:
-- die 19 ISO-42001-Kontrollen, die auch ASCII-Umlaute trugen und keine Frage
-- waren, plus AIACT-A-50.1. Ohne Risiko erscheint eine Kontrolle in der
-- Risikoanalyse gar nicht — sie ist beantwortbar, aber nicht bewertbar.
--
-- Zwei Kontrollen bekommen ZWEI Risiken, weil es zwei verschiedene Fehlerwege
-- gibt: bei 5.3 die ungeklaerte Zustaendigkeit UND die fehlende Trennung von
-- Betrieb und Bewertung; bei 6.1.4 die Beliebigkeit des Verfahrens UND das
-- voellige Fehlen von Verzerrung/Erklaerbarkeit als Bewertungsgegenstand.
--
-- stufe und typ bleiben NULL: sie sind in ALLEN 2788 Risiken der Datenbank
-- NULL. Fuer 22 Stueck eine Stufe zu setzen wuerde eine Systematik
-- vortaeuschen, die es im Katalog nicht gibt.
--
-- Kein "Risiko bei Nichterfuellung:"-Baustein: 130 der 286 vorhandenen
-- KI-Risiken beginnen so. Jedes Risiko hier beschreibt den Fehlerweg selbst.
-- ============================================================================

INSERT INTO public.risks (risk_id, quelle, iso_anchor, text_de, text_en, status, primary_control_framework, meta)
VALUES
  ('DR-ISO42001-5.2','Delta-neu (KI-Luecke 2026-09)','{}','Ohne verabschiedete KI-Politik entscheidet jeder Bereich selbst, welche Modelle, welche Daten und welche Einsatzzwecke zulässig sind. Es entstehen widersprüchliche Festlegungen zwischen Fachbereichen, gegenüber Dienstleistern lässt sich nichts durchsetzen, und ein Zertifizierungsaudit scheitert bereits an Klausel 5.2, bevor überhaupt einzelne Maßnahmen geprüft werden.','Without an approved AI policy, each business unit decides for itself which models, data and purposes are permissible. Contradictory rules emerge between departments, nothing can be enforced towards service providers, and a certification audit already fails at clause 5.2 before any individual measure is examined.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-5.3-1','Delta-neu (KI-Luecke 2026-09)','{}','Sind die Rollen nicht zugewiesen, fühlt sich bei einem auffälligen Modell niemand zuständig: Der Fachbereich verweist auf die IT, die IT auf den Anbieter. Entscheidungen über Abschaltung, Nachtraining oder Meldung verzögern sich genau in der Phase, in der sie noch etwas bewirken würden.','If roles are not assigned, nobody feels responsible when a model behaves oddly: the business unit points to IT, IT points to the vendor. Decisions on shutdown, retraining or notification are delayed precisely in the window where they would still make a difference.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-5.3-2','Delta-neu (KI-Luecke 2026-09)','{}','Fallen Betrieb und Bewertung eines KI-Systems in dieselbe Hand, bewertet derjenige das Risiko, der es zu verantworten hat. Unbequeme Befunde werden dann nicht bösartig unterdrückt, sondern schlicht milder eingestuft — und die Aufsicht verliert ihren Zweck.','When operating and assessing an AI system fall to the same person, the risk is judged by whoever is accountable for it. Inconvenient findings are then not maliciously suppressed but simply rated more leniently — and the oversight loses its purpose.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-6.1.4-1','Delta-neu (KI-Luecke 2026-09)','{}','Ohne wiederholbares Bewertungsverfahren hängt das Ergebnis an der Person, die gerade bewertet. Zwei vergleichbare Systeme erhalten unterschiedliche Einstufungen, die Rangfolge der Maßnahmen wird beliebig, und im Audit lässt sich nicht begründen, warum ein bestimmtes Restrisiko als vertretbar gilt.','Without a repeatable assessment procedure the outcome depends on whoever happens to be assessing. Two comparable systems receive different ratings, the priority of measures becomes arbitrary, and in an audit there is no way to justify why a particular residual risk is deemed acceptable.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-6.1.4-2','Delta-neu (KI-Luecke 2026-09)','{}','Werden Verzerrung und Erklärbarkeit nicht ausdrücklich in die Bewertung aufgenommen, fallen sie durch das Raster: Sie verursachen keinen Ausfall und keine Fehlermeldung. Benachteiligende Entscheidungen laufen deshalb so lange weiter, bis sich jemand beschwert — und dann rückwirkend für alle bis dahin entschiedenen Fälle.','If bias and explainability are not explicitly part of the assessment, they slip through: they cause no outage and no error message. Discriminatory decisions therefore continue until someone complains — and then retroactively for every case decided up to that point.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-8.3','Delta-neu (KI-Luecke 2026-09)','{}','Wird nur die Gefahr für das Unternehmen betrachtet, bleiben Schäden bei den Betroffenen unsichtbar: abgelehnte Bewerbungen, verweigerte Leistungen, Fehlklassifikationen einzelner Personen. Die Organisation erfährt davon erst über Beschwerden oder Presse, und die nach Artikel 27 der KI-Verordnung geforderte Grundrechte-Folgenabschätzung hat keine tragfähige Grundlage.','If only the danger to the organisation is considered, harm to affected people stays invisible: rejected applications, denied benefits, misclassification of individuals. The organisation learns of it through complaints or the press, and the fundamental rights impact assessment required by Article 27 of the AI Act has no sound basis.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-9.2','Delta-neu (KI-Luecke 2026-09)','{}','Ohne eigenes Auditprogramm prüft niemand, ob die einmal getroffenen Festlegungen im Alltag noch gelten. Abweichungen treten erst im Zertifizierungsaudit zutage, wo sie als Nichtkonformität gewertet werden — statt vorher als intern erkannte und behobene Feststellung.','Without an internal audit programme, nobody checks whether the rules once agreed still hold in daily practice. Deviations surface only in the certification audit, where they count as nonconformities — instead of as findings identified and fixed internally beforehand.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.4.4','Delta-neu (KI-Luecke 2026-09)','{}','Ist nicht dokumentiert, mit welchen Werkzeugen Modelle gebaut, betrieben und überwacht werden, lässt sich nach einem Vorfall nicht rekonstruieren, welche Bibliothek oder welches Framework beteiligt war. Meldungen über Schwachstellen in genau diesen Werkzeugen erreichen niemanden, weil unbekannt ist, wer sie überhaupt einsetzt.','If it is not documented which tools are used to build, run and monitor models, it is impossible to reconstruct after an incident which library or framework was involved. Advisories about vulnerabilities in exactly those tools reach nobody, because it is unknown who uses them at all.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.4.5','Delta-neu (KI-Luecke 2026-09)','{}','Ohne Übersicht über die genutzte Infrastruktur laufen Modelle unbemerkt in Umgebungen, die dem Schutzbedarf nicht entsprechen — produktive Daten auf Entwicklungshardware, oder Verarbeitung bei einem Anbieter außerhalb des vertraglich zugesagten Raums. Auffallen tut das meist erst bei einer Prüfung von außen.','Without an overview of the infrastructure in use, models quietly run in environments that do not match the required protection level — production data on development hardware, or processing by a provider outside the contractually agreed region. This usually only comes to light during an external review.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.6.2','Delta-neu (KI-Luecke 2026-09)','{}','Eine Aufsicht, die benannt ist, aber nicht eingreifen kann, erzeugt Scheinsicherheit. Wo es keinen Weg gibt, eine Entscheidung anzuhalten, zu überstimmen oder zu korrigieren, wirkt die menschliche Kontrolle nur auf dem Papier — und der Hang, maschinellen Ausgaben zu vertrauen, tut den Rest.','Oversight that is nominated but unable to intervene creates a false sense of safety. Where there is no way to halt, override or correct a decision, human control exists only on paper — and the tendency to trust machine output does the rest.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.6.2.2','Delta-neu (KI-Luecke 2026-09)','{}','Ohne festgelegte Anforderungen gibt es keinen Maßstab, gegen den geprüft werden könnte. Was als Fehler gilt, wird im Nachhinein verhandelt, und eine Abnahme bestätigt am Ende nur das, was ohnehin gebaut wurde.','Without defined requirements there is no yardstick to test against. What counts as a defect is negotiated after the fact, and acceptance testing ends up confirming only what was built anyway.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.6.2.3','Delta-neu (KI-Luecke 2026-09)','{}','Ist der Entwicklungsweg nicht dokumentiert, lässt sich später nicht mehr nachvollziehen, warum ein Modell so entscheidet, wie es entscheidet. Bei einem Personalwechsel geht dieses Wissen vollständig verloren, und jede Anpassung beginnt wieder bei null.','If the development path is not documented, it later becomes impossible to trace why a model decides the way it does. When staff change, that knowledge is lost entirely, and every adjustment starts from scratch.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.6.2.7','Delta-neu (KI-Luecke 2026-09)','{}','Wird die technische Dokumentation nach Modell- oder Datenänderungen nicht nachgezogen, beschreibt sie eine Version, die so nicht mehr läuft. Prüfer, Betreiber und Behörden verlassen sich dann auf Angaben zu Leistungsgrenzen, Trainingsdaten und Einsatzbedingungen, die für das tatsächlich eingesetzte System nicht mehr gelten — eine veraltete Dokumentation führt damit gezielter in die Irre als gar keine.','If technical documentation is not updated after model or data changes, it describes a version that is no longer running. Auditors, deployers and authorities then rely on statements about performance limits, training data and operating conditions that no longer hold for the system actually deployed — outdated documentation therefore misleads more precisely than none at all.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.6.2.8','Delta-neu (KI-Luecke 2026-09)','{}','Ohne Ereignisprotokolle lässt sich nach einem Fehlverhalten weder der betroffene Zeitraum eingrenzen noch feststellen, welche Personen betroffen waren. Damit fehlt zugleich die Grundlage für Meldungen, für gezielte Korrekturen und für den Nachweis, dass der Vorfall wirklich abgestellt wurde.','Without event logs it is impossible after misbehaviour to narrow down the affected period or determine which individuals were affected. That also removes the basis for notifications, for targeted corrections, and for proving the incident was actually resolved.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.7.3','Delta-neu (KI-Luecke 2026-09)','{}','Werden Datenquellen ohne geregelte Auswahl übernommen, gelangen Datensätze mit ungeklärter Rechtslage ins Training: zugekaufte Sammlungen, aus dem Netz gezogene Inhalte, Kundendaten aus einem anderen Zweck. Das Modell lässt sich nachträglich nicht mehr von ihnen trennen — es müsste neu trainiert werden.','If data sources are adopted without a governed selection, datasets with unresolved legal status enter training: purchased collections, scraped web content, customer data collected for another purpose. The model cannot afterwards be separated from them — it would have to be retrained.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.7.4','Delta-neu (KI-Luecke 2026-09)','{}','Sind Herkunft, Verzerrungsprüfung und Repräsentativität nicht belegt, übernimmt das Modell die Schieflagen seiner Trainingsdaten und gibt sie als scheinbar objektives Ergebnis aus. Sichtbar wird das erst in der Anwendung — dann aber bei vielen Fällen gleichzeitig und mit gleichförmiger Wirkung.','If provenance, bias testing and representativeness are not evidenced, the model inherits the skew of its training data and returns it as an apparently objective result. This only becomes visible in use — but then across many cases at once and with uniform effect.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.7.6','Delta-neu (KI-Luecke 2026-09)','{}','Ohne festgelegte Kriterien für Bereinigung, Kennzeichnung und Aufteilung der Daten überschneiden sich Trainings- und Testdaten. Die gemessene Güte fällt dadurch zu hoch aus, das System gilt als geprüft, und die Schwäche zeigt sich erst im Echtbetrieb.','Without defined criteria for cleaning, labelling and splitting the data, training and test sets overlap. Measured performance then comes out too high, the system counts as validated, and the weakness only appears in live operation.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.8.2','Delta-neu (KI-Luecke 2026-09)','{}','Wer nicht weiß, dass eine Ausgabe von einem KI-System stammt und wo dessen Grenzen liegen, übernimmt sie ungeprüft. Fehler werden dadurch weitergetragen statt abgefangen; handelt es sich um eine Interaktion mit Menschen, verletzt das zugleich Artikel 50 Absatz 1 der KI-Verordnung.','Anyone who does not know that an output comes from an AI system, and where its limits lie, will adopt it unchecked. Errors are then carried onward instead of caught; where people interact with the system, this also breaches Article 50(1) of the AI Act.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.9.2','Delta-neu (KI-Luecke 2026-09)','{}','Wird ein zugekauftes KI-System ohne Prüfung und ohne vertragliche Zusagen eingesetzt, trägt die Organisation dessen Risiken, ohne sie zu kennen: ungeklärte Trainingsdaten, stille Modellwechsel im Hintergrund, kein Auskunftsanspruch im Vorfall. Verantwortlich bleibt sie gegenüber Betroffenen und Aufsicht trotzdem.','If a purchased AI system is deployed without assessment and without contractual commitments, the organisation carries its risks without knowing them: unclear training data, silent model changes in the background, no right to information during an incident. It nevertheless remains accountable to affected people and regulators.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.10.2','Delta-neu (KI-Luecke 2026-09)','{}','Modelle verlieren im Betrieb an Güte, weil sich Daten, Nutzerverhalten und Umfeld verschieben. Ohne laufende Überwachung bleibt diese Verschlechterung unbemerkt, bis Fehlentscheidungen auffallen — und das geschieht in aller Regel über Beschwerden, nicht über Kennzahlen.','Models lose accuracy in operation because data, user behaviour and context shift. Without continuous monitoring this degradation goes unnoticed until wrong decisions surface — and that normally happens through complaints, not through metrics.','active','ISO42001','{}'::jsonb),
  ('DR-ISO42001-A.10.4','Delta-neu (KI-Luecke 2026-09)','{}','Sind die Informationspflichten gegenüber Kunden nicht geregelt, entstehen im Vertrieb Zusagen, die das System nicht einhält. Die Lücke zwischen erwarteter und tatsächlicher Leistungsfähigkeit wird zum Gewährleistungsfall und beschädigt die Kundenbeziehung an der Stelle, an der Vertrauen am teuersten ist.','If information duties towards customers are not regulated, sales makes promises the system does not keep. The gap between expected and actual capability turns into a warranty case and damages the customer relationship exactly where trust is most expensive.','active','ISO42001','{}'::jsonb),
  ('DR-AIACT-A-50.1','Delta-neu (KI-Luecke 2026-09)','{}','Bleibt der Hinweis aus, dass das Gegenüber kein Mensch ist, oder fehlt die Kennzeichnung KI-erzeugter Inhalte, verstößt das unmittelbar gegen Artikel 50 der KI-Verordnung und ist bußgeldbewehrt. Über die Sanktion hinaus verlieren die Empfänger die Möglichkeit, das Gehörte oder Gesehene richtig einzuordnen — genau das, was die Transparenzpflicht verhindern soll.','If there is no notice that the counterpart is not a person, or if AI-generated content is not marked, this directly breaches Article 50 of the AI Act and carries fines. Beyond the penalty, recipients lose the ability to place what they hear or see in context — precisely what the transparency duty exists to prevent.','active','AIACT','{}'::jsonb)
ON CONFLICT (risk_id) DO UPDATE SET
  text_de = EXCLUDED.text_de,
  text_en = EXCLUDED.text_en,
  status  = EXCLUDED.status;

INSERT INTO public.control_risk (framework, control_id, risk_id, link_typ)
VALUES
  ('ISO42001','ISO42001-5.2','DR-ISO42001-5.2','delta'),
  ('ISO42001','ISO42001-5.3','DR-ISO42001-5.3-1','delta'),
  ('ISO42001','ISO42001-5.3','DR-ISO42001-5.3-2','delta'),
  ('ISO42001','ISO42001-6.1.4','DR-ISO42001-6.1.4-1','delta'),
  ('ISO42001','ISO42001-6.1.4','DR-ISO42001-6.1.4-2','delta'),
  ('ISO42001','ISO42001-8.3','DR-ISO42001-8.3','delta'),
  ('ISO42001','ISO42001-9.2','DR-ISO42001-9.2','delta'),
  ('ISO42001','ISO42001-A.4.4','DR-ISO42001-A.4.4','delta'),
  ('ISO42001','ISO42001-A.4.5','DR-ISO42001-A.4.5','delta'),
  ('ISO42001','ISO42001-A.6.2','DR-ISO42001-A.6.2','delta'),
  ('ISO42001','ISO42001-A.6.2.2','DR-ISO42001-A.6.2.2','delta'),
  ('ISO42001','ISO42001-A.6.2.3','DR-ISO42001-A.6.2.3','delta'),
  ('ISO42001','ISO42001-A.6.2.7','DR-ISO42001-A.6.2.7','delta'),
  ('ISO42001','ISO42001-A.6.2.8','DR-ISO42001-A.6.2.8','delta'),
  ('ISO42001','ISO42001-A.7.3','DR-ISO42001-A.7.3','delta'),
  ('ISO42001','ISO42001-A.7.4','DR-ISO42001-A.7.4','delta'),
  ('ISO42001','ISO42001-A.7.6','DR-ISO42001-A.7.6','delta'),
  ('ISO42001','ISO42001-A.8.2','DR-ISO42001-A.8.2','delta'),
  ('ISO42001','ISO42001-A.9.2','DR-ISO42001-A.9.2','delta'),
  ('ISO42001','ISO42001-A.10.2','DR-ISO42001-A.10.2','delta'),
  ('ISO42001','ISO42001-A.10.4','DR-ISO42001-A.10.4','delta'),
  ('AIACT','AIACT-A-50.1','DR-AIACT-A-50.1','delta')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Teil 2: 122 sachfremde Risiko-Verknuepfungen aus den KI-Katalogen entfernen
--
-- Beim Druck des Katalogs aufgefallen: an KI-Kontrollen haengen generische
-- ISMS-Risiken aus dem Paket "BSI-489", die mit der Frage nichts zu tun haben.
-- Belege aus dem Live-Bestand:
--   D-04.1 "Schutz gegen Prompt Injection"      <- R-0082/0150/0151/0392/0393/0394
--                                                 (allesamt KAPAZITAETSPLANUNG)
--   D-02.4 "Zugang zu Trainingsdaten/Modellen"  <- R-0095/0423/0424/0439
--                                                 (allesamt MOBILGERAETE)
-- Alle 27 betroffenen Risiken wurden einzeln gelesen: Kapazitaet, Mobilgeraete,
-- Awareness, Leitungsverpflichtung, Threat Intelligence, Sicherheitsleitlinie.
-- Kein einziges hat einen KI-Bezug.
--
-- Verteilung der 381 Verknuepfungen vor der Bereinigung:
--   AIACT   123 eigene / 12 fremde     ISO42001 92 / 17
--   NIST     29 eigene / 19 fremde     KI_SEC   15 / 74
-- KI_SEC ist am staerksten betroffen, weil die Konsolidierung vom 13.09.2026
-- die Zeilen in control_risk der alten Overlays mitgenommen hat, ohne zu pruefen,
-- ob die Risiken thematisch passen. Das ist der Fehler, der hier behoben wird.
--
-- REGEL: In einem KI-Katalog gehoert ein Risiko zur KI. Die generischen Risiken
-- bleiben in der Tabelle risks und an ihren ISO-27001-/BSI-/NIS2-Kontrollen
-- haengen — sie verschwinden nicht aus dem Produkt, sie stehen nur nicht mehr
-- unter einer KI-Frage.
--
-- Nach der Bereinigung traegt jede der 279 KI-Kontrollen genau ihr eigenes
-- KI-Risiko (259 vorhandene + 22 neue aus Teil 1) — keine Kontrolle bleibt leer.
-- ============================================================================
DELETE FROM public.control_risk
WHERE framework IN ('AIACT','ISO42001','NIST_AI_RMF','KI_SEC')
  AND risk_id NOT LIKE 'DR-%';
