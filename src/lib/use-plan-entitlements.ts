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
        if (!cancelled) setSubscription({ plan: "free", status: "free", loading: false });
        return;
      }

      const { data } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setSubscription({
          plan: (data?.plan as BillingPlan | undefined) ?? "free",
          status: (data?.status as BillingStatus | undefined) ?? "free",
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
      hasEntitlement(subscription.plan, subscription.status, entitlement),
  };
}
