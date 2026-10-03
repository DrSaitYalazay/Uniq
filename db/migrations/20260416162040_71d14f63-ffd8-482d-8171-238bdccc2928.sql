
-- Drop the existing overly broad policy
DROP POLICY "Admins can manage all roles" ON public.user_roles;

-- Recreate scoped to authenticated users only
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
