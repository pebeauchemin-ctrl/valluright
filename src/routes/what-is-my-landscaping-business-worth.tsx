import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { FooterEntityLine, FooterSeoLinks, RelatedLinksBlock } from "@/components/SeoLinks";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { ORGANIZATION_REF } from "@/lib/site-entity";

const PAGE_URL = "https://valuright.ai/what-is-my-landscaping-business-worth";
const TITLE = "Landscaping or Lawn Care Business Worth? Free Range | ValuRight";
const META =
  "How landscaping and lawn care businesses are valued: SDE, maintenance contracts, seasonality, equipment, crews, owner dependence. Free range, owners 55+.";
const LINK_CLS = "font-semibold text-accent hover:underline";

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${PAGE_URL}#webpage`,
  name: TITLE,
  headline: "What is my landscaping or lawn care business worth?",
  description: META,
  url: PAGE_URL,
  inLanguage: "en-US",
  datePublished: "2026-10-24",
  dateModified: "2026-10-24",
  author: ORGANIZATION_REF,
  publisher: ORGANIZATION_REF,
  isPartOf: { "@id": "https://valuright.ai/#website" },
  about: ["Landscaping business valuation", "Lawn care business valuation"],
  breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${PAGE_URL}#breadcrumb`,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://valuright.ai/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "What's my business worth?",
      item: "https://valuright.ai/what-is-my-business-worth",
    },
    { "@type": "ListItem", position: 3, name: "Landscaping & lawn care worth", item: PAGE_URL },
  ],
};

// Single source for the visible FAQ and the FAQPage JSON-LD (kept 1:1).
const FAQS: { q: string; a: string }[] = [
  {
    q: "How much is a landscaping business worth?",
    a: "It depends on earnings and risk. Most owner-run landscaping businesses start from Seller's Discretionary Earnings times a risk-adjusted multiple. Recurring contracts, customer mix, equipment condition, crews and owner dependence then move the range.",
  },
  {
    q: "How do you value a lawn care business?",
    a: "Start with three years of clean financials, add back owner pay and personal or one-time costs to get SDE, and list your equipment separately. Then adjust for contract renewal history, route density, seasonality and how well crews run without you.",
  },
  {
    q: "How much can I sell my lawn care business for?",
    a: "No honest page can give you a number without your financials. Buyers pay for transferable earnings: contracted customers who renew, crews that stay, and equipment that won't need replacing right away. Free Preview gives you a planning range from your own numbers.",
  },
  {
    q: "What multiple do landscaping companies sell for?",
    a: "We don't publish one. Multiples depend on size, recurring revenue, profitability, location and financing conditions at the time of sale. Get current figures from a business broker or valuation professional who works with landscaping companies.",
  },
  {
    q: "Are maintenance contracts worth more than install work?",
    a: "Usually buyers see recurring maintenance as steadier than one-time installs or design-build projects, because it is easier to forecast. Show contract start dates, renewals and revenue by line so a buyer can see what repeats.",
  },
  {
    q: "How does seasonality affect a landscaping business's value?",
    a: "Buyers look at cash flow across the full year. A business that earns most of its money in a short season, or depends on snow that may not come, usually carries more risk unless it has steady off-season work.",
  },
  {
    q: "Does my equipment count toward the value?",
    a: "Yes, but it's usually looked at separately from earnings. Buyers check age, hours and condition, and they factor in replacement they'll face soon. An up-to-date equipment list with maintenance records supports your range.",
  },
  {
    q: "Is this a certified appraisal of my landscaping business?",
    a: "No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker or appraiser. It is not a certified appraisal, tax or legal advice, or a guaranteed sale price.",
  },
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${PAGE_URL}#faq`,
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const DRIVERS: [string, string, string][] = [
  [
    "Contract terms and renewals",
    "Written, auto-renewing contracts are easier to forecast and to transfer",
    "Contract list, start dates, renewal and cancellation history",
  ],
  [
    "Route density",
    "Tight routes mean less drive time and more billable hours per crew",
    "Route map, properties per route",
  ],
  [
    "Customer concentration",
    "One HOA, commercial property manager or general contractor can leave and take a large share of revenue",
    "Revenue by top customers for three years",
  ],
  [
    "Commercial vs residential mix",
    "Commercial accounts are often larger and contract-based; residential is spread across more customers. Each carries different risk",
    "Revenue split by commercial and residential",
  ],
  [
    "Crew leads and tenure",
    "Reliable crew leads keep quality steady and customers loyal",
    "Crew roster, hire dates, who leads each crew",
  ],
  [
    "Labor availability",
    "Buyers ask how you staff peak season; reliance on seasonal-worker visa programs adds timing risk",
    "How you hire each season, any visa program use (talk to an attorney for legal questions)",
  ],
  [
    "Licensing",
    "Pesticide, fertilizer or irrigation work may require licenses depending on your state",
    "Licenses held, by whom, expiration dates",
  ],
  [
    "Scheduling or CRM software",
    "Customer and job history a buyer can take over",
    "Software used, whether records export cleanly",
  ],
  [
    "Pricing history",
    "Shows customers accept increases",
    "Price changes by year and customer response",
  ],
  [
    "Reviews and reputation",
    "Supports new sales after you leave",
    "Review profiles, referral sources",
  ],
  [
    "Owner time on the mower vs in the office",
    "The more you run a crew, the more a buyer must replace",
    "A typical week in season and off season",
  ],
];

export const Route = createFileRoute("/what-is-my-landscaping-business-worth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: META },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: META },
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
  component: LandscapingWorthLanding,
});

