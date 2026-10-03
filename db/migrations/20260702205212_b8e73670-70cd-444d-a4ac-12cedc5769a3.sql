
-- 1) FRAMEWORKS
CREATE TABLE public.frameworks (
  code text PRIMARY KEY,
  name_de text NOT NULL,
  name_en text NOT NULL,
  role text NOT NULL CHECK (role IN ('hub','risk_anchor','spoke','benchmark','delta')),
  uses_maturity boolean NOT NULL DEFAULT false,
  color text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.frameworks TO anon, authenticated;
GRANT ALL    ON public.frameworks TO service_role;
ALTER TABLE public.frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "frameworks_readable_all"
  ON public.frameworks FOR SELECT USING (true);

-- 2) CONTROLS (union of all frameworks; composite PK)
CREATE TABLE public.controls (
  framework  text NOT NULL REFERENCES public.frameworks(code) ON DELETE CASCADE,
  id         text NOT NULL,
  sub_sector text,
  req_de     text NOT NULL,
  req_en     text,
  muss       text,
  source     text,
  meta       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (framework, id)
);
CREATE INDEX controls_framework_idx  ON public.controls (framework);
CREATE INDEX controls_sub_sector_idx ON public.controls (sub_sector) WHERE sub_sector IS NOT NULL;
GRANT SELECT ON public.controls TO authenticated;
GRANT ALL    ON public.controls TO service_role;
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "controls_readable_authenticated"
  ON public.controls FOR SELECT TO authenticated USING (true);

-- 3) ISO CANONICAL HUB (417)
CREATE TABLE public.iso_canonical (
  id         text PRIMARY KEY,
  clause_ref text,
  thema      text,
  de         text NOT NULL,
  en         text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.iso_canonical TO authenticated;
GRANT ALL    ON public.iso_canonical TO service_role;
ALTER TABLE public.iso_canonical ENABLE ROW LEVEL SECURITY;
CREATE POLICY "iso_canonical_readable_authenticated"
  ON public.iso_canonical FOR SELECT TO authenticated USING (true);

-- 4) RISKS (661)
CREATE TABLE public.risks (
  risk_id                  text PRIMARY KEY,
  quelle                   text NOT NULL,
  bsi_ref                  text,
  iso_anchor               text[] NOT NULL DEFAULT '{}',
  text_de                  text NOT NULL,
  text_en                  text,
  stufe                    text,
  typ                      text,
  status                   text NOT NULL DEFAULT 'active',
  primary_control_framework text,
  primary_control_id        text,
  meta                     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at               timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (primary_control_framework, primary_control_id)
    REFERENCES public.controls(framework, id) ON DELETE SET NULL
);
CREATE INDEX risks_status_idx ON public.risks (status);
GRANT SELECT ON public.risks TO authenticated;
GRANT ALL    ON public.risks TO service_role;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risks_readable_authenticated"
  ON public.risks FOR SELECT TO authenticated USING (true);

-- 5) CONTROL <-> ISO junction (~9.649)
CREATE TABLE public.control_iso (
  framework  text NOT NULL,
  control_id text NOT NULL,
  iso_id     text NOT NULL REFERENCES public.iso_canonical(id) ON DELETE CASCADE,
  PRIMARY KEY (framework, control_id, iso_id),
  FOREIGN KEY (framework, control_id)
    REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
CREATE INDEX control_iso_iso_idx ON public.control_iso (iso_id);
GRANT SELECT ON public.control_iso TO authenticated;
GRANT ALL    ON public.control_iso TO service_role;
ALTER TABLE public.control_iso ENABLE ROW LEVEL SECURITY;
CREATE POLICY "control_iso_readable_authenticated"
  ON public.control_iso FOR SELECT TO authenticated USING (true);

-- 6) CONTROL -> RISK (Gap direction, ~24.819)
CREATE TABLE public.control_risk (
  framework  text NOT NULL,
  control_id text NOT NULL,
  risk_id    text NOT NULL REFERENCES public.risks(risk_id) ON DELETE CASCADE,
  link_typ   text,
  PRIMARY KEY (framework, control_id, risk_id),
  FOREIGN KEY (framework, control_id)
    REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
CREATE INDEX control_risk_risk_idx ON public.control_risk (risk_id);
GRANT SELECT ON public.control_risk TO authenticated;
GRANT ALL    ON public.control_risk TO service_role;
ALTER TABLE public.control_risk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "control_risk_readable_authenticated"
  ON public.control_risk FOR SELECT TO authenticated USING (true);

-- 7) RISK -> CONTROL (Risk-analysis direction, ~25.194)
CREATE TABLE public.risk_control (
  risk_id    text NOT NULL REFERENCES public.risks(risk_id) ON DELETE CASCADE,
  framework  text NOT NULL,
  control_id text NOT NULL,
  tier       text NOT NULL CHECK (tier IN ('direkt','framework','weitere')),
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (risk_id, framework, control_id),
  FOREIGN KEY (framework, control_id)
    REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
CREATE INDEX risk_control_ctrl_idx ON public.risk_control (framework, control_id);
GRANT SELECT ON public.risk_control TO authenticated;
GRANT ALL    ON public.risk_control TO service_role;
ALTER TABLE public.risk_control ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_control_readable_authenticated"
  ON public.risk_control FOR SELECT TO authenticated USING (true);

-- 8) ANSWERS (new SSOT, tenant-scoped)
CREATE TABLE public.answers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  framework  text NOT NULL,
  control_id text NOT NULL,
  antwort    text NOT NULL CHECK (antwort IN ('ja','nein','teilweise','na')),
  evidence   text,
  note       text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (tenant_id, framework, control_id),
  FOREIGN KEY (framework, control_id)
    REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
CREATE INDEX answers_tenant_fw_idx ON public.answers (tenant_id, framework);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_tenant_select"
  ON public.answers FOR SELECT TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "answers_tenant_insert"
  ON public.answers FOR INSERT TO authenticated
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "answers_tenant_update"
  ON public.answers FOR UPDATE TO authenticated
  USING      (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()))
  WITH CHECK (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE POLICY "answers_tenant_delete"
  ON public.answers FOR DELETE TO authenticated
  USING (tenant_id = COALESCE(public.get_org_owner_id(auth.uid()), auth.uid()));

CREATE TRIGGER answers_updated_at
  BEFORE UPDATE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) company_profiles: framework seçimi + KRITIS alt-sektörler
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS enabled_frameworks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kritis_sub_sectors text[] NOT NULL DEFAULT '{}';
