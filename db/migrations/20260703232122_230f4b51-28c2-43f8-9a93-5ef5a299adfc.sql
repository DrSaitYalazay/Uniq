CREATE TABLE public.implementation_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  bundle_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','laufend','fertig','blockiert')),
  owner TEXT,
  due_date DATE,
  evidence_url TEXT,
  note TEXT,
  last_status_change_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, bundle_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.implementation_status TO authenticated;
GRANT ALL ON public.implementation_status TO service_role;

ALTER TABLE public.implementation_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "impl_status_tenant_select" ON public.implementation_status
  FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "impl_status_tenant_insert" ON public.implementation_status
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "impl_status_tenant_update" ON public.implementation_status
  FOR UPDATE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "impl_status_tenant_delete" ON public.implementation_status
  FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE INDEX impl_status_tenant_idx ON public.implementation_status(tenant_id);
CREATE INDEX impl_status_bundle_idx ON public.implementation_status(tenant_id, bundle_key);

CREATE TRIGGER impl_status_updated_at
  BEFORE UPDATE ON public.implementation_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update last_status_change_at only when status column changes
CREATE OR REPLACE FUNCTION public.impl_status_track_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.last_status_change_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER impl_status_track_change
  BEFORE UPDATE ON public.implementation_status
  FOR EACH ROW EXECUTE FUNCTION public.impl_status_track_status_change();