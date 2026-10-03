# CyberWerkSuite — Finale Ziel-Gesamtarchitektur (Soll)

**Stand:** 2026-07-17 · **Autor:** Chef-Architekt (Fable5)
**Basis:** inventory.md (Ist), research_workflow.md, research_frameworks.md, research_engines.md + Code-Review der Kern-Engines/Hooks im Repo `/Users/sekercakil/Downloads/ClaudeCWS`.
**Verbindlichkeit:** Dieses Dokument ist das Soll-Zielbild. Die konkreten Arbeitspakete stehen in `IMPLEMENTATION_SPEC.md` (gleiches Verzeichnis).

---

## 1. Leitprinzipien

1. **Ein Assessment, viele Rahmenwerke** ("answer once, comply many"): Antworten hängen logisch am framework-neutralen **Kontroll-Knoten** (`control_node`), nicht am Framework. Projektion in Framework-Sichten erfolgt über Mapping mit **Relationstyp + Stärke** (STRM/NIST IR 8477, OSCAL Control Mapping Model).
2. **Ehrliche Vererbung:** Nur `equal` (und Anker-seitiges `superset`) rechtfertigt volle Projektion. `subset`/`intersects` projizieren maximal **"teilweise"**. Kein falsches 100 %-Grün. (Fortführung des Inheritance-Gate-Fixes d5ea76d und des Sibling-Bleed-Guards.)
3. **Status ist abgeleitet, nicht behauptet:** Effektiver Kontroll-Status = f(Antwort, Evidence-Frische, ggf. Test-Ergebnis). "Grün ohne Nachweis" wird sichtbar gemacht (KPI `no_data`-Prinzip gilt überall).
4. **Traceability wie OSCAL:** Roadmap-Maßnahme → Treatment → Risiko → Gap → Finding → Antwort → Kontrolle → Knoten → Katalog ist lückenlos rückverfolgbar. Reports sind ausschließlich **Sichten auf dieselben Tabellen**, nie eigene Datenhaltung.
5. **Eine Fristen-Engine für alles:** Incident-Meldeketten (NIS2 24h/72h/30T, DORA 24h/4h/72h/1M, DSGVO 72h), DSAR-1-Monat, KRITIS-2-Jahres-Nachweis, TISAX-3-Jahre, Dokument-Reviews, Leitungsschulungs-Zyklen — alle laufen über **eine** zentrale Deadline-Tabelle + einen Berechnungs-/Reminder-Dienst.
6. **Kein Verstecken, Kökten çözüm:** Probleme werden in der Datenschicht gelöst, nie per Anzeige-Filter kaschiert.
7. **Selbst-gehostet bleibt Kernversprechen:** düz Postgres + Express, RLS via `withClaims`, keine Cloud-Abhängigkeit. Alle neuen Features müssen in diesem Modell funktionieren.

---

## 2. Gesamtdatenmodell (Soll)

### 2.1 Schichtenübersicht

```
GLOBAL (read-only, USING(true) für authenticated)
  frameworks ─┬─ controls ──┬─ control_node_member ── control_node   ← Knoten-Modell (SSOT Mapping)
              │             ├─ control_mapping (NEU: relation+strength)
              │             ├─ control_iso  (LEGACY, nur Fallback bis Migration fertig)
              │             ├─ control_risk / risk_control ── risks
              │             └─ iso_canonical (LEGACY-Hub-Kanon)
TENANT (RLS: tenant_id = COALESCE(get_org_owner_id(auth.uid()), auth.uid()))
  company_profiles · services · assets · dependencies
  answers ── answer_evidence ── evidence (NEU)
  maturity_targets (NEU) · risk_config (NEU: Appetite/Akzeptanz)
  treatments/SoA (heute user_tool_data → Ziel: eigene Tabellen, mind. org-scoped)
  roadmap_items · implementation_status
  audits · audit_findings · improvement_items
  incidents · incident_checklist_items
  compliance_deadlines (NEU: zentrale Fristen) · frist_notification_log
  kpi_snapshots (NEU)
  user_tool_data (verbleibt für persönliche/leichte Tool-Daten)
```

### 2.2 Kontroll-Knoten-Modell v2 — Relationstyp + Stärke

**Ist:** `control_node(node_id, label, meta)` + `control_node_member(node_id, framework, control_id)` — strikt same-as, 333 Knoten / 993 Mitglieder. Kein Relationstyp, keine Stärke. DDL liegt **nur** in `db/seeds/overrides.sql:10530 ff.` und am Ende von `db/schema.sql` (Z. 55233 ff.), **nicht** als versionierte Migration.

