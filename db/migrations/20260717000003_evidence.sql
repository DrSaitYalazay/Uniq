-- ============================================================
-- Evidence / Nachweis-Modell (ARCHITECTURE.md §2.3).
-- Prueffester Nachweis mit Typ, Gueltigkeit (Frische), Datei/Link.
-- n:m-Verknuepfung answer_evidence -> Reuse ueber Frameworks (Knoten).
-- Additiv, tenant-RLS wie answers. answers.evidence-Textfeld bleibt als Notiz.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.evidence (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  title        text NOT NULL,
  kind         text NOT NULL CHECK (kind IN
                 ('document','screenshot','log','ticket','attestation','link','other')),
  storage_path text,           -- /storage-Bucket 'evidence'
  external_url text,
  description  text,
  collected_at timestamptz NOT NULL DEFAULT now(),
  valid_until  date,           -- Frische: NULL = zeitlos
  collected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evidence_tenant_idx ON public.evidence (tenant_id);
CREATE INDEX IF NOT EXISTS evidence_valid_until_idx ON public.evidence (tenant_id, valid_until);

CREATE TABLE IF NOT EXISTS public.answer_evidence (
  evidence_id uuid NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL,
  framework   text NOT NULL,
  control_id  text NOT NULL,
  PRIMARY KEY (evidence_id, framework, control_id),
  FOREIGN KEY (framework, control_id) REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS answer_evidence_ctrl_idx ON public.answer_evidence (tenant_id, framework, control_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence TO authenticated;
GRANT ALL ON public.evidence TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answer_evidence TO authenticated;
GRANT ALL ON public.answer_evidence TO service_role;

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "evidence_tenant_select" ON public.evidence FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "evidence_tenant_insert" ON public.evidence FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "evidence_tenant_update" ON public.evidence FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "evidence_tenant_delete" ON public.evidence FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "answer_evidence_tenant_select" ON public.answer_evidence FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "answer_evidence_tenant_insert" ON public.answer_evidence FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "answer_evidence_tenant_delete" ON public.answer_evidence FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
