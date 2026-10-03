
ALTER TABLE public.answers
  ADD COLUMN IF NOT EXISTS asset_id uuid NULL REFERENCES public.assets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS answers_asset_id_idx ON public.answers(asset_id);

ALTER TABLE public.answers
  DROP CONSTRAINT IF EXISTS answers_tenant_id_framework_control_id_key;

ALTER TABLE public.answers
  ADD CONSTRAINT answers_tenant_framework_control_asset_key
  UNIQUE NULLS NOT DISTINCT (tenant_id, framework, control_id, asset_id);
