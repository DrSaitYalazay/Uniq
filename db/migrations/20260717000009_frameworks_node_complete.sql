-- ============================================================
-- Item 07 (Prep): Flag frameworks.node_complete.
-- true = alle Kontrollen des Frameworks sind ueber Knoten/control_mapping
-- abgebildet -> control_iso-Fallback fuer dieses Framework abschaltbar.
-- DEFAULT false => VERHALTENSNEUTRAL (Fallback bleibt ueberall aktiv).
-- Das scharfe Fallback-Gate in useAssessment folgt separat (Dr.-Sait-Abnahme).
-- ============================================================
ALTER TABLE public.frameworks
  ADD COLUMN IF NOT EXISTS node_complete boolean NOT NULL DEFAULT false;
