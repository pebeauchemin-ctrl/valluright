-- REB-25: Harden role access and public teaser boundaries.
--
-- Public teaser reads stay behind get_public_teaser(), and buyer access
-- requests are submitted by public_id through a security-definer RPC so the
-- browser does not need the internal business UUID.

begin;

alter table public.businesses enable row level security;
alter table public.financial_years enable row level security;
alter table public.valuations enable row level security;
alter table public.recommendations enable row level security;
alter table public.scenarios enable row level security;
alter table public.buyer_view_settings enable row level security;
alter table public.buyer_access_requests enable row level security;
alter table public.advisor_invites enable row level security;
alter table public.advisor_comments enable row level security;
alter table public.data_room_files enable row level security;

alter table public.advisor_invites
  add constraint advisor_invites_permission_level_check
  check (permission_level in ('view_only', 'comment', 'edit_assumptions', 'approve'))
  not valid;

alter table public.advisor_invites
  validate constraint advisor_invites_permission_level_check;

create or replace function public.advisor_permission_rank(_permission_level text)
returns int
language sql
immutable
as $$
  select case _permission_level
    when 'view_only' then 10
    when 'comment' then 20
    when 'edit_assumptions' then 30
    when 'approve' then 40
    else 0
  end
$$;

create or replace function public.can_advisor_access(
  _business_id uuid,
  _user_id uuid,
  _minimum_permission text default 'view_only'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.advisor_invites i
    where i.business_id = _business_id
      and i.advisor_id = _user_id
      and i.status = 'accepted'
      and public.advisor_permission_rank(i.permission_level) >= public.advisor_permission_rank(_minimum_permission)
  )
$$;

create or replace function public.is_advisor_of(_business_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_advisor_access(_business_id, _user_id, 'view_only')
$$;

drop policy if exists "advisors can view their invites" on public.advisor_invites;
create policy "advisors can view their invites"
  on public.advisor_invites for select to authenticated
  using (
    advisor_id = auth.uid()
    or lower(advisor_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "advisors can update their invites" on public.advisor_invites;

drop policy if exists "advisors create comments on assigned businesses" on public.advisor_comments;
create policy "advisors create comments on assigned businesses"
  on public.advisor_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_advisor_access(business_id, auth.uid(), 'comment')
  );

drop policy if exists "public can view published buyer settings" on public.buyer_view_settings;

drop policy if exists "anyone can submit access request" on public.buyer_access_requests;
drop policy if exists "anyone can request access to published business" on public.buyer_access_requests;
revoke insert on public.buyer_access_requests from anon, authenticated;

create or replace function public.get_public_teaser(_public_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with published as (
    select
      b.id,
      b.public_id,
      b.industry,
      b.region,
      b.years_in_business,
      b.employees,
      b.anonymous_description,
      b.asking_price_low,
      b.asking_price_high,
      b.reason_for_sale,
      b.top_customer_concentration_pct,
      s.show_exact_revenue,
      s.show_revenue_chart,
      s.show_profit_margin,
      s.show_sde,
      s.show_employee_count,
      s.show_valuation_breakdown,
      s.show_scenarios,
      s.show_customer_concentration,
      s.business_highlights,
      s.growth_opportunities,
      s.transition_support,
      s.is_published
    from public.businesses b
    join public.buyer_view_settings s on s.business_id = b.id
    where b.public_id = _public_id
      and s.is_published = true
    limit 1
  ),
  first_revenue as (
    select nullif(f.revenue, 0) as revenue
    from public.financial_years f
    join published p on p.id = f.business_id
    order by f.year asc
    limit 1
  ),
  financial_payload as (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'year', f.year,
        'revenue', case when p.show_exact_revenue then f.revenue else null end,
        'revenue_band', public.revenue_band(f.revenue),
        'revenue_index', case
          when p.show_revenue_chart and fr.revenue is not null
            then round((f.revenue / fr.revenue) * 100, 2)
          else null
        end,
        'ebitda_margin_pct', case
          when p.show_profit_margin and f.revenue is not null and f.revenue <> 0
            then round((f.ebitda / f.revenue) * 100, 2)
          else null
        end,
        'sde', case
          when p.show_sde then coalesce(f.ebitda, 0) + coalesce(f.owner_salary, 0)
          else null
        end
      )
      order by f.year asc
    ) filter (where f.id is not null), '[]'::jsonb) as financials
    from published p
    left join public.financial_years f on f.business_id = p.id
    left join first_revenue fr on true
  )
  select jsonb_build_object(
    'business', jsonb_build_object(
      'public_id', p.public_id,
      'industry', p.industry,
      'region', p.region,
      'years_in_business', p.years_in_business,
      'employees', case when p.show_employee_count then p.employees else null end,
      'anonymous_description', p.anonymous_description,
      'asking_price_low', p.asking_price_low,
      'asking_price_high', p.asking_price_high,
      'reason_for_sale', p.reason_for_sale,
      'top_customer_concentration_pct', case
        when p.show_customer_concentration then p.top_customer_concentration_pct
        else null
      end
    ),
    'settings', jsonb_build_object(
      'show_exact_revenue', p.show_exact_revenue,
      'show_revenue_chart', p.show_revenue_chart,
      'show_profit_margin', p.show_profit_margin,
      'show_sde', p.show_sde,
      'show_employee_count', p.show_employee_count,
      'show_valuation_breakdown', p.show_valuation_breakdown,
      'show_scenarios', p.show_scenarios,
      'show_customer_concentration', p.show_customer_concentration,
      'business_highlights', p.business_highlights,
      'growth_opportunities', p.growth_opportunities,
      'transition_support', p.transition_support,
      'is_published', p.is_published
    ),
    'financials', fp.financials
  )
  from published p
  cross join financial_payload fp
$$;

create or replace function public.submit_buyer_access_request(
  _public_id text,
  _name text,
  _email text,
  _phone text default null,
  _buyer_type public.buyer_type default null,
  _financing_status public.financing_status default null,
  _message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _business_id uuid;
  _request_id uuid;
begin
  select b.id
    into _business_id
  from public.businesses b
  join public.buyer_view_settings s on s.business_id = b.id
  where b.public_id = _public_id
    and s.is_published = true
  limit 1;

  if _business_id is null then
    raise exception 'Listing not available' using errcode = 'P0002';
  end if;

  insert into public.buyer_access_requests (
    business_id,
    name,
    email,
    phone,
    buyer_type,
    financing_status,
    message
  )
  values (
    _business_id,
    nullif(trim(_name), ''),
    lower(nullif(trim(_email), '')),
    nullif(trim(_phone), ''),
    _buyer_type,
    _financing_status,
    nullif(trim(_message), '')
  )
  returning id into _request_id;

  return _request_id;
end;
$$;

revoke all on function public.advisor_permission_rank(text) from public;
grant execute on function public.advisor_permission_rank(text) to authenticated;

revoke all on function public.can_advisor_access(uuid, uuid, text) from public;
grant execute on function public.can_advisor_access(uuid, uuid, text) to authenticated;

revoke all on function public.get_public_teaser(text) from public;
grant execute on function public.get_public_teaser(text) to anon, authenticated;

revoke all on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) from public;
grant execute on function public.submit_buyer_access_request(
  text,
  text,
  text,
  text,
  public.buyer_type,
  public.financing_status,
  text
) to anon, authenticated;

commit;
