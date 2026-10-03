
-- Table 1: Audits
CREATE TABLE public.audits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  audit_type text NOT NULL DEFAULT 'internal',
  audit_name text NOT NULL,
  auditor text DEFAULT '',
  scope text[] DEFAULT '{}',
  scheduled_date date,
  completed_date date,
  status text NOT NULL DEFAULT 'planned',
  summary text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audits" ON public.audits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own audits" ON public.audits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own audits" ON public.audits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own audits" ON public.audits FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all audits" ON public.audits FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON public.audits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 2: Audit Findings
CREATE TABLE public.audit_findings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  finding_ref text DEFAULT '',
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL DEFAULT '',
  affected_controls text[] DEFAULT '{}',
  root_cause text DEFAULT '',
  corrective_action text DEFAULT '',
  responsible text DEFAULT '',
  due_date date,
  status text NOT NULL DEFAULT 'open',
  evidence text DEFAULT '',
  effectiveness_check boolean DEFAULT false,
  effectiveness_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own findings" ON public.audit_findings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own findings" ON public.audit_findings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own findings" ON public.audit_findings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own findings" ON public.audit_findings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all findings" ON public.audit_findings FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_audit_findings_updated_at BEFORE UPDATE ON public.audit_findings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 3: Improvement Items
CREATE TABLE public.improvement_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',
  source_ref text DEFAULT '',
  title text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'process',
  priority text NOT NULL DEFAULT 'medium',
  responsible text DEFAULT '',
  due_date date,
  status text NOT NULL DEFAULT 'proposed',
  lessons_learned text DEFAULT '',
  effectiveness_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.improvement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items" ON public.improvement_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own items" ON public.improvement_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.improvement_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own items" ON public.improvement_items FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all items" ON public.improvement_items FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_improvement_items_updated_at BEFORE UPDATE ON public.improvement_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
