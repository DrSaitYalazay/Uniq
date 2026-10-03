
-- Staging tables and reload helper for junction refresh
CREATE TABLE IF NOT EXISTS public._junction_stage_ci (framework text, control_id text, iso_id text);
CREATE TABLE IF NOT EXISTS public._junction_stage_cr (framework text, control_id text, risk_id text, link_typ text);
CREATE TABLE IF NOT EXISTS public._junction_stage_rc (risk_id text, framework text, control_id text, tier text);

GRANT SELECT, INSERT, TRUNCATE ON public._junction_stage_ci TO authenticated, service_role;
GRANT SELECT, INSERT, TRUNCATE ON public._junction_stage_cr TO authenticated, service_role;
GRANT SELECT, INSERT, TRUNCATE ON public._junction_stage_rc TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_reload_junctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ci_count int; cr_count int; rc_count int; prim_count int;
BEGIN
  TRUNCATE public.control_iso, public.control_risk, public.risk_control;

  INSERT INTO public.control_iso(framework, control_id, iso_id)
  SELECT DISTINCT framework, control_id, iso_id FROM public._junction_stage_ci
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS ci_count = ROW_COUNT;

  INSERT INTO public.control_risk(framework, control_id, risk_id, link_typ)
  SELECT DISTINCT ON (framework, control_id, risk_id) framework, control_id, risk_id, link_typ
  FROM public._junction_stage_cr
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS cr_count = ROW_COUNT;

  INSERT INTO public.risk_control(risk_id, framework, control_id, tier)
  SELECT DISTINCT ON (risk_id, framework, control_id) risk_id, framework, control_id, tier
  FROM public._junction_stage_rc
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS rc_count = ROW_COUNT;

  UPDATE public.risk_control rc SET is_primary = true
  FROM public.risks r
  WHERE r.risk_id = rc.risk_id AND r.primary_control_id = rc.control_id;
  GET DIAGNOSTICS prim_count = ROW_COUNT;

  TRUNCATE public._junction_stage_ci, public._junction_stage_cr, public._junction_stage_rc;

  RETURN jsonb_build_object('control_iso', ci_count, 'control_risk', cr_count, 'risk_control', rc_count, 'is_primary', prim_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reload_junctions() TO service_role;
