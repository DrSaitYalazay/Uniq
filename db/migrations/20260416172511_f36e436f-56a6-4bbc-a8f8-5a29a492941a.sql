
-- Create organization table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create org_members table
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_user ON public.org_members(user_id);
CREATE INDEX idx_org_members_org ON public.org_members(org_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Helper: check if user belongs to an org (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.org_members WHERE user_id = _user_id LIMIT 1;
$$;

-- Helper: check org role
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _roles org_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = _user_id AND org_id = _org_id AND role = ANY(_roles)
  );
$$;

-- Helper: count members in org (for 10-user limit)
CREATE OR REPLACE FUNCTION public.org_member_count(_org_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.org_members WHERE org_id = _org_id;
$$;

-- ============ RLS: organizations ============

-- Members can view their org
CREATE POLICY "Members can view their organization"
ON public.organizations FOR SELECT
TO authenticated
USING (id = public.get_user_org_id(auth.uid()));

-- Admins can view all orgs
CREATE POLICY "Admins can view all organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Any authenticated user can create an org
CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Only owner can update
CREATE POLICY "Owners can update their organization"
ON public.organizations FOR UPDATE
TO authenticated
USING (public.has_org_role(auth.uid(), id, ARRAY['owner']::org_role[]));

-- Only owner can delete
CREATE POLICY "Owners can delete their organization"
ON public.organizations FOR DELETE
TO authenticated
USING (public.has_org_role(auth.uid(), id, ARRAY['owner']::org_role[]));

-- ============ RLS: org_members ============

-- Members can see fellow members
CREATE POLICY "Members can view org members"
ON public.org_members FOR SELECT
TO authenticated
USING (org_id = public.get_user_org_id(auth.uid()));

-- Admins can view all
CREATE POLICY "Admins can view all org members"
ON public.org_members FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Owner/admin can invite (with 10-member cap)
CREATE POLICY "Owner or admin can invite members"
ON public.org_members FOR INSERT
TO authenticated
WITH CHECK (
  public.has_org_role(auth.uid(), org_id, ARRAY['owner','admin']::org_role[])
  AND public.org_member_count(org_id) < 10
);

-- Owner/admin can remove members
CREATE POLICY "Owner or admin can remove members"
ON public.org_members FOR DELETE
TO authenticated
USING (public.has_org_role(auth.uid(), org_id, ARRAY['owner','admin']::org_role[]));

-- Owner can update member roles
CREATE POLICY "Owner can update member roles"
ON public.org_members FOR UPDATE
TO authenticated
USING (public.has_org_role(auth.uid(), org_id, ARRAY['owner']::org_role[]));

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
BEFORE UPDATE ON public.org_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
