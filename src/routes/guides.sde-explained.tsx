import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { ORGANIZATION_REF } from "@/lib/site-entity";

const META_DESCRIPTION =
  "SDE is the total benefit one full-time owner-operator can take from a Main Street business in a normal year. Formula, SDE vs EBITDA, what moves a multiple.";

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is SDE (Seller’s Discretionary Earnings)?",
  description: META_DESCRIPTION,
  author: ORGANIZATION_REF,
  publisher: ORGANIZATION_REF,
  mainEntityOfPage: "https://valuright.ai/guides/sde-explained",
  datePublished: "2026-09-15",
  dateModified: "2026-11-06",
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://valuright.ai/" },
    { "@type": "ListItem", position: 2, name: "Guides", item: "https://valuright.ai/guides" },
    {
      "@type": "ListItem",
      position: 3,
      name: "What Is SDE?",
      item: "https://valuright.ai/guides/sde-explained",
    },
  ],
};

// Visible FAQ and FAQPage JSON-LD both render from this list (1:1, same order).
const SDE_FAQ: { question: string; answer: string }[] = [
  {
    question: "Is SDE the same as profit?",
    answer:
      "Not usually. SDE starts from profit-like figures, then adds back items such as one owner’s compensation and certain documented discretionary or non-recurring expenses so the result reflects total benefit to one full-time owner-operator.",
  },
  {
    question: "Can I use SDE if I have partners?",
    answer:
      "Buyers typically normalize to one full-time owner-operator equivalent. Multiple working owners need a clear story for what compensation stays in the business after a sale. When in doubt, review the build with your CPA.",
  },
  {
    question: "Why do buyers challenge add-backs?",
    answer:
      "Because inflated SDE raises the asking price without raising transferable earnings. Documented, non-recurring, and clearly personal items hold up better than vague discretionary buckets.",
  },
  {
    question: "Does ValuRight replace my CPA or broker?",
    answer:
      "No. Free Preview is a planning estimate to help you understand range and value drivers before you talk to advisors. It is not a certified appraisal.",
  },
  {
    question: "How do I calculate SDE from a tax return or P&L?",
    answer:
      "Start from reported profit or taxable business income for a normal year, then add back one full-time owner’s compensation, documented personal perks a buyer would not keep, interest/taxes/D&A when they sit below the earnings base, and documented non-recurring costs. Exact lines vary — every add-back should be explainable. When unsure, build it with your CPA.",
  },
  {
    question: "What is the SDE formula in plain English?",
    answer:
      "SDE is roughly: profit + one owner’s pay + documented add-backs a buyer would accept, so the figure shows the total benefit available to a single full-time owner-operator in a normal year.",
  },
  {
    question: "When should I use EBITDA instead of SDE?",
    answer:
      "When a professional management team can already run the company without a working owner-operator. Then buyers often treat market-rate manager pay as an operating cost and lean on EBITDA. Many owner-operated Main Street businesses still start with SDE; ValuRight shows both in context.",
  },
  {
    question: "If my SDE is higher, is my sale price higher?",
    answer:
      "Not automatically. Price also depends on risk, transferability, growth, industry, and deal structure. A higher SDE with high owner dependence can still face multiple compression or tougher terms. Use a multi-method planning range — not SDE alone — and review with advisors before you set an asking price.",
  },
  {
    question: "What’s the difference between SDE and EBITDA?",
    answer:
      "SDE measures the total benefit one full-time owner-operator can take from the business in a normal year. EBITDA measures earnings before interest, taxes, depreciation and amortization for a company viewed as a managed operation. They answer different buyer questions, so the right base depends on whether a working owner is still part of what is being sold.",
  },
  {
    question: "Which do Main Street buyers use — SDE or EBITDA?",
    answer:
      "Most buyers of owner-operated Main Street businesses start with SDE, because they expect to step into the seller’s role. Buyers lean on EBITDA when hired managers already run the company and owner pay is treated more like an operating cost. If you are unsure which lens fits, build both and compare them with your CPA or broker.",
  },
  {
    question: "What moves an SDE multiple up or down?",
    answer:
      "The multiple moves with risk and transferability, not with SDE alone. Recurring revenue, diversified customers, clean books, transferable operations and credible growth usually support a stronger multiple; owner dependence, customer concentration, soft add-backs and industry or CapEx risk usually compress it. We do not publish industry multiple tables — get current market figures from a broker or appraiser who works your niche.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: SDE_FAQ.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export const Route = createFileRoute("/guides/sde-explained")({
  head: () => ({
    meta: [
      { title: "What Is SDE? Seller’s Discretionary Earnings Explained | ValuRight" },
      {
        name: "description",
        content: META_DESCRIPTION,
      },
      {
        property: "og:title",
        content: "What Is SDE? Seller’s Discretionary Earnings Explained | ValuRight",
      },
      {
        property: "og:description",
        content: META_DESCRIPTION,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://valuright.ai/guides/sde-explained" },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/guides/sde-explained" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(articleLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbLd),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(faqLd),
      },
    ],
  }),
  component: SdeExplainedGuide,
});

