-- ============================================================================
-- UniqSuite — Plattform-Admin für eine frische Installation.
-- In einer neuen Datenbank gibt es keinen Admin: der erste registrierte Nutzer
-- bekommt (wie in ClaudeCWS) nur die Rolle 'user'. Hier wird die Adresse aus
-- .env (ADMIN_EMAIL) als Admin hinterlegt:
--   * besteht das Konto schon  -> Rolle 'admin' sofort
--   * wird es später angelegt  -> Trigger vergibt 'admin' bei der Registrierung
-- Idempotent; läuft bei jedem Deploy. Aufruf mit  -v admin_email='…'
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uniqsuite_admin_emails (email text PRIMARY KEY);
REVOKE ALL ON public.uniqsuite_admin_emails FROM PUBLIC, anon, authenticated;
ALTER TABLE public.uniqsuite_admin_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO public.uniqsuite_admin_emails (email)
SELECT lower(trim(:'admin_email')) WHERE trim(:'admin_email') <> ''
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.uniqsuite_bootstrap_admin() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.uniqsuite_admin_emails a WHERE a.email = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS uniqsuite_bootstrap_admin ON auth.users;
CREATE TRIGGER uniqsuite_bootstrap_admin AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.uniqsuite_bootstrap_admin();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin' FROM auth.users u
JOIN public.uniqsuite_admin_emails a ON a.email = lower(u.email)
ON CONFLICT DO NOTHING;
