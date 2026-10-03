# Marktreife GRC/ISMS-Berechnungs-Engines — Technische Referenz für den Engine-Neubau

Stand: 2026-07-18. Fokus: **Algorithmen, Datenmodelle, Formeln** — nicht Marketing. Ziel: eine verkaufbare, technisch anspruchsvolle Engine-Schicht bauen, die (a) Risiko quantifiziert, (b) Control-Status *ableitet* statt behauptet, (c) Frameworks mengentheoretisch mappt, (d) Reifegrade rollt, (e) Risiken priorisiert und (f) Evidence-Lebenszyklen fährt.

---

## 1. Quantitatives Risiko — Open FAIR (Factor Analysis of Information Risk)

FAIR ist der einzige internationale Standard für quantitative Cyber-Risikoanalyse (in ISO/IEC 27005 referenziert, Open Group Open FAIR Body of Knowledge). Kern: Risiko wird nicht als Ampel geschätzt, sondern als **Wahrscheinlichkeitsverteilung von Jahresverlust in Geld** über Monte-Carlo simuliert.

### 1.1 Die FAIR-Ontologie (Rechenbaum)

```
Risk (Annualized Loss Exposure, ALE, als Verteilung)
├── Loss Event Frequency (LEF)              [Ereignisse/Jahr]
│   ├── Threat Event Frequency (TEF)        [Versuche/Jahr]
│   │   ├── Contact Frequency (CF)
│   │   └── Probability of Action (PoA)
│   └── Vulnerability (Vuln)                [Wahrscheinlichkeit 0..1]
│       ├── Threat Capability (TCap)        [Fähigkeitsverteilung]
│       └── Resistance/Control Strength (RS/Difficulty)
└── Loss Magnitude (LM)                     [Geld/Ereignis]
    ├── Primary Loss (PL)
    └── Secondary Loss (SL)
        ├── Secondary Loss Event Frequency (SLEF)  [%-Anteil der Primärereignisse mit Sekundärfolge]
        └── Secondary Loss Magnitude (SLM)
```

Kernbeziehungen (pro Monte-Carlo-Iteration i):

- `LEF_i = TEF_i × Vuln_i`  (Vuln als Wahrscheinlichkeit, dass ein Versuch gelingt)
- Alternativ ableitbar: `Vuln = P(TCap > RS)` — Verwundbarkeit = Wahrscheinlichkeit, dass die Angreiferfähigkeit die Kontrollstärke übersteigt (zwei Verteilungen vergleichen).
- `TEF_i = CF_i × PoA_i`
- `LM_i = PL_i + (SLEF_i × SLM_i)`  (Sekundärverlust wird mit seiner bedingten Häufigkeit gewichtet)
- `Risk_i (ALE_i) = LEF_i × LM_i`

### 1.2 Loss Magnitude — 6 Verlustformen × 2 Ebenen

Loss Magnitude wird in **sechs Forms of Loss** zerlegt, jeweils für **Primary** (direkte Folge des Ereignisses) und **Secondary** (Reaktionen von Stakeholdern: Kunden, Regulierer, Aktionäre — erst wenn sie vom Vorfall erfahren):

| Form of Loss | Beispiel |
|---|---|
| Productivity | entgangene Wertschöpfung/Lohnkosten während Ausfall |
| Response | Forensik, Anwälte, Krisenkommunikation, Überstunden |
| Replacement | Ersatz/Reparatur von Assets (Server, korrupte DB) |
| Fines & Judgments | Bußgelder (DSGVO), Zivilurteile, Vertragsstrafen |
| Competitive Advantage | gestohlenes IP, Marktanteilsverlust |
| Reputation | Umsatzverlust durch Reputationsschaden |

Sekundärverlust ist **bedingt**: nicht jedes Primärereignis löst Sekundärfolgen aus → daher der SLEF-Faktor (z. B. 30 % der Datenlecks führen zu Bußgeld/Klage).

### 1.3 PERT-Verteilungen als Eingabe (kalibrierte Schätzungen)

