-- ============================================================================
-- REC-METRIC: Abkürzung MTTR in der Wiederherstellungsgröße auflösen
--
-- Das Buch „From Directive to Done" legt auf S. 201/207 fest, dass MTTR dort
-- durchgehend „mean time to remediate" bedeutet und die Wiederherstellungsgröße
-- bewusst NICHT so abgekürzt wird. Die Kontrollliste benutzte dieselbe
-- Abkürzung für „Mean Time to Recovery" — fünfmal in einer einzigen Kontrolle
-- (Titel, Erläuterung, Rechtsgrundlage, Nachweise). Beide Werke werden zusammen
-- verkauft; die Doppelbedeutung trifft den Leser genau beim Messen.
--
-- Der Inhalt bleibt unverändert: gemessen wird weiterhin die mittlere Zeit von
-- der Unterbrechung bis zur verifizierten Wiederherstellung. Nur die Benennung
-- wird ausgeschrieben, und einmal wird ausdrücklich gesagt, warum.
--
-- Umgesetzt über replace(): so bleibt die Anweisung idempotent und trifft nur
-- Text, der wirklich dasteht. Ein zweiter Lauf ändert nichts.
-- ============================================================================
UPDATE public.controls c SET
  req_de = replace(c.req_de, 'Actual Recovery Times Are Measured and Reviewed (MTTR)', 'Actual Recovery Times Are Measured and Reviewed'),
  req_en = replace(c.req_en, 'Actual Recovery Times Are Measured and Reviewed (MTTR)', 'Actual Recovery Times Are Measured and Reviewed'),
  meta = COALESCE(c.meta,'{}'::jsonb) || jsonb_build_object(
    'description', replace(replace(c.meta->>'description', 'calculate Mean Time to Recovery (MTTR) as total recovery time', 'calculate the mean recovery time as total recovery time'), 'do not require an invented average or report zero MTTR.', 'do not require an invented average or report a mean recovery time of zero. The handbook reserves the abbreviation MTTR for mean time to remediate, so this recovery-side quantity is written out rather than abbreviated.'),
    'nis2_basis',  replace(c.meta->>'nis2_basis', 'not an expressly prescribed MTTR metric', 'not an expressly prescribed mean-recovery-time metric'),
    'evidence',    replace(c.meta->>'evidence', 'reproducible MTTR calculation with sample size', 'reproducible mean-recovery-time calculation with sample size'))
WHERE c.framework = 'NIS2' AND c.id = 'REC-METRIC';
