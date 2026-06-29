-- Create observability events table (idempotent; companion to REB-38)
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

revoke all on public.app_observability_events from anon, authenticated;
grant select on public.app_observability_events to authenticated;
grant all on public.app_observability_events to service_role;

drop policy if exists "owners read own app observability events" on public.app_observability_events;
create policy "owners read own app observability events"
  on public.app_observability_events for select to authenticated
  using (
    actor_user_id = auth.uid()
    or exists (
      select 1 from public.businesses b
      where b.id = app_observability_events.business_id
        and b.owner_id = auth.uid()
    )
  );

comment on table public.app_observability_events is
  'Safe product observability events. Metadata must not include sensitive financial values, buyer PII, uploaded file contents, or OAuth tokens.';

-- Backfill funnel events from existing records
insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, b.id, 'signup_completed', 'info', 'auth', 'business', b.id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'profiles'),
  coalesce(p.created_at, b.created_at)
from public.businesses b
left join public.profiles p on p.id = b.owner_id
where not exists (select 1 from public.app_observability_events e where e.business_id = b.id and e.event_name = 'signup_completed');

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, b.id, 'company_created', 'info', 'activation', 'business', b.id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'businesses'), b.created_at
from public.businesses b
where not exists (select 1 from public.app_observability_events e where e.business_id = b.id and e.event_name = 'company_created');

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, f.business_id, 'financial_data_added', 'info', 'activation', 'business', f.business_id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'financial_years', 'year_count', count(*)),
  min(f.created_at)
from public.financial_years f
join public.businesses b on b.id = f.business_id
group by b.owner_id, f.business_id
having not exists (select 1 from public.app_observability_events e where e.business_id = f.business_id and e.event_name = 'financial_data_added');

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, v.business_id, 'valuation_generated', 'info', 'valuation', 'business', v.business_id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'valuations'),
  min(v.computed_at)
from public.valuations v
join public.businesses b on b.id = v.business_id
group by b.owner_id, v.business_id
having not exists (select 1 from public.app_observability_events e where e.business_id = v.business_id and e.event_name = 'valuation_generated');

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, r.business_id, 'recommendation_viewed', 'info', 'activation', 'business', r.business_id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'recommendations', 'recommendation_count', count(*)),
  min(r.created_at)
from public.recommendations r
join public.businesses b on b.id = r.business_id
group by b.owner_id, r.business_id
having not exists (select 1 from public.app_observability_events e where e.business_id = r.business_id and e.event_name = 'recommendation_viewed');

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, s.business_id, 'scenario_saved', 'info', 'activation', 'scenario', s.id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'scenarios',
    'include_in_report', s.include_in_report, 'roadmap_phase', s.roadmap_phase, 'timeline_months', s.timeline_months),
  s.created_at
from public.scenarios s
join public.businesses b on b.id = s.business_id
where not exists (select 1 from public.app_observability_events e where e.business_id = s.business_id and e.event_name = 'scenario_saved' and e.target_id = s.id::text);

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, s.business_id, 'buyer_teaser_generated', 'info', 'activation', 'buyer_teaser', b.public_id,
  jsonb_build_object('backfilled', true, 'source_table', 'buyer_view_settings',
    'published', s.is_published,
    'visible_fields_count',
      (case when s.show_revenue_chart then 1 else 0 end) +
      (case when s.show_employee_count then 1 else 0 end) +
      (case when s.show_exact_revenue then 1 else 0 end) +
      (case when s.show_profit_margin then 1 else 0 end) +
      (case when s.show_sde then 1 else 0 end) +
      (case when s.show_valuation_breakdown then 1 else 0 end) +
      (case when s.show_scenarios then 1 else 0 end) +
      (case when s.show_customer_concentration then 1 else 0 end) +
      (case when s.show_photos then 1 else 0 end)),
  s.updated_at
from public.buyer_view_settings s
join public.businesses b on b.id = s.business_id
where not exists (select 1 from public.app_observability_events e where e.business_id = s.business_id and e.event_name = 'buyer_teaser_generated');

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, r.business_id, 'report_exported', 'info', 'report', 'report', r.id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'reports', 'report_type', r.report_type),
  coalesce(r.generated_at, r.created_at)
from public.reports r
join public.businesses b on b.id = r.business_id
where not exists (select 1 from public.app_observability_events e where e.business_id = r.business_id and e.event_name = 'report_exported' and e.target_id = r.id::text);

insert into public.app_observability_events (actor_user_id, business_id, event_name, severity, area, target_type, target_id, metadata, created_at)
select b.owner_id, i.business_id, 'advisor_invited', 'info', 'activation', 'advisor_invite', i.id::text,
  jsonb_build_object('backfilled', true, 'source_table', 'advisor_invites',
    'advisor_role', i.advisor_role, 'permission_level', i.permission_level),
  i.invited_at
from public.advisor_invites i
join public.businesses b on b.id = i.business_id
where not exists (select 1 from public.app_observability_events e where e.business_id = i.business_id and e.event_name = 'advisor_invited' and e.target_id = i.id::text);

notify pgrst, 'reload schema';