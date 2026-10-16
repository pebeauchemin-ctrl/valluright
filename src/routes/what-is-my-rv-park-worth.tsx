import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { FooterEntityLine, FooterSeoLinks, RelatedLinksBlock } from "@/components/SeoLinks";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { ORGANIZATION_REF } from "@/lib/site-entity";

const PAGE_URL = "https://valuright.ai/what-is-my-rv-park-worth";
const PAGE_TITLE = "How to Value an RV Park or Campground (Free Range) | ValuRight";
const PAGE_H1 = "What is my RV park or campground worth?";
const PAGE_DESCRIPTION =
  "How RV parks and campgrounds are valued: SDE vs NOI and cap rate, occupancy, seasonality, CapEx, and owner dependence. Free planning range for owners 55+.";
const SHIP_DATE_ISO = "2026-10-19";
const SHIP_DATE_LONG = "October 19, 2026";

const LINK_CLASS = "font-semibold text-accent hover:underline";

// Single source for the visible FAQ and the FAQPage JSON-LD. Plain text only,
// straight apostrophes, so the two stay identical character for character.
const RV_PARK_FAQS: { q: string; a: string }[] = [
  {
    q: "How do you value an RV park?",
    a: "Most owner-run parks start from SDE times a risk-adjusted multiple. Stabilized parks that run like income property are valued on NOI divided by a cap rate. Occupancy, seasonality, CapEx and owner dependence then move the range.",
  },
  {
    q: "How do you value a campground?",
    a: "The same way as an RV park. Separate land, business and equipment, normalize the books to SDE or NOI, then adjust for seasonality, site mix, condition and how well operations transfer without you.",
  },
  {
    q: "SDE or cap rate for an RV park?",
    a: "Owner-operated parks often start with Seller's Discretionary Earnings. Parks with stabilized income and staff get more weight on stabilized NOI divided by a selected cap rate. ValuRight shows multiple methods side by side.",
  },
  {
    q: "What is a typical cap rate or multiple for an RV park?",
    a: "We don't publish one. Cap rates and multiples depend on location, park quality, income stability, and financing conditions at the time of sale. Get current figures from a broker or appraiser who works on parks.",
  },
  {
    q: "How does seasonality affect campground value?",
    a: "Buyers look at cash flow across the full year, not the peak season alone. Heavy dependence on a short peak window, or a thin shoulder season, usually means more risk and a lower planning range.",
  },
  {
    q: "Does deferred maintenance lower an RV park's value?",
    a: "Usually yes. Buyers subtract known repairs to roads, electrical, water and sewer, or they push them into deal terms. A documented CapEx list with your estimates helps you avoid surprises in diligence.",
  },
  {
    q: "Is this a certified appraisal of my RV park?",
    a: "No. Free Preview is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker or appraiser. It is not a certified appraisal, tax or legal advice, or a guaranteed sale price.",
  },
  {
    q: "Will you show me comps or typical occupancy for parks like mine?",
    a: "No. We don't publish invented sale comps or occupancy benchmarks. Your planning range comes from your inputs and ValuRight's methods. Local comps belong in advisor or broker diligence.",
  },
  {
    q: "How long does Free Preview take?",
    a: "About 15 minutes if you have recent financials handy.",
  },
];

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${PAGE_URL}#webpage`,
  name: PAGE_TITLE,
  headline: PAGE_H1,
  description: PAGE_DESCRIPTION,
  url: PAGE_URL,
  datePublished: "2026-09-21",
  dateModified: SHIP_DATE_ISO,
  author: ORGANIZATION_REF,
  publisher: ORGANIZATION_REF,
  mainEntityOfPage: PAGE_URL,
  about: ["RV park valuation", "Campground valuation"],
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
      name: "What is my business worth?",
      item: "https://valuright.ai/what-is-my-business-worth",
    },
    { "@type": "ListItem", position: 3, name: PAGE_H1, item: PAGE_URL },
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: RV_PARK_FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const ON_THIS_PAGE = [
  { href: "#how-to-value", label: "How to value a park in 5 steps" },
  { href: "#worked-example", label: "A worked example in words" },
  { href: "#park-types", label: "RV park vs campground vs RV resort" },
  { href: "#value-drivers", label: "What moves a park's value" },
  { href: "#add-backs", label: "Add-backs and traps" },
  { href: "#diligence", label: "Diligence checklist" },
  { href: "#faq", label: "Questions owners ask" },
];

