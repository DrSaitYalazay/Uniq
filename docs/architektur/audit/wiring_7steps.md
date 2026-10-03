# 7-Schritt-Pipeline — End-to-End-Verdrahtungsaudit (2026-07-19)

Auftrag Dr. Sait: „7 adımdaki tüm bağlantıları kontrol et — saat gibi çalışmalı."
Methode: Datenfluss-Karte je Seite (read/write auf Tabellen- + tool_key-Ebene),
dann Handoff-für-Handoff auf tote Schlüssel / fehlende Propagierung geprüft.
Verifikationsdoktrin: esbuild (kein tsc), Befunde im Code mit Datei:Zeile belegt.

## Verifizierte Datenfluss-Karte

| Schritt | Seite | schreibt | liest |
|---|---|---|---|
| 1 Scope/Kontext | Scope.tsx | company_profiles (enabled_frameworks, Profil, Schutzniveau) | frameworks |
| 2 Inventar | Inventory.tsx | assets, services, dependencies | company_profiles |
| 3 Gap-Analyse | Assessment.tsx (useAssessment) | answers (tenant_id,framework,control_id,asset_id) | controls, control_iso, control_node_member, control_mapping, assets/services |
| 4 Risikoanalyse | Risk.tsx (useRiskAnalysis) | **tool_key "risk-treatment"** (treatments + risk_level) | answers, controls, control_iso, control_node_member, control_effect (flag) |
| 5 SoA & Roadmap | Roadmap.tsx | tool_key "soa", roadmap_items | answers, control_iso, **Risiko-Register** |
| 6 Umsetzung | Implementation.tsx | implementation_status | controls, tool_key "audit-actions" |
| 7 Audit & KVP | AuditWorkbench.tsx | tool_key "audit-workbench", "audit-actions" | "risk-treatment", "audit-actions", answers |

Persistenz-Fakt (kein Befund): `user_tool_data` wird per `user_id = getTenantId()
= RPC get_org_owner_id` gespeichert ⇒ org-geteilt. Multi-User-Divergenz liegt
hier nicht vor.

## Handoff-Status

1. **Scope → 2/3/4/5** — OK. enabled_frameworks/Schutzniveau werden überall aus
   company_profiles gelesen; Folgeschritte degradieren bei leerem Scope sauber
   (activeKeys.length===0 ⇒ leere Liste, kein Crash; z. B. Implementation.tsx:190).
2. **Inventar → 3/4** — OK. asset_id-Verknüpfung konsistent; Risk bezieht
   Asset-Kritikalität/SPOF über toAssetInfo.
3. **Gap → Risk / Gap → Roadmap** — OK. Beide lesen `answers` mit demselben
   Schlüsselraum `framework::control_id::asset_id` (useAssessment.answerKey ↔
   useRiskAnalysis:271 ↔ Roadmap loadData:528/564).
4. **Risk → Roadmap** — **BROKEN → BEHOBEN (P0).** Risk (Schritt 4) persistiert
   das Risiko-Register inkl. `risk_level` je Treatment unter tool_key
   **"risk-treatment"** (Risk.tsx:51/147). Roadmap las das Register jedoch aus
   **"nis2-treatment-engine"** (Roadmap.tsx:484 alt) — ein Alt-NIS2Suite-Schlüssel,
   den **kein Schreiber im gesamten Repo** befüllt (grep 0 Treffer). Folge:
   `treatmentData.treatments` war immer leer ⇒ `buildRiskLinkageMap(...)`
   (Roadmap:597, ruft mit `risks=null` ⇒ fällt ausschließlich auf
   `treatments[].risk_level` zurück, soaRiskLinkage.ts:47ff) lieferte eine leere
   Linkage ⇒ `linkedToHighRisk` dauerhaft `false` ⇒ Now/Next/Later-Sequenzierung,
   Effort- und RiskReduction-Scores ignorierten die reale Risikolage.
   **Fix:** Roadmap.tsx liest jetzt "risk-treatment". `customControls`/
   `excludedControls` (im Risk-Register nicht vorhanden) sind mit `?? []`
   abgesichert; `manualControlIds` wird in Roadmap nicht konsumiert; `implStatus`
   stammt aus der Control-Projektion, nicht aus dem Treatment ⇒ Repoint ist
   verhaltensneutral außer der jetzt wiederhergestellten Risiko-Linkage.
5. **Risk → Audit** — OK. AuditWorkbench.tsx:132 liest "risk-treatment".
6. **Roadmap → Implementation** — THIN (P2, Design). Implementation listet alle
   aktiven-Framework-controls (Implementation.tsx:198) und trackt Status separat
   in `implementation_status` (bundle_key). Die SoA-Anwendbarkeit/`excludedControls`
   aus Schritt 5 (tool_key "soa") filtert die Umsetzungsliste NICHT. Kein toter
   Link, aber die „nicht anwendbar"-Entscheidung propagiert nicht in die Umsetzung.
   Bewusst als Design belassen (keine stille Verhaltensänderung ohne Freigabe).
