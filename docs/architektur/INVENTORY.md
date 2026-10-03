# CyberWerkSuite (CWS) — Architektur-Inventar

**Repo-Root:** `/Users/sekercakil/Downloads/ClaudeCWS`
**Stack:** React 18 + Vite + TypeScript (Frontend `web/`), Node/Express API (`api/`), Plain PostgreSQL (`db/`), Docker/Caddy Deployment.
**Charakter:** Selbst-gehostete ISMS/GRC-Compliance-Plattform (Supabase-freie Neuimplementierung von UniqSuite — düz Postgres + PostgREST-/GoTrue-Muadili).
**Erhebungsdatum:** 2026-07-17

---

## 0. Verzeichnisüberblick

| Bereich | Pfad | Umfang |
|---|---|---|
| Seiten (Routes) | `web/src/pages/*.tsx` | 28 Dateien |
| Engines / Libs | `web/src/lib/*.ts` | 87 Dateien |
| Hooks | `web/src/hooks/*.ts(x)` | 12 Dateien |
| Contexts | `web/src/contexts/` | Auth, Language, Framework |
| API-Server | `api/src/` | index.js, db.js, storage.js, auth/, gateway/, functions/, lib/ |
| DB-Schema | `db/schema.sql` | 55.278 Zeilen (konsolidiert) |
| DB-Seeds | `db/seeds/*.sql` | catalog(3.318), iso(7.683), overrides(10.550), risks(27.557) |
| DB-Migrationen | `db/migrations/*.sql` | ~60 Migrationen |

---

## 1. End-to-End-Workflow / Hauptschritte

Routing definiert in `web/src/App.tsx`. Alle Pipeline-Routen liegen unter dem geschützten `PipelineLayout` (`ProtectedRoute` + `AppLayout`). Der Redirect `/` → `/dashboard`.

Die **verbindliche Schrittdefinition** steht in `web/src/config/phaseGroups.ts` als `PHASE_GROUPS_V2`. Der Kommentar sagt „8-phase pipeline", das Array enthält aber **7 Schritte** — abgebildet auf den PDCA-Zyklus (Plan → Do → Check/Act):

| # | ID | Route | DE | EN | PDCA | Engine(s) |
|---|---|---|---|---|---|---|
| 1 | scope | `/context` | Scope & Kontext | Scope & Context | **P**lan | `controlScope`, `scopeReport` |
| 2 | inventory | `/inventory` | Inventar | Inventory | **P**lan | `criticalityEngine`, `inventoryReport` |
| 3 | assessment | `/assessment` | Gap-Analyse | Gap Analysis | **P**lan | `assessmentEngine`, `gapEngine`, `maturityEngine` |
| 4 | decision | `/decision` | Risikoanalyse | Risk Analysis | **P**lan | `riskEngine`, `treatmentEngine`, `riskReport*` |
| 5 | roadmap | `/roadmap` | SoA & Roadmap | SoA & Roadmap | **D**o | `soaProjection`, `soaGenerator`, `roadmapEngine`, `bundleEngine` |
| 6 | implementation | `/implementation` | Umsetzung | Implementation | **D**o | `implementationEngine`, `executionReportGenerator` |
| 7 | audit | `/audit` | Audit & KVP | Audit & CI | **C**heck+**A**ct | `assessmentEngine`, `auditReportGenerator`, `kvpReportGenerator` |

> **Ja — es gibt einen definierten Kern-Ablauf** (die V2-Pipeline, PDCA-getaktet). Die Route-IDs (`/context`, `/decision`) weichen von den Anzeigenamen ab. Der alte 18-Step-Ablauf (`PIPELINE_STEPS` mit `/services`, `/assets`, `/baseline`…) wurde laut Kommentar in `phaseGroups.ts` entfernt.

**Standalone-Werkzeuge** (`STANDALONE_TOOLS`, NICHT nummeriert, separat in der Sidebar): Dashboard, Policies, Trainings, Incidents, Documents, Procurement, Suppliers, TPRM, Datenschutz-Cockpit, BCM, KI-Governance. Dazu Nicht-Pipeline-Routen: `/dashboard`, `/settings`, `/settings/integrations`, `/admin`, `/auth`, `/reset-password`, `/datenschutz`, `/impressum`, `/cookie-einstellungen`.

**Provider-Kette** (`App.tsx`): `ErrorBoundary → QueryClientProvider → LanguageProvider → FrameworkProvider → AuthProvider → TooltipProvider → BrowserRouter`. Alle Seiten sind `lazy()`-geladen.

