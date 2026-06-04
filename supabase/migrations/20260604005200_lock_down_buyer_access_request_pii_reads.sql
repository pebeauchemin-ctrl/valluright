-- REB-46: Lock down buyer access request PII reads.
--
-- Buyer lead submissions stay public only through submit_buyer_access_request().
-- Direct table access is limited to authenticated owners reading or updating
-- requests for their own businesses.

begin;

alter table public.buyer_access_requests enable row level security;

revoke all on table public.buyer_access_requests from anon;
revoke all on table public.buyer_access_requests from authenticated;

grant select, update on table public.buyer_access_requests to authenticated;

drop policy if exists "anyone can submit access request" on public.buyer_access_requests;
drop policy if exists "anyone can request access to published business" on public.buyer_access_requests;
drop policy if exists "owners view own access requests" on public.buyer_access_requests;
drop policy if exists "owners update own access requests" on public.buyer_access_requests;

create policy "owners can read own buyer access requests"
  on public.buyer_access_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = buyer_access_requests.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "owners can update own buyer access requests"
  on public.buyer_access_requests
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = buyer_access_requests.business_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = buyer_access_requests.business_id
        and b.owner_id = auth.uid()
    )
  );

comment on table public.buyer_access_requests is
  'Buyer lead PII is owner-scoped. Anon users submit only through submit_buyer_access_request() and cannot read rows directly.';

commit;
