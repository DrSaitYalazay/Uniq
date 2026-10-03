
-- Remove global 'admin' read/write access on tenant-owned data tables.
-- Keep admin access on operational tables needed for license management
-- (profiles, user_roles, organizations, org_members, org_invitations,
-- blog_articles, bootcamp_applications, contact_messages, premium_requests,
-- email_send_log, suppressed_emails, criticality_formula_config,
-- lecturer_impersonation_log).

DROP POLICY IF EXISTS "Admins can view all answers" ON public.assessment_answers;
DROP POLICY IF EXISTS "Admins can view all assets" ON public.assets;
DROP POLICY IF EXISTS "Admins can view all checklist items" ON public.audit_checklist_items;
DROP POLICY IF EXISTS "Admins can view all findings" ON public.audit_findings;
DROP POLICY IF EXISTS "Admins can view all audits" ON public.audits;
DROP POLICY IF EXISTS "Admins can view all company profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Admins can view all services" ON public.critical_services;
DROP POLICY IF EXISTS "Admins can view all overrides" ON public.criticality_overrides;
DROP POLICY IF EXISTS "Admins can view all dependencies" ON public.dependencies;
DROP POLICY IF EXISTS "Admins can view all items" ON public.improvement_items;
DROP POLICY IF EXISTS "Admins can view all checklist items" ON public.incident_checklist_items;
DROP POLICY IF EXISTS "Admins can update all checklist items" ON public.incident_checklist_items;
DROP POLICY IF EXISTS "Admins can delete all checklist items" ON public.incident_checklist_items;
DROP POLICY IF EXISTS "Admins can view all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can update all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can delete all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Admins can view all org answers" ON public.org_assessment_answers;
DROP POLICY IF EXISTS "Admins can view all policy acks" ON public.policy_acknowledgements;
DROP POLICY IF EXISTS "Admins can view all policy metadata" ON public.policy_metadata;
DROP POLICY IF EXISTS "Admins can view all policy versions" ON public.policy_versions;
DROP POLICY IF EXISTS "Admins can view all training completions" ON public.training_completions;
DROP POLICY IF EXISTS "Admins can view all quiz results" ON public.training_quiz_results;
DROP POLICY IF EXISTS "Admins can view all snapshots" ON public.user_snapshots;
