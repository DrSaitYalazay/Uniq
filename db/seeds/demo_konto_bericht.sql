-- ============================================================================
-- Nur LESEN: wurde das Demo-Konto (demo@uniqsuite.com / demo@nis2suite.com)
-- je benutzt? Ausgabe im Deploy-Log. Keine IP-Adressen (das Log liegt bei
-- GitHub) — nur Zeitpunkte und Anzahlen. IPs stehen bei Bedarf auf dem Server
-- in auth.login_attempts und im Caddy-Zugriffsprotokoll.
-- ============================================================================
\pset footer off
\echo '--- Demo-Konto: Kontodaten ---'
SELECT email, created_at, last_sign_in_at, banned_until,
       (SELECT string_agg(role::text, ',') FROM public.user_roles r WHERE r.user_id = u.id) AS rollen
  FROM auth.users u WHERE lower(email) IN ('demo@uniqsuite.com', 'demo@nis2suite.com');
\echo '--- Demo-Konto: Anmeldeversuche (auth.login_attempts) ---'
SELECT kind, successful, count(*) AS anzahl, count(DISTINCT ip) AS verschiedene_ips,
       min(created_at) AS erster, max(created_at) AS letzter
  FROM auth.login_attempts WHERE email_lower IN ('demo@uniqsuite.com', 'demo@nis2suite.com')
 GROUP BY kind, successful ORDER BY kind, successful;
\echo '--- Demo-Konto: ausgestellte Sitzungen (auth.refresh_tokens) ---'
SELECT count(*) AS sitzungen, min(t.created_at) AS erste, max(t.created_at) AS letzte
  FROM auth.refresh_tokens t JOIN auth.users u ON u.id = t.user_id
 WHERE lower(u.email) IN ('demo@uniqsuite.com', 'demo@nis2suite.com');
\echo '--- Demo-Konto: protokollierte Admin-Aktionen (auth.admin_actions) ---'
SELECT a.action, count(*) AS anzahl, max(a.created_at) AS letzte
  FROM auth.admin_actions a JOIN auth.users u ON u.id = a.actor_id
 WHERE lower(u.email) IN ('demo@uniqsuite.com', 'demo@nis2suite.com')
 GROUP BY a.action;
\echo '--- Demo-Konto: angelegte Daten (Mandant = Demo-Konto) ---'
SELECT (SELECT count(*) FROM public.answers a JOIN auth.users u ON u.id = a.tenant_id
         WHERE lower(u.email) IN ('demo@uniqsuite.com','demo@nis2suite.com')) AS antworten,
       (SELECT count(*) FROM public.user_tool_data d JOIN auth.users u ON u.id = d.user_id
         WHERE lower(u.email) IN ('demo@uniqsuite.com','demo@nis2suite.com')) AS werkzeugdaten;
