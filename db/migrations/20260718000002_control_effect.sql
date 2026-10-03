-- ============================================================
-- control_effect (ENGINE_ARCHITECTURE_MARKETGRADE E2): GLOBAL Katalog-Layer.
-- Design-Wirksamkeit je Kontrolle (base_eff) + Wirkdimension + Art.
-- Read-only fuer authenticated (wie controls). Zeilen OPTIONAL: fehlt eine Zeile,
-- nutzt die Engine base_eff=0.5 / dimension='likelihood' / kind='preventive'.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.control_effect (
  framework  text NOT NULL,
  control_id text NOT NULL,
  dimension  text NOT NULL DEFAULT 'likelihood' CHECK (dimension IN ('likelihood','impact','both')),
  kind       text NOT NULL DEFAULT 'preventive' CHECK (kind IN ('preventive','detective','corrective')),
  base_eff   numeric NOT NULL DEFAULT 0.5 CHECK (base_eff BETWEEN 0 AND 1),
  PRIMARY KEY (framework, control_id),
  FOREIGN KEY (framework, control_id) REFERENCES public.controls(framework, id) ON DELETE CASCADE
);
GRANT SELECT ON public.control_effect TO authenticated;
GRANT ALL ON public.control_effect TO service_role;
ALTER TABLE public.control_effect ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS control_effect_read ON public.control_effect;
CREATE POLICY control_effect_read ON public.control_effect FOR SELECT TO authenticated USING (true);
