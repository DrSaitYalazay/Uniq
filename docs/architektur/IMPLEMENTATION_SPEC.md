# CyberWerkSuite — Implementierungs-Spezifikation (priorisierter Backlog)

**Stand:** 2026-07-17 · Basis: ARCHITECTURE.md (gleiches Verzeichnis) + Code-Review.
**Repo:** `/Users/sekercakil/Downloads/ClaudeCWS`
**Konvention:** Aufwand S (<½ Tag) / M (½–2 Tage) / L (>2 Tage). "SELF-CONTAINED" = isoliert mergebar, kein Verhaltensrisiko für Bestand. "GROSS/RISKANT" = berührt Kernpfade, braucht Vergleichstests.

---

## 1. Gap-Analyse: Ist vs. Soll

| # | Bereich | Ist | Soll | Lücke |
|---|---|---|---|---|
| G1 | Knoten-Modell DDL | `control_node/_member` nur in `db/seeds/overrides.sql:10530-10550` + `db/schema.sql:55233 ff.` (CREATE IF NOT EXISTS am Datei-Ende); keine versionierte Migration | Versionierte Migration, deterministische Install-Reihenfolge | Fresh-Installs/CI hängen von Seed-Reihenfolge ab |
| G2 | Mapping-Relationstyp | Knoten = strict same-as; `control_iso` binär; kein Relationstyp/Stärke nirgends im Schema | `control_mapping(relation, strength 1–10, rationale)` nach STRM/OSCAL | Partielle Überdeckung nicht abbildbar → entweder gar keine oder volle Vererbung |
| G3 | Projektion | `projectAnswer` = reines LWW über Anker; jeder Anker vererbt voll; Coverage-blind (assessmentEngine.ts:81-132) | equal→voll, subset/intersects→Deckel "teilweise", `projectionQuality` sichtbar | Falsch-vollständige Vererbung möglich, sobald partielle Mappings existieren; keine Herkunfts-Qualität in UI |
| G4 | Evidence | `answers.evidence` = Freitext; Audit-Evidenz im Tool-Blob | `evidence` + `answer_evidence` Tabellen, Datei/Link/Typ/`valid_until`, Reuse über Knoten | Kein prüffester Nachweis, keine Frische, kein Reuse ("prove once") |
| G5 | Fristen | `fristStatus()` geteilt, aber Frist-Quellen verstreut in 5+ Tool-Blobs; `frist_notification_log` ohne Befüller; kein Server-Reminder | Zentrale `compliance_deadlines` + `deadlineEngine.ts` + Cron-Reminder + Dashboard-Kachel | Fristen unsichtbar außerhalb des jeweiligen Tools; niemand wird erinnert |
| G6 | Tote Engine | `web/src/lib/mappingEngine.ts` — 0 Importe (verifiziert), eigener In-Memory-Katalog + konkurrierende MappingType-Semantik | gelöscht | Verwirrung, doppelte Wahrheit für künftige Entwickler |
| G7 | Toter Stub | `PhaseStub.tsx` + `App.tsx:37` Import + Kommentar `App.tsx:98` "others are stubs until rebuilt" | gelöscht | Stale Cruft |
| G8 | Inheritance-Schalter | `useFrameworkInheritance` (off/preview/applied) dokumentiert "worst wins", Engine macht LWW; Wirkung in Assessment unklar/nicht verdrahtet | Schalter real verdrahtet (off = nur explizit) oder entfernt | Doku ≠ Verhalten; toter Konfigurations-Zustand |
| G9 | Gap-Pipeline | Zwei Pipelines: `gapEngine.runGapAnalysis` (statisch: nis2Controls/controlMetadata) UND `useRiskAnalysis.buildFindingsAndGaps` (DB-katalog-agnostisch) | Eine katalog-agnostische gapEngine v2 | Doppelte Logik, NIS2-hartes Wording (Bußgeld-Prosa) auch bei Nicht-NIS2-Tenants |
| G10 | Maturity | Zwei Welten: `answers.reifegrad` (0–5, erfasst) vs. `maturityEngine`-Pseudo-Score (ja=5/teilweise=2,5, NIS2-gebunden); kein Zielwert | reifegrad-SSOT bei `uses_maturity`, `maturity_targets`, Gap=target−ist, katalog-agnostisch | Erfasste Reifegrade fließen nirgends in die Maturity-Sicht; TISAX-RG3-Ziel nicht prüfbar |
| G11 | Risiko | Nur qualitative Matrix; kein inherent/residual; Matrix-Config + Treatments in `user_tool_data` (user-scoped) | inherent/residual, `risk_config` org-scoped, Akzeptanz-Gate | Restrisiko nicht ausweisbar (ISO 27005-Pflichtbaustein); Team sieht Treatments des Kollegen nicht |
| G12 | Reporting | Zwei Generationen je Report (HTML-Route + legacy direct-draw: riskReportPdf/Word, gapReportGenerator/Word/Excel) | Eine HTML→PDF/Word-Route + XLSX | Doppelpflege, Drift-Gefahr |
| G13 | KPI-Historie | Snapshots im Tool-Blob (user-scoped, gerätefern nicht robust) | `kpi_snapshots`-Tabelle + wöchentlicher Auto-Snapshot | Trend/Velocity fragil, Management-Review ohne Historie |
| G14 | SoA-Kopplung | `soaProjection` importiert Typen aus `nis2Controls` | generische Katalog-Typen | SoA konzeptionell NIS2-verdrahtet |
| G15 | Realtime | `/realtime` SSE-No-Op-Stub (api/src/index.js) | entfernen oder minimal echt | Irreführender toter Endpoint |
| G16 | Legacy-Answers | `assessment_answers`, `org_assessment_answers`, `class_assessment_answers` parallel zur SSOT `answers` | archiviert/entfernt | Schema-Ballast, Verwechslungsgefahr |
| G17 | phaseGroups-Doku | Kommentar "8-phase pipeline", Array hat 7 | Kommentar korrigiert | Trivial, aber verwirrend |
| G18 | Management-Review | fehlt (ISO 9.3, NIS2 §38-Leitungsnachweis) | geführtes Modul in Schritt 7 mit Auto-Inputs | Pflicht-Nachweis nicht abbildbar |

