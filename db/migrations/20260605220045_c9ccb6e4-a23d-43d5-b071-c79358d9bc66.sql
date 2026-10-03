-- Comprehensive tenant data wipe.
-- SECURITY DEFINER so it can DELETE across every tenant-scoped table in one
-- atomic operation. Callable by any authenticated user; it only ever touches
-- rows owned by the caller's own tenant (= org-owner id, or the caller's
-- own id when not in an org). Lecturers impersonating a student must NOT
-- call this — frontend gates the action behind tenantId.

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

  -- Resolve caller's tenant; default to own id when no org membership.
  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);

  -- Allow wiping only the caller's own tenant.
  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot wipe data for a different tenant (caller_tenant=%, requested=%)',
      caller_tenant, _tenant_id;
  END IF;

  -- Delete in FK-safe order. Every tenant-scoped table is listed here.
  -- If you add a new tenant-scoped table, add it to this function AND to
  -- src/test/tenant-isolation-guard.test.ts.

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
  WITH d AS (DELETE FROM public.dependencies WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('dependencies', c);
  WITH d AS (DELETE FROM public.criticality_overrides WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('criticality_overrides', c);
  WITH d AS (DELETE FROM public.service_criticality_results WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('service_criticality_results', c);
  WITH d AS (DELETE FROM public.service_criticality_inputs WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('service_criticality_inputs', c);
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

-- Verification helper: returns row counts per tenant-scoped table.
-- Lets the UI and tests confirm wipes are complete.
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

  RETURN counts;
END;
$$;

REVOKE ALL ON FUNCTION public.count_tenant_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_tenant_data(uuid) TO authenticated;