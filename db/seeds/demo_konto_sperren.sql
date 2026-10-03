-- ============================================================================
-- Sicherheitsbefund 03.10.2026: db/schema.sql legt bei der ERSTEN Initialisierung
-- einer Datenbank (Migration 20260701092634 + 20260701092803 aus der Lovable-Zeit)
-- ein Konto demo@uniqsuite.com (vorher demo@nis2suite.com) mit ROLLE 'admin' und
-- einem Passwort an, das im Klartext im Repository steht. Lokal nachgewiesen:
-- auf einer frisch initialisierten Datenbank meldet sich dieses Konto an und ist
-- Plattform-Admin.
--
-- Dieser Seed macht das Konto unbrauchbar, ohne etwas zu löschen:
--   * Admin-Rolle entzogen
--   * Passwort durch einen zufälligen, nirgends gespeicherten Wert ersetzt
--   * Konto eingefroren (banned_until), Refresh-Tokens widerrufen (nicht gelöscht)
-- Idempotent; läuft bei jedem Deploy. Soll das Konto wieder genutzt werden:
-- Admin-Bereich -> Sperre aufheben und Passwort neu setzen.
-- ============================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM auth.users WHERE lower(email) IN ('demo@uniqsuite.com', 'demo@nis2suite.com') LOOP
    DELETE FROM public.user_roles WHERE user_id = r.id AND role = 'admin';
    UPDATE auth.users
       SET encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
           banned_until = '9999-12-31'::timestamptz,
           updated_at = now()
     WHERE id = r.id;
    -- Sitzungen widerrufen, NICHT löschen: die Zeilen sind Beweismittel
    -- (wann wurden Sitzungen ausgestellt?). Gleiches Muster wie admin-set-ban.
    UPDATE auth.refresh_tokens SET revoked = true, revoked_reason = 'demo_konto_gesperrt'
     WHERE user_id = r.id AND revoked = false;
    RAISE NOTICE 'Demo-Konto % gesperrt (Admin-Rolle entzogen, Passwort zufällig, eingefroren).', r.id;
  END LOOP;
END $$;
