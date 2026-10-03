-- ============================================================
-- Kontroll-Knoten (same-as) — DDL als versionierte Migration.
-- Zuvor lag die DDL am Ende von db/seeds/overrides.sql; hier nach
-- der controls-Tabelle (Migration 20260702205212) kanonisch verankert,
-- damit Fresh-Installs nicht von Seed-Reihenfolge abhaengen.
-- Die DATEN (TRUNCATE + INSERT) bleiben in overrides.sql (nach den
-- controls-INSERTs, FK-sicher).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.control_node (
  node_id    text PRIMARY KEY,
  label      text,
  meta       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.control_node_member (
  node_id    text NOT NULL REFERENCES public.control_node(node_id) ON DELETE CASCADE,
  framework  text NOT NULL,
  control_id text NOT NULL,
  PRIMARY KEY (framework, control_id),
  FOREIGN KEY (framework, control_id) REFERENCES public.controls(framework, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS control_node_member_node_idx ON public.control_node_member (node_id);

GRANT SELECT ON public.control_node TO authenticated; GRANT ALL ON public.control_node TO service_role;
GRANT SELECT ON public.control_node_member TO authenticated; GRANT ALL ON public.control_node_member TO service_role;

ALTER TABLE public.control_node ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_node_member ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS control_node_read ON public.control_node;
CREATE POLICY control_node_read ON public.control_node FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS control_node_member_read ON public.control_node_member;
CREATE POLICY control_node_member_read ON public.control_node_member FOR SELECT TO authenticated USING (true);
