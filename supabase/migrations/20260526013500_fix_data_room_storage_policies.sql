-- REB-44: Fix Data Room storage policies for owner uploads.
--
-- The app stores objects at:
--   <business_id>/<timestamp>-<filename>
--
-- The original storage policies compared the first path segment to auth.uid().
-- That rejects valid owner uploads because the first segment is the business id,
-- not the owner id. These policies keep the existing path format and authorize
-- access by verifying the path business belongs to the authenticated user.

begin;

insert into storage.buckets (id, name, public)
values ('data-room', 'data-room', false)
on conflict (id) do update
set public = false;

drop policy if exists "owners upload to own data room" on storage.objects;
drop policy if exists "owners read own data room" on storage.objects;
drop policy if exists "owners delete own data room" on storage.objects;

create policy "owners upload to own data room"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'data-room'
    and exists (
      select 1
      from public.businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  );

create policy "owners read own data room"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'data-room'
    and exists (
      select 1
      from public.businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  );

create policy "owners delete own data room"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'data-room'
    and exists (
      select 1
      from public.businesses b
      where b.id::text = (storage.foldername(name))[1]
        and b.owner_id = auth.uid()
    )
  );

commit;
