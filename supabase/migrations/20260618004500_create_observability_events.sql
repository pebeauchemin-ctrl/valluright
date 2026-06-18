create table if not exists public.app_observability_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null,
  business_id uuid references public.businesses(id) on delete set null,
  event_name text not null,
  severity text not null default 'info' check (severity in ('info', 'warn', 'error', 'critical')),
  area text not null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  alert_required boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists app_observability_events_business_created_idx
  on public.app_observability_events(business_id, created_at desc);

create index if not exists app_observability_events_actor_created_idx
  on public.app_observability_events(actor_user_id, created_at desc);

create index if not exists app_observability_events_severity_created_idx
  on public.app_observability_events(severity, created_at desc);

alter table public.app_observability_events enable row level security;

drop policy if exists "owners read own app observability events" on public.app_observability_events;
create policy "owners read own app observability events"
  on public.app_observability_events for select to authenticated
  using (
    actor_user_id = auth.uid()
    or exists (
      select 1
      from public.businesses b
      where b.id = app_observability_events.business_id
        and b.owner_id = auth.uid()
    )
  );

revoke all on public.app_observability_events from anon, authenticated;
grant select on public.app_observability_events to authenticated;
grant all on public.app_observability_events to service_role;

comment on table public.app_observability_events is
  'Safe product observability events for debugging activation, imports, reports, buyer leads, and runtime failures. Metadata must not include sensitive financial values, buyer PII, uploaded file contents, or OAuth tokens.';

comment on column public.app_observability_events.alert_required is
  'True for critical failures so the event stream can be used as an actionable alert queue.';

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

  insert into public.app_observability_events (
    business_id,
    event_name,
    severity,
    area,
    target_type,
    target_id,
    metadata
  )
  values (
    _business_id,
    'buyer_lead_submitted',
    'info',
    'buyer',
    'buyer_access_request',
    _request.id::text,
    jsonb_build_object(
      'buyer_type', _buyer_type,
      'financing_status', _financing_status,
      'status', _request.status
    )
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

  insert into public.app_observability_events (
    actor_user_id,
    business_id,
    event_name,
    severity,
    area,
    target_type,
    target_id,
    metadata
  )
  values (
    auth.uid(),
    _request.business_id,
    'buyer_lead_status_updated',
    'info',
    'buyer',
    'buyer_access_request',
    _request.id::text,
    jsonb_build_object(
      'from_status', _old_status,
      'to_status', _status,
      'has_note', nullif(trim(_note), '') is not null
    )
  );

  return _request;
end;
$$;

notify pgrst, 'reload schema';
