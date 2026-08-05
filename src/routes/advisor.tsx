import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  FileText,
  MessageSquare,
  Shield,
  UserCheck,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/advisor")({
  head: () => ({ meta: [{ title: "Advisor workspace - ValuRight.ai" }] }),
  component: AdvisorWorkspace,
});

type Invite = Pick<
  Database["public"]["Tables"]["advisor_invites"]["Row"],
  "id" | "business_id" | "advisor_role" | "permission_level" | "status" | "invited_at"
>;
type Business = Pick<
  Database["public"]["Tables"]["businesses"]["Row"],
  | "id"
  | "name"
  | "industry"
  | "region"
  | "years_in_business"
  | "employees"
  | "accounting_basis"
  | "business_category"
  | "business_subtype"
  | "owner_hours_per_week"
>;
type Financial = Database["public"]["Tables"]["financial_years"]["Row"];
type Valuation = Pick<
  Database["public"]["Tables"]["valuations"]["Row"],
  | "id"
  | "business_id"
  | "range_low"
  | "range_high"
  | "range_mid"
  | "health_score"
  | "health_breakdown"
  | "computed_at"
>;
type MethodResult = Database["public"]["Tables"]["valuation_method_results"]["Row"];
type AddBack = Database["public"]["Tables"]["financial_addbacks"]["Row"];
type AddBackEvent = Database["public"]["Tables"]["financial_addback_events"]["Row"];
type Comment = Pick<
  Database["public"]["Tables"]["advisor_comments"]["Row"],
  "id" | "business_id" | "author_id" | "body" | "created_at" | "is_approval" | "review_status"
> & { section_key?: string | null };

const COMMENT_SECTIONS = [
  { value: "general", label: "General review" },
  { value: "financials", label: "Financial performance" },
  { value: "normalization", label: "Normalization and add-backs" },
  { value: "balance_sheet", label: "Balance sheet and equity" },
  { value: "methodology", label: "Valuation methodology" },
  { value: "health_score", label: "Health score" },
] as const;

