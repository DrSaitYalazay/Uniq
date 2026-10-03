CREATE TABLE public.assessment_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  control_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ja', 'teilweise', 'nein', 'entbehrlich')),
  comment TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, asset_id, control_id)
);

ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON public.assessment_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own answers"
  ON public.assessment_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON public.assessment_answers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
  ON public.assessment_answers FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all answers"
  ON public.assessment_answers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_assessment_answers_updated_at
  BEFORE UPDATE ON public.assessment_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();