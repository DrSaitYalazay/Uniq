# Fable5 Senior-Audit — HOOKS-/DATENSCHICHT CyberWerkSuite

Repo: `/Users/sekercakil/Downloads/ClaudeCWS` · Stand 2026-07-18
Geprüft: alle 11 Hooks in `web/src/hooks/` + Gegenprüfung gegen `web/src/contexts/AuthContext.tsx` und `db/schema.sql` (RLS-Policies, Trigger, Lecturer-Access-Tabellenliste). Jeder Befund ist gegen den echten Code/DDL verifiziert, keine Vermutungen.

**Bilanz: 20 Befunde — 1× P0, 8× P1, 11× P2.**

Positiv verifiziert (KEIN Befund): `implementation_status`-Trigger pflegt `last_status_change_at` serverseitig (schema.sql:5874ff) — das Weglassen im Upsert-Payload von useImplementationStatus ist korrekt. `training_completions` hat einen BEFORE-INSERT-Trigger `rewrite_user_id_to_org_owner` (schema.sql:3362) — der Insert mit `user.id` statt tenantId wird serverseitig repariert. Die v2-Read-Migration in useFrameworkInheritance ist logisch korrekt (v2-"off" wird respektiert, Alt-Blob → "applied", korrupte Blobs fallen sicher auf "applied").

---

## P0 — Datenverlust / Tenant-Leck

### P0-1 · useToolData.ts:76–102 (+ Deps :136) — Initial-Load wird nach Tenant-Wechsel übersprungen → Cross-Tenant-Überschreibung
`initialLoadDone` ist ein Ref und überlebt Effect-Re-Runs:
```ts
if (!initialLoadDone.current) {
  initialLoadDone.current = true;
  ...fetch...
}
```
Der Effect re-runt aber bei Tenant-Pivot (Deps enthalten `resolveTenantId` → `getTenantId` → `[tenantId, user, viewAsUserId]` in AuthContext). Ablauf bei Lecturer-Impersonation oder User-Wechsel ohne Unmount: Effect läuft neu, `initialLoadDone.current === true` ⇒ **kein Fetch der Ziel-Tenant-Daten**, aber `ownerIdRef.current = <neuer tenantId>` und Realtime wird auf den neuen Tenant subscribed. Im State steht weiter der Blob des ALTEN Tenants. Der nächste Edit (oder jede `data`-Änderung mit `serialized !== lastRemotePayload`) upsertet den **Alt-Tenant-Blob in die Zeile des neuen Tenants** — `user_tool_data` steht explizit in der "Lecturers full access"-Policy-Liste (schema.sql:3839), der Write geht also durch. Doppelter Schaden: Lecturer sieht die eigenen Daten als „Studenten-Daten“ (Anzeige-Leck) und zerstört beim ersten Edit die Studenten-Zeile (Datenverlust + Daten-Leck des Lecturer-Inhalts an den Studenten). Betrifft ALLE useToolData-Konsumenten (BundleOwners, FrameworkInheritance, …), beide Scopes.
**FIX:** `initialLoadDone`/`initialLoadComplete` pro `${tenantId}::${toolKey}` keyen (z. B. Ref auf den zuletzt geladenen Key statt Boolean) oder im Effect-Cleanup zurücksetzen; zusätzlich beim Tenant-Wechsel `lastRemotePayload/pendingPayloadRef/dataRef` invalidieren und den Fetch erzwingen.

---

## P1 — Race / Stale / stille Falschdaten

### P1-1 · useToolData.ts:157–171 — Debounce schreibt stale `data`, markiert aber den NEUEREN Payload als gespeichert → Edit geht verloren
```ts
const payload = pendingPayloadRef.current;
...
.upsert(buildRow(tenantId, data as any), ...)   // data = Closure des Effect-Runs
if (!error) { lastRemotePayload.current = payload; ... }
```
`setData()` aktualisiert `pendingPayloadRef` synchron, der laufende Timer wird aber erst beim Re-Render-Cleanup gecancelt. Feuert der Timer im Fenster dazwischen, wird die ALTE `data` geschrieben, aber `lastRemotePayload` auf den NEUEN Payload gesetzt → der nächste Effect-Run sieht `serialized === lastRemotePayload` und speichert nie ⇒ der letzte Edit existiert nur lokal, Cloud bleibt dauerhaft stale (bis irgendwann wieder editiert wird). Write/Bookkeeping-Mismatch.
**FIX:** Konsistent dieselbe Quelle schreiben und verbuchen: `upsert(buildRow(tenantId, JSON.parse(payload)))` (oder `dataRef.current` serialisieren und GENAU diesen String in `lastRemotePayload` schreiben).

