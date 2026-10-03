
-- Allow students to download up to 2 distinct policies (was 1).
-- 1. Drop the old single-row unique constraint.
ALTER TABLE public.student_policy_downloads
  DROP CONSTRAINT IF EXISTS student_policy_downloads_student_user_id_org_id_key;

-- 2. Prevent duplicate downloads of the SAME policy (still counts toward quota only once).
CREATE UNIQUE INDEX IF NOT EXISTS student_policy_downloads_unique_policy
  ON public.student_policy_downloads (student_user_id, org_id, policy_id);

-- 3. Server-side cap: max 2 download rows per (student, org).
CREATE OR REPLACE FUNCTION public.enforce_student_policy_download_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_count int;
BEGIN
  SELECT count(*) INTO existing_count
  FROM public.student_policy_downloads
  WHERE student_user_id = NEW.student_user_id
    AND org_id = NEW.org_id;
  IF existing_count >= 2 THEN
    RAISE EXCEPTION 'student policy download quota exceeded (max 2)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_student_policy_download_quota ON public.student_policy_downloads;
CREATE TRIGGER trg_enforce_student_policy_download_quota
  BEFORE INSERT ON public.student_policy_downloads
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_student_policy_download_quota();
