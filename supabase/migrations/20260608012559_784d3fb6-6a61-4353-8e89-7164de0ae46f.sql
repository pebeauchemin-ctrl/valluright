create table if not exists public.security_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null,
  business_id uuid references public.businesses(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_events_actor_created_idx
  on public.security_audit_events(actor_user_id, created_at desc);
create index if not exists security_audit_events_business_created_idx
  on public.security_audit_events(business_id, created_at desc);

alter table public.security_audit_events enable row level security;

drop policy if exists "owners read own security audit events" on public.security_audit_events;
create policy "owners read own security audit events"
  on public.security_audit_events for select to authenticated
  using (
    actor_user_id = auth.uid()
    or exists (
      select 1 from public.businesses b
      where b.id = security_audit_events.business_id and b.owner_id = auth.uid()
    )
  );

revoke all on public.security_audit_events from anon, authenticated;
grant select on public.security_audit_events to authenticated;
grant all on public.security_audit_events to service_role;

drop policy if exists "owners manage own xero connections" on public.xero_connections;
drop policy if exists "owners read own xero connection metadata" on public.xero_connections;
create policy "owners read own xero connection metadata"
  on public.xero_connections for select to authenticated
  using (user_id = auth.uid());

revoke all on public.xero_connections from anon, authenticated;
grant select (id, business_id, user_id, tenant_id, tenant_name, expires_at, scope, created_at, updated_at)
  on public.xero_connections to authenticated;
grant all on public.xero_connections to service_role;

notify pgrst, 'reload schema';