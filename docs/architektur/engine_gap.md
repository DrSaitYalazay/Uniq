# Engine-Gap-Analyse: CyberWerkSuite vs. Marktführer-Niveau

**Chef-Architekt-Review (Fable5) · 2026-07-18 · Repo: `/Users/sekercakil/Downloads/ClaudeCWS` · alle Aussagen aus dem echten Code (`web/src/lib/*`)**

Benchmark: Vanta/Drata (kontinuierlicher, automatisch abgeleiteter Control-Status), OneTrust/Hyperproof (Workflow + gewichtete Rollups + Benchmark), AuditBoard (Audit-Trail + Risk-Ops), RiskLens (FAIR-quantitativ, korrelierte Aggregation, Loss Exceedance Curves).

Kurzurteil vorab: Die Suite hat eine **saubere, deterministische, gut kommentierte Pipeline** (Gap → Risk → Treatment → SoA → KPI) — das ist besser als viele MVPs. Aber fast jede Engine rechnet auf dem Niveau eines **Excel-Makros mit guter UX**: additive Punkte-Heuristiken, harte Schwellen, ungewichtete Mittelwerte, „−1 Stufe"-Residual. Der Abstand zum verkaufbaren Produkt liegt nicht in der Code-Qualität, sondern in der **methodischen Tiefe und der Evidenz-Kopplung**.

---

## 1. riskEngine.ts — Reife: 2/5

**Ist-Mechanik:** Klassische L×I-Matrix. Likelihood = additive Heuristik ab Basis 1 (`calculateLikelihood`: `score += maxImportance` [0.5–2] `+1.5` bei missing / `+0.5` bei weak / `+0.5` ab 4 Findings, Z. 224–257); Impact = Basis 2 + Boni für Org-Scope, Kritikalität (`critMap: Critical 2.5 / High 2 …`), Dependency-Count ≥5 → +1, SPOF +1 (Z. 261–312). Score = `likelihood * impact` (oder sum/max, Z. 316–323), Level über 3 harte Thresholds (`classifyRisk`).

