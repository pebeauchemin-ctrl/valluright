import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3, FileText, MessageSquare, Shield, UserCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fmtCurrency } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/advisor")({
  head: () => ({ meta: [{ title: "Advisor workspace — ValuRight.ai" }] }),
  component: AdvisorWorkspace,
});

type Invite = Pick<
  Database["public"]["Tables"]["advisor_invites"]["Row"],
  "id" | "business_id" | "advisor_role" | "permission_level" | "status" | "invited_at"
>;
type Business = Pick<
  Database["public"]["Tables"]["businesses"]["Row"],
  "id" | "name" | "industry" | "region" | "years_in_business" | "employees"
>;
type Financial = Pick<
  Database["public"]["Tables"]["financial_years"]["Row"],
  "business_id" | "year" | "revenue" | "ebitda" | "owner_salary" | "addbacks" | "debt"
>;
type Valuation = Pick<
  Database["public"]["Tables"]["valuations"]["Row"],
  "business_id" | "range_low" | "range_high" | "range_mid" | "health_score" | "computed_at"
>;
type Comment = Pick<
  Database["public"]["Tables"]["advisor_comments"]["Row"],
  "id" | "business_id" | "author_id" | "body" | "created_at" | "is_approval" | "review_status"
>;

function AdvisorWorkspace() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [financials, setFinancials] = useState<Financial[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [reviewStatus, setReviewStatus] = useState<
    "comment" | "reviewing" | "changes_requested" | "approved"
  >("comment");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(null);
    const { data: inviteRows, error: inviteError } = await (
      supabase as unknown as {
        rpc: (
          fn: "get_my_advisor_invites",
        ) => Promise<{ data: Invite[] | null; error: Error | null }>;
      }
    ).rpc("get_my_advisor_invites");
    if (inviteError) throw inviteError;

    const accepted = (inviteRows ?? []) as Invite[];
    const businessIds = accepted.map((invite) => invite.business_id);
    if (businessIds.length === 0) {
      setInvites([]);
      setBusinesses([]);
      setFinancials([]);
      setValuations([]);
      setComments([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const [businessRows, financialRows, valuationRows, commentRows] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, industry, region, years_in_business, employees")
        .in("id", businessIds),
      supabase
        .from("financial_years")
        .select("business_id, year, revenue, ebitda, owner_salary, addbacks, debt")
        .in("business_id", businessIds)
        .order("year", { ascending: false }),
      supabase
        .from("valuations")
        .select("business_id, range_low, range_high, range_mid, health_score, computed_at")
        .in("business_id", businessIds)
        .order("computed_at", { ascending: false }),
      supabase
        .from("advisor_comments")
        .select("id, business_id, author_id, body, created_at, is_approval, review_status")
        .in("business_id", businessIds)
        .order("created_at", { ascending: false }),
    ]);
    const error =
      businessRows.error ?? financialRows.error ?? valuationRows.error ?? commentRows.error;
    if (error) throw error;

    setInvites(accepted);
    setBusinesses((businessRows.data ?? []) as Business[]);
    setFinancials((financialRows.data ?? []) as Financial[]);
    setValuations((valuationRows.data ?? []) as Valuation[]);
    setComments((commentRows.data ?? []) as Comment[]);
    setSelectedId((previous) => previous ?? accepted[0]?.business_id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh().catch((error) => {
      setLoadError(
        error instanceof Error ? error.message : "Could not load your advisor workspace.",
      );
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectedInvite = invites.find((invite) => invite.business_id === selectedId) ?? null;
  const selectedBusiness = businesses.find((business) => business.id === selectedId) ?? null;
  const latestFinancial = useMemo(
    () => financials.find((financial) => financial.business_id === selectedId) ?? null,
    [financials, selectedId],
  );
  const latestValuation = useMemo(
    () => valuations.find((valuation) => valuation.business_id === selectedId) ?? null,
    [valuations, selectedId],
  );
  const selectedComments = comments.filter((comment) => comment.business_id === selectedId);
  const canComment = permissionRank(selectedInvite?.permission_level) >= permissionRank("comment");
  const canApprove = permissionRank(selectedInvite?.permission_level) >= permissionRank("approve");

  const addComment = async () => {
    if (!selectedId || !user || !feedback.trim() || !canComment) return;
    setSaving(true);
    const { error } = await supabase.rpc("record_advisor_review", {
      _business_id: selectedId,
      _body: feedback.trim(),
      _review_status: reviewStatus,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setFeedback("");
    setReviewStatus("comment");
    toast.success(reviewStatus === "approved" ? "Review marked complete." : "Feedback saved.");
    refresh().catch((error) =>
      toast.error(error instanceof Error ? error.message : "Could not refresh comments."),
    );
  };

  if (authLoading || loading) return <CenteredMessage message="Loading advisor workspace…" />;
  if (!user) return <AdvisorSignIn />;
  if (loadError)
    return <CenteredMessage message={loadError} retry={() => refresh().catch(() => undefined)} />;

  return (
    <main className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="inline-flex">
            <BrandLogo size={30} />
          </Link>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="hidden sm:inline">Advisor workspace</span>
            <button onClick={() => signOut()} className="font-semibold text-accent hover:underline">
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl font-semibold text-primary">Advisor workspace</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Review the owner’s shared planning inputs and valuation outputs. Your access level
          controls whether you can leave comments or record the final review status.
        </p>

        {invites.length === 0 ? (
          <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No accepted advisor invitations are linked to this account yet. Open the acceptance link
            the business owner shared with you, while signed in with the invited email address.
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-wrap gap-2" aria-label="Shared businesses">
              {invites.map((invite) => {
                const business = businesses.find((item) => item.id === invite.business_id);
                return (
                  <button
                    key={invite.id}
                    onClick={() => setSelectedId(invite.business_id)}
                    className={`rounded-md border px-3 py-2 text-left text-sm ${invite.business_id === selectedId ? "border-accent bg-accent-soft text-primary" : "border-border bg-card hover:bg-secondary"}`}
                  >
                    <span className="block font-semibold">
                      {business?.name ?? "Shared business"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {permissionLabel(invite.permission_level)}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedBusiness && (
              <div className="mt-6 space-y-6">
                <section className="rounded-xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-semibold text-primary">
                        {selectedBusiness.name}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedBusiness.industry ?? "Industry not specified"} ·{" "}
                        {selectedBusiness.region ?? "Confidential location"}
                      </p>
                    </div>
                    <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                      {permissionLabel(selectedInvite?.permission_level)}
                    </span>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <Metric
                      icon={BarChart3}
                      label="Latest revenue"
                      value={fmtCurrency(Number(latestFinancial?.revenue ?? 0), { compact: true })}
                    />
                    <Metric
                      icon={Shield}
                      label="Latest EBITDA"
                      value={fmtCurrency(Number(latestFinancial?.ebitda ?? 0), { compact: true })}
                    />
                    <Metric
                      icon={UserCheck}
                      label="Value midpoint"
                      value={fmtCurrency(Number(latestValuation?.range_mid ?? 0), {
                        compact: true,
                      })}
                    />
                  </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                  <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                      <FileText className="h-5 w-5" /> Financial snapshot
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Detail label="Latest fiscal year" value={latestFinancial?.year ?? "—"} />
                      <Detail
                        label="Owner compensation"
                        value={fmtCurrency(Number(latestFinancial?.owner_salary ?? 0))}
                      />
                      <Detail
                        label="Personal add-backs"
                        value={fmtCurrency(Number(latestFinancial?.addbacks ?? 0))}
                      />
                      <Detail
                        label="Debt"
                        value={fmtCurrency(Number(latestFinancial?.debt ?? 0))}
                      />
                      <Detail
                        label="Years in business"
                        value={selectedBusiness.years_in_business ?? "—"}
                      />
                      <Detail label="Employees" value={selectedBusiness.employees ?? "—"} />
                    </dl>
                  </section>
                  <section className="rounded-xl border border-border bg-card p-6">
                    <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                      <Shield className="h-5 w-5" /> Valuation snapshot
                    </h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Detail
                        label="Estimated range"
                        value={`${fmtCurrency(Number(latestValuation?.range_low ?? 0), { compact: true })} – ${fmtCurrency(Number(latestValuation?.range_high ?? 0), { compact: true })}`}
                      />
                      <Detail
                        label="Health score"
                        value={
                          latestValuation?.health_score == null
                            ? "Not available"
                            : `${latestValuation.health_score}/100`
                        }
                      />
                      <Detail
                        label="Last saved"
                        value={
                          latestValuation?.computed_at
                            ? new Date(latestValuation.computed_at).toLocaleString()
                            : "Not available"
                        }
                      />
                    </dl>
                  </section>
                </div>

                <section className="rounded-xl border border-border bg-card p-6">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
                    <MessageSquare className="h-5 w-5" /> Advisor comments
                  </h2>
                  {canComment ? (
                    <div className="mt-4">
                      <label
                        className="text-sm font-medium text-foreground"
                        htmlFor="advisor-comment"
                      >
                        Advisor feedback
                      </label>
                      <div className="mt-2 max-w-xs">
                        <label
                          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                          htmlFor="advisor-review-status"
                        >
                          Review status
                        </label>
                        <select
                          id="advisor-review-status"
                          value={reviewStatus}
                          onChange={(event) =>
                            setReviewStatus(event.target.value as typeof reviewStatus)
                          }
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="comment">Comment</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="changes_requested">Changes requested</option>
                          {canApprove && <option value="approved">Review complete</option>}
                        </select>
                      </div>
                      <textarea
                        id="advisor-comment"
                        value={feedback}
                        onChange={(event) => setFeedback(event.target.value)}
                        rows={4}
                        placeholder="Share a question, concern, or suggested change..."
                        className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <button
                        onClick={addComment}
                        disabled={saving || !feedback.trim()}
                        className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save feedback"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Your access is view-only. Ask the owner to change your permission if you need
                      to leave comments.
                    </p>
                  )}
                  <div className="mt-6 space-y-3">
                    {selectedComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No comments yet.</p>
                    ) : (
                      selectedComments.map((comment) => (
                        <article
                          key={comment.id}
                          className="rounded-lg border border-border bg-secondary/30 p-4"
                        >
                          <p className="text-sm text-foreground">{comment.body}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {comment.author_id === user.id ? "You" : "Advisor"} ·{" "}
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                          {comment.review_status !== "comment" && (
                            <p className="mt-2 text-xs font-semibold text-accent">
                              {reviewStatusLabel(comment.review_status)}
                            </p>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function AdvisorSignIn() {
  return (
    <CenteredMessage
      message="Sign in with the email address that received the advisor invitation."
      link="/auth"
      linkLabel="Sign in"
    />
  );
}

function CenteredMessage({
  message,
  retry,
  link,
  linkLabel,
}: {
  message: string;
  retry?: () => void;
  link?: "/auth";
  linkLabel?: string;
}) {
  return (
    <main className="min-h-screen bg-secondary/30 p-6">
      <div className="mx-auto mt-24 max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <BrandLogo size={32} />
        <p className="mt-6 text-sm text-muted-foreground">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            Try again
          </button>
        )}
        {link && (
          <Link
            to={link}
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 font-display text-xl font-semibold text-primary">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function permissionRank(permission: string | null | undefined) {
  return (
    ({ view_only: 10, comment: 20, edit_assumptions: 30, approve: 40 } as Record<string, number>)[
      permission ?? ""
    ] ?? 0
  );
}

function permissionLabel(permission: string | null | undefined) {
  return (
    (
      {
        view_only: "View only",
        comment: "Comment",
        edit_assumptions: "Comment and input review",
        approve: "Comment and review",
      } as Record<string, string>
    )[permission ?? ""] ?? "View only"
  );
}

function reviewStatusLabel(status: string) {
  return (
    (
      {
        reviewing: "Reviewing",
        changes_requested: "Changes requested",
        approved: "Review complete",
      } as Record<string, string>
    )[status] ?? "Comment"
  );
}