### P1-2 · useToolData.ts:85–101 — `initialLoadComplete = true` auch bei Fetch-FEHLER → Default-State kann Cloud-Zeile überschreiben
```ts
if (!error && row?.data) { ... } else if (!error && !row) { ... }
// Error-Fall: nichts — aber:
initialLoadComplete.current = true;
```
Bei transientem Netz-/RLS-Fehler wird der „CRITICAL“-Autosave-Gate trotzdem geöffnet, `lastRemotePayload` bleibt `null` → der erste Edit auf Basis von localStorage/Default upsertet über die intakte Cloud-Zeile (bei org-scope: über die geteilte Org-Zeile). Genau das Szenario, das der Kommentar Z.146–147 verhindern will.
**FIX:** Bei `error` NICHT `initialLoadComplete` setzen; Retry oder Fehler-Toast, Autosave gesperrt lassen.

### P1-3 · useToolData.ts:285–289 — `resetData()` (nur-lokal gedacht) wipet nach 1,5 s die Cloud
```ts
const resetData = useCallback(() => {
  setDataState(defaultData);
  localStorage.removeItem(localStorageKey);
```
Weder `skipNextAutoSave` noch `pendingPayloadRef` werden gesetzt → der Autosave-Effect feuert mit `defaultData` und überschreibt die Remote-Zeile. Dass es daneben ein separates `resetAndDeleteCloud()` gibt, beweist die Intention „lokal only“ — faktisch löscht `resetData` bei org-scope die geteilten Daten der GANZEN Organisation. Realtime pusht den Wipe dann an alle Mitglieder.
**FIX:** In `resetData` `skipNextAutoSave.current = true` setzen und `pendingPayloadRef.current = null` (bzw. `lastRemotePayload` unangetastet lassen und den Autosave für diesen Zyklus unterdrücken).

### P1-4 · useAssessment.ts:85–115 — Paginierung ohne ORDER BY → verlorene/duplizierte Zeilen ab 1000
Nur die `controls`-Query hat `.order("id")`. `control_iso` (Z.85–91), `control_node_member` (Z.94–98), `answers` (Z.100–106) und `control_mapping` (Z.110–115) paginieren mit `.range(from, to)` **ohne** `.order()`. PostgREST/Postgres garantiert ohne ORDER BY keine stabile Reihenfolge über mehrere Requests — Seiten können sich überlappen oder Zeilen auslassen (verschärft durch parallele Writes/Autovacuum). `control_node_member` hat bereits 993 Zeilen (Knoten-Modell: 993 Mitgliedschaften), `control_iso`/`answers` liegen bei mehreren Frameworks locker >1000. Symptom: still fehlende Antworten/Anker ⇒ falsche Vererbung, „verschwundene“ Bewertungen.
**FIX:** Jeder paginierten Query eine deterministische Sortierung geben (PK bzw. `.order("framework").order("control_id").order("asset_id")` für answers; `.order("node_id").order("framework").order("control_id")` etc.).

