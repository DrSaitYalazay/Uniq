-- ============================================================================
-- _ensure_schema_tables.sql — Tabellen, die nach dem Erst-Init in schema.sql dazukamen
-- (Produktion 2026-09-11: evidence, answer_evidence, control_tests, control_test_results,
-- quant_runs, quant_scenarios, control_effect, control_mapping, benchmark_stats FEHLTEN →
-- Nachweise/Control-Monitoring/FAIR/Residual-Risiko liefen ins Leere; Seeds in control_effect
-- scheiterten still). Wird im Deploy VOR overrides.sql ausgeführt. Idempotent (IF NOT EXISTS,
-- ON CONFLICT, DROP POLICY IF EXISTS). Quelle: die jeweiligen KAYNAK-Blöcke aus schema.sql.
-- ============================================================================

-- ---- aus migrations/20260717000002_control_mapping.sql (control_mapping) ----
-- ============================================================
-- control_mapping — framework-uebergreifende Relationen mit TYP + STAERKE.
-- Modell nach NIST IR 8477 / STRM (Set-Theory Relationship Mapping) und
-- OSCAL Control-Mapping-Model: nicht binaeres Match, sondern typisierte
-- Relation (equal / subset-of / superset-of / intersects-with) + Staerke 1-10.
--
-- Semantik fuer die Antwort-Projektion (assessmentEngine):
--   equal          -> volle Vererbung (wie Knoten-Mitgliedschaft)
--   subset-of      -> Quelle deckt nur Teil des Ziels  -> Teil-Projektion ("teilweise")
--   superset-of    -> Quelle deckt mehr als das Ziel    -> Teil-Projektion ("teilweise")
--   intersects-with-> teilweise Ueberschneidung          -> Teil-Projektion ("teilweise")
--
-- Ziel ist ENTWEDER ein Kontroll-Knoten (target_node_id) ODER eine
-- konkrete Kontrolle (target_framework/target_control_id) — genau eines.
-- Tabelle startet LEER -> keine Verhaltensaenderung, bis Zeilen kuratiert sind.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.control_mapping (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_framework text NOT NULL,
  source_control_id text NOT NULL,
  target_node_id   text REFERENCES public.control_node(node_id) ON DELETE CASCADE,
  target_framework text,
  target_control_id text,
  relation         text NOT NULL CHECK (relation IN ('equal','subset-of','superset-of','intersects-with')),
  strength         smallint NOT NULL DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
  rationale        text,
  source           text NOT NULL DEFAULT 'curated',
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- Quelle referenziert eine echte Kontrolle
  FOREIGN KEY (source_framework, source_control_id)
    REFERENCES public.controls(framework, id) ON DELETE CASCADE,
  -- genau ein Ziel-Typ: Knoten XOR Kontrolle
  CONSTRAINT control_mapping_target_xor CHECK (
    (target_node_id IS NOT NULL AND target_framework IS NULL AND target_control_id IS NULL)
    OR
    (target_node_id IS NULL AND target_framework IS NOT NULL AND target_control_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS control_mapping_source_idx
  ON public.control_mapping (source_framework, source_control_id);
CREATE INDEX IF NOT EXISTS control_mapping_target_node_idx
  ON public.control_mapping (target_node_id);
CREATE INDEX IF NOT EXISTS control_mapping_target_ctrl_idx
  ON public.control_mapping (target_framework, target_control_id);

GRANT SELECT ON public.control_mapping TO authenticated;
GRANT ALL ON public.control_mapping TO service_role;

ALTER TABLE public.control_mapping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS control_mapping_read ON public.control_mapping;
DROP POLICY IF EXISTS control_mapping_read ON public.control_mapping;
CREATE POLICY control_mapping_read ON public.control_mapping FOR SELECT TO authenticated USING (true);

-- ---- aus migrations/20260717000003_evidence.sql (evidence, answer_evidence) ----
-- ============================================================
-- Evidence / Nachweis-Modell (ARCHITECTURE.md §2.3).
-- Prueffester Nachweis mit Typ, Gueltigkeit (Frische), Datei/Link.
-- n:m-Verknuepfung answer_evidence -> Reuse ueber Frameworks (Knoten).
-- Additiv, tenant-RLS wie answers. answers.evidence-Textfeld bleibt als Notiz.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evidence (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  title        text NOT NULL,
  kind         text NOT NULL CHECK (kind IN
                 ('document','screenshot','log','ticket','attestation','link','other')),
  storage_path text,           -- /storage-Bucket 'evidence'
  external_url text,
  description  text,
  collected_at timestamptz NOT NULL DEFAULT now(),
  valid_until  date,           -- Frische: NULL = zeitlos
  collected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evidence_tenant_idx ON public.evidence (tenant_id);
CREATE INDEX IF NOT EXISTS evidence_valid_until_idx ON public.evidence (tenant_id, valid_until);

CREATE TABLE IF NOT EXISTS public.answer_evidence (
  evidence_id uuid NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL,
  framework   text NOT NULL,
  control_id  text NOT NULL,
  PRIMARY KEY (evidence_id, framework, control_id),
  FOREIGN KEY (framework, control_id) REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS answer_evidence_ctrl_idx ON public.answer_evidence (tenant_id, framework, control_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence TO authenticated;
GRANT ALL ON public.evidence TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answer_evidence TO authenticated;
GRANT ALL ON public.answer_evidence TO service_role;

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evidence_tenant_select" ON public.evidence;
CREATE POLICY "evidence_tenant_select" ON public.evidence FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "evidence_tenant_insert" ON public.evidence;
CREATE POLICY "evidence_tenant_insert" ON public.evidence FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "evidence_tenant_update" ON public.evidence;
CREATE POLICY "evidence_tenant_update" ON public.evidence FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "evidence_tenant_delete" ON public.evidence;
CREATE POLICY "evidence_tenant_delete" ON public.evidence FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

DROP POLICY IF EXISTS "answer_evidence_tenant_select" ON public.answer_evidence;
CREATE POLICY "answer_evidence_tenant_select" ON public.answer_evidence FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "answer_evidence_tenant_insert" ON public.answer_evidence;
CREATE POLICY "answer_evidence_tenant_insert" ON public.answer_evidence FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "answer_evidence_tenant_delete" ON public.answer_evidence;
CREATE POLICY "answer_evidence_tenant_delete" ON public.answer_evidence FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ---- aus migrations/20260717000008_control_tests.sql (control_tests, control_test_results) ----
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

DROP POLICY IF EXISTS "control_tests_tenant_select" ON public.control_tests;
CREATE POLICY "control_tests_tenant_select" ON public.control_tests FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "control_tests_tenant_insert" ON public.control_tests;
CREATE POLICY "control_tests_tenant_insert" ON public.control_tests FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "control_tests_tenant_update" ON public.control_tests;
CREATE POLICY "control_tests_tenant_update" ON public.control_tests FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "control_tests_tenant_delete" ON public.control_tests;
CREATE POLICY "control_tests_tenant_delete" ON public.control_tests FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

DROP POLICY IF EXISTS "control_test_results_tenant_select" ON public.control_test_results;
CREATE POLICY "control_test_results_tenant_select" ON public.control_test_results FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "control_test_results_tenant_insert" ON public.control_test_results;
CREATE POLICY "control_test_results_tenant_insert" ON public.control_test_results FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "control_test_results_tenant_delete" ON public.control_test_results;
CREATE POLICY "control_test_results_tenant_delete" ON public.control_test_results FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ---- aus migrations/20260718000002_control_effect.sql (control_effect) ----
-- ============================================================
-- control_effect (ENGINE_ARCHITECTURE_MARKETGRADE E2): GLOBAL Katalog-Layer.
-- Design-Wirksamkeit je Kontrolle (base_eff) + Wirkdimension + Art.
-- Read-only fuer authenticated (wie controls). Zeilen OPTIONAL: fehlt eine Zeile,
-- nutzt die Engine base_eff=0.5 / dimension='likelihood' / kind='preventive'.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.control_effect (
  framework  text NOT NULL,
  control_id text NOT NULL,
  dimension  text NOT NULL DEFAULT 'likelihood' CHECK (dimension IN ('likelihood','impact','both')),
  kind       text NOT NULL DEFAULT 'preventive' CHECK (kind IN ('preventive','detective','corrective')),
  base_eff   numeric NOT NULL DEFAULT 0.5 CHECK (base_eff BETWEEN 0 AND 1),
  PRIMARY KEY (framework, control_id),
  FOREIGN KEY (framework, control_id) REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
GRANT SELECT ON public.control_effect TO authenticated;
GRANT ALL ON public.control_effect TO service_role;
ALTER TABLE public.control_effect ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS control_effect_read ON public.control_effect;
DROP POLICY IF EXISTS control_effect_read ON public.control_effect;
CREATE POLICY control_effect_read ON public.control_effect FOR SELECT TO authenticated USING (true);

-- ---- aus migrations/20260718000004_fair_scenarios.sql (quant_runs, quant_scenarios) ----
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

DROP POLICY IF EXISTS "quant_scenarios_tenant_select" ON public.quant_scenarios;
CREATE POLICY "quant_scenarios_tenant_select" ON public.quant_scenarios FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "quant_scenarios_tenant_insert" ON public.quant_scenarios;
CREATE POLICY "quant_scenarios_tenant_insert" ON public.quant_scenarios FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "quant_scenarios_tenant_update" ON public.quant_scenarios;
CREATE POLICY "quant_scenarios_tenant_update" ON public.quant_scenarios FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "quant_scenarios_tenant_delete" ON public.quant_scenarios;
CREATE POLICY "quant_scenarios_tenant_delete" ON public.quant_scenarios FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

DROP POLICY IF EXISTS "quant_runs_tenant_select" ON public.quant_runs;
CREATE POLICY "quant_runs_tenant_select" ON public.quant_runs FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "quant_runs_tenant_insert" ON public.quant_runs;
CREATE POLICY "quant_runs_tenant_insert" ON public.quant_runs FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "quant_runs_tenant_delete" ON public.quant_runs;
CREATE POLICY "quant_runs_tenant_delete" ON public.quant_runs FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ---- aus migrations/20260718000005_maturity_weight_benchmark.sql (benchmark_stats) ----
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
DROP POLICY IF EXISTS benchmark_stats_read ON public.benchmark_stats;
CREATE POLICY benchmark_stats_read ON public.benchmark_stats FOR SELECT TO authenticated USING (true);
