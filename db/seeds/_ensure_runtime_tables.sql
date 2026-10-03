-- ============================================================================
-- _ensure_runtime_tables.sql  —  bei JEDEM Deploy idempotent ausgeführt.
--
-- Grund: db/schema.sql wird von Docker NUR beim ersten DB-Boot ausgeführt
-- (/docker-entrypoint-initdb.d). Tabellen, die NACH der ersten Initialisierung
-- ins Schema kamen (z. B. compliance_deadlines), fehlen daher auf einer schon
-- bestehenden DB → Laufzeitfehler („Fristen konnten nicht geladen werden").
--
-- Dieses Skript stellt solche Tabellen idempotent sicher. CREATE TABLE/INDEX
-- sind IF NOT EXISTS; Policies werden vorher DROP IF EXISTS, damit ein
-- erneuter Lauf nicht bricht. Voraussetzung public.get_org_owner_id()/auth.uid()
-- existiert bereits (aus dem Ursprungsschema).
-- ============================================================================

-- ── Zentrale Fristen-Engine (compliance_deadlines) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.compliance_deadlines (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  kind       text NOT NULL CHECK (kind IN
               ('incident_report','dsar','kritis_nachweis','evidence_review',
                'document_review','training_cycle','audit_cycle','exercise',
                'ai_act_deadline','custom')),
  framework  text,
  ref_table  text,
  ref_id     text,
  label      text NOT NULL,
  starts_at  timestamptz NOT NULL DEFAULT now(),
  due_at     timestamptz,
  recurrence interval,
  status     text NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','done','cancelled','overdue')),
  done_at    timestamptz,
  meta       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS compliance_deadlines_tenant_idx
  ON public.compliance_deadlines (tenant_id, status, due_at);
CREATE INDEX IF NOT EXISTS compliance_deadlines_ref_idx
  ON public.compliance_deadlines (tenant_id, ref_table, ref_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_deadlines TO authenticated;
GRANT ALL ON public.compliance_deadlines TO service_role;
ALTER TABLE public.compliance_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_deadlines_tenant_select" ON public.compliance_deadlines;
CREATE POLICY "compliance_deadlines_tenant_select" ON public.compliance_deadlines FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

DROP POLICY IF EXISTS "compliance_deadlines_tenant_insert" ON public.compliance_deadlines;
CREATE POLICY "compliance_deadlines_tenant_insert" ON public.compliance_deadlines FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

DROP POLICY IF EXISTS "compliance_deadlines_tenant_update" ON public.compliance_deadlines;
CREATE POLICY "compliance_deadlines_tenant_update" ON public.compliance_deadlines FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

DROP POLICY IF EXISTS "compliance_deadlines_tenant_delete" ON public.compliance_deadlines;
CREATE POLICY "compliance_deadlines_tenant_delete" ON public.compliance_deadlines FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ── KPI-Zeitreihe (kpi_snapshots) — Basis der Fortschrittskurve (M4) ─────────
CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  taken_at   timestamptz NOT NULL DEFAULT now(),
  metrics    jsonb NOT NULL DEFAULT '{}'::jsonb,
  has_data   jsonb NOT NULL DEFAULT '{}'::jsonb,
  source     text NOT NULL DEFAULT 'auto'
);
CREATE INDEX IF NOT EXISTS kpi_snapshots_tenant_idx ON public.kpi_snapshots (tenant_id, taken_at DESC);

GRANT SELECT, INSERT, DELETE ON public.kpi_snapshots TO authenticated;
GRANT ALL ON public.kpi_snapshots TO service_role;
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kpi_snapshots_tenant_select" ON public.kpi_snapshots;
CREATE POLICY "kpi_snapshots_tenant_select" ON public.kpi_snapshots FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "kpi_snapshots_tenant_insert" ON public.kpi_snapshots;
CREATE POLICY "kpi_snapshots_tenant_insert" ON public.kpi_snapshots FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "kpi_snapshots_tenant_delete" ON public.kpi_snapshots;
CREATE POLICY "kpi_snapshots_tenant_delete" ON public.kpi_snapshots FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ── Reifegrad-Ziele (maturity_targets) — M4 Reifegrad-Variante ───────────────
CREATE TABLE IF NOT EXISTS public.maturity_targets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  framework  text NOT NULL,
  family_id  text,
  target     smallint NOT NULL CHECK (target BETWEEN 0 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (tenant_id, framework, family_id)
);
CREATE INDEX IF NOT EXISTS maturity_targets_tenant_idx ON public.maturity_targets (tenant_id, framework);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maturity_targets TO authenticated;
GRANT ALL ON public.maturity_targets TO service_role;
ALTER TABLE public.maturity_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "maturity_targets_tenant_select" ON public.maturity_targets;
CREATE POLICY "maturity_targets_tenant_select" ON public.maturity_targets FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "maturity_targets_tenant_insert" ON public.maturity_targets;
CREATE POLICY "maturity_targets_tenant_insert" ON public.maturity_targets FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "maturity_targets_tenant_update" ON public.maturity_targets;
CREATE POLICY "maturity_targets_tenant_update" ON public.maturity_targets FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "maturity_targets_tenant_delete" ON public.maturity_targets;
CREATE POLICY "maturity_targets_tenant_delete" ON public.maturity_targets FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ── Org-scoped Tool-Zustände (org_tool_data) — SoA/Treatments/Risk-Config ────
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
DROP POLICY IF EXISTS "org_tool_data_tenant_select" ON public.org_tool_data;
CREATE POLICY "org_tool_data_tenant_select" ON public.org_tool_data FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "org_tool_data_tenant_insert" ON public.org_tool_data;
CREATE POLICY "org_tool_data_tenant_insert" ON public.org_tool_data FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "org_tool_data_tenant_update" ON public.org_tool_data;
CREATE POLICY "org_tool_data_tenant_update" ON public.org_tool_data FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "org_tool_data_tenant_delete" ON public.org_tool_data;
CREATE POLICY "org_tool_data_tenant_delete" ON public.org_tool_data FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ── Control-Status-Verlauf (control_status_log) — Kurven-Fallback/Health ─────
CREATE TABLE IF NOT EXISTS public.control_status_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  framework  text NOT NULL,
  control_id text NOT NULL,
  from_state text NOT NULL,
  to_state   text NOT NULL,
  cause      text NOT NULL,
  test_id    uuid,
  detail     jsonb NOT NULL DEFAULT '{}'::jsonb,
  at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS control_status_log_idx
  ON public.control_status_log (tenant_id, framework, control_id, at DESC);
GRANT SELECT, INSERT, DELETE ON public.control_status_log TO authenticated;
GRANT ALL ON public.control_status_log TO service_role;
ALTER TABLE public.control_status_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "control_status_log_tenant_select" ON public.control_status_log;
CREATE POLICY "control_status_log_tenant_select" ON public.control_status_log FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "control_status_log_tenant_insert" ON public.control_status_log;
CREATE POLICY "control_status_log_tenant_insert" ON public.control_status_log FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "control_status_log_tenant_delete" ON public.control_status_log;
CREATE POLICY "control_status_log_tenant_delete" ON public.control_status_log FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- ── Abschlussdatum je Aufgabe (implementation_status.completed_at) ───────────
-- Fortschrittskurve/Prognose soll aus dem TATSÄCHLICHEN Erledigungsdatum
-- gebildet werden (nicht Frist, nicht Eingabedatum). Idempotent nachrüsten.
ALTER TABLE public.implementation_status
  ADD COLUMN IF NOT EXISTS completed_at date;

-- ── Unveränderliches Erst-Umsetzungsdatum (implementation_status.first_implemented_at) ──
-- Wird EINMAL gesetzt, wenn eine Aufgabe erstmals auf fertig/laufend geht, und
-- danach NICHT mehr überschrieben (Basis stabiler Historie). completed_at bleibt
-- die editierbare Variante; first_implemented_at der unveränderliche Anker.
ALTER TABLE public.implementation_status
  ADD COLUMN IF NOT EXISTS first_implemented_at date;

-- ════════════════════════════════════════════════════════════════════════════
-- Y7 · Abweichungsgrad (Major/Minor) je Antwort — GETRENNT von der Risikopriorität
-- ════════════════════════════════════════════════════════════════════════════
-- Der Katalog liefert je Kontrolle einen VORSCHLAG (meta.default_absent für
-- „nein", meta.default_partial für „teilweise"). Vertrag des Katalogs
-- (assessment_contract.severity): „Absent/Partial values are starting
-- suggestions only." Der Vorschlag ist also keine Bewertung — der Prüfer muss
-- ihn bestätigen oder überschreiben, mit Begründung.
--
-- Warum eigene Spalten und nicht „note": eine Abweichung ist ein Auditbefund
-- mit eigener Herkunft (Vorschlag vs. Prüferentscheid) und muss im Bericht
-- getrennt von der Risikopriorität auswertbar sein. Risikopriorität bewertet
-- die mögliche Wirkung eines Szenarios; der Abweichungsgrad bewertet das
-- Gewicht des festgestellten Mangels gegen die Norm. Beides darf sich nicht
-- gegenseitig setzen.
ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS severity        text,
  ADD COLUMN IF NOT EXISTS severity_source text,
  ADD COLUMN IF NOT EXISTS severity_note   text,
  ADD COLUMN IF NOT EXISTS severity_by     uuid,
  ADD COLUMN IF NOT EXISTS severity_at     timestamptz;

DO $sev$
BEGIN
  -- CHECK idempotent nachrüsten (ADD CONSTRAINT kennt kein IF NOT EXISTS).
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.answers'::regclass AND conname = 'answers_severity_chk'
  ) THEN
    ALTER TABLE public.answers
      ADD CONSTRAINT answers_severity_chk
      CHECK (severity IS NULL OR severity IN ('major','minor','keine'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.answers'::regclass AND conname = 'answers_severity_source_chk'
  ) THEN
    ALTER TABLE public.answers
      ADD CONSTRAINT answers_severity_source_chk
      CHECK (severity_source IS NULL OR severity_source IN ('vorschlag','pruefer'));
  END IF;
  -- Ein Prüferentscheid ohne Begründung ist kein Befund, sondern eine Behauptung.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.answers'::regclass AND conname = 'answers_severity_note_chk'
  ) THEN
    ALTER TABLE public.answers
      ADD CONSTRAINT answers_severity_note_chk
      CHECK (severity_source <> 'pruefer' OR COALESCE(btrim(severity_note), '') <> '');
  END IF;
END $sev$;

-- ════════════════════════════════════════════════════════════════════════════
-- Y8 · Deckungsprüfung bei framework-übergreifender Übernahme
-- ════════════════════════════════════════════════════════════════════════════
-- Eine positive NIS2-Antwort auf einer geteilten Kontrolle darf für ISO 27001
-- nicht automatisch „voll erfüllt" ergeben. Katalogvertrag `scope`: „Narrower
-- NIS2 evidence can cover only the matching part of an ISO scope." Solange
-- Geltungsbereich, Bewertungszeitraum und Nachweisdeckung nicht bestätigt sind,
-- wird ein geerbtes „ja" in der Projektion auf „teilweise" gedeckelt.
--
-- Diese Tabelle hält genau diesen Entscheid: je (Ziel-Framework, Kontrolle,
-- Asset) eine Aussage über die Deckung aus dem Quell-Framework.
CREATE TABLE IF NOT EXISTS public.coverage_review (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  framework         text NOT NULL,          -- Ziel-Framework (z. B. ISO27001)
  control_id        text NOT NULL,          -- Kontrolle im Ziel-Framework
  asset_id          uuid,
  source_framework  text,                   -- Herkunft der übernommenen Antwort
  source_control_id text,
  decision          text NOT NULL,          -- 'voll' | 'teilweise' | 'offen'
  scope_note        text,                   -- Geltungsbereich/Einheiten/Standorte
  period_from       date,
  period_to         date,
  evidence_note     text,                   -- Nachweisdeckung
  reviewer          uuid,
  decided_at        timestamptz NOT NULL DEFAULT now()
);

DO $cov$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.coverage_review'::regclass AND conname = 'coverage_review_decision_chk'
  ) THEN
    ALTER TABLE public.coverage_review
      ADD CONSTRAINT coverage_review_decision_chk
      CHECK (decision IN ('voll','teilweise','offen'));
  END IF;
