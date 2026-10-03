CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.org_members WHERE user_id = _user_id AND org_id = _org_id)
$$;

DROP POLICY IF EXISTS "Members can view org members" ON public.org_members;
CREATE POLICY "Members can view org members"
ON public.org_members FOR SELECT
TO authenticated
USING (public.is_org_member(auth.uid(), org_id));