import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, AlertTriangle, ArrowRight, Plus, Sliders, Check } from "lucide-react";
import { useBusiness, toBusinessInputs, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { valueBusiness, computeHealthScore, type BusinessInputs } from "@/lib/valuation";
import { fmtCurrency } from "@/lib/format";
import { LoadErrorState, errorMessage } from "@/components/LoadErrorState";
import {
  addRecommendationToRoadmap,
  loadRoadmapRecommendationLinks,
  removeRecommendationFromRoadmap,
  type RoadmapRecommendationInput,
} from "@/lib/roadmap-recommendations";
import { toast } from "sonner";

export const Route = createFileRoute("/app/improve-value")({
  head: () => ({ meta: [{ title: "Improve Value — ValuRight.ai" }] }),
  component: ImproveValue,
});

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
  // % uplift to apply to baseline mid valuation, low/high
  impact_pct: [number, number];
  // Predicate: does this rec apply to this business?
  applies: (b: BusinessInputs) => boolean;
  // Scenario params (passed via query)
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
      "Delegate sales, operations, and customer relationships so the business runs without you. This is the single biggest multiple-mover for owner-operated SMBs.",
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
      "Get three full years of clean books, separate personal from business expenses, and build a clear add-back schedule. This raises confidence on every multiple.",
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
      "Diversify so no single customer is more than 15% of revenue. High concentration is the most common reason SMB deals fall apart in diligence.",
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

function ImproveValue() {
  const { current } = useBusiness();
  const navigate = useNavigate();
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roadmap, setRoadmap] = useState<Set<string>>(new Set());
  const [roadmapScenarioIds, setRoadmapScenarioIds] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setFinancials([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    void (async () => {
      try {
        const [financialsResult, roadmapLinks] = await Promise.all([
          supabase
            .from("financial_years")
            .select("*")
            .eq("business_id", current.id)
            .order("year", { ascending: true }),
          loadRoadmapRecommendationLinks(current.id),
        ]);
        if (cancelled) return;
        if (financialsResult.error) throw financialsResult.error;
        setFinancials(financialsResult.data ?? []);
        const titleToKey = new Map(TEMPLATES.map((template) => [template.title, template.key]));
        const scenarioIds: Record<string, string> = {};
        for (const link of roadmapLinks) {
          const key = titleToKey.get(link.title);
          if (key) scenarioIds[key] = link.id;
        }
        setRoadmap(new Set(Object.keys(scenarioIds)));
        setRoadmapScenarioIds(scenarioIds);
      } catch (error) {
        if (!cancelled) setLoadError(errorMessage(error, "Could not load improvement ideas."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [current, loadAttempt]);

  const inputs = useMemo(
    () => (current ? toBusinessInputs(current, financials) : null),
    [current, financials],
  );
  const valuation = useMemo(() => (inputs ? valueBusiness(inputs) : null), [inputs]);
  const health = useMemo(() => (inputs ? computeHealthScore(inputs) : null), [inputs]);

  if (!current || loading)
    return <div className="p-12 text-sm text-muted-foreground">Loading…</div>;
  if (loadError) {
    return (
      <LoadErrorState
        title="Could not load improvement ideas"
        message={loadError}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }
  if (!inputs || !valuation) return null;

  const baselineMid = valuation.rangeMid || 0;

  const recs = TEMPLATES.map((t) => ({
    ...t,
    impact_low: baselineMid * t.impact_pct[0],
    impact_high: baselineMid * t.impact_pct[1],
    relevant: t.applies(inputs),
  })).sort((a, b) => {
    // relevant first, then by priority, then by impact
    if (a.relevant !== b.relevant) return a.relevant ? -1 : 1;
    const pri = { high: 0, medium: 1, low: 2 };
    if (pri[a.priority] !== pri[b.priority]) return pri[a.priority] - pri[b.priority];
    return b.impact_high - a.impact_high;
  });

  const roadmapInput = (rec: (typeof recs)[number]): RoadmapRecommendationInput => ({
    actionSteps: rec.action_steps,
    buyerConcern: rec.buyer_concern,
    category: rec.category,
    description: rec.description,
    impactHigh: rec.impact_high,
    impactLow: rec.impact_low,
    key: rec.key,
    timeRequired: rec.time_required,
    title: rec.title,
  });

  const toggleRoadmap = async (rec: (typeof recs)[number]) => {
    if (!current) return;
    try {
      if (roadmap.has(rec.key)) {
        await removeRecommendationFromRoadmap({
          businessId: current.id,
          scenarioId: roadmapScenarioIds[rec.key],
          title: rec.title,
        });
        setRoadmap((prev) => {
          const next = new Set(prev);
          next.delete(rec.key);
          return next;
        });
        setRoadmapScenarioIds((prev) => {
          const next = { ...prev };
          delete next[rec.key];
          return next;
        });
        toast("Removed from roadmap");
        return;
      }

      const scenarioId = await addRecommendationToRoadmap({
        businessId: current.id,
        recommendation: roadmapInput(rec),
      });
      setRoadmap((prev) => new Set(prev).add(rec.key));
      setRoadmapScenarioIds((prev) => ({ ...prev, [rec.key]: scenarioId }));
      toast.success("Added to roadmap");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update roadmap");
    }
  };

  const runScenario = (rec: (typeof recs)[number]) => {
    const params = new URLSearchParams();
    Object.entries(rec.scenario).forEach(([k, v]) => params.set(k, String(v)));
    navigate({
      to: "/app/scenarios",
      search: Object.fromEntries(params) as Record<string, string>,
    });
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Improve Value</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Targeted moves to raise your valuation, ranked by impact for your business today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/app/health-score"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            View health score{health ? ` · ${health.total}/100` : ""}
          </Link>
          <Link
            to="/app/recommendations"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Sparkles className="h-4 w-4" /> AI recommendations
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        Today's estimated value:{" "}
        <span className="font-semibold text-foreground">
          {fmtCurrency(valuation.rangeLow, { compact: true })} –{" "}
          {fmtCurrency(valuation.rangeHigh, { compact: true })}
        </span>
        . Each card below estimates the lift on your{" "}
        <span className="font-semibold text-foreground">median</span> from acting on that lever.
        Combine multiple levers in{" "}
        <Link to="/app/scenarios" className="text-accent font-semibold hover:underline">
          What-if Scenarios
        </Link>
        .
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

              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{r.description}</p>

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
                  onClick={() => toggleRoadmap(r)}
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

      <p className="text-xs text-muted-foreground text-center pt-4">
        Impact estimates are software-generated planning ranges, not guarantees of sale price.
      </p>
    </div>
  );
}