function SdeExplainedGuide() {
  return (
    <PublicPageShell
      heroCta
      seoFooter
      relatedLinksFor="/guides/sde-explained"
      eyebrow="Planning homework for owners 55+ — not a certified appraisal."
      title="What Is SDE (Seller’s Discretionary Earnings)?"
      description="Seller’s Discretionary Earnings (SDE) is the total financial benefit a single full-time owner-operator can take from a Main Street business in a normal year — roughly profit plus one owner’s pay and documented add-backs a buyer would accept. Get SDE wrong and every multiple that follows is wrong too."
      updated="November 6, 2026"
    >
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        This guide is homework for owners 55+ planning the next chapter. It is not a certified
        appraisal and not a guaranteed sale price.
      </p>

      <LegalSection title="What SDE means">
        <p>
          SDE is built for businesses where the owner still works in the company — sales, ops,
          relationships, or all three. Buyers use it to compare apples to apples across
          owner-operated shops, service firms, and similar Main Street assets.
        </p>
        <p>
          If a professional management team already runs the company without you, buyers often lean
          more on EBITDA. Many ValuRight users see <strong>both</strong> in context; SDE is usually
          the starting point for owner-operated Main Street businesses.
        </p>
      </LegalSection>

      <LegalSection title="SDE formula (plain English)">
        <pre className="overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap font-mono">
          {`SDE ≈ reported profit (or taxable business income)
    + one full-time owner’s compensation (salary, draw, or equivalent)
    + documented owner perks a buyer would not keep as personal expenses
    + interest, taxes, and depreciation / amortization when they sit below the earnings base
    + documented non-recurring / one-time costs that would not continue under new ownership`}
        </pre>
        <p>
          Exact accounting lines vary by bookkeeping style. The discipline that matters:{" "}
          <strong>every add-back should be explainable</strong> to a careful buyer or lender.
        </p>
      </LegalSection>

      <LegalSection title="Illustrative example — not your business, not a ValuRight result">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-semibold text-foreground">Line</th>
                <th className="py-2 font-semibold text-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3">Net income</td>
                <td className="py-2">$120,000</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3">+ Owner W-2 / draw (one full-time owner)</td>
                <td className="py-2">$90,000</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3">
                  + Personal auto / health (documented perks a buyer would not keep)
                </td>
                <td className="py-2">$18,000</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3">+ One-time flood repair (documented non-recurring)</td>
                <td className="py-2">$12,000</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-semibold text-foreground">Illustrative SDE</td>
                <td className="py-2 font-semibold text-foreground">$240,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Main Street owner-operated businesses often use a rough planning shorthand around{" "}
          <strong>2×–4× SDE</strong> before method mix and risk adjustments. On this illustrative
          SDE alone, that shorthand sketches about <strong>$480,000–$960,000</strong> —{" "}
          <strong>
            not an asking price, not an average of other owners, and not a ValuRight result.
          </strong>
        </p>
        <p>
          ValuRight Free Preview does <strong>not</strong> stop at one napkin multiple. It builds a{" "}
          <strong>multi-method planning range</strong>, a <strong>Health Score</strong>, and
          recommendations — including risks (such as{" "}
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            owner dependence
          </Link>
          ) that often compress the multiple.
        </p>
      </LegalSection>

      <LegalSection title="What’s usually included">
        <p>
          A typical SDE build starts from reported profit (or owner’s taxable business income), then
          adjusts toward the benefit a new full-time owner could expect. Common components include:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>One owner’s compensation (salary, draws, or equivalent)</li>
          <li>
            Owner benefits and perks that a new owner would not keep as personal expenses
            (documented)
          </li>
          <li>
            Interest, taxes, and depreciation / amortization when they sit below the earnings line
            used for the base
          </li>
          <li>
            Documented one-time or non-recurring expenses that would not continue under new
            ownership
          </li>
        </ul>
        <p>
          Exact accounting lines vary by bookkeeping style. The discipline that matters:{" "}
          <strong>every add-back should be explainable to a careful buyer or lender.</strong>
        </p>
      </LegalSection>

      <LegalSection title="Honest add-backs">
        <p>
          Buyers and lenders poke at add-backs. Inflating SDE with vague “owner discretionary” items
          is a fast way to lose trust in diligence.
        </p>
        <p>
          Honest add-backs are specific, documented, and unlikely to continue. Soft add-backs —
          unexplained personal spend, “one-time” costs that appear every year, or stacking multiple
          owners’ full compensation when the business needs two operators — get challenged.
        </p>
        <p>
          Rule of thumb for planning: if you would be uncomfortable defending the line item to a
          skeptical CPA, leave it out of the planning SDE or flag it as uncertain.
        </p>
      </LegalSection>

      <LegalSection title="SDE vs EBITDA: which one buyers use">
        <p>
          Buyers of owner-operated Main Street businesses usually start with Seller’s Discretionary
          Earnings (SDE). Buyers of businesses that already run with hired management usually lean
          on EBITDA. The right lens depends on how the company actually runs — not on which acronym
          sounds more sophisticated.
        </p>
        <p>
          SDE is the total financial benefit to one working owner-operator in a normal year. EBITDA
          is earnings before interest, taxes, depreciation, and amortization for a company viewed as
          able to run without the seller in the operator seat. They answer different questions, so
          swapping them casually mis-sets every later conversation about price and risk.
        </p>
        <p>
          Buyers look at SDE when the seller still works sales, ops, or relationships, and the buyer
          expects to step into that role. In that case, one full-time owner’s compensation is part
          of the benefit being purchased, and add-backs that a careful buyer would accept belong in
          the base.
        </p>
        <p>
          Buyers look at EBITDA when professional managers already run day-to-day and market-rate
          manager pay stays in as an operating cost. The asset transfers more like a managed
          company, so the earnings base should reflect that.
        </p>
        <p>
          The common mismatch cuts both ways. Using EBITDA alone on a highly owner-dependent shop
          can understate the benefit an owner-operator enjoys — or put the wrong lens on the deal.
          Using SDE on a true managed company can overstate transferable earnings. Match the base to
          how the business actually runs.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 pr-3 font-semibold text-foreground" />
                <th className="py-2 pr-3 font-semibold text-foreground">SDE</th>
                <th className="py-2 font-semibold text-foreground">EBITDA</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium text-foreground">Best fit</td>
                <td className="py-2 pr-3">Owner-operated Main Street</td>
                <td className="py-2">Businesses that can run with hired management</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-3 font-medium text-foreground">Owner pay</td>
                <td className="py-2 pr-3">Usually added back (one full-time owner)</td>
                <td className="py-2">
                  Owner/manager market pay often stays in as an operating cost
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-medium text-foreground">What it answers</td>
                <td className="py-2 pr-3">Benefit to a working owner-operator</td>
                <td className="py-2">
                  Earnings before financing, tax, and non-cash D&amp;A for a managed company
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          ValuRight Free Preview shows both SDE- and EBITDA-oriented views in context. For most
          owner-operated Main Street businesses, SDE is still the starting point. See{" "}
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            how ValuRight values a business
          </Link>{" "}
          and get a{" "}
          <Link
            to="/what-is-my-business-worth"
            className="font-semibold text-accent hover:underline"
          >
            free planning range
          </Link>{" "}
          before you treat either figure as an asking price. This remains a software-generated
          planning estimate — not a certified appraisal. More context:{" "}
          <Link
            to="/guides/how-to-value-a-small-business"
            className="font-semibold text-accent hover:underline"
          >
            How to value a small business
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="SDE multiple by industry: what moves it">
        <p>
          An SDE multiple is a market shorthand buyers apply to Seller’s Discretionary Earnings. It
          moves with risk, transferability, growth, and industry norms — not with a single published
          table.
        </p>
        <p>
          ValuRight does <strong>not</strong> publish industry multiple tables on this page. Current
          market figures belong with a broker or appraiser who works your niche. Free Preview uses
          industry assumptions inside its methods; it does not publish comps tables here.
        </p>
        <p>
          Drivers that usually support a stronger multiple (direction only — no bands, no tables):
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Recurring or contracted revenue</li>
          <li>Operations that transfer without the seller in the seat</li>
          <li>Diversified customers (not one account or one channel)</li>
          <li>Documented, credible growth</li>
          <li>Clean, explainable books and honest add-backs</li>
          <li>Lower industry or regulatory risk for the buyer’s model</li>
        </ul>
        <p>Drivers that usually compress a multiple:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>High owner hours / key-person risk</li>
          <li>Customer or channel concentration</li>
          <li>Thin documentation or soft add-backs</li>
          <li>Flat or declining trajectory</li>
          <li>Heavy CapEx needs or industry cyclicality</li>
          <li>Deal-structure risk a buyer cannot underwrite</li>
        </ul>
        <p>
          Different industries weight those drivers differently — a service firm with recurring
          contracts is not the same homework as a project business, and a practice with client
          retention is not the same as an asset-heavy operation. For industry-shaped planning
          language (still with no published multiples on those pages either), see:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link
              to="/what-is-my-hvac-business-worth"
              className="font-semibold text-accent hover:underline"
            >
              What is my HVAC business worth?
            </Link>
          </li>
          <li>
            <Link
              to="/what-is-my-rv-park-worth"
              className="font-semibold text-accent hover:underline"
            >
              What is my RV park or campground worth?
            </Link>
          </li>
          <li>
            <Link
              to="/what-is-my-dental-practice-worth"
              className="font-semibold text-accent hover:underline"
            >
              What is my dental practice worth?
            </Link>
          </li>
          <li>
            <Link
              to="/what-is-my-plumbing-business-worth"
              className="font-semibold text-accent hover:underline"
            >
              What is my plumbing business worth?
            </Link>
          </li>
          <li>
            <Link
              to="/what-is-my-landscaping-business-worth"
              className="font-semibold text-accent hover:underline"
            >
              What is my landscaping &amp; lawn care business worth?
            </Link>
          </li>
          <li>
            plus{" "}
            <Link
              to="/what-is-my-business-worth"
              className="font-semibold text-accent hover:underline"
            >
              What is my business worth?
            </Link>
            ,{" "}
            <Link to="/methodology" className="font-semibold text-accent hover:underline">
              Methodology
            </Link>
            , and{" "}
            <Link
              to="/guides/owner-dependence"
              className="font-semibold text-accent hover:underline"
            >
              Owner dependence
            </Link>
          </li>
        </ul>
        <p>
          A higher SDE does not automatically mean a higher sale price if risk is high. Use a
          multi-method planning range, then review with advisors before you set an asking price.
        </p>
      </LegalSection>

      <LegalSection title="How ValuRight uses SDE">
        <p>
          ValuRight’s Free Preview runs <strong>seven valuation methods</strong> (including SDE- and
          EBITDA-oriented views, plus other cross-checks such as cap rate / NOI where the business
          is income-property oriented). You get a <strong>planning range</strong>, a Health Score
          out of 100, and prioritized recommendations — including risks that often compress the
          multiple.
        </p>
        <p>
          It remains a software-generated planning estimate for owners preparing an exit
          conversation — not Wall Street, not a certified appraisal.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ">
        {SDE_FAQ.map(({ question, answer }) => (
          <div key={question}>
            <p className="font-semibold text-foreground">{question}</p>
            <p className="mt-1">{answer}</p>
          </div>
        ))}
      </LegalSection>

      <div className="mt-10 space-y-4 rounded-xl border border-border bg-card p-6">
        <p className="font-display text-xl font-semibold text-primary">Next steps</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            onClick={trackSignupStart}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
          >
            Start your free valuation <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/demo"
            onClick={trackDemoClick}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
          >
            See a sample
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
          <Link
            to="/what-is-my-business-worth"
            className="font-semibold text-accent hover:underline"
          >
            What is my business worth?
          </Link>
          <Link
            to="/guides/how-to-value-a-small-business"
            className="font-semibold text-accent hover:underline"
          >
            How to value a small business
          </Link>
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