---

## 2. Backlog (nach Priorität sortiert)

### P0 — kritisch

---

**ITEM 01 — Knoten-DDL in versionierte Migration überführen**
- **Priorität:** P0 · **Aufwand:** S · **SELF-CONTAINED SICHER**
- **Dateien:** neu `db/migrations/2026xxxx_control_node_ddl.sql`; `db/schema.sql` (Abschnitt Z. 55233-55240 an kanonische Stelle bei den anderen Katalog-Tabellen verschieben); `db/seeds/overrides.sql` (DDL-Zeilen 10530-10537 raus, nur TRUNCATE+INSERT-Seedteil behalten).
- **Was:** CREATE TABLE `control_node`/`control_node_member`, Index, GRANTs, RLS-Policies (Inhalt exakt aus overrides.sql:10530-10537 übernehmen) als eigene Migration. Seeds enthalten danach nur noch Daten (TRUNCATE + INSERT), keine DDL.
- **Akzeptanz:** Fresh-Install (`schema.sql` + Migrationen + Seeds in Reihenfolge) erzeugt identisches Schema; `psql`-Diff der Tabellendefinitionen vor/nach = leer.
- **Risiko:** minimal (reine Umsortierung).

---

**ITEM 02 — `control_mapping`-Tabelle (Relationstyp + Stärke, STRM/OSCAL)**
- **Priorität:** P0 · **Aufwand:** M · **SELF-CONTAINED SICHER** (Tabelle zunächst leer → null Verhaltensänderung)
- **Dateien:** neu `db/migrations/2026xxxx_control_mapping.sql`; `db/schema.sql` nachziehen.
- **Was:** Tabelle exakt nach ARCHITECTURE.md §2.2 (b): source_(framework,control_id), target_node_id XOR target_(framework,control_id), `relation` CHECK ('equal','subset-of','superset-of','intersects-with'), `strength` 1–10, `rationale`, `source`. RLS read-only für authenticated (`USING (true)`), GRANT ALL service_role. Indizes auf source-Paar und target_node_id.
- **Akzeptanz:** Migration läuft idempotent; `SELECT count(*) = 0`; RLS-Policy vorhanden; App-Verhalten unverändert.
- **Risiko:** minimal.

---