function AdvisorWorkspace() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [methods, setMethods] = useState<MethodResult[]>([]);
  const [addBacks, setAddBacks] = useState<AddBack[]>([]);
  const [addBackEvents, setAddBackEvents] = useState<AddBackEvent[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [commentSection, setCommentSection] = useState("general");
  const [reviewStatus, setReviewStatus] = useState("comment");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    const inviteResult = await (
      supabase as unknown as {
        rpc: (fn: "get_my_advisor_invites") => Promise<{ data: Invite[] | null; error: Error | null }>;
      }
    ).rpc("get_my_advisor_invites");
    if (inviteResult.error) throw inviteResult.error;

    const accepted = inviteResult.data ?? [];
    const businessIds = accepted.map((invite) => invite.business_id);
    if (businessIds.length === 0) {
      setInvites([]);
      setBusinesses([]);
      setFinancials([]);
      setValuations([]);
      setMethods([]);
      setAddBacks([]);
      setAddBackEvents([]);
      setComments([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const results = await Promise.all([
      supabase.from("businesses").select("id, name, industry, region, years_in_business, employees, accounting_basis, business_category, business_subtype, owner_hours_per_week").in("id", businessIds),
      supabase.from("financial_years").select("*").in("business_id", businessIds).order("year", { ascending: false }),
      supabase.from("valuations").select("id, business_id, range_low, range_high, range_mid, health_score, health_breakdown, computed_at").in("business_id", businessIds).order("computed_at", { ascending: false }),
      supabase.from("valuation_method_results").select("*").in("business_id", businessIds),
      supabase.from("financial_addbacks").select("*").in("business_id", businessIds).order("year", { ascending: false }).order("created_at", { ascending: true }),
      supabase.from("financial_addback_events").select("*").in("business_id", businessIds).order("created_at", { ascending: false }),
      supabase.from("advisor_comments").select("id, business_id, author_id, body, created_at, is_approval, review_status, section_key").in("business_id", businessIds).order("created_at", { ascending: false }),
    ]);
    const error = results.map((result) => result.error).find(Boolean);
    if (error) throw error;

    setInvites(accepted as Invite[]);
    setBusinesses((results[0].data ?? []) as Business[]);
    setFinancials((results[1].data ?? []) as Financial[]);
    setValuations((results[2].data ?? []) as Valuation[]);
    setMethods((results[3].data ?? []) as MethodResult[]);
    setAddBacks((results[4].data ?? []) as AddBack[]);
    setAddBackEvents((results[5].data ?? []) as AddBackEvent[]);
    setComments((results[6].data ?? []) as Comment[]);
    setSelectedId((current) => current ?? accepted[0]?.business_id ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const reload = () => {
      refresh().catch((error) => {
        setLoadError(error instanceof Error ? error.message : "Could not refresh your advisor workspace.");
        setLoading(false);
      });
    };
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [user, refresh]);

  const invite = invites.find((item) => item.business_id === selectedId) ?? null;
  const business = businesses.find((item) => item.id === selectedId) ?? null;
  const businessFinancials = useMemo(
    () => financials.filter((item) => item.business_id === selectedId),
    [financials, selectedId],
  );
  const latestFinancial = businessFinancials[0] ?? null;
  const valuation = valuations.find((item) => item.business_id === selectedId) ?? null;
  const businessMethods = methods.filter(
    (item) => item.business_id === selectedId && (!valuation || item.valuation_id === valuation.id),
  );
  const businessAddBacks = addBacks.filter((item) => item.business_id === selectedId);
  const businessEvents = addBackEvents.filter((item) => item.business_id === selectedId);
  const businessComments = comments.filter((item) => item.business_id === selectedId);
  const canComment = permissionRank(invite?.permission_level) >= permissionRank("comment");
  const canApprove = permissionRank(invite?.permission_level) >= permissionRank("approve");
  const equityValue = valuation ? amount(valuation.range_mid) - amount(latestFinancial?.debt) : null;
  const flags = buildFlags(business, businessFinancials, valuation, businessAddBacks);

  const saveComment = async () => {
    if (!selectedId || !feedback.trim() || !canComment) return;
    setSaving(true);
    const result = await (
      supabase as unknown as {
        rpc: (
          fn: "record_advisor_review",
          args: { _business_id: string; _body: string; _review_status: string; _section_key: string },
        ) => Promise<{ data: string | null; error: Error | null }>;
      }
    ).rpc("record_advisor_review", {
      _business_id: selectedId,
      _body: feedback.trim(),
      _review_status: reviewStatus,
      _section_key: commentSection,
    });
    setSaving(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    setFeedback("");
    setCommentSection("general");
    setReviewStatus("comment");
    toast.success(reviewStatus === "approved" ? "Review marked complete." : "Feedback saved.");
    refresh().catch(() => toast.error("Could not refresh the advisor comments."));
  };

  if (authLoading || loading) return <CenteredMessage message="Loading advisor workspace..." />;
  if (!user) return <CenteredMessage message="Sign in with the email address that received the advisor invitation." link="/auth" />;
  if (loadError) return <CenteredMessage message={loadError} retry={() => refresh().catch(() => undefined)} />;

  return (
    <main className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="inline-flex"><BrandLogo size={30} /></Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Advisor workspace</span>
            <button onClick={() => signOut()} className="font-semibold text-accent hover:underline">Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl font-semibold text-primary">Advisor workspace</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Review the planning inputs, normalized earnings, and valuation methods. This is a planning estimate for discussion, not a certified appraisal or professional opinion.
        </p>

        {invites.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No accepted advisor invitations are linked to this account yet. Open the acceptance link the business owner shared with you while signed in with the invited email address.
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-2" aria-label="Shared businesses">
              {invites.map((item) => {
                const name = businesses.find((business) => business.id === item.business_id)?.name ?? "Shared business";
                const active = item.business_id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.business_id)}
                    className={"rounded-md border px-3 py-2 text-left text-sm " + (active ? "border-accent bg-accent-soft text-primary" : "border-border bg-card hover:bg-secondary")}
                  >
                    <span className="block font-semibold">{name}</span>
                    <span className="block text-xs text-muted-foreground">{permissionLabel(item.permission_level)}</span>
                  </button>
                );
              })}
            </div>

            {business && (
              <div className="mt-6 space-y-6">
                <section className="rounded-xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Engagement review</p>
                      <h2 className="mt-1 font-display text-2xl font-semibold text-primary">{business.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {business.industry ?? "Industry not specified"}
                        {business.business_subtype ? " - " + business.business_subtype : ""}
                        {" - " + (business.region ?? "Confidential location")}
                      </p>
                    </div>
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                      {permissionLabel(invite?.permission_level)}
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoCard label="Business category" value={categoryLabel(business.business_category)} />
                    <InfoCard label="Accounting basis" value={business.accounting_basis || "Not recorded"} />
                    <InfoCard label="Periods reviewed" value={periods(businessFinancials)} />
                    <InfoCard label="Data age" value={dataAge(valuation?.computed_at)} />
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <Metric icon={BarChart3} label="Latest revenue" value={currency(latestFinancial?.revenue, true)} />
                    <Metric icon={Shield} label="Latest EBITDA" value={currency(latestFinancial?.ebitda, true)} />
                    <Metric icon={UserCheck} label="Enterprise value midpoint" value={currency(valuation?.range_mid, true)} />
                  </div>
                </section>

                <section className="rounded-xl border border-amber-300 bg-amber-50/50 p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                    <AlertTriangle className="h-5 w-5 text-amber-600" /> Review flags
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">Items that need professional judgment before anyone relies on the estimate.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {flags.map((flag) => <div key={flag} className="rounded-lg border border-amber-200 bg-background p-3 text-sm text-foreground">{flag}</div>)}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                    <FileText className="h-5 w-5" /> Income statement and normalized earnings
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">Reported line items and the EBITDA/SDE bridge for every year shared with you.</p>
                  <FinancialBridge financials={businessFinancials} />
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                      <Calculator className="h-5 w-5" /> Balance sheet and equity bridge
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Detail label="Total assets" value={currency(latestFinancial?.assets)} />
                      <Detail label="Total liabilities" value={currency(latestFinancial?.liabilities)} />
                      <Detail label="Interest-bearing debt" value={currency(latestFinancial?.debt)} />
                      <Detail label="Enterprise value midpoint" value={currency(valuation?.range_mid)} />
                      <Detail label="Estimated equity to owner" value={equityValue == null ? "Not available" : fmtCurrency(equityValue)} emphasis />
                    </dl>
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                      The valuation range is enterprise value. Estimated equity subtracts recorded debt and does not include closing costs, working-capital adjustments, or taxes.
                    </p>
                  </section>

                  <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                      <Shield className="h-5 w-5" /> Health score
                    </h2>
                    <p className="mt-4 font-display text-3xl font-semibold text-primary">
                      {valuation?.health_score == null ? "Not available" : String(valuation.health_score) + "/100"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">A planning diagnostic, not an independent risk rating.</p>
                    <HealthBreakdown value={valuation?.health_breakdown} />
                  </section>
                </div>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                    <Calculator className="h-5 w-5" /> Valuation methodology
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Methods saved with the latest valuation, including applied inputs, factors, blend weights, confidence, and sources.
                  </p>
                  <MethodTable methods={businessMethods} />
                </section>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                    <FileText className="h-5 w-5" /> Normalization and add-backs
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">Itemized adjustments should be buyer-acceptable and non-recurring before reliance.</p>
                  <AddBackTable addBacks={businessAddBacks} events={businessEvents} financials={businessFinancials} />
                </section>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                    <MessageSquare className="h-5 w-5" /> Advisor comments
                  </h2>
                  {canComment ? (
                    <div className="mt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-medium text-foreground">
                          Attach to section
                          <select value={commentSection} onChange={(event) => setCommentSection(event.target.value)} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {COMMENT_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-medium text-foreground">
                          Review status
                          <select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="comment">Comment</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="changes_requested">Changes requested</option>
                            {canApprove && <option value="approved">Review complete</option>}
                          </select>
                        </label>
                      </div>
                      <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} placeholder="Share a question, concern, or suggested change..." className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      <button onClick={saveComment} disabled={saving || !feedback.trim()} className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
                        {saving ? "Saving..." : "Save feedback"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">Your access is view-only. Ask the owner to change your permission if you need to leave comments.</p>
                  )}
                  <CommentList comments={businessComments} userId={user.id} />
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function FinancialBridge({ financials }: { financials: Financial[] }) {
  const rows: Array<{ label: string; important?: boolean; value: (item: Financial) => number }> = [
    { label: "Revenue", value: (item) => amount(item.revenue) },
    { label: "Cost of goods sold", value: (item) => amount(item.cogs) },
    { label: "Gross profit", important: true, value: (item) => amount(item.gross_profit) },
    { label: "Operating expenses", value: (item) => amount(item.operating_expenses) },
    { label: "Net income", important: true, value: (item) => amount(item.net_income) },
    { label: "Plus: interest", value: (item) => amount(item.interest) },
    { label: "Plus: income taxes", value: (item) => amount(item.income_taxes) },
    { label: "Plus: depreciation", value: (item) => amount(item.depreciation) },
    { label: "Plus: amortization", value: (item) => amount(item.amortization) },
    { label: "EBITDA", important: true, value: (item) => amount(item.ebitda) },
    { label: "Plus: owner compensation", value: (item) => amount(item.owner_salary) },
    { label: "Plus: add-backs", value: (item) => amount(item.addbacks) },
    { label: "Seller's discretionary earnings", important: true, value: (item) => amount(item.ebitda) + amount(item.owner_salary) + amount(item.addbacks) },
  ];
  if (financials.length === 0) return <p className="mt-4 text-sm text-muted-foreground">No financial history has been shared.</p>;
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
          <th className="pb-3 pr-4 font-medium">Line item</th>
          {financials.map((item) => <th key={item.year} className="px-3 pb-3 text-right font-medium">{item.year}</th>)}
        </tr></thead>
        <tbody>{rows.map((row) => <tr key={row.label} className="border-b border-border/60 last:border-0">
          <th className={"py-2.5 pr-4 text-left font-normal " + (row.important ? "font-semibold text-primary" : "")}>{row.label}</th>
          {financials.map((item) => <td key={item.year} className={"px-3 py-2.5 text-right tabular-nums " + (row.important ? "font-semibold text-primary" : "")}>{fmtCurrency(row.value(item))}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  );
}

function MethodTable({ methods }: { methods: MethodResult[] }) {
  if (methods.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No method-level results are available for this valuation.</p>;
  }

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Method</th>
            <th className="px-3 pb-3 text-right font-medium">Input</th>
            <th className="px-3 pb-3 text-right font-medium">Applied factor</th>
            <th className="px-3 pb-3 text-right font-medium">Weight</th>
            <th className="px-3 pb-3 text-right font-medium">Range</th>
            <th className="pb-3 pl-3 font-medium">Source / review note</th>
          </tr>
        </thead>
        <tbody>
          {methods.map((method) => {
            const details = jsonRecord(method.details);
            const inputUsed = numberDetail(details.input_used);
            const inputLabel = stringDetail(details.input_label);
            const capRate = numberDetail(details.cap_rate_used);
            const source = stringDetail(details.multiple_source);
            const confidence = stringDetail(details.multiple_confidence) ?? stringDetail(details.confidence);
            const reasoning = stringDetail(details.reasoning);
            const factor = capRate ?? method.multiple_or_rate;
            const factorLabel = capRate != null
              ? (capRate * 100).toFixed(2) + "% cap rate"
              : factor == null
                ? "Not recorded"
                : Number(factor).toFixed(2) + "x";
            const weight = method.weight == null ? null : Number(method.weight);

            return (
              <tr key={method.id} className="border-b border-border/60 last:border-0 align-top">
                <td className="py-3 pr-4 font-medium text-foreground">
                  <div>{stringDetail(details.label) ?? method.method}</div>
                  <span className={"mt-1 inline-block rounded-full px-2 py-0.5 text-xs " + (method.is_selected ? "bg-accent-soft text-accent" : "bg-secondary text-muted-foreground")}>
                    {method.is_selected ? "Included in range" : "Reference method"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {inputUsed == null ? "Not recorded" : (inputLabel ? inputLabel + ": " : "") + currency(inputUsed, true)}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{factorLabel}</td>
                <td className="px-3 py-3 text-right tabular-nums">{weight == null ? "Not recorded" : weight > 0 ? String(Math.round(weight * 100)) + "%" : "Reference only"}</td>
                <td className="px-3 py-3 text-right tabular-nums">{currencyRange(method.value_low, method.value_high)}</td>
                <td className="py-3 pl-3 text-muted-foreground">
                  <div>{[source, confidence ? confidence + " confidence" : null].filter(Boolean).join(" · ") || "No source recorded."}</div>
                  {(method.notes || reasoning) && <div className="mt-1 text-xs">{method.notes || reasoning}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddBackTable({
  addBacks,
  events,
  financials,
}: {
  addBacks: AddBack[];
  events: AddBackEvent[];
  financials: Financial[];
}) {
  const itemizedByYear = addBacks.reduce((totals, addBack) => {
    totals.set(addBack.year, (totals.get(addBack.year) ?? 0) + amount(addBack.amount));
    return totals;
  }, new Map<number, number>());

  const unitemized = financials
    .map((financial) => ({
      year: financial.year,
      amount: amount(financial.addbacks) - (itemizedByYear.get(financial.year) ?? 0),
    }))
    .filter((item) => Math.abs(item.amount) > 0.01);

  if (addBacks.length === 0 && unitemized.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground">No add-backs were recorded for this valuation.</p>;
  }

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Year</th>
            <th className="pb-3 pr-4 font-medium">Category</th>
            <th className="pb-3 pr-4 font-medium">Recurrence</th>
            <th className="pb-3 pr-4 font-medium">Note</th>
            <th className="pb-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {addBacks.map((addBack) => (
            <tr key={addBack.id} className="border-b border-border/60 last:border-0">
              <td className="py-3 pr-4">{addBack.year}</td>
              <td className="py-3 pr-4 font-medium">{addBack.category}</td>
              <td className="py-3 pr-4">
                <span className={"rounded-full px-2 py-0.5 text-xs " + (addBack.is_recurring ? "bg-amber-100 text-amber-800" : "bg-accent-soft text-accent")}>
                  {addBack.is_recurring ? "Recurring - review" : "One-time"}
                </span>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{addBack.note || "No note recorded."}</td>
              <td className="py-3 text-right tabular-nums">{fmtCurrency(addBack.amount)}</td>
            </tr>
          ))}
          {unitemized.map((item) => (
            <tr key={"unitemized-" + item.year} className="border-b border-border/60 last:border-0">
              <td className="py-3 pr-4">{item.year}</td>
              <td className="py-3 pr-4 font-medium">Unitemized adjustment</td>
              <td className="py-3 pr-4"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Needs review</span></td>
              <td className="py-3 pr-4 text-muted-foreground">Included in the financial-year add-backs total but not documented as an individual item.</td>
              <td className="py-3 text-right tabular-nums">{fmtCurrency(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {events.length > 0 && <p className="mt-4 text-xs text-muted-foreground">Latest add-back activity: {events.slice(0, 3).map((event) => event.action + " (" + event.year + ")").join(", ")}.</p>}
    </div>
  );
}

function HealthBreakdown({ value }: { value: Json | null | undefined }) {
  const entries = healthEntries(value);
  if (entries.length === 0) return <p className="mt-5 text-sm text-muted-foreground">No category-level health detail was saved with this valuation.</p>;
  return <dl className="mt-5 space-y-2 text-sm">{entries.map((entry) => <Detail key={entry[0]} label={entry[0]} value={entry[1]} />)}</dl>;
}

function CommentList({ comments, userId }: { comments: Comment[]; userId: string }) {
  if (comments.length === 0) return <p className="mt-6 text-sm text-muted-foreground">No comments yet.</p>;
  return (
    <div className="mt-6 space-y-3">
      {comments.map((comment) => <article key={comment.id} className="rounded-lg border border-border bg-secondary/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">{sectionLabel(comment.section_key)}</span>
          {comment.review_status !== "comment" && <span className="text-xs font-semibold text-accent">{reviewLabel(comment.review_status)}</span>}
        </div>
        <p className="mt-2 text-sm text-foreground">{comment.body}</p>
        <p className="mt-2 text-xs text-muted-foreground">{comment.author_id === userId ? "You" : "Advisor"} - {new Date(comment.created_at).toLocaleString()}</p>
      </article>)}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-secondary/30 p-4"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Icon className="h-4 w-4" /> {label}</div><div className="mt-2 font-display text-xl font-semibold text-primary">{value}</div></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-secondary/30 p-3"><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd></div>;
}

function Detail({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className="flex justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className={"text-right font-medium text-foreground " + (emphasis ? "font-semibold text-primary" : "")}>{value}</dd></div>;
}

function CenteredMessage({ message, retry, link }: { message: string; retry?: () => void; link?: "/auth" }) {
  return <main className="min-h-screen bg-secondary/30 p-6"><div className="mx-auto mt-24 max-w-lg rounded-xl border border-border bg-card p-8 text-center"><p className="text-sm text-muted-foreground">{message}</p><div className="mt-4 flex justify-center gap-3">{retry && <button onClick={retry} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">Try again</button>}{link && <Link to={link} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary">Sign in</Link>}</div></div></main>;
}

function buildFlags(business: Business | null, financials: Financial[], valuation: Valuation | null, addBacks: AddBack[]) {
  const flags: string[] = [];
  const latest = financials[0];
  if (financials.length < 3) flags.push("Less than three fiscal years are available. Trend and normalization review are limited.");
  if (!business?.accounting_basis) flags.push("Accounting basis is not recorded. Confirm whether reported figures are cash or accrual basis.");
  if (latest && amount(latest.owner_salary) === 0 && amount(business?.employees) > 0) flags.push("Owner compensation is zero while employees are recorded. Confirm whether a market-rate owner replacement adjustment is needed.");
  if (latest && amount(latest.revenue) > 0 && Math.abs(amount(latest.ebitda) / amount(latest.revenue)) > 0.4) flags.push("EBITDA margin exceeds 40%. Confirm classification, recurring costs, and normalization.");
  if (latest && valuation && amount(latest.debt) > amount(valuation.range_mid) * 0.7) flags.push("Debt exceeds 70% of enterprise value midpoint. Review leverage, debt service, and estimated owner equity.");
  if (addBacks.some((item) => item.is_recurring)) flags.push("One or more add-backs are marked recurring and may not be buyer-acceptable.");
  if (!valuation?.computed_at) flags.push("No saved valuation date is available. Confirm that the estimate reflects the latest financial history.");
  else if (daysSince(valuation.computed_at) > 120) flags.push("The saved valuation is over 120 days old. Refresh inputs before relying on the range.");
  return flags.length ? flags : ["No automatic review flags were generated. Professional judgment is still required."];
}

function healthEntries(value: Json | null | undefined): [string, string][] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, raw]) => {
    const label = key.replace(/_/g, " ");
    if (typeof raw === "number") return [[label, String(raw) + "/100"]];
    if (typeof raw === "string") return [[label, raw]];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

    const detail = raw as Record<string, unknown>;
    const score = numberDetail(detail.score);
    const maximum = numberDetail(detail.max);
    const driver = stringDetail(detail.driver) ?? stringDetail(detail.detail);
    const threshold = stringDetail(detail.threshold);
    const values = [
      score == null ? "Not scored" : String(score) + "/" + String(maximum ?? 100),
      driver,
      threshold ? "Threshold: " + threshold : null,
    ].filter(Boolean);

    return values.length ? [[label, values.join(" - ")]] : [];
  });
}

function jsonRecord(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringDetail(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberDetail(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function categoryLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    real_estate_income: "Income-producing real estate",
    standard_operating: "Standard operating business",
    asset_heavy: "Asset-heavy operating business",
  };
  return labels[value ?? ""] ?? "Not recorded";
}

function periods(financials: Financial[]) {
  if (financials.length === 0) return "None shared";
  const years = financials.map((item) => item.year).sort((a, b) => a - b);
  return years.length === 1 ? String(years[0]) : String(years[0]) + "-" + String(years[years.length - 1]) + " (" + String(years.length) + " years)";
}

function dataAge(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const days = daysSince(value);
  return days === 0 ? "Updated today" : String(days) + " days since valuation";
}

function daysSince(value: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
}

function currency(value: number | null | undefined, compact = false) {
  return fmtCurrency(amount(value), compact ? { compact: true } : undefined);
}

function currencyRange(low: number | null | undefined, high: number | null | undefined) {
  if (low == null && high == null) return "Not recorded";
  return currency(low, true) + " - " + currency(high, true);
}

function amount(value: number | null | undefined) {
  return Number(value ?? 0);
}

function permissionRank(permission: string | null | undefined) {
  const ranks: Record<string, number> = { view_only: 10, comment: 20, edit_assumptions: 30, approve: 40 };
  return ranks[permission ?? ""] ?? 0;
}

function permissionLabel(permission: string | null | undefined) {
  const labels: Record<string, string> = { view_only: "View only", comment: "Comment", edit_assumptions: "Comment", approve: "Comment and review" };
  return labels[permission ?? ""] ?? "View only";
}

function reviewLabel(status: string) {
  const labels: Record<string, string> = { reviewing: "Reviewing", changes_requested: "Changes requested", approved: "Review complete" };
  return labels[status] ?? "Comment";
}

function sectionLabel(section: string | null | undefined) {
  return COMMENT_SECTIONS.find((item) => item.value === section)?.label ?? "General review";
}
