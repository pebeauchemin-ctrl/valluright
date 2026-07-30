import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";

type UnsubscribeSearch = { token?: string };

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Email preferences - ValuRight.ai" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): UnsubscribeSearch => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"working" | "complete" | "invalid">("working");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const unsubscribe = async () => {
      const { data, error } = await (
        supabase as unknown as {
          rpc: (
            fn: "unsubscribe_from_marketing",
            args: { _token: string },
          ) => Promise<{ data: boolean | null; error: Error | null }>;
        }
      ).rpc("unsubscribe_from_marketing", { _token: token });

      setStatus(!error && data ? "complete" : "invalid");
    };

    void unsubscribe();
  }, [token]);

  return (
    <main className="min-h-screen bg-secondary/30 px-6 py-12">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="inline-flex">
          <BrandLogo size={36} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold text-primary">
          {status === "working"
            ? "Updating your email preference"
            : status === "complete"
              ? "You have been unsubscribed"
              : "This link is not valid"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {status === "working"
            ? "Please wait a moment."
            : status === "complete"
              ? "You will no longer receive ValuRight marketing emails. Account, security, billing, and other service emails are not affected."
              : "This unsubscribe link may be incomplete or expired. You can also change marketing preferences after signing in."}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Return to ValuRight
        </Link>
      </div>
    </main>
  );
}