**ITEM 03 — Relations-bewusste Projektion in assessmentEngine (Teil-Deckelung)**
- **Priorität:** P0 · **Aufwand:** L · **GROSS/RISKANT** (Kernpfad — Vergleichstests Pflicht)
- **Dateien:** `web/src/lib/assessmentEngine.ts` (projectAnswer, buildAnchorAnswerMap, EffectiveAnswer-Typ); `web/src/hooks/useAssessment.ts` (Laden von control_mapping, `anchorsBySpokeControl` → `Map<string, AnchorRef[]>` mit `{anchorId, relation}`); Konsumenten anpassen: `web/src/hooks/useComplianceOverview.ts`, `web/src/hooks/useRiskAnalysis.ts`, `web/src/pages/AuditWorkbench.tsx`, `web/src/pages/Assessment.tsx`.
- **Was:**
  1. Typ `AnchorRef = { anchorId: string; relation: "equal"|"subset-of"|"superset-of"|"intersects-with" }`. Knoten-Mitgliedschaft ⇒ `equal`; control_iso-Fallback ⇒ `equal` (Bestandsverhalten!); control_mapping-Zeilen ⇒ deklarierter Typ.
  2. `projectAnswer`: LWW bleibt, ABER geerbter Status über `subset-of`/`intersects-with`-Anker wird gedeckelt: `ja → teilweise` (teilweise/nein unverändert, `na` nie vererbt). Neues Feld `projectionQuality: "full"|"partial"` + `inheritedFrom: {anchorId, relation}[]`.
  3. Sibling-Bleed-Guard (Z. 104-109) UNVERÄNDERT beibehalten — Testfall dafür schreiben.
  4. Unit-Tests: (a) equal-only ⇒ byte-identisches Verhalten zu heute (Golden-Test mit Fixture-Antworten), (b) subset-Anker ja ⇒ teilweise, (c) gemischte Anker: equal-ja + subset-ja ⇒ ja (equal gewinnt), (d) nur-partielle Anker ⇒ max teilweise, (e) na wird nie vererbt.
- **Akzeptanz:** Solange `control_mapping` leer ist, sind alle FrameworkStats aller Frameworks für einen Demo-Tenant identisch mit vorher (Snapshot-Vergleich). Tests (a)–(e) grün. UI zeigt "geerbt (teilweise Überdeckung)" bei partial.
- **Risiko:** hoch bei Fehlern in der Anker-Auflösung → Golden-Test zwingend VOR Merge.

---

**ITEM 04 — Evidence-Datenmodell + Assessment-Anbindung**
- **Priorität:** P0 · **Aufwand:** L · **GROSS** (neues Feature, aber additiv — Bestandsdaten unberührt)
- **Dateien:** neu `db/migrations/2026xxxx_evidence.sql`; `api/src/storage.js` (Bucket `evidence`); neu `web/src/lib/evidenceEngine.ts` (CRUD + Frische-Ampel + Knoten-Reuse-Auflösung); neu `web/src/components/EvidencePanel.tsx`; einbinden in `web/src/pages/Assessment.tsx` (Kontroll-Detail) und `web/src/pages/AuditWorkbench.tsx`.
- **Was:** Tabellen `evidence` + `answer_evidence` nach ARCHITECTURE.md §2.3 (tenant-RLS wie `answers`). Upload über bestehende `/storage`-Route, Pfad `evidence/<tenant_id>/<uuid>`. EvidencePanel: Liste (eigene + über Knoten geerbte, geerbte mit Quell-Badge), Anhängen (Datei/Link/Attestation), `valid_until`-Datum. `evidenceEngine.freshness(e)`: ok / läuft ab (<30 T) / abgelaufen. Bestehendes `answers.evidence`-Textfeld in UI zu "Notiz zum Nachweis" umbenennen (kein Datenverlust, keine Migration der Texte).
- **Akzeptanz:** Nachweis an ISO-Kontrolle anhängen → erscheint als "geerbter Nachweis" an BSI-Ko-Mitglied desselben Knotens; RLS-Test: fremder Tenant sieht nichts; Upload >12 MB wird abgelehnt; abgelaufene Evidence zeigt rote Ampel.
- **Risiko:** mittel (Storage-Pfad-Autorisierung sauber testen).

---

