-- Pending org invitations table
CREATE TABLE public.org_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked | expired
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_org_invitations_unique_pending
  ON public.org_invitations(org_id, lower(email))
  WHERE status = 'pending';

CREATE INDEX idx_org_invitations_token ON public.org_invitations(token);
CREATE INDEX idx_org_invitations_email ON public.org_invitations(lower(email));

ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;

-- Counts pending invitations toward member cap
CREATE OR REPLACE FUNCTION public.org_pending_invite_count(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.org_invitations
  WHERE org_id = _org_id AND status = 'pending' AND expires_at > now();
$$;

-- Combined: members + pending invites (for the 10-cap)
CREATE OR REPLACE FUNCTION public.org_total_seat_count(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.org_member_count(_org_id) + public.org_pending_invite_count(_org_id);
$$;

-- RLS: owner/admin manage, invited email can view their own invite by token (handled in edge function)
CREATE POLICY "Owner or admin can view org invitations"
ON public.org_invitations FOR SELECT TO authenticated
USING (has_org_role(auth.uid(), org_id, ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Owner or admin can create invitations"
ON public.org_invitations FOR INSERT TO authenticated
WITH CHECK (
  has_org_role(auth.uid(), org_id, ARRAY['owner'::org_role, 'admin'::org_role])
  AND public.org_total_seat_count(org_id) < 10
  AND auth.uid() = invited_by
);

CREATE POLICY "Owner or admin can revoke invitations"
ON public.org_invitations FOR UPDATE TO authenticated
USING (has_org_role(auth.uid(), org_id, ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Owner or admin can delete invitations"
ON public.org_invitations FOR DELETE TO authenticated
USING (has_org_role(auth.uid(), org_id, ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Admins can view all invitations"
ON public.org_invitations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_org_invitations_updated_at
BEFORE UPDATE ON public.org_invitations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing org_members invite policy to include pending invites in cap
DROP POLICY IF EXISTS "Owner or admin can invite members" ON public.org_members;
CREATE POLICY "Owner or admin can invite members"
ON public.org_members FOR INSERT TO authenticated
WITH CHECK (
  has_org_role(auth.uid(), org_id, ARRAY['owner'::org_role, 'admin'::org_role])
  AND public.org_total_seat_count(org_id) < 10
);