**NODE-ONLY seit Commit ee061e1 (2026-07-19):** Die Cross-Framework-**Projektion** läuft AUSSCHLIESSLICH über `control_node_member` (+ `control_mapping`, sobald befüllt). Nicht-geknotete Kontrollen sind **unabhängig** (keine Vererbung) — es gibt KEINEN `control_iso`-Fallback und KEINEN ISO-Selbstanker mehr. Kein Framework ist Hub/Pivot. Die `control_iso`-DATEN bleiben in der DB, werden aber nur noch für Anzeige/Severity (AuditWorkbench-Familien) und den ZOK-Maßnahmenkatalog (treatmentEngine) gelesen — NICHT für die Projektion. Details: `docs/architektur/node_only_engine_spec.md`.

**Soll:**

```sql
-- (a) Mitgliedschaft bleibt strict-same-as ("equal"):
control_node(node_id text PK, label text, meta jsonb, created_at)
control_node_member(node_id FK, framework, control_id,
                    PRIMARY KEY (framework, control_id))
-- Ein Mitglied im Knoten BEDEUTET relation='equal' zum Knoten. Punkt.

-- (b) NEU: partielle/gerichtete Beziehungen als eigene Tabelle (STRM/OSCAL):
CREATE TABLE control_mapping (
  id bigserial PRIMARY KEY,
  source_framework text NOT NULL,
  source_control_id text NOT NULL,
  -- Ziel ist ENTWEDER ein Knoten ODER eine konkrete Kontrolle:
  target_node_id text NULL REFERENCES control_node(node_id),
  target_framework text NULL,
  target_control_id text NULL,
  relation text NOT NULL CHECK (relation IN
    ('equal','subset-of','superset-of','intersects-with')),
  strength smallint NOT NULL DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
  rationale text,                       -- STRM: Begründung, auditierbar
  source text NOT NULL DEFAULT 'curated', -- curated | tfidf_opus | import
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (source_framework, source_control_id)
    REFERENCES controls(framework, id) ON DELETE CASCADE,
  CHECK (num_nonnulls(target_node_id, target_control_id) = 1)
);
CREATE INDEX ON control_mapping (source_framework, source_control_id);
CREATE INDEX ON control_mapping (target_node_id);
```

**Semantik der Projektion (verbindlich):**

| Relation (Quelle→Anker) | Anker-Antwort "ja" projiziert als | "teilweise" | "nein" |
|---|---|---|---|
| Mitgliedschaft im Knoten (= `equal`) | **ja** (voll) | teilweise | nein |
| `superset-of` (Anker umfasst Quelle ganz) | **ja** | teilweise | nein |
| `subset-of` (Anker deckt Quelle nur teilweise) | **teilweise** (Deckel) | teilweise | nein |
| `intersects-with` | **teilweise** (Deckel) | teilweise | nein |
| kein Mapping | keine Projektion (ehrlich offen) | — | — |

- `na` wird **nie** vererbt (framework-spezifische Entscheidung).
- Mehrere Anker: `equal`-Anker gewinnen per LWW untereinander; sind **nur** partielle Anker vorhanden, ist das Maximum der Projektion "teilweise".
- Directionality: `subset-of`/`superset-of` invertieren beim Rückwärts-Traversieren.
- `control_iso` bleibt bis zum Migrationsabschluss read-only Fallback und wird danach **entfernt** (bzw. als `control_mapping`-Zeilen mit `relation='intersects-with', source='import_iso'` importiert, wo kein Knoten existiert).
- OSCAL-Kompatibilität: `relation` ist 1:1 auf OSCAL (`equivalent-to`, `subset-of`, `intersects-with`) abbildbar → Export möglich.

### 2.3 Evidence / Nachweis-Modell (NEU)

**Ist:** `answers.evidence` ist ein Freitextfeld. Kein Typ, keine Gültigkeit, keine Datei, keine Wiederverwendung, keine Frische.

**Soll:**

```sql
CREATE TABLE evidence (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  title text NOT NULL,
  kind text NOT NULL CHECK (kind IN
    ('document','screenshot','log','ticket','attestation','link','other')),
  storage_path text NULL,     -- /storage-Bucket 'evidence'
  external_url text NULL,
  description text,
  collected_at timestamptz NOT NULL DEFAULT now(),
  valid_until date NULL,      -- Frische: NULL = zeitlos
  collected_by uuid,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE answer_evidence (       -- n:m — Reuse über Frameworks hinweg!
  evidence_id uuid REFERENCES evidence(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  framework text NOT NULL,
  control_id text NOT NULL,
  PRIMARY KEY (evidence_id, framework, control_id)
);
```

