-- Structural fix: students under a lecturer must be fully independent tenants.
-- Their data must not be visible to or editable by other students or the lecturer's
-- normal org members. Only the lecturer (via "Lecturers full access" policies and the
-- impersonation flow) may reach a student's data.

-- 1. Tenant resolution: a student's tenant is their OWN user_id, never the org owner.
--    AuthContext.tenantId and every rewrite trigger call this RPC, so this single
--    change isolates students across every tenant-scoped table at once.
CREATE OR REPLACE FUNCTION public.get_org_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN public.is_student(_user_id) THEN _user_id
    ELSE (
      SELECT o.owner_id
      FROM public.org_members m
      JOIN public.organizations o ON o.id = m.org_id
      WHERE m.user_id = _user_id
      LIMIT 1
    )
  END;
$function$;

-- 2. Cross-member visibility: in_same_org must not bridge to/from a student.
--    Students are independent — only matching auth.uid() = user_id (own data)
--    or the explicit "Lecturers full access" policy reaches their rows.
CREATE OR REPLACE FUNCTION public.in_same_org(_caller_id uuid, _data_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN _caller_id = _data_owner_id THEN true
    WHEN public.is_student(_caller_id) OR public.is_student(_data_owner_id) THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.org_members AS a
      JOIN public.org_members AS b ON a.org_id = b.org_id
      WHERE a.user_id = _caller_id
        AND b.user_id = _data_owner_id
    )
  END;
$function$;