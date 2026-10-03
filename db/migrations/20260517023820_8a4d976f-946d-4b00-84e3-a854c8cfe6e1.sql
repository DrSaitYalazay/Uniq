
-- =========================================
-- Phase 1: Training tables
-- =========================================

-- 1. Training completions (per participant tracking)
CREATE TABLE public.training_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role_track text NOT NULL,
  topic_id text NOT NULL,
  participant_name text NOT NULL,
  participant_email text NOT NULL DEFAULT '',
  participant_role text NOT NULL DEFAULT '',
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  next_due_at timestamp with time zone NOT NULL DEFAULT (now() + interval '12 months'),
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.training_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training completions" ON public.training_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own training completions" ON public.training_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own training completions" ON public.training_completions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own training completions" ON public.training_completions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org training completions" ON public.training_completions
  FOR SELECT TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can create org training completions" ON public.training_completions
  FOR INSERT TO authenticated WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can update org training completions" ON public.training_completions
  FOR UPDATE TO authenticated USING (in_same_org(auth.uid(), user_id)) WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete org training completions" ON public.training_completions
  FOR DELETE TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Admins can view all training completions" ON public.training_completions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER training_completions_owner_rewrite
  BEFORE INSERT ON public.training_completions
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE TRIGGER training_completions_updated_at
  BEFORE UPDATE ON public.training_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_training_completions_user ON public.training_completions(user_id);
CREATE INDEX idx_training_completions_topic ON public.training_completions(user_id, topic_id);

-- 2. Training quiz results
CREATE TABLE public.training_quiz_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role_track text NOT NULL,
  participant_name text NOT NULL,
  participant_email text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 5,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  taken_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.training_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results" ON public.training_quiz_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quiz results" ON public.training_quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own quiz results" ON public.training_quiz_results
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org quiz results" ON public.training_quiz_results
  FOR SELECT TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can create org quiz results" ON public.training_quiz_results
  FOR INSERT TO authenticated WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete org quiz results" ON public.training_quiz_results
  FOR DELETE TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Admins can view all quiz results" ON public.training_quiz_results
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER training_quiz_results_owner_rewrite
  BEFORE INSERT ON public.training_quiz_results
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE INDEX idx_training_quiz_results_user ON public.training_quiz_results(user_id);

-- =========================================
-- Phase 2: Policy tables
-- =========================================

-- 3. Policy versions (version history)
CREATE TABLE public.policy_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  policy_id text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  change_note text NOT NULL DEFAULT '',
  changed_by_name text NOT NULL DEFAULT '',
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own policy versions" ON public.policy_versions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own policy versions" ON public.policy_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own policy versions" ON public.policy_versions
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org policy versions" ON public.policy_versions
  FOR SELECT TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can create org policy versions" ON public.policy_versions
  FOR INSERT TO authenticated WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete org policy versions" ON public.policy_versions
  FOR DELETE TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Admins can view all policy versions" ON public.policy_versions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER policy_versions_owner_rewrite
  BEFORE INSERT ON public.policy_versions
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE INDEX idx_policy_versions_user_policy ON public.policy_versions(user_id, policy_id, version);

-- 4. Policy metadata (workflow status + review cycle)
CREATE TABLE public.policy_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  policy_id text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  current_version integer NOT NULL DEFAULT 1,
  owner_role text NOT NULL DEFAULT '',
  approved_by text NOT NULL DEFAULT '',
  approved_at timestamp with time zone,
  published_at timestamp with time zone,
  next_review_date date,
  review_interval_months integer NOT NULL DEFAULT 12,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, policy_id)
);

ALTER TABLE public.policy_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own policy metadata" ON public.policy_metadata
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own policy metadata" ON public.policy_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own policy metadata" ON public.policy_metadata
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own policy metadata" ON public.policy_metadata
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org policy metadata" ON public.policy_metadata
  FOR SELECT TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can create org policy metadata" ON public.policy_metadata
  FOR INSERT TO authenticated WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can update org policy metadata" ON public.policy_metadata
  FOR UPDATE TO authenticated USING (in_same_org(auth.uid(), user_id)) WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete org policy metadata" ON public.policy_metadata
  FOR DELETE TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Admins can view all policy metadata" ON public.policy_metadata
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER policy_metadata_owner_rewrite
  BEFORE INSERT ON public.policy_metadata
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE TRIGGER policy_metadata_updated_at
  BEFORE UPDATE ON public.policy_metadata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Policy acknowledgements (employee read-receipts)
CREATE TABLE public.policy_acknowledgements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  policy_id text NOT NULL,
  policy_version integer NOT NULL DEFAULT 1,
  ack_name text NOT NULL,
  ack_email text NOT NULL DEFAULT '',
  ack_role text NOT NULL DEFAULT '',
  ack_department text NOT NULL DEFAULT '',
  acknowledged_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.policy_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own policy acks" ON public.policy_acknowledgements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own policy acks" ON public.policy_acknowledgements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own policy acks" ON public.policy_acknowledgements
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org policy acks" ON public.policy_acknowledgements
  FOR SELECT TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can create org policy acks" ON public.policy_acknowledgements
  FOR INSERT TO authenticated WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete org policy acks" ON public.policy_acknowledgements
  FOR DELETE TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Admins can view all policy acks" ON public.policy_acknowledgements
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER policy_acks_owner_rewrite
  BEFORE INSERT ON public.policy_acknowledgements
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE INDEX idx_policy_acks_user_policy ON public.policy_acknowledgements(user_id, policy_id);
