import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, TrendingUp, Users, FileCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={40} withTagline />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition">How it works</a>
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <Link to="/demo" className="hover:text-foreground transition">See a sample</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-foreground hover:text-accent transition hidden sm:inline">
              Sign in
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.025_158/0.5),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 md:py-28">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-medium text-accent mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Built for owners 55+ planning the next chapter
              </div>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-primary leading-[1.05]">
                Know Your Value.<br />
                Plan Your Exit.<br />
                <span className="text-accent">Live Your Freedom.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
                ValuRight.ai estimates what your business is worth, shows you exactly what's
                holding the number down, and helps you grow it before you sell. Built for
                small-business owners — not Wall Street.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/auth"
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
                Software-generated planning estimate — not a certified appraisal.
              </p>
            </div>

            {/* Hero card visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.28_0.07_250)] p-1 shadow-2xl">
                <div className="rounded-[14px] bg-card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estimated value range</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                      <TrendingUp className="h-3 w-3" /> +18%
                    </span>
                  </div>
                  <div className="font-display text-3xl font-semibold text-primary mt-2">
                    $820K <span className="text-muted-foreground font-normal">–</span> $1.05M
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-accent to-gold" />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <Stat label="Health Score" value="71/100" tone="warning" />
                    <Stat label="Top concern" value="Owner dependence" tone="muted" />
                  </div>
                  <div className="mt-6 space-y-2">
                    <RecRow label="Reduce owner hours" impact="+$140K" />
                    <RecRow label="Add recurring contracts" impact="+$95K" />
                    <RecRow label="Document core SOPs" impact="+$60K" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">How it works</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-primary">Three steps to a confident exit</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Step n="1" title="Tell us about your business" desc="Industry, owner involvement, customers, and three years of financials. Takes about 15 minutes." />
            <Step n="2" title="See your value range" desc="Six valuation methods, a Health Score out of 100, and a clear picture of what buyers will care about." />
            <Step n="3" title="Grow what it's worth" desc="Prioritized recommendations and a what-if builder that shows exactly how each change moves the number." />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Feature icon={<TrendingUp />} title="Six valuation methods" desc="SDE, EBITDA, revenue, DCF, asset-based, and comparable sales — combined into one defensible range." />
            <Feature icon={<ShieldCheck />} title="Buyer-safe teaser" desc="A clean confidential teaser page you control, line by line. Sensitive details stay behind NDA." />
            <Feature icon={<Users />} title="Advisor handshake" desc="Invite your CPA or broker to review assumptions, comment, and approve the report." />
            <Feature icon={<FileCheck />} title="Light data room" desc="Organize financials, tax returns, leases, and more — ready when a buyer asks." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">Pricing</p>
            <h2 className="mt-2 font-display text-4xl font-semibold text-primary">Plans for every stage</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you're ready to prepare for sale.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Plan name="Essentials" price="$99" sub="/month" who="Owner-operator" features={["Ongoing value dashboard", "All six valuation methods", "Health Score & recommendations", "What-if scenarios"]} />
            <Plan name="Exit Ready" price="$249" sub="/month" who="Preparing to sell" features={["Everything in Essentials", "Buyer-safe teaser page", "Data room (5 GB)", "PDF report exports"]} highlighted />
            <Plan name="Advisor Pro" price="$349" sub="/seat / month" who="CPAs & brokers" features={["Portfolio dashboard", "White-label reports", "Review & Approve workflow", "Multiple client businesses"]} />
            <Plan name="One-time Report" price="$799" sub="one-time" who="Just curious" features={["Single valuation report", "Recommendations included", "PDF export", "No subscription"]} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <BrandLogo size={36} variant="onDark" />

              <p className="mt-3 text-sm text-primary-foreground/70 max-w-md">
                Helping business owners over 60 get the value they've built.
              </p>
            </div>
            <div className="text-xs text-primary-foreground/60 max-w-md">
              ValuRight.ai outputs are software-generated planning estimates.
              They are not certified appraisals, tax advice, legal advice, investment advice,
              or guaranteed sale prices.
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

function Stat({ label, value, tone }: { label: string; value: string; tone: "warning" | "muted" }) {
  const dot = tone === "warning" ? "bg-gold" : "bg-muted-foreground/40";
  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function RecRow({ label, impact }: { label: string; impact: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-xs font-semibold text-accent">{impact}</span>
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

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Plan({ name, price, sub, who, features, highlighted }: { name: string; price: string; sub: string; who: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`rounded-xl border p-6 ${highlighted ? "border-accent bg-card shadow-lg ring-2 ring-accent/20" : "border-border bg-card"}`}>
      {highlighted && (
        <div className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground mb-3">
          Most popular
        </div>
      )}
      <h3 className="font-display text-xl font-semibold text-primary">{name}</h3>
      <p className="text-xs text-muted-foreground mt-1">{who}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold text-primary">{price}</span>
        <span className="text-sm text-muted-foreground">{sub}</span>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-foreground">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
