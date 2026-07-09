// Server functions for the Xero integration.
// All functions require an authenticated Supabase session.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHost, getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { withSupabaseAuth } from "@/lib/with-supabase-auth";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  buildAuthorizeUrl,
  fetchYearSummary,
  listTenants,
  refreshAccessToken,
  type ParsedYear,
  type XeroMappedAccount,
} from "./xero.server";
import { decryptToken, encryptToken, isEncryptedToken } from "./token-crypto.server";
import { recordSecurityAuditEvent } from "./security-audit.server";
import { recordObservabilityEvent } from "./observability.server";

function safeErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 300) : "Xero import failed";
}

function getOrigin() {
  const req = getRequest();
  const fwdProto = req?.headers.get("x-forwarded-proto");
  const host = getRequestHost();
  const proto = fwdProto ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const startXeroConnect = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ businessId: z.string().uuid().nullable().optional() }))
  .handler(async ({ data, context }) => {
    const origin = getOrigin();
    const redirectUri = `${origin}/api/public/xero/callback`;
    const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const { error } = await supabaseAdmin.from("xero_oauth_states").insert({
      state,
      user_id: context.userId,
      business_id: data.businessId ?? null,
      redirect_uri: redirectUri,
    });
    if (error) throw new Error(`Failed to start Xero connect: ${error.message}`);
    await recordSecurityAuditEvent({
      actorUserId: context.userId,
      businessId: data.businessId ?? null,
      action: "xero_oauth_started",
      targetType: "xero_connection",
    });

    return { url: buildAuthorizeUrl({ state, redirectUri }) };
  });

export const listXeroConnections = createServerFn({ method: "GET" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("xero_connections")
      .select("id, tenant_id, tenant_name, business_id, expires_at, last_synced_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { connections: data ?? [] };
  });

export const disconnectXeroConnection = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ connectionId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: conn, error } = await supabaseAdmin
      .from("xero_connections")
      .select("id, business_id, tenant_id")
      .eq("id", data.connectionId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn) throw new Error("Xero connection not found");

    const { error: deleteErr } = await supabaseAdmin
      .from("xero_connections")
      .delete()
      .eq("id", conn.id)
      .eq("user_id", context.userId);
    if (deleteErr) throw new Error(deleteErr.message);

    await recordSecurityAuditEvent({
      actorUserId: context.userId,
      businessId: conn.business_id,
      action: "xero_oauth_disconnected",
      targetType: "xero_connection",
      targetId: conn.id,
      metadata: { tenant_id: conn.tenant_id },
    });

    return { ok: true };
  });

async function ensureFreshToken(connection: {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}) {
  const accessToken = await decryptToken(connection.access_token);
  const refreshToken = await decryptToken(connection.refresh_token);
  const tokensWerePlaintext =
    !isEncryptedToken(connection.access_token) || !isEncryptedToken(connection.refresh_token);
  const expiresAt = new Date(connection.expires_at).getTime();
  if (expiresAt - Date.now() > 60_000) {
    if (tokensWerePlaintext) {
      await supabaseAdmin
        .from("xero_connections")
        .update({
          access_token: await encryptToken(accessToken),
          refresh_token: await encryptToken(refreshToken),
        })
        .eq("id", connection.id);
    }
    return accessToken;
  }

  const tokens = await refreshAccessToken(refreshToken);
  const newExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await supabaseAdmin
    .from("xero_connections")
    .update({
      access_token: await encryptToken(tokens.access_token),
      refresh_token: await encryptToken(tokens.refresh_token),
      expires_at: newExpires,
    })
    .eq("id", connection.id);
  return tokens.access_token;
}

