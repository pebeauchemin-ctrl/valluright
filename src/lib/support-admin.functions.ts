import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withSupabaseAuth } from "@/lib/with-supabase-auth";
import { COMMERCIAL_PLANS } from "@/lib/commercial-model";
import {
  buildOnboardingStatus,
  sanitizeSupportMetadata,
  type SupportAccountSummary,
} from "@/lib/support-admin";

const searchSchema = z.object({
  query: z.string().trim().min(2).max(120),
});

type SupportUserRecord = { id: string; email: string | null; createdAt: string | null };
type SafeImportLogRow = {
  source_system: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  warning_count: number | null;
  retry_action: string | null;
  report_names: string[] | null;
  metadata: unknown;
};
type SafeEventRow = {
  event_name: string;
  area: string;
  severity: string;
  created_at: string;
  metadata: unknown;
};

async function currentUserIsAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);
  if (error) throw new Error(error.message);
  return (data ?? []).length > 0;
}

export const getSupportAdminAccess = createServerFn({ method: "GET" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => ({ isAdmin: await currentUserIsAdmin(context.userId) }));

export const searchSupportAccounts = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(searchSchema)
  .handler(async ({ data, context }) => {
    if (!(await currentUserIsAdmin(context.userId))) {
      throw new Response("Forbidden", { status: 403 });
    }

    const query = data.query.toLowerCase();
    const allUsers = await listUsersForSupport();
    const users = allUsers.filter((user) => user.email?.toLowerCase().includes(query));
    const userIds = new Set(users.map((user) => user.id));

    const [businessesByName, profilesByCompany, profilesByName] = await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id, owner_id, name, created_at, updated_at")
        .ilike("name", `%${data.query}%`)
        .limit(10),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, company, created_at, updated_at")
        .ilike("company", `%${data.query}%`)
        .limit(10),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, company, created_at, updated_at")
        .ilike("full_name", `%${data.query}%`)
        .limit(10),
    ]);

    if (businessesByName.error) throw new Error(businessesByName.error.message);
    if (profilesByCompany.error) throw new Error(profilesByCompany.error.message);
    if (profilesByName.error) throw new Error(profilesByName.error.message);

    for (const business of businessesByName.data ?? []) userIds.add(business.owner_id);
    for (const profile of [...(profilesByCompany.data ?? []), ...(profilesByName.data ?? [])]) {
      userIds.add(profile.id);
    }

    const accountRows = await Promise.all(
      [...userIds].slice(0, 10).map((userId) => buildSupportAccount(userId, allUsers)),
    );

    return {
      notice:
        "Support search hides financial values, buyer PII, OAuth tokens, and raw import data.",
      results: accountRows.filter(Boolean) as SupportAccountSummary[],
    };
  });

async function listUsersForSupport() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(error.message);
  return (data.users ?? [])
    .map((user) => ({
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at ?? null,
    }));
}

