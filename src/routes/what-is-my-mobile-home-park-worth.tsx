import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { FooterEntityLine, FooterSeoLinks, RelatedLinksBlock } from "@/components/SeoLinks";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { ORGANIZATION_REF } from "@/lib/site-entity";
import { pageMeta } from "@/lib/page-meta";

const PAGE_URL = "https://valuright.ai/what-is-my-mobile-home-park-worth";
const TITLE = "What Is My Mobile Home Park Worth? Free Planning Range | ValuRight";
const META =
  "How mobile home parks are valued: NOI and cap rate, lot rent, occupancy, park-owned homes, utilities and infrastructure. Free range for owners 55+.";
// Ship date: re-bump all three (JSON-LD, visible line, sitemap lastmod) on merge day if merged later.
const SHIP_DATE_ISO = "2026-11-24";
const SHIP_DATE_LABEL = "November 24, 2026";
const LINK_CLS = "font-semibold text-accent hover:underline";
// Page disclaimer (brief rule 7): shown once in the body.
const PAGE_DISCLAIMER =
  "Software-generated planning estimate only. Not a certified appraisal, tax advice, legal advice, investment advice, or guaranteed sale price.";
// [CONFIRM WITH CTO: industry list] resolved: Free Preview's industry picker (INDUSTRY_OPTIONS in
// src/lib/valuation.ts) has no mobile home park option, so the brief's fallback wording ships.
// ("Mobile home park" exists only as a Settings subtype under the real-estate category.)
const INDUSTRY_PICK_CARD =
  "Choose the closest real-estate or property category in Free Preview and note that you own a mobile home park in your profile.";
const INDUSTRY_PICK_READY =
  "Choose the closest real-estate or property category and note that you own a mobile home park in your profile.";

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${PAGE_URL}#webpage`,
  name: TITLE,
  headline: "What is my mobile home park worth?",
  description: META,
  url: PAGE_URL,
  inLanguage: "en-US",
  datePublished: SHIP_DATE_ISO,
  dateModified: SHIP_DATE_ISO,
  author: ORGANIZATION_REF,
  publisher: ORGANIZATION_REF,
  isPartOf: { "@id": "https://valuright.ai/#website" },
  about: ["Mobile home park valuation"],
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
    { "@type": "ListItem", position: 3, name: "Mobile home park worth", item: PAGE_URL },
  ],
};

