import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { FooterEntityLine, FooterSeoLinks, RelatedLinksBlock } from "@/components/SeoLinks";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { ORGANIZATION_REF } from "@/lib/site-entity";
import { pageMeta } from "@/lib/page-meta";

const PAGE_URL = "https://valuright.ai/what-is-my-insurance-agency-worth";
const TITLE = "What Is My Insurance Agency Worth? Free Planning Range | ValuRight";
const META =
  "How insurance agencies are valued: recurring commissions, retention, carrier mix, book quality, producers and owner dependence. Free range for owners 55+.";
// Ship date: re-bump all three (JSON-LD, visible line, sitemap lastmod) if merged later.
const SHIP_DATE_ISO = "2026-11-17";
const SHIP_DATE_LABEL = "November 17, 2026";
const LINK_CLS = "font-semibold text-accent hover:underline";
// Page disclaimer (brief rule 7): shown once in the body; adds "insurance advice".
const PAGE_DISCLAIMER =
  "Software-generated planning estimate only. Not a certified appraisal, insurance advice, tax advice, legal advice, investment advice, or guaranteed sale price.";
// [CONFIRM WITH CTO: industry list] resolved: insurance agency is not in INDUSTRY_OPTIONS
// (src/lib/valuation.ts), so the brief's fallback wording ships.
const INDUSTRY_PICK_CARD =
  "Choose the closest professional-services category in Free Preview and note that you run an insurance agency in your profile.";
const INDUSTRY_PICK_READY =
  "Choose the closest professional-services category and note that you run an insurance agency in your profile.";

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${PAGE_URL}#webpage`,
  name: TITLE,
  headline: "What is my insurance agency worth?",
  description: META,
  url: PAGE_URL,
  inLanguage: "en-US",
  datePublished: SHIP_DATE_ISO,
  dateModified: SHIP_DATE_ISO,
  author: ORGANIZATION_REF,
  publisher: ORGANIZATION_REF,
  isPartOf: { "@id": "https://valuright.ai/#website" },
  about: ["Insurance agency valuation"],
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
    { "@type": "ListItem", position: 3, name: "Insurance agency worth", item: PAGE_URL },
  ],
};

// Single source for the visible FAQ and the FAQPage JSON-LD (kept 1:1).
const FAQS: { q: string; a: string }[] = [
  {
    q: "How much is an insurance agency worth?",
    a: "It depends on recurring earnings and risk. Most owner-run agencies start from Seller's Discretionary Earnings times a risk-adjusted multiple. Retention, carrier mix, book quality, staff depth and owner dependence then move the range up or down.",
  },
  {
    q: "How do you value an insurance agency for sale?",
    a: "Gather three years of commission statements and financials, separate renewal from new and contingent commissions, add back owner pay and personal or one-time costs to get SDE, then apply methods that fit. Adjust for retention, carrier concentration and how well the agency runs without you.",
  },
  {
    q: "How much do insurance agencies sell for?",
    a: "We don't publish sale prices or multiples. Prices depend on size, retention, line mix, growth, buyer type and deal terms such as earn-outs. Get current figures from a broker or valuation professional who works with insurance agencies.",
  },
  {
    q: "What is the difference between selling my book of business and selling my agency?",
    a: "A book sale transfers client relationships and renewal rights. An agency sale can also include staff, the agency name, systems, carrier appointments and the lease. Which one fits depends on your contracts, your goals and the buyer.",
  },
  {
    q: "Do captive agents own their book of business?",
    a: "Often not fully. Many captive agent agreements give the carrier ownership or control of the book, with set terms for what the agent receives on leaving. Read your agent agreement and confirm with the carrier and an attorney before planning a sale.",
  },
  {
    q: "Is SDE or EBITDA used to value an insurance agency?",
    a: "Owner-run agencies usually start from SDE. Larger agencies with producers and a manager running daily work are often discussed on EBITDA, which assumes a paid manager replaces the owner. ValuRight shows several methods side by side.",
  },
  {
    q: "Why does client retention matter so much in an agency sale?",
    a: "Buyers are mostly paying for renewal income that keeps coming after you leave. A documented history of strong retention lowers their risk. Many deals tie part of the price to retention after closing.",
  },
  {
    q: "Is this a certified appraisal of my insurance agency?",
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
    "Client retention history",
    "Buyers are paying for renewals that continue after you leave",
    "Retention reports for several years, by line if you have them, plus notes on large accounts that left",
  ],
  [
    "Renewal vs new commission mix",
    "Renewal income is usually seen as steadier than new-business production that may leave with a producer",
    "Commission statements split into renewal, new and contingent income",
  ],
  [
    "Carrier concentration and appointment transferability",
    "Heavy reliance on one carrier, or appointments that do not transfer, can shrink what a buyer can keep",
    "Premium or commission by carrier, appointment letters, and any consent or transfer terms",
  ],
  [
    "Line mix (personal, commercial, benefits)",
    "Different lines have different renewal patterns and buyer interest. Direction only; we don't publish a preferred mix",
    "Revenue by line for three years",
  ],
  [
    "Client concentration",
    "A few large accounts can leave and take a noticeable share of commissions with them",
    "Commission by top clients for three years",
  ],
  [
    "Producer and CSR depth, and non-solicit agreements",
    "Staff who stay, and agreements that limit walking off with accounts, lower transition risk",
    "Roster with licenses, roles, hire dates and signed agreements (have an attorney review them)",
  ],
  [
    "Who holds the client relationships",
    "If clients only know you, retention after closing is harder to defend",
    "Who services each major account today, and whether clients know a CSR or another producer",
  ],
  [
    "Agency management system and clean client data",
    "A buyer needs policy and client records they can take over without starting from scratch",
    "System used, how long it has held data, and whether records export cleanly",
  ],
  [
    "Contingent income reliance",
    "Contingent or bonus income from carriers is real in a good year, but it is not guaranteed",
    "Contingent income shown separately from core commissions, for several years",
  ],
  [
    "Errors-and-omissions (E&O) claims history",
    "Open or repeated claims signal future cost and can slow a closing",
    "Claims log, current E&O coverage and any open matters",
  ],
  [
    "Licenses in good standing",
    "Lapsed or restricted licenses can stall a deal or limit who can service the book",
    "License list for you and staff, expiration dates, any restrictions (confirm state rules with an attorney)",
  ],
  [
    "Owner hours selling vs servicing",
    "The more of the production and the relationships that sit with you, the more earnings may walk out when you do",
    "A typical week: hours selling, servicing, managing and handling claims or carrier issues",
  ],
];

