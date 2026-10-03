
-- Extend audits with classic internal audit fields
ALTER TABLE public.audits
  ADD COLUMN IF NOT EXISTS audit_criteria text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS methodology text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS opening_meeting_date date,
  ADD COLUMN IF NOT EXISTS opening_attendees text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS opening_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS closing_meeting_date date,
  ADD COLUMN IF NOT EXISTS closing_attendees text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS closing_notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS conclusion text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS recommendation text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS program_year integer;

-- New table for audit checklist items (questions filled during audit)
CREATE TABLE IF NOT EXISTS public.audit_checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  control_id text NOT NULL DEFAULT '',
  question text NOT NULL DEFAULT '',
  result text NOT NULL DEFAULT 'pending',
  evidence text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_checklist_items TO authenticated;
GRANT ALL ON public.audit_checklist_items TO service_role;

ALTER TABLE public.audit_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist items"
  ON public.audit_checklist_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checklist items"
  ON public.audit_checklist_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklist items"
  ON public.audit_checklist_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklist items"
  ON public.audit_checklist_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org checklist items"
  ON public.audit_checklist_items FOR SELECT TO authenticated
  USING (in_same_org(auth.uid(), user_id));

CREATE POLICY "Org members can create org checklist items"
  ON public.audit_checklist_items FOR INSERT TO authenticated
  WITH CHECK (in_same_org(auth.uid(), user_id));

CREATE POLICY "Org members can update org checklist items"
  ON public.audit_checklist_items FOR UPDATE TO authenticated
  USING (in_same_org(auth.uid(), user_id))
  WITH CHECK (in_same_org(auth.uid(), user_id));

CREATE POLICY "Org members can delete org checklist items"
  ON public.audit_checklist_items FOR DELETE TO authenticated
  USING (in_same_org(auth.uid(), user_id));

CREATE POLICY "Admins can view all checklist items"
  ON public.audit_checklist_items FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_audit_checklist_audit ON public.audit_checklist_items(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_checklist_user ON public.audit_checklist_items(user_id);

CREATE TRIGGER trg_audit_checklist_updated_at
  BEFORE UPDATE ON public.audit_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_audit_checklist_rewrite_owner
  BEFORE INSERT ON public.audit_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();
