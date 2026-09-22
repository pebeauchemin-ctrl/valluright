import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Exit readiness and the Health Score",
  description:
    "How to know if your Main Street business is ready to sell — what ValuRight’s Health Score measures, why buyers care, and how to improve before you list.",
  author: { "@type": "Organization", name: "ValuRight" },
  publisher: {
    "@type": "Organization",
    name: "ValuRight",
    logo: { "@type": "ImageObject", url: "https://valuright.ai/favicon.svg" },
  },
  mainEntityOfPage: "https://valuright.ai/guides/exit-readiness",
  datePublished: "2026-09-21",
  dateModified: "2026-09-21",
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
      name: "Exit readiness and the Health Score",
      item: "https://valuright.ai/guides/exit-readiness",
    },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a Health Score in ValuRight?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Health Score is a 0–100 software view of exit-readiness signals for your business — things buyers care about such as owner dependence, documentation, concentration, management depth, and recurring or repeatable revenue where it fits. It comes with prioritized recommendations. It is not a credit score, not a certified appraisal, and not a promise of sale price.",
      },
    },
    {
      "@type": "Question",
      name: "Is exit readiness the same as a sellability score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "People use different labels. ValuRight frames it as exit readiness and a Health Score: can a buyer take over without the earnings leaving with you, and what should you fix first? The score is tied to owner-facing risks and a planning range — not a vague marketing number.",
      },
    },
    {
      "@type": "Question",
      name: "Does a higher Health Score guarantee a higher sale price?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. A stronger readiness profile often supports a clearer buyer conversation and may improve how risk shows up in diligence — but sale price depends on earnings, market, deal structure, and negotiation. Health Score and what-if are homework, not a guarantee.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from an appraisal?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An appraisal (when you need one) is a formal opinion under professional standards. Free Preview is a software planning estimate: range, Health Score, recommendations, and what-if so you prepare before advisor or buyer meetings. Review assumptions with your CPA, broker, or appraiser when a formal opinion is required.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to improve exit readiness?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many owners plan on about 12–24 months of deliberate work. That is planning guidance, not a guarantee. A short runway with high dependence usually means tougher terms.",
      },
    },
    {
      "@type": "Question",
      name: "What should I do first if my Health Score is low?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Start with the in-app recommendations. In practice, owners often tackle owner dependence and documentation first, then concentration and financial cleanup. Run Free Preview again as inputs improve, and use what-if to explore scenarios.",
      },
    },
  ],
};