### P1-5 · useAssessment.ts:100–106 vs. 141–175 — `answers`-Read ohne Tenant-Filter, Write mit `tenantId` → Read/Write-Tenant-Mismatch bei Impersonation
Der Select lädt `answers` rein RLS-gestützt (kein `.eq("tenant_id", …)`), `persistNow` schreibt aber explizit `tenant_id: tenantId` (= `viewAsUserId` bei Impersonation, AuthContext.tsx:97). AuthContext dokumentiert selbst: *„Every page that filters `.eq("user_id", tenantId)` then automatically reads/writes the correct tenant's data“* — dieser Hook filtert nicht. Folge im Lecturer-View-As: Angezeigt werden die **eigenen** Antworten des Lecturers (RLS = eigener Tenant), geschrieben wird in den **Studenten**-Tenant (scheitert an RLS-WITH-CHECK mit Fehlertoast, bzw. schreibt falsch, sobald eine breitere Policy existiert). Gleiche Struktur in `clearAnswer` (Z.248–262). Die Impersonations-Ansicht des Assessments zeigt also systematisch Fremd-Tenant-Daten an.
**FIX:** `.eq("tenant_id", tenantId)` auf den answers-Select (tenantId ist bereits Effect-Dep); bei `!tenantId` nicht laden.

### P1-6 · useRiskAnalysis.ts:191–209 — gleiche Defektklasse doppelt: ungeordnete Paginierung + Reads ohne Tenant-Filter
`control_iso`, `control_node_member`, `answers`, `assets`, `services`, `dependencies` — alle sechs `.range()` ohne `.order()` (nur `controls` Z.190 ist sortiert) ⇒ wie P1-4 verlorene Zeilen >1000 (assets/dependencies eines großen Tenants!). Zusätzlich laufen `answers`/`assets`/`services`/`dependencies` ohne Tenant-Filter (RLS-only), während `company_profiles` Z.178 korrekt mit `tenantId ?? user.id` gefiltert wird ⇒ identischer Impersonations-Mismatch wie P1-5: Risikoanalyse „für den Studenten“ rechnet auf den Daten des Lecturers.
**FIX:** `.order(<PK>)` je Query + `.eq("tenant_id", tenantId)` analog company_profiles.

### P1-7 · useComplianceOverview.ts:38–42 — `.maybeSingle()` ohne `limit(1)` + verschluckter Fehler → Dashboard rechnet still mit 0 Frameworks
```ts
const { data } = await supabase.from("company_profiles")
  .select("enabled_frameworks").eq("user_id", tenantId).maybeSingle();
```
useRiskAnalysis.ts:175–181 schützt dieselbe Query bewusst mit `.order("updated_at", { ascending: false }).limit(1)` — hier fehlt beides. Existieren >1 Profilzeilen für den Tenant, liefert `maybeSingle()` einen Fehler; der wird per Destrukturierung verworfen (`const { data }`), `enabledFrameworks` bleibt `[]`, `profileLoaded` wird true ⇒ das Dashboard zeigt kommentarlos nur ISO-Hub-Zahlen, alle Sekundär-Frameworks fehlen. Kein Toast, kein error-State.
**FIX:** Muster aus useRiskAnalysis übernehmen (`order + limit(1) + maybeSingle`), `error` behandeln (Toast/State).

### P1-8 · useTrainingParticipants.ts:41–47 — `select("*")` ohne jeden Filter → Lecturer/Admin sehen ALLE Tenants gemischt; Refresh ohne Cancellation
```ts
supabase.from("training_completions").select("*").order(...),
supabase.from("training_quiz_results").select("*").order(...),
```
`training_completions` hat neben den Org-Policies auch `"Admins can view all training completions"` (schema.sql:3359) und steht in der `"Lecturers full access"`-Liste (schema.sql:3844) ⇒ für diese Rollen liefert der ungefilterte Select die Teilnehmer **aller Tenants** in eine gemeinsame Liste — Tenant-Vermischung in der Anzeige, unabhängig vom Impersonations-Ziel. Zusätzlich: `refresh()` hat kein cancelled-Flag → setState nach Unmount / Last-Finisher-gewinnt bei überlappenden Refreshes.
**FIX:** `.eq("user_id", tenantId ?? user.id)` (tenantId aus useAuth beziehen — wird aktuell gar nicht destrukturiert) + cancelled-Guard im Effect.

---

## P2 — Robustheit

### P2-1 · useAssessment.ts:110–115 — `.catch(() => [])` verschluckt ALLE control_mapping-Fehler
```ts
).catch(() => [] as ControlMappingRow[]),
```
Kommentar rechtfertigt nur den Fall „Tabelle fehlt“ — gefangen wird aber auch RLS-Deny, 500er, Netzfehler. Die relations-bewusste Projektion (partiell/gerichtet) degradiert dann still auf equal-only; niemand merkt es. **FIX:** Nur `42P01`/„relation does not exist“ schlucken, sonst `console.warn` + Toast.

