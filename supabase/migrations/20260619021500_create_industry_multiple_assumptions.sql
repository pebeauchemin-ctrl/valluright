-- REB-14: configurable industry multiple assumptions for valuation planning.

create table if not exists public.industry_multiple_assumptions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  industry text not null,
  business_category text not null default 'any' check (
    business_category in ('any', 'real_estate_income', 'standard_operating', 'asset_heavy')
  ),
  revenue_min numeric,
  revenue_max numeric,
  owner_dependence text not null default 'any' check (
    owner_dependence in ('any', 'low', 'medium', 'high')
  ),
  confidence_level text not null default 'medium' check (
    confidence_level in ('low', 'medium', 'high')
  ),
  sde_low numeric not null,
  sde_mid numeric not null,
  sde_high numeric not null,
  ebitda_low numeric not null,
  ebitda_mid numeric not null,
  ebitda_high numeric not null,
  revenue_low numeric not null,
  revenue_mid numeric not null,
  revenue_high numeric not null,
  source_label text not null,
  source_notes text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sde_low <= sde_mid and sde_mid <= sde_high),
  check (ebitda_low <= ebitda_mid and ebitda_mid <= ebitda_high),
  check (revenue_low <= revenue_mid and revenue_mid <= revenue_high),
  check (revenue_min is null or revenue_min >= 0),
  check (revenue_max is null or revenue_max >= 0),
  check (revenue_min is null or revenue_max is null or revenue_min <= revenue_max)
);

create index if not exists industry_multiple_assumptions_lookup_idx
  on public.industry_multiple_assumptions (
    active,
    industry,
    business_category,
    owner_dependence,
    revenue_min,
    revenue_max,
    confidence_level
  );

alter table public.industry_multiple_assumptions enable row level security;

drop policy if exists "anyone can read active industry multiple assumptions"
  on public.industry_multiple_assumptions;
create policy "anyone can read active industry multiple assumptions"
  on public.industry_multiple_assumptions
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists "admins manage industry multiple assumptions"
  on public.industry_multiple_assumptions;
create policy "admins manage industry multiple assumptions"
  on public.industry_multiple_assumptions
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

revoke all on public.industry_multiple_assumptions from anon, authenticated;
grant select on public.industry_multiple_assumptions to anon, authenticated;
grant all on public.industry_multiple_assumptions to service_role;

drop trigger if exists industry_multiple_assumptions_updated_at
  on public.industry_multiple_assumptions;
create trigger industry_multiple_assumptions_updated_at
  before update on public.industry_multiple_assumptions
  for each row execute function public.touch_updated_at();

comment on table public.industry_multiple_assumptions is
  'Configurable planning assumptions for SDE, EBITDA, and revenue multiples. These are directional valuation inputs, not market guarantees or appraisals.';

comment on column public.industry_multiple_assumptions.source_notes is
  'Plain-language rationale and limitations for this multiple assumption. Keep notes buyer-safe and do not include private comp data.';

