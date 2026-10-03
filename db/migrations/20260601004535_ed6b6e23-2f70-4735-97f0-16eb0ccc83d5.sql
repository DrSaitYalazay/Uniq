ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS instance_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.assets
  ADD CONSTRAINT assets_instance_count_positive CHECK (instance_count >= 1);