### P2-2 · useAssessment.ts:55 / useRiskAnalysis.ts:158 — `if (!user) return` lässt `loading === true` für immer stehen
Initial `loading = useState(true)`; im Logged-out-/Auth-Pending-Zustand wird der Effect verlassen, ohne loading zu klären ⇒ Dauer-Spinner. **FIX:** im Guard `setLoading(false)`.

### P2-3 · useAssessment.ts:64 / useRiskAnalysis.ts:164 — harte Seiten-Caps (50 bzw. 20 Iterationen) truncaten still bei 50k/20k Zeilen
Kein Fehler, kein Log — Ergebnis ist einfach unvollständig. **FIX:** nach Cap-Erreichen mit `rows.length === PAGE` einen Fehler werfen/loggen statt still zu returnen.

### P2-4 · useAssessment.ts:248–262 (+128, 182–192) — clearAnswer cancelt den laufenden Debounce-Timer nicht; Server-Refetch überschreibt In-Flight-Edits
`clearAnswer` löscht die Zeile sofort in der DB, lässt aber einen evtl. laufenden `saveTimers`-Eintrag stehen (Schutz nur indirekt über `answersRef`-Lookup). Umgekehrt ersetzt der Lade-Effect (Z.128 `setAnswers(map)`) bei Framework-Wechsel den kompletten Map-State — ein Edit, dessen 700-ms-Timer noch nicht gefeuert hat, wird durch den Server-Stand ersetzt und der Timer persistiert dann die Server-Zeile bzw. nichts ⇒ Edit verloren. **FIX:** in `clearAnswer` Timer für den Key clearen; vor `setAnswers(map)` offene Timer flushen (persistNow synchron ausführen) statt verwerfen.

### P2-5 · useToolData.ts:24–31 + 136/178 — `opts.scope` ist in keinem Dependency-Array
`TABLE/KEY_COL/ON_CONFLICT/buildRow` werden pro Render abgeleitet, Load-/Realtime-Effect (Deps Z.136) re-runt bei Scope-Wechsel aber nicht ⇒ Initial-Load/Channel auf alter Tabelle, Saves (Effect Z.178 re-runt über `data`) auf neuer — Tabellen-Mix. Praktisch ist scope pro Callsite statisch; trotzdem: **FIX:** `isOrgScope` in die Deps oder per Invariante (Ref + Warnung) einfrieren.

### P2-6 · useToolData.ts:115–127 — Realtime-DELETE wird ignoriert
Bei DELETE ist `payload.new` null ⇒ `incoming === undefined` ⇒ return; zudem enthält `payload.old` bei REPLICA IDENTITY DEFAULT kein `data`/ggf. kein `tool_key`. Ein `resetAndDeleteCloud` eines Org-Mitglieds kommt bei den anderen nie an — deren Autosave legt die Zeile aus ihrem Local-State sogar wieder an (Zombie-Daten). **FIX:** DELETE-Event explizit behandeln (State auf default, `lastRemotePayload` aktualisieren).

### P2-7 · useRoadmapItems.ts:48–57 — `??`-Merge macht Feld-Löschen unmöglich + stale `existing` bei schnellen Folge-Upserts
`patch.owner_id ?? existing?.owner_id ?? null` — ein bewusstes `null` im Patch fällt auf den Altwert zurück; ein Datum/Owner kann nie wieder entfernt werden. `existing` kommt aus dem `items`-Closure: zwei Upserts im selben Tick ⇒ zweiter sieht den ersten nicht, dessen Felder werden zurückgesetzt (Lost Update). Außerdem: Load ohne Paginierung (PostgREST-1000-Cap, stille Truncation) und optimistische `id: "pending"` wird bis zum manuellen reload nie durch die echte id ersetzt. **FIX:** Merge mit `key in patch ? patch[key] : existing?.[key]`; `existing` aus funktionalem State lesen; `.select()` am Upsert + id zurückschreiben.

