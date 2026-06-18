import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

export type ObservabilitySeverity = "info" | "warn" | "error" | "critical";

type ObservabilityInput = {
  actorUserId?: string | null;
  businessId?: string | null;
  eventName: string;
  severity?: ObservabilitySeverity;
  area: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

type ObservabilityInsert = {
  actor_user_id: string | null;
  business_id: string | null;
  event_name: string;
  severity: ObservabilitySeverity;
  area: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Json;
  alert_required: boolean;
};

type ObservabilityTable = {
  from: (table: "app_observability_events") => {
    insert: (payload: ObservabilityInsert) => Promise<{ error: { message: string } | null }>;
  };
};

const BLOCKED_METADATA_KEYS = [
  "access_token",
  "refresh_token",
  "token",
  "password",
  "email",
  "phone",
  "name",
  "message",
  "revenue",
  "net_income",
  "owner_salary",
  "addbacks",
  "assets",
  "liabilities",
  "debt",
  "valuation",
  "value",
];

function sanitizeMetadata(input: Record<string, unknown> | undefined): Json {
  if (!input) return {};
  const out: Record<string, Json> = {};

  for (const [key, value] of Object.entries(input)) {
    const normalizedKey = key.toLowerCase();
    if (BLOCKED_METADATA_KEYS.some((blocked) => normalizedKey.includes(blocked))) continue;

    if (typeof value === "string") {
      out[key] = value.slice(0, 160);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      out[key] = value;
    } else if (typeof value === "boolean" || value === null) {
      out[key] = value;
    } else if (Array.isArray(value)) {
      out[key] = value
        .filter((item) => ["string", "number", "boolean"].includes(typeof item))
        .slice(0, 20)
        .map((item) => (typeof item === "string" ? item.slice(0, 80) : item)) as Json;
    }
  }

  return out;
}

export async function recordObservabilityEvent(input: ObservabilityInput) {
  const severity = input.severity ?? "info";
  const payload: ObservabilityInsert = {
    actor_user_id: input.actorUserId ?? null,
    business_id: input.businessId ?? null,
    event_name: input.eventName,
    severity,
    area: input.area,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: sanitizeMetadata(input.metadata),
    alert_required: severity === "critical",
  };

  const { error } = await (supabaseAdmin as unknown as ObservabilityTable)
    .from("app_observability_events")
    .insert(payload);

  if (error) {
    console.error(`Failed to record observability event: ${error.message}`);
  }
}
