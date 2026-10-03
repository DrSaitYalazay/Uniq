---
name: Tenant Isolation Static Guard
description: Forbids `.eq("user_id", user.id)` on tenant-scoped tables; AuthContext.tenantId already honors lecturer impersonation
type: constraint
---
CRITICAL production safeguard. Two layers:

1. **AuthContext exposes `tenantId = viewAsUserId ?? rawTenantId`** — every page
   that filters `.eq("user_id", tenantId)` automatically reads/writes the
   correct tenant when a lecturer impersonates a student.

2. **Static test** `src/test/tenant-isolation-guard.test.ts` scans all source
   files and fails CI if `.eq("user_id", user.id|session.user.id)` appears on
   any tenant-scoped table.

**Tenant-scoped tables** (one row owned by org owner / impersonated tenant):
assets, assessment_answers, audit_*, company_profiles, critical_services,
criticality_overrides, dependencies, improvement_items, incidents,
incident_checklist_items, org_assessment_answers, policy_*,
service_criticality_*, training_*, user_snapshots, user_tool_data.

**User-scoped tables** (one row per auth.uid()): profiles, user_roles,
premium_requests, bootcamp_applications, contact_messages,
lecturer_impersonation_log, email_unsubscribe_tokens, suppressed_emails.

**How to apply:** When adding any new table, add it to the corresponding list
in the guard test. Never query a tenant-scoped table with raw `user.id`.
Allowed bridges: `AuthContext.tsx`, `data/demoSeed/cloudSync.ts`,
`hooks/useToolData.ts` (these resolve tenant internally).