**ITEM 05 — Zentrale Fristen-Engine (`compliance_deadlines` + deadlineEngine + Cron)**
- **Priorität:** P0 · **Aufwand:** L · **GROSS** (mehrere Tools, aber pro Tool additiv andockbar)
- **Dateien:** neu `db/migrations/2026xxxx_compliance_deadlines.sql`; neu `web/src/lib/deadlineEngine.ts` (fristStatus/ablaufendeFristen aus `incidentTriggerEngine.ts` extrahieren, dort re-exportieren — kein Import bricht); neu `api/src/jobs/scheduler.js` + `api/src/jobs/deadlineReminder.js` (node-cron, stündlich, `asService`, schreibt `frist_notification_log` idempotent je (deadline, schwelle)); `api/src/index.js` (Job-Start); Dashboard-Kachel in `web/src/pages/Dashboard.tsx`; Schreiber schrittweise: `IncidentManagement.tsx` (Meldestufen materialisieren, inkl. DORA-Kette: Stufe "Erstmeldung" `starts_at` = Abschluss der Klassifizierung, `meta.chain_after`), `DatenschutzCockpit.tsx` (DSAR 1 Monat), `DocumentLifecycle.tsx` (Reviews), `BusinessContinuity.tsx` (Übungen/DachG), `Trainings`/TrainingTab (Leitungsschulung, recurrence '1 year'), AuditWorkbench (KRITIS-Nachweis recurrence '2 years').
- **Was:** Tabelle nach ARCHITECTURE.md §2.5. deadlineEngine: `createDeadline`, `completeDeadline` (bei `recurrence` → Folgeinstanz), `listOpen(tenant)`, Ampel via fristStatus. Cron: Schwellen 75 %/90 %/überfällig → E-Mail via `lib/email.js`.
- **Akzeptanz:** Incident anlegen mit NIS2-Trigger → 3 Deadline-Zeilen (24h/72h/30T) entstehen; Dashboard-Kachel zeigt sie; Cron-Testlauf (Frist künstlich auf 80 %) versendet genau EINE Mail und loggt sie; `completeDeadline` einer 2-Jahres-Frist erzeugt Folgeinstanz +2 J.
- **Risiko:** mittel; Reihenfolge: Tabelle+Engine+Cron zuerst (self-contained), Tool-Andockungen einzeln danach.

---

**ITEM 06 — Tote `mappingEngine.ts` entfernen**
- **Priorität:** P0 · **Aufwand:** S · **SELF-CONTAINED SICHER**
- **Dateien:** löschen `web/src/lib/mappingEngine.ts`; prüfen/ggf. löschen (nur falls ausschließlich von ihr importiert): `web/src/data/frameworkMappings/nis2-to-iso.ts`, `web/src/data/frameworkMappings/types.ts`, `web/src/data/frameworks/{iso27001,nis2,types}.ts`.
- **Was:** Grep-verifiziert: `from "@/lib/mappingEngine"` hat 0 Treffer. Datei löschen. Vorher je Data-Datei Grep auf andere Importe; nur mitentfernen, was ausschließlich an mappingEngine hing. Die MappingType-Semantik lebt konzeptionell in ITEM 02 weiter.
- **Akzeptanz:** `tsc`/Vite-Build fehlerfrei; kein Laufzeit-Import-Fehler; Bundle kleiner.
- **Risiko:** minimal.

---

**ITEM 07 — Knoten-Migration abschließen (control_iso-Ablösung, framework-weise)**
- **Priorität:** P0 · **Aufwand:** L · **GROSS/RISKANT** (Daten-Arbeit + Abnahme je Framework)
- **Dateien:** `db/seeds/overrides.sql` (Knoten-/Mapping-Seeds erweitern); neu `db/migrations/2026xxxx_frameworks_meta_flag.sql` (`frameworks.meta jsonb` bzw. Spalte `node_complete boolean DEFAULT false`); `web/src/hooks/useAssessment.ts` (Fallback-Gate: control_iso-Anker nur laden/nutzen, wenn `node_complete=false` fürs Framework); Vergleichs-Skript neu `db/tools/projection_diff.sql` oder Node-Skript.
- **Was:** Für jedes aktive Framework: alle Kontrollen entweder (a) Knoten-Mitglied, (b) `control_mapping`-Zeile (partiell, mit rationale), oder (c) bewusst "spezifisch/ohne Mapping". Danach `node_complete=true` setzen → Fallback aus. Abnahme mit Diff-Report: effektive Projektion alt (control_iso) vs. neu (Knoten+Mapping) je Kontrolle für einen Referenz-Tenant; jede Abweichung muss erklärt sein (i. d. R. ehrlichere "teilweise"-Werte). TF-IDF+Opus-Pipeline (bestehend, siehe Kontroll-Knoten-Modell) für Kandidaten nutzen, aber `relation`+`strength`+`rationale` verpflichtend kuratieren.
- **Akzeptanz:** Für ≥ die 5 Kern-Frameworks (ISO27001, BSI, NIS2, DORA, TISAX) `node_complete=true`; Diff-Report abgenommen; kein Framework verliert Coverage außer durch dokumentierte Deckelungen.
- **Risiko:** hoch (Compliance-Aussagen ändern sich sichtbar — bewusst und dokumentiert; NICHT auf "voll ja hochdrehen", vgl. Inheritance-Gate-Merke).

