-- REB-92: Transactional buyer-lead notifications and unread workflow.
--
-- Buyer lead data remains owner-scoped. These fields track delivery and review
-- state without exposing buyer PII to the public teaser.

begin;

alter table public.buyer_access_requests
  add column if not exists reviewed_at timestamptz,
  add column if not exists owner_notified_at timestamptz,
  add column if not exists buyer_acknowledged_at timestamptz,
  add column if not exists notification_last_error text;

create index if not exists buyer_access_requests_unread_by_business_idx
  on public.buyer_access_requests (business_id, created_at desc)
  where reviewed_at is null and status = 'pending';

create or replace function public.mark_buyer_access_requests_reviewed(_business_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated integer;
begin
  update public.buyer_access_requests r
  set reviewed_at = now()
  from public.businesses b
  where r.business_id = _business_id
    and b.id = r.business_id
    and b.owner_id = auth.uid()
    and r.reviewed_at is null;

  get diagnostics _updated = row_count;
  return _updated;
end;
$$;

revoke all on function public.mark_buyer_access_requests_reviewed(uuid) from public;
grant execute on function public.mark_buyer_access_requests_reviewed(uuid) to authenticated;

comment on function public.mark_buyer_access_requests_reviewed(uuid) is
  'Owner-only RPC that marks all buyer leads for one business as reviewed after the Buyer Leads page is opened.';

commit;
