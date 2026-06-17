import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { PublicPageShell } from "@/components/PublicPageShell";

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
  component: PricingPage,
});

const PLANS = [
  {
    name: "Essentials",
    price: "$99",
    sub: "/month",
    who: "Owner-operator",
    features: [
      "Ongoing value dashboard",
      "All six valuation methods",
      "Health Score and recommendations",
      "What-if scenarios",
    ],
  },
  {
    name: "Exit Ready",
    price: "$249",
    sub: "/month",
    who: "Preparing to sell",
    highlighted: true,
    features: [
      "Everything in Essentials",
      "Buyer-safe teaser page",
      "Data room",
      "PDF report exports",
    ],
  },
  {
    name: "Advisor Pro",
    price: "$349",
    sub: "/seat / month",
    who: "CPAs and brokers",
    features: [
      "Portfolio dashboard",
      "White-label reports",
      "Advisor review workflow",
      "Multiple client businesses",
    ],
  },
  {
    name: "One-time Report",
    price: "$799",
    sub: "one-time",
    who: "Just curious",
    features: [
      "Single valuation report",
      "Recommendations included",
      "PDF export",
      "No subscription",
    ],
  },
];

function PricingPage() {
  return (
    <PublicPageShell
      eyebrow="Pricing"
      title="Plans for every stage"
      description="The homepage pricing anchor now has a dedicated public URL for sharing, search, and QA."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {PLANS.map((plan) => (
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
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-6">
        <h2 className="font-display text-xl font-semibold text-primary">
          Start with the owner workflow
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Create an account, enter business details and financials, then review the estimated value
          range before deciding whether a paid plan fits.
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
