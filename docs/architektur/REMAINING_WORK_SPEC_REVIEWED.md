# CyberWerkSuite — Restarbeit-Plan (REVIEWED / ABGENOMMEN)

**Stand:** 2026-07-18 · **Reviewer:** Fable5 (Chef-Architekt) · **Basis:** Code-Verifikation gegen `/Users/sekercakil/Downloads/ClaudeCWS` (jede Behauptung per Read/Grep geprüft)
**Ersetzt:** `REMAINING_WORK_SPEC.md` (Opus-Entwurf). Abweichungen sind je Item unter **„Plan-Korrektur"** markiert.

## Verifikations-/Autonomie-Rahmen (unverändert verbindlich)
- SQL → `bash db/build-schema.sh`; TS/TSX → esbuild-`transformSync` je Datei (esbuild liegt in `web/node_modules/esbuild`); Importe → grep; reine Engines → node-eval mit Fixture.
- **WICHTIG (neu):** esbuild macht **keine Typprüfung** (Typen werden nur gestrippt, tsconfig `strict:false`). „esbuild grün" beweist nur Syntax. Typ-Behauptungen im Plan („Aufrufer-Typen kompilierbar") sind daher KEIN Akzeptanzkriterium — Akzeptanz muss über grep-Nachweise und node-Fixtures laufen.
- Klassen: `A-SICHER` / `B-KERN` (mit Identitätsbeweis bei Default) / `C-RUNTIME` (nicht autonom).

## Zentrale Code-Befunde, die den Plan verändern (Zusammenfassung)

1. **Totes Erbe aus dem NIS2Suite-Vorfahren.** Folgende Module haben **null Live-Aufrufer** (nur Typ-Importe untereinander bzw. gar keine): `gapEngine.runGapAnalysis` (+ `GapAnalysisResult`-Konstruktion), `gapReportGenerator.ts`, `gapReportExcel.ts`, `gapReportWord.ts`, `riskReportPdf.ts`, `riskReportWord.ts`, `maturityEngine.computeDomainMaturity/computeNis2Maturity/computeNis2ArticleMaturity/enrichWithExecution` (nur `import type` von kpiEngine/Report-Generatoren), `maturityReportGenerator.ts`, `executionReportGenerator.ts`, `kpiEngine.computeKPIs` (einziger Nicht-Typ-Import: `web/src/test/kpi-alerts-no-data.test.ts` und `kpiReportGenerator.ts`, das selbst niemand importiert).
   Live sind stattdessen: `gapReport/gapReportDocx/gapReportXlsx` (Assessment.tsx), `riskReport/riskReportDocx/riskReportXlsx` (Risk.tsx), `reportGenerator` (ReportDialog), `soaGenerator`+`SoAPanel`/`SoAMultiFramework` (Roadmap.tsx), `buildFindingsAndGaps` in `useRiskAnalysis.ts`.
2. **`useFrameworkInheritance` ist heute ein Projektions-No-Op.** Default `{mode:"off"}`; die Projektion (`buildAnchorAnswerMap`/`projectAnswer`) läuft an allen 4 Stellen (Assessment.tsx:130, useComplianceOverview.ts:56, AuditWorkbench.tsx:200, useRiskAnalysis.ts:355) **immer**, unabhängig vom Modus. In `useRiskAnalysis` ist `inheritanceActive` nur Effect-Dependency (Refetch-Trigger, Zeile 395) — der Kommentar dort (Zeilen 323–334) beschreibt ein Verhalten, das der Code nicht hat. Die UI (`FrameworkInheritanceButton`, nur Scope→Frameworks) verspricht „Standard: AUS", was der Engine-Realität widerspricht.
3. **`useToolData` ist bereits tenant-/org-scoped** (löst `getTenantId()` = Org-Owner auf; alle Org-Mitglieder teilen dieselbe `user_tool_data`-Zeile). `org_tool_data` (Migration `20260717000007`) existiert und ist leer. Item 14 ist also funktional weniger dringend als der Plan suggeriert.
4. **DB-Vorarbeiten der Wellen 1–3 sind da:** `evidence` (+`answer_evidence`, kind `attestation`), `compliance_deadlines` (kind `audit_cycle`), `maturity_targets`, `kpi_snapshots`, `org_tool_data`, `control_node_member`. `audit_findings` (Alt-Tabelle) wird von web/src **nicht** benutzt — der Audit-Zustand lebt im Tool-Blob `audit-workbench`. `kpi_snapshots`-Tabelle hat weder Writer noch Reader (Roadmap.tsx:530 liest noch den Legacy-Blob `tool_key='kpi_snapshots'` aus `user_tool_data`).
5. **Reifegrad fließt bereits durch die Projektion:** `AnswerRow.reifegrad` → `projectAnswer` → `EffectiveAnswer.reifegrad` (assessmentEngine.ts:139/160). `uses_maturity` wird in Assessment.tsx:102 geladen. Was fehlt, ist ausschließlich eine **Aggregations-/Anzeige-Schicht**.

---

## Item 15 (P1) — SoA-Projektion von NIS2-Typen entkoppeln

