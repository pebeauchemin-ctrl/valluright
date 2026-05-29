import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
} from "@/lib/valuation";
import { buildValuationInsert } from "@/lib/valuation-persistence";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { MethodDetailDialog, MethodRangeBar } from "@/components/MethodDetailDialog";
import { ValuationDisclaimer } from "@/components/ValuationDisclaimer";
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
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMethod, setActiveMethod] = useState<MethodResult | null>(null);
  const [hasSavedValuation, setHasSavedValuation] = useState<boolean | null>(null);
  const [savingValuation, setSavingValuation] = useState(false);
  const [lastValuationAt, setLastValuationAt] = useState<string | null>(null);
  const [hasXeroConnection, setHasXeroConnection] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setFinancials([]);
      setHasSavedValuation(null);
      setLastValuationAt(null);
      setHasXeroConnection(false);
      setReviewOpen(false);
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
    ]).then(([financialsResult, valuationsResult, xeroResult]) => {
      if (cancelled) return;
      setFinancials(financialsResult.data ?? []);
      setHasSavedValuation(Boolean(valuationsResult.data?.length));
      setLastValuationAt(valuationsResult.data?.[0]?.computed_at ?? null);
      setHasXeroConnection(Boolean(xeroResult.data?.length));
      setReviewOpen(false);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [current]);

  const inputs = useMemo(
    () => (current ? toBusinessInputs(current, financials) : null),
    [current, financials],
  );
  const valuation: Valuation | null = useMemo(
    () => (inputs ? valueBusiness(inputs) : null),
    [inputs],
  );
  const health = useMemo(() => (inputs ? computeHealthScore(inputs) : null), [inputs]);

  const saveCurrentValuation = async () => {
    if (!current || !inputs || !valuation || !health) return;
    setSavingValuation(true);
    try {
      const { error } = await supabase
        .from("valuations")
        .insert(buildValuationInsert(current.id, inputs, valuation, health));
      if (error) throw error;
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
            Add your first business
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It takes about 15 minutes to enter the basics, three years of financials, and your
            operations details.
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
            Resume financial setup
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your business profile is saved, but the dashboard needs at least one year of financials
            before it can generate a valuation.
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
            Fix missing valuation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your business and financials are saved, but the valuation could not be generated. Review
            your setup and try again.
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
  const inputSource = getInputSourceLabel(Boolean(current.is_sample), hasXeroConnection);
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
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">{current.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {current.industry} · {current.region || "—"} · {current.years_in_business ?? "?"} years
            · {current.employees ?? "?"} employees
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/app/scenarios"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary transition"
          >
            <Sliders className="h-4 w-4" /> What-if
          </Link>
          <Link
            to="/app/buyer-teaser"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            <Eye className="h-4 w-4" /> Buyer view
          </Link>
        </div>
      </div>

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
              onClick={() => setReviewOpen(true)}
              disabled={savingValuation}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              Review inputs
            </button>
          </div>
        </div>
      )}

      {/* Range hero */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated value range
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              <TrendingUp className="h-3 w-3" /> Software estimate
            </span>
          </div>
          <div className="mt-2 font-display text-5xl font-semibold text-primary leading-tight">
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
          <div className="mt-6 grid grid-cols-3 gap-4">
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
          <div className="h-48 -mt-2">
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
            <div className="-mt-24 text-center">
              <div className="font-display text-4xl font-semibold text-primary">{health.total}</div>
              <div className="text-xs text-muted-foreground">out of 100 · click to explore</div>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:underline">
            See category breakdown <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-primary">Why this range?</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                The headline estimate blends the valuation methods most appropriate for a{" "}
                {categoryLabel.toLowerCase()}. Methods marked as sanity checks or floors are shown
                for context but do not drive the final range.
              </p>
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
        <section className="rounded-2xl border border-accent/40 bg-accent-soft p-6 shadow-sm">
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
                Manual and CSV entries currently share the same stored financial fields; Xero is
                shown when a Xero connection is attached to this business. QuickBooks import is not
                active yet.
              </div>
            </div>
            <button
              type="button"
              onClick={saveCurrentValuation}
              disabled={savingValuation}
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
        <ChartCard title="Revenue & EBITDA trend">
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
        <ChartCard title="Valuation by method">
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
        <div className="flex items-center justify-between mb-4">
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

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="text-sm font-semibold text-primary mb-3">{title}</div>
      {children}
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

function getInputSourceLabel(isSample: boolean, hasXeroConnection: boolean) {
  if (isSample) return "Sample data";
  if (hasXeroConnection) return "Xero or manual edits";
  return "Manual or CSV entry";
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
