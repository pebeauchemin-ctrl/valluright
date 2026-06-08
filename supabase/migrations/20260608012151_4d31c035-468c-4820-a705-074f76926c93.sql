-- REB-20: account mappings
create table if not exists public.account_mappings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_system text not null check (source_system in ('xero', 'quickbooks', 'csv', 'manual')),
  source_account_id text,
  source_account_name text not null,
  source_account_type text,
  normalized_field text not null check (
    normalized_field in (
      'revenue','cogs','payroll','rent','marketing','insurance','utilities',
      'other_operating_expenses','owner_salary','addbacks','interest',
      'income_taxes','depreciation','amortization','net_income','assets',
      'liabilities','debt','ignore','unmapped'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, source_system, source_account_name)
);

create index if not exists account_mappings_business_id_idx on public.account_mappings (business_id);

alter table public.account_mappings enable row level security;

drop policy if exists "owners manage own account mappings" on public.account_mappings;
create policy "owners manage own account mappings"
  on public.account_mappings for all to authenticated
  using (exists (select 1 from public.businesses b where b.id = account_mappings.business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from public.businesses b where b.id = account_mappings.business_id and b.owner_id = auth.uid()));

revoke all on public.account_mappings from anon, authenticated;
grant select, insert, update, delete on public.account_mappings to authenticated;
grant all on public.account_mappings to service_role;

drop trigger if exists account_mappings_updated_at on public.account_mappings;
create trigger account_mappings_updated_at
  before update on public.account_mappings
  for each row execute function public.touch_updated_at();

-- REB-18: QuickBooks OAuth
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
  on public.quickbooks_oauth_states for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.quickbooks_oauth_states to authenticated;
grant all on public.quickbooks_oauth_states to service_role;

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
  on public.quickbooks_connections (business_id, realm_id) where business_id is not null;
create index if not exists quickbooks_connections_user_idx on public.quickbooks_connections (user_id);

alter table public.quickbooks_connections enable row level security;

drop policy if exists "users manage own quickbooks connections" on public.quickbooks_connections;
create policy "users manage own quickbooks connections"
  on public.quickbooks_connections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.quickbooks_connections from anon, authenticated;
grant select (id, business_id, user_id, realm_id, company_name, expires_at, scope, last_synced_at, created_at, updated_at)
  on public.quickbooks_connections to authenticated;
grant all on public.quickbooks_connections to service_role;

drop trigger if exists quickbooks_connections_updated_at on public.quickbooks_connections;
create trigger quickbooks_connections_updated_at
  before update on public.quickbooks_connections
  for each row execute function public.touch_updated_at();

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';