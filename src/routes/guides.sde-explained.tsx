import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is SDE (Seller’s Discretionary Earnings)?",
  description:
    "Seller’s Discretionary Earnings (SDE) is the total financial benefit a single full-time owner-operator can take from a Main Street business in a normal year. See the formula, an illustrative example, and how it differs from EBITDA.",
  author: { "@type": "Organization", name: "ValuRight" },
  publisher: {
    "@type": "Organization",
    name: "ValuRight",
    logo: { "@type": "ImageObject", url: "https://valuright.ai/favicon.svg" },
  },
  mainEntityOfPage: "https://valuright.ai/guides/sde-explained",
  datePublished: "2026-09-15",
  dateModified: "2026-09-17",
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

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is SDE the same as profit?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not usually. SDE starts from profit-like figures, then adds back items such as one owner’s compensation and certain documented discretionary or non-recurring expenses so the result reflects total benefit to one full-time owner-operator.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use SDE if I have partners?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Buyers typically normalize to one full-time owner-operator equivalent. Multiple working owners need a clear story for what compensation stays in the business after a sale. When in doubt, review the build with your CPA.",
      },
    },
    {
      "@type": "Question",
      name: "Why do buyers challenge add-backs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Because inflated SDE raises the asking price without raising transferable earnings. Documented, non-recurring, and clearly personal items hold up better than vague discretionary buckets.",
      },
    },
    {
      "@type": "Question",
      name: "Does ValuRight replace my CPA or broker?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Free Preview is a planning estimate to help you understand range and value drivers before you talk to advisors. It is not a certified appraisal.",
      },
    },
    {
      "@type": "Question",
      name: "How do I calculate SDE from a tax return or P&L?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Start from reported profit or taxable business income for a normal year, then add back one full-time owner’s compensation, documented personal perks a buyer would not keep, interest/taxes/D&A when they sit below the earnings base, and documented non-recurring costs. Exact lines vary — every add-back should be explainable. When unsure, build it with your CPA.",
      },
    },
    {
      "@type": "Question",
      name: "What is the SDE formula in plain English?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SDE is roughly: profit + one owner’s pay + documented add-backs a buyer would accept, so the figure shows the total benefit available to a single full-time owner-operator in a normal year.",
      },
    },
    {
      "@type": "Question",
      name: "When should I use EBITDA instead of SDE?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When a professional management team can already run the company without a working owner-operator. Then buyers often treat market-rate manager pay as an operating cost and lean on EBITDA. Many owner-operated Main Street businesses still start with SDE; ValuRight shows both in context.",
      },
    },
    {
      "@type": "Question",
      name: "If my SDE is higher, is my sale price higher?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not automatically. Price also depends on risk, transferability, growth, industry, and deal structure. A higher SDE with high owner dependence can still face multiple compression or tougher terms. Use a multi-method planning range — not SDE alone — and review with advisors before you set an asking price.",
      },
    },
  ],
};

