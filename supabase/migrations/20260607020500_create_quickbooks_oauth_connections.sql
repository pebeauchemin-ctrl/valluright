-- REB-18: QuickBooks Online OAuth connection storage.

create table if not exists public.quickbooks_oauth_states (
  state text primary key,
  user_id uuid not null,
  business_id uuid,
  redirect_uri text not null,
  created_at timestamptz not null default now()
);

alter table public.quickbooks_oauth_states enable row level security;

drop policy if exists "users manage own quickbooks oauth states" on public.quickbooks_oauth_states;
create policy "users manage own quickbooks oauth states"
  on public.quickbooks_oauth_states
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.quickbooks_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid,
  user_id uuid not null,
  realm_id text not null,
  company_name text,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists quickbooks_connections_business_realm_idx
  on public.quickbooks_connections (business_id, realm_id)
  where business_id is not null;

create index if not exists quickbooks_connections_user_idx
  on public.quickbooks_connections (user_id);

alter table public.quickbooks_connections enable row level security;

drop policy if exists "users manage own quickbooks connections" on public.quickbooks_connections;
create policy "users manage own quickbooks connections"
  on public.quickbooks_connections
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on public.quickbooks_connections from anon, authenticated;
grant select (
  id,
  business_id,
  user_id,
  realm_id,
  company_name,
  expires_at,
  scope,
  last_synced_at,
  created_at,
  updated_at
) on public.quickbooks_connections to authenticated;

drop trigger if exists quickbooks_connections_updated_at on public.quickbooks_connections;
create trigger quickbooks_connections_updated_at
  before update on public.quickbooks_connections
  for each row execute function public.touch_updated_at();
