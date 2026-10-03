
-- 1. Critical Services table
CREATE TABLE public.critical_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT DEFAULT '',
  countries TEXT[] DEFAULT '{}',
  business_unit TEXT DEFAULT '',
  user_marked_critical BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.critical_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own services" ON public.critical_services FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own services" ON public.critical_services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own services" ON public.critical_services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own services" ON public.critical_services FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all services" ON public.critical_services FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_critical_services_updated_at
  BEFORE UPDATE ON public.critical_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Service Criticality Inputs (scoring factors)
CREATE TABLE public.service_criticality_inputs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.critical_services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  operational_impact INTEGER NOT NULL DEFAULT 1 CHECK (operational_impact BETWEEN 1 AND 4),
  affected_users INTEGER NOT NULL DEFAULT 1 CHECK (affected_users BETWEEN 1 AND 5),
  data_sensitivity INTEGER NOT NULL DEFAULT 1 CHECK (data_sensitivity BETWEEN 1 AND 5),
  dependency_importance INTEGER NOT NULL DEFAULT 1 CHECK (dependency_importance BETWEEN 1 AND 4),
  legal_exposure INTEGER NOT NULL DEFAULT 1 CHECK (legal_exposure BETWEEN 1 AND 4),
  third_party_exposure INTEGER NOT NULL DEFAULT 1 CHECK (third_party_exposure BETWEEN 1 AND 4),
  availability_requirement INTEGER NOT NULL DEFAULT 1 CHECK (availability_requirement BETWEEN 1 AND 4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id)
);

ALTER TABLE public.service_criticality_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inputs" ON public.service_criticality_inputs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own inputs" ON public.service_criticality_inputs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inputs" ON public.service_criticality_inputs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inputs" ON public.service_criticality_inputs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_service_criticality_inputs_updated_at
  BEFORE UPDATE ON public.service_criticality_inputs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Service Criticality Results (computed)
CREATE TABLE public.service_criticality_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.critical_services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  classification TEXT NOT NULL DEFAULT 'Low',
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_id)
);

ALTER TABLE public.service_criticality_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.service_criticality_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own results" ON public.service_criticality_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results" ON public.service_criticality_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own results" ON public.service_criticality_results FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_service_criticality_results_updated_at
  BEFORE UPDATE ON public.service_criticality_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Criticality Formula Config (versioned, admin-managed)
CREATE TABLE public.criticality_formula_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  weights JSONB NOT NULL DEFAULT '{
    "operational_impact": 0.30,
    "affected_users": 0.15,
    "data_sensitivity": 0.15,
    "dependency_importance": 0.15,
    "legal_exposure": 0.10,
    "third_party_exposure": 0.05,
    "availability_requirement": 0.10
  }',
  thresholds JSONB NOT NULL DEFAULT '{
    "low_max": 1.99,
    "medium_max": 2.99,
    "high_max": 3.49
  }',
  changed_by UUID,
  change_note TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.criticality_formula_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active config" ON public.criticality_formula_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage formula config" ON public.criticality_formula_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default config
INSERT INTO public.criticality_formula_config (version, is_active, weights, thresholds, change_note)
VALUES (1, true, 
  '{"operational_impact": 0.30, "affected_users": 0.15, "data_sensitivity": 0.15, "dependency_importance": 0.15, "legal_exposure": 0.10, "third_party_exposure": 0.05, "availability_requirement": 0.10}',
  '{"low_max": 1.99, "medium_max": 2.99, "high_max": 3.49}',
  'System default configuration'
);

-- 5. Criticality Overrides (audit log)
CREATE TABLE public.criticality_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.critical_services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  system_classification TEXT NOT NULL,
  user_classification TEXT NOT NULL,
  reason TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.criticality_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own overrides" ON public.criticality_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create overrides" ON public.criticality_overrides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all overrides" ON public.criticality_overrides FOR SELECT USING (has_role(auth.uid(), 'admin'));
