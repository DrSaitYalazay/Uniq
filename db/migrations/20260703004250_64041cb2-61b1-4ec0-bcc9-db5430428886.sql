
-- Add external source tracking to assets and services
ALTER TABLE public.assets 
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS manually_edited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS manually_edited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS assets_external_uniq 
  ON public.assets(user_id, external_source, external_id) 
  WHERE external_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS services_external_uniq 
  ON public.services(user_id, external_source, external_id) 
  WHERE external_id IS NOT NULL;

-- Integrations registry (persisted external system connections)
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('servicenow','intune','rest_generic')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret_ref text,
  schedule text NOT NULL DEFAULT 'manual' CHECK (schedule IN ('manual','daily')),
  enabled boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_stats jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations tenant read" ON public.integrations FOR SELECT TO authenticated
  USING (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "integrations tenant insert" ON public.integrations FOR INSERT TO authenticated
  WITH CHECK (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "integrations tenant update" ON public.integrations FOR UPDATE TO authenticated
  USING (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "integrations tenant delete" ON public.integrations FOR DELETE TO authenticated
  USING (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_integrations_tenant_rewrite
  BEFORE INSERT ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();
