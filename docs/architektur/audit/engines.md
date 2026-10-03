# Fable5 Engine-Audit — CyberWerkSuite Berechnungs-Engines

Repo: `/Users/sekercakil/Downloads/ClaudeCWS` · Stand: 2026-07-18
Geprüft: assessmentEngine, gapEngine, riskEngine, maturityV2, maturityEngine, treatmentEngine, roadmapEngine, soaProjection, kpiEngine, incidentTriggerEngine, deadlineEngine, evidenceEngine, criticalityEngine, riskQuantEngine + Konsumenten (useAssessment, useComplianceOverview, useRiskAnalysis, Assessment.tsx, AuditWorkbench.tsx) + DDL (`db/migrations/20260717000002_control_mapping.sql`, `db/schema.sql`).

Alle Befunde sind aus dem echten Code zitiert. Severity: **P0** = Crash oder falsches Compliance-/Risiko-Ergebnis in Normalbetrieb · **P1** = falsch im Randfall / systematische Verzerrung eines Teilpfads · **P2** = Robustheit/Konsistenz.

---

## P0

### P0-1 — `na` wird cross-framework VERERBT (Spec + eigene Doku verbieten das) → Compliance-% zu hoch

**Datei:** `web/src/lib/assessmentEngine.ts:126` (projectAnswer) und `:188` (buildAnchorAnswerMap)

Header der Datei (Z. 7-8): *„`na` is per-framework and never inherited from the hub."* — IMPLEMENTATION_SPEC.md ITEM 03: *„`na` nie vererbt"*. Der Code tut das Gegenteil:

```ts
// buildAnchorAnswerMap:188 — 'na' passiert den Filter (nur null wird geskippt):
if ((row.asset_id ?? null) !== null || !row.antwort) continue; // "na" ist truthy

// projectAnswer:126 — 'na' wird als Anker-Kandidat akzeptiert und kann per LWW gewinnen:
const a = isoAnswerByControl.get(ref.anchorId);
if (!a?.antwort) continue;               // "na" ist truthy → läuft durch
...
let status: AnswerStatus = best.antwort; // → status = "na", origin = "inherited"
```

**Wirkung:** Ein ISO-Control auf „na" setzt (als neueste LWW-Antwort) alle BSI/NIS2/DORA-Geschwister effektiv auf „na". `computeStats` (Z. 499-500) rechnet `applicable = total - na` und `compliancePct = (ja + 0.5·teilweise)/applicable` → der Nenner schrumpft in FREMDEN Frameworks, deren Regulatorik das Control ggf. zwingend fordert → **Compliance-Prozent falsch nach oben**. Zusätzlich bleibt ein geerbtes „na" von der subset-Deckelung unberührt.

**Fix:** In `buildAnchorAnswerMap` Zeile 188 `|| row.antwort === "na"` ergänzen (na-Antworten füttern keinen Anker) **und** in `projectAnswer` Zeile 126 `if (!a?.antwort || a.antwort === "na") continue;`. `na` darf nur aus `spokeAnswer` selbst kommen.

---

### P0-2 — `ctrl.muss ? "critical" : "medium"` — String `'false'` ist truthy → JEDES Finding „critical" → Risiko-Scores systematisch überhöht

**Datei:** `web/src/lib/gapEngine.ts:783` (buildFindingsAndGaps, Live-Pipeline)

```ts
control_importance: ctrl.muss ? "critical" : "medium",
```

`ControlRow.muss` ist `string | null` — die DB enthält **861× `muss='false'`** und 821× `muss='true'` (db/schema.sql, z. B. Z. 48268 ff.). `'false'` ist truthy → **alle** Findings nicht-verpflichtender Kontrollen (SOLLTE/KANN) bekommen `control_importance: "critical"`. Dieselbe Datei macht es 32 Zeilen tiefer richtig (`severityFor(ctrl?.muss === "true", …)`, Z. 815), ebenso `computeStats` (`c.muss === "true"`) und `treatmentEngine.ts:245`.

