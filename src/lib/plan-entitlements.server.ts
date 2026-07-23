import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  hasEntitlement,
  type BillingPlan,
  type BillingStatus,
  type Entitlement,
} from "@/lib/plan-entitlements";

export async function requireBusinessEntitlement({
  supabase,
  userId,
  businessId,
  entitlement,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  businessId: string;
  entitlement: Entitlement;
}) {
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (businessError) throw new Error(businessError.message);
  if (!business) throw new Error("Only the business owner can use this feature.");

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (subscriptionError) throw new Error(subscriptionError.message);

  const plan = (subscription?.plan as BillingPlan | undefined) ?? "free";
  const status = (subscription?.status as BillingStatus | undefined) ?? "free";

  if (!hasEntitlement(plan, status, entitlement)) {
    throw new Error("This feature requires an active Exit Ready or Advisor Partner plan.");
  }
}
