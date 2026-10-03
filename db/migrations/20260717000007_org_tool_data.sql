-- ============================================================
-- org_tool_data (ARCHITECTURE.md §2.6 / Spec-Item 14): org-scoped Persistenz
-- fuer geteilte Tool-/Pipeline-Zustaende (Treatments, SoA-Overrides, Risk-Config,
-- Bundle-Owners). Ergaenzt user_tool_data (bleibt fuer persoenliche Daten).
-- Additiv, tenant-RLS. Migration der Blobs macht die App (Client), nicht das Schema.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.org_tool_data (
  tenant_id  uuid NOT NULL,
  tool_key   text NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (tenant_id, tool_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_tool_data TO authenticated;
GRANT ALL ON public.org_tool_data TO service_role;
ALTER TABLE public.org_tool_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_tool_data_tenant_select" ON public.org_tool_data FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "org_tool_data_tenant_insert" ON public.org_tool_data FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "org_tool_data_tenant_update" ON public.org_tool_data FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "org_tool_data_tenant_delete" ON public.org_tool_data FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
