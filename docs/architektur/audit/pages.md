# Fable5-Audit — Seiten/UI + neues Wiring (CyberWerkSuite)

Repo: `/Users/sekercakil/Downloads/ClaudeCWS` · Stand: 2026-07-18
Geprüft: ManagementReview, EvidencePanel, ControlRowItem, Dashboard (Fristen-Kachel), IncidentManagement, MaturityPanel, Assessment + Engines (evidenceEngine, deadlineEngine, reportKit, useToolData, useFrameworkInheritance) + DB-Migrationen + api/storage. Stichproben: Policies, Trainings, DocumentLifecycle, BusinessContinuity, DatenschutzCockpit, SupplierCheck, ThirdPartyRisk, ProcurementCheck, KiGovernance, AuditWorkbench.

**Bilanz: 17 Befunde — 2× P0, 6× P1, 9× P2.**

---

## P0 — Crash / Datenverlust / Sicherheit

### P0-1 · Evidence-Datei-Upload ist komplett funktionsunfähig (Bucket + RLS fehlen)
**DATEI:** `db/migrations/20260717000003_evidence.sql` (gesamt), `db/00_bootstrap.sql:197-199`, `web/src/lib/evidenceEngine.ts:187-207`

Die Migration legt `evidence`/`answer_evidence`-Tabellen an, aber **weder den Storage-Bucket `evidence` noch storage.objects-Policies**. Bootstrap kennt nur einen Bucket:

```sql
-- 00_bootstrap.sql:197
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
```