// Single source for the visible FAQ and the FAQPage JSON-LD (kept 1:1).
const FAQS: { q: string; a: string }[] = [
  {
    q: "How much is a mobile home park worth?",
    a: "It depends on net operating income and risk. Most stabilized parks are valued on NOI divided by a market cap rate. Occupancy, lot rent, park-owned homes, utilities and infrastructure condition then move the range up or down.",
  },
  {
    q: "How do you value a mobile home park?",
    a: "Start with the rent roll and three years of financials, then build a true NOI that includes a manager cost, real repairs and reserves. Divide by a cap rate that fits the park's risk and adjust for utilities, infrastructure and how well it runs without you.",
  },
  {
    q: "What is a good cap rate for a mobile home park?",
    a: "We don't publish cap rates. They change with interest rates, location, park size, utility setup and condition. Get current figures from a broker, lender or appraiser who works with manufactured housing communities.",
  },
  {
    q: "Are park-owned homes valued the same as lot rent?",
    a: "Usually not. Buyers often see lot rent from tenant-owned homes as steadier income. Park-owned homes add rent but also repairs, turnover and management, so show them separately with their own income and costs.",
  },
  {
    q: "Do utilities and septic affect mobile home park value?",
    a: "Yes. Private water or sewer systems, master-metered utilities without bill-backs, and aging lines all raise a buyer's risk and future costs. City utilities, direct billing and documented repairs usually make a park easier to sell and finance.",
  },
  {
    q: "Is SDE or NOI used to value a mobile home park?",
    a: "Stabilized parks are usually valued on NOI and a cap rate, like income property. Very small parks where the owner does all the work may also be looked at on Seller's Discretionary Earnings. ValuRight shows several methods side by side.",
  },
  {
    q: "Do residents have a right to buy the park before I sell?",
    a: "In some states, residents must get notice or a chance to make an offer before a park is sold. Rules vary by state and sometimes by city, so check with a local attorney early in your planning.",
  },
  {
    q: "Is this a certified appraisal of my mobile home park?",
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
    "Occupancy and vacant lots",
    "Empty lots earn nothing today and must be filled",
    "Lot-by-lot occupancy history and move-ins/move-outs",
  ],
  [
    "Lot rent vs local market",
    "Sets current income and how much room is left",
    "Rent roll, rent history, notice letters",
  ],
  [
    "Tenant-owned vs park-owned mix",
    "Park-owned homes add work and turnover",
    "List of park-owned homes with age, condition and titles",
  ],
  [
    "Utility setup and bill-back",
    "Unbilled utilities come straight out of NOI",
    "Utility bills, metering setup, bill-back policy",
  ],
  [
    "Water and sewer type and age",
    "Private systems and old lines mean future costs",
    "System type, test results, inspections, repair records",
  ],
  [
    "Roads, drainage and lighting",
    "Deferred work becomes the buyer's bill",
    "Capital spending history, known issues",
  ],
  [
    "Lot count, density and expansion land",
    "Room to grow can add value if it's allowed",
    "Site plan or survey, zoning letters",
  ],
  [
    "Collections and delinquencies",
    "Rent that isn't collected isn't income",
    "Aging report, collection and eviction history",
  ],
  [
    "Rent-control or resident-notice rules",
    "Can limit rent changes or affect sale timing",
    "Notes from your attorney on local and state rules",
  ],
  [
    "Zoning and legal non-conforming status",
    "Affects what can be rebuilt or expanded",
    "Zoning confirmation, permits, licenses",
  ],
  [
    "Environmental items",
    "Old tanks or failing septic worry lenders",
    "Any reports, tank records, septic inspections",
  ],
  [
    "Manager in place vs owner doing the work",
    "A park that needs you is worth less to a buyer",
    "Duties list, manager agreement, written procedures",
  ],
];

