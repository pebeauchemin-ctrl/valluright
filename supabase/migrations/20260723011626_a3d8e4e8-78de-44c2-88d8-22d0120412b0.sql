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
      and (
        (_entitlement = 'buyer_teaser_public' and s.plan in ('exit-ready', 'advisor-partner'))
        or (_entitlement = 'data_room' and s.plan in ('exit-ready', 'advisor-partner'))
        or (_entitlement = 'advisor_review' and s.plan in ('exit-ready', 'advisor-partner'))
      )
  )
$$;

drop policy if exists "owners upload to own data room" on storage.objects;
drop policy if exists "owners update own data room" on storage.objects;

create policy "owners upload to entitled data room"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'data-room'
    and public.current_user_has_plan_entitlement('data_room')
    and public.user_owns_business_path(name)
  );

create policy "owners update entitled data room"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'data-room'
    and public.current_user_has_plan_entitlement('data_room')
    and public.user_owns_business_path(name)
  )
  with check (
    bucket_id = 'data-room'
    and public.current_user_has_plan_entitlement('data_room')
    and public.user_owns_business_path(name)
  );

create or replace function public.enforce_buyer_teaser_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_published and not public.current_user_has_plan_entitlement('buyer_teaser_public') then
    raise exception 'Publishing a buyer teaser requires an active Exit Ready or Advisor Partner plan.';
  end if;
  return new;
end;
$$;

drop trigger if exists buyer_teaser_requires_paid_plan on public.buyer_view_settings;
create trigger buyer_teaser_requires_paid_plan
  before insert or update of is_published on public.buyer_view_settings
  for each row execute procedure public.enforce_buyer_teaser_entitlement();

create or replace function public.enforce_data_room_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_has_plan_entitlement('data_room') then
    raise exception 'The data room requires an active Exit Ready or Advisor Partner plan.';
  end if;
  return new;
end;
$$;

drop trigger if exists data_room_requires_paid_plan on public.data_room_files;
create trigger data_room_requires_paid_plan
  before insert or update on public.data_room_files
  for each row execute procedure public.enforce_data_room_entitlement();

notify pgrst, 'reload schema';

commit;