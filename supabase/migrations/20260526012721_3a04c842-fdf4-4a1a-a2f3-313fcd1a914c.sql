begin;

alter table public.businesses enable row level security;

revoke all on table public.businesses from anon;

drop policy if exists "public can view businesses by public_id" on public.businesses;

create or replace function public.revenue_band(_revenue numeric)
returns text
language sql
immutable
as $$
  select case
    when _revenue is null or _revenue <= 0 then null
    when _revenue < 500000 then 'Under $500K'
    when _revenue < 1000000 then '$500K - $1M'
    when _revenue < 2500000 then '$1M - $2.5M'
    when _revenue < 5000000 then '$2.5M - $5M'
    when _revenue < 10000000 then '$5M - $10M'
    else '$10M+'
  end
$$;

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
      'id', p.id,
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

revoke all on function public.get_public_teaser(text) from public;
grant execute on function public.get_public_teaser(text) to anon, authenticated;

comment on function public.get_public_teaser(text) is
  'Returns only buyer-safe fields for a published teaser public_id.';

commit;