export type BillingPlan = "free" | "essentials" | "exit-ready" | "advisor-partner" | "one-time-report";

const priceEnv: Partial<Record<BillingPlan, string>> = {
  essentials: "STRIPE_PRICE_ESSENTIALS",
  "exit-ready": "STRIPE_PRICE_EXIT_READY",
  "advisor-partner": "STRIPE_PRICE_ADVISOR_PARTNER",
  "one-time-report": "STRIPE_PRICE_ONE_TIME_REPORT",
};

function key() {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw new Error("Stripe is not configured yet.");
  return value;
}

async function stripe(path: string, body: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  const data = await response.json() as { error?: { message?: string }; id?: string; url?: string };
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed.");
  return data;
}

export async function getStripeSubscription(subscriptionId: string) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  const data = await response.json() as {
    error?: { message?: string };
    status?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: number;
  };
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed.");
  return data;
}

export async function createStripeCustomer(userId: string, email?: string | null) {
  const body = new URLSearchParams({ "metadata[supabase_user_id]": userId });
  if (email) body.set("email", email);
  const data = await stripe("customers", body);
  if (!data.id) throw new Error("Stripe did not return a customer.");
  return data.id;
}

export async function createCheckout(
  customer: string,
  userId: string,
  plan: BillingPlan,
  successUrl: string,
  cancelUrl: string,
) {
  const env = priceEnv[plan]; const price = env ? process.env[env] : undefined;
  if (!price) throw new Error("This Stripe price is not configured yet.");
  const body = new URLSearchParams({
    customer,
    success_url: successUrl,
    cancel_url: cancelUrl,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "metadata[plan]": plan,
    "metadata[supabase_user_id]": userId,
    mode: plan === "one-time-report" ? "payment" : "subscription",
  });
  if (plan !== "one-time-report") {
    body.set("subscription_data[metadata][plan]", plan);
    body.set("subscription_data[metadata][supabase_user_id]", userId);
  }
  const data = await stripe("checkout/sessions", body);
  if (!data.url) throw new Error("Stripe did not return a checkout page.");
  return data.url;
}

export async function createPortal(customer: string, returnUrl: string) {
  const data = await stripe("billing_portal/sessions", new URLSearchParams({ customer, return_url: returnUrl }));
  if (!data.url) throw new Error("Stripe did not return the billing portal.");
  return data.url;
}
