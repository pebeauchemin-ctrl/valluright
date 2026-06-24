import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Plus,
  Sliders,
  Check,
} from "lucide-react";
import { useBusiness, toBusinessInputs, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import {
  computeHealthScore,
  valueBusiness,
  type HealthBreakdown,
  type HealthDriver,
  type BusinessInputs,
} from "@/lib/valuation";
import { fmtCurrency } from "@/lib/format";
import { ValuationDisclaimer } from "@/components/ValuationDisclaimer";
import { AccessibleChart } from "@/components/AccessibleChart";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export const Route = createFileRoute("/app/health-score")({
  head: () => ({ meta: [{ title: "Value Health Score — ValuRight.ai" }] }),
  component: HealthScorePage,
});

const CATEGORY_META: Record<
  keyof HealthBreakdown,
  { label: string; description: string; tip: string }
> = {
  financial_performance: {
    label: "Financial Performance",
    description: "EBITDA margin on latest year of revenue.",
    tip: "Improve gross margin and reduce discretionary opex to lift EBITDA margin above 15%.",
  },
  revenue_quality: {
    label: "Revenue Quality",
    description: "Share of revenue that is contractual or recurring.",
    tip: "Convert one-off jobs into service contracts, retainers, or subscriptions.",
  },
  owner_independence: {
    label: "Owner Independence",
    description: "Hours/week and number of core functions the owner personally runs.",
    tip: "Delegate sales, ops, and customer relationships. Target ≤40 hrs/week with 0–1 owner-held roles.",
  },
  customer_concentration: {
    label: "Customer Concentration",
    description: "Share of revenue from the single largest customer.",
    tip: "Diversify so no single customer is more than 15% of revenue.",
  },
  growth_trend: {
    label: "Growth Trend",
    description: "Trailing revenue growth across the financial years on file.",
    tip: "Steady 10–20% YoY growth justifies a higher multiple than flat or declining lines.",
  },
  documentation: {
    label: "Documentation / SOPs",
    description: "Status of standard operating procedures and playbooks.",
    tip: "Document the top 10 repeatable processes — buyers pay more for transferable ops.",
  },
  management_team: {
    label: "Management Team",
    description: "Depth of a management bench that can run the business without the owner.",
    tip: "Hire or promote a strong general manager / second-in-command.",
  },
  data_quality: {
    label: "Data Quality",
    description: "Completeness of financial history and balance sheet data.",
    tip: "Add 3 years of clean financials and balance-sheet items to maximize confidence.",
  },
};

type Priority = "high" | "medium" | "low";
type Difficulty = "easy" | "medium" | "hard";
type RecTemplate = {
  key: string;
  title: string;
  category: string;
  priority: Priority;
  difficulty: Difficulty;
  time_required: string;
  description: string;
  buyer_concern: string;
  action_steps: string[];
  impact_pct: [number, number];
  applies: (b: BusinessInputs) => boolean;
  scenario: Record<string, string | number | boolean>;
};

const TEMPLATES: RecTemplate[] = [
  {
    key: "owner_dependence",
    title: "Reduce owner dependence",
    category: "Operations",
    priority: "high",
    difficulty: "hard",
    time_required: "6–12 months",
    description:
      "Delegate sales, operations, and customer relationships so the business runs without you. The single biggest multiple-mover for owner-operated SMBs.",
    buyer_concern:
      "If the owner is the business, the buyer is buying a job — not an asset. Multiples drop 0.5–1.0× when the owner holds all key relationships.",
    action_steps: [
      "Identify the 3 functions you currently own (sales, ops, customer).",
      "Assign each to a named team member with a 90-day handoff plan.",
      "Move yourself to ≤40 hours/week within 6 months.",
      "Document the routines you take with you so they don't break.",
    ],
    impact_pct: [0.1, 0.2],
    applies: (b) =>
      (b.owner_hours_per_week ?? 50) >= 45 ||
      [b.owner_in_sales, b.owner_in_operations, b.owner_in_customer_relationships].filter(Boolean)
        .length >= 2,
    scenario: { ownerHrs: 35, sopComplete: true },
  },
  {
    key: "recurring_revenue",
    title: "Add recurring revenue",
    category: "Revenue",
    priority: "high",
    difficulty: "medium",
    time_required: "3–9 months",
    description:
      "Convert one-off transactions into service contracts, retainers, or subscriptions. Recurring revenue is the highest-multiple type of revenue.",
    buyer_concern:
      "Buyers and lenders pay a premium for predictable revenue. Below 30% recurring is a yellow flag for SMB acquirers.",
    action_steps: [
      "Package your most repeated service into a monthly or quarterly plan.",
      "Pitch the plan to your top 20 customers first.",
      "Set a target: 40% of revenue under contract within 12 months.",
      "Track MRR and renewal rate monthly.",
    ],
    impact_pct: [0.08, 0.18],
    applies: (b) => (b.recurring_revenue_pct ?? 0) < 40,
    scenario: { recurring: 50 },
  },
  {
    key: "improve_margins",
    title: "Improve margins",
    category: "Financials",
    priority: "medium",
    difficulty: "medium",
    time_required: "3–6 months",
    description:
      "Push EBITDA margin past 15% by reviewing pricing, vendor costs, and discretionary opex. Margin directly drives every multiple-based valuation.",
    buyer_concern:
      "Thin margins leave no cushion for the buyer's debt service and signal weak pricing power.",
    action_steps: [
      "Raise prices 5–8% on your lowest-margin product or service line.",
      "Re-bid your top 3 supplier contracts.",
      "Cut or renegotiate the bottom-quartile of recurring software spend.",
      "Set a 15% EBITDA margin floor as the new internal target.",
    ],
    impact_pct: [0.06, 0.14],
    applies: (b) => {
      const latest = b.financials.at(-1);
      if (!latest || latest.revenue <= 0) return true;
      return latest.ebitda / latest.revenue < 0.15;
    },
    scenario: { marginUplift: 5 },
  },
  {
    key: "clean_financials",
    title: "Clean up the financials",
    category: "Financials",
    priority: "medium",
    difficulty: "easy",
    time_required: "1–2 months",
    description:
      "Get three full years of clean books, separate personal from business expenses, and build a clear add-back schedule. Raises confidence on every multiple.",
    buyer_concern:
      "Messy books trigger price chips and broken deals. Buyers discount what they can't verify.",
    action_steps: [
      "Reconcile all bank and credit card accounts through the latest month.",
      "Move personal expenses out and document remaining add-backs.",
      "Produce P&L and balance sheet for the last 3 fiscal years.",
      "Have a CPA do a quality-of-earnings light review.",
    ],
    impact_pct: [0.03, 0.08],
    applies: (b) =>
      b.financials.length < 3 || b.financials.some((f) => f.assets === 0 || f.ebitda === 0),
    scenario: {},
  },
  {
    key: "customer_concentration",
    title: "Reduce customer concentration",
    category: "Revenue",
    priority: "high",
    difficulty: "hard",
    time_required: "6–18 months",
    description:
      "Diversify so no single customer is more than 15% of revenue. The most common reason SMB deals fall apart in diligence.",
    buyer_concern:
      "Losing one customer post-close could cripple the business — buyers either pass or demand large escrows.",
    action_steps: [
      "Identify your top customer's % of revenue today.",
      "Build a 90-day plan to add 5+ new accounts in adjacent verticals.",
      "Diversify the sales pipeline so no prospect exceeds 10% of forecast.",
      "Aim for top customer ≤15% within a year.",
    ],
    impact_pct: [0.05, 0.12],
    applies: (b) => (b.top_customer_concentration_pct ?? 0) >= 15,
    scenario: { topCust: 12 },
  },
  {
    key: "documentation",
    title: "Document operations",
    category: "Operations",
    priority: "medium",
    difficulty: "easy",
    time_required: "2–4 months",
    description:
      "Build SOPs and a playbook for the top 10 repeatable processes. A documented business is a transferable business.",
    buyer_concern:
      "Without SOPs the buyer has to relearn the company from scratch — they discount for transition risk.",
    action_steps: [
      "List the top 10 routines that keep the business running.",
      "Record screen-share or video walk-throughs for each.",
      "Convert each into a one-page written SOP.",
      "Store everything in a single shared library.",
    ],
    impact_pct: [0.04, 0.1],
    applies: (b) => b.sop_status !== "complete",
    scenario: { sopComplete: true },
  },
  {
    key: "management_team",
    title: "Strengthen management team",
    category: "Team",
    priority: "high",
    difficulty: "hard",
    time_required: "6–12 months",
    description:
      "Hire or promote a strong general manager or second-in-command who can run day-to-day operations.",
    buyer_concern:
      "A thin bench means the business breaks the moment the owner leaves. A capable #2 is one of the highest-leverage value drivers.",
    action_steps: [
      "Define the GM / Ops Lead role and decision rights.",
      "Promote internally if you have a candidate; recruit externally if not.",
      "Hand off operational decisions over 90 days.",
      "Confirm the team can run a full month without owner input.",
    ],
    impact_pct: [0.07, 0.15],
    applies: (b) => b.manager_team_depth !== "strong",
    scenario: { hireManager: true },
  },
];

function priorityBadge(p: Priority) {
  return p === "high"
    ? "bg-destructive/10 text-destructive"
    : p === "medium"
      ? "bg-gold/15 text-foreground"
      : "bg-accent-soft text-accent";
}

function HealthScorePage() {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<Set<string>>(new Set());
  const { current } = useBusiness();
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("financial_years")
      .select("*")
      .eq("business_id", current.id)
      .order("year", { ascending: true })
      .then(({ data }) => {
        setFinancials(data ?? []);
        setLoading(false);
      });
  }, [current]);

  const inputs = useMemo(
    () => (current ? toBusinessInputs(current, financials) : null),
    [current, financials],
  );
  const result = useMemo(() => (inputs ? computeHealthScore(inputs) : null), [inputs]);
  const valuation = useMemo(() => (inputs ? valueBusiness(inputs) : null), [inputs]);

  if (!current || loading)
    return <div className="p-12 text-sm text-muted-foreground">Loading…</div>;
  if (!result || !inputs) return null;

  const baselineMid = valuation?.rangeMid || 0;
  const recs = TEMPLATES.map((t) => ({
    ...t,
    impact_low: baselineMid * t.impact_pct[0],
    impact_high: baselineMid * t.impact_pct[1],
    relevant: t.applies(inputs),
  })).sort((a, b) => {
    if (a.relevant !== b.relevant) return a.relevant ? -1 : 1;
    const pri = { high: 0, medium: 1, low: 2 };
    if (pri[a.priority] !== pri[b.priority]) return pri[a.priority] - pri[b.priority];
    return b.impact_high - a.impact_high;
  });

  const toggleRoadmap = (key: string) => {
    setRoadmap((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        toast("Removed from roadmap");
      } else {
        next.add(key);
        toast.success("Added to roadmap");
      }
      return next;
    });
  };

  const runScenario = (rec: (typeof recs)[number]) => {
    const params = new URLSearchParams();
    Object.entries(rec.scenario).forEach(([k, v]) => params.set(k, String(v)));
    navigate({
      to: "/app/scenarios",
      search: Object.fromEntries(params) as Record<string, string>,
    });
  };

  const { total, breakdown } = result;
  const entries = (Object.keys(breakdown) as (keyof HealthBreakdown)[]).map((k) => {
    const item = breakdown[k];
    return {
      key: k,
      label: item.label,
      description: item.detail,
      tip: CATEGORY_META[k].tip,
      threshold: item.threshold,
      driver: item.driver,
      status: item.status,
      score: item.score,
      max: item.max,
      pct: (item.score / item.max) * 100,
    };
  });

  const radial = [{ name: "Score", value: total, fill: "var(--accent)" }];

  const chartData = entries.map((e) => ({
    name: e.label,
    score: e.score,
    remainder: e.max - e.score,
    pct: Math.round(e.pct),
  }));
  const radialSummary = `Overall Value Health Score is ${total} out of 100, rated ${result.ratingLabel}. ${result.summary}`;
  const contributionSummary = `Category contribution chart across ${chartData.length} value drivers. Strongest score is ${result.strengths[0]?.label ?? "not available"}; weakest score is ${result.weaknesses[0]?.label ?? "not available"}.`;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-10">
      <div>
        <Link
          to="/app"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-primary">
          Value Health Score
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An exit-readiness diagnostic across the eight drivers buyers and lenders weight most.
        </p>
      </div>

      <section className="grid lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Overall Score
          </div>
          <AccessibleChart
            title="Overall Value Health Score"
            summary={radialSummary}
            className="h-56 -mt-2 relative"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="60%"
                innerRadius="70%"
                outerRadius="100%"
                data={radial}
                startAngle={180}
                endAngle={0}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div aria-hidden="true" className="absolute inset-x-0 bottom-6 text-center">
              <div className="font-display text-5xl font-semibold text-primary">{total}</div>
              <div className="text-xs text-muted-foreground">
                out of 100 · <span className="font-semibold">{result.ratingLabel}</span>
              </div>
            </div>
          </AccessibleChart>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{result.summary}</p>
          <Link
            to="/app/improve-value"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" /> See how to raise it
          </Link>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-sm font-semibold text-primary mb-3">Category contribution</div>
          <AccessibleChart title="Category contribution" summary={contributionSummary}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  domain={[0, 20]}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                  formatter={(v: number) => [`${v}`, "Score"]}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} stackId="s">
                  {chartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        d.pct >= 75
                          ? "var(--accent)"
                          : d.pct >= 40
                            ? "var(--chart-2)"
                            : "var(--destructive)"
                      }
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="remainder"
                  stackId="s"
                  fill="var(--secondary)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </AccessibleChart>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <TrendingUp className="h-4 w-4 text-accent" /> Strongest drivers
          </div>
          <div className="mt-3 space-y-3">
            {result.strengths.length ? (
              result.strengths.map((driver) => <DriverRow key={driver.key} driver={driver} />)
            ) : (
              <p className="text-sm text-muted-foreground">
                No category is above the strength threshold yet.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <AlertTriangle className="h-4 w-4 text-destructive" /> Priority gaps
          </div>
          <div className="mt-3 space-y-3">
            {result.weaknesses.map((driver) => (
              <DriverRow key={driver.key} driver={driver} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {entries.map((e) => {
          const tier = e.status === "strength" ? "strong" : e.status === "watch" ? "ok" : "weak";
          return (
            <div key={e.key} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-primary">{e.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-2xl font-semibold text-foreground">
                    {e.score}
                    <span className="text-sm text-muted-foreground">/{e.max}</span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold rounded-full px-2 py-0.5 mt-1 ${
                      tier === "strong"
                        ? "bg-accent-soft text-accent"
                        : tier === "ok"
                          ? "bg-gold/15 text-foreground"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {tier === "strong" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {tier}
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full ${tier === "strong" ? "bg-accent" : tier === "ok" ? "bg-[var(--chart-2)]" : "bg-destructive"}`}
                  style={{ width: `${e.pct}%` }}
                />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                <strong>Current driver:</strong> {e.driver}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <strong>Threshold:</strong> {e.threshold}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <strong>How to improve:</strong> {e.tip}
              </p>
            </div>
          );
        })}
      </section>

      <section className="space-y-4 pt-2">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl font-semibold text-primary">Improve your value</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Targeted moves to raise each driver above, ranked by impact for your business today.
              {valuation ? (
                <>
                  {" "}
                  Baseline value:{" "}
                  <span className="font-semibold text-foreground">
                    {fmtCurrency(valuation.rangeLow, { compact: true })} –{" "}
                    {fmtCurrency(valuation.rangeHigh, { compact: true })}
                  </span>
                  .
                </>
              ) : null}
            </p>
          </div>
          <Link to="/app/scenarios" className="text-sm font-semibold text-accent hover:underline">
            Combine in scenarios →
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {recs.map((r) => {
            const inRoadmap = roadmap.has(r.key);
            return (
              <div
                key={r.key}
                className={`rounded-xl border bg-card p-6 transition ${r.relevant ? "border-border" : "border-dashed border-border opacity-70"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${priorityBadge(r.priority)}`}
                    >
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-primary">{r.title}</h3>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                          {r.category}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider font-semibold rounded-full px-2 py-0.5 ${priorityBadge(r.priority)}`}
                        >
                          {r.priority} priority
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                          {r.difficulty} · {r.time_required}
                        </span>
                        {!r.relevant && (
                          <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                            Already strong
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Est. value impact
                    </div>
                    <div className="font-display text-lg font-semibold text-accent">
                      +{fmtCurrency(r.impact_low, { compact: true })} –{" "}
                      {fmtCurrency(r.impact_high, { compact: true })}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {r.description}
                </p>

                <div className="mt-3 rounded-md bg-secondary/40 border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Buyer concern
                  </div>
                  <p className="mt-1 text-xs italic text-foreground/80">{r.buyer_concern}</p>
                </div>

                <div className="mt-3">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                    Action steps
                  </div>
                  <ul className="space-y-1 text-sm">
                    {r.action_steps.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <ArrowRight className="h-3.5 w-3.5 mt-1 text-accent shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleRoadmap(r.key)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      inRoadmap
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "border border-border bg-card hover:bg-secondary"
                    }`}
                  >
                    {inRoadmap ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> In roadmap
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Add to roadmap
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => runScenario(r)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    <Sliders className="h-3.5 w-3.5" /> Run scenario
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <ValuationDisclaimer className="mt-4" />
    </div>
  );
}

function DriverRow({ driver }: { driver: HealthDriver }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{driver.label}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{driver.driver}</div>
        </div>
        <div className="shrink-0 text-sm font-semibold tabular-nums text-primary">
          {driver.score}/{driver.max}
        </div>
      </div>
      <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {driver.threshold}
      </div>
    </div>
  );
}
