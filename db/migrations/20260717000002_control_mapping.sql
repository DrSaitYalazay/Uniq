-- ============================================================
-- control_mapping — framework-uebergreifende Relationen mit TYP + STAERKE.
-- Modell nach NIST IR 8477 / STRM (Set-Theory Relationship Mapping) und
-- OSCAL Control-Mapping-Model: nicht binaeres Match, sondern typisierte
-- Relation (equal / subset-of / superset-of / intersects-with) + Staerke 1-10.
--
-- Semantik fuer die Antwort-Projektion (assessmentEngine):
--   equal          -> volle Vererbung (wie Knoten-Mitgliedschaft)
--   subset-of      -> Quelle deckt nur Teil des Ziels  -> Teil-Projektion ("teilweise")
--   superset-of    -> Quelle deckt mehr als das Ziel    -> Teil-Projektion ("teilweise")
--   intersects-with-> teilweise Ueberschneidung          -> Teil-Projektion ("teilweise")
--
-- Ziel ist ENTWEDER ein Kontroll-Knoten (target_node_id) ODER eine
-- konkrete Kontrolle (target_framework/target_control_id) — genau eines.
-- Tabelle startet LEER -> keine Verhaltensaenderung, bis Zeilen kuratiert sind.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.control_mapping (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_framework text NOT NULL,
  source_control_id text NOT NULL,
  target_node_id   text REFERENCES public.control_node(node_id) ON DELETE CASCADE,
  target_framework text,
  target_control_id text,
  relation         text NOT NULL CHECK (relation IN ('equal','subset-of','superset-of','intersects-with')),
  strength         smallint NOT NULL DEFAULT 5 CHECK (strength BETWEEN 1 AND 10),
  rationale        text,
  source           text NOT NULL DEFAULT 'curated',
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- Quelle referenziert eine echte Kontrolle
  FOREIGN KEY (source_framework, source_control_id)
    REFERENCES public.controls(framework, id) ON DELETE CASCADE,
  -- genau ein Ziel-Typ: Knoten XOR Kontrolle
  CONSTRAINT control_mapping_target_xor CHECK (
    (target_node_id IS NOT NULL AND target_framework IS NULL AND target_control_id IS NULL)
    OR
    (target_node_id IS NULL AND target_framework IS NOT NULL AND target_control_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS control_mapping_source_idx
  ON public.control_mapping (source_framework, source_control_id);
CREATE INDEX IF NOT EXISTS control_mapping_target_node_idx
  ON public.control_mapping (target_node_id);
CREATE INDEX IF NOT EXISTS control_mapping_target_ctrl_idx
  ON public.control_mapping (target_framework, target_control_id);

GRANT SELECT ON public.control_mapping TO authenticated;
GRANT ALL ON public.control_mapping TO service_role;

ALTER TABLE public.control_mapping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS control_mapping_read ON public.control_mapping;
CREATE POLICY control_mapping_read ON public.control_mapping FOR SELECT TO authenticated USING (true);
