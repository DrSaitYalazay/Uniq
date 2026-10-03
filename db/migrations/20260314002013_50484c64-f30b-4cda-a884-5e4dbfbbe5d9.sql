CREATE TABLE public.premium_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can request premium"
ON public.premium_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.premium_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all requests"
ON public.premium_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests
CREATE POLICY "Admins can update requests"
ON public.premium_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));