const VALUE_DRIVERS: [string, string, string][] = [
  [
    "Occupancy by month",
    "One strong summer isn't a stable year. Buyers want the pattern across every month, not the peak.",
    "Occupied site-nights by month and site type for each year you have",
  ],
  [
    "Seasonal and annual site contracts",
    "Income that renews on paper is lower risk than income that depends on a handshake.",
    "Signed contracts, renewal history by guest, deposit and cancellation terms",
  ],
  [
    "Rate history and reviews",
    "Shows whether the park can hold or raise rates and how guests feel about it.",
    "Rate cards by year, a summary of reviews across the sites guests use",
  ],
  [
    "Utility setup",
    "Metered vs included electric changes who pays when utility costs rise. Well and septic vs municipal water and sewer changes upkeep and risk.",
    "Utility bills, how sites are metered, well and septic service records",
  ],
  [
    "Electrical capacity for modern rigs",
    "Larger rigs need higher-amp service. Undersized pedestals limit which guests you can take.",
    "Pedestal count by service level, panel and transformer notes, electrician reports",
  ],
  [
    "Road and pad condition",
    "Buyers price regrading, gravel, paving and pad work into their offer.",
    "Photos, invoices for recent work, your list of what's due next",
  ],
  [
    "Permits, zoning and licenses",
    "A lapsed or informal permit can stall a sale or block a loan.",
    "Zoning letter, health department permits, state campground license, renewal dates",
  ],
  [
    "Floodplain, access and environmental",
    "Affects insurance, lending, and what a buyer can build next.",
    "Flood map status, easements and access rights, any environmental reports",
  ],
  [
    "Booking channels",
    "Leaning hard on one channel is a concentration risk a buyer will notice.",
    "Bookings by channel from your own records, your direct-booking setup",
  ],
  [
    "Staffing and work-camper reliance",
    "Buyers need to know who does the work after you leave and whether they come back each season.",
    "Roster, roles, seasonal hiring pattern, work-camper agreements",
  ],
  [
    "Owner hours on-site",
    "If the park runs through you, buyers price the handoff.",
    "An honest weekly schedule of what you do and who covers when you're gone",
  ],
  [
    "Reservation system and data",
    "A buyer wants guest history and future bookings they can take over on day one.",
    "Which system you use, what data you can export, whose name the account is in",
  ],
  [
    "Deferred CapEx list",
    "Known work gets subtracted from the price or pushed into the deal terms.",
    "A dated list with rough timing and your own estimates, labeled as owner estimates",
  ],
];

const DILIGENCE_ITEMS = [
  "3 years of P&Ls and tax returns",
  "Monthly occupancy and rate reports",
  "Site map, with site counts by type (tent, partial hookup, full hookup, cabins and other units)",
  "Utility bills",
  "Permits and licenses (zoning, health department, state campground license)",
  "Inspection reports (well, septic, electrical, any others you have)",
  "CapEx history: what was done, when, and what it cost",
  "Staffing roster, including seasonal staff and work-campers",
  "Contracts with seasonal guests and vendors",
  "Reviews summary",
  "Land deed or ground lease, plus any easements",
];

export const Route = createFileRoute("/what-is-my-rv-park-worth")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(webPageLd) },
      { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
      { type: "application/ld+json", children: JSON.stringify(faqLd) },
    ],
  }),
  component: RvParkWorthLanding,
});

function CtaPair({ size = "lg" }: { size?: "lg" | "md" }) {
  const pad = size === "lg" ? "px-6 py-3 text-base" : "px-5 py-2.5 text-sm";
  return (
    <>
      <Link
        to="/auth"
        search={{ mode: "signup" }}
        onClick={trackSignupStart}
        className={`inline-flex items-center gap-2 rounded-md bg-accent ${pad} font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-md hover:shadow-lg`}
      >
        Start free <ArrowRight className="h-4 w-4" />
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

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-primary">{title}</h2>
    </>
  );
}