---

### P1 — wichtig

---

**ITEM 08 — PhaseStub + stale Kommentare entfernen**
- **Priorität:** P1 · **Aufwand:** S · **SELF-CONTAINED SICHER**
- **Dateien:** löschen `web/src/pages/PhaseStub.tsx`; `web/src/App.tsx` (Import Z. 37, Kommentar Z. 98); `web/src/config/phaseGroups.ts` (Kommentar Z. 2 "8-phase" → "7-phase").
- **Akzeptanz:** Build grün, alle 7 Routen rendern.

---

**ITEM 09 — `useFrameworkInheritance` verdrahten oder entfernen**
- **Priorität:** P1 · **Aufwand:** M · **teils riskant** (Assessment-Pfad)
- **Dateien:** `web/src/hooks/useFrameworkInheritance.ts`; `web/src/pages/Assessment.tsx`; `web/src/hooks/useComplianceOverview.ts`.
- **Was:** Entscheidung laut ARCHITECTURE §4.1: Modus `off` ⇒ `projectAnswer` bekommt leere Anker-Map (nur explizite Antworten zählen); `applied` (Default) ⇒ heutiges Verhalten; `preview` entfernen. Hook-Kommentar korrigieren ("worst wins" → LWW + Deckel-Regel). Falls Produktentscheid "Schalter weg": Hook + Settings-UI löschen.
- **Akzeptanz:** off ⇒ Compliance-% je Framework zählt nur explizite Antworten (Test mit 1 ISO-Antwort: BSI bleibt 0 %); applied ⇒ unverändert.

---

**ITEM 10 — Gap-Pipeline konsolidieren (gapEngine v2, katalog-agnostisch)**
- **Priorität:** P1 · **Aufwand:** M · **GROSS** (zwei Aufruferpfade)
- **Dateien:** `web/src/lib/gapEngine.ts` (v2: `buildFindingsAndGaps` aus `web/src/hooks/useRiskAnalysis.ts:77-187` hierher verschieben, exportieren); `useRiskAnalysis.ts` (importiert v2); Aufrufer des alten `runGapAnalysis` migrieren (Grep `runGapAnalysis` → Gap-/Assessment-Seiten, Reports `gapReport*`); NIS2-Prosa über `frameworkFlags.neutralizeNis2Text` neutralisieren, byAssetClass/byAssetSubClass-Aggregation in v2 übernehmen.
- **Akzeptanz:** Ein einziger Gap-Builder; Gap-Report und Risiko-Seite zeigen identische Gap-Zahlen; Nicht-NIS2-Tenant sieht keine NIS2-Bußgeld-Texte.

---

**ITEM 11 — Maturity-Overlay: reifegrad-SSOT + Ziel-Reifegrade**
- **Priorität:** P1 · **Aufwand:** M · **teils riskant** (Maturity-Ansichten)
- **Dateien:** neu `db/migrations/2026xxxx_maturity_targets.sql` (`maturity_targets(tenant_id, framework, family_id NULL, target smallint CHECK 0-5)`, tenant-RLS); `web/src/lib/maturityEngine.ts` (Input um effektive Antworten inkl. reifegrad + targets erweitern; bei `frameworks.uses_maturity=true` echten Reifegrad mitteln, sonst Pseudo-Score mit Flag `derived:true`); Maturity-/Dashboard-Ansichten (Badge "abgeleitet" vs. "erfasst", Gap-Spalte target−ist).
- **Akzeptanz:** TISAX-Framework mit erfassten Reifegraden zeigt Mittelwert der `answers.reifegrad` (nicht ja=5-Punkte); Default-Target TISAX=3 wird als Gap ausgewiesen; Frameworks ohne Erfassung unverändert (mit "abgeleitet"-Badge).

