-- Students must only see themselves in org_members (and pending invitations should be hidden).
-- Structural fix at the RLS layer so the UI cannot accidentally leak data.

DROP POLICY IF EXISTS "Members can view org members" ON public.org_members;

CREATE POLICY "Members can view org members"
ON public.org_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR (
    public.is_org_member(auth.uid(), org_id)
    AND NOT public.is_student(auth.uid())
  )
);

-- Same restriction for pending invitations: students should not see them.
DROP POLICY IF EXISTS "Org members can view invitations" ON public.org_invitations;
DROP POLICY IF EXISTS "Members can view invitations" ON public.org_invitations;