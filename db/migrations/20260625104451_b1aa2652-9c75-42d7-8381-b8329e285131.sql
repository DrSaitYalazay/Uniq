CREATE TABLE public.class_assessment_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  class_id text NOT NULL,
  control_id text NOT NULL,
  status text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id, control_id)
);

CREATE INDEX idx_class_assessment_answers_user ON public.class_assessment_answers(user_id);
CREATE INDEX idx_class_assessment_answers_class ON public.class_assessment_answers(user_id, class_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_assessment_answers TO authenticated;
GRANT ALL ON public.class_assessment_answers TO service_role;

ALTER TABLE public.class_assessment_answers ENABLE ROW LEVEL SECURITY;

-- Tenant rewrite trigger (same pattern as other tenant-scoped tables)
CREATE TRIGGER class_assessment_answers_rewrite_user_id
  BEFORE INSERT ON public.class_assessment_answers
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE TRIGGER class_assessment_answers_updated_at
  BEFORE UPDATE ON public.class_assessment_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Owner can manage own rows
CREATE POLICY "Users can view own class answers"
  ON public.class_assessment_answers FOR SELECT
  USING (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id));

CREATE POLICY "Users can insert own class answers"
  ON public.class_assessment_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id));

CREATE POLICY "Users can update own class answers"
  ON public.class_assessment_answers FOR UPDATE
  USING (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id));

CREATE POLICY "Users can delete own class answers"
  ON public.class_assessment_answers FOR DELETE
  USING (auth.uid() = user_id OR public.in_same_org(auth.uid(), user_id));

-- Lecturer full access (same pattern as other tables)
CREATE POLICY "Lecturers full access class answers"
  ON public.class_assessment_answers FOR ALL
  USING (public.is_lecturer(auth.uid()))
  WITH CHECK (public.is_lecturer(auth.uid()));

-- Admin full access
CREATE POLICY "Admins full access class answers"
  ON public.class_assessment_answers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Extend wipe_tenant_data to include the new table
CREATE OR REPLACE FUNCTION public.wipe_tenant_data(_tenant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WITH d AS (DELETE FROM public.class_assessment_answers WHERE user_id = _tenant_id RETURNING 1)
    SELECT count(*) INTO c FROM d; deleted := deleted || jsonb_build_object('class_assessment_answers', c);
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
$function$;