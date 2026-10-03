-- ============================================================================
-- Admin-MFA-Pflicht (03.10.2026) — schaltbar im Admin-Bereich, Standard: AUS.
--
-- Ist sie EIN, gilt die Admin-Rolle nur in einer Sitzung mit zweitem Faktor
-- (aal2). Durchgesetzt an EINER Stelle: public.has_role(). Damit greifen sowohl
-- die Admin-Funktionen der API als auch die 18 RLS-Politiken, die Admins
-- Zugriff geben (u. a. user_roles: Rollen vergeben). Eine Admin-Sitzung ohne
-- zweiten Faktor verhält sich dann wie ein normales Konto.
--
-- Dienst-Kontext (asService, ohne aal im Claim) ist nicht betroffen: die
-- Admin-Funktionen prüfen das aal dort selbst (api/src/functions/_shared.js).
-- Ist die Pflicht AUS, ist has_role() exakt so wie vorher.
-- Idempotent; läuft bei jedem Deploy.
-- Notfall (Admin hat Faktor verloren, Pflicht ist EIN):
--   UPDATE public.platform_settings SET value='{"enabled":false}' WHERE key='admin_mfa_required';
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
-- Nur der Server (asService) liest und schreibt; Clients haben keinen Zugriff.
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_settings FROM PUBLIC, anon, authenticated;

INSERT INTO public.platform_settings (key, value)
VALUES ('admin_mfa_required', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;

-- Ist die Admin-Rolle in DIESER Sitzung nutzbar?
CREATE OR REPLACE FUNCTION public.admin_mfa_satisfied()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT NOT COALESCE((SELECT (value->>'enabled')::boolean FROM public.platform_settings
                        WHERE key = 'admin_mfa_required'), false)
      OR COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'aal', 'aal2') = 'aal2'
$$;
REVOKE EXECUTE ON FUNCTION public.admin_mfa_satisfied() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_mfa_satisfied() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
     AND (_role <> 'admin' OR public.admin_mfa_satisfied())
$$;
