import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { exchangeCodeForToken, listTenants } from "@/lib/xero.server";

export const Route = createFileRoute("/api/public/xero/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");

        const failRedirect = (msg: string) =>
          redirect({
            to: "/app/onboarding",
            search: { xero: "error", message: msg } as never,
            throw: true,
          });

        if (errorParam) throw failRedirect(errorParam);
        if (!code || !state) throw failRedirect("missing_code_or_state");

        // Look up state
        const { data: stateRow, error: stateErr } = await supabaseAdmin
          .from("xero_oauth_states")
          .select("user_id, business_id, redirect_uri, created_at")
          .eq("state", state)
          .maybeSingle();
        if (stateErr || !stateRow) throw failRedirect("invalid_state");

        // Expire after 15 minutes
        if (Date.now() - new Date(stateRow.created_at).getTime() > 15 * 60_000) {
          await supabaseAdmin.from("xero_oauth_states").delete().eq("state", state);
          throw failRedirect("expired_state");
        }

        let tokens;
        try {
          tokens = await exchangeCodeForToken(code, stateRow.redirect_uri);
        } catch (e) {
          throw failRedirect(e instanceof Error ? e.message : "token_exchange_failed");
        }

        let tenants;
        try {
          tenants = await listTenants(tokens.access_token);
        } catch (e) {
          throw failRedirect(e instanceof Error ? e.message : "tenants_failed");
        }
        if (!tenants.length) throw failRedirect("no_tenants");

        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Save one row per tenant (so user can pick which org to import from).
        for (const t of tenants) {
          // Upsert by (user_id, tenant_id, business_id IS NULL during onboarding).
          // Delete prior row for same user+tenant to avoid duplicates.
          {
            const del = supabaseAdmin
              .from("xero_connections")
              .delete()
              .eq("user_id", stateRow.user_id)
              .eq("tenant_id", t.tenantId);
            if (stateRow.business_id) {
              await del.eq("business_id", stateRow.business_id);
            } else {
              await del.is("business_id", null);
            }
          }

          const { error: insertErr } = await supabaseAdmin.from("xero_connections").insert({
            user_id: stateRow.user_id,
            business_id: stateRow.business_id,
            tenant_id: t.tenantId,
            tenant_name: t.tenantName,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: expiresAt,
            scope: tokens.scope,
          });
          if (insertErr) {
            throw failRedirect(`save_failed:${insertErr.message}`);
          }
        }

        await supabaseAdmin.from("xero_oauth_states").delete().eq("state", state);

        // Send the user back to onboarding with success flag + tenant id (first one).
        throw redirect({
          to: "/app/onboarding",
          search: { xero: "connected", tenant: tenants[0].tenantId } as never,
          throw: true,
        });
      },
    },
  },
});
