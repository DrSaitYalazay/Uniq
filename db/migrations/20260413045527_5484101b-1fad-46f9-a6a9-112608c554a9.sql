
CREATE TABLE public.bootcamp_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  country TEXT NOT NULL,
  motivation TEXT,
  join_type TEXT,
  preferred_month TEXT,
  wants_demo BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bootcamp_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (no auth required)
CREATE POLICY "Anyone can submit bootcamp application"
ON public.bootcamp_applications
FOR INSERT
WITH CHECK (true);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.bootcamp_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update application status
CREATE POLICY "Admins can update applications"
ON public.bootcamp_applications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp trigger
CREATE TRIGGER update_bootcamp_applications_updated_at
BEFORE UPDATE ON public.bootcamp_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
