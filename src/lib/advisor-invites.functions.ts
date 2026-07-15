import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHost } from "@tanstack/react-start/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { recordObservabilityEvent } from "@/lib/observability.server";
import { withSupabaseAuth } from "@/lib/with-supabase-auth";

const inviteSchema = z.object({
  businessId: z.string().uuid(),
  advisorEmail: z.string().email().max(320),
  advisorRole: z.enum(["cpa", "bookkeeper", "broker", "financial_advisor", "attorney", "consultant"]),
  permissionLevel: z.enum(["view_only", "comment", "edit_assumptions", "approve"]),
});

const resendSchema = z.object({ inviteId: z.string().uuid() });

const ADVISOR_ROLE_LABELS: Record<string, string> = {
  cpa: "CPA / Accountant",
  bookkeeper: "Bookkeeper",
  broker: "Business Broker",
  financial_advisor: "Financial Advisor",
  attorney: "Attorney",
  consultant: "Consultant",
};

const PERMISSION_LABELS: Record<string, string> = {
  view_only: "View only",
  comment: "Comment only",
  edit_assumptions: "Review inputs",
  approve: "Record review status",
};

type InviteRecord = {
  id: string;
  business_id: string;
  advisor_email: string;
  advisor_role: string | null;
  permission_level: string;
  status: string;
  invite_email_last_attempt_at: string | null;
};

function getOrigin() {
  const request = getRequest();
  const host = getRequestHost();
  const proto = request?.headers.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function deliveryErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("not configured")) return error.message;
  return "ValuRight could not send the advisor email. Check the email configuration and try again.";
}

async function sendEmail({
  recipient,
  businessName,
  advisorRole,
  permissionLevel,
  inviteId,
}: {
  recipient: string;
  businessName: string;
  advisorRole: string | null;
  permissionLevel: string;
  inviteId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Advisor email delivery is not configured. Add RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const acceptUrl = `${getOrigin()}/advisor/accept/${inviteId}`;
  const declineUrl = `${getOrigin()}/advisor/decline/${inviteId}`;
  const roleLabel = ADVISOR_ROLE_LABELS[advisorRole ?? ""] ?? "Advisor";
  const permissionLabel = PERMISSION_LABELS[permissionLevel] ?? "View only";
  const text = [
    `You were invited to advise ${businessName} on ValuRight.ai.`,
    "",
    `Role: ${roleLabel}`,
    `Access: ${permissionLabel}`,
    "",
    "Sign in or create an account with this email address to accept:",
    acceptUrl,
    "",
    "This invitation does not include financial details. If you were not expecting it, you can decline it after signing in:",
    declineUrl,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: `Advisor invitation from ${businessName} on ValuRight.ai`,
      text,
    }),
  });

  if (!response.ok) throw new Error(`Email provider rejected the invitation [${response.status}].`);
}

async function verifyOwner(
  businessId: string,
  userId: string,
  supabase: SupabaseClient<Database>,
) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Only the business owner can manage advisor invitations.");
  return data;
}

async function deliverInvite({ invite, businessName, actorUserId }: {
  invite: InviteRecord;
  businessName: string;
  actorUserId: string;
}) {
  const attemptedAt = new Date().toISOString();
  await supabaseAdmin
    .from("advisor_invites")
    .update({ invite_email_last_attempt_at: attemptedAt, invite_email_last_error: null })
    .eq("id", invite.id);

  try {
    await sendEmail({
      recipient: invite.advisor_email,
      businessName,
      advisorRole: invite.advisor_role,
      permissionLevel: invite.permission_level,
      inviteId: invite.id,
    });
    const sentAt = new Date().toISOString();
    await supabaseAdmin
      .from("advisor_invites")
      .update({ invite_email_last_sent_at: sentAt, invite_email_last_error: null })
      .eq("id", invite.id);
    await recordObservabilityEvent({
      actorUserId,
      businessId: invite.business_id,
      eventName: "advisor_invite_email_sent",
      area: "advisor",
      targetType: "advisor_invite",
      targetId: invite.id,
    });
    return { status: "sent" as const, sentAt };
  } catch (error) {
    const message = deliveryErrorMessage(error);
    await supabaseAdmin
      .from("advisor_invites")
      .update({ invite_email_last_error: message })
      .eq("id", invite.id);
    await recordObservabilityEvent({
      actorUserId,
      businessId: invite.business_id,
      eventName: "advisor_invite_email_failed",
      severity: "warn",
      area: "advisor",
      targetType: "advisor_invite",
      targetId: invite.id,
      metadata: { configured: !message.includes("not configured") },
    });
    return { status: "failed" as const, message };
  }
}

export const createAdvisorInvite = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(inviteSchema)
  .handler(async ({ data, context }) => {
    const business = await verifyOwner(data.businessId, context.userId, context.supabase);
    const { data: invite, error } = await supabaseAdmin
      .from("advisor_invites")
      .insert({
        business_id: business.id,
        advisor_email: data.advisorEmail.trim().toLowerCase(),
        advisor_role: data.advisorRole,
        permission_level: data.permissionLevel,
        status: "pending",
      })
      .select("id, business_id, advisor_email, advisor_role, permission_level, status, invite_email_last_attempt_at")
      .single();
    if (error || !invite) throw new Error(error?.message ?? "Could not create advisor invitation.");

    const delivery = await deliverInvite({
      invite: invite as InviteRecord,
      businessName: business.name,
      actorUserId: context.userId,
    });
    return { inviteId: invite.id, delivery };
  });

export const resendAdvisorInvite = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(resendSchema)
  .handler(async ({ data, context }) => {
    const { data: invite, error } = await supabaseAdmin
      .from("advisor_invites")
      .select("id, business_id, advisor_email, advisor_role, permission_level, status, invite_email_last_attempt_at")
      .eq("id", data.inviteId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invite) throw new Error("Advisor invitation not found.");

    const business = await verifyOwner(invite.business_id, context.userId, context.supabase);
    if (invite.status !== "pending") throw new Error("Only pending advisor invitations can be resent.");
    if (invite.invite_email_last_attempt_at) {
      const elapsed = Date.now() - new Date(invite.invite_email_last_attempt_at).getTime();
      if (elapsed < 60 * 60 * 1000) {
        throw new Error("This invitation was already sent or attempted within the last hour.");
      }
    }

    return deliverInvite({
      invite: invite as InviteRecord,
      businessName: business.name,
      actorUserId: context.userId,
    });
  });
