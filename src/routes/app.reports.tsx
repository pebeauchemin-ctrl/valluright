import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Download, Eye, Users, Map, X, Printer } from "lucide-react";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency, fmtPct } from "@/lib/format";
import { toast } from "sonner";
import { ValuationDisclaimer } from "@/components/ValuationDisclaimer";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports — ValuRight.ai" }] }),
  component: Reports,
});

type ReportKey = "owner" | "buyer" | "advisor" | "roadmap";
type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
type FinancialYearRow = Database["public"]["Tables"]["financial_years"]["Row"];
type ValuationRow = Database["public"]["Tables"]["valuations"]["Row"];
type ScenarioRow = Database["public"]["Tables"]["scenarios"]["Row"];
type RecommendationRow = Database["public"]["Tables"]["recommendations"]["Row"];
type BuyerSettingsRow = Database["public"]["Tables"]["buyer_view_settings"]["Row"];

const REPORTS: {
  key: ReportKey;
  title: string;
  description: string;
  audience: string;
  icon: typeof FileText;
  accent: string;
}[] = [
  {
    key: "owner",
    title: "Owner Valuation Report",
    description:
      "Owner planning report with full financial detail, methods, assumptions, and improvement areas. For your eyes only.",
    audience: "You",
    icon: FileText,
    accent: "bg-accent/10 text-accent",
  },
  {
    key: "buyer",
    title: "Buyer Teaser Report",
    description:
      "Anonymized one-pager built from your buyer view settings. Share with prospective buyers before NDA.",
    audience: "Prospective buyers",
    icon: Eye,
    accent: "bg-gold/15 text-foreground",
  },
  {
    key: "advisor",
    title: "Advisor Review Report",
    description:
      "Detailed assumptions, valuation methods, and risk drivers for your CPA, broker, or attorney to review and comment on.",
    audience: "Advisors",
    icon: Users,
    accent: "bg-primary/10 text-primary",
  },
  {
    key: "roadmap",
    title: "Improvement Roadmap",
    description:
      "Prioritized action plan with value impact, timeline, and saved scenarios across Now → Before Sale.",
    audience: "You + your team",
    icon: Map,
    accent: "bg-accent-soft text-accent",
  },
];

type Bundle = {
  business: BusinessRow;
  financials: FinancialYearRow[];
  valuation: ValuationRow | null;
  scenarios: ScenarioRow[];
  recommendations: RecommendationRow[];
  buyerSettings: BuyerSettingsRow | null;
};

