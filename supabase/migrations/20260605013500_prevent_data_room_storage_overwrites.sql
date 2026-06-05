-- REB-47: Prevent data-room storage overwrites by path guessing.
--
-- Data-room object paths are:
--   <business_id>/<timestamp>-<filename>
--
-- Inserts, reads, and deletes were already scoped through
-- user_owns_business_path(name). This migration adds the missing update policy
-- so a signed-in user cannot overwrite an existing object for another business
-- even if they know the object path. The WITH CHECK clause also prevents moving
-- an owned object into another business path.

begin;

insert into storage.buckets (id, name, public)
values ('data-room', 'data-room', false)
on conflict (id) do update
set public = false;

drop policy if exists "owners update own data room" on storage.objects;

create policy "owners update own data room"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'data-room'
    and public.user_owns_business_path(name)
  )
  with check (
    bucket_id = 'data-room'
    and public.user_owns_business_path(name)
  );

comment on policy "owners update own data room" on storage.objects is
  'Allows overwrites only when the existing and resulting data-room object path belongs to the authenticated owner.';

commit;
