-- ============================================================
-- Sicherheits-Haertung (Fable5-Audit P0/P1). 2026-07-18
-- ============================================================

-- P0: auth.users war fuer 'authenticated' lesbar (GRANT SELECT) und ohne RLS
-- => ueber den Daten-Gateway (schema.table) konnten bcrypt-Hashes/recovery_token
-- aller Nutzer gelesen werden (Konto-Uebernahme). Zugriff entziehen.
-- (Der App-Client braucht auth.users nie direkt; Profildaten liegen in public.*.)
REVOKE SELECT ON auth.users FROM authenticated;

-- P0: Evidence-Upload war komplett kaputt — Bucket 'evidence' existierte nicht
-- und es gab keine Storage-RLS-Policies dafuer. Privater Bucket (public=false!)
-- damit Nachweise NICHT oeffentlich abrufbar sind. Pfad-Konvention: <tenant_id>/<uuid>.
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "evidence_select_own_tenant" ON storage.objects;
CREATE POLICY "evidence_select_own_tenant" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);
DROP POLICY IF EXISTS "evidence_insert_own_tenant" ON storage.objects;
CREATE POLICY "evidence_insert_own_tenant" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);
DROP POLICY IF EXISTS "evidence_update_own_tenant" ON storage.objects;
CREATE POLICY "evidence_update_own_tenant" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
)
WITH CHECK (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);
DROP POLICY IF EXISTS "evidence_delete_own_tenant" ON storage.objects;
CREATE POLICY "evidence_delete_own_tenant" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid())::text
);

-- P1: maturity_targets.family_id ist nullbar; UNIQUE(tenant_id,framework,family_id)
-- dedupliziert NULLs in PG standardmaessig NICHT (NULLs distinct) => beliebig viele
-- framework-weite Ziele je Tenant. Auf NULLS NOT DISTINCT umstellen (PG 15+).
ALTER TABLE public.maturity_targets
  DROP CONSTRAINT IF EXISTS maturity_targets_tenant_id_framework_family_id_key;
ALTER TABLE public.maturity_targets
  ADD CONSTRAINT maturity_targets_tenant_fw_fam_uniq
  UNIQUE NULLS NOT DISTINCT (tenant_id, framework, family_id);
