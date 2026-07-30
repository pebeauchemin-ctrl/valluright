update public.subscriptions
set plan = 'exit-ready',
    updated_at = now()
where plan = 'advisor-partner';

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
      and s.current_period_end > now() - interval '1 hour'
      and (
        (_entitlement = 'accounting_import' and s.plan in ('essentials', 'exit-ready'))
        or (_entitlement = 'buyer_teaser_public' and s.plan = 'exit-ready')
        or (_entitlement = 'data_room' and s.plan = 'exit-ready')
        or (_entitlement = 'advisor_review' and s.plan = 'exit-ready')
      )
  )
$$;

create or replace function public.enforce_buyer_teaser_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_published and not public.current_user_has_plan_entitlement('buyer_teaser_public') then
    raise exception 'Publishing a buyer teaser requires an active Exit Ready plan.';
  end if;
  return new;
end;
$$;

create or replace function public.enforce_data_room_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_plan_entitlement('data_room') then
    raise exception 'The data room requires an active Exit Ready plan.';
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';