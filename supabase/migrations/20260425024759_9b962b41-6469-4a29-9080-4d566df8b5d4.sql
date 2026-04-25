
-- =========================================================================
-- ENUMS
-- =========================================================================
create type public.app_role as enum ('owner', 'advisor', 'buyer', 'admin');
create type public.advisor_invite_status as enum ('pending', 'accepted', 'declined', 'revoked');
create type public.access_request_status as enum ('pending', 'approved', 'denied');
create type public.buyer_type as enum ('individual', 'strategic', 'financial', 'search_fund', 'other');
create type public.financing_status as enum ('cash', 'sba_pre_approved', 'sba_unverified', 'seller_financing', 'other');
create type public.exit_timeline as enum ('lt_1y', '1_2y', '2_5y', '5_plus_y', 'exploring');
create type public.data_room_category as enum (
  'financials','tax_returns','lease_real_estate','equipment','employees',
  'customers','vendors','legal','licenses','operations_manuals','photos'
);

-- =========================================================================
-- PROFILES
-- =========================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users view own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid());

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid());

create policy "users insert own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role)
  values (new.id, 'owner');
  return new;
end;
$$;

-- =========================================================================
-- USER ROLES
-- =========================================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "users view own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Trigger after user_roles exists
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- BUSINESSES
-- =========================================================================
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  public_id text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),

  -- Identity
  name text not null,
  industry text,
  sub_industry text,
  region text,
  years_in_business int,
  employees int,

  -- Owner involvement
  owner_hours_per_week int,
  owner_in_sales boolean default false,
  owner_in_operations boolean default false,
  owner_in_customer_relationships boolean default false,

  -- Revenue quality
  recurring_revenue_pct numeric(5,2),
  top_customer_concentration_pct numeric(5,2),

  -- Operations
  sop_status text, -- 'none' | 'partial' | 'complete'
  manager_team_depth text, -- 'none' | 'partial' | 'strong'

  -- Exit
  exit_timeline public.exit_timeline,
  asking_price_low bigint,
  asking_price_high bigint,
  reason_for_sale text,
  anonymous_description text,

  is_sample boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses(owner_id);
create index businesses_public_id_idx on public.businesses(public_id);

alter table public.businesses enable row level security;

-- Owners full access to their businesses
create policy "owners manage own businesses"
  on public.businesses for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Advisors can view businesses they have an accepted invite to (defined later)
-- Public can view (limited fields enforced at app layer + via public buyer_view_settings)
create policy "public can view businesses by public_id"
  on public.businesses for select to anon, authenticated
  using (true);
-- Note: app layer / dedicated public view will scope this to teaser-safe fields.

-- =========================================================================
-- FINANCIAL YEARS
-- =========================================================================
create table public.financial_years (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  year int not null,
  revenue numeric(14,2) default 0,
  cogs numeric(14,2) default 0,
  gross_profit numeric(14,2) default 0,
  operating_expenses numeric(14,2) default 0,
  owner_salary numeric(14,2) default 0,
  addbacks numeric(14,2) default 0,
  ebitda numeric(14,2) default 0,
  net_income numeric(14,2) default 0,
  assets numeric(14,2) default 0,
  liabilities numeric(14,2) default 0,
  debt numeric(14,2) default 0,
  created_at timestamptz not null default now(),
  unique (business_id, year)
);

create index financial_years_business_id_idx on public.financial_years(business_id);

alter table public.financial_years enable row level security;

create policy "owners manage own financials"
  on public.financial_years for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = financial_years.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = financial_years.business_id and b.owner_id = auth.uid()
  ));

-- =========================================================================
-- VALUATIONS
-- =========================================================================
create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  computed_at timestamptz not null default now(),

  -- Method results (mid value)
  sde_value numeric(14,2),
  ebitda_value numeric(14,2),
  revenue_value numeric(14,2),
  dcf_value numeric(14,2),
  asset_value numeric(14,2),
  comparable_value numeric(14,2),

  -- Method ranges
  sde_low numeric(14,2),
  sde_high numeric(14,2),
  ebitda_low numeric(14,2),
  ebitda_high numeric(14,2),
  revenue_low numeric(14,2),
  revenue_high numeric(14,2),
  dcf_low numeric(14,2),
  dcf_high numeric(14,2),
  asset_low numeric(14,2),
  asset_high numeric(14,2),

  -- Combined
  range_low numeric(14,2),
  range_mid numeric(14,2),
  range_high numeric(14,2),

  -- Health score
  health_score int,
  health_breakdown jsonb,

  inputs_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index valuations_business_id_idx on public.valuations(business_id);

alter table public.valuations enable row level security;

create policy "owners manage own valuations"
  on public.valuations for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = valuations.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = valuations.business_id and b.owner_id = auth.uid()
  ));

-- =========================================================================
-- RECOMMENDATIONS
-- =========================================================================
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  valuation_id uuid not null references public.valuations(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  category text not null,
  title text not null,
  description text not null,
  priority text not null,        -- 'high' | 'medium' | 'low'
  difficulty text not null,      -- 'easy' | 'moderate' | 'hard'
  time_required text,            -- e.g. '3-6 months'
  buyer_concern text,
  estimated_impact_low numeric(14,2),
  estimated_impact_high numeric(14,2),
  action_steps jsonb,            -- array of strings
  in_roadmap boolean not null default false,
  created_at timestamptz not null default now()
);

create index recommendations_business_id_idx on public.recommendations(business_id);

alter table public.recommendations enable row level security;

create policy "owners manage own recommendations"
  on public.recommendations for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = recommendations.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = recommendations.business_id and b.owner_id = auth.uid()
  ));

