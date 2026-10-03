DROP POLICY IF EXISTS "Only admins may write roles (restrictive)" ON public.user_roles;
CREATE POLICY "Only admins may write roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins may update roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins may delete roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role));