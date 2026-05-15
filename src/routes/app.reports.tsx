import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Download, Eye, Users, Map, X, Printer } from "lucide-react";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports — ValuRight.ai" }] }),
  component: Reports,
});

type ReportKey = "owner" | "buyer" | "advisor" | "roadmap";

const REPORTS: { key: ReportKey; title: string; description: string; audience: string; icon: typeof FileText; accent: string }[] = [
  { key: "owner", title: "Owner Valuation Report", description: "Complete valuation with full financial detail, methods, assumptions, and improvement areas. For your eyes only.", audience: "You", icon: FileText, accent: "bg-accent/10 text-accent" },
  { key: "buyer", title: "Buyer Teaser Report", description: "Anonymized one-pager built from your buyer view settings. Share with prospective buyers before NDA.", audience: "Prospective buyers", icon: Eye, accent: "bg-gold/15 text-foreground" },
  { key: "advisor", title: "Advisor Review Report", description: "Detailed assumptions, valuation methods, and risk drivers for your CPA, broker, or attorney to review and approve.", audience: "Advisors", icon: Users, accent: "bg-primary/10 text-primary" },
  { key: "roadmap", title: "Improvement Roadmap", description: "Prioritized action plan with value impact, timeline, and saved scenarios across Now → Before Sale.", audience: "You + your team", icon: Map, accent: "bg-accent-soft text-accent" },
];

type Bundle = {
  business: any;
  financials: any[];
  valuation: any | null;
  scenarios: any[];
  recommendations: any[];
  buyerSettings: any | null;
};

