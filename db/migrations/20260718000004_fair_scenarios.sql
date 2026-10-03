-- ============================================================
-- FAIR quantitatives Risiko (ENGINE_ARCHITECTURE_MARKETGRADE E1).
-- quant_scenarios: je Risiko ein FAIR-Szenario (light/full). quant_runs:
-- persistierte Monte-Carlo-Laeufe (Management-Review zitierbar). Additiv, tenant-RLS.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quant_scenarios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  risk_id    text NOT NULL,
  mode       text NOT NULL DEFAULT 'light' CHECK (mode IN ('light','full')),
  inputs     jsonb NOT NULL,
  correlation_group text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS quant_scenarios_tenant_risk_uniq
  ON public.quant_scenarios (tenant_id, risk_id);

CREATE TABLE IF NOT EXISTS public.quant_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  scope       text NOT NULL CHECK (scope IN ('scenario','portfolio')),
  scenario_id uuid REFERENCES public.quant_scenarios(id) ON DELETE CASCADE,
  seed        int NOT NULL,
  draws       int NOT NULL,
  stats       jsonb NOT NULL,
  lec         jsonb NOT NULL,
  meta        jsonb NOT NULL DEFAULT '{}'::jsonb,
  ran_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quant_runs_tenant_idx ON public.quant_runs (tenant_id, ran_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quant_scenarios TO authenticated;
GRANT ALL ON public.quant_scenarios TO service_role;
GRANT SELECT, INSERT, DELETE ON public.quant_runs TO authenticated;
GRANT ALL ON public.quant_runs TO service_role;
ALTER TABLE public.quant_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quant_scenarios_tenant_select" ON public.quant_scenarios FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "quant_scenarios_tenant_insert" ON public.quant_scenarios FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "quant_scenarios_tenant_update" ON public.quant_scenarios FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "quant_scenarios_tenant_delete" ON public.quant_scenarios FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "quant_runs_tenant_select" ON public.quant_runs FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "quant_runs_tenant_insert" ON public.quant_runs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "quant_runs_tenant_delete" ON public.quant_runs FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
