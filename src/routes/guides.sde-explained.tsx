import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

export const Route = createFileRoute("/guides/sde-explained")({
  head: () => ({
    meta: [
      { title: "What Is SDE? Seller’s Discretionary Earnings Explained | ValuRight" },
      {
        name: "description",
        content: "SDE is how Main Street buyers price owner-operated businesses. See what\u2019s in SDE, common add-backs, and how it differs from EBITDA.",
      },
      {
        property: "og:title",
        content: "What Is SDE? Seller’s Discretionary Earnings Explained | ValuRight",
      },
      {
        property: "og:description",
        content: "SDE is how Main Street buyers price owner-operated businesses. See what\u2019s in SDE, common add-backs, and how it differs from EBITDA.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://valuright.ai/guides/sde-explained" },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/guides/sde-explained" }],
    scripts: [
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"What Is SDE (Seller\u2019s Discretionary Earnings)?\", \"description\": \"SDE is how Main Street buyers price owner-operated businesses. See what\u2019s in SDE, common add-backs, and how it differs from EBITDA.\", \"author\": {\"@type\": \"Organization\", \"name\": \"ValuRight\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"ValuRight\", \"logo\": {\"@type\": \"ImageObject\", \"url\": \"https://valuright.ai/favicon.svg\"}}, \"mainEntityOfPage\": \"https://valuright.ai/guides/sde-explained\", \"datePublished\": \"2026-09-15\", \"dateModified\": \"2026-09-15\"}",
      },
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Home\", \"item\": \"https://valuright.ai/\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Guides\", \"item\": \"https://valuright.ai/guides\"}, {\"@type\": \"ListItem\", \"position\": 3, \"name\": \"What Is SDE?\", \"item\": \"https://valuright.ai/guides/sde-explained\"}]}",
      },
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Is SDE the same as profit?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Not usually. SDE starts from profit-like figures, then adds back items such as one owner\u2019s compensation and certain documented discretionary or non-recurring expenses so the result reflects total benefit to one full-time owner-operator.\"}}, {\"@type\": \"Question\", \"name\": \"Can I use SDE if I have partners?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Buyers typically normalize to one full-time owner-operator equivalent. Multiple working owners need a clear story for what compensation stays in the business after a sale. When in doubt, review the build with your CPA.\"}}, {\"@type\": \"Question\", \"name\": \"Why do buyers challenge add-backs?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Because inflated SDE raises the asking price without raising transferable earnings. Documented, non-recurring, and clearly personal items hold up better than vague discretionary buckets.\"}}, {\"@type\": \"Question\", \"name\": \"Does ValuRight replace my CPA or broker?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"No. Free Preview is a planning estimate to help you understand range and value drivers before you talk to advisors. It is not a certified appraisal.\"}}]}",
      },
    ],
  }),
  component: SdeExplainedGuide,
});

function SdeExplainedGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="What Is SDE (Seller’s Discretionary Earnings)?"
      description="Owners ask for “the number.” Main Street buyers usually start with a different question: what does one full-time owner-operator take home from this business in a normal year? That figure is Seller’s Discretionary Earnings — SDE. Get SDE wrong and every multiple that follows is wrong too."
      updated="September 15, 2026"
    >
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        This guide is homework for owners 55+ planning the next chapter. It is not a certified
        appraisal and not a guaranteed sale price.
      </p>

      <LegalSection title="What SDE means">
        <p>
          SDE is the total financial benefit available to a single full-time owner-operator. It is
          built for businesses where the owner still works in the company — sales, ops,
          relationships, or all three. Buyers use it to compare apples to apples across
          owner-operated shops, service firms, and similar Main Street assets.
        </p>
        <p>
          If a professional management team already runs the company without you, buyers often lean
          more on EBITDA. Many ValuRight users see <strong>both</strong> in context; SDE is usually
          the starting point for owner-operated Main Street businesses.
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
          Exact accounting lines vary by bookkeeping style. The discipline that matters: 
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
          context: 
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
          diligence. See 
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            owner dependence
          </Link> 
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
        <p className="mt-1">Not usually. SDE starts from profit-like figures, then adds back items such as one owner’s compensation and certain documented discretionary or non-recurring expenses so the result reflects total benefit to one full-time owner-operator.</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">Can I use SDE if I have partners?</p>
        <p className="mt-1">Buyers typically normalize to one full-time owner-operator equivalent. Multiple working owners need a clear story for what compensation stays in the business after a sale. When in doubt, review the build with your CPA.</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">Why do buyers challenge add-backs?</p>
        <p className="mt-1">Because inflated SDE raises the asking price without raising transferable earnings. Documented, non-recurring, and clearly personal items hold up better than vague discretionary buckets.</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">Does ValuRight replace my CPA or broker?</p>
        <p className="mt-1">No. Free Preview is a planning estimate to help you understand range and value drivers before you talk to advisors. It is not a certified appraisal.</p>
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
          <Link to="/guides/how-to-value-a-small-business" className="font-semibold text-accent hover:underline">
            How to value a small business
          </Link>
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
          </Link>
          <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
            What is my business worth?
          </Link>
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
