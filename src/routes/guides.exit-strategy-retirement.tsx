import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

export const Route = createFileRoute("/guides/exit-strategy-retirement")({
  head: () => ({
    meta: [
      { title: "Business Exit Strategy for Retirement (Owners 55+) | ValuRight" },
      { name: "description", content: "Planning to retire from your small business? A practical exit strategy: timeline, value drivers, and a free planning range before you list or talk to a broker." },
      {
        property: "og:title",
        content: "Business Exit Strategy for Retirement (Owners 55+) | ValuRight",
      },
      { property: "og:description", content: "Planning to retire from your small business? A practical exit strategy: timeline, value drivers, and a free planning range before you list or talk to a broker." },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/guides/exit-strategy-retirement",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://valuright.ai/guides/exit-strategy-retirement",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"Article\", \"headline\": \"Business Exit Strategy for Retirement\", \"description\": \"Planning to retire from your small business? A practical exit strategy: timeline, value drivers, and a free planning range before you list or talk to a broker.\", \"author\": {\"@type\": \"Organization\", \"name\": \"ValuRight\"}, \"publisher\": {\"@type\": \"Organization\", \"name\": \"ValuRight\", \"logo\": {\"@type\": \"ImageObject\", \"url\": \"https://valuright.ai/favicon.svg\"}}, \"mainEntityOfPage\": \"https://valuright.ai/guides/exit-strategy-retirement\", \"datePublished\": \"2026-09-15\", \"dateModified\": \"2026-09-15\"}",
      },
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Home\", \"item\": \"https://valuright.ai/\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"Guides\", \"item\": \"https://valuright.ai/guides\"}, {\"@type\": \"ListItem\", \"position\": 3, \"name\": \"Exit strategy for retirement\", \"item\": \"https://valuright.ai/guides/exit-strategy-retirement\"}]}",
      },
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"When should I get a planning range if I want to retire in five years?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Now \u2014 or at least early enough that you have years, not months, to fix transferability and earnings quality. The range is a baseline you update as you improve the business.\"}}, {\"@type\": \"Question\", \"name\": \"Do I need a broker to have an exit strategy?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"No. A broker is one go-to-market path. Knowing your planning range, cleaning the financials, and reducing owner dependence matter regardless of who markets the company.\"}}, {\"@type\": \"Question\", \"name\": \"Is ValuRight a certified appraisal for estate or legal use?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"No. It is a software-generated planning estimate for owners preparing an exit conversation. Use qualified professionals for formal appraisals, tax, or legal needs.\"}}, {\"@type\": \"Question\", \"name\": \"What if my retirement number is higher than the planning range?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"That gap is useful information. You can work on value drivers, adjust timeline or lifestyle assumptions, or explore different transaction paths with advisors \u2014 with eyes open.\"}}]}",
      },
    ],
  }),
  component: ExitStrategyGuide,
});

function ExitStrategyGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="Business Exit Strategy for Retirement"
      description="If you are 55+ and the business still depends on you showing up, “retire someday” is not a plan — it is a hope. A practical exit strategy starts with a clear planning range, an honest look at what buyers will pay for, and enough runway to fix the risks that discount the price."
      updated="September 15, 2026"
    >
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Peer-to-peer, no fake statistics: most owner-operators underestimate how long transferability
        takes. The goal of this page is a sober sequence you can act on — then review with your CPA,
        attorney, and (when ready) a broker or advisor.
      </p>

      <LegalSection title="Start with a planning range">
        <p>
          Before you list, promise a number to a spouse, or compare offers in your head, get a{" "}
          <strong>planning range</strong> grounded in earnings and risk — not a napkin multiple alone.
          ValuRight’s Free Preview gives a multi-method planning estimate and a Health Score that
          surfaces issues (including owner dependence) that often hold the number down.
        </p>
        <p>
          Use the range to answer: Is the business even in the zip code of the retirement number I
          need? If not, you either need time to improve transferability and earnings quality — or a
          different retirement math.
        </p>
        <p>
          Fine print stays the same: planning estimate, not a certified appraisal, not a guaranteed
          sale price. Start here:{" "}
          <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
            What is my business worth?
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Timeline: 3–5 years vs 12 months">
        <p>
          <strong>3–5 years (preferred for many owner-operators):</strong> Time to document the
          playbook, promote or hire ops leadership, introduce a second face on key accounts, clean
          financials, and test real time away from the business. Multiples and buyer confidence
          usually follow transferability.
        </p>
        <p>
          <strong>About 12 months:</strong> Possible if books are clean, dependence is already low,
          and you accept a narrower buyer pool or a longer post-sale transition. A last-minute
          scramble rarely fools diligence.
        </p>
        <p>
          <strong>Under 12 months with high owner dependence:</strong> Expect price pressure,
          earnouts, or a longer seller stay. See{" "}
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            owner dependence
          </Link>
          .
        </p>
        <p>Pick the timeline that matches your life — then work backward to the value-driver list.</p>
      </LegalSection>

      <LegalSection title="What buyers pay for">
        <p>
          Buyers pay for <strong>transferable cash flow and lower risk</strong>, not for how hard you
          worked. Patterns that support a stronger planning range:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Earnings quality and honest add-backs (
            <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
              SDE explained
            </Link>
            )
          </li>
          <li>Recurring or repeatable revenue where it fits your model</li>
          <li>Clean, consistent financials</li>
          <li>Operations and customer relationships that survive without you</li>
          <li>A documented playbook someone else can follow</li>
        </ul>
        <p>
          Patterns that invite a discount: you are the rainmaker, pricing lives in your head, key
          accounts only call you, and a two-week offline vacation would break the place.
        </p>
      </LegalSection>

      <LegalSection title="Owner dependence and succession">
        <p>
          Succession is not only “who gets the keys.” For a third-party sale, succession means the
          business can operate while you step back. For a family or key-employee path, it means a
          trained successor and a written transition — still with clean numbers.
        </p>
        <p>
          ValuRight’s Health Score is built to flag owner-risk style issues early so you can
          prioritize what to fix before you go to market.
        </p>
      </LegalSection>

      <LegalSection title="Advisors you’ll need">
        <p>You do not need everyone on day one. As you get serious:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>CPA</strong> — quality of earnings, tax structure of a sale, add-back hygiene
          </li>
          <li>
            <strong>Business attorney</strong> — LOI, purchase agreement, reps and warranties
          </li>
          <li>
            <strong>Broker or M&amp;A advisor</strong> (optional path) — go-to-market, when you choose
            that route
          </li>
          <li>
            <strong>Financial planner</strong> — how sale proceeds fund retirement
          </li>
        </ul>
        <p>
          ValuRight does not replace those people. It helps you walk in with a planning range and a
          clearer punch list.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ">
      <div>
        <p className="font-semibold text-foreground">When should I get a planning range if I want to retire in five years?</p>
        <p className="mt-1">Now — or at least early enough that you have years, not months, to fix transferability and earnings quality. The range is a baseline you update as you improve the business.</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">Do I need a broker to have an exit strategy?</p>
        <p className="mt-1">No. A broker is one go-to-market path. Knowing your planning range, cleaning the financials, and reducing owner dependence matter regardless of who markets the company.</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">Is ValuRight a certified appraisal for estate or legal use?</p>
        <p className="mt-1">No. It is a software-generated planning estimate for owners preparing an exit conversation. Use qualified professionals for formal appraisals, tax, or legal needs.</p>
      </div>
      <div>
        <p className="font-semibold text-foreground">What if my retirement number is higher than the planning range?</p>
        <p className="mt-1">That gap is useful information. You can work on value drivers, adjust timeline or lifestyle assumptions, or explore different transaction paths with advisors — with eyes open.</p>
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
            See a sample
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link to="/guides/how-to-sell-my-business" className="font-semibold text-accent hover:underline">
            How to sell my business
          </Link>
          <Link to="/guides/how-to-value-a-small-business" className="font-semibold text-accent hover:underline">
            How to value a small business
          </Link>
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
          </Link>
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