export const Route = createFileRoute("/guides/exit-readiness")({
  head: () => ({
    meta: [
      { title: "Exit Readiness & Health Score Explained | ValuRight" },
      {
        name: "description",
        content:
          "How to know if your Main Street business is ready to sell — what ValuRight’s Health Score measures, why buyers care, and how to improve before you list.",
      },
      {
        property: "og:title",
        content: "Exit Readiness & Health Score Explained | ValuRight",
      },
      {
        property: "og:description",
        content:
          "How to know if your Main Street business is ready to sell — what ValuRight’s Health Score measures, why buyers care, and how to improve before you list.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/guides/exit-readiness",
      },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/guides/exit-readiness" }],
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
  component: ExitReadinessGuide,
});

function ExitReadinessGuide() {
  return (
    <PublicPageShell
      eyebrow="Owner’s guide"
      title="Exit readiness and the Health Score"
      description="Exit readiness means a buyer can take over the business without the earnings, relationships, or know-how walking out with you. ValuRight’s Health Score (out of 100) is a software view of how ready your Main Street business looks for that transfer — and what may be holding your planning range down — not a certified appraisal or a guaranteed sale price."
      updated="September 21, 2026"
    >
      <p className="mb-6 text-base leading-relaxed text-muted-foreground">
        For owners 55+ planning the next chapter, readiness is homework: transferability,
        documentation, dependence, and concentration — fixed over months, not the week you list.
      </p>

      <LegalSection title="Why readiness moves price">
        <p>
          Buyers do not only buy last year’s profit. They buy{" "}
          <strong className="text-foreground">transferable</strong> earnings.
        </p>
        <p>When readiness is weak, diligence usually shows up as:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Tougher price or multiple</strong> — Same earnings look riskier if they depend on
            you, thin docs, or a few customers.
          </li>
          <li>
            <strong>Longer transition</strong> — They may insist you stay to hand off relationships and
            ops.
          </li>
          <li>
            <strong>More structure</strong> — Earnouts, holdbacks, or walk-aways when the playbook is
            not portable.
          </li>
        </ol>
        <p>
          None of that requires a made-up “typical discount %.” Outcomes are case-by-case. What matters
          for planning: higher exit readiness widens the serious buyer pool and usually simplifies
          terms; low readiness does the opposite.
        </p>
        <p>
          Related deep-dive:{" "}
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="What the Health Score looks for">
        <p>
          ValuRight’s Health Score surfaces <strong className="text-foreground">exit-readiness risks</strong>{" "}
          in owner language and pairs them with{" "}
          <strong className="text-foreground">prioritized recommendations</strong>. Treat the categories
          below as the owner-facing picture of what buyers care about — aligned to product inputs such as
          owner involvement, documentation, concentration, management depth, and recurring revenue.
        </p>
        <p className="font-semibold text-foreground">Owner-facing areas the score tends to flag:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Owner dependence</strong> — Hours, rainmaking, and know-how still tied to you. If
            the vacation test fails, readiness suffers.
          </li>
          <li>
            <strong>Documentation</strong> — Whether pricing, fulfillment, vendors, and monthly
            financial routines live in a playbook — or only in your head.
          </li>
          <li>
            <strong>Customer / revenue concentration</strong> — Too much of the earnings base in too few
            relationships or channels.
          </li>
          <li>
            <strong>Management depth</strong> — A clear #2 (or coverage) so day-to-day does not halt when
            you step back.
          </li>
          <li>
            <strong>Recurring or repeatable revenue</strong> — Where it fits your model, earnings that do
            not restart from zero every month.
          </li>
        </ol>
        <p>
          The product may weigh additional profile and financial-quality signals (messy books,
          incomplete history, category fit). This page does <strong>not</strong> publish secret
          sub-score weights or invent fake component scores. In-app, you see a{" "}
          <strong className="text-foreground">Health Score out of 100</strong> plus recommendations —
          use those, not this guide, as the source of truth for <em>your</em> file.
        </p>
        <p>
          For how methods and risk adjustments work in the planning range, see{" "}
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Self-check: are you exit-ready? (yes/no)">
        <p>Answer honestly. More nos usually means more readiness homework.</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Could someone else run day-to-day for two weeks with little owner phone access?</li>
          <li>Is there a written playbook for the top recurring processes?</li>
          <li>Do key customers know (and trust) at least one person besides you?</li>
          <li>
            Is customer concentration low enough that losing one account would not gut earnings?
          </li>
          <li>
            Are financials clean enough that a careful buyer would not bounce in week one of diligence?
          </li>
          <li>
            Do you know your <strong>planning range</strong> and the top risks holding it down — or only
            a hope number?
          </li>
          <li>If you listed in 12 months, would a buyer say the earnings stay when you leave?</li>
        </ol>
        <p>
          If several answers are no, start Free Preview, read the Health Score recommendations, and
          treat the next 12–24 months as a readiness workstream.
        </p>
      </LegalSection>

      <LegalSection title="How to improve in 12–24 months (planning guidance, not a guarantee)">
        <p>
          Many owner-operators can materially improve exit readiness with deliberate work over{" "}
          <strong>about 12–24 months</strong>. That timeline is planning guidance — not a promise that
          every business will be “buyer-ready” on a fixed date.
        </p>
        <p>Practical moves:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Cut owner dependence</strong> — Hire or promote ops coverage; put a second face on
            key accounts; test real time away. Details:{" "}
            <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
              Owner dependence
            </Link>
            .
          </li>
          <li>
            <strong>Document the playbook</strong> — Sales, service/fulfillment, pricing, vendors,
            monthly close.
          </li>
          <li>
            <strong>Diversify concentration</strong> — Where one customer or channel dominates, widen the
            base before you need a fire-sale timeline.
          </li>
          <li>
            <strong>Clean the numbers</strong> — Consistent P&Ls, honest add-backs, support a buyer can
            diligence. Bridge:{" "}
            <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
              SDE explained
            </Link>
            .
          </li>
          <li>
            <strong>Build management depth</strong> — A #2 who can run the week without you as the
            bottleneck.
          </li>
          <li>
            <strong>Strengthen repeatable revenue</strong> — Where your model allows (contracts,
            memberships, retainers, season passes, etc.) without inventing a model you do not have.
          </li>
        </ul>
        <p>
          Use ValuRight <strong>what-if</strong> scenarios (for example, reduce owner hours or improve
          documentation-related inputs where the product allows) to explore how the{" "}
          <strong>planning range</strong> may move. Dollar movement in-product is model output from{" "}
          <em>your</em> inputs — still an estimate, not an appraisal and not a promised sale-price lift.
        </p>
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-semibold text-foreground">
            Illustrative example — not your business, not a ValuRight result.
          </p>
          <p className="mt-2 text-muted-foreground">
            Suppose a planning range sits near $700K with high owner hours and thin documentation. A
            what-if that lowers owner hours and improves transferability might show a higher planning
            range in-product. That movement is scenario modeling for homework — not a guaranteed asking
            price or average lift.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="How Free Preview + what-if connect">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Start your free valuation</strong> ($0, no credit card) — industry/profile, owner
            involvement, financials (manual or CSV). About 15 minutes if data is handy.
          </li>
          <li>
            <strong>See the planning range</strong> — seven valuation methods appropriate to your
            category, blended into a headline range with confidence notes.
          </li>
          <li>
            <strong>Read the Health Score</strong> — out of 100, with prioritized recommendations on what
            may be holding the number down.
          </li>
          <li>
            <strong>Run what-if</strong> — model changes (such as reducing owner hours) and see how the
            planning range <em>may</em> respond.
          </li>
          <li>
            <strong>Take homework to advisors</strong> — CPA, broker, attorney — before you set an asking
            price or list.
          </li>
        </ol>
        <p>
          Paid plans (Essentials $99/mo, Exit Ready $249/mo) add deeper workflow (e.g. QuickBooks/Xero on
          Essentials; buyer teaser / data room / advisor review on Exit Ready). See{" "}
          <Link to="/pricing" search={{ checkout: undefined }} className="font-semibold text-accent hover:underline">
            live pricing
          </Link>
          . This guide does not invent feature claims beyond what is shipped.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
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
        <p className="mt-4">
          ValuRight is a <strong>software-generated planning estimate</strong> for Main Street owners
          55+ preparing the next chapter — <strong>not</strong> a certified appraisal and{" "}
          <strong>not</strong> a guaranteed sale price.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ">
        <div>
          <p className="font-semibold text-foreground">What is a Health Score in ValuRight?</p>
          <p className="mt-1">
            The Health Score is a 0–100 software view of exit-readiness signals for your business —
            things buyers care about such as owner dependence, documentation, concentration, management
            depth, and recurring or repeatable revenue where it fits. It comes with prioritized
            recommendations. It is not a credit score, not a certified appraisal, and not a promise of
            sale price.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Is exit readiness the same as a “sellability score”?
          </p>
          <p className="mt-1">
            People use different labels. ValuRight frames it as <strong>exit readiness</strong> and a{" "}
            <strong>Health Score</strong>: can a buyer take over without the earnings leaving with you,
            and what should you fix first? We do not use vague marketing scores without tying them to
            owner-facing risks and a planning range.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            Does a higher Health Score guarantee a higher sale price?
          </p>
          <p className="mt-1">
            No. A stronger readiness profile often supports a clearer buyer conversation and may improve
            how risk shows up in diligence — but sale price depends on earnings, market, deal structure,
            and negotiation. Health Score and what-if are homework, not a guarantee.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">How is this different from an appraisal?</p>
          <p className="mt-1">
            An appraisal (when you need one) is a formal opinion under professional standards. Free
            Preview is a software <strong>planning estimate</strong>: range, Health Score,
            recommendations, and what-if so you prepare before advisor or buyer meetings. Review
            assumptions with your CPA, broker, or appraiser when a formal opinion is required.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            How long does it take to improve exit readiness?
          </p>
          <p className="mt-1">
            Many owners plan on about <strong>12–24 months</strong> of deliberate work. That is planning
            guidance, not a guarantee. A short runway with high dependence usually means tougher terms —
            go in eyes open.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">
            What should I do first if my score is low?
          </p>
          <p className="mt-1">
            Start with the in-app recommendations. In practice, owners often tackle owner dependence and
            documentation first, then concentration and financial cleanup. Run Free Preview again as
            inputs improve, and use what-if to explore scenarios. See also{" "}
            <Link
              to="/guides/how-to-sell-my-business"
              className="font-semibold text-accent hover:underline"
            >
              How to sell my business
            </Link>{" "}
            and{" "}
            <Link
              to="/guides/exit-strategy-retirement"
              className="font-semibold text-accent hover:underline"
            >
              Exit strategy for retirement
            </Link>
            .
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
            See a sample
          </Link>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
            What is my business worth?
          </Link>
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
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
          <Link
            to="/guides/how-to-value-a-small-business"
            className="font-semibold text-accent hover:underline"
          >
            How to value a small business
          </Link>
          <Link to="/what-is-my-rv-park-worth" className="font-semibold text-accent hover:underline">
            What is my RV park worth?
          </Link>
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
          <Link to="/guides" className="font-semibold text-accent hover:underline">
            All guides
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">{VALUATION_DISCLAIMER_SHORT}</p>
      </div>
    </PublicPageShell>
  );
}
