import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Owner Dependence: Why Buyers Discount Your Business",
  description:
    "Owner dependence means the business still needs the owner’s hours, relationships, or know-how to produce the earnings a buyer is paying for. Buyers discount, stretch the transition, or walk when that is true.",
  author: { "@type": "Organization", name: "ValuRight" },
  publisher: {
    "@type": "Organization",
    name: "ValuRight",
    logo: { "@type": "ImageObject", url: "https://valuright.ai/favicon.svg" },
  },
  mainEntityOfPage: "https://valuright.ai/guides/owner-dependence",
  datePublished: "2026-09-09",
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
      name: "Owner dependence",
      item: "https://valuright.ai/guides/owner-dependence",
    },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is owner dependence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Owner dependence means the business still needs the owner’s hours, relationships, or know-how to produce the earnings a buyer is paying for. If those leave when you leave, buyers treat the company as riskier.",
      },
    },
    {
      "@type": "Question",
      name: "Is owner dependence the same as key-person risk?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Closely related. Key-person risk is the broader idea that results hinge on one person. Owner dependence is the Main Street version owners feel day to day: you are still the job inside the asset. Buyers price both as transfer risk.",
      },
    },
    {
      "@type": "Question",
      name: "Does owner dependence always lower the price?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Not always as a fixed haircut — but it often compresses the multiple, lengthens the transition, or pushes earnout or holdback structure. Some buyers walk. Outcomes vary; there is no single typical discount percentage.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to fix owner dependence?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many owners plan on about 12–24 months of deliberate work: hire or promote ops coverage, document the playbook, put a second face on key accounts, and cut owner hours. That is planning guidance, not a guarantee.",
      },
    },
    {
      "@type": "Question",
      name: "Can I sell in 12 months if owner dependence is high?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sometimes — with a thinner buyer pool, longer seller stay, or more contingent proceeds. A last-minute scramble rarely fools diligence. If life requires a faster path, go in eyes open and get advisor help early.",
      },
    },
    {
      "@type": "Question",
      name: "Is ValuRight an appraisal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker, or appraiser. It is not a certified appraisal or a guaranteed sale price.",
      },
    },
  ],
};

