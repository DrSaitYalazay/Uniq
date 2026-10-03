-- ============================================================================
-- runtime-ensure.sql — bei JEDEM Deploy idempotent angewandt (migrate-Service).
-- ----------------------------------------------------------------------------
-- Problem: schema.sql läuft nur beim ERSTEN Container-Boot (docker-entrypoint-
-- initdb.d, leeres Datenverzeichnis). Auf einer bereits initialisierten Live-DB
-- erreichen neue Migrationen die DB NICHT automatisch. Diese Datei enthält NUR
-- idempotente Laufzeit-Definitionen (CREATE OR REPLACE / to_regclass-Guards) und
-- wird vom `migrate`-Service als postgres-Superuser bei jedem `up` ausgeführt.
--
-- Enthält aktuell: CHG-04 (F-05) — wipe_tenant_data / count_tenant_data
-- schema-sicher. Beide sind CREATE OR REPLACE + überspringen fehlende Tabellen/
-- Spalten zur Laufzeit, also gefahrlos wiederholt anwendbar. Neue idempotente
-- Laufzeit-Fixes hier ergänzen.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.wipe_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_tenant uuid;
  deleted jsonb := '{}'::jsonb;
  c bigint;
  t text;
  col text;
  tbls text[] := ARRAY[
    'incident_checklist_items','incidents','audit_checklist_items','audit_findings','audits',
    'improvement_items','policy_acknowledgements','policy_versions','policy_metadata',
    'training_quiz_results','training_completions','assessment_answers','org_assessment_answers',
    'criticality_overrides','service_criticality_results','service_criticality_inputs',
    'control_test_results','answer_evidence','control_tests','evidence','quant_runs','quant_scenarios',
    'answers','roadmap_items','implementation_status','compliance_deadlines','maturity_targets',
    'kpi_snapshots','control_status_log','org_tool_data',
    'dependencies','assets','critical_services','company_profiles','user_snapshots','user_tool_data'
  ];
  cols text[] := ARRAY[
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id',
    'tenant_id','tenant_id','tenant_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','user_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','tenant_id','tenant_id',
    'user_id','user_id','user_id','user_id','user_id','user_id'
  ];
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);

  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot wipe data for a different tenant (caller_tenant=%, requested=%)',
      caller_tenant, _tenant_id;
  END IF;

  -- V-5: Loeschen darf nur, wem der Mandant GEHOERT (Org-Owner bzw.
  -- Einzelnutzer). Vorher reichte die Mitgliedschaft: jedes eingeladene
  -- Teammitglied konnte ueber "Einstellungen -> Daten -> Alle Daten
  -- zuruecksetzen" (oder direkt per /db/rpc) den gesamten Datenbestand
  -- seiner Organisation unwiderruflich loeschen.
  IF caller_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'only the organisation owner may wipe tenant data'
      USING ERRCODE = '42501';
  END IF;

  FOR t, col IN SELECT u.tab, u.ocol FROM unnest(tbls, cols) AS u(tab, ocol) LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      deleted := deleted || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = col
    ) THEN
      deleted := deleted || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;

    EXECUTE format(
      'WITH d AS (DELETE FROM public.%I WHERE %I = $1 RETURNING 1) SELECT count(*) FROM d',
      t, col
    ) INTO c USING _tenant_id;
    deleted := deleted || jsonb_build_object(t, c);
  END LOOP;

  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.wipe_tenant_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wipe_tenant_data(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.count_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_tenant uuid;
  counts jsonb := '{}'::jsonb;
  c bigint;
  t text;
  col text;
  tbls text[] := ARRAY[
    'assets','assessment_answers','org_assessment_answers','audit_checklist_items','audit_findings',
    'audits','company_profiles','critical_services','criticality_overrides','dependencies',
    'improvement_items','incident_checklist_items','incidents','policy_acknowledgements','policy_metadata',
    'policy_versions','service_criticality_inputs','service_criticality_results','training_completions',
    'training_quiz_results','user_snapshots','user_tool_data',
    'answers','roadmap_items','implementation_status','control_tests','control_test_results','evidence',
    'answer_evidence','compliance_deadlines','maturity_targets','kpi_snapshots','control_status_log',
    'quant_scenarios','quant_runs','org_tool_data'
  ];
  cols text[] := ARRAY[
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id','user_id',
    'user_id','user_id','user_id',
    'tenant_id','user_id','tenant_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','tenant_id','tenant_id','tenant_id','tenant_id',
    'tenant_id','tenant_id','tenant_id'
  ];
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);
  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot inspect a different tenant';
  END IF;

  FOR t, col IN SELECT u.tab, u.ocol FROM unnest(tbls, cols) AS u(tab, ocol) LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      counts := counts || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = col
    ) THEN
      counts := counts || jsonb_build_object(t, 'skipped');
      CONTINUE;
    END IF;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1', t, col)
      INTO c USING _tenant_id;
    counts := counts || jsonb_build_object(t, c);
  END LOOP;

  RETURN counts;
