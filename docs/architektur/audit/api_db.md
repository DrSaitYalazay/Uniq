# CyberWerkSuite — Security-Audit API/Backend + DB/RLS

Auditor: Fable5 (Senior, Security-Fokus). Grundlage: gelesener Code unter
`/Users/sekercakil/Downloads/ClaudeCWS`. Fokus: `api/src/**`, `db/schema.sql`,
`db/migrations/20260717000001–000009`.

Zahlen: **12 Befunde** — P0: 2 · P1: 5 · P2: 5.

---

## P0 — Sicherheit / Tenant-Leck / Datenverlust

### P0-1 — Jeder eingeloggte Nutzer kann die gesamte `auth.users`-Tabelle auslesen (Passwort-Hashes + Recovery-Token) → vollständige Account-Übernahme
**DATEI:** `db/schema.sql:234` (Grant) + `db/schema.sql:64-84` (kein RLS) + `api/src/gateway/query.js:21-26` (`qualifiedTable` erlaubt beliebiges Schema).

**Problem:**
- `auth.users` hat **kein** `ENABLE ROW LEVEL SECURITY` (in der gesamten schema.sql fehlt jede Zeile `... auth.users ENABLE ROW LEVEL SECURITY`), enthält aber sensible Spalten:
  ```
  encrypted_password text, recovery_token text, confirmation_token text,
  is_super_admin boolean, banned_until timestamptz, raw_app_meta_data jsonb
  ```
- Grant: `GRANT SELECT ON auth.users TO authenticated;` (schema.sql:234).
- Der Data-Gateway lässt beliebige Schemas zu:
  ```js
  function qualifiedTable(table) {
    const parts = String(table).split('.');
    if (parts.length === 2) return `${ident(parts[0])}.${ident(parts[1])}`; // "auth.users" ist erlaubt
    return `public.${ident(table)}`;
  }
  ```
  Ein authentifizierter Angreifer sendet schlicht
  `POST /db/query {"table":"auth.users","action":"select","columns":"*"}`
  → läuft unter `SET LOCAL ROLE authenticated` (db.js), RLS greift nicht (keine aktiviert), Grant erlaubt SELECT → **alle Zeilen aller Nutzer**.

**Impact (kritisch):**
1. Dump aller bcrypt-Hashes → Offline-Cracking.
2. `recovery_token` ist Klartext. Angreifer triggert `/auth/recover` für ein Opfer (auch Admin), liest danach dessen `recovery_token` aus `auth.users`, ruft `/auth/recover/confirm` → **setzt fremdes Passwort → vollständige Übernahme beliebiger Konten**. Kompletter Auth-Bypass, tenant-übergreifend. Selbst-Signup ist offen (`/auth/signup`), also trivial ausnutzbar.
   (`auth.mfa_factors.secret`, `auth.refresh_tokens`, `auth.identities` sind nur `service_role` gegrantet → dort kein Leak; das Leck betrifft `auth.users`, reicht aber vollständig.)

**FIX (mehrschichtig):**
1. Gateway hart auf `public` einschränken: in `qualifiedTable` Schema-Allowlist erzwingen (nur `public`; `auth`/`storage`/`pg_catalog` ablehnen). Ebenso in `query.js` insert/update/delete.
2. `REVOKE SELECT ON auth.users FROM authenticated;` — App liest Nutzerdaten ausschließlich über `/auth/user` (service_role) bzw. eine schmale, spaltenreduzierte View (`id,email` + eigenes Profil), idealerweise mit RLS `USING (id = auth.uid())`.
3. Defense-in-depth: `ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;` mit Policy nur `id = auth.uid()`.

### P0-2 — `JWT_SECRET` fällt auf hartkodierten Default zurück → Token-Fälschung inkl. `service_role` (BYPASSRLS)
**DATEI:** `api/src/lib/jwt.js:4`
```js
const SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
```
**Problem:** Ist `JWT_SECRET` in Prod nicht gesetzt (oder wird der öffentlich bekannte Default verwendet), kann jeder ein gültiges JWT mit beliebigen Claims signieren. `withClaims` (db.js:33-38) übernimmt `claims.role` direkt in `SET LOCAL ROLE` und whitelistet **`service_role`**:
```js
const safeRole = ['anon','authenticated','service_role'].includes(role) ? role : 'anon';
await client.query(`SET LOCAL ROLE ${safeRole}`);
```
→ Ein gefälschtes Token `{sub:<beliebig>, role:"service_role"}` läuft unter BYPASSRLS = totaler DB-Zugriff über den Gateway. Zusätzlich `sub` frei wählbar → Identitätsübernahme.

