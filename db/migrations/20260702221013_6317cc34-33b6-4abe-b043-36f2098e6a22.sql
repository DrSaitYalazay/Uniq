
-- Remove GoBD from framework catalog
DELETE FROM public.frameworks WHERE code = 'GoBD';

-- Clean up any company profiles that had GoBD enabled
UPDATE public.company_profiles
SET enabled_frameworks = array_remove(enabled_frameworks, 'GoBD')
WHERE 'GoBD' = ANY(enabled_frameworks);