export const importXeroFinancials = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(
    z.object({
      tenantId: z.string().min(1),
      years: z.array(z.number().int().min(1990).max(2100)).min(1).max(5),
    }),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      years: ParsedYear[];
      tenantName: string | null;
      summary: {
        importedAccounts: number;
        unmappedAccounts: string[];
        warnings: string[];
        lastSyncedAt: string;
      };
    }> => {
      let connectionId: string | null = null;
      let businessId: string | null = null;
      let importLogId: string | null = null;
      try {
        const { data: conn, error } = await supabaseAdmin
          .from("xero_connections")
          .select("id, business_id, access_token, refresh_token, expires_at, tenant_name")
          .eq("user_id", context.userId)
          .eq("tenant_id", data.tenantId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (!conn)
          throw new Error("No Xero connection found for this organisation. Connect Xero first.");

        connectionId = conn.id;
        businessId = conn.business_id ?? null;
        if (businessId) {
          const { data: log } = await supabaseAdmin
            .from("import_sync_logs")
            .insert({
              business_id: businessId,
              source_system: "xero",
              status: "started",
              report_names: ["Profit and Loss", "Balance Sheet"],
              retry_action: "xero_import",
              created_by: context.userId,
              metadata: { tenant_id: data.tenantId, years_requested: data.years.length },
            })
            .select("id")
            .maybeSingle();
          importLogId = log?.id ?? null;
        }
        await recordObservabilityEvent({
          actorUserId: context.userId,
          businessId,
          eventName: "accounting_import_started",
          area: "import",
          targetType: "xero_connection",
          targetId: connectionId,
          metadata: { source: "xero", years_count: data.years.length },
        });

        const accessToken = await ensureFreshToken(conn);

        // Fetch each year sequentially to avoid Xero rate limits.
        const out: ParsedYear[] = [];
        for (const y of data.years) {
          out.push(await fetchYearSummary({ accessToken, tenantId: data.tenantId, year: y }));
        }
        const lastSyncedAt = new Date().toISOString();
        await supabaseAdmin
          .from("xero_connections")
          .update({ last_synced_at: lastSyncedAt })
          .eq("id", conn.id);
        const accounts = out.flatMap((year) => year.accounts ?? []) as XeroMappedAccount[];
        const unmappedAccounts = Array.from(
          new Set(
            accounts
              .filter((account) => account.normalizedField === "unmapped")
              .map((account) => account.sourceAccountName),
          ),
        ).sort((a, b) => a.localeCompare(b));
        const warnings = Array.from(new Set(out.flatMap((year) => year.warnings ?? [])));
        const sortedYears = out.map((year) => Number(year.year)).sort((a, b) => a - b);
        if (importLogId) {
          await supabaseAdmin
            .from("import_sync_logs")
            .update({
              status: "success",
              completed_at: lastSyncedAt,
              date_range_start: sortedYears[0] ?? null,
              date_range_end: sortedYears[sortedYears.length - 1] ?? null,
              imported_year_count: out.length,
              imported_account_count: accounts.length,
              warning_count: warnings.length,
              warnings,
              metadata: {
                tenant_id: data.tenantId,
                unmapped_accounts_count: unmappedAccounts.length,
              },
            })
            .eq("id", importLogId);
        }
        await recordSecurityAuditEvent({
          actorUserId: context.userId,
          businessId: conn.business_id,
          action: "xero_financials_imported",
          targetType: "xero_connection",
          targetId: conn.id,
          metadata: {
            tenant_id: data.tenantId,
            years: data.years,
            imported_accounts: accounts.length,
            unmapped_accounts: unmappedAccounts,
          },
        });
        await recordObservabilityEvent({
          actorUserId: context.userId,
          businessId,
          eventName: "accounting_import_completed",
          area: "import",
          targetType: "xero_connection",
          targetId: connectionId,
          metadata: {
            source: "xero",
            years_count: out.length,
            imported_accounts_count: accounts.length,
            unmapped_accounts_count: unmappedAccounts.length,
            warnings_count: warnings.length,
          },
        });
        return {
          years: out,
          tenantName: conn.tenant_name ?? null,
          summary: {
            importedAccounts: accounts.length,
            unmappedAccounts,
            warnings,
            lastSyncedAt,
          },
        };
      } catch (error) {
        if (importLogId) {
          await supabaseAdmin
            .from("import_sync_logs")
            .update({
              status: "failed",
              completed_at: new Date().toISOString(),
              error_message: safeErrorMessage(error),
              warning_count: 0,
            })
            .eq("id", importLogId);
        }
        await recordObservabilityEvent({
          actorUserId: context.userId,
          businessId,
          eventName: "accounting_import_failed",
          severity: "error",
          area: "import",
          targetType: connectionId ? "xero_connection" : null,
          targetId: connectionId,
          metadata: {
            source: "xero",
            years_count: data.years.length,
            error_name: error instanceof Error ? error.name : "Error",
          },
        });
        throw error;
      }
    },
  );

export const refreshXeroTenants = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ tenantId: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const { data: conn, error } = await supabaseAdmin
      .from("xero_connections")
      .select("id, business_id, access_token, refresh_token, expires_at")
      .eq("user_id", context.userId)
      .eq("tenant_id", data.tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn) throw new Error("Connection not found");
    const accessToken = await ensureFreshToken(conn);
    const tenants = await listTenants(accessToken);
    await recordSecurityAuditEvent({
      actorUserId: context.userId,
      businessId: conn.business_id,
      action: "xero_tenants_refreshed",
      targetType: "xero_connection",
      targetId: conn.id,
      metadata: { tenant_id: data.tenantId },
    });
    return { tenants };
  });
