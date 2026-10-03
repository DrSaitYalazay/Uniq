
-- Add average market PT (person-days) to every control
ALTER TABLE public.controls
  ADD COLUMN IF NOT EXISTS effort_pt numeric(5,1);

COMMENT ON COLUMN public.controls.effort_pt IS
  'Average market person-days to implement this control from scratch (medium-sized org, 100-500 employees). Derived from framework baseline, MUSS/SOLLTE/KANN weight, and sub-control status.';

-- Populate with heuristic baseline for every existing row.
-- Rule: sub-controls (parent_id) or KANN → 2 PT floor.
-- Otherwise: framework base ± MUSS/SOLLTE modifier.
UPDATE public.controls SET effort_pt = GREATEST(1, ROUND(
  CASE
    WHEN meta ? 'parent_id' THEN 2
    WHEN muss = 'KANN'      THEN 2
    ELSE
      CASE framework
        WHEN 'ISO27001'    THEN 6
        WHEN 'NIS2'        THEN 6
        WHEN 'BCM22301'    THEN 6
        WHEN 'NIST_CSF'    THEN 5
        WHEN 'DORA'        THEN 5
        WHEN 'CRA'         THEN 5
        WHEN 'MaRisk'      THEN 5
        WHEN 'BSI200_4'    THEN 5
        WHEN 'KRITIS'      THEN 5
        WHEN 'AIACT'       THEN 5
        WHEN 'ISO42001'    THEN 5
        WHEN 'ISO27701'    THEN 5
        WHEN 'NIST_AI_RMF' THEN 5
        WHEN 'TISAX'       THEN 5
        WHEN 'GDPR'        THEN 4
        WHEN 'BSI'         THEN 4
        ELSE 4
      END
      + CASE muss
          WHEN 'MUSS'   THEN 1
          WHEN 'SOLLTE' THEN 0
          ELSE 0
        END
  END
)::numeric);

-- Default for future inserts so new controls always carry a PT
ALTER TABLE public.controls
  ALTER COLUMN effort_pt SET DEFAULT 5;
