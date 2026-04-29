import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, Loader2, Upload, Link2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBusiness, toBusinessInputs } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import {
  INDUSTRY_OPTIONS, valueBusiness, computeHealthScore,
  SAMPLE_HVAC_BUSINESS, SAMPLE_HVAC_FINANCIALS,
} from "@/lib/valuation";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { startXeroConnect, importXeroFinancials, listXeroConnections } from "@/lib/xero.functions";

type OnboardingSearch = {
  xero?: "connected" | "error";
  tenant?: string;
  message?: string;
};

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — ValuRight.ai" }] }),
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    xero: search.xero === "connected" || search.xero === "error" ? search.xero : undefined,
    tenant: typeof search.tenant === "string" ? search.tenant : undefined,
    message: typeof search.message === "string" ? search.message : undefined,
  }),
  component: Onboarding,
});

type Step = 0 | 1 | 2;

const currentYear = new Date().getFullYear();

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC","PR",
];

const SUB_INDUSTRY_SUGGESTIONS: Record<string, string[]> = {
  "HVAC / Trades": ["HVAC", "Plumbing", "Electrical", "Roofing", "Landscaping", "Pest control", "General contracting"],
  "Professional Services": ["Accounting / CPA", "Legal", "Marketing agency", "Consulting", "IT services", "Architecture / Engineering"],
  "Healthcare Practice": ["Dental", "Veterinary", "Medical / Primary care", "Physical therapy", "Optometry", "Mental health"],
  "Construction": ["Residential", "Commercial", "Specialty trades", "Remodeling", "Site work / excavation"],
  "Restaurant / Hospitality": ["QSR / Fast casual", "Full service restaurant", "Bar / Pub", "Catering", "Hotel / Lodging", "Food truck"],
  "Retail": ["Apparel", "Convenience / C-store", "Specialty retail", "Furniture / Home goods", "Liquor store", "Gas station"],
  "Manufacturing": ["Metal fabrication", "Food & beverage", "Plastics", "Electronics", "Custom / Job shop", "Consumer products"],
  "E-commerce / Online": ["Amazon / Marketplace seller", "DTC brand", "Subscription box", "Digital products", "Dropshipping"],
  "Software / SaaS": ["B2B SaaS", "B2C SaaS", "Vertical SaaS", "Mobile app", "Marketplace", "Dev tools"],
  "Auto Repair / Service": ["General auto repair", "Body shop / Collision", "Tire / Wheel", "Quick lube", "Transmission", "Detailing"],
  "Logistics / Transport": ["Trucking / Freight", "Last-mile delivery", "Warehousing", "Moving services", "Courier"],
  "Other": [],
};

function emptyYear(year: number) {
  return {
    year, revenue: 0, cogs: 0, gross_profit: 0, operating_expenses: 0,
    owner_salary: 0, addbacks: 0, ebitda: 0, net_income: 0,
    assets: 0, liabilities: 0, debt: 0,
  };
}

