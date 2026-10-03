
CREATE OR REPLACE FUNCTION public.org_seat_limit(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.organizations o ON o.owner_id = ur.user_id WHERE o.id = _org_id AND ur.role = 'admin') THEN 10
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.organizations o ON o.owner_id = ur.user_id WHERE o.id = _org_id AND ur.role = 'xl') THEN 10
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.organizations o ON o.owner_id = ur.user_id WHERE o.id = _org_id AND ur.role = 'premium') THEN 5
    WHEN EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.organizations o ON o.owner_id = ur.user_id WHERE o.id = _org_id AND ur.role = 'pro') THEN 1
    ELSE 1
  END;
$$;

GRANT EXECUTE ON FUNCTION public.org_seat_limit(uuid) TO authenticated, service_role;
