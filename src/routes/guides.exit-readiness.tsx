import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LegalSection, PublicPageShell } from "@/components/PublicPageShell";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { ORGANIZATION_REF } from "@/lib/site-entity";
import { pageMeta } from "@/lib/page-meta";
import "./exit-readiness-print.css";

// SHIP-DATE PLACEHOLDER: 2026-11-13 / November 13, 2026.
// Re-bump dateModified, visible Last updated, and sitemap lastmod
// to the actual ship date at merge if that day is later.
const SHIP_DATE_ISO = "2026-11-13";
const SHIP_DATE_LONG = "November 13, 2026";

const META_DESCRIPTION =
  "A printable exit readiness checklist for Main Street owners: 18 yes/no questions buyers care about, how to score yourself, and what to fix first before you sell.";

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Exit readiness and the Health Score",
  description: META_DESCRIPTION,
  author: ORGANIZATION_REF,
  publisher: ORGANIZATION_REF,
  mainEntityOfPage: "https://valuright.ai/guides/exit-readiness",
  datePublished: "2026-09-21",
  dateModified: SHIP_DATE_ISO,
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

// Visible FAQ and FAQPage JSON-LD both render from this list (1:1, same order).
// Q1–Q8 are verbatim from the pre-refresh page; Q9–Q11 are new.
const EXIT_READINESS_FAQ: { question: string; answer: string }[] = [
  {
    question: "What is a Health Score in ValuRight?",
    answer:
      "The Health Score is a 0–100 software view of exit-readiness signals for your business — things buyers care about such as owner dependence, documentation, concentration, management depth, and recurring or repeatable revenue where it fits. It comes with prioritized recommendations. It is not a credit score, not a certified appraisal, and not a promise of sale price.",
  },
  {
    question: "Is exit readiness the same as a “sellability score”?",
    answer:
      "People use different labels. ValuRight frames it as exit readiness and a Health Score: can a buyer take over without the earnings leaving with you, and what should you fix first? We do not use vague marketing scores without tying them to owner-facing risks and a planning range.",
  },
  {
    question: "Does a higher Health Score guarantee a higher sale price?",
    answer:
      "No. A stronger readiness profile often supports a clearer buyer conversation and may improve how risk shows up in diligence — but sale price depends on earnings, market, deal structure, and negotiation. Health Score and what-if are homework, not a guarantee.",
  },
  {
    question: "How is this different from an appraisal?",
    answer:
      "An appraisal (when you need one) is a formal opinion under professional standards. Free Preview is a software planning estimate: range, Health Score, recommendations, and what-if so you prepare before advisor or buyer meetings. Review assumptions with your CPA, broker, or appraiser when a formal opinion is required.",
  },
  {
    question: "How long does it take to improve exit readiness?",
    answer:
      "Many owners plan on about 12–24 months of deliberate work. That is planning guidance, not a guarantee. A short runway with high dependence usually means tougher terms — go in eyes open.",
  },
  {
    question: "What should I do first if my score is low?",
    answer:
      "Start with the in-app recommendations. In practice, owners often tackle owner dependence and documentation first, then concentration and financial cleanup. Run Free Preview again as inputs improve, and use what-if to explore scenarios. See also How to sell my business and Exit strategy for retirement.",
  },
  {
    question: "Is exit readiness the same as being ready to list this month?",
    answer:
      "Not necessarily. Exit readiness is about transferable earnings, relationships, and playbooks. Listing date is a separate choice. Low readiness plus a fast list usually means tougher terms or a longer handoff.",
  },
  {
    question: "How is the Health Score different from the planning range?",
    answer:
      "The planning range is a value sketch from valuation methods. The Health Score flags readiness and risk and points to recommendations. Both are owner homework. Neither is a certified appraisal or a guaranteed sale price.",
  },
  {
    question: "What is an exit readiness checklist?",
    answer:
      "A short list of Yes, Partly, or No questions about the things buyers check: owner dependence, documentation, customer concentration, management depth, clean financials, and deal readiness. It shows where a buyer would push back before you list.",
  },
  {
    question: "Is there a free exit readiness scorecard?",
    answer:
      "Yes. The checklist on this page is free and printable. For a scored view tied to your own numbers, ValuRight’s Free Preview gives a Health Score out of 100 with recommendations, at no cost and with no credit card.",
  },
  {
    question: "How do I score my exit readiness?",
    answer:
      "Answer each checklist question Yes, Partly, or No. Count 1 point for each Yes, half a point for each Partly, and 0 for each No, and look at which areas have the most nos. Fix those first. Your ValuRight Health Score is a separate, software-generated score based on your inputs; neither is an appraisal or a promised sale price.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: EXIT_READINESS_FAQ.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const Q6_QUESTION = "What should I do first if my score is low?";

type ChecklistAnswer = "yes" | "partly" | "no";

type ChecklistSee = {
  to:
    | "/guides/owner-dependence"
    | "/guides/sde-explained"
    | "/guides/how-to-sell-my-business"
    | "/what-is-my-business-worth";
  label: string;
};

type ChecklistItem = {
  n: number;
  text: string;
  see?: ChecklistSee;
};

type ChecklistArea = {
  id: string;
  title: string;
  intro?: string;
  see?: ChecklistSee;
  items: ChecklistItem[];
};

const CHECKLIST_AREAS: ChecklistArea[] = [
  {
    id: "checklist-area-1",
    title: "Owner dependence",
    intro:
      "These questions look at whether day-to-day work, customer relationships, and new business still sit with you.",
    see: { to: "/guides/owner-dependence", label: "Owner dependence" },
    items: [
      {
        n: 1,
        text: "Could the business run day-to-day for two weeks with little or no phone contact from you?",
      },
      {
        n: 2,
        text: "Do your top customers know and trust at least one person besides you?",
      },
      {
        n: 3,
        text: "Is new business won by someone other than you, at least part of the time?",
      },
    ],
  },
  {
    id: "checklist-area-2",
    title: "Documentation",
    items: [
      {
        n: 4,
        text: "Is there a written playbook for your top recurring processes (sales, service or fulfillment, and pricing)?",
      },
      {
        n: 5,
        text: "Are vendor terms, key contracts, and leases in one place a buyer could review?",
      },
      {
        n: 6,
        text: "Could a new manager find how pricing and quoting decisions are made without asking you?",
      },
    ],
  },
  {
    id: "checklist-area-3",
    title: "Customer and revenue concentration",
    items: [
      {
        n: 7,
        text: "Would losing your single largest customer leave the business clearly profitable?",
      },
      {
        n: 8,
        text: "Do leads come from more than one channel?",
      },
    ],
  },
  {
    id: "checklist-area-4",
    title: "Management depth",
    items: [
      {
        n: 9,
        text: "Is there a clear #2 who can run the week without you as the bottleneck?",
      },
      {
        n: 10,
        text: "Are key staff likely to stay through a sale (for example, roles and pay are clear)?",
      },
    ],
  },
  {
    id: "checklist-area-5",
    title: "Financial clean-up",
    items: [
      {
        n: 11,
        text: "Do you have three years of consistent P&Ls and tax returns that tie to each other?",
      },
      {
        n: 12,
        text: "Are personal and business expenses separated, with add-backs written down and supportable?",
        see: { to: "/guides/sde-explained", label: "What is SDE?" },
      },
      {
        n: 13,
        text: "Is a monthly close done on time, every month?",
      },
      {
        n: 14,
        text: "Do you know your SDE and your planning range, not only a hope number?",
        see: { to: "/what-is-my-business-worth", label: "What is my business worth?" },
      },
    ],
  },
  {
    id: "checklist-area-6",
    title: "Deal readiness",
    intro: "For the broader sale path, see",
    see: { to: "/guides/how-to-sell-my-business", label: "How to sell my business" },
    items: [
      {
        n: 15,
        text: "Where your model allows, is some revenue repeatable (contracts, memberships, retainers, or service plans)?",
      },
      {
        n: 16,
        text: "Do you know what you want after the sale (stay on, consult, or walk away) and for how long?",
      },
      {
        n: 17,
        text: "Have you talked with a CPA, attorney, or broker about timing and taxes?",
      },
      {
        n: 18,
        text: "If you listed in 12 months, would a buyer say the earnings stay when you leave?",
      },
    ],
  },
];

function SeeLink({ see, trailingPeriod = true }: { see: ChecklistSee; trailingPeriod?: boolean }) {
  return (
    <>
      {" "}
      {trailingPeriod ? "See " : null}
      <Link to={see.to} className="font-semibold text-accent hover:underline">
        {see.label}
      </Link>
      {trailingPeriod ? "." : null}
    </>
  );
}

const ANSWER_OPTIONS: { value: ChecklistAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "partly", label: "Partly" },
  { value: "no", label: "No" },
];

function ChecklistMarks({
  itemId,
  value,
  onChange,
}: {
  itemId: string;
  value: ChecklistAnswer | undefined;
  onChange: (value: ChecklistAnswer) => void;
}) {
  return (
    <>
      <div className="answer-control mt-2 flex flex-wrap gap-3">
        {ANSWER_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground"
            >
              <input
                type="radio"
                name={itemId}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="h-3.5 w-3.5 accent-accent"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
      <div className="answer-print-marks" aria-hidden="true">
        {ANSWER_OPTIONS.map((opt) => (
          <span key={opt.value}>
            <span className="answer-box" />
            {opt.label}
          </span>
        ))}
      </div>
    </>
  );
}

export const Route = createFileRoute("/guides/exit-readiness")({
  head: () => ({
    meta: pageMeta({
      title: "Exit Readiness Checklist & Health Score | ValuRight",
      description: META_DESCRIPTION,
      url: "https://valuright.ai/guides/exit-readiness",
    }),
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
  const [answers, setAnswers] = useState<Partial<Record<number, ChecklistAnswer>>>({});

  return (
    <PublicPageShell
      heroCta
      seoFooter
      printHideHero
      relatedLinksFor="/guides/exit-readiness"
      eyebrow="Owner’s guide"
      title="Exit readiness and the Health Score"
      description={
        "Exit readiness means a buyer can take over the business without the earnings, relationships, or know-how walking out with you. Use the printable checklist below to score yourself in about 10 minutes, then run Free Preview for your Health Score and a planning range. ValuRight’s Health Score (out of 100) is a software view of how ready your Main Street business looks for that transfer — and what may be holding your planning range down — not a certified appraisal or a guaranteed sale price."
      }
      updated={SHIP_DATE_LONG}
    >
      <p className="mb-6 text-base leading-relaxed text-muted-foreground" data-print-hide="">
        For owners 55+ planning the next chapter, readiness is homework: transferability,
        documentation, dependence, and concentration — fixed over months, not the week you list.
      </p>

      <LegalSection title="Why readiness moves price" className="print-hide print:hidden">
        <p>
          Buyers do not only buy last year’s profit. They buy{" "}
          <strong className="text-foreground">transferable</strong> earnings.
        </p>
        <p>When readiness is weak, diligence usually shows up as:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Tougher price or multiple</strong> — Same earnings look riskier if they depend
            on you, thin docs, or a few customers.
          </li>
          <li>
            <strong>Longer transition</strong> — They may insist you stay to hand off relationships
            and ops.
          </li>
          <li>
            <strong>More structure</strong> — Earnouts, holdbacks, or walk-aways when the playbook
            is not portable.
          </li>
        </ol>
        <p>
          None of that requires a made-up “typical discount %.” Outcomes are case-by-case. What
          matters for planning: higher exit readiness widens the serious buyer pool and usually
          simplifies terms; low readiness does the opposite.
        </p>
        <p>
          Related deep-dive:{" "}
          <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
            Owner dependence
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="What the Health Score looks for" className="print-hide print:hidden">
        <p>
          ValuRight’s Health Score surfaces{" "}
          <strong className="text-foreground">exit-readiness risks</strong> in owner language and
          pairs them with <strong className="text-foreground">prioritized recommendations</strong>.
          Treat the categories below as the owner-facing picture of what buyers care about — aligned
          to product inputs such as owner involvement, documentation, concentration, management
          depth, and recurring revenue.
        </p>
        <p className="font-semibold text-foreground">Owner-facing areas the score tends to flag:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Owner dependence</strong> — Hours, rainmaking, and know-how still tied to you.
            If the vacation test fails, readiness suffers.
          </li>
          <li>
            <strong>Documentation</strong> — Whether pricing, fulfillment, vendors, and monthly
            financial routines live in a playbook — or only in your head.
          </li>
          <li>
            <strong>Customer / revenue concentration</strong> — Too much of the earnings base in too
            few relationships or channels.
          </li>
          <li>
            <strong>Management depth</strong> — A clear #2 (or coverage) so day-to-day does not halt
            when you step back.
          </li>
          <li>
            <strong>Recurring or repeatable revenue</strong> — Where it fits your model, earnings
            that do not restart from zero every month.
          </li>
        </ol>
        <p>
          The{" "}
          <a href="#exit-readiness-checklist" className="font-semibold text-accent hover:underline">
            checklist below
          </a>{" "}
          turns these areas into questions you can answer today.
        </p>
        <p>
          The product may weigh additional profile and financial-quality signals (messy books,
          incomplete history, category fit). This page does <strong>not</strong> publish secret
          sub-score weights or invent fake component scores. In-app, you see a{" "}
          <strong className="text-foreground">Health Score out of 100</strong> plus recommendations
          — use those, not this guide, as the source of truth for <em>your</em> file.
        </p>
        <p>
          For how methods and risk adjustments work in the planning range, see{" "}
          <Link to="/methodology" className="font-semibold text-accent hover:underline">
            Methodology
          </Link>
          .
        </p>
      </LegalSection>

      <div id="exit-readiness-print-root">
        <p className="print-only-title">
          Exit readiness checklist — valuright.ai/guides/exit-readiness
        </p>

        <LegalSection id="exit-readiness-checklist" title="Exit readiness checklist (printable)">
          <div className="flex justify-end print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
            >
              Print checklist
            </button>
          </div>
          <p>Answer Yes, Partly, or No. Be honest; a buyer’s diligence will be.</p>
          {CHECKLIST_AREAS.map((area) => (
            <div key={area.id} id={area.id} className="checklist-area space-y-3">
              <h3 className="font-display text-base font-semibold text-primary">{area.title}</h3>
              {area.intro && (
                <p>
                  {area.intro}
                  {area.see ? (
                    area.intro.endsWith("see") ? (
                      <>
                        {" "}
                        <Link
                          to={area.see.to}
                          className="font-semibold text-accent hover:underline"
                        >
                          {area.see.label}
                        </Link>
                        .
                      </>
                    ) : (
                      <SeeLink see={area.see} />
                    )
                  ) : null}
                </p>
              )}
              <ol start={area.items[0].n} className="list-decimal space-y-3 pl-5">
                {area.items.map((item) => (
                  <li key={item.n} className="checklist-item">
                    <p>
                      {item.text}
                      {item.see ? <SeeLink see={item.see} /> : null}
                    </p>
                    <ChecklistMarks
                      itemId={`exit-readiness-item-${item.n}`}
                      value={answers[item.n]}
                      onChange={(value) => setAnswers((prev) => ({ ...prev, [item.n]: value }))}
                    />
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </LegalSection>

        <LegalSection title="How to score your checklist">
          <p>
            Count 1 point for each Yes, half a point for each Partly, and 0 for each No. Then look
            at the pattern, not just the total: which of the six areas has the most nos?
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Mostly yes:</strong> You are in good shape to start advisor and buyer
              conversations. Confirm with Free Preview.
            </li>
            <li>
              <strong>Mixed:</strong> Pick the two weakest areas and make them a 12–24 month
              readiness plan.
            </li>
            <li>
              <strong>Mostly no:</strong> Start with owner dependence and documentation, and expect
              a longer runway before you list.
            </li>
          </ul>
          <p>
            This tally is a self-check, not your ValuRight Health Score. The Health Score (0–100)
            comes from your inputs in Free Preview and comes with prioritized recommendations. For
            how the planning range treats risk, see{" "}
            <Link to="/methodology" className="font-semibold text-accent hover:underline">
              Methodology
            </Link>
            . Neither the tally nor the Health Score is an appraisal or a promised sale price.
          </p>
        </LegalSection>
      </div>

      <LegalSection
        title="How to improve in 12–24 months (planning guidance, not a guarantee)"
        className="print-hide print:hidden"
      >
        <p>
          Many owner-operators can materially improve exit readiness with deliberate work over{" "}
          <strong>about 12–24 months</strong>. That timeline is planning guidance — not a promise
          that every business will be “buyer-ready” on a fixed date.
        </p>
        <p>Practical moves:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>
              Cut owner dependence (
              <a href="#checklist-area-1" className="font-semibold text-accent hover:underline">
                checklist area 1
              </a>
              )
            </strong>{" "}
            — Hire or promote ops coverage; put a second face on key accounts; test real time away.
            Details:{" "}
            <Link
              to="/guides/owner-dependence"
              className="font-semibold text-accent hover:underline"
            >
              Owner dependence
            </Link>
            .
          </li>
          <li>
            <strong>
              Document the playbook (
              <a href="#checklist-area-2" className="font-semibold text-accent hover:underline">
                checklist area 2
              </a>
              )
            </strong>{" "}
            — Sales, service/fulfillment, pricing, vendors, monthly close.
          </li>
          <li>
            <strong>
              Diversify concentration (
              <a href="#checklist-area-3" className="font-semibold text-accent hover:underline">
                checklist area 3
              </a>
              )
            </strong>{" "}
            — Where one customer or channel dominates, widen the base before you need a fire-sale
            timeline.
          </li>
          <li>
            <strong>
              Clean the numbers (
              <a href="#checklist-area-5" className="font-semibold text-accent hover:underline">
                checklist area 5
              </a>
              )
            </strong>{" "}
            — Consistent P&Ls, honest add-backs, support a buyer can diligence. Bridge:{" "}
            <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
              SDE explained
            </Link>
            .
          </li>
          <li>
            <strong>
              Build management depth (
              <a href="#checklist-area-4" className="font-semibold text-accent hover:underline">
                checklist area 4
              </a>
              )
            </strong>{" "}
            — A #2 who can run the week without you as the bottleneck.
          </li>
          <li>
            <strong>
              Strengthen repeatable revenue (
              <a href="#checklist-area-6" className="font-semibold text-accent hover:underline">
                checklist area 6
              </a>
              )
            </strong>{" "}
            — Where your model allows (contracts, memberships, retainers, season passes, etc.)
            without inventing a model you do not have.
          </li>
        </ul>
        <p>
          Use ValuRight <strong>what-if</strong> scenarios (for example, reduce owner hours or
          improve documentation-related inputs where the product allows) to explore how the{" "}
          <strong>planning range</strong> may move. Dollar movement in-product is model output from{" "}
          <em>your</em> inputs — still an estimate, not an appraisal and not a promised sale-price
          lift.
        </p>
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-semibold text-foreground">
            Illustrative example — not your business, not a ValuRight result.
          </p>
          <p className="mt-2 text-muted-foreground">
            Suppose a planning range sits near $700K with high owner hours and thin documentation. A
            what-if that lowers owner hours and improves transferability might show a higher
            planning range in-product. That movement is scenario modeling for homework — not a
            guaranteed asking price or average lift.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="How Free Preview + what-if connect" className="print-hide print:hidden">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Start your free valuation</strong> ($0, no credit card) — industry/profile,
            owner involvement, financials (manual or CSV). About 15 minutes if data is handy.
          </li>
          <li>
            <strong>See the planning range</strong> — seven valuation methods appropriate to your
            category, blended into a headline range with confidence notes.
          </li>
          <li>
            <strong>Read the Health Score</strong> — out of 100, with prioritized recommendations on
            what may be holding the number down.
          </li>
          <li>
            <strong>Run what-if</strong> — model changes (such as reducing owner hours) and see how
            the planning range <em>may</em> respond.
          </li>
          <li>
            <strong>Take homework to advisors</strong> — CPA, broker, attorney — before you set an
            asking price or list.
          </li>
        </ol>
        <p>
          Paid plans (Essentials $99/mo, Exit Ready $249/mo) add deeper workflow (e.g.
          QuickBooks/Xero on Essentials; buyer teaser / data room / advisor review on Exit Ready).
          See{" "}
          <Link
            to="/pricing"
            search={{ checkout: undefined }}
            className="font-semibold text-accent hover:underline"
          >
            live pricing
          </Link>
          . This guide does not invent feature claims beyond what is shipped.
        </p>
        <div className="mt-4 flex flex-wrap gap-3" data-print-hide="">
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
        <p className="mt-4">
          ValuRight is a <strong>software-generated planning estimate</strong> for Main Street
          owners 55+ preparing the next chapter — <strong>not</strong> a certified appraisal and{" "}
          <strong>not</strong> a guaranteed sale price.
        </p>
        <p className="text-xs">{VALUATION_DISCLAIMER_SHORT}</p>
      </LegalSection>

      <LegalSection title="FAQ" className="print-hide print:hidden">
        {EXIT_READINESS_FAQ.map((item) => (
          <div key={item.question}>
            <p className="font-semibold text-foreground">{item.question}</p>
            <p className="mt-1">
              {item.question === Q6_QUESTION ? (
                <>
                  Start with the in-app recommendations. In practice, owners often tackle owner
                  dependence and documentation first, then concentration and financial cleanup. Run
                  Free Preview again as inputs improve, and use what-if to explore scenarios. See
                  also{" "}
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
                </>
              ) : (
                item.answer
              )}
            </p>
          </div>
        ))}
      </LegalSection>

      <div
        className="mt-10 space-y-4 rounded-xl border border-border bg-card p-6 print:hidden"
        data-print-hide=""
      >
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
          <Link
            to="/what-is-my-business-worth"
            className="font-semibold text-accent hover:underline"
          >
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
          <Link
            to="/what-is-my-rv-park-worth"
            className="font-semibold text-accent hover:underline"
          >
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
