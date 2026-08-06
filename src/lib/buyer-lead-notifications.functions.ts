import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordObservabilityEvent } from "@/lib/observability.server";

const notificationSchema = z.object({
  requestId: z.string().uuid(),
  notificationToken: z.string().uuid(),
});

const OWNER_EMAIL_LIMIT_PER_HOUR = 10;

const BUYER_TYPE_LABELS: Record<string, string> = {
  individual: "Individual buyer",
  strategic: "Strategic acquirer",
  financial: "Financial / PE",
  search_fund: "Search fund",
  other: "Other",
};

const FINANCING_LABELS: Record<string, string> = {
  cash: "Cash",
  sba_pre_approved: "SBA pre-approved",
  sba_unverified: "SBA not verified",
  seller_financing: "Needs seller financing",
  other: "Other / exploring",
};

function getOrigin() {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const request = getRequest();
  const host = getRequestHost();
  const proto = request?.headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function sendTransactionalEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Buyer lead email delivery is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!response.ok) {
    const providerMessage = await response.text().catch(() => "");
    console.error(`Resend buyer lead email failed [${response.status}]: ${providerMessage}`);
    throw new Error(`Email provider rejected the buyer lead email [${response.status}].`);
  }
}

export const notifyBuyerLeadCreated = createServerFn({ method: "POST" })
  .inputValidator(notificationSchema)
  .handler(async ({ data }) => {
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("buyer_access_requests")
      .select("id, business_id, buyer_type, financing_status, email, owner_notified_at, buyer_acknowledged_at")
      .eq("id", data.requestId)
      .eq("notification_token", data.notificationToken)
      .maybeSingle();

    if (leadError) throw new Error(leadError.message);
    if (!lead) throw new Error("Buyer lead notification is unavailable.");

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", lead.business_id)
      .maybeSingle();

    if (businessError) throw new Error(businessError.message);
    if (!business) throw new Error("Business was not found.");

    const errors: string[] = [];
    let ownerResult: "sent" | "deferred" | "skipped" = lead.owner_notified_at ? "skipped" : "deferred";
    let buyerResult: "sent" | "skipped" = lead.buyer_acknowledged_at ? "skipped" : "skipped";
    const leadsUrl = `${getOrigin()}/app/buyer-requests`;

    if (!lead.owner_notified_at) {
      const { count, error: countError } = await supabaseAdmin
        .from("buyer_access_requests")
        .select("id", { count: "exact", head: true })
        .eq("business_id", lead.business_id)
        .not("owner_notified_at", "is", null)
        .gte("owner_notified_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (countError) {
        errors.push(countError.message);
      } else if ((count ?? 0) >= OWNER_EMAIL_LIMIT_PER_HOUR) {
        ownerResult = "deferred";
        await recordObservabilityEvent({
          businessId: business.id,
          eventName: "buyer_lead_owner_email_deferred",
          severity: "warn",
          area: "buyer_leads",
          targetType: "buyer_access_request",
          targetId: lead.id,
        });
      } else {
        const { data: ownerResultData, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(
          business.owner_id,
        );
        const ownerEmail = ownerResultData.user?.email;
        if (ownerError || !ownerEmail) {
          errors.push(ownerError?.message ?? "Business owner email is unavailable.");
        } else {
          try {
            await sendTransactionalEmail({
              to: ownerEmail,
              subject: `New buyer lead for ${business.name}`,
              text: [
                `A new buyer has requested access to ${business.name}.`,
                "",
                `Buyer type: ${BUYER_TYPE_LABELS[lead.buyer_type ?? ""] ?? "Not provided"}`,
                `Financing: ${FINANCING_LABELS[lead.financing_status ?? ""] ?? "Not provided"}`,
                "",
                "Review the request and decide the next step:",
                leadsUrl,
                "",
                "This is a transactional notification about a buyer request.",
              ].join("\n"),
            });
            ownerResult = "sent";
            await supabaseAdmin
              .from("buyer_access_requests")
              .update({ owner_notified_at: new Date().toISOString() })
              .eq("id", lead.id);
          } catch (error) {
            errors.push(error instanceof Error ? error.message : "Owner email delivery failed.");
          }
        }
      }
    }

    if (!lead.buyer_acknowledged_at) {
      try {
        await sendTransactionalEmail({
          to: lead.email,
          subject: `We received your request for ${business.name}`,
          text: [
            "Thank you for your interest.",
            "",
            "Your confidential request has been received. The business owner will review it and contact you if they choose to continue the conversation.",
            "",
            "You will not receive sensitive business information until the owner approves the next step.",
          ].join("\n"),
        });
        buyerResult = "sent";
        await supabaseAdmin
          .from("buyer_access_requests")
          .update({ buyer_acknowledged_at: new Date().toISOString() })
          .eq("id", lead.id);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Buyer acknowledgement delivery failed.");
      }
    }

    const notificationLastError = errors.length ? errors.join(" ").slice(0, 500) : null;
    await supabaseAdmin
      .from("buyer_access_requests")
      .update({ notification_last_error: notificationLastError })
      .eq("id", lead.id);

    await recordObservabilityEvent({
      businessId: business.id,
      eventName: errors.length ? "buyer_lead_notification_failed" : "buyer_lead_notification_sent",
      severity: errors.length ? "warn" : "info",
      area: "buyer_leads",
      targetType: "buyer_access_request",
      targetId: lead.id,
      metadata: {
        owner_sent: ownerResult === "sent",
        buyer_sent: buyerResult === "sent",
        owner_deferred: ownerResult === "deferred",
      },
    });

    return { owner: ownerResult, buyer: buyerResult };
  });
