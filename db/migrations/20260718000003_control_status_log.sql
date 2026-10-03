-- ============================================================
-- control_status_log (E3 CCM): Drift-Statemachine-Log je Kontrolle.
-- + control_tests.interval_hours (macht 'schedule' rechenbar).
-- Additiv, tenant-RLS.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.control_status_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  framework  text NOT NULL,
  control_id text NOT NULL,
  from_state text NOT NULL,
  to_state   text NOT NULL,
  cause      text NOT NULL,   -- test_fail | test_recovered | evidence_expired | answer_changed | test_silent
  test_id    uuid,
  detail     jsonb NOT NULL DEFAULT '{}'::jsonb,
  at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS control_status_log_idx
  ON public.control_status_log (tenant_id, framework, control_id, at DESC);

GRANT SELECT, INSERT, DELETE ON public.control_status_log TO authenticated;
GRANT ALL ON public.control_status_log TO service_role;
ALTER TABLE public.control_status_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "control_status_log_tenant_select" ON public.control_status_log FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "control_status_log_tenant_insert" ON public.control_status_log FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "control_status_log_tenant_delete" ON public.control_status_log FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

ALTER TABLE public.control_tests
  ADD COLUMN IF NOT EXISTS interval_hours int NOT NULL DEFAULT 24;