> **Stale-Cruft-Befund:** `App.tsx:98` trägt noch den Kommentar „others are stubs until rebuilt" und importiert `PhaseStub` (Zeile 37) — dieser Import ist **totes Code**, keine Pipeline-Route rendert ihn mehr. Alle 7 Phasen sind reale, voll gebaute Seiten.

---

## 2. Engines (`web/src/lib/`, 87 Dateien)

### 2.1 Assessment / Mapping / Cross-Framework-Kern

- **`assessmentEngine.ts`** — Herzstück der Cross-Framework-Vererbung (Phase 3). Reine Helfer.
  - Exports: `projectAnswer()`, `buildAnchorAnswerMap()`, `worstStatus()`, `computeStats()`, `familyOf()`, `subFamilyOf()`, Typen `AnswerStatus` (`ja|teilweise|nein|na`), `Reifegrad` (0–5), `EffectiveAnswer`, `REIFEGRAD_LABELS`.
  - Logik: **Last-Write-Wins (LWW)** über Kontroll-Anker. `projectAnswer` nimmt die zeitlich neueste Antwort (`updated_at`) auf einer eigenen Kontrolle ODER auf einer per Anker verbundenen Schwester-Kontrolle (auch aus nicht ausgewählten Frameworks). Kein worst-wins, keine ISO-Autorität mehr.
  - **Intra-Framework-Geschwister-Schutz** (Zeile 104-109): Ein Anker-Status aus DEMSELBEN Framework, aber ANDERER Kontrolle, fließt NICHT ein (verhindert dass eine BSI-Anforderung ihre Baustein-Geschwister automatisch mit-ausfüllt). Framework-ÜBERGREIFENDE Vererbung bleibt intakt.
  - Anker-Quelle: `control_node_member` (neue same-as-Autorität), Fallback `control_iso` (ISO-Kontrolle = eigener Anker).
- **`mappingEngine.ts`** — In-Memory-Katalog-/Mapping-Index (framework-lokal, nicht DB). Exports: `getCatalog`, `listFrameworks`, `getControl`, `mappingsFor`, `reverseMappings`, eigener `projectAnswer`/`projectFramework`, `writeAnswer`, `setOverride`/`clearOverride`, `emptyStore`. Modell: ISO-Hub + Overrides (`AnswerStore`).
- **`gapEngine.ts`** — Gap-Analyse (Phase 3). Export `runGapAnalysis(GapAnalysisInput): GapAnalysisResult`. Typen: `Finding` (weak/missing), `ConsolidatedGap`, `Severity` (critical/high/medium/low), `GapSummary`. Helfer für Asset-Klassen-Labels, `severityColor/Label`, `getCapabilityLabel`. Hängt an `capabilityMap`.
- **`maturityEngine.ts`** — Reifegrad-Auswertung über SoA-Projektion. Exports: `computeDomainMaturity`, `computeNis2Maturity`, `computeNis2ArticleMaturity`, `enrichWithExecution`, `computeExecutionStats`, `generateExecutionInsights`. Konsumiert `SoAProjection`.
- **`criticalityEngine.ts`** — Kritikalitäts-Score (Phase 2). Export `calculateCriticality()`, `DEFAULT_WEIGHTS`, `DEFAULT_THRESHOLDS`, `getFactorLabel`, `classificationColor/BadgeColor`. Gewichtete Formel über `CriticalityInputs`.
- **`implementationEngine.ts`** — Umsetzungs-Sicht (Phase 6). Export `buildUmsetzungView()`. Aggregiert geteilte Tasks (`SharedTask`) + Delta-Tasks (`DeltaTask`) über Bundles.
- **`roadmapEngine.ts`** — Roadmap-Phasen. Export `computePhase()` (now/next/later aus Risiko + Deadline), `toRoadmapRow`, `daysUntil`, `PHASE_LABEL`, `PHASE_ORDER`.
- **`riskEngine.ts`** — Risikomatrix-Generator (Phase 4). Export `generateRisks(RiskEngineInput): RiskAnalysisResult`, `buildScaleForSize`, `getDefaultThresholds`, `getMaxScore`, `COLOR_PALETTES`, `DEFAULT_RISK_CONFIG`, `riskLevelColor/Label/BgClass`. Konfigurierbare Matrix (multiply/sum/max, n×m).
- **`treatmentEngine.ts`** — Risikobehandlung. Export `generateTreatmentPlan()`, `getTreatmentPriority` (P1/P2/P3), Strategien (`mitigate|accept|transfer|avoid`), Status (`planned|in_progress|done`), `makeControlSelectionId`/`parseControlSelectionId`, `STRATEGY_OPTIONS`, `STATUS_OPTIONS`.
- **`treatmentQuickWins.ts`** — abgeleitete Quick-Win-Vorschläge (ergänzt treatmentEngine).
- **`kpiEngine.ts`** — KPI-Berechnung (Dashboard). Export `computeKPIs(KPIEngineInput): KPIResult`, `createKPISnapshot`, `evaluateKpiAlerts`, `formatKpiValueTarget`, plus umfangreiche Kataloge (`KPI_CATEGORIES`, `KPI_TIERS` A–D, `KPI_DEFAULT_TARGETS`, `KPI_DIRECTIONS`, `KPI_UNITS`, `KPI_LABELS`). Zwei Layer: `board` / `tracking`.
- **`bundleEngine.ts`** — Bündelung von Kontrollen nach ISO-Referenz. Export `getIsoRefForControl`, `getIsoRefForRisk`, `getBundleMeta`, `groupByBundle`, `sortBundleKeys`, `STANDALONE_BUNDLE_KEY`.
- **SoA-Trio:**
  - **`soaProjection.ts`** — Statement-of-Applicability-Projektion. Export `buildSoAProjection(SoAProjectionInput): SoAProjection`, `validateSoAStats`, `logSoADebug`. Typen: `SoAProjectedControl`, `SoAStats`, `TreatmentState`, `SoASource` (system/manual_catalog/custom).
  - **`soaGenerator.ts`** — SoA-Export. Export `generateSoAPDF`, `generateSoAWord`.
  - **`soaRiskLinkage.ts`** — Verknüpft Kontrollen ↔ Risiken. Export `buildRiskLinkageMap`, `riskLevelBadgeColor`.