**Naivität:**
- **Residualrisiko = „−1 Likelihood-Stufe"**, pauschal, sobald *irgendein* mitigate-Treatment `done` ist: `const reducedLikelihood = Math.max(1, r.likelihood - 1)` (Z. 498). Ein einziges abgeschlossenes Treatment senkt jedes Risiko gleich stark — unabhängig davon, welche und wie viele Controls umgesetzt wurden, ob sie präventiv oder detektiv wirken, oder ob sie überhaupt getestet sind. Das ist die Stelle, an der jeder Auditor zuerst lacht.
- Likelihood ist **gar keine Wahrscheinlichkeit**, sondern ein Proxy für „wie schlimm ist die Kontrolllücke". Es fließt keine Bedrohungslage ein (keine Threat-Intel, keine Branchen-Frequenzen, keine Historie eigener Incidents).
- Keine Verbindung zur FAIR-Quantifizierung (riskQuantEngine ist ein separates, optionales Overlay; die Matrix-Werte und die €-Bänder sind nicht konsistent verknüpft).
- Keine Risiko-Korrelation/Aggregation: `averageScore`/`maxScore` (Z. 443–444) ist die gesamte Portfolio-Sicht. Zwei Risiken auf demselben SPOF-Asset addieren sich nicht, gemeinsame Ursachen (z. B. „kein Patch-Mgmt" trifft 12 Assets) werden nicht als ein korreliertes Ereignis modelliert.
- `validateAcceptance` (Item 16) ist gut, aber per Default **inaktiv** (`if (!gateActive) return { ok: true }`, Z. 522).

**Marktreif wäre:** Residual = f(implementierte Controls × Control-Wirksamkeit × Testresultat), getrennt für Likelihood-/Impact-reduzierende Controls; kalibrierte Likelihood (Frequenz-Bänder statt Ordinalzahlen); Matrix nur als Anzeige-Layer über einer quantitativen Basis; Risiko-Aggregation je Asset/Service/Ursache; Acceptance-Gate per Default an mit Ablaufdatum + Re-Review-Workflow.

---

## 2. assessmentEngine.ts + control_node/control_mapping — Reife: 3/5

**Ist-Mechanik:** Framework-übergreifende Vererbung über Kontroll-Knoten (control_node_member) bzw. Legacy `control_iso`, Konfliktauflösung = **Last-Write-Wins** über `updated_at` (`projectAnswer`, Z. 98–168; `buildAnchorAnswerMap` Z. 180–195). Relations-bewusst: `subset-of`/`intersects-with` deckelt geerbtes „ja" auf „teilweise" (Z. 154–156). Intra-Framework-Geschwister-Schutz vorhanden (Z. 132). Compliance = `(ja + 0.5·teilweise)/applicable` (Z. 500).

**Naivität:**
- Vererbung ist **binär/ternär ohne Konfidenz**: geerbt = voll gültig (oder pauschal auf „teilweise" gedeckelt). Es gibt keinen Konfidenz-Score („dieses Mapping deckt 80 % der Anforderung, TF-IDF-Ähnlichkeit 0.91, human-verified: ja/nein"), keine Gewichtung mehrerer Anker (der zeitlich neueste gewinnt allein — ein frisch beantworteter schwacher Anker überschreibt drei ältere starke).
- **LWW ist fachlich angreifbar**: Wer zuletzt klickt, gewinnt — auch gegen eine besser belegte ältere Antwort. Kein worst-wins-Modus, keine Review-Pflicht bei Konflikt, kein Vier-Augen-Flag.
- Antwortstatus ist reine **Selbstauskunft** — es gibt keinerlei Kopplung an Evidence oder Tests. `evidence` ist ein Textfeld (`AnswerRow.evidence`), das die Projektion nur durchreicht.
- `compliancePct` mit fixem 0.5-Gewicht für „teilweise" — keine Muss/Kann-Gewichtung, kein Control-Kritikalitäts-Gewicht (ein fehlendes MFA zählt wie eine fehlende Clean-Desk-Policy).

**Marktreif wäre:** Mapping mit Konfidenz + Coverage-Prozent je Kante (SCF/OSCAL-Stil), Vererbung als gewichtete Aggregation mehrerer Anker mit Provenienz-Audit-Trail, Konflikt-Queue statt stiller LWW, und Status, der aus Evidence/Tests **abgeleitet** statt behauptet wird.

---

## 3. gapEngine.ts — Reife: 2/5

**Ist-Mechanik:** Zwei Pfade. Legacy-NIS2-Pfad: additiver Severity-Score (`calculateSeverity`: importance×2 + 3 bei missing + Asset-Boni, Schwellen 12/8/5, Z. 405–480) mit zwei hartkodierten „Severity-Floors" gegen Text-Widersprüche (Z. 455–477). Live-Pfad (`buildFindingsAndGaps`): Severity = **reine 2×2-Tabelle** `severityFor(muss, answer)` — muss+nein=critical, muss+teilweise=high, kann+nein=high, sonst medium (Z. 735–740); Gruppen-Severity = Max der Gruppe.

**Naivität:**
- Der aktive Live-Pfad ist exakt das, was der Auftrag vermutet: **Severity = muss × Antwort**, sonst nichts. Kein Asset-Kontext, keine Kritikalität, keine Ausnutzbarkeit, keine Bedrohungsrelevanz, keine Häufung.
- `risk_text`/`measure_text` im Live-Pfad sind **leer** (Z. 784–787); im Legacy-Pfad sind sie Template-Textbausteine mit immer demselben „Bußgelder bis 10 Mio. EUR"-Absatz je Frage (Z. 207–229) — ein Auditor erkennt nach 3 Findings den Serienbrief.
- Die Severity-Floors (asset_mgmt-Sonderfall Z. 474) sind Symptom-Pflaster: Man flickt Widersprüche zwischen Score und Erzähltext, statt den Score aus dem Kontext herzuleiten.

**Marktreif wäre:** Severity = f(Control-Gewicht, Asset-Kritikalität, Exposure, Kompensations-Controls, Evidenz-Alter); dedupliziert über Frameworks (ein Gap, n Framework-Referenzen); generierte, aber fallspezifische Begründungen; Auditor-taugliche Herleitung („Severity hoch, weil …" mit Faktoren).

---

## 4. maturityV2.ts / maturityEngine.ts — Reife: 2/5

**Ist-Mechanik:** maturityV2: je Familie **ungewichteter Mittelwert** der erfassten Reifegrade (`captured.reduce(...)/captured.length`, Z. 103–105); ohne uses_maturity ein Pseudo-Score „ja=5, teilweise=2.5, sonst 0" (Z. 110–117). Overall = **Mittelwert der Familien-Mittelwerte** (Z. 138–140). Ziel/Gap = simple Differenz `target − ist` aus `maturity_targets`. maturityEngine (deprecated) identische Formel.

**Naivität:**
- „ja = Level 5" im derived-Modus ist methodisch falsch (Konformität ≠ Optimierend/KVP) — immerhin als `derived` geflaggt, aber die Zahl landet trotzdem in KPI #6.
- Ungewichteter Familien-Mittelwert: eine Familie mit 2 Kontrollen zählt gleich viel wie eine mit 40; keine Muss-Gewichtung; keine Mindest-Erfassungsquote (1 erfasster Reifegrad von 30 Kontrollen ⇒ Familien-Ist = dieser eine Wert).
- **Kein Trend**: kein Verlauf über Zeit, keine Reifegrad-Historie, kein Vergleich zu Peer-Benchmarks (die ENISA-Referenzen stehen nur als Text in kpiEngine).
- CMMI-Labels ohne CMMI-Methodik: keine Prozess-Attribute, kein Assessor-Modus, keine Evidenz je Level-Behauptung.

**Marktreif wäre:** Gewichteter Rollup (Kontrollanzahl × Wichtigkeit), Erfassungsquote als Konfidenz-Ausweis, Zeitreihe + Zielpfad (Level 3 bis Q2), Benchmark-Overlay („Branche: 2.8"), Evidenz-Pflicht ab Level 3.

---

## 5. kpiEngine.ts — Reife: 3/5

**Ist-Mechanik:** 9–11 KPIs mit fest verdrahteten Schwellen (`implRate >= 95 ? "healthy" : >= 80 ? "warning" : "critical"`, Z. 262; `bandLow(openHC, 2, 5)` Z. 302; MTTR-Ziel 48 h Z. 390). Trend = Delta der letzten zwei Snapshots gegen fixe Toleranz (Z. 787–804). Velocity = lineare pp/Woche aus zwei Snapshots, Projected Completion = lineare Extrapolation (Z. 577–583). Overall = Mittel aus healthy=100/warning=50/critical=0 über Board-KPIs (Z. 758–763).

**Stärken (ehrlich):** `no_data`-Disziplin („false-positive green is forbidden"), Quellen-Anker je KPI (NIS2 Art. 23, ENISA TIG), Tier-Klassifizierung, Target-Overrides — das ist konzeptionell über MVP-Niveau und verkaufsfähig erzählbar.

**Naivität:**
- **Alle Schwellen statisch** (95/80, 2/5, 48/168 h) — Vendor-Defaults ohne Peer-Benchmark-Daten dahinter. „Markt-Benchmark" steht als Label dran, es gibt aber keine Benchmark-Datenbasis.
- Trend aus **genau 2 Snapshots**, Snapshots entstehen nur beim Dashboard-Öffnen — keine Zeitreihen-Statistik, keine Saisonalität, keine Konfidenzintervalle; lineare Completion-Projektion ignoriert den bekannten Endphasen-Slowdown (steht selbst im Kommentar: „20 % Puffer empfohlen" — aber als Text, nicht als Rechnung).
- Overall-Score 100/50/0-Stufung wirft Information weg (94 % und 81 % sind beide „warning" = 50).

**Marktreif wäre:** konfigurierbare + datenbasierte Schwellen (Percentile über anonymisierte Tenant-Kohorte), automatische periodische Snapshots (Cron), gleitende Trends mit Unsicherheitsband, KPI-Drilldown bis auf Control-/Evidence-Ebene.

---

## 6. roadmapEngine.ts / treatmentEngine.ts — Reife: 2/5

**Ist-Mechanik:** Roadmap-Phase = **Lookup auf risk_level + Fälligkeitsnähe** (`computePhase`: critical & ≤30 Tage → now, high & overdue → now, medium → later …, Z. 43–64). Treatment-Priorität = 3-Stufen-Mapping `getTreatmentPriority` (critical oder high≥15 → P1, Z. 347–351). Control-Vorschläge = ISO-Anker-Match, dann Capability-Match, dann Auffüllen bis mind. 2 (`suggestControlsForRisk`, Z. 274–343 inkl. „Absolute guarantee: at least two visible suggestions" — Z. 321–327: es werden notfalls **beliebige** Katalog-Controls vorgeschlagen). Fälligkeits-Vorschlag = fixe 14/30/60/120 Tage je Level (treatmentQuickWins Z. 154–159).

**Naivität:**
- **Keine Risk-Reduction-per-Effort-Priorisierung.** `effort_pt` existiert im RoadmapItem (Z. 19) und `effort_days` bei Custom-Controls, aber **nichts rechnet damit**. Es gibt keinen Score „dieses Control senkt 4 Risiken um Σ X für Y PT". Genau das ist das Verkaufsargument von Hyperproof/Drata-Roadmaps.
- Ein Control, das 6 Risiken mitigiert, wird nur in der Picker-Sortierung bevorzugt (`mitigated_risk_count`-Sort, Z. 481–485) — nicht in der Phasen-/Prioritätslogik.
- Der „mindestens 2 Vorschläge"-Fallback erzeugt fachlich unbegründete Empfehlungen — im Demo hübsch, im Audit peinlich („Warum schlägt das Tool ISO A.7.4 gegen ein IAM-Risiko vor?").
- Kein Kapazitäts-/Abhängigkeits-Modell: keine Team-Kapazität, keine Control-Abhängigkeiten (erst Inventar, dann Patch-Mgmt), keine Kosten.

**Marktreif wäre:** Priorisierung = Δ-Risiko (idealerweise Δ-ALE in €) ÷ Aufwand, Mehrfach-Risiko-Abdeckung als Multiplikator, Kapazitätsplanung gegen `effort_pt`, Abhängigkeitsgraph, Szenario-Vergleich („Plan A senkt ALE um 240 k€ bei 60 PT").

---

## 7. criticalityEngine.ts — Reife: 3/5

**Ist-Mechanik:** Echte gewichtete Formel: 7 Faktoren, normalisiert auf 0–4, `Σ (normalized × weight)` mit `DEFAULT_WEIGHTS` (operational 0.30, users/data/dependency je 0.15 …, Z. 45–53, 85–111), Schwellen 1.99/2.99/3.49, plus Breakdown + Top-3-Erklärung.

**Naivität:** Das ist die methodisch sauberste kleine Engine — aber: Inputs sind 7 manuelle 1–5-Slider (reine Selbsteinschätzung, keine Ableitung aus Ist-Daten wie Dependency-Count, Service-Kritikalität, Datenklassen im Bestand); Gewichte sind Vendor-Defaults ohne Kalibrierungs-Workshop-Support; keine Konsistenzprüfung gegen die tatsächliche Dependency-Struktur (ein Asset mit `dependency_importance=1` kann trotzdem 12 eingetragene Abhängigkeiten haben — niemand merkt es).

**Marktreif wäre:** Vorbefüllung der Faktoren aus Bestandsdaten (Deps, Services, Datenklassifizierung), Widerspruchs-Hinweise, BIA-Kopplung (RTO/RPO), Gewichts-Kalibrierung je Branche.

---

## 8. soaProjection.ts / soaRiskLinkage.ts — Reife: 3/5

**Ist-Mechanik:** soaProjection ist ein solider **Merge-Layer** mit dokumentierter Feld-Ownership-Tabelle und Präzedenz (savedSoA > Treatment > Assessment > Katalog, Kopfkommentar Z. 1–39); implStatus wird bei „implemented"-Spiegel hart auf „ja" gesetzt (Z. 309–323). soaRiskLinkage baut Control↔Risk bidirektional aus Treatment-Selektionen; `linked_to_high_risk` = bool, wenn irgendein verknüpftes Risiko high/critical (Z. 107–131). Flags wie `isRiskyExclusion` und `missingJustification` sind gute Auditor-Features.

**Naivität:**
- **Automatisierungsgrad ≈ 0**: applicability/justification sind zu 100 % Handeingabe; es gibt keine Vorschlags-Logik („kein OT-Asset im Scope ⇒ IND-Bausteine vermutlich n. a."), keine Scope-Ableitung aus dem Asset-/Service-Register.
- Risk-Linkage entsteht **nur** aus Treatment-Auswahl — Controls, die nie in einem Treatment ausgewählt wurden, sind „unlinked", auch wenn sie dasselbe Risiko offensichtlich adressieren. `linked_to_high_risk` ist binär; keine Abdeckungsstärke.
- Owner/DueDate: „First treatment … wins" (Kommentar Z. 289) — willkürliche Auflösung bei Mehrfach-Verknüpfung.
- SoA-Version/Änderungshistorie fehlt (ISO-Auditoren wollen SoA-Versionsstände mit Datum/Freigabe).

**Marktreif wäre:** Scope-getriebene NA-Vorschläge mit Begründungs-Templates, Versionierte SoA mit Freigabe-Workflow, Coverage-Score je Control-Risiko-Kante, automatische Linkage über die Capability-/Knoten-Struktur statt nur über manuelle Treatment-Klicks.

---

## 9. evidenceEngine.ts / deadlineEngine.ts / incidentTriggerEngine.ts — Reife: 2/5 (Evidence), 3/5 (Deadline/Incident)

**Ist-Mechanik:** evidenceEngine = **CRUD + Frische-Ampel**: `freshness()` vergleicht nur `valid_until` gegen heute + 30-Tage-Fenster (Z. 101–112); „prove once"-Vererbung über Kontroll-Knoten (`resolveInheritedEvidence`, Z. 305–370) ist ein echtes Differenzierungs-Feature. deadlineEngine = 75/90/100 %-Ampel (`deadlineAmpel`, Z. 82–103) + Recurrence-Rollover (`completeDeadline` erzeugt Folgeinstanz, Z. 153–201). incidentTriggerEngine = deterministische Meldepflicht-Auflösung je Framework inkl. „unbekannt gilt als ja" und dokumentierter Nicht-Auslösung (Z. 82–157) — regulatorisch sauber gedacht (NIS2/DORA/KRITIS/GDPR-Stufenlogik).

**Naivität (die entscheidende):**
- **Evidence beeinflusst den Control-Status NICHT.** Es gibt keinen abgeleiteten Status („Control ja, aber einziger Nachweis expired ⇒ Status degradiert auf teilweise/unverified"). Die Frische fließt nur als aggregierte KPI-Prozentzahl ein (kpiEngine Z. 648–650). Vanta/Drata leben genau von dieser Kopplung: Test schlägt fehl ⇒ Control rot ⇒ Alert.
- **Keine automatisierte Evidence-Sammlung**: alles manueller Upload/Link; keine Integrationen (IdP, MDM, Cloud-Config, Ticketing), keine wiederkehrenden Evidence-Tests, keine Prüfregeln gegen den Inhalt.
- Frische ist rein datumsbasiert; kein Typ-abhängiger Zyklus (Pentest jährlich vs. Access-Review quartalsweise) außer manuell via `valid_until`.
- Deadline-Engine ist funktional ok, aber reine Fristen-Ampel: kein Eskalations-Workflow (Erinnerung → Vorgesetzter → Management), keine Benachrichtigungen im Engine-Code.

**Marktreif wäre:** Continuous-Control-Monitoring: Evidence-Tests mit pass/fail, abgeleiteter Control-Status = f(Antwort, Evidence-Frische, Testresultat), Konnektor-Framework für automatische Nachweise, typbasierte Frische-Policies, Eskalationsketten.

---

## 10. riskQuantEngine.ts — Reife: 2/5 (als Produkt-Feature; die Mathematik selbst ist sauber)

**Ist-Mechanik:** FAIR-light: LEF- und LM-3-Punkt-Schätzung → PERT/Beta via Marsaglia-Tsang-Gamma, 10 000 Monte-Carlo-Draws, seedbar (mulberry32), Ergebnis P10/P50/P90/Mean (`simulateAnnualLoss`, Z. 141–167). Handwerklich korrekt implementiert.

**Naivität:**
- **Nur Einzelrisiko, keine Portfolio-Aggregation**: Es gibt keine Summation über Risiken, erst recht keine korrelierte (gemeinsame Treiber, Copulas oder auch nur ein einfacher Korrelationsfaktor). Ein CFO fragt als erstes: „Was ist unsere Gesamt-Exposure p. a.?" — die Engine kann es nicht beantworten.
- **Keine LEC-Kurve** (Loss Exceedance Curve) — nur 3 Perzentile + Mean; RiskLens' Kernartefakt fehlt komplett.
- FAIR ohne FAIR-Zerlegung: LEF ist direkt geschätzt statt TEF × Vulnerability; LM ohne Primär-/Sekundärverlust-Formen (Response, Replacement, Fines, Reputation).
- **Entkoppelt vom Rest**: kein Rückfluss in Priorisierung (Roadmap rechnet weiter ordinal), kein „Δ-ALE durch Treatment X", keine Kopplung Matrix ↔ €-Band (dieselbe Gefahr kann qualitativ „hoch" und quantitativ trivial sein — niemand prüft die Konsistenz). Kommentar sagt selbst: „Die Verdrahtung … erfolgt SEPARAT" (Z. 17–18).
- Keine Kalibrierungs-Hilfen (Referenzwerte je Szenario/Branche, Vertrauensintervall-Training).

**Marktreif wäre:** LEC über das Gesamtportfolio mit Korrelationsannahme, TEF×Vuln×LM-Zerlegung mit Bibliothek von Verlustformen, ROI je Treatment (Δ-ALE vs. Kosten), Konsistenz-Check qualitativ↔quantitativ, Szenario-Bibliothek mit Startwerten.

---

## Die 4 größten „sieht billig aus"-Lücken (Käufer-/Auditor-Sicht)

1. **Kein abgeleiteter, kontinuierlicher Control-Status.** Alles ist Selbstauskunft per Klick; Evidence/Tests degradieren nie einen Status, nichts wird automatisch gesammelt oder geprüft. Das ist DER Abstand zu Vanta/Drata — ohne das ist die Suite ein Fragebogen-Tool mit schöner Pipeline. (evidenceEngine + assessmentEngine)
2. **Residualrisiko „−1 Stufe" + keine risikobasierte Priorisierung.** `likelihood - 1` bei irgendeinem done-Treatment (riskEngine Z. 498) und Roadmap-Phasen per Level-Lookup ohne Risk-Reduction-per-Effort (effort_pt existiert, wird nie verrechnet). Ein Auditor zerlegt das in einer Frage; ein Käufer vermisst das ROI-Argument.
3. **Quantitatives Risiko ist ein unverbundenes Insel-Feature.** FAIR-light rechnet nur Einzelrisiken, keine Portfolio-/LEC-Sicht, keine korrelierte Aggregation, kein Δ-ALE je Maßnahme — die €-Zahl beeindruckt im Demo und hält keiner CFO-Nachfrage stand. (riskQuantEngine)
4. **Vererbung ohne Konfidenz + Live-Gap-Severity = 2×2-Tabelle.** Cross-Framework-Vererbung per Last-Write-Wins ohne Mapping-Konfidenz/Coverage-Grad (assessmentEngine), und im aktiven Pfad ist Gap-Severity buchstäblich `severityFor(muss, answer)` ohne jeden Asset-/Bedrohungskontext (gapEngine Z. 735–740). Beides fällt im technischen Due-Diligence-Review sofort auf.

*(Dahinter, Rang 5–6: statische KPI-Schwellen ohne echte Benchmark-Datenbasis; ungewichtete Reifegrad-Mittelwerte mit „ja=5"-Fiktion und ohne Trend.)*

## Reife-Noten (1 = Demo-Heuristik, 5 = Marktführer)

| Engine | Note | Ein-Satz-Begründung |
|---|---|---|
| riskEngine | **2** | L×I-Matrix mit additiver Heuristik, Residual „−1 Stufe", keine Korrelation/€ |
| assessmentEngine (+Knoten/Mapping) | **3** | Relations-bewusste Knoten-Vererbung existiert, aber LWW ohne Konfidenz/Gewicht |
| gapEngine | **2** | Aktiver Pfad: Severity = muss×Antwort; Legacy-Pfad: Punkte-Heuristik + Text-Templates |
| maturityV2/maturityEngine | **2** | Ungewichtete Mittelwerte, „ja=5"-Pseudo-Score, kein Trend/Benchmark |
| kpiEngine | **3** | Ehrliche no_data-Disziplin + Quellen-Anker, aber statische Schwellen, 2-Punkt-Trends |
| roadmapEngine/treatmentEngine | **2** | Phasen-Lookup nach Level, keine Risk-Reduction-per-Effort, Zwangs-Vorschläge |
| criticalityEngine | **3** | Echte gewichtete Formel mit Breakdown — aber rein manuelle Inputs |
| soaProjection/soaRiskLinkage | **3** | Sauberer Merge-Layer mit Audit-Flags, aber 0 % Automatisierung, binäre Linkage |
| evidenceEngine | **2** | CRUD + Datums-Ampel + Knoten-Reuse; kein abgeleiteter Status, keine Sammlung |
| deadlineEngine/incidentTriggerEngine | **3** | Regulatorisch korrekt modellierte Fristenketten, aber nur Ampel, keine Eskalation |
| riskQuantEngine | **2** | Mathematisch saubere PERT-MC, aber Einzelrisiko-Insel ohne LEC/Korrelation/ROI |
