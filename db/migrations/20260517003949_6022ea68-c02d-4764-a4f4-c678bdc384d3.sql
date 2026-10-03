ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS cross_border_impact boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affected_member_states text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS measures_taken text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS measures_planned text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS impact_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_recipients_affected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS awareness_confidence text NOT NULL DEFAULT 'estimated',
  ADD COLUMN IF NOT EXISTS recipient_notification_status text NOT NULL DEFAULT 'na',
  ADD COLUMN IF NOT EXISTS recipient_notification_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS recipient_notification_channel text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recipient_notification_scope text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recipient_notification_proof text NOT NULL DEFAULT '';

-- Validation triggers (no CHECK constraints per project standard)
CREATE OR REPLACE FUNCTION public.validate_incident_enums()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.awareness_confidence NOT IN ('estimated','confirmed','forensic_confirmed') THEN
    RAISE EXCEPTION 'invalid awareness_confidence: %', NEW.awareness_confidence;
  END IF;
  IF NEW.recipient_notification_status NOT IN ('na','pending','sent') THEN
    RAISE EXCEPTION 'invalid recipient_notification_status: %', NEW.recipient_notification_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_incident_enums ON public.incidents;
CREATE TRIGGER trg_validate_incident_enums
  BEFORE INSERT OR UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.validate_incident_enums();