import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mountain, Mail, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { notifyBuyerLeadCreated } from "@/lib/buyer-lead-notifications.functions";
import { ValuationDisclaimer } from "@/components/ValuationDisclaimer";
import { AccessibleChart } from "@/components/AccessibleChart";
import { displayIndustryLabel } from "@/lib/industry-display";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type PublicBusiness = {
  public_id: string;
  industry: string | null;
  sub_industry: string | null;
  region: string | null;
  years_in_business: number | null;
  employees: number | null;
  anonymous_description: string | null;
  asking_price_low: number | null;
  asking_price_high: number | null;
  reason_for_sale: string | null;
  top_customer_concentration_pct: number | null;
};

type PublicTeaserSettings = {
  show_exact_revenue: boolean;
  show_revenue_chart: boolean;
  show_profit_margin: boolean;
  show_sde: boolean;
  show_employee_count: boolean;
  show_customer_concentration?: boolean;
  show_valuation_breakdown?: boolean;
  show_scenarios?: boolean;
  show_photos?: boolean;
  business_highlights: string[] | null;
  growth_opportunities: string[] | null;
  transition_support: string | null;
  is_published: boolean;
};

type PublicFinancial = {
  year: number;
  revenue: number | null;
  revenue_band: string | null;
  revenue_index: number | null;
  ebitda_margin_pct: number | null;
  sde: number | null;
};

type PublicTeaserPayload = {
  business: PublicBusiness;
  settings: PublicTeaserSettings;
  financials: PublicFinancial[];
};

export const Route = createFileRoute("/teaser/$publicId")({
  head: () => ({ meta: [{ title: "Confidential Business Profile — ValuRight.ai" }] }),
  loader: async ({ params }) => {
    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "get_public_teaser",
          args: { _public_id: string },
        ) => Promise<{ data: PublicTeaserPayload | null; error: Error | null }>;
      }
    ).rpc("get_public_teaser", { _public_id: params.publicId });

    if (error || !data?.business || !data?.settings?.is_published) throw notFound();
    return { business: data.business, settings: data.settings, financials: data.financials ?? [] };
  },
  component: Teaser,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold text-primary">Listing not available</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This listing may have been unpublished or doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm font-semibold text-accent hover:underline"
        >
          Go home
        </Link>
      </div>
    </div>
  ),
});