export const Route = createFileRoute("/guides/owner-dependence")({
  head: () => ({
    meta: [
      { title: "Owner Dependence: Why Buyers Discount Your Business | ValuRight" },
      {
        name: "description",
        content:
          "Owner dependence means the business still needs your hours, relationships, or know-how. See how buyers react — and how to become transferable in 12–24 months.",
      },
      {
        property: "og:title",
        content: "Owner Dependence: Why Buyers Discount Your Business | ValuRight",
      },
      {
        property: "og:description",
        content:
          "Owner dependence means the business still needs your hours, relationships, or know-how. See how buyers react — and how to become transferable in 12–24 months.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/guides/owner-dependence",
      },
    ],
    links: [
      { rel: "canonical", href: "https://valuright.ai/guides/owner-dependence" },
    ],
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
  component: OwnerDependenceGuide,
});

function OwnerDependenceGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="Owner Dependence: Why Buyers Discount Your Business"
      description="Owner dependence means the business still needs the owner’s hours, relationships, or know-how to produce the earnings a buyer is paying for. Buyers discount the price, stretch the transition, or walk when that is true."
      updated="September 17, 2026"
    >
      <p className="mb-6 text-base leading-relaxed text-muted-foreground">
        If the honest answer to “What happens when you leave?” is that revenue, relationships, or
        know-how walk out with you, they treat the company as riskier — and they structure the deal
        accordingly.
      </p>

      <LegalSection title="Why it hits the price">
        <p>
          A business that is still a job you own is harder to transfer than a business that is an
          asset someone else can operate. In owner words, that risk usually shows up three ways:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Multiple compression</strong> — Buyers pay less for each dollar of earnings when
            those earnings look tied to you. Same profit, lower multiple, lower planning range.
          </li>
          <li>
            <strong>Longer transition</strong> — They may insist you stay longer after closing to
            hand off customers, vendors, and know-how. That is time and risk priced into the deal.
          </li>
          <li>
            <strong>Earnout or holdback</strong> — More of the purchase price may be contingent on
            results after you leave, or held back until transition milestones clear.
          </li>
        </ol>
        <p>
          None of these require a made-up “typical discount %.” Diligence is case-by-case. What
          matters for planning: high owner dependence thins the buyer pool and invites tougher terms.
        </p>
      </LegalSection>

      <LegalSection title="Self-check: is the business still a job you own?">
        <p>Answer yes or no. More yeses usually means higher owner dependence.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Are you the top salesperson (or the rainmaker buyers would miss first)?</li>
          <li>Do key customers ask specifically for you?</li>
          <li>Is there no clear #2 who can run day-to-day without you?</li>
          <li>
            Does the playbook — pricing, vendors, how work gets done — mostly live in your head?
          </li>
          <li>Are your owner hours high enough that the place slows when you step back?</li>
          <li>
            Would a two-week vacation with little phone access break sales or service? (
            <strong>Vacation test</strong>)
          </li>
          <li>
            Would a careful buyer say the earnings they are buying leave when you leave?
          </li>
        </ol>
        <p>
          If several answers are yes, treat transferability as a workstream — not a week-before-listing
          scramble.
        </p>
      </LegalSection>

      <LegalSection title="Transferable in 12–24 months (planning guidance, not a guarantee)">
        <p>
          Many owner-operators can materially reduce dependence with deliberate work over{" "}
          <strong>about 12–24 months</strong>. That timeline is planning guidance, not a promise that
          every business will be “buyer-ready” on a fixed date.
        </p>
        <p>Practical moves:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Hire or promote</strong> day-to-day ops coverage so decisions do not all route
            through you.
          </li>
          <li>
            <strong>Document the playbook</strong> — top recurring processes for sales,
            service/fulfillment, pricing, vendors, and monthly financial routines.
          </li>
          <li>
            <strong>Put a second face on key accounts</strong> well before a sale so relationships are
            not only yours.
          </li>
          <li>
            <strong>Deliberately cut owner hours</strong> and test real time away. If results fall
            apart, you found the risk early.
          </li>
        </ul>
        <p>
          Use ValuRight’s <strong>what-if</strong> on reducing owner hours to explore how the{" "}
          <strong>planning range</strong> may move as dependence falls. Any dollar movement you see in
          product is model output from <em>your</em> inputs — still an estimate, not an appraisal and
          not a promised sale-price lift.
        </p>
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-semibold text-foreground">
            Illustrative example — not your business, not a ValuRight result.
          </p>
          <p className="mt-2 text-muted-foreground">
            Suppose a planning range sits near $700K with high owner hours. A what-if that lowers
            owner hours and improves transferability might show a higher planning range in-product.
            That movement is scenario modeling for homework — not a guaranteed asking price or average
            lift.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="How ValuRight helps">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Health Score</strong> (out of 100) and recommendations flag
            owner-dependence-style risks early — alongside related issues such as thin documentation
            or management depth.
          </li>
          <li>
            <strong>What-if scenarios</strong> let you model changes such as reducing owner hours and
            see how they may affect the <strong>planning range</strong>.
          </li>
          <li>
            <strong>Free Preview</strong> ($0, no credit card): seven valuation methods, Health Score,
            recommendations, what-if, manual entry and CSV import. Start in about 15 minutes if
            financials are handy.
          </li>
        </ul>
        <p>
          ValuRight is a <strong>software-generated planning estimate</strong> for Main Street owners
          55+ preparing the next chapter — <strong>not</strong> a certified appraisal and{" "}
          <strong>not</strong> a guaranteed sale price. Review assumptions with your CPA, broker, or
          attorney before you set an asking price.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ">
        <div>
          <p className="font-semibold text-foreground">What is owner dependence?</p>
          <p className="mt-1">
            Owner dependence means the business still needs the owner’s hours, relationships, or
            know-how to produce the earnings a buyer is paying for. If those leave when you leave,
            buyers treat the company as riskier.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Is owner dependence the same as key-person risk?
          </p>
          <p className="mt-1">
            Closely related. Key-person risk is the broader idea that results hinge on one person.
            Owner dependence is the Main Street version owners feel day to day: you are still the job
            inside the asset. Buyers price both as transfer risk.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Does owner dependence always lower the price?
          </p>
          <p className="mt-1">
            Not always as a fixed haircut — but it often compresses the multiple, lengthens the
            transition, or pushes earnout/holdback structure. Some buyers walk. Outcomes vary; there
            is no single typical discount percentage.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">How long does it take to fix?</p>
          <p className="mt-1">
            Many owners plan on about <strong>12–24 months</strong> of deliberate work (hire/promote,
            document, second face on accounts, cut owner hours). That is planning guidance, not a
            guarantee. High dependence with a short runway usually means tougher deal terms.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Can I sell in 12 months if dependence is high?
          </p>
          <p className="mt-1">
            Sometimes — with a thinner buyer pool, longer seller stay, or more contingent proceeds. A
            last-minute scramble rarely fools diligence. If life requires a faster path, go in eyes
            open and get advisor help early.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Is ValuRight an appraisal?</p>
          <p className="mt-1">
            No. Free Preview is a software-generated planning estimate to help you understand a range
            and value drivers before you talk to a CPA, broker, or appraiser. It is not a certified
            appraisal or a guaranteed sale price.
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
          <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
            What is my business worth?
          </Link>
          <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
            What is SDE?
          </Link>
          <Link
            to="/guides/how-to-sell-my-business"
            className="font-semibold text-accent hover:underline"
          >
            How to sell my business
          </Link>
          <Link
            to="/guides/exit-strategy-retirement"
            className="font-semibold text-accent hover:underline"
          >
            Exit strategy for retirement
          </Link>
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
          <Link
            to="/guides/how-to-value-a-small-business"
            className="font-semibold text-accent hover:underline"
          >
            How to value a small business
          </Link>
          <Link to="/guides" className="font-semibold text-accent hover:underline">
            All guides
          </Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
