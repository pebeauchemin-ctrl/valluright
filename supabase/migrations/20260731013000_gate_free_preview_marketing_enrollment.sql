-- REB-83: Free Preview is a marketing-supported offer. Paid plan checkout remains optional.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  wants_marketing boolean := lower(coalesce(new.raw_user_meta_data->>'marketing_opt_in', 'false'))
    in ('true', 't', '1', 'yes', 'on');
  requested_plan text := lower(trim(coalesce(new.raw_user_meta_data->>'requested_plan', '')));
begin
  -- Free Preview enrollment is the marketing-supported offer. A paid-plan signup may decline marketing.
  if not wants_marketing and requested_plan not in ('essentials', 'exit-ready') then
    raise exception 'Free Preview requires marketing enrollment. Choose a paid plan to continue without marketing emails.';
  end if;

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
    case when wants_marketing then null else now() end
  )
  on conflict (user_id) do update
    set email = excluded.email;

  return new;
end;
$$;

notify pgrst, 'reload schema';
