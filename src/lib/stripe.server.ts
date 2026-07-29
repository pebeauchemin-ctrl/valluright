export type BillingPlan =
  | "free"
  | "essentials"
  | "exit-ready"
  | "one-time-report";

const priceEnv: Partial<Record<BillingPlan, string>> = {
  essentials: "STRIPE_PRICE_ESSENTIALS",
  "exit-ready": "STRIPE_PRICE_EXIT_READY",
  "one-time-report": "STRIPE_PRICE_ONE_TIME_REPORT",
};

export function planFromStripePrice(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) return null;

  for (const [plan, environmentName] of Object.entries(priceEnv) as Array<
    [BillingPlan, string]
  >) {
    if (process.env[environmentName] === priceId) return plan;
  }

  // Advisor Partner is retired. Map its historic price to Exit Ready so an old
  // subscription webhook cannot downgrade a customer to the free tier.
  if (process.env.STRIPE_PRICE_ADVISOR_PARTNER === priceId) return "exit-ready";
  return null;
}

function key() {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw new Error("Stripe is not configured yet.");
  return value;
}

async function stripe(path: string, body: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    id?: string;
    url?: string;
  };
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed.");
  return data;
}

export async function getStripeSubscription(subscriptionId: string) {
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${key()}` },
  });
  const data = (await response.json()) as {
    error?: { message?: string };
    status?: string;
    cancel_at_period_end?: boolean;
    current_period_end?: number;
    items?: {
      data?: Array<{
        billed_until?: number;
        current_period_end?: number;
        price?: { id?: string } | string;
      }>;
    };
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
  // One-time Report is no longer offered. Keeping this guard prevents a future
  // caller from accidentally granting an indefinite paid entitlement.
  if (plan === "one-time-report") {
    throw new Error("One-time Report purchases are not currently available.");
  }

  const env = priceEnv[plan];
  const price = env ? process.env[env] : undefined;
  if (!price) throw new Error("This Stripe price is not configured yet.");
  const body = new URLSearchParams({
    customer,
    success_url: successUrl,
    cancel_url: cancelUrl,
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    "metadata[plan]": plan,
    "metadata[supabase_user_id]": userId,
    mode: "subscription",
  });
  body.set("subscription_data[metadata][plan]", plan);
  body.set("subscription_data[metadata][supabase_user_id]", userId);
  const data = await stripe("checkout/sessions", body);
  if (!data.url) throw new Error("Stripe did not return a checkout page.");
  return data.url;
}

export async function createPortal(customer: string, returnUrl: string) {
  const data = await stripe(
    "billing_portal/sessions",
    new URLSearchParams({ customer, return_url: returnUrl }),
  );
  if (!data.url) throw new Error("Stripe did not return the billing portal.");
  return data.url;
}
