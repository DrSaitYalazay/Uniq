
-- Helper: check if a given user_id is in the same org as the caller
CREATE OR REPLACE FUNCTION public.in_same_org(_caller_id uuid, _data_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members AS a
    JOIN public.org_members AS b ON a.org_id = b.org_id
    WHERE a.user_id = _caller_id
      AND b.user_id = _data_owner_id
  );
$$;

-- ============ company_profiles ============
CREATE POLICY "Org members can view org data"
ON public.company_profiles FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ critical_services ============
CREATE POLICY "Org members can view org services"
ON public.critical_services FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ service_criticality_inputs ============
CREATE POLICY "Org members can view org inputs"
ON public.service_criticality_inputs FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ service_criticality_results ============
CREATE POLICY "Org members can view org results"
ON public.service_criticality_results FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ criticality_overrides ============
CREATE POLICY "Org members can view org overrides"
ON public.criticality_overrides FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ assets ============
CREATE POLICY "Org members can view org assets"
ON public.assets FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ assessment_answers ============
CREATE POLICY "Org members can view org answers"
ON public.assessment_answers FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ org_assessment_answers ============
CREATE POLICY "Org members can view org-level answers"
ON public.org_assessment_answers FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ dependencies ============
CREATE POLICY "Org members can view org dependencies"
ON public.dependencies FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ audits ============
CREATE POLICY "Org members can view org audits"
ON public.audits FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ audit_findings ============
CREATE POLICY "Org members can view org findings"
ON public.audit_findings FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ improvement_items ============
CREATE POLICY "Org members can view org improvements"
ON public.improvement_items FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

-- ============ user_tool_data ============
CREATE POLICY "Org members can view org tool data"
ON public.user_tool_data FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));
