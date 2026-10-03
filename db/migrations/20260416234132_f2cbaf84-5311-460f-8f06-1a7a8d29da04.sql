
-- 1) Backfill existing rows: rewrite user_id -> org owner_id where the writer is a non-owner member
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'audits','audit_findings','improvement_items',
    'assets','assessment_answers','org_assessment_answers',
    'critical_services','dependencies',
    'service_criticality_inputs','service_criticality_results',
    'criticality_overrides','company_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format($f$
      UPDATE public.%I AS tbl
         SET user_id = o.owner_id
        FROM public.org_members m
        JOIN public.organizations o ON o.id = m.org_id
       WHERE tbl.user_id = m.user_id
         AND m.user_id <> o.owner_id;
    $f$, t);
  END LOOP;
END $$;

-- 2) Install BEFORE INSERT trigger on each table to auto-rewrite user_id to org owner
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'audits','audit_findings','improvement_items',
    'assets','assessment_answers','org_assessment_answers',
    'critical_services','dependencies',
    'service_criticality_inputs','service_criticality_results',
    'criticality_overrides','company_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_rewrite_user_id_to_org_owner ON public.%I;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_rewrite_user_id_to_org_owner
         BEFORE INSERT ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();',
      t
    );
  END LOOP;
END $$;
