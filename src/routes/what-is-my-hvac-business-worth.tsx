import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, ShieldCheck, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "What Is My HVAC Business Worth? Free Planning Range | ValuRight",
  headline: "What is my HVAC business worth?",
  description:
    "Estimate a planning range for an HVAC or heating & cooling business — recurring service, owner involvement, technician bench, and risks buyers discount. Software estimate for owners 55+, not a certified appraisal.",
  url: "https://valuright.ai/what-is-my-hvac-business-worth",
  datePublished: "2026-09-22",
  dateModified: "2026-09-22",
  author: { "@type": "Organization", name: "ValuRight" },
  publisher: {
    "@type": "Organization",
    name: "ValuRight",
    logo: { "@type": "ImageObject", url: "https://valuright.ai/favicon.svg" },
  },
  mainEntityOfPage: "https://valuright.ai/what-is-my-hvac-business-worth",
  about: {
    "@type": "Thing",
    name: "HVAC business valuation planning estimate",
  },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://valuright.ai/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "What is my business worth?",
      item: "https://valuright.ai/what-is-my-business-worth",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "What is my HVAC business worth?",
      item: "https://valuright.ai/what-is-my-hvac-business-worth",
    },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this a certified appraisal of my HVAC business?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker, or appraiser. It is not a certified appraisal, not tax or legal advice, and not a guaranteed sale price.",
      },
    },
    {
      "@type": "Question",
      name: "How do buyers value an HVAC company?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most owner-operated shops start from an honest Seller's Discretionary Earnings (SDE) base, then adjust for risk — recurring work mix, technician bench, owner dependence, concentration, and documentation. There is no universal multiple on this page. Enter your numbers in Free Preview and review assumptions with an advisor before you set an asking price.",
      },
    },
    {
      "@type": "Question",
      name: "Do maintenance agreements raise my value?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Buyers often prefer more repeatable or recurring service work when it is real, documented, and transferable — because earnings may look less dependent on the owner winning every new install. This page does not invent a lift percentage. Use Free Preview what-if and advisor diligence to explore your mix.",
      },
    },
    {
      "@type": "Question",
      name: "SDE or EBITDA for an HVAC shop?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Owner-operated Main Street HVAC businesses usually start with SDE. Larger shops with management depth may also hear EBITDA in broker conversations. Get the earnings base honest either way.",
      },
    },
    {
      "@type": "Question",
      name: "How long does Free Preview take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "About 15 minutes if you have recent financials handy.",
      },
    },
    {
      "@type": "Question",
      name: "Who is this for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HVAC and heating and cooling owners — especially owners 55+ planning the next chapter — who want a planning range and exit-readiness homework before broker or buyer conversations. Not Wall Street models.",
      },
    },
    {
      "@type": "Question",
      name: "Will you show me comps or typical HVAC multiples?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No invented sale comps or industry-average multiples on this page. Your planning range comes from your inputs and ValuRight's methods. Local comps belong in advisor or broker diligence.",
      },
    },
    {
      "@type": "Question",
      name: "Free Preview vs a broker or appraiser?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Free Preview is homework: a planning range, Health Score, and what-if scenarios so you walk into advisor conversations with clearer questions. It does not replace a CPA, broker, attorney, or certified appraisal when a formal opinion or deal process requires one.",
      },
    },
  ],
};

