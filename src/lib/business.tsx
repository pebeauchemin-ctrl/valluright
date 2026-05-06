import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type FinancialYearRow = Database["public"]["Tables"]["financial_years"]["Row"];
export type ValuationRow = Database["public"]["Tables"]["valuations"]["Row"];

type Ctx = {
  loading: boolean;
  businesses: Business[];
  current: Business | null;
  setCurrent: (b: Business | null) => void;
  refresh: () => Promise<void>;
};

const BusinessCtx = createContext<Ctx | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [current, setCurrent] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setCurrent(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setBusinesses(data);
      setCurrent((prev) => {
        if (prev && data.find((b) => b.id === prev.id)) return data.find((b) => b.id === prev.id)!;
        return data[0] ?? null;
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BusinessCtx.Provider value={{ loading, businesses, current, setCurrent, refresh }}>
      {children}
    </BusinessCtx.Provider>
  );
}

export function useBusiness() {
  const v = useContext(BusinessCtx);
  if (!v) throw new Error("useBusiness must be used inside BusinessProvider");
  return v;
}

// Convert a Business row + financials into BusinessInputs for the valuation engine
export function toBusinessInputs(b: Business, financials: FinancialYearRow[]) {
  return {
    industry: b.industry,
    sub_industry: b.sub_industry,
    business_category: (b as any).business_category ?? null,
    cap_rate_low: (b as any).cap_rate_low != null ? Number((b as any).cap_rate_low) : null,
    cap_rate_selected: (b as any).cap_rate_selected != null ? Number((b as any).cap_rate_selected) : null,
    cap_rate_high: (b as any).cap_rate_high != null ? Number((b as any).cap_rate_high) : null,
    management_fee_pct: (b as any).management_fee_pct != null ? Number((b as any).management_fee_pct) : null,
    replacement_reserve_pct: (b as any).replacement_reserve_pct != null ? Number((b as any).replacement_reserve_pct) : null,
    years_in_business: b.years_in_business,
    employees: b.employees,
    owner_hours_per_week: b.owner_hours_per_week,
    owner_in_sales: b.owner_in_sales,
    owner_in_operations: b.owner_in_operations,
    owner_in_customer_relationships: b.owner_in_customer_relationships,
    recurring_revenue_pct: b.recurring_revenue_pct ? Number(b.recurring_revenue_pct) : null,
    top_customer_concentration_pct: b.top_customer_concentration_pct
      ? Number(b.top_customer_concentration_pct)
      : null,
    sop_status: b.sop_status,
    manager_team_depth: b.manager_team_depth,
    financials: financials.map((f) => ({
      year: f.year,
      revenue: Number(f.revenue ?? 0),
      cogs: Number(f.cogs ?? 0),
      gross_profit: Number(f.gross_profit ?? 0),
      operating_expenses: Number(f.operating_expenses ?? 0),
      owner_salary: Number(f.owner_salary ?? 0),
      addbacks: Number(f.addbacks ?? 0),
      ebitda: Number(f.ebitda ?? 0),
      net_income: Number(f.net_income ?? 0),
      assets: Number(f.assets ?? 0),
      liabilities: Number(f.liabilities ?? 0),
      debt: Number(f.debt ?? 0),
    })),
  };
}