END $cov$;

-- NULLS NOT DISTINCT: asset_id IS NULL ist die Organisationsebene und muss
-- genau einen Entscheid haben (gleiche Regel wie in public.answers).
CREATE UNIQUE INDEX IF NOT EXISTS coverage_review_uniq
  ON public.coverage_review (tenant_id, framework, control_id, asset_id) NULLS NOT DISTINCT;
CREATE INDEX IF NOT EXISTS coverage_review_tenant_fw_idx
  ON public.coverage_review (tenant_id, framework);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coverage_review TO authenticated;
GRANT ALL ON public.coverage_review TO service_role;
ALTER TABLE public.coverage_review ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coverage_review_tenant_select" ON public.coverage_review;
CREATE POLICY "coverage_review_tenant_select" ON public.coverage_review FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "coverage_review_tenant_insert" ON public.coverage_review;
CREATE POLICY "coverage_review_tenant_insert" ON public.coverage_review FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "coverage_review_tenant_update" ON public.coverage_review;
CREATE POLICY "coverage_review_tenant_update" ON public.coverage_review FOR UPDATE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
DROP POLICY IF EXISTS "coverage_review_tenant_delete" ON public.coverage_review;
CREATE POLICY "coverage_review_tenant_delete" ON public.coverage_review FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
