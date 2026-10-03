CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = _org_id
      AND owner_id = _user_id
  )
$$;

DROP POLICY IF EXISTS "Owner can add self as first member" ON public.org_members;

CREATE POLICY "Owner can add self as first member"
ON public.org_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_org_owner(auth.uid(), org_id)
);