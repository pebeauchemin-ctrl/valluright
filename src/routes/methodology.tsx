import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "How ValuRight Values a Small Business | ValuRight" },
      {
        name: "description",
        content:
          "How ValuRight builds a planning range for Main Street businesses using seven valuation methods — not a certified appraisal. See inputs, methods, and limitations.",
      },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/methodology" }],
  }),
  component: MethodologyPage,
});

function MethodologyPage() {
  return (
    <PublicPageShell
      eyebrow="Methodology"
      title="How ValuRight values a small business"
      description="ValuRight builds a planning range for Main Street businesses using multiple methods — not a single rule of thumb. This page explains what goes into the estimate and where a CPA, broker, or appraiser still belongs. It is a software-generated planning estimate, not a certified appraisal."
      updated="September 15, 2026"
    >
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
        >
          Start your free valuation <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/guides/how-to-value-a-small-business"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
        >
          How to value a small business
        </Link>
      </div>
      <LegalSection title="What the estimate is and is not">
        <p>
          ValuRight.ai estimates a planning range for a small business or owner-operated company. It
          is intended to help owners understand value drivers, buyer risk, and exit-readiness gaps.
        </p>
        <p>
          The output is not a certified appraisal, fairness opinion, tax opinion, legal opinion,
          investment advice, financing commitment, or guaranteed sale price. A CPA, business broker,
          valuation professional, attorney, tax advisor, or lender should review the data and
          assumptions before anyone relies on the result.
        </p>
      </LegalSection>

      <LegalSection title="Inputs used">
        <p>
          The valuation engine uses the business profile, industry, business category, owner
          involvement, recurring revenue, customer concentration, documentation status, management
          depth, and historical financials.
        </p>
        <p>
          Financial inputs include revenue, cost of goods sold, gross profit, operating expenses,
          owner compensation, add-backs, depreciation, amortization, interest, income taxes, net
          income, assets, liabilities, and debt. Imported or manually entered data is only as
          reliable as the source records and mapping choices.
        </p>
      </LegalSection>

      <LegalSection title="Normalized earnings">
        <p>
          EBITDA is calculated as net income plus interest, income taxes, depreciation, and
          amortization when those bridge inputs are available. If no bridge inputs are provided, the
          app may use the entered EBITDA value for that year.
        </p>
        <p>
          SDE is calculated as EBITDA plus one working owner's compensation and buyer-acceptable
          one-time add-backs. Owner compensation is not included inside EBITDA, so it is not counted
          twice.
        </p>
      </LegalSection>

      <LegalSection title="Supported methods">
        <p>
          ValuRight uses seven methods (including SDE- and EBITDA-oriented views plus cap rate / NOI where the business is income-property oriented). Each method is shown with confidence notes; the headline range blends methods appropriate for the business category.
        </p>
        <p>
          SDE multiple: Seller's Discretionary Earnings multiplied by an industry range. This is
          commonly used for owner-operated small businesses where a buyer expects to replace or
          perform the owner's role.
        </p>
        <p>
          EBITDA multiple: EBITDA multiplied by an industry range. This is more relevant when a
          business is less dependent on the owner or can be run with hired management.
        </p>
        <p>
          Revenue multiple: latest annual revenue multiplied by an industry range. This is a
          low-confidence sanity check because it does not account for profitability.
        </p>
        <p>
          Simplified DCF: a five-year free cash flow projection using trailing revenue growth where
          available, a 20 percent discount rate, and a 2.5 percent terminal growth assumption.
          Limited or incomplete history lowers confidence.
        </p>
        <p>
          Asset-based floor: total assets minus total liabilities, shown with a low/high range
          around net assets. This is most useful as a floor for asset-heavy companies and does not
          capture goodwill or earnings power.
        </p>
        <p>
          Comparable sales: a directional comp-informed reference based on the available earnings
          methods, calibrated conservatively so it does not overstate value. It should be reviewed
          against current buyer activity before setting an asking price.
        </p>
        <p>
          Cap rate / income approach: stabilized NOI divided by a selected cap rate. This is used
          for income-producing real estate or property operating businesses such as RV parks and
          campgrounds.
        </p>
      </LegalSection>

      <LegalSection title="Low, median, and high ranges">
        <p>
          Each multiple-based method starts with an industry low, median, and high assumption. The
          app shifts the selected multiple within that band using risk and quality factors. The
          method's low and high outputs are then calculated from the adjusted method range.
        </p>
        <p>
          The dashboard range blends only the methods considered appropriate for the business
          category. Sanity checks and floors may be shown for context without driving the headline
          range.
        </p>
      </LegalSection>

      <LegalSection title="Risk and confidence adjustments">
        <p>
          Owner dependence can reduce multiples when the owner works many hours or controls sales,
          operations, and customer relationships. Lower owner dependence can increase confidence.
        </p>
        <p>
          Recurring revenue, diversified customers, complete operating procedures, and a strong
          management team can improve the multiple selection. Customer concentration, weak
          documentation, thin management depth, or messy books can reduce confidence and the
          selected multiple.
        </p>
        <p>
          Growth and margins affect methods differently. DCF uses trailing revenue growth when
          enough history exists. Earnings-based methods are sensitive to normalized EBITDA and SDE.
          Revenue multiples remain low-confidence if margins are weak or unknown.
        </p>
      </LegalSection>

      <LegalSection title="Data quality and limitations">
        <p>
          Three years of consistent financial history improves the usefulness of the estimate.
          Missing years, negative or unusual values, incomplete balance sheet data, unmapped
          accounts, cash-basis versus accrual-basis differences, and undocumented add-backs can
          materially change results.
        </p>
        <p>
          If owner compensation, add-backs, assets, liabilities, debt, interest, taxes,
          depreciation, or amortization are missing or mapped incorrectly, the valuation may
          overstate or understate business value.
        </p>
      </LegalSection>

      <LegalSection title="How to review an output">
        <p>
          Every dashboard method detail should show the formula, input used, multiple or cap-rate
          assumption, confidence level, and reasoning. The "Why this range?" section explains which
          methods contribute to the headline value range and which are shown only for context.
        </p>
        <p>
          Before using a result for sale planning, financing, tax planning, investor discussions, or
          buyer negotiations, export the assumptions and review them with a qualified valuation
          professional, CPA, broker, or attorney.
        </p>
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
            to="/guides/how-to-value-a-small-business"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
          >
            Owner&apos;s valuation guide
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
