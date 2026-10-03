
CREATE TABLE public.user_tool_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_key)
);

ALTER TABLE public.user_tool_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tool data"
  ON public.user_tool_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tool data"
  ON public.user_tool_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tool data"
  ON public.user_tool_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tool data"
  ON public.user_tool_data FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_tool_data_updated_at
  BEFORE UPDATE ON public.user_tool_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