---

**ITEM 12 — Report-Generatoren konsolidieren (Legacy direct-draw raus)**
- **Priorität:** P1 · **Aufwand:** M · **SELF-CONTAINED SICHER** (nach Parity-Check)
- **Dateien:** löschen nach Verifikation: `web/src/lib/riskReportPdf.ts`, `riskReportWord.ts`, `gapReportGenerator.ts`, `gapReportWord.ts`, `gapReportExcel.ts`; Aufrufer auf `riskReport.ts`/`riskReportDocx.ts`/`riskReportXlsx.ts` bzw. `gapReport.ts`/`gapReportDocx.ts`/`gapReportXlsx.ts` umstellen (Grep je Legacy-Datei).
- **Akzeptanz:** Jeder Export-Button erzeugt weiterhin PDF/Word/XLSX; Sichtprüfung je Report (Cover, KPI-Grid, Seitenumbrüche, Branding); Build grün, Bundle kleiner.

---

**ITEM 13 — KPI-Snapshots persistieren (`kpi_snapshots` + Auto-Snapshot)**
- **Priorität:** P1 · **Aufwand:** M · **SELF-CONTAINED SICHER**
- **Dateien:** neu `db/migrations/2026xxxx_kpi_snapshots.sql` (`kpi_snapshots(id, tenant_id, taken_at, metrics jsonb, has_data jsonb)`, tenant-RLS); `web/src/lib/kpiEngine.ts` (`createKPISnapshot` → DB-Write; `previousSnapshots` aus DB); Dashboard-Lader; `api/src/jobs/scheduler.js` (wöchentlicher Auto-Snapshot je Tenant, `asService` — nutzt serverseitige Aggregation ODER pragmatisch: Snapshot beim Dashboard-Load max. 1×/Woche client-getriggert, wenn Cron-Aggregation zu aufwendig).
- **Akzeptanz:** Snapshots überleben Browser-/Gerätewechsel; Trend-Chart zeigt DB-Historie; RLS-Test grün.

---

**ITEM 14 — Treatments/SoA/Risk-Config org-scoped persistieren**
- **Priorität:** P1 · **Aufwand:** L · **GROSS/RISKANT** (Datenmigration + RLS)
- **Dateien:** neu `db/migrations/2026xxxx_org_tool_state.sql` (`org_tool_data(tenant_id, tool_key, data jsonb, updated_at, updated_by, UNIQUE(tenant_id, tool_key))`, RLS wie `answers`); `web/src/hooks/useToolData.ts` (Option `scope: "user"|"org"`); Umstellen der Pipeline-Keys auf org: Treatment-State, SoA-Overrides, Risk-Matrix-Config, Bundle-Owners; einmalige Client-Migration (beim ersten Laden: user-Blob vorhanden + org leer → kopieren, user-Blob als `_migrated` markieren).
- **Was NICHT:** persönliche Einstellungen (Akzentfarbe, lastRoute) bleiben user-scoped.
- **Akzeptanz:** Zwei Nutzer derselben Org sehen dieselben Treatments/SoA-Entscheidungen; Fremd-Org sieht nichts (RLS-Test); bestehende Einzel-Nutzer verlieren keine Daten.
- **Risiko:** hoch — Feature-Flag + Migrationspfad testen; Tool für Tool ausrollen.

---

**ITEM 15 — SoA-Projektion von NIS2-Katalog entkoppeln**
- **Priorität:** P1 · **Aufwand:** M · **teils riskant**
- **Dateien:** `web/src/lib/soaProjection.ts` (Imports `ComplianceStatus, ControlQuestion, NIS2Category` aus `@/data/nis2Controls` → eigene generische Typen `SoAStatus = "ja"|"teilweise"|"nein"|null`, `CatalogControlLite`, `CatalogCategoryLite`); Aufrufer (Roadmap-/SoA-Seite, maturityEngine, kpiEngine) auf neue Typen.
- **Akzeptanz:** Typ-Layer ohne `nis2Controls`-Import; SoA-Seite und Exporte unverändert für Bestand; Nicht-NIS2-Only-Tenant (z. B. nur ISO+BSI) erzeugt vollständige SoA.

