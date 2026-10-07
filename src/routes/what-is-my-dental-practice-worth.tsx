import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, ShieldCheck, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

const PAGE_URL = "https://valuright.ai/what-is-my-dental-practice-worth";
const PAGE_TITLE = "What Is My Dental Practice Worth? Free Planning Range | ValuRight";
const PAGE_DESCRIPTION =
  "Estimate a planning range for your dental practice — collections, payer mix, hygiene recall, owner-dentist dependence, and DSO vs private buyers. For owners 55+. Not an appraisal.";

// Single source of truth: visible FAQ and FAQPage JSON-LD render from the same strings.
const FAQS: { q: string; a: string }[] = [
  {
    "q": "Is this a certified appraisal of my dental practice?",
    "a": "No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, practice broker, attorney, or appraiser. It is not a certified appraisal, not tax or legal advice, and not a guaranteed sale price."
  },
  {
    "q": "How do buyers value a dental practice?",
    "a": "Most owner-dentist practices start from an honest Seller's Discretionary Earnings (SDE) base built on collections, not production, then adjust for risk: payer mix, hygiene recall strength, how much of the dentistry depends on you, the lease and equipment, and how well the patient base is likely to stay after a transition. There is no universal multiple on this page. Enter your numbers in Free Preview and review assumptions with an advisor before you set an asking price."
  },
  {
    "q": "Should I use production or collections when I estimate value?",
    "a": "Collections. Production is what you scheduled and billed; collections are what actually came in after insurance adjustments, write-offs, and unpaid balances. Buyers and lenders generally build the earnings story from collected revenue, so start Free Preview with collections and be ready to explain any big gap between the two."
  },
  {
    "q": "Does my insurance and fee-for-service mix affect value?",
    "a": "Often, yes. Buyers look at how dependent the practice is on specific insurance plans, how fee schedules affect margins, and how fee-for-service patients might respond to a new dentist. This page does not invent a value adjustment for any mix. Describe yours honestly and use Free Preview what-if and advisor diligence to explore it."
  },
  {
    "q": "Will a DSO and a private dentist buyer see my practice differently?",
    "a": "They can. A private dentist buying to own and practice often focuses on whether patients and staff will stay with a new doctor and whether the practice fits their clinical style. A dental service organization (DSO) or group buyer often focuses on systems, scale, and how the practice fits a larger platform, and may propose different deal structures or ask you to keep working for a period. Neither is automatically better. Talk through options with your CPA, attorney, and a practice broker."
  },
  {
    "q": "How long does Free Preview take?",
    "a": "About 15 minutes if you have recent financials handy."
  },
  {
    "q": "Will you show me comps or typical dental practice multiples?",
    "a": "No invented sale comps, collection percentages, or industry-average multiples on this page. Your planning range comes from your inputs and ValuRight's methods. Local comps belong in advisor or practice-broker diligence."
  },
  {
    "q": "Free Preview vs a practice broker or appraiser?",
    "a": "Free Preview is homework: a planning range, Health Score, and what-if scenarios so you walk into advisor conversations with clearer questions. It does not replace a CPA, practice broker, attorney, or certified appraisal when a formal opinion, lender, or deal process requires one."
  }
];

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: PAGE_TITLE,
  headline: "What is my dental practice worth?",
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  datePublished: "2026-10-07",
  dateModified: "2026-10-07",
  author: { "@type": "Organization", name: "ValuRight" },
  publisher: {
    "@type": "Organization",
    name: "ValuRight",
    logo: { "@type": "ImageObject", url: "https://valuright.ai/favicon.svg" },
  },
  mainEntityOfPage: PAGE_URL,
  about: { "@type": "Thing", name: "Dental practice valuation planning estimate" },
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
    { "@type": "ListItem", position: 3, name: "What is my dental practice worth?", item: PAGE_URL },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export const Route = createFileRoute("/what-is-my-dental-practice-worth")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(webPageLd) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      { type: "application/ld+json", children: JSON.stringify(faqLd) },
    ],
  }),
  component: DentalWorthLanding,
});

const linkCls = "font-semibold text-accent hover:underline";
const S = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-foreground">{children}</strong>
);

function PrimaryCtas({ size = "lg" }: { size?: "lg" | "sm" }) {
  const pad = size === "lg" ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm";
  return (
    <>
      <Link
        to="/auth"
        search={{ mode: "signup" }}
        onClick={trackSignupStart}
        className={`inline-flex items-center gap-2 rounded-md bg-accent ${pad} font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-md`}
      >
        Start your free valuation <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        to="/demo"
        onClick={trackDemoClick}
        className={`inline-flex items-center gap-2 rounded-md border border-border bg-card ${pad} font-semibold text-foreground hover:bg-secondary transition`}
      >
        See a sample
      </Link>
    </>
  );
}

