import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Map, ChevronRight, Sliders } from "lucide-react";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";

type ScenarioRow = {
  id: string;
  name: string;
  description: string | null;
  current_value: number | null;
  projected_value: number | null;
  value_delta: number | null;
  timeline_months: number | null;
  include_in_report: boolean;
  action_steps: string[] | null;
  roadmap_phase: string | null;
};

const PHASES = ["Now", "Next 90 Days", "Next 6 Months", "Before Sale"] as const;

export const Route = createFileRoute("/app/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — ValuRight.ai" }] }),
  component: Roadmap,
});

function Roadmap() {
  const { current } = useBusiness();
  const [rows, setRows] = useState<ScenarioRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    supabase
      .from("scenarios")
      .select(
        "id,name,description,current_value,projected_value,value_delta,timeline_months,include_in_report,action_steps,roadmap_phase",
      )
      .eq("business_id", current.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows((data ?? []) as ScenarioRow[]);
        setLoading(false);
      });
  }, [current]);

  async function movePhase(id: string, newPhase: string) {
    const { error } = await supabase
      .from("scenarios")
      .update({ roadmap_phase: newPhase })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, roadmap_phase: newPhase } : r)));
  }

  if (!current)
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  const totalLift = rows.reduce((s, r) => s + (Number(r.value_delta) || 0), 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary flex items-center gap-2">
            <Map className="h-6 w-6" /> Exit roadmap
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sequence the moves that grow your value before sale. Drag scenarios across phases as
            they advance.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Total potential lift
          </div>
          <div className="font-display text-2xl font-semibold text-accent">
            {totalLift >= 0 ? "+" : ""}
            {fmtCurrency(totalLift, { compact: true })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Sliders className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-lg font-semibold">No scenarios yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build a scenario in What-if and assign it to a roadmap phase.
          </p>
          <Link
            to="/app/scenarios"
            className="mt-4 inline-flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Open scenarios <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PHASES.map((phase) => {
            const items = rows.filter((r) => (r.roadmap_phase ?? "Next 90 Days") === phase);
            const lift = items.reduce((s, r) => s + (Number(r.value_delta) || 0), 0);
            return (
              <div
                key={phase}
                className="rounded-2xl border border-border bg-card p-4 flex flex-col"
              >
                <div className="flex items-baseline justify-between mb-3">
                  <h3 className="font-display font-semibold text-primary">{phase}</h3>
                  <span className="text-xs text-muted-foreground">
                    {items.length} · {lift >= 0 ? "+" : ""}
                    {fmtCurrency(lift, { compact: true })}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  {items.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">
                      No scenarios in this phase.
                    </div>
                  )}
                  {items.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg border border-border bg-background p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">{r.name}</div>
                        <div
                          className={`text-xs font-semibold tabular-nums ${Number(r.value_delta) >= 0 ? "text-accent" : "text-destructive"}`}
                        >
                          {Number(r.value_delta) >= 0 ? "+" : ""}
                          {fmtCurrency(Number(r.value_delta), { compact: true })}
                        </div>
                      </div>
                      {r.description && (
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      )}
                      <div className="text-[11px] text-muted-foreground">
                        {fmtCurrency(Number(r.current_value), { compact: true })} →{" "}
                        {fmtCurrency(Number(r.projected_value), { compact: true })} ·{" "}
                        {r.timeline_months ?? "—"} mo
                      </div>
                      {(r.action_steps ?? []).length > 0 && (
                        <ul className="text-xs space-y-0.5 list-disc list-inside text-foreground/80">
                          {(r.action_steps ?? []).slice(0, 4).map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        {r.include_in_report && (
                          <span className="text-[10px] uppercase tracking-wider rounded-full bg-accent-soft px-2 py-0.5 text-accent">
                            In report
                          </span>
                        )}
                        <select
                          value={phase}
                          onChange={(e) => movePhase(r.id, e.target.value)}
                          className="ml-auto text-xs rounded border border-border bg-background px-1.5 py-1"
                        >
                          {PHASES.map((p) => (
                            <option key={p} value={p}>
                              Move → {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
