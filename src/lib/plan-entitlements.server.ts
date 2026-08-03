import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  hasEntitlement,
  type BillingPlan,
  type BillingStatus,
  type Entitlement,
} from "@/lib/plan-entitlements";

const planRequirement: Partial<Record<Entitlement, string>> = {
  accounting_import: "Essentials or Exit Ready",
  buyer_teaser_public: "Exit Ready",
  data_room: "Exit Ready",
  advisor_review: "Exit Ready",
};

async function subscriptionHasEntitlement(
  supabase: SupabaseClient<Database>,
  userId: string,
  entitlement: Entitlement,
) {
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return hasEntitlement(
    (subscription?.plan as BillingPlan | undefined) ?? "free",
    (subscription?.status as BillingStatus | undefined) ?? "free",
    entitlement,
    subscription?.current_period_end,
  );
}

function entitlementError(entitlement: Entitlement) {
  const plan = planRequirement[entitlement] ?? "a paid";
  return new Error(`This feature requires an active ${plan} plan.`);
}

export async function requireUserEntitlement({
  supabase,
  userId,
  entitlement,
}: {
  supabase: SupabaseClient<Database>;
  userId: string;
  entitlement: Entitlement;
}) {
  if (!(await subscriptionHasEntitlement(supabase, userId, entitlement))) {
    throw entitlementError(entitlement);
  }
}

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

  if (!(await subscriptionHasEntitlement(supabase, userId, entitlement))) {
    throw entitlementError(entitlement);
  }
}
