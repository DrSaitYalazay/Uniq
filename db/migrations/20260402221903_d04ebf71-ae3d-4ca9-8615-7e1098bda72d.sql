
-- Create company_profiles table for Context Layer (Step 1 of NIS2 Pipeline)
CREATE TABLE public.company_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'DE',
  company_size TEXT NOT NULL DEFAULT 'medium',
  employee_count INTEGER,
  annual_revenue NUMERIC,
  critical_services TEXT[] DEFAULT '{}',
  it_structure TEXT DEFAULT '',
  entity_type TEXT DEFAULT 'out_of_scope',
  in_scope BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profiles
CREATE POLICY "Users can view own company profiles"
ON public.company_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own profiles
CREATE POLICY "Users can create own company profiles"
ON public.company_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profiles
CREATE POLICY "Users can update own company profiles"
ON public.company_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own profiles
CREATE POLICY "Users can delete own company profiles"
ON public.company_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all company profiles"
ON public.company_profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_company_profiles_updated_at
BEFORE UPDATE ON public.company_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
