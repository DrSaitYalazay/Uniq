
-- Drop legacy tables (all empty) and helpers no longer needed
DROP FUNCTION IF EXISTS public.admin_reload_junctions() CASCADE;
DROP FUNCTION IF EXISTS public.enforce_student_policy_download_quota() CASCADE;

DROP TABLE IF EXISTS public._junction_stage_ci CASCADE;
DROP TABLE IF EXISTS public._junction_stage_cr CASCADE;
DROP TABLE IF EXISTS public._junction_stage_rc CASCADE;

DROP TABLE IF EXISTS public.blog_articles CASCADE;
DROP TABLE IF EXISTS public.bootcamp_applications CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.premium_requests CASCADE;
DROP TABLE IF EXISTS public.student_policy_downloads CASCADE;
DROP TABLE IF EXISTS public.lecturer_impersonation_log CASCADE;
DROP TABLE IF EXISTS public.training_completions CASCADE;
DROP TABLE IF EXISTS public.training_quiz_results CASCADE;
DROP TABLE IF EXISTS public.class_assessment_answers CASCADE;
DROP TABLE IF EXISTS public.admin_notifications CASCADE;
DROP TABLE IF EXISTS public.frist_notification_log CASCADE;
DROP TABLE IF EXISTS public.email_send_log CASCADE;
DROP TABLE IF EXISTS public.email_send_state CASCADE;
DROP TABLE IF EXISTS public.email_unsubscribe_tokens CASCADE;
DROP TABLE IF EXISTS public.suppressed_emails CASCADE;

DROP TABLE IF EXISTS public.assessment_answers CASCADE;
DROP TABLE IF EXISTS public.org_assessment_answers CASCADE;
DROP TABLE IF EXISTS public.iso_canonical CASCADE;

DROP TABLE IF EXISTS public.policy_acknowledgements CASCADE;
DROP TABLE IF EXISTS public.policy_versions CASCADE;
DROP TABLE IF EXISTS public.policy_metadata CASCADE;

DROP TABLE IF EXISTS public.audit_checklist_items CASCADE;
DROP TABLE IF EXISTS public.incident_checklist_items CASCADE;
DROP TABLE IF EXISTS public.improvement_items CASCADE;

DROP TABLE IF EXISTS public.criticality_overrides CASCADE;
DROP TABLE IF EXISTS public.criticality_formula_config CASCADE;
DROP TABLE IF EXISTS public.service_criticality_inputs CASCADE;
DROP TABLE IF EXISTS public.service_criticality_results CASCADE;
DROP TABLE IF EXISTS public.dependencies CASCADE;
DROP TABLE IF EXISTS public.critical_services CASCADE;

DROP TABLE IF EXISTS public.user_snapshots CASCADE;

-- Rebuild tenant helper RPCs against surviving tables only
CREATE OR REPLACE FUNCTION public.wipe_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id uuid := auth.uid();
  caller_tenant uuid;
  deleted jsonb := '{}'::jsonb;
  c bigint;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  caller_tenant := COALESCE(public.get_org_owner_id(caller_id), caller_id);
  IF _tenant_id IS DISTINCT FROM caller_tenant THEN
    RAISE EXCEPTION 'cannot wipe data for a different tenant';
  END IF;

  WITH d AS (DELETE FROM public.answers WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('answers', c);
  WITH d AS (DELETE FROM public.incidents WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('incidents', c);
  WITH d AS (DELETE FROM public.audit_findings WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('audit_findings', c);
  WITH d AS (DELETE FROM public.audits WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('audits', c);
  WITH d AS (DELETE FROM public.assets WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('assets', c);
  WITH d AS (DELETE FROM public.company_profiles WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('company_profiles', c);
  WITH d AS (DELETE FROM public.user_tool_data WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('user_tool_data', c);

  RETURN deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_tenant_data(_tenant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

  SELECT count(*) INTO c FROM public.answers WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('answers', c);
  SELECT count(*) INTO c FROM public.assets WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('assets', c);
  SELECT count(*) INTO c FROM public.audits WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('audits', c);
  SELECT count(*) INTO c FROM public.audit_findings WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('audit_findings', c);
  SELECT count(*) INTO c FROM public.company_profiles WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('company_profiles', c);
  SELECT count(*) INTO c FROM public.incidents WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('incidents', c);
  SELECT count(*) INTO c FROM public.user_tool_data WHERE user_id = _tenant_id; counts := counts || jsonb_build_object('user_tool_data', c);

  RETURN counts;
END;
$$;

-- Refresh handle_new_user (no longer inserts admin_notifications)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;
