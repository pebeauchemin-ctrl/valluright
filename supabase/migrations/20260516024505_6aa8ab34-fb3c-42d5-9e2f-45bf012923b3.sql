-- =====================================================
-- 1. Valuation method results (one row per method per run)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.valuation_method_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id uuid NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  method text NOT NULL, -- 'sde_multiple' | 'ebitda_multiple' | 'dcf' | 'asset_based' | 'comparable' | 'revenue_multiple' | 'cap_rate'
  value_low numeric,
  value_mid numeric,
  value_high numeric,
  multiple_or_rate numeric,
  is_selected boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vmr_valuation ON public.valuation_method_results(valuation_id);
CREATE INDEX IF NOT EXISTS idx_vmr_business ON public.valuation_method_results(business_id);

ALTER TABLE public.valuation_method_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own valuation method results"
ON public.valuation_method_results FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = valuation_method_results.business_id AND b.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = valuation_method_results.business_id AND b.owner_id = auth.uid()));

CREATE POLICY "advisors view valuation method results for invited businesses"
ON public.valuation_method_results FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));

-- =====================================================
-- 2. Reports table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  report_type text NOT NULL, -- 'owner_valuation' | 'buyer_teaser' | 'advisor_review' | 'improvement_roadmap'
  title text NOT NULL,
  snapshot jsonb,
  include_scenarios boolean NOT NULL DEFAULT true,
  include_recommendations boolean NOT NULL DEFAULT true,
  generated_by uuid,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_business ON public.reports(business_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners manage own reports"
ON public.reports FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = reports.business_id AND b.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = reports.business_id AND b.owner_id = auth.uid()));

CREATE POLICY "advisors view reports for invited businesses"
ON public.reports FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));

-- =====================================================
-- 3. Extend advisor read access to existing tables
-- =====================================================

-- Company profile
CREATE POLICY "advisors view invited businesses"
ON public.businesses FOR SELECT TO authenticated
USING (public.is_advisor_of(id, auth.uid()));

-- Financials
CREATE POLICY "advisors view financials for invited businesses"
ON public.financial_years FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));

-- Valuation runs
CREATE POLICY "advisors view valuations for invited businesses"
ON public.valuations FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));

-- Recommendations
CREATE POLICY "advisors view recommendations for invited businesses"
ON public.recommendations FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));

-- Scenarios
CREATE POLICY "advisors view scenarios for invited businesses"
ON public.scenarios FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));

-- Buyer view settings
CREATE POLICY "advisors view buyer settings for invited businesses"
ON public.buyer_view_settings FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));

-- Data room file metadata (NOT storage objects — those stay owner-only)
CREATE POLICY "advisors view data room files for invited businesses"
ON public.data_room_files FOR SELECT TO authenticated
USING (public.is_advisor_of(business_id, auth.uid()));