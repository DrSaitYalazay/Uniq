CREATE TABLE public.student_policy_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  policy_id text NOT NULL,
  policy_title text,
  format text,
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, org_id)
);

GRANT SELECT, INSERT ON public.student_policy_downloads TO authenticated;
GRANT ALL ON public.student_policy_downloads TO service_role;

ALTER TABLE public.student_policy_downloads ENABLE ROW LEVEL SECURITY;

-- Student can see own download
CREATE POLICY "Student can view own download"
  ON public.student_policy_downloads FOR SELECT
  TO authenticated
  USING (auth.uid() = student_user_id);

-- Student can insert their own download row only for an org they belong to
CREATE POLICY "Student can record own download"
  ON public.student_policy_downloads FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = student_user_id
    AND EXISTS (
      SELECT 1 FROM public.org_members
      WHERE user_id = auth.uid() AND org_id = student_policy_downloads.org_id
    )
  );

-- Lecturer / org owner can view all downloads for their org
CREATE POLICY "Org owner can view org downloads"
  ON public.student_policy_downloads FOR SELECT
  TO authenticated
  USING (public.is_org_owner(auth.uid(), org_id));

-- Org owner can delete (reset quota for a student)
CREATE POLICY "Org owner can reset downloads"
  ON public.student_policy_downloads FOR DELETE
  TO authenticated
  USING (public.is_org_owner(auth.uid(), org_id));

CREATE INDEX student_policy_downloads_org_idx ON public.student_policy_downloads(org_id);
CREATE INDEX student_policy_downloads_student_idx ON public.student_policy_downloads(student_user_id);