insert into public.industry_multiple_assumptions (
  slug,
  industry,
  sde_low,
  sde_mid,
  sde_high,
  ebitda_low,
  ebitda_mid,
  ebitda_high,
  revenue_low,
  revenue_mid,
  revenue_high,
  source_label,
  source_notes
)
values
  (
    'hvac-trades-default',
    'HVAC / Trades',
    2.4,
    3.0,
    3.8,
    3.5,
    4.5,
    5.5,
    0.45,
    0.65,
    0.95,
    'ValuRight planning baseline',
    'Directional SMB planning range for service-trade businesses. Review against current local comps before relying on an asking price.'
  ),
  (
    'professional-services-default',
    'Professional Services',
    2.0,
    2.6,
    3.2,
    3.0,
    4.0,
    5.0,
    0.6,
    0.9,
    1.4,
    'ValuRight planning baseline',
    'Directional professional-services planning range; owner dependence and client concentration can materially lower realized multiples.'
  ),
  (
    'healthcare-practice-default',
    'Healthcare Practice',
    2.5,
    3.2,
    4.0,
    3.5,
    4.8,
    6.0,
    0.7,
    1.0,
    1.5,
    'ValuRight planning baseline',
    'Directional healthcare-practice planning range; payer mix, provider retention, and compliance diligence should be reviewed separately.'
  ),
  (
    'construction-default',
    'Construction',
    2.0,
    2.5,
    3.0,
    3.0,
    3.8,
    4.5,
    0.3,
    0.5,
    0.7,
    'ValuRight planning baseline',
    'Directional contractor planning range; backlog quality, bonding capacity, and cyclicality can shift market outcomes.'
  ),
  (
    'restaurant-hospitality-default',
    'Restaurant / Hospitality',
    1.6,
    2.0,
    2.5,
    2.5,
    3.2,
    4.0,
    0.25,
    0.4,
    0.6,
    'ValuRight planning baseline',
    'Directional restaurant and hospitality planning range; location, lease terms, owner replacement needs, and concept durability are key diligence items.'
  ),
  (
    'retail-default',
    'Retail',
    1.8,
    2.3,
    2.8,
    2.8,
    3.5,
    4.2,
    0.3,
    0.45,
    0.6,
    'ValuRight planning baseline',
    'Directional retail planning range; inventory quality, foot traffic, lease terms, and online competition should be reviewed.'
  ),
  (
    'manufacturing-default',
    'Manufacturing',
    2.5,
    3.2,
    4.0,
    3.5,
    4.5,
    5.5,
    0.5,
    0.8,
    1.2,
    'ValuRight planning baseline',
    'Directional manufacturing planning range; equipment condition, customer concentration, and working-capital needs can shift realized multiples.'
  ),
  (
    'ecommerce-online-default',
    'E-commerce / Online',
    2.5,
    3.5,
    4.5,
    3.5,
    5.0,
    6.5,
    0.6,
    1.0,
    1.6,
    'ValuRight planning baseline',
    'Directional online-business planning range; channel concentration, CAC durability, and owner-operated marketing risk need separate review.'
  ),
  (
    'software-saas-default',
    'Software / SaaS',
    3.0,
    4.5,
    6.0,
    5.0,
    7.0,
    10.0,
    1.5,
    2.5,
    4.0,
    'ValuRight planning baseline',
    'Directional SaaS planning range; retention, growth, gross margin, and customer concentration are usually more important than industry label alone.'
  ),
  (
    'auto-repair-service-default',
    'Auto Repair / Service',
    2.2,
    2.8,
    3.5,
    3.0,
    4.0,
    5.0,
    0.35,
    0.55,
    0.8,
    'ValuRight planning baseline',
    'Directional auto-service planning range; technician retention, facility control, and equipment condition are key buyer diligence items.'
  ),
  (
    'logistics-transport-default',
    'Logistics / Transport',
    2.0,
    2.6,
    3.2,
    3.0,
    4.0,
    5.0,
    0.4,
    0.6,
    0.9,
    'ValuRight planning baseline',
    'Directional logistics planning range; fleet age, contract durability, and fuel/labor exposure can materially change outcomes.'
  ),
  (
    'other-default',
    'Other',
    2.0,
    2.7,
    3.4,
    3.0,
    4.0,
    5.0,
    0.4,
    0.6,
    0.9,
    'ValuRight planning baseline',
    'Fallback planning range for industries without a more specific assumption. Replace with a reviewed comp set when available.'
  )
on conflict (slug) do update set
  industry = excluded.industry,
  sde_low = excluded.sde_low,
  sde_mid = excluded.sde_mid,
  sde_high = excluded.sde_high,
  ebitda_low = excluded.ebitda_low,
  ebitda_mid = excluded.ebitda_mid,
  ebitda_high = excluded.ebitda_high,
  revenue_low = excluded.revenue_low,
  revenue_mid = excluded.revenue_mid,
  revenue_high = excluded.revenue_high,
  source_label = excluded.source_label,
  source_notes = excluded.source_notes,
  active = true,
  updated_at = now();
