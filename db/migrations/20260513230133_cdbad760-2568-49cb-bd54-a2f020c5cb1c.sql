-- Add zok_ids array column to assets (BSI Grundschutz++ Zielobjektkategorien)
-- Keeps asset_type for backwards compatibility during PR-1; will be dropped in a later PR.

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS zok_ids text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill zok_ids from legacy asset_type (deterministic mapping mirrors
-- LEGACY_ASSET_TYPE_TO_ZOK in src/data/zielobjektkategorien.ts)
UPDATE public.assets
SET zok_ids = CASE asset_type
  WHEN 'Application'    THEN ARRAY['webanwendungen']
  WHEN 'Server'         THEN ARRAY['hostsysteme']
  WHEN 'Database'       THEN ARRAY['daten']
  WHEN 'Cloud'          THEN ARRAY['hostsysteme']
  WHEN 'Network'        THEN ARRAY['netze_intern']
  WHEN 'OT/ICS'         THEN ARRAY['hostsysteme']
  WHEN 'External'       THEN ARRAY['netze_extern']
  WHEN 'Endpoint'       THEN ARRAY['endgeraete']
  WHEN 'Mobile Device'  THEN ARRAY['mobiltelefone']
  WHEN 'IoT'            THEN ARRAY['endgeraete']
  WHEN 'Security Tool'  THEN ARRAY['anwendungen']
  ELSE ARRAY['it_systeme']
END
WHERE cardinality(zok_ids) = 0;

CREATE INDEX IF NOT EXISTS idx_assets_zok_ids ON public.assets USING gin (zok_ids);