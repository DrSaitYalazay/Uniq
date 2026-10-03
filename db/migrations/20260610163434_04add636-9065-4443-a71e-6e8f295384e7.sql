
-- Fix 1: org_invitations token exposure
-- Prevent admins/owners from reading the plaintext token via the Data API.
-- Edge functions (accept-org-invitation) use service_role and are unaffected.
REVOKE SELECT (token) ON public.org_invitations FROM authenticated;
REVOKE SELECT (token) ON public.org_invitations FROM anon;

-- Fix 2: get_user_org_id multi-org ambiguity
-- Rewrite policies that relied on LIMIT 1 to use EXISTS over all memberships,
-- so a user with multiple org memberships sees data for each org they belong to
-- without depending on arbitrary ordering.
DROP POLICY IF EXISTS "Members can view org members" ON public.org_members;
CREATE POLICY "Members can view org members"
ON public.org_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.user_id = auth.uid() AND m.org_id = org_members.org_id
  )
);

DROP POLICY IF EXISTS "Members can view their organization" ON public.organizations;
CREATE POLICY "Members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.org_members m
    WHERE m.user_id = auth.uid() AND m.org_id = organizations.id
  )
);