**Wirkung:** `riskEngine.calculateLikelihood` (Z. 232-237) mappt `critical → 2` statt `medium → 1`:
```ts
const importanceMap: Record<string, number> = { critical: 2, high: 1.5, medium: 1, low: 0.5 };
score += maxImportance;
```
→ Likelihood jedes Gap-Risikos +1 zu hoch (bei „missing" typ. 1+2+1.5 = 4.5→5 statt 4). Bei 5×5-multiply verschiebt das reihenweise Risiken von „high" nach „critical". **Das Risikoregister ist flächendeckend überzeichnet.**

**Fix:** `control_importance: ctrl.muss === "true" ? "critical" : "medium"`.

---

### P0-3 — Relations-Semantik von `control_mapping` ist zwischen DDL, ARCHITECTURE.md und Engine INVERTIERT — superset-of vererbt „ja" voll, obwohl der Anker die Quelle nur teilweise deckt

**Dateien:** `web/src/lib/assessmentEngine.ts:154` ↔ `db/migrations/20260717000002_control_mapping.sql:9-10` ↔ `docs/architektur/ARCHITECTURE.md:86-87` ↔ `web/src/lib/oscalExport.ts:137-150`

Engine (deckelt subset/intersects, vererbt superset voll):
```ts
const partial = !isOwn && (bestRelation === "subset-of" || bestRelation === "intersects-with");
if (partial && status === "ja") status = "teilweise";
```

DDL-Kommentar (die Vorgabe für jeden, der die Tabelle befüllt) sagt **beides → Teil-Projektion**:
```
--   subset-of      -> Quelle deckt nur Teil des Ziels  -> Teil-Projektion ("teilweise")
--   superset-of    -> Quelle deckt mehr als das Ziel    -> Teil-Projektion ("teilweise")
```

Standard-STRM/OSCAL-Lesart (`source_control` *relation* `target/anchor`, exakt so exportiert `toOscalRelation` 1:1): `source subset-of anchor` ⇒ Quelle ⊆ Anker ⇒ Anker-„ja" deckt die Quelle **voll** (volle Vererbung wäre korrekt); `source superset-of anchor` ⇒ Quelle ⊇ Anker ⇒ Anker-„ja" deckt **nur einen Teil** ⇒ MUSS gedeckelt werden — genau der Fall, den die Engine ungedeckelt voll vererbt. ARCHITECTURE.md §2.2 definiert die Wörter genau umgekehrt („superset-of (Anker umfasst Quelle ganz)").

**Wirkung:** Solange `control_mapping` leer ist: keine (byte-identisch, wie beabsichtigt). Sobald Zeilen nach DDL-/OSCAL-Semantik gepflegt werden: `superset-of`-Quellen erhalten **fälschlich volles „ja"** (Compliance zu grün), `subset-of`-Quellen werden fälschlich gedeckelt (zu rot) — und der OSCAL-Export transportiert die Relation wörtlich, sodass externe Tools die entgegengesetzte Deckung annehmen.

**Fix (konservativ, DDL-konform):** in Z. 154 auch `bestRelation === "superset-of"` deckeln — dann sind Engine und Migrationstext deckungsgleich und kein Fall projiziert zu grün. Danach ARCHITECTURE.md §2.2 an die DDL angleichen (eine einzige normative Definition der Richtung `source → anchor`).

---

## P1

### P1-1 — Schreibpfad `buildAnchorAnswerMap` ignoriert die Relation komplett: partielles Mapping schreibt VOLLES „ja" auf den Anker

**Datei:** `web/src/lib/assessmentEngine.ts:180-195` + Aufrufer (`Assessment.tsx:137`, `useComplianceOverview.ts:62`, `AuditWorkbench.tsx:206`, `useRiskAnalysis.ts:249`)

Alle Aufrufer reduzieren `AnchorRef[]` auf nackte IDs:
```ts
buildAnchorAnswerMap(answers, (fw, cid) => isoAnchorsBySpokeControl.get(`${fw}::${cid}`)?.map((a) => a.anchorId) ?? …)
```
`isoAnchorsBySpokeControl` enthält auch die `control_mapping`-Anker mit `subset-of`/`intersects-with` (useAssessment.ts:210-216). Ein „ja" auf einer nur teilweise überdeckenden Quelle setzt den Anker per LWW **voll** auf „ja"; von dort erben alle `equal`-Geschwister ungedeckelt. Die Deckelung existiert nur auf dem Lesepfad (projectAnswer) — ARCHITECTURE-Prinzip 2 („Kein falsches 100 %-Grün") ist auf dem Schreibpfad verletzt. Latent bis `control_mapping` befüllt wird, dann Compliance-verfälschend.

**Fix:** `anchorsFor` auf `AnchorRef[]` umstellen und in `buildAnchorAnswerMap` Antworten, die über `subset-of`/`intersects-with` auf den Anker fließen, vor dem Set auf `teilweise` deckeln (bzw. `ja` gar nicht als Anker-„ja" übernehmen).

### P1-2 — Anker speichert nur EINEN LWW-Gewinner → Sibling-Guard verwirft Vererbung komplett statt auf die nächst-neueste Fremd-Antwort zurückzufallen

**Datei:** `web/src/lib/assessmentEngine.ts:132` + `:190-191`

```ts
// projectAnswer:
if (a.framework === control.framework && a.control_id !== control.id) continue;
// buildAnchorAnswerMap: je Anker überlebt nur die neueste Zeile:
if (!prev || ts(row) >= ts(prev)) out.set(anchorId, row);
```
Szenario: BSI-A und BSI-B teilen Anker N; ISO antwortet t1, BSI-A antwortet t2 (neuer). Der Anker hält jetzt NUR die BSI-A-Zeile. Für BSI-B greift der (korrekte) Sibling-Guard → `continue` → **BSI-B zeigt „leer", obwohl die ISO-Antwort t1 projizierbar wäre.** Die Vererbung geht durch das Ein-Gewinner-Design verloren; `computeStats.answered`/`progressPct` sinken fälschlich.

**Fix:** je Anker die neueste Antwort **pro Framework** vorhalten (Map<anchor, Map<framework, AnswerRow>>); projectAnswer wählt dann die neueste nicht-geblockte.

### P1-3 — KPI-Trendpfeil invertiert für count-KPIs: mehr offene Hoch-Risiken = Trend „up" (= Verbesserung)

**Datei:** `web/src/lib/kpiEngine.ts:796-800`

```ts
const lowerIsBetter = m.unit === "days";
const improved = lowerIsBetter ? delta < 0 : delta > 0;
m.trend = improved ? "up" : "down";
```
Kommentar darüber: *„'up' = improvement direction (semantically green)"*. `open_high_risks`, `overdue_treatments`, `mttr_hours` haben `unit: "count"` und sind laut `KPI_DIRECTIONS` (Z. 934-946) `lower_better` — steigen sie, zeigt das Board **grünen Aufwärtstrend**. 

**Fix:** `const lowerIsBetter = LOWER_IS_BETTER.has(m.id)` (Set existiert bereits, Z. 134) bzw. `KPI_DIRECTIONS[m.id] === "lower_better"`.

### P1-4 — KPI #2/#7: Nenner enthält Custom-/Manual-Kontrollen, Zähler nicht → 100 % unerreichbar

**Datei:** `web/src/lib/kpiEngine.ts:174-176, 249-250, 453-455` ↔ `soaProjection.ts:414-421`

```ts
const controls = projection.allControls;                    // system + customManual
const applicable = controls.filter(c => c.applicable && !c.isExcluded);
const implRate = pct(stats.implemented, implDenom);         // stats.implemented = NUR systemControls
```
`SoAStats.implemented` wird ausdrücklich nur über `statsControls = systemControls` gezählt (soaProjection.ts:416: *„Custom/manual … must not inflate the … total"*), Custom-Kontrollen haben `implStatus: null` (Pseudo-Question, Z. 376) und `applicable: true`. Jede Custom-Maßnahme vergrößert also den Nenner von `control_implementation`, kann aber nie in den Zähler → KPI und daraus abgeleitete Velocity/Projected-Completion dauerhaft zu niedrig. Gleiches Muster bei `high_risk_coverage` (Z. 453-455: `applicable.filter(c.linkedToHighRisk …)`).

**Fix:** Nenner konsistent auf `projection.systemControls` (bzw. `stats.applicable`) stellen — oder implementierte Custom-Kontrollen in `stats.implemented` aufnehmen; eine Quelle, beide Seiten.

### P1-5 — incidentTriggerEngine: UNBEANTWORTETE Frage (`undefined`) unterdrückt Meldepflicht — Kernregel „unbekannt = ja" greift nicht, Begründungstext ist falsch

**Datei:** `web/src/lib/incidentTriggerEngine.ts:38, 110-112`

```ts
export const giltAlsJa = (v?: JaNein): boolean => v === "ja" || v === "unbekannt";
...
if (giltAlsJa(assessment.erheblich_nis2)) pushStufen(...);
else nichtAusgeloest.push({ framework: "NIS2", grund: "Kein erheblicher Sicherheitsvorfall (erheblich_nis2 = nein)." });
```
Header Z. 8: *„'unbekannt' wird wie 'ja' behandelt — Fristen laufen."* Ein schlicht nicht ausgefülltes Feld (`undefined`) fällt aber in den else-Zweig: **keine Meldekette, keine 24h/72h-Timer**, und die dokumentierte Begründung behauptet aktenkundig „= nein", obwohl nie „nein" geantwortet wurde. Bei einem halb ausgefüllten Assessment starten NIS2/DORA/KRITIS-Fristen stillschweigend nicht — genau das Gegenteil der konservativen Kernregel. Gleiches Muster für alle 7 Frameworks (Z. 110-153).

**Fix:** `giltAlsJa` um `|| v == null` erweitern (unbeantwortet = unbekannt = ja) — oder mindestens `nichtAusgeloest.grund` ehrlich als „nicht bewertet" ausweisen und im UI blocken, bis bewertet.

### P1-6 — `applyResidualRisk`: Default-Config statt Tenant-Matrix → residual_level mit falschen Schwellen klassifiziert

**Datei:** `web/src/lib/riskEngine.ts:475-508`

```ts
export function applyResidualRisk(risks, treatments, cfg: RiskMatrixConfig = DEFAULT_RISK_CONFIG) {
  ...
  const residualScore = calculateRiskScore(reducedLikelihood, r.impact, cfg);
  const residualLevel = classifyRisk(residualScore, cfg);
```
`DEFAULT_RISK_CONFIG` = 5×5 multiply, Schwellen {6, 12, 19}. Nutzt der Tenant eine 3×3- oder 4×4-Matrix bzw. `formula: "sum"` (alles im UI konfigurierbar, `getDefaultThresholds` existiert dafür), liefert ein Aufruf ohne explizite cfg systematisch falsche Residual-Level: in 3×3-multiply ist der Maximalscore 9 → mit den Default-Schwellen ist **„high"/„critical" als Residual unerreichbar**, jedes Residual ≤ 9 wird „low/medium". Zusätzlich inkonsistent: `risk_score` wurde bei Generierung mit der echten Tenant-Config klassifiziert, `residual_level` dann mit der Default-Config → inherent „critical", residual „medium" ohne jede Mitigation-Wirkung.
Nebenbefund: nur `strategy === "mitigate"` senkt — `avoid`/`transfer` mit Status done lassen residual = inherent (vertretbar, aber dokumentieren).

**Fix:** Default-Parameter entfernen (cfg verpflichtend machen) oder an allen Aufrufstellen die geladene Tenant-`RiskMatrixConfig` durchreichen; Lint-Guard, dass `classifyRisk` nie mit einer anderen cfg läuft als `risk_level` des gleichen Objekts.

---

## P2

### P2-1 — Zeitzonen-Divergenz Evidence-Frische: Engine lokal, KPI UTC
`evidenceEngine.ts:101-111` vergleicht gegen **lokale** Mitternacht (`new Date(now.getFullYear(), …)`), `kpiEngine.ts:177+649` gegen den **UTC**-Datumsstring (`new Date().toISOString().slice(0,10)`; `e.valid_until >= now` als Stringvergleich). In TZ ≥ UTC+1 zeigt die Step-14-Ampel abends/nachts „expired", während der KPI denselben Nachweis noch als frisch zählt (und umgekehrt westlich von UTC). Fix: eine gemeinsame `todayLocalISO()`-Helper-Funktion für beide.

### P2-2 — roadmapEngine: `Math.round` macht Fälligkeit erst ~12 h später überfällig; SPOF im Kommentar, nie im Code; toter Zweig
`roadmapEngine.ts:36-41`: `Math.round((d - Date.now())/DAY_MS)` → 5 h nach Fälligkeit ist `dtu = -0`, und `-0 < 0 === false` → `is_overdue` erst ab ~12 h. Fix: `Math.floor`. — `computePhase` (Z. 49) verspricht „Kritisch + (SPOF-nah …) → Now", prüft aber nie ein SPOF-Signal; ein kritisches Risiko OHNE due_date landet in „Next (3–9 Monate)". — Z. 56-57: `if (dtu <= 90) return "next"; return "next";` toter Code.

### P2-3 — treatmentEngine.getTreatmentPriority hardcodet 5×5-multiply
`treatmentEngine.ts:348`: `risk.risk_level === "high" && risk.risk_score >= 15` — bei `formula: "sum"` (max 10) oder 3×3/4×4 kann ein high-Risiko nie P1 werden. Fix: Schwelle relativ zu `getMaxScore(...)` oder rein level-basiert.

### P2-4 — buildFindingsAndGaps: verwaiste Asset-Antworten werden als Org-Findings gezählt, keine Dedup
`gapEngine.ts:764-771`: `asset = a.asset_id ? assetMap.get(a.asset_id) : undefined; scope: asset ? "asset" : "organization"` — existiert das Asset nicht (mehr), wird die Antwort als **organization**-Finding gezählt (asset_id null), zusätzlich zum echten Org-Finding derselben Kontrolle → doppelte Findings/Gap-Zählung. Anders als der Legacy-Pfad (`buildFindings`, `seen`-Set Z. 237) gibt es hier keine Dedup. Fix: Antworten mit nicht auflösbarem asset_id skippen oder deduplizieren.

### P2-5 — criticalityEngine: undefined/NaN-Eingabe ⇒ Klassifikation „Critical"
`criticalityEngine.ts:93-117`: fehlt ein Feld in `inputs`, ist `rawScore` undefined → NaN propagiert bis `score`; alle `score <= threshold`-Vergleiche sind false → **`classification = "Critical"`** mit Score NaN. Fix: Eingaben validieren/clampen (`Number.isFinite`), sonst expliziter „unbewertet"-Zustand.

### P2-6 — evaluateKpiAlerts: Alt-Snapshots ohne `hasData` melden No-Data-Nullen als kritische Breaches
`kpiEngine.ts:1006`: `if (latestSnapshot.hasData?.[id] === false) continue;` — Snapshots aus der Zeit vor dem `hasData`-Feld (oder fremde Schreiber) haben `hasData === undefined` → `meldefristen: 0`, `control_implementation: 0` etc. erscheinen im KVP-Feed als „critical", obwohl schlicht keine Daten vorlagen („false-positive red"). Fix: bei fehlender hasData-Map percent-KPIs mit Wert 0 konservativ skippen oder Migration der Snapshots.

### P2-7 — soaProjection: Exclusion-Lookup parst Selektions-IDs nicht; `entbehrlich`+applicable bricht die Status-Invariante
`soaProjection.ts:302-303, 398, 524`: `excludedMap` wird mit rohem `ex.control_id` gekeyt und mit `q.id` (nativer ID) abgefragt — während `treatmentControlSet` (Z. 284-287) beide Formen (`framework::id` und nativ) einträgt. Ein Ausschluss, der im Selektions-ID-Format gespeichert wurde, greift stillschweigend nicht. — Außerdem: Control mit `implStatus: "entbehrlich"` + gespeichertem Override `applicable: true` fällt aus allen vier Statuszählern (Z. 421-424) heraus; `validateSoAStats` Check 3 (Z. 643) schlägt dann an — die Invariante ist mit dem eigenen Datenmodell verletzbar. Fix: Exclusion-IDs durch `parseControlSelectionId` normalisieren; `entbehrlich` bei applicable=true wie `null` (nicht bewertet) zählen.

### P2-8 — incidentTriggerEngine: „unverzüglich"-Meldungen fehlen in der Ablauf-Warnliste; GDPR „unbekannt"-Risiko nicht konservativ
`incidentTriggerEngine.ts:187-194`: `ablaufendeFristen` filtert `s.restMs == null` raus — Meldestufen mit `dauer_h === 0` („unverzüglich", die dringendsten) erscheinen nie in der Warnliste. — Z. 147: `benachrichtigung_betroffene` nur bei `risiko === "hoch"`; bei `"unbekannt"` (laut Kernregel wie „ja"/worst) wird die Art.-34-Stufe nicht ausgelöst. Fix: dauer_h===0 mit restMs=0 in die Liste; `risiko !== "kein" && risiko !== "normal"` für die Betroffenen-Stufe.

### P2-9 — buildAnchorAnswerMap: Tie-Break `>=` bei identischem updated_at ist iterationsreihenfolge-abhängig
`assessmentEngine.ts:191`: bei gleichem Timestamp (Batch-Import, „Alle → Nein" in einer Transaktion) gewinnt die zuletzt iterierte Object-Key-Reihenfolge → nicht deterministisch über Clients/Reloads; zwei Nutzer sehen unterschiedliche geerbte Status. Fix: sekundärer deterministischer Tie-Break (z. B. framework+control_id lexikografisch).

### P2-10 — fristStatus/deadlineAmpel: ungültiges Datum ⇒ NaN ⇒ Ampel „gruen"
`incidentTriggerEngine.ts:167-176` / `deadlineEngine.ts:88-102`: `new Date(invalid).getTime()` = NaN → `pct = NaN`, alle `pct >= …`-Vergleiche false → Ampel bleibt **„gruen"**, `pct: Math.round(NaN) = NaN` sickert in die UI. Fix: `Number.isFinite(start)`-Guard mit explizitem Fehler-/kein_timer-Zustand.

### P2-11 — maturityV2: Familien ohne einen einzigen erfassten Reifegrad gehen mit ist=0 in den ungewichteten Overall ein
`maturityV2.ts:96-105, 138-140`: bei `usesMaturity=true` gilt „nur ERFASSTE Werte" pro Familie — aber eine Familie mit 0 erfassten Werten wird als `ist = 0` in `overall = Mittel über Familien` gezählt statt ausgeschlossen. 1 bewertete Familie (4.0) + 9 unbewertete ⇒ Overall 0.4. Zudem ist der Overall ein Makro-Mittel (Familie mit 1 Kontrolle wiegt wie eine mit 50). Vertretbar als „ehrlich", aber dann als solches labeln; sonst: unbewertete Familien aus dem Overall nehmen (`derived`-Flag pro Familie existiert bereits) und/oder nach `count` gewichten.

---

## Geprüft, ohne Befund (Kurznotiz)

- `riskQuantEngine.ts` (PERT/Monte-Carlo): degeneriertes Intervall, Gamma shape<1, Perzentil-Interpolation, Negativ-Klemmung — sauber; deterministisch per Seed.
- `computeStats`-Formeln selbst (Nenner `total - na`, Division-durch-0-Guards) korrekt — das Problem ist der vererbte `na`-Input (P0-1).
- `deadlineEngine.addInterval`/`parseIntervalString` inkl. pg-Objektform und HH:MM:SS — korrekt (UTC-Arithmetik).
- KPI #11 Fristtreue-Formel (Nenner = fällige Fristen, done ohne done_at zählt konservativ als verfehlt) — vertretbar.
- kpiEngine Velocity-Fenster/Baseline-Fallback, Projected-Completion (velocity ≤ 0 ⇒ ehrliches no_data) — korrekt.
- `worstStatus`, `familyOf`/`subFamilyOf` (Regex-Fallbacks, kein Crash-Pfad gefunden), `soaProjection`-Legacy-Migration on-read — ok.

---

## Zählung

| Severity | Anzahl |
|---|---|
| **P0** | 3 |
| **P1** | 6 |
| **P2** | 11 |
| **Gesamt** | 20 |
