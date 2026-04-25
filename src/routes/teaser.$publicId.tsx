import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mountain, Mail, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/teaser/$publicId")({
  head: () => ({ meta: [{ title: "Confidential Business Profile — ValuRight.ai" }] }),
  loader: async ({ params }) => {
    const { data: biz } = await supabase.from("businesses").select("*").eq("public_id", params.publicId).maybeSingle();
    if (!biz) throw notFound();
    const { data: settings } = await supabase.from("buyer_view_settings").select("*").eq("business_id", biz.id).maybeSingle();
    if (!settings || !settings.is_published) throw notFound();
    const { data: financials } = await supabase.from("financial_years").select("*").eq("business_id", biz.id).order("year", { ascending: true });
    return { business: biz, settings, financials: financials ?? [] };
  },
  component: Teaser,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Listing not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">This listing may have been unpublished or doesn't exist.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-accent hover:underline">Go home</Link>
      </div>
    </div>
  ),
});

function Teaser() {
  const { business, settings, financials } = Route.useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { if (typeof window !== "undefined") window.scrollTo(0, 0); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("buyer_access_requests").insert({
      business_id: business.id, name, email, message,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted(true);
  };

  const highlights = (settings.business_highlights as string[] | null) ?? [];
  const opps = (settings.growth_opportunities as string[] | null) ?? [];

  const latest = financials[financials.length - 1];
  const revBand = latest && Number(latest.revenue) > 0 ? bandFor(Number(latest.revenue)) : null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mountain className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-primary text-sm">valuright.ai</span>
          </Link>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5" /> Confidential listing</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider">Confidential business for sale</span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-primary">{business.industry} · {business.region || "Confidential location"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Established {business.years_in_business ?? "?"} years</p>

          <p className="mt-6 text-foreground leading-relaxed">{business.anonymous_description || "Established business available for acquisition."}</p>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <KPI label="Revenue" value={settings.show_exact_revenue && latest ? fmtCurrency(Number(latest.revenue), { compact: true }) : revBand ?? "Available under NDA"} />
            {settings.show_employee_count && <KPI label="Employees" value={String(business.employees ?? "—")} />}
            {settings.show_profit_margin && latest && <KPI label="EBITDA margin" value={`${((Number(latest.ebitda) / Number(latest.revenue)) * 100).toFixed(0)}%`} />}
            {settings.show_sde && latest && <KPI label="SDE" value={fmtCurrency(Number(latest.ebitda) + Number(latest.owner_salary ?? 0), { compact: true })} />}
            {business.asking_price_low && business.asking_price_high && (
              <KPI label="Asking price" value={`${fmtCurrency(Number(business.asking_price_low), { compact: true })} – ${fmtCurrency(Number(business.asking_price_high), { compact: true })}`} />
            )}
          </div>

          {settings.show_revenue_chart && financials.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-primary mb-3">Revenue trend (indexed)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={financials.map((f) => ({
                  year: String(f.year),
                  value: settings.show_exact_revenue ? Number(f.revenue) : (Number(f.revenue) / Number(financials[0]?.revenue || 1)) * 100,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }} />
                  <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {highlights.length > 0 && (
            <Block title="Business highlights" items={highlights} />
          )}
          {opps.length > 0 && (
            <Block title="Growth opportunities" items={opps} />
          )}
          {settings.transition_support && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-primary mb-2">Transition & support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{settings.transition_support}</p>
            </div>
          )}
          {business.reason_for_sale && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-primary mb-2">Reason for sale</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{business.reason_for_sale}</p>
            </div>
          )}
        </div>

        {/* Request access */}
        <div className="mt-6 rounded-2xl border border-accent/30 bg-card p-8">
          {submitted ? (
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-primary">Request received</h2>
              <p className="mt-2 text-sm text-muted-foreground">The owner will be in touch after reviewing your request.</p>
            </div>
          ) : !showForm ? (
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-primary">Interested in learning more?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Request access to full financials and details under NDA.</p>
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
                <Mail className="h-4 w-4" /> Request access
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 max-w-md mx-auto">
              <h2 className="font-display text-xl font-semibold text-primary text-center">Request more information</h2>
              <input required placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <textarea placeholder="Brief message (optional)" value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <button type="submit" disabled={submitting}
                className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
                {submitting ? "Sending…" : "Submit request"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          Listing powered by ValuRight.ai · Software-generated estimates only · Not a certified appraisal.
        </p>
      </main>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-primary mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground">
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />{it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function bandFor(revenue: number): string {
  if (revenue < 500_000) return "Under $500K";
  if (revenue < 1_000_000) return "$500K – $1M";
  if (revenue < 2_500_000) return "$1M – $2.5M";
  if (revenue < 5_000_000) return "$2.5M – $5M";
  if (revenue < 10_000_000) return "$5M – $10M";
  return "$10M+";
}