async function buildSupportAccount(
  userId: string,
  matchedUsers: SupportUserRecord[],
) {
  const [profileResult, businessResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, company, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin
      .from("businesses")
      .select("id, owner_id, name, created_at, updated_at")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (profileResult.error) throw new Error(profileResult.error.message);
  if (businessResult.error) throw new Error(businessResult.error.message);

  const matchedUser = matchedUsers.find((user) => user.id === userId) ?? null;
  const business = businessResult.data ?? null;
  const businessId = business?.id ?? null;
  const profile = profileResult.data ?? null;

  const [
    financialYears,
    valuations,
    buyerSettings,
    reports,
    advisorInvites,
    dataRoomFiles,
    importLogs,
    xeroConnections,
    quickBooksConnections,
    events,
  ] = await Promise.all([
    countTable("financial_years", businessId),
    businessId
      ? supabaseAdmin
          .from("valuations")
          .select("computed_at")
          .eq("business_id", businessId)
          .order("computed_at", { ascending: false })
          .limit(1)
      : emptyRows<{ computed_at: string }>(),
    businessId
      ? supabaseAdmin
          .from("buyer_view_settings")
          .select("is_published")
          .eq("business_id", businessId)
          .maybeSingle()
      : emptySingle<{ is_published: boolean }>(),
    countTable("reports", businessId),
    countTable("advisor_invites", businessId),
    countTable("data_room_files", businessId),
    businessId
      ? supabaseAdmin
          .from("import_sync_logs")
          .select(
            "source_system, status, started_at, completed_at, error_message, warning_count, retry_action, report_names, metadata",
          )
          .eq("business_id", businessId)
          .order("started_at", { ascending: false })
          .limit(1)
      : emptyRows<SafeImportLogRow>(),
    supabaseAdmin
      .from("xero_connections")
      .select("last_synced_at")
      .eq("user_id", userId)
      .order("last_synced_at", { ascending: false, nullsFirst: false }),
    supabaseAdmin
      .from("quickbooks_connections")
      .select("last_synced_at")
      .eq("user_id", userId)
      .order("last_synced_at", { ascending: false, nullsFirst: false }),
    businessId
      ? supabaseAdmin
          .from("app_observability_events")
          .select("event_name, area, severity, created_at, metadata")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(5)
      : emptyRows<SafeEventRow>(),
  ]);

  throwIfError(valuations.error);
  throwIfError(buyerSettings.error);
  throwIfError(importLogs.error);
  throwIfError(xeroConnections.error);
  throwIfError(quickBooksConnections.error);
  throwIfError(events.error);

  const importRow = importLogs.data?.[0] ?? null;

  return {
    userId,
    email: matchedUser?.email ?? null,
    fullName: profile?.full_name ?? null,
    company: profile?.company ?? null,
    businessId,
    businessName: business?.name ?? null,
    createdAt: profile?.created_at ?? matchedUser?.createdAt ?? business?.created_at ?? null,
    updatedAt: profile?.updated_at ?? business?.updated_at ?? null,
    onboarding: buildOnboardingStatus({
      hasBusinessProfile: Boolean(businessId),
      financialYearCount: financialYears,
      hasValuation: Boolean(valuations.data?.[0]),
      buyerTeaserPublished: Boolean(buyerSettings.data?.is_published),
      reportCount: reports,
      advisorInviteCount: advisorInvites,
      dataRoomFileCount: dataRoomFiles,
    }),
    lastValuationRunAt: valuations.data?.[0]?.computed_at ?? null,
    importStatus: importRow
      ? {
          source: importRow.source_system,
          status: importRow.status,
          startedAt: importRow.started_at,
          completedAt: importRow.completed_at,
          errorMessage: importRow.error_message,
          warningCount: importRow.warning_count ?? 0,
          retryAction: importRow.retry_action,
          reportNames: importRow.report_names ?? [],
          metadata: sanitizeSupportMetadata(importRow.metadata),
        }
      : null,
    connections: {
      xeroCount: xeroConnections.data?.length ?? 0,
      quickBooksCount: quickBooksConnections.data?.length ?? 0,
      lastXeroSyncAt: xeroConnections.data?.[0]?.last_synced_at ?? null,
      lastQuickBooksSyncAt: quickBooksConnections.data?.[0]?.last_synced_at ?? null,
    },
    recentEvents: (events.data ?? []).map((event) => ({
      eventName: event.event_name,
      area: event.area,
      severity: event.severity,
      createdAt: event.created_at,
      metadata: sanitizeSupportMetadata(event.metadata),
    })),
  } satisfies SupportAccountSummary;
}

async function countTable(
  table:
    | "financial_years"
    | "reports"
    | "advisor_invites"
    | "data_room_files",
  businessId: string | null,
) {
  if (!businessId) return 0;
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function emptyRows<T>() {
  return Promise.resolve({ data: [] as T[], error: null });
}

function emptySingle<T>() {
  return Promise.resolve({ data: null as T | null, error: null });
}

function throwIfError(error: { message: string } | null | undefined) {
  if (error) throw new Error(error.message);
}


export type AdminBillingOverview = {
  metrics: {
    activeByPlan: Array<{ plan: string; count: number }>;
    mrr: number;
    freeAccounts: number;
    pastDueAccounts: number;
    canceledThisMonth: number;
    oneTimePurchasesThisMonth: number;
  };
  subscriptions: Array<{
    userId: string;
    email: string | null;
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    startedAt: string;
    cancelAtPeriodEnd: boolean;
    stripeCustomerUrl: string | null;
  }>;
  webhookEvents: Array<{
    eventType: string;
    receivedAt: string;
    processedAt: string | null;
    errorMessage: string | null;
  }>;
};

const ACTIVE_BILLING_STATUSES = new Set(["active", "trialing"]);
const MONTHLY_PLAN_PRICES = Object.fromEntries(
  COMMERCIAL_PLANS.map((plan) => [plan.slug, Number(plan.price.replace(/[^0-9.]/g, ""))]),
) as Record<string, number>;

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function stripeDashboardCustomerUrl(customerId: string | null) {
  if (!customerId) return null;
  const base = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com";
  return `${base}/customers/${customerId}`;
}

export const getAdminBillingOverview = createServerFn({ method: "GET" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminBillingOverview> => {
    if (!(await currentUserIsAdmin(context.userId))) {
      throw new Response("Forbidden", { status: 403 });
    }

    const [subscriptionsResult, webhookEventsResult, users] = await Promise.all([
      supabaseAdmin
        .from("subscriptions")
        .select(
          "user_id, plan, status, current_period_end, created_at, updated_at, cancel_at_period_end, stripe_customer_id",
        )
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("billing_webhook_events")
        .select("event_type, received_at, processed_at, error_message")
        .order("received_at", { ascending: false })
        .limit(20),
      listUsersForSupport(),
    ]);

    throwIfError(subscriptionsResult.error);
    throwIfError(webhookEventsResult.error);

    const usersById = new Map(users.map((user) => [user.id, user]));
    const subscriptions = subscriptionsResult.data ?? [];
    const monthlySubscribers = subscriptions.filter(
      (subscription) =>
        ACTIVE_BILLING_STATUSES.has(subscription.status) &&
        subscription.plan !== "free",
    );
    const planCounts = new Map<string, number>();
    for (const subscription of monthlySubscribers) {
      planCounts.set(subscription.plan, (planCounts.get(subscription.plan) ?? 0) + 1);
    }

    return {
      metrics: {
        activeByPlan: [...planCounts.entries()].map(([plan, count]) => ({ plan, count })),
        mrr: monthlySubscribers.reduce(
          (total, subscription) => total + (MONTHLY_PLAN_PRICES[subscription.plan] ?? 0),
          0,
        ),
        freeAccounts: Math.max(
          0,
          users.length -
            new Set(
              subscriptions
                .filter((subscription) => subscription.plan !== "free")
                .map((subscription) => subscription.user_id),
            ).size,
        ),
        pastDueAccounts: subscriptions.filter((subscription) =>
          ["past_due", "unpaid", "incomplete"].includes(subscription.status),
        ).length,
        canceledThisMonth: subscriptions.filter(
          (subscription) =>
            subscription.status === "canceled" && subscription.updated_at >= startOfCurrentMonth(),
        ).length,
        oneTimePurchasesThisMonth: 0,
      },
      subscriptions: subscriptions.map((subscription) => ({
        userId: subscription.user_id,
        email: usersById.get(subscription.user_id)?.email ?? null,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        startedAt: subscription.created_at,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        stripeCustomerUrl: stripeDashboardCustomerUrl(subscription.stripe_customer_id),
      })),
      webhookEvents: (webhookEventsResult.data ?? []).map((event) => ({
        eventType: event.event_type,
        receivedAt: event.received_at,
        processedAt: event.processed_at,
        errorMessage: event.error_message,
      })),
    };
  });
