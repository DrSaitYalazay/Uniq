
ALTER TABLE public.assets
  ADD COLUMN assessment_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN assessment_completion integer NOT NULL DEFAULT 0,
  ADD COLUMN assessment_last_edited timestamp with time zone DEFAULT NULL,
  ADD COLUMN assessment_assigned_to text DEFAULT NULL;
