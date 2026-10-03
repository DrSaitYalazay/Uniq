
-- Cross-framework topic tagging for controls
-- Enables "Themen-Filter" view: e.g. show all AI-relevant controls
-- across ISO/BSI/AI Act/42001/GDPR in one screen, regardless of framework.

ALTER TABLE public.controls
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS controls_tags_gin_idx
  ON public.controls USING gin (tags);

COMMENT ON COLUMN public.controls.tags IS
  'Cross-framework topic tags (ai, privacy, bcm, ot, cloud, supplier ...). Used by the Themen-Filter to project all controls related to a topic across frameworks.';
