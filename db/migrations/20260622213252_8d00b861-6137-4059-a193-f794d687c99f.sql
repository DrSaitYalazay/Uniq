CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('pro', 'premium', 'xl', 'admin', 'student', 'lecturer')
  )
$function$;

GRANT EXECUTE ON FUNCTION public.is_premium(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium(uuid) TO service_role;