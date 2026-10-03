-- Allow administrators to manage incident checklist items they can already view
CREATE POLICY "Admins can update all checklist items"
ON public.incident_checklist_items
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all checklist items"
ON public.incident_checklist_items
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Align incident register management with administrator visibility
CREATE POLICY "Admins can update all incidents"
ON public.incidents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all incidents"
ON public.incidents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