export const Route = createFileRoute("/what-is-my-hvac-business-worth")({
  head: () => ({
    meta: [
      { title: "What Is My HVAC Business Worth? Free Planning Range | ValuRight" },
      {
        name: "description",
        content:
          "Estimate a planning range for an HVAC or heating & cooling business — recurring service, owner involvement, technician bench, and risks buyers discount. For owners 55+, not a certified appraisal.",
      },
      {
        property: "og:title",
        content: "What Is My HVAC Business Worth? Free Planning Range | ValuRight",
      },
      {
        property: "og:description",
        content:
          "Estimate a planning range for an HVAC or heating & cooling business — recurring service, owner involvement, technician bench, and risks buyers discount. For owners 55+, not a certified appraisal.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/what-is-my-hvac-business-worth",
      },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/what-is-my-hvac-business-worth" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(webPageLd),
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
  component: HvacWorthLanding,
});

function HvacWorthLanding() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={40} withTagline />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-buyers-look" className="hover:text-foreground transition">
              How buyers look
            </a>
            <Link to="/pricing" search={{ checkout: undefined }} className="hover:text-foreground transition">
              Pricing
            </Link>
            <Link to="/guides" className="hover:text-foreground transition">
              Guides
            </Link>
            <Link to="/demo" onClick={trackDemoClick} className="hover:text-foreground transition">
              See a sample
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-sm font-medium text-foreground hover:text-accent transition hidden sm:inline"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              onClick={trackSignupStart}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.025_158/0.5),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium text-accent mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Free Preview · HVAC & trades
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                What is my HVAC business worth?
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Your HVAC or heating &amp; cooling business is worth a{" "}
                <strong className="text-foreground">planning range</strong>, not one napkin multiple.
                Buyers usually start from <strong className="text-foreground">earnings quality</strong>{" "}
                and <strong className="text-foreground">buyer risk</strong> — how much work is recurring
                vs one-time installs, how deep the technician bench is, warranty and callback exposure,
                and how much the shop still needs <strong className="text-foreground">you</strong> for
                estimating, sales, or truck time — then apply Main Street methods built around{" "}
                <strong className="text-foreground">Seller’s Discretionary Earnings (SDE)</strong> for
                owner-operated shops. ValuRight Free Preview estimates that range in about{" "}
                <strong className="text-foreground">15 minutes</strong>. It is a{" "}
                <strong className="text-foreground">software-generated planning estimate</strong> for
                owners 55+, <strong className="text-foreground">not</strong> a certified appraisal or a
                guaranteed sale price.
              </p>
              <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                See a planning range, a Health Score for what may be holding the number down, and
                what-if scenarios — useful homework before you talk to a CPA, broker, or buyer about an
                HVAC shop.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Last updated: September 22, 2026
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
              onClick={trackSignupStart}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-md hover:shadow-lg"
                >
                  Start your free valuation <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/demo"
                  onClick={trackDemoClick}
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:bg-secondary transition"
                >
                  See a sample
                </Link>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Planning estimate for HVAC and trades owners 55+ — not Wall Street, not a certified
                appraisal, not a guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      HVAC Free Preview
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Seven methods
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold text-primary">
                    Planning range + Health Score for HVAC shops
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    No invented “typical HVAC” dollar or multiple numbers here. Your range comes from
                    your inputs after you start Free Preview.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      "Select HVAC / heating & cooling in Free Preview when available",
                      "SDE-first Main Street methods among seven approaches",
                      "Health Score out of 100 + prioritized recommendations",
                      "What-if scenarios on owner hours and transferability",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                Software-generated planning estimate. Review with your CPA or broker before you set an
                asking price.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-buyers-look" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            How buyers look at HVAC shops
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Earnings story + transfer without you
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            HVAC buyers care about the <strong className="text-foreground">earnings story</strong> and
            whether it survives without the current owner on the tools or on every estimate.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">In plain terms, diligence usually covers:</p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Revenue mix</strong> — service / maintenance /
              membership work vs replace / install / new construction. Recurring or repeatable service
              often reads as more transferable than a book of one-off installs that live in the owner’s
              relationships.
            </li>
            <li>
              <strong className="text-foreground">Customer and channel mix</strong> — residential vs
              light commercial; reliance on a few builders, property managers, or referral sources vs a
              broader base.
            </li>
            <li>
              <strong className="text-foreground">Technician bench</strong> — licensed coverage,
              capacity for peak heat/cold seasons, and whether work stops when a key tech (or you) is
              out.
            </li>
            <li>
              <strong className="text-foreground">Warranty, callbacks, and quality</strong> — open
              warranty exposure, redo rates, and brand/reputation that support (or undermine) pricing
              power.
            </li>
            <li>
              <strong className="text-foreground">Ops transferability</strong> — who owns estimating,
              dispatch, vendor accounts, permitting know-how, and customer relationships when you are
              not in the truck or on the phone.
            </li>
          </ol>

          <h3 className="mt-10 font-display text-2xl font-semibold text-primary">
            When SDE is the right starting point
          </h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              Most <strong className="text-foreground">owner-operated HVAC shops</strong> where the
              buyer will replace or oversee the owner’s rainmaking / estimating / lead-tech role start
              with <strong className="text-foreground">Seller’s Discretionary Earnings (SDE)</strong>{" "}
              — the total annual benefit to one full-time owner-operator — then apply risk-aware
              multiples. See{" "}
              <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
                What is SDE?
              </Link>
              .
            </li>
            <li>
              Larger shops with professional management and cleaner add-backs may also discuss EBITDA in
              broker conversations — still start with an honest earnings base. Free Preview runs{" "}
              <strong className="text-foreground">seven methods</strong> appropriate to the business
              category and blends a headline <strong className="text-foreground">planning range</strong>{" "}
              with confidence notes. This page does <strong className="text-foreground">not</strong>{" "}
              publish secret method weights or “typical HVAC multiples.”
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            There is no universal “HVAC multiple” that replaces homework. Garbage-in financials and
            undocumented owner add-backs produce junk ranges.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">What moves the range</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Qualitative factors — not a benchmark table
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            These factors commonly shift an HVAC shop’s planning range (
            <strong className="text-foreground">qualitative — not a benchmark table, not comps</strong>
            ):
          </p>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Recurring service share</strong> — maintenance plans,
              memberships, and repeat service vs pure install/replace project work.
            </li>
            <li>
              <strong className="text-foreground">Seasonality and peak coverage</strong> — whether the
              shop can staff heat and cool peaks without the owner as the overflow tech.
            </li>
            <li>
              <strong className="text-foreground">Owner hours in sales / estimating / trucks</strong> —
              if revenue softens when you step back, buyers price transfer risk.
            </li>
            <li>
              <strong className="text-foreground">Technician depth and licenses</strong> — bench
              strength, specialty skills, and concentration in one or two people.
            </li>
            <li>
              <strong className="text-foreground">Customer / builder concentration</strong> — too much
              book in too few relationships or channels.
            </li>
            <li>
              <strong className="text-foreground">Fleet, tools, and CapEx</strong> — trucks, recovery
              equipment, and deferred vehicle/tool spend buyers will scrutinize.
            </li>
            <li>
              <strong className="text-foreground">Warranty and callback risk</strong> — open obligations
              and redo patterns that feel like contingent liability.
            </li>
            <li>
              <strong className="text-foreground">Documentation</strong> — clean P&amp;Ls, job costing,
              add-back support, and a dispatch / estimating playbook someone else can run.
            </li>
            <li>
              <strong className="text-foreground">Reputation</strong> — reviews and referral quality that
              support rate integrity.
            </li>
          </ul>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            ValuRight’s <strong className="text-foreground">Health Score</strong> and recommendations
            surface several of these risks early.{" "}
            <strong className="text-foreground">What-if</strong> scenarios let you explore changes (for
            example, reducing owner hours on the tools) and see how the{" "}
            <strong className="text-foreground">planning range</strong> may move — model output from{" "}
            <em>your</em> inputs, not a promised sale-price lift. More on readiness:{" "}
            <Link to="/guides/exit-readiness" className="font-semibold text-accent hover:underline">
              Exit readiness &amp; Health Score
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Owner dependence</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Still a job you own — or an asset someone else can run?
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            If you are the default estimator, the closer on the big jobs, the after-hours emergency
            call, and the keeper of builder relationships, the shop is still a{" "}
            <strong className="text-foreground">job you own</strong> — not only an asset someone else
            can operate.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Buyers often respond with a lower multiple, a longer transition, or more earnout/holdback —
            and some walk. That is owner dependence in trades language.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Read the full guide:{" "}
            <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
              Owner dependence: why buyers discount your business
            </Link>
            .
          </p>
          <h3 className="mt-8 font-display text-xl font-semibold text-primary">
            HVAC-flavored self-check (yes/no)
          </h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>Are you the default after-hours call for emergencies or callbacks?</li>
            <li>
              Would a two-week vacation with little phone access break estimating, dispatch, or key
              customer coverage?
            </li>
            <li>Is there no clear #2 who can run day-to-day ops and sales without you?</li>
            <li>
              Does pricing, vendor know-how, and “how we win the job” mostly live in your head?
            </li>
            <li>Are key builder / property-manager / referral relationships primarily yours?</li>
          </ol>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            More yeses → treat transferability as a workstream before you fall in love with an asking
            price.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Bridge</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Get the earnings base honest first
          </h2>
          <ul className="mt-6 space-y-3 text-muted-foreground leading-relaxed">
            <li>
              <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
                What is SDE?
              </Link>{" "}
              — Seller’s Discretionary Earnings for owner-operated Main Street businesses.
            </li>
            <li>
              <Link
                to="/guides/how-to-value-a-small-business"
                className="font-semibold text-accent hover:underline"
              >
                How to value a small business
              </Link>{" "}
              — SDE, multiples, and what moves the range.
            </li>
            <li>
              <Link
                to="/what-is-my-business-worth"
                className="font-semibold text-accent hover:underline"
              >
                What is my business worth?
              </Link>{" "}
              — the general Free Preview worth hub (any Main Street category).
            </li>
            <li>
              <Link to="/methodology" className="font-semibold text-accent hover:underline">
                Methodology
              </Link>{" "}
              — seven methods in plain English.
            </li>
            <li>
              <Link to="/guides/exit-readiness" className="font-semibold text-accent hover:underline">
                Exit readiness &amp; Health Score
              </Link>{" "}
              — what buyers mean by ready to transfer.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                Free Preview for HVAC owners
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
                What to have ready (~15 minutes)
              </h2>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
                <li>
                  Recent <strong className="text-foreground">P&amp;Ls</strong> (ideally multi-year) and a
                  clear picture of owner compensation / add-backs.
                </li>
                <li>
                  Rough sense of <strong className="text-foreground">revenue mix</strong> (service /
                  maintenance vs install / replace / new construction) — even informal notes beat
                  guessing in silence.
                </li>
                <li>
                  Honest <strong className="text-foreground">owner role</strong>: hours in estimating,
                  sales, trucks, and after-hours coverage; who covers when you are gone.
                </li>
                <li>
                  Known <strong className="text-foreground">fleet / tool CapEx</strong> or deferred
                  vehicle and equipment needs you would disclose in diligence anyway.
                </li>
                <li>
                  Industry/category:{" "}
                  <strong className="text-foreground">HVAC / heating &amp; cooling</strong> (select in
                  product if available; otherwise describe in profile fields).
                </li>
              </ul>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Free Preview ($0, no credit card):</strong> seven
                valuation methods, Health Score out of 100, prioritized recommendations, what-if, manual
                entry and CSV import.
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Free Preview $0 · Essentials $99/mo · Exit Ready $249/mo — see{" "}
                <Link
                  to="/pricing"
                  search={{ checkout: undefined }}
                  className="font-semibold text-accent hover:underline"
                >
                  Pricing
                </Link>
                .
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
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
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
                >
                  See a sample
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <Feature
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Health Score"
                desc={
                  <>
                    See what may be holding the number down. Deep dive:{" "}
                    <Link
                      to="/guides/exit-readiness"
                      className="font-semibold text-accent hover:underline"
                    >
                      Exit readiness
                    </Link>
                    .
                  </>
                }
              />
              <Feature
                icon={<TrendingUp className="h-5 w-5" />}
                title="Seven methods"
                desc="SDE-first Main Street methods appropriate to the category — not a single rule of thumb, and not invented HVAC multiples."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
              Common questions
            </h2>
          </div>
          <div className="space-y-6">
            <Faq
              q="Is this a certified appraisal of my HVAC business?"
              a="No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker, or appraiser. It is not a certified appraisal, not tax or legal advice, and not a guaranteed sale price."
            />
            <Faq
              q="How do buyers value an HVAC company?"
              a="Most owner-operated shops start from an honest SDE (or similar earnings) base, then adjust for risk — recurring work mix, technician bench, owner dependence, concentration, and documentation. There is no universal multiple on this page. Enter your numbers in Free Preview; review assumptions with an advisor before you set an asking price."
            />
            <Faq
              q="Do maintenance agreements raise my value?"
              a="Buyers often prefer more repeatable / recurring service work when it is real, documented, and transferable — because earnings may look less dependent on the owner winning every new install. This page does not invent a lift percentage. Use Free Preview what-if and advisor diligence to explore your mix."
            />
            <Faq
              q="SDE or EBITDA for an HVAC shop?"
              a={
                <>
                  Owner-operated Main Street HVAC businesses usually start with{" "}
                  <strong>SDE</strong>. Larger shops with management depth may also hear EBITDA in
                  broker conversations. Get the earnings base honest either way — see{" "}
                  <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
                    What is SDE?
                  </Link>{" "}
                  and{" "}
                  <Link to="/methodology" className="font-semibold text-accent hover:underline">
                    Methodology
                  </Link>
                  .
                </>
              }
            />
            <Faq q="How long does Free Preview take?" a="About 15 minutes if you have recent financials handy." />
            <Faq
              q="Who is this for?"
              a="HVAC and heating & cooling owners — especially owners 55+ planning the next chapter — who want a planning range and exit-readiness homework before broker or buyer conversations. Not Wall Street models."
            />
            <Faq
              q='Will you show me comps or “typical HVAC multiples”?'
              a="No invented sale comps or industry-average multiples on this page. Your planning range comes from your inputs and ValuRight’s methods. Local comps belong in advisor / broker diligence — label any third-party numbers carefully if you add them later."
            />
            <Faq
              q="Free Preview vs a broker or appraiser?"
              a={
                <>
                  Free Preview is homework: a planning range, Health Score, and what-if scenarios so you
                  walk into advisor conversations with clearer questions. It does{" "}
                  <strong>not</strong> replace a CPA, broker, attorney, or certified appraisal when a
                  formal opinion or deal process requires one.
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <FileCheck className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary">
            Ready to see your HVAC shop’s planning range?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start your free valuation in minutes — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              onClick={trackSignupStart}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-md"
            >
              Start your free valuation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/demo"
                  onClick={trackDemoClick}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:bg-secondary transition"
            >
              See a sample
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
              What is my business worth?
            </Link>
            <Link to="/what-is-my-rv-park-worth" className="font-semibold text-accent hover:underline">
              What is my RV park worth?
            </Link>
            <Link to="/guides/exit-readiness" className="font-semibold text-accent hover:underline">
              Exit readiness
            </Link>
            <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
              Owner dependence
            </Link>
            <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
              SDE explained
            </Link>
            <Link to="/methodology" className="font-semibold text-accent hover:underline">
              Methodology
            </Link>
            <Link to="/guides" className="font-semibold text-accent hover:underline">
              Guides
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{VALUATION_DISCLAIMER_SHORT}</p>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <BrandLogo size={36} variant="onDark" />
              <p className="mt-3 text-sm text-primary-foreground/70 max-w-md">
                Planning estimates for Main Street owners preparing the next chapter — including HVAC
                and heating &amp; cooling operators.
              </p>
            </div>
            <div className="space-y-3 text-xs text-primary-foreground/60 max-w-md">
              {VALUATION_DISCLAIMER_SHORT}
              <div className="flex flex-wrap gap-4">
                <Link to="/privacy" className="hover:text-primary-foreground">
                  Privacy
                </Link>
                <Link to="/terms" className="hover:text-primary-foreground">
                  Terms
                </Link>
                <Link to="/methodology" className="hover:text-primary-foreground">
                  Methodology
                </Link>
                <Link to="/guides" className="hover:text-primary-foreground">
                  Guides
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-primary-foreground/10 text-xs text-primary-foreground/60">
            © {new Date().getFullYear()} ValuRight.ai. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="mt-3 font-display text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg font-semibold text-primary">{q}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{a}</p>
    </div>
  );
}
