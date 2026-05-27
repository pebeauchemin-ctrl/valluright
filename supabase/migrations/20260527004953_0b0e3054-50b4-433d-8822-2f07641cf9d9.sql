begin;

insert into storage.buckets (id, name, public)
values ('data-room', 'data-room', false)
on conflict (id) do update
set public = false;

create or replace function public.user_owns_business_path(_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id::text = split_part(_object_name, '/', 1)
      and b.owner_id = auth.uid()
  )
$$;

revoke all on function public.user_owns_business_path(text) from public;
grant execute on function public.user_owns_business_path(text) to authenticated;
grant execute on function public.user_owns_business_path(text) to service_role;

drop policy if exists "owners upload to own data room" on storage.objects;
drop policy if exists "owners read own data room" on storage.objects;
drop policy if exists "owners delete own data room" on storage.objects;
drop policy if exists "owners update own data room" on storage.objects;

create policy "owners upload to own data room"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'data-room'
    and public.user_owns_business_path(name)
  );

create policy "owners read own data room"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'data-room'
    and public.user_owns_business_path(name)
  );

create policy "owners delete own data room"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'data-room'
    and public.user_owns_business_path(name)
  );

commit;