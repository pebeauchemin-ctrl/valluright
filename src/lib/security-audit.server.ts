import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

type SecurityAuditInput = {
  actorUserId: string;
  action: string;
  businessId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Json;
};

export async function recordSecurityAuditEvent(input: SecurityAuditInput) {
  await supabaseAdmin.from("security_audit_events").insert({
    actor_user_id: input.actorUserId,
    business_id: input.businessId ?? null,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  });
}