- **Klasse:** **A-SICHER** ✅ (bestätigt, aber Begründung korrigiert)
- **Plan-Korrektur:** Der Import in `web/src/lib/soaProjection.ts:41` ist `import type { ComplianceStatus, ControlQuestion, NIS2Category } from "@/data/nis2Controls"` — ein **reiner Typ-Import**, der von esbuild ohnehin wegkompiliert wird. Es gibt **heute schon null Runtime-Kopplung**. Das Item ist reine Typ-Hygiene (Vorbereitung, damit soaProjection katalog-agnostisch dokumentiert ist). Zusätzlich nutzt soaProjection `NIS2Category` als Cast für die Pseudo-Kategorie (Zeile 366) und `ControlQuestion` für Pseudo-Fragen (Zeile 355).
- **Konsumenten von soaProjection (verifiziert):** `components/roadmap/SoAMultiFramework.tsx`, `components/roadmap/SoAPanel.tsx`, `lib/kpiEngine.ts`, `lib/soaGenerator.ts`, `lib/maturityEngine.ts`, `pages/Roadmap.tsx`, `pages/Risk.tsx`.
- **Präzise Änderung:** In soaProjection lokale Strukturtypen definieren und den `@/data/nis2Controls`-Import entfernen:
  ```ts
  export type SoAStatus = "ja" | "teilweise" | "nein" | "entbehrlich" | null; // = ComplianceStatus
  export interface SoAQuestionLite { id: string; question: string; questionEn: string; description: string; descriptionEn: string; status: SoAStatus; }
  export interface SoACategoryLite { id: string; article: string; title: string; titleEn: string; questions: SoAQuestionLite[]; }
  ```
  `SoAProjectionInput.categories: SoACategoryLite[]`, `implStatus: SoAStatus`, Pseudo-Cat-Cast auf `SoACategoryLite`. **Achtung:** `ComplianceStatus` enthält real auch `"entbehrlich"` (wird in Zeile 429/486 geprüft) — der Plan-Vorschlag `'ja'|'teilweise'|'nein'|null` wäre **falsch** (zu eng). Aufrufer NICHT anfassen (strukturelle Typisierung; NIS2Category erfüllt SoACategoryLite).
- **Identität bei Default:** wasserdicht — Typ-only, esbuild-Output der Datei ist vor/nach Änderung byte-identisch bis auf entfallene Type-Zeilen (kein Runtime-Code betroffen).
- **Akzeptanz:** `grep -c "nis2Controls" web/src/lib/soaProjection.ts` = 0; `"entbehrlich"` im neuen Status-Typ enthalten (grep).
- **esbuild-Verifikation:** transformSync über soaProjection.ts + alle 7 Konsumenten.
- **Fallstricke:** Nicht in denselben Zug maturityEngine mit-entkoppeln (importiert `nis2Domains` als **Wert**, separates Item 11).

## Item 09 (P1) — `useFrameworkInheritance` verdrahten

