-- 2026-07-19 · wipe_tenant_data: 14 fehlende tenant-scoped Tabellen ergänzen.
--
-- Befund (Wiring-/Audit-Review): „Alle Daten zurücksetzen" (RPC wipe_tenant_data)
-- löschte die AKTUELLE Pipeline nicht — insbesondere `public.answers` (das
-- Gap-Analyse-Antwortregister) fehlte komplett, ebenso alle neuen Engine-/
-- Runtime-Tabellen. Folge: Reset ließ Bewertungsantworten, Roadmap, Umsetzung,
-- Control-Tests, Evidence, Deadlines, Reifegrad-Ziele, KPI-Snapshots u. a. stehen.
--
-- Fix: CREATE OR REPLACE mit vollständiger, FK-sicherer Löschliste. Nur
-- tenant-scoped Tabellen; globale Kataloge (controls, control_iso,
-- control_node_member, control_mapping, control_effect, frameworks, risks,
-- control_risk) werden bewusst NICHT angetastet. Owner-Spalte je Tabelle geprüft
-- (answers/evidence/... = tenant_id; roadmap_items = user_id). Kinder vor Eltern.

CREATE OR REPLACE FUNCTION public.wipe_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_tenant uuid;
  deleted jsonb := '{}'::jsonb;
  c bigint;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);

  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot wipe data for a different tenant (caller_tenant=%, requested=%)',
      caller_tenant, _tenant_id;
  END IF;

  -- ── Bestand (Legacy + Kern), unverändert ────────────────────────────────
  WITH d AS (DELETE FROM public.incident_checklist_items WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('incident_checklist_items', c);
  WITH d AS (DELETE FROM public.incidents WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('incidents', c);
  WITH d AS (DELETE FROM public.audit_checklist_items WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('audit_checklist_items', c);
  WITH d AS (DELETE FROM public.audit_findings WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('audit_findings', c);
  WITH d AS (DELETE FROM public.audits WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('audits', c);
  WITH d AS (DELETE FROM public.improvement_items WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('improvement_items', c);
  WITH d AS (DELETE FROM public.policy_acknowledgements WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('policy_acknowledgements', c);
  WITH d AS (DELETE FROM public.policy_versions WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('policy_versions', c);
  WITH d AS (DELETE FROM public.policy_metadata WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('policy_metadata', c);
  WITH d AS (DELETE FROM public.training_quiz_results WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('training_quiz_results', c);
  WITH d AS (DELETE FROM public.training_completions WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('training_completions', c);
  WITH d AS (DELETE FROM public.assessment_answers WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('assessment_answers', c);
  WITH d AS (DELETE FROM public.org_assessment_answers WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('org_assessment_answers', c);
  WITH d AS (DELETE FROM public.criticality_overrides WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('criticality_overrides', c);
  WITH d AS (DELETE FROM public.service_criticality_results WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('service_criticality_results', c);
  WITH d AS (DELETE FROM public.service_criticality_inputs WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('service_criticality_inputs', c);

  -- ── NEU: aktuelle Pipeline- + Engine-/Runtime-Tabellen (Kinder vor Eltern) ──
  WITH d AS (DELETE FROM public.control_test_results WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('control_test_results', c);
  WITH d AS (DELETE FROM public.answer_evidence WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('answer_evidence', c);
  WITH d AS (DELETE FROM public.control_tests WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('control_tests', c);
  WITH d AS (DELETE FROM public.evidence WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('evidence', c);
  WITH d AS (DELETE FROM public.quant_runs WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('quant_runs', c);
  WITH d AS (DELETE FROM public.quant_scenarios WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('quant_scenarios', c);
  WITH d AS (DELETE FROM public.answers WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('answers', c);
  WITH d AS (DELETE FROM public.roadmap_items WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('roadmap_items', c);
  WITH d AS (DELETE FROM public.implementation_status WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('implementation_status', c);
  WITH d AS (DELETE FROM public.compliance_deadlines WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('compliance_deadlines', c);
  WITH d AS (DELETE FROM public.maturity_targets WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('maturity_targets', c);
  WITH d AS (DELETE FROM public.kpi_snapshots WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('kpi_snapshots', c);
  WITH d AS (DELETE FROM public.control_status_log WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('control_status_log', c);
  WITH d AS (DELETE FROM public.org_tool_data WHERE tenant_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('org_tool_data', c);

  -- ── Kern-Inventar + Profil zuletzt (FK-Eltern) ──────────────────────────
  WITH d AS (DELETE FROM public.dependencies WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('dependencies', c);
  WITH d AS (DELETE FROM public.assets WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('assets', c);
  WITH d AS (DELETE FROM public.critical_services WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('critical_services', c);
  WITH d AS (DELETE FROM public.company_profiles WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('company_profiles', c);
  WITH d AS (DELETE FROM public.user_snapshots WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('user_snapshots', c);
  WITH d AS (DELETE FROM public.user_tool_data WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('user_tool_data', c);

  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.wipe_tenant_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wipe_tenant_data(uuid) TO authenticated;

-- Verifikations-Helper synchron halten: dieselben 14 neuen Tabellen zählen,
-- damit „Reset verifizieren" nicht fälschlich 0 meldet, während Daten in nicht
-- gelisteten Tabellen verbleiben (bzw. jetzt korrekt 0 nach dem Wipe zeigt).
CREATE OR REPLACE FUNCTION public.count_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_tenant uuid;
  counts jsonb := '{}'::jsonb;
  c bigint;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);
  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot inspect a different tenant';
  END IF;

  SELECT count(*) INTO c FROM public.assets WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('assets', c);
  SELECT count(*) INTO c FROM public.assessment_answers WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('assessment_answers', c);
  SELECT count(*) INTO c FROM public.org_assessment_answers WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('org_assessment_answers', c);
  SELECT count(*) INTO c FROM public.audit_checklist_items WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('audit_checklist_items', c);
  SELECT count(*) INTO c FROM public.audit_findings WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('audit_findings', c);
  SELECT count(*) INTO c FROM public.audits WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('audits', c);
  SELECT count(*) INTO c FROM public.company_profiles WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('company_profiles', c);
  SELECT count(*) INTO c FROM public.critical_services WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('critical_services', c);
  SELECT count(*) INTO c FROM public.criticality_overrides WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('criticality_overrides', c);
  SELECT count(*) INTO c FROM public.dependencies WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('dependencies', c);
  SELECT count(*) INTO c FROM public.improvement_items WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('improvement_items', c);
  SELECT count(*) INTO c FROM public.incident_checklist_items WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('incident_checklist_items', c);
  SELECT count(*) INTO c FROM public.incidents WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('incidents', c);
  SELECT count(*) INTO c FROM public.policy_acknowledgements WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('policy_acknowledgements', c);
  SELECT count(*) INTO c FROM public.policy_metadata WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('policy_metadata', c);
  SELECT count(*) INTO c FROM public.policy_versions WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('policy_versions', c);
  SELECT count(*) INTO c FROM public.service_criticality_inputs WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('service_criticality_inputs', c);
  SELECT count(*) INTO c FROM public.service_criticality_results WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('service_criticality_results', c);
  SELECT count(*) INTO c FROM public.training_completions WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('training_completions', c);
  SELECT count(*) INTO c FROM public.training_quiz_results WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('training_quiz_results', c);
  SELECT count(*) INTO c FROM public.user_snapshots WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('user_snapshots', c);
  SELECT count(*) INTO c FROM public.user_tool_data WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('user_tool_data', c);

  -- NEU: aktuelle Pipeline-/Engine-Tabellen
  SELECT count(*) INTO c FROM public.answers WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('answers', c);
  SELECT count(*) INTO c FROM public.roadmap_items WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('roadmap_items', c);
  SELECT count(*) INTO c FROM public.implementation_status WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('implementation_status', c);
  SELECT count(*) INTO c FROM public.control_tests WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('control_tests', c);
  SELECT count(*) INTO c FROM public.control_test_results WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('control_test_results', c);
  SELECT count(*) INTO c FROM public.evidence WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('evidence', c);
  SELECT count(*) INTO c FROM public.answer_evidence WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('answer_evidence', c);
  SELECT count(*) INTO c FROM public.compliance_deadlines WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('compliance_deadlines', c);
  SELECT count(*) INTO c FROM public.maturity_targets WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('maturity_targets', c);
  SELECT count(*) INTO c FROM public.kpi_snapshots WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('kpi_snapshots', c);
  SELECT count(*) INTO c FROM public.control_status_log WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('control_status_log', c);
  SELECT count(*) INTO c FROM public.quant_scenarios WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('quant_scenarios', c);
  SELECT count(*) INTO c FROM public.quant_runs WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('quant_runs', c);
  SELECT count(*) INTO c FROM public.org_tool_data WHERE tenant_id = _tenant_id; counts := counts || jsonb_build_object('org_tool_data', c);

  RETURN counts;
END;
$$;

REVOKE ALL ON FUNCTION public.count_tenant_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_tenant_data(uuid) TO authenticated;