SMEs liefern keine Punktwerte, sondern **kalibrierte 3-Punkt-Schätzungen**: Min, Most-Likely (Mode), Max — plus optional ein Confidence-Wert. Daraus wird eine **Modified/BetaPERT-Verteilung** gebildet.

Standard-PERT-Momente:
- `μ = (Min + λ·Mode + Max) / (λ + 2)` mit λ = 4 (Standard-Gewichtung des Modus)
- BetaPERT-Formparameter: `α = 1 + λ·(Mode − Min)/(Max − Min)`, `β = 1 + λ·(Max − Mode)/(Max − Min)`
- Ziehung: `sample = Min + Beta(α, β)·(Max − Min)`

Der Confidence-Wert steuert λ (höhere Konfidenz → höheres λ → schmalere Verteilung um den Modus). PERT wird bevorzugt gegenüber Triangular, weil sie den Modus glatt gewichtet statt harte Ecken zu erzeugen.

### 1.4 Monte-Carlo-Simulation

Ablauf pro Szenario (typisch 10.000–50.000 Iterationen):
1. Für jeden Blattknoten (CF, PoA, TCap, RS, PL-Formen, SLEF, SLM-Formen) eine PERT/BetaPERT-Ziehung.
2. Baum bottom-up auswerten → `ALE_i` je Iteration.
3. Über alle i die **Verteilung** von ALE bilden (nicht nur den Mittelwert).
4. Ergebnis-Statistiken: Min, Mean, Mode, P10/P50/P90, Max, sowie die Verlust-Exceedance-Kurve.

Referenz-Implementierung (Datenmodell-Vorlage): **pyfair** (`FairModel`, `FairMetaModel`, `FairModelFactory`, `FairDatabase`) — Knoten-basiertes Modell, das exakt diese Ontologie als DAG rechnet und Monte-Carlo je Knoten ausführt. Nachbaubar als: `nodes[]` mit `{name, distribution:{min,mode,max,conf}, parents[], formula}`.

### 1.5 Loss Exceedance Curve (LEC) — die verkaufbare Visualisierung

Die LEC ist die zentrale Output-Kurve:
- **X-Achse:** Verlusthöhe in €.
- **Y-Achse:** Wahrscheinlichkeit/Häufigkeit, dass der Jahresverlust diesen Betrag **überschreitet**.
- Konstruktion: Aus den N ALE-Samples die komplementäre Verteilungsfunktion (1 − CDF) bilden: `P(Loss > x) = #{ALE_i > x} / N`.