---

**ITEM 16 — Inherent/Residual-Risiko + Akzeptanz-Gate**
- **Priorität:** P1 · **Aufwand:** M · **teils riskant**
- **Dateien:** `web/src/lib/riskEngine.ts` (RiskObject += `residual_score`, `residual_level`; Berechnung: done-Treatments mit Strategie mitigate reduzieren Likelihood um 1 Stufe je vollständig umgesetztem Kontroll-Set — einfacher, dokumentierter Default, konfigurierbar); `web/src/lib/treatmentEngine.ts` (accept-Gate: `risk_level` über `risk_config.acceptance_max_level` ⇒ Pflichtfeld justification+owner, UI-Warnung); neu Teil von `risk_config` in `org_tool_data` (bzw. eigene Tabelle mit ITEM 14); Risiko-Seite + `riskReport*` (Spalten inherent/residual).
- **Akzeptanz:** Risiko mit abgeschlossener Mitigation zeigt residual < inherent; accept eines "critical"-Risikos ohne Begründung ist blockiert; Reports zeigen beide Werte.

---

**ITEM 17 — Management-Review-Modul (Schritt 7)**
- **Priorität:** P1 · **Aufwand:** M · **SELF-CONTAINED** (additiv)
- **Dateien:** neu `web/src/components/ManagementReview.tsx` (Tab in `web/src/pages/AuditWorkbench.tsx` bzw. Audit-Seite); nutzt kpi_snapshots (ITEM 13), audit_findings, RiskAnalysisResult, Incident-Statistik; Abschluss erzeugt `evidence` (kind='attestation', ITEM 04) + Deadline recurrence '1 year' (ITEM 05); Protokoll-Export über `reportKit`.
- **Was:** Geführtes Formular nach ISO 9.3: Auto-befüllte Inputs (Read-only-Sektionen) + manuelle Felder (Entscheidungen, Ressourcen, Chancen) + Teilnehmer + Datum.
- **Akzeptanz:** Review durchführen ⇒ PDF-Protokoll + Evidence-Eintrag + Folge-Deadline in 1 Jahr; NIS2-§38-Nachweisfeld (Leitungs-Kenntnisnahme) enthalten.

---

**ITEM 18 — bundleEngine auf Knoten-Referenz umstellen**
- **Priorität:** P1 · **Aufwand:** S/M · **teils riskant** (Bündel-Zuordnung ändert sich für geknotete Kontrollen)
- **Dateien:** `web/src/lib/bundleEngine.ts` (`getIsoRefForControl` → intern zuerst node_id des Kontroll-Knotens, Fallback ISO-Ref; Signatur/Export-Namen beibehalten); Konsumenten (implementationEngine, Roadmap) unverändert.
- **Akzeptanz:** Kontrollen desselben Knotens landen im selben Bündel, auch ohne control_iso-Zeile; Snapshot-Vergleich der Bündelanzahl vor/nach dokumentiert.

---

### P2 — nice to have

---

**ITEM 19 — `/realtime`-SSE-Stub entfernen**
- **Priorität:** P2 · **Aufwand:** S · **SELF-CONTAINED SICHER**
- **Dateien:** `api/src/index.js` (Mount + Handler Z. 8, 37-45); Client-Referenzen greppen (vermutlich keine — Polling ist das Muster).
- **Akzeptanz:** API startet ohne Route; kein Client-Fehler; README/Doku-Notiz "Realtime = Polling by design".

---

**ITEM 20 — Legacy-Answer-Tabellen archivieren**
- **Priorität:** P2 · **Aufwand:** M
- **Dateien:** neu `db/migrations/2026xxxx_drop_legacy_answers.sql`; vorher Grep in `web/src` + `api/src` auf `assessment_answers|org_assessment_answers|class_assessment_answers`.
- **Was:** Wenn 0 Code-Referenzen: RENAME nach `_archive_*` (eine Release-Runde), dann DROP. Bei Referenzen: erst Code migrieren.
- **Akzeptanz:** App vollumfänglich funktional; Schema ohne die drei Tabellen.