- **Evidence-Reuse via Knoten:** Hängt eine Evidence an einer Kontrolle, gilt sie automatisch als Nachweis für alle Ko-Mitglieder desselben Knotens (Anzeige "geerbter Nachweis" mit Quelle) — analog zur Antwort-Projektion, gleiches Deckel-Prinzip bei partiellen Mappings.
- **Freshness-Ampel:** `valid_until` speist die zentrale Fristen-Engine (Kategorie `evidence_review`). Abgelaufene Evidence degradiert den abgeleiteten Status: `ja` + abgelaufene/fehlende Pflicht-Evidence → Anzeige "ja (Nachweis fällig)" und KPI-Abzug — **kein** stilles Grün.
- `answers.evidence` (Text) bleibt als Kurz-Notiz erhalten, wird aber in UI als "Notiz" umbenannt; echte Nachweise laufen über die Tabelle.
- Storage: neuer Bucket `evidence` in `api/src/storage.js` (12-MB-Grenze wie company-logos, RLS-Prüfung über tenant-prefix im Pfad).

### 2.4 Maturity-Overlay (Reifegrad)

**Ist — zwei getrennte Welten, die nichts voneinander wissen:**
1. `answers.reifegrad` (smallint 0–5, CHECK, schema.sql:5695) + `REIFEGRAD_LABELS` in assessmentEngine — vom Nutzer je Kontrolle erfassbar, `frameworks.uses_maturity`-Flag existiert.
2. `maturityEngine.computeMaturityScore()` — **abgeleitete Pseudo-Reife** aus Impl-Status (ja=5 P., teilweise=2,5 P.), NIS2-Katalog-gebunden (nis2Domains, controlMetadata).

**Soll:**
- **SSOT:** Für Frameworks mit `uses_maturity=true` (TISAX, NIST CSF, BSI200_4 …) ist `answers.reifegrad` die Wahrheit. Die abgeleitete Punkt-Reife bleibt nur als Fallback für Frameworks ohne Reifegrad-Erfassung — und wird als "abgeleitet" gekennzeichnet.
- **Ziel-Reifegrad:** neue Tabelle `maturity_targets(tenant_id, framework, family_id NULL, target smallint 0–5)`; Default aus Framework-Registry (TISAX: 3 in allen anwendbaren; VDA-ISA-Regel). Gap = target − ist, aggregierbar Domain→Framework→Gesamt.
- **Vererbung:** Reifegrad wird über `equal`-Knoten wie der Status projiziert (LWW), bei partiellen Mappings **nicht** (Reife ist prozess-spezifisch).
- maturityEngine wird katalog-agnostisch: Input = SoAProjection **+** effektive Antworten inkl. Reifegrad + Targets; Gruppierung über `familyOf()` statt nis2Domains-Hardcode.

### 2.5 Zentrale Fristen-Engine (NEU)

**Ist:** `incidentTriggerEngine.fristStatus()` ist eine gute, geteilte **Berechnungs**-Funktion (Ampel 75/90/100 %), aber jede Frist-QUELLE lebt verstreut: Incident-Meldestufen in `user_tool_data("incident-register")`, DSAR-Monatsfrist im Datenschutz-Cockpit-Blob, KRITIS-DachG-Kette im BCM-Blob, Dokument-Fälligkeiten im DocumentLifecycle-Blob, Supplier-Reviews im SupplierCheck-Blob. Kein serverseitiger Reminder (nur `frist_notification_log` als Torso), nichts erscheint aggregiert im Dashboard.

**Soll:**

```sql
CREATE TABLE compliance_deadlines (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  kind text NOT NULL,             -- 'incident_report' | 'dsar' | 'kritis_nachweis'
                                  -- | 'evidence_review' | 'document_review'
                                  -- | 'training_cycle' | 'audit_cycle' | 'custom'
  framework text NULL,            -- NIS2/DORA/GDPR/…
  ref_table text NULL, ref_id text NULL,   -- Rückverweis (incident, evidence, doc …)
  label text NOT NULL,
  starts_at timestamptz NOT NULL,
  due_at timestamptz NULL,        -- NULL = "unverzüglich"/auf Ersuchen
  recurrence interval NULL,       -- z. B. '2 years' (KRITIS), '1 year' (Schulung)
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','done','cancelled','overdue')),
  done_at timestamptz NULL,
  meta jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX ON compliance_deadlines (tenant_id, status, due_at);
```