export const Route = createFileRoute("/what-is-my-insurance-agency-worth")({
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
  component: InsuranceAgencyWorthLanding,
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

function InsuranceAgencyWorthLanding() {
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
                Free Preview · Insurance agencies
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                What is my insurance agency worth?
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                An insurance agency is usually worth a planning range built from recurring
                commission earnings (SDE for owner-run agencies, EBITDA for larger ones) times a
                risk-adjusted multiple, then moved by client retention, carrier contracts, book mix,
                producer depth and how much it depends on you. Buyers pay mainly for renewal income
                that stays after you leave. ValuRight Free Preview gives you a planning range in
                about 15 minutes. It is not a certified appraisal or a guaranteed sale price.
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
                Planning estimate for insurance agency owners 55+. Not a certified appraisal, not
                insurance, tax or legal advice, and not a guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Insurance agency Free Preview
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Seven methods
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold text-primary">
                    Planning range + Health Score for insurance agencies
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    No "typical agency" dollar figures or multiples here. Your range comes from your
                    own numbers after you start Free Preview.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      INDUSTRY_PICK_CARD,
                      "SDE-first Main Street methods among seven approaches",
                      "Health Score out of 100 + prioritized recommendations",
                      "What-if scenarios on owner production and retention",
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
                before you set an asking price. Not insurance, tax or legal advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div id="how-to-value">
        <Section
          eyebrow="How to value an insurance agency"
          title="How to value an insurance agency: 5 steps"
          alt
        >
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <B>Pull three years of commission statements and P&amp;Ls, and split them.</B> Buyers
              want to see where the money comes from, not one total. Separate new-business
              commissions from renewal commissions. Then split by line — personal lines, commercial
              property and casualty, life, and health or benefits — and by carrier. Show contingent
              or bonus income on its own line, not mixed in with commissions you can count on. If
              your books lump these together, commission statements or your agency management system
              can usually rebuild the split.
            </li>
            <li>
              <B>Normalize to SDE.</B> Start with profit, then add back your own pay, family members
              on payroll, a personal car or phone the agency pays for, and true one-time costs.
              Every add-back needs a receipt or a clear explanation. Buyers and their lenders throw
              out vague ones, and one bad add-back makes them doubt the rest. Buyers also often
              discount contingent bonuses, because those payments are not guaranteed from year to
              year.
            </li>
            <li>
              <B>Pick the right lens.</B> Owner-run agencies are usually priced on SDE times a
              multiple. Agencies with producers and an office manager already running day-to-day
              work are often discussed on EBITDA. We don't publish multiples. Current figures should
              come from a broker or valuation professional who works with insurance agencies.
            </li>
            <li>
              <B>Adjust for risk.</B> The drivers table below lists what buyers check and what to
              have documented. This is where two agencies with similar earnings end up with
              different ranges.
            </li>
            <li>
              <B>Be clear about what is actually being sold.</B> That can mean the book of business
              (client relationships and renewal rights), carrier appointments and whether they
              transfer, the agency name, phone number and website, the staff, and the office lease.
              Some deals are structured as asset sales and some as stock sales. The tax and legal
              results are different, and this page cannot choose for you. Take that question to a
              CPA and an attorney.
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

      <Section eyebrow="Book vs agency" title="Your book of business vs your agency">
        <p>
          "Book of business" and "agency" are not the same sale, and buyers will ask which one you
          mean.
        </p>
        <p>
          A book sale is mainly the client relationships and the right to renew those policies. The
          buyer is paying for renewal income, not necessarily for your staff, your name or your
          office. An agency sale can also include the people, the brand, the systems, the carrier
          appointments and the lease.
        </p>
        <p>
          Which one you can sell also depends on who owns the renewals. Independent agents often own
          or control their book, subject to carrier contracts and any producer agreements. Captive
          agents often do not fully own their book. Many captive agent agreements give the carrier
          ownership or control of the clients, with set terms for what you receive if you leave.
          Read your agent agreement and confirm with the carrier and an attorney before you plan a
          sale.
        </p>
        <p>
          If you have producers on the book, check those contracts too. A producer who can walk out
          with accounts is part of what a buyer is buying — or part of the risk they will subtract.
        </p>
      </Section>

      <Section eyebrow="Retention" title="Why retention and renewals drive the price" alt>
        <p>
          Buyers are mostly paying for renewal income that keeps coming after you leave. A client
          who has stayed and renewed is usually a safer bet than a new account that just arrived.
          Steadier renewal income lowers the buyer's risk, and that can support a stronger range or
          cleaner terms. Weak or undocumented retention does the opposite.
        </p>
        <p>
          You do not need a published benchmark for this to be useful. What you need is a clear
          history: how much of the book renewed, by line and over several years, and whether any
          large accounts left. Many deals also tie part of the price to retention after closing, so
          the story you can prove on paper matters as much as the story you tell.
        </p>
      </Section>

      <Section eyebrow="Earnings base" title="SDE or EBITDA for an insurance agency?">
        <p>
          <B>SDE</B> (Seller's Discretionary Earnings) is the total yearly benefit to one full-time
          owner: profit plus your pay and the personal or one-time costs the agency carries. It fits
          most owner-run agencies, where the buyer will step into your role.
        </p>
        <p>
          <B>EBITDA</B> assumes a paid manager already runs the daily work, so the manager's salary
          stays in as a cost. Buyers, aggregators and private-equity-backed groups tend to use it
          for larger agencies with producers, customer service representatives (CSRs) and a manager
          in place.
        </p>
        <p>
          Which one a buyer uses changes the math, so know which conversation you're in. Read{" "}
          <Link to="/guides/sde-explained" className={LINK_CLS}>
            what SDE is
          </Link>
          . ValuRight shows several methods side by side so you can see both views.
        </p>
      </Section>

      <Section eyebrow="What moves the range" title="Insurance agency value drivers" alt>
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
            exit readiness checklist and your Health Score
          </Link>
          .
        </p>
      </Section>

      <Section eyebrow="Add-backs" title="Insurance agency add-backs and traps">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <B>Your pay.</B> Owner salary and benefits are a normal add-back when you are figuring
            SDE. Be ready to show what you actually took out.
          </li>
          <li>
            <B>Family on payroll.</B> Add back pay above what you'd pay someone else to do the same
            work. If your spouse runs the office or the books, a buyer has to replace that person.
          </li>
          <li>
            <B>Personal expenses.</B> A personal car, phone, travel or policy the agency pays for
            can be a fair add-back if you can document it. Lifestyle spending dressed up as a
            business cost will get thrown out.
          </li>
          <li>
            <B>Contingent bonuses counted as guaranteed.</B> Profit-sharing or contingent income
            from carriers can be real money in a good year. Buyers often treat it as less reliable
            than renewal commissions. Don't bake it into earnings as if it will arrive every year.
          </li>
          <li>
            <B>Unsigned producer non-solicits.</B> If a producer can leave and take accounts, the
            buyer will price that risk. Agreements that were never signed, or that may not hold up,
            belong in the "fix this" pile, not in the value story. An attorney should review them.
          </li>
          <li>
            <B>Clients loyal to you personally.</B> If the largest accounts would follow you out the
            door, you are selling a job as much as an agency. Start moving those relationships onto
            CSRs or other producers before you go to market.
          </li>
        </ul>
      </Section>

      <Section
        eyebrow="Selling"
        title="Selling to another agency, a producer, or private equity"
        alt
      >
        <p>
          Owners in this seat usually hear about a few paths: selling to a producer or partner
          already in the agency (internal perpetuation), selling to another local agency, or selling
          to a larger aggregator or private-equity-backed buyer. None of those is automatically
          better. The right path depends on what you want for your clients and staff, how long
          you're willing to stay, and how you want to get paid.
        </p>
        <p>
          Payment structures vary. Some of the price may be cash at close, some may be an earn-out
          tied to retention after the sale, and some may be a seller note paid over time. We don't
          publish typical splits or prices. Compare offers on what you are likely to receive and
          what you have to stay to earn it, not only on the headline number.
        </p>
        <p>
          Plan the timing, too. Cleaning up agreements, retention reports and owner dependence often
          takes longer than the sale process itself. Read{" "}
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

      <Section eyebrow="Get ready" title="What a buyer will ask for">
        <ul className="list-disc space-y-2 pl-5">
          <li>Three years of commission statements, P&amp;Ls and tax returns</li>
          <li>The book by line, by carrier and by top clients</li>
          <li>A retention report covering several years</li>
          <li>
            Carrier contracts and appointment letters, including any transfer or consent terms
          </li>
          <li>Staff roster with licenses, roles and producer or employment agreements</li>
          <li>Errors-and-omissions (E&amp;O) claims history and current coverage</li>
          <li>
            Confirmation that your agency management system can export client and policy data
            cleanly
          </li>
          <li>Office lease (term, renewal options, and whether it can be assigned)</li>
        </ul>
      </Section>

      <Section eyebrow="Owner dependence" title="Your agency, or your book in your pocket?" alt>
        <p>
          If clients call your cell, you write most of the new business, and no one else can keep
          the largest accounts, a buyer is buying a job, not an agency. They respond with a lower
          price, a longer transition, or more of the price tied to retention later. Read{" "}
          <Link to="/guides/owner-dependence" className={LINK_CLS}>
            owner dependence: why buyers discount your business
          </Link>
          .
        </p>
        <h3 className="pt-4 font-display text-xl font-semibold text-primary">
          Insurance agency self-check (yes/no)
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Do clients call you personally instead of the agency or a CSR?</li>
          <li>Are you the only producer who can keep the largest accounts?</li>
          <li>Would two weeks away stop renewals, claims help or carrier conversations?</li>
          <li>
            Are producer non-solicit agreements missing, unsigned or overdue for a legal review?
          </li>
          <li>
            Do carrier appointments sit only in your name, with no clear path to transfer them?
          </li>
        </ol>
        <p>
          More yeses mean transferability is your first project, before you settle on an asking
          price.
        </p>
      </Section>

      <Section
        eyebrow="Free Preview for insurance agency owners"
        title="What to have ready for Free Preview (about 15 minutes)"
      >
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Recent commission statements and P&amp;Ls, plus a clear list of owner pay and add-backs
          </li>
          <li>A rough split of renewal vs new vs contingent income, even informal notes</li>
          <li>
            Your honest role: hours selling, servicing, managing and handling claims or carrier
            issues
          </li>
          <li>
            Known issues you'd disclose anyway: a large account at risk, an unsigned producer
            agreement, an E&amp;O matter
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
          if you run more than one kind of business.
        </p>
      </Section>

      <section className="border-t border-border/60 bg-secondary/40">
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

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <FileCheck className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary">
            Ready to see your insurance agency's planning range?
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
            <Link to="/what-is-my-plumbing-business-worth" className={LINK_CLS}>
              What is my plumbing business worth?
            </Link>
            <Link to="/what-is-my-landscaping-business-worth" className={LINK_CLS}>
              What is my landscaping or lawn care business worth?
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
          <p className="mt-6 text-xs text-muted-foreground">{PAGE_DISCLAIMER}</p>
        </div>
      </section>

      <RelatedLinksBlock current="/what-is-my-insurance-agency-worth" />

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
