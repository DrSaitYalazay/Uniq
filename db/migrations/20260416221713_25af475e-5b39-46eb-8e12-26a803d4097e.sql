ALTER TABLE public.critical_services REPLICA IDENTITY FULL;
ALTER TABLE public.service_criticality_inputs REPLICA IDENTITY FULL;
ALTER TABLE public.service_criticality_results REPLICA IDENTITY FULL;
ALTER TABLE public.criticality_overrides REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.critical_services;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_criticality_inputs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_criticality_results;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.criticality_overrides;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

DROP POLICY IF EXISTS "Org members can create org services" ON public.critical_services;
CREATE POLICY "Org members can create org services"
ON public.critical_services
FOR INSERT
TO authenticated
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can update org services" ON public.critical_services;
CREATE POLICY "Org members can update org services"
ON public.critical_services
FOR UPDATE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id))
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can delete org services" ON public.critical_services;
CREATE POLICY "Org members can delete org services"
ON public.critical_services
FOR DELETE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can create org service inputs" ON public.service_criticality_inputs;
CREATE POLICY "Org members can create org service inputs"
ON public.service_criticality_inputs
FOR INSERT
TO authenticated
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can update org service inputs" ON public.service_criticality_inputs;
CREATE POLICY "Org members can update org service inputs"
ON public.service_criticality_inputs
FOR UPDATE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id))
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can delete org service inputs" ON public.service_criticality_inputs;
CREATE POLICY "Org members can delete org service inputs"
ON public.service_criticality_inputs
FOR DELETE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can create org service results" ON public.service_criticality_results;
CREATE POLICY "Org members can create org service results"
ON public.service_criticality_results
FOR INSERT
TO authenticated
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can update org service results" ON public.service_criticality_results;
CREATE POLICY "Org members can update org service results"
ON public.service_criticality_results
FOR UPDATE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id))
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can delete org service results" ON public.service_criticality_results;
CREATE POLICY "Org members can delete org service results"
ON public.service_criticality_results
FOR DELETE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can create org overrides" ON public.criticality_overrides;
CREATE POLICY "Org members can create org overrides"
ON public.criticality_overrides
FOR INSERT
TO authenticated
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can update org overrides" ON public.criticality_overrides;
CREATE POLICY "Org members can update org overrides"
ON public.criticality_overrides
FOR UPDATE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id))
WITH CHECK (public.in_same_org(auth.uid(), user_id));

DROP POLICY IF EXISTS "Org members can delete org overrides" ON public.criticality_overrides;
CREATE POLICY "Org members can delete org overrides"
ON public.criticality_overrides
FOR DELETE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));