- **Ein Frontend-Modul `lib/deadlineEngine.ts`**: kapselt `fristStatus()` (aus incidentTriggerEngine extrahiert, dort re-exportiert für Kompatibilität), CRUD-Helfer, Recurrence-Rollover (`done` → nächste Instanz bei `recurrence`).
- **Schreiber:** IncidentManagement (Meldestufen), DatenschutzCockpit (DSAR, DSFA-Reviews), BCM (Übungen, DachG-Kette), DocumentLifecycle (Reviews), Trainings (Leitungsschulung §38 BSIG), AuditWorkbench (Audit-Zyklen, KRITIS-2-Jahres-Nachweis), Evidence (`valid_until`).
- **Server-Cron:** neuer Job in `api/src/functions/` (`deadline-reminder`, per node-cron o. ä. stündlich): SELECT fällige/75 %/90 %-Fristen → E-Mail via `lib/email.js` → `frist_notification_log` (idempotent je Schwelle). Damit bekommt `frist_notification_log` erstmals einen echten Befüller.
- **Dashboard-Kachel "Fristen":** aggregierte Sicht (nächste 14 Tage, überfällig) — eine Query statt N Tool-Blobs.
- Incident-Meldeketten: Die Instanzen aus `resolveMeldepflichten()` werden zusätzlich als `compliance_deadlines`-Zeilen materialisiert (kind='incident_report'), damit Reminder + Dashboard sie sehen. DORA-Sonderfall: Erstmeldung 4 h **nach Klassifizierung** — `starts_at` der Stufe 2 wird beim Abschluss der Klassifizierungsstufe gesetzt (Ketten-Fristen: `meta.chain_after = <stufe>`).

### 2.6 Tenant-Kern (bestätigt / präzisiert)

- **`answers`** bleibt SSOT der Assessments: `UNIQUE NULLS NOT DISTINCT (tenant_id, framework, control_id, asset_id)` (schema.sql:5716-5718 — konsistent mit useAssessment-Upsert). Spalten: antwort, reifegrad, evidence(=Notiz), note, updated_at/by, asset_id.
- **Treatments/SoA/Gap-Config** liegen heute in `user_tool_data` (user-scoped!). Ziel: mindestens **org-scoped** Persistenz (siehe Spec-Item 17) — sonst sieht Kollege B die Risikobehandlung von Kollege A nicht.
- Legacy-Tabellen `assessment_answers`, `org_assessment_answers`, `class_assessment_answers` sind Alt-/Kurs-Kontext → archivieren/entfernen (Spec-Item).

---

## 3. Die 7 Schritte end-to-end (Soll-Verhalten)

Verbindliche Definition: `web/src/config/phaseGroups.ts` → `PHASE_GROUPS_V2` (7 Schritte, PDCA-getaktet). Der Kommentar "8-phase pipeline" (Z. 2) ist zu korrigieren. Kanonische Referenz: PDCA ↔ ISO-Klauseln 4–10 (research_workflow §1.1).

### Schritt 1 — Scope & Kontext (`/context`, Plan, ISO Kl. 4)
- **Zweck:** Geltungsbereich, interessierte Parteien, aktivierte Frameworks, KRITIS-Subsektoren, Unternehmensprofil.
- **Input:** Nutzer-Eingaben; `companyTemplates` (Branchen-Presets Kommune/Stadtwerk/KH).
- **Output:** `company_profiles` (scope, `enabled_frameworks[]`, `kritis_sub_sectors[]`) → steuert ALLE Folgeschritte (Katalog-Auswahl, Meldepflicht-Auflösung, Dokument-Matrix).
- **Engines/Hooks:** `controlScope`, `scopeReport`; FrameworkContext + `frameworkBus.emitFrameworksUpdated` bei Änderung.
- **Soll:** unverändert solide. Ergänzung: Profilwechsel triggert Re-Validierung der SoA-Anwendbarkeit (Framework raus → betroffene Deadlines `cancelled`).

### Schritt 2 — Inventar (`/inventory`, Plan, Grundschutz-Strukturanalyse)
- **Zweck:** Services/Assets/Dependencies + Kritikalität (Schutzbedarfs-Analogie), ZOK-Zuordnung.
- **Input:** CSV/REST/Connector-Import, manuelle Pflege. **Output:** `services`, `assets` (inkl. `zok_ids`), `dependencies`, Kritikalitäts-Ergebnisse.
- **Engines:** `criticalityEngine` (gewichtete Formel, Overrides), `inventoryReport`, `zokResolver` (ZOK→Maßnahmen/Risiken).
- **Soll:** unverändert; SPOF-Signal (inbound ≥ 3) fließt weiter in Risk/Roadmap. Assets liefern die `asset_id`-Dimension der `answers`.

