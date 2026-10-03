
-- Company logo storage policies
-- Files must be stored under `${tenant_id}/...`
CREATE POLICY "company_logos_select_own_tenant"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);

CREATE POLICY "company_logos_insert_own_tenant"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);

CREATE POLICY "company_logos_update_own_tenant"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
)
WITH CHECK (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);

CREATE POLICY "company_logos_delete_own_tenant"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);
