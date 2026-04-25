import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Mountain, LayoutDashboard, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Dashboard — ValuRight.ai" }] }),
  component: AppDashboard,
});

function AppDashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mountain className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold text-primary">valuright.ai</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
            <button
              onClick={() => { signOut(); navigate({ to: "/" }); }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-primary">Welcome to ValuRight.ai</h1>
          <p className="mt-2 max-w-lg mx-auto text-muted-foreground">
            Your foundation is ready. The full app — onboarding wizard, financials,
            valuation dashboard, scenarios, buyer teaser, advisor portal, and data room —
            comes online in the next build pass.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition"
            >
              <Sparkles className="h-4 w-4" /> See a sample valuation
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
