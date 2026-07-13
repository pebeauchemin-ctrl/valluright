import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/advisor/accept/$inviteId")({
  head: () => ({ meta: [{ title: "Accept advisor invitation — ValuRight.ai" }] }),
  component: AcceptAdvisorInvite,
});

function AcceptAdvisorInvite() {
  const { inviteId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const accept = async () => {
    setAccepting(true);
    setMessage(null);
    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "accept_advisor_invite",
          args: { _invite_id: string },
        ) => Promise<{ data: unknown; error: Error | null }>;
      }
    ).rpc("accept_advisor_invite", { _invite_id: inviteId });
    setAccepting(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    navigate({ to: "/advisor" });
  };

  useEffect(() => {
    if (user) accept().catch(() => undefined);
    // The invitation is accepted immediately after a matching account signs in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const returnPath = `/advisor/accept/${inviteId}`;

  return (
    <main className="min-h-screen bg-secondary/30 px-6 py-10">
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="inline-flex">
          <BrandLogo size={32} />
        </Link>
        <h1 className="mt-8 font-display text-3xl font-semibold text-primary">
          Advisor invitation
        </h1>
        {loading ? (
          <p className="mt-3 text-sm text-muted-foreground">Checking your sign-in…</p>
        ) : !user ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Sign in or create an account using the email address that received this invitation.
              Your access will be connected automatically.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ redirect: returnPath }}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup", redirect: returnPath }}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                Create account
              </Link>
            </div>
          </>
        ) : accepting ? (
          <p className="mt-3 text-sm text-muted-foreground">Connecting your advisor access…</p>
        ) : message ? (
          <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <ShieldAlert className="mb-2 h-5 w-5" />
            {message}
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-accent/30 bg-accent-soft p-4 text-sm text-foreground">
            <CheckCircle2 className="mb-2 h-5 w-5 text-accent" />
            Advisor access is ready. Opening your review workspace…
          </div>
        )}
      </div>
    </main>
  );
}
