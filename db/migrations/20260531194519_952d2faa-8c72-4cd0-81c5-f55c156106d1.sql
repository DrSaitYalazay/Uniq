-- Idempotency log for Frist-Benachrichtigungen (deadline notifications).
-- One row per (tenant, measure, trigger, recipient) ensures we never resend
-- the same reminder/overdue alert to the same person for the same measure.
CREATE TABLE public.frist_notification_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  measure_key text NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('reminder','overdue')),
  recipient_email text NOT NULL,
  due_date date,
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT frist_notif_unique UNIQUE (user_id, measure_key, trigger_type, recipient_email)
);

GRANT SELECT ON public.frist_notification_log TO authenticated;
GRANT ALL ON public.frist_notification_log TO service_role;

ALTER TABLE public.frist_notification_log ENABLE ROW LEVEL SECURITY;

-- Org-scoped read access (members can see their tenant's notification history)
CREATE POLICY "Members can view own tenant notification log"
ON public.frist_notification_log
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.in_same_org(auth.uid(), user_id)
);

CREATE INDEX idx_frist_notif_user ON public.frist_notification_log(user_id);
CREATE INDEX idx_frist_notif_sent_at ON public.frist_notification_log(sent_at DESC);