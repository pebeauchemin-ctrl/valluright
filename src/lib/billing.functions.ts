import { createServerFn } from "@tanstack/react-start";
import { withSupabaseAuth } from "@/lib/with-supabase-auth";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createCheckout, createPortal, createStripeCustomer, type BillingPlan } from "@/lib/stripe.server";

const paidPlans = new Set<BillingPlan>(["essentials", "exit-ready", "advisor-partner"]);
async function customerFor(userId: string, email?: string | null) {
  const { data } = await (supabaseAdmin as any).from("subscriptions").select("stripe_customer_id").eq("user_id", userId).maybeSingle();
  if (data?.stripe_customer_id) return data.stripe_customer_id;
  const stripeCustomerId = await createStripeCustomer(userId, email);
  const { error } = await (supabaseAdmin as any).from("subscriptions").upsert({ user_id: userId, stripe_customer_id: stripeCustomerId, plan: "free", status: "free" }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  return stripeCustomerId;
}
export const startStripeCheckout = createServerFn({ method: "POST" }).middleware([withSupabaseAuth, requireSupabaseAuth]).inputValidator((data: { plan: BillingPlan }) => data).handler(async ({ data, context }) => {
  if (!paidPlans.has(data.plan)) throw new Error("Choose a paid plan.");
  const customer = await customerFor(context.userId, String(context.claims.email || ""));
  const origin = process.env.APP_URL || "https://valuright.ai";
  return { url: await createCheckout(customer, context.userId, data.plan, `${origin}/app/settings?billing=success`, `${origin}/pricing?billing=cancelled`) };
});
export const openStripeBillingPortal = createServerFn({ method: "POST" }).middleware([withSupabaseAuth, requireSupabaseAuth]).handler(async ({ context }) => {
  const customer = await customerFor(context.userId, String(context.claims.email || ""));
  return { url: await createPortal(customer, `${process.env.APP_URL || "https://valuright.ai"}/app/settings`) };
});
