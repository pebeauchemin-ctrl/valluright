import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Circle, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PRODUCT_ANALYTICS_PRIVACY_NOTE, productFunnelProgress } from "@/lib/product-analytics";
import {
  INDUSTRY_OPTIONS,
  BUSINESS_CATEGORY_OPTIONS,
  BUSINESS_SUBTYPES,
  isRvOrCampground,
  type BusinessCategory,
} from "@/lib/valuation";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — ValuRight.ai" }] }),
  component: Settings,
});

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

type AnalyticsEvent = {
  event_name: string;
  created_at: string;
  area: string;
  severity: string;
};

function Settings() {
  const { user } = useAuth();
  const { current, refresh } = useBusiness();
  const [busy, setBusy] = useState(false);

  // Company Basics — all onboarding fields except financial history
  const [name, setName] = useState("");
  const [anonymousDescription, setAnonymousDescription] = useState("");
  const [businessCategory, setBusinessCategory] = useState<BusinessCategory>("standard_operating");
  const [businessSubtype, setBusinessSubtype] = useState<string>("");
  const [industry, setIndustry] = useState<string>(INDUSTRY_OPTIONS[0]);
  const [subIndustry, setSubIndustry] = useState<string>("");
  const [stateCode, setStateCode] = useState<string>("");
  const [region, setRegion] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState<number>(0);
  const [employees, setEmployees] = useState<number>(0);

  // Cap rate (real estate)
  const [capRateLow, setCapRateLow] = useState<number>(8);
  const [capRateSelected, setCapRateSelected] = useState<number>(10);
  const [capRateHigh, setCapRateHigh] = useState<number>(12);
  const [mgmtFeePct, setMgmtFeePct] = useState<number>(0);
  const [reservePct, setReservePct] = useState<number>(0);

  // Operations / risk
  const [ownerHours, setOwnerHours] = useState(50);
  const [ownerInSales, setOwnerInSales] = useState(true);
  const [ownerInOps, setOwnerInOps] = useState(true);
  const [ownerInCustomers, setOwnerInCustomers] = useState(true);
  const [recurringPct, setRecurringPct] = useState(0);
  const [topCustomerPct, setTopCustomerPct] = useState(0);
  const [sopStatus, setSopStatus] = useState("partial");
  const [managerDepth, setManagerDepth] = useState("partial");
  const [exitTimeline, setExitTimeline] = useState<
    "lt_1y" | "1_2y" | "2_5y" | "5_plus_y" | "exploring"
  >("2_5y");
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);

  // Hydrate from current business
  useEffect(() => {
    if (!current) return;
    const c = current;
    setName(c.name ?? "");
    setAnonymousDescription(c.anonymous_description ?? "");
    setBusinessCategory((c.business_category as BusinessCategory) ?? "standard_operating");
    setBusinessSubtype(c.business_subtype ?? "");
    setIndustry(c.industry ?? INDUSTRY_OPTIONS[0]);
    setSubIndustry(c.sub_industry ?? "");
    // Try to split "ST — region" back out
    const reg: string = c.region ?? "";
    if (reg.includes(" — ")) {
      const [st, rest] = reg.split(" — ");
      setStateCode(st);
      setRegion(rest);
    } else if (US_STATES.includes(reg)) {
      setStateCode(reg);
      setRegion("");
    } else {
      setStateCode("");
      setRegion(reg);
    }
    setYearsInBusiness(c.years_in_business ?? 0);
    setEmployees(c.employees ?? 0);
    setCapRateLow(Number(c.cap_rate_low ?? 8));
    setCapRateSelected(Number(c.cap_rate_selected ?? 10));
    setCapRateHigh(Number(c.cap_rate_high ?? 12));
    setMgmtFeePct(Number(c.management_fee_pct ?? 0));
    setReservePct(Number(c.replacement_reserve_pct ?? 0));
    setOwnerHours(c.owner_hours_per_week ?? 50);
    setOwnerInSales(!!c.owner_in_sales);
    setOwnerInOps(!!c.owner_in_operations);
    setOwnerInCustomers(!!c.owner_in_customer_relationships);
    setRecurringPct(Number(c.recurring_revenue_pct ?? 0));
    setTopCustomerPct(Number(c.top_customer_concentration_pct ?? 0));
    setSopStatus(c.sop_status ?? "partial");
    setManagerDepth(c.manager_team_depth ?? "partial");
    setExitTimeline((c.exit_timeline as never) ?? "2_5y");
  }, [current]);

  useEffect(() => {
    if (!current) {
      setAnalyticsEvents([]);
      return;
    }
    supabase
      .from("app_observability_events")
      .select("event_name, created_at, area, severity")
      .eq("business_id", current.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setAnalyticsEvents((data ?? []) as AnalyticsEvent[]));
  }, [current]);

  if (!user) return null;

  const saveBasics = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name,
          anonymous_description: anonymousDescription || null,
          business_category: businessCategory,
          business_subtype: businessSubtype || null,
          industry,
          sub_industry: subIndustry || null,
          region: [stateCode, region].filter(Boolean).join(stateCode && region ? " — " : ""),
          years_in_business: yearsInBusiness,
          employees,
          cap_rate_low: capRateLow,
          cap_rate_selected: capRateSelected,
          cap_rate_high: capRateHigh,
          management_fee_pct: mgmtFeePct,
          replacement_reserve_pct: reservePct,
          owner_hours_per_week: ownerHours,
          owner_in_sales: ownerInSales,
          owner_in_operations: ownerInOps,
          owner_in_customer_relationships: ownerInCustomers,
          recurring_revenue_pct: recurringPct,
          top_customer_concentration_pct: topCustomerPct,
          sop_status: sopStatus,
          manager_team_depth: managerDepth,
          exit_timeline: exitTimeline,
        } as never)
        .eq("id", current.id);
      if (error) throw error;
      await refresh();
      toast.success("Saved. Your valuation will reflect these changes on next compute.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const deleteBusiness = async () => {
    if (!current) return;
    if (!confirm(`Delete "${current.name}"? This permanently removes all data.`)) return;
    await supabase.from("businesses").delete().eq("id", current.id);
    await refresh();
    toast.success("Business deleted");
  };

  const subtypes = BUSINESS_SUBTYPES[businessCategory] ?? [];
  const funnelProgress = productFunnelProgress(analyticsEvents);
  const completedFunnelSteps = funnelProgress.filter((step) => step.completed).length;
  const lastAnalyticsEvent = analyticsEvents[analyticsEvents.length - 1] ?? null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, company basics, and operating profile.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-display font-semibold text-primary">Account</h2>
        <div className="text-sm">
          <span className="text-muted-foreground">Email:</span>{" "}
          <span className="font-medium">{user.email}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary">Legal and trust</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Review how ValuRight.ai handles financial data, accounting connections, and
          software-generated valuation outputs.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/privacy" className="font-semibold text-accent hover:underline">
            Privacy policy
          </Link>
          <Link to="/terms" className="font-semibold text-accent hover:underline">
            Terms
          </Link>
          <Link to="/security" className="font-semibold text-accent hover:underline">
            Security posture
          </Link>
        </div>
      </div>

      {current && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-primary">Activation funnel</h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                {PRODUCT_ANALYTICS_PRIVACY_NOTE}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {completedFunnelSteps} of {funnelProgress.length} complete
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {funnelProgress.map((step) => (
              <div
                key={step.eventName}
                className={`rounded-lg border p-4 ${
                  step.completed
                    ? "border-accent/40 bg-accent-soft/60"
                    : "border-border bg-secondary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{step.label}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {step.completed
                        ? `${step.count} event${step.count === 1 ? "" : "s"} · Last ${formatAnalyticsDate(step.lastSeenAt)}`
                        : "Not recorded yet"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-xs text-muted-foreground">
            Last recorded event:{" "}
            <span className="font-semibold text-foreground">
              {lastAnalyticsEvent
                ? `${lastAnalyticsEvent.event_name} on ${formatAnalyticsDate(lastAnalyticsEvent.created_at)}`
                : "No product analytics events for this business yet"}
            </span>
          </div>
        </section>
      )}

      {current && (
        <>
          {/* Company Basics */}
          <section className="rounded-xl border border-border bg-card p-6 space-y-5">
            <div>
              <h2 className="font-display font-semibold text-primary">Company Basis</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Edits update the business profile and feed the valuation engine. Financial history
                is managed in the Financials tab.
              </p>
            </div>

            <Field label="Business name" value={name} onChange={setName} />

            <div>
              <label className="block text-sm font-medium">Buyer-safe business description</label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Anonymous, NDA-safe — what a buyer sees first.
              </p>
              <textarea
                value={anonymousDescription}
                onChange={(e) => setAnonymousDescription(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Business category</label>
              <p className="text-xs text-muted-foreground">
                Determines which valuation methods are most appropriate.
              </p>
              <div className="grid gap-2">
                {BUSINESS_CATEGORY_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex gap-3 rounded-lg border p-3 cursor-pointer transition ${
                      businessCategory === opt.value
                        ? "border-accent bg-accent-soft"
                        : "border-border hover:border-accent/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="business_category"
                      className="mt-1"
                      checked={businessCategory === opt.value}
                      onChange={() => {
                        setBusinessCategory(opt.value);
                        setBusinessSubtype(""); // reset subtype when category changes
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

            {/* Subtype */}
            <div>
              <label className="block text-sm font-medium">Business type</label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pick the specific kind of business within this category.
              </p>
              <select
                value={businessSubtype}
                onChange={(e) => setBusinessSubtype(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select…</option>
                {subtypes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {INDUSTRY_OPTIONS.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
              <Field label="Sub-industry" value={subIndustry} onChange={setSubIndustry} />
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

            <div className="grid grid-cols-2 gap-4">
              <NumField
                label="Years in business"
                value={yearsInBusiness}
                onChange={setYearsInBusiness}
              />
              <NumField label="Employees (incl. owner)" value={employees} onChange={setEmployees} />
            </div>

            {businessCategory === "real_estate_income" && (
              <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
                <div>
                  <h3 className="font-display font-semibold text-primary text-sm">
                    Cap Rate / Income Approach inputs
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lower cap rates imply stronger location and lower risk; higher cap rates imply
                    more risk.
                    {isRvOrCampground(industry, subIndustry) &&
                      " RV park / campground default range: 8% – 12%."}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <NumField label="Low cap rate (%)" value={capRateLow} onChange={setCapRateLow} />
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
                <div className="grid grid-cols-2 gap-3">
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
              <h3 className="font-display text-base font-semibold text-primary">
                Operations & owner role
              </h3>
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
              <Toggle label="Day-to-day operations" checked={ownerInOps} onChange={setOwnerInOps} />
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

            <div className="pt-2">
              <button
                onClick={saveBasics}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> Save changes
              </button>
            </div>
          </section>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
            <h2 className="font-display font-semibold text-destructive">Danger zone</h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete this business and all its data.
            </p>
            <button
              onClick={deleteBusiness}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive bg-card px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" /> Delete business
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function formatAnalyticsDate(value: string | null) {
  if (!value) return "unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
