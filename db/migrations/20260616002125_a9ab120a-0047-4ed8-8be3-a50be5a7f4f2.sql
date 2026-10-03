ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS data_processing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_processing_consent_date timestamptz;