**Risk Appetite als Kurve, nicht als Zahl:** Über die LEC legt man eine **Toleranzkurve** (z. B. „Verlust > 1 Mio. € darf höchstens 1×/100 Jahre = 1 % Jahreswahrscheinlichkeit vorkommen"). Wo die Ist-LEC oberhalb der Appetit-Kurve liegt, ist das Risiko inakzeptabel. Das macht Risk Appetite messbar und pro Schwellenwert prüfbar.

### 1.6 Aggregation korrelierter Risiken (Portfolio-Ebene)

- **Unabhängige Aggregation:** ALE-Verteilungen mehrerer Szenarien werden über Monte-Carlo **gefaltet** (Iteration i über alle Szenarien summieren: `Portfolio_i = Σ_s ALE_{s,i}`) → aggregierte Portfolio-LEC.
- **Korrelation/Konzentration:** Wenn Szenarien gemeinsame Treiber teilen (derselbe Vendor, dasselbe Asset, dieselbe Kontrolle), dürfen die Ziehungen nicht unabhängig sein. Techniken: gemeinsame latente Variablen, **Copulas** (z. B. Gauß-Copula mit Korrelationsmatrix ρ) zum Koppeln der Rand-PERT-Verteilungen, oder gemeinsame Kontroll-Wirksamkeits-Faktoren. Ergebnis: „fat tails" — Konzentrationsrisiko wird sichtbar (ein Vendor-Ausfall trifft viele Szenarien gleichzeitig).
- Performance-Trick (Archer/RiskLens-Stil): Zwischenergebnisse (Sample-Arrays) persistieren, damit Portfolio-Neuberechnung bei Kompositionsänderung nicht die teure Simulation wiederholen muss.

### 1.7 Tool-Umsetzung
- **RiskLens / SAFE Security / Archer Insight**: FAIR-Engine + Monte-Carlo + LEC + Portfolio-Rollup + Risk-Appetite-Overlay. SAFE ergänzt automatisierte Signalzufuhr (Telemetrie → Vuln/TEF-Priors) statt reiner SME-Schätzung. ROSI wird FAIR-basiert als „ALE_vorher − ALE_nachher / Kontrollkosten" gerechnet (siehe §6).

**Quellen:** [pyfair Docs](https://pyfair.readthedocs.io/en/latest/) · [FAIR Loss Magnitude Crash Course (FAIR Institute)](https://www.fairinstitute.org/blog/a-crash-course-on-capturing-loss-magnitude-with-the-fair-model) · [Primary vs Secondary Loss](https://www.fairinstitute.org/blog/primary-vs.-secondary-loss-in-fair-analysis-whats-the-difference-and-why-it-matters) · [LEC in FAIR-U](https://www.fairinstitute.org/blog/announcing-loss-exceedance-charts-in-the-fair-u-training-app) · [ISACA: FAIR Risk Quantification](https://www.isaca.org/resources/isaca-journal/issues/2020/volume-5/how-fair-risk-quantification-enables) · [Safe Security: FAIR-Definition](https://safe.security/resources/blog/what-is-cyber-risk-the-fair-definition/)

---

## 2. Control-Scoring & abgeleiteter Status (Vanta/Drata/Secureframe/Hyperproof)

Kernprinzip der Marktführer: **Control-Status wird aus Tests abgeleitet, nicht behauptet.** Ein Control ist nicht „erfüllt", weil jemand es angehakt hat, sondern weil automatisierte Tests gegen verbundene Systeme *aktuell* bestanden sind.

### 2.1 Test → Control-Ableitung (die Kette)

```
Integration (AWS, GitHub, Okta, MDM…)  →  Test (Assertion gegen API-Daten)
        →  Test-Result {pass|fail|error, timestamp, findings[]}
        →  Control (1..n Tests zugeordnet)  →  Control-Status (abgeleitet)
        →  Requirement/Framework (Rollup)
```

- **Test**: eine maschinelle Assertion (z. B. „alle Prod-EC2 haben Verschlüsselung at rest"). Ergebnis = `pass`, `fail` (mit `findings[]` = Liste verstoßender Ressourcen) oder `error` (Integration kaputt).
- **Control-Status-Ableitung**: Ein Control gilt nur als OK, wenn **alle** zugeordneten Tests bestehen (AND-Logik) UND deren Evidence frisch ist. Ein einziger fehlschlagender Test → Control „failing".
- Vanta läuft Tests **stündlich**, Drata **täglich** (konfigurierbare Alert-Schwellen). Beide führen **Historie** je Test (wann lief er, was änderte sich) → Zeitreihe statt Point-in-Time-Snapshot. Das ist der Kern von **Continuous Control Monitoring (CCM)**.

### 2.2 Evidence-Frische (Freshness/TTL)

Jedes Evidence-Artefakt trägt ein `collected_at`. Ein Control mit veralteter Evidence (über TTL, z. B. 24 h für automatisiert, 90/365 Tage für manuell) fällt auf „stale/expired" — auch ohne fachlichen Fehlschlag. Datenmodell:

```
evidence { id, control_id, source(auto|manual), collected_at, ttl_days, hash, status }
freshness = now - collected_at
is_stale  = freshness > ttl_days
```

Manuelle Evidence bekommt Aufgaben-Workflows (Owner, Fälligkeit, Approval-Kette), weil nicht jedes Control per API prüfbar ist (Hybrid-Ansatz Hyperproof).

### 2.3 Control Health Score (Scoring-Formel, Referenzmodell)

Marktführer zeigen „% Tests passing" plus einen aggregierten Health-Score. Verkaufbare, nachbaubare Formel je Control:

```
ControlHealth = w_pass · (passing_tests / total_tests)
              + w_fresh · (fresh_evidence / total_evidence)
              − penalty(critical_findings)
```

Rollup auf Framework:
```
FrameworkReadiness = Σ_c (control_weight_c · ControlHealth_c) / Σ_c control_weight_c
```

- **Gewichtung** (`control_weight`): nach Kritikalität/Scope. Nicht jedes Control zählt gleich.
- **Konfidenz**: Ein Control, das nur durch manuelle Attestierung „grün" ist, hat niedrigere Konfidenz als eines mit stündlichem automatisiertem Test. Konfidenz = f(Anteil automatisierter vs. manueller Evidence, Test-Abdeckung, Freshness). Diese Konfidenz sollte in Scores mitgeführt und im UI ausgewiesen werden.

### 2.4 Drift-Detection

Zwischen Audits: kontinuierliche Tests erkennen, wenn ein zuvor grünes Control kippt (neue nicht-verschlüsselte Ressource, deaktiviertes MFA). Mechanik = Vergleich aktueller Test-Result gegen letzten Pass-Zustand; State-Übergang `pass→fail` erzeugt Alert + Findings-Delta. „Teams sehen, wo Controls stabil sind, wo Drift beginnt, wo Failures auftreten" — d. h. Zustandsmaschine je Control mit Übergangs-Log.

**Quellen:** [Drata Monitoring & Tests](https://drata.com/products/compliance/monitoring-and-tests) · [Drata Monitoring Help](https://help.drata.com/en/articles/4790546-monitoring) · [Drata Controls & Evidence](https://drata.com/products/compliance/controls-and-evidence) · [Drata: Assess & Manage Controls](https://help.drata.com/en/articles/13372784-assess-and-manage-individual-controls) · [Hyperproof: Evidence Collection](https://hyperproof.io/resource/automated-evidence-collection-solutions-what-to-look-for/) · [Hyperproof CCM/Features](https://hyperproof.io/resource/grc-platforms-features-you-need/)

---

## 3. Cross-Framework-Mapping-Engine (SCF/STRM, OSCAL, CCF)

### 3.1 Set Theory Relationship Mapping (STRM) — mengentheoretisch, defensibel

Der **Secure Controls Framework (SCF)** mappt seine ~1.100 Controls auf 200+ externe Frameworks/Gesetze mit **STRM** (formalisiert in **NIST IR 8477**). Jede Crosswalk-Beziehung zwischen zwei Controls ist **genau einer** von fünf mengentheoretischen Relationstypen — das macht Mappings konsistent und auditierbar statt „ungefähr ähnlich":

| STRM / OSCAL Relation | Bedeutung (Mengen A=Quelle, B=Ziel) |
|---|---|
| **Equal / Equivalent** | A ≡ B, identische Anforderung |
| **Subset-of** | A ⊂ B (A ist Teil von B) |
| **Superset-of** | A ⊃ B (A deckt B + mehr ab) |
| **Intersects-with** | A ∩ B ≠ ∅, aber beide haben Exklusiv-Anteile |
| **No relationship** | A ∩ B = ∅ |

`A superset-of B` ⇔ `B subset-of A` (Relationen sind umkehrbar) — wichtig für bidirektionale Propagation.

### 3.2 NIST OSCAL Control Mapping Model

OSCAL formalisiert dasselbe maschinenlesbar: das **Mapping Model** beschreibt Relationen zwischen Controls/Requirements **ohne den Quellinhalt zu duplizieren**. Relationstypen: `equivalent-to`, `equal-to`, `subset-of`, `superset-of`, `intersects-with`, `no-relationship`. SCF liefert Export als **OSCAL JSON** (+ CSV) → direkt in OSCAL-fähige Pipelines (FedRAMP-Automatisierung, automatisierte Gap-Analyse) importierbar.

Datenmodell (nachbaubar):
```
mapping { source_control_id, target_control_id, relation ∈ {equal, subset, superset, intersects, none}, confidence }
```

### 3.3 „Answer once, comply many" — Propagation mit Konfidenz

Common Controls Framework (CCF): eine Antwort/ein Evidence-Artefakt erfüllt viele Framework-Requirements gleichzeitig. Propagations-Logik, **relation-bewusst**:

- **Equal**: 100 % Propagation — Antwort auf A erfüllt B voll.
- **Superset-of** (A ⊃ B): A erfüllt B voll (A deckt alles von B ab). Konfidenz hoch.
- **Subset-of** (A ⊂ B): A erfüllt B nur **teilweise** → B bleibt „teilweise erfüllt", Rest offen. **Nicht** auf voll hochdrehen (all-or-nothing-Gate ist der klassische Bug: BSI 100 % → DORA 5 %). Korrekt: Teil-Projektion mit ehrlicher Deckelung auf „teilweise".
- **Intersects-with**: nur der Überlappungsanteil propagiert; Konfidenz gedeckelt; framework-spezifische Rest-Controls bleiben offen.
- **No relationship**: keine Propagation.

**Konfidenz-Score** je Propagation: „je direkter das Mapping, desto höher die Konfidenz" — Equal > Superset > Intersects > Subset. Dominant-Control-Muster (Apptega/Telos): ein Control als autoritative Quelle setzen, Änderungen kaskadieren automatisch an alle verlinkten Frameworks (Field-Propagation) → eliminiert manuelle Doppelpflege und „control stacking".

### 3.4 Reifegrad-gewichtete Vererbung

Vererbung sollte nicht binär sein, sondern die **Reife/Wirksamkeit** des Quell-Controls tragen: propagierter Erfüllungsgrad = `relation_factor × maturity_of_source`. Ein nur „ad hoc" umgesetztes BSI-Control sollte DORA nicht als „voll erfüllt" vererben.

**Quellen:** [SCF STRM (NIST IR 8477)](https://securecontrolsframework.com/start-here/set-theory-relationship-mapping-strm) · [SCF STRM Bundle](https://securecontrolsframework.com/strm-bundle/) · [SCF Download OSCAL/CSV](https://securecontrolsframework.com/free-content/scf-download) · [OSCAL Control Mapping Model](https://pages.nist.gov/OSCAL/learn/concepts/layer/control/mapping/) · [OSCAL Mapping Metaschema v1.2.0](https://pages.nist.gov/OSCAL-Reference/models/v1.2.0/mapping/json-definitions/) · [NIST IR 8477 PDF](https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8477.pdf) · [Vanta: Multi-Framework Cross-Mapping](https://www.vanta.com/collection/grc/multi-framework-cross-mapping) · [Telos: Predictive Mapping/Crosswalk](https://www.telos.com/blog/2021/08/19/predictive-mapping-and-control-crosswalk/) · [Apptega: Framework Crosswalking](https://www.apptega.com/platform/framework-crosswalking)

---

## 4. Reifegrad / Maturity (CMMI, CMMC, NIST CSF Tiers)

### 4.1 Skalen
- **CMMI-Skala 0–5** (Incomplete/Initial/Managed/Defined/Quantitatively Managed/Optimizing) — Prozessreife.
- **NIST CSF 2.0 Implementation Tiers 1–4** (Partial, Risk-Informed, Repeatable, Adaptive). CSF selbst schreibt **keine** Scoring-Methodik vor.
- **CMMC** (Level 1–3) — auditierbarer DoD-Compliance-Gate, nicht Reife im CMMI-Sinne.

### 4.2 Verbreitete Scoring-Mechanik (nachbaubar)
Gängigster Ansatz (all-about-GRC / SaltyCloud Isora):
1. Jede **Subcategory** (CSF 2.0: 106 Subcategories) auf **0–4** bewerten, an die Tiers angelehnt.
2. Aggregation zu **Category** (22 Kategorien) = Mittel der Subcategory-Scores.
3. Aggregation zu **Function** (6 Funktionen: GV, ID, PR, DE, RS, RC) = Mittel der Category-Scores.
4. **Overall = gewichteter Durchschnitt** über die 6 Funktionen.

Formeln:
```
Category_j    = Σ_k score(sub_jk) / n_j
Function_f    = Σ_j Category_fj / m_f
Overall       = Σ_f (w_f · Function_f) / Σ_f w_f
```
- **Domain-Gewichtung** `w_f`: nach Business-Priorität/Bedrohungslage; ohne Gewichte = einfaches Mittel.
- **Zielgap** (Target-Gap): pro Subcategory `gap = target_score − current_score`; Rollup zeigt, welche Domäne am weitesten vom Ziel entfernt ist → speist Roadmap (§6).
- **Trendmodell**: Reife als Zeitreihe (Snapshots je Assessment), Delta/Steigung je Domäne; Prognose per linearem Trend auf Zieltermin.

CMMI + CSF kombiniert: da CSF keine Score-Skala hat, nutzen Tools CMMI-Levels als Skala für jede der ~108 CSF-Controls. ISACA **CMMI Cybermaturity Platform** ist die kommerzielle Referenz.

**Quellen:** [all-about-GRC: NIST CSF 2.0 Maturity Assessment](https://allaboutgrc.com/nist-csf-2-0-maturity-assessment/) · [SaltyCloud Isora: NIST CSF Assessment](https://www.saltycloud.com/blog/nist-csf-assessment/) · [Workstreet: CMMI vs CMMC vs NIST](https://www.workstreet.com/blog/cmmi-vs-cmmc-vs-nist) · [ISACA CMMI Cybermaturity](https://www.isaca.org/enterprise/cmmi-cybermaturity-platform) · [Strikegraph: CMMC Gap Analysis](https://www.strikegraph.com/blog/conduct-cmmc-gap-analysis)

---

## 5. Risk-Register-Mechanik (inherent/residual, RCSA, Bow-Tie, KRIs)

### 5.1 Inherent → Control Effectiveness → Residual

- **Inherent Risk**: Risiko vor Kontrollen (Likelihood × Impact ohne Mitigation).
- **Residual Risk**: Risiko nach Kontrollen.
- **Control-Wirksamkeits-Faktor** ist die quantitative Brücke:

```
Control Effectiveness % = ((Inherent − Residual) / Inherent) × 100
⇔  Residual = Inherent × (1 − ControlEffectiveness)
```

Bei mehreren Kontrollen auf einem Risiko: kombinierte Wirksamkeit multiplikativ (Restrisiko-Ketten):
`Residual = Inherent × Π_c (1 − eff_c)` (Annahme unabhängiger Kontrollen) — verhindert, dass sich Wirksamkeiten „über 100 %" addieren.

### 5.2 RCSA (Risk & Control Self-Assessment)
Standard-Mechanismus zur **kollaborativen** Erzeugung von Inherent- und Residual-Scores mit Business-Ownern. Outputs speisen KRI-Dashboards, Loss-Event-DB, Szenarioanalyse und Board-Reports.

### 5.3 Risk-Control-Matrix (RCM)
n:m-Verknüpfung Risiko ↔ Control: jedes Risiko listet mitigierende Controls und deren Wirksamkeit; jedes Control zeigt, welche Risiken es senkt. Basis für „welche Kontrolllücke treibt welches Restrisiko".

### 5.4 Bow-Tie
Einseiten-Diagramm: **Threats (links) → Top-Event (Mitte) → Consequences (rechts)**, mit **Barrieren** auf jedem Pfad (präventiv links, mitigierend rechts). Jede kritische Barriere braucht **Owner + KRI**. Verknüpft Ursachenketten mit Kontrollen und macht Barriere-Ausfälle sichtbar.

### 5.5 KRIs (Key Risk Indicators)
Leading-Metriken je Barriere/Control. Mechanik: Schwellen (Grün/Amber/Rot). Breach von Amber → **automatische Flag zur Risiko-Neubewertung** (die Wirksamkeitsannahme hinter dem Residual-Score könnte sich ändern). KRI-Design leitet sich aus Residual-Niveau ab.

### 5.6 Korrelation / Konzentration
Aggregation über **gemeinsame Dimensionen**: Vendor, Asset, Control. Konzentrationsrisiko = wenn viele Risiken denselben Treiber teilen (ein Vendor-Ausfall trifft mehrere Prozesse). Metrik: Cluster-Exposure = Σ Residual aller Risiken je Vendor/Asset; Top-Konzentrationen als eigene aggregierte Risiken führen (Kopplung siehe §1.6).

**Quellen:** [RiskPublishing: Inherent vs Residual](https://riskpublishing.com/inherent-risk-vs-residual-risk-how-to-measure/) · [Financial Crime Academy: Risk Formula](https://financialcrimeacademy.org/risk-formula-definition/) · [AdaptiveGRC: Inherent/Residual/RCSA](https://adaptivegrc.com/resources/articles/inherent-residual-risk-controls/) · [Wolters Kluwer: RCSA Best Practices](https://www.wolterskluwer.com/en/expert-insights/risk-and-controls-self-assessment-rcsa-best-practices) · [RiskPublishing: Bow-Tie Guide](https://riskpublishing.com/bow-tie-risk-analysis-complete-guide-with/) · [Flow GRC: KRIs](https://www.flowgrc.com/blog/key-risk-indicators)

---

## 6. Priorisierung / Roadmap (Risk-Reduction-per-Effort, ROSI)

### 6.1 Risk-Effort-Index / „Biggest bang for buck"
Kernidee (CyberArk Blueprint, Safe Security): maximiere **Risikoreduktion pro Aufwand**.
```
Priority Score = RiskReduction / Effort
RiskReduction  = Inherent/Residual_vorher − Residual_nachher   (idealerweise in € via FAIR)
```
Sortiere Maßnahmen absteigend nach Priority Score → Quick-Wins-Ranking.

### 6.2 ROSI (Return on Security Investment), FAIR-basiert
```
ROSI = (ALE_vorher − ALE_nachher − Kontrollkosten) / Kontrollkosten
```
FAIR-Institut-Nuance: ROSI ist gut für **schnelle Einzelmaßnahmen**, unzureichend für mehrjährige Projekte über mehrere Budgetjahre (dann NPV/mehrperiodige Betrachtung). ALE_vorher/nachher aus zwei FAIR-Läufen (mit/ohne Kontrolle).

### 6.3 Quick-Wins-Algorithmus
- **Quick Win** = hoher RiskReduction, niedriger Effort (MFA aktivieren). Baut Momentum + Stakeholder-Vertrauen.
- Mischung: Quick Wins + langfristig-strategische Projekte (Zero-Trust). 2×2-Matrix (Effort × Impact) → Quadrant „high impact / low effort" zuerst.
- **Ressourcenoptimierung** als Knapsack-Problem: maximiere Σ RiskReduction unter Budget-/FTE-Nebenbedingung → greedy nach Priority Score oder 0/1-Knapsack für exakte Auswahl.

### 6.4 Vulnerability-Kontext (über CVSS hinaus)
Priorisierung nutzt nicht nur Severity, sondern **Exploitability (EPSS), Business Impact, Environmental Context** (Wiz/Ivanti) — d. h. gewichtete Score-Kombination statt nackter CVSS.

**Quellen:** [CyberArk: Risk-based Prioritization](https://docs.cyberark.com/detect-and-respond/latest/en/content/blueprint/risk-based-prioritization.htm) · [Safe Security: Risk Prioritization Framework 2026](https://safe.security/resources/blog/the-modern-risk-prioritization-framework-for-2026/) · [FAIR Institute: Redefining ROSI](https://www.fairinstitute.org/blog/redefining-rosi-return-on-security-investment) · [Wiz: Vulnerability Prioritization](https://www.wiz.io/academy/vulnerability-management/vulnerability-prioritization) · [Quest: Cybersecurity Roadmap](https://questsys.com/security-blog/Designing-a-Cybersecurity-Roadmap/)

---

## 7. Evidence-Automation (Integrationen → Nachweis → Attestation)

### 7.1 Architektur
```
Integration (200+ Konnektoren)  →  Collector (API-Pull, geplant)
   →  Evidence-Artefakt {hash, collected_at, source, control_links[]}
   →  Test-Assertion  →  pass/fail  →  Control-Status (§2)
   →  Report/Dashboard  ↔  Risk ↔ Control ↔ Framework (nativ verknüpft)
```
Hyperproof: Evidence ist **nativ** an Risks, Controls, Frameworks, Tasks, Dashboards gebunden — nicht isoliert verwaltet.

### 7.2 Hybrid (auto + manuell)
Nicht jedes Control ist per API prüfbar. Zweigleisig:
- **Automatisiert**: Integration-Pull, kurze TTL, hohe Konfidenz.
- **Manuell**: strukturierte Workflows — zugewiesene Aufgabe, Fälligkeit, Approval-Kette, Upload/Attestierung, längere TTL, niedrigere Konfidenz.

### 7.3 Nachweis-Lebenszyklus
`collect → validate/test → link → expire(TTL) → recollect`. Historie je Artefakt (Zeitreihe) für Auditor-Sicht „wann lief was, was änderte sich". Attestation-Workflow = signierte Bestätigung eines Owners mit Zeitstempel als Evidence-Typ.

**Quellen:** [Hyperproof: Automated Evidence Collection](https://hyperproof.io/resource/automated-evidence-collection-solutions-what-to-look-for/) · [Hyperproof Produkt/CCM](https://hyperproof.io/product/) · [Drata: Controls & Evidence](https://drata.com/products/compliance/controls-and-evidence)

---

## 8. Benchmarks / Scoring nach außen (Trust Scores, Posture, Peer-Benchmark)

- **Trust/Posture Score**: aggregierter, extern zeigbarer Score aus Control-Health + Framework-Readiness + Freshness. In **Trust Center** (Vanta) live gezeigt, um Security-Reviews zu verkürzen (Nachweis vor Nachfrage).
- **Peer-Benchmarking**: Vanta **Trust Maturity Report** — aggregierte, anonymisierte First-Party-Daten von **11.000+ Kunden**, an **NIST-CSF-Tiers** ausgerichtet: 4 Tiers (Partial, Risk-Informed, Repeatable, Adaptive). Kategorisierungskriterien: **Policy-Abdeckung, AI-Adoption, Incident-Response-Planung, Risk-Assessments**. Das ist die Blaupause für „vergleiche dich mit deiner Kohorte".
- **Externe Rating-Modelle** (SecurityScorecard/UpGuard-Klasse): outside-in-Signale (aggregiert zu A–F-Grade) — komplementär zu inside-out-GRC-Scores.

Nachbaubarer Posture-Score:
```
Posture = w1·FrameworkReadiness + w2·avg(ControlHealth) + w3·EvidenceFreshness − w4·OpenCriticalFindings
Peer-Perzentil = rank(Posture) innerhalb Kohorte (Branche/Größe)
```

**Quellen:** [Vanta Trust Maturity Report](https://www.vanta.com/reports/trust-maturity-report) · [Vanta: Report-Einführung/Methodik](https://www.vanta.com/resources/introducing-vanta-trust-maturity-report) · [BusinessWire: 11.000+ Orgs Benchmark](https://www.businesswire.com/news/home/20250709100315/en/Vanta-Unveils-Trust-Maturity-Report-Benchmarking-Security-Programs-Across-11000-Organizations) · [Vanta Trust Center](https://www.vanta.com/products/trust-center) · [UpGuard: Vanta vs SecurityScorecard](https://www.upguard.com/compare/vanta-vs-securityscorecard)

---

## Synthese: Was die Engine-Schicht können muss

1. **FAIR-Knotenbaum + Monte-Carlo** (PERT-Eingaben, N≥10k, LEC-Output, Portfolio-Faltung mit Korrelation) — Risiko in €, nicht Ampel.
2. **Ableitungs-Engine** Test→Control→Framework mit Freshness-TTL, Health-Score, Drift-Zustandsmaschine, Konfidenz.
3. **Relation-bewusste Mapping-Engine** (STRM/OSCAL 5 Relationstypen) mit teil-projizierender Propagation (kein all-or-nothing-Gate) und reife-gewichteter Vererbung.
4. **Maturity-Rollup** (Sub→Cat→Function, gewichtet, Zielgap, Trend).
5. **Risk-Register** mit `Residual = Inherent × Π(1−eff)`, RCM, Bow-Tie-Barrieren, KRI-Amber-Trigger, Vendor/Asset-Konzentration.
6. **Priorisierung** RiskReduction/Effort + FAIR-ROSI + Knapsack unter Budget.
