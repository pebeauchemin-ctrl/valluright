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

type SecurityAuditInsert = {
  actor_user_id: string;
  business_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Json;
};

type SecurityAuditTable = {
  from: (table: "security_audit_events") => {
    insert: (payload: SecurityAuditInsert) => Promise<{ error: { message: string } | null }>;
  };
};

export async function recordSecurityAuditEvent(input: SecurityAuditInput) {
  const payload: SecurityAuditInsert = {
    actor_user_id: input.actorUserId,
    business_id: input.businessId ?? null,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  };

  const { error } = await (supabaseAdmin as unknown as SecurityAuditTable)
    .from("security_audit_events")
    .insert(payload);

  if (error) throw new Error(`Failed to record security audit event: ${error.message}`);
}
