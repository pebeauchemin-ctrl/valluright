import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mountain, TrendingUp, AlertTriangle } from "lucide-react";
import { useMemo } from "react";
import {
  valueBusiness,
  computeHealthScore,
  SAMPLE_HVAC_BUSINESS,
  SAMPLE_HVAC_FINANCIALS,
} from "@/lib/valuation";
import { fmtCurrency, fmtPct } from "@/lib/format";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Sample Valuation — ValuRight.ai" },
      { name: "description", content: "See a sample exit-readiness report for a fictional HVAC business." },
    ],
  }),
  component: Demo,
});

function Demo() {
  const inputs = useMemo(
    () => ({ ...SAMPLE_HVAC_BUSINESS, financials: SAMPLE_HVAC_FINANCIALS }),
    []
  );
  const valuation = useMemo(() => valueBusiness(inputs), [inputs]);
  const health = useMemo(() => computeHealthScore(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mountain className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-primary">valuright.ai</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
            Sample report — fictional business
          </span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-primary">{SAMPLE_HVAC_BUSINESS.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {SAMPLE_HVAC_BUSINESS.industry} · {SAMPLE_HVAC_BUSINESS.region} · {SAMPLE_HVAC_BUSINESS.years_in_business} years in business
          </p>
        </div>

        {/* Range card */}
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estimated value range</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
              <TrendingUp className="h-3 w-3" /> Health {health.total}/100
            </span>
          </div>
          <div className="font-display text-5xl font-semibold text-primary">
            {fmtCurrency(valuation.rangeLow, { compact: true })}{" "}
            <span className="text-muted-foreground font-normal">–</span>{" "}
            {fmtCurrency(valuation.rangeHigh, { compact: true })}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Median estimate: <span className="font-semibold text-foreground">{fmtCurrency(valuation.rangeMid)}</span>
          </div>
          <div className="mt-6 h-3 rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-gold" />
          </div>
        </section>

        {/* Method cards */}
        <h2 className="mt-12 mb-4 font-display text-2xl font-semibold text-primary">Six valuation methods</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {valuation.methods.map((m) => (
            <div key={m.method} className={`rounded-xl border bg-card p-5 ${m.available ? "border-border" : "border-dashed border-border opacity-60"}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-primary">{m.label}</h3>
                <span className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                  m.confidence === "high" ? "bg-accent-soft text-accent" :
                  m.confidence === "medium" ? "bg-gold/15 text-foreground" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {m.confidence}
                </span>
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

        {/* Health breakdown */}
        <h2 className="mt-12 mb-4 font-display text-2xl font-semibold text-primary">Value Health Score</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(health.breakdown).map(([key, v]) => {
              const pct = (v.score / v.max) * 100;
              const tone = pct >= 70 ? "bg-accent" : pct >= 40 ? "bg-gold" : "bg-destructive";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    <span className="font-semibold text-foreground">{v.score}<span className="text-muted-foreground font-normal">/{v.max}</span></span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top concerns */}
        <h2 className="mt-12 mb-4 font-display text-2xl font-semibold text-primary">What's suppressing value</h2>
        <div className="space-y-3">
          <Concern title="High owner dependence" desc={`Owner works ~${SAMPLE_HVAC_BUSINESS.owner_hours_per_week} hrs/week and is involved in sales, ops, and customer relationships. Buyers will see a single point of failure.`} impact="$120K – $200K" />
          <Concern title="Low recurring revenue" desc={`Only ${fmtPct(SAMPLE_HVAC_BUSINESS.recurring_revenue_pct)} of revenue is from service contracts. Recurring revenue commands a premium multiple.`} impact="$80K – $130K" />
          <Concern title="Partial documentation" desc="Without complete SOPs and a documented playbook, transition risk reduces multiple. Buyers discount what they can't verify." impact="$40K – $70K" />
        </div>

        <div className="mt-12 rounded-xl border border-accent/30 bg-accent-soft p-6 text-center">
          <h3 className="font-display text-xl font-semibold text-primary">Ready to run yours?</h3>
          <p className="mt-2 text-sm text-foreground/80">Get your own valuation, recommendations, and what-if builder in about 15 minutes.</p>
          <Link to="/auth" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition">
            Start free
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
          ValuRight.ai outputs are software-generated planning estimates. They are not certified appraisals,
          tax advice, legal advice, investment advice, or guaranteed sale prices.
        </p>
      </main>
    </div>
  );
}

function Concern({ title, desc, impact }: { title: string; desc: string; impact: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-foreground">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-semibold text-primary">{title}</h3>
          <span className="shrink-0 inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
            +{impact}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
