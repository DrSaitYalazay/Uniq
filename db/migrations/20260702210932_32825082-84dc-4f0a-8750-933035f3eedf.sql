
ALTER TABLE public._junction_stage_rc ADD COLUMN IF NOT EXISTS link_typ text;
GRANT UPDATE ON public._junction_stage_rc TO authenticated, service_role;

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
  WHERE (framework, control_id) IN (SELECT framework, id FROM public.controls)
    AND iso_id IN (SELECT id FROM public.iso_canonical)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS ci_count = ROW_COUNT;

  INSERT INTO public.control_risk(framework, control_id, risk_id, link_typ)
  SELECT DISTINCT ON (framework, control_id, risk_id) framework, control_id, risk_id, link_typ
  FROM public._junction_stage_cr
  WHERE (framework, control_id) IN (SELECT framework, id FROM public.controls)
    AND risk_id IN (SELECT risk_id FROM public.risks)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS cr_count = ROW_COUNT;

  INSERT INTO public.risk_control(risk_id, framework, control_id, tier)
  SELECT DISTINCT ON (risk_id, framework, control_id)
    risk_id,
    regexp_replace(framework, '-v[0-9]+$', '') AS framework,
    control_id,
    tier
  FROM public._junction_stage_rc s
  WHERE (regexp_replace(s.framework, '-v[0-9]+$', ''), s.control_id)
        IN (SELECT framework, id FROM public.controls)
    AND s.risk_id IN (SELECT risk_id FROM public.risks)
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