- **`controlScope.ts`** — Scope-Klassifikation je Kontrolle. Export `inferControlScope` (org/asset/mixed), `scopeLabel`, `scopeTooltip`.
- **`capabilityMap.ts`** — Kontrolle → Capability-Tag. Export `capabilityFor`, `humanCap`, Typ `CapabilityTag`.
- **`frameworkBus.ts`** — Event-Bus. Export `emitFrameworksUpdated`, `onFrameworksUpdated` (Cross-Komponenten-Refresh bei Framework-Wechsel).
- **`frameworkFlags.ts`** — Aktive-Framework-Flags. Export `getActiveFrameworkKeys`, `isFrameworkActive`, `isNis2Active`, `neutralizeNis2Text`.
- **`zokResolver.ts`** — Brücke Asset-ZOK-IDs → konkrete Maßnahmen + Risiken (BSI-Grundschutz++-Hierarchie mit Vererbung, `__isms__`-Bucket für org-weite Gaps). Nutzt `zokCatalog`, `controlCatalog`, `controlMetadata`.
- Weitere Kern-Libs: `bsigReconciliation.ts`, `nationalLawRegistry.ts`, `frameworkArticleMap.ts`, `sensitivityLevels.ts`, `tierConfig.ts`, `domainLabels.ts`, `fieldMapping.ts`, `manualRisks.ts`, `companyTemplates.ts`, `complianceStorage.ts`, `notificationSettings.ts`, `tenantWipe.ts`, `personnel.ts`.

### 2.2 Incident-Engines

- **`incidentTriggerEngine.ts`** — Meldepflicht-Ableitung + Fristen-Timer. Export `resolveMeldepflichten()` (leitet Meldepflichten der aktiven Frameworks aus Assessment ab), `fristStatus()` (Ampel), `ablaufendeFristen()`, `giltAlsJa`. Typen: `VorfallAssessment`, `FristAmpel` (gruen/gelb/orange/rot/kein_timer/unverzueglich), `Meldepflichtaufloesung`. **Wird geteilt** von IncidentManagement, DatenschutzCockpit und BusinessContinuity (Fristen-Timer).
- **`incidentReportGenerator.ts`** — Export `generateIncidentPdf/Word`, `generateRegisterPdf/Word`. PDF (jsPDF) + DOCX (docx).

### 2.3 Report-Generatoren (Gruppen)

Zwei Generationen koexistieren durchgehend: neuere **HTML→PDF/Word**-Route (über `reportHtmlLayout.renderHtmlToPdf/renderHtmlToWord`, html2canvas/jsPDF) und ältere **direct-draw** (jsPDF/jspdf-autotable). Ausgabe-Bibliotheken: **jsPDF** (PDF), **docx** (Word), **exceljs** (XLSX), **file-saver** (Download).

