import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Link2,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBusiness, toBusinessInputs } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { buildValuationInsert } from "@/lib/valuation-persistence";
import {
  INDUSTRY_OPTIONS,
  valueBusiness,
  computeHealthScore,
  SAMPLE_HVAC_BUSINESS,
  SAMPLE_HVAC_FINANCIALS,
  BUSINESS_CATEGORY_OPTIONS,
  inferCategory,
  isRvOrCampground,
  type BusinessCategory,
} from "@/lib/valuation";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { startXeroConnect, importXeroFinancials, listXeroConnections } from "@/lib/xero.functions";
import { listQuickBooksConnections, startQuickBooksConnect } from "@/lib/quickbooks.functions";
import { ValuationDisclaimer } from "@/components/ValuationDisclaimer";
import { recordProductEvent } from "@/lib/observability.functions";

type OnboardingSearch = {
  xero?: "connected" | "error";
  quickbooks?: "connected" | "error";
  tenant?: string;
  realm?: string;
  message?: string;
};

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — ValuRight.ai" }] }),
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    xero: search.xero === "connected" || search.xero === "error" ? search.xero : undefined,
    quickbooks:
      search.quickbooks === "connected" || search.quickbooks === "error"
        ? search.quickbooks
        : undefined,
    tenant: typeof search.tenant === "string" ? search.tenant : undefined,
    realm: typeof search.realm === "string" ? search.realm : undefined,
    message: typeof search.message === "string" ? search.message : undefined,
  }),
  component: Onboarding,
});

type Step = 0 | 1 | 2;

const currentYear = new Date().getFullYear();

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "PR",
];

const SUB_INDUSTRY_SUGGESTIONS: Record<string, string[]> = {
  "HVAC / Trades": [
    "HVAC",
    "Plumbing",
    "Electrical",
    "Roofing",
    "Landscaping",
    "Pest control",
    "General contracting",
  ],
  "Professional Services": [
    "Accounting / CPA",
    "Legal",
    "Marketing agency",
    "Consulting",
    "IT services",
    "Architecture / Engineering",
  ],
  "Healthcare Practice": [
    "Dental",
    "Veterinary",
    "Medical / Primary care",
    "Physical therapy",
    "Optometry",
    "Mental health",
  ],
  Construction: [
    "Residential",
    "Commercial",
    "Specialty trades",
    "Remodeling",
    "Site work / excavation",
  ],
  "Restaurant / Hospitality": [
    "QSR / Fast casual",
    "Full service restaurant",
    "Bar / Pub",
    "Catering",
    "Hotel / Lodging",
    "Food truck",
  ],
  Retail: [
    "Apparel",
    "Convenience / C-store",
    "Specialty retail",
    "Furniture / Home goods",
    "Liquor store",
    "Gas station",
  ],
  Manufacturing: [
    "Metal fabrication",
    "Food & beverage",
    "Plastics",
    "Electronics",
    "Custom / Job shop",
    "Consumer products",
  ],
  "E-commerce / Online": [
    "Amazon / Marketplace seller",
    "DTC brand",
    "Subscription box",
    "Digital products",
    "Dropshipping",
  ],
  "Software / SaaS": [
    "B2B SaaS",
    "B2C SaaS",
    "Vertical SaaS",
    "Mobile app",
    "Marketplace",
    "Dev tools",
  ],
  "Auto Repair / Service": [
    "General auto repair",
    "Body shop / Collision",
    "Tire / Wheel",
    "Quick lube",
    "Transmission",
    "Detailing",
  ],
  "Logistics / Transport": [
    "Trucking / Freight",
    "Last-mile delivery",
    "Warehousing",
    "Moving services",
    "Courier",
  ],
  Other: [],
};

function emptyYear(year: number) {
  return {
    year,
    revenue: 0,
    cogs: 0,
    gross_profit: 0,
    operating_expenses: 0,
    owner_salary: 0,
    addbacks: 0,
    ebitda: 0,
    net_income: 0,
    assets: 0,
    liabilities: 0,
    debt: 0,
  };
}