function Section({
  eyebrow,
  title,
  alt,
  children,
}: {
  eyebrow: string;
  title: string;
  alt?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`border-t border-border/60${alt ? " bg-secondary/40" : ""}`}>
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-primary">{title}</h2>
        <div className="mt-4 space-y-4 text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="text-foreground">{children}</strong>
);

function LandscapingWorthLanding() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={40} withTagline />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-to-value" className="hover:text-foreground transition">
              How to value
            </a>
            <Link
              to="/pricing"
              search={{ checkout: undefined }}
              className="hover:text-foreground transition"
            >
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
                Free Preview · Landscaping &amp; lawn care
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                What is my landscaping or lawn care business worth?
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                A landscaping or lawn care business is usually worth a planning range built from
                Seller's Discretionary Earnings (SDE) times a risk-adjusted multiple, then moved by
                recurring maintenance contracts, customer concentration, seasonality, equipment
                condition, crew stability, and how much the business still depends on you. Install
                and design-build companies with a manager in place may also hear buyers talk about
                EBITDA. ValuRight Free Preview gives you a planning range in about 15 minutes. It is
                not a certified appraisal or a guaranteed sale price.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Last updated: October 24, 2026
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  onClick={trackSignupStart}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-md hover:shadow-lg"
                >
                  Free Preview <ArrowRight className="h-4 w-4" />
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
                Planning estimate for landscaping and lawn care owners 55+. Not a certified
                appraisal, not a guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Landscaping Free Preview
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Seven methods
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold text-primary">
                    Planning range + Health Score for landscaping and lawn care
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    No "typical landscaping" dollar figures or multiples here. Your range comes from
                    your own numbers after you start Free Preview.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      "Choose the category closest to your business in Free Preview and note your service lines in your profile.",
                      "SDE-first Main Street methods among seven approaches",
                      "Health Score out of 100 + prioritized recommendations",
                      "What-if scenarios on owner crew time and contract mix",
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
                Software-generated planning estimate. Review with your CPA or broker before you set
                an asking price.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="how-to-value">
        <Section
          eyebrow="How to value a landscaping business"
          title="How to value a landscaping or lawn care business: 5 steps"
          alt
        >
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <B>Split three years of P&amp;Ls by line.</B> Break out recurring maintenance and
              mowing contracts, enhancements (mulch, cleanups, seasonal color), installs and
              design-build, hardscape, irrigation and snow removal. Then split commercial from
              residential. A buyer reads a business that's mostly contracted maintenance very
              differently from one that's mostly projects.
            </li>
            <li>
              <B>Normalize to SDE.</B> Start with profit and add back your pay, personal use of the
              truck and trailer, family labor paid above what the work is worth, and true one-time
              costs. Don't count cash jobs that weren't reported. Buyers and lenders won't credit
              them.
            </li>
            <li>
              <B>Pick the right lens.</B> Owner-run companies are usually priced on SDE times a
              multiple. Larger, managed companies are often discussed on EBITDA. We don't publish
              multiples. Current figures should come from a broker or valuation professional who
              sees recent landscaping deals.
            </li>
            <li>
              <B>Adjust for risk.</B> Use the drivers table below. Two companies with the same
              earnings can land far apart because of contracts, crews and equipment.
            </li>
            <li>
              <B>Separate what's being sold.</B> Make a separate equipment list with values (mowers,
              trucks, trailers, skid steers, plows, spreaders). Then list customer contracts and
              routes, the yard or shop (owned or leased), and the brand and phone number.
            </li>
          </ol>
          <p>
            See{" "}
            <Link to="/guides/how-to-value-a-small-business" className={LINK_CLS}>
              how small businesses are valued
            </Link>{" "}
            and{" "}
            <Link to="/methodology" className={LINK_CLS}>
              the seven methods
            </Link>{" "}
            ValuRight uses.
          </p>
        </Section>
      </div>

      <Section eyebrow="Revenue mix" title="Recurring maintenance vs one-time installs">
        <p>
          Weekly mowing and seasonal maintenance under contract is the part of a landscaping
          business buyers can count on. The same properties, on the same routes, every week, with
          prices already agreed. That's usually seen as steadier than install and design-build work,
          where every job has to be sold again.
        </p>
        <p>
          Install work still has value. It often pays well, shows off your crews, and turns into
          maintenance customers. But a buyer will ask who sells those jobs. If it's you, walking the
          property with the homeowner, that revenue may not stay after you leave.
        </p>
        <p>
          Written contracts help more than handshake accounts. So does a record of customers
          renewing year after year, and price increases they accepted.
        </p>
      </Section>

      <Section eyebrow="Seasonality" title="Seasonality and snow" alt>
        <p>
          Buyers look at the full year, not the best month. They want to know how you cover payroll
          and equipment payments when the grass stops growing, and whether your best crew leads come
          back each spring.
        </p>
        <p>
          Snow removal can smooth out the winter, and commercial snow contracts can tie a customer
          to you year-round. But it's weather-dependent. A buyer will look at several winters, not
          just a heavy one, and will ask how contracts are priced: per push, per event or seasonal.
          Seasonal contracts usually make the revenue easier to forecast. Per-push income in a light
          winter can look thin.
        </p>
        <p>
          If you run off-season work like holiday lighting, tree work or equipment repair, show it
          by line so a buyer can see it repeat.
        </p>
      </Section>

      <Section eyebrow="Equipment" title="Equipment: asset or liability?">
        <p>
          A landscaping business runs on its equipment, and buyers look at it closely. Newer,
          well-maintained mowers, trucks, trailers and skid steers support your range. Worn-out
          fleet that needs replacing soon means the buyer pays twice: once to you and again at the
          dealer. That usually lowers the range or shows up in the deal terms.
        </p>
        <p>
          Equipment is often discussed separately from goodwill, the value of your customers and
          earnings. Keep a list with each piece's age, hours and maintenance records, and note
          what's financed. Skipping replacements for a few years makes profit look better, but a
          buyer will see it in the equipment list.
        </p>
      </Section>

      <Section eyebrow="What moves the range" title="Landscaping value drivers" alt>
        <p className="text-sm">Qualitative only; not a benchmark table.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-foreground">
                <th className="py-2 pr-4 font-semibold">Driver</th>
                <th className="py-2 pr-4 font-semibold">Why buyers care</th>
                <th className="py-2 font-semibold">What to document</th>
              </tr>
            </thead>
            <tbody>
              {DRIVERS.map(([d, why, doc]) => (
                <tr key={d} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-4 font-medium text-foreground">{d}</td>
                  <td className="py-2 pr-4">{why}</td>
                  <td className="py-2">{doc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          ValuRight's Health Score and recommendations flag several of these early, and what-if
          scenarios show how the planning range may move if you change them. That's model output
          from your inputs, not a promised sale price. More:{" "}
          <Link to="/guides/exit-readiness" className={LINK_CLS}>
            exit readiness and your Health Score
          </Link>
          .
        </p>
      </Section>

      <Section eyebrow="Selling" title="How much can I sell my lawn care business for?">
        <p>
          Nobody can give you an honest number without your financials. What we can tell you is what
          buyers pay for: contracted customers who renew, crews that stay after you leave, routes
          that make sense, and equipment that won't need replacing next season. They pay less for
          revenue tied to your personal relationships, one big customer, or a winter that might not
          come.
        </p>
        <p>
          Buyers include other landscaping companies adding routes, larger groups buying in your
          area, a crew lead or manager who wants to own, and first-time buyers. Read{" "}
          <Link to="/guides/how-to-sell-my-business" className={LINK_CLS}>
            how to sell my business
          </Link>{" "}
          and{" "}
          <Link to="/guides/exit-strategy-retirement" className={LINK_CLS}>
            building an exit strategy for retirement
          </Link>
          .
        </p>
      </Section>

      <Section eyebrow="Get ready" title="What a buyer will ask for" alt>
        <ul className="list-disc space-y-2 pl-5">
          <li>Three years of P&amp;Ls and tax returns</li>
          <li>Customer and contract list with start dates and renewal history</li>
          <li>
            Revenue by line (maintenance, enhancements, installs, hardscape, irrigation, snow) and
            by commercial vs residential
          </li>
          <li>Route map</li>
          <li>Equipment list with age, hours, maintenance records and any loans</li>
          <li>Crew roster with roles and hire dates</li>
          <li>Licenses and insurance certificates</li>
          <li>Accounts receivable aging</li>
          <li>Yard or shop lease (term, renewal options, whether it can be assigned)</li>
        </ul>
      </Section>

      <Section eyebrow="Owner dependence" title="Your company, or your crew?">
        <p>
          If you still run a crew, sell every install, and are the person every property manager
          calls, a buyer is buying your job. They answer with a lower price, a longer transition, or
          more of the price tied to how many contracts stay. Read{" "}
          <Link to="/guides/owner-dependence" className={LINK_CLS}>
            owner dependence: why buyers discount your business
          </Link>
          .
        </p>
        <h3 className="pt-4 font-display text-xl font-semibold text-primary">
          Landscaping self-check (yes/no)
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Do you run a crew most days in season?</li>
          <li>Do commercial and HOA accounts deal only with you?</li>
          <li>Would two weeks away in May stop sales, scheduling or estimating?</li>
          <li>Are routes and pricing mostly in your head?</li>
          <li>Would your crew leads leave if you did?</li>
        </ol>
        <p>
          More yeses mean transferability is your first project, before you settle on an asking
          price.
        </p>
      </Section>

      <Section
        eyebrow="Free Preview for landscaping owners"
        title="What to have ready for Free Preview (about 15 minutes)"
        alt
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>Recent P&amp;Ls and a clear list of owner pay and add-backs</li>
          <li>A rough revenue split by line and by commercial vs residential</li>
          <li>Your honest role: hours on crews, estimating, sales and office</li>
          <li>Known equipment replacements you'd disclose anyway</li>
          <li>
            Choose the category closest to your business and describe your service lines in your
            profile.
          </li>
        </ul>
        <p>
          <B>Free Preview ($0, no credit card):</B> seven valuation methods, Health Score out of
          100, prioritized recommendations, what-if scenarios, manual entry and CSV import.
        </p>
        <p className="text-sm">
          Free Preview $0 · Essentials $99/mo · Exit Ready $249/mo. See{" "}
          <Link to="/pricing" search={{ checkout: undefined }} className={LINK_CLS}>
            Pricing
          </Link>
          . Paid buttons: <B>Start Essentials</B> / <B>Start Exit Ready</B>.
        </p>
        <p>
          Other home-services owners: see{" "}
          <Link to="/what-is-my-hvac-business-worth" className={LINK_CLS}>
            what an HVAC business is worth
          </Link>
          . Running more than one kind of business? Start with the{" "}
          <Link to="/what-is-my-business-worth" className={LINK_CLS}>
            general worth page
          </Link>
          .
        </p>
      </Section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
              Common questions
            </h2>
          </div>
          <div className="space-y-6" data-faq-list>
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-card p-5" data-faq-item>
                <h3 className="font-display text-lg font-semibold text-primary">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/guides/sde-explained" className={LINK_CLS}>
              What is SDE?
            </Link>
            {" · "}
            <Link to="/methodology" className={LINK_CLS}>
              Methodology
            </Link>
            {" · "}
            <Link to="/guides/how-to-sell-my-business" className={LINK_CLS}>
              How to sell my business
            </Link>
          </p>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <FileCheck className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary">
            Ready to see your landscaping or lawn care business's planning range?
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
            <Link to="/what-is-my-business-worth" className={LINK_CLS}>
              What is my business worth?
            </Link>
            <Link to="/what-is-my-hvac-business-worth" className={LINK_CLS}>
              What is my HVAC business worth?
            </Link>
            <Link to="/what-is-my-dental-practice-worth" className={LINK_CLS}>
              What is my dental practice worth?
            </Link>
            <Link to="/what-is-my-rv-park-worth" className={LINK_CLS}>
              What is my RV park worth?
            </Link>
            <Link to="/guides/exit-readiness" className={LINK_CLS}>
              Exit readiness
            </Link>
            <Link to="/guides/owner-dependence" className={LINK_CLS}>
              Owner dependence
            </Link>
            <Link to="/guides/sde-explained" className={LINK_CLS}>
              SDE explained
            </Link>
            <Link to="/methodology" className={LINK_CLS}>
              Methodology
            </Link>
            <Link to="/guides" className={LINK_CLS}>
              Guides
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{VALUATION_DISCLAIMER_SHORT}</p>
        </div>
      </section>

      <RelatedLinksBlock
        current="/what-is-my-landscaping-business-worth"
        exclude={["/what-is-my-plumbing-business-worth"]}
      />

      <footer className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <BrandLogo size={36} variant="onDark" />
              <FooterEntityLine />
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
              <FooterSeoLinks />
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
