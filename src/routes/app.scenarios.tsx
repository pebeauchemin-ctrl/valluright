import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Sliders } from "lucide-react";
import { useBusiness, toBusinessInputs, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { valueBusiness } from "@/lib/valuation";
import { fmtCurrency } from "@/lib/format";

export const Route = createFileRoute("/app/scenarios")({
  head: () => ({ meta: [{ title: "Scenarios — ValuRight.ai" }] }),
  component: Scenarios,
});

function Scenarios() {
  const { current } = useBusiness();
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);

  // Scenario sliders
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [marginUplift, setMarginUplift] = useState(0);
  const [recurring, setRecurring] = useState<number | null>(null);
  const [ownerHrs, setOwnerHrs] = useState<number | null>(null);
  const [topCust, setTopCust] = useState<number | null>(null);
  const [sopComplete, setSopComplete] = useState(false);
  const [hireManager, setHireManager] = useState(false);

  useEffect(() => {
    if (!current) return;
    supabase.from("financial_years").select("*").eq("business_id", current.id).order("year", { ascending: true })
      .then(({ data }) => {
        setFinancials(data ?? []);
        setRecurring(Number(current.recurring_revenue_pct ?? 0));
        setOwnerHrs(current.owner_hours_per_week ?? 50);
        setTopCust(Number(current.top_customer_concentration_pct ?? 0));
      });
  }, [current]);

  const baseline = useMemo(() => {
    if (!current) return null;
    return valueBusiness(toBusinessInputs(current, financials));
  }, [current, financials]);

  const projected = useMemo(() => {
    if (!current) return null;
    const base = toBusinessInputs(current, financials);
    const newFin = base.financials.map((y, i, arr) => {
      if (i !== arr.length - 1) return y;
      const newRev = y.revenue * (1 + revenueGrowth / 100);
      const newEbitda = y.ebitda * (1 + revenueGrowth / 100) + (y.revenue * (marginUplift / 100));
      return { ...y, revenue: newRev, ebitda: newEbitda };
    });
    return valueBusiness({
      ...base,
      financials: newFin,
      recurring_revenue_pct: recurring,
      owner_hours_per_week: ownerHrs,
      top_customer_concentration_pct: topCust,
      sop_status: sopComplete ? "complete" : base.sop_status,
      manager_team_depth: hireManager ? "strong" : base.manager_team_depth,
    });
  }, [current, financials, revenueGrowth, marginUplift, recurring, ownerHrs, topCust, sopComplete, hireManager]);

  if (!current) return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;
  if (!baseline || !projected) return <div className="p-12 text-sm text-muted-foreground">Loading…</div>;

  const delta = projected.rangeMid - baseline.rangeMid;
  const deltaPct = baseline.rangeMid ? (delta / baseline.rangeMid) * 100 : 0;

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">What-if scenarios</h1>
        <p className="mt-1 text-sm text-muted-foreground">Move the sliders to see exactly how each change moves your valuation.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" />
            <h2 className="font-display font-semibold text-primary">Adjustments</h2>
          </div>
          <Slider label="Revenue growth (next year)" value={revenueGrowth} min={-20} max={50} step={1} onChange={setRevenueGrowth} suffix="%" />
          <Slider label="EBITDA margin uplift" value={marginUplift} min={0} max={20} step={1} onChange={setMarginUplift} suffix=" pts" />
          <Slider label="Recurring revenue %" value={recurring ?? 0} min={0} max={100} step={5} onChange={setRecurring} suffix="%" />
          <Slider label="Owner hours / week" value={ownerHrs ?? 50} min={0} max={80} step={5} onChange={setOwnerHrs} />
          <Slider label="Top customer concentration" value={topCust ?? 0} min={0} max={100} step={5} onChange={setTopCust} suffix="%" />
          <label className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm cursor-pointer">
            <span>Complete SOP / playbook</span>
            <input type="checkbox" checked={sopComplete} onChange={(e) => setSopComplete(e.target.checked)} className="accent-[oklch(0.45_0.1_158)]" />
          </label>
          <label className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm cursor-pointer">
            <span>Hire a strong general manager</span>
            <input type="checkbox" checked={hireManager} onChange={(e) => setHireManager(e.target.checked)} className="accent-[oklch(0.45_0.1_158)]" />
          </label>
        </div>

        {/* Result */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's value</div>
            <div className="mt-1 font-display text-2xl font-semibold text-foreground">
              {fmtCurrency(baseline.rangeLow, { compact: true })} – {fmtCurrency(baseline.rangeHigh, { compact: true })}
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent">Projected value</div>
            <div className="mt-1 font-display text-3xl font-semibold text-primary">
              {fmtCurrency(projected.rangeLow, { compact: true })} – {fmtCurrency(projected.rangeHigh, { compact: true })}
            </div>
            <div className={`mt-2 text-sm font-semibold ${delta >= 0 ? "text-accent" : "text-destructive"}`}>
              {delta >= 0 ? "+" : ""}{fmtCurrency(delta, { compact: true })} ({deltaPct >= 0 ? "+" : ""}{deltaPct.toFixed(1)}%)
            </div>
          </div>
          <div className="rounded-lg bg-accent-soft p-4 text-sm text-foreground">
            <strong>Why this matters:</strong> Each lever shifts your multiple within the industry band. Reducing owner dependence and adding recurring revenue typically have the biggest impact for SMBs.
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, suffix }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[oklch(0.45_0.1_158)]" />
    </div>
  );
}