### Schritt 3 — Gap-Analyse / Assessment (`/assessment`, Plan, Grundschutz-Check)
- **Zweck:** Soll-Ist je Kontrolle (`ja|teilweise|nein|na`) + Reifegrad + Nachweis, org- und asset-scoped.
- **Input:** Katalog (`controls` + Knoten + Mappings) + `answers`. **Output:** effektive Antworten (`EffectiveAnswer` mit origin explicit/inherited/empty), FrameworkStats.
- **Engines/Hooks:** `useAssessment` (Laden paginiert, debounced Upsert 700 ms), `assessmentEngine.projectAnswer/buildAnchorAnswerMap/computeStats`, `familyOf/subFamilyOf` (Gruppierung).
- **Soll-Änderungen (Kern dieser Architektur):**
  1. Projektion wird **relations-bewusst** (§2.2-Tabelle): `projectAnswer` erhält je Anker den Relationstyp; partielle Anker deckeln auf "teilweise"; `EffectiveAnswer` bekommt `projectionQuality: "full" | "partial"` + `inheritedFrom` mit Relationsangabe (Tooltip: "geerbt von BSI OPS.1.1.2, Teilüberdeckung").
  2. Sibling-Bleed-Guard (assessmentEngine.ts:104-109) bleibt unverändert bestehen.
  3. Evidence-Verknüpfung (§2.3) direkt im Assessment-Panel (Anhängen, geerbte Nachweise sichtbar).
  4. `useFrameworkInheritance` (off/preview/applied) wird entweder tatsächlich in die Projektion verdrahtet (off ⇒ nur explizite Antworten zählen) oder entfernt — heute dokumentiert der Hook "worst wins", die Engine macht LWW: Doku und Wirkung müssen übereinstimmen.

### Schritt 4 — Risikoanalyse (`/decision`, Plan, ISO Kl. 6 / 200-3)
- **Zweck:** Gaps → Risiken, qualitative Matrix (konfigurierbar n×m, multiply/sum/max), Behandlung.
- **Input:** effektive Antworten (nein/teilweise) + Inventar. **Output:** `RiskObject[]` (Score, Level, Katalog-Risiken via ZOK), `TreatmentObject[]` (mitigate/accept/transfer/avoid, Owner, Due, Status).
- **Engines/Hooks:** `useRiskAnalysis` (baut Findings/Gaps direkt aus `controls`+`answers` — katalog-agnostisch, richtig so), `riskEngine.generateRisks`, `treatmentEngine.generateTreatmentPlan`, `treatmentQuickWins`, `soaRiskLinkage`.
- **Soll-Änderungen:**
  1. **Inherent vs. Residual:** RiskObject erhält `inherent_score` (heute berechneter Score) + `residual_score` (nach Treatment-Wirkung: done-Maßnahmen senken Likelihood/Impact um konfigurierten Faktor). Reports zeigen beide.
  2. **Risk-Appetite/Akzeptanzkriterien:** `risk_config`-Tabelle (tenant): Matrix-Konfiguration (heute im Tool-Blob) + `acceptance_max_level` je Kategorie; `accept`-Strategie oberhalb der Schwelle verlangt Begründung + Owner (Gate).
  3. Der legacy `gapEngine.runGapAnalysis` (statisch an nis2Controls/controlMetadata gebunden) wird durch den katalog-agnostischen Builder aus `useRiskAnalysis` ersetzt (in gapEngine v2 extrahiert) — **eine** Gap-Pipeline statt zwei.
  4. Quantitativ (FAIR-light) nur als optionales P2-Overlay (€-Bänder je Risiko), kein Pflichtteil.

### Schritt 5 — SoA & Roadmap (`/roadmap`, Do, ISO Kl. 6.1.3d + POA&M)
- **Zweck:** Statement of Applicability (anwendbar j/n + Begründung + Umsetzungsstatus + Risiko-Verweis) und Now/Next/Later-Maßnahmenplan.
- **Input:** Katalog + effektive Antworten + Treatments + Risiko-Verknüpfung. **Output:** `SoAProjection` (SSOT für Schritt 5–7 + Dashboard), `roadmap_items`.
- **Engines/Hooks:** `soaProjection.buildSoAProjection` (Merge-Präzedenz Saved > Treatment > Assessment > Katalog — gutes Design, beibehalten), `soaGenerator` (PDF/Word), `roadmapEngine.computePhase` (now/next/later aus Risiko+Deadline), `bundleEngine` (Bündelung), `useBundleOwners`, `useRoadmapItems`.
- **Soll-Änderungen:**
  1. `soaProjection` von NIS2-Typen entkoppeln (`ComplianceStatus`/`ControlQuestion` aus nis2Controls → generische Katalog-Typen), damit die SoA für jedes Framework-Set korrekt ist.
  2. `bundleEngine.getIsoRefForControl` → `getNodeRefForControl` (Knoten-zuerst, ISO-Fallback) — Bündel folgen dem Knoten-Modell.
  3. Roadmap-Fälligkeiten spiegeln sich in `compliance_deadlines` (kind='custom', ref=roadmap_item) → einheitliche Overdue-Logik + Reminder.

