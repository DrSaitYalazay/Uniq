
-- 1. Fix contact_messages INSERT: enforce user_id ownership
DROP POLICY "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 2. Fix bootcamp_applications INSERT: enforce user_id ownership  
DROP POLICY "Anyone can submit bootcamp application" ON public.bootcamp_applications;
CREATE POLICY "Anyone can submit bootcamp application"
ON public.bootcamp_applications
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 3. Fix criticality_formula_config: restrict SELECT to active config only
DROP POLICY "Authenticated users can read active config" ON public.criticality_formula_config;
CREATE POLICY "Authenticated users can read active config"
ON public.criticality_formula_config
FOR SELECT
TO authenticated
USING (is_active = true);