function Onboarding() {
  const { user } = useAuth();
  const { refresh, setCurrent } = useBusiness();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [step, setStep] = useState<Step>(0);
  const [saving, setSaving] = useState(false);

  // Xero
  const startXero = useServerFn(startXeroConnect);
  const importXero = useServerFn(importXeroFinancials);
  const fetchConnections = useServerFn(listXeroConnections);
  const [xeroLoading, setXeroLoading] = useState(false);
  const [xeroTenants, setXeroTenants] = useState<{ tenant_id: string; tenant_name: string | null }[]>([]);
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
  const [exitTimeline, setExitTimeline] = useState<"lt_1y" | "1_2y" | "2_5y" | "5_plus_y" | "exploring">("2_5y");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.xero]);

  // Load any pre-existing Xero tenants for this user on mount.
  useEffect(() => {
    if (!user) return;
    fetchConnections()
      .then(({ connections }) => {
        if (connections.length) {
          setXeroTenants(connections.map((c) => ({ tenant_id: c.tenant_id, tenant_name: c.tenant_name })));
          setSelectedTenant((prev) => prev ?? connections[0].tenant_id);
        }
      })
      .catch(() => { /* ignore */ });
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

  const runXeroImport = async (tenantId: string) => {
    try {
      setXeroLoading(true);
      const requestedYears = [currentYear - 3, currentYear - 2, currentYear - 1];
      const { years: imported } = await importXero({
        data: { tenantId, years: requestedYears },
      });
      setYears((prev) =>
        prev.map((row) => {
          const match = imported.find((y) => y.year === row.year);
          return match ? { ...row, ...match } : row;
        }),
      );
      toast.success(`Imported ${imported.length} year(s) of P&L and Balance Sheet from Xero. Review and adjust owner salary and add-backs.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xero import failed");
    } finally {
      setXeroLoading(false);
    }
  };

  const fillSample = () => {
    setName(SAMPLE_HVAC_BUSINESS.name);
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
    toast.success("Filled with sample data — review and continue.");
  };

  const updateYear = (idx: number, patch: Partial<(typeof years)[number]>) => {
    setYears((prev) => prev.map((y, i) => {
      if (i !== idx) return y;
      const next = { ...y, ...patch };
      next.gross_profit = next.revenue - next.cogs;
      return next;
    }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
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
        })
        .select()
        .single();
      if (bizErr || !biz) throw bizErr ?? new Error("Failed to create business");

      const yearsToInsert = years
        .filter((y) => y.revenue > 0)
        .map((y) => ({ ...y, business_id: biz.id }));
      if (yearsToInsert.length) {
        const { error: yErr } = await supabase.from("financial_years").insert(yearsToInsert);
        if (yErr) throw yErr;
      }

      // Compute and store first valuation
      const inputs = toBusinessInputs(biz, yearsToInsert as never);
      const v = valueBusiness(inputs);
      const h = computeHealthScore(inputs);
      const findM = (k: string) => v.methods.find((m) => m.method === k);
      await supabase.from("valuations").insert({
        business_id: biz.id,
        range_low: v.rangeLow, range_mid: v.rangeMid, range_high: v.rangeHigh,
        sde_value: findM("sde")?.value ?? null, sde_low: findM("sde")?.low ?? null, sde_high: findM("sde")?.high ?? null,
        ebitda_value: findM("ebitda")?.value ?? null, ebitda_low: findM("ebitda")?.low ?? null, ebitda_high: findM("ebitda")?.high ?? null,
        revenue_value: findM("revenue")?.value ?? null, revenue_low: findM("revenue")?.low ?? null, revenue_high: findM("revenue")?.high ?? null,
        dcf_value: findM("dcf")?.value ?? null, dcf_low: findM("dcf")?.low ?? null, dcf_high: findM("dcf")?.high ?? null,
        asset_value: findM("asset")?.value ?? null, asset_low: findM("asset")?.low ?? null, asset_high: findM("asset")?.high ?? null,
        comparable_value: findM("comparable")?.value ?? null,
        health_score: h.total,
        health_breakdown: h.breakdown as never,
        inputs_snapshot: inputs as never,
      });

      await refresh();
      setCurrent(biz);
      toast.success("Your business is saved. Welcome to your dashboard.");
      navigate({ to: "/app" });
    } catch (e) {
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
      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Stepper */}
        <div className="mb-8 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-accent" : "bg-secondary"}`} />
              <div className={`mt-2 text-xs font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                {["Business profile", "Financials", "Review"][i]}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-primary">Tell us about your business</h1>
                  <p className="mt-1 text-sm text-muted-foreground">The basics — you can refine this later.</p>
                </div>
                <button onClick={fillSample} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                  <Sparkles className="h-3.5 w-3.5" /> Use sample data
                </button>
              </div>
              <Field label="Business name" value={name} onChange={setName} />
              <div>
                <label className="block text-sm font-medium">Buyer-safe business description</label>
                <p className="text-xs text-muted-foreground mt-0.5">Anonymous, NDA-safe — what a buyer sees first. Avoid your business name or location.</p>
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
                  <select value={industry} onChange={(e) => { setIndustry(e.target.value); setSubIndustry(""); }}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {INDUSTRY_OPTIONS.map((i) => <option key={i}>{i}</option>)}
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
                    {(SUB_INDUSTRY_SUGGESTIONS[industry] ?? []).map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">State</label>
                  <select value={stateCode} onChange={(e) => setStateCode(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select…</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Region (optional)" value={region} onChange={setRegion} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <NumField label="Years in business" value={yearsInBusiness} onChange={setYearsInBusiness} />
                <NumField label="Employees (incl. owner)" value={employees} onChange={setEmployees} />
              </div>

              <div className="pt-2 border-t border-border">
                <h2 className="font-display text-lg font-semibold text-primary">Operations & owner role</h2>
                <p className="mt-1 text-xs text-muted-foreground">These shape buyer confidence and the multiple we can apply.</p>
              </div>

              <SliderField label="Owner hours per week" value={ownerHours} min={0} max={80} step={5} onChange={setOwnerHours} suffix=" hrs" />
              <div className="space-y-2">
                <div className="text-sm font-medium">Owner is essential to:</div>
                <Toggle label="Sales / business development" checked={ownerInSales} onChange={setOwnerInSales} />
                <Toggle label="Day-to-day operations" checked={ownerInOps} onChange={setOwnerInOps} />
                <Toggle label="Top customer relationships" checked={ownerInCustomers} onChange={setOwnerInCustomers} />
              </div>
              <SliderField label="Recurring revenue (contracts, subscriptions)" value={recurringPct} min={0} max={100} step={5} onChange={setRecurringPct} suffix="%" />
              <SliderField label="Top customer % of revenue" value={topCustomerPct} min={0} max={100} step={5} onChange={setTopCustomerPct} suffix="%" />
              <Choice label="SOP / documentation" value={sopStatus} onChange={setSopStatus} options={[
                { value: "none", label: "None — it lives in my head" },
                { value: "partial", label: "Partial — key things written down" },
                { value: "complete", label: "Complete — documented playbook" },
              ]} />
              <Choice label="Management team depth" value={managerDepth} onChange={setManagerDepth} options={[
                { value: "none", label: "Owner is the manager" },
                { value: "partial", label: "Some department leads" },
                { value: "strong", label: "Full management team in place" },
              ]} />
              <Choice label="Desired exit timeline" value={exitTimeline} onChange={(v) => setExitTimeline(v as never)} options={[
                { value: "lt_1y", label: "Now — within 1 year" },
                { value: "1_2y", label: "Within 1–2 years" },
                { value: "2_5y", label: "2–5 years" },
                { value: "5_plus_y", label: "5+ years" },
                { value: "exploring", label: "Just exploring" },
              ]} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold text-primary">Three years of financials</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Most recent year is required and must end no later than {currentYear - 1}. Two prior years strengthen the estimate.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-sm font-semibold text-foreground">Import from your accounting software</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Pull P&amp;L and balance sheet data automatically.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toast.info("QuickBooks import is coming soon. Enter your numbers manually for now.")}
                      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary transition"
                    >
                      <Upload className="h-3.5 w-3.5" /> QuickBooks
                    </button>
                    {xeroTenants.length === 0 ? (
                      <button
                        type="button"
                        onClick={handleConnectXero}
                        disabled={xeroLoading}
                        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary transition disabled:opacity-50"
                      >
                        {xeroLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
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
                            <option key={t.tenant_id} value={t.tenant_id}>{t.tenant_name ?? t.tenant_id}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => selectedTenant && runXeroImport(selectedTenant)}
                          disabled={xeroLoading || !selectedTenant}
                          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50"
                        >
                          {xeroLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
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
              <div className="overflow-x-auto -mx-2">
                <table className="w-full border-separate border-spacing-x-2 border-spacing-y-1 text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th className="font-medium pb-1"></th>
                      {years.map((y) => <th key={y.year} className="font-medium pb-1 text-center">{y.year}</th>)}
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
                        <td className="py-1 pr-2 text-muted-foreground whitespace-nowrap">{label}</td>
                        {years.map((y, i) => (
                          <td key={y.year} className="py-1">
                            <input
                              type="number"
                              value={(y as Record<string, number>)[key] || ""}
                              onChange={(e) => updateYear(i, { [key]: Number(e.target.value) || 0 } as never)}
                              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">All values in USD. EBITDA = earnings before interest, tax, depreciation, amortization. Add-backs are personal expenses run through the business that a buyer wouldn't continue.</p>
            </div>
          )}

          {step === 2 && <ReviewStep
            data={{
              name, industry, region, yearsInBusiness, employees, years,
              ownerHours, ownerInSales, ownerInOps, ownerInCustomers,
              recurringPct, topCustomerPct, sopStatus, managerDepth, exitTimeline,
            }}
          />}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1) as Step)}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => Math.min(3, s + 1) as Step)}
                disabled={(step === 0 && !canNext0) || (step === 1 && !canNext1)}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={save}
                disabled={!canSave || saving}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition disabled:opacity-50"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Save & see my valuation</>}
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
        <h1 className="font-display text-2xl font-semibold text-primary">Quick preview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Save to lock in your valuation and unlock recommendations.</p>
      </div>
      <div className="rounded-xl border border-border bg-secondary/40 p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated value range</div>
        <div className="mt-2 font-display text-4xl font-semibold text-primary">
          {fmtCurrency(v.rangeLow, { compact: true })} <span className="text-muted-foreground font-normal">–</span> {fmtCurrency(v.rangeHigh, { compact: true })}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">Health Score: <span className="font-semibold text-foreground">{h.total}/100</span></div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
function SliderField({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[oklch(0.45_0.1_158)]" />
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-secondary/40">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[oklch(0.45_0.1_158)]" />
    </label>
  );
}
function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1.5">{label}</div>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition ${value === o.value ? "border-accent bg-accent-soft" : "border-border hover:bg-secondary/40"}`}>
            <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} className="accent-[oklch(0.45_0.1_158)]" />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
