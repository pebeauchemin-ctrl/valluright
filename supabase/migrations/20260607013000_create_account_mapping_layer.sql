-- REB-20: persist accounting account mappings per business/import source.

create table if not exists public.account_mappings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_system text not null check (source_system in ('xero', 'quickbooks', 'csv', 'manual')),
  source_account_id text,
  source_account_name text not null,
  source_account_type text,
  normalized_field text not null check (
    normalized_field in (
      'revenue',
      'cogs',
      'payroll',
      'rent',
      'marketing',
      'insurance',
      'utilities',
      'other_operating_expenses',
      'owner_salary',
      'addbacks',
      'interest',
      'income_taxes',
      'depreciation',
      'amortization',
      'net_income',
      'assets',
      'liabilities',
      'debt',
      'ignore',
      'unmapped'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, source_system, source_account_name)
);

create index if not exists account_mappings_business_id_idx
  on public.account_mappings (business_id);

alter table public.account_mappings enable row level security;

drop policy if exists "owners manage own account mappings" on public.account_mappings;
create policy "owners manage own account mappings"
  on public.account_mappings for all to authenticated
  using (exists (
    select 1
    from public.businesses b
    where b.id = account_mappings.business_id
      and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.businesses b
    where b.id = account_mappings.business_id
      and b.owner_id = auth.uid()
  ));

revoke all on public.account_mappings from anon, authenticated;
grant select, insert, update, delete on public.account_mappings to authenticated;

drop trigger if exists account_mappings_updated_at on public.account_mappings;
create trigger account_mappings_updated_at
  before update on public.account_mappings
  for each row execute function public.touch_updated_at();
