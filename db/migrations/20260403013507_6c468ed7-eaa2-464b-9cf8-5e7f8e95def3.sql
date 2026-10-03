
CREATE TABLE public.dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  target_asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'technical',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_dependency CHECK (source_asset_id != target_asset_id)
);

ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dependencies" ON public.dependencies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own dependencies" ON public.dependencies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dependencies" ON public.dependencies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dependencies" ON public.dependencies FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all dependencies" ON public.dependencies FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_dependencies_user ON public.dependencies(user_id);
CREATE INDEX idx_dependencies_source ON public.dependencies(source_asset_id);
CREATE INDEX idx_dependencies_target ON public.dependencies(target_asset_id);

CREATE TRIGGER update_dependencies_updated_at
  BEFORE UPDATE ON public.dependencies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