function Onboarding() {
  const { user } = useAuth();
  const { refresh, setCurrent } = useBusiness();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);
  const [usingSampleData, setUsingSampleData] = useState(false);

  // Xero
  const startXero = useServerFn(startXeroConnect);
  const importXero = useServerFn(importXeroFinancials);
  const fetchConnections = useServerFn(listXeroConnections);
  const startQuickBooks = useServerFn(startQuickBooksConnect);
  const fetchQuickBooksConnections = useServerFn(listQuickBooksConnections);
  const recordEvent = useServerFn(recordProductEvent);
  const [xeroLoading, setXeroLoading] = useState(false);
  const [quickBooksLoading, setQuickBooksLoading] = useState(false);
  const [xeroTenants, setXeroTenants] = useState<
    { tenant_id: string; tenant_name: string | null }[]
  >([]);
  const [quickBooksConnections, setQuickBooksConnections] = useState<
    { id: string; realm_id: string; company_name: string | null; last_synced_at: string | null }[]
  >([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  // Step 0: business basics
  const [name, setName] = useState("");
  const [anonymousDescription, setAnonymousDescription] = useState("");
  const [industry, setIndustry] = useState<string>(INDUSTRY_OPTIONS[0]);
  const [subIndustry, setSubIndustry] = useState<string>("");
  const [stateCode, setStateCode] = useState<string>("");
  const [region, setRegion] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState<number>(10);
  const [employees, setEmployees] = useState<number>(10);
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>("standard_operating");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [capRateLow, setCapRateLow] = useState<number>(8);
  const [capRateSelected, setCapRateSelected] = useState<number>(10);
  const [capRateHigh, setCapRateHigh] = useState<number>(12);
  const [mgmtFeePct, setMgmtFeePct] = useState<number>(0);
  const [reservePct, setReservePct] = useState<number>(0);

  // Auto-infer category from industry/sub-industry until the user manually changes it
  useEffect(() => {
    if (!categoryTouched) {
      setBusinessCategory(inferCategory(industry, subIndustry));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, subIndustry]);

  // Step 1: financials (3 yrs) — most recent completed year is last year
  const [years, setYears] = useState([
    emptyYear(currentYear - 3),
    emptyYear(currentYear - 2),
    emptyYear(currentYear - 1),
  ]);

  // Step 2: operations / risk
  const [ownerHours, setOwnerHours] = useState(50);
  const [ownerInSales, setOwnerInSales] = useState(true);
  const [ownerInOps, setOwnerInOps] = useState(true);
  const [ownerInCustomers, setOwnerInCustomers] = useState(true);
  const [recurringPct, setRecurringPct] = useState(15);
  const [topCustomerPct, setTopCustomerPct] = useState(15);
  const [sopStatus, setSopStatus] = useState("partial");
  const [managerDepth, setManagerDepth] = useState("partial");
  const [exitTimeline, setExitTimeline] = useState<
    "lt_1y" | "1_2y" | "2_5y" | "5_plus_y" | "exploring"
  >("2_5y");

  // After redirect back from Xero, surface status and load tenants for the user.
  useEffect(() => {
    if (search.xero === "error") {
      toast.error(`Xero connection failed: ${search.message ?? "unknown error"}`);
      navigate({ to: "/app/onboarding", search: {} as never, replace: true });
      return;
    }
    if (search.xero === "connected") {
      setStep(1);
      if (search.tenant) setSelectedTenant(search.tenant);
      toast.success("Connected to Xero. Importing your reports…");
      void loadTenantsAndImport(search.tenant ?? null);
      navigate({ to: "/app/onboarding", search: {} as never, replace: true });
    }
    if (search.quickbooks === "error") {
      toast.error(`QuickBooks connection failed: ${search.message ?? "unknown error"}`);
      navigate({ to: "/app/onboarding", search: {} as never, replace: true });
      return;
    }
    if (search.quickbooks === "connected") {
      setStep(1);
      toast.success("Connected to QuickBooks Online.");
      void loadQuickBooksConnections();
      navigate({ to: "/app/onboarding", search: {} as never, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.xero, search.quickbooks]);

  // Load any pre-existing Xero tenants for this user on mount.
  useEffect(() => {
    if (!user) return;
    fetchConnections()
      .then(({ connections }) => {
        if (connections.length) {
          setXeroTenants(
            connections.map((c) => ({ tenant_id: c.tenant_id, tenant_name: c.tenant_name })),
          );
          setSelectedTenant((prev) => prev ?? connections[0].tenant_id);
        }
      })
      .catch(() => {
        /* ignore */
      });
    fetchQuickBooksConnections({})
      .then(({ connections }) => setQuickBooksConnections(connections))
      .catch(() => {
        /* ignore */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadTenantsAndImport = async (preferredTenant: string | null) => {
    try {
      const { connections } = await fetchConnections();
      const tenants = connections.map((c) => ({
        tenant_id: c.tenant_id,
        tenant_name: c.tenant_name,
      }));
      setXeroTenants(tenants);
      const useTenant = preferredTenant ?? tenants[0]?.tenant_id ?? null;
      if (useTenant) {
        setSelectedTenant(useTenant);
        await runXeroImport(useTenant);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load Xero connections");
    }
  };

  const handleConnectXero = async () => {
    try {
      setXeroLoading(true);
      const { url } = await startXero({ data: { businessId: null } });
      window.location.href = url;
    } catch (e) {
      setXeroLoading(false);
      toast.error(e instanceof Error ? e.message : "Failed to start Xero connect");
    }
  };

  const loadQuickBooksConnections = async () => {
    const { connections } = await fetchQuickBooksConnections({});
    setQuickBooksConnections(connections);
  };

  const handleConnectQuickBooks = async () => {
    try {
      setQuickBooksLoading(true);
      const { url } = await startQuickBooks({ data: { businessId: null } });
      window.location.href = url;
    } catch (e) {
      setQuickBooksLoading(false);
      toast.error(e instanceof Error ? e.message : "Failed to start QuickBooks connect");
    }
  };

  const runXeroImport = async (tenantId: string) => {
    try {
      setXeroLoading(true);
      const requestedYears = [currentYear - 3, currentYear - 2, currentYear - 1];
      const { years: imported, summary } = await importXero({
        data: { tenantId, years: requestedYears },
      });
      setYears((prev) =>
        prev.map((row) => {
          const match = imported.find((y) => y.year === row.year);
          return match ? { ...row, ...match } : row;
        }),
      );
      toast.success(
        `Imported ${imported.length} year(s) of P&L and Balance Sheet from Xero. Review and adjust owner salary and add-backs.`,
      );
      recordEvent({
        data: {
          eventName: "accounting_import_completed_viewed",
          area: "import",
          metadata: {
            source: "xero",
            years_count: imported.length,
            unmapped_accounts_count: summary.unmappedAccounts.length,
            warnings_count: summary.warnings.length,
          },
        },
      }).catch(() => undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xero import failed");
    } finally {
      setXeroLoading(false);
    }
  };

  const fillSample = () => {
    setUsingSampleData(true);
    setName(`Sample - ${SAMPLE_HVAC_BUSINESS.name}`);
    setAnonymousDescription(`[Sample data] ${SAMPLE_HVAC_BUSINESS.anonymous_description}`);
    setIndustry(SAMPLE_HVAC_BUSINESS.industry);
    setRegion(SAMPLE_HVAC_BUSINESS.region);
    setYearsInBusiness(SAMPLE_HVAC_BUSINESS.years_in_business);
    setEmployees(SAMPLE_HVAC_BUSINESS.employees);
    setYears(SAMPLE_HVAC_FINANCIALS.map((f) => ({ ...f })));
    setOwnerHours(SAMPLE_HVAC_BUSINESS.owner_hours_per_week);
    setOwnerInSales(SAMPLE_HVAC_BUSINESS.owner_in_sales);
    setOwnerInOps(SAMPLE_HVAC_BUSINESS.owner_in_operations);
    setOwnerInCustomers(SAMPLE_HVAC_BUSINESS.owner_in_customer_relationships);
    setRecurringPct(SAMPLE_HVAC_BUSINESS.recurring_revenue_pct);
    setTopCustomerPct(SAMPLE_HVAC_BUSINESS.top_customer_concentration_pct);
    setSopStatus(SAMPLE_HVAC_BUSINESS.sop_status);
    setManagerDepth(SAMPLE_HVAC_BUSINESS.manager_team_depth);
    toast.success("Filled with clearly marked sample data.");
  };

  const updateYear = (idx: number, patch: Partial<(typeof years)[number]>) => {
    setYears((prev) =>
      prev.map((y, i) => {
        if (i !== idx) return y;
        const next = { ...y, ...patch };
        next.gross_profit = next.revenue - next.cogs;
        return next;
      }),
    );
  };

  // Persisted business id once we've saved at least once during onboarding.
  const [businessId, setBusinessId] = useState<string | null>(null);

  const businessPayload = () => ({
    name,
    anonymous_description: anonymousDescription || null,
    industry,
    sub_industry: subIndustry || null,
    region: [stateCode, region].filter(Boolean).join(stateCode && region ? " — " : ""),
    years_in_business: yearsInBusiness,
    employees,
    owner_hours_per_week: ownerHours,
    owner_in_sales: ownerInSales,
    owner_in_operations: ownerInOps,
    owner_in_customer_relationships: ownerInCustomers,
    recurring_revenue_pct: recurringPct,
    top_customer_concentration_pct: topCustomerPct,
    sop_status: sopStatus,
    manager_team_depth: managerDepth,
    exit_timeline: exitTimeline,
    business_category: businessCategory,
    cap_rate_low: capRateLow,
    cap_rate_selected: capRateSelected,
    cap_rate_high: capRateHigh,
    management_fee_pct: mgmtFeePct,
    replacement_reserve_pct: reservePct,
    is_sample: usingSampleData,
  });

  /** Create the business row (first save) or update it (subsequent saves). */
  const persistBusiness = async (): Promise<string | null> => {
    if (!user) return null;
    if (businessId) {
      const { error } = await supabase
        .from("businesses")
        .update(businessPayload())
        .eq("id", businessId);
      if (error) throw error;
      return businessId;
    }
    const { data, error } = await supabase
      .from("businesses")
      .insert({ owner_id: user.id, ...businessPayload() })
      .select()
      .single();
    if (error || !data) throw error ?? new Error("Failed to create business");
    setBusinessId(data.id);
    return data.id;
  };

  /** Replace this business's financial_years rows with the current local state. */
  const persistFinancials = async (bizId: string) => {
    const yearsToInsert = years
      .filter((y) => y.revenue > 0)
      .map((y) => ({ ...y, business_id: bizId }));
    // Wipe and re-insert so re-clicking Next stays idempotent.
    await supabase.from("financial_years").delete().eq("business_id", bizId);
    if (yearsToInsert.length) {
      const { error } = await supabase.from("financial_years").insert(yearsToInsert);
      if (error) throw error;
    }
  };

  /** Autosave whatever the current step contains, then advance. */
  const saveStepAndAdvance = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const bizId = await persistBusiness();
      if (bizId && step === 1) {
        await persistFinancials(bizId);
      }
      await refresh();
      toast.success("Saved");
      setStep((s) => Math.min(2, s + 1) as Step);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    let savedBusinessId: string | null = businessId;
    try {
      const bizId = await persistBusiness();
      if (!bizId) throw new Error("Failed to create business");
      savedBusinessId = bizId;
      await persistFinancials(bizId);

      const { data: biz } = await supabase.from("businesses").select("*").eq("id", bizId).single();
      const { data: yearsRows } = await supabase
        .from("financial_years")
        .select("*")
        .eq("business_id", bizId);

      // Compute and store first valuation
      const inputs = toBusinessInputs(biz!, (yearsRows ?? []) as never);
      const v = valueBusiness(inputs);
      const h = computeHealthScore(inputs);
      const { error: valuationError } = await supabase
        .from("valuations")
        .insert(buildValuationInsert(bizId, inputs, v, h));
      if (valuationError) throw valuationError;

      await recordEvent({
        data: {
          eventName: "onboarding_completed",
          area: "onboarding",
          businessId: bizId,
          targetType: "business",
          targetId: bizId,
          metadata: {
            years_count: (yearsRows ?? []).length,
            is_sample: Boolean(biz?.is_sample),
          },
        },
      });
      await recordEvent({
        data: {
          eventName: "valuation_generated",
          area: "valuation",
          businessId: bizId,
          targetType: "business",
          targetId: bizId,
          metadata: {
            source: "onboarding",
            years_count: (yearsRows ?? []).length,
          },
        },
      });
      await refresh();
      if (biz) setCurrent(biz);
      toast.success("Your business is saved. Welcome to your dashboard.");
      navigate({ to: "/app" });
    } catch (e) {
      recordEvent({
        data: {
          eventName: "onboarding_save_failed",
          severity: "error",
          area: "onboarding",
          businessId: savedBusinessId,
          targetType: savedBusinessId ? "business" : null,
          targetId: savedBusinessId,
          metadata: {
            stage: "final_save",
            error_name: e instanceof Error ? e.name : "Error",
          },
        },
      }).catch(() => undefined);
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const canNext0 = name.trim().length > 1 && industry;
  const canNext1 = years[2].revenue > 0;
  const canSave = canNext0 && canNext1;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            First run setup
          </div>
          <h1 className="mt-2 font-display text-2xl font-semibold text-primary">
            Build an exit-readiness baseline buyers can trust
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            ValuRight needs a business profile, three years of financial history, and a few owner
            involvement details. The goal is not just a valuation number. It is to show the risks a
            buyer, lender, or advisor will question first.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SetupGuideItem
              icon={FileText}
              title="Profile"
              desc="Industry, location, team, owner role, and buyer-safe description."
            />
            <SetupGuideItem
              icon={TrendingUp}
              title="Financials"
              desc="Revenue, profit, owner compensation, add-backs, assets, liabilities, and debt."
            />
            <SetupGuideItem
              icon={ShieldCheck}
              title="Review"
              desc="Confirm assumptions before saving the first estimate and recommendations."
            />
          </div>
        </div>
        {/* Stepper */}
        <div className="mb-8 flex items-start gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-accent" : "bg-secondary"}`} />
              <div
                className={`mt-2 text-xs font-medium leading-tight ${i === step ? "text-foreground" : "text-muted-foreground"}`}
              >
                {["Profile and buyer risks", "Financial history", "Review and save"][i]}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-primary">
                    Tell us about your business
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with the facts buyers use to judge transferability: what the business
                    does, where it operates, how dependent it is on you, and what risks need work.
                  </p>
                </div>
                <button
                  onClick={fillSample}
                  className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Use sample data
                </button>
              </div>
              {usingSampleData && (
                <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed text-foreground">
                  Sample mode is on. This data is for learning the app only. Rename the business,
                  replace the financials, and save again before using the output with advisors,
                  buyers, or lenders.
                </div>
              )}
              <Field label="Business name" value={name} onChange={setName} />
              <div>
                <label className="block text-sm font-medium">Buyer-safe business description</label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Anonymous and NDA-safe. This is the first thing a buyer sees, so describe the
                  business clearly without revealing the legal name, street address, or customer
                  identities.
                </p>
                <textarea
                  value={anonymousDescription}
                  onChange={(e) => setAnonymousDescription(e.target.value)}
                  rows={3}
                  placeholder="e.g., Established 15-year residential HVAC service company in the Pacific Northwest with recurring maintenance contracts and a tenured field team."
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Industry</label>
                  <select
                    value={industry}
                    onChange={(e) => {
                      setIndustry(e.target.value);
                      setSubIndustry("");
                    }}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {INDUSTRY_OPTIONS.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Sub-industry</label>
                  <input
                    list="sub-industry-options"
                    value={subIndustry}
                    onChange={(e) => setSubIndustry(e.target.value)}
                    placeholder="e.g., Residential HVAC"
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <datalist id="sub-industry-options">
                    {(SUB_INDUSTRY_SUGGESTIONS[industry] ?? []).map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">State</label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select…</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Region (optional)" value={region} onChange={setRegion} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NumField
                  label="Years in business"
                  value={yearsInBusiness}
                  onChange={setYearsInBusiness}
                />
                <NumField
                  label="Employees (incl. owner)"
                  value={employees}
                  onChange={setEmployees}
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium">Business category</label>
                <p className="text-xs text-muted-foreground">
                  Determines which valuation methods are most appropriate. We infer a default, but
                  you should adjust it if buyers would view the business differently.
                </p>
                <div className="grid gap-2">
                  {BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition ${businessCategory === opt.value ? "border-accent bg-accent-soft" : "border-border hover:border-accent/40"}`}
                    >
                      <input
                        type="radio"
                        name="business_category"
                        className="mt-1"
                        checked={businessCategory === opt.value}
                        onChange={() => {
                          setBusinessCategory(opt.value);
                          setCategoryTouched(true);
                        }}
                      />
                      <div className="text-sm">
                        <div className="font-semibold text-foreground">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.description}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium">Examples:</span> {opt.examples}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {businessCategory === "real_estate_income" && (
                <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
                  <div>
                    <h3 className="font-display font-semibold text-primary text-sm">
                      Cap Rate / Income Approach inputs
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lower cap rates generally imply stronger location, better occupancy, lower
                      risk, and higher value. Higher cap rates imply weaker location, seasonality,
                      operational risk, or deferred maintenance.
                      {isRvOrCampground(industry, subIndustry) &&
                        " RV park / campground default range: 8% – 12%, selected 10%."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <NumField
                      label="Low cap rate (%)"
                      value={capRateLow}
                      onChange={setCapRateLow}
                    />
                    <NumField
                      label="Selected cap rate (%)"
                      value={capRateSelected}
                      onChange={setCapRateSelected}
                    />
                    <NumField
                      label="High cap rate (%)"
                      value={capRateHigh}
                      onChange={setCapRateHigh}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <NumField
                      label="Mgmt fee normalization (% of revenue)"
                      value={mgmtFeePct}
                      onChange={setMgmtFeePct}
                    />
                    <NumField
                      label="Replacement reserve (% of revenue)"
                      value={reservePct}
                      onChange={setReservePct}
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <h2 className="font-display text-lg font-semibold text-primary">
                  Operations & owner role
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Buyers discount businesses that depend heavily on one owner, one customer, or
                  undocumented know-how. These answers drive the Health Score and risk notes.
                </p>
              </div>

              <SliderField
                label="Owner hours per week"
                value={ownerHours}
                min={0}
                max={80}
                step={5}
                onChange={setOwnerHours}
                suffix=" hrs"
              />
              <div className="space-y-2">
                <div className="text-sm font-medium">Owner is essential to:</div>
                <Toggle
                  label="Sales / business development"
                  checked={ownerInSales}
                  onChange={setOwnerInSales}
                />
                <Toggle
                  label="Day-to-day operations"
                  checked={ownerInOps}
                  onChange={setOwnerInOps}
                />
                <Toggle
                  label="Top customer relationships"
                  checked={ownerInCustomers}
                  onChange={setOwnerInCustomers}
                />
              </div>
              <SliderField
                label="Recurring revenue (contracts, subscriptions)"
                value={recurringPct}
                min={0}
                max={100}
                step={5}
                onChange={setRecurringPct}
                suffix="%"
              />
              <SliderField
                label="Top customer % of revenue"
                value={topCustomerPct}
                min={0}
                max={100}
                step={5}
                onChange={setTopCustomerPct}
                suffix="%"
              />
              <Choice
                label="SOP / documentation"
                value={sopStatus}
                onChange={setSopStatus}
                options={[
                  { value: "none", label: "None — it lives in my head" },
                  { value: "partial", label: "Partial — key things written down" },
                  { value: "complete", label: "Complete — documented playbook" },
                ]}
              />
              <Choice
                label="Management team depth"
                value={managerDepth}
                onChange={setManagerDepth}
                options={[
                  { value: "none", label: "Owner is the manager" },
                  { value: "partial", label: "Some department leads" },
                  { value: "strong", label: "Full management team in place" },
                ]}
              />
              <Choice
                label="Desired exit timeline"
                value={exitTimeline}
                onChange={(v) => setExitTimeline(v as never)}
                options={[
                  { value: "lt_1y", label: "Now — within 1 year" },
                  { value: "1_2y", label: "Within 1–2 years" },
                  { value: "2_5y", label: "2–5 years" },
                  { value: "5_plus_y", label: "5+ years" },
                  { value: "exploring", label: "Just exploring" },
                ]}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold text-primary">
                  Three years of financials
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  The most recent completed year is required and must end no later than{" "}
                  {currentYear - 1}. Two prior years make the trend, risk, and buyer confidence
                  assessment stronger.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm leading-relaxed text-muted-foreground">
                <div className="font-semibold text-foreground">What to have ready</div>
                <p className="mt-1">
                  Use your P&amp;L and balance sheet for each year. Revenue and profit support the
                  estimate; owner salary and add-backs normalize cash flow; assets, liabilities, and
                  debt help separate enterprise value from what a seller may keep after payoff.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      Import from your accounting software
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Xero can pull reports automatically. QuickBooks can connect securely now.
                      Review imported numbers before relying on them for valuation or buyer
                      discussions.
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={handleConnectQuickBooks}
                      disabled={quickBooksLoading}
                      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary transition"
                    >
                      {quickBooksLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                      {quickBooksConnections.length ? "Reconnect QuickBooks" : "Connect QuickBooks"}
                    </button>
                    {quickBooksConnections.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Connected:{" "}
                        {quickBooksConnections[0].company_name ?? quickBooksConnections[0].realm_id}
                      </span>
                    )}
                    {xeroTenants.length === 0 ? (
                      <button
                        type="button"
                        onClick={handleConnectXero}
                        disabled={xeroLoading}
                        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary transition disabled:opacity-50"
                      >
                        {xeroLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                        Connect Xero
                      </button>
                    ) : (
                      <>
                        <select
                          value={selectedTenant ?? ""}
                          onChange={(e) => setSelectedTenant(e.target.value)}
                          className="rounded-md border border-input bg-background px-2 py-2 text-xs"
                        >
                          {xeroTenants.map((t) => (
                            <option key={t.tenant_id} value={t.tenant_id}>
                              {t.tenant_name ?? t.tenant_id}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => selectedTenant && runXeroImport(selectedTenant)}
                          disabled={xeroLoading || !selectedTenant}
                          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50"
                        >
                          {xeroLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                          Import from Xero
                        </button>
                        <button
                          type="button"
                          onClick={handleConnectXero}
                          disabled={xeroLoading}
                          className="text-xs text-muted-foreground hover:text-foreground underline"
                        >
                          Reconnect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[560px] border-separate border-spacing-x-2 border-spacing-y-1 text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="font-medium pb-1"></th>
                      {years.map((y) => (
                        <th key={y.year} className="font-medium pb-1 text-center">
                          {y.year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: "revenue", label: "Revenue" },
                      { key: "cogs", label: "Cost of goods sold" },
                      { key: "operating_expenses", label: "Operating expenses" },
                      { key: "owner_salary", label: "Owner salary" },
                      { key: "addbacks", label: "Add-backs (personal)" },
                      { key: "ebitda", label: "EBITDA" },
                      { key: "net_income", label: "Net income" },
                      { key: "assets", label: "Total assets" },
                      { key: "liabilities", label: "Total liabilities" },
                      { key: "debt", label: "Debt" },
                    ].map(({ key, label }) => (
                      <tr key={key}>
                        <td className="py-1 pr-2 text-muted-foreground whitespace-nowrap">
                          {label}
                        </td>
                        {years.map((y, i) => (
                          <td key={y.year} className="py-1">
                            <input
                              type="number"
                              value={(y as Record<string, number>)[key] || ""}
                              onChange={(e) =>
                                updateYear(i, { [key]: Number(e.target.value) || 0 } as never)
                              }
                              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                All values in USD. EBITDA should exclude interest, taxes, depreciation, and
                amortization. SDE adds one working owner's compensation and buyer-acceptable
                one-time add-backs to EBITDA, so do not include owner salary again inside add-backs.
                If a number is unknown, enter your best current estimate and revisit it before
                sharing reports.
              </p>
            </div>
          )}

          {step === 2 && (
            <ReviewStep
              data={{
                name,
                industry,
                region,
                yearsInBusiness,
                employees,
                years,
                ownerHours,
                ownerInSales,
                ownerInOps,
                ownerInCustomers,
                recurringPct,
                topCustomerPct,
                sopStatus,
                managerDepth,
                exitTimeline,
              }}
            />
          )}

          {/* Nav */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 2 ? (
              <button
                onClick={saveStepAndAdvance}
                disabled={saving || (step === 0 && !canNext0) || (step === 1 && !canNext1)}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={save}
                disabled={!canSave || saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Save & see my valuation
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ data }: { data: Record<string, unknown> }) {
  const inputs = {
    industry: data.industry as string,
    years_in_business: data.yearsInBusiness as number,
    employees: data.employees as number,
    owner_hours_per_week: data.ownerHours as number,
    owner_in_sales: data.ownerInSales as boolean,
    owner_in_operations: data.ownerInOps as boolean,
    owner_in_customer_relationships: data.ownerInCustomers as boolean,
    recurring_revenue_pct: data.recurringPct as number,
    top_customer_concentration_pct: data.topCustomerPct as number,
    sop_status: data.sopStatus as string,
    manager_team_depth: data.managerDepth as string,
    financials: data.years as never[],
  };
  const v = valueBusiness(inputs);
  const h = computeHealthScore(inputs);
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Review before saving</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This first estimate becomes the baseline for recommendations, scenarios, reports, advisor
          review, and buyer-safe teaser settings.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <ReviewCue
          title="Financial confidence"
          desc="Three clean years and reviewed add-backs make the estimate more credible."
        />
        <ReviewCue
          title="Buyer risk"
          desc="Owner dependence, concentration, and weak documentation can reduce buyer interest."
        />
        <ReviewCue
          title="Next actions"
          desc="After saving, use recommendations and scenarios to improve exit readiness."
        />
      </div>
      <div className="rounded-xl border border-border bg-secondary/40 p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Estimated planning range
        </div>
        <div className="mt-2 font-display text-4xl font-semibold text-primary">
          {fmtCurrency(v.rangeLow, { compact: true })}{" "}
          <span className="text-muted-foreground font-normal">–</span>{" "}
          {fmtCurrency(v.rangeHigh, { compact: true })}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Health Score: <span className="font-semibold text-foreground">{h.total}/100</span>
        </div>
      </div>
      <ValuationDisclaimer />
    </div>
  );
}

function SetupGuideItem({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Sparkles;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function ReviewCue({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[oklch(0.45_0.1_158)]"
      />
    </div>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-secondary/40">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[oklch(0.45_0.1_158)]"
      />
    </label>
  );
}
function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <div className="text-sm font-medium mb-1.5">{label}</div>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition ${value === o.value ? "border-accent bg-accent-soft" : "border-border hover:bg-secondary/40"}`}
          >
            <input
              type="radio"
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-[oklch(0.45_0.1_158)]"
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
