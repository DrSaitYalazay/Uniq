# CyberWerkSuite — Marktreife Engine-Architektur (Zielbild „verkaufbar")

**Stand:** 2026-07-18 · **Autor:** Chef-Architekt (Fable5)
**Repo:** `/Users/sekercakil/Downloads/ClaudeCWS` · **Basis:** `research_marketgrade_engines.md` (Formeln/Markt), `engine_gap.md` (Ist-Schwächen), `ARCHITECTURE.md` (Soll-Datenmodell) + Code-Review der realen Engines (`web/src/lib/*`).
**Benchmark-Niveau:** Vanta/Drata (abgeleiteter Control-Status), RiskLens/SAFE (FAIR + LEC + Portfolio), Hyperproof (Evidence-Lebenszyklus), OneTrust (gewichtete Rollups + Benchmark).

---

## 0. Rahmen, Umsetzungsklassen, Verifikations-Doktrin

### 0.1 Umsetzungsklassen (jede Engine ist klassifiziert)

| Klasse | Bedeutung | Regel für Opus |
|---|---|---|
| **A-SICHER** | rein additiv: neue Datei / neue Tabelle / neue Funktion; kein bestehender Codepfad ändert Verhalten | direkt bauen, Fixture beweist die neue Formel |
| **B-KERN** | ändert eine Kern-Engine (assessmentEngine, riskEngine, gapEngine, maturityV2, kpiEngine) — **muss bei Default-Konfiguration byte-identisch zum Ist rechnen** (leere Tabelle / Flag off / Faktor 1.0 ⇒ heutige Zahlen) | Golden-Master-Fixture VOR der Änderung erzeugen, NACH der Änderung diffen (Vorbild: `db/tools/projection_diff.mjs`) |
| **C-RUNTIME** | Server-Seite: Cron/Scheduler, Test-Runner, Konnektoren, Aggregations-Jobs (`api/src/jobs/`) | separat deploybar, Engine funktioniert auch ohne (Status dann `no_data`, nie falsches Grün) |

### 0.2 Verifikations-Doktrin (esbuild prüft keine Typen!)

Der Deploy-Build ist esbuild-only ⇒ **die einzige Qualitätsschranke sind ausführbare Fixtures**. Verbindlich für jede Engine in diesem Dokument:

1. `web/src/lib/__fixtures__/<engine>.fixture.mjs` — reine node-Skripte (`node <file>` exit 0/1), importieren die Engine über esbuild-Bundle oder direkt (Engines sind pure TS ohne DOM — via `npx esbuild --bundle --platform=node` in temp-Datei, Muster existiert für assessmentEngine-Tests).
2. Jede Formel in diesem Dokument hat im zugehörigen Abschnitt **mindestens ein Zahlenbeispiel** — genau diese Zahlen sind der Fixture-Sollwert.
3. Monte-Carlo-Engines sind **seedbar** (mulberry32 existiert bereits, riskQuantEngine.ts:54) ⇒ deterministische Assertions mit Toleranz (Perzentile ±1 % relativ bei N=20 000).
4. B-KERN: zusätzlich Identitäts-Fixture — „Default-Konfig ⇒ Ausgabe deep-equal zur alten Funktion" (alte Funktion bleibt exportiert, bis das Identitäts-Fixture grün ist und die UI umgestellt wurde).

### 0.3 Bereits vorhandenes Fundament (nicht neu bauen!)

Diese Migrationen existieren bereits in `db/migrations/` und sind teils **leer/ungenutzt** — die neuen Engines docken daran an:

- `20260717000002_control_mapping.sql` — relation ∈ {equal, subset-of, superset-of, intersects-with} + `strength 1..10` + `rationale` + `source` (leer)
- `20260717000003_evidence.sql` — `evidence` + `answer_evidence` (n:m)
- `20260717000004_compliance_deadlines.sql`, `..05_maturity_targets`, `..06_kpi_snapshots`
- `20260717000008_control_tests.sql` — `control_tests` + `control_test_results` (status pass/fail/error/na, `evidence_id`, `detail jsonb`) — **leer, genau der Vanta/Drata-Unterbau**
- riskQuantEngine.ts — sauberes PERT/Beta-Sampling (Marsaglia-Tsang) + mulberry32: `sampleGamma/sampleBeta/samplePert` werden **exportiert und wiederverwendet** (heute `function`-lokal → in Schritt E1 exportieren).

---

## E1 · Quantitative Risk-Engine (FAIR voll) — `fairEngine.ts`

