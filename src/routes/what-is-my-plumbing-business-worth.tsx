import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { trackDemoClick, trackSignupStart } from "@/lib/marketing-analytics";
import { FooterEntityLine, FooterSeoLinks, RelatedLinksBlock } from "@/components/SeoLinks";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { ORGANIZATION_REF } from "@/lib/site-entity";

const PAGE_URL = "https://valuright.ai/what-is-my-plumbing-business-worth";
const TITLE = "What Is My Plumbing Business Worth? Free Planning Range | ValuRight";
const META =
  "How plumbing businesses are valued: SDE, service vs new-construction mix, maintenance plans, licensed techs, owner dependence. Free range for owners 55+.";
const LINK_CLS = "font-semibold text-accent hover:underline";

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${PAGE_URL}#webpage`,
  name: TITLE,
  headline: "What is my plumbing business worth?",
  description: META,
  url: PAGE_URL,
  inLanguage: "en-US",
  datePublished: "2026-10-23",
  dateModified: "2026-10-23",
  author: ORGANIZATION_REF,
  publisher: ORGANIZATION_REF,
  isPartOf: { "@id": "https://valuright.ai/#website" },
  about: ["Plumbing business valuation"],
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
    { "@type": "ListItem", position: 3, name: "Plumbing business worth", item: PAGE_URL },
  ],
};

// Single source for the visible FAQ and the FAQPage JSON-LD (kept 1:1).
const FAQS: { q: string; a: string }[] = [
  {
    q: "How much is a plumbing business worth?",
    a: "It depends on earnings and risk. Most owner-run plumbing businesses start from Seller's Discretionary Earnings times a risk-adjusted multiple. Service mix, recurring work, licensed staff and owner dependence then move the range up or down.",
  },
  {
    q: "How do you value a plumbing business for sale?",
    a: "Build three years of clean financials, add back owner pay and personal or one-time costs to get SDE, then apply methods that fit the business. Adjust for customer concentration, technician depth, fleet condition and how well the business runs without you.",
  },
  {
    q: "How much is a small plumbing business worth?",
    a: "A small owner-operator shop is usually valued on SDE, because the buyer is often buying a job plus a customer base. If most calls come to you personally and you hold the only license, buyers see more risk and the range is lower.",
  },
  {
    q: "What multiple do plumbing businesses sell for?",
    a: "We don't publish one. Multiples depend on size, earnings quality, recurring revenue, location and financing conditions at the time of sale. Get current figures from a business broker or valuation professional who works with trade businesses.",
  },
  {
    q: "Is SDE or EBITDA used to value a plumbing company?",
    a: "Owner-operated shops usually start from SDE. Larger companies with a manager running day-to-day work are often discussed on EBITDA, which assumes a paid manager replaces the owner. ValuRight shows multiple methods side by side.",
  },
  {
    q: "Does service and maintenance work make a plumbing business worth more?",
    a: "Usually yes. Repeat service customers and maintenance agreements are seen as steadier than one-off new-construction jobs that depend on a few builders. Document renewal history and revenue by line so buyers can see it.",
  },
  {
    q: "Can you sell a plumbing business if you hold the master license?",
    a: "Yes, but plan for it. Buyers will ask who holds the required license after closing. Having another licensed plumber on staff, or agreeing to a transition period, lowers that risk. Check your state's rules with an attorney.",
  },
  {
    q: "Is this a certified appraisal of my plumbing business?",
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
    "Maintenance and service agreements",
    "Agreements that renew bring predictable visits and repair work",
    "Agreement list, start dates, renewal history, what each includes",
  ],
  [
    "Customer concentration",
    "A few builders, property managers or GCs can leave and take the year with them",
    "Revenue by top customers for three years",
  ],
  [
    "Who holds the master license",
    "Buyers ask whether the license leaves with you, and in many places the license controls who can pull permits (rules vary by state)",
    "Licenses held by you and staff, expiration dates, your state's rules (confirm with an attorney)",
  ],
  [
    "Technician tenure and pay structure",
    "Good techs are hard to hire; turnover after a sale hurts revenue",
    "Tech roster, hire dates, licenses, pay plan (hourly, commission, flat-rate)",
  ],
  [
    "Dispatch and field-service software",
    "Call history and customer records a buyer can take over without starting from scratch",
    "Software used, how long it's held data, whether records export cleanly",
  ],
  [
    "Lead sources",
    "Repeat and referral work is steadier than relying on one paid platform",
    "Where new calls come from, by source",
  ],
  [
    "Fleet age and condition",
    "Old trucks mean a near-term bill for the buyer",
    "Vehicle list with year, mileage and service records",
  ],
  [
    "Warranty and callback history",
    "Callbacks signal quality issues and future cost",
    "Callback log, open warranty obligations",
  ],
  [
    "Emergency and after-hours coverage",
    "Shows the business serves customers without you on call",
    "On-call rotation, who covers nights and weekends",
  ],
  [
    "Owner hours in the field vs office",
    "The more you're on the tools, the more of the earnings walk out with you",
    "A typical week: hours on calls, estimating, office",
  ],
  [
    "Permits, insurance and bonding",
    "Problems here can stall a closing",
    "Current certificates, any claims history",
  ],
];

