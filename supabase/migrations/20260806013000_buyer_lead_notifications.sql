-- REB-92: Transactional buyer-lead notifications and unread workflow.
--
-- Buyer lead data remains owner-scoped. A random delivery token is returned only
-- to the browser that created a lead, allowing that browser to trigger the
-- one-time transactional notifications without exposing a public email endpoint.

begin;

alter table public.buyer_access_requests
  add column if not exists reviewed_at timestamptz,
  add column if not exists owner_notified_at timestamptz,
  add column if not exists buyer_acknowledged_at timestamptz,
  add column if not exists notification_last_error text,
  add column if not exists notification_token uuid not null default gen_random_uuid();

create unique index if not exists buyer_access_requests_notification_token_key
  on public.buyer_access_requests (notification_token);

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

-- The existing function returns a UUID. PostgreSQL requires a drop/recreate
-- before changing that return type to the request ID plus its delivery token.
drop function if exists public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
);

create function public.submit_buyer_access_request(
  _public_id text,
  _name text,
  _email text,
  _phone text default null,
  _buyer_type public.buyer_type default null,
  _financing_status public.financing_status default null,
  _message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _business_id uuid;
  _request public.buyer_access_requests;
  _normalized_email text := lower(nullif(trim(_email), ''));
begin
  if nullif(trim(_name), '') is null then
    raise exception 'Name is required' using errcode = '22023';
  end if;

  if _normalized_email is null or position('@' in _normalized_email) = 0 then
    raise exception 'Valid email is required' using errcode = '22023';
  end if;

  select b.id
    into _business_id
  from public.businesses b
  join public.buyer_view_settings s on s.business_id = b.id
  where b.public_id = _public_id
    and s.is_published = true
  limit 1;

  if _business_id is null then
    raise exception 'Listing not available' using errcode = 'P0002';
  end if;

  if (
    select count(*)
    from public.buyer_access_requests r
    where r.business_id = _business_id
      and lower(r.email) = _normalized_email
      and r.created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Too many requests. Please try again later.' using errcode = 'P0001';
  end if;

  insert into public.buyer_access_requests (
    business_id,
    name,
    email,
    phone,
    buyer_type,
    financing_status,
    message
  )
  values (
    _business_id,
    nullif(trim(_name), ''),
    _normalized_email,
    nullif(trim(_phone), ''),
    _buyer_type,
    _financing_status,
    nullif(trim(_message), '')
  )
  returning * into _request;

  insert into public.buyer_access_request_events (
    request_id,
    business_id,
    actor_id,
    from_status,
    to_status,
    note
  )
  values (
    _request.id,
    _business_id,
    null,
    null,
    _request.status,
    'Buyer submitted access request.'
  );

  return jsonb_build_object(
    'request_id', _request.id,
    'notification_token', _request.notification_token
  );
end;
$$;

revoke all on function public.mark_buyer_access_requests_reviewed(uuid) from public;
grant execute on function public.mark_buyer_access_requests_reviewed(uuid) to authenticated;

revoke all on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) from public;
grant execute on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) to anon, authenticated;

comment on function public.mark_buyer_access_requests_reviewed(uuid) is
  'Owner-only RPC that marks all buyer leads for one business as reviewed after the Buyer Leads page is opened.';

comment on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) is
  'Intentional public SECURITY DEFINER RPC. Creates rate-limited buyer leads for published teasers and returns a one-time notification token to the submitting browser.';
commit;
