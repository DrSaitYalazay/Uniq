
-- Organization-level assessment answers (not tied to assets)
CREATE TABLE public.org_assessment_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  control_id TEXT NOT NULL,
  status TEXT NOT NULL,
  comment TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, control_id)
);

ALTER TABLE public.org_assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org answers"
  ON public.org_assessment_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own org answers"
  ON public.org_assessment_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own org answers"
  ON public.org_assessment_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own org answers"
  ON public.org_assessment_answers FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all org answers"
  ON public.org_assessment_answers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_org_assessment_answers_updated_at
  BEFORE UPDATE ON public.org_assessment_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
