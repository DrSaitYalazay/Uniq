-- Enable realtime for shared org tables
ALTER TABLE public.user_tool_data REPLICA IDENTITY FULL;
ALTER TABLE public.company_profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_tool_data;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.company_profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Allow org members to UPDATE shared tool_data rows (so members can edit owner's row)
DROP POLICY IF EXISTS "Org members can update org tool data" ON public.user_tool_data;
CREATE POLICY "Org members can update org tool data"
ON public.user_tool_data
FOR UPDATE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id))
WITH CHECK (public.in_same_org(auth.uid(), user_id));

-- Allow org members to UPDATE shared company_profiles
DROP POLICY IF EXISTS "Org members can update org company profile" ON public.company_profiles;
CREATE POLICY "Org members can update org company profile"
ON public.company_profiles
FOR UPDATE
TO authenticated
USING (public.in_same_org(auth.uid(), user_id))
WITH CHECK (public.in_same_org(auth.uid(), user_id));

-- Helper: get org owner's user_id (used as shared "tenant" key)
CREATE OR REPLACE FUNCTION public.get_org_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.owner_id
  FROM public.org_members m
  JOIN public.organizations o ON o.id = m.org_id
  WHERE m.user_id = _user_id
  LIMIT 1;
$$;