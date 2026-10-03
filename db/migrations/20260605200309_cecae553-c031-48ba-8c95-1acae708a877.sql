
-- 1. Add new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lecturer';

-- 2. Helper functions (use text comparison to avoid same-transaction enum resolution)
CREATE OR REPLACE FUNCTION public.is_lecturer(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'lecturer'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_student(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'student'
  )
$$;

-- 3. Audit log for lecturer impersonation
CREATE TABLE public.lecturer_impersonation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('view','edit')),
  action text NOT NULL,
  details jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.lecturer_impersonation_log TO authenticated;
GRANT ALL ON public.lecturer_impersonation_log TO service_role;
ALTER TABLE public.lecturer_impersonation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecturers insert their own impersonation events"
ON public.lecturer_impersonation_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = lecturer_id AND public.is_lecturer(auth.uid()));

CREATE POLICY "Lecturers read own events; admins read all"
ON public.lecturer_impersonation_log FOR SELECT TO authenticated
USING (auth.uid() = lecturer_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_lecturer_log_lecturer ON public.lecturer_impersonation_log(lecturer_id, occurred_at DESC);
CREATE INDEX idx_lecturer_log_target ON public.lecturer_impersonation_log(target_user_id, occurred_at DESC);

-- 4. Lecturer access policies (read+write) on all user-id scoped tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'user_tool_data','company_profiles','assets','assessment_answers','org_assessment_answers',
    'audits','audit_findings','audit_checklist_items','critical_services','criticality_overrides',
    'service_criticality_inputs','service_criticality_results','dependencies','improvement_items',
    'incidents','incident_checklist_items','policy_metadata','policy_versions','policy_acknowledgements',
    'training_completions','training_quiz_results','user_snapshots','profiles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Lecturers full access" ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY "Lecturers full access" ON public.%I FOR ALL TO authenticated USING (public.is_lecturer(auth.uid())) WITH CHECK (public.is_lecturer(auth.uid()))',
      tbl
    );
  END LOOP;
END $$;
