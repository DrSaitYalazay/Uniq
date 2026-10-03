
-- 1) Restrict frist_notification_log SELECT to the row owner only.
DROP POLICY IF EXISTS "Members can view own tenant notification log" ON public.frist_notification_log;
CREATE POLICY "Owner can view own notification log"
  ON public.frist_notification_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2) Remove the privilege-escalation INSERT path on org_members.
-- Joining an organization now goes exclusively through the accept-org-invitation
-- edge function, which runs with the service role and bypasses RLS.
DROP POLICY IF EXISTS "Owner or admin can invite members" ON public.org_members;
