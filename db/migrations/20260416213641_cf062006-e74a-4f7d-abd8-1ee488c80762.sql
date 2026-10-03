CREATE POLICY "Org members can view org member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.in_same_org(auth.uid(), user_id));