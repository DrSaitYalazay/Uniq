GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_assessment_answers TO authenticated;
GRANT ALL ON public.org_assessment_answers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_assessment_answers TO authenticated;
GRANT ALL ON public.class_assessment_answers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.assessment_answers TO authenticated;
GRANT ALL ON public.assessment_answers TO service_role;