- **Risk:** `riskReport.ts` (HTML→PDF), `riskReportDocx.ts`, `riskReportXlsx.ts`, `riskReportPdf.ts` (legacy), `riskReportWord.ts` (legacy), `riskReportNarrative.ts` (Prosa-/Insight-Engine, ~40 Exports: `buildExecutiveNarrative`, `buildTop5ManagementActions`, `consolidateRisks`, `NIS2_ARTICLES_BY_CAP`, `REGULATION_MAPPING_BY_CAP`, …).
- **Gap:** `gapReport.ts` (HTML→PDF, `buildCriticalityContext`), `gapReportDocx.ts`, `gapReportXlsx.ts`, `gapReportGenerator.ts` (legacy PDF), `gapReportWord.ts` (legacy), `gapReportExcel.ts` (legacy).
- **Policy:** `policyReportGenerator.ts` (PDF+Word), `policyReportXlsx.ts`, `policyOverviewReport.ts`, `policyClauseExporter.ts` (DOCX), `policyClauseExporterPdf.ts`.
- **Training:** `trainingReport.ts`, `trainingPlanReport.ts`, `trainingCertificate.ts` (Zertifikat-PDF).
- **Audit / Execution / Maturity / KPI / KVP / Baseline / Roadmap:** `auditReportGenerator.ts`, `executionReportGenerator.ts`, `executionInsightsReportGenerator.ts`, `maturityReportGenerator.ts`, `kpiReportGenerator.ts`, `kvpReportGenerator.ts`, `baselineReportGenerator.ts`, `roadmapReportGenerator.ts`, `reportGenerator.ts` (generischer NIS2 Executive/Detailed).
- **Inventory/Asset/Scope/Personnel/Services:** `inventoryReport.ts` (PDF+DOCX+XLSX), `assetsReport.ts`, `servicesReport.ts`, `scopeReport.ts` (PDF+DOCX+XLSX), `personnelReport.ts`.

### 2.4 Report-Infrastruktur / Branding

- **`reportHtmlLayout.ts`** — zentrale HTML-Ebene + `renderHtmlToPdf`/`renderHtmlToWord` (gemeinsamer Unterbau vieler Exporte), `buildCoverHtml`, `buildKpiGrid`, `wrapHtmlDoc`.
- **`reportPdfLayout.ts`** — direktes jsPDF-Zeichen-Toolkit (`createPdfContext`, `drawCoverPage`, `drawKpiCard`, `drawSeverityBadge`, `applyPageNumbers`).
- **`reportKit.ts`** — HTML-Kit + einheitlicher `rkExport(mode: "pdf"|"word")`.
- **`reportPaginate.ts`** (`addCanvasPaged`), **`reportTheme.ts`** (Design-Tokens, `severityStyle`), **`reportLogo.ts`** (`drawBrandLogo`), **`reportBrand.ts`** (Marken-Name/`BRAND_PLACEHOLDER`), **`companyBrand.ts`** (Marke+Logo, Cloud-Sync `hydrateCompanyBrandFromCloud`, `uploadCompanyLogo`), **`accentTheme.ts`** (UI-Akzentfarbe, `applyAccent`, Presets), **`narrativeBuilders.ts`** (generische Gap-Narrative, distinct von riskReportNarrative), **`pdfProgress.ts`** (Fortschritts-Store `withPdfProgress`).

### 2.5 Daten/CSV

`csv.ts`, `assetCsv.ts`, `dependencyCsv.ts`, `personnelCsv.ts` — Import/Export-Parser. `utils.ts` (shadcn `cn`), `lastRoute.ts`, `auditTypes.ts`.

---

## 3. Hooks (`web/src/hooks/`, 12 Dateien)

