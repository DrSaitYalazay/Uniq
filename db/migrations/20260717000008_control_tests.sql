-- ============================================================
-- Continuous-Compliance-Tests (Spec-ITEM 24, DB-Teil).
-- Additiv, leer -> verhaltensneutral. Tenant-RLS wie kpi_snapshots.
-- Connector-/Sync-Logik (Intune/ServiceNow -> Ergebnisse) folgt separat.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.control_tests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  framework  text,                          -- Ziel-Kontrolle (optional)
  control_id text,
  node_id    text REFERENCES public.control_node(node_id) ON DELETE CASCADE,  -- ODER Knoten
  kind       text NOT NULL,                 -- 'mfa_coverage' | 'patch_compliance' | 'custom' ...
  label      text NOT NULL,
  schedule   text,                          -- Cron-artig / 'daily' / 'weekly' (App-interpretiert)
  config     jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled    boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS control_tests_tenant_idx ON public.control_tests (tenant_id);

CREATE TABLE IF NOT EXISTS public.control_test_results (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  test_id    uuid NOT NULL REFERENCES public.control_tests(id) ON DELETE CASCADE,
  ran_at     timestamptz NOT NULL DEFAULT now(),
  status     text NOT NULL CHECK (status IN ('pass','fail','error','na')),
  evidence_id uuid REFERENCES public.evidence(id) ON DELETE SET NULL,
  detail     jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS control_test_results_tenant_idx ON public.control_test_results (tenant_id, test_id, ran_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.control_tests TO authenticated;
GRANT ALL ON public.control_tests TO service_role;
GRANT SELECT, INSERT, DELETE ON public.control_test_results TO authenticated;
GRANT ALL ON public.control_test_results TO service_role;

ALTER TABLE public.control_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "control_tests_tenant_select" ON public.control_tests FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "control_tests_tenant_insert" ON public.control_tests FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "control_tests_tenant_update" ON public.control_tests FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "control_tests_tenant_delete" ON public.control_tests FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "control_test_results_tenant_select" ON public.control_test_results FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "control_test_results_tenant_insert" ON public.control_test_results FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "control_test_results_tenant_delete" ON public.control_test_results FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
