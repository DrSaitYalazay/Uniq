
CREATE TABLE IF NOT EXISTS public.integration_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

-- No client access at all — only service_role via edge functions.
GRANT ALL ON public.integration_secrets TO service_role;
REVOKE ALL ON public.integration_secrets FROM anon, authenticated;

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;

-- Deny-all policy for authenticated (defense in depth even though no GRANT is issued).
CREATE POLICY "no client access" ON public.integration_secrets
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE TRIGGER trg_integration_secrets_updated_at
  BEFORE UPDATE ON public.integration_secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