| Hook | Liefert | Zweck |
|---|---|---|
| **`useAssessment(frameworks)`** | `{ controls, answers, isoMappings, nodeMembers, loading, saveAnswer, ... }` + `answerKey()` | Lädt Kontroll-Katalog + `control_iso` + `control_node_member` + Tenant-`answers` (paginiert, 1000er-Seiten); optimistisches debounced Upsert (700 ms) in `public.answers`. Immer inkl. ISO27001-Hub. |
| **`useComplianceOverview()`** | `{ ... }` (return @ Zeile 93), Typ `FrameworkOverview` | Compliance-Deckungsgrad je Framework; Knoten-zuerst-Anker (`control_node_member`), Fallback ISO-Selbstanker. |
| **`useFrameworkInheritance()`** | `{ mode, ... }`, Typ `FrameworkInheritanceState`, `InheritanceMode` (off/preview/applied) | Steuert Vererbungsmodus zwischen Frameworks. |
| **`useRiskAnalysis(config)`** | `{ findings, gaps, ... }`, `UseRiskAnalysisState` | Baut Risiken aus Gap-Findings + `control_iso`/`control_node_member`-Anker; nutzt riskEngine. |
| **`useImplementationStatus()`** | `{ rows, loading, update, getStatus, summary }`, `ImplStatus` (offen/laufend/fertig/blockiert) | Umsetzungsstatus je Kontrolle (Phase 6). |
| **`useRoadmapItems()`** | `{ items, loading, error, upsert, reload }` | CRUD auf `roadmap_items`. |
| **`useToolData<T>(toolKey, lsKey, default)`** | `{ data, setData, loading, lastSaved, saveToCloud, resetData, resetAndDeleteCloud }` | **Generischer Persistenz-Hook** für die Standalone-Werkzeuge; localStorage + Cloud-Sync über `user_tool_data` (user-scoped). |
| **`useFrameworkCatalog(key)`** | `{ categories, loading, error }` | Kontroll-Katalog eines Frameworks kategorisiert. |
| **`useBundleOwners()`** | `{ data, getOwner, getDueDate, setOwner, setDueDate, resolveOwner }`, `BundleOwnerEntry` | Verantwortliche + Fälligkeiten je Bündel. |
| **`useTrainingParticipants()`** | `{ completions, quizResults, loading, refresh, addCompletion, deleteCompletion, addQuizResult }`, `RoleTrack` (all/management/it/procurement/developer/ot) | Schulungsabschlüsse + Quiz-Ergebnisse. |
| `use-mobile.tsx` | `isMobile` boolean | Breakpoint-Detektor. |
| `use-toast.ts` | Toast-Reducer/API | shadcn Toast. |

---

## 4. Werkzeuge / Tools (Standalone-Seiten)

Alle folgenden Seiten sind laut Analyse **voll implementiert** (echte Register-CRUD, Ableitungs-Engines, Fristen-Timer, Persistenz). Persistenz überwiegend via `useToolData(toolKey)`; drei Seiten (Inventory, Policies, AuditWorkbench) sprechen zusätzlich/ausschließlich Supabase-Tabellen direkt an.

| Tool (Datei) | Zweck | Reifegrad | Persistenz / Engine |
|---|---|---|---|
| **ProcurementCheck** | Vorab-App-Freigabe (IT-Sec + DSGVO), adaptiver Fragebogen → Ampel-Empfehlung (approve/conditional/reject) | **VOLL** | `useToolData("procurement-check")`, interne `autoVerdict`-Logik |
| **SupplierCheck** | Lieferanten-InfoSec-Bewertung (ISO A.5.19–23, NIS2 Art. 21, BSI), Auto-Risiko-Score + Review-Zyklus | **VOLL** | `useToolData("supplier-check")`, `riskOf`/`nextReview` |
| **IncidentManagement** | Vorfall-Register; leitet Meldepflichten aktiver Frameworks ab, startet Fristen-Countdowns (Ampel), dokumentiert nicht-ausgelöste Pflichten | **VOLL** | `useToolData("incident-register")`, `incidentTriggerEngine`, `incidentReportForms` |
| **KiGovernance** | EU-AI-Act-Register, Risikoklassifizierung (Annex III / Art. 5 / Art. 50), Pflichtdokument-Sets je Rolle/Klasse | **VOLL** | `useToolData("ki-governance")`, `klassifiziere`/`pflichtDocs` |
| **DatenschutzCockpit** | DSGVO-Cockpit: VVT/RoPA (Art. 30) mit Auto-Gap (DPIA/AVV/Transfer/Art. 26) + Betroffenenanfragen (1-Monats-Timer) | **VOLL** | `useToolData("datenschutz-cockpit")`, `incidentTriggerEngine.fristStatus` |
| **ThirdPartyRisk** | TPRM/Outsourcing, DORA-Informationsregister (D16) CSV-Export, Exit-Strategien, D46-Klauseln, Konzentrationsrisiko | **VOLL** | `useToolData("tprm")`, Blob-CSV-Export |
| **BusinessContinuity** | BCM: BIA je Prozess (RTO/RPO), Recovery/Exercise/Restore-Gaps, KRITIS-DachG-Kette (D80→D81→D82) mit Timern | **VOLL** | `useToolData("bcm")`, `incidentTriggerEngine.fristStatus` |
| **DocumentLifecycle** | Dokumenten-Lebenszyklus (einmalig/lebend/periodisch), Auto-Fälligkeit, 142-Doc × 17-Framework-Matrix | **VOLL** | `useToolData("document-lifecycle")`, `documentCatalog`, `documentFrameworkMatrix` |
| **AuditWorkbench** | Phase-07-Auditor-Workbench: Gap-Ergebnisse je Framework, Major/Minor-Vorschlag, Risiko-Link, Maßnahmen/Evidenz → Phase 06, CSV + HTML/PDF | **VOLL** (komplexeste Seite) | Supabase direkt (`company_profiles`, `risks`, `control_risk`) + `useToolData` (3 Keys) + `assessmentEngine.projectAnswer`/`buildAnchorAnswerMap` + `frameworkBus` |
| **Policies** | Policy-Authoring: Template-/Klausel-Bibliothek nach aktiven Frameworks, Status-Tracking + Charts, Word/PDF/Excel-Export, Studenten-Quota | **VOLL** (~1330 Zeilen) | `useToolData("policies")` + Supabase (`student_policy_downloads`, RPC `get_user_org_id`) |
| **Trainings** | Schulungs-Seite (Katalog/Fortschritt/Teilnehmer/Quiz/Zertifikate) | **VOLL** (dünner Wrapper) | delegiert an `@/components/TrainingTab` |
| **Inventory** | Phase-2-Inventar: Services/Assets/Dependencies, Kritikalität, CSV/REST/Connector-Import, Abhängigkeitsgraph, Export | **VOLL** | Supabase direkt (`services`, `assets`, `dependencies`, `company_profiles`), `criticalityEngine`, `inventoryReport` |
| **PhaseStub** | Generischer Platzhalter „wird auf hub-and-spoke neu gebaut" | **STUB** (totes Code — nirgends geroutet) | `PHASE_GROUPS_V2`-Titel-Lookup |