### Schritt 6 — Umsetzung (`/implementation`, Do, ISO Kl. 8)
- **Zweck:** Abarbeitung: geteilte Tasks + Delta-Tasks je Bündel, Status offen/laufend/fertig/blockiert.
- **Engines/Hooks:** `implementationEngine.buildUmsetzungView`, `useImplementationStatus`, `executionReportGenerator`.
- **Soll:** Status-Rückfluss ist der Motor des Residual-Risikos (Schritt 4) und der KPI-Velocity. "fertig" verlangt künftig optional Evidence-Link (konfigurierbares Gate, Default aus; für KRITIS-Profile Default an).

### Schritt 7 — Audit & KVP (`/audit`, Check+Act, ISO Kl. 9–10)
- **Zweck:** internes Audit je Framework (Major/Minor), Maßnahmen zurück in Schritt 6, KVP-Register, Management-Review.
- **Engines/Hooks:** AuditWorkbench (nutzt `projectAnswer`/`buildAnchorAnswerMap` direkt — bleibt konsistent, weil dieselbe Engine), `auditReportGenerator`, `kvpReportGenerator`, `improvement_items`.
- **Soll-Änderungen:**
  1. **Management-Review-Modul** (ISO 9.3): geführtes Protokoll mit Auto-Inputs (KPI-Snapshot, Audit-Findings, Risiko-Trend, Incident-Statistik) + Entscheidungen/Ressourcen als Output → `evidence` (kind='attestation') + Deadline (kind='audit_cycle', recurrence 1 Jahr). Deckt NIS2 §38-Leitungsnachweis gleich mit ab.
  2. KRITIS-2-Jahres-Nachweiszyklus als Recurrence-Deadline aus dem Audit-Abschluss.
  3. Audit-Evidence hängt an `evidence` (nicht mehr nur Freitext im Tool-Blob).

---

## 4. Engine-Gruppen — Soll-Design

### 4.1 Assessment / Mapping / Inheritance
- **`assessmentEngine.ts` bleibt das Herz** — pur, unit-testbar. Erweiterung: Anker-Auflösung liefert `{anchorId, relation, strength}` statt `string[]`; Projektions-Deckelung nach §2.2; `EffectiveAnswer.projectionQuality`.
- **`useAssessment`** lädt zusätzlich `control_mapping`; `anchorsBySpokeControl` wird `Map<key, AnchorRef[]>`. Knoten ersetzen ISO-Anker weiterhin vollständig (Zeile 186-189 heute korrekt).
- **`mappingEngine.ts` wird GELÖSCHT:** null Importe im gesamten `web/src` (verifiziert), eigener In-Memory-Katalog (iso27001/nis2-TS-Daten) und eigene MappingType-Semantik (`equivalent/superset/subset/partial`) konkurrieren mit dem DB-Modell. Seine **Relations-Semantik** lebt in `control_mapping` (DB) + assessmentEngine weiter — die Datei selbst ist toter Zwilling.
- **`useFrameworkInheritance`**: verdrahten oder entfernen (siehe Schritt 3). Empfehlung: verdrahten als globaler Schalter `off` (nur explizit) / `applied` (Projektion aktiv, Default); `preview` entfällt — die Origin-Badges machen Preview überflüssig.
- **`useComplianceOverview`** bleibt dünner Konsument von assessmentEngine (heute korrekt hub-agnostisch).

### 4.2 Gap-Engine
- **Eine** Pipeline: Findings (Antwort nein/teilweise, org+asset) → Konsolidierung nach (scope, asset, capability) → ConsolidatedGap mit Severity aus `muss`+Antwort. Implementierung = heutiger Builder aus `useRiskAnalysis.buildFindingsAndGaps`, extrahiert als `gapEngine v2` (katalog-agnostisch über `capabilityFor`).
- Der alte statische Pfad (nis2Controls/controlMetadata/zokCatalog-gebundene Teile von gapEngine.ts) bleibt nur, soweit die Radar-/ZOK-Auswertung (byAssetClass/byAssetSubClass) ihn braucht — diese Aggregationen werden in v2 übernommen, die Text-Generatoren (generateRiskText mit NIS2-Bußgeld-Prosa) werden framework-sensitiv (`frameworkFlags.neutralizeNis2Text`).

### 4.3 Risk-Engine (qualitativ + quantitativ)
- Qualitativ: konfigurierbare Matrix bleibt (`riskEngine` ist solide). Neu: `inherent/residual` (§3, Schritt 4), `risk_config`-Persistenz org-scoped, Akzeptanz-Gate.
- Quantitativ (P2): FAIR-light-Overlay `riskQuantEngine.ts` — je Risiko optionale Felder `lef_min/likely/max`, `lm_min/likely/max (€)`, einfache 3-Punkt-Monte-Carlo (10k Draws, im Client machbar) → Verlust-Band €; ausschließlich additiv, kein Ersatz der Matrix.

