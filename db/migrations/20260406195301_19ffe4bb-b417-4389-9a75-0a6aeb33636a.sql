ALTER TABLE public.audit_findings
ADD COLUMN control_comments jsonb DEFAULT '{}'::jsonb;