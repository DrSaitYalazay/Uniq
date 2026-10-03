
REVOKE EXECUTE ON FUNCTION public.count_tenant_data(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wipe_tenant_data(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_owner_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_org_id(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, org_role[]) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.in_same_org(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_lecturer(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_org_owner(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_premium(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_student(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_member_count(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_pending_invite_count(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.org_total_seat_count(uuid) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prune_user_snapshots() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rewrite_user_id_to_org_owner() FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
