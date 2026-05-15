import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Mountain, LayoutDashboard, FileSpreadsheet, Sparkles, Sliders, Eye,
  Folder, Users, Settings as SettingsIcon, LogOut, ChevronDown, Plus,
  Activity, TrendingUp, Map, FileText,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Dashboard — ValuRight.ai" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { businesses, current, setCurrent, loading: bizLoading } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // If onboarding isn't complete, force the user back to /app/onboarding
    // from any other /app/* page. Skip the onboarding route itself.
    if (
      !authLoading &&
      !bizLoading &&
      user &&
      businesses.length === 0 &&
      location.pathname !== "/app/onboarding"
    ) {
      navigate({ to: "/app/onboarding" });
    }
  }, [authLoading, bizLoading, user, businesses, location.pathname, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

    const navItems: ReadonlyArray<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
      { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/app/financials", label: "Financials", icon: FileSpreadsheet },
      { to: "/app/health-score", label: "Health Score", icon: Activity },
      { to: "/app/improve-value", label: "Improve Value", icon: TrendingUp },
      { to: "/app/recommendations", label: "Recommendations", icon: Sparkles },
      { to: "/app/scenarios", label: "What-if Scenarios", icon: Sliders },
      { to: "/app/roadmap", label: "Roadmap", icon: Map },
      { to: "/app/buyer-teaser", label: "Buyer Teaser", icon: Eye },
      { to: "/app/data-room", label: "Data Room", icon: Folder },
      { to: "/app/advisors", label: "Advisors", icon: Users },
      { to: "/app/settings", label: "Settings", icon: SettingsIcon },
    ];

  return (
    <div className="min-h-screen flex bg-secondary/40">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Mountain className="h-4 w-4" />
          </div>
          <span className="font-display font-semibold">valuright.ai</span>
        </Link>

        {/* Business switcher */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          {businesses.length > 0 && current ? (
            <div className="relative group">
              <button className="w-full flex items-center justify-between gap-2 rounded-md bg-sidebar-accent px-3 py-2 text-sm text-left hover:bg-sidebar-accent/80 transition">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Business</div>
                  <div className="font-medium truncate">{current.name}</div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
              </button>
              {businesses.length > 1 && (
                <div className="absolute z-20 left-0 right-0 mt-1 hidden group-hover:block group-focus-within:block">
                  <div className="rounded-md bg-sidebar-accent border border-sidebar-border shadow-lg overflow-hidden">
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => setCurrent(b)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-sidebar/40 ${b.id === current.id ? "bg-sidebar/30" : ""}`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/app/onboarding"
              className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition"
            >
              <Plus className="h-4 w-4" /> Add your business
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60 px-3 mb-2 truncate">{user.email}</div>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
