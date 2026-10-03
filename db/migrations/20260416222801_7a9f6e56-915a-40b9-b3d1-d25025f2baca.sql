
-- 1) Trigger function: rewrite user_id to org owner on INSERT
CREATE OR REPLACE FUNCTION public.rewrite_user_id_to_org_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
  SELECT public.get_org_owner_id(NEW.user_id) INTO owner_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN NEW.user_id := owner_id; END IF;
  RETURN NEW;
END; $$;

DO $$
DECLARE t text; tables text[] := ARRAY[
  'critical_services','service_criticality_inputs','service_criticality_results','criticality_overrides',
  'assets','dependencies','assessment_answers','org_assessment_answers',
  'audits','audit_findings','improvement_items','user_tool_data','company_profiles'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_rewrite_user_id ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_rewrite_user_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner()', t);
  END LOOP;
END $$;

-- 2) Org-aware INSERT/UPDATE/DELETE policies
-- assets
DROP POLICY IF EXISTS "Org members can create org assets" ON public.assets;
CREATE POLICY "Org members can create org assets" ON public.assets FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can update org assets" ON public.assets;
CREATE POLICY "Org members can update org assets" ON public.assets FOR UPDATE TO authenticated USING (public.in_same_org(auth.uid(), user_id)) WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org assets" ON public.assets;
CREATE POLICY "Org members can delete org assets" ON public.assets FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- dependencies
DROP POLICY IF EXISTS "Org members can create org dependencies" ON public.dependencies;
CREATE POLICY "Org members can create org dependencies" ON public.dependencies FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can update org dependencies" ON public.dependencies;
CREATE POLICY "Org members can update org dependencies" ON public.dependencies FOR UPDATE TO authenticated USING (public.in_same_org(auth.uid(), user_id)) WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org dependencies" ON public.dependencies;
CREATE POLICY "Org members can delete org dependencies" ON public.dependencies FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- assessment_answers
DROP POLICY IF EXISTS "Org members can create org answers" ON public.assessment_answers;
CREATE POLICY "Org members can create org answers" ON public.assessment_answers FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can update org answers" ON public.assessment_answers;
CREATE POLICY "Org members can update org answers" ON public.assessment_answers FOR UPDATE TO authenticated USING (public.in_same_org(auth.uid(), user_id)) WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org answers" ON public.assessment_answers;
CREATE POLICY "Org members can delete org answers" ON public.assessment_answers FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- org_assessment_answers
DROP POLICY IF EXISTS "Org members can create org-level answers" ON public.org_assessment_answers;
CREATE POLICY "Org members can create org-level answers" ON public.org_assessment_answers FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can update org-level answers" ON public.org_assessment_answers;
CREATE POLICY "Org members can update org-level answers" ON public.org_assessment_answers FOR UPDATE TO authenticated USING (public.in_same_org(auth.uid(), user_id)) WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org-level answers" ON public.org_assessment_answers;
CREATE POLICY "Org members can delete org-level answers" ON public.org_assessment_answers FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- audits
DROP POLICY IF EXISTS "Org members can create org audits" ON public.audits;
CREATE POLICY "Org members can create org audits" ON public.audits FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can update org audits" ON public.audits;
CREATE POLICY "Org members can update org audits" ON public.audits FOR UPDATE TO authenticated USING (public.in_same_org(auth.uid(), user_id)) WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org audits" ON public.audits;
CREATE POLICY "Org members can delete org audits" ON public.audits FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- audit_findings
DROP POLICY IF EXISTS "Org members can create org findings" ON public.audit_findings;
CREATE POLICY "Org members can create org findings" ON public.audit_findings FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can update org findings" ON public.audit_findings;
CREATE POLICY "Org members can update org findings" ON public.audit_findings FOR UPDATE TO authenticated USING (public.in_same_org(auth.uid(), user_id)) WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org findings" ON public.audit_findings;
CREATE POLICY "Org members can delete org findings" ON public.audit_findings FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- improvement_items
DROP POLICY IF EXISTS "Org members can create org improvements" ON public.improvement_items;
CREATE POLICY "Org members can create org improvements" ON public.improvement_items FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can update org improvements" ON public.improvement_items;
CREATE POLICY "Org members can update org improvements" ON public.improvement_items FOR UPDATE TO authenticated USING (public.in_same_org(auth.uid(), user_id)) WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org improvements" ON public.improvement_items;
CREATE POLICY "Org members can delete org improvements" ON public.improvement_items FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- user_tool_data
DROP POLICY IF EXISTS "Org members can create org tool data" ON public.user_tool_data;
CREATE POLICY "Org members can create org tool data" ON public.user_tool_data FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org tool data" ON public.user_tool_data;
CREATE POLICY "Org members can delete org tool data" ON public.user_tool_data FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- company_profiles INSERT/DELETE org-aware
DROP POLICY IF EXISTS "Org members can create org company profile" ON public.company_profiles;
CREATE POLICY "Org members can create org company profile" ON public.company_profiles FOR INSERT TO authenticated WITH CHECK (public.in_same_org(auth.uid(), user_id));
DROP POLICY IF EXISTS "Org members can delete org company profile" ON public.company_profiles;
CREATE POLICY "Org members can delete org company profile" ON public.company_profiles FOR DELETE TO authenticated USING (public.in_same_org(auth.uid(), user_id));

-- 3) Realtime
DO $$
DECLARE t text; tables text[] := ARRAY[
  'assets','dependencies','assessment_answers','org_assessment_answers',
  'audits','audit_findings','improvement_items','user_tool_data','company_profiles'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    BEGIN EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END LOOP;
END $$;
