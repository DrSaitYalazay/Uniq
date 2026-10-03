
-- =====================================================
-- INCIDENTS table (Step 13 — Vorfallregister)
-- =====================================================
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT ''::text,
  incident_type TEXT NOT NULL DEFAULT 'other'::text,
  severity TEXT NOT NULL DEFAULT 'medium'::text,
  status TEXT NOT NULL DEFAULT 'open'::text,
  occurred_at TIMESTAMP WITH TIME ZONE,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  affected_service_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  affected_asset_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  reportable BOOLEAN NOT NULL DEFAULT false,
  authority_notified BOOLEAN NOT NULL DEFAULT false,
  authority_name TEXT NOT NULL DEFAULT 'BSI'::text,
  root_cause TEXT NOT NULL DEFAULT ''::text,
  lessons_learned TEXT NOT NULL DEFAULT ''::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incidents" ON public.incidents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own incidents" ON public.incidents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own incidents" ON public.incidents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own incidents" ON public.incidents
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org incidents" ON public.incidents
  FOR SELECT TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can create org incidents" ON public.incidents
  FOR INSERT TO authenticated WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can update org incidents" ON public.incidents
  FOR UPDATE TO authenticated USING (in_same_org(auth.uid(), user_id))
  WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete org incidents" ON public.incidents
  FOR DELETE TO authenticated USING (in_same_org(auth.uid(), user_id));

CREATE POLICY "Admins can view all incidents" ON public.incidents
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_incidents_user_id ON public.incidents(user_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);

-- =====================================================
-- INCIDENT_CHECKLIST_ITEMS table
-- =====================================================
CREATE TABLE public.incident_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  incident_id UUID NOT NULL,
  phase TEXT NOT NULL DEFAULT 'internal_response'::text,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text,
  responsible TEXT NOT NULL DEFAULT ''::text,
  deadline TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  evidence TEXT NOT NULL DEFAULT ''::text,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checklist items" ON public.incident_checklist_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own checklist items" ON public.incident_checklist_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklist items" ON public.incident_checklist_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklist items" ON public.incident_checklist_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org checklist items" ON public.incident_checklist_items
  FOR SELECT TO authenticated USING (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can create org checklist items" ON public.incident_checklist_items
  FOR INSERT TO authenticated WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can update org checklist items" ON public.incident_checklist_items
  FOR UPDATE TO authenticated USING (in_same_org(auth.uid(), user_id))
  WITH CHECK (in_same_org(auth.uid(), user_id));
CREATE POLICY "Org members can delete org checklist items" ON public.incident_checklist_items
  FOR DELETE TO authenticated USING (in_same_org(auth.uid(), user_id));

CREATE POLICY "Admins can view all checklist items" ON public.incident_checklist_items
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_incident_checklist_items_updated_at
  BEFORE UPDATE ON public.incident_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_incident_checklist_incident_id ON public.incident_checklist_items(incident_id);
CREATE INDEX idx_incident_checklist_user_id ON public.incident_checklist_items(user_id);