### 4.4 Maturity-Engine
- Wie §2.4: echtes `answers.reifegrad` als SSOT bei `uses_maturity`-Frameworks; abgeleitete Punkt-Reife klar als "abgeleitet" gelabelt; `maturity_targets` mit Gap-Berechnung; katalog-agnostische Gruppierung via `familyOf`. NIS2-Artikel-Sicht (`computeNis2ArticleMaturity`) bleibt als NIS2-spezifische Zusatzsicht.

### 4.5 Roadmap / Treatment
- `treatmentEngine` + `roadmapEngine` bleiben; Persistenz der Treatments wandert von `user_tool_data` in org-scoped Speicher (Tabelle `treatment_state(tenant_id, data jsonb)` als pragmatische Stufe 1; normalisierte Tabellen Stufe 2).
- `computePhase` erhält Fristen aus `compliance_deadlines` (statt nur item.due_date), Ausgabe unverändert now/next/later.

### 4.6 SoA
- `buildSoAProjection` bleibt SSOT; Entkopplung von NIS2-Typen; `soaGenerator` (PDF/Word) unverändert; SoA-Begründungspflicht bei Ausschluss anwendbarer Kontrollen mit High-Risk-Link (`is_risky_exclusion`) wird zum harten Warn-Gate im Export ("SoA enthält 3 riskante Ausschlüsse ohne Begründung").

### 4.7 Incident / Fristen
- `incidentTriggerEngine.resolveMeldepflichten` bleibt die deterministische Auflösung ("unbekannt"="ja" — Fristen laufen; nicht-ausgelöst mit Begründung = prüffest). Neu: Materialisierung in `compliance_deadlines` + Ketten-Fristen (DORA 4h nach Klassifizierung) + Server-Reminder (§2.5).
- `fristStatus/ablaufendeFristen` ziehen um nach `deadlineEngine.ts` (Re-Export am alten Ort für Kompatibilität).

### 4.8 KPI
- `kpiEngine` v3 (9 KPIs, Board/Tracking, `no_data`-Prinzip) bleibt fachlich. Neu: **`kpi_snapshots`-Tabelle** (tenant_id, taken_at, metrics jsonb) statt Snapshot im Tool-Blob → Trends überleben Gerätewechsel, Management-Review kann historisch zitieren; Cron kann wöchentlich automatisch snapshotten (gleicher Job wie Reminder).
- Neue KPI-Kandidaten aus dieser Architektur: `evidence_freshness_pct` (Nachweise gültig / Pflicht-Nachweise), `deadline_adherence_pct` (Fristen fristgerecht erledigt), `control_efficiency` (Kontrollen, die >1 Framework bedienen — Crosswalk-Hebel).

### 4.9 Reporting
- **Eine Render-Route:** `reportHtmlLayout`/`reportKit` (HTML→PDF/Word). Die Legacy-direct-draw-Generatoren (`riskReportPdf/Word`, `gapReportGenerator/Word/Excel`) werden entfernt, sobald Feature-Parität der HTML-Route je Report verifiziert ist. XLSX bleibt über exceljs.
- Alle Reports lesen ausschließlich aus den SSOT-Strukturen (SoAProjection, RiskAnalysisResult, KPIResult, compliance_deadlines, evidence) — Regel: **kein Report berechnet selbst**.
- Berichte-Prinzip bleibt: erst In-App-Vorschau, dann Druck/PDF; Branding aus Config; `REPORT_PRINT_CSS`-Seitenumbrüche.

---

## 5. Standalone-Werkzeuge — Soll + Andockpunkte an die 7 Schritte

| Werkzeug | Soll-Zustand | Andockpunkt |
|---|---|---|
| **Dashboard** | Live-Cockpit: useComplianceOverview + KPI (aus kpi_snapshots) + **neue Fristen-Kachel** + Evidence-Frische | konsumiert Schritt 3/4/5/7-SSOTs |
| **Policies** | bleibt; Policy-Freigabe erzeugt `evidence` (kind='document') + Review-Deadline (kind='document_review') | Nachweise für Schritt 3/7 |
| **Trainings** | bleibt; Leitungsschulung (NIS2 §38 / AI-Act Art. 4) als Recurrence-Deadline + Abschluss = evidence('attestation') | Schritt 7 (Governance-Nachweis), KPI |
| **Incidents** | Meldeketten → compliance_deadlines; Abschlussbericht = evidence; Incident-Statistik speist Management-Review + KPI (MTTR) | Schritt 7, Fristen-Engine |
| **Documents** | 142×17-Matrix bleibt; Fälligkeiten → compliance_deadlines; "Dokument aktuell" = evidence-Referenz | Schritt 3 (Nachweise), 7 |
| **Procurement** | bleibt self-contained; Freigabe-Ergebnis optional als evidence an A.5.19 ff.-Knoten | Schritt 3 (Lieferanten-Kontrollen) |
| **Suppliers** | Review-Zyklus → compliance_deadlines; Risiko-Score kann als manuelles Risiko in Schritt 4 übernommen werden (Button "ins Risikoregister") | Schritt 4 |
| **TPRM** | DORA-RoI bleibt (ESA-Template-CSV); Jahres-Übermittlung als Recurrence-Deadline; Konzentrationsrisiko → Risikoregister-Übernahme | Schritt 4, Fristen |
| **Datenschutz-Cockpit** | VVT/DSFA bleibt; DSAR-Monatsfrist + 72h-Breach über compliance_deadlines; DSFA-Ergebnis = evidence | Schritt 4 (DSFA=Risikoanalyse), Fristen |
| **BCM** | BIA/RTO/RPO bleibt; Übungen + DachG-Kette (D80→D82) über compliance_deadlines; Übungsprotokoll = evidence | Schritt 3 (BCM-Kontrollen), 7 |
| **KI-Governance** | Register bleibt; AI-Act-Stichtage (12/2027, 08/2028) als Deadlines; Klassifizierungs-Doku = evidence | Schritt 1 (Scope), Fristen |
| **AuditWorkbench** | wird Teil von Schritt 7 (heute schon); + Management-Review-Modul | Schritt 7 |

