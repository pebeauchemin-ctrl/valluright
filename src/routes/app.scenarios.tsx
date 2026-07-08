import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useId, useMemo, useState } from "react";
import { Sliders, Save, Trash2, Lightbulb, AlertTriangle } from "lucide-react";
import { useBusiness, toBusinessInputs, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { valueBusiness, computeHealthScore, type Valuation } from "@/lib/valuation";
import {
  applyScenarioSearchToKnobs,
  businessKnobs,
  pctToHrs,
  scenarioInputs,
  sopScoreToStatus,
  validateScenarioSearch,
  type ScenarioKnobs,
} from "@/lib/scenario-search";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import { COUNSEL_REVIEW_TEXT, VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { recordProductEvent } from "@/lib/observability.functions";
import { LoadErrorState, errorMessage } from "@/components/LoadErrorState";

type ScenarioRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  owner_involvement_pct: number | null;
  recurring_revenue_pct: number | null;
  profit_margin_pct: number | null;
  revenue_growth_pct: number | null;
  customer_concentration_pct: number | null;
  sop_score: number | null;
  manager_hired: boolean | null;
  current_value: number | null;
  projected_value: number | null;
  value_delta: number | null;
  timeline_months: number | null;
  include_in_report: boolean;
  action_steps: string[] | null;
  roadmap_phase: string | null;
};

const PHASES = ["Now", "Next 90 Days", "Next 6 Months", "Before Sale"] as const;

export const Route = createFileRoute("/app/scenarios")({
  head: () => ({ meta: [{ title: "What-If Scenarios — ValuRight.ai" }] }),
  validateSearch: validateScenarioSearch,
  component: Scenarios,
});

function Scenarios() {
  const { current } = useBusiness();
  const {
    hireManager: scenarioHireManager,
    marginUplift: scenarioMarginUplift,
    ownerHrs: scenarioOwnerHrs,
    recurring: scenarioRecurring,
    revenueGrowth: scenarioRevenueGrowth,
    sopComplete: scenarioSopComplete,
    timelineMonths: scenarioTimelineMonths,
    topCust: scenarioTopCust,
  } = Route.useSearch();
  const scenarioSearch = useMemo(
    () => ({
      hireManager: scenarioHireManager,
      marginUplift: scenarioMarginUplift,
      ownerHrs: scenarioOwnerHrs,
      recurring: scenarioRecurring,
      revenueGrowth: scenarioRevenueGrowth,
      sopComplete: scenarioSopComplete,
      timelineMonths: scenarioTimelineMonths,
      topCust: scenarioTopCust,
    }),
    [
      scenarioHireManager,
      scenarioMarginUplift,
      scenarioOwnerHrs,
      scenarioRecurring,
      scenarioRevenueGrowth,
      scenarioSopComplete,
      scenarioTimelineMonths,
      scenarioTopCust,
    ],
  );
  const recordEvent = useServerFn(recordProductEvent);
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [saved, setSaved] = useState<ScenarioRow[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [actionStepsText, setActionStepsText] = useState("");
  const [includeInReport, setIncludeInReport] = useState(false);
  const [phase, setPhase] = useState<(typeof PHASES)[number]>("Next 90 Days");
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const [k, setK] = useState<ScenarioKnobs>({
    ownerInvolvement: 70,
    recurring: 20,
    profitMargin: 0,
    revenueGrowth: 0,
    customerConc: 20,
    sopScore: 40,
    managerHired: false,
    timelineMonths: 6,
  });

  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setFinancials([]);
      setSaved([]);
      setLoadError(null);
      setPageLoading(false);
      return;
    }
    setPageLoading(true);
    setLoadError(null);
    Promise.all([
      supabase
        .from("financial_years")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: true }),
      supabase
        .from("scenarios")
        .select("*")
        .eq("business_id", current.id)
        .order("created_at", { ascending: false }),
    ])
      .then(([financialsResult, scenariosResult]) => {
        if (cancelled) return;
        const error = financialsResult.error ?? scenariosResult.error;
        if (error) throw error;
        setFinancials(financialsResult.data ?? []);
        setSaved((scenariosResult.data ?? []) as ScenarioRow[]);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error, "Could not load scenarios."));
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });
    setK((prev) =>
      applyScenarioSearchToKnobs(
        { ...prev, ...businessKnobs(current), timelineMonths: prev.timelineMonths },
        scenarioSearch,
      ),
    );
    return () => {
      cancelled = true;
    };
  }, [current, scenarioSearch, loadAttempt]);

  const baseline = useMemo<Valuation | null>(() => {
    if (!current) return null;
    return valueBusiness(toBusinessInputs(current, financials));
  }, [current, financials]);

  const baselineHealth = useMemo(
    () => (current ? computeHealthScore(toBusinessInputs(current, financials)).total : 0),
    [current, financials],
  );

  const projected = useMemo(() => {
    if (!current) return null;
    const base = toBusinessInputs(current, financials);

    const inputs = scenarioInputs(base, k);
    const v = valueBusiness(inputs);
    const h = computeHealthScore(inputs).total;
    return { v, health: h, inputs };
  }, [current, financials, k]);

  if (!current)
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;
  if (pageLoading) return <div className="p-12 text-sm text-muted-foreground">Loading…</div>;
  if (loadError) {
    return (
      <LoadErrorState
        title="Could not load scenarios"
        message={loadError}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }
  if (!baseline || !projected)
    return <div className="p-12 text-sm text-muted-foreground">Loading…</div>;

  // Multiple = enterpriseValue / latest EBITDA (non-RE) or NOI (RE)
  const latest = financials[financials.length - 1];
  const denomBase =
    baseline.category === "real_estate_income"
      ? (baseline.methods.find((m) => m.method === "cap_rate")?.noi ?? latest?.ebitda ?? 0)
      : (latest?.ebitda ?? 0);
  const denomProj =
    projected.v.category === "real_estate_income"
      ? (projected.v.methods.find((m) => m.method === "cap_rate")?.noi ?? 0)
      : (projected.inputs.financials[projected.inputs.financials.length - 1]?.ebitda ?? 0);

  const baseMultiple = denomBase > 0 ? baseline.rangeMid / denomBase : 0;
  const projMultiple = denomProj > 0 ? projected.v.rangeMid / denomProj : 0;

  const baseRisk = Math.max(0, 100 - baselineHealth);
  const projRisk = Math.max(0, 100 - projected.health);
  const delta = projected.v.rangeMid - baseline.rangeMid;
  const deltaPct = baseline.rangeMid ? (delta / baseline.rangeMid) * 100 : 0;

  // Paradox warning
  const baseEbitda = latest?.ebitda ?? 0;
  const projEbitda =
    projected.inputs.financials[projected.inputs.financials.length - 1]?.ebitda ?? 0;
  const paradoxVisible = k.managerHired && projEbitda < baseEbitda && projMultiple > baseMultiple;

  async function saveScenario() {
    if (!current) return;
    if (!name.trim()) {
      toast.error("Give your scenario a name.");
      return;
    }
    const action_steps = actionStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      business_id: current.id,
      name: name.trim(),
      description: description.trim() || null,
      owner_involvement_pct: k.ownerInvolvement,
      recurring_revenue_pct: k.recurring,
      profit_margin_pct: k.profitMargin,
      revenue_growth_pct: k.revenueGrowth,
      customer_concentration_pct: k.customerConc,
      sop_score: k.sopScore,
      manager_hired: k.managerHired,
      current_value: baseline!.rangeMid,
      projected_value: projected!.v.rangeMid,
      value_delta: delta,
      timeline_months: k.timelineMonths,
      include_in_report: includeInReport,
      action_steps,
      roadmap_phase: phase,
    };
    const { data, error } = await supabase.from("scenarios").insert(payload).select("*").single();
    if (error) {
      toast.error(error.message);
      return;
    }
    await recordEvent({
      data: {
        eventName: "scenario_saved",
        area: "activation",
        businessId: current.id,
        targetType: "scenario",
        targetId: data.id,
        metadata: {
          include_in_report: includeInReport,
          roadmap_phase: phase,
          timeline_months: k.timelineMonths,
        },
      },
    }).catch(() => undefined);
    setSaved((prev) => [data as ScenarioRow, ...prev]);
    setName("");
    setDescription("");
    setActionStepsText("");
    setIncludeInReport(false);
    toast.success("Scenario saved");
  }

  async function deleteScenario(id: string) {
    const { error } = await supabase.from("scenarios").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  async function toggleReport(s: ScenarioRow) {
    const { error } = await supabase
      .from("scenarios")
      .update({ include_in_report: !s.include_in_report })
      .eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSaved((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, include_in_report: !s.include_in_report } : x)),
    );
  }

  function loadScenario(s: ScenarioRow) {
    setK({
      ownerInvolvement: Number(s.owner_involvement_pct ?? 70),
      recurring: Number(s.recurring_revenue_pct ?? 20),
      profitMargin: Number(s.profit_margin_pct ?? 0),
      revenueGrowth: Number(s.revenue_growth_pct ?? 0),
      customerConc: Number(s.customer_concentration_pct ?? 20),
      sopScore: Number(s.sop_score ?? 40),
      managerHired: !!s.manager_hired,
      timelineMonths: Number(s.timeline_months ?? 6),
    });
    setName(s.name);
    setDescription(s.description ?? "");
    setActionStepsText((s.action_steps ?? []).join("\n"));
    setIncludeInReport(s.include_in_report);
    setPhase((s.roadmap_phase as (typeof PHASES)[number]) ?? "Next 90 Days");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">What-if scenarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Move the sliders to see how each lever may affect your planning estimate, multiple,
          health, and risk.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Scenario disclaimer. </span>
        Scenario values are model outputs based on hypothetical assumptions you enter.{" "}
        {VALUATION_DISCLAIMER_SHORT} {COUNSEL_REVIEW_TEXT}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" />
            <h2 className="font-display font-semibold text-primary">Adjustments</h2>
          </div>
          <Slider
            label="Owner involvement"
            value={k.ownerInvolvement}
            min={0}
            max={100}
            step={5}
            suffix="%"
            onChange={(v) => setK({ ...k, ownerInvolvement: v })}
            help={`≈ ${pctToHrs(k.ownerInvolvement)} hrs/week`}
          />
          <Slider
            label="Recurring revenue"
            value={k.recurring}
            min={0}
            max={100}
            step={5}
            suffix="%"
            onChange={(v) => setK({ ...k, recurring: v })}
          />
          <Slider
            label="Profit margin uplift"
            value={k.profitMargin}
            min={-10}
            max={20}
            step={1}
            suffix=" pts"
            onChange={(v) => setK({ ...k, profitMargin: v })}
          />
          <Slider
            label="Revenue growth (next year)"
            value={k.revenueGrowth}
            min={-20}
            max={50}
            step={1}
            suffix="%"
            onChange={(v) => setK({ ...k, revenueGrowth: v })}
          />
          <Slider
            label="Top customer concentration"
            value={k.customerConc}
            min={0}
            max={100}
            step={5}
            suffix="%"
            onChange={(v) => setK({ ...k, customerConc: v })}
          />
          <Slider
            label="SOP / documentation score"
            value={k.sopScore}
            min={0}
            max={100}
            step={5}
            onChange={(v) => setK({ ...k, sopScore: v })}
            help={`Status: ${sopScoreToStatus(k.sopScore)}`}
          />
          <label className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm cursor-pointer">
            <div className="min-w-0">
              <div className="font-medium">Hire a strong general manager</div>
              <div className="text-xs text-muted-foreground">
                Reduces earnings (~$95k salary) but lifts the multiple.
              </div>
            </div>
            <input
              type="checkbox"
              checked={k.managerHired}
              onChange={(e) => setK({ ...k, managerHired: e.target.checked })}
              className="h-4 w-4 shrink-0 accent-[oklch(0.45_0.1_158)]"
            />
          </label>
          <Slider
            label="Timeline to achieve"
            value={k.timelineMonths}
            min={1}
            max={36}
            step={1}
            suffix=" mo"
            onChange={(v) => setK({ ...k, timelineMonths: v })}
          />
        </div>

        {/* Result */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Today's value"
              value={`${fmtCurrency(baseline.rangeLow, { compact: true })} – ${fmtCurrency(baseline.rangeHigh, { compact: true })}`}
            />
            <Stat
              label="Projected value"
              value={`${fmtCurrency(projected.v.rangeLow, { compact: true })} – ${fmtCurrency(projected.v.rangeHigh, { compact: true })}`}
              accent
            />
            <Stat
              label="Multiple (today → projected)"
              value={`${baseMultiple.toFixed(2)}× → ${projMultiple.toFixed(2)}×`}
            />
            <Stat label="Health score" value={`${baselineHealth} → ${projected.health}`} />
            <Stat label="Risk score" value={`${baseRisk} → ${projRisk}`} />
            <Stat
              label="Net value gain / loss"
              value={`${delta >= 0 ? "+" : ""}${fmtCurrency(delta, { compact: true })} (${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)`}
              positive={delta >= 0}
              negative={delta < 0}
            />
          </div>

          {paradoxVisible && (
            <div className="rounded-lg border border-accent/40 bg-accent-soft p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-accent">
                <Lightbulb className="h-4 w-4" /> The manager paradox is in play
              </div>
              <div className="mt-1 text-foreground">
                EBITDA drops from {fmtCurrency(baseEbitda, { compact: true })} to{" "}
                {fmtCurrency(projEbitda, { compact: true })}, but the multiple rises from{" "}
                {baseMultiple.toFixed(2)}× to {projMultiple.toFixed(2)}× because the business is no
                longer dependent on you. Estimated model effect on the planning range midpoint:{" "}
                <strong>
                  {delta >= 0 ? "+" : ""}
                  {fmtCurrency(delta, { compact: true })}
                </strong>
                .
              </div>
            </div>
          )}

          {projected.health < baselineHealth - 5 && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Some changes weakened the business
              profile — confirm these are deliberate trade-offs.
            </div>
          )}
        </div>
      </div>

      {/* Save scenario */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-primary flex items-center gap-2">
          <Save className="h-4 w-4 text-accent" /> Save this scenario
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hire GM + grow recurring"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Roadmap phase">
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as (typeof PHASES)[number])}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Action steps (one per line)" className="md:col-span-2">
            <textarea
              value={actionStepsText}
              onChange={(e) => setActionStepsText(e.target.value)}
              rows={3}
              placeholder="Hire GM by Q2&#10;Document top 5 SOPs&#10;Cross-train sales team"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeInReport}
            onChange={(e) => setIncludeInReport(e.target.checked)}
            className="accent-[oklch(0.45_0.1_158)] h-4 w-4"
          />
          Include in buyer / advisor report
        </label>
        <button
          onClick={saveScenario}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
        >
          Save scenario
        </button>
      </div>

      {/* Saved scenarios */}
      {saved.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display font-semibold text-primary mb-4">Saved scenarios</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-right py-2 px-3">Current</th>
                  <th className="text-right py-2 px-3">Projected</th>
                  <th className="text-right py-2 px-3">Δ</th>
                  <th className="text-right py-2 px-3">Timeline</th>
                  <th className="text-left py-2 px-3">Phase</th>
                  <th className="text-center py-2 px-3">In report</th>
                  <th className="py-2 pl-3"></th>
                </tr>
              </thead>
              <tbody>
                {saved.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => loadScenario(s)}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {s.name}
                      </button>
                      {s.description && (
                        <div className="text-xs text-muted-foreground">{s.description}</div>
                      )}
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums">
                      {fmtCurrency(Number(s.current_value), { compact: true })}
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums">
                      {fmtCurrency(Number(s.projected_value), { compact: true })}
                    </td>
                    <td
                      className={`text-right py-2 px-3 tabular-nums font-semibold ${Number(s.value_delta) >= 0 ? "text-accent" : "text-destructive"}`}
                    >
                      {Number(s.value_delta) >= 0 ? "+" : ""}
                      {fmtCurrency(Number(s.value_delta), { compact: true })}
                    </td>
                    <td className="text-right py-2 px-3 tabular-nums">
                      {s.timeline_months ?? "—"} mo
                    </td>
                    <td className="py-2 px-3 text-xs">{s.roadmap_phase ?? "—"}</td>
                    <td className="text-center py-2 px-3">
                      <input
                        type="checkbox"
                        checked={s.include_in_report}
                        onChange={() => toggleReport(s)}
                        className="accent-[oklch(0.45_0.1_158)] h-4 w-4"
                      />
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <button
                        onClick={() => deleteScenario(s.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
  help,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
  help?: string;
}) {
  const inputId = useId();

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label htmlFor={inputId} className="min-w-0 font-medium">
          {label}
        </label>
        <span className="shrink-0 text-muted-foreground tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[oklch(0.45_0.1_158)]"
      />
      {help && <div className="mt-1 text-[11px] text-muted-foreground">{help}</div>}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  positive,
  negative,
}: {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-1 break-words font-display text-lg font-semibold ${accent ? "text-primary" : positive ? "text-accent" : negative ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <div className="text-xs font-medium text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