**Klasse: A-SICHER** (neue Datei; riskQuantEngine.ts bleibt als „FAIR-light"-Schnellpfad bestehen und re-exportiert die Sampler).
**Reife: 2 → 5.** Verkaufsargument Nr. 1 Richtung CFO/Vorstand: „Gesamt-Exposure in €, Loss-Exceedance-Kurve, Risiko-Appetit als prüfbare Kurve."

### E1.1 Zielverhalten

1. Jedes Risiko kann (optional) ein **FAIR-Szenario** tragen: entweder light (LEF/LM 3-Punkt, heutiger Stand) oder voll zerlegt (TEF×Vuln, LM in 6 Verlustformen primär/sekundär).
2. Output je Szenario: ALE-Verteilung (Min/Mean/P10/P50/P90/Max) **+ Loss-Exceedance-Kurve (LEC)**.
3. **Portfolio-Aggregation** über alle Szenarien mit Korrelation über gemeinsame Treiber (Vendor/Asset/Control) → Portfolio-LEC („Was ist unsere Gesamt-Exposure p. a.?").
4. **Risk-Appetite als Toleranzkurve** über der LEC; Breach-Segmente werden berechnet, nicht nur angezeigt.
5. Alles seedbar, deterministisch, pure (kein DB-Zugriff in der Engine — Laden/Speichern macht der Hook).

### E1.2 Rechenbaum & Formeln (pro Iteration i, N default 20 000)

```
TEF_i  = CF_i × PoA_i                    (oder TEF direkt 3-Punkt, wenn CF/PoA nicht erfasst)
Vuln_i = direkt 3-Punkt  ODER  1{TCap_i > RS_i}   (zwei PERT-Ziehungen vergleichen)
LEF_i  = TEF_i × Vuln_i
PL_i   = Σ_f PERT(primary[f])            f ∈ {productivity, response, replacement, fines, competitive, reputation}
SLM_i  = Σ_f PERT(secondary[f])
LM_i   = PL_i + SLEF_i × SLM_i           (SLEF ∈ [0,1], PERT-gezogen — bedingter Sekundärverlust)
ALE_i  = LEF_i × LM_i                    (geklemmt auf ≥ 0)
```

**BetaPERT mit Konfidenz-λ** (Erweiterung von `samplePert`, riskQuantEngine.ts:112):
```
λ(conf) = { low: 2, medium: 4 (Default = heutiges Verhalten), high: 8 }
α = 1 + λ·(mode−min)/(max−min) ;  β = 1 + λ·(max−mode)/(max−min)
```

**LEC-Konstruktion** aus den N sortierten ALE-Samples:
```
grid   = 60 log-spaced Punkte von max(1, P01) bis Max
LEC(x) = #{ALE_i > x} / N            (komplementäre CDF; binäre Suche im sortierten Array)
```

**Risk-Appetite-Kurve:** Nutzer definiert Stützpunkte `[{loss_eur, max_annual_prob}]` (z. B. „>1 Mio € höchstens 1 %"). Zwischen Stützpunkten log-linear interpolieren. `breaches = [{from_eur, to_eur, lec_p, appetite_p}]` überall, wo `LEC(x) > appetite(x)`.

### E1.3 Portfolio-Aggregation mit Korrelation (Iman-Conover)

Copulas mit inverser Beta-CDF sind für den Client zu schwer — **Iman-Conover-Rang-Reordering** ist der implementierbare Industriestandard und braucht nur Sortieren:

1. Simuliere jedes Szenario s unabhängig → `ALE_s[0..N-1]` (eigener Seed = `baseSeed + hash(scenarioId)`).
2. Ziel-Rangkorrelation: Szenarien in derselben `correlation_group` (gemeinsamer Treiber: Vendor-/Asset-/Control-ID) bekommen paarweise ρ (Default 0.6, konfigurierbar); gruppenübergreifend ρ=0.
3. Erzeuge Korrelations-Scores: je Gruppe g ein gemeinsamer Normal-Vektor `Z_g[i]`, je Szenario `ε_s[i]`; Score `y_s[i] = √ρ·Z_g[i] + √(1−ρ)·ε_s[i]` (Normal via Box-Muller, existiert in sampleGamma).
4. **Reordering:** sortiere `ALE_s` aufsteigend und ordne die Werte den Iterationen so zu, dass Rang(ALE_s[i]) = Rang(y_s[i]). (Ränge einmal argsort — O(N log N) je Szenario.)
5. `Portfolio_i = Σ_s ALE_s[i]` → Portfolio-Statistiken + Portfolio-LEC. „Fat tails" entstehen automatisch, weil korrelierte Szenarien ihre schlechten Iterationen teilen.
6. **Konzentrations-Report:** je Gruppe `groupExposure = mean(Σ_{s∈g} ALE_s[i])` → Top-Treiber-Liste („Vendor X trägt 43 % der Exposure").

Sample-Arrays je Szenario werden im Ergebnis-Objekt gehalten (Float64Array, N=20 000 ≈ 160 KB/Szenario) ⇒ Portfolio-Neuberechnung bei Kompositionsänderung ohne Re-Simulation (RiskLens-Trick, research §1.6).

### E1.4 Datenmodell (neu)

```sql
-- Migration 20260718000001_fair_scenarios.sql (tenant-RLS wie control_tests)
CREATE TABLE quant_scenarios (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  risk_id text NOT NULL,                  -- RiskObject.risk_id (deterministisch aus Gap)
  mode text NOT NULL DEFAULT 'light' CHECK (mode IN ('light','full')),
  inputs jsonb NOT NULL,                  -- FairFullInput (siehe E1.5), versioniert {v:2,...}
  correlation_group text NULL,            -- 'vendor:<id>' | 'asset:<uuid>' | 'control:<fw::id>' | frei
  updated_at timestamptz DEFAULT now(), updated_by uuid
);
CREATE UNIQUE INDEX ON quant_scenarios (tenant_id, risk_id);

CREATE TABLE quant_runs (                 -- persistierte Läufe (Management-Review zitierbar)
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  scope text NOT NULL CHECK (scope IN ('scenario','portfolio')),
  scenario_id uuid NULL REFERENCES quant_scenarios(id) ON DELETE CASCADE,
  seed int NOT NULL, draws int NOT NULL,
  stats jsonb NOT NULL,                   -- {min,mean,p10,p50,p90,max}
  lec jsonb NOT NULL,                     -- [{x,p}] 60 Punkte
  meta jsonb NOT NULL DEFAULT '{}',       -- portfolio: {groups:[{id,exposure,share}], breaches:[...]}
  ran_at timestamptz DEFAULT now()
);
-- risk_config (Tool-Blob heute) erhält: appetite_curve jsonb  [{loss_eur, max_annual_prob}]
--   und default_correlation_rho numeric DEFAULT 0.6
```

### E1.5 Kern-Signaturen

```ts
// fairEngine.ts — pure, seedbar, kein I/O
export interface Pert3 { min: number; likely: number; max: number; conf?: "low"|"medium"|"high" }
export interface FairFullInput {
  tef?: Pert3; cf?: Pert3; poa?: Pert3;          // tef ODER cf+poa
  vuln?: Pert3; tcap?: Pert3; rs?: Pert3;        // vuln ODER tcap+rs
  primary: Partial<Record<LossForm, Pert3>>;     // LossForm = 6 Formen
  slef?: Pert3; secondary?: Partial<Record<LossForm, Pert3>>;
}
export type LossForm = "productivity"|"response"|"replacement"|"fines"|"competitive"|"reputation";

export function simulateScenario(input: FairFullInput | FairInput /*light*/, draws?: number, seed?: number):
  { samples: Float64Array; stats: FairStats; lec: LecPoint[] };
export function buildLec(sortedSamples: Float64Array, points?: number): LecPoint[];    // [{x,p}]
export function aggregatePortfolio(
  scenarios: { id: string; samples: Float64Array; group?: string | null }[],
  rho?: number, seed?: number,
): { stats: FairStats; lec: LecPoint[]; groups: { id: string; exposure: number; share: number }[] };
export function evaluateAppetite(lec: LecPoint[], appetite: { loss_eur: number; max_annual_prob: number }[]):
  { ok: boolean; breaches: { from: number; to: number; lec_p: number; appetite_p: number }[] };
export function deltaAle(before: FairStats, after: FairStats): number;                 // für E7
```

### E1.6 Fixture-Akzeptanz

- `simulateScenario(light {lef 1/2/4, lm 10k/50k/200k}, 20000, 12345)` ⇒ mean ≈ 2.19 × 76.7k-Bereich; harter Sollwert: **identisch zu `simulateAnnualLoss`** mit gleichen Inputs (light-Modus delegiert 1:1 — Identitätsbeweis).
- Vuln via TCap/RS: `tcap {1,3,5}, rs {2,3,4}` ⇒ Vuln-Mittel ∈ [0.45, 0.55] (Symmetrie).
- LEC monoton fallend; `LEC(min−1) = 1`, `LEC(max+1) = 0`.
- Iman-Conover: 2 Szenarien, ρ=0.8 ⇒ Spearman-ρ der reordneten Samples ∈ [0.75, 0.85]; Portfolio-P90(ρ=0.8) > Portfolio-P90(ρ=0) (Tail-Verstärkung), Portfolio-Mean identisch ±0.5 % (Reordering ändert Ränge, nicht Werte).
- `evaluateAppetite`: konstruiertes Beispiel mit genau einem Breach-Segment, exakte Grenzen asserten.

---

## E2 · Residual-Risk multiplikativ + Control-Effectiveness — `controlEffectivenessEngine.ts` + riskEngine v2

**Klasse: neue Datei A-SICHER; Einbau in riskEngine B-KERN** (Default `residual_model:'legacy'` ⇒ `applyResidualRisk` unverändert; `'multiplicative'` aktiviert v2).
**Reife: 2 → 4.5.** Ersetzt die Auditor-Lachnummer `likelihood − 1` (riskEngine.ts:498).

### E2.1 Control-Effectiveness-Modell — eff_c ∈ [0,1]

```
eff_c = base_eff_c × impl_c × maturity_c × verify_c

base_eff_c   ∈ [0,1]  Design-Wirksamkeit der Kontrolle (Katalog-Seed, Default 0.5;
                       preventive MFA/Patching 0.7–0.8, detektiv 0.4–0.5, Policy 0.2–0.3)
impl_c        = { ja: 1.0, teilweise: 0.5, nein/empty: 0 }         (EffectiveAnswer.status)
              × { projectionQuality 'partial': 0.7, sonst 1.0 }     (geerbte Teil-Deckung zählt weniger)
maturity_c    = reifegrad != null ? 0.5 + 0.1·reifegrad  (0→0.5 … 5→1.0)  : 0.8 (unbekannt)
verify_c      = aus E3-Health: verified(Tests pass, Evidence frisch) 1.0
              | manuell belegt (Evidence frisch, keine Tests) 0.85
              | unbelegt („Grün ohne Nachweis") 0.6
              | Evidence stale / Test error 0.4
              | Test fail 0.0                                        (failing Control wirkt NICHT)
```

Ohne E3-Daten (Tabellen leer): `verify_c = 0.85` konstant ⇒ E2 funktioniert eigenständig, wird durch E3 automatisch ehrlicher.

### E2.2 Residual-Formel (getrennt nach Wirkrichtung)

Kontrollen tragen eine Wirkdimension (`dimension ∈ likelihood|impact|both`, Katalog-Seed; Default `likelihood` für preventive, `impact` für corrective/BCM). Auf der ordinalen n×m-Matrix wird der multiplikative Rest **auf den Abstand zur 1 angewandt** (skalen-ehrlich, monoton, deckelt nie unter Minimum):

```
F_L = Π_{c ∈ C_L(risk)} (1 − eff_c)        C_L = dem Risiko zugeordnete likelihood-wirksame Controls
F_I = Π_{c ∈ C_I(risk)} (1 − eff_c)        (both zählt in beiden, mit eff_c/2 je Dimension — keine Doppelwirkung)

residual_L = 1 + (inherent_L − 1) × F_L        (kontinuierlich, NICHT gerundet weiterrechnen)
residual_I = 1 + (inherent_I − 1) × F_I
residual_score = calculateRiskScore(residual_L, residual_I, cfg)   // bestehende Formel-Helper
residual_level = classifyRisk(residual_score, cfg)
```

**Zahlenbeispiel (Fixture-Sollwert):** inherent L=4, I=4 (Score 16, critical). Zwei Controls: MFA (base 0.8, ja, Reife 3, verified ⇒ eff = 0.8·1·0.8·1 = 0.64, likelihood) und Notfallplan (base 0.5, teilweise, Reife unbekannt, unbelegt ⇒ eff = 0.5·0.5·0.8·0.6 = 0.12, impact).
`F_L = 0.36 ⇒ residual_L = 1 + 3·0.36 = 2.08`; `F_I = 0.88 ⇒ residual_I = 1 + 3·0.88 = 3.64`; residual_score = 7.57 (high statt critical) — nachvollziehbar, weil der Impact-Pfad kaum abgedeckt ist. Das alte Modell hätte pauschal L=3 ⇒ 12 gerechnet.

Zuordnung Risiko↔Control: aus `soaRiskLinkage` (Treatment-Selektionen) **plus** Capability-/Knoten-Match (Controls derselben `capability_tag` des Gaps zählen als zugeordnet, mit Dämpfung 0.8 auf eff_c, weil nicht explizit verknüpft) — behebt die „unlinked obwohl offensichtlich"-Schwäche (engine_gap §8).

### E2.3 Datenmodell

```sql
-- Migration 20260718000002_control_effect.sql — GLOBAL (read-only Katalog-Layer, wie controls)
CREATE TABLE control_effect (
  framework text NOT NULL, control_id text NOT NULL,
  dimension text NOT NULL DEFAULT 'likelihood' CHECK (dimension IN ('likelihood','impact','both')),
  kind text NOT NULL DEFAULT 'preventive' CHECK (kind IN ('preventive','detective','corrective')),
  base_eff numeric NOT NULL DEFAULT 0.5 CHECK (base_eff BETWEEN 0 AND 1),
  PRIMARY KEY (framework, control_id),
  FOREIGN KEY (framework, control_id) REFERENCES controls(framework, id) ON DELETE CASCADE
);
-- Seed: kuratierte Werte für ISO27001-Annex-A + NIS2 zuerst (~200 Zeilen); Rest Default 0.5.
-- risk_config: + residual_model text DEFAULT 'legacy' CHECK IN ('legacy','multiplicative')
```

### E2.4 Signaturen

```ts
export interface ControlEff { eff: number; factors: { base: number; impl: number; maturity: number; verify: number }; confidence: "verified"|"attested"|"unverified" }
export function computeControlEffectiveness(
  effectRow: ControlEffectRow | undefined, answer: EffectiveAnswer | undefined,
  health?: ControlHealth /* E3, optional */,
): ControlEff;

export function applyResidualRiskV2(
  risks: RiskObject[], links: RiskControlLink[],          // aus soaRiskLinkage + Capability-Match
  effByControl: Map<string /*fw::id*/, ControlEff>,
  cfg: RiskMatrixConfig & { residual_model?: string },
): RiskObject[];   // ergänzt residual_score/level + residual_factors[] (Herleitung je Risiko, Report-tauglich)
```

`applyResidualRisk` (alt) bleibt; der Aufrufer (`useRiskAnalysis`) wählt per `cfg.residual_model`. **Identitäts-Fixture:** `residual_model:'legacy'` ⇒ Ausgabe deep-equal alt.

---

## E3 · Abgeleiteter kontinuierlicher Control-Status (CCM) — `controlHealthEngine.ts`

**Klasse: Engine A-SICHER · Test-Runner/Scheduler C-RUNTIME · Anzeige-Einbau in Assessment/SoA B-KERN.**
**Reife: 2 → 5.** DER Abstand zu Vanta/Drata (engine_gap „sieht billig aus" #1). Nutzt die **bereits existierenden, leeren** Tabellen `control_tests` / `control_test_results` (Migration `..08`).

### E3.1 Zielverhalten

Ein Control-Status wird nicht mehr behauptet, sondern **abgeleitet**: `derived = f(Selbstauskunft, Evidence-Freshness, Test-Resultate)`. Veraltete Evidence degradiert; fehlschlagende Tests übersteuern. Jede Statusänderung läuft durch eine **Drift-Statemachine** mit Log. Jeder Status trägt eine **Konfidenz** (automatisiert > manuell > unbelegt).

### E3.2 Ableitungs-Algorithmus

```
Inputs je Kontrolle (fw, id):
  answer       = EffectiveAnswer.status                       (Selbstauskunft, inkl. Vererbung)
  tests[]      = enabled control_tests, je Test das JÜNGSTE control_test_results
  evidence[]   = eigene + knoten-geerbte Evidence (resolveInheritedEvidence, existiert)

Schritt 1 — Test-Aggregat (AND-Logik, Vanta-Prinzip):
  testState = none        wenn 0 Tests
            | fail        wenn ≥1 jüngstes Resultat 'fail'
            | error       sonst wenn ≥1 'error' ODER jüngstes Resultat älter als 2×schedule-Intervall (Test „verstummt")
            | pass        sonst (alle pass/na)

Schritt 2 — Evidence-Aggregat (TTL):
  effektive TTL je Artefakt: valid_until, sonst kind-Policy:
    attestation 365d · document 365d · ticket 180d · screenshot 90d · log 30d · link 90d · other 180d
  evidenceState = fresh | expiring(<30d) | stale | none      (worst über Pflicht-Artefakte)

Schritt 3 — Derived Status (Lattice, worst wins):
  answer nein/teilweise/na  → derived = answer                       (Selbstauskunft schlecht bleibt schlecht)
  answer ja:
    testState fail                → derived = 'nein'      badge 'failing'
    testState error               → derived = 'teilweise' badge 'unknown'
    evidenceState stale|none UND Kontrolle evidence-pflichtig
                                  → derived = 'teilweise' badge 'unverified'   („ja (Nachweis fällig)")
    sonst                         → derived = 'ja'        badge = testState pass ? 'verified' : 'attested'
  evidence-pflichtig = muss-Kontrolle ODER control_tests vorhanden (konfigurierbar; Default: nur Anzeige-Badge,
  KPI-Abzug aktiv — harte Degradierung in Scores per Flag `derived_status_scoring`, Default off ⇒ B-KERN-neutral)
```

### E3.3 Control-Health-Score + Konfidenz

```
health = 100 · clamp01( 0.45·answerScore + 0.30·passRate + 0.25·freshRate ) − 15·hasCriticalFinding
  answerScore = {ja:1, teilweise:0.5, nein:0, na:—(nicht gewertet)}
  passRate    = passing/total Tests            (keine Tests ⇒ Komponente entfällt, Gewichte renormalisieren — no_data-Prinzip aus kpiEngine)
  freshRate   = fresh/total Pflicht-Evidence   (dito)
confidence = 'high'   wenn ≥1 automatisierter Test UND passRate-Komponente vorhanden
           | 'medium' wenn nur frische Evidence
           | 'low'    wenn reine Selbstauskunft
```

**Zahlenbeispiel (Fixture):** ja + 2/2 Tests pass + 1/2 Evidence frisch ⇒ `100·(0.45·1 + 0.30·1 + 0.25·0.5) = 87.5`, confidence high. Reine Selbstauskunft „ja" ⇒ Gewichte renormalisiert: `100·(0.45/0.45)·1 = 100`, aber confidence **low** — die Zahl ist gleich, das Vertrauen nicht: genau das weist die UI aus.

### E3.4 Drift-Statemachine

```
states: unknown → passing → degraded → failing   (+ zurück)
Übergänge aus (testState, evidenceState)-Paaren je Lauf; jede Transition wird geloggt:
  pass→fail   = DRIFT (Alert + Finding-Delta aus detail.findings[])
  fail→pass   = RECOVERED
  fresh→stale = EVIDENCE_DECAY
```

```sql
-- Migration 20260718000003_control_status_log.sql (tenant-RLS-Standardblock)
CREATE TABLE control_status_log (
  id uuid PK DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL,
  framework text NOT NULL, control_id text NOT NULL,
  from_state text NOT NULL, to_state text NOT NULL,
  cause text NOT NULL,             -- 'test_fail' | 'test_recovered' | 'evidence_expired' | 'answer_changed' | 'test_silent'
  test_id uuid NULL, detail jsonb NOT NULL DEFAULT '{}',
  at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON control_status_log (tenant_id, framework, control_id, at DESC);
-- control_tests: + ALTER TABLE ADD COLUMN interval_hours int NOT NULL DEFAULT 24;  (macht 'schedule' rechenbar)
-- evidence_ttl_policy als GLOBAL-Seed-Tabelle (kind, ttl_days) ODER Konstante im Engine-Code (Entscheidung: Konstante, Overrides in risk_config.evidence_ttl jsonb)
```

### E3.5 Test-Runner (C-RUNTIME, `api/src/jobs/control-test-runner.js`)

- node-cron stündlich: fällige `control_tests` (letzter Lauf > interval_hours) ausführen.
- **v1-Testkatalog ohne externe Konnektoren** (sofort verkaufbar, weil er interne Datenqualität testet): `deadline_adherence` (überfällige compliance_deadlines je Kontrolle), `evidence_present` (Pflicht-Evidence vorhanden+frisch), `answer_review_age` (Antwort älter als X Tage ⇒ fail), `csv_assert` (hochgeladene Inventar-CSV gegen Regel, z. B. „alle Server haben patch_group"), `webhook_pull` (generischer HTTP-GET + JSONPath-Assertion → Intune/ServiceNow/Okta ohne Spezialkonnektor).
- Ergebnis-Insert + bei pass optional Auto-Evidence (kind 'log', valid_until = now + ttl) → `control_test_results.evidence_id`.
- Konnektor-SDK (Intune/Okta/GitHub nativ) ist Phase 2 — Architektur trägt es über `config jsonb`.

### E3.6 Signaturen

```ts
export type DerivedBadge = "verified"|"attested"|"unverified"|"unknown"|"failing";
export interface ControlHealth {
  derived: AnswerStatus | null; badge: DerivedBadge;
  health: number | null;                       // null = no_data
  confidence: "high"|"medium"|"low";
  testState: "none"|"pass"|"fail"|"error";
  evidenceState: "none"|"fresh"|"expiring"|"stale";
  driftEvents: StatusTransition[];             // seit letztem Betrachten
}
export function deriveControlHealth(
  answer: EffectiveAnswer | undefined,
  tests: { test: ControlTest; latest: ControlTestResult | null }[],
  evidence: { row: Evidence; inherited: boolean }[],
  opts?: { now?: Date; ttlOverrides?: Record<EvidenceKind, number> },
): ControlHealth;
export function computeTransitions(prev: ControlHealth | null, next: ControlHealth): StatusTransition[];
export function frameworkReadiness(healths: ControlHealth[], weights?: Map<string, number>): { score: number; coverage: number };
```

**Fixture:** Lattice-Tabelle E3.2 vollständig als Wahrheitstabelle asserten (5 answers × 4 testStates × 4 evidenceStates = 80 Fälle, generiert); Health-Beispiel 87.5; Statemachine pass→fail erzeugt genau 1 DRIFT-Event.

---

## E4 · Vererbung mit Konfidenz & Gewichtung — assessmentEngine v3

**Klasse: B-KERN** (projectAnswer ist das Herz der Suite; Default-Modus `'lww'` ⇒ byte-identisch zu heute, bewiesen per Golden-Master über `db/tools/projection_diff.mjs`-Muster).
**Reife: 3 → 4.5.**

### E4.1 Zielverhalten

Statt „wer zuletzt klickt gewinnt": jeder Anker-Kandidat bekommt einen **Konfidenz-Score**; der Gewinner ist der glaubwürdigste, nicht der neueste. Widersprüche zwischen glaubwürdigen Ankern werden **signalisiert** (Konflikt-Queue), nicht still überschrieben. Die teilweise-Deckelung (subset/intersects → max „teilweise") bleibt unverändert bestehen.

### E4.2 Konfidenz-Formel je Anker-Kante

```
conf(edge) = rel_base(relation) × (strength/10) × src(source) × decay(Δt)

rel_base: equal 1.0 · superset-of 0.9 · intersects-with 0.6 · subset-of 0.5      (research §3.3-Ordnung)
strength: aus control_mapping.strength (Knoten-Mitgliedschaft & control_iso-Fallback = 10)
src:      curated 1.0 · tfidf_opus 0.85 · import 0.7                              (control_mapping.source)
decay:    2^(−Δdays/365)   Halbwertszeit 1 Jahr — eine 3 Jahre alte Antwort verliert Autorität,
          verschwindet aber nie (decay ≥ 0.125 gedeckelt)
```

Gewinner-Wahl (Modus `'weighted'`): Kandidat mit höchstem `conf`; bei Gleichstand (±0.05) der neuere (LWW als Tie-Breaker — sanfter Übergang vom Ist).
Eigene explizite Antwort hat `conf = 1.0 × decay` und **gewinnt bei gleicher Konfidenz immer** (explicit-first).

### E4.3 Konflikt-Signal

```
conflict, wenn zwei Kandidaten mit conf ≥ 0.6 existieren, deren Status-Rang
(nein=0 < teilweise=1 < ja=2) um ≥ 2 differiert (also ja vs nein).
⇒ EffectiveAnswer.conflict = { anchors: [{anchorId, framework, status, conf}], resolution: 'weighted'|'lww' }
⇒ Anzeige-Badge + Eintrag in Review-Liste (client-seitig aggregiert; KEINE neue Tabelle nötig —
   deterministisch aus answers ableitbar, Persistenz nur für „als geklärt markiert":
   answers.note-Konvention oder user_tool_data['projection-conflicts'] mit dismissed-Keys)
```

### E4.4 Schnittstellen-Änderung (additiv am Typ)

```ts
export type ProjectionMode = "lww" | "weighted";           // Default 'lww' — Identität
export interface AnchorRef { anchorId: string; relation: ControlRelation;
  strength?: number; source?: string }                     // optionale Felder: fehlen ⇒ 10/'curated' ⇒ conf-neutral
export interface EffectiveAnswer { /* bisher + */ confidence?: number;
  conflict?: ProjectionConflict }

export function projectAnswer(control, spokeAnswer, anchorAnswers, anchorsBySpoke,
  opts?: { mode?: ProjectionMode; now?: number }): EffectiveAnswer;
```

`useAssessment` lädt `control_mapping` bereits laut ARCHITECTURE §4.1 — liefert strength/source in `AnchorRef` mit. Modus kommt aus `useFrameworkInheritance` (der endlich echte Wirkung bekommt: off = nur explizit, lww, weighted).

**Fixtures:** (1) Identität: 500 synthetische Kontroll/Antwort-Kombinationen, `mode:'lww'` vs. alte Funktion deep-equal. (2) Weighted: frischer schwacher Anker (subset, strength 4, gestern) vs. alter starker (equal, curated, 90 Tage) ⇒ equal-Anker gewinnt (conf 1.0·1.0·1.0·0.84=0.84 > 0.5·0.4·1.0·1.0=0.2). (3) Konflikt-Beispiel ja-vs-nein mit conf 0.9/0.7 ⇒ conflict gesetzt, weighted-Gewinner „ja", Deckelung greift weiter bei partial.

---

## E5 · Gap-Severity risiko-/asset-kontextbasiert — gapEngine v2

**Klasse: B-KERN** (alle Kontextfaktoren Default 1.0 + Basistabelle = heutige 2×2 ⇒ identische Levels bei fehlendem Kontext).
**Reife: 2 → 4.**

### E5.1 Severity-Formel (ersetzt `severityFor(muss, answer)`, gapEngine.ts:735)

```
S = B(muss, answer) × W_ctrl × A_crit × X_exp × T_threat × K_comp        → Level über Schwellen

B  Basis:      muss+nein 8 · muss+teilweise 5 · kann+nein 5 · kann+teilweise 3   (bildet heutige 2×2-Ordnung ab)
W_ctrl:        0.6 + 0.8·base_eff (aus control_effect, E2) — wirksame Kontrollen fehlen schwerer   ∈ [0.6, 1.4]
A_crit:        max. Kritikalität verknüpfter Assets (criticalityEngine-Level): Critical 1.4 · High 1.2 · Medium 1.0 · Low 0.85 · kein Asset 1.0
X_exp:         SPOF-Asset betroffen +0.2 · internet-exposed Tag +0.2   (additiv auf 1.0, max 1.4)
T_threat:      Bedrohungsgewicht je capability_tag (globale Seed-Map, ENISA-Threat-Landscape-orientiert:
               identity/patching/backup/logging 1.3 · phishing/mfa 1.2 · physical 0.9 · Default 1.0)
K_comp:        Kompensation: 1 − 0.3·(Anteil Ko-Knoten-/Capability-Geschwister mit derived 'ja')   ∈ [0.7, 1.0]

Level: S ≥ 11 critical · ≥ 7 high · ≥ 4 medium · sonst low
Kalibrierungs-Anker: B=8 × alle Faktoren 1.0 = 8 ⇒ high?? — NEIN: muss+nein soll ohne Kontext critical bleiben
⇒ Schwellen 7.5/5/3: muss+nein=8 ⇒ critical, muss+teilweise=5 ⇒ high, kann+nein=5 ⇒ high, kann+teilweise=3 ⇒ medium.
   Damit ist die Identität zur heutigen 2×2-Tabelle bei Faktor-1.0 EXAKT hergestellt (B-KERN-Beweis).
```

### E5.2 Herleitungs-Ausweis (Auditor-tauglich, ersetzt Serienbrief-Texte)

Jeder Gap trägt `severity_factors: {label, factor, reason}[]` (z. B. „×1.4 — betrifft als kritisch eingestuftes Asset ‚Leitstellen-Server'"). `risk_text` wird aus den Faktoren **generiert statt template-kopiert**: Satzbausteine je Faktor > 1.0, sortiert nach Beitrag — jeder Gap liest sich anders, weil die Faktoren anders sind.

### E5.3 Datenmodell / Signatur

Kein neues Schema nötig außer der Threat-Map: `threat_weights` als **Konstante im Engine-Code** (Seed-Objekt, jährlich mit ENISA-Report gepflegt) + Tenant-Override in `risk_config.threat_weights jsonb`.

```ts
export interface SeverityContext { controlEff?: number; assetCritLevel?: CritLevel | null;
  spof?: boolean; internetExposed?: boolean; capabilityTag?: string | null;
  compensationRatio?: number /*0..1*/ }
export function computeGapSeverity(muss: boolean, answer: AnswerStatus, ctx?: SeverityContext):
  { score: number; level: Severity; factors: SeverityFactor[] };
```

**Fixture:** Identität (ctx leer ⇒ exakt heutige 2×2-Levels über alle 8 Kombinationen); Beispiel muss+teilweise (5) × W 1.16 × A 1.4 × X 1.2 × T 1.3 × K 1.0 = 12.66 ⇒ critical mit 4 Faktoren im Ausweis.

---

## E6 · Reifegrad: gewichteter Rollup + Trend — maturityV3 (in maturityV2.ts additiv)

**Klasse: B-KERN** (neue Funktion `computeFrameworkMaturityV3`; V2 bleibt bis UI-Umstellung).
**Reife: 2 → 4.**

### E6.1 Formeln

```
w_c        = muss_weight(muss? 1.0 : 0.5) × (0.6 + 0.8·base_eff_c)        (Kontroll-Gewicht, wie E5 W_ctrl)
Familie:   ist_f = Σ_{c erfasst} (w_c·r_c) / Σ_{c erfasst} w_c
coverage_f = Σ_{c erfasst} w_c / Σ_{c alle} w_c                            (Erfassungsquote, GEWICHTET)
confidence_f = coverage ≥ 0.7 'high' · ≥ 0.3 'medium' · sonst 'low'        (low ⇒ UI-Warnbadge, Zahl bleibt sichtbar)

Overall:   O = Σ_f (W_f · ist_f) / Σ_f W_f    mit  W_f = Σ_{c∈f} w_c × domain_weight_f
           domain_weight aus maturity_targets.weight (neu, Default 1) — Familie mit 40 Kontrollen zählt
           damit automatisch mehr als eine mit 2 (behebt engine_gap §4)

derived-Modus (uses_maturity=false): Konformität belegt maximal 'Etabliert':
           ja → 3.0 · teilweise → 1.5 · nein → 0        (KEINE ja=5-Fiktion mehr; klar als derived+capped gelabelt)

Trend:     Zeitreihe aus kpi_snapshots.metrics.maturity_overall (Cron-Snapshots, ARCHITECTURE §4.8):
           kleinste-Quadrate-Gerade über die letzten ≤12 Punkte ⇒ slope [Level/Woche] ± stderr;
           forecast_date(target) = letzter Punkt + (target − ist)/slope   (nur wenn slope > 2·stderr, sonst 'kein belastbarer Trend')
```

### E6.2 Datenmodell / Signatur

```sql
ALTER TABLE maturity_targets ADD COLUMN weight numeric NOT NULL DEFAULT 1 CHECK (weight > 0);
```

```ts
export function computeFrameworkMaturityV3(input: FrameworkMaturityInput & {
  weights?: Map<string /*controlId*/, number>; domainWeights?: Record<string, number>;
  derivedCap?: number /* Default 3 */ }): FrameworkMaturityResult & {
  groups: (MaturityGroup & { coverage: number; confidence: "high"|"medium"|"low" })[] };
export function maturityTrend(points: { at: string; value: number }[], target?: number):
  { slope: number; stderr: number; forecastDate: string | null };
```

**Fixture:** Familie mit r=[3(w2), 5(w1)] ⇒ ist = (6+5)/3 = 3.7; coverage-Beispiel; V2-Vergleich: alle Gewichte 1 + derivedCap 5 + je-Familie-Mittel ⇒ deep-equal V2 (Identitätsbeweis). Trend: 4 Punkte auf perfekter Geraden ⇒ stderr ≈ 0, forecast exakt.

---

## E7 · Risikobasierte Priorisierung: RiskReduction/Effort, Δ-ALE/ROSI, Knapsack — `prioritizationEngine.ts`

**Klasse: A-SICHER** (neue Datei) **+ B-KERN**-Verdrahtung in roadmapEngine (`computePhaseV2`, alte `computePhase` bleibt Default).
**Reife: 2 → 5.** Das ROI-Verkaufsargument; nutzt endlich `effort_pt` (roadmapEngine.ts:19 — existiert, wird heute nie verrechnet).

### E7.1 Maßnahmen-Scoring

```
Je Maßnahme m (Treatment/RoadmapItem mit selected_control_ids[]):

ordinal:  ΔR_m = Σ_{r ∈ risks(m)} [ residual_score(r | ohne m) − residual_score(r | mit m) ]
          beide Seiten mit applyResidualRiskV2 (E2) — „mit m" setzt impl_c der Controls von m auf 1.0
monetär:  ΔALE_m = Σ_{r mit quant_scenario} [ mean(ALE | eff heute) − mean(ALE | eff mit m) ]
          FAIR-Kopplung: Kontroll-Wirkung senkt Vuln/RS bzw. LM: vulnAfter = vuln × Π(1−eff_c) für
          likelihood-Controls, lmAfter = lm × Π(1−eff_c) für impact-Controls — zwei simulateScenario-Läufe,
          gleicher Seed (Common Random Numbers ⇒ Δ ist varianzarm und stabil)

PriorityScore_m = (ΔALE_m falls vorhanden, sonst ΔR_m · scale) / max(effort_pt_m, 0.5)
ROSI_m          = (ΔALE_m − annual_cost_m) / annual_cost_m          (nur mit Kostenangabe)
Mehrfach-Abdeckung ist AUTOMATISCH drin: ein Control in 6 Risiken summiert 6 Beiträge in ΔR/ΔALE.
```

### E7.2 Quick-Win-Knapsack unter Budget

```
0/1-Knapsack: maximiere Σ Δ_m  s.t.  Σ effort_pt_m ≤ Budget
DP über ganzzahlige Effort-Einheiten (0.5-PT-Raster, Kapazität ≤ 2 000 Einheiten ⇒ O(n·2000), trivial im Client);
bei Überschreitung Greedy nach PriorityScore als Fallback (dokumentiert im Ergebnis: method:'dp'|'greedy').
Abhängigkeiten (optional, meta.depends_on): Vorgänger nicht gewählt ⇒ Nachfolger gesperrt (Prüfschleife nach DP,
gesperrte entfernen, DP wiederholen — max 3 Runden).
Roadmap-Phasen v2: now = Knapsack(Budget_quartal), next = Knapsack(Rest, Budget_quartal), later = Rest.
phase_override und Deadline-Overdue-Regeln (compliance_deadlines) behalten Vorrang wie heute.
```

### E7.3 Datenmodell / Signaturen

```sql
-- roadmap_items / treatments (Tool-Blob): + cost_eur numeric NULL, + meta.depends_on text[] (jsonb, kein DDL)
```

```ts
export interface MeasureScore { measureId: string; deltaOrdinal: number; deltaAleEur: number | null;
  effortPt: number; priority: number; rosi: number | null;
  perRisk: { riskId: string; before: number; after: number }[] }    // Herleitung für Report
export function scoreMeasures(measures: Measure[], risks: RiskObject[], links: RiskControlLink[],
  effByControl: Map<string, ControlEff>, cfg: RiskMatrixConfig,
  quant?: Map<string /*riskId*/, FairFullInput>, seed?: number): MeasureScore[];
export function selectQuickWins(scored: MeasureScore[], budgetPt: number):
  { selected: string[]; totalDelta: number; totalEffort: number; method: "dp"|"greedy" };
export function computePhaseV2(rows: RoadmapRow[], budgetPtPerQuarter: number, scored: MeasureScore[]): Map<string, RoadmapPhase>;
```

**Fixture:** 3 Maßnahmen (Δ=10/PT2, Δ=9/PT9, Δ=4/PT1), Budget 3 ⇒ DP wählt {1,3} (Σ14) statt Greedy-nach-Score-Falle; Δ-ALE mit gleichem Seed zweimal gerechnet ⇒ deterministisch; ROSI-Beispiel (ΔALE 240 k€, Kosten 60 k€ ⇒ 3.0).

---

## E8 · Posture-/Trust-Score + Peer-Benchmark — `postureEngine.ts`

**Klasse: A-SICHER** (Engine + Trust-Ansicht) **+ C-RUNTIME** (anonymisierter Kohorten-Aggregations-Job).
**Reife: neu → 4** (5 erst mit echter Kohorten-Datenbasis).

### E8.1 Posture-Score (die eine verkaufbare Zahl, 0–100)

```
Komponenten (jede ∈ [0,1], no_data ⇒ Komponente entfällt + Gewichte renormalisieren + coverage sinkt):
  C1 FrameworkReadiness  = Σ w_c·health_c / Σ w_c            (E3, über aktivierte Frameworks)
  C2 EvidenceFreshness   = fresh / Pflicht-Evidence           (E3-TTL)
  C3 MaturityNorm        = OverallMaturity / 5                (E6)
  C4 DeadlineAdherence   = fristgerecht erledigte / fällige compliance_deadlines (rollierend 12 M)
  C5 RiskPosture         = 1 − Σ residual / Σ inherent        (E2 — wieviel Risiko die Controls wegnehmen)

Posture = 100 · Σ w_i·C_i / Σ w_i  − P
  Gewichte: w = [0.30, 0.15, 0.15, 0.15, 0.25]
  P (Abzüge, gedeckelt 25): 5·min(3, offene critical Gaps) + 3·min(3, failing Tests) + 1·min(4, überfällige Fristen)
Ausweis IMMER mit: coverage (Anteil belegter Gewichte) und confidence (min der Komponenten-Konfidenzen).
```

**Fixture:** C=[0.9, 0.8, 0.6, 1.0, 0.7] ⇒ 100·(0.27+0.12+0.09+0.15+0.175)=80.5; mit 1 critical Gap + 2 failing Tests ⇒ 80.5−11=69.5. no_data-Fall: nur C1=0.9 ⇒ 90, coverage 0.30.

### E8.2 Peer-Benchmark

```sql
-- GLOBAL, vom Aggregations-Job befüllt (C-RUNTIME, wöchentlich, k-Anonymität: nur Kohorten mit n ≥ 8)
CREATE TABLE benchmark_stats (
  cohort_sector text NOT NULL,            -- aus company_profiles (Kommune/Stadtwerk/KH/…)
  cohort_size   text NOT NULL,            -- 'xs|s|m|l' (Mitarbeiterband)
  metric        text NOT NULL,            -- 'posture' | KPI-IDs | 'maturity_overall'
  p25 numeric, p50 numeric, p75 numeric, n int NOT NULL,
  computed_at timestamptz DEFAULT now(),
  PRIMARY KEY (cohort_sector, cohort_size, metric)
);
```

`peerPercentile(value, {p25,p50,p75})` = stückweise lineare Interpolation (unter p25 → 0–25 linear ab p25−IQR, über p75 analog). **Cold-Start-Regel (ehrlich):** solange `n < 8` ⇒ `benchmark: null` + Anzeige „Benchmark ab 8 Organisationen der Kohorte" — **niemals** erfundene Peer-Werte (no_data-Doktrin). Bis dahin liefert der Report die ENISA-/Vanta-Tier-Referenzwerte als „Markt-Referenz (extern)" gekennzeichnet.

```ts
export function computePosture(inp: PostureInputs): { score: number; coverage: number;
  confidence: "high"|"medium"|"low"; components: PostureComponent[]; penalties: PosturePenalty[] };
export function peerPercentile(value: number, stats: BenchmarkRow | null): number | null;
```

---

## E9 · KPI: dynamische/benchmarkbasierte Schwellen — kpiEngine v4

**Klasse: B-KERN** (Schwellen-Resolver vor die bestehenden statischen Werte geschaltet; ohne Overrides und ohne benchmark_stats ⇒ exakt heutige Schwellen).
**Reife: 3 → 4.5.**

### E9.1 Schwellen-Resolver (Prioritätskette, je KPI)

```
threshold(kpi) = tenant_override            (bestehende Target-Overrides, bleibt #1)
              ?? benchmark_derived           (aus benchmark_stats, wenn n ≥ 8):
                   higher-is-better: healthy = p75, warning = p50
                   lower-is-better:  healthy = p25, warning = p50
              ?? static_default              (heutige 95/80, 48h, … — unverändert als Fallback)
KPIResult erhält: threshold_source: 'override'|'benchmark'|'default'   (im UI ausgewiesen — „Schwelle = Median Ihrer Kohorte")
```

### E9.2 Trend & Overall (Information nicht mehr wegwerfen)

```
Trend:   statt Delta der letzten 2 Snapshots → EWMA (α=0.3) über alle kpi_snapshots
         + Kleinste-Quadrate-Slope ± stderr; Trend-Status ändert sich nur bei |slope| > 2·stderr (kein Flapping)
Velocity/Forecast: Slope-basiert + 20 %-Endphasen-Puffer JETZT ALS RECHNUNG (forecast × 1.2 ab Fertigstellungsgrad ≥ 80 %)
Overall: kontinuierlich statt 100/50/0:
         score_kpi = clamp01( (value − critical) / (healthy − critical) )   (Richtung beachtet)
         Overall = 100 · Σ w·score / Σ w        ⇒ 94 % und 81 % sind nicht mehr gleich „50"
Snapshots: wöchentlicher Cron (api/src/jobs/kpi-snapshot.js, in ARCHITECTURE §6 bereits vorgesehen) — Trend
         hängt nicht mehr davon ab, dass jemand das Dashboard öffnet.  (C-RUNTIME-Anteil)
```

```ts
export function resolveThresholds(kpiId: string, overrides: TargetOverrides | null,
  bench: BenchmarkRow | null, defaults: KpiThreshold): KpiThreshold & { source: ThresholdSource };
export function trendFromSeries(points: { at: string; value: number }[]):
  { direction: "up"|"down"|"flat"; slope: number; stderr: number; confident: boolean };
export function overallScoreContinuous(kpis: KpiResult[]): number;
```

**Fixture:** Resolver-Kette (override schlägt benchmark schlägt default; n=5-Benchmark wird ignoriert); Overall: 2 KPIs mit score 0.94/0.81 ⇒ ≈87.5 statt 50; Identität: ohne Overrides/Benchmark ⇒ Schwellen exakt die heutigen Konstanten.

---

## P · Priorisierung: Neubau-Wellen für maximalen „verkaufbar"-Effekt

### Top-4-Neubau (zuerst, Reife-Ziel → 5)

| # | Engine | Ist → Ziel | Warum zuerst (Käufer-/Auditor-Effekt) |
|---|---|---|---|
| 1 | **E3 CCM / abgeleiteter Control-Status** | 2 → 5 | schließt „sieht billig aus"-Lücke #1 (Selbstauskunft-Tool → Monitoring-Produkt); Tabellen existieren leer, v1-Testkatalog braucht keine Konnektoren |
| 2 | **E2 Residual multiplikativ** | 2 → 4.5 | eliminiert die „−1 Stufe"-Auditorfrage; Voraussetzung für E7-ROI-Story; klein (1 neue Tabelle + 1 Engine-Datei) |
| 3 | **E1 FAIR voll (LEC + Portfolio + Appetite)** | 2 → 5 | die CFO-Demo: Gesamt-Exposure in €, LEC, Appetit-Kurve — RiskLens-Klasse; Sampler existieren |
| 4 | **E7 Priorisierung Δ-ALE/ROSI/Knapsack** | 2 → 5 | macht aus E1+E2 das Verkaufsargument („Plan A senkt ALE um 240 k€ bei 60 PT, ROSI 3.0") |

### Wellen & Abhängigkeiten

```
Welle 1 (Woche 1–2) — „ehrlicher Status":      E3 Engine+Lattice+Health  →  E2 (nutzt verify_c aus E3)
                                               parallel: Migrationen 20260718000001–3, v1-Test-Runner (C)
Welle 2 (Woche 3–4) — „Geld & ROI":            E1 fairEngine (unabhängig baubar)  →  E7 (braucht E1.deltaAle + E2.applyResidualRiskV2)
Welle 3 (Woche 5)   — „glaubwürdige Breite":   E4 (weighted projection; braucht nichts, aber Golden-Master zuerst)
                                               E5 (braucht E2.control_effect + criticalityEngine — beides da)
                                               E6 (braucht nichts; Trend braucht kpi-Snapshot-Cron aus Welle 1/C)
Welle 4 (Woche 6)   — „Verkaufszahl":          E8 Posture (konsumiert E2/E3/E6)  →  E9 KPI v4 (konsumiert benchmark_stats)
                                               Benchmark-Job (C) läuft ab hier, Peer-Perzentile erst ab n≥8 Kohorte
Abhängigkeits-Kurzform: E3→E2→{E5,E7,E8} · E1→E7 · E6→E8 · E8→E9(benchmark) · E4 unabhängig
```

Jede Welle endet mit: Fixtures grün (`node web/src/lib/__fixtures__/run_all.mjs`), esbuild-Bundle 0 Fehler, B-KERN-Identitäts-Diffs = 0.

### Neue Tabellen/Spalten (Gesamtliste)

| Objekt | Art | Engine |
|---|---|---|
| `quant_scenarios`, `quant_runs` | neue Tabellen (tenant) | E1 |
| `risk_config.appetite_curve`, `.default_correlation_rho`, `.residual_model`, `.threat_weights`, `.evidence_ttl` | Config-Felder (Blob/Tabelle) | E1/E2/E3/E5 |
| `control_effect` | neue Tabelle (global, Seed ~200 kuratiert) | E2/E5/E6 |
| `control_status_log` | neue Tabelle (tenant) | E3 |
| `control_tests.interval_hours` | neue Spalte | E3 |
| `maturity_targets.weight` | neue Spalte | E6 |
| `roadmap_items.cost_eur` | neue Spalte | E7 |
| `benchmark_stats` | neue Tabelle (global, Job-befüllt, k≥8) | E8/E9 |

*(bereits vorhanden und nur zu befüllen: control_mapping, evidence/answer_evidence, control_tests/results, kpi_snapshots, maturity_targets, compliance_deadlines)*

### Die 3 größten Umsetzungsrisiken

1. **B-KERN-Regressionen in projectAnswer/riskEngine:** Diese Funktionen speisen jede Zahl der Suite; esbuild fängt nichts. Gegenmaßnahme (verbindlich): Golden-Master-Fixtures VOR jeder Änderung, Identitäts-Diff = 0 als Merge-Gate, alte Funktionen bleiben exportiert bis zur UI-Umstellung.
2. **Kalibrierungs-Garbage-in bei FAIR & base_eff:** Präzise €-Kurven aus unkalibrierten Schätzungen sind Pseudo-Präzision — genau die CFO-Falle. Gegenmaßnahme: Szenario-Bibliothek mit Branchen-Startwerten, Konfidenz-λ sichtbar, Konsistenz-Check qualitativ↔quantitativ (Matrix „hoch" + ALE-P90 < 5 k€ ⇒ Warnhinweis), Konfidenz-Ausweis in jedem Report.
3. **Benchmark-Cold-Start (E8/E9):** Ohne ≥8 Tenants pro Kohorte gibt es keine ehrlichen Peer-Schwellen; die Versuchung, Werte zu erfinden, zerstört die Glaubwürdigkeit des gesamten no_data-Prinzips. Gegenmaßnahme: harte k-Anonymitäts-Schwelle, `threshold_source`-Ausweis, externe Referenzen (ENISA/Vanta-Tiers) klar als „extern" gelabelt — Verkauf argumentiert bis dahin über E1–E7, nicht über den Benchmark.

*(Rang 4, bewusst notiert: Iman-Conover/Portfolio-Numerik ist das mathematisch anspruchsvollste Einzelstück — deshalb seedbare Spearman-ρ-Fixtures mit Toleranzband als Abnahmekriterium, kein „sieht plausibel aus".)*

---
*Ende ENGINE_ARCHITECTURE_MARKETGRADE.md*
