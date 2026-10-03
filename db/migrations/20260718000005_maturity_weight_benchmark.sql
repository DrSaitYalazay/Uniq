-- ============================================================
-- E6: maturity_targets.weight (Domain-Gewicht fuer gewichteten Rollup).
-- E8/E9: benchmark_stats (GLOBAL, Job-befuellt, k-Anonymitaet n>=8).
-- Additiv.
-- ============================================================
ALTER TABLE public.maturity_targets
  ADD COLUMN IF NOT EXISTS weight numeric NOT NULL DEFAULT 1 CHECK (weight > 0);

CREATE TABLE IF NOT EXISTS public.benchmark_stats (
  cohort_sector text NOT NULL,
  cohort_size   text NOT NULL,          -- 'xs'|'s'|'m'|'l'
  metric        text NOT NULL,          -- 'posture' | KPI-IDs | 'maturity_overall'
  p25 numeric, p50 numeric, p75 numeric,
  n int NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cohort_sector, cohort_size, metric)
);
-- Read-only fuer authenticated (aggregierte, anonyme Kohortenwerte; nur n>=8 wird vom Job geschrieben).
GRANT SELECT ON public.benchmark_stats TO authenticated;
GRANT ALL ON public.benchmark_stats TO service_role;
ALTER TABLE public.benchmark_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS benchmark_stats_read ON public.benchmark_stats;
CREATE POLICY benchmark_stats_read ON public.benchmark_stats FOR SELECT TO authenticated USING (true);