**FIX:**
- Fail-fast beim Boot: wenn `!process.env.JWT_SECRET` oder `=== 'dev-insecure-secret-change-me'` → `process.exit(1)` (außer explizit `NODE_ENV!=='production'` Devmode).
- Gateway-Pfad (`runQuery`/`runRpc`) niemals `service_role` aus einem *User*-JWT akzeptieren: in `withClaims` bei aus HTTP stammenden Claims `service_role` auf `authenticated` degradieren; `service_role` nur über `asService()` serverintern.

---

## P1 — Robustheit / Korrektheit

### P1-1 — Evidence-Storage komplett kaputt + latenter P0 (öffentlicher Bucket)
**DATEI:** `db/schema.sql:204` (nur `company-logos`-Bucket), `db/schema.sql:4922-4956` (Storage-Policies nur für `company-logos`), `db/migrations/20260717000003_evidence.sql:14` (`storage_path` → Bucket 'evidence'), `web/src/lib/evidenceEngine.ts:91,201-211`.
**Problem:**
- Es existiert **kein** Bucket `evidence` in `storage.buckets` (nur `company-logos`). `storage.objects.bucket_id` hat FK auf `storage.buckets(id)` → INSERT mit `bucket_id='evidence'` (storage.js:42) schlägt mit FK-Fehler fehl. Evidence-Upload/Download ist damit **funktional tot**.
- Selbst mit Bucket: **keine** RLS-Policy auf `storage.objects` für `evidence` → RLS default-deny → jeder Zugriff scheitert.
- Design-Risiko (latenter **P0**): `evidenceFileUrl` nutzt `getPublicUrl` (evidenceEngine.ts:210). Wird der Bucket später — analog `company-logos` (`public=true`, schema.sql:205) — als *public* angelegt, sind Compliance-Nachweise (sensibel!) über ratbare Pfade `<tenant_uuid>/<uuid>-name` **ohne Auth tenant-übergreifend abrufbar**, weil `getPublicUrl` die RLS-Download-Route umgeht.
**FIX:**
- Bucket `evidence` mit `public=false` anlegen; Storage-Policies (SELECT/INSERT/UPDATE/DELETE) analog `company-logos` mit `(storage.foldername(name))[1] = COALESCE(get_org_owner_id(auth.uid()), auth.uid())::text` und `bucket_id='evidence'`.
- Frontend statt `getPublicUrl` die RLS-gated Download-Route (`GET /storage/evidence/*`) nutzen.

### P1-2 — `wipe_tenant_data` löscht die 8 neuen tenant-scoped Tabellen NICHT → Recht-auf-Löschung / Tenant-Reset unvollständig
**DATEI:** `db/schema.sql:5379-5414` (aktive, letzte Definition der Funktion, aus Migration 20260702212034).
**Problem:** Die maßgebliche `wipe_tenant_data` löscht nur `answers, incidents, audit_findings, audits, assets, company_profiles, user_tool_data`. Die neuen Tabellen aus 20260717 (`evidence`, `answer_evidence`, `compliance_deadlines`, `maturity_targets`, `kpi_snapshots`, `org_tool_data`, `control_tests`, `control_test_results`) fehlen. Nach einem Wipe bleiben Nachweise, Fristen, KPI-Historie, Org-Tool-Blobs erhalten — DSGVO-Löschlücke und Datenrest bei Tenant-Reset. Zusätzlich: die neuen Tabellen nutzen Spalte `tenant_id` (nicht `user_id`), d.h. ein simples Nachziehen im alten Muster passt nicht ohne Spaltenanpassung. Der Funktionskommentar (schema.sql:3893-3894) verlangt genau diese Pflege — sie wurde versäumt.
**FIX:** In `wipe_tenant_data` (und `count_tenant_data`) DELETE für alle neuen Tabellen mit `WHERE tenant_id = _tenant_id` ergänzen; `src/test/tenant-isolation-guard.test.ts` aktualisieren.

