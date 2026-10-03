-- ============================================================
-- KPI-Snapshots (ARCHITECTURE.md §4.8): Trend-Historie ueberlebt Geraetewechsel.
-- Loest den Snapshot-im-Tool-Blob ab. Additiv, tenant-RLS.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  taken_at   timestamptz NOT NULL DEFAULT now(),
  metrics    jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { kpi_id: value, ... }
  has_data   jsonb NOT NULL DEFAULT '{}'::jsonb,   -- { kpi_id: bool } (no_data-Prinzip)
  source     text NOT NULL DEFAULT 'auto'          -- 'auto' (Cron) | 'manual'
);
CREATE INDEX IF NOT EXISTS kpi_snapshots_tenant_idx ON public.kpi_snapshots (tenant_id, taken_at DESC);

GRANT SELECT, INSERT, DELETE ON public.kpi_snapshots TO authenticated;
GRANT ALL ON public.kpi_snapshots TO service_role;
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kpi_snapshots_tenant_select" ON public.kpi_snapshots FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "kpi_snapshots_tenant_insert" ON public.kpi_snapshots FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "kpi_snapshots_tenant_delete" ON public.kpi_snapshots FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
