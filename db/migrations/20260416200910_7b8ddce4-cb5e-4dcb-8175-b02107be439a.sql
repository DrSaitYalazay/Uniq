-- Allow organization owners to view their org even before being added to org_members
-- This fixes the race condition where INSERT...SELECT returns no rows after creating an org
CREATE POLICY "Owners can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);