-- REB-17: track Xero import sync time for owner-visible import summaries.

alter table public.xero_connections
  add column if not exists last_synced_at timestamptz;

grant select (
  id,
  business_id,
  user_id,
  tenant_id,
  tenant_name,
  expires_at,
  scope,
  last_synced_at,
  created_at,
  updated_at
) on public.xero_connections to authenticated;

select pg_notify('pgrst', 'reload schema');
