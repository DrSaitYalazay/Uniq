CREATE OR REPLACE FUNCTION public.org_seat_limit(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.organizations o ON o.owner_id = ur.user_id
      WHERE o.id = _org_id AND ur.role::text IN ('admin', 'lecturer')
    ) THEN 50
    WHEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.organizations o ON o.owner_id = ur.user_id
      WHERE o.id = _org_id AND ur.role::text = 'xl'
    ) THEN 10
    WHEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.organizations o ON o.owner_id = ur.user_id
      WHERE o.id = _org_id AND ur.role::text = 'premium'
    ) THEN 5
    WHEN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.organizations o ON o.owner_id = ur.user_id
      WHERE o.id = _org_id AND ur.role::text = 'pro'
    ) THEN 1
    ELSE 1
  END;
$$;

GRANT EXECUTE ON FUNCTION public.org_seat_limit(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Owner or admin can create invitations" ON public.org_invitations;
CREATE POLICY "Owner or admin can create invitations"
ON public.org_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_org_role(auth.uid(), org_id, ARRAY['owner'::public.org_role, 'admin'::public.org_role])
  AND public.org_total_seat_count(org_id) < public.org_seat_limit(org_id)
  AND auth.uid() = invited_by
);

DROP POLICY IF EXISTS "Owner or admin can invite members" ON public.org_members;
CREATE POLICY "Owner or admin can invite members"
ON public.org_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_org_role(auth.uid(), org_id, ARRAY['owner'::public.org_role, 'admin'::public.org_role])
  AND public.org_total_seat_count(org_id) < public.org_seat_limit(org_id)
);

CREATE OR REPLACE FUNCTION public.is_lecturer_org(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations o
    JOIN public.user_roles ur ON ur.user_id = o.owner_id
    WHERE o.id = _org_id AND ur.role::text = 'lecturer'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_lecturer_org(uuid) TO authenticated, service_role;