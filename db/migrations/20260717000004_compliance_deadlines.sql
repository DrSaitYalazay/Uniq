-- ============================================================
-- Zentrale Fristen-Engine (ARCHITECTURE.md §2.5).
-- EINE Deadline-Tabelle fuer alle Fristen: Incident-Meldeketten (NIS2/DORA/DSGVO),
-- DSAR, KRITIS-2-Jahres-Nachweis, TISAX-3-Jahre, Dokument-Reviews, Schulungszyklen,
-- Evidence-Frische. Additiv, tenant-RLS. Server-Cron (deadline-reminder) befuellt
-- frist_notification_log.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compliance_deadlines (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  kind       text NOT NULL CHECK (kind IN
               ('incident_report','dsar','kritis_nachweis','evidence_review',
                'document_review','training_cycle','audit_cycle','exercise',
                'ai_act_deadline','custom')),
  framework  text,                       -- NIS2/DORA/GDPR/KRITIS/AIACT/…
  ref_table  text,
  ref_id     text,
  label      text NOT NULL,
  starts_at  timestamptz NOT NULL DEFAULT now(),
  due_at     timestamptz,                -- NULL = "unverzueglich"/auf Ersuchen
  recurrence interval,                   -- z.B. '2 years' (KRITIS), '1 year' (Schulung)
  status     text NOT NULL DEFAULT 'open'
               CHECK (status IN ('open','done','cancelled','overdue')),
  done_at    timestamptz,
  meta       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS compliance_deadlines_tenant_idx
  ON public.compliance_deadlines (tenant_id, status, due_at);
CREATE INDEX IF NOT EXISTS compliance_deadlines_ref_idx
  ON public.compliance_deadlines (tenant_id, ref_table, ref_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_deadlines TO authenticated;
GRANT ALL ON public.compliance_deadlines TO service_role;
ALTER TABLE public.compliance_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compliance_deadlines_tenant_select" ON public.compliance_deadlines FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "compliance_deadlines_tenant_insert" ON public.compliance_deadlines FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "compliance_deadlines_tenant_update" ON public.compliance_deadlines FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));
CREATE POLICY "compliance_deadlines_tenant_delete" ON public.compliance_deadlines FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

-- Hinweis: frist_notification_log existiert bereits (per-user Reminder-Log). Der
-- deadline-reminder-Cron nutzt sie idempotent mit measure_key = '<deadline_id>:<schwelle>'
-- und trigger_type IN ('reminder','overdue'); KEINE Schemaaenderung noetig.
