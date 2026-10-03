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
    ) THEN 51
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

REVOKE ALL ON FUNCTION public.org_seat_limit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.org_seat_limit(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.org_seat_limit(uuid) TO authenticated, service_role;