-- =========================================================================
-- SCENARIOS
-- =========================================================================
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  -- Slider inputs
  owner_involvement_pct numeric(5,2),
  recurring_revenue_pct numeric(5,2),
  profit_margin_pct numeric(5,2),
  revenue_growth_pct numeric(5,2),
  customer_concentration_pct numeric(5,2),
  sop_score int,
  manager_hired boolean default false,
  -- Outputs
  current_value numeric(14,2),
  projected_value numeric(14,2),
  value_delta numeric(14,2),
  timeline_months int,
  include_in_report boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scenarios_business_id_idx on public.scenarios(business_id);

alter table public.scenarios enable row level security;

create policy "owners manage own scenarios"
  on public.scenarios for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = scenarios.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = scenarios.business_id and b.owner_id = auth.uid()
  ));

-- =========================================================================
-- BUYER VIEW SETTINGS
-- =========================================================================
create table public.buyer_view_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  -- Optional toggles
  show_exact_revenue boolean not null default false,
  show_revenue_chart boolean not null default true,
  show_profit_margin boolean not null default false,
  show_sde boolean not null default false,
  show_employee_count boolean not null default true,
  show_valuation_breakdown boolean not null default false,
  show_scenarios boolean not null default false,
  -- Teaser content
  business_highlights jsonb,
  growth_opportunities jsonb,
  transition_support text,
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.buyer_view_settings enable row level security;

create policy "owners manage own buyer settings"
  on public.buyer_view_settings for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = buyer_view_settings.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = buyer_view_settings.business_id and b.owner_id = auth.uid()
  ));

create policy "public can view published buyer settings"
  on public.buyer_view_settings for select to anon, authenticated
  using (is_published = true);

-- =========================================================================
-- BUYER ACCESS REQUESTS
-- =========================================================================
create table public.buyer_access_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  buyer_type public.buyer_type,
  financing_status public.financing_status,
  message text,
  status public.access_request_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index buyer_access_requests_business_id_idx on public.buyer_access_requests(business_id);

alter table public.buyer_access_requests enable row level security;

-- Anyone can submit a request
create policy "anyone can submit access request"
  on public.buyer_access_requests for insert to anon, authenticated
  with check (true);

-- Owners can view & manage requests for their business
create policy "owners view own access requests"
  on public.buyer_access_requests for select to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = buyer_access_requests.business_id and b.owner_id = auth.uid()
  ));

create policy "owners update own access requests"
  on public.buyer_access_requests for update to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = buyer_access_requests.business_id and b.owner_id = auth.uid()
  ));

-- =========================================================================
-- ADVISOR INVITES
-- =========================================================================
create table public.advisor_invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  advisor_email text not null,
  advisor_id uuid references auth.users(id) on delete set null,
  status public.advisor_invite_status not null default 'pending',
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (business_id, advisor_email)
);

create index advisor_invites_business_id_idx on public.advisor_invites(business_id);
create index advisor_invites_advisor_id_idx on public.advisor_invites(advisor_id);

alter table public.advisor_invites enable row level security;

create policy "owners manage advisor invites for own businesses"
  on public.advisor_invites for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = advisor_invites.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = advisor_invites.business_id and b.owner_id = auth.uid()
  ));

create policy "advisors can view their invites"
  on public.advisor_invites for select to authenticated
  using (advisor_id = auth.uid() or advisor_email = (select email from auth.users where id = auth.uid()));

create policy "advisors can update their invites"
  on public.advisor_invites for update to authenticated
  using (advisor_id = auth.uid());

-- Helper: can a user view a given business as advisor?
create or replace function public.is_advisor_of(_business_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.advisor_invites
    where business_id = _business_id
      and advisor_id = _user_id
      and status = 'accepted'
  )
$$;

-- =========================================================================
-- ADVISOR COMMENTS
-- =========================================================================
create table public.advisor_comments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  is_approval boolean not null default false,
  created_at timestamptz not null default now()
);

create index advisor_comments_business_id_idx on public.advisor_comments(business_id);

alter table public.advisor_comments enable row level security;

create policy "owners view comments on own businesses"
  on public.advisor_comments for select to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = advisor_comments.business_id and b.owner_id = auth.uid()
  ));

create policy "advisors view their comments"
  on public.advisor_comments for select to authenticated
  using (
    author_id = auth.uid()
    or public.is_advisor_of(business_id, auth.uid())
  );

create policy "advisors create comments on assigned businesses"
  on public.advisor_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_advisor_of(business_id, auth.uid())
  );

-- =========================================================================
-- DATA ROOM
-- =========================================================================
create table public.data_room_files (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category public.data_room_category not null,
  filename text not null,
  storage_path text not null,
  size_bytes bigint,
  mime_type text,
  uploaded_at timestamptz not null default now()
);

create index data_room_files_business_id_idx on public.data_room_files(business_id);

alter table public.data_room_files enable row level security;

create policy "owners manage own data room"
  on public.data_room_files for all to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = data_room_files.business_id and b.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.businesses b
    where b.id = data_room_files.business_id and b.owner_id = auth.uid()
  ));

-- =========================================================================
-- STORAGE BUCKET (private data room)
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('data-room', 'data-room', false)
on conflict (id) do nothing;

create policy "owners upload to own data room"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'data-room'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners read own data room"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'data-room'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners delete own data room"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'data-room'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =========================================================================
-- updated_at triggers
-- =========================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_businesses before update on public.businesses
  for each row execute procedure public.touch_updated_at();
create trigger touch_profiles before update on public.profiles
  for each row execute procedure public.touch_updated_at();
create trigger touch_scenarios before update on public.scenarios
  for each row execute procedure public.touch_updated_at();
create trigger touch_buyer_view_settings before update on public.buyer_view_settings
  for each row execute procedure public.touch_updated_at();
