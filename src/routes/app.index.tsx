import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Eye,
  Sliders,
  Loader2,
  Clock,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useBusiness, toBusinessInputs, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import {
  valueBusiness,
  computeHealthScore,
  type Valuation,
  type MethodResult,
  type MultipleAssumption,
} from "@/lib/valuation";
import { buildValuationInsert } from "@/lib/valuation-persistence";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { MethodDetailDialog, MethodRangeBar } from "@/components/MethodDetailDialog";
import { ValuationDisclaimer } from "@/components/ValuationDisclaimer";
import { AccessibleChart } from "@/components/AccessibleChart";
import { recordProductEvent } from "@/lib/observability.functions";
import {
  dataQualityAcknowledgementKey,
  normalizeAccountingBasis,
  reviewFinancialData,
  type DataQualityReview,
} from "@/lib/data-quality";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — ValuRight.ai" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { current, loading: bizLoading } = useBusiness();
  const recordEvent = useServerFn(recordProductEvent);
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMethod, setActiveMethod] = useState<MethodResult | null>(null);
  const [hasSavedValuation, setHasSavedValuation] = useState<boolean | null>(null);
  const [savingValuation, setSavingValuation] = useState(false);
  const [lastValuationAt, setLastValuationAt] = useState<string | null>(null);
  const [hasXeroConnection, setHasXeroConnection] = useState(false);
  const [hasQuickBooksConnection, setHasQuickBooksConnection] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [dataQualityAcknowledged, setDataQualityAcknowledged] = useState(false);
  const [multipleAssumptions, setMultipleAssumptions] = useState<MultipleAssumption[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setFinancials([]);
      setHasSavedValuation(null);
      setLastValuationAt(null);
      setHasXeroConnection(false);
      setHasQuickBooksConnection(false);
      setMultipleAssumptions([]);
      setReviewOpen(false);
      setDataQualityAcknowledged(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      supabase
        .from("financial_years")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: true }),
      supabase
        .from("valuations")
        .select("id, computed_at")
        .eq("business_id", current.id)
        .order("computed_at", { ascending: false })
        .limit(1),
      supabase.from("xero_connections").select("id").eq("business_id", current.id).limit(1),
      supabase.from("quickbooks_connections").select("id").eq("business_id", current.id).limit(1),
      (supabase as any).from("industry_multiple_assumptions").select("*").eq("active", true),
    ]).then(
      ([financialsResult, valuationsResult, xeroResult, quickBooksResult, assumptionsResult]) => {
        if (cancelled) return;
        setFinancials(financialsResult.data ?? []);
        setHasSavedValuation(Boolean(valuationsResult.data?.length));
        setLastValuationAt(valuationsResult.data?.[0]?.computed_at ?? null);
        setHasXeroConnection(Boolean(xeroResult.data?.length));
        setHasQuickBooksConnection(Boolean(quickBooksResult.data?.length));
        setMultipleAssumptions(normalizeMultipleAssumptions(assumptionsResult.data));
        setReviewOpen(false);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [current]);

  const inputs = useMemo(
    () => (current ? toBusinessInputs(current, financials, multipleAssumptions) : null),
    [current, financials, multipleAssumptions],
  );
  const valuation: Valuation | null = useMemo(
    () => (inputs ? valueBusiness(inputs) : null),
    [inputs],
  );
  const health = useMemo(() => (inputs ? computeHealthScore(inputs) : null), [inputs]);
  const dataQuality = useMemo(
    () =>
      reviewFinancialData(financials, {
        accountingBasis: normalizeAccountingBasis(current?.accounting_basis),
      }),
    [current?.accounting_basis, financials],
  );
  const dataQualityAckKey = useMemo(
    () => dataQualityAcknowledgementKey(current?.id, dataQuality),
    [current?.id, dataQuality],
  );

  useEffect(() => {
    if (!dataQualityAckKey || typeof window === "undefined") {
      setDataQualityAcknowledged(false);
      return;
    }
    setDataQualityAcknowledged(window.localStorage.getItem(dataQualityAckKey) === "true");
  }, [dataQualityAckKey]);

  const setDataQualityAcknowledgement = (value: boolean) => {
    setDataQualityAcknowledged(value);
    if (!dataQualityAckKey || typeof window === "undefined") return;
    if (value) window.localStorage.setItem(dataQualityAckKey, "true");
    else window.localStorage.removeItem(dataQualityAckKey);
  };

  const openReviewPanel = () => {
    setReviewOpen(true);
    window.setTimeout(() => {
      document
        .getElementById("valuation-snapshot-review")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const saveCurrentValuation = async () => {
    if (!current || !inputs || !valuation || !health) return;
    if (dataQuality.requiredAcknowledgement && !dataQualityAcknowledged) {
      openReviewPanel();
      toast.error("Acknowledge the data quality warning before saving this valuation.");
      return;
    }
    setSavingValuation(true);
    try {
      const { error } = await supabase
        .from("valuations")
        .insert(buildValuationInsert(current.id, inputs, valuation, health));
      if (error) throw error;
      await recordEvent({
        data: {
          eventName: "valuation_generated",
          area: "valuation",
          businessId: current.id,
          targetType: "business",
          targetId: current.id,
          metadata: {
            source: "dashboard",
            method_count: valuation.methods.length,
            health_band: health.ratingLabel,
          },
        },
      }).catch(() => undefined);
      setHasSavedValuation(true);
      setLastValuationAt(new Date().toISOString());
      setReviewOpen(false);
      toast.success("Valuation generated and saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not generate valuation");
    } finally {
      setSavingValuation(false);
    }
  };

  if (bizLoading || loading) {
    return <div className="p-12 text-sm text-muted-foreground">Loading your dashboard…</div>;
  }
  if (!current) {
    return (
      <div className="p-12">
        <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-semibold text-primary">
            Add your first business baseline
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            In about 15 minutes, enter the profile, financial history, and owner-risk details buyers
            will ask about first. You can also use sample data to see the workflow before adding a
            real company.
          </p>
          <Link
            to="/app/onboarding"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Start onboarding <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }
  if (financials.length === 0) {
    return (
      <div className="p-12">
        <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-semibold text-primary">
            Add financials to unlock the valuation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your business profile is saved. Add at least the most recent completed year of revenue,
            profit, owner compensation, add-backs, assets, liabilities, and debt so ValuRight can
            estimate value and flag buyer risk.
          </p>
          <Link
            to="/app/onboarding"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Add financials <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }
  if (!valuation || !health || !inputs) {
    return (
      <div className="p-12">
        <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-semibold text-primary">
            Review setup before using the dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your business and financials are saved, but the estimate could not be generated. Review
            required fields and unusual values before relying on recommendations or reports.
          </p>
          <Link
            to="/app/onboarding"
            className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Resume review <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const latest = financials[financials.length - 1];
  const margin =
    latest && latest.revenue ? (Number(latest.ebitda) / Number(latest.revenue)) * 100 : 0;
  const inputSource = getInputSourceLabel(
    Boolean(current.is_sample),
    hasXeroConnection,
    hasQuickBooksConnection,
  );
  const inputLastUpdatedAt = getLatestTimestamp([
    current.updated_at,
    ...financials.map((f) => f.created_at),
  ]);
  const categoryLabel = getCategoryLabel(valuation.category);
  const weightedMethods = valuation.methods
    .filter((m) => m.available && (valuation.weights[m.method] ?? 0) > 0)
    .sort((a, b) => (valuation.weights[b.method] ?? 0) - (valuation.weights[a.method] ?? 0));
  const reviewRows = [
    ["Data source", inputSource],
    ["Last input update", formatDateTime(inputLastUpdatedAt)],
    ["Latest financial year", latest ? String(latest.year) : "Not available"],
    ["Revenue used", fmtCurrency(Number(latest?.revenue ?? 0))],
    ["EBITDA used", fmtCurrency(Number(latest?.ebitda ?? 0))],
    ["Data quality", dataQuality.label],
    ["Business category", categoryLabel],
    ["Health score", `${health.total}/100`],
  ];

  const revenueChartData = financials.map((y) => ({
    year: String(y.year),
    revenue: Number(y.revenue ?? 0),
    ebitda: Number(y.ebitda ?? 0),
  }));

  const methodChartData = valuation.methods
    .filter((m) => m.available)
    .map((m) => ({
      name: m.label.replace(" Multiple", "").replace("Discounted Cash Flow", "DCF"),
      value: Math.round(m.value),
    }));

  const healthData = [{ name: "Score", value: health.total, fill: "var(--accent)" }];
  const revenueChartSummary = `Revenue and EBITDA trend for ${financials.length} financial year${financials.length === 1 ? "" : "s"}. Latest year ${latest?.year ?? "unknown"} shows revenue ${fmtCurrency(Number(latest?.revenue ?? 0))} and EBITDA ${fmtCurrency(Number(latest?.ebitda ?? 0))}.`;
  const methodChartSummary = `Valuation by method. Median value range is ${fmtCurrency(valuation.rangeLow)} to ${fmtCurrency(valuation.rangeHigh)}, with midpoint ${fmtCurrency(valuation.rangeMid)}.`;
  const healthChartSummary = `Value Health Score is ${health.total} out of 100, rated ${health.ratingLabel}.`;

  // Top concerns
  const concerns: { title: string; desc: string }[] = [];
  const ownerRoles = [
    current.owner_in_sales,
    current.owner_in_operations,
    current.owner_in_customer_relationships,
  ].filter(Boolean).length;
  if ((current.owner_hours_per_week ?? 0) >= 50 || ownerRoles >= 2) {
    concerns.push({
      title: "High owner dependence",
      desc: `Owner works ${current.owner_hours_per_week ?? "?"} hrs/week across ${ownerRoles} core function${ownerRoles === 1 ? "" : "s"}. Buyers see a single point of failure.`,
    });
  }
  if (Number(current.recurring_revenue_pct ?? 0) < 30) {
    concerns.push({
      title: "Low recurring revenue",
      desc: `Only ${fmtPct(Number(current.recurring_revenue_pct ?? 0))} is recurring. Service contracts and subscriptions command higher multiples.`,
    });
  }
  if (Number(current.top_customer_concentration_pct ?? 0) >= 20) {
    concerns.push({
      title: "Customer concentration risk",
      desc: `Top customer is ${fmtPct(Number(current.top_customer_concentration_pct ?? 0))} of revenue. Diversification reduces buyer risk.`,
    });
  }
  if (current.sop_status !== "complete") {
    concerns.push({
      title: "Incomplete documentation",
      desc: "Without a documented playbook, transition risk reduces multiple.",
    });
  }
  if (current.manager_team_depth !== "strong") {
    concerns.push({
      title: "Thin management bench",
      desc: "A capable second-in-command is one of the highest-leverage value drivers.",
    });
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-primary">{current.name}</h1>
            {current.is_sample && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                Sample data
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {current.industry} · {current.region || "—"} · {current.years_in_business ?? "?"} years
            · {current.employees ?? "?"} employees
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link
            to="/app/scenarios"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-secondary sm:flex-none"
          >
            <Sliders className="h-4 w-4" /> What-if
          </Link>
          <Link
            to="/app/buyer-teaser"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 sm:flex-none"
          >
            <Eye className="h-4 w-4" /> Buyer view
          </Link>
        </div>
      </div>

      {current.is_sample && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed text-foreground shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold">You are viewing demo data</div>
              <p className="mt-1 text-muted-foreground">
                This dashboard is useful for learning the workflow, but it should not be shared with
                advisors, buyers, or lenders. Replace the sample profile and financials before using
                reports or buyer teaser pages.
              </p>
            </div>
            <Link
              to="/app/onboarding"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Replace sample data <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {hasSavedValuation === false && (
        <div className="rounded-xl border border-accent/40 bg-accent-soft p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-primary">
                Valuation snapshot missing
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This dashboard is using your saved business and financial data to regenerate the
                estimate. Save a valuation snapshot so reports and history have a durable record.
              </p>
            </div>
            <button
              type="button"
              onClick={openReviewPanel}
              disabled={savingValuation}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Review inputs
            </button>
          </div>
        </div>
      )}

      {dataQuality.status !== "ready" && !dataQualityAcknowledged && (
        <div
          className={`rounded-xl border p-4 shadow-sm ${
            dataQuality.status === "weak"
              ? "border-destructive/40 bg-destructive/10"
              : "border-amber-300 bg-amber-50"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
              <div>
                <h2 className="font-display text-base font-semibold text-primary">
                  Data quality: {dataQuality.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{dataQuality.summary}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openReviewPanel}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
            >
              Review issues <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Range hero */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated value range
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              <TrendingUp className="h-3 w-3" /> Software estimate
            </span>
          </div>
          <div className="mt-2 font-display text-4xl font-semibold leading-tight text-primary sm:text-5xl">
            {fmtCurrency(valuation.rangeLow, { compact: true })}{" "}
            <span className="text-muted-foreground font-normal">–</span>{" "}
            {fmtCurrency(valuation.rangeHigh, { compact: true })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            Median:{" "}
            <span className="font-semibold text-foreground">{fmtCurrency(valuation.rangeMid)}</span>
          </div>
          <div className="mt-6">
            <MethodRangeBar
              low={valuation.rangeLow}
              mid={valuation.rangeMid}
              high={valuation.rangeHigh}
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
            <KPI
              label="Revenue (latest)"
              value={fmtCurrency(Number(latest?.revenue ?? 0), { compact: true })}
            />
            <KPI
              label="EBITDA"
              value={fmtCurrency(Number(latest?.ebitda ?? 0), { compact: true })}
            />
            <KPI label="EBITDA margin" value={fmtPct(margin, 1)} />
          </div>
        </div>

        {/* Health score radial */}
        <Link
          to="/app/health-score"
          className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-accent/50 hover:shadow-md transition group"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Value Health Score
          </div>
          <AccessibleChart
            title="Value Health Score"
            summary={healthChartSummary}
            className="h-48 -mt-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="60%"
                innerRadius="70%"
                outerRadius="100%"
                data={healthData}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div aria-hidden="true" className="-mt-24 text-center">
              <div className="font-display text-4xl font-semibold text-primary">{health.total}</div>
              <div className="text-xs text-muted-foreground">out of 100 · {health.ratingLabel}</div>
            </div>
          </AccessibleChart>
          <div className="mt-4 rounded-lg bg-secondary/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Main score driver
            </div>
            <div className="mt-1 text-sm font-semibold text-foreground">
              {health.weaknesses[0]?.label ?? health.strengths[0]?.label ?? "Inputs needed"}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {health.weaknesses[0]?.driver ??
                health.strengths[0]?.driver ??
                "Add profile and financial details to explain the score."}
            </p>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:underline">
            See category breakdown <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">Why this range?</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                The headline estimate blends the valuation methods most appropriate for a{" "}
                {categoryLabel.toLowerCase()}. Methods marked as sanity checks or floors are shown
                for context but do not drive the final range.
              </p>
              <Link
                to="/methodology"
                className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline"
              >
                View valuation methodology
              </Link>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Audit trail
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {weightedMethods.map((m) => (
              <button
                key={m.method}
                type="button"
                onClick={() => setActiveMethod(m)}
                className="rounded-lg border border-border bg-secondary/30 p-4 text-left transition hover:border-accent/50 hover:bg-secondary/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-foreground">{m.label}</div>
                  <div className="text-xs font-semibold text-accent">
                    {methodWeightLabel(valuation.weights[m.method])}
                  </div>
                </div>
                <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {m.inputLabel ? `${m.inputLabel}: ${fmtCurrency(m.inputUsed ?? 0)}. ` : ""}
                  {m.multipleUsed !== undefined ? `${m.multipleUsed.toFixed(2)}x multiple. ` : ""}
                  {m.capRateUsed !== undefined ? `${m.capRateUsed.toFixed(2)}% cap rate. ` : ""}
                  {m.confidence} confidence.
                </div>
              </button>
            ))}
          </div>

          <p className="mt-4 rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground">
            The current median estimate is {fmtCurrency(valuation.rangeMid)}. The low and high
            endpoints come from the low/high outputs of the same contributing methods, not from a
            single guaranteed sale price.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-primary">
            Inputs and assumptions
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {reviewRows.map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 border-b border-border/70 pb-2 last:border-0"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-lg border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Clock className="h-3.5 w-3.5" /> Snapshot history
            </div>
            <p className="mt-1">
              Last saved valuation:{" "}
              {lastValuationAt ? formatDateTime(lastValuationAt) : "No saved snapshot yet"}.
            </p>
          </div>
          <div className="mt-3">
            <DataQualityBadge review={dataQuality} acknowledged={dataQualityAcknowledged} />
          </div>
          <button
            type="button"
            onClick={() => setReviewOpen((v) => !v)}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <CheckCircle2 className="h-4 w-4" />
            {reviewOpen ? "Hide review" : "Review before saving"}
          </button>
        </div>
      </section>

      {reviewOpen && (
        <section
          id="valuation-snapshot-review"
          className="scroll-mt-6 rounded-2xl border border-accent/40 bg-accent-soft p-6 shadow-sm"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                Review valuation snapshot before saving
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                This is the audit record that will be saved for reports and history. Review the data
                source, latest inputs, selected assumptions, confidence, and method weights before
                creating a new valuation run.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <KPI label="Source" value={inputSource} />
                <KPI label="Inputs updated" value={formatDateTime(inputLastUpdatedAt)} />
                <KPI
                  label="Range median"
                  value={fmtCurrency(valuation.rangeMid, { compact: true })}
                />
                <KPI label="Contributing methods" value={String(weightedMethods.length)} />
              </div>
              <div className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Manual, CSV, Xero, and QuickBooks connections share the same stored financial
                fields. Review normalized inputs before saving each valuation snapshot.
              </div>
              <DataQualityPanel
                review={dataQuality}
                acknowledged={dataQualityAcknowledged}
                onAcknowledgedChange={setDataQualityAcknowledgement}
              />
            </div>
            <button
              type="button"
              onClick={saveCurrentValuation}
              disabled={
                savingValuation || (dataQuality.requiredAcknowledgement && !dataQualityAcknowledged)
              }
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
            >
              {savingValuation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Save valuation snapshot
            </button>
          </div>
        </section>
      )}

      {/* Chart row */}
      <section className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue & EBITDA trend" summary={revenueChartSummary}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => fmtCurrency(v)}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ebitda" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Valuation by method" summary={methodChartSummary}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={methodChartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                width={90}
              />
              <Tooltip
                formatter={(v: number) => fmtCurrency(v)}
                contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
              />
              <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Methods detail */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-display text-xl font-semibold text-primary">Valuation methods</h2>
          <span className="text-xs text-muted-foreground">
            Category:{" "}
            <span className="font-semibold text-foreground">
              {valuation.category === "real_estate_income"
                ? "Income-producing real estate"
                : valuation.category === "asset_heavy"
                  ? "Asset-heavy operating business"
                  : "Standard operating business"}
            </span>
          </span>
        </div>
        {valuation.category === "real_estate_income" && valuation.isRvOrCampground && (
          <div className="mb-4 rounded-xl border border-accent/40 bg-accent-soft p-4 text-sm leading-relaxed text-foreground">
            <strong className="font-semibold">RV parks and campgrounds</strong> are commonly valued
            as income-producing real estate. Buyers typically focus on stabilized NOI and market cap
            rates. Generic small-business multiples may understate value because they do not fully
            capture land, zoning, utility infrastructure, sites/pads, occupancy quality, and
            location.
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {valuation.methods.map((m) => (
            <button
              key={m.method}
              type="button"
              onClick={() => setActiveMethod(m)}
              className={`text-left rounded-xl border bg-card p-5 transition hover:shadow-md hover:border-accent/50 ${m.available ? "border-border" : "border-dashed border-border opacity-60"} ${m.role === "primary" || m.role === "recommended" ? "ring-1 ring-accent/40" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display font-semibold text-primary">{m.label}</h3>
                <RoleBadge role={m.role} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                    m.confidence === "high"
                      ? "bg-accent-soft text-accent"
                      : m.confidence === "medium"
                        ? "bg-gold/15 text-foreground"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {m.confidence} confidence
                </span>
              </div>
              <div className="mt-3 font-display text-2xl font-semibold text-foreground">
                {m.available ? fmtCurrency(m.value, { compact: true }) : "—"}
              </div>
              {m.available && (
                <>
                  <div className="mt-3">
                    <MethodRangeBar low={m.low} mid={m.value} high={m.high} />
                  </div>
                  {m.multipleUsed !== undefined && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      {m.multipleUsed.toFixed(2)}× multiple applied
                    </div>
                  )}
                  {m.capRateUsed !== undefined && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Cap rate {m.capRateLow?.toFixed(1)}% – {m.capRateHigh?.toFixed(1)}% (selected{" "}
                      {m.capRateUsed.toFixed(1)}%)
                    </div>
                  )}
                </>
              )}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{m.notes}</p>
              {m.warning && (
                <p className="mt-2 text-[11px] leading-relaxed text-foreground bg-gold/10 border border-gold/30 rounded p-2">
                  ⚠ {m.warning}
                </p>
              )}
              <div className="mt-3 text-xs font-semibold text-accent">View details →</div>
            </button>
          ))}
        </div>

        {/* Enterprise vs Equity reconciliation */}
        {valuation.debt !== undefined && valuation.debt > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display font-semibold text-primary">
              Enterprise value vs. equity value
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Method values above are property / enterprise value (before debt). Equity to the
              seller is enterprise value less outstanding debt.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Property / Enterprise Value (median)</dt>
                <dd className="font-semibold tabular-nums">
                  {fmtCurrency(valuation.enterpriseValue ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Less: Outstanding debt</dt>
                <dd className="font-semibold tabular-nums">−{fmtCurrency(valuation.debt)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <dt className="font-semibold text-primary">Estimated Equity Value</dt>
                <dd className="font-display text-lg font-semibold text-primary tabular-nums">
                  {fmtCurrency(valuation.equityValue ?? 0)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <MethodDetailDialog
        method={activeMethod}
        open={!!activeMethod}
        onOpenChange={(v) => !v && setActiveMethod(null)}
      />

      {/* Top concerns */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold text-primary">
            What's suppressing value
          </h2>
          <Link
            to="/app/recommendations"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" /> Get recommendations
          </Link>
        </div>
        <div className="space-y-3">
          {concerns.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground text-center">
              No major risks detected. Keep refining your data to deepen the analysis.
            </div>
          ) : (
            concerns.slice(0, 4).map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-foreground">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-primary">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <ValuationDisclaimer className="mt-4" />
    </div>
  );
}

function DataQualityBadge({
  review,
  acknowledged = false,
}: {
  review: DataQualityReview;
  acknowledged?: boolean;
}) {
  const isReady = review.status === "ready" || acknowledged;
  return (
    <div
      className={`rounded-lg border p-3 text-xs leading-relaxed ${
        isReady
          ? "border-accent/30 bg-accent-soft text-muted-foreground"
          : review.status === "weak"
            ? "border-destructive/30 bg-destructive/10 text-muted-foreground"
            : "border-amber-300 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex items-center gap-1.5 font-semibold text-foreground">
        {isReady ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5" />
        )}
        Data quality: {acknowledged ? "Acknowledged" : review.label}
      </div>
      <p className="mt-1">
        {review.yearCount} year{review.yearCount === 1 ? "" : "s"} reviewed
        {review.latestYear ? ` through ${review.latestYear}` : ""}.{" "}
        {acknowledged ? "Warnings are acknowledged for this valuation snapshot." : review.summary}
      </p>
    </div>
  );
}

function DataQualityPanel({
  review,
  acknowledged,
  onAcknowledgedChange,
}: {
  review: DataQualityReview;
  acknowledged: boolean;
  onAcknowledgedChange: (value: boolean) => void;
}) {
  const issues = review.issues.slice(0, 6);
  return (
    <div className="mt-4 rounded-lg border border-border bg-background p-4">
      <div className="flex items-start gap-2">
        {review.status === "ready" ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-primary">Data quality review</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {acknowledged
              ? "Warnings have been acknowledged for this valuation snapshot."
              : review.summary}
          </p>
        </div>
      </div>

      {acknowledged && review.requiredAcknowledgement && (
        <div className="mt-3 rounded-md border border-accent/30 bg-accent-soft p-3 text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Data quality warnings acknowledged
          </div>
          <p className="mt-1">
            The warnings are retained in the review history, but they no longer block saving this
            valuation snapshot.
          </p>
        </div>
      )}

      {!acknowledged && issues.length > 0 && (
        <ul className="mt-3 space-y-2">
          {issues.map((issue, index) => (
            <li
              key={`${issue.title}-${index}`}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    issue.severity === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {issue.severity === "critical" ? "Weak data" : "Review"}
                </span>
                <span className="text-xs font-semibold text-foreground">{issue.title}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {issue.detail}
                {issue.years?.length ? ` Years: ${issue.years.join(", ")}.` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {!acknowledged && review.issues.length > issues.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          {review.issues.length - issues.length} more issue
          {review.issues.length - issues.length === 1 ? "" : "s"} are included in the full review.
        </p>
      )}

      {review.requiredAcknowledgement && (
        <label className="mt-4 flex items-start gap-2 rounded-md border border-border bg-secondary/30 p-3 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => onAcknowledgedChange(event.target.checked)}
            className="mt-0.5 accent-[oklch(0.45_0.1_158)]"
          />
          <span>
            I understand these data quality issues may make the valuation less reliable and want to
            save this snapshot anyway.
          </span>
        </label>
      )}
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="text-sm font-semibold text-primary mb-3">{title}</div>
      <AccessibleChart title={title} summary={summary}>
        {children}
      </AccessibleChart>
    </div>
  );
}

function RoleBadge({ role }: { role?: MethodResult["role"] }) {
  if (!role) return null;
  const styles: Record<string, string> = {
    primary: "bg-accent text-accent-foreground",
    recommended: "bg-accent text-accent-foreground",
    supporting: "bg-secondary text-muted-foreground",
    sanity_check: "bg-secondary text-muted-foreground",
    floor: "bg-gold/15 text-foreground",
  };
  const labels: Record<string, string> = {
    primary: "Primary",
    recommended: "Recommended",
    supporting: "Supporting",
    sanity_check: "Sanity check",
    floor: "Floor",
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 whitespace-nowrap ${styles[role]}`}
    >
      {labels[role]}
    </span>
  );
}

function getCategoryLabel(category: Valuation["category"]) {
  if (category === "real_estate_income") return "Income-producing real estate";
  if (category === "asset_heavy") return "Asset-heavy operating business";
  return "Standard operating business";
}

function getInputSourceLabel(
  isSample: boolean,
  hasXeroConnection: boolean,
  hasQuickBooksConnection: boolean,
) {
  if (isSample) return "Sample data";
  if (hasXeroConnection && hasQuickBooksConnection) return "Xero, QuickBooks, or manual edits";
  if (hasXeroConnection) return "Xero or manual edits";
  if (hasQuickBooksConnection) return "QuickBooks or manual edits";
  return "Manual or CSV entry";
}

function normalizeMultipleAssumptions(rows: unknown): MultipleAssumption[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => row as Record<string, unknown>)
    .filter((row) => typeof row.slug === "string" && typeof row.industry === "string")
    .map((row) => ({
      slug: String(row.slug),
      industry: String(row.industry),
      business_category: typeof row.business_category === "string" ? row.business_category : "any",
      revenue_min: row.revenue_min == null ? null : Number(row.revenue_min),
      revenue_max: row.revenue_max == null ? null : Number(row.revenue_max),
      owner_dependence: typeof row.owner_dependence === "string" ? row.owner_dependence : "any",
      confidence_level:
        row.confidence_level === "low" || row.confidence_level === "high"
          ? row.confidence_level
          : "medium",
      sde_low: Number(row.sde_low),
      sde_mid: Number(row.sde_mid),
      sde_high: Number(row.sde_high),
      ebitda_low: Number(row.ebitda_low),
      ebitda_mid: Number(row.ebitda_mid),
      ebitda_high: Number(row.ebitda_high),
      revenue_low: Number(row.revenue_low),
      revenue_mid: Number(row.revenue_mid),
      revenue_high: Number(row.revenue_high),
      source_label: String(row.source_label ?? "Configured assumption"),
      source_notes: String(row.source_notes ?? "Configured planning assumption."),
      active: row.active !== false,
    }))
    .filter(
      (row) =>
        Number.isFinite(row.sde_low) &&
        Number.isFinite(row.sde_mid) &&
        Number.isFinite(row.sde_high) &&
        Number.isFinite(row.ebitda_low) &&
        Number.isFinite(row.ebitda_mid) &&
        Number.isFinite(row.ebitda_high) &&
        Number.isFinite(row.revenue_low) &&
        Number.isFinite(row.revenue_mid) &&
        Number.isFinite(row.revenue_high),
    ) as MultipleAssumption[];
}

function getLatestTimestamp(values: Array<string | null | undefined>) {
  const dates = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (!dates.length) return null;
  return new Date(Math.max(...dates.map((date) => date.getTime()))).toISOString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function methodWeightLabel(weight: number | undefined) {
  return `${Math.round((weight ?? 0) * 100)}% weight`;
}
