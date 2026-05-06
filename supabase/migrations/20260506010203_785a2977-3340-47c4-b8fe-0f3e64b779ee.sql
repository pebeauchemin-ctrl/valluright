-- Add business category and cap rate inputs to businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS business_category text,
  ADD COLUMN IF NOT EXISTS cap_rate_low numeric,
  ADD COLUMN IF NOT EXISTS cap_rate_selected numeric,
  ADD COLUMN IF NOT EXISTS cap_rate_high numeric,
  ADD COLUMN IF NOT EXISTS management_fee_pct numeric,
  ADD COLUMN IF NOT EXISTS replacement_reserve_pct numeric;