---

**ITEM 21 — FAIR-light-Quantifizierung (optionales Overlay)**
- **Priorität:** P2 · **Aufwand:** L · **SELF-CONTAINED** (rein additiv)
- **Dateien:** neu `web/src/lib/riskQuantEngine.ts`; Risiko-Detail-Dialog (Eingabe LEF/LM als 3-Punkt-Schätzung min/likely/max in €); `riskReport*` (optionale €-Band-Spalte).
- **Was:** Monte-Carlo (10k Draws, PERT-Verteilung) im Client → jährliches Verlust-Band (P10/P50/P90). Nur für Risiken, bei denen der Nutzer Werte erfasst. Keine Pflichtfelder.
- **Akzeptanz:** Erfasste Schätzung ⇒ reproduzierbares Band (Seed-fixiert für Tests); ohne Erfassung keinerlei UI-/Report-Änderung.

---

**ITEM 22 — OSCAL-Export (Catalog + Mapping + Assessment Results)**
- **Priorität:** P2 · **Aufwand:** M · **SELF-CONTAINED**
- **Dateien:** neu `web/src/lib/oscalExport.ts`; Export-Button in Settings/Assessment.
- **Was:** JSON-Serialisierung: `controls` → OSCAL Catalog (je Framework), `control_node`+`control_mapping` → Control Mapping Model (relation → `equivalent-to`/`subset-of`/`intersects-with`), effektive Antworten → Assessment Results (Findings für nein/teilweise). Kein Import.
- **Akzeptanz:** Export validiert gegen OSCAL-1.2-JSON-Schema (Mapping-Model) für einen Demo-Tenant.

---

**ITEM 23 — Evidence-Freshness- & Fristen-KPIs**
- **Priorität:** P2 · **Aufwand:** S/M · **SELF-CONTAINED** (nach ITEM 04+05)
- **Dateien:** `web/src/lib/kpiEngine.ts` (+2 Tracking-KPIs: `evidence_freshness_pct`, `deadline_adherence_pct`; Tier B, anchor "Vendor default — configurable"); Dashboard.
- **Akzeptanz:** KPIs zeigen `no_data` ohne Evidence/Deadlines; korrekte % mit Testdaten.

---

**ITEM 24 — Continuous-Compliance-Tests (Konnektor → Control-Test)**
- **Priorität:** P2 · **Aufwand:** L · **GROSS**
- **Dateien:** neu `db/migrations` (`control_tests`, `control_test_results(status pass|fail, evidence_id, checked_at)`); `api/src/functions/sync-intune.js`/`sync-servicenow.js` erweitern (Ergebnisse als test_results + Auto-Evidence); Assessment-UI (Test-Badge am Kontroll-Status).
- **Was:** Erste 3–5 Tests aus bestehenden Intune/ServiceNow-Syncs ableiten (z. B. MFA-Quote, Patch-Compliance) — Drift = Statuswechsel pass→fail erzeugt Deadline (kind='custom') + Alert.
- **Akzeptanz:** Ein Sync-Lauf erzeugt test_results; fail zeigt sich am Kontroll-Status als "Test fehlgeschlagen"-Badge; kein Einfluss auf manuelle Antworten (additiv).

---

## 3. Empfohlene Umsetzungsreihenfolge (Wellen)

| Welle | Items | Charakter |
|---|---|---|
| 1 (sofort, risikofrei) | 01, 02, 06, 08 | reine Fundament-/Aufräumarbeit, keine Verhaltensänderung |
| 2 (Kern) | 03 (mit Golden-Test), 04, 05 | die drei Architektur-Träger: ehrliche Projektion, Evidence, Fristen |
| 3 (Daten) | 07 (framework-weise), 13, 12 | Knoten-Abschluss + Persistenz-/Report-Hygiene |
| 4 (Konsolidierung) | 09, 10, 11, 15, 18 | Engine-Vereinheitlichung |
| 5 (Team/Governance) | 14, 16, 17 | org-scoped, Residual-Risk, Management-Review |
| 6 (Ausbau) | 19–24 | P2 nach Bedarf |

**Zählung:** 24 Items — **P0: 7** (01–07) · **P1: 11** (08–18) · **P2: 6** (19–24).
