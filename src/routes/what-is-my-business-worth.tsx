import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles, TrendingUp, ShieldCheck, Users, FileCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";

export const Route = createFileRoute("/what-is-my-business-worth")({
  head: () => ({
    meta: [
      { title: "What Is My Business Worth? Free Planning Range | ValuRight" },
      {
        name: "description",
        content:
          "See a planning range for your small business in minutes. Built for owners 55+ — multi-method estimate, Health Score, and what may be holding the number down. Not a certified appraisal.",
      },
      {
        property: "og:title",
        content: "What Is My Business Worth? Free Planning Range | ValuRight",
      },
      {
        property: "og:description",
        content:
          "See a planning range for your small business in minutes. Built for owners 55+ — multi-method estimate, Health Score, and what may be holding the number down. Not a certified appraisal.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://valuright.ai/what-is-my-business-worth",
      },
    ],
    links: [{ rel: "canonical", href: "https://valuright.ai/what-is-my-business-worth" }],
    scripts: [
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Is this a certified appraisal?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"No. It is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker, or appraiser.\"}}, {\"@type\": \"Question\", \"name\": \"How long does Free Preview take?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"About 15 minutes if you have recent financials handy.\"}}, {\"@type\": \"Question\", \"name\": \"Who is it for?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Small-business owners \u2014 especially owners 55+ planning the next chapter \u2014 not Wall Street models.\"}}, {\"@type\": \"Question\", \"name\": \"SDE or EBITDA?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Owner-operated Main Street businesses usually start with Seller\u2019s Discretionary Earnings (SDE). Businesses that can run with hired management lean more on EBITDA. ValuRight shows both in context.\"}}]}",
      },
      {
        type: "application/ld+json",
        children: "{\"@context\": \"https://schema.org\", \"@type\": \"BreadcrumbList\", \"itemListElement\": [{\"@type\": \"ListItem\", \"position\": 1, \"name\": \"Home\", \"item\": \"https://valuright.ai/\"}, {\"@type\": \"ListItem\", \"position\": 2, \"name\": \"What is my business worth?\", \"item\": \"https://valuright.ai/what-is-my-business-worth\"}]}",
      },
    ],
  }),
  component: WorthLanding,
});