function Teaser() {
  const { business, settings, financials } = Route.useLoaderData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [financing, setFinancing] = useState("");
  const [message, setMessage] = useState("");
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const sendLeadNotifications = useServerFn(notifyBuyerLeadCreated);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ack) {
      toast.error("Please acknowledge confidentiality.");
      return;
    }
    setSubmitting(true);
    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "submit_buyer_access_request",
          args: {
            _public_id: string;
            _name: string;
            _email: string;
            _phone: string | null;
            _buyer_type: string | null;
            _financing_status: string | null;
            _message: string | null;
          },
        ) => Promise<{
          data: { request_id: string; notification_token: string } | null;
          error: Error | null;
        }>;
      }
    ).rpc("submit_buyer_access_request", {
      _public_id: business.public_id,
      _name: name,
      _email: email,
      _phone: phone || null,
      _buyer_type: buyerType || null,
      _financing_status: financing || null,
      _message: message || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubmitted(true);

    if (data?.request_id && data.notification_token) {
      void sendLeadNotifications({
        data: {
          requestId: data.request_id,
          notificationToken: data.notification_token,
        },
      }).catch((notificationError) => {
        console.error("Buyer lead notification failed", notificationError);
      });
    }
  };

  const highlights = (settings.business_highlights as string[] | null) ?? [];
  const opps = (settings.growth_opportunities as string[] | null) ?? [];

  const latest = financials[financials.length - 1];
  const revBand = latest?.revenue_band ?? null;
  const revenueChartSummary = settings.show_exact_revenue
    ? `Revenue trend across ${financials.length} year${financials.length === 1 ? "" : "s"}. Latest disclosed revenue is ${fmtCurrency(Number(latest?.revenue ?? 0), { compact: true })}.`
    : `Indexed revenue trend across ${financials.length} year${financials.length === 1 ? "" : "s"}. Exact revenue is not disclosed before owner approval.`;

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
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> Confidential listing
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <span className="inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider">
            Confidential business for sale
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-primary">
            {displayIndustryLabel(business.industry, business.sub_industry)} ·{" "}
            {business.region || "Confidential location"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Established {business.years_in_business ?? "?"} years
          </p>

          <p className="mt-6 text-foreground leading-relaxed">
            {business.anonymous_description || "Established business available for acquisition."}
          </p>

          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <KPI
              label="Revenue"
              value={
                settings.show_exact_revenue && latest?.revenue != null
                  ? fmtCurrency(Number(latest.revenue), { compact: true })
                  : (revBand ?? "Available under NDA")
              }
            />
            {settings.show_employee_count && (
              <KPI label="Employees" value={String(business.employees ?? "—")} />
            )}
            {settings.show_profit_margin && latest?.ebitda_margin_pct != null && (
              <KPI
                label="EBITDA margin"
                value={`${Number(latest.ebitda_margin_pct).toFixed(0)}%`}
              />
            )}
            {settings.show_sde && latest?.sde != null && (
              <KPI label="SDE" value={fmtCurrency(Number(latest.sde), { compact: true })} />
            )}
            {(settings as { show_customer_concentration?: boolean }).show_customer_concentration &&
              business.top_customer_concentration_pct != null && (
                <KPI
                  label="Top-customer concentration"
                  value={`${Number(business.top_customer_concentration_pct).toFixed(0)}%`}
                />
              )}
            {business.asking_price_low && business.asking_price_high && (
              <KPI
                label="Asking price"
                value={`${fmtCurrency(Number(business.asking_price_low), { compact: true })} – ${fmtCurrency(Number(business.asking_price_high), { compact: true })}`}
              />
            )}
          </div>

          {settings.show_revenue_chart && financials.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-primary mb-3">Revenue trend (indexed)</h3>
              <AccessibleChart title="Buyer teaser revenue trend" summary={revenueChartSummary}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={financials.map((f: PublicFinancial) => ({
                      year: String(f.year),
                      value: settings.show_exact_revenue
                        ? Number(f.revenue ?? 0)
                        : Number(f.revenue_index ?? 0),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                    <Bar dataKey="value" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </AccessibleChart>
            </div>
          )}

          {highlights.length > 0 && <Block title="Business highlights" items={highlights} />}
          {opps.length > 0 && <Block title="Growth opportunities" items={opps} />}
          {settings.transition_support && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-primary mb-2">Transition & support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {settings.transition_support}
              </p>
            </div>
          )}
          {business.reason_for_sale && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-primary mb-2">Reason for sale</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {business.reason_for_sale}
              </p>
            </div>
          )}
          {(settings.show_valuation_breakdown ||
            settings.show_scenarios ||
            settings.show_photos) && (
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {settings.show_valuation_breakdown && (
                <BuyerSafeNote
                  title="Valuation context"
                  body="Assumptions and method detail can be discussed with qualified buyers during diligence."
                />
              )}
              {settings.show_scenarios && (
                <BuyerSafeNote
                  title="Improvement scenarios"
                  body="Upside scenarios are available for qualified buyers after owner review."
                />
              )}
              {settings.show_photos && (
                <BuyerSafeNote
                  title="Photos and assets"
                  body="Photos or asset materials may be shared after owner approval."
                />
              )}
            </div>
          )}
        </div>

        {/* Request access */}
        <div className="mt-6 rounded-2xl border border-accent/30 bg-card p-8">
          {submitted ? (
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-primary">Request received</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The owner will be in touch after reviewing your request.
              </p>
            </div>
          ) : !showForm ? (
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-primary">
                Interested in learning more?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Request access to full financials and details under NDA.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
              >
                <Mail className="h-4 w-4" /> Request access
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 max-w-md mx-auto">
              <h2 className="font-display text-xl font-semibold text-primary text-center">
                Request more information
              </h2>
              <label htmlFor="buyer-name" className="sr-only">
                Your name
              </label>
              <input
                id="buyer-name"
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <label htmlFor="buyer-email" className="sr-only">
                Email
              </label>
              <input
                id="buyer-email"
                required
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <label htmlFor="buyer-phone" className="sr-only">
                Phone
              </label>
              <input
                id="buyer-phone"
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <label htmlFor="buyer-type" className="sr-only">
                Buyer type
              </label>
              <select
                id="buyer-type"
                value={buyerType}
                onChange={(e) => setBuyerType(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Buyer type…</option>
                <option value="individual">Individual buyer</option>
                <option value="strategic">Strategic acquirer</option>
                <option value="financial">Financial / PE</option>
                <option value="search_fund">Search fund</option>
                <option value="other">Other</option>
              </select>
              <label htmlFor="buyer-financing" className="sr-only">
                Financing status
              </label>
              <select
                id="buyer-financing"
                value={financing}
                onChange={(e) => setFinancing(e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Financing status…</option>
                <option value="cash">Cash</option>
                <option value="sba_pre_approved">SBA pre-approved</option>
                <option value="sba_unverified">SBA not verified</option>
                <option value="seller_financing">Needs seller financing</option>
                <option value="other">Other / exploring</option>
              </select>
              <label htmlFor="buyer-message" className="sr-only">
                Brief message
              </label>
              <textarea
                id="buyer-message"
                placeholder="Brief message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-0.5 accent-[oklch(0.45_0.1_158)]"
                />
                <span>
                  I acknowledge this listing is confidential. I will not disclose, share, or contact
                  employees, customers, or vendors of this business based on information learned
                  here, and will sign an NDA before receiving sensitive financials.
                </span>
              </label>
              <button
                type="submit"
                disabled={submitting || !ack}
                className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Submit request"}
              </button>
            </form>
          )}
        </div>

        <ValuationDisclaimer className="mt-8" />
      </main>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </div>
      <div className="mt-1 font-semibold text-foreground">{value}</div>
    </div>
  );
}

function BuyerSafeNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <div className="text-xs font-semibold text-primary">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
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
            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