END;
$$;

REVOKE ALL ON FUNCTION public.count_tenant_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_tenant_data(uuid) TO authenticated;


-- ============================================================================
-- IP-Schutz: Staging-Junction-Tabellen gegen anon abschotten.
-- `_junction_stage_ci/cr/rc` sind Build-Artefakte, hatten aber KEIN RLS — durch
-- den pauschalen `GRANT SELECT ... TO anon` (schema.sql) konnte ein anonymer
-- Aufruf die komplette Crosswalk-IP (control_iso/control_risk/risk_control,
-- ~zehntausende Zeilen) auslesen. RLS aktivieren + anon-Grant entziehen →
-- Default-Deny; nur service_role (Build) greift noch zu. Idempotent.
-- ============================================================================
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['_junction_stage_ci','_junction_stage_cr','_junction_stage_rc'] LOOP
    IF to_regclass('public.'||t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    END IF;
  END LOOP;
END $$;


-- ============================================================================
-- IP-Schutz Stufe 1: Lizenz-Gate für den GLOBALEN Katalog (Produkt-IP).
-- Bisher: alle 11 Katalog-Tabellen `FOR SELECT TO authenticated USING(true)` →
-- JEDER authentifizierte Nutzer (auch frisch selbst-registriert) liest den
-- kompletten Katalog. Neu: Lesen nur mit aktiver Lizenz des Tenants.
-- RÜCKWÄRTSKOMPATIBEL: solange KEINE Lizenz-Zeilen gepflegt sind, erlaubt die
-- Funktion jeden authentifizierten Nutzer → kein Bruch. Sobald Lizenzen gesetzt
-- werden, greift die Beschränkung. Tenant-Datentabellen (answers/assets/…)
-- bleiben unberührt (eigene Tenant-Isolation). Idempotent.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_licenses (
  tenant_id   uuid PRIMARY KEY,
  plan        text NOT NULL DEFAULT 'basis',    -- basis | pro | enterprise
  status      text NOT NULL DEFAULT 'active',   -- active | suspended | expired
  seat_limit  int  NOT NULL DEFAULT 1,          -- basis=1 · pro=5 · enterprise=10
  valid_until timestamptz,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
-- Bestehende Installationen: Spalte nachrüsten (idempotent).
ALTER TABLE public.tenant_licenses ADD COLUMN IF NOT EXISTS seat_limit int NOT NULL DEFAULT 1;
ALTER TABLE public.tenant_licenses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.tenant_licenses FROM anon;
GRANT SELECT ON public.tenant_licenses TO authenticated;
GRANT ALL ON public.tenant_licenses TO service_role;
DROP POLICY IF EXISTS tenant_licenses_read_own ON public.tenant_licenses;
CREATE POLICY tenant_licenses_read_own ON public.tenant_licenses
  FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE OR REPLACE FUNCTION public.has_catalog_access(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _uid IS NOT NULL AND (
    -- Admin (Vendor) hat IMMER Katalog-Zugriff — sperrt sich nie selbst aus.
    public.has_role(_uid, 'admin')
    -- Bootstrap/Backward-Compat: solange keine Lizenzen gepflegt sind, jeder Authentifizierte.
    OR NOT EXISTS (SELECT 1 FROM public.tenant_licenses)
    -- Sonst: aktive Lizenz des Tenants.
    OR EXISTS (
      SELECT 1 FROM public.tenant_licenses l
      WHERE l.tenant_id = COALESCE(public.get_org_owner_id(_uid), _uid)
        AND l.status = 'active'
        AND (l.valid_until IS NULL OR l.valid_until > now())
    )
  )
$$;
REVOKE ALL ON FUNCTION public.has_catalog_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_catalog_access(uuid) TO authenticated;

-- ============================================================================
-- HOTFIX 3.0.2: Katalog-Lizenz-Gating DEAKTIVIERT.
-- Das Gate (catalog_licensed_read USING has_catalog_access) hat auf der Live-DB
-- die Lese-Zugriffe auf den gesamten Katalog blockiert → Umsetzung/Risiko/…
-- lieferten „Bad response". Ursache: sobald das Gate greift, sind controls/risks/
-- control_* nicht mehr wie in 2.0 frei lesbar. Für den Launch zählt Funktion vor
-- IP-Gate. Wir stellen daher den 2.0-Zustand her: Katalog = für ALLE
-- Authentifizierten lesbar. Der Katalog ist ohnehin nur nach Login sichtbar; die
-- Kundendaten-Isolation (org-scoped Tabellen) bleibt unberührt. Seat-Limit über
-- tenant_licenses/org_seat_limit bleibt aktiv. IP-Gate später sauber neu bauen.
-- Idempotent: entfernt auch ein evtl. schon angewandtes catalog_licensed_read.
DO $$
DECLARE t text; r record;
  cat text[] := ARRAY[
    'controls','risks','control_iso','control_risk','risk_control','iso_canonical',
    'control_node','control_node_member','control_mapping','control_effect','benchmark_stats'
  ];
BEGIN
  FOREACH t IN ARRAY cat LOOP
    IF to_regclass('public.'||t) IS NULL THEN CONTINUE; END IF;
    -- ALLE vorhandenen SELECT-Policies entfernen (inkl. des kaputten Gates).
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd='SELECT' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
    END LOOP;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- Katalog = Produkt-Inhalt, für alle Authentifizierten lesbar (wie 2.0).
    EXECUTE format($f$CREATE POLICY catalog_read_authenticated ON public.%I FOR SELECT TO authenticated USING (true)$f$, t);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
  END LOOP;
END $$;


-- ============================================================================
-- Sitzplätze aus der Lizenz: org_seat_limit liest ZUERST tenant_licenses.seat_limit
-- (basis 1 · pro 5 · enterprise 10). So steuert der im Admin-Panel gesetzte Plan
-- die Team-Größe (send-org-invitation prüft org_seat_limit bereits). Fallback auf
-- die bestehende Rollen-Logik, wenn keine aktive Lizenz vorliegt. Idempotent.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.org_seat_limit(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT l.seat_limit FROM public.tenant_licenses l
       JOIN public.organizations o ON o.owner_id = l.tenant_id
      WHERE o.id = _org_id AND l.status = 'active'
        AND (l.valid_until IS NULL OR l.valid_until > now())
      LIMIT 1),
    (SELECT CASE
       WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.organizations o ON o.owner_id=ur.user_id WHERE o.id=_org_id AND ur.role::text IN ('admin','lecturer')) THEN 50
       WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.organizations o ON o.owner_id=ur.user_id WHERE o.id=_org_id AND ur.role::text='xl') THEN 10
       WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.organizations o ON o.owner_id=ur.user_id WHERE o.id=_org_id AND ur.role::text='premium') THEN 5
       ELSE 1
     END)
  );
