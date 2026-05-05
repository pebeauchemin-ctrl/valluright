import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TrendingUp, AlertTriangle, ArrowRight, Sparkles, Eye, Sliders } from "lucide-react";
import { useBusiness, toBusinessInputs, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { valueBusiness, computeHealthScore, type Valuation, type MethodResult } from "@/lib/valuation";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { MethodDetailDialog, MethodRangeBar } from "@/components/MethodDetailDialog";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadialBarChart, RadialBar, PolarAngleAxis,
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

  useEffect(() => {
    let cancelled = false;
    if (!current) { setFinancials([]); setLoading(false); return; }
    setLoading(true);
    supabase
      .from("financial_years")
      .select("*")
      .eq("business_id", current.id)
      .order("year", { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        setFinancials(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [current]);

  const inputs = useMemo(
    () => current ? toBusinessInputs(current, financials) : null,
    [current, financials]
  );
  const valuation: Valuation | null = useMemo(() => inputs ? valueBusiness(inputs) : null, [inputs]);
  const health = useMemo(() => inputs ? computeHealthScore(inputs) : null, [inputs]);

  if (bizLoading || loading) {
    return <div className="p-12 text-sm text-muted-foreground">Loading your dashboard…</div>;
  }
  if (!current || !valuation || !health || !inputs) {
    return (
      <div className="p-12">
        <div className="rounded-2xl border border-border bg-card p-10 text-center max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-semibold text-primary">Add your first business</h1>
          <p className="mt-2 text-sm text-muted-foreground">It takes about 15 minutes to enter the basics, three years of financials, and your operations details.</p>
          <Link to="/app/onboarding" className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
            Start onboarding <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const latest = financials[financials.length - 1];
  const margin = latest && latest.revenue ? (Number(latest.ebitda) / Number(latest.revenue)) * 100 : 0;

  const revenueChartData = financials.map((y) => ({
    year: String(y.year),
    revenue: Number(y.revenue ?? 0),
    ebitda: Number(y.ebitda ?? 0),
  }));

  const methodChartData = valuation.methods
    .filter((m) => m.available)
    .map((m) => ({ name: m.label.replace(" Multiple", "").replace("Discounted Cash Flow", "DCF"), value: Math.round(m.value) }));

  const healthData = [{ name: "Score", value: health.total, fill: "var(--accent)" }];

  // Top concerns
  const concerns: { title: string; desc: string }[] = [];
  const ownerRoles = [current.owner_in_sales, current.owner_in_operations, current.owner_in_customer_relationships].filter(Boolean).length;
  if ((current.owner_hours_per_week ?? 0) >= 50 || ownerRoles >= 2) {
    concerns.push({ title: "High owner dependence", desc: `Owner works ${current.owner_hours_per_week ?? "?"} hrs/week across ${ownerRoles} core function${ownerRoles === 1 ? "" : "s"}. Buyers see a single point of failure.` });
  }
  if (Number(current.recurring_revenue_pct ?? 0) < 30) {
    concerns.push({ title: "Low recurring revenue", desc: `Only ${fmtPct(Number(current.recurring_revenue_pct ?? 0))} is recurring. Service contracts and subscriptions command higher multiples.` });
  }
  if (Number(current.top_customer_concentration_pct ?? 0) >= 20) {
    concerns.push({ title: "Customer concentration risk", desc: `Top customer is ${fmtPct(Number(current.top_customer_concentration_pct ?? 0))} of revenue. Diversification reduces buyer risk.` });
  }
  if (current.sop_status !== "complete") {
    concerns.push({ title: "Incomplete documentation", desc: "Without a documented playbook, transition risk reduces multiple." });
  }
  if (current.manager_team_depth !== "strong") {
    concerns.push({ title: "Thin management bench", desc: "A capable second-in-command is one of the highest-leverage value drivers." });
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">{current.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {current.industry} · {current.region || "—"} · {current.years_in_business ?? "?"} years · {current.employees ?? "?"} employees
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/scenarios" className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary transition">
            <Sliders className="h-4 w-4" /> What-if
          </Link>
          <Link to="/app/buyer-teaser" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
            <Eye className="h-4 w-4" /> Buyer view
          </Link>
        </div>
      </div>

      {/* Range hero */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated value range</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              <TrendingUp className="h-3 w-3" /> Software estimate
            </span>
          </div>
          <div className="mt-2 font-display text-5xl font-semibold text-primary leading-tight">
            {fmtCurrency(valuation.rangeLow, { compact: true })}{" "}
            <span className="text-muted-foreground font-normal">–</span>{" "}
            {fmtCurrency(valuation.rangeHigh, { compact: true })}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">Median: <span className="font-semibold text-foreground">{fmtCurrency(valuation.rangeMid)}</span></div>
          <div className="mt-6 h-3 rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-gold" />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <KPI label="Revenue (latest)" value={fmtCurrency(Number(latest?.revenue ?? 0), { compact: true })} />
            <KPI label="EBITDA" value={fmtCurrency(Number(latest?.ebitda ?? 0), { compact: true })} />
            <KPI label="EBITDA margin" value={fmtPct(margin, 1)} />
          </div>
        </div>

        {/* Health score radial */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value Health Score</div>
          <div className="h-48 -mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="60%" innerRadius="70%" outerRadius="100%" data={healthData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-24 text-center">
              <div className="font-display text-4xl font-semibold text-primary">{health.total}</div>
              <div className="text-xs text-muted-foreground">out of 100</div>
            </div>
          </div>
          <Link to="/app/recommendations" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            See what's holding it back <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Chart row */}
      <section className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Revenue & EBITDA trend">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="revenue" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ebitda" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Valuation by method">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={methodChartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} width={90} />
              <Tooltip formatter={(v: number) => fmtCurrency(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
              <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Methods detail */}
      <section>
        <h2 className="font-display text-xl font-semibold text-primary mb-4">Six valuation methods</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {valuation.methods.map((m) => (
            <div key={m.method} className={`rounded-xl border bg-card p-5 ${m.available ? "border-border" : "border-dashed border-border opacity-60"}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-primary">{m.label}</h3>
                <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                  m.confidence === "high" ? "bg-accent-soft text-accent" :
                  m.confidence === "medium" ? "bg-gold/15 text-foreground" :
                  "bg-secondary text-muted-foreground"
                }`}>{m.confidence}</span>
              </div>
              <div className="mt-3 font-display text-2xl font-semibold text-foreground">
                {m.available ? fmtCurrency(m.value, { compact: true }) : "—"}
              </div>
              {m.available && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {fmtCurrency(m.low, { compact: true })} – {fmtCurrency(m.high, { compact: true })}
                  {m.multipleUsed && <> · {m.multipleUsed.toFixed(2)}× multiple</>}
                </div>
              )}
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{m.notes}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top concerns */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-primary">What's suppressing value</h2>
          <Link to="/app/recommendations" className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
            <Sparkles className="h-3.5 w-3.5" /> Get recommendations
          </Link>
        </div>
        <div className="space-y-3">
          {concerns.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground text-center">
              No major risks detected. Keep refining your data to deepen the analysis.
            </div>
          ) : concerns.slice(0, 4).map((c, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-foreground">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-primary">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground text-center pt-4">
        ValuRight.ai outputs are software-generated planning estimates. Not a certified appraisal, tax advice, legal advice, or guaranteed sale price.
      </p>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
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