### P1-3 — `maturity_targets`: UNIQUE mit nullbarer `family_id` verhindert Duplikate NICHT (framework-weites Ziel)
**DATEI:** `db/migrations/20260717000005_maturity_targets.sql:14` → `UNIQUE (tenant_id, framework, family_id)`.
**Problem:** `family_id NULL` bedeutet „framework-weites Ziel". In Postgres sind NULLs im UNIQUE-Index **distinct**, d.h. beliebig viele Zeilen `(tenant, framework, NULL)` sind erlaubt → doppelte/mehrdeutige framework-weite Targets → Gap-Berechnung uneindeutig. Der Gateway-Upsert (`onConflict`) findet keine Konflikt-Zeile → dedupliziert nicht, sondern erzeugt Dubletten.
**FIX:** `UNIQUE NULLS NOT DISTINCT (tenant_id, framework, family_id)` (PG15+) **oder** zwei partielle Unique-Indizes: einen `WHERE family_id IS NOT NULL` und einen `... (tenant_id, framework) WHERE family_id IS NULL`.

### P1-4 — `deadlineReminder`: Log-Insert und Mail-Enqueue nicht atomar → Reminder kann dauerhaft verloren gehen
**DATEI:** `api/src/jobs/deadlineReminder.js:78-104`.
**Problem:** Erst wird der Idempotenz-Log committet (`asService` #2, COMMIT), *danach* `enqueueEmail`. Schlägt/kollabiert der Prozess zwischen Commit und Enqueue (oder `enqueueEmail` schluckt intern Fehler — email.js:9-11 loggt nur), bleibt die Log-Zeile bestehen und `ON CONFLICT DO NOTHING` verhindert jeden erneuten Versand → die Frist-Mail wird **nie** verschickt. Für einen „Fristen-Reminder" ist stiller Totalverlust ein Korrektheitsdefekt.
**FIX:** Enqueue in dieselbe Transaktion wie den Log-Insert ziehen (Insert + `enqueue_email` in einem `asService`-Block, gemeinsamer COMMIT), oder Outbox-Muster: Mailstatus in der Log-Zeile führen und bei Fehler zurücksetzen/re-queuen.

### P1-5 — `answer_evidence` erlaubt beliebige `(framework,control_id)` ohne Tenant-Bindung der Kontrolle, nur WITH CHECK auf `tenant_id`
**DATEI:** `db/migrations/20260717000003_evidence.sql:54-57`.
**Problem:** INSERT-Policy prüft nur `tenant_id = COALESCE(get_org_owner_id,uid)`. `evidence_id` wird nicht gegen den eigenen Tenant geprüft: Ein Nutzer kann eine `answer_evidence`-Zeile mit fremdem `evidence_id` (aus anderem Tenant) anlegen, solange `tenant_id` = eigener. Zwar bleibt der SELECT auf `evidence` selbst tenant-isoliert (Join/Read scheitert), aber die Verknüpfungszeile ist inkonsistent und kann Zähl-/Reuse-Logik verfälschen. FK erzwingt nur Existenz, nicht Tenant-Gleichheit.
**FIX:** WITH-CHECK erweitern um Existenz-Prüfung `EXISTS (SELECT 1 FROM evidence e WHERE e.id = evidence_id AND e.tenant_id = <tenant>)`.

---

## P2 — Härtung

### P2-1 — Upload-Größenlimits inkonsistent (10 MB Multer vs. 12 MB Raw/Evidence)
**DATEI:** `api/src/index.js:26` (`/storage` raw `limit:'12mb'`), `api/src/storage.js:13` (`multer ... fileSize: 10*1024*1024`), `web/src/lib/evidenceEngine.ts:193` (12 MB erlaubt).
**Problem:** Multipart-Evidence-Uploads zwischen 10–12 MB werden serverseitig von Multer abgewiesen, obwohl UI/Design 12 MB zusagt → inkonsistentes Verhalten je nach Transport (raw vs. multipart).
**FIX:** Multer-`fileSize` auf 12 MB anheben (oder alle drei Stellen auf einen zentralen Wert setzen).

### P2-2 — `withClaims` akzeptiert `service_role` generisch (Defense-in-Depth)
**DATEI:** `api/src/db.js:33-38`.
**Problem:** Die Rollen-Whitelist enthält `service_role`. Zusammen mit P0-2 ist das der Verstärker. Auch ohne Secret-Leak ist es sicherer, `service_role` nur über den internen `asService`-Pfad zuzulassen und aus dem HTTP-Claims-Pfad strukturell auszuschließen.
**FIX:** In `withClaims` optionalen Parameter/Flag einführen; aus dem Gateway kommende Claims nie zu `service_role` auflösen (auf `authenticated` clampen).

### P2-3 — `evidence.collected_by` / Insert-Policy prüft Urheber nicht
**DATEI:** `db/migrations/20260717000003_evidence.sql:18,44-45`.
**Problem:** `collected_by` ist frei setzbar (Insert-WITH-CHECK prüft nur `tenant_id`). Ein Nutzer kann Nachweise unter fremder `collected_by`-uuid einstellen (Audit-Trail-Verfälschung innerhalb des Tenants).
**FIX:** `WITH CHECK (... AND (collected_by IS NULL OR collected_by = auth.uid()))` bzw. `collected_by` serverseitig aus dem JWT setzen.

### P2-4 — `company-logos` als `public=true`, aber Download-Route ist RLS-default-deny für anon (Funktionsbruch/Widerspruch)
**DATEI:** `db/schema.sql:205` (`public=true`) vs. `api/src/storage.js:58-72` (Download prüft immer via `withClaims`/RLS; anon hat keine SELECT-Policy auf `storage.objects`).
**Problem:** „Public"-Logos sind über die API für nicht eingeloggte Clients nicht abrufbar (RLS liefert keine Zeile → 404). Entweder ist der `public`-Flag irreführend oder die Download-Route sollte public Buckets ohne RLS ausliefern. Bestandsthema, aber Konsistenz-Risiko.
**FIX:** Entscheiden: entweder Bucket auf `public=false` + rein authentifizierter Zugriff, oder Download-Route für Buckets mit `public=true` gezielt am RLS vorbei bedienen.

### P2-5 — Scheduler: Startlauf und Mehrfach-Instanzen
**DATEI:** `api/src/jobs/scheduler.js:41,46`.
**Problem:** `setInterval`-Fallback + `setTimeout(reminderJob, 30_000)` laufen in **jeder** API-Replika. Mail-Doppelversand wird zwar durch die Unique-Constraint verhindert (idempotent, kein Spam), aber jede Replika scannt stündlich alle Fristen aller Tenants (Last, DB-Contention). Kein `.unref()` auf dem `setInterval` (anders als bei den MFA-Challenges in auth.js:26).
**FIX:** Job an eine einzelne Instanz binden (Advisory-Lock `pg_try_advisory_lock` zu Beginn des Laufs) oder per Env-Flag `RUN_SCHEDULER=true` nur einer Replika zuweisen.

---

## Positiv verifiziert (keine Befunde)
- `gateway/query.js`: Identifier-Whitelist (`IDENT`), durchgängig parametrisierte Werte, `in` via `= ANY($n)`, `or`-Parser parametrisiert, UPDATE/DELETE ohne WHERE werden abgelehnt → **keine SQL-Injection** im Gateway (das Schema-Loch P0-1 ist Autorisierung, nicht Injection).
- `rpc.js`: strikte `ALLOWED`-Set + `IDENT`-Prüfung; `wipe_tenant_data`/`count_tenant_data` sind SECURITY DEFINER und hart auf den eigenen Tenant (`caller_tenant`) begrenzt.
- Neue tenant-Policies (evidence, compliance_deadlines, maturity_targets, kpi_snapshots, org_tool_data, control_tests, control_test_results): SELECT/INSERT/UPDATE/DELETE vorhanden und konsistent `tenant_id = COALESCE(get_org_owner_id(auth.uid()), auth.uid())`, **WITH CHECK** auf INSERT/UPDATE gesetzt; append-only-Tabellen (kpi_snapshots, *_results, answer_evidence) korrekt ohne UPDATE-Grant/Policy.
- `control_mapping`: XOR-Constraint (`control_mapping_target_xor`) korrekt (Knoten XOR Kontrolle); CHECKs für `relation`/`strength` sinnvoll; FKs mit `ON DELETE CASCADE`.
- `deadlineReminder`: Tenant-Owner-Mail-Join (`u.id = d.tenant_id`) korrekt (tenant_id = Owner-User-Id); Idempotenz über `frist_notif_unique` passt zu `ON CONFLICT (user_id, measure_key, trigger_type, recipient_email)`; keine Endlosschleife; Schwellen-Logik (75/90/overdue) plausibel.
