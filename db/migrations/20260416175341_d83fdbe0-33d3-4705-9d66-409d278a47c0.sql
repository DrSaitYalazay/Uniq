-- Drop and recreate organizations INSERT policy without role restriction
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

CREATE POLICY "Users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Add policy: org owner can insert themselves as first member
-- This solves the chicken-and-egg problem where has_org_role() returns false
-- because the user isn't a member yet when creating the org
DROP POLICY IF EXISTS "Owner can add self as first member" ON public.org_members;

CREATE POLICY "Owner can add self as first member"
ON public.org_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id AND owner_id = auth.uid()
  )
);