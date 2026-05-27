-- REB-44 follow-up: make Data Room storage ownership checks robust.
--
-- Storage policies run in the storage schema and need to evaluate ownership
-- consistently while inserting storage.objects. Keep object paths as:
--   <business_id>/<timestamp>-<filename>
-- and check ownership through a narrow security-definer helper.

begin;

create or replace function public.user_owns_business_path(_business_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id::text = _business_id
      and b.owner_id = auth.uid()
  )
$$;

revoke all on function public.user_owns_business_path(text) from public;
grant execute on function public.user_owns_business_path(text) to authenticated;

drop policy if exists "owners upload to own data room" on storage.objects;
drop policy if exists "owners read own data room" on storage.objects;
drop policy if exists "owners delete own data room" on storage.objects;

create policy "owners upload to own data room"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'data-room'
    and public.user_owns_business_path(split_part(name, '/', 1))
  );

create policy "owners read own data room"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'data-room'
    and public.user_owns_business_path(split_part(name, '/', 1))
  );

create policy "owners delete own data room"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'data-room'
    and public.user_owns_business_path(split_part(name, '/', 1))
  );

comment on function public.user_owns_business_path(text) is
  'Checks whether the current authenticated user owns the business id used as the first data-room storage path segment.';

commit;
