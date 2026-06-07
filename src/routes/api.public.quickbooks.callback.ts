import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  exchangeQuickBooksCodeForToken,
  fetchQuickBooksCompanyInfo,
} from "@/lib/quickbooks.server";
import { encryptToken } from "@/lib/token-crypto.server";
import { recordSecurityAuditEvent } from "@/lib/security-audit.server";

export const Route = createFileRoute("/api/public/quickbooks/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const realmId = url.searchParams.get("realmId");
        const errorParam = url.searchParams.get("error");

        const redirectTarget = (
          businessId: string | null | undefined,
        ): "/app/financials" | "/app/onboarding" =>
          businessId ? "/app/financials" : "/app/onboarding";
        const failRedirect = (msg: string, businessId?: string | null) =>
          redirect({
            to: redirectTarget(businessId),
            search: { quickbooks: "error", message: msg } as never,
            throw: true,
          });

        if (errorParam) throw failRedirect(errorParam);
        if (!code || !state || !realmId) throw failRedirect("missing_code_state_or_realm");

        const { data: stateRow, error: stateErr } = await supabaseAdmin
          .from("quickbooks_oauth_states")
          .select("user_id, business_id, redirect_uri, created_at")
          .eq("state", state)
          .maybeSingle();
        if (stateErr || !stateRow) throw failRedirect("invalid_state");

        if (Date.now() - new Date(stateRow.created_at).getTime() > 15 * 60_000) {
          await supabaseAdmin.from("quickbooks_oauth_states").delete().eq("state", state);
          throw failRedirect("expired_state", stateRow.business_id);
        }

        let tokens;
        try {
          tokens = await exchangeQuickBooksCodeForToken(code, stateRow.redirect_uri);
        } catch {
          throw failRedirect("token_exchange_failed", stateRow.business_id);
        }

        let companyName: string | null = null;
        try {
          const company = await fetchQuickBooksCompanyInfo({
            accessToken: tokens.access_token,
            realmId,
          });
          companyName = company.companyName;
        } catch {
          throw failRedirect("company_info_failed", stateRow.business_id);
        }

        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
        const lastSyncedAt = new Date().toISOString();
        const encryptedAccessToken = await encryptToken(tokens.access_token);
        const encryptedRefreshToken = await encryptToken(tokens.refresh_token);

        {
          const del = supabaseAdmin
            .from("quickbooks_connections")
            .delete()
            .eq("user_id", stateRow.user_id)
            .eq("realm_id", realmId);
          if (stateRow.business_id) {
            await del.eq("business_id", stateRow.business_id);
          } else {
            await del.is("business_id", null);
          }
        }

        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from("quickbooks_connections")
          .insert({
            user_id: stateRow.user_id,
            business_id: stateRow.business_id,
            realm_id: realmId,
            company_name: companyName,
            access_token: encryptedAccessToken,
            refresh_token: encryptedRefreshToken,
            expires_at: expiresAt,
            scope: "com.intuit.quickbooks.accounting",
            last_synced_at: lastSyncedAt,
          })
          .select("id")
          .single();
        if (insertErr) throw failRedirect("save_failed", stateRow.business_id);

        await recordSecurityAuditEvent({
          actorUserId: stateRow.user_id,
          businessId: stateRow.business_id,
          action: "quickbooks_oauth_connected",
          targetType: "quickbooks_connection",
          targetId: inserted.id,
          metadata: { realm_id: realmId, company_name: companyName },
        });

        await supabaseAdmin.from("quickbooks_oauth_states").delete().eq("state", state);

        throw redirect({
          to: redirectTarget(stateRow.business_id),
          search: { quickbooks: "connected", realm: realmId } as never,
          throw: true,
        });
      },
    },
  },
});