Weitere Pipeline-Seiten (nicht in der Tool-Liste, aber voll): **Scope** (`/context`), **Assessment**, **Risk** (`/decision`), **Implementation**, **Roadmap**, **Dashboard**. Admin-Seiten: **AdminPanel**, **Settings**, **Integrations**, **Auth**, **ResetPassword**.

---

## 5. Datenmodell (`db/schema.sql`, seeds, migrations)

### 5.1 Frameworks & globaler Katalog (read-only, global; RLS = `USING (true)` für authenticated)

- **`frameworks`** (PK `code`): `role` CHECK (`hub|risk_anchor|spoke|benchmark|delta`), `uses_maturity`, `color`, `sort_order`. ISO27001 = hub.
- **`controls`** (Composite-PK `(framework, id)`): Union aller Framework-Kontrollen; `req_de/req_en`, `muss`, `meta jsonb`. FK → `frameworks`.
- **`iso_canonical`** (PK `id`, ~417): ISO-27001-Kanon-Hub (`clause_ref`, `thema`, `de/en`).
- **`risks`** (PK `risk_id`, ~661): `quelle`, `bsi_ref`, `iso_anchor text[]`, `stufe`, `typ`, `primary_control_(framework|id)`.

### 5.2 Junction-/Mapping-Tabellen (Cross-Framework)

- **`control_iso`** (~9.649): `(framework, control_id, iso_id)` → ISO-Kanon. **Legacy-Crosswalk / Übergangs-Anker.**
- **`control_risk`** (~24.819): Gap-Richtung Kontrolle → Risiko, `link_typ`.
- **`risk_control`** (~25.194): Risikoanalyse-Richtung Risiko → Kontrolle, `tier` CHECK (`direkt|framework|weitere`), `is_primary`.
- **`control_node`** (PK `node_id`) + **`control_node_member`** (`(framework, control_id)` PK, FK → `control_node` und `controls`): **Das neue framework-unabhängige Knoten-Modell** (same-as). Ein Knoten bündelt äquivalente Kontrollen mehrerer Frameworks. Angelegt in den Migrationen `20260702210905/210932/205212/235332/235405`. (In `schema.sql` als CREATE-IF-NOT-EXISTS am Ende, Zeile 55233-55234.)
- Staging + Reload: `_junction_stage_ci/_cr/_rc` + SECURITY-DEFINER-Funktion `admin_reload_junctions()` (TRUNCATE+Reinsert der drei Junctions, setzt `is_primary`).

### 5.3 Tenant-/org-scoped Daten

- **`answers`** (neue SSOT, PK uuid, `UNIQUE(tenant_id, framework, control_id)`): `antwort` CHECK (`ja|nein|teilweise|na`), `evidence`, `note`, `updated_at`, `updated_by`. **4 RLS-Policies** (select/insert/update/delete) mit `tenant_id = COALESCE(get_org_owner_id(auth.uid()), auth.uid())`. Trigger `answers_updated_at`.
  - (Ältere Answer-Tabellen existieren parallel: `assessment_answers`, `org_assessment_answers`, `class_assessment_answers` — Legacy/Kurs-Kontext.)
