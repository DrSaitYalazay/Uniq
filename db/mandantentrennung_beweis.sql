-- ============================================================================
-- MANDANTENTRENNUNG — der Beweis, nicht die Vermutung
-- ============================================================================
-- Frage: kann Kunde A die Daten von Kunde B sehen oder aendern?
--
-- Warum dieser Weg und nicht „drei Konten anlegen und durchklicken":
--   · Die Trennung entscheidet die DATENBANK, nicht die Oberflaeche. Das
--     Gateway (/db/query) setzt nur `SET LOCAL ROLE` + die JWT-Claims; jede
--     Zeile Schutz steht in den RLS-Politiken. Genau die werden hier direkt
--     befragt — mit demselben Mechanismus, den der Server im Betrieb benutzt.
--   · Drei Konten pruefen die drei Bildschirme, die man zufaellig oeffnet.
--     Dieses Skript prueft ALLE 34 Mandantentabellen, lesend UND schreibend.
--   · Es braucht keine Zugangsdaten und legt keine Konten an.
--
-- SICHERHEIT DIESES SKRIPTS
--   · Alles laeuft in EINER Transaktion, die am Ende mit ROLLBACK endet.
--     Es bleibt nichts zurueck — auch die Schreibversuche nicht.
--   · Es liest echte Daten, veraendert aber dauerhaft nichts.
--
-- AUSFUEHREN (auf dem Server):
--     cd /root/UniqSuite
--     docker compose exec -T db psql -U postgres -d cy -v ON_ERROR_STOP=1 \
--       < mandantentrennung_beweis.sql
--
-- LESEN DES ERGEBNISSES
--   Am Ende steht eine Tabelle. Jede Zeile mit `ergebnis <> 'ok'` ist ein Leck.
--   Steht dort „zu wenig Daten", gibt es in dieser Tabelle nur einen Mandanten —
--   dann ist die Zeile weder bestanden noch durchgefallen, sondern ungeprueft.
-- ============================================================================

\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE _ergebnis(
  tabelle      text,
  ist_admin    boolean,
  besitzer_spalte text,
  mandanten   int,
  identitaet  text,
  eigene      bigint,
  sichtbar    bigint,
  fremd_sichtbar bigint,
  fremd_aenderbar bigint,
  umgebogen   bigint,
  ergebnis    text
) ON COMMIT DROP;

