begin;

create or replace function public.user_has_paid_workspace_plan(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = _user_id
      and s.status in ('active', 'trialing', 'past_due')
      and s.current_period_end > now() - interval '1 hour'
      and s.plan in ('essentials', 'exit-ready')
  )
$$;

revoke all on function public.user_has_paid_workspace_plan(uuid) from public;

create or replace function public.enforce_free_business_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.user_has_paid_workspace_plan(new.owner_id)
    and (select count(*) from public.businesses where owner_id = new.owner_id) >= 1 then
    raise exception 'Free Preview includes one business. Upgrade to Essentials for unlimited businesses.';
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_require_paid_plan_after_first on public.businesses;
create trigger businesses_require_paid_plan_after_first
  before insert on public.businesses
  for each row execute procedure public.enforce_free_business_limit();

create or replace function public.enforce_free_scenario_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  business_owner_id uuid;
begin
  select owner_id
    into business_owner_id
    from public.businesses
   where id = new.business_id;

  if business_owner_id is null then
    raise exception 'The business for this scenario could not be found.';
  end if;

  if not public.user_has_paid_workspace_plan(business_owner_id)
    and (select count(*) from public.scenarios where business_id = new.business_id) >= 2 then
    raise exception 'Free Preview includes two scenarios per business. Upgrade to Essentials for unlimited scenarios.';
  end if;

  return new;
end;
$$;

drop trigger if exists scenarios_require_paid_plan_after_second on public.scenarios;
create trigger scenarios_require_paid_plan_after_second
  before insert on public.scenarios
  for each row execute procedure public.enforce_free_scenario_limit();

notify pgrst, 'reload schema';

commit;