### P2-8 · useRoadmapItems.ts:33/49 — `tenantId ?? user.id` zum Write-Zeitpunkt
Solange `tenantId` noch nicht aufgelöst ist (async), landet der Upsert unter `user_id = user.id`; nach Auflösung liest der Hook mit `user_id = tenantId` ⇒ die Zeile ist „weg“ (Split-Brain zwischen Member-id und Org-Owner-id). **FIX:** Writes bis `tenantId != null` blocken oder `await getTenantId()` verwenden.

### P2-9 · useFrameworkCatalog.ts:22–38 — dieselbe ungeordnete `.range()`-Paginierung; Modul-Cache ohne Invalidierung
`fetchAll` paginiert `controls` ohne `.order()` (BSI Grundschutz++ liegt nahe/über 1000 ⇒ reale Gefahr fehlender Kontrollen im Katalog). `cache`/`inflight` sind modul-global und session-lang — nach Katalog-Updates (overrides.sql-Deploys) bleibt der Alt-Stand bis zum Hard-Reload. **FIX:** `.order("id")`; Cache ok, aber dokumentieren/optional TTL.

### P2-10 · useMaturityTargets.ts:33–42 — TISAX-Default 3 wird auch bei FETCH-FEHLER angewendet, Fehler verschluckt
```ts
if (!error && Array.isArray(data)) { ...fill map... }
if (framework === "TISAX" && Object.keys(map).length === 0) map[""] = 3;
```
Bei `error` bleibt `map` leer ⇒ TISAX zeigt Ziel 3, als wäre es gepflegt; für andere Frameworks verschwinden gepflegte Ziele kommentarlos. Read ist zudem RLS-only ohne Tenant-Filter (gleiche Impersonations-Anmerkung wie P1-5; RLS auf `maturity_targets` ist strikt tenant-gebunden, schema.sql:6365ff, kein Lecturer-Bypass — daher nur P2). **FIX:** `error`-Branch mit Toast/State; Default nur bei erfolgreichem, leerem Resultat.

### P2-11 · useFrameworkInheritance.ts:43 + 64–72 — Default „applied“ wird VOR dem Cloud-Load ausgeliefert
`DEFAULT_STATE = { mode: "applied", … }` ist der State, solange useToolData noch lädt. Ein Tenant mit persistiertem `"off"` bekommt beim Seitenaufbau kurz Vererbung „an“: useRiskAnalysis (Dep `inheritanceMode`, Z.321) und useComplianceOverview rechnen erst mit falschen Zahlen und doppelt (Refetch nach Blob-Ankunft). `loading` wird zwar exportiert, aber die Konsumenten werten es nicht aus. **FIX:** In den Konsumenten `inheritanceLoading` abwarten (kein Fetch, solange true) oder `mode` als `null` bis Load-Ende liefern.

---

## Zusammenfassung

| Severity | Anzahl |
|---|---|
| P0 | 1 |
| P1 | 8 |
| P2 | 11 |
| **Gesamt** | **20** |

**Top-5 (Fix-Reihenfolge):**
1. **P0-1** useToolData: übersprungener Initial-Load nach Tenant-Pivot → Cross-Tenant-Überschreibung/Leck (alle Tool-States betroffen).
2. **P1-3** useToolData `resetData()` wipet die (Org-)Cloud-Zeile — 1 Klick = geteilter Datenverlust.
3. **P1-1** useToolData Debounce: stale Write + falsches `lastRemotePayload`-Bookkeeping → letzter Edit wird nie gespeichert.
4. **P1-4/P1-6/P2-9** Ungeordnete `.range()`-Paginierung in useAssessment/useRiskAnalysis/useFrameworkCatalog → still fehlende Antworten/Anker/Kontrollen ab 1000 Zeilen (control_node_member steht bei 993!).
5. **P1-7** useComplianceOverview: `maybeSingle()` ohne `limit(1)` + verschluckter Fehler → Dashboard fällt still auf 0 Frameworks zurück (useRiskAnalysis macht es 3 Zeilen weiter richtig vor).
