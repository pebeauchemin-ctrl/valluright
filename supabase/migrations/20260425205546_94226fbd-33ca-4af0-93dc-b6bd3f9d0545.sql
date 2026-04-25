create table public.xero_oauth_states (
  state text primary key,
  user_id uuid not null,
  business_id uuid,
  redirect_uri text not null,
  created_at timestamptz not null default now()
);

alter table public.xero_oauth_states enable row level security;

create policy "users manage own xero oauth states"
  on public.xero_oauth_states
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table public.xero_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid,
  user_id uuid not null,
  tenant_id text not null,
  tenant_name text,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index xero_connections_business_tenant_idx
  on public.xero_connections (business_id, tenant_id)
  where business_id is not null;

create index xero_connections_user_idx on public.xero_connections (user_id);

alter table public.xero_connections enable row level security;

create policy "owners manage own xero connections"
  on public.xero_connections
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger xero_connections_updated_at
  before update on public.xero_connections
  for each row execute function public.touch_updated_at();