export const Route = createFileRoute("/what-is-my-plumbing-business-worth")({
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
  component: PlumbingWorthLanding,
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

function PlumbingWorthLanding() {
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

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.025_158/0.5),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium text-accent mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Free Preview · Plumbing businesses
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                What is my plumbing business worth?
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                A plumbing business is usually worth a planning range built from Seller's
                Discretionary Earnings (SDE) times a risk-adjusted multiple, then moved up or down by
                service-versus-new-construction mix, recurring maintenance work, licensed technician
                depth, and how much the business still depends on you. Larger shops with a general
                manager or operations manager in place may also hear buyers talk about EBITDA.
                ValuRight Free Preview gives you a planning range in about 15 minutes. It is not a
                certified appraisal or a guaranteed sale price.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                Last updated: October 23, 2026
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
                Planning estimate for plumbing business owners 55+. Not a certified appraisal, not a
                guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Plumbing Free Preview
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Seven methods
                    </span>
                  </div>
                  <p className="mt-3 font-display text-xl font-semibold text-primary">
                    Planning range + Health Score for plumbing shops
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    No "typical plumbing" dollar figures or multiples here. Your range comes from your
                    own numbers after you start Free Preview.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      "Choose the category closest to your shop in Free Preview and note your service lines in your profile.",
                      "SDE-first Main Street methods among seven approaches",
                      "Health Score out of 100 + prioritized recommendations",
                      "What-if scenarios on owner field hours and license coverage",
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

      <div id="how-to-value">
        <Section eyebrow="How to value a plumbing business" title="How to value a plumbing business: 5 steps" alt>
          <ol className="list-decimal space-y-3 pl-5">
            <li>
              <B>Split three years of P&amp;Ls by revenue line.</B> Buyers want to see where the money
              comes from, not one total. Break out service and repair calls, drain and sewer work, water
              heaters, remodel jobs, new construction, commercial contracts and maintenance plans. If
              your bookkeeping lumps them together, your field-service or invoicing software can usually
              rebuild the split.
            </li>
            <li>
              <B>Normalize to SDE.</B> Start with profit, then add back your own pay, your truck, fuel
              and phone if the business pays for them, family members on payroll who don't work full
              time, and true one-time costs. Every add-back needs a receipt or a clear explanation.
              Buyers and their lenders throw out vague ones, and one bad add-back makes them doubt the
              rest.
            </li>
            <li>
              <B>Pick the right lens.</B> Owner-run shops are usually priced on SDE times a multiple.
              Shops with a manager running day-to-day work are often discussed on EBITDA. We don't
              publish multiples. Current figures should come from a broker or valuation professional
              who sees recent plumbing deals in your area.
            </li>
            <li>
              <B>Adjust for risk.</B> The drivers table below lists what buyers check and what to have
              documented. This is where two shops with the same earnings end up with different ranges.
            </li>
            <li>
              <B>Separate what's being sold.</B> List the trucks and stocked van inventory, tools and
              equipment (jetters, cameras, locators), the phone number and brand, the customer list and
              service agreements, and the real estate. If you own the building, decide early whether
              it's part of the sale or leased to the buyer.
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

      <Section eyebrow="Revenue mix" title="Service and repair vs new construction: why the mix matters">
        <p>
          A shop that lives on residential and commercial service calls has many small, repeat
          relationships. A shop that lives on new construction often has a handful of builders. Buyers
          usually see the first as steadier, because losing one customer doesn't sink the year, and
          service work tends to come back when the economy slows.
        </p>
        <p>
          New construction isn't bad. It can keep crews busy and build a name in a growing area. But if
          most of your revenue comes from a few builders or general contractors, a buyer will ask
          whether those relationships are yours or the company's, and what happens when housing starts
          drop.
        </p>
        <p>
          Emergency and after-hours repair work matters too. It's often the work customers remember, and
          it brings them back for the water heater or repipe later. Buyers will want to know who answers
          those calls today. If it's always you, that's a risk to fix before you sell. If it's a
          rotation of techs with a dispatcher, that's something to show off.
        </p>
        <p>
          If you also do heating, many buyers will look at the shop as a mixed trade. Plumbing and
          heating shops should also read{" "}
          <Link to="/what-is-my-hvac-business-worth" className={LINK_CLS}>
            what an HVAC business is worth
          </Link>
          .
        </p>
      </Section>

      <Section eyebrow="Earnings base" title="SDE or EBITDA for a plumbing company?" alt>
        <p>
          <B>SDE</B> (Seller's Discretionary Earnings) is the total yearly benefit to one full-time
          owner: profit plus your pay and the personal or one-time costs the business carries. It fits
          most owner-run shops, where the buyer will step into your role.
        </p>
        <p>
          <B>EBITDA</B> assumes a paid manager already runs the business, so the manager's salary stays
          in as a cost. Buyers, private-equity-backed groups and brokers tend to use it for larger
          plumbing companies with an office team, dispatch and a service manager.
        </p>
        <p>
          Which one a buyer uses changes the math, so know which conversation you're in. Read{" "}
          <Link to="/guides/sde-explained" className={LINK_CLS}>
            what SDE is
          </Link>
          . ValuRight shows several methods side by side so you can see both views.
        </p>
      </Section>

      <Section eyebrow="What moves the range" title="Plumbing value drivers">
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
          scenarios show how the planning range may move if you change them. That's model output from
          your inputs, not a promised sale price. More:{" "}
          <Link to="/guides/exit-readiness" className={LINK_CLS}>
            exit readiness and your Health Score
          </Link>
          .
        </p>
      </Section>

      <Section eyebrow="Add-backs" title="Plumbing add-backs and traps" alt>
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <B>Your truck.</B> If the business pays for a truck you mostly drive personally, it's a fair
            add-back. If it's a working service truck, it isn't, and a buyer will need one too.
          </li>
          <li>
            <B>Spouse or family on payroll.</B> Add back pay above what you'd pay someone else to do the
            same work. If your spouse runs dispatch and the books, a buyer has to replace that person.
          </li>
          <li>
            <B>Cash jobs.</B> Don't count income that wasn't reported. Buyers and lenders won't credit
            it, and raising it can create other problems.
          </li>
          <li>
            <B>Deferred fleet replacement.</B> Skipping truck purchases makes recent profit look better,
            but buyers will see the ages and subtract what's coming.
          </li>
          <li>
            <B>Mislabeled one-time repairs.</B> A big sewer-camera replacement is a one-time cost.
            Replacing worn tools every year is not. Be honest about which is which.
          </li>
        </ul>
      </Section>

      <Section eyebrow="Selling" title="Is a plumbing business profitable to buy, and can you sell one?">
        <p>
          Yes, plumbing businesses sell. Buyers include other plumbing companies expanding into your
          area, larger home-services groups, a key tech or manager who wants to own, and individuals who
          want a business with steady demand. People will always need water heaters replaced and drains
          cleared, and buyers know it.
        </p>
        <p>
          Whether it's profitable for a buyer depends on what they're taking over: steady service
          revenue, a team that stays, trucks that run, and a license and permit setup that survives the
          change in owner. The more of that you can prove on paper, the more buyers you'll have and the
          better your terms will be.
        </p>
        <p>
          Plan the timing, too. Many owners need a few years to train a licensed successor, build
          agreements and clean up the books. Read{" "}
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
          <li>
            Revenue by line (service, drain and sewer, water heaters, remodel, new construction,
            commercial) and by top customers
          </li>
          <li>Service and maintenance agreement list with renewal history</li>
          <li>Technician roster with licenses and hire dates</li>
          <li>Fleet list with year, mileage and service records; equipment list</li>
          <li>Accounts receivable aging</li>
          <li>Warranty and callback log</li>
          <li>Insurance, bonding and license certificates</li>
          <li>Shop or yard lease (term, renewal options, whether it can be assigned)</li>
        </ul>
      </Section>

      <Section eyebrow="Owner dependence" title="Your company, or your phone number?">
        <p>
          If customers call your cell, you hold the only master license, and every estimate goes through
          you, a buyer is buying a job, not a business. They respond with a lower price, a longer
          transition, or more of the price tied to results later. Read{" "}
          <Link to="/guides/owner-dependence" className={LINK_CLS}>
            owner dependence: why buyers discount your business
          </Link>
          .
        </p>
        <h3 className="pt-4 font-display text-xl font-semibold text-primary">
          Plumbing self-check (yes/no)
        </h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Do customers and builders call you directly instead of the office?</li>
          <li>Are you the only licensed master plumber in the company?</li>
          <li>Would two weeks away stop estimating or after-hours coverage?</li>
          <li>Does pricing and job know-how live mostly in your head?</li>
          <li>Are your best techs loyal to you more than to the company?</li>
        </ol>
        <p>
          More yeses mean transferability is your first project, before you settle on an asking price.
        </p>
      </Section>

      <Section eyebrow="Free Preview for plumbing owners" title="What to have ready for Free Preview (about 15 minutes)" alt>
        <ul className="list-disc space-y-2 pl-5">
          <li>Recent P&amp;Ls and a clear list of owner pay and add-backs</li>
          <li>A rough revenue split by line, even informal notes</li>
          <li>Your honest role: hours in the field, estimating, office and on call</li>
          <li>Known truck and equipment replacements you'd disclose anyway</li>
          <li>
            Choose the category closest to your shop and describe your service lines in your profile.
          </li>
        </ul>
        <p>
          <B>Free Preview ($0, no credit card):</B> seven valuation methods, Health Score out of 100,
          prioritized recommendations, what-if scenarios, manual entry and CSV import.
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

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-primary">Common questions</h2>
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
            Ready to see your plumbing business's planning range?
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
        current="/what-is-my-plumbing-business-worth"
        exclude={["/what-is-my-landscaping-business-worth"]}
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
