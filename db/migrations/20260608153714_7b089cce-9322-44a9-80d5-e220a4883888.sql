-- Defense-in-depth: explicit restrictive policy preventing privilege escalation on user_roles
CREATE POLICY "Only admins may write roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- frist_notification_log: explicit service_role-only write policy
CREATE POLICY "Service role can insert notification log"
ON public.frist_notification_log
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update notification log"
ON public.frist_notification_log
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can delete notification log"
ON public.frist_notification_log
FOR DELETE
TO service_role
USING (true);

-- Explicit deny-by-default for non-owner reads is already implicit via missing policy;
-- keep existing SELECT owner policy untouched.