- **`company_profiles`** — Scope + `enabled_frameworks text[]` + `kritis_sub_sectors text[]`.
- Inventar: **`services`/`critical_services`**, **`assets`**, **`dependencies`**, `service_criticality_inputs/results`, `criticality_formula_config`, `criticality_overrides`.
- Pipeline-Ergebnisse: **`roadmap_items`**, **`implementation_status`**, **`audits`**, **`audit_findings`**, **`audit_checklist_items`**, **`improvement_items`** (KVP).
- Vorfälle: **`incidents`**, **`incident_checklist_items`**, `frist_notification_log`.
- Schulung: **`training_completions`**, **`training_quiz_results`**.
- Policy: **`policy_versions`**, **`policy_metadata`**, **`policy_acknowledgements`**, `student_policy_downloads`.
- Generisch: **`user_tool_data`** (`UNIQUE(user_id, tool_key)`, `data jsonb`) — Backing-Store aller `useToolData`-Werkzeuge, **user-scoped RLS** (`auth.uid() = user_id`).
- Multi-Tenant-Basis: **`organizations`** (`owner_id`), **`org_members`** (ENUM `org_role` = owner/admin/member), **`org_invitations`**, `profiles`, `user_roles` (ENUM `app_role`).

### 5.4 Wie die Cross-Framework-Vererbung funktioniert

1. **Katalog laden** (`useAssessment`): `controls` + `control_iso` + `control_node_member` + Tenant-`answers` (paginiert).
2. **Anker bestimmen** je `(framework, control_id)`: **Knoten-zuerst** — wenn die Kontrolle Mitglied eines `control_node` ist, sind alle Ko-Mitglieder ihre Anker; sonst **Legacy-Fallback** `control_iso` (ISO-Kontrolle = eigener Anker). (Übergangszustand bis alle Frameworks als Knoten gemappt sind.)
3. **`buildAnchorAnswerMap(answers, anchorsFor)`**: aggregiert je Anker die **zeitlich neueste** org-Ebene-Antwort (LWW über ALLE Frameworks, auch nicht ausgewählte).
4. **`projectAnswer(control, spokeAnswer, ankerMap, ankerBySpoke)`**: effektive Antwort = neueste aus {eigene direkte Antwort} ∪ {Anker-Antworten}, mit **Intra-Framework-Geschwister-Schutz** (gleiche Framework-fremde Kontrolle wird nicht eingespeist). Ergebnis-Origin: `explicit` / `inherited` / `empty`.

> Effekt: Beantwortet man eine Kontrolle in Framework A, erben alle Kontrollen in B/C/… die denselben Knoten (bzw. ISO-Anker) teilen, den Status — ohne worst-wins, ohne ISO-Sonderautorität.

---

## 6. Bekannte Schwachstellen / Stubs / TODOs

Der Scan (`web/src`, `api/src`) ergab **auffällig wenig Tech-Debt** — keine echten `TODO/FIXME/HACK/XXX`-Kommentare, keine Mock-Daten im Produktionscode, keine „coming soon"-Seiten in Live-Routen. Die relevanten Befunde:

