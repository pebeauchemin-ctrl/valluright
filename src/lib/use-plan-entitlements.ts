import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  hasEntitlement,
  type BillingPlan,
  type BillingStatus,
  type Entitlement,
} from "@/lib/plan-entitlements";

type SubscriptionState = {
  plan: BillingPlan;
  status: BillingStatus;
  currentPeriodEnd: string | null;
  loading: boolean;
};

export function usePlanEntitlements() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: "free",
    status: "free",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        if (!cancelled) setSubscription({ plan: "free", status: "free", currentPeriodEnd: null, loading: false });
        return;
      }

      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setSubscription({
          plan: (data?.plan as BillingPlan | undefined) ?? "free",
          status: (data?.status as BillingStatus | undefined) ?? "free",
          currentPeriodEnd: data?.current_period_end ?? null,
          loading: false,
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return {
    ...subscription,
    has: (entitlement: Entitlement) =>
      hasEntitlement(
      subscription.plan,
      subscription.status,
      entitlement,
      subscription.currentPeriodEnd,
    ),
  };
}
