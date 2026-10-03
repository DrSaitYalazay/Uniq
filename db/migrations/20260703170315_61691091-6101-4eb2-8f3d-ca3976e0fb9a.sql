
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  risk_id text NOT NULL,
  control_id text NOT NULL,
  owner_id text,
  start_date date,
  due_date date,
  effort_pt numeric(6,2),
  phase_override text CHECK (phase_override IN ('now','next','later')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, risk_id, control_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmap_items TO authenticated;
GRANT ALL ON public.roadmap_items TO service_role;

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roadmap_items self select"
  ON public.roadmap_items FOR SELECT TO authenticated
  USING (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "roadmap_items self insert"
  ON public.roadmap_items FOR INSERT TO authenticated
  WITH CHECK (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "roadmap_items self update"
  ON public.roadmap_items FOR UPDATE TO authenticated
  USING (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "roadmap_items self delete"
  ON public.roadmap_items FOR DELETE TO authenticated
  USING (user_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE TRIGGER roadmap_items_set_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER roadmap_items_rewrite_user_id
  BEFORE INSERT ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.rewrite_user_id_to_org_owner();

CREATE INDEX roadmap_items_user_risk_idx ON public.roadmap_items (user_id, risk_id);
CREATE INDEX roadmap_items_owner_idx ON public.roadmap_items (owner_id) WHERE owner_id IS NOT NULL;
