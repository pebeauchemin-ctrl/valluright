begin;

create or replace function public.current_user_has_plan_entitlement(_entitlement text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = auth.uid()
      and s.status in ('active', 'trialing', 'past_due')
      -- A short grace window prevents a delayed webhook from interrupting a valid renewal.
      and s.current_period_end > now() - interval '1 hour'
      and (
        (_entitlement = 'accounting_import' and s.plan in ('essentials', 'exit-ready', 'advisor-partner'))
        or (_entitlement = 'buyer_teaser_public' and s.plan in ('exit-ready', 'advisor-partner'))
        or (_entitlement = 'data_room' and s.plan in ('exit-ready', 'advisor-partner'))
        or (_entitlement = 'advisor_review' and s.plan in ('exit-ready', 'advisor-partner'))
      )
  )
$$;

notify pgrst, 'reload schema';

commit;
