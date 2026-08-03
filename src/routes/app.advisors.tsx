import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Copy,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageSquare,
  Shield,
  UserPlus,
} from "lucide-react";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fmtCurrency } from "@/lib/format";
import type { Database } from "@/integrations/supabase/types";
import { COUNSEL_REVIEW_TEXT, VALUATION_DISCLAIMER_SHORT } from "@/components/ValuationDisclaimer";
import { createAdvisorInvite, resendAdvisorInvite } from "@/lib/advisor-invites.functions";
import { LoadErrorState, errorMessage } from "@/components/LoadErrorState";
import { usePlanEntitlements } from "@/lib/use-plan-entitlements";

export const Route = createFileRoute("/app/advisors")({
  head: () => ({ meta: [{ title: "Advisors — ValuRight.ai" }] }),
  component: Advisors,
});

const ADVISOR_ROLES = [
  { value: "cpa", label: "CPA / Accountant" },
  { value: "bookkeeper", label: "Bookkeeper" },
  { value: "broker", label: "Business Broker" },
  { value: "financial_advisor", label: "Financial Advisor" },
  { value: "attorney", label: "Attorney" },
  { value: "consultant", label: "Consultant" },
] as const;

const PERMISSIONS = [
  { value: "view_only", label: "View only", desc: "Read the report, no edits or comments." },
  { value: "comment", label: "Comment only", desc: "Read and leave comments on assumptions." },
  {
    value: "approve",
    label: "Record review status",
    desc: "Comment, edit, and record internal review status. This does not make the output a certified appraisal or professional opinion.",
  },
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Invite = {
  id: string;
  advisor_email: string;
  status: string;
  invited_at: string;
  advisor_role: string | null;
  permission_level: string | null;
  invite_email_last_sent_at: string | null;
  invite_email_last_attempt_at: string | null;
  invite_email_last_error: string | null;
};
type Comment = {
  id: string;
  body: string;
  is_approval: boolean;
  review_status: string;
  created_at: string;
  author_id: string;
};
type FinancialYearRow = Database["public"]["Tables"]["financial_years"]["Row"];
type FinancialAddBackRow = Database["public"]["Tables"]["financial_addbacks"]["Row"];
type FinancialAddBackEventRow = Database["public"]["Tables"]["financial_addback_events"]["Row"];
type ValuationRow = Database["public"]["Tables"]["valuations"]["Row"];
type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
type AdvisorInviteUpdate = Database["public"]["Tables"]["advisor_invites"]["Update"];

function Advisors() {
  const { current } = useBusiness();
  const entitlements = usePlanEntitlements();
  const createInvite = useServerFn(createAdvisorInvite);
  const resendInvite = useServerFn(resendAdvisorInvite);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [financials, setFinancials] = useState<FinancialYearRow[]>([]);
  const [addBacks, setAddBacks] = useState<FinancialAddBackRow[]>([]);
  const [addBackEvents, setAddBackEvents] = useState<FinancialAddBackEventRow[]>([]);
  const [valuation, setValuation] = useState<ValuationRow | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [role, setRole] = useState<string>("cpa");
  const [perm, setPerm] = useState<string>("comment");
  const [busy, setBusy] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const refresh = async () => {
    if (!current) return;
    const [
      invitesResult,
      commentsResult,
      financialsResult,
      addBackRowsResult,
      addBackEventRowsResult,
      valuationResult,
      reportsResult,
    ] = await Promise.all([
      supabase
        .from("advisor_invites")
        .select("*")
        .eq("business_id", current.id)
        .order("invited_at", { ascending: false }),
      supabase
        .from("advisor_comments")
        .select("*")
        .eq("business_id", current.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("financial_years")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: false }),
      supabase
        .from("financial_addbacks")
        .select("*")
        .eq("business_id", current.id)
        .order("year", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("financial_addback_events")
        .select("*")
        .eq("business_id", current.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("valuations")
        .select("*")
        .eq("business_id", current.id)
        .order("computed_at", { ascending: false })
        .limit(1),
      supabase
        .from("reports")
        .select("*")
        .eq("business_id", current.id)
        .order("generated_at", { ascending: false })
        .limit(5),
    ]);
    const error =
      invitesResult.error ??
      commentsResult.error ??
      financialsResult.error ??
      addBackRowsResult.error ??
      addBackEventRowsResult.error ??
      valuationResult.error ??
      reportsResult.error;
    if (error) throw error;
    const inv = invitesResult.data;
    const cm = commentsResult.data;
    const fy = financialsResult.data;
    const addBackRows = addBackRowsResult.data;
    const addBackEventRows = addBackEventRowsResult.data;
    const val = valuationResult.data;
    const rp = reportsResult.data;
    setInvites((inv ?? []) as Invite[]);
    setComments((cm ?? []) as Comment[]);
    setFinancials((fy ?? []) as FinancialYearRow[]);
    setAddBacks((addBackRows ?? []) as FinancialAddBackRow[]);
    setAddBackEvents((addBackEventRows ?? []) as FinancialAddBackEventRow[]);
    setValuation((val?.[0] ?? null) as ValuationRow | null);
    setReports((rp ?? []) as ReportRow[]);
  };

  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setInvites([]);
      setComments([]);
      setFinancials([]);
      setAddBacks([]);
      setAddBackEvents([]);
      setValuation(null);
      setReports([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    refresh()
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error, "Could not load advisor review data."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    /* eslint-disable-next-line */
  }, [current, loadAttempt]);

  const invite = async () => {
    if (!current) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError("Enter an advisor email address.");
      toast.error("Enter an advisor email address.");
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailError("Enter a valid email address.");
      toast.error("Enter a valid email address.");
      return;
    }
    setEmailError(null);
    setBusy(true);
    try {
      const result = await createInvite({
        data: {
          businessId: current.id,
          advisorEmail: normalizedEmail,
          advisorRole: role as (typeof ADVISOR_ROLES)[number]["value"],
          permissionLevel: perm as (typeof PERMISSIONS)[number]["value"],
        },
      });
      setEmail("");
      await refresh();
      if (result.delivery.status === "sent") {
        toast.success(`Invitation emailed to ${normalizedEmail}`);
      } else {
        toast.error(`Invite created, but the email could not be sent: ${result.delivery.message}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setBusy(false);
    }
  };

  const resend = async (inviteId: string) => {
    setResendingInviteId(inviteId);
    try {
      const result = await resendInvite({ data: { inviteId } });
      await refresh();
      if (result.status === "sent") {
        toast.success("Advisor invitation email sent.");
      } else {
        toast.error(`Email could not be sent: ${result.message}`);
      }
    } catch (error) {
      toast.error(errorMessage(error, "Could not resend advisor invitation."));
    } finally {
      setResendingInviteId(null);
    }
  };

  const updatePerm = async (id: string, permission_level: string) => {
    const payload: AdvisorInviteUpdate = { permission_level };
    const { error } = await supabase.from("advisor_invites").update(payload).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh().catch((error) =>
      toast.error(errorMessage(error, "Could not refresh advisor review data.")),
    );
  };

  const copyAccessLink = async (id: string) => {
    const url = `${window.location.origin}/advisor/accept/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Advisor acceptance link copied.");
    } catch {
      toast.error("Could not copy the acceptance link. Please copy it from the address bar.");
    }
  };

  if (!current)
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;
  if (loading)
    return <div className="p-12 text-sm text-muted-foreground">Loading advisor review…</div>;
  if (loadError) {
    return (
      <LoadErrorState
        title="Could not load advisor review"
        message={loadError}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }

  const latest = financials[0];
  const latestAddBacks = addBacks.filter((row) => row.year === latest?.year);
  const latestAddBackTotal = latestAddBacks.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const approvalState = getApprovalState(comments);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Advisor Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite your CPA, broker, attorney, consultant, or financial advisor to review assumptions,
          planning reports, and valuation outputs. Advisors receive a secure email link to accept
          access using the invited email address.
        </p>
      </div>

      {!entitlements.loading && !entitlements.has("advisor_review") && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-muted-foreground">
          Advisor invitations are available with an active Exit Ready plan.
        </div>
      )}

      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Advisor review context. </span>
        Advisor comments and approvals are workflow records only. {VALUATION_DISCLAIMER_SHORT}{" "}
        {COUNSEL_REVIEW_TEXT}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusTile
          icon={Mail}
          label="Invited advisors"
          value={String(invites.length)}
          detail={`${invites.filter((i) => i.status === "accepted").length} accepted`}
        />
        <StatusTile
          icon={MessageSquare}
          label="Feedback items"
          value={String(comments.length)}
          detail={`${comments.filter((c) => c.is_approval).length} approval record(s)`}
        />
        <StatusTile
          icon={approvalState.icon}
          label="Approval state"
          value={approvalState.label}
          detail={approvalState.detail}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-primary">Create advisor invite</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
            <input
              type="email"
              required
              aria-invalid={emailError ? "true" : undefined}
              aria-describedby={emailError ? "advisor-email-error" : undefined}
              placeholder="advisor@firm.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {emailError && (
              <p id="advisor-email-error" className="mt-1 text-xs font-medium text-destructive">
                {emailError}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Advisor type
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {ADVISOR_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Permission
            </label>
            <select
              value={perm}
              onChange={(e) => setPerm(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {PERMISSIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {PERMISSIONS.find((p) => p.value === perm)?.desc}
        </p>
        <button
          type="button"
          onClick={invite}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" /> Send invite
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary mb-3">Invited advisors</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No advisors invited yet.</p>
        ) : (
          <div className="space-y-2">
            {invites.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 flex-wrap"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{i.advisor_email}</div>
                    <div className="text-xs text-muted-foreground">
                      {ADVISOR_ROLES.find((r) => r.value === i.advisor_role)?.label ?? "Advisor"} ·
                      Invited {new Date(i.invited_at).toLocaleDateString()}
                    </div>
                    {i.status === "pending" && i.invite_email_last_error && (
                      <div className="mt-1 text-xs text-destructive">Delivery needs attention</div>
                    )}
                    {i.status === "pending" && i.invite_email_last_sent_at && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Email sent {new Date(i.invite_email_last_sent_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={i.permission_level ?? "view_only"}
                    onChange={(e) => updatePerm(i.id, e.target.value)}
                    className="text-xs rounded-md border border-border bg-background px-2 py-1"
                  >
                    {PERMISSIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {i.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => resend(i.id)}
                        disabled={resendingInviteId === i.id}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {resendingInviteId === i.id ? "Sending…" : "Resend email"}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyAccessLink(i.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-secondary"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy access link
                      </button>
                    </>
                  )}
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                      i.status === "accepted"
                        ? "bg-accent-soft text-accent"
                        : i.status === "pending"
                          ? "bg-gold/15 text-foreground"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary mb-3">Advisor review package</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          These are the core items an advisor should review before recording review status or
          requesting changes.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <ReviewCard title="Company summary" icon={Shield}>
            <KV label="Business" value={current.name} />
            <KV
              label="Industry"
              value={`${current.industry ?? "—"} / ${current.sub_industry ?? "—"}`}
            />
            <KV label="Region" value={current.region ?? "—"} />
            <KV label="Employees" value={current.employees ?? "—"} />
            <KV label="Owner hours/week" value={current.owner_hours_per_week ?? "—"} />
          </ReviewCard>
          <ReviewCard title="Financial inputs and add-backs" icon={FileSpreadsheet}>
            <KV label="Latest year" value={latest?.year ?? "—"} />
            <KV label="Revenue" value={fmtCurrency(Number(latest?.revenue ?? 0))} />
            <KV label="EBITDA" value={fmtCurrency(Number(latest?.ebitda ?? 0))} />
            <KV
              label="Owner comp + add-backs"
              value={fmtCurrency(Number(latest?.owner_salary ?? 0) + Number(latest?.addbacks ?? 0))}
            />
            <KV label="Reviewed add-back items" value={latestAddBacks.length} />
            <KV label="Reviewed add-back total" value={fmtCurrency(latestAddBackTotal)} />
            <KV label="Debt" value={fmtCurrency(Number(latest?.debt ?? 0))} />
          </ReviewCard>
          <ReviewCard title="Valuation method results" icon={Shield}>
            <KV
              label="Value range"
              value={`${fmtCurrency(Number(valuation?.range_low ?? 0), { compact: true })} – ${fmtCurrency(Number(valuation?.range_high ?? 0), { compact: true })}`}
            />
            <KV label="Midpoint" value={fmtCurrency(Number(valuation?.range_mid ?? 0))} />
            <KV
              label="Health score"
              value={valuation?.health_score != null ? `${valuation.health_score}/100` : "—"}
            />
            <KV
              label="Saved"
              value={
                valuation?.computed_at
                  ? new Date(valuation.computed_at).toLocaleString()
                  : "No saved valuation"
              }
            />
          </ReviewCard>
          <ReviewCard title="Report draft" icon={FileText}>
            <KV label="Recent report snapshots" value={reports.length} />
            <KV
              label="Latest report"
              value={
                reports[0]?.generated_at
                  ? new Date(reports[0].generated_at).toLocaleString()
                  : "Preview available"
              }
            />
            <Link
              to="/app/reports"
              className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline"
            >
              Open report preview
            </Link>
          </ReviewCard>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary mb-3">Add-back review history</h2>
        {addBacks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No itemized owner add-backs have been reviewed yet.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Year</th>
                    <th className="py-2 pr-3 font-medium">Amount</th>
                    <th className="py-2 pr-3 font-medium">Category</th>
                    <th className="py-2 pr-3 font-medium">Recurring</th>
                    <th className="py-2 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {addBacks.map((row) => (
                    <tr key={row.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-3">{row.year}</td>
                      <td className="py-2 pr-3">{fmtCurrency(Number(row.amount ?? 0))}</td>
                      <td className="py-2 pr-3">{row.category}</td>
                      <td className="py-2 pr-3">{row.is_recurring ? "Yes" : "No"}</td>
                      <td className="py-2 text-muted-foreground">{row.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {addBackEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-primary">Recent changes</h3>
                <div className="mt-2 space-y-2">
                  {addBackEvents.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground"
                    >
                      <span className="font-semibold text-foreground capitalize">
                        {event.action}
                      </span>{" "}
                      add-back for {event.year} on {new Date(event.created_at).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary mb-2">Advisor feedback</h2>
        <p className="text-sm text-muted-foreground">
          Feedback is recorded by the advisor after they accept their access link and open their
          advisor workspace. Owners cannot record feedback on an advisor’s behalf.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Advisor comments &amp; review status
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Comments and review status from your advisor will appear here once they review the
            report.
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div
                key={c.id}
                className={`rounded-md border p-3 ${c.review_status === "approved" ? "border-accent/30 bg-accent-soft" : "border-border bg-secondary/30"}`}
              >
                <div className="text-sm">{c.body}</div>
                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  {c.author_id === current.owner_id ? "Owner note" : "Advisor"} · {new Date(c.created_at).toLocaleString()}{" "}
                  {c.review_status === "approved" && (
                    <>
                      <Shield className="h-3 w-3 text-accent" />{" "}
                      <span className="text-accent font-semibold">Reviewed</span>
                    </>
                  )}
                  {c.review_status === "changes_requested" && (
                    <span className="font-semibold text-destructive">Changes requested</span>
                  )}
                  {c.review_status === "reviewing" && (
                    <span className="font-semibold text-foreground">Reviewing</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-primary">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

function ReviewCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Shield;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-secondary/30 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
        <Icon className="h-4 w-4" /> {title}
      </h3>
      <div className="mt-3 space-y-1.5">{children}</div>
    </section>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function getApprovalState(comments: Comment[]) {
  const latestStatus = comments.find((comment) => comment.review_status !== "comment")?.review_status;
  if (latestStatus === "approved") {
    return {
      icon: CheckCircle2,
      label: "Reviewed",
      detail: "Advisor review status has been recorded.",
    };
  }
  if (latestStatus === "changes_requested") {
    return {
      icon: AlertTriangle,
      label: "Changes requested",
      detail: "Advisor requested updates before review is complete.",
    };
  }
  if (latestStatus === "reviewing" || comments.length > 0) {
    return {
      icon: Clock,
      label: "Reviewing",
      detail: "Advisor feedback is in progress.",
    };
  }
  return {
    icon: Clock,
    label: "Not started",
    detail: "No advisor feedback recorded yet.",
  };
}
