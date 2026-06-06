-- REB-50: Set fixed search_path on database functions.
--
-- The SECURITY DEFINER functions already set search_path in prior hardening
-- migrations. This migration fixes the remaining ordinary helper functions so
-- Supabase no longer reports mutable function search paths.

begin;

create or replace function public.revenue_band(_revenue numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when _revenue is null or _revenue <= 0 then null
    when _revenue < 500000 then 'Under $500K'
    when _revenue < 1000000 then '$500K - $1M'
    when _revenue < 2500000 then '$1M - $2.5M'
    when _revenue < 5000000 then '$2.5M - $5M'
    when _revenue < 10000000 then '$5M - $10M'
    else '$10M+'
  end
$$;

comment on function public.revenue_band(numeric) is
  'Classifies public teaser revenue into buyer-safe bands. Fixed search_path prevents mutable-path linter warnings.';

create or replace function public.advisor_permission_rank(_permission_level text)
returns int
language sql
immutable
set search_path = public
as $$
  select case _permission_level
    when 'view_only' then 10
    when 'comment' then 20
    when 'edit_assumptions' then 30
    when 'approve' then 40
    else 0
  end
$$;

comment on function public.advisor_permission_rank(text) is
  'Ranks advisor permission strings for advisor RLS helpers. Fixed search_path prevents mutable-path linter warnings.';

commit;