`storage.objects.bucket_id` hat FK `REFERENCES storage.buckets(id)` (Zeile 170) → der INSERT in `api/src/storage.js:42` scheitert mit FK-Verletzung. Selbst mit Bucket: `storage.objects` hat RLS aktiv (`00_bootstrap.sql:179`), aber alle vier Policies (`schema.sql:4922-4956`) matchen nur `bucket_id = 'company-logos'` → INSERT für `evidence` würde von RLS abgelehnt. Jeder Datei-Upload im EvidencePanel („Datei anhängen") schlägt somit IMMER fehl; nur Link/Attestierung funktionieren.

**FIX:** Migration ergänzen: `INSERT INTO storage.buckets VALUES ('evidence','evidence',false)` + vier Policies analog `company_logos_*` mit `bucket_id='evidence' AND (storage.foldername(name))[1] = COALESCE(get_org_owner_id(auth.uid()), auth.uid())::text` (Pfad `<tenant_id>/…` passt bereits zu `uploadEvidenceFile`).

### P0-2 · Stored XSS im Management-Review (unescaptes HTML via dangerouslySetInnerHTML)
**DATEI:** `web/src/pages/ManagementReview.tsx:210-219, 500` · `web/src/lib/reportKit.ts:75-80`

`buildReportBody()` interpoliert Freitexte ungefiltert in HTML:

```tsx
`<p>${(entry.beschluesse || …).replace(/\n/g, "<br>")}</p>`
```

und rendert das in-App: `dangerouslySetInnerHTML={{ __html: previewHtml }}` (Z. 500). Auch `rkTable`/`rkScoreBox` escapen nichts (`reportKit.ts:79: rows.map(r => …<td>${c}</td>)`) — Risiko-Titel (`gap_title`) und Teilnehmer/NIS2-Text fließen roh ein. Die Review-Historie liegt im **org-weit geteilten** Blob (`useToolData("management-review", …)`): Ein Org-Mitglied, das `<img src=x onerror=…>` in „Beschlüsse" einträgt, führt beim Vorschau-Klick JEDES anderen Mitglieds Script im App-Origin aus (Session/Token-Zugriff). Gleiches HTML landet via `rkExport` im Print-Fenster (`document.write`).

**FIX:** Zentrales `escapeHtml()` (`&<>"'`) in `buildReportBody` auf ALLE dynamischen Strings anwenden; besser zusätzlich in `rkTable`/`rkScoreBox`/`rkKpiRow` (Zellen sind Daten, kein Markup — betrifft dann auch Gap-Reports).

---

## P1 — Falsches Verhalten

### P1-1 · finalize(): nicht atomar, nicht idempotent — Duplikate bei Retry + Fristen-Akkumulation
**DATEI:** `web/src/pages/ManagementReview.tsx:240-333, 280-287`

Drei sequenzielle Writes (createEvidence → createDeadline → kpi_snapshots-Insert) ohne Kompensation: Schlägt der KPI-Insert fehl (`if (kpiErr) throw`, Z. 313), sind Nachweis + Frist bereits persistiert; der Nutzer sieht „Fehler", klickt erneut → **doppelter Nachweis + doppelte Frist**. Zusätzlich wird die Folge-Frist ohne `ref_table`/`ref_id` und ohne Abschluss der Vorgänger-Frist angelegt:

```ts
await createDeadline(supabase, { tenant_id, kind: "audit_cycle",
  label: "Nächstes Management-Review (ISMS 9.3)", … recurrence: "1 year" });
```

Jedes Finalize (auch zwei Reviews im selben Jahr) erzeugt eine WEITERE offene Jahres-Frist — die Dashboard-Kachel füllt sich mit Duplikaten. (Der Doppelklick-Fall selbst ist durch `busy`+React-18-Flush praktisch abgedeckt; das Problem ist Retry/Wiederholung.)

**FIX:** `ref_table:"tool", ref_id:"management-review"` setzen und vor dem createDeadline `cancelDeadlinesByRef(supabase,"tool","management-review")` (Muster wie IncidentManagement); Fehler je Teilschritt sammeln statt hart abbrechen (z. B. Nachweis-ID in `meta` merken, kpi-Insert non-fatal mit Warn-Toast).

### P1-2 · „Datei"-Link auf Nachweise liefert immer 404 (Public-URL ohne Auth)
**DATEI:** `web/src/lib/evidenceEngine.ts:210-212`, `web/src/components/EvidencePanel.tsx:294-303`, `api/src/storage.js:58-73`

```ts
export function evidenceFileUrl(client, storagePath) {
  return client.storage.from(EVIDENCE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}
```

wird als plain `<a href target="_blank">` gerendert. Der Browser-GET läuft OHNE `Authorization`-Header; `GET /storage/:bucket/*` prüft aber RLS via `req.claims` aus dem Header → Objekt unsichtbar → 404 („Bulunamadı"). Der Download-Link ist für jeden geschützten Nachweis tot (sobald P0-1 gefixt ist, fällt das sofort auf).

**FIX:** `onClick` mit `supabase.storage.from("evidence").download(path)` → `URL.createObjectURL(blob)`; alternativ Signed-URL-Route im API.

### P1-3 · Inheritance „off" wird auf Asset-Ebene ignoriert
**DATEI:** `web/src/pages/Assessment.tsx:141-150, 215-229`

Org-Ebene ist korrekt verdrahtet (`inheritanceMode === "off" ? new Map() : buildAnchorAnswerMap(…)`, Z. 134-139; ebenso `useComplianceOverview.ts:59-64` und `AuditWorkbench.tsx:203-208`). Aber `isoAssetAnswerByAsset` wird **bedingungslos** aus ISO-Antworten gebaut, und `buildAssetEffective` projiziert damit weiter:

```ts
if (fw !== "ISO27001" && isoAssetAnswerByAsset.has(assetId)) {
  const projected = projectAnswer(control, undefined, isoAssetAnswers, isoAnchorsBySpokeControl);
  if (projected.status) return projected;
}
```

Bei „Übernahme aus" erben Asset-Overrides in NIS2/DORA & Co. trotzdem ISO-Asset-Antworten → Zahlen im Asset-Panel widersprechen der Org-Ansicht.

**FIX:** `const isoAssetAnswerByAsset = useMemo(() => inheritanceMode === "off" ? new Map() : …, [answers, inheritanceMode])`.

### P1-4 · IncidentManagement: zentrale Fristen laufen aus dem Ruder (Löschen/Status/Race)
**DATEI:** `web/src/pages/IncidentManagement.tsx:133-134, 147-174, 187-195`

1. `remove(id)` löscht den Vorfall nur im Blob — **kein** `cancelDeadlinesByRef(supabase,"incidents",id)` → verwaiste offene `compliance_deadlines`, die auf dem Dashboard ewig als überfällig leuchten.
2. `setMeldungStatus(… "abgesendet"/"entfallen")` schließt/storniert die gespiegelte zentrale Frist nie → lokal „erledigt", zentral weiter offen/rot.
3. `materializeDeadlines`: cancel→insert ist nicht atomar; zwei schnelle Klicks auf „Meldepflichten auflösen" laufen parallel (beide canceln, beide inserten) → doppelte Fristen. Die versprochene „Idempotenz" gilt nur sequenziell.
4. `catch { /* non-fatal */ }` (Z. 171-173) schluckt ALLES stumm — Register und zentrale Fristen divergieren ohne jedes Feedback (verstößt gegen „Tahmin yok / ehrliche Daten").

**FIX:** `remove` → vorher `void cancelDeadlinesByRef(supabase,"incidents",id)`; bei Status „abgesendet/entfallen" passende Frist per ref+meta.stufe `done/cancelled` setzen; `materializeDeadlines` mit In-Flight-Ref guarden; im catch mindestens `toast.warning("Zentrale Fristen nicht aktualisiert")`.

### P1-5 · Fristen können nirgends abgeschlossen werden — `completeDeadline` ist tot verdrahtet
**DATEI:** `web/src/lib/deadlineEngine.ts:153-201` (einziger Definitionsort), `web/src/pages/Dashboard.tsx:85-103`

Grep über `web/src`: `completeDeadline` wird von KEINER Seite aufgerufen. Die Fristen-Kachel rendert nur `überfällig/offen`-Text ohne Aktion; auch ManagementReview/Incidents schließen nie eine Frist ab. Folge: Jede jemals erzeugte Frist bleibt bis in alle Ewigkeit `open/overdue`, der Recurrence-Rollover (Kernfeature der Engine) kann nie feuern, und die „X überfällig"-Badge ist nach kurzer Zeit dauerhaft rot → Kachel wird ignoriert.

**FIX:** „Erledigt"-Button je Zeile in `FristenCard` (`completeDeadline(supabase, d.id)` + Reload); ManagementReview-finalize sollte die fällige Vorgänger-Review-Frist mit `completeDeadline` schließen (erzeugt dann korrekt die Folgeinstanz statt P1-1-Duplikat).

### P1-6 · useToolData: Auto-Save-Fehler wird stumm verschluckt → stiller Datenverlust
**DATEI:** `web/src/hooks/useToolData.ts:162-172`

```ts
const { error } = await supabase.from(TABLE).upsert(…);
if (!error) { lastRemotePayload.current = payload; … }
// KEIN else — Fehler (RLS, Netz, 4mb-JSON-Limit) verschwindet spurlos
```

Betrifft ALLE Werkzeug-Seiten (Incidents, TPRM, BCM, KiGov, Datenschutz-Cockpit, ManagementReview-Historie): Der Nutzer editiert weiter, localStorage sieht gut aus, Cloud/Org-Row bleibt alt — beim nächsten Gerät/Kollegen ist alles weg. Hinweis: `express.json({ limit: '4mb' })` (api/src/index.js:27) deckelt große Blobs zusätzlich — genau der Fall, der hier lautlos scheitert.

**FIX:** Bei `error` einmaligen `toast.error` (throttled) + Retry beim nächsten Change; `lastSaved`-Anzeige in Seiten, die es noch nicht zeigen.

---

## P2 — UX / Konsistenz

### P2-1 · EvidencePanel ist komplett Deutsch — auch in der EN-App
**DATEI:** `web/src/components/EvidencePanel.tsx:66-79, 196, 211, 226, 244-262, 383-453`
Alle Labels/Toasts hart deutsch („Nachweise", „Anhängen fehlgeschlagen", „gültig bis", „Datei (max. 12 MB)"); die Komponente erhält kein `de`-Prop, obwohl `ControlRowItem` `de` überall durchreicht. **FIX:** `de`-Prop + Label-Map wie in den Nachbarkomponenten.

### P2-2 · EvidencePanel nur hinter dem „Kommentar"-Toggle erreichbar
**DATEI:** `web/src/components/assessment/ControlRowItem.tsx:241-243`
`{notesOpen && <EvidencePanel …/>}` — Nachweise sind unauffindbar, solange man nicht „Kommentar ▼" klickt; kein Zähler-Badge an der Kontrolle. **FIX:** eigener Toggle „Nachweise (n)" oder Panel an `assetsOpen`-Muster angleichen.

### P2-3 · 12-MB-Versprechen vs. 10-MB-Multer + Datei-Waise bei Insert-Fehler
**DATEI:** `web/src/lib/evidenceEngine.ts:88, 193-195` vs. `api/src/storage.js:13` (`fileSize: 10*1024*1024`); `web/src/components/EvidencePanel.tsx:166-204`
Raw-PUT-Pfad erlaubt 12 MB (`express.raw limit '12mb'`), Multipart-Pfad nur 10 MB — inkonsistente Limits. Zudem: schlägt `createEvidence` NACH `uploadEvidenceFile` fehl, bleibt die hochgeladene Datei als Waise im Bucket. **FIX:** Limits vereinheitlichen (12 MB in multer) und bei Insert-Fehler `storage.remove([path])` best-effort.

### P2-4 · deleteEvidence löscht global ohne Warnung vor Mehrfach-Verknüpfung
**DATEI:** `web/src/components/EvidencePanel.tsx:206-220`, `web/src/lib/evidenceEngine.ts:257-276`
Papierkorb-Klick löscht den Nachweis endgültig (Datei + Zeile + ALLE `answer_evidence`-Links via CASCADE) — auch wenn er an fünf anderen Kontrollen hängt bzw. dort „geerbt" angezeigt wird. Kein confirm(). **FIX:** Link-Count abfragen und Bestätigungsdialog „wird auch von X anderen Kontrollen entfernt".

### P2-5 · Fristen-Kachel: due_at-lose Fristen unsichtbar
**DATEI:** `web/src/pages/Dashboard.tsx:79-80`, `web/src/lib/deadlineEngine.ts:224-241`
`upcomingDeadlines` filtert `!!d.due_at`, `overdue` ebenso → offene Fristen mit `due_at NULL` („unverzüglich"/auf Ersuchen, z. B. KRITIS-Nachweis) erscheinen NIRGENDS; Kachel meldet „Keine anstehenden Fristen", obwohl offene existieren. Fristen >14 Tage ebenfalls unsichtbar (ohne Hinweis „+n weitere"). **FIX:** Sektion „ohne Termin (n)" + Fußzeile „n weitere offene Fristen".

### P2-6 · ManagementReview: Kachel-Daten veralten nach finalize; NIS2-Flag nicht reaktiv
**DATEI:** `web/src/pages/ManagementReview.tsx:91-102, 81`
`openDeadlines` wird nur bei Mount geladen — nach finalize zeigt „Offene Fristen" weder die neue Review-Frist noch den Snapshot-Wert korrekt beim nächsten Review. `const nis2 = isNis2Active()` liest localStorage einmal pro Render statt den FrameworkContext (Scope-Änderung im anderen Tab greift nicht). **FIX:** nach finalize `listOpenDeadlines` erneut laden; `useFramework()` statt localStorage-Helfer.

### P2-7 · Deutsch-only-Inhalte in EN-Modus mehrerer Werkzeuge
**DATEI:** `web/src/pages/BusinessContinuity.tsx:51-59` (Gap-Texte), `ThirdPartyRisk.tsx:34-38, 54-57, 66, 120-121` (KRIT_META nur de + Gap-Texte + Konzentrationstext), `KiGovernance.tsx:38-56, 83-88, 231` (Anhang-III/Art.-5-Listen, Klassen-Badges nur de), `DatenschutzCockpit.tsx:150-152` (Antrags-Dropdown mit ART_META.de; Status-Select zeigt rohe Enum-Keys wie `identitaet_geprueft` in BEIDEN Sprachen). **FIX:** en-Felder ergänzen; Status-Labels mappen.

### P2-8 · Legacy-Blob-Absturzrisiko: ungeguardete Arrays
**DATEI:** `web/src/pages/ThirdPartyRisk.tsx:55, 72, 134` (`d.klauseln.length` / `.includes` ohne `?? []`), `DatenschutzCockpit.tsx:58, 125` (`v.avList` ohne Guard)
Ein einziger alter/fremd geschriebener Eintrag ohne diese Felder wirft im `useMemo` → weiße Seite für das ganze Werkzeug (org-geteilter Blob ⇒ ein Mitglied bricht die Seite für alle). **FIX:** `(d.klauseln ?? [])` / `(v.avList ?? [])` an allen Stellen.

### P2-9 · AuditWorkbench: Pagination-Fehler kappt Daten stumm
**DATEI:** `web/src/pages/AuditWorkbench.tsx:99-111`
`fetchAllRows`: `if (error) break;` — bei Fehler auf Seite 2 wird der Teilbestand als vollständig behandelt (Risiko-Verknüpfungen fehlen kommentarlos im Audit). **FIX:** Fehler hochreichen/Fehlerzustand anzeigen statt still zu kappen. (Zusatz: `EvidencePanel.tsx:131-137` lädt pro geöffneter Kontrolle die komplette `control_node_member`-Tabelle (~993 Zeilen) neu — Kandidat für einen geteilten Context.)

---

## Top-5 (nach Dringlichkeit)

1. **P0-1** — Evidence-Bucket + storage-RLS fehlen: Datei-Upload des neuen Nachweis-Features ist zu 100 % kaputt (FK-Verletzung + RLS-Deny). Eine kleine Migration fixt es.
2. **P0-2** — Stored XSS über Management-Review-Freitexte im org-geteilten Blob → Script-Ausführung bei anderen Org-Mitgliedern (In-App-Vorschau via dangerouslySetInnerHTML).
3. **P1-3** — Inheritance „off" greift nicht auf Asset-Ebene: Asset-Overrides erben weiter aus ISO → widersprüchliche Compliance-Zahlen genau in dem Modus, der Isolation verspricht.
4. **P1-1 / P1-5** — Fristen-Lebenszyklus: finalize erzeugt bei jedem Lauf neue offene Jahres-Fristen (kein ref/kein Abschluss), und `completeDeadline` ist in KEINER UI verdrahtet → die Fristen-Kachel degeneriert zur ewig roten Liste.
5. **P1-2** — „Datei"-Link auf Nachweise 404t immer (Public-URL ohne Auth-Header gegen RLS-gated Storage-Route) — nach Fix von P0-1 der nächste Blocker im selben Flow.
