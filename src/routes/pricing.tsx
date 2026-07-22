import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { startStripeCheckout } from "@/lib/billing.functions";
import { ArrowRight, Check } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";
import { COMMERCIAL_PLANS, FREE_TRIAL_LIMITS, buyerTeaserPolicy } from "@/lib/commercial-model";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing - ValuRight.ai" },
      {
        name: "description",
        content:
          "ValuRight.ai pricing plans for business owners, exit preparation, advisors, and one-time valuation reports.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({ checkout: typeof search.checkout === "string" ? search.checkout : undefined }),
  component: PricingPage,
});

function PricingPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const checkout = useServerFn(startStripeCheckout);
  const begin = async (slug: string) => { if (!user) return; const result = await checkout({ data: { plan: slug as never } }); window.location.assign(result.url); };
  useEffect(() => { if (user && search.checkout) void begin(search.checkout); }, [user, search.checkout]);
  return (
    <PublicPageShell
      eyebrow="Pricing"
      title="Start with a free preview, upgrade when sharing matters"
      description="Every plan uses the same feature definitions. Paid sharing, data room access, and advisor invitations are enforced by the active subscription."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {COMMERCIAL_PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.highlighted
                ? "border-accent bg-card shadow-lg ring-2 ring-accent/20"
                : "border-border bg-card"
            }`}
          >
            {plan.highlighted && (
              <div className="mb-3 inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
                Most popular
              </div>
            )}
            <h2 className="font-display text-xl font-semibold text-primary">{plan.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{plan.who}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold text-primary">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.sub}</span>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.limits.map((limit) => (
                <li key={limit} className="flex gap-2 text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
              Buyer teaser: {buyerTeaserPolicy(plan)}
            </div>
            {user ? <button onClick={() => begin(plan.slug)} className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                plan.highlighted
                  ? "bg-accent text-accent-foreground hover:bg-accent/90"
                  : "border border-border bg-card text-foreground hover:border-accent hover:text-accent"
              }`}>{plan.cta} <ArrowRight className="h-4 w-4" /></button> : <Link to="/auth" search={{ mode: "signup", plan: plan.slug }} className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold transition ${plan.highlighted ? "bg-accent text-accent-foreground hover:bg-accent/90" : "border border-border bg-card text-foreground hover:border-accent hover:text-accent"}`}>{plan.cta} <ArrowRight className="h-4 w-4" /></Link>}
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-6">
        <h2 className="font-display text-xl font-semibold text-primary">
          Free preview limits
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {FREE_TRIAL_LIMITS.durationDays} days, {FREE_TRIAL_LIMITS.businesses} business,{" "}
          {FREE_TRIAL_LIMITS.scenarios} scenarios, {FREE_TRIAL_LIMITS.reports}. Buyer teaser is{" "}
          {FREE_TRIAL_LIMITS.buyerTeaser}.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          Get started <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </PublicPageShell>
  );
}
