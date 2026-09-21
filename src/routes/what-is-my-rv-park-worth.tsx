import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, ShieldCheck, Users, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "What Is My RV Park Worth? Free Planning Range | ValuRight",
  headline: "What is my RV Park worth?",
  description:
    "Estimate a planning range for an RV park or campground — occupancy, seasonality, owner involvement, and risks buyers discount. Software estimate for owners 55+, not a certified appraisal.",
  url: "https://valuright.ai/what-is-my-rv-park-worth",
  datePublished: "2026-09-21",
  dateModified: "2026-09-21",
  author: { "@type": "Organization", name: "ValuRight" },
  publisher: {
    "@type": "Organization",
    name: "ValuRight",
    logo: { "@type": "ImageObject", url: "https://valuright.ai/favicon.svg" },
  },
  mainEntityOfPage: "https://valuright.ai/what-is-my-rv-park-worth",
  about: {
    "@type": "Thing",
    name: "RV park and campground valuation planning estimate",
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
      name: "What is my RV park worth?",
      item: "https://valuright.ai/what-is-my-rv-park-worth",
    },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is this a certified appraisal of my RV park?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker, or appraiser. It is not a certified appraisal, not tax or legal advice, and not a guaranteed sale price.",
      },
    },
    {
      "@type": "Question",
      name: "How do you value a seasonal campground?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Seasonality is a risk and cash-flow factor, not a reason to skip homework. Buyers look at earnings quality across the year, peak dependence, and whether ops transfer without you. Enter honest financials and occupancy context; Free Preview blends methods appropriate to the category. Review assumptions with an advisor before you set an asking price.",
      },
    },
    {
      "@type": "Question",
      name: "SDE or cap rate for an RV park?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Owner-operated parks often start with Seller's Discretionary Earnings (SDE). Parks that behave more like income property get more weight on income or cap-rate approaches (stabilized NOI divided by a selected cap rate). ValuRight shows multiple methods in context.",
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
        text: "Park and campground owners — especially owners 55+ planning the next chapter — who want a planning range and exit-readiness homework before broker or buyer conversations. Not Wall Street models.",
      },
    },
    {
      "@type": "Question",
      name: "Will you show me comps or typical occupancy for parks like mine?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No invented sale comps or occupancy benchmarks on this page. Your planning range comes from your inputs and ValuRight's methods. Local comps and market occupancy data belong in advisor or broker diligence.",
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

export const Route = createFileRoute("/what-is-my-rv-park-worth")({
  head: () => ({
    meta: [
      { title: "What Is My RV Park Worth? Free Planning Range | ValuRight" },
      {
        name: "description",
        content:
          "Estimate a planning range for an RV park or campground — occupancy, seasonality, owner involvement, and risks buyers discount. Software estimate for owners 55+, not a certified appraisal.",
      },
      {
        property: "og:title",
        content: "What Is My RV Park Worth? Free Planning Range | ValuRight",
      },
      {
        property: "og:description",
        content:
          "Estimate a planning range for an RV park or campground — occupancy, seasonality, owner involvement, and risks buyers discount. Software estimate for owners 55+, not a certified appraisal.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/what-is-my-rv-park-worth",
      },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/what-is-my-rv-park-worth" }],
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
  component: RvParkWorthLanding,
});

function RvParkWorthLanding() {
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
            <Link to="/demo" className="hover:text-foreground transition">
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
                Free Preview · Parks & campgrounds
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                What is my RV Park worth?
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Your RV park or campground is worth a{" "}
                <strong className="text-foreground">planning range</strong>, not one napkin multiple.
                Buyers usually start from <strong className="text-foreground">earnings quality</strong>{" "}
                and <strong className="text-foreground">buyer risk</strong> — occupancy and
                seasonality, CapEx and deferred maintenance, and how much the park still needs you
                on-site — then cross-check with income / cap-rate thinking when the asset behaves like
                income property. ValuRight Free Preview estimates that range in about{" "}
                <strong className="text-foreground">15 minutes</strong>. It is a{" "}
                <strong className="text-foreground">software-generated planning estimate</strong> for
                owners 55+, <strong className="text-foreground">not</strong> a certified appraisal or
                a guaranteed sale price.
              </p>
              <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                See a planning range, a Health Score for what may be holding the number down, and
                what-if scenarios — useful homework before you talk to a CPA, broker, or buyer about a
                park or campground.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Last updated: September 21, 2026
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-md hover:shadow-lg"
                >
                  Start your free valuation <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:bg-secondary transition"
                >
                  See a sample report
                </Link>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Planning estimate for park and campground owners 55+ — not Wall Street, not a certified
                appraisal, not a guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Park Free Preview
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Seven methods
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold text-primary">
                    Planning range + Health Score for parks
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    No invented “typical park” dollar or occupancy numbers here. Your range comes from
                    your inputs after you start Free Preview.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      "Select RV park / campground in Free Preview when available",
                      "Cap rate among seven methods where income-property category fits",
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
            How buyers look at RV parks
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Income story + transfer without you
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Park buyers care about the <strong className="text-foreground">income story</strong> and
            whether it survives without the current owner.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">In plain terms, diligence usually covers:</p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Income mix</strong> — site rent / nightly and monthly
              stays, plus add-ons (utilities pass-throughs, store, propane, laundry, activities) when
              they are real and documented.
            </li>
            <li>
              <strong className="text-foreground">Occupancy and seasonality</strong> — how full the park
              runs across the year, not just a peak weekend. Shoulder and off-season matter for cash
              flow risk.
            </li>
            <li>
              <strong className="text-foreground">Length-of-stay mix</strong> — transient vs seasonal vs
              longer stays change revenue stability and ops load.
            </li>
            <li>
              <strong className="text-foreground">CapEx and condition</strong> — roads, electrical,
              water/sewer, pads, amenities. Deferred maintenance shows up as a buyer discount or a
              renegotiation.
            </li>
            <li>
              <strong className="text-foreground">Ops transferability</strong> — who runs check-in,
              maintenance triage, guest issues, and local relationships when you are not on the
              property.
            </li>
          </ol>

          <h3 className="mt-10 font-display text-2xl font-semibold text-primary">
            When SDE vs income / cap-rate approaches fit
          </h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Smaller owner-operated parks</strong> where the buyer
              will replace or perform the owner’s role often start with{" "}
              <strong className="text-foreground">Seller’s Discretionary Earnings (SDE)</strong> — the
              total annual benefit to one full-time owner-operator — then apply risk-aware multiples.
              See{" "}
              <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
                What is SDE?
              </Link>
              .
            </li>
            <li>
              <strong className="text-foreground">Income-property-oriented parks</strong> (more
              stabilized NOI, clearer property economics) often get more weight on{" "}
              <strong className="text-foreground">cap rate / income</strong> approaches: stabilized NOI
              divided by a selected cap rate. ValuRight includes cap rate among its seven methods where
              the category fits. See{" "}
              <Link to="/methodology" className="font-semibold text-accent hover:underline">
                Methodology
              </Link>
              .
            </li>
            <li>
              Most Main Street parks sit somewhere in between. Free Preview runs{" "}
              <strong className="text-foreground">seven methods</strong> appropriate to the business
              category and blends a headline <strong className="text-foreground">planning range</strong>{" "}
              with confidence notes. This page does <strong className="text-foreground">not</strong>{" "}
              publish secret method weights.
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            There is no universal “RV park multiple” that replaces homework. Garbage-in financials and
            undocumented seasonality produce junk ranges.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">What moves the range</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Qualitative factors — not a benchmark table
          </h2>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Occupancy trends</strong> — rising, flat, or soft; one
              strong season does not equal a stable earnings base.
            </li>
            <li>
              <strong className="text-foreground">Seasonality</strong> — how dependent cash flow is on a
              short peak window.
            </li>
            <li>
              <strong className="text-foreground">Owner hours on-site</strong> — if the park slows when
              you leave, buyers price transfer risk.
            </li>
            <li>
              <strong className="text-foreground">Staffing depth</strong> — coverage for front desk,
              grounds, and maintenance without you as the emergency call.
            </li>
            <li>
              <strong className="text-foreground">CapEx backlog</strong> — known deferred work buyers
              will subtract or force into deal structure.
            </li>
            <li>
              <strong className="text-foreground">Utility and infrastructure risk</strong> — aging
              electrical, water/sewer capacity, flood or access issues.
            </li>
            <li>
              <strong className="text-foreground">Reputation / reviews</strong> — guest experience that
              supports (or undermines) rate and occupancy.
            </li>
            <li>
              <strong className="text-foreground">Documentation</strong> — clean P&Ls, occupancy notes,
              add-back support, and a playbook someone else can run.
            </li>
            <li>
              <strong className="text-foreground">Customer / channel concentration</strong> —
              over-reliance on one booking channel or a thin guest base, when that applies.
            </li>
          </ul>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            ValuRight’s <strong className="text-foreground">Health Score</strong> and recommendations
            surface several of these risks early.{" "}
            <strong className="text-foreground">What-if</strong> scenarios let you explore changes (for
            example, reducing owner hours) and see how the{" "}
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
            If you are the only person who can run check-in, triage maintenance, handle problem guests,
            and keep local vendor relationships warm, the park is still a{" "}
            <strong className="text-foreground">job you own</strong> — not only an asset someone else
            can operate.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Buyers often respond with a lower multiple, a longer transition stay, or more
            earnout/holdback — and some walk. That is owner dependence in park language.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Read the full guide:{" "}
            <Link to="/guides/owner-dependence" className="font-semibold text-accent hover:underline">
              Owner dependence: why buyers discount your business
            </Link>
            .
          </p>
          <h3 className="mt-8 font-display text-xl font-semibold text-primary">
            Park-flavored self-check (yes/no)
          </h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>Are you the default on-call for emergencies after hours?</li>
            <li>
              Would a two-week vacation with little phone access break guest experience or occupancy
              ops?
            </li>
            <li>Is there no clear #2 for day-to-day park operations?</li>
            <li>
              Does pricing, vendor know-how, and “how we handle peak season” mostly live in your head?
            </li>
            <li>Are key local relationships (vendors, contractors, regulators) primarily yours?</li>
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
              — seven methods, including cap rate / income where it fits.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                Free Preview for park owners
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
                What to have ready (~15 minutes)
              </h2>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
                <li>
                  Recent <strong className="text-foreground">P&Ls</strong> (ideally multi-year) and a
                  clear picture of owner compensation / add-backs.
                </li>
                <li>
                  Rough <strong className="text-foreground">occupancy / seasonality notes</strong> (even
                  if informal — better than guessing in silence).
                </li>
                <li>
                  Honest <strong className="text-foreground">owner role</strong>: hours on-site, who
                  covers when you are gone.
                </li>
                <li>
                  Known <strong className="text-foreground">CapEx</strong> items or deferred maintenance
                  you would disclose in diligence anyway.
                </li>
                <li>
                  Industry/category: <strong className="text-foreground">RV park / campground</strong>{" "}
                  (select in product if available; otherwise describe in profile fields). Live product
                  maps Campground/RV park under Restaurant/Hospitality with sub-industry “RV park” and
                  income-property category that prefers cap-rate among the seven methods.
                </li>
              </ul>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Free Preview ($0, no credit card):</strong> seven
                valuation methods, Health Score out of 100, prioritized recommendations, what-if, manual
                entry and CSV import.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
                >
                  Start your free valuation <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition"
                >
                  See a sample report
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-primary">
                  Built by an operator who still runs a park
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Paul owns Mountain View RV Resort. ValuRight is the same homework he wanted as an
                  owner: a planning range and a clear view of what buyers discount — not a napkin
                  multiple and not a certified appraisal.
                </p>
              </div>
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
                desc="Including cap rate / income where the category fits — not a single rule of thumb."
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
              q="Is this a certified appraisal of my RV park?"
              a="No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker, or appraiser. It is not a certified appraisal, not tax or legal advice, and not a guaranteed sale price."
            />
            <Faq
              q="How do you value a seasonal campground?"
              a="Seasonality is a risk and cash-flow factor, not a reason to skip homework. Buyers look at earnings quality across the year, peak dependence, and whether ops transfer without you. Enter honest financials and occupancy context; Free Preview blends methods appropriate to the category. Review assumptions with an advisor before you set an asking price."
            />
            <Faq
              q="SDE or cap rate for an RV park?"
              a={
                <>
                  Owner-operated parks often start with SDE. Parks that behave more like income property
                  get more weight on income / cap-rate approaches (stabilized NOI ÷ cap rate). ValuRight
                  shows multiple methods in context — see{" "}
                  <Link to="/methodology" className="font-semibold text-accent hover:underline">
                    Methodology
                  </Link>{" "}
                  and{" "}
                  <Link to="/guides/sde-explained" className="font-semibold text-accent hover:underline">
                    SDE explained
                  </Link>
                  .
                </>
              }
            />
            <Faq q="How long does Free Preview take?" a="About 15 minutes if you have recent financials handy." />
            <Faq
              q="Who is this for?"
              a="Park and campground owners — especially owners 55+ planning the next chapter — who want a planning range and exit-readiness homework before broker or buyer conversations. Not Wall Street models."
            />
            <Faq
              q='Will you show me comps or “typical occupancy” for parks like mine?'
              a="No invented sale comps or occupancy benchmarks on this page. Your planning range comes from your inputs and ValuRight’s methods. Local comps and market occupancy data belong in advisor / broker diligence — label any third-party numbers carefully if you add them later."
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
            Ready to see your park’s planning range?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start Free Preview in minutes — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-md"
            >
              Start your free valuation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:bg-secondary transition"
            >
              See a sample report
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/what-is-my-business-worth" className="font-semibold text-accent hover:underline">
              What is my business worth?
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
                Planning estimates for Main Street owners preparing the next chapter — including park
                and campground operators.
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