export const Route = createFileRoute("/what-is-my-mobile-home-park-worth")({
  head: () => ({
    meta: pageMeta({
      title: TITLE,
      description: META,
      url: PAGE_URL,
    }),
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(webPageLd) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      { type: "application/ld+json", children: JSON.stringify(faqLd) },
    ],
  }),
  component: MobileHomeParkWorthLanding,
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

function MobileHomeParkWorthLanding() {
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
                Free Preview · Mobile home parks
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                What is my mobile home park worth?
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                A mobile home park is usually worth its net operating income (lot rent and other
                income minus real operating costs) divided by a market cap rate, then adjusted for
                occupancy, park-owned homes, utility setup, infrastructure condition and how much
                the park depends on you. This page is for owners of a mobile home park or
                manufactured housing community who are thinking about selling the park, not for
                selling a single home. ValuRight Free Preview gives you a planning range in about 15
                minutes. It is not a certified appraisal or a guaranteed sale price.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Last updated: {SHIP_DATE_LABEL}
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
                Planning estimate for mobile home park owners 55+. Not a certified appraisal, not
                tax or legal advice, and not a guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Mobile home park Free Preview
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Seven methods
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold text-primary">
                    Planning range + Health Score for mobile home parks
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    No "typical park" dollar figures, cap rates or multiples here. Your range comes
                    from your own numbers after you start Free Preview.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      INDUSTRY_PICK_CARD,
                      "Income and cap-rate methods among seven approaches",
                      "Health Score out of 100 + prioritized recommendations",
                      "What-if scenarios on occupancy, lot rent and owner hours",
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
                Software-generated planning estimate. Review with your CPA, broker or attorney
                before you set an asking price. Not tax or legal advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="how-to-value">
        <Section
          eyebrow="How to value a mobile home park"
          title="How to value a mobile home park: 5 steps"
          alt
        >
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <B>Pull the rent roll and three years of P&amp;Ls.</B> Buyers start with the lots, not
              the total. List every lot, whether it's occupied, who owns the home on it, and the lot
              rent each one pays. Then show other income on its own lines: rent from park-owned
              homes, utility bill-backs, storage, laundry and late fees. If your books lump these
              together, your bank deposits and rent ledger can usually rebuild the split.
            </li>
            <li>
              <B>Build a true net operating income (NOI).</B> Net operating income is what the park
              earns after real operating costs, before loan payments. Add a real manager cost if you
              manage the park yourself, because a buyer will have to pay someone. Include real
              repairs and a reserve for future ones, insurance, utilities the park pays, and
              property tax as a buyer would face it. In some places a sale can change the property
              tax assessment, so ask your county or a CPA how it works where you are. Take out your
              personal costs and true one-time items, and keep a receipt or a clear note for each.
            </li>
            <li>
              <B>Pick the right lens.</B> Most stabilized parks are valued like income property: NOI
              divided by a market cap rate. Very small parks where the owner does all the work may
              also be looked at on Seller's Discretionary Earnings (SDE), like an owner-run
              business. We don't publish cap rates or multiples. Current figures should come from a
              broker, lender or appraiser who works with manufactured housing communities.
            </li>
            <li>
              <B>Adjust for risk.</B> Occupancy, the mix of tenant-owned and park-owned homes,
              utility setup, infrastructure age and how much the park depends on you all move the
              range. The drivers table below shows what buyers check and what to have on paper.
            </li>
            <li>
              <B>Be clear about what's being sold.</B> A park sale can include the land, roads and
              utility lines, any park-owned homes, rental agreements, the park name and its records.
              Most of the value usually sits in the real estate and the income it produces, while
              some buyers and lenders also look at the operating business. How the price is split
              affects taxes and financing, so work out the details with a CPA and an attorney.
            </li>
          </ol>
        </Section>
      </div>

      <Section eyebrow="Cap rate basics" title="How cap rate and NOI set the value">
        <p>
          The idea is simple even without numbers. Value goes up when NOI goes up. Value goes down
          when the cap rate goes up, and a buyer uses a higher cap rate when they see more risk:
          empty lots, old water lines, rent that's hard to collect, or a park that only runs because
          you're there every day.
        </p>
        <p>
          That's also why every real expense left off your P&amp;L matters. When a buyer finds a
          cost you didn't count, like a manager you never paid or repairs you put off, it lowers
          NOI, and lower NOI means a lower price. Counting those costs yourself, before a buyer
          does, keeps the conversation on your terms.
        </p>
      </Section>

      <Section eyebrow="Home ownership mix" title="Tenant-owned homes vs park-owned homes" alt>
        <p>
          Buyers usually see lot rent from tenant-owned homes as steadier income. The resident owns
          the home, pays to maintain it, and moving it is costly, so they tend to stay. Park-owned
          homes add rent, but they also bring repairs, turnover, vacancy and more management work.
        </p>
        <p>
          Show the two separately. Give park-owned homes their own income and expense lines, a list
          with each home's age, condition and title status, and a repair reserve. A buyer who can
          see the park-owned homes clearly is less likely to discount the whole park for them.
        </p>
      </Section>

      <Section eyebrow="Lot rent" title="Lot rent, occupancy and below-market rent">
        <p>
          If your lot rent is below what similar parks nearby charge, a buyer may see upside. But
          buyers rarely pay you in full for upside they'll have to create themselves, with the work
          and resident pushback that raising rent can bring. They pay mostly for the income that's
          there today.
        </p>
        <p>
          Keep a clear rent history: what each lot pays, when rent last changed, and how much notice
          residents received. Rules on rent increases and notice differ by state and sometimes by
          city, so confirm what applies to your park with a local attorney before you plan any
          change around a sale.
        </p>
        <p>
          Vacant lots work the same way. A buyer may value the chance to fill them, but they won't
          treat empty lots as income until someone fills them.
        </p>
      </Section>

      <Section
        eyebrow="Utilities & infrastructure"
        title="Utilities and infrastructure: the hidden value swing"
        alt
      >
        <p>
          Two parks with the same rent can be worth very different amounts because of what's
          underground. Buyers and lenders look closely at:
        </p>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <B>Water and sewer source.</B> City water and sewer usually mean less risk than a
            private well, private treatment system or septic.
          </li>
          <li>
            <B>Metering and billing.</B> Direct-billed or submetered utilities, or a bill-back
            already in place, keep utility costs from eating NOI. Master-metered utilities the park
            pays without bill-backs push costs onto the park.
          </li>
          <li>
            <B>Age and condition.</B> The age of water lines, sewer lines, electrical service and
            roads, and any known leaks, failures or open repairs.
          </li>
        </ul>
        <p>
          You don't need to fix everything before you sell. You do need to know what you have, write
          it down, and keep records of past repairs. Surprises found in inspection hurt price more
          than issues you disclosed up front.
        </p>
      </Section>

      <Section eyebrow="Value drivers" title="What moves a mobile home park's value">
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
      </Section>

      <Section eyebrow="Common mistakes" title="Add-backs and traps that cost park owners" alt>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <B>No manager cost.</B> If you manage the park yourself for free, NOI looks higher than
            a buyer will see. Put in a realistic manager cost before you talk to anyone.
          </li>
          <li>
            <B>Deferred infrastructure.</B> Repairs you've put off don't disappear. A buyer will
            price them in, usually at their own estimate.
          </li>
          <li>
            <B>Counting vacant-lot "potential" as income.</B> Projected rent from empty lots isn't
            income until a home is on the lot and paying.
          </li>
          <li>
            <B>Park-owned homes with no repair reserve.</B> Rent from park-owned homes without the
            cost of keeping them up overstates what they earn.
          </li>
          <li>
            <B>Missing or outdated rental agreements.</B> Gaps in leases make income harder to
            verify and finance.
          </li>
          <li>
            <B>Park utilities buried in owner costs.</B> Utilities the park pays need to show up as
            park expenses, not in your personal spending.
          </li>
        </ul>
      </Section>

      <Section eyebrow="Selling" title="Who buys mobile home parks and how deals are paid">
        <p>
          Park owners usually hear from a few kinds of buyers: a local operator who already runs a
          park nearby, a regional or institutional buyer that owns many parks, and in some places a
          resident group. Some states give residents notice of a sale or a chance to make an offer
          first, so check with an attorney early. None of these buyers is automatically better. The
          right fit depends on what you want for your residents, how long you're willing to stay
          involved, and how you want to get paid.
        </p>
        <p>
          Payment can be cash at close from a bank or agency loan, a seller-financed note you carry
          over time, or a mix. Infrastructure, utility setup and records often decide which loans a
          buyer can get, which affects both price and terms. We don't publish typical prices or
          terms. Compare offers on what you're likely to receive and what you have to do to earn it,
          not only the headline number.
        </p>
        <p>
          Read{" "}
          <Link to="/guides/how-to-sell-my-business" className={LINK_CLS}>
            how to sell my business
          </Link>{" "}
          and{" "}
          <Link to="/guides/exit-strategy-retirement" className={LINK_CLS}>
            building an exit strategy for retirement
          </Link>
          . If you run an RV park or campground instead, see{" "}
          <Link to="/what-is-my-rv-park-worth" className={LINK_CLS}>
            RV parks and campgrounds
          </Link>
          .
        </p>
      </Section>

      <Section eyebrow="Get ready" title="What a park buyer will ask for" alt>
        <ul className="list-disc space-y-2 pl-5">
          <li>Current rent roll with lot numbers, occupancy and lot rent</li>
          <li>Three years of P&amp;Ls and tax returns</li>
          <li>Utility bills for water, sewer, electric, gas and trash</li>
          <li>Rental agreements and park rules</li>
          <li>Site plan or survey</li>
          <li>Permits and licenses the park operates under</li>
          <li>Water and sewer test results and inspection reports</li>
          <li>List of park-owned homes with titles</li>
          <li>Capital spending and repair history</li>
        </ul>
        <p>
          See the full{" "}
          <a href="/guides/exit-readiness#exit-readiness-checklist" className={LINK_CLS}>
            exit readiness checklist
          </a>
          .
        </p>
      </Section>

      <Section eyebrow="Owner dependence" title="Can the park run without you?">
        <p>
          If you collect rent, take every resident call, fix the water line yourself and keep the
          rules in your head, a buyer is buying a job along with the park. They respond with a lower
          price, a higher cap rate, or a longer transition. Read{" "}
          <Link to="/guides/owner-dependence" className={LINK_CLS}>
            owner dependence: why buyers discount your business
          </Link>
          .
        </p>
        <h3 className="pt-4 font-display text-xl font-semibold text-primary">
          Mobile home park self-check (yes/no)
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Do residents call you personally for rent, repairs and complaints?</li>
          <li>Are you the only one who knows how the water, sewer or electrical systems work?</li>
          <li>Would two weeks away stop rent collection or repairs?</li>
          <li>
            Are rental agreements, park rules or vendor contacts missing from written records?
          </li>
          <li>Is there no manager or helper who could run day-to-day work after a sale?</li>
        </ol>
        <p>
          More yeses mean transferability is your first project, before you settle on an asking
          price.
        </p>
      </Section>

      <Section
        eyebrow="Free Preview for mobile home park owners"
        title="What to have ready for Free Preview (about 15 minutes)"
        alt
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Your rent roll and recent P&amp;Ls, plus a clear list of owner pay and personal costs
          </li>
          <li>A rough split of lot rent vs park-owned home rent vs other income</li>
          <li>Your honest role: hours managing, collecting, repairing and handling residents</li>
          <li>
            Known issues you'd disclose anyway: an aging water line, a septic problem, a group of
            empty lots
          </li>
          <li>{INDUSTRY_PICK_READY}</li>
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
          Start with the{" "}
          <Link to="/what-is-my-business-worth" className={LINK_CLS}>
            general worth page
          </Link>{" "}
          if you own more than one kind of business. New to the terms? Read{" "}
          <Link to="/guides/sde-explained" className={LINK_CLS}>
            SDE explained
          </Link>
          ,{" "}
          <Link to="/guides/how-to-value-a-small-business" className={LINK_CLS}>
            how to value a small business
          </Link>{" "}
          and our{" "}
          <Link to="/methodology" className={LINK_CLS}>
            methodology
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
            Ready to see your mobile home park's planning range?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start your free valuation in minutes, no credit card required.
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
            <Link to="/what-is-my-rv-park-worth" className={LINK_CLS}>
              What is my RV park worth?
            </Link>
            <Link to="/what-is-my-hvac-business-worth" className={LINK_CLS}>
              What is my HVAC business worth?
            </Link>
            <Link to="/what-is-my-plumbing-business-worth" className={LINK_CLS}>
              What is my plumbing business worth?
            </Link>
            <Link to="/what-is-my-insurance-agency-worth" className={LINK_CLS}>
              What is my insurance agency worth?
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
          <p className="mt-6 text-xs text-muted-foreground">{PAGE_DISCLAIMER}</p>
        </div>
      </section>

      <RelatedLinksBlock current="/what-is-my-mobile-home-park-worth" />

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
