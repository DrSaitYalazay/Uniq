REVOKE ALL ON FUNCTION public.org_seat_limit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.org_seat_limit(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.org_seat_limit(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_lecturer_org(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_lecturer_org(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_lecturer_org(uuid) TO authenticated, service_role;