export const Route = createFileRoute("/guides/sde-explained")({
  head: () => ({
    meta: [
      { title: "What Is SDE? Seller’s Discretionary Earnings Explained | ValuRight" },
      {
        name: "description",
        content:
          "SDE is the total benefit one full-time owner-operator can take from a Main Street business in a normal year. See the formula, an illustrative example, and how it differs from EBITDA.",
      },
      {
        property: "og:title",
        content: "What Is SDE? Seller’s Discretionary Earnings Explained | ValuRight",
      },
      {
        property: "og:description",
        content:
          "SDE is the total benefit one full-time owner-operator can take from a Main Street business in a normal year. See the formula, an illustrative example, and how it differs from EBITDA.",
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
      eyebrow="Planning homework for owners 55+ — not a certified appraisal."
      title="What Is SDE (Seller’s Discretionary Earnings)?"
      description="Seller’s Discretionary Earnings (SDE) is the total financial benefit a single full-time owner-operator can take from a Main Street business in a normal year — roughly profit plus one owner’s pay and documented add-backs a buyer would accept. Get SDE wrong and every multiple that follows is wrong too."
      updated="September 17, 2026"
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
          <strong>2×–4× SDE</strong> before method mix and risk adjustments. On this illustrative SDE
          alone, that shorthand sketches about <strong>$480,000–$960,000</strong> —{" "}
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
            Documented one-time or non-recurring expenses that would not continue under new ownership
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

      <LegalSection title="SDE vs EBITDA">
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
          Using EBITDA alone on a highly owner-dependent shop can understate the benefit an
          owner-operator enjoys — or mis-set the multiple band. Using SDE on a true managed company
          can overstate transferable earnings. Match the base to how the business actually runs. More
          context:{" "}
          <Link
            to="/guides/how-to-value-a-small-business"
            className="font-semibold text-accent hover:underline"
          >
            How to value a small business
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="How multiples attach">
        <p>
          Buyers apply a market multiple to SDE (or EBITDA) to sketch a value range. Main Street
          owner-operated businesses often trade in a rough band around <strong>2×–4× SDE</strong>,
          with industry, size, growth, transferability, and risk moving the multiple. Recurring
          revenue, clean books, and operations that survive without you support the higher end. Owner
          dependence, customer concentration, and thin documentation pull it down.
        </p>
        <p>
          A multiple is not a promise. It is a market shorthand that still gets stress-tested in
          diligence. See{" "}
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            owner dependence
          </Link>{" "}
          for why the “job you own” discount shows up so often.
        </p>
      </LegalSection>

      <LegalSection title="How ValuRight uses SDE">
        <p>
          ValuRight’s Free Preview runs <strong>seven valuation methods</strong> (including SDE- and
          EBITDA-oriented views, plus other cross-checks such as cap rate / NOI where the business is
          income-property oriented). You get a <strong>planning range</strong>, a Health Score out of
          100, and prioritized recommendations — including risks that often compress the multiple.
        </p>
        <p>
          It remains a software-generated planning estimate for owners preparing an exit conversation
          — not Wall Street, not a certified appraisal.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ">
        <div>
          <p className="font-semibold text-foreground">Is SDE the same as profit?</p>
          <p className="mt-1">
            Not usually. SDE starts from profit-like figures, then adds back items such as one owner’s
            compensation and certain documented discretionary or non-recurring expenses so the result
            reflects total benefit to one full-time owner-operator.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Can I use SDE if I have partners?</p>
          <p className="mt-1">
            Buyers typically normalize to one full-time owner-operator equivalent. Multiple working
            owners need a clear story for what compensation stays in the business after a sale. When
            in doubt, review the build with your CPA.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Why do buyers challenge add-backs?</p>
          <p className="mt-1">
            Because inflated SDE raises the asking price without raising transferable earnings.
            Documented, non-recurring, and clearly personal items hold up better than vague
            discretionary buckets.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Does ValuRight replace my CPA or broker?</p>
          <p className="mt-1">
            No. Free Preview is a planning estimate to help you understand range and value drivers
            before you talk to advisors. It is not a certified appraisal.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            How do I calculate SDE from a tax return or P&amp;L?
          </p>
          <p className="mt-1">
            Start from reported profit or taxable business income for a normal year, then add back
            one full-time owner’s compensation, documented personal perks a buyer would not keep,
            interest/taxes/D&amp;A when they sit below the earnings base, and documented non-recurring
            costs. Exact lines vary — every add-back should be explainable. When unsure, build it with
            your CPA.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">What is the SDE formula in plain English?</p>
          <p className="mt-1">
            SDE is roughly: profit + one owner’s pay + documented add-backs a buyer would accept, so
            the figure shows the total benefit available to a single full-time owner-operator in a
            normal year.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">When should I use EBITDA instead of SDE?</p>
          <p className="mt-1">
            When a professional management team can already run the company without a working
            owner-operator. Then buyers often treat market-rate manager pay as an operating cost and
            lean on EBITDA. Many owner-operated Main Street businesses still start with SDE; ValuRight
            shows both in context.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            If my SDE is higher, is my sale price higher?
          </p>
          <p className="mt-1">
            Not automatically. Price also depends on risk, transferability, growth, industry, and deal
            structure. A higher SDE with high{" "}
            <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
              owner dependence
            </Link>{" "}
            can still face multiple compression or tougher terms. Use a multi-method planning range —
            not SDE alone — and review with advisors before you set an asking price.
          </p>
        </div>
      </LegalSection>

      <div className="mt-10 space-y-4 rounded-xl border border-border bg-card p-6">
        <p className="font-display text-xl font-semibold text-primary">Next steps</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
          >
            Start your free valuation <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
          >
            See a sample report
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
          <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
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
