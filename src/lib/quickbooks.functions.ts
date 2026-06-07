import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { withSupabaseAuth } from "@/lib/with-supabase-auth";
import { decryptToken, encryptToken, isEncryptedToken } from "@/lib/token-crypto.server";
import { recordSecurityAuditEvent } from "@/lib/security-audit.server";
import {
  buildQuickBooksAuthorizeUrl,
  fetchQuickBooksCompanyInfo,
  refreshQuickBooksAccessToken,
} from "./quickbooks.server";

function getOrigin() {
  const req = getRequest();
  const fwdProto = req?.headers.get("x-forwarded-proto");
  const host = getRequestHost();
  const proto = fwdProto ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const startQuickBooksConnect = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ businessId: z.string().uuid().nullable().optional() }))
  .handler(async ({ data, context }) => {
    const origin = getOrigin();
    const redirectUri = `${origin}/api/public/quickbooks/callback`;
    const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

    const { error } = await supabaseAdmin.from("quickbooks_oauth_states").insert({
      state,
      user_id: context.userId,
      business_id: data.businessId ?? null,
      redirect_uri: redirectUri,
    });
    if (error) throw new Error(`Failed to start QuickBooks connect: ${error.message}`);

    await recordSecurityAuditEvent({
      actorUserId: context.userId,
      businessId: data.businessId ?? null,
      action: "quickbooks_oauth_started",
      targetType: "quickbooks_connection",
    });

    return { url: buildQuickBooksAuthorizeUrl({ state, redirectUri }) };
  });

export const listQuickBooksConnections = createServerFn({ method: "GET" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("quickbooks_connections")
      .select("id, realm_id, company_name, business_id, expires_at, last_synced_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { connections: data ?? [] };
  });

async function ensureFreshQuickBooksToken(connection: {
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
        .from("quickbooks_connections")
        .update({
          access_token: await encryptToken(accessToken),
          refresh_token: await encryptToken(refreshToken),
        })
        .eq("id", connection.id);
    }
    return accessToken;
  }

  const tokens = await refreshQuickBooksAccessToken(refreshToken);
  const newExpires = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await supabaseAdmin
    .from("quickbooks_connections")
    .update({
      access_token: await encryptToken(tokens.access_token),
      refresh_token: await encryptToken(tokens.refresh_token),
      expires_at: newExpires,
    })
    .eq("id", connection.id);
  return tokens.access_token;
}

export const refreshQuickBooksConnection = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ connectionId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: conn, error } = await supabaseAdmin
      .from("quickbooks_connections")
      .select("id, business_id, realm_id, access_token, refresh_token, expires_at")
      .eq("id", data.connectionId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn) throw new Error("QuickBooks connection not found");

    const accessToken = await ensureFreshQuickBooksToken(conn);
    const company = await fetchQuickBooksCompanyInfo({
      accessToken,
      realmId: conn.realm_id,
    });
    const lastSyncedAt = new Date().toISOString();
    const { error: updateErr } = await supabaseAdmin
      .from("quickbooks_connections")
      .update({
        company_name: company.companyName,
        last_synced_at: lastSyncedAt,
      })
      .eq("id", conn.id);
    if (updateErr) throw new Error(updateErr.message);

    await recordSecurityAuditEvent({
      actorUserId: context.userId,
      businessId: conn.business_id,
      action: "quickbooks_connection_refreshed",
      targetType: "quickbooks_connection",
      targetId: conn.id,
      metadata: { realm_id: conn.realm_id },
    });

    return { companyName: company.companyName, lastSyncedAt };
  });

export const disconnectQuickBooksConnection = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(z.object({ connectionId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: conn, error } = await supabaseAdmin
      .from("quickbooks_connections")
      .select("id, business_id, realm_id")
      .eq("id", data.connectionId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!conn) throw new Error("QuickBooks connection not found");

    const { error: deleteErr } = await supabaseAdmin
      .from("quickbooks_connections")
      .delete()
      .eq("id", conn.id)
      .eq("user_id", context.userId);
    if (deleteErr) throw new Error(deleteErr.message);

    await recordSecurityAuditEvent({
      actorUserId: context.userId,
      businessId: conn.business_id,
      action: "quickbooks_oauth_disconnected",
      targetType: "quickbooks_connection",
      targetId: conn.id,
      metadata: { realm_id: conn.realm_id },
    });

    return { ok: true };
  });