function WorthLanding() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={40} withTagline />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition">
              How it works
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
                Free Preview · No credit card
              </div>
              <p className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">
                What is my business worth?
              </p>
              <h1 className="font-display text-5xl md:text-6xl font-semibold tracking-tight text-primary leading-[1.05]">
                Know your value before you sell
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                Get a free planning range for your Main Street business — then see what buyers may
                discount for owner dependence and other risks.
              </p>
              <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                Enter your industry, owner involvement, and recent financials. ValuRight runs seven
                valuation methods (including SDE, EBITDA, and cap rate where it fits), blends a
                planning range, and shows a Health Score with the top issues that may be holding the
                number down.
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
                Planning estimate for owners 55+ — not Wall Street, not a certified appraisal, not a
                guaranteed sale price.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Estimated value range
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> Free Preview
                    </span>
                  </div>
                  <div className="font-display text-3xl font-semibold text-primary mt-2">
                    $820K <span className="text-muted-foreground font-normal">–</span> $1.05M
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-gold" />
                  </div>
                  <ul className="mt-6 space-y-3 text-sm text-foreground">
                    {[
                      "Planning range from multiple methods, not a single rule of thumb",
                      "Health Score out of 100 + prioritized recommendations",
                      "What-if scenarios: reduce owner hours, add recurring revenue, document SOPs",
                      "Built for owner-operators planning the next chapter",
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

      <section id="how-it-works" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">How it works</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-primary">
              Three steps to a confident exit
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              n="1"
              title="Tell us about your business"
              desc="Industry, owner involvement, customers, and three years of financials. Takes about 15 minutes."
            />
            <Step
              n="2"
              title="See your value range"
              desc="Seven valuation methods, a Health Score out of 100, and a clear picture of what buyers will care about."
            />
            <Step
              n="3"
              title="Improve exit readiness"
              desc="Prioritized recommendations and a what-if builder that shows how each change may affect the planning range."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Plans</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-primary">
              Free Preview vs paid
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            <PlanCard
              name="Free Preview"
              price="$0"
              sub="No credit card"
              features={[
                "All seven methods",
                "Health Score, recommendations, what-if",
                "Manual/CSV entry",
              ]}
              cta="Start your free valuation"
              to="/auth"
              search={{ mode: "signup" as const }}
              highlighted
            />
            <PlanCard
              name="Essentials"
              price="$99"
              sub="/mo"
              features={["Adds QuickBooks/Xero"]}
              cta="See pricing"
              to="/pricing"
              search={{ checkout: undefined }}
            />
            <PlanCard
              name="Exit Ready"
              price="$249"
              sub="/mo"
              features={["Buyer teaser, data room, advisor review"]}
              cta="See pricing"
              to="/pricing"
              search={{ checkout: undefined }}
            />
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/pricing"
              search={{ checkout: undefined }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
            >
              See full pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold uppercase tracking-wider text-accent">
                Why the number feels wrong
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-primary">
                Owner dependence often explains the gap
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Many owners are surprised when a buyer&apos;s view is lower than &ldquo;what I think
                it&apos;s worth.&rdquo; A common reason is owner dependence — if you are the
                rainmaker and the playbook lives in your head, buyers discount the price or demand a
                longer transition. ValuRight&apos;s Health Score surfaces that risk early.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  to="/guides/owner-dependence"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                >
                  Read: Owner dependence <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
                >
                  Start your free valuation <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 grid gap-4">
              <Feature
                icon={<TrendingUp className="h-5 w-5" />}
                title="Seven valuation methods"
                desc="SDE, EBITDA, revenue, DCF, asset-based, comps, and cap rate where it fits."
              />
              <Feature
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Health Score"
                desc="See what may be holding the number down before you talk to buyers."
              />
              <Feature
                icon={<Users className="h-5 w-5" />}
                title="Built for Main Street"
                desc="Owner-operators planning the next chapter — not Wall Street models."
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
              q="Is this a certified appraisal?"
              a="No. It is a software-generated planning estimate to help you understand a range and value drivers before you talk to a CPA, broker, or appraiser."
            />
            <Faq
              q="How long does Free Preview take?"
              a="About 15 minutes if you have recent financials handy."
            />
            <Faq
              q="Who is it for?"
              a="Small-business owners — especially owners 55+ planning the next chapter — not Wall Street models."
            />
            <Faq
              q="SDE or EBITDA?"
              a={
                <>
                  Owner-operated Main Street businesses usually start with Seller&apos;s Discretionary
                  Earnings (SDE). Businesses that can run with hired management lean more on EBITDA.
                  ValuRight shows both in context.{" "}
                  <Link
                    to="/guides/how-to-value-a-small-business"
                    className="font-semibold text-accent hover:underline"
                  >
                    More in the owner&apos;s guide
                  </Link>
                  .
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
            Ready to see your planning range?
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
          <p className="mt-6 text-xs text-muted-foreground">{VALUATION_DISCLAIMER_SHORT}</p>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <BrandLogo size={36} variant="onDark" />
              <p className="mt-3 text-sm text-primary-foreground/70 max-w-md">
                Planning estimates for Main Street owners preparing the next chapter.
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
                <Link
                  to="/guides/how-to-value-a-small-business"
                  className="hover:text-primary-foreground"
                >
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

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-display font-semibold">
        {n}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-muted-foreground leading-relaxed">{desc}</p>
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
  desc: string;
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

function PlanCard({
  name,
  price,
  sub,
  features,
  cta,
  to,
  search,
  highlighted,
}: {
  name: string;
  price: string;
  sub: string;
  features: string[];
  cta: string;
  to: "/auth" | "/pricing";
  search: { mode: "signup" } | { checkout: undefined };
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlighted
          ? "border-accent bg-card shadow-lg ring-2 ring-accent/20"
          : "border-border bg-card"
      }`}
    >
      <h3 className="font-display text-xl font-semibold text-primary">{name}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold text-primary">{price}</span>
        <span className="text-sm text-muted-foreground">{sub}</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-foreground">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Link
        to={to}
        search={search}
        className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
          highlighted
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "border border-border bg-card text-foreground hover:border-accent hover:text-accent"
        }`}
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
