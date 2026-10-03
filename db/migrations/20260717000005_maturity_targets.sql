-- ============================================================
-- Maturity-Overlay: Ziel-Reifegrade (ARCHITECTURE.md §2.4).
-- Gap = target - ist(answers.reifegrad). family_id NULL = Framework-weites Ziel.
-- Additiv, tenant-RLS. Default-Targets (z.B. TISAX=3) setzt die App, nicht das Schema.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maturity_targets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  framework  text NOT NULL,
  family_id  text,                       -- NULL = framework-weit; sonst Domaene/Familie
  target     smallint NOT NULL CHECK (target BETWEEN 0 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (tenant_id, framework, family_id)
);
CREATE INDEX IF NOT EXISTS maturity_targets_tenant_idx ON public.maturity_targets (tenant_id, framework);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.maturity_targets TO authenticated;
GRANT ALL ON public.maturity_targets TO service_role;
ALTER TABLE public.maturity_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maturity_targets_tenant_select" ON public.maturity_targets FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "maturity_targets_tenant_insert" ON public.maturity_targets FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "maturity_targets_tenant_update" ON public.maturity_targets FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "maturity_targets_tenant_delete" ON public.maturity_targets FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
