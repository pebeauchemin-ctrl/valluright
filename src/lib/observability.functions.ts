import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { withSupabaseAuth } from "@/lib/with-supabase-auth";
import { recordObservabilityEvent } from "@/lib/observability.server";
import type { SupabaseClient } from "@supabase/supabase-js";

const severitySchema = z.enum(["info", "warn", "error", "critical"]);
const metadataSchema = z.record(z.string(), z.unknown()).optional();

const authenticatedEventSchema = z.object({
  eventName: z.string().min(2).max(80),
  severity: severitySchema.default("info"),
  area: z.string().min(2).max(40),
  businessId: z.string().uuid().nullable().optional(),
  targetType: z.string().max(80).nullable().optional(),
  targetId: z.string().max(120).nullable().optional(),
  metadata: metadataSchema,
});

const publicEventSchema = z.object({
  eventName: z.enum(["signup_completed", "frontend_error", "unhandled_rejection", "route_error"]),
  severity: severitySchema.default("info"),
  area: z.enum(["auth", "frontend", "routing"]),
  metadata: metadataSchema,
});

export const recordProductEvent = createServerFn({ method: "POST" })
  .middleware([withSupabaseAuth, requireSupabaseAuth])
  .inputValidator(authenticatedEventSchema)
  .handler(async ({ data, context }) => {
    const ownedBusinessId = data.businessId
      ? await resolveOwnedBusinessId({
          businessId: data.businessId,
          userId: context.userId,
          supabase: context.supabase,
        })
      : null;

    await recordObservabilityEvent({
      actorUserId: context.userId,
      businessId: ownedBusinessId,
      eventName: data.eventName,
      severity: data.severity,
      area: data.area,
      targetType: data.targetType ?? null,
      targetId: data.targetId ?? null,
      metadata: data.metadata,
    });
    return { ok: true };
  });

async function resolveOwnedBusinessId({
  businessId,
  userId,
  supabase,
}: {
  businessId: string;
  userId: string;
  supabase: SupabaseClient<Database>;
}) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}

export const recordPublicClientEvent = createServerFn({ method: "POST" })
  .inputValidator(publicEventSchema)
  .handler(async ({ data }) => {
    await recordObservabilityEvent({
      eventName: data.eventName,
      severity: data.severity,
      area: data.area,
      metadata: data.metadata,
    });
    return { ok: true };
  });
