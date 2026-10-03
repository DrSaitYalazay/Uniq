
-- ============================================================
-- training_completions
-- ============================================================
CREATE TABLE public.training_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_track text NOT NULL DEFAULT 'all',
  topic_id text NOT NULL,
  participant_name text NOT NULL DEFAULT '',
  participant_email text NOT NULL DEFAULT '',
  participant_role text NOT NULL DEFAULT '',
  completed_at timestamptz NOT NULL DEFAULT now(),
  next_due_at timestamptz,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_completions TO authenticated;
GRANT ALL ON public.training_completions TO service_role;

ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_or_org_select_tc" ON public.training_completions
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id = public.get_org_owner_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "own_insert_tc" ON public.training_completions
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own_update_tc" ON public.training_completions
  FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own_delete_tc" ON public.training_completions
  FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER rewrite_tc_user
  BEFORE INSERT ON public.training_completions
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE TRIGGER touch_tc_updated
  BEFORE UPDATE ON public.training_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX training_completions_user_topic_idx
  ON public.training_completions (user_id, topic_id);

-- ============================================================
-- training_quiz_results
-- ============================================================
CREATE TABLE public.training_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_track text NOT NULL DEFAULT 'all',
  participant_name text NOT NULL DEFAULT '',
  participant_email text NOT NULL DEFAULT '',
  score int NOT NULL DEFAULT 0,
  total_questions int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  taken_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.training_quiz_results TO authenticated;
GRANT ALL ON public.training_quiz_results TO service_role;

ALTER TABLE public.training_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_or_org_select_qr" ON public.training_quiz_results
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id = public.get_org_owner_id(auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "own_insert_qr" ON public.training_quiz_results
  FOR INSERT WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own_delete_qr" ON public.training_quiz_results
  FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER rewrite_qr_user
  BEFORE INSERT ON public.training_quiz_results
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE INDEX training_quiz_results_user_idx
  ON public.training_quiz_results (user_id, taken_at DESC);

-- ============================================================
-- student_policy_downloads (Kompatibilität mit NIS2Suite Policies.tsx)
-- ============================================================
CREATE TABLE public.student_policy_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL,
  org_id uuid,
  policy_id text NOT NULL,
  policy_title text NOT NULL DEFAULT '',
  format text NOT NULL DEFAULT 'pdf',
  downloaded_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_user_id, policy_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_policy_downloads TO authenticated;
GRANT ALL ON public.student_policy_downloads TO service_role;

ALTER TABLE public.student_policy_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select_spd" ON public.student_policy_downloads
  FOR SELECT USING (
    student_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.is_lecturer(auth.uid())
  );
CREATE POLICY "own_insert_spd" ON public.student_policy_downloads
  FOR INSERT WITH CHECK (student_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own_delete_spd" ON public.student_policy_downloads
  FOR DELETE USING (student_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX spd_student_idx ON public.student_policy_downloads (student_user_id);
