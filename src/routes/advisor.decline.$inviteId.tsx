import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/advisor/decline/$inviteId")({
  head: () => ({ meta: [{ title: "Decline advisor invitation — ValuRight.ai" }] }),
  component: DeclineAdvisorInvite,
});

function DeclineAdvisorInvite() {
  const { inviteId } = Route.useParams();
  const { user, loading } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const returnPath = `/advisor/decline/${inviteId}`;

  const decline = async () => {
    setDeclining(true);
    setMessage(null);
    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "decline_advisor_invite",
          args: { _invite_id: string },
        ) => Promise<{ data: unknown; error: Error | null }>;
      }
    ).rpc("decline_advisor_invite", { _invite_id: inviteId });
    setDeclining(false);
    setMessage(error ? error.message : "This invitation has been declined. You can close this page.");
  };

  return (
    <main className="min-h-screen bg-secondary/30 px-6 py-10">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="inline-flex">
          <BrandLogo size={32} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold text-primary">Decline invitation</h1>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Checking your sign-in…</p>
        ) : !user ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sign in with the email address that received this invitation to decline it.
            </p>
            <Link
              to="/auth"
              search={{ redirect: returnPath }}
              className="mt-6 inline-flex rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
            >
              Sign in
            </Link>
          </>
        ) : message ? (
          <div className="mt-5 rounded-md border border-border bg-secondary/40 p-4 text-sm text-foreground">
            {message}
          </div>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Declining removes this invitation. You will not receive access to the business review
              workspace unless the owner sends a new invitation.
            </p>
            <button
              type="button"
              onClick={decline}
              disabled={declining}
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60"
            >
              <ShieldAlert className="h-4 w-4" /> {declining ? "Declining…" : "Decline invitation"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
