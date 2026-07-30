-- REB-82: record explicit marketing consent separately from transactional email.
create table if not exists public.marketing_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  marketing_unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_preferences_consent_timestamp_check
    check (
      (marketing_opt_in = false)
      or marketing_opt_in_at is not null
    )
);

create unique index if not exists marketing_preferences_unsubscribe_token_idx
  on public.marketing_preferences (unsubscribe_token);

insert into public.marketing_preferences (user_id, email)
select id, lower(email)
from auth.users
on conflict (user_id) do update
  set email = excluded.email;

alter table public.marketing_preferences enable row level security;

drop policy if exists "users view own marketing preferences" on public.marketing_preferences;
create policy "users view own marketing preferences"
  on public.marketing_preferences for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users update own marketing preferences" on public.marketing_preferences;
create policy "users update own marketing preferences"
  on public.marketing_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, update on public.marketing_preferences to authenticated;
grant all on public.marketing_preferences to service_role;

create or replace function public.unsubscribe_from_marketing(_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.marketing_preferences
  set
    marketing_opt_in = false,
    marketing_unsubscribed_at = now(),
    updated_at = now()
  where unsubscribe_token = _token;

  return found;
end;
$$;

revoke all on function public.unsubscribe_from_marketing(uuid) from public;
grant execute on function public.unsubscribe_from_marketing(uuid) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wants_marketing boolean := lower(coalesce(new.raw_user_meta_data->>'marketing_opt_in', 'false'))
    in ('true', 't', '1', 'yes', 'on');
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'owner')
  on conflict (user_id, role) do nothing;

  insert into public.marketing_preferences (
    user_id,
    email,
    marketing_opt_in,
    marketing_opt_in_at,
    marketing_unsubscribed_at
  )
  values (
    new.id,
    lower(new.email),
    wants_marketing,
    case when wants_marketing then now() else null end,
    null
  )
  on conflict (user_id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists touch_marketing_preferences on public.marketing_preferences;
create trigger touch_marketing_preferences
  before update on public.marketing_preferences
  for each row execute procedure public.touch_updated_at();

notify pgrst, 'reload schema';