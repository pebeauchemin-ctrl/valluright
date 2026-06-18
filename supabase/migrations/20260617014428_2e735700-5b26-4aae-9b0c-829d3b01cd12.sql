-- REB-23: Itemized financial add-back review with audit history.

create table if not exists public.financial_addbacks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  year integer not null,
  amount numeric(14,2) not null default 0,
  category text not null,
  note text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.financial_addbacks to authenticated;
grant all on table public.financial_addbacks to service_role;

alter table public.financial_addbacks enable row level security;

create index if not exists financial_addbacks_business_year_idx
  on public.financial_addbacks(business_id, year);

drop policy if exists "owners manage own financial addbacks" on public.financial_addbacks;
create policy "owners manage own financial addbacks"
  on public.financial_addbacks for all to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = financial_addbacks.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = financial_addbacks.business_id and b.owner_id = auth.uid()
    )
  );

drop policy if exists "advisors view financial addbacks" on public.financial_addbacks;
create policy "advisors view financial addbacks"
  on public.financial_addbacks for select to authenticated
  using (public.is_advisor_of(business_id, auth.uid()));

create table if not exists public.financial_addback_events (
  id uuid primary key default gen_random_uuid(),
  addback_id uuid references public.financial_addbacks(id) on delete set null,
  business_id uuid not null references public.businesses(id) on delete cascade,
  year integer not null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  before_value jsonb,
  after_value jsonb,
  actor_user_id uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

grant select, insert on table public.financial_addback_events to authenticated;
grant all on table public.financial_addback_events to service_role;

alter table public.financial_addback_events enable row level security;

create index if not exists financial_addback_events_business_created_idx
  on public.financial_addback_events(business_id, created_at desc);

create index if not exists financial_addback_events_addback_created_idx
  on public.financial_addback_events(addback_id, created_at desc);

drop policy if exists "owners view own financial addback events" on public.financial_addback_events;
create policy "owners view own financial addback events"
  on public.financial_addback_events for select to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = financial_addback_events.business_id and b.owner_id = auth.uid()
    )
  );

drop policy if exists "advisors view financial addback events" on public.financial_addback_events;
create policy "advisors view financial addback events"
  on public.financial_addback_events for select to authenticated
  using (public.is_advisor_of(business_id, auth.uid()));

drop policy if exists "owners create financial addback events" on public.financial_addback_events;
create policy "owners create financial addback events"
  on public.financial_addback_events for insert to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (
      select 1 from public.businesses b
      where b.id = financial_addback_events.business_id and b.owner_id = auth.uid()
    )
  );

drop trigger if exists touch_financial_addbacks on public.financial_addbacks;
create trigger touch_financial_addbacks
  before update on public.financial_addbacks
  for each row execute procedure public.touch_updated_at();

comment on table public.financial_addbacks is
  'Itemized owner add-backs and normalization adjustments reviewed by year.';
comment on table public.financial_addback_events is
  'Audit trail for manual add-back review changes.';

notify pgrst, 'reload schema';