**Gemeinsames Muster:** Jedes Werkzeug behält seine Register-Hoheit (useToolData bzw. künftig org-scoped), docken aber über genau **drei** Schnittstellen an die Pipeline an: (1) `compliance_deadlines` für alles mit Frist, (2) `evidence` für alles Nachweisbare, (3) optional Risiko-Übernahme in Schritt 4. Keine Parallel-Wahrheiten.

---

## 6. API-/Backend-Ergänzungen

1. **Scheduler:** `api/src/jobs/scheduler.js` (node-cron): stündlich `deadline-reminder`, wöchentlich `kpi-snapshot`. Läuft mit `asService` (BYPASSRLS bewusst, tenant-iterierend).
2. **Storage:** Bucket `evidence` (analog company-logos), Pfad-Konvention `evidence/<tenant_id>/<uuid>`; Zugriffskontrolle im storage.js über Claims.
3. **`/realtime`-SSE-Stub:** Entscheidung treffen — minimale echte Implementierung (Postgres LISTEN/NOTIFY auf answers/compliance_deadlines → SSE-Broadcast) ODER Endpoint entfernen und Client-Polling als offizielles Muster dokumentieren. Empfehlung: entfernen (P2), Polling reicht für die Zielgruppe; SSE-Torso ist irreführend.
4. **Gateway:** kein Embed nötig, solange Hooks selbst joinen; bei Evidence-Listen ggf. eine RPC `evidence_for_controls(control_keys text[])` zur Query-Reduktion.

---

## 7. Migrations-/Übergangsstrategie (Legacy → Ziel)

**Phase A — Fundament (ohne Verhaltensänderung):**
Knoten-DDL in echte Migration; `control_mapping`-Tabelle leer anlegen; `evidence`/`answer_evidence`/`compliance_deadlines`/`kpi_snapshots`/`maturity_targets` anlegen; mappingEngine.ts + PhaseStub.tsx + stale Kommentare löschen.

**Phase B — Ehrliche Projektion:**
assessmentEngine relations-bewusst (solange `control_mapping` leer ist, verhält sich alles exakt wie heute — Knoten=equal, control_iso-Fallback unverändert). Danach: kuratierte partielle Mappings einspielen (Quelle: bestehende TF-IDF+Opus-Pipeline, aber mit relation+strength+rationale), control_iso-Zeilen frameworkweise ablösen. Abschluss-Kriterium je Framework: 100 % der Kontrollen haben Knoten ODER explizites Mapping ODER sind als "spezifisch/kein Mapping" markiert → dann control_iso-Fallback für dieses Framework abschalten (Flag in `frameworks.meta`).

**Phase C — Evidence & Fristen:**
Tools nacheinander an compliance_deadlines/evidence andocken (Reihenfolge: Incidents → Datenschutz → Documents → BCM → Trainings → Suppliers/TPRM). Cron aktivieren. Dashboard-Kachel.

**Phase D — Konsolidierung:**
Gap-Pipeline vereinigen, Maturity-Overlay, Report-Legacy entfernen, Treatments org-scoped, Residual-Risk, Management-Review.

**Rollback-Sicherheit:** Jede Phase ist additiv; control_iso wird erst gelöscht, wenn Phase B je Framework abgenommen ist (Vergleichs-Report Ist-Projektion vs. Neu-Projektion, Abweichungen = 0 für equal-only-Bestand).

---

*Ende ARCHITECTURE.md — Arbeitspakete: siehe IMPLEMENTATION_SPEC.md.*