function RvParkWorthLanding() {
  const body = "mt-4 text-muted-foreground leading-relaxed";
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

      {/* 1. Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.025_158/0.5),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium text-accent mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Free Preview · RV parks &amp; campgrounds
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                {PAGE_H1}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                An RV park or campground is usually valued one of two ways. Smaller owner-run parks
                start from Seller's Discretionary Earnings (SDE), the cash benefit to one
                owner-operator, times a risk-adjusted multiple. Parks that run like income property are
                valued on stabilized net operating income (NOI) divided by a cap rate. Most Main Street
                parks fall in between. The number then moves on occupancy across the year, seasonality,
                deferred CapEx (roads, electrical, water/sewer), and how much the park still depends on
                you. ValuRight Free Preview gives a planning range in about 15 minutes. It's not a
                certified appraisal.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Last updated: {SHIP_DATE_LONG}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <CtaPair />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Free Preview is $0. No credit card.</p>
            </div>

            <div className="lg:col-span-5">
              <nav
                aria-label="On this page"
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  On this page
                </p>
                <ul className="mt-4 space-y-3 text-sm">
                  {ON_THIS_PAGE.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className={LINK_CLASS}>
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Five steps */}
      <section id="how-to-value" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHead eyebrow="Step by step" title="How to value an RV park or campground: 5 steps" />
          <p className={body}>
            Buyers, brokers and lenders tend to work through the same five questions. If you answer
            them first, you'll know what your range is built on before anyone else tells you.
          </p>
          <ol className="mt-6 list-decimal space-y-6 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Build a clean multi-year P&amp;L by revenue line.</strong>{" "}
              Split revenue the way the park actually earns it: nightly or transient stays, weekly and
              monthly stays, seasonal or annual sites, any long-term residents, the store (propane,
              laundry, firewood, supplies), cabin or rental-unit income, utility pass-throughs, and
              anything else. A buyer can't judge stability from one blended "site revenue" line. They
              want to see which streams come back every year and which depend on a good summer.
            </li>
            <li>
              <strong className="text-foreground">Normalize the books into SDE and NOI.</strong> Take
              out owner perks and one-time items, then add back one owner's pay. That's your Seller's
              Discretionary Earnings. If you want the full build-up, here's{" "}
              <Link to="/guides/sde-explained" className={LINK_CLASS}>
                what SDE is
              </Link>
              . For the NOI view, start from the same normalized books but charge the costs a
              hands-off owner would pay: a market-rate manager wage, a reserve for replacing things
              that wear out, and the real property tax and insurance bills. SDE and NOI come from the
              same books but answer different buyer questions. SDE asks what one working owner takes
              home. NOI asks what the property earns if someone else runs it.
            </li>
            <li>
              <strong className="text-foreground">Pick the lens that matches how a buyer will run it.</strong>{" "}
              If the buyer has to live on-site and work the park, the conversation usually starts with
              SDE times a multiple. If the park is stabilized, with staff and steady income, it leans
              toward NOI divided by a cap rate. Plenty of parks sit in between, so it helps to see both
              views. We don't publish multiples or cap rates. They depend on local market, park quality
              and financing, and current figures should come from a broker or appraiser. For the general
              logic, read{" "}
              <Link to="/guides/how-to-value-a-small-business" className={LINK_CLASS}>
                SDE multiples and what moves them
              </Link>
              . For how ValuRight handles the income approach, see{" "}
              <Link to="/methodology" className={LINK_CLASS}>
                cap rate among seven methods
              </Link>
              .
            </li>
            <li>
              <strong className="text-foreground">Adjust for risk.</strong> Buyers move the multiple or
              cap rate based on what could go wrong: the occupancy trend across the whole year, how
              seasonal the cash flow is, the mix of short and long stays, the CapEx backlog, the
              condition of roads and utilities, permits and zoning, guest reviews, and how complete
              your records are. Every risk you can explain with paperwork is one a buyer has less
              reason to price against you.
            </li>
            <li>
              <strong className="text-foreground">Separate what's being sold.</strong> A park sale is
              often three things in one: the land and improvements (roads, pads, utility lines,
              buildings), the operating business (bookings, guest relationships, reputation), and the
              equipment and rental units (carts, mowers, cabins, any park models you own). Buyers and
              lenders may look at each one differently. The biggest question is whether you own the
              land outright (fee simple) or run the park on a ground lease. With a ground lease, the
              remaining term, renewal rights and rent terms shape what a buyer is really getting, and a
              short or uncertain lease can make the park harder to finance. Have your attorney read the
              lease before you talk price.
            </li>
          </ol>
        </div>
      </section>

      {/* 3. Worked example */}
      <section id="worked-example" className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHead eyebrow="Worked example" title="The cap rate math in words, with no numbers" />
          <p className={body}>
            Here's the income-approach math without any figures. If a park's stabilized NOI is X and a
            buyer uses cap rate Y, value ≈ X ÷ Y. A higher cap rate means a lower value. The buyer is
            asking for more income per dollar paid because they see more risk.
          </p>
          <h3 className="mt-8 font-display text-xl font-semibold text-primary">
            Why a buyer would raise Y for your park:
          </h3>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>Most of the year's income lands in a short peak window, and the shoulder season is thin.</li>
            <li>Seasonal guests are on handshake deals with no renewal history on paper.</li>
            <li>Roads, electrical, or water and sewer need work nobody has priced yet.</li>
            <li>Well or septic capacity limits adding sites or rigs with bigger hookups.</li>
            <li>A permit or state campground license is lapsed, informal or unclear.</li>
            <li>Most bookings come through one channel you don't control.</li>
            <li>The park still runs through you every day of the season.</li>
          </ul>
          <p className={body}>
            <strong className="text-foreground">Why a buyer might accept a lower Y:</strong> several
            years of clean books by revenue line, seasonal contracts that renew, major CapEx already
            done and documented, a crew that runs the park without you, and permits that are current.
          </p>
          <p className={body}>
            <strong className="text-foreground">Watch X too.</strong> If your NOI leaves out a manager
            wage or a replacement reserve, X is overstated, and a buyer will rebuild it lower before
            any cap rate touches it.
          </p>
          <p className={body}>
            <strong className="text-foreground">The SDE side works the same way.</strong> If SDE is S
            and a buyer uses multiple M, value ≈ S × M. The same risks that push Y up push M down.
          </p>
          <p className={body}>
            Want to see both lenses on your own books?{" "}
            <Link to="/auth" search={{ mode: "signup" }} onClick={trackSignupStart} className={LINK_CLASS}>
              Start free
            </Link>
            . Free Preview is $0 with no credit card.
          </p>
        </div>
      </section>

      {/* 4. Park types */}
      <section id="park-types" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHead
            eyebrow="Park types"
            title="RV park vs campground vs RV resort: does it change value?"
          />
          <p className={body}>
            The name on the sign doesn't set the value. What's behind it does: the kind of sites, who
            stays, and how much work it takes to run. Those change the income mix, the staffing load,
            and which lens a buyer leans on.
          </p>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Tent and primitive sites vs full-hookup sites.</strong>{" "}
              Primitive sites cost less to build and keep up but tend to earn less per site and rise
              and fall with the weather. Full-hookup sites carry more infrastructure a buyer will
              inspect (electric, water, sewer) and more to replace down the road.
            </li>
            <li>
              <strong className="text-foreground">Amenities.</strong> A pool, store, clubhouse or
              activity program can support rates and reviews. It also adds staff, insurance and upkeep.
              Buyers ask whether each amenity pays its own way.
            </li>
            <li>
              <strong className="text-foreground">Cabins, park models and glamping units.</strong> These
              can stretch income into the shoulder season, but they bring housekeeping, furnishings and
              replacement cycles. Expect questions about who owns each unit, how old it is, and what's
              left on any financing.
            </li>
            <li>
              <strong className="text-foreground">Long-term residents vs transient guests.</strong> Long
              stays steady the income and cut turnover work, but they can bring different rules
              (landlord-tenant law and local ordinances) and less room to change rates. Transient guests
              bring more rate flexibility along with more marketing, check-in and cleaning work. Ask
              your attorney how your state treats long stays.
            </li>
          </ul>
          <p className={body}>
            The more the park looks like a staffed, steady property, the more weight the NOI view gets.
            The more it depends on an owner doing the work, the more SDE drives the conversation.
          </p>
        </div>
      </section>

      {/* 5. Value drivers table */}
      <section id="value-drivers" className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <SectionHead eyebrow="Value drivers" title="What moves an RV park's value, and what to document" />
          <table className="mt-8 w-full text-sm text-left text-muted-foreground border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-border text-foreground">
                <th scope="col" className="py-3 pr-4 font-semibold">Driver</th>
                <th scope="col" className="py-3 pr-4 font-semibold">Why buyers care</th>
                <th scope="col" className="py-3 font-semibold">What to document</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group space-y-4 md:space-y-0">
              {VALUE_DRIVERS.map(([driver, why, doc]) => (
                <tr
                  key={driver}
                  className="block md:table-row rounded-xl border border-border bg-card p-4 md:rounded-none md:border-0 md:border-b md:bg-transparent md:p-0 align-top"
                >
                  <th scope="row" className="block md:table-cell py-1 md:py-3 md:pr-4 font-semibold text-foreground">
                    {driver}
                  </th>
                  <td className="block md:table-cell py-1 md:py-3 md:pr-4">
                    <span className="md:hidden block text-xs font-semibold uppercase tracking-wider text-accent">
                      Why buyers care
                    </span>
                    {why}
                  </td>
                  <td className="block md:table-cell py-1 md:py-3">
                    <span className="md:hidden block text-xs font-semibold uppercase tracking-wider text-accent">
                      What to document
                    </span>
                    {doc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-8 text-muted-foreground leading-relaxed">
            ValuRight's Health Score and prioritized recommendations flag several of these risks in your
            file. What-if scenarios, such as cutting your hours on-site, show how the planning range may
            move. That's model output from your inputs, not a promised sale-price lift. More on what
            buyers mean by ready:{" "}
            <Link to="/guides/exit-readiness" className={LINK_CLASS}>
              what exit readiness means to a buyer
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 6. Add-backs */}
      <section id="add-backs" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHead eyebrow="Add-backs" title="Park add-backs buyers question, and the traps" />
          <p className={body}>
            An add-back only raises SDE if a buyer believes it. These are the ones that come up most at
            parks:
          </p>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Owner housing on site.</strong> If you live in the park
              house or on a site rent-free, decide how to treat it before a buyer asks. A buyer who will
              also live on-site may see the housing as part of the job, not a perk. If a hired manager
              would need housing, it's a real cost in the NOI view.
            </li>
            <li>
              <strong className="text-foreground">Personal vehicle and fuel.</strong> The truck that
              doubles as the park truck. Add back only the personal share, and keep the records that
              show it.
            </li>
            <li>
              <strong className="text-foreground">Family on payroll.</strong> Add back pay above what the
              work is worth. If a buyer would have to hire someone to do that job, the market wage stays
              in.
            </li>
            <li>
              <strong className="text-foreground">One-time repairs vs recurring maintenance.</strong> A
              storm repair is one-time. Re-graveling roads every few seasons isn't. Buyers push back hard
              on mislabeled add-backs, and one bad one makes them doubt the rest.
            </li>
            <li>
              <strong className="text-foreground">No CapEx reserve in the NOI view.</strong> Leaving out a
              replacement reserve makes NOI look better than it is. A buyer will build one in, so build
              it in first.
            </li>
            <li>
              <strong className="text-foreground">Income that isn't in the books.</strong> If it isn't
              recorded, buyers and lenders won't count it.
            </li>
          </ul>
        </div>
      </section>

      {/* 7. Diligence */}
      <section id="diligence" className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHead eyebrow="Diligence" title="What a park buyer will ask for" />
          <ul className="mt-6 space-y-2 text-muted-foreground leading-relaxed">
            {DILIGENCE_ITEMS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 inline-block h-4 w-4 shrink-0 rounded border border-border bg-card"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className={body}>
            Pull these together before you list. The folder you build now is the same one a buyer's
            lender will ask for later.
          </p>
        </div>
      </section>

      {/* 8. Owner dependence */}
      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHead eyebrow="Owner dependence" title="Can the park run a season without you?" />
          <p className={body}>
            If every late-night call, every seasonal renewal and every county inspection runs through
            you, a buyer isn't just buying a park. They're buying your job. They usually answer with a
            lower price, a longer transition, or more of the price held back until things settle.
          </p>
          <h3 className="mt-8 font-display text-xl font-semibold text-primary">Quick yes/no check:</h3>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>Are you the one guests call at night when a breaker trips or a sewer line backs up?</li>
            <li>
              Could anyone else open the park for the season, including water lines, pedestals and the
              store, without calling you?
            </li>
            <li>Do rate changes, seasonal-guest renewals and site assignments live mostly in your head?</li>
            <li>Do the septic pumper, the electrician and the county inspector deal only with you?</li>
            <li>If you left for a couple of weeks in peak season, would bookings or reviews slip?</li>
          </ol>
          <p className={body}>
            More yeses mean transferability is a project to start now, not the month you list. Read{" "}
            <Link to="/guides/owner-dependence" className={LINK_CLASS}>
              how owner dependence lowers what buyers pay
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 9. What to have ready */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <SectionHead eyebrow="Free Preview for park owners" title="What to have ready (about 15 minutes)" />
          <ul className="mt-6 list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
            <li>Recent P&amp;Ls, ideally multi-year and split by revenue line if you can</li>
            <li>Owner pay and the add-backs you'd defend to a buyer</li>
            <li>Rough monthly occupancy notes, even informal ones</li>
            <li>Your honest weekly hours on-site and who covers when you're gone</li>
            <li>Your CapEx list with your own estimates</li>
            <li>Whether you own the land or lease it</li>
          </ul>
          <p className={body}>
            In Free Preview, pick the closest category and describe your park in the profile fields.
          </p>
          <p className={body}>
            Free Preview ($0, no credit card) gives you a planning range from seven valuation methods,
            including cap rate where the income-property category fits, plus a Health Score with
            prioritized recommendations and what-if scenarios. It's built for park and campground
            owners, especially owners 55+ planning the next chapter; see{" "}
            <Link to="/guides/exit-strategy-retirement" className={LINK_CLASS}>
              exit planning for owners 55+
            </Link>
            . It's homework before you talk to a CPA, broker or appraiser, not a stand-in for them when
            a lender or a deal needs a formal opinion. Own something besides a park? See{" "}
            <Link to="/what-is-my-business-worth" className={LINK_CLASS}>
              what your business is worth
            </Link>
            .
          </p>
          <p className="mt-6 rounded-xl border border-border bg-card p-5 text-sm italic text-foreground leading-relaxed">
            Built by an operator who owns and runs a campground business, the same homework he wanted as
            an owner.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaPair size="md" />
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section id="faq" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-12">
            <SectionHead eyebrow="FAQ" title="Questions park owners ask" />
          </div>
          <div className="space-y-6">
            {RV_PARK_FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border bg-card p-5" data-faq-item="">
                <h3 className="font-display text-lg font-semibold text-primary" data-faq-q="">
                  {q}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed" data-faq-a="">
                  {a}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Go deeper:{" "}
            <Link to="/guides/sde-explained" className={LINK_CLASS}>
              What is SDE?
            </Link>{" "}
            ·{" "}
            <Link to="/methodology" className={LINK_CLASS}>
              Methodology
            </Link>{" "}
            ·{" "}
            <Link to="/guides/how-to-sell-my-business" className={LINK_CLASS}>
              How to sell my business
            </Link>
          </p>
        </div>
      </section>

      {/* 11. Closing band */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <FileCheck className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary">
            Ready to see your park's planning range?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free in about 15 minutes. Free Preview is $0, no credit card.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <CtaPair />
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Software-generated planning estimate only. Not a certified appraisal, tax advice, legal
            advice, investment advice, or guaranteed sale price.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/what-is-my-business-worth" className={LINK_CLASS}>
              What is my business worth?
            </Link>
            <Link to="/what-is-my-hvac-business-worth" className={LINK_CLASS}>
              What is my HVAC business worth?
            </Link>
            <Link to="/what-is-my-dental-practice-worth" className={LINK_CLASS}>
              What is my dental practice worth?
            </Link>
            <Link to="/guides/exit-readiness" className={LINK_CLASS}>
              Exit readiness
            </Link>
            <Link to="/guides/owner-dependence" className={LINK_CLASS}>
              Owner dependence
            </Link>
            <Link to="/guides/sde-explained" className={LINK_CLASS}>
              SDE explained
            </Link>
            <Link to="/methodology" className={LINK_CLASS}>
              Methodology
            </Link>
            <Link to="/guides" className={LINK_CLASS}>
              Guides
            </Link>
          </div>
        </div>
      </section>

      <RelatedLinksBlock current="/what-is-my-rv-park-worth" />

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
