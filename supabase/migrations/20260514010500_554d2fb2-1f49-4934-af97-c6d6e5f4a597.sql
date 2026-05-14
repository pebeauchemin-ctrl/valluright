ALTER TABLE public.buyer_view_settings
  ADD COLUMN IF NOT EXISTS show_customer_concentration boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_photos boolean NOT NULL DEFAULT false;