
ALTER TABLE public.profiles
ADD COLUMN marketing_consent boolean NOT NULL DEFAULT false,
ADD COLUMN marketing_consent_date timestamptz,
ADD COLUMN marketing_consent_categories text[] DEFAULT '{}'::text[];