function DentalWorthLanding() {
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
                Free Preview · Dental practices
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                What is my dental practice worth?
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Your dental practice is worth a <S>planning range</S>, not one napkin rule of thumb.
                Buyers usually start from <S>earnings quality</S> and <S>transfer risk</S> — collected
                revenue (not just production), payer mix between insurance plans and fee-for-service,
                how strong and steady hygiene recall is, the lease and equipment, and how much of the
                dentistry and patient loyalty still depends on <S>you</S> — then apply Main Street
                methods built around <S>Seller’s Discretionary Earnings (SDE)</S> for owner-dentist
                practices. ValuRight Free Preview estimates that range in about 15 minutes. It is a{" "}
                <S>software-generated planning estimate</S> for owners 55+, <S>not</S> a certified
                appraisal or a guaranteed sale price.
              </p>
              <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                See a planning range, a Health Score for what may be holding the number down, and
                what-if scenarios — useful homework before you talk to a CPA, practice broker, or buyer
                about your practice.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Last updated: October 7, 2026
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <PrimaryCtas />
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                Planning estimate for dental practice owners 55+ — not Wall Street, not a certified
                appraisal, not a guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Dental Free Preview
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Seven methods
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold text-primary">
                    Planning range + Health Score for dental practices
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    No invented “typical practice” dollar figures, collection ratios, or multiples here.
                    Your range comes from your inputs after you start Free Preview.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      "Select dental / healthcare practice in Free Preview when available",
                      "SDE-first Main Street methods among seven approaches",
                      "Health Score out of 100 + prioritized recommendations",
                      "What-if scenarios on owner chair time and transferability",
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
                Software-generated planning estimate. Enter business financials only — no patient
                records. Review with your CPA or practice broker before you set an asking price.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-buyers-look" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            How buyers look at dental practices
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Collections story + patients who stay without you
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Dental buyers care about the <S>earnings story</S> and whether patients, staff, and
            referrals stay when a new dentist walks in.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">In plain terms, diligence usually covers:</p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <S>Collections vs production</S> — production is what was scheduled and billed;
              collections are what actually arrived after insurance adjustments, write-offs, and unpaid
              balances. Buyers build on collections. A large or unexplained gap between the two is a
              question you want answered before they ask it.
            </li>
            <li>
              <S>Payer mix</S> — how much revenue comes from specific insurance plans (and their fee
              schedules) vs fee-for-service patients. Mix affects margins, how much a new owner can
              change, and how patients may react to a transition.
            </li>
            <li>
              <S>Hygiene and recall</S> — an active, well-scheduled hygiene program and steady recall
              suggest repeat patients who come back for reasons beyond one doctor. A thin or neglected
              recall system reads as patient-base risk.
            </li>
            <li>
              <S>Provider dependence</S> — how much of the dentistry (especially higher-value
              procedures) is done by you vs associates or hygienists, and whether associates are likely
              to stay.
            </li>
            <li>
              <S>Facility, lease, and equipment</S> — remaining lease term and assignability, operatory
              count and condition, and equipment or technology that will need replacing soon.
            </li>
            <li>
              <S>Patient base transferability</S> — active patient records, new-patient flow, referral
              sources, reputation, and team continuity (front desk, assistants, hygienists) that help
              patients stay through a change in ownership.
            </li>
          </ol>

          <h3 className="mt-10 font-display text-2xl font-semibold text-primary">
            When SDE is the right starting point
          </h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              Most <S>owner-dentist practices</S> where the buyer will step into or replace the owner’s
              clinical and management role start with <S>Seller’s Discretionary Earnings (SDE)</S> — the
              total annual benefit to one full-time owner-operator — then apply risk-aware methods. See{" "}
              <Link to="/guides/sde-explained" className={linkCls}>
                What is SDE?
              </Link>
              .
            </li>
            <li>
              Larger multi-provider practices with associate depth and cleaner add-backs may also hear
              EBITDA in broker or group-buyer conversations — still start with an honest earnings base.
              Free Preview runs <S>seven methods</S> appropriate to the business category and blends a
              headline <S>planning range</S> with confidence notes. This page does <S>not</S> publish
              secret method weights or “typical dental multiples.”
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            There is no universal “dental practice rule of thumb” that replaces homework. Production-only
            numbers and undocumented owner add-backs produce junk ranges.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Buyer types</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Private dentist or DSO — different questions
          </h2>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <S>Private dentist buyers</S> (an associate, a nearby dentist, or a younger dentist buying
              their first practice) often focus on whether patients and staff will stay with a new
              doctor, whether the clinical style fits, and whether the practice can support financing.
              They may ask you to stay on for a transition period to introduce patients.
            </li>
            <li>
              <S>Dental service organizations (DSOs) and group buyers</S> often focus on systems, scale,
              location fit, and how the practice plugs into a larger platform. Offers may be structured
              differently — for example, asking you to keep practicing for a period or tying part of the
              price to future results.
            </li>
          </ul>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Neither buyer type is automatically better. The right path depends on your timeline, how
            long you want to keep practicing, and how you feel about your team and patients after the
            sale. This page does not publish DSO deal statistics. Talk through structure with your CPA,
            attorney, and a practice broker. More on paths:{" "}
            <Link to="/guides/how-to-sell-my-business" className={linkCls}>
              How to sell my business
            </Link>{" "}
            and{" "}
            <Link to="/guides/exit-strategy-retirement" className={linkCls}>
              Exit strategy for retirement
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">What moves the range</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Qualitative factors — not a benchmark table
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            These factors commonly shift a dental practice’s planning range (
            <S>qualitative — not a benchmark table, not comps</S>):
          </p>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <S>Collections quality</S> — clean, consistent collected revenue and a documented
              explanation of adjustments and write-offs.
            </li>
            <li>
              <S>Payer mix and fee schedules</S> — concentration in a few insurance plans vs a healthy
              fee-for-service base.
            </li>
            <li>
              <S>Hygiene program strength</S> — scheduled recall, hygienist tenure, and how full the
              hygiene schedule runs.
            </li>
            <li>
              <S>Owner-dentist chair time</S> — if collections soften when you cut days, buyers price
              transfer risk.
            </li>
            <li>
              <S>Associate and team continuity</S> — associate commitment, hygienist and front-desk
              tenure, and agreements in place.
            </li>
            <li>
              <S>Lease</S> — term remaining, renewal options, and whether it can be assigned to a buyer.
            </li>
            <li>
              <S>Equipment and technology</S> — age and condition of chairs, imaging, and
              practice-management systems; deferred replacements buyers will subtract.
            </li>
            <li>
              <S>New-patient flow and reputation</S> — referral sources and reviews that support a steady
              patient base.
            </li>
            <li>
              <S>Documentation</S> — clean P&amp;Ls, add-back support, and office systems someone else
              can run.
            </li>
          </ul>
          <p className="mt-6 text-muted-foreground leading-relaxed">
            ValuRight’s <S>Health Score</S> and recommendations surface several of these risks early.{" "}
            <S>What-if</S> scenarios let you explore changes (for example, reducing owner chair days or
            building associate coverage) and see how the planning range may move — model output from
            your inputs, not a promised sale-price lift. More on readiness:{" "}
            <Link to="/guides/exit-readiness" className={linkCls}>
              Exit readiness &amp; Health Score
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Owner dependence</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Your practice — or your patients’ dentist?
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            If you do most of the higher-value dentistry, patients book around your schedule, referrals
            come to you by name, and the team runs everything through you, the practice is still a job
            you own — not only an asset someone else can step into.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Buyers often respond with a lower price, a longer transition, or more of the price tied to
            how many patients stay — and some walk. That is owner dependence in dental language.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Read the full guide:{" "}
            <Link to="/guides/owner-dependence" className={linkCls}>
              Owner dependence: why buyers discount your business
            </Link>
            .
          </p>
          <h3 className="mt-8 font-display text-xl font-semibold text-primary">
            Dental-flavored self-check (yes/no)
          </h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>Do most patients ask for you by name, and would many hesitate to see another dentist?</li>
            <li>Would two weeks away with no associate coverage close the schedule outside hygiene?</li>
            <li>Is there no associate or partner who could carry the clinical load during a transition?</li>
            <li>
              Do fee decisions, insurance-plan participation, and vendor relationships live mostly in
              your head?
            </li>
            <li>Do specialist and referral relationships run through you personally?</li>
          </ol>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            More yeses → treat transferability as a workstream before you fall in love with an asking
            price.
          </p>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Bridge</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
            Get the earnings base honest first
          </h2>
          <ul className="mt-6 space-y-3 text-muted-foreground leading-relaxed">
            <li>
              <Link to="/guides/sde-explained" className={linkCls}>
                What is SDE?
              </Link>{" "}
              — Seller’s Discretionary Earnings for owner-operated Main Street businesses, including
              owner-dentist practices.
            </li>
            <li>
              <Link to="/guides/how-to-value-a-small-business" className={linkCls}>
                How to value a small business
              </Link>{" "}
              — SDE, multiples, and what moves the range.
            </li>
            <li>
              <Link to="/what-is-my-business-worth" className={linkCls}>
                What is my business worth?
              </Link>{" "}
              — the general Free Preview worth hub (any Main Street category).
            </li>
            <li>
              <Link to="/methodology" className={linkCls}>
                Methodology
              </Link>{" "}
              — seven methods in plain English.
            </li>
            <li>
              <Link to="/guides/exit-readiness" className={linkCls}>
                Exit readiness &amp; Health Score
              </Link>{" "}
              — what buyers mean by ready to transfer.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                Free Preview for dental owners
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
                What to have ready (~15 minutes)
              </h2>
              <ul className="mt-6 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
                <li>
                  Recent <S>P&amp;Ls</S> (ideally multi-year) built on <S>collections</S>, plus a clear
                  picture of owner compensation / add-backs.
                </li>
                <li>
                  Rough <S>payer mix</S> notes (insurance plans vs fee-for-service) — even informal notes
                  beat guessing in silence.
                </li>
                <li>
                  Honest <S>owner role</S>: chair days per week, which procedures only you do, and who
                  covers when you are out.
                </li>
                <li>
                  <S>Lease</S> basics (term remaining, renewal options) and known equipment or technology
                  replacements you would disclose in diligence anyway.
                </li>
                <li>
                  Industry/category: <S>dental practice</S> (select in product if available; otherwise
                  describe in profile fields).
                </li>
                <li>
                  <S>Business financials only</S> — do not upload patient records or charts.
                </li>
              </ul>
              <p className="mt-6 text-muted-foreground leading-relaxed">
                <S>Free Preview ($0, no credit card):</S> seven valuation methods, Health Score out of
                100, prioritized recommendations, what-if, manual entry and CSV import.
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Free Preview $0 · Essentials $99/mo · Exit Ready $249/mo — see{" "}
                <Link to="/pricing" search={{ checkout: undefined }} className={linkCls}>
                  Pricing
                </Link>
                .
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <PrimaryCtas size="sm" />
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <Feature
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Health Score"
                desc={
                  <>
                    See what may be holding the number down — owner chair time, team continuity,
                    documentation. Deep dive:{" "}
                    <Link to="/guides/exit-readiness" className={linkCls}>
                      Exit readiness
                    </Link>
                    .
                  </>
                }
              />
              <Feature
                icon={<TrendingUp className="h-5 w-5" />}
                title="Seven methods"
                desc="SDE-first Main Street methods appropriate to the category — not a single rule of thumb, and not invented dental multiples."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-primary">Common questions</h2>
          </div>
          <div className="space-y-6">
            {FAQS.map((f) => (
              <Faq key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Helpful links:{" "}
            <Link to="/guides/sde-explained" className={linkCls}>
              What is SDE?
            </Link>{" "}
            ·{" "}
            <Link to="/methodology" className={linkCls}>
              Methodology
            </Link>{" "}
            ·{" "}
            <Link to="/guides/how-to-sell-my-business" className={linkCls}>
              How to sell my business
            </Link>
          </p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <FileCheck className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary">
            Ready to see your dental practice’s planning range?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start your free valuation in minutes — no credit card required.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <PrimaryCtas />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/what-is-my-business-worth" className={linkCls}>
              What is my business worth?
            </Link>
            <Link to="/what-is-my-hvac-business-worth" className={linkCls}>
              What is my HVAC business worth?
            </Link>
            <Link to="/what-is-my-rv-park-worth" className={linkCls}>
              What is my RV park worth?
            </Link>
            <Link to="/guides/exit-readiness" className={linkCls}>
              Exit readiness
            </Link>
            <Link to="/guides/owner-dependence" className={linkCls}>
              Owner dependence
            </Link>
            <Link to="/guides/sde-explained" className={linkCls}>
              SDE explained
            </Link>
            <Link to="/methodology" className={linkCls}>
              Methodology
            </Link>
            <Link to="/guides" className={linkCls}>
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
                Planning estimates for Main Street owners preparing the next chapter — including dental
                practice owners.
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