1. **`api/src/index.js` — `/realtime` ist ein bewusster No-Op-SSE-Stub** (Zeile 8, 37-45). Öffnet Event-Stream, sendet `: connected` + 25-s-Pings, **pusht aber nie echte Daten**. → Serverseitiges Realtime/Push ist faktisch nicht implementiert (Client pollt stattdessen `user_tool_data`, z. B. Konflikt-Polling in AuditWorkbench).
2. **`web/src/pages/PhaseStub.tsx`** — einziger echter Stub, aber **totes Code**: in `App.tsx:37` importiert, nirgends geroutet. Sollte mitsamt dem stale-Kommentar `App.tsx:98` („others are stubs until rebuilt") entfernt werden.
3. **Kein** Engine/Lib-TODO. `notImplemented`/`not_implemented`-Treffer sind Status-Enum-Werte für Kontrollen, keine Code-Stubs. `throw new Error(...)` in `riskReportPdf.ts:302` ist Fehlerbehandlung, kein Marker.
4. **Kein** leerer `() => {}`-Handler, keine `501`-Responses, keine Placeholder-Buttons.
5. Der **Legacy-/Neu-Übergang** ist die substanziellste architektonische Baustelle: `control_iso` (Legacy) vs. `control_node`/`control_node_member` (neu) koexistieren; `assessmentEngine` fällt auf ISO zurück, solange nicht alle Frameworks als Knoten gemappt sind. Doppelte Report-Generatoren (HTML- vs. legacy-direct-draw) sind Aufräum-Kandidaten.

> Fazit: Die Anwendung ist **weitgehend fertig**; „Lücken" sind eher (a) serverseitiges Realtime, (b) Abschluss der Knoten-Migration, (c) Entfernen von Legacy-Cruft.

---

## 7. API-Layer (`api/src/`)

**Design:** Supabase-Muadili auf düz Postgres + Express (Kommentare türkisch/deutsch).

### 7.1 Entry & Routen (`index.js`)

- Express, CORS (`CORS_ORIGIN`), `express.raw` für `/storage` (12 MB), sonst JSON (4 MB), `authMiddleware` global.
- Mounts: `/auth` (GoTrue-Muadili), `/db` (PostgREST-Muadili Gateway), `/storage` (company-logos), `/functions` (Edge-Function-Muadili), `/realtime` (SSE-Stub), `/health`.

### 7.2 Auth (`auth/auth.js` + `lib/jwt.js`)

- Endpunkte: `POST /auth/signup`, `POST /auth/token`, `POST /auth/logout`, `GET/PUT /auth/user`, `POST /auth/recover` + `/recover/confirm`, MFA: `GET/POST /auth/factors`, `DELETE /auth/factors/:id`, `POST /auth/factors/:id/challenge` + `/verify`, `GET /auth/aal`.
- JWT: `jsonwebtoken`, `JWT_SECRET` (Default `dev-insecure-secret-change-me` — Prod-Setzung nötig), 1-h-Access-TTL, Issuer `cy-auth`. Payload GoTrue-kompatibel (`sub`, `role=authenticated`, `aal`, `user_metadata`, `app_metadata`). `authMiddleware` liest `Bearer`, setzt `req.claims`; ohne Token → anon.

### 7.3 Daten-Gateway (`gateway/router.js` + `query.js` + `rpc.js`)

- `POST /db/query` — JSON-Query-Rezept (Frontend `.from().select().eq()…`) → parametrisiertes SQL (`query.js`). Whitelist-Operatoren (`eq/neq/gt/gte/lt/lte/like/ilike/in/is`), Identifier-Regex-Validierung (SQL-Injection-Schutz), `schema.table`-Qualifizierung, `alias:col`. **Kein Embed/Nested-Select.**
- `POST /db/rpc/:fn` — RPC-Aufruf.

### 7.4 Auth-/RLS-Modell (`db.js`)

- **`withClaims(claims, fn)`**: jede Anfrage in EINER Transaktion → `SET LOCAL ROLE <anon|authenticated|service_role>` (Rollen-Whitelist gegen Injection) + `set_config('request.jwt.claims', json, true)`. Dadurch laufen die **318 RLS-Policies** und `auth.uid()` unverändert auf düz Postgres. Rollback bei Fehler.
- **`asService(fn)`**: `service_role` (BYPASSRLS) — nur für vertrauenswürdige Server-Jobs (Auth, Functions).
- RLS-Helfer (SECURITY DEFINER): `get_org_owner_id(uuid)` (Tenant-Wurzel via org_members→organizations.owner_id), `get_user_org_id`, `has_org_role`, `has_role`, `in_same_org`, `is_lecturer` — EXECUTE für anon/PUBLIC entzogen. Muster: globale Kataloge `USING(true)` für authenticated; Tenant-Daten `tenant_id = COALESCE(get_org_owner_id(auth.uid()), auth.uid())`; `user_tool_data` streng `auth.uid() = user_id`.

### 7.5 Storage & Functions

- **`storage.js`** — `/storage/*`, Bucket u. a. `company-logos` (raw upload, 12 MB).
- **`functions/router.js`** — Edge-Function-Muadili (`POST /functions/<name>`): `fetch-external-json`, `set-integration-secret`, `sync-intune`, `sync-servicenow`, `send-/accept-org-invitation`, `signup-from-invite`, `admin-create-/delete-/list-users`, `admin-set-role/-ban`, `org-team`. E-Mail-Infra in `lib/email.js` + `email-templates.js`.

---

## Kennzahlen-Zusammenfassung

- **Inventarisiert:** 28 Seiten · 87 Engines/Libs · 12 Hooks · 13 detaillierte Werkzeuge/Tools (12 voll + 1 toter Stub) · 318 RLS-Policies · ~60 Migrationen.
- **Datenmodell-Kern:** frameworks, controls, iso_canonical, risks, control_iso, control_risk, risk_control, control_node/_member, answers, user_tool_data, organizations/org_members.
- **API:** GoTrue-/PostgREST-/Storage-/Functions-Muadili auf Express + düz Postgres; RLS über `withClaims`-Transaktions-Kontext.