- **Klasse:** **B-KERN** ✅ — aber nur mit dem unten korrigierten Design; das Plan-Design wäre eine Regression.
- **Plan-Korrektur (kritisch):** Der Plan behauptet „`applied` (Default) ⇒ heutiges Verhalten". **Falsch:** `DEFAULT_STATE = { mode: "off" }` (useFrameworkInheritance.ts:30), und das heutige Verhalten ist „Projektion immer aktiv, Modus wird ignoriert". Würde man `off ⇒ leere Anker-Map` naiv verdrahten, **fielen bei allen Bestands-Tenants mit Default-Zustand die Compliance-Prozente sichtbar ab** — genau die Regression, die B-KERN verbietet.
- **Korrigiertes Design (Identität bei Default herstellen):**
  1. `FrameworkInheritanceState` um Versionsfeld erweitern: `v?: 2`. `DEFAULT_STATE = { mode: "applied", appliedAt: null, v: 2 }`.
  2. **Read-Migration im Hook:** Blob ohne `v:2` ⇒ als `{ mode: "applied", appliedAt: appliedAt ?? jetzt, v: 2 }` interpretieren (einmalig; damit bleibt JEDER Bestands-Tenant exakt beim heutigen Zahlenstand, denn heute wird faktisch immer vererbt). Erst Nutzeraktionen NACH Deploy erzeugen ehrliches `off`.
  3. **Verdrahtung an den 4 Projektionsstellen** (additiv, ein Ausdruck): bei `mode === "off"` eine **leere** `isoAnswerByControl`-Map übergeben. Verifiziert: `projectAnswer` fällt dann korrekt auf die eigene Antwort zurück (assessmentEngine.ts:107; die Anker-Schleife 124–134 findet in leerer Map nichts — auch der ISO-Selbstanker Zeile 122–123 greift ins Leere, eigene Antwort bleibt Kandidat 1). Stellen: `hooks/useComplianceOverview.ts` (Memo Zeile 55–58), `pages/Assessment.tsx` (Zeile 130), `pages/AuditWorkbench.tsx` (Zeile 200), `hooks/useRiskAnalysis.ts` (Zeile 355; dort `mode` statt nur `isActive` konsumieren).
  4. `preview` **NICHT entfernen** (Plan-Abweichung): `isActive = preview||applied` wirkt heute schon identisch; Entfernen wäre UI-Churn in `FrameworkInheritanceButton.tsx` + `FrameworkInheritanceBar.tsx` + Scope.tsx ohne Zahleneffekt. Nur Doku-Kommentar im Hook korrigieren: „worst wins" → „LWW + relations-bewusste Deckelung (equal/superset voll; subset/intersects deckelt geerbtes ja auf teilweise)" — der Button-Popover-Text (Zeile 74–75, ‚worst wins') ist ebenfalls faktisch falsch und wird mitkorrigiert.
- **Identität bei Default:** wasserdicht **nur mit Schritt 2** (Read-Migration). Rest-Risiko dokumentieren: ein Nutzer, der vor Deploy bewusst „Aus" gestellt hat (Toggle war wirkungslos), bleibt nach Migration auf „Übernommen" — kein Zahlensprung, aber Badge-Wechsel „Aus"→„Übernommen". Das ist die ehrlichste der möglichen Interpretationen.
- **Akzeptanz:** (a) node-Fixture: `projectAnswer` mit leerer Map ⇒ nur eigene Antworten; mit gefüllter Map ⇒ unverändert zu heute. (b) Bestands-Blob `{mode:"off",appliedAt:null}` wird zu applied migriert (Fixture über die Hook-Migrationsfunktion, als pure Funktion exportieren). (c) Nach explizitem Reset zählt Compliance-% nur direkte Antworten.
- **esbuild:** useFrameworkInheritance.ts, useComplianceOverview.ts, useRiskAnalysis.ts, Assessment.tsx, AuditWorkbench.tsx, FrameworkInheritanceButton.tsx.
- **Fallstricke:** In `useRiskAnalysis` speist die Anker-Map auch `implementedAnswers` (SoA-Spiegel, Zeile 363–372) — `off` reduziert also auch die „implemented"-Spiegelung in Treatment/SoA. Gewollt (konsistent strikt), aber im Abnahme-Text erwähnen. Dashboard lädt durch den Hook künftig eine zusätzliche `user_tool_data`-Zeile — unkritisch.

## Item 18 (P1) — `bundleEngine` auf Knoten-Referenz

- **Klasse:** **B-KERN** ✅ (Signatur-Frage geklärt: Aufrufer muss Daten reichen)
- **Verifizierter Ist-Zustand:** `bundleEngine.ts` (121 Zeilen) hat **keinerlei DB-Zugriff**; `getIsoRefForControl(controlId)` löst rein statisch über `controlCatalog` (NIS2-Katalog) + `extractIsoRef` auf. Für Nicht-NIS2-Kontroll-IDs (BSI/DORA/… aus `useRiskAnalysis.findingControls`) liefert es `null` ⇒ alles landet im Bündel `__no_iso__` („Sonstige Maßnahmen"). `useRiskAnalysis` lädt `control_node_member` bereits (Zeile 300–302), **exponiert es aber nicht** im Hook-Rückgabewert.
- **Plan-Korrektur (kritisch):** **Bundle-Key darf NICHT die node_id werden.** Bundle-Keys sind Persistenz-Schlüssel für `useBundleOwners` (Owner-Overrides, Tool-Blob) und `getBundleMeta` löst sie gegen `ISO_CONTROL_MAP["A.x.y"]` auf. node_id als Key würde (a) gespeicherte Owner verwaisen, (b) rohe UUID/Slug-Titel in der UI zeigen. Richtig: **Knoten nur als Brücke zur ISO-Ref** — `fremde control_id → node → ISO-Mitglied des Knotens → "A.x.y"`.
- **Präzise Änderung:**
  1. `getIsoRefForControl(controlId, isoRefByControlId?: ReadonlyMap<string,string>)` — additiver optionaler Parameter; wenn Map vorhanden und Treffer, diesen Ref zurückgeben, sonst heutiger statischer Pfad. `getIsoRefForRisk(risk, isoRefByControlId?)` reicht durch.
  2. `useRiskAnalysis`: `nodeMembers` (und vorhandene `controlIsoMappings`) zu einer `isoRefByControlId`-Map verdichten (node → ISO-Mitglied per `framework==="ISO27001"`-Member; Fallback `control_iso.iso_id` → via `extractIsoRef` normalisieren) und additiv im State zurückgeben.
  3. Aufrufer (Risk.tsx / Roadmap.tsx, wo `getIsoRefForRisk`/`groupByBundle` genutzt werden) reichen die Map — **in einem separaten, zweiten Schritt**, damit Schritt 1+2 für sich identitätsneutral bleiben.
- **Identität bei Default:** wasserdicht für Schritt 1+2 (Parameter optional, niemand übergibt ihn). Schritt 3 ändert sichtbar die Bündelung von Nicht-NIS2-Risiken (aus „Sonstige" in echte ISO-Bündel) — das ist der gewollte Effekt, betrifft aber nur Tenants mit Nicht-NIS2-Findings; Owner-Overrides bleiben intakt, weil Keys ISO-Refs bleiben.
- **Akzeptanz:** node-Fixture: `getIsoRefForControl("bsi-xyz")` = null ohne Map, = "A.5.1" mit Map `{"bsi-xyz"→"A.5.1"}`; NIS2-ID mit UND ohne Map identisch (statischer Pfad hat Vorrang NICHT — Map hat Vorrang; deshalb Fixture: Map darf für NIS2-IDs nur den identischen Ref enthalten oder Aufrufer nimmt NIS2-IDs nicht in die Map auf → Entscheidung: **Map gewinnt**, dokumentieren).
- **esbuild:** bundleEngine.ts, useRiskAnalysis.ts (+ Schritt 3: Risk.tsx, Roadmap.tsx).
- **Fallstricke:** `extractIsoRef`-Normalisierung („A.5.15" vs „5.15") konsistent halten, sonst entstehen Doppel-Bündel; Fixture mit beiden Formaten.

## Item 11 (P1) — Maturity reifegrad-SSOT + Targets

- **Klasse:** **B-KERN** (Engine additiv = faktisch A; neue sichtbare Ansicht = B) ✅, aber Ansatz korrigiert.
- **Plan-Korrektur (kritisch):** Die Signatur-Frage stellt sich gar nicht wie geplant: `maturityEngine.ts` (401 Z.) konsumiert **ausschließlich `SoAProjection`** (NIS2-Katalog), hardcodet `nis2Domains`/`controlMetadata`/`nis2RequirementMapping` — und hat **null Live-Aufrufer** (nur `import type` in kpiEngine/maturityReportGenerator/executionReportGenerator; kein Page/Component ruft `computeDomainMaturity` & Co.). „Input erweitern" wäre Umbau von totem Code. `familyOf` existiert NICHT in maturityEngine, sondern in `assessmentEngine.ts:281` mit Signatur `familyOf(control: ControlRow, de?: boolean): { id, label }`. `reifegrad` wird bereits bis `EffectiveAnswer` gereicht (assessmentEngine.ts:139/160); `uses_maturity` wird in Assessment.tsx:102 pro Framework geladen; `maturity_targets`-Tabelle existiert (Migration `20260717000005`), hat keinen Lader.
- **Präzise Änderung (additiv, Bestand unangetastet):**
  1. **Neue Engine-Funktion** in maturityEngine.ts (oder neue Datei `maturityV2.ts`, sauberer):
     ```ts
     export interface FrameworkMaturityInput {
       framework: string; usesMaturity: boolean;
       controls: ControlRow[];                       // gefiltert wie Compliance (kein sub/scored:false)
       effective: Map<string, EffectiveAnswer>;      // aus projectAnswer
       targets?: Record<string, number>;             // family_id -> target (maturity_targets), Default TISAX 3
     }
     export function computeFrameworkMaturity(input): { groups: {family, ist, target, gap, derived}[]; overall; derived: boolean }
     ```
     `usesMaturity=true` ⇒ ist = Mittelwert der erfassten `reifegrad`-Werte je `familyOf`-Gruppe (nur Antworten mit reifegrad≠null; keine ja=5-Fiktion). Sonst Pseudo-Score (ja=5/teilweise=2.5 wie heute) mit `derived:true`.
  2. **Lader** `maturity_targets` (kleiner Hook oder Query in der Ansicht; Tabelle: tenant-RLS, additiv lesen).
  3. **Ansicht**: neues Panel (Dashboard-Karte oder Assessment-Seitenpanel für uses_maturity-Frameworks) mit Badge „erfasst" vs „abgeleitet" und Gap-Spalte `target − ist`. Bestehende Zahlen/Ansichten bleiben unberührt (es GIBT keine bestehende Maturity-Ansicht).
- **Identität bei Default:** wasserdicht — ausschließlich neue Exporte + neues UI-Panel; kein bestehender Zahlenpfad berührt. (Deshalb autonom vertretbar, obwohl neue Zahlen sichtbar werden: es werden keine bestehenden Zahlen VERÄNDERT, und die Ableitung ist ehrlich gebadged.)
- **Akzeptanz:** node-Fixture: TISAX-Controls mit reifegrad {3,4,null} ⇒ ist=3.5, derived=false; ISO ohne uses_maturity ⇒ derived=true, Score identisch zur ja/teilweise-Formel; ohne targets ⇒ gap null/ausgeblendet.
- **esbuild:** maturityV2 + Panel + Einbindungsstelle.
- **Fallstricke:** `familyOf` erwartet `ControlRow` — die Ansicht muss die Assessment-Datenpfade (useAssessment/useComplianceOverview) nutzen, NICHT die SoAProjection. Alte maturityEngine-Exporte als `@deprecated (toter NIS2-Pfad)` kommentieren, nicht löschen (Typ-Importe!).

## Item 10 (P1) — Gap-Pipeline konsolidieren

- **Klasse:** **A-SICHER** (herabgestuft von B-KERN — Begründung: reiner Code-Move) ✅, Umfang stark reduziert.
- **Plan-Korrektur (kritisch):**
  1. `runGapAnalysis` hat **null Aufrufer** (grep: nur Definition gapEngine.ts:546). Niemand konstruiert `GapAnalysisResult` in pages/components. Die „alten statischen Aufrufer", die der Plan migrieren will, **existieren nicht**.
  2. Die NIS2-Prosa im **Live**-Pfad ist **bereits framework-sensitiv**: `buildFindingsAndGaps` (useRiskAnalysis.ts:173–174) nutzt `isNis2Active()`. Dieser Plan-Teil ist erledigt.
  3. `byAssetClass/byAssetSubClass` existiert nur im toten `runGapAnalysis`-Pfad (gapEngine.ts:565 ff., auf statischem `controlMetadata`); eine Übernahme in den Live-Pfad wäre neues Verhalten ohne Abnehmer ⇒ **streichen**.
  4. Kein Regressionsrisiko für NIS2-Tenants, WENN man sich auf den Code-Move beschränkt — die Plan-Sorge („wenn unklar → C") entfällt.
- **Präzise Änderung:** `buildFindingsAndGaps` + Helfer `severityFor`/`firstText` **verbatim** (Diff-identisch) von `hooks/useRiskAnalysis.ts` nach `lib/gapEngine.ts` verschieben und exportieren (Abschnitt „LIVE PIPELINE" mit Kommentar; Rest der Datei als Legacy markieren). `useRiskAnalysis` importiert sie. Lokale Interfaces `ServiceRow`/`AssetRow` mit-exportieren oder strukturell parametrisieren (minimal: mit-verschieben, useRiskAnalysis re-importiert Typen).
- **Identität bei Default:** wasserdicht — Code-Move ohne Textänderung, per `git diff --color-moved` nachweisbar.
- **Akzeptanz:** grep: `buildFindingsAndGaps` genau 1 Definition (gapEngine), 1 Import (useRiskAnalysis); Funktionskörper diff-identisch.
- **esbuild:** gapEngine.ts, useRiskAnalysis.ts.
- **Fallstricke:** gapEngine importiert bereits `controlMetadata` (nis2-statisch) — der verschobene Live-Builder darf davon nichts benutzen (tut er nicht: er bekommt `ControlRow[]` gereicht). Nicht `runGapAnalysis` löschen (Typ-Exporte `Severity/ConsolidatedGap/Finding/AssetInfo/GapAnalysisResult` werden breit importiert); Aufräumen des toten Rests → mit Item 12-Restposten bei Dr. Sait.

## Item 16 (P1) — Inherent/Residual-Risiko + Akzeptanz-Gate

- **Klasse:** **B-KERN** ✅ (bestätigt), Zuschnitt präzisiert.
- **Verifizierter Ist-Zustand:** `RiskObject` (riskEngine.ts:44–79) hat `risk_score`/`risk_level`, keine inherent/residual-Felder. `generateRisks` kennt **keine Treatments** (Treatments entstehen in Schritt 9 NACH der Risikoanalyse; `TreatmentObject` in treatmentEngine.ts:60 hat bereits `justification`, `owner`, `status:"done"`, `risk_level`). Ein „accept-Pfad" als Engine-Logik existiert nicht — `accept` ist nur ein Strategy-Wert; UI in `components/risk/TreatmentTable.tsx`. `risk_config`-Blob existiert nicht (Matrix-Config lebt in `NIS2RiskMatrix` via useToolData `RiskMatrixState`).
- **Plan-Korrektur:** residual kann NICHT in `generateRisks` berechnet werden (keine Treatment-Eingabe) — stattdessen nachgelagerte pure Funktion.
- **Präzise Änderung:**
  1. riskEngine: `RiskObject += inherent_score?: number; residual_score?: number; residual_level?: RiskLevel;` — `generateRisks` setzt `inherent_score = risk_score` (Alias, additiv).
  2. Neue pure Funktion (treatmentEngine oder riskEngine): `applyResidualRisk(risks, treatments, cfg?): RiskObject[]` — je Risiko: alle `mitigate`-Treatments mit `status==="done"` und vollständig umgesetztem Kontroll-Set ⇒ Likelihood −1 Stufe (dokumentierter Default), Score/Level per vorhandener Formel-Helper neu; ohne Treffer `residual = inherent`.
  3. Gate: `validateAcceptance(risk, treatment, cfg): { ok: boolean; reason?: string }` — nur aktiv wenn `cfg.acceptance_gate` gesetzt (neuer Key im Risk-Config-Blob, Default **nicht gesetzt** ⇒ Gate aus ⇒ heutiges Verhalten). UI-Verdrahtung in TreatmentTable/Risk.tsx: bei `strategy==="accept"` und Level ≥ Schwelle Pflichtfelder justification+owner erzwingen.
  4. Risk-Seite/`riskReport*`: optionale Spalten inherent/residual nur rendern, wenn Werte vorhanden.
- **Identität bei Default:** wasserdicht — ohne `applyResidualRisk`-Aufrufkette bzw. ohne done-Treatments und ohne `acceptance_gate`-Config ist alles wie heute (neue Felder undefined, Reports rendern sie nicht).
- **Akzeptanz:** node-Fixture: Risiko L3×I4 (multiply, 5×5-Default-Thresholds) + abgeschlossenes mitigate-Treatment ⇒ residual = 2×4, Level sinkt gemäß Thresholds; ohne Treatment residual=inherent. Gate-Fixture: accept+critical+leere justification ⇒ `ok:false` bei aktiver Config, `ok:true` ohne Config.
- **esbuild:** riskEngine.ts, treatmentEngine.ts, Risk.tsx, TreatmentTable.tsx, riskReport*.ts (nur live-Trio).
- **Fallstricke:** „vollständig umgesetztes Kontroll-Set" sauber definieren (alle `selected_control_ids` des Treatments in `implementedControls`-Spiegel ODER Treatment-status done — Empfehlung: **nur** `status==="done"` als Kriterium, das ist Nutzer-Wahrheit und deterministisch). Nicht Likelihood unter 1 drücken.

## Item 17 (P1) — Management-Review-Modul (Schritt 7)

- **Klasse:** **A-SICHER** ✅ (additiv), Andockpunkte korrigiert.
- **Plan-Korrektur:** `AuditWorkbench.tsx` hat **keine Tabs** (Single-Screen-Audit; grep `TabsTrigger` = 0) — „Tab in AuditWorkbench" geht nicht. Stattdessen **neue Route** `/management-review` in App.tsx (PipelineLayout, Zeile 98 ff.) + Sidebar-Eintrag. `audit_findings`-Tabelle wird von web/src nicht benutzt — Audit-Findings kommen aus dem Tool-Blob `useToolData("audit-workbench", …)` (AuditWorkbench.tsx:128). `kpi_snapshots`-Tabelle existiert, hat aber **keinen Lader/Writer** — die Komponente schreibt den ersten echten Snapshot.
- **Verifizierte Andockpunkte:** `reportKit.ts` (rkSection/rkTable/rkKpiRow/rkScoreBox + `rkExport("pdf"|"word", …)`) ✔; `evidenceEngine.createEvidence` mit `EvidenceKind = "attestation"` ✔; `deadlineEngine.createDeadline` mit `DeadlineKind = "audit_cycle"` + `addInterval(baseIso, "1 year")` ✔; Compliance-Zahlen via `useComplianceOverview`; Risiken via `useRiskAnalysis`; Incidents via Tool-Blob `incident-register`; offene Fristen via `listOpenDeadlines`.
- **Präzise Änderung:** neue `web/src/pages/ManagementReview.tsx` (bzw. components/ + page): Ist-Stand-Zusammenfassung (Compliance je Framework, Top-Risiken, Incident-Statistik, offene Fristen, Audit-Blob-Findings), Felder Teilnehmer/Beschlüsse/NIS2-§38-Leitungs-Kenntnisnahme (Freitext + Checkbox, nur wenn NIS2 aktiv — `isNis2Active()`), Abschluss-Aktion: (a) `createEvidence({kind:"attestation", …})`, (b) `createDeadline({kind:"audit_cycle", due: addInterval(now,"1 year")})`, (c) INSERT `kpi_snapshots` (metrics/has_data JSON), (d) Protokoll-Export via `rkExport`. Review-Historie im eigenen Tool-Blob `management-review` (useToolData) — konsistent zum Bestandsmuster.
- **Identität bei Default:** wasserdicht — ausschließlich neue Dateien + 1 Route + 1 Sidebar-Eintrag.
- **Akzeptanz:** Review abschließen ⇒ 1 evidence-Zeile (kind attestation), 1 compliance_deadlines-Zeile (audit_cycle, +1 Jahr), 1 kpi_snapshots-Zeile; Export erzeugt Druck-Layout via reportKit; ohne NIS2 kein §38-Feld.
- **esbuild:** neue Dateien + App.tsx + Sidebar.
- **Fallstricke:** Berichte-Regel beachten (erst In-App-Vorschau, dann Druck/PDF — `rkExport` öffnet Print-Fenster, das erfüllt die Regel). `kpi_snapshots.tenant_id` = `getTenantId()` (RLS erzwingt COALESCE(org_owner, uid) — mit user.id einfügen schlägt für Org-Mitglieder fehl!).

## Item 23 (P2) — Evidence-/Fristen-KPIs

- **Klasse:** **A-SICHER** ✅, aber Ehrlichkeits-Korrektur zum Zielort.
- **Plan-Korrektur:** `kpiEngine.computeKPIs` hat **keinen Live-Aufrufer** (nur Test + toter kpiReportGenerator). KPIs „im kpiEngine ergänzen + Dashboard" — das Dashboard rendert heute keine kpiEngine-KPIs. Nur-Engine-Erweiterung wäre unsichtbar.
- **Präzise Änderung:** (a) `KPIEngineInput += evidence?: {control_id?: string; valid_until: string|null}[]; deadlines?: {due_at: string; status: string; done_at?: string|null}[]` (optional); zwei neue Metriken `evidence_freshness_pct` (Tier B; Anteil nicht-abgelaufener Evidence, `freshness()`-Regel aus evidenceEngine: 30-Tage-Fenster) und `deadline_adherence_pct` (Tier B; fristgerecht erledigte / alle fälligen), beide `no_data` ohne Eingabe. (b) **Sichtbarkeit:** zwei kleine Dashboard-Karten (Dashboard.tsx nutzt bereits deadlineEngine) ODER Aufnahme ins ManagementReview (Item 17) — Empfehlung: ManagementReview, dann ist Item 23 dessen Zulieferer und braucht kein separates Dashboard-Layout.
- **Identität bei Default:** wasserdicht — optionale Inputs, neue Metrik-IDs, kein bestehender KPI verändert.
- **Akzeptanz:** node-Fixture: leere Inputs ⇒ beide `no_data`; 3 Evidence (1 abgelaufen) ⇒ 67 %; 4 fällige Deadlines (3 rechtzeitig done) ⇒ 75 %.
- **esbuild:** kpiEngine.ts (+ Einbindungsdatei).
- **Fallstricke:** keine.

## Item 12 (P1) — Report-Generatoren konsolidieren (Legacy raus)

- **Klasse:** **A-SICHER für die tote Hälfte** (herabgestuft von C-RUNTIME) / **C-RUNTIME für den Rest**.
- **Plan-Korrektur (kritisch):** Die Parity-Sorge des Plans ist für die Löschkandidaten gegenstandslos, denn sie sind **unreferenziert**: `riskReportPdf.ts` (einziger Importer: riskReportWord), `riskReportWord.ts` (0 Importer), `gapReportGenerator.ts`, `gapReportExcel.ts`, `gapReportWord.ts` (alle 0 Importer in pages/components/lib-live). Live und NICHT anfassen: `riskReport.ts`/`riskReportDocx.ts`/`riskReportXlsx.ts` (Risk.tsx:44–46), `gapReport.ts`/`gapReportDocx.ts`/`gapReportXlsx.ts` (Assessment.tsx), `reportGenerator.ts` (ReportDialog).
- **Präzise Änderung (autonom):** die 5 toten Dateien löschen; ebenso prüfbar tot (0 Aufrufer, siehe Befunde): `maturityReportGenerator.ts`, `executionReportGenerator.ts`, `kpiReportGenerator.ts` — Empfehlung: in DIESEM Schritt nur die 5 Report-Legacy-Dateien löschen, die drei Generatoren erst nach Item 11/23-Entscheid (könnten als Vorlage dienen). Vorher/nachher: `grep -rn "riskReportPdf\|riskReportWord\|gapReportGenerator\|gapReportExcel\|gapReportWord" web/src` = 0.
- **NICHT autonom (C-RUNTIME):** jede Umstellung der LIVE-Generatoren auf reportKit (visuelle Parität) — Dr. Sait.
- **Identität bei Default:** wasserdicht — Löschen unreferenzierter Dateien ändert das Bundle nicht (vite tree-shaked sie heute schon weg); git macht es reversibel.
- **Akzeptanz/Verifikation:** grep = 0 Referenzen; esbuild-transformSync über Risk.tsx/Assessment.tsx unverändert grün; `vite build` auf dem Mac als Endkontrolle.

## Item 14 (P1) — Treatments/SoA/Risk-Config org-scoped

- **Klasse:** **A-SICHER für die Option** / **C-RUNTIME für Umstellung+Migration** ✅ (Plan-Split bestätigt), Dringlichkeit korrigiert.
- **Plan-Korrektur:** `useToolData` ist **bereits org-geteilt** — es schreibt nach `user_tool_data` mit `user_id = getTenantId()` (= Org-Owner; Zeilen 42–45, 140–149), inkl. Realtime auf die geteilte Zeile. Alle Org-Mitglieder sehen also heute schon dieselben Treatments/SoA-Blobs. Der Gewinn von `org_tool_data` ist Modell-Hygiene (echte tenant_id-PK, updated_by, saubere RLS) — **kein akuter Funktionsmangel**.
- **Präzise Änderung (autonom):** additiver 4. Parameter `opts?: { scope?: "user" | "org" }` (Default `"user"` ⇒ byte-identisch). `scope:"org"`-Pfad: Tabelle `org_tool_data`, Spalten `tenant_id/tool_key/data` (+`updated_by: user.id`), `onConflict: "tenant_id,tool_key"`, Realtime-Filter `tenant_id=eq.${tenantId}`, keepalive-Flush-URL entsprechend. Kein Aufrufer wird umgestellt.
- **Identität bei Default:** wasserdicht (niemand übergibt opts).
- **Akzeptanz:** grep: kein bestehender Aufrufer übergibt opts; neuer Pfad per Code-Review + esbuild; erster echter Nutzer des org-Pfads = neues Feature (z. B. ManagementReview-Blob, optional).
- **C-RUNTIME-Teil:** Key-Umstellung bestehender Blobs (`risk-treatment`, `soa`, …) + Datenmigration user→org — Datenverlust-/Doppelquellen-Risiko, nur mit Abnahme + Migrationsskript + Rollback-Plan.
- **Fallstricke:** `org_tool_data` hat `updated_at` — beim Upsert nicht mitsenden (DB-Default) oder explizit `now()`; Realtime-Publikation für die neue Tabelle prüfen (falls `supabase_realtime`-Publication tabellenweise gepflegt wird — sonst kommt der org-Pfad ohne Live-Sync an; im Zweifel Publication-Migration additiv ergänzen).

## Item 07 (P0) — control_iso-Ablösung frameworkweise

- **Klasse:** **C-RUNTIME** ✅ (bestätigt — ändert effektive Compliance-Zahlen, braucht Kuratierung + Referenz-Tenant-Diff).
- **Autonom zulässige Vorbereitung (A-SICHER):** (a) `db/tools/projection_diff.mjs` neu anlegen (Verzeichnis existiert noch nicht): projiziert je Kontrolle effektiv über control_iso vs. Knoten+control_mapping und listet Abweichungen je Framework (reine Lese-Logik, node-ausführbar gegen Dump/Fixture). (b) additive Migration `frameworks.meta`-Flag `node_complete` (bzw. Spalte, DEFAULT false — verhaltensneutral). **Nicht autonom:** das Fallback-Gate in useAssessment (control_iso nur laden wenn `node_complete=false`) — das ist der scharfe Schalter und gehört zur Abnahme.
- **Verifikation Vorbereitung:** build-schema.sh grün; Flag DEFAULT false ⇒ kein Verhaltenseffekt; projection_diff läuft gegen Fixture.

## Item 20 (P2) — Legacy-Answer-Tabellen archivieren

- **Klasse:** **C-RUNTIME** ✅ (bestätigt). Grep-Nachweis erbracht: **0 Referenzen** auf `assessment_answers|org_assessment_answers|class_assessment_answers` in `web/src` und `api/`; letzte DB-Erwähnungen in Migrationen bis `20260702212034`. Verbleibendes Risiko: DB-interne Referenzen (Trigger/Views/Functions in schema.sql) + eventuelle Bestandsdaten ⇒ RENAME→`_archive_*` nur mit `build-schema.sh`-Beweis UND Dr.-Sait-Abnahme (Datenerhalt). DROP später.

## Item 24 (P2) — Continuous-Compliance-Tests

- **Klasse:** **A-SICHER (DB)** + **C-RUNTIME (Connector)** ✅ (bestätigt). Migration `20260717000008_control_tests.sql`: `control_tests` (tenant_id, control ref/node ref, kind, schedule, config jsonb) + `control_test_results` (test_id, ran_at, status, detail jsonb), tenant-RLS nach Muster von `kpi_snapshots` (COALESCE(get_org_owner_id, uid)), leer ⇒ verhaltensneutral. Verifikation: `bash db/build-schema.sh`. Connector-/Sync-Logik separat mit Abnahme.

---

## Finale autonome Umsetzungsreihenfolge (nur freigegebene Items)

**Welle R1 — additiv/risikofrei (A-SICHER):**
1. **Item 15** — SoA-Typ-Entkopplung (rein Typ-Hygiene, macht Folge-Arbeit sauberer; Achtung `"entbehrlich"` im Status-Typ).
2. **Item 10-Move** — `buildFindingsAndGaps` verbatim nach gapEngine (Diff-identischer Code-Move; entkoppelt die Live-Gap-Logik für alles Weitere).
3. **Item 14a** — `useToolData` `scope:'org'`-Option (Default user, byte-identisch; schafft die Infrastruktur, die R2-Items optional nutzen).
4. **Item 24-DB** — `control_tests`-Migration (leer, build-schema-verifiziert).
5. **Item 07-Prep** — `db/tools/projection_diff.mjs` + `node_complete`-Flag DEFAULT false (reine Vorbereitung, kein Gate).
6. **Item 23** — Evidence-/Fristen-KPIs im kpiEngine (Fixture-verifiziert; Sichtbarkeit über Item 17).
7. **Item 17** — ManagementReview-Seite (+Route/Sidebar; konsumiert Item 23; erster echter kpi_snapshots-Writer). *Nach 23, wegen Abhängigkeit.*

**Welle R2 — B-KERN mit Identitätsbeweis (in dieser Reihenfolge, je Item einzeln verifizieren):**
8. **Item 11** — Maturity-V2-Engine + TISAX-Panel + maturity_targets-Lader (nur neue Exporte/Panel; keine Bestandszahl ändert sich).
9. **Item 16** — inherent/residual + config-gated Accept-Gate (Default: Gate aus, residual=inherent ⇒ Identität).
10. **Item 18** — bundleEngine-Knoten-Brücke Schritt 1+2 (optionaler Parameter + Map-Export aus useRiskAnalysis; Default-Identität). Schritt 3 (Aufrufer reichen Map ⇒ sichtbare Um-Bündelung von Nicht-NIS2-Risiken) als letzter Teilschritt, mit Vorher/Nachher-Screenshot für Dr. Sait — Owner-Keys bleiben ISO-Refs, daher kein Datenverlust.
11. **Item 09** — Inheritance-Verdrahtung mit v2-Read-Migration (Default→applied). Bewusst **zuletzt** in R2: berührt 4 Kern-Projektionsstellen gleichzeitig; alle vorherigen Items dürfen davon nicht abhängen (tun sie nicht).
12. **Item 12a** — Löschung der 5 toten Report-Module (ganz am Ende: grep-Beweis dann gegen den finalen Stand).

**Zurückgestellt (NICHT autonom, Dr.-Sait-Abnahme) — mit Begründung:**
- **Item 07 (Gate+Kuratierung):** ändert effektive Compliance-Zahlen aller Frameworks; braucht Referenz-Tenant-Diff (projection_diff) + kuratierte partielle Mappings. Größter Einzelblock, eigenes Arbeitspaket.
- **Item 12b (Live-Reports auf reportKit):** visuelle Parität nur am Bildschirm prüfbar.
- **Item 14b (Blob-Migration user→org):** Datenverlust-/Split-Brain-Risiko bei Migration laufender Tenants; heutiger Zustand ist funktional bereits org-geteilt, also kein Druck.
- **Item 20 (RENAME/DROP):** DB-Objekt-Abhängigkeiten in schema.sql + Bestandsdaten; nur mit build-schema-Beweis und Abnahme.
- **Item 24-Connector:** externe Systeme/Secrets, Runtime-Test zwingend.
- **Item 09-Zusatz „preview entfernen":** kosmetisch, UI-Churn ohne Zahleneffekt — gestrichen bzw. mit Dr. Sait als UX-Frage.

## Verifikations-Einzeiler (Referenz)

```bash
# TS/TSX-Syntax je Datei (im Repo, web/):
node -e 'const{transformSync}=require("./web/node_modules/esbuild");const fs=require("fs");
for(const f of process.argv.slice(1)){transformSync(fs.readFileSync(f,"utf8"),{loader:f.endsWith(".tsx")?"tsx":"ts",jsx:"automatic"});console.log("OK",f)}' <dateien>
# SQL:
bash db/build-schema.sh
# Import-Beweise (Beispiele):
grep -rn "nis2Controls" web/src/lib/soaProjection.ts            # Item 15: leer
grep -rn "riskReportPdf\|gapReportGenerator" web/src            # Item 12a: leer
grep -rn "buildFindingsAndGaps" web/src                          # Item 10: 1 Def + 1 Import
```
