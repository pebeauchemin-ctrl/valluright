begin;

alter table public.valuation_method_results
  add column if not exists weight numeric,
  add column if not exists details jsonb;

comment on column public.valuation_method_results.weight is
  'Normalized blend weight used in the saved valuation snapshot.';

comment on column public.valuation_method_results.details is
  'Method-specific inputs, source, confidence, formula, and review notes saved with the valuation snapshot.';

notify pgrst, 'reload schema';

commit;