7. **Umsetzung ↔ Audit** — OK (Kreis geschlossen). Audit schreibt Korrektur-
   maßnahmen → "audit-actions" (AuditWorkbench.tsx:301), Implementation liest sie
   (Implementation.tsx:138, „Korrekturmaßnahmen aus dem Audit").
8. **Neue Engine-Tabellen** — angekommen, nicht verwaist:
   control_effect (useRiskAnalysis, flag-gated), control_tests (ControlMonitoring
   + useControlHealth), answer_evidence/evidence (EvidencePanel in Assessment/
   ControlRowItem), maturity_targets (MaturityPanel in Assessment), kpi_snapshots
   (Dashboard, Roadmap-Projektion), compliance_deadlines (Dashboard, Incident).
9. **Schlüssel-Integrität** — OK. framework::control_id ist der Pipeline-Schlüssel;
   node_id bleibt Brücke (control_node_member/control_mapping) innerhalb der
   Projektion, leckt nicht in Roadmap/Implementation-Schlüssel.
10. **Leerzustand/Reihenfolge** — OK. Schritte 4–6 vor 1–3 geöffnet ⇒ leere,
    keine Null-Crashes (activeKeys-Guards, `?? []`, no_data-Pfade).

## Fix-Liste
- [P0, BEHOBEN] #4 Risk→Roadmap Treatment-Schlüssel „nis2-treatment-engine"
  → „risk-treatment" (Roadmap.tsx). Verifiziert: esbuild OK, Fixtures 9/9.
- [P2, offen/Design] #6 SoA-Anwendbarkeit (excludedControls) → Umsetzungsliste
  filtern — nur nach ausdrücklicher Freigabe (ändert sichtbares Verhalten).

## Datenintegritäts- & Robustheits-Sweep (D1–D6, 2026-07-19)

- **D1 [P0, BEHOBEN] Paginierung ohne stabile Sortierung.** Zahlreiche
  `.range()`-Reads ohne `.order()` (control_iso, control_node_member, answers,
  control_mapping, control_effect, assets, services, dependencies, controls in
  useAssessment/useRiskAnalysis/useFrameworkCatalog/Implementation/AuditWorkbench).
  Ab Tabelle > Seitengröße (1000) überspringt/dupliziert PostgREST Zeilen →
  unvollständige Antworten/Vererbung → falsche Compliance-Zahlen. Fix: total-order
  (`id` bzw. deterministische Mehrspalten-Keys). Commit 9958381.
- **D2 [P1, BEHOBEN] Unvollständiger Tenant-Wipe.** wipe_tenant_data +
  count_tenant_data deckten 14 tenant-scoped Tabellen NICHT ab, u. a. die
  aktuelle `public.answers`. „Alle Daten zurücksetzen" ließ Bewertungen, Roadmap,
  Umsetzung, Control-Tests, Evidence, Deadlines, Reifegrad-Ziele, KPI u. a. stehen.
  Neue Migration 20260719000001 (FK-sichere Reihenfolge, korrekte Owner-Spalten,
  globale Kataloge unangetastet). Commit 9958381.
- **D3 [P2, ENTSCHEIDUNG NÖTIG] SoA-Anwendbarkeit → Umsetzung.** Erfordert die
  ISO-Brücke (SoA ist ISO-Hub-basiert, Umsetzung listet native FW-Controls) plus
  UX-Entscheidung (ausblenden vs. markieren). NICHT blind umgesetzt — eine
  fehlerhafte Schlüssel-Zuordnung würde Controls falsch verbergen.
- **D4 [KEIN BEFUND, VERIFIZIERT] anchor `.map(a=>a.anchorId)`.** Wird nur zum
  Bauen der LWW-Antwort-Map genutzt (Relation dort irrelevant); die Relation
  bleibt über die separat an projectAnswer übergebene AnchorRef[]-Map erhalten.
  Korrekter Code — keine Änderung.
- **D5 [ENTSCHEIDUNG NÖTIG] `na`/`entbehrlich` Cross-Framework-Vererbung.** Ob
  „nicht anwendbar" über same-as-Knoten in andere Frameworks vererbt (und deren
  Compliance-% beeinflusst), ist eine Methodik-Entscheidung, kein klarer Defekt.
  Cross-FW-Vererbung ist bereits per inheritanceMode='off' abschaltbar. Nicht
  blind geändert (würde angezeigte Zahlen verschieben).
- **D6 [teils BEHOBEN] Robustheit/Politur.** deadline-reminder Log+Mail jetzt
  atomar (Commit separat). Offen (kosmetisch): EvidencePanel EN-i18n (deutsche
  Labels im EN-Modus; deutschsprachiges Zielprodukt), UTC/lokal in
  freshness/fristStatus, NaN-Defaults.
