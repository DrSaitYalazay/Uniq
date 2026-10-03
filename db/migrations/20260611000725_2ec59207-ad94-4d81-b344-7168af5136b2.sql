
-- 1. bootcamp_applications: owners can read their own submission
CREATE POLICY "Applicants can view own bootcamp application"
  ON public.bootcamp_applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 2. suppressed_emails: admins can read the suppression list
CREATE POLICY "Admins can view suppressed emails"
  ON public.suppressed_emails
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. email_unsubscribe_tokens: cleanup function for used/expired tokens
CREATE OR REPLACE FUNCTION public.purge_expired_unsubscribe_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH d AS (
    DELETE FROM public.email_unsubscribe_tokens
    WHERE used_at IS NOT NULL
       OR (expires_at IS NOT NULL AND expires_at < now() - interval '30 days')
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM d;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_unsubscribe_tokens() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_unsubscribe_tokens() TO service_role;
