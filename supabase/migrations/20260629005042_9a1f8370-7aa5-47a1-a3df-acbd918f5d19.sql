create table if not exists public.import_sync_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  source_system text not null check (source_system in ('xero', 'quickbooks', 'csv', 'xlsx')),
  status text not null check (status in ('started', 'success', 'failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  date_range_start integer null,
  date_range_end integer null,
  report_names text[] not null default '{}'::text[],
  imported_year_count integer not null default 0,
  imported_account_count integer not null default 0,
  warning_count integer not null default 0,
  warnings text[] not null default '{}'::text[],
  error_message text null,
  retry_action text null check (retry_action is null or retry_action in ('xero_import', 'quickbooks_refresh', 'file_upload')),
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists import_sync_logs_business_started_idx
  on public.import_sync_logs(business_id, started_at desc);

alter table public.import_sync_logs enable row level security;

revoke all on public.import_sync_logs from anon, authenticated;
grant select, insert, update on public.import_sync_logs to authenticated;
grant all on public.import_sync_logs to service_role;

drop policy if exists "owners read own import sync logs" on public.import_sync_logs;
create policy "owners read own import sync logs"
  on public.import_sync_logs for select to authenticated
  using (created_by = auth.uid() or exists (select 1 from public.businesses b where b.id = import_sync_logs.business_id and b.owner_id = auth.uid()));

drop policy if exists "owners insert own import sync logs" on public.import_sync_logs;
create policy "owners insert own import sync logs"
  on public.import_sync_logs for insert to authenticated
  with check (created_by = auth.uid() and exists (select 1 from public.businesses b where b.id = import_sync_logs.business_id and b.owner_id = auth.uid()));

drop policy if exists "owners update own import sync logs" on public.import_sync_logs;
create policy "owners update own import sync logs"
  on public.import_sync_logs for update to authenticated
  using (created_by = auth.uid() or exists (select 1 from public.businesses b where b.id = import_sync_logs.business_id and b.owner_id = auth.uid()))
  with check (created_by = auth.uid() or exists (select 1 from public.businesses b where b.id = import_sync_logs.business_id and b.owner_id = auth.uid()));

notify pgrst, 'reload schema';