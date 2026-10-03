
-- Create assets table for Step 4: Asset Inventory
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.critical_services(id) ON DELETE CASCADE,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'Application',
  owner TEXT DEFAULT '',
  environment TEXT NOT NULL DEFAULT 'On-prem',
  inherited_criticality BOOLEAN NOT NULL DEFAULT false,
  user_override_criticality BOOLEAN,
  data_sensitivity TEXT DEFAULT 'Normal',
  external_exposure BOOLEAN DEFAULT false,
  vendor TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own assets"
  ON public.assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON public.assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all assets"
  ON public.assets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_service_id ON public.assets(service_id);

-- Updated_at trigger
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
