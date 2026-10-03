
-- user_tool_data
DELETE FROM public.user_tool_data m
USING public.org_members om, public.organizations o
WHERE o.id = om.org_id
  AND m.user_id = om.user_id
  AND om.user_id <> o.owner_id
  AND EXISTS (SELECT 1 FROM public.user_tool_data o2 WHERE o2.user_id = o.owner_id AND o2.tool_key = m.tool_key);
UPDATE public.user_tool_data tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

-- service_criticality_inputs
DELETE FROM public.service_criticality_inputs m
USING public.org_members om, public.organizations o
WHERE o.id = om.org_id AND m.user_id = om.user_id AND om.user_id <> o.owner_id
  AND EXISTS (SELECT 1 FROM public.service_criticality_inputs o2 WHERE o2.service_id = m.service_id AND o2.user_id = o.owner_id);
UPDATE public.service_criticality_inputs tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

-- service_criticality_results
DELETE FROM public.service_criticality_results m
USING public.org_members om, public.organizations o
WHERE o.id = om.org_id AND m.user_id = om.user_id AND om.user_id <> o.owner_id
  AND EXISTS (SELECT 1 FROM public.service_criticality_results o2 WHERE o2.service_id = m.service_id AND o2.user_id = o.owner_id);
UPDATE public.service_criticality_results tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

-- assessment_answers
DELETE FROM public.assessment_answers m
USING public.org_members om, public.organizations o
WHERE o.id = om.org_id AND m.user_id = om.user_id AND om.user_id <> o.owner_id
  AND EXISTS (SELECT 1 FROM public.assessment_answers o2 WHERE o2.user_id = o.owner_id AND o2.asset_id = m.asset_id AND o2.control_id = m.control_id);
UPDATE public.assessment_answers tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

-- org_assessment_answers
DELETE FROM public.org_assessment_answers m
USING public.org_members om, public.organizations o
WHERE o.id = om.org_id AND m.user_id = om.user_id AND om.user_id <> o.owner_id
  AND EXISTS (SELECT 1 FROM public.org_assessment_answers o2 WHERE o2.user_id = o.owner_id AND o2.control_id = m.control_id);
UPDATE public.org_assessment_answers tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

-- Remaining tables (no problematic uniques)
UPDATE public.criticality_overrides tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

UPDATE public.critical_services tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

UPDATE public.assets tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

UPDATE public.dependencies tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

UPDATE public.audits tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

UPDATE public.audit_findings tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

UPDATE public.improvement_items tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;

UPDATE public.company_profiles tbl SET user_id = o.owner_id
FROM public.org_members m JOIN public.organizations o ON o.id = m.org_id
WHERE tbl.user_id = m.user_id AND m.user_id <> o.owner_id;