function Reports() {
  const { current } = useBusiness();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [open, setOpen] = useState<ReportKey | null>(null);

  useEffect(() => {
    if (!current) return;
    Promise.all([
      supabase.from("financial_years").select("*").eq("business_id", current.id).order("year", { ascending: false }),
      supabase.from("valuations").select("*").eq("business_id", current.id).order("computed_at", { ascending: false }).limit(1),
      supabase.from("scenarios").select("*").eq("business_id", current.id).eq("include_in_report", true).order("created_at", { ascending: false }),
      supabase.from("recommendations").select("*").eq("business_id", current.id).order("created_at", { ascending: false }),
      supabase.from("buyer_view_settings").select("*").eq("business_id", current.id).maybeSingle(),
    ]).then(([fy, v, sc, rec, bs]) => {
      setBundle({
        business: current,
        financials: fy.data ?? [],
        valuation: v.data?.[0] ?? null,
        scenarios: sc.data ?? [],
        recommendations: rec.data ?? [],
        buyerSettings: bs.data ?? null,
      });
    });
  }, [current]);

  if (!current) return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">Preview, share, or export polished reports for owners, buyers, and advisors.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${r.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-primary">{r.title}</h2>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">For {r.audience}</div>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{r.description}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setOpen(r.key)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90">
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <button onClick={() => exportReport(r.key, r.title)} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary">
                  <Download className="h-4 w-4" /> Export
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {open && bundle && (
        <ReportPreview reportKey={open} bundle={bundle} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}

function exportReport(_key: ReportKey, title: string) {
  // Simulated PDF export — opens print dialog scoped to the preview frame.
  toast.success(`Generating ${title}…`);
  setTimeout(() => {
    window.print();
  }, 250);
}

function ReportPreview({ reportKey, bundle, onClose }: { reportKey: ReportKey; bundle: Bundle; onClose: () => void }) {
  const r = REPORTS.find((x) => x.key === reportKey)!;
  const { business, financials, valuation, scenarios, recommendations, buyerSettings } = bundle;
  const latest = financials[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-stretch justify-center overflow-y-auto print:bg-white print:static print:overflow-visible">
      <div className="w-full max-w-4xl bg-white text-neutral-900 my-6 rounded-lg shadow-2xl print:my-0 print:rounded-none print:shadow-none print:max-w-none">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-5 py-3 print:hidden">
          <div className="text-sm font-medium">{r.title} — Preview</div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700">
              <Printer className="h-3.5 w-3.5" /> Export PDF
            </button>
            <button onClick={onClose} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100">
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
        </div>

        <div className="p-10 print:p-12 space-y-8 font-sans">
          <header className="border-b border-neutral-200 pb-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{r.title}</div>
            <h1 className="mt-2 font-display text-3xl font-semibold text-neutral-900">
              {reportKey === "buyer" ? (business.anonymous_description || "Confidential business opportunity") : business.name}
            </h1>
            <div className="mt-2 text-sm text-neutral-600">
              {business.industry ?? "—"} · {business.region ?? "—"} · Generated {new Date().toLocaleDateString()}
            </div>
          </header>

          {/* OWNER */}
          {reportKey === "owner" && (
            <>
              <Section title="Estimated value range">
                <BigRange low={valuation?.range_low} mid={valuation?.range_mid} high={valuation?.range_high} />
              </Section>
              <Section title="Valuation methods">
                <Methods v={valuation} />
              </Section>
              <Section title="Financial summary">
                <FinancialsTable rows={financials} />
              </Section>
              <Section title="Key assumptions">
                <Assumptions b={business} />
              </Section>
              <Section title="Improvement areas">
                <RecsList recs={recommendations} />
              </Section>
            </>
          )}

          {/* BUYER */}
          {reportKey === "buyer" && (
            <>
              <Section title="The opportunity">
                <p className="text-sm leading-relaxed text-neutral-700">{business.anonymous_description || "Established business with strong fundamentals available for acquisition."}</p>
              </Section>
              <div className="grid grid-cols-2 gap-4">
                <Tile label="Years in business" value={business.years_in_business ?? "—"} />
                <Tile label="Region" value={business.region ?? "—"} />
                <Tile label="Asking price" value={business.asking_price_low ? `${fmtCurrency(business.asking_price_low, { compact: true })} – ${fmtCurrency(business.asking_price_high, { compact: true })}` : "Inquire"} />
                <Tile label="Reason for sale" value={business.reason_for_sale || "Owner transition"} />
              </div>
              {buyerSettings?.show_exact_revenue && latest && <Tile label="Trailing revenue" value={fmtCurrency(Number(latest.revenue))} />}
              {buyerSettings?.show_employee_count && <Tile label="Employees" value={business.employees ?? "—"} />}
              <Section title="Highlights">
                <ul className="text-sm list-disc list-inside space-y-1 text-neutral-700">
                  {(buyerSettings?.business_highlights as string[] | null ?? ["Recurring customer base", "Diversified revenue", "Documented operations"]).map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </Section>
              <p className="text-xs text-neutral-500 italic">Additional financials, customer detail, and operational documents available under NDA.</p>
            </>
          )}

          {/* ADVISOR */}
          {reportKey === "advisor" && (
            <>
              <Section title="Company summary">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <KV k="Business" v={business.name} />
                  <KV k="Industry" v={`${business.industry ?? "—"} / ${business.sub_industry ?? "—"}`} />
                  <KV k="Years operating" v={business.years_in_business ?? "—"} />
                  <KV k="Employees" v={business.employees ?? "—"} />
                </div>
              </Section>
              <Section title="Financial inputs (3-yr)">
                <FinancialsTable rows={financials} />
              </Section>
              <Section title="Assumptions">
                <Assumptions b={business} />
              </Section>
              <Section title="Valuation methods">
                <Methods v={valuation} />
                <BigRange low={valuation?.range_low} mid={valuation?.range_mid} high={valuation?.range_high} />
              </Section>
              <Section title="Status">
                <div className="text-sm text-neutral-700">Awaiting advisor review &amp; approval. Permissioned advisors can comment on assumptions, edit inputs, or sign off.</div>
              </Section>
            </>
          )}

          {/* ROADMAP */}
          {reportKey === "roadmap" && (
            <>
              <Section title="Plan summary">
                <p className="text-sm text-neutral-700">{scenarios.length} initiative{scenarios.length === 1 ? "" : "s"} in plan. Combined potential lift: <strong>{fmtCurrency(scenarios.reduce((s, x) => s + Number(x.value_delta || 0), 0))}</strong>.</p>
              </Section>
              {(["Now", "Next 90 Days", "Next 6 Months", "Before Sale"] as const).map((phase) => {
                const items = scenarios.filter((s) => (s.roadmap_phase ?? "Next 90 Days") === phase);
                if (items.length === 0) return null;
                return (
                  <Section key={phase} title={phase}>
                    <div className="space-y-3">
                      {items.map((s) => (
                        <div key={s.id} className="rounded-lg border border-neutral-200 p-3">
                          <div className="flex justify-between gap-3">
                            <div className="font-medium text-sm">{s.name}</div>
                            <div className="text-sm font-semibold tabular-nums text-emerald-700">+{fmtCurrency(Number(s.value_delta), { compact: true })}</div>
                          </div>
                          {s.description && <p className="mt-1 text-xs text-neutral-600">{s.description}</p>}
                          {(s.action_steps ?? []).length > 0 && (
                            <ul className="mt-2 text-xs list-disc list-inside text-neutral-700 space-y-0.5">
                              {(s.action_steps as string[]).map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                          )}
                          <div className="mt-1 text-[11px] text-neutral-500">Timeline: {s.timeline_months ?? "—"} mo</div>
                        </div>
                      ))}
                    </div>
                  </Section>
                );
              })}
            </>
          )}

          <footer className="border-t border-neutral-200 pt-4 text-[10px] text-neutral-500">
            Software-generated estimate prepared by ValuRight.ai. Not a certified appraisal.
          </footer>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">{title}</h2>
      {children}
    </section>
  );
}
function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1 font-medium text-neutral-900">{value}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: any }) {
  return (<div><span className="text-neutral-500">{k}:</span> <span className="font-medium">{v ?? "—"}</span></div>);
}
function BigRange({ low, mid, high }: { low: any; mid: any; high: any }) {
  return (
    <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-5">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">Estimated value</div>
      <div className="mt-1 font-display text-3xl font-semibold tabular-nums">{fmtCurrency(Number(mid ?? 0))}</div>
      <div className="text-sm text-neutral-600">Range: {fmtCurrency(Number(low ?? 0), { compact: true })} – {fmtCurrency(Number(high ?? 0), { compact: true })}</div>
    </div>
  );
}
function Methods({ v }: { v: any }) {
  if (!v) return <div className="text-sm text-neutral-500">No valuation computed yet.</div>;
  const rows = [
    ["SDE multiple", v.sde_low, v.sde_high],
    ["EBITDA multiple", v.ebitda_low, v.ebitda_high],
    ["Revenue multiple", v.revenue_low, v.revenue_high],
    ["Discounted cash flow", v.dcf_low, v.dcf_high],
    ["Asset-based", v.asset_low, v.asset_high],
  ].filter(([, lo, hi]) => Number(lo) > 0 || Number(hi) > 0);
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(([name, lo, hi]) => (
          <tr key={name as string} className="border-b border-neutral-100"><td className="py-2 text-neutral-600">{name}</td><td className="py-2 text-right tabular-nums">{fmtCurrency(Number(lo), { compact: true })} – {fmtCurrency(Number(hi), { compact: true })}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
function FinancialsTable({ rows }: { rows: any[] }) {
  if (!rows.length) return <div className="text-sm text-neutral-500">No financial data available.</div>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-[10px] uppercase tracking-wider text-neutral-500"><th className="py-2">Year</th><th className="py-2 text-right">Revenue</th><th className="py-2 text-right">EBITDA</th><th className="py-2 text-right">Net income</th></tr></thead>
      <tbody>
        {rows.map((f) => (
          <tr key={f.year} className="border-b border-neutral-100"><td className="py-2">{f.year}</td><td className="py-2 text-right tabular-nums">{fmtCurrency(Number(f.revenue))}</td><td className="py-2 text-right tabular-nums">{fmtCurrency(Number(f.ebitda))}</td><td className="py-2 text-right tabular-nums">{fmtCurrency(Number(f.net_income))}</td></tr>
        ))}
      </tbody>
    </table>
  );
}
function Assumptions({ b }: { b: any }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <KV k="Owner hours/wk" v={b.owner_hours_per_week} />
      <KV k="Recurring revenue" v={b.recurring_revenue_pct != null ? fmtPct(Number(b.recurring_revenue_pct)) : "—"} />
      <KV k="Top customer concentration" v={b.top_customer_concentration_pct != null ? fmtPct(Number(b.top_customer_concentration_pct)) : "—"} />
      <KV k="SOP status" v={b.sop_status} />
      <KV k="Manager depth" v={b.manager_team_depth} />
      <KV k="Owner in sales / ops / CX" v={[b.owner_in_sales, b.owner_in_operations, b.owner_in_customer_relationships].filter(Boolean).length + " of 3"} />
    </div>
  );
}
function RecsList({ recs }: { recs: any[] }) {
  if (!recs.length) return <div className="text-sm text-neutral-500">No improvement recommendations yet.</div>;
  return (
    <ul className="space-y-2">
      {recs.slice(0, 6).map((r) => (
        <li key={r.id} className="rounded-md border border-neutral-200 p-3">
          <div className="flex justify-between gap-3"><div className="font-medium text-sm">{r.title}</div><div className="text-xs text-neutral-500">{r.priority}</div></div>
          <div className="mt-1 text-xs text-neutral-600">{r.description}</div>
        </li>
      ))}
    </ul>
  );
}