function Reports() {
  const { current } = useBusiness();
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [open, setOpen] = useState<ReportKey | null>(null);
  const [printOnOpen, setPrintOnOpen] = useState(false);

  useEffect(() => {
    if (!current) return;
    Promise.all([
      supabase
        .from("financial_years")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: false }),
      supabase
        .from("valuations")
        .select("*")
        .eq("business_id", current.id)
        .order("computed_at", { ascending: false })
        .limit(1),
      supabase
        .from("scenarios")
        .select("*")
        .eq("business_id", current.id)
        .eq("include_in_report", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("recommendations")
        .select("*")
        .eq("business_id", current.id)
        .order("created_at", { ascending: false }),
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

  useEffect(() => {
    if (!open || !bundle || !printOnOpen) return;
    const timeout = window.setTimeout(() => {
      window.print();
      setPrintOnOpen(false);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [bundle, open, printOnOpen]);

  if (!current)
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preview printable reports for owners, buyers, and advisors. Use your browser print dialog
          to save a PDF.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${r.accent}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-primary">{r.title}</h2>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                For {r.audience}
              </div>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{r.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setOpen(r.key)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  <Eye className="h-4 w-4" /> Preview
                </button>
                <button
                  onClick={() => {
                    setOpen(r.key);
                    setPrintOnOpen(true);
                    toast.info(`Opening print dialog for ${r.title}. Choose "Save as PDF".`);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  <Download className="h-4 w-4" /> Print / PDF
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

function ReportPreview({
  reportKey,
  bundle,
  onClose,
}: {
  reportKey: ReportKey;
  bundle: Bundle;
  onClose: () => void;
}) {
  const r = REPORTS.find((x) => x.key === reportKey)!;
  const { business, financials, valuation, scenarios, recommendations, buyerSettings } = bundle;
  const latest = financials[0];
  const risks = buildKeyRisks(business, financials);
  const dataNotes = buildDataQualityNotes(financials, valuation);
  const confidence = confidenceLabel(financials, valuation);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-stretch justify-center overflow-y-auto print:bg-white print:static print:overflow-visible">
      <div className="my-3 w-full max-w-4xl bg-white text-neutral-900 shadow-2xl sm:my-6 sm:rounded-lg print:my-0 print:max-w-none print:rounded-none print:shadow-none">
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-3 print:hidden sm:px-5">
          <div className="min-w-0 text-sm font-medium">{r.title} — Preview</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700"
            >
              <Printer className="h-3.5 w-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-100"
            >
              <X className="h-3.5 w-3.5" /> Close
            </button>
          </div>
        </div>

        <div className="space-y-8 p-4 font-sans sm:p-10 print:p-12">
          <header className="border-b border-neutral-200 pb-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{r.title}</div>
            <h1 className="mt-2 font-display text-3xl font-semibold text-neutral-900">
              {reportKey === "buyer"
                ? business.anonymous_description || "Confidential business opportunity"
                : business.name}
            </h1>
            <div className="mt-2 text-sm text-neutral-600">
              {business.industry ?? "—"} · {business.region ?? "—"} · Generated{" "}
              {new Date().toLocaleDateString()}
            </div>
          </header>

          {/* OWNER */}
          {reportKey === "owner" && (
            <>
              <Section title="Business summary">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Tile label="Business" value={business.name} />
                  <Tile
                    label="Industry"
                    value={`${business.industry ?? "—"} / ${business.sub_industry ?? "—"}`}
                  />
                  <Tile label="Region" value={business.region ?? "—"} />
                  <Tile label="Years operating" value={business.years_in_business ?? "—"} />
                  <Tile label="Employees" value={business.employees ?? "—"} />
                  <Tile label="Exit timeline" value={formatExitTimeline(business.exit_timeline)} />
                </div>
              </Section>
              <Section title="Estimated value range">
                <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr]">
                  <BigRange
                    low={valuation?.range_low}
                    mid={valuation?.range_mid}
                    high={valuation?.range_high}
                  />
                  <div className="rounded-xl border border-neutral-200 p-5">
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Report confidence
                    </div>
                    <div className="mt-1 font-display text-2xl font-semibold">{confidence}</div>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                      Based on saved financial history, balance-sheet detail, and the latest saved
                      valuation snapshot.
                    </p>
                    <p className="mt-3 text-[11px] text-neutral-500">
                      Saved valuation:{" "}
                      {valuation?.computed_at
                        ? new Date(valuation.computed_at).toLocaleString()
                        : "Not saved yet"}
                    </p>
                  </div>
                </div>
              </Section>
              <Section title="Health score">
                <HealthScore valuation={valuation} />
              </Section>
              <Section title="Financial summary">
                <FinancialsTable rows={financials} />
              </Section>
              <Section title="Valuation method breakdown">
                <Methods v={valuation} financials={financials} />
              </Section>
              <Section title="Key assumptions">
                <Assumptions b={business} />
              </Section>
              <Section title="Key risks">
                <RiskList risks={risks} />
              </Section>
              <Section title="Recommendations">
                <RecsList recs={recommendations} />
              </Section>
              <Section title="Saved scenarios">
                <ScenarioList scenarios={scenarios} />
              </Section>
              <Section title="Data quality notes">
                <ul className="space-y-1.5 text-sm leading-relaxed text-neutral-700">
                  {dataNotes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                      {note}
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          )}

          {/* BUYER */}
          {reportKey === "buyer" && (
            <>
              <Section title="The opportunity">
                <p className="text-sm leading-relaxed text-neutral-700">
                  {business.anonymous_description ||
                    "Established business with strong fundamentals available for acquisition."}
                </p>
              </Section>
              <div className="grid gap-4 sm:grid-cols-2">
                <Tile label="Years in business" value={business.years_in_business ?? "—"} />
                <Tile label="Region" value={business.region ?? "—"} />
                <Tile
                  label="Asking price"
                  value={
                    business.asking_price_low
                      ? `${fmtCurrency(business.asking_price_low, { compact: true })} – ${fmtCurrency(business.asking_price_high, { compact: true })}`
                      : "Inquire"
                  }
                />
                <Tile
                  label="Reason for sale"
                  value={business.reason_for_sale || "Owner transition"}
                />
              </div>
              {buyerSettings?.show_exact_revenue && latest && (
                <Tile label="Trailing revenue" value={fmtCurrency(Number(latest.revenue))} />
              )}
              {buyerSettings?.show_employee_count && (
                <Tile label="Employees" value={business.employees ?? "—"} />
              )}
              <Section title="Highlights">
                <ul className="text-sm list-disc list-inside space-y-1 text-neutral-700">
                  {(
                    (buyerSettings?.business_highlights as string[] | null) ?? [
                      "Recurring customer base",
                      "Diversified revenue",
                      "Documented operations",
                    ]
                  ).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </Section>
              <p className="text-xs text-neutral-500 italic">
                Additional financials, customer detail, and operational documents available under
                NDA.
              </p>
            </>
          )}

          {/* ADVISOR */}
          {reportKey === "advisor" && (
            <>
              <Section title="Company summary">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <KV k="Business" v={business.name} />
                  <KV
                    k="Industry"
                    v={`${business.industry ?? "—"} / ${business.sub_industry ?? "—"}`}
                  />
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
                <Methods v={valuation} financials={financials} />
                <BigRange
                  low={valuation?.range_low}
                  mid={valuation?.range_mid}
                  high={valuation?.range_high}
                />
              </Section>
              <Section title="Status">
                <div className="text-sm text-neutral-700">
                  Awaiting advisor review. Permissioned advisors can comment on assumptions and edit
                  inputs. Advisor workflow status does not make this a certified appraisal, legal
                  opinion, tax opinion, investment advice, or guaranteed sale price.
                </div>
              </Section>
            </>
          )}

          {/* ROADMAP */}
          {reportKey === "roadmap" && (
            <>
              <Section title="Plan summary">
                <p className="text-sm text-neutral-700">
                  {scenarios.length} initiative{scenarios.length === 1 ? "" : "s"} in plan. Combined
                  potential lift:{" "}
                  <strong>
                    {fmtCurrency(scenarios.reduce((s, x) => s + Number(x.value_delta || 0), 0))}
                  </strong>
                  .
                </p>
              </Section>
              {(["Now", "Next 90 Days", "Next 6 Months", "Before Sale"] as const).map((phase) => {
                const items = scenarios.filter(
                  (s) => (s.roadmap_phase ?? "Next 90 Days") === phase,
                );
                if (items.length === 0) return null;
                return (
                  <Section key={phase} title={phase}>
                    <div className="space-y-3">
                      {items.map((s) => (
                        <div key={s.id} className="rounded-lg border border-neutral-200 p-3">
                          <div className="flex justify-between gap-3">
                            <div className="font-medium text-sm">{s.name}</div>
                            <div className="text-sm font-semibold tabular-nums text-emerald-700">
                              +{fmtCurrency(Number(s.value_delta), { compact: true })}
                            </div>
                          </div>
                          {s.description && (
                            <p className="mt-1 text-xs text-neutral-600">{s.description}</p>
                          )}
                          {(s.action_steps ?? []).length > 0 && (
                            <ul className="mt-2 text-xs list-disc list-inside text-neutral-700 space-y-0.5">
                              {(s.action_steps as string[]).map((a, i) => (
                                <li key={i}>{a}</li>
                              ))}
                            </ul>
                          )}
                          <div className="mt-1 text-[11px] text-neutral-500">
                            Timeline: {s.timeline_months ?? "—"} mo
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                );
              })}
            </>
          )}

          <ValuationDisclaimer variant="print" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
function Tile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="mt-1 font-medium text-neutral-900">{value}</div>
    </div>
  );
}
function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <span className="text-neutral-500">{k}:</span> <span className="font-medium">{v ?? "—"}</span>
    </div>
  );
}
function BigRange({
  low,
  mid,
  high,
}: {
  low: number | null | undefined;
  mid: number | null | undefined;
  high: number | null | undefined;
}) {
  return (
    <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-5">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">Estimated value</div>
      <div className="mt-1 font-display text-3xl font-semibold tabular-nums">
        {fmtCurrency(Number(mid ?? 0))}
      </div>
      <div className="text-sm text-neutral-600">
        Range: {fmtCurrency(Number(low ?? 0), { compact: true })} –{" "}
        {fmtCurrency(Number(high ?? 0), { compact: true })}
      </div>
    </div>
  );
}
function Methods({ v, financials }: { v: ValuationRow | null; financials: FinancialYearRow[] }) {
  if (!v) return <div className="text-sm text-neutral-500">No valuation computed yet.</div>;
  const rows = [
    methodRow("SDE multiple", v.sde_value, v.sde_low, v.sde_high, financials),
    methodRow("EBITDA multiple", v.ebitda_value, v.ebitda_low, v.ebitda_high, financials),
    methodRow("Revenue multiple", v.revenue_value, v.revenue_low, v.revenue_high, financials),
    methodRow("Discounted cash flow", v.dcf_value, v.dcf_low, v.dcf_high, financials),
    methodRow("Asset-based", v.asset_value, v.asset_low, v.asset_high, financials),
  ].filter((row) => Number(row.low) > 0 || Number(row.high) > 0);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-neutral-200 text-left text-[10px] uppercase tracking-wider text-neutral-500">
          <th className="py-2">Method</th>
          <th className="py-2 text-right">Range</th>
          <th className="py-2 text-right">Confidence</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-neutral-100">
            <td className="py-2 text-neutral-600">{row.name}</td>
            <td className="py-2 text-right tabular-nums">
              {fmtCurrency(Number(row.low), { compact: true })} –{" "}
              {fmtCurrency(Number(row.high), { compact: true })}
            </td>
            <td className="py-2 text-right">
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-700">
                {row.confidence}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function FinancialsTable({ rows }: { rows: FinancialYearRow[] }) {
  if (!rows.length)
    return <div className="text-sm text-neutral-500">No financial data available.</div>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-wider text-neutral-500">
          <th className="py-2">Year</th>
          <th className="py-2 text-right">Revenue</th>
          <th className="py-2 text-right">SDE</th>
          <th className="py-2 text-right">EBITDA</th>
          <th className="py-2 text-right">Net income</th>
          <th className="hidden py-2 text-right sm:table-cell">Assets</th>
          <th className="hidden py-2 text-right sm:table-cell">Debt</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((f) => (
          <tr key={f.year} className="border-b border-neutral-100">
            <td className="py-2">{f.year}</td>
            <td className="py-2 text-right tabular-nums">{fmtCurrency(Number(f.revenue))}</td>
            <td className="py-2 text-right tabular-nums">
              {fmtCurrency(
                Number(f.ebitda ?? 0) + Number(f.owner_salary ?? 0) + Number(f.addbacks ?? 0),
              )}
            </td>
            <td className="py-2 text-right tabular-nums">{fmtCurrency(Number(f.ebitda))}</td>
            <td className="py-2 text-right tabular-nums">{fmtCurrency(Number(f.net_income))}</td>
            <td className="hidden py-2 text-right tabular-nums sm:table-cell">
              {fmtCurrency(Number(f.assets))}
            </td>
            <td className="hidden py-2 text-right tabular-nums sm:table-cell">
              {fmtCurrency(Number(f.debt))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function Assumptions({ b }: { b: BusinessRow }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <KV k="Owner hours/wk" v={b.owner_hours_per_week} />
      <KV
        k="Recurring revenue"
        v={b.recurring_revenue_pct != null ? fmtPct(Number(b.recurring_revenue_pct)) : "—"}
      />
      <KV
        k="Top customer concentration"
        v={
          b.top_customer_concentration_pct != null
            ? fmtPct(Number(b.top_customer_concentration_pct))
            : "—"
        }
      />
      <KV k="SOP status" v={b.sop_status} />
      <KV k="Manager depth" v={b.manager_team_depth} />
      <KV
        k="Owner in sales / ops / CX"
        v={
          [b.owner_in_sales, b.owner_in_operations, b.owner_in_customer_relationships].filter(
            Boolean,
          ).length + " of 3"
        }
      />
    </div>
  );
}

function HealthScore({ valuation }: { valuation: ValuationRow | null }) {
  const score = Number(valuation?.health_score ?? 0);
  const breakdown = valuation?.health_breakdown as
    | Record<string, { score?: number; max?: number }>
    | null
    | undefined;

  return (
    <div className="rounded-xl border border-neutral-200 p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">
            Exit readiness
          </div>
          <div className="mt-1 font-display text-3xl font-semibold">{score || "—"}/100</div>
        </div>
        <div className="text-xs text-neutral-600">
          {score >= 80
            ? "Strong readiness"
            : score >= 60
              ? "Moderate readiness"
              : score > 0
                ? "Needs preparation"
                : "No saved health score"}
        </div>
      </div>
      {breakdown && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(breakdown).map(([key, item]) => (
            <div key={key} className="rounded-lg bg-neutral-50 px-3 py-2">
              <div className="flex justify-between gap-2 text-xs">
                <span className="capitalize text-neutral-600">{key.replaceAll("_", " ")}</span>
                <span className="font-medium tabular-nums">
                  {Number(item.score ?? 0)}/{Number(item.max ?? 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RiskList({ risks }: { risks: string[] }) {
  if (!risks.length) {
    return <div className="text-sm text-neutral-500">No major risk flags in the saved inputs.</div>;
  }
  return (
    <ul className="space-y-2">
      {risks.map((risk) => (
        <li
          key={risk}
          className="rounded-md border border-neutral-200 p-3 text-sm text-neutral-700"
        >
          {risk}
        </li>
      ))}
    </ul>
  );
}

function ScenarioList({ scenarios }: { scenarios: ScenarioRow[] }) {
  if (!scenarios.length) {
    return <div className="text-sm text-neutral-500">No saved scenarios included in report.</div>;
  }
  return (
    <div className="space-y-3">
      {scenarios.map((scenario) => (
        <div key={scenario.id} className="rounded-lg border border-neutral-200 p-3">
          <div className="flex justify-between gap-3">
            <div className="font-medium text-sm">{scenario.name}</div>
            <div className="text-sm font-semibold tabular-nums text-emerald-700">
              {Number(scenario.value_delta ?? 0) >= 0 ? "+" : ""}
              {fmtCurrency(Number(scenario.value_delta ?? 0), { compact: true })}
            </div>
          </div>
          {scenario.description && (
            <p className="mt-1 text-xs text-neutral-600">{scenario.description}</p>
          )}
          <div className="mt-2 grid gap-2 text-[11px] text-neutral-500 sm:grid-cols-3">
            <span>Timeline: {scenario.timeline_months ?? "—"} mo</span>
            <span>Phase: {scenario.roadmap_phase ?? "Unassigned"}</span>
            <span>
              Projected:{" "}
              {scenario.projected_value != null
                ? fmtCurrency(Number(scenario.projected_value), { compact: true })
                : "—"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecsList({ recs }: { recs: RecommendationRow[] }) {
  if (!recs.length)
    return <div className="text-sm text-neutral-500">No improvement recommendations yet.</div>;
  return (
    <ul className="space-y-2">
      {recs.slice(0, 6).map((r) => (
        <li key={r.id} className="rounded-md border border-neutral-200 p-3">
          <div className="flex justify-between gap-3">
            <div className="font-medium text-sm">{r.title}</div>
            <div className="text-xs text-neutral-500">{r.priority}</div>
          </div>
          <div className="mt-1 text-xs text-neutral-600">{r.description}</div>
        </li>
      ))}
    </ul>
  );
}

function methodRow(
  name: string,
  value: number | null | undefined,
  low: number | null | undefined,
  high: number | null | undefined,
  financials: FinancialYearRow[],
) {
  const hasValue = Number(value ?? 0) > 0 || Number(low ?? 0) > 0 || Number(high ?? 0) > 0;
  const hasThreeYears = financials.length >= 3;
  let confidence = "Low";
  if (hasValue && hasThreeYears && /SDE|EBITDA|Asset/.test(name)) confidence = "High";
  else if (hasValue && (hasThreeYears || /Discounted|Asset/.test(name))) confidence = "Medium";
  return { name, value, low, high, confidence };
}

function confidenceLabel(financials: FinancialYearRow[], valuation: ValuationRow | null) {
  if (!valuation) return "No saved valuation";
  const latest = financials[0];
  const hasBalanceSheet = Number(latest?.assets ?? 0) > 0 || Number(latest?.liabilities ?? 0) > 0;
  if (financials.length >= 3 && hasBalanceSheet && Number(valuation.health_score ?? 0) >= 70) {
    return "High";
  }
  if (financials.length >= 2 && Number(valuation.range_mid ?? 0) > 0) return "Medium";
  return "Low";
}

function buildKeyRisks(business: BusinessRow, financials: FinancialYearRow[]) {
  const latest = financials[0];
  const risks: string[] = [];
  if ((business.owner_hours_per_week ?? 0) >= 45) {
    risks.push("Owner dependence: current owner hours may make transition harder for a buyer.");
  }
  if (
    [
      business.owner_in_sales,
      business.owner_in_operations,
      business.owner_in_customer_relationships,
    ].filter(Boolean).length >= 2
  ) {
    risks.push(
      "Owner concentration: owner remains involved in multiple customer-facing or operating roles.",
    );
  }
  if ((business.top_customer_concentration_pct ?? 0) >= 20) {
    risks.push("Customer concentration: top customer concentration may reduce buyer confidence.");
  }
  if (business.sop_status !== "complete") {
    risks.push("Documentation: incomplete SOPs can increase buyer diligence and transition risk.");
  }
  if (business.manager_team_depth !== "strong") {
    risks.push(
      "Management depth: limited bench strength may reduce the transferable value of the business.",
    );
  }
  if (latest && Number(latest.debt ?? 0) > Number(latest.ebitda ?? 0) * 3) {
    risks.push("Leverage: debt is high relative to current EBITDA and may affect equity value.");
  }
  return risks;
}

function buildDataQualityNotes(financials: FinancialYearRow[], valuation: ValuationRow | null) {
  const latest = financials[0];
  const notes: string[] = [];
  if (valuation?.computed_at) {
    notes.push(
      `Report uses the saved valuation snapshot from ${new Date(valuation.computed_at).toLocaleString()}.`,
    );
  } else {
    notes.push(
      "No saved valuation snapshot is available; generate and save a valuation before relying on this report.",
    );
  }
  notes.push(
    financials.length >= 3
      ? "Three years of financial history are included."
      : `${financials.length} year(s) of financial history are included; add three years for stronger confidence.`,
  );
  if (latest && (Number(latest.assets ?? 0) > 0 || Number(latest.liabilities ?? 0) > 0)) {
    notes.push("Balance-sheet data is present for the latest year.");
  } else {
    notes.push(
      "Balance-sheet data is missing or incomplete; asset and debt views may be less reliable.",
    );
  }
  notes.push("Owner salary and add-backs should be reviewed for buyer-acceptable normalization.");
  return notes;
}

function formatExitTimeline(value: BusinessRow["exit_timeline"]) {
  const labels: Record<string, string> = {
    lt_1y: "Less than 1 year",
    "1_2y": "1-2 years",
    "2_5y": "2-5 years",
    "5_plus_y": "5+ years",
    exploring: "Exploring",
  };
  return value ? (labels[value] ?? value) : "—";
}
