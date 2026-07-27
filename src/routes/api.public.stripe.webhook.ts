import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getStripeSubscription,
  planFromStripePrice,
  type BillingPlan,
} from "@/lib/stripe.server";

type StripeEvent = { id: string; type: string; data: { object: Record<string, unknown> } };

function knownPlan(value: unknown): BillingPlan | null {
  return ["essentials", "exit-ready", "advisor-partner", "one-time-report"].includes(String(value))
    ? (String(value) as BillingPlan)
    : null;
}

function constantTimeEqual(left: string, right: string) {
  let difference = left.length ^ right.length;
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}

async function validSignature(body: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const timestamp = signature.match(/t=(\d+)/)?.[1];
  const expected = signature.match(/v1=([a-f0-9]+)/)?.[1];
  if (!timestamp || !expected || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return false;
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        new TextEncoder().encode(`${timestamp}.${body}`),
      ),
    ),
  )
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return constantTimeEqual(hash, expected);
}

export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!(await validSignature(raw, request.headers.get("stripe-signature")))) {
          return new Response("Invalid signature", { status: 400 });
        }

        const event = JSON.parse(raw) as StripeEvent;
        const inserted = await (supabaseAdmin as any)
          .from("billing_webhook_events")
          .insert({ stripe_event_id: event.id, event_type: event.type });

        // Reprocess duplicate deliveries safely. Older deployments could mark an event
        // complete before its subscription update succeeded, so a resend must repair it.
        if (inserted.error && inserted.error.code !== "23505") {
          return new Response("Webhook storage error", { status: 500 });
        }

        const object = event.data.object;
        const metadata = (object.metadata as Record<string, string> | undefined) ?? {};
        const customer = String(object.customer || "");
        const subscription = event.type.startsWith("customer.subscription")
          ? String(object.id || "")
          : String(object.subscription || "");
        const userId = metadata.supabase_user_id;
        const values: Record<string, unknown> = {
          stripe_customer_id: customer || null,
          status: event.type === "customer.subscription.deleted" ? "canceled" : String(object.status || "active"),
        };

        const eventPlan = knownPlan(metadata.plan);
        if (eventPlan) values.plan = eventPlan;
        if (subscription) values.stripe_subscription_id = subscription;

        if (subscription) {
          const stripeSubscription = await getStripeSubscription(subscription);
          values.status = stripeSubscription.status || "active";
          values.cancel_at_period_end = Boolean(stripeSubscription.cancel_at_period_end);

          const item = stripeSubscription.items?.data?.[0];
          const currentPeriodEnd =
            stripeSubscription.current_period_end ??
            item?.current_period_end ??
            item?.billed_until;
          values.current_period_end = currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null;

          // Stripe Customer Portal changes the subscription price, not its metadata.
          // The price is authoritative for every recurring plan; metadata only supports
          // older checkout sessions and legacy subscriptions.
          const priceId = typeof item?.price === "string" ? item.price : item?.price?.id;
          const pricePlan = planFromStripePrice(priceId);
          if (pricePlan) values.plan = pricePlan;
        } else if (event.type.startsWith("customer.subscription")) {
          values.cancel_at_period_end = Boolean(object.cancel_at_period_end);
          values.current_period_end = object.current_period_end
            ? new Date(Number(object.current_period_end) * 1000).toISOString()
            : null;
        }

        const subscriptionWrite = userId
          ? await (supabaseAdmin as any)
              .from("subscriptions")
              .upsert({ user_id: userId, ...values }, { onConflict: "user_id" })
          : customer
            ? await (supabaseAdmin as any)
                .from("subscriptions")
                .update(values)
                .eq("stripe_customer_id", customer)
            : { error: null };

        if (subscriptionWrite.error) {
          await (supabaseAdmin as any)
            .from("billing_webhook_events")
            .update({ error_message: subscriptionWrite.error.message })
            .eq("stripe_event_id", event.id);
          return new Response("Subscription update error", { status: 500 });
        }

        const completed = await (supabaseAdmin as any)
          .from("billing_webhook_events")
          .update({ processed_at: new Date().toISOString() })
          .eq("stripe_event_id", event.id);
        if (completed.error) return new Response("Webhook completion error", { status: 500 });

        return new Response("ok", { status: 200 });
      },
    },
  },
});
