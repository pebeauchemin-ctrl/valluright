import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

export const Route = createFileRoute("/guides/how-to-value-a-small-business")({
  head: () => ({
    meta: [
      { title: "How to Value a Small Business (Owner’s Guide) | ValuRight" },
      {
        name: "description",
        content:
          "Learn how Main Street buyers price a small business — SDE, multiples, and what moves the range. Then run a free ValuRight planning estimate.",
      },
      {
        property: "og:title",
        content: "How to Value a Small Business (Owner’s Guide) | ValuRight",
      },
      {
        property: "og:description",
        content:
          "Learn how Main Street buyers price a small business — SDE, multiples, and what moves the range. Then run a free ValuRight planning estimate.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/guides/how-to-value-a-small-business",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://valuright.ai/guides/how-to-value-a-small-business",
      },
    ],
  }),
  component: HowToValueGuide,
});

function HowToValueGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="How to Value a Small Business (Owner’s Guide)"
      description="Owners usually want one number: “What’s it worth?” Buyers almost never work that way. They think in a range, stress-test the earnings, and discount for risk. A planning estimate is homework — not a certified appraisal and not a guaranteed sale price."
      updated="September 9, 2026"
    >
      <LegalSection title="Pick the earnings base">
        <p>
          If you still run day-to-day sales and ops, buyers usually care about Seller’s Discretionary
          Earnings (SDE): the total annual benefit to one full-time owner-operator. If a management
          team can run the company without you, EBITDA becomes more relevant. Using the wrong base
          misprices the business.
        </p>
      </LegalSection>

      <LegalSection title="How SDE is typically built">
        <p>
          Start from profit, then add back one owner’s compensation and perks, interest, taxes,
          depreciation/amortization, and documented one-time or personal expenses that a new owner
          would not keep. Keep add-backs honest — buyers and lenders will ask for proof.
        </p>
      </LegalSection>

      <LegalSection title="Apply a market multiple">
        <p>
          Main Street owner-operated businesses often trade in a rough band around 2×–4× SDE, with
          industry, size, growth, and risk moving the multiple. Recurring revenue, clean books, and
          transferable operations support the higher end. Owner dependence, customer concentration,
          and thin documentation pull it down.
        </p>
      </LegalSection>

      <div className="my-8 rounded-xl border border-accent/20 bg-accent-soft/40 p-6 text-center">
        <p className="font-display text-lg font-semibold text-primary">
          Ready for a planning range built from multiple methods?
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Free Preview takes about 15 minutes — no credit card.
        </p>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
        >
          Start your free valuation <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <LegalSection title="Cross-check more than one method">
        <p>
          A single rule of thumb is fragile. ValuRight blends several methods — including SDE and
          EBITDA multiples, revenue sanity checks, simplified DCF, asset-based floor, comparable-sales
          context, and cap rate / NOI when the business is income-property oriented (for example RV
          parks and campgrounds) — into a planning range with confidence notes.
        </p>
      </LegalSection>

      <LegalSection title="What to do with the range">
        <p>
          Use it to decide whether you are ready to talk to a CPA or broker, which risks to fix
          first, and whether your retirement number and the business’s planning range are even in
          the same zip code. Then review assumptions with a qualified advisor before you set an
          asking price.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <div className="mt-10 space-y-4 rounded-xl border border-border bg-card p-6">
        <p className="font-display text-xl font-semibold text-primary">Next steps</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
          >
            Start Free Preview <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
          >
            See a sample report
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link
            to="/guides/owner-dependence"
            className="font-semibold text-accent hover:underline"
          >
            Related: Owner dependence
          </Link>
          <Link
            to="/what-is-my-business-worth"
            className="font-semibold text-accent hover:underline"
          >
            Related: What is my business worth?
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