-- Der Kern: fuer eine Tabelle und eine Identitaet genau das tun, was das
-- Gateway tut, und zaehlen, was dabei sichtbar bzw. aenderbar ist.
-- V-5: _bereich = was fuer diese Identitaet GEWOLLT sichtbar ist, als
-- format()-Vorlage mit %1$L fuer die Identitaet. Ohne Angabe: nur die eigenen
-- Zeilen (Spalte = Identitaet). Mit Angabe z. B. auch die Kolleginnen und
-- Kollegen derselben Org — sonst meldete der Nachweis jedes Team als "LECK".
CREATE OR REPLACE FUNCTION pg_temp.pruefe(_tab text, _spalte text, _bereich text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  bereich    text;
  ids        text[];
  ident      text;
  admin      boolean;
  n_eigene   bigint;
  n_sicht    bigint;
  n_fremd    bigint;
  n_aender   bigint;
  n_umbieg   bigint;
  anderer    text;
  urteil     text;
BEGIN
  -- Welche Mandanten kommen in dieser Tabelle ueberhaupt vor? (als postgres,
  -- also ohne RLS — das ist die Wahrheit, gegen die wir vergleichen)
  EXECUTE format(
    'SELECT array_agg(DISTINCT %I::text) FROM (SELECT %I FROM public.%I WHERE %I IS NOT NULL LIMIT 5000) s',
    _spalte, _spalte, _tab, _spalte) INTO ids;

  IF ids IS NULL OR array_length(ids, 1) IS NULL OR array_length(ids, 1) < 2 THEN
    INSERT INTO _ergebnis VALUES (_tab, NULL, _spalte, COALESCE(array_length(ids,1),0),
      NULL, NULL, NULL, NULL, NULL, NULL, 'zu wenig Daten');
    RETURN;
  END IF;

  -- Bis zu drei Identitaeten durchspielen — mehr bringt keinen Erkenntnisgewinn.
  FOREACH ident IN ARRAY ids[1:3] LOOP
    -- Ist diese Identitaet Plattform-Admin? Ein Admin SOLL laut Politik alles
    -- sehen ("Admins can view all profiles", "Admins can manage all roles").
    -- Der erste Lauf am 18.09.2026 meldete deshalb 4 "Lecks", die keine waren:
    -- beide vorhandenen Konten sind Admins. Ein Test, der Berechtigung nicht
    -- von Bruch unterscheidet, erzeugt Fehlalarme — und die kosten Vertrauen.
    BEGIN
      SELECT public.has_role(ident::uuid, 'admin'::public.app_role) INTO admin;
    EXCEPTION WHEN others THEN
      admin := NULL;   -- Tabelle ohne Nutzerbezug (z. B. org_id) -> unbekannt
    END;

    bereich := CASE WHEN _bereich IS NULL THEN format('%I::text = %L', _spalte, ident)
                    ELSE format(_bereich, ident) END;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE %s', _tab, bereich)
      INTO n_eigene;

    -- Ab hier exakt wie im Betrieb: Rolle wechseln, Claims setzen.
    SET LOCAL ROLE authenticated;
    PERFORM set_config('request.jwt.claims',
      json_build_object('sub', ident, 'role', 'authenticated', 'aud', 'authenticated')::text, true);

    EXECUTE format('SELECT count(*) FROM public.%I', _tab) INTO n_sicht;
    EXECUTE format('SELECT count(*) FROM public.%I WHERE NOT (%s)', _tab, bereich)
      INTO n_fremd;

    -- Schreibversuch auf FREMDE Zeilen. Greift RLS, sind es 0 Zeilen.
    BEGIN
      EXECUTE format('WITH x AS (UPDATE public.%I SET %I = %I WHERE NOT (%s) RETURNING 1) SELECT count(*) FROM x',
                     _tab, _spalte, _spalte, bereich) INTO n_aender;
    EXCEPTION WHEN insufficient_privilege OR others THEN
      n_aender := 0;   -- Rechte fehlen ganz => erst recht kein Zugriff
    END;

    -- Pruefung 19.09.2026: EIGENE Zeilen auf eine fremde Identitaet umbiegen.
    -- Genau so liefen beide Uebernahmen (V-5/L-01: org_members.user_id,
    -- V-5/L-03: organizations.owner_id) — der Schreibversuch oben fasst nur
    -- FREMDE Zeilen an und meldete sie deshalb nicht. Muss 0 Zeilen treffen
    -- oder scheitern. Die Aenderung wird IMMER zurueckgerollt (erzwungene
    -- Ausnahme im Unterblock), damit sie die folgenden Proben nicht verfaelscht;
    -- die Zaehlvariable ueberlebt das Zuruecksetzen.
    -- Ziel ist eine Identitaet aus einem ANDEREN Mandanten: innerhalb derselben
    -- Org ist das Umhaengen (z. B. an eine Kollegin) gewollt erlaubt und kein Leck.
    RESET ROLE;
    BEGIN
      SELECT x INTO anderer FROM unnest(ids) AS x
       WHERE x <> ident
         AND COALESCE(public.get_org_owner_id(x::uuid), x::uuid)
             IS DISTINCT FROM COALESCE(public.get_org_owner_id(ident::uuid), ident::uuid)
       LIMIT 1;
    EXCEPTION WHEN others THEN
      anderer := (SELECT x FROM unnest(ids) AS x WHERE x <> ident LIMIT 1);
    END;
    SET LOCAL ROLE authenticated;
    n_umbieg := NULL;   -- NULL = nicht beurteilbar (kein fremder Mandant in der Stichprobe)
    IF anderer IS NOT NULL THEN
      BEGIN
        EXECUTE format('WITH x AS (UPDATE public.%I SET %I = %L WHERE %I::text = %L RETURNING 1) SELECT count(*) FROM x',
                       _tab, _spalte, anderer, _spalte, ident) INTO n_umbieg;
        RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'beweis_rollback';
      EXCEPTION
        WHEN raise_exception THEN
          IF SQLERRM <> 'beweis_rollback' THEN n_umbieg := 0; END IF;
        WHEN unique_violation OR foreign_key_violation THEN
          -- Trigger und RLS-WITH-CHECK laufen VOR Eindeutigkeits- und
          -- Fremdschluesselpruefung: kommt der Fehler von dort, haette RLS das
          -- Umbiegen durchgelassen — gestoppt hat nur der Zufall der Kollision.
          n_umbieg := 1;
        WHEN others THEN
          n_umbieg := 0;   -- Trigger/RLS/Rechte verweigern => nicht umbiegbar
      END;
    END IF;

    RESET ROLE;

    urteil := CASE
      WHEN COALESCE(admin, false) AND (n_fremd > 0 OR n_aender > 0 OR COALESCE(n_umbieg, 0) > 0)
        THEN 'ok (Admin, darf laut Politik)'
      WHEN n_fremd > 0 THEN 'LECK: liest fremde Zeilen'
      WHEN n_aender > 0 THEN 'LECK: aendert fremde Zeilen'
      WHEN COALESCE(n_umbieg, 0) > 0 THEN 'LECK: biegt eigene Zeilen auf Fremde um'
      WHEN n_sicht > n_eigene THEN 'LECK: sieht mehr als die eigenen'
      ELSE 'ok'
    END;

    INSERT INTO _ergebnis VALUES (_tab, admin, _spalte, array_length(ids,1), ident,
                                  n_eigene, n_sicht, n_fremd, n_aender, n_umbieg, urteil);
  END LOOP;
EXCEPTION WHEN undefined_table THEN
  -- 11 Spalten (seit 19.09.2026; vorher 10, nicht 9): die erste Fassung schob hier `_spalte` in die
  -- boolean-Spalte `ist_admin` und haette beim ersten fehlenden Tabellennamen
  -- den ganzen Lauf mit einem Typfehler abgebrochen. Nie ausgeloest, aber eine
  -- Mine im Pruefwerkzeug ist so schlimm wie eine im Produkt.
  INSERT INTO _ergebnis VALUES (_tab, NULL, _spalte, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Tabelle fehlt');
END;
$fn$;

-- ── Die 34 Mandantentabellen — EINE Liste, beide Saeulen ────────────────────
-- Frueher stand diese Liste nur als 34 Aufrufe da. Die zweite Saeule (unten)
-- braucht dieselben Namen; zwei gepflegte Listen laufen frueher oder spaeter
-- auseinander, und dann prueft die eine Saeule etwas anderes als die andere.
CREATE TEMP TABLE _tabellen(tabelle text, spalte text, bereich text) ON COMMIT DROP;
INSERT INTO _tabellen(tabelle, spalte) VALUES
  ('answer_evidence','tenant_id'),      ('answers','tenant_id'),
  ('assets','user_id'),                 ('audit_findings','user_id'),
  ('audits','user_id'),                 ('company_profiles','user_id'),
  ('compliance_deadlines','tenant_id'), ('control_status_log','tenant_id'),
  ('control_test_results','tenant_id'), ('control_tests','tenant_id'),
  ('coverage_review','tenant_id'),      ('dependencies','user_id'),
  ('evidence','tenant_id'),             ('implementation_status','tenant_id'),
  ('incidents','user_id'),              ('integration_secrets','user_id'),
  ('integrations','user_id'),           ('kpi_snapshots','tenant_id'),
  ('maturity_targets','tenant_id'),     ('org_invitations','org_id'),
  ('org_members','user_id'),            ('org_tool_data','tenant_id'),
  ('organizations','owner_id'),         ('profiles','user_id'),
  ('quant_runs','tenant_id'),           ('quant_scenarios','tenant_id'),
  ('roadmap_items','user_id'),          ('services','user_id'),
  ('student_policy_downloads','org_id'),('tenant_licenses','tenant_id'),
  ('training_completions','user_id'),   ('training_quiz_results','user_id'),
  ('user_roles','user_id'),             ('user_tool_data','user_id');

-- V-5: gewollt geteilte Sichtbarkeit. Ohne das meldete der Nachweis, sobald
-- Kunden Teams haben, jede Kollegin als "fremde Zeile" (am 19.09.2026 lokal
-- reproduziert: Owner sieht sein Mitglied -> "LECK").
--   org_members / organizations: Zeilen der eigenen Org(s)
--   profiles: Kolleginnen derselben Org (in_same_org, wie die Politik gedacht ist)
--   Dozenten-Tabellen: die eigenen Studierenden (ab V-5 nur noch diese)
UPDATE _tabellen SET bereich = 'user_id::text = %1$L OR public.is_org_member(%1$L::uuid, org_id)'
 WHERE tabelle = 'org_members';
UPDATE _tabellen SET bereich = 'owner_id::text = %1$L OR public.is_org_member(%1$L::uuid, id)'
 WHERE tabelle = 'organizations';
UPDATE _tabellen SET bereich = 'user_id::text = %1$L OR public.in_same_org(%1$L::uuid, user_id)'
 WHERE tabelle IN ('profiles',
                   -- Pruefung 19.09.2026: auch diese Tabellen teilen ihre Zeilen
                   -- gewollt mit der Org ("Org members can view/update ...",
                   -- dependencies/services_owner_all). Ohne das meldete der Nachweis
                   -- jede Kollegin mit eigenen Zeilen als Leck.
                   'assets','audit_findings','audits','company_profiles',
                   'dependencies','incidents','services','user_tool_data');
-- Bekannte Grenze: die erwartete Sichtbarkeit nutzt dieselbe Hilfsfunktion
-- in_same_org() wie die Politiken. Deren Logik ist kurz (gleiche Org, keine
-- Studierenden) — aendert sie jemand, muss dieser Nachweis mitgelesen werden.
UPDATE _tabellen
   SET bereich = coalesce(bereich, 'user_id::text = %1$L')
                 || ' OR public.is_student_of_lecturer(%1$L::uuid, user_id)'
 WHERE tabelle IN ('assets','audit_findings','audits','company_profiles','incidents','profiles','user_tool_data')
   AND to_regprocedure('public.is_student_of_lecturer(uuid,uuid)') IS NOT NULL;

SELECT pg_temp.pruefe(tabelle, spalte, bereich) FROM _tabellen ORDER BY tabelle;

-- ============================================================================
-- ZWEITE SAEULE — die Politiken selbst, live aus dem Katalog
-- ----------------------------------------------------------------------------
-- Die Datenprobe oben kann eine Tabelle nur beurteilen, wenn dort bereits ZWEI
-- Mandanten Zeilen haben. Bei einem frischen Produkt sind die meisten Tabellen
-- leer — beim Verkaufsgespraech ist "ungeprueft" aber keine Antwort, und
-- Testdaten von Hand in 26 Tabellen zu klopfen prueft am Ende nur die Geduld.
--
-- Deshalb hier die datenunabhaengige Probe. Nicht das Schema auf der Platte,
-- sondern der LAUFENDE Katalog (pg_class, pg_policies) wird gefragt — also das,
-- was der Server in dieser Sekunde wirklich anwendet:
--   1. Ist RLS eingeschaltet?            Aus = jeder Angemeldete sieht alles.
--   2. Filtert jede LESENDE Politik am Anmelder? Jede PERMISSIVE Politik fuer
--      SELECT/ALL muss auth.uid() bzw. die JWT-Claims im Ausdruck tragen. Fehlt
--      der Bezug, gilt sie fuer JEDEN Angemeldeten — genau das ist das Leck.
--   3. Dasselbe fuer die SCHREIBENDEN Politiken (WITH CHECK bzw. USING).
--   4. Gibt es ueberhaupt eine Politik? Keine = Tabelle ist zu. Kein Leck,
--      sondern ein Funktionsausfall — deshalb eigener Befund, keine Fehlalarm.
--
-- has_role(auth.uid(),'admin') traegt auth.uid() und gilt damit als gebunden;
-- Admin-Politiken sind gewollt weit und werden gezaehlt, nicht gemeldet.
-- ============================================================================
CREATE TEMP TABLE _politik(
  tabelle text, rls boolean, n_politik int,
  n_offen_lesen int, n_offen_schreiben int, n_admin int, n_verweigert int,
  n_rollenweit int,
  anon_recht boolean, offene_stellen text, befund text
) ON COMMIT DROP;

-- Was als "an den Anmelder gebunden" zaehlt. Bewusst eng gefasst, und bewusst
-- EINMAL definiert statt dreimal als Zeichenkette wiederholt: dieselbe Regel an
-- drei Stellen driftet auseinander. Dollar-Anfuehrung, damit die Rueckstriche
-- des Ausdrucks unterwegs niemand mehr verbiegt.
CREATE OR REPLACE FUNCTION pg_temp.gebunden(_ausdruck text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS
$g$ SELECT coalesce($1, '') ~ 'auth\.uid\(\)|auth\.jwt\(\)|request\.jwt\.claims' $g$;

-- Eine Politik `USING (false)` traegt keinen auth.uid() — und ist trotzdem das
-- GEGENTEIL eines Lecks: sie gibt dem Client gar nichts. Der erste Lauf meldete
-- deshalb `integration_secrets` (die Tabelle mit den Zugangsdaten fremder
-- Systeme!) als einziges Leck der ganzen Datenbank. Ein Pruefwerkzeug, das die
-- strengste Tabelle als die schlechteste ausweist, misst die falsche Sache.
CREATE OR REPLACE FUNCTION pg_temp.verweigert(_ausdruck text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS
$g$ SELECT btrim(lower(coalesce($1, '')), '() ') = 'false' $g$;

-- V-5: "traegt auth.uid()" reicht nicht. Die Politik
--     "Lecturers full access" USING (is_lecturer(auth.uid()))
-- traegt auth.uid(), gilt aber fuer JEDE Zeile — jeder mit der Rolle las die
-- Daten aller Kunden, und dieser Nachweis meldete "ok". Gebunden ist eine
-- Politik erst, wenn sie eine SPALTE der Zeile mit dem Anmelder verknuepft.
-- Reine Admin-Politiken sind gewollt weit und bleiben ausgenommen.
CREATE OR REPLACE FUNCTION pg_temp.zeilenbezug(_tab text, _ausdruck text)
RETURNS boolean LANGUAGE sql STABLE AS
$z$
  SELECT regexp_replace(coalesce(_ausdruck, ''), '''[^'']*''', '', 'g') ~ ('(^|[^A-Za-z0-9_])' || _tab || '\.')
      OR EXISTS (
           SELECT 1 FROM information_schema.columns c
            WHERE c.table_schema = 'public' AND c.table_name = _tab
              AND regexp_replace(coalesce(_ausdruck, ''), '''[^'']*''', '', 'g')
                  ~ ('(^|[^A-Za-z0-9_."])' || c.column_name || '($|[^A-Za-z0-9_("])'))
$z$;
CREATE OR REPLACE FUNCTION pg_temp.nur_admin(_ausdruck text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS
$a$ SELECT regexp_replace(coalesce($1, ''), '[\s()]', '', 'g') = 'has_roleauth.uid,''admin''::app_role' $a$;

INSERT INTO _politik
SELECT t.tabelle,
       c.relrowsecurity,
       count(p.policyname)::int,
       count(*) FILTER (WHERE p.permissive = 'PERMISSIVE'
                          AND p.cmd IN ('SELECT','ALL')
                          AND NOT pg_temp.verweigert(p.qual)
                          AND NOT pg_temp.gebunden(coalesce(p.qual, 'true')))::int,
       count(*) FILTER (WHERE p.permissive = 'PERMISSIVE'
                          AND p.cmd IN ('INSERT','UPDATE','DELETE','ALL')
                          AND NOT pg_temp.verweigert(coalesce(p.with_check, p.qual))
                          AND NOT pg_temp.gebunden(coalesce(p.with_check, p.qual, 'true')))::int,
       count(*) FILTER (WHERE coalesce(p.qual,'') ~ 'has_role')::int,
       count(*) FILTER (WHERE pg_temp.verweigert(p.qual))::int,
       count(*) FILTER (WHERE p.permissive = 'PERMISSIVE'
                          AND pg_temp.gebunden(coalesce(p.qual, p.with_check))
                          AND NOT pg_temp.nur_admin(coalesce(p.qual, p.with_check))
                          AND NOT pg_temp.zeilenbezug(t.tabelle, coalesce(p.qual, '') || ' ' || coalesce(p.with_check, '')))::int,
       coalesce(has_table_privilege('anon', 'public.' || t.tabelle, 'SELECT'), false),
       string_agg(p.policyname || ' [' || p.cmd || '] ' || coalesce(p.qual, '(ohne USING)'), ' | ')
         FILTER (WHERE p.permissive = 'PERMISSIVE'
                   AND NOT pg_temp.verweigert(p.qual)
                   AND (NOT pg_temp.gebunden(coalesce(p.qual, p.with_check, 'true'))
                        OR (NOT pg_temp.nur_admin(coalesce(p.qual, p.with_check))
                            AND NOT pg_temp.zeilenbezug(t.tabelle, coalesce(p.qual, '') || ' ' || coalesce(p.with_check, ''))))),
       NULL
  FROM _tabellen t
  LEFT JOIN pg_class c ON c.oid = to_regclass('public.' || t.tabelle)
  LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = t.tabelle
 GROUP BY t.tabelle, c.relrowsecurity;

-- Reihenfolge der Faelle ist Absicht: erst das, was den Schutz ganz aufhebt.
UPDATE _politik SET befund = CASE
  WHEN rls IS NULL             THEN 'Tabelle fehlt'
  WHEN rls IS NOT TRUE         THEN 'LECK: RLS ist AUS'
  WHEN n_offen_lesen > 0       THEN 'LECK: lesende Politik ohne Anmelderbezug'
  WHEN n_offen_schreiben > 0   THEN 'LECK: schreibende Politik ohne Anmelderbezug'
  WHEN n_rollenweit > 0        THEN 'LECK: Politik gilt fuer eine ganze Rolle (kein Zeilenbezug)'
  WHEN n_politik > 0 AND n_verweigert = n_politik
                               THEN 'zu (Politik verweigert jeden Client)'
  WHEN n_politik = 0           THEN 'zu (keine Politik — kein Zugriff, kein Leck)'
  ELSE 'ok (Politik bindet an den Anmelder)'
END;

-- ── Ergebnis ────────────────────────────────────────────────────────────────
\echo ''
\echo '════ MANDANTENTRENNUNG — Ergebnis je Tabelle ════'
SELECT tabelle, CASE ist_admin WHEN true THEN 'Admin' WHEN false THEN '-' ELSE '?' END AS rolle,
       besitzer_spalte AS spalte, mandanten AS n_mandanten,
       left(identitaet, 8) AS identitaet,
       eigene, sichtbar, fremd_sichtbar AS fremd_lesbar, fremd_aenderbar,
       umgebogen AS eigene_umgebogen,
       ergebnis
  FROM _ergebnis
 ORDER BY (ergebnis LIKE 'LECK%') DESC, tabelle, identitaet;

\echo ''
\echo '════ Zusammenfassung ════'
SELECT
  count(*) FILTER (WHERE ergebnis = 'ok')              AS bestanden,
  count(*) FILTER (WHERE ergebnis LIKE 'LECK%')        AS lecks,
  count(*) FILTER (WHERE ergebnis LIKE 'ok (Admin%')     AS admin_erwartet,
  count(*) FILTER (WHERE ergebnis = 'zu wenig Daten')  AS ungeprueft,
  count(*) FILTER (WHERE ergebnis = 'Tabelle fehlt')   AS fehlende_tabellen
  FROM _ergebnis;

\echo ''
\echo 'ACHTUNG: Zeilen mit rolle=Admin beweisen NICHTS ueber die Trennung —'
\echo 'ein Admin darf laut Politik alles sehen.'
\echo ''
\echo 'Tabellen, die mangels zweitem Mandanten KEINE Datenprobe zulassen'
\echo '(sie werden unten ueber ihre Politiken geprueft):'
SELECT string_agg(DISTINCT tabelle, ', ' ORDER BY tabelle)
  FROM _ergebnis WHERE ergebnis = 'zu wenig Daten';

\echo ''
\echo '════ ZWEITE SAEULE — Politiken im laufenden Katalog ════'
\echo '(datenunabhaengig: was die Tabelle einem Angemeldeten zeigen WUERDE)'
SELECT tabelle,
       CASE rls WHEN true THEN 'an' WHEN false THEN 'AUS' ELSE '?' END AS rls,
       n_politik AS politiken, n_admin AS davon_admin, n_verweigert AS davon_deny,
       n_offen_lesen AS offen_lesen, n_offen_schreiben AS offen_schreiben,
       CASE WHEN anon_recht THEN 'ja' ELSE '-' END AS anon_grant,
       befund
  FROM _politik
 ORDER BY (befund LIKE 'LECK%') DESC, tabelle;

\echo ''
\echo 'Politiken ohne Anmelder- oder Zeilenbezug (leer = keine):'
SELECT tabelle, offene_stellen FROM _politik
 WHERE offene_stellen IS NOT NULL ORDER BY tabelle;

\echo ''
\echo '════ GESAMTURTEIL ════'
-- Eine Tabelle gilt als nachgewiesen, wenn MINDESTENS EINE der beiden Saeulen
-- sie traegt: entweder die Datenprobe mit zwei echten Mandanten, oder die
-- Politik, die am Anmelder bindet. Ein Leck in EINER Saeule kippt die Tabelle
-- trotzdem — die Saeulen duerfen sich bestaetigen, nicht entlasten.
WITH je_tabelle AS (
  SELECT t.tabelle,
         bool_or(e.ergebnis = 'ok')                      AS daten_ok,
         bool_or(e.ergebnis LIKE 'LECK%')                AS daten_leck,
         bool_or(p.befund LIKE 'ok %')                   AS politik_ok,
         bool_or(p.befund LIKE 'LECK%')                  AS politik_leck,
         bool_or(p.befund LIKE 'zu (%')                  AS zu
    FROM _tabellen t
    LEFT JOIN _ergebnis e ON e.tabelle = t.tabelle
    LEFT JOIN _politik  p ON p.tabelle = t.tabelle
   GROUP BY t.tabelle)
SELECT count(*) FILTER (WHERE daten_leck OR politik_leck)                   AS lecks,
       count(*) FILTER (WHERE NOT (daten_leck OR politik_leck) AND daten_ok)      AS mit_daten_bewiesen,
       count(*) FILTER (WHERE NOT (daten_leck OR politik_leck) AND NOT daten_ok
                          AND politik_ok)                                  AS nur_ueber_politik,
       count(*) FILTER (WHERE NOT (daten_leck OR politik_leck) AND zu)      AS tabelle_zu,
       count(*) FILTER (WHERE NOT (daten_leck OR politik_leck)
                          AND NOT daten_ok AND NOT politik_ok AND NOT zu)   AS offen,
       count(*)                                                            AS tabellen_gesamt
  FROM je_tabelle;

-- Nichts bleibt zurueck. Auch die Schreibversuche nicht.
ROLLBACK;
\echo ''
\echo 'ROLLBACK ausgefuehrt — die Datenbank ist unveraendert.'
