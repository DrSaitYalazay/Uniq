
-- Add suspension support to org_members
ALTER TABLE public.org_members 
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid;

-- Helper: is the user a suspended org member (account frozen by lecturer/owner)?
CREATE OR REPLACE FUNCTION public.is_account_suspended(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user_id AND suspended_at IS NOT NULL
  )
$$;

-- Update the rewrite trigger to block writes from suspended accounts.
-- (Frozen accounts can sign in but cannot mutate tenant data.)
CREATE OR REPLACE FUNCTION public.rewrite_user_id_to_org_owner()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE owner_id uuid;
BEGIN
  IF NEW.user_id IS NULL THEN NEW.user_id := auth.uid(); END IF;
  IF auth.uid() IS NOT NULL AND public.is_account_suspended(auth.uid()) THEN
    RAISE EXCEPTION 'account_suspended' USING ERRCODE = '42501';
  END IF;
  SELECT public.get_org_owner_id(NEW.user_id) INTO owner_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN NEW.user_id := owner_id; END IF;
  RETURN NEW;
END; $$;
