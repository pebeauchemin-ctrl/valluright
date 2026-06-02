import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import { useBusiness, toBusinessInputs, type FinancialYearRow } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { valueBusiness, computeHealthScore } from "@/lib/valuation";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/recommendations")({
  head: () => ({ meta: [{ title: "Recommendations — ValuRight.ai" }] }),
  component: Recs,
});

type Rec = {
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  difficulty: "easy" | "medium" | "hard";
  time_required: string;
  description: string;
  buyer_concern: string;
  action_steps: string[];
  estimated_impact_low: number;
  estimated_impact_high: number;
};

function Recs() {
  const { current } = useBusiness();
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!current) return;
    supabase
      .from("financial_years")
      .select("*")
      .eq("business_id", current.id)
      .then(({ data }) => setFinancials(data ?? []));
  }, [current]);

  const generate = async () => {
    if (!current) return;
    setLoading(true);
    try {
      const inputs = toBusinessInputs(current, financials);
      const v = valueBusiness(inputs);
      const h = computeHealthScore(inputs);
      const { data, error } = await supabase.functions.invoke("generate-recommendations", {
        body: { business: current, financials, valuation: v, health: h },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRecs(data?.recommendations ?? []);
      toast.success(`Generated ${data?.recommendations?.length ?? 0} recommendations`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  if (!current)
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Recommendations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-assisted draft actions based on your current valuation inputs. Review before relying
            on them.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> {recs.length ? "Regenerate" : "Generate with AI"}
            </>
          )}
        </button>
      </div>

      {recs.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-accent" />
          <h2 className="mt-3 font-display text-xl font-semibold text-primary">
            Ready to find hidden value?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Click "Generate with AI" to draft actions from your current valuation drivers. Treat
            them as review-ready suggestions, not professional advice.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {recs.map((r, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3 min-w-0">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${r.priority === "high" ? "bg-destructive/10 text-destructive" : r.priority === "medium" ? "bg-gold/15 text-foreground" : "bg-accent-soft text-accent"}`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-primary">{r.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                      {r.category}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                      {r.difficulty} · {r.time_required}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {r.description}
                  </p>
                  <p className="mt-2 text-xs italic text-muted-foreground">
                    <strong>Buyer concern:</strong> {r.buyer_concern}
                  </p>
                  {r.action_steps?.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm">
                      {r.action_steps.map((s, j) => (
                        <li key={j} className="flex gap-2">
                          <ArrowRight className="h-3.5 w-3.5 mt-1 text-accent shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Est. value impact
                </div>
                <div className="font-display text-lg font-semibold text-accent">
                  +{fmtCurrency(r.estimated_impact_low, { compact: true })} –{" "}
                  {fmtCurrency(r.estimated_impact_high, { compact: true })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <Link to="/app/scenarios" className="text-sm font-semibold text-accent hover:underline">
          Try a what-if scenario →
        </Link>
      </div>
    </div>
  );
}
