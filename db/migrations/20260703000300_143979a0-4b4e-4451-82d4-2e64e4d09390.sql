
-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Business',
  criticality smallint NOT NULL DEFAULT 2 CHECK (criticality BETWEEN 0 AND 4),
  owner text,
  rto_hours integer,
  rpo_hours integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_owner_all" ON public.services FOR ALL
  USING (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id));
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_services_owner BEFORE INSERT ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();
CREATE INDEX idx_services_user ON public.services(user_id);

-- DEPENDENCIES
CREATE TABLE public.dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('service','asset','supplier')),
  source_id uuid,
  source_label text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('service','asset','supplier','cloud','saas','internal')),
  target_id uuid,
  target_label text NOT NULL,
  dependency_type text NOT NULL DEFAULT 'operational',
  criticality smallint NOT NULL DEFAULT 2 CHECK (criticality BETWEEN 0 AND 4),
  is_spof boolean NOT NULL DEFAULT false,
  supplier_country text,
  supplier_contract_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dependencies TO authenticated;
GRANT ALL ON public.dependencies TO service_role;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dependencies_owner_all" ON public.dependencies FOR ALL
  USING (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id));
CREATE TRIGGER trg_dependencies_updated BEFORE UPDATE ON public.dependencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dependencies_owner BEFORE INSERT ON public.dependencies
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();
CREATE INDEX idx_deps_user ON public.dependencies(user_id);
CREATE INDEX idx_deps_source ON public.dependencies(source_id);
CREATE INDEX idx_deps_target ON public.dependencies(target_id);
