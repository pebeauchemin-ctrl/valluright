GRANT SELECT ON public.industry_multiple_assumptions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.industry_multiple_assumptions TO authenticated;
GRANT ALL ON public.industry_multiple_assumptions TO service_role;
NOTIFY pgrst, 'reload schema';