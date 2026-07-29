import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Circle,
  CreditCard,
  ExternalLink,
  Loader2,
  Search,
  ShieldCheck,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PRODUCT_ANALYTICS_PRIVACY_NOTE, productFunnelProgress } from "@/lib/product-analytics";
import {
  getAdminBillingOverview,
  getSupportAdminAccess,
  searchSupportAccounts,
  type AdminBillingOverview,
} from "@/lib/support-admin.functions";
import { openStripeBillingPortal } from "@/lib/billing.functions";
import {
  SUPPORT_ACTIONS,
  SUPPORT_ADMIN_NOTICE,
  type SupportAccountSummary,
} from "@/lib/support-admin";
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

type SubscriptionSummary = {
  plan: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

const PLAN_LABELS: Record<string, string> = {
  essentials: "Essentials",
  "exit-ready": "Exit Ready",
  free: "Free Preview",
};

function planLabel(plan: string | null | undefined) {
  return PLAN_LABELS[plan ?? "free"] ?? "Free Preview";
}

function formatBillingDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

function Settings() {
  const openBillingPortal = useServerFn(openStripeBillingPortal);
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
  const checkSupportAdminAccess = useServerFn(getSupportAdminAccess);
  const searchSupportAdminAccounts = useServerFn(searchSupportAccounts);
  const loadAdminBillingOverview = useServerFn(getAdminBillingOverview);
  const [isSupportAdmin, setIsSupportAdmin] = useState(false);
  const [supportQuery, setSupportQuery] = useState("");
  const [supportSearching, setSupportSearching] = useState(false);
  const [supportResults, setSupportResults] = useState<SupportAccountSummary[]>([]);
  const [selectedSupportAccount, setSelectedSupportAccount] =
    useState<SupportAccountSummary | null>(null);
  const [adminBilling, setAdminBilling] = useState<AdminBillingOverview | null>(null);
  const [adminBillingLoading, setAdminBillingLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [openingBillingPortal, setOpeningBillingPortal] = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    checkSupportAdminAccess()
      .then((result) => {
        if (!cancelled) setIsSupportAdmin(result.isAdmin);
      })
      .catch(() => {
        if (!cancelled) setIsSupportAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [checkSupportAdminAccess]);

  useEffect(() => {
    let cancelled = false;
    if (!isSupportAdmin) {
      setAdminBilling(null);
      return;
    }

    setAdminBillingLoading(true);
    loadAdminBillingOverview()
      .then((overview) => {
        if (!cancelled) setAdminBilling(overview);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load the admin billing overview.");
      })
      .finally(() => {
        if (!cancelled) setAdminBillingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isSupportAdmin, loadAdminBillingOverview]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSubscription(null);
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);
    supabase
      .from("subscriptions")
      .select("plan, status, cancel_at_period_end, current_period_end, stripe_customer_id")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          toast.error("Could not load billing details.");
          setSubscription(null);
        } else {
          setSubscription(data as SubscriptionSummary | null);
        }
        setSubscriptionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const runSupportSearch = async () => {
    if (supportQuery.trim().length < 2) {
      toast.error("Enter at least 2 characters.");
      return;
    }
    setSupportSearching(true);
    try {
      const result = await searchSupportAdminAccounts({ data: { query: supportQuery } });
      setSupportResults(result.results);
      setSelectedSupportAccount(result.results[0] ?? null);
      if (result.results.length === 0) toast.info("No matching account found.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Support search failed");
    } finally {
      setSupportSearching(false);
    }
  };

  const manageBilling = async () => {
    setOpeningBillingPortal(true);
    try {
      const result = await openBillingPortal();
      window.location.assign(result.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing settings.");
      setOpeningBillingPortal(false);
    }
  };

  const subtypes = BUSINESS_SUBTYPES[businessCategory] ?? [];
  const funnelProgress = productFunnelProgress(analyticsEvents);
  const completedFunnelSteps = funnelProgress.filter((step) => step.completed).length;
  const lastAnalyticsEvent = analyticsEvents[analyticsEvents.length - 1] ?? null;
  const billingNeedsAttention = ["past_due", "unpaid", "incomplete"].includes(subscription?.status ?? "");
  const billingHasEnded = ["canceled", "incomplete_expired"].includes(subscription?.status ?? "");
  const healthScoreDefaultedInputs = current
    ? [
        current.owner_hours_per_week == null ? "owner hours" : null,
        current.owner_in_sales == null ||
        current.owner_in_operations == null ||
        current.owner_in_customer_relationships == null
          ? "owner role toggles"
          : null,
        current.top_customer_concentration_pct == null ? "top customer concentration" : null,
        current.sop_status == null ? "SOP status" : null,
        current.manager_team_depth == null ? "management team depth" : null,
      ].filter((value): value is string => Boolean(value))
    : [];

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
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/pricing" className="text-sm font-semibold text-accent hover:underline">View plans</Link>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-6" aria-labelledby="billing-heading">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              <h2 id="billing-heading" className="font-display font-semibold text-primary">Billing</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              View your plan and manage payment details securely through Stripe.
            </p>
          </div>
          {!subscriptionLoading && subscription && subscription.plan !== "free" && (
            <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {planLabel(subscription.plan)}
            </span>
          )}
        </div>

        {subscriptionLoading ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading billing details
          </div>
        ) : !subscription || subscription.plan === "free" ? (
          <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-4">
            <div className="text-sm font-semibold text-foreground">Free Preview</div>
            <p className="mt-1 text-sm text-muted-foreground">
              You are using the free tier. Upgrade to publish a buyer teaser, use the Data Room, or invite advisors.
            </p>
            <Link
              to="/pricing"
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              View plans <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <BillingDetail label="Current plan" value={planLabel(subscription.plan)} />
              <BillingDetail
                label={subscription.cancel_at_period_end ? "Access ends" : "Next renewal"}
                value={formatBillingDate(subscription.current_period_end)}
              />
            </div>

            {billingNeedsAttention ? (
              <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <div className="font-semibold text-foreground">Payment needs attention</div>
                  <p className="mt-1 text-muted-foreground">
                    Update your payment method in Stripe to keep your paid access active.
                  </p>
                </div>
              </div>
            ) : subscription.cancel_at_period_end ? (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                Your subscription is set to cancel. Paid features remain available through {formatBillingDate(subscription.current_period_end)}, then your account returns to the Free Preview tier.
              </div>
            ) : billingHasEnded ? (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                This subscription has ended. Choose a plan to restore paid features.
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                Your subscription is active. You can update payment details, download receipts, or cancel from the Stripe billing portal.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={manageBilling}
                disabled={openingBillingPortal}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
              >
                {openingBillingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Manage subscription
              </button>
              <Link to="/pricing" className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary">
                Compare plans
              </Link>
            </div>
          </div>
        )}
      </section>

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

      {isSupportAdmin && (
        <>
          <AdminBillingPanel overview={adminBilling} loading={adminBillingLoading} />
          <SupportAdminPanel
            query={supportQuery}
            setQuery={setSupportQuery}
            searching={supportSearching}
            results={supportResults}
            selected={selectedSupportAccount}
            setSelected={setSelectedSupportAccount}
            onSearch={runSupportSearch}
          />
        </>
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
            {healthScoreDefaultedInputs.length > 0 && (
              <div className="flex gap-3 rounded-lg border border-gold/40 bg-gold/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-foreground" />
                <div>
                  <div className="font-semibold text-foreground">
                    Confirm the assumptions used by Health Score
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    These fields are showing default suggestions but have not been saved yet:{" "}
                    {healthScoreDefaultedInputs.join(", ")}. Review the values below and click Save
                    to confirm them.
                  </p>
                </div>
              </div>
            )}

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

function SupportAdminPanel({
  query,
  setQuery,
  searching,
  results,
  selected,
  setSelected,
  onSearch,
}: {
  query: string;
  setQuery: (value: string) => void;
  searching: boolean;
  results: SupportAccountSummary[];
  selected: SupportAccountSummary | null;
  setSelected: (account: SupportAccountSummary | null) => void;
  onSearch: () => void;
}) {
  return (
    <section className="rounded-xl border border-accent/30 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h2 className="font-display font-semibold text-primary">Support admin</h2>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Look up early users by email or company name. {SUPPORT_ADMIN_NOTICE}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder="Search by user email or company name"
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={onSearch}
          disabled={searching}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
        >
          <Search className="h-4 w-4" /> {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-2">
            {results.map((account) => (
              <button
                key={`${account.userId}-${account.businessId ?? "no-business"}`}
                onClick={() => setSelected(account)}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selected?.userId === account.userId && selected?.businessId === account.businessId
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-secondary/30 hover:border-accent/50"
                }`}
              >
                <div className="text-sm font-semibold text-foreground">
                  {account.businessName ?? account.company ?? account.email ?? "Unknown account"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{account.email}</div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <StatusPill ok={account.onboarding.hasBusinessProfile} label="Profile" />
                  <StatusPill ok={account.onboarding.hasValuation} label="Valuation" />
                  <StatusPill ok={account.importStatus?.status === "success"} label="Import" />
                </div>
              </button>
            ))}
          </div>

          {selected && <SupportAccountDetails account={selected} />}
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {SUPPORT_ACTIONS.map((action) => (
          <div key={action.title} className="rounded-lg border border-border bg-secondary/30 p-4">
            <div className="text-sm font-semibold text-foreground">{action.title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SupportAccountDetails({ account }: { account: SupportAccountSummary }) {
  const importStatus = account.importStatus;
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-4">
      <div>
        <div className="text-sm font-semibold text-primary">
          {account.businessName ?? account.company ?? "Account details"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {account.fullName ?? "No profile name"} · {account.email ?? "No email available"}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <SupportMetric
          label="Onboarding"
          value={`${account.onboarding.financialYearCount} financial year${account.onboarding.financialYearCount === 1 ? "" : "s"}`}
        />
        <SupportMetric
          label="Last valuation"
          value={formatSupportDate(account.lastValuationRunAt)}
        />
        <SupportMetric
          label="Buyer teaser"
          value={account.onboarding.buyerTeaserPublished ? "Published" : "Not published"}
        />
        <SupportMetric
          label="Connections"
          value={`Xero ${account.connections.xeroCount} · QB ${account.connections.quickBooksCount}`}
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Import status
        </div>
        {importStatus ? (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">{importStatus.source}</span> ·{" "}
              {importStatus.status} · {formatSupportDate(importStatus.startedAt)}
            </div>
            <div>Reports: {importStatus.reportNames.join(", ") || "None recorded"}</div>
            <div>Warnings: {importStatus.warningCount}</div>
            {importStatus.errorMessage && (
              <div className="rounded-md bg-destructive/10 px-2 py-1 text-destructive">
                {importStatus.errorMessage}
              </div>
            )}
            {Object.keys(importStatus.metadata).length > 0 && (
              <pre className="mt-2 max-h-28 overflow-auto rounded-md bg-background p-2 text-[11px] text-foreground">
                {JSON.stringify(importStatus.metadata, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <div className="mt-2 text-xs text-muted-foreground">No import attempts recorded.</div>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recent safe events
        </div>
        <div className="mt-2 space-y-2">
          {account.recentEvents.length > 0 ? (
            account.recentEvents.map((event) => (
              <div key={`${event.eventName}-${event.createdAt}`} className="text-xs">
                <div className="font-semibold text-foreground">
                  {event.eventName} · {event.severity}
                </div>
                <div className="text-muted-foreground">
                  {event.area} · {formatSupportDate(event.createdAt)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">No recent support events.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SupportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-semibold ${
        ok ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function formatSupportDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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

function BillingDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
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

function AdminBillingPanel({
  overview,
  loading,
}: {
  overview: AdminBillingOverview | null;
  loading: boolean;
}) {
  if (loading && !overview) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading billing overview...
      </section>
    );
  }
  if (!overview) return null;

  const paymentProblems = overview.subscriptions.filter((subscription) =>
    ["past_due", "unpaid", "incomplete"].includes(subscription.status),
  );
  const anomalyEvents = overview.webhookEvents.filter(
    (event) => event.errorMessage || !event.processedAt,
  );

  return (
    <section className="rounded-xl border border-accent/30 bg-card p-6">
      <div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent" />
          <h2 className="font-display font-semibold text-primary">Admin billing overview</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Read-only subscription health. Use Stripe for refunds, cards, invoices, and disputes.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <BillingDetail label="Monthly recurring revenue" value={formatAdminCurrency(overview.metrics.mrr)} />
        <BillingDetail label="Past due / unpaid" value={String(overview.metrics.pastDueAccounts)} />
        <BillingDetail label="Free accounts" value={String(overview.metrics.freeAccounts)} />
        <BillingDetail label="Canceled this month" value={String(overview.metrics.canceledThisMonth)} />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Active subscriptions by plan
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {overview.metrics.activeByPlan.length > 0 ? (
            overview.metrics.activeByPlan.map((item) => (
              <span key={item.plan} className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                {planLabel(item.plan)}: {item.count}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No active paid subscriptions.</span>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          One-time report purchases this month: {overview.metrics.oneTimePurchasesThisMonth}. This product is not currently offered.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Renews</th>
              <th className="px-4 py-3 font-semibold">Started</th>
              <th className="px-4 py-3 font-semibold">Stripe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {overview.subscriptions.map((subscription) => (
              <tr key={subscription.userId} className="bg-card">
                <td className="px-4 py-3">{subscription.email ?? "Email unavailable"}</td>
                <td className="px-4 py-3">{planLabel(subscription.plan)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    ["past_due", "unpaid", "incomplete"].includes(subscription.status)
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent-soft text-accent"
                  }`}>
                    {subscription.status.replace(/_/g, " ")}
                    {subscription.cancelAtPeriodEnd ? " (cancels)" : ""}
                  </span>
                </td>
                <td className="px-4 py-3">{formatBillingDate(subscription.currentPeriodEnd)}</td>
                <td className="px-4 py-3">{formatBillingDate(subscription.startedAt)}</td>
                <td className="px-4 py-3">
                  {subscription.stripeCustomerUrl ? (
                    <a
                      href={subscription.stripeCustomerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                    >
                      Open <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not linked</span>
                  )}
                </td>
              </tr>
            ))}
            {overview.subscriptions.length === 0 && (
              <tr>
                <td className="px-4 py-5 text-muted-foreground" colSpan={6}>
                  No subscription records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(paymentProblems.length > 0 || anomalyEvents.length > 0) && (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="font-semibold text-destructive">Payment problems</div>
            <div className="mt-2 space-y-1 text-sm">
              {paymentProblems.length > 0 ? (
                paymentProblems.map((subscription) => (
                  <div key={subscription.userId}>
                    {subscription.email ?? "Email unavailable"} · {subscription.status.replace(/_/g, " ")}
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground">No past-due subscriptions.</div>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-gold/40 bg-gold/10 p-4">
            <div className="font-semibold text-foreground">Webhook attention</div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {anomalyEvents.slice(0, 5).map((event) => (
                <div key={`${event.eventType}-${event.receivedAt}`}>
                  {event.eventType} · {event.errorMessage ?? "Not processed"} · {formatBillingDate(event.receivedAt)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatAdminCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
