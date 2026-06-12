-- REB-34: Buyer access request owner workflow.
--
-- Adds owner-managed lead statuses, immutable status history, and a controlled
-- status-change RPC so lead PII remains owner-scoped.

alter type public.access_request_status add value if not exists 'more_info_requested';
alter type public.access_request_status add value if not exists 'nda_sent';

create table if not exists public.buyer_access_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.buyer_access_requests(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  from_status public.access_request_status,
  to_status public.access_request_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists buyer_access_request_events_request_id_idx
  on public.buyer_access_request_events(request_id, created_at desc);

create index if not exists buyer_access_request_events_business_id_idx
  on public.buyer_access_request_events(business_id, created_at desc);

alter table public.buyer_access_request_events enable row level security;

revoke all on table public.buyer_access_request_events from anon;
revoke all on table public.buyer_access_request_events from authenticated;
grant select on table public.buyer_access_request_events to authenticated;

insert into public.buyer_access_request_events (
  request_id,
  business_id,
  actor_id,
  from_status,
  to_status,
  note,
  created_at
)
select
  r.id,
  r.business_id,
  null,
  null,
  r.status,
  'Existing buyer request imported into status history.',
  r.created_at
from public.buyer_access_requests r
where not exists (
  select 1
  from public.buyer_access_request_events e
  where e.request_id = r.id
);

drop policy if exists "owners can read own buyer access request events"
  on public.buyer_access_request_events;

create policy "owners can read own buyer access request events"
  on public.buyer_access_request_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = buyer_access_request_events.business_id
        and b.owner_id = auth.uid()
    )
  );

create or replace function public.submit_buyer_access_request(
  _public_id text,
  _name text,
  _email text,
  _phone text default null,
  _buyer_type public.buyer_type default null,
  _financing_status public.financing_status default null,
  _message text default null
)
returns uuid
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

  return _request.id;
end;
$$;

create or replace function public.update_buyer_access_request_status(
  _request_id uuid,
  _status public.access_request_status,
  _note text default null
)
returns public.buyer_access_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  _request public.buyer_access_requests;
  _old_status public.access_request_status;
begin
  select r.*
    into _request
  from public.buyer_access_requests r
  join public.businesses b on b.id = r.business_id
  where r.id = _request_id
    and b.owner_id = auth.uid()
  for update;

  if _request.id is null then
    raise exception 'Buyer access request not found' using errcode = 'P0002';
  end if;

  _old_status := _request.status;

  update public.buyer_access_requests
  set status = _status
  where id = _request_id
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
    _request.business_id,
    auth.uid(),
    _old_status,
    _status,
    nullif(trim(_note), '')
  );

  return _request;
end;
$$;

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

revoke all on function public.update_buyer_access_request_status(
  uuid,
  public.access_request_status,
  text
) from public;
grant execute on function public.update_buyer_access_request_status(
  uuid,
  public.access_request_status,
  text
) to authenticated;

comment on table public.buyer_access_request_events is
  'Owner-scoped status history for buyer access request workflow.';

comment on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) is
  'Intentional public SECURITY DEFINER RPC. Creates buyer leads only for published teasers, rate-limits repeated submissions, and writes initial status history.';

comment on function public.update_buyer_access_request_status(
  uuid,
  public.access_request_status,
  text
) is
  'Owner-only SECURITY DEFINER RPC for buyer lead status changes with immutable history.';