$$;
GRANT EXECUTE ON FUNCTION public.org_seat_limit(uuid) TO authenticated, service_role;


-- ============================================================================
-- Defense-in-Depth (KommunalSuite-Befund geprüft — CWS strukturell nicht
-- betroffen: profiles hat keine role/org_id-Spalte; role=user_roles ist
-- AS RESTRICTIVE admin-only; org_id/role=org_members ist owner/admin-only).
-- Zusätzliche Härtung, damit die „row-level ≠ column-level"-Falle gar nicht
-- erst greifen kann. Idempotent.
-- ============================================================================
-- 1) profiles-Selbst-Update darf die Identitäts-Spalte user_id NICHT ändern.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
-- 2) Lizenz-Tabelle: Schreiben nur über service_role (Admin-Funktionen), nie direkt.
REVOKE INSERT, UPDATE, DELETE ON public.tenant_licenses FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.tenant_licenses FROM anon;
-- 3) Self-scoped Tenant-Daten: WITH CHECK nachrüsten, damit die Besitzer-Spalte
--    user_id per Update NICHT auf einen fremden Nutzer umgeschrieben werden kann
--    (row-level ≠ column-level; kein Rechte-Leak, aber Integritäts-Härtung).
DO $$
DECLARE t text; r record;
  tbls text[] := ARRAY[
    'assessment_answers','org_assessment_answers','audits','audit_findings',
    'improvement_items','incidents','incident_checklist_items','policy_metadata'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF to_regclass('public.'||t) IS NULL THEN CONTINUE; END IF;
    FOR r IN
      SELECT policyname FROM pg_policies
       WHERE schemaname='public' AND tablename=t AND cmd='UPDATE'
         AND with_check IS NULL AND qual ILIKE '%auth.uid()%user_id%'
    LOOP
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (auth.uid() = user_id)', r.policyname, t);
    END LOOP;
  END LOOP;
END $$;


-- ============================================================================
-- Anmeldebremse: auth.login_attempts (Befund „unbegrenzte Anmeldeversuche").
-- Bisher gab es weder Rate-Limit noch Kontosperre — ein Skript konnte Passwörter,
-- 6-stellige TOTP-Codes und Reset-Mails beliebig oft durchprobieren. Gezählt wird
-- in der DB und nicht im Prozessspeicher, weil ein Neustart/Deploy einen
-- In-Memory-Zähler leeren und dem Angreifer seine Versuche schenken würde; und
-- weil eine Sperre nur mit persistenter Spur im Audit nachweisbar ist.
-- Ausgewertet wird sie von api/src/lib/login-throttle.js.
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS legen nur an, was fehlt; das
-- ADD COLUMN IF NOT EXISTS rüstet `kind` in einer evtl. älteren Fassung nach;
-- GRANTs sind beliebig oft wiederholbar.
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth.login_attempts (
  id          bigserial   PRIMARY KEY,
  email_lower text        NOT NULL,
  ip          text,
  kind        text        NOT NULL DEFAULT 'password',   -- password | mfa | recover
  successful  boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE auth.login_attempts ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'password';
CREATE INDEX IF NOT EXISTS login_attempts_email_time_idx ON auth.login_attempts (email_lower, created_at DESC);
CREATE INDEX IF NOT EXISTS login_attempts_ip_time_idx    ON auth.login_attempts (ip, created_at DESC);
-- Nur der Auth-Dienst (asService → service_role) sieht die Tabelle. anon/
-- authenticated bekommen KEIN Recht: sonst wäre sie über einen künftigen
-- Gateway-Pfad ein Enumerations-Orakel („welche Adressen melden sich an").
REVOKE ALL ON auth.login_attempts FROM anon, authenticated;
GRANT ALL ON auth.login_attempts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE auth.login_attempts_id_seq TO service_role;


-- ============================================================================
-- auth.users: Zeitstempel für den Ablauf von Wiederherstellungs- und
-- E-Mail-Wechsel-Token. Das Schema ist GoTrue-kompatibel, aber recovery_sent_at
-- fehlt dort — ohne den Zeitstempel gäbe es keinen Ablauf und ein einmal
-- verschickter Reset-Link öffnete das Konto auf Dauer. email_change und
-- email_change_token_new sind in schema.sql bereits vorhanden; die Zeilen sind
-- nur für ältere Installationen da und bei vorhandener Spalte folgenlos.
-- Idempotent: ADD COLUMN IF NOT EXISTS ist beim zweiten Lauf ein No-op.
-- ============================================================================
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS recovery_sent_at       timestamptz;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_change           text DEFAULT '';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_change_token_new text DEFAULT '';
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_change_sent_at   timestamptz;

-- Klartext-Token aus der Zeit vor der Hash-Speicherung entwerten. Ab jetzt steht
-- in recovery_token nur noch sha256(token); ein alter Klartextwert liesse sich
-- zwar nicht mehr einlösen, bliebe aber als scheinbar offener Reset-Vorgang
-- stehen. Gewollt ist, dass alte Links sterben.
-- Idempotent UND faktisch einmalig: neu ausgestellte Token setzen IMMER
-- recovery_sent_at, die Bedingung trifft also nur Altbestände — beim zweiten
-- Lauf (und bei jedem späteren Deploy) ist die Trefferzahl null, ein frisch
-- angefordeter Link wird nicht mitgelöscht.
UPDATE auth.users
   SET recovery_token = ''
 WHERE COALESCE(recovery_token,'') <> '' AND recovery_sent_at IS NULL;


-- ============================================================================
-- A-14: auth.admin_actions — Audit-Spur für Eingriffe eines Berechtigten in ein
-- fremdes Konto (erste Aktion: mfa_reset aus functions/admin-reset-mfa.js).
-- Ein MFA-Reset entzieht einem Konto seinen zweiten Faktor und beendet alle
-- Sitzungen. Ohne festgehaltenes „wer, wen, wann, warum" ist dieser Vorgang
-- nachträglich nicht von einem Angriff zu unterscheiden — im GRC-Produkt ist
-- die Spur deshalb Pflicht, nicht Beiwerk. `reason` ist NOT NULL; die API
-- verlangt zusätzlich mindestens 10 Zeichen (wie die Massen-Fertig-Notiz).
-- Wie bei login_attempts bekommen anon/authenticated KEIN Recht: die Tabelle
-- nennt Nutzer-IDs und Vorgänge und wäre sonst über einen künftigen
-- Gateway-Pfad lesbar. Nur der Dienst (asService → service_role) schreibt.
-- Idempotent: CREATE TABLE/INDEX IF NOT EXISTS legen nur an, was fehlt; die
-- GRANT/REVOKE-Zeilen sind beliebig oft wiederholbar.
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth.admin_actions (
  id             bigserial   PRIMARY KEY,
  actor_id       uuid        NOT NULL,          -- wer hat gehandelt
  target_user_id uuid,                          -- wen hat es betroffen
  action         text        NOT NULL,          -- mfa_reset | (weitere folgen)
  reason         text        NOT NULL,          -- Pflicht-Begründung aus dem Request
  details        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_actions_target_time_idx ON auth.admin_actions (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_actions_actor_time_idx  ON auth.admin_actions (actor_id, created_at DESC);
REVOKE ALL ON auth.admin_actions FROM anon, authenticated;
GRANT ALL ON auth.admin_actions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE auth.admin_actions_id_seq TO service_role;


-- ============================================================================
-- A-17: Refresh-Tokens liegen ab jetzt nur noch als sha256-Hex in
-- auth.refresh_tokens.token; der Rohwert geht ausschliesslich an den Client.
-- Vorher stand der einlösbare Rohwert in der DB — ein Backup oder Dump war damit
-- unmittelbar eine Sitzungsübernahme, ohne Passwort und ohne MFA.
--
-- ACHTUNG BEIM DEPLOY, das ist KEIN Fehler: die bestehenden Klartext-Token
-- passen nach der Umstellung auf keinen Hash mehr und sind wertlos. Sie werden
-- hier einmalig entwertet, damit keine „offenen" Sitzungen zurückbleiben, die
-- der Server ohnehin nie wieder akzeptiert. Praktische Folge: mit diesem Deploy
-- werden ALLE angemeldeten Nutzer abgemeldet und müssen sich einmal neu
-- anmelden (bei aktivem MFA inklusive zweitem Faktor). Das ist hinnehmbar und
-- sicherheitstechnisch gewollt.
--
-- Warum die Marker-Spalte: `UPDATE ... SET revoked=true` allein wäre zwar
-- idempotent, aber NICHT einmalig — jeder spätere Deploy würde erneut alle
-- frisch angemeldeten Nutzer hinauswerfen. Alt und neu sind am Wert nicht zu
-- unterscheiden (Rohwert und sha256 sind beide 64 Hex-Zeichen), deshalb ein
-- Marker: existiert hash_migrated_at schon, ist die Umstellung gelaufen und der
-- Block tut nichts mehr. Die Spalte hält zugleich fest, WANN das war.
--
-- revoked_reason trennt die GEWOLLTE Sperre (Passwortwechsel, Reset, Abmelden,
-- Konto einfrieren, MFA-Reset) vom Einmal-Einlösen ('rotated'). Nur ein rotierter
-- Token, der ein zweites Mal auftaucht, ist ein Diebstahlsignal und zieht die
-- Familien-Sperre nach sich. Ohne diese Trennung hätte ein nachklappender Tab
-- nach jedem Passwortwechsel alle Sitzungen des Nutzers mitgerissen — auch die
-- frische, die der Server ihm gerade ausgestellt hat.
-- Idempotent: ADD COLUMN IF NOT EXISTS ist beim zweiten Lauf ein No-op.
-- ============================================================================
ALTER TABLE auth.refresh_tokens ADD COLUMN IF NOT EXISTS revoked_reason text;
CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx ON auth.refresh_tokens (user_id);

DO $$
BEGIN
  IF to_regclass('auth.refresh_tokens') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'auth' AND table_name = 'refresh_tokens'
       AND column_name = 'hash_migrated_at'
  ) THEN
    ALTER TABLE auth.refresh_tokens ADD COLUMN hash_migrated_at timestamptz;
    UPDATE auth.refresh_tokens
       SET revoked = true, revoked_reason = 'hash_migration', hash_migrated_at = now()
     WHERE revoked = false;
  END IF;
END $$;


-- ============================================================================
-- A-18-Folge: Einwilligungen beim Selbst-Registrieren gehen nicht mehr verloren.
-- /auth/signup liefert keine Sitzung mehr zurück (sonst wäre genau dieser
-- Unterschied wieder das Orakel „gibt es die Adresse?"). Damit fiel der bisherige
-- Weg weg, auf dem die Oberfläche die Einwilligungen NACH der Registrierung in
-- public.profiles schrieb — dafür brauchte sie eine Sitzung. Die Einwilligungen
-- kommen jetzt als user_metadata mit der Registrierung mit und werden hier beim
-- Anlegen des Profils übernommen: ein Schritt, in derselben Transaktion wie die
-- Nutzerzeile, statt eines zweiten Aufrufs, der ausfallen konnte.
-- Rückwärtskompatibel: fehlen die Schlüssel (Admin-Anlage, Einladung), bleibt es
-- bei den Vorgabewerten wie bisher. Die Werte werden absichtlich als Text
-- verglichen statt gecastet — ein unerwarteter Inhalt darf die Registrierung
-- nicht mit einem Cast-Fehler abbrechen.
-- Idempotent: ADD COLUMN IF NOT EXISTS + CREATE OR REPLACE FUNCTION; der Trigger
-- selbst bleibt unverändert.
-- ============================================================================
-- Vorbedingung erzwingen statt voraussetzen: auf einer Installation, der eine
-- dieser Spalten fehlt, würde die neue Funktion bei JEDER Registrierung mit
-- „column does not exist" abbrechen. Die Zeilen sind auf jeder aktuellen
-- Installation folgenlos.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_consent            boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_consent_date       timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_consent_categories text[] DEFAULT '{}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_processing_consent      boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_processing_consent_date timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta jsonb;
  mc   boolean;
  dc   boolean;
  cats text[];
BEGIN
  -- Zuweisung im Rumpf statt als DECLARE-Vorgabewert: so hängt nichts davon ab,
  -- wann NEW für Vorgabewerte sichtbar wird.
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  mc   := COALESCE(meta->>'marketing_consent', '') IN ('true', 't', '1');
  dc   := COALESCE(meta->>'data_processing_consent', '') IN ('true', 't', '1');
  cats := CASE
            WHEN jsonb_typeof(meta->'marketing_consent_categories') = 'array'
            THEN ARRAY(SELECT jsonb_array_elements_text(meta->'marketing_consent_categories'))
            ELSE '{}'::text[]
          END;

  INSERT INTO public.profiles (
    user_id, email, display_name,
    marketing_consent, marketing_consent_date, marketing_consent_categories,
    data_processing_consent, data_processing_consent_date)
  VALUES (
    NEW.id, NEW.email, COALESCE(meta->>'display_name', NEW.email),
    mc, CASE WHEN mc THEN now() END, CASE WHEN mc THEN cats ELSE '{}'::text[] END,
    dc, CASE WHEN dc THEN now() END);

  -- Auto-assign 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- V-3/B-09 — Pauschal-GRANT nimmt gezielten REVOKE zurueck
-- ----------------------------------------------------------------------------
-- schema.sql entzieht `integration_secrets` (Zugangsdaten fremder Systeme!)
-- ausdruecklich jedes Client-Recht:
--     REVOKE ALL ON public.integration_secrets FROM anon, authenticated;
-- Rund 50.000 Zeilen spaeter steht in derselben Datei (und in 99_grants.sql):
--     GRANT ALL    ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
--     GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- Das trifft AUCH diese Tabelle und hebt den Entzug wieder auf. Der Nachweis
-- vom 19.09.2026 hat es live gemessen: anon_grant = ja.
--
-- Ausgenutzt werden kann es heute nicht — die Politik `USING (false)` sperrt
-- `authenticated`, und fuer `anon` greift ueberhaupt keine Politik, also wehrt
-- RLS grundsaetzlich ab. Aber die zweite Schicht, die der Autor dort bewusst
-- gebaut hat, war weg: an der Tabelle mit den fremden Zugangsdaten haengt dann
-- alles an einer einzigen Zeile RLS. Genau da will man zwei Schichten.
--
-- Deshalb hier, NACH allen Pauschal-Grants und bei JEDEM Deploy: jede Tabelle,
-- deren einzige Politik jeden Client verweigert, bekommt den Entzug zurueck.
-- Generisch statt namentlich — die naechste Deny-all-Tabelle ist damit von
-- selbst geschuetzt, ohne dass jemand daran denken muss.
-- ============================================================================
DO $revoke$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.tablename
      FROM pg_policies p
     WHERE p.schemaname = 'public'
     GROUP BY p.tablename
    HAVING count(*) = 1
       AND bool_and(p.permissive = 'PERMISSIVE' AND p.cmd = 'ALL'
                    AND btrim(lower(coalesce(p.qual, '')), '() ') = 'false')
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', r.tablename);
    RAISE NOTICE 'Client-Rechte entzogen (Deny-all-Tabelle): %', r.tablename;
  END LOOP;
END
$revoke$;

-- ============================================================================
-- V-5/L-01 — Mitgliedschaften: Identitaet unveraenderlich, eine Org je Nutzer,
--            Mandanten-Aufloesung deterministisch
-- ----------------------------------------------------------------------------
-- Der Mandant eines Nutzers ist der Owner seiner Org — 66 der 169 RLS-Politiken
-- pruefen   tenant_id = COALESCE(get_org_owner_id(auth.uid()), auth.uid()),
-- und das Frontend leitet seine tenant_id aus derselben Funktion ab.
-- Gemessen am 19.09.2026 lokal ueber das Gateway (/db/query):
--  1. Die Politik "Owner can update member roles" erlaubt UPDATE auf JEDE
--     Spalte. Ein Org-Owner konnte die user_id einer Mitgliedschaft auf einen
--     fremden Nutzer umschreiben. Dessen Mandant wechselte damit still zum
--     Angreifer: die eigenen Daten verschwanden aus seiner Sicht, alles neu
--     Eingegebene landete im Mandanten des Angreifers.
--  2. "Users can create organizations" liess jedes Mitglied eine zweite Org
--     anlegen (ebenso /functions/org-team beim Oeffnen des Reiters "Team").
--  3. Bei zwei Mitgliedschaften waehlte get_org_owner_id() per LIMIT 1 ohne
--     ORDER BY — die Zuordnung zum Mandanten war Zufall.
-- ============================================================================
BEGIN;

-- 1. user_id und org_id einer Mitgliedschaft sind unveraenderlich — fuer alle
--    Rollen, auch den Dienst: kein Codepfad braucht das; wer umziehen soll,
--    wird entfernt und neu eingeladen. created_at ebenso (Pruefung 19.09.2026):
--    es ist der Sortierschluessel der Mandanten-Aufloesung unten; ein Owner
--    konnte ihn zurueckdatieren und so die Zuordnung Dritter verschieben.
CREATE OR REPLACE FUNCTION public.org_members_identitaet_fest()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'org_members: user_id, org_id und created_at sind unveraenderlich'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS org_members_identitaet_fest ON public.org_members;
CREATE TRIGGER org_members_identitaet_fest
  BEFORE UPDATE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.org_members_identitaet_fest();

-- 2. Eine Org je Nutzer: wer bereits Mitglied ist, legt keine weitere an.
CREATE OR REPLACE FUNCTION public.is_member_of_any_org(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE user_id = _user_id)
$fn$;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND NOT public.is_member_of_any_org(auth.uid()));

-- 3. Deterministisch: die aelteste Mitgliedschaft bestimmt Org und Mandant.
--    (Neue Doppel-Mitgliedschaften verhindern 1. und 2.; das hier ordnet
--    etwa schon vorhandene eindeutig zu.)
CREATE OR REPLACE FUNCTION public.get_org_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT CASE
    WHEN public.is_student(_user_id) THEN _user_id
    ELSE (
      SELECT o.owner_id
        FROM public.org_members m
        JOIN public.organizations o ON o.id = m.org_id
       WHERE m.user_id = _user_id
       ORDER BY m.created_at, m.id
       LIMIT 1
    )
  END;
$fn$;
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT org_id FROM public.org_members WHERE user_id = _user_id
   ORDER BY created_at, id LIMIT 1;
$fn$;

COMMIT;

-- ============================================================================
-- V-5/L-02 — "Lecturers full access" auf die EIGENEN Studierenden begrenzen
-- ----------------------------------------------------------------------------
-- Sieben Mandantentabellen (assets, audit_findings, audits, company_profiles,
-- incidents, profiles, user_tool_data) trugen die Politik
--     FOR ALL USING (is_lecturer(auth.uid())) WITH CHECK (is_lecturer(auth.uid()))
-- und student_policy_downloads ein SELECT mit "OR is_lecturer(auth.uid())".
-- Wer die Rolle "lecturer" hat, las und aenderte damit die Daten ALLER Kunden
-- (Audits, Befunde, Vorfaelle, Assets, Profile). Der Nachweis
-- Mandantentrennung (V-3) hat es nicht gemeldet: die Politik nennt
-- auth.uid() und bestand deshalb die Pruefung "bindet an den Anmelder" — sie
-- bindet aber keine ZEILE an ihn.
-- Gedacht war der Zugriff fuer Dozenten auf ihre Studierenden (Lehr-Org:
-- Studierende treten per Einladung einer Org bei, deren Owner Dozent ist).
-- Genau darauf wird er jetzt begrenzt; alles Weitere regeln die uebrigen
-- Politiken wie fuer jeden Nutzer.
-- ============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.is_student_of_lecturer(_lecturer_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT _lecturer_id IS NOT NULL AND _student_id IS NOT NULL
     AND public.is_lecturer(_lecturer_id)
     AND public.is_student(_student_id)
     AND EXISTS (
       SELECT 1
         FROM public.organizations o
         JOIN public.org_members m ON m.org_id = o.id
        WHERE o.owner_id = _lecturer_id
          AND m.user_id = _student_id)
$fn$;

DO $lec$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['assets','audit_findings','audits','company_profiles',
                           'incidents','profiles','user_tool_data'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "Lecturers full access" ON public.%I', t);
      EXECUTE format(
        'CREATE POLICY "Lecturers full access" ON public.%I FOR ALL TO authenticated
           USING (public.is_student_of_lecturer(auth.uid(), user_id))
           WITH CHECK (public.is_student_of_lecturer(auth.uid(), user_id))', t);
    END IF;
  END LOOP;
  IF to_regclass('public.student_policy_downloads') IS NOT NULL THEN
    DROP POLICY IF EXISTS own_select_spd ON public.student_policy_downloads;
    CREATE POLICY own_select_spd ON public.student_policy_downloads FOR SELECT
      USING (student_user_id = auth.uid()
             OR public.has_role(auth.uid(), 'admin'::public.app_role)
             OR public.is_student_of_lecturer(auth.uid(), student_user_id));
  END IF;
END
$lec$;

COMMIT;

-- ============================================================================
-- V-5/L-03 — Org-Eigentum unveraenderlich (unabhaengige Pruefung 19.09.2026)
-- ----------------------------------------------------------------------------
-- Gemessen lokal (Transaktion mit ROLLBACK): die Politik "Owners can update
-- their organization" prueft nur has_org_role(auth.uid(), id, 'owner') — nicht
-- owner_id. Jeder Owner (und jedes frische Konto: Org anlegen, sich als Owner
-- eintragen) konnte   UPDATE organizations SET owner_id = <fremde Nutzer-ID>
-- ausfuehren. get_org_owner_id() lieferte danach den FREMDEN Nutzer als
-- Mandanten: dessen Antworten waren les- und aenderbar, seine Lizenz und
-- Sitzplaetze wurden mitbenutzt. Dasselbe Muster wie V-5/L-01, nur auf der
-- anderen Tabelle — L-01 hatte nur org_members geschlossen.
-- Fix: id, owner_id und created_at einer Org sind fuer ALLE Rollen fest.
-- Kein Codepfad aendert sie (geprueft: api/, web/). Name bleibt aenderbar.
-- Eine gewollte Eigentumsuebertragung ist ein bewusster Admin-Eingriff
-- (Trigger kurz deaktivieren), kein Klick im Produkt.
--
-- Nebenbei (LOW): "Owner or admin can remove members" erlaubte einem Org-Admin,
-- per Gateway die Owner-Mitgliedschaft zu loeschen. Der Owner bleibt jetzt
-- stehen — genau wie in /functions/org-team (role <> 'owner').
-- ============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.organizations_identitaet_fest()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'organizations: id, owner_id und created_at sind unveraenderlich'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$fn$;
DROP TRIGGER IF EXISTS organizations_identitaet_fest ON public.organizations;
CREATE TRIGGER organizations_identitaet_fest
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.organizations_identitaet_fest();

DROP POLICY IF EXISTS "Owner or admin can remove members" ON public.org_members;
CREATE POLICY "Owner or admin can remove members" ON public.org_members
  FOR DELETE TO authenticated
  USING (public.has_org_role(auth.uid(), org_id, ARRAY['owner'::public.org_role, 'admin'::public.org_role])
         AND role <> 'owner'::public.org_role);

COMMIT;
