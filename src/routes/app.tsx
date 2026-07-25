import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Sparkles,
  Sliders,
  Eye,
  Handshake,
  Folder,
  Users,
  Settings as SettingsIcon,
  LogOut,
  ChevronDown,
  Plus,
  Activity,
  TrendingUp,
  Map,
  FileText,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Dashboard — ValuRight.ai" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { businesses, current, setCurrent, loading: bizLoading } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const [hasAdvisorAccess, setHasAdvisorAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setHasAdvisorAccess(false);
      return;
    }

    setHasAdvisorAccess(null);
    supabase
      .from("advisor_invites")
      .select("id")
      .eq("advisor_id", user.id)
      .eq("status", "accepted")
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) setHasAdvisorAccess(Boolean(data?.length));
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (
      !authLoading &&
      !bizLoading &&
      hasAdvisorAccess &&
      businesses.length === 0 &&
      location.pathname.startsWith("/app")
    ) {
      navigate({ to: "/advisor" });
      return;
    }

    // Require a business before business-specific pages, while keeping Settings
    // available so new customers can review their subscription before onboarding.
    if (
      !authLoading &&
      !bizLoading &&
      user &&
      hasAdvisorAccess === false &&
      businesses.length === 0 &&
      location.pathname.startsWith("/app") &&
      location.pathname !== "/app/onboarding" &&
      location.pathname !== "/app/settings"
    ) {
      navigate({ to: "/app/onboarding" });
    }
  }, [
    authLoading,
    bizLoading,
    user,
    businesses,
    hasAdvisorAccess,
    location.pathname,
    navigate,
  ]);

  if (authLoading || !user || hasAdvisorAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const navItems: Array<{
    to: string;
    label: string;
    icon: typeof LayoutDashboard;
    exact?: boolean;
  }> = [
    { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/app/financials", label: "Financials", icon: FileSpreadsheet },
    { to: "/app/health-score", label: "Health Score", icon: Activity },
    { to: "/app/improve-value", label: "Improve Value", icon: TrendingUp },
    { to: "/app/recommendations", label: "Recommendations", icon: Sparkles },
    { to: "/app/scenarios", label: "What-if Scenarios", icon: Sliders },
    { to: "/app/roadmap", label: "Roadmap", icon: Map },
    { to: "/app/buyer-teaser", label: "Buyer Teaser", icon: Eye },
    { to: "/app/buyer-requests", label: "Buyer Leads", icon: Handshake },
    { to: "/app/data-room", label: "Data Room", icon: Folder },
    { to: "/app/reports", label: "Reports", icon: FileText },
    { to: "/app/advisors", label: "Advisors", icon: Users },
    { to: "/app/settings", label: "Settings", icon: SettingsIcon },
  ];

  if (hasAdvisorAccess) {
    navItems.push({ to: "/advisor", label: "Advisor workspace", icon: Users });
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary/40 lg:flex-row">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Sidebar */}
      <aside className="w-full shrink-0 bg-sidebar text-sidebar-foreground flex flex-col lg:w-64">
        <Link
          to="/"
          className="flex items-center px-4 py-4 border-b border-sidebar-border lg:px-5 lg:py-5"
        >
          <BrandLogo size={32} variant="onDark" />
        </Link>

        {/* Business switcher */}
        <div className="px-3 py-3 border-b border-sidebar-border">
          {businesses.length > 0 && current ? (
            <div
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setBusinessMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                aria-label={`Current business: ${current.name}. Switch business`}
                aria-haspopup="menu"
                aria-expanded={businessMenuOpen}
                onClick={() => setBusinessMenuOpen((open) => !open)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setBusinessMenuOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 rounded-md bg-sidebar-accent px-3 py-2 text-sm text-left hover:bg-sidebar-accent/80 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">
                    Business
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{current.name}</div>
                    {current.is_sample && (
                      <span className="shrink-0 rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground">
                        Sample
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
              </button>
              {businesses.length > 1 && businessMenuOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1">
                  <div
                    role="menu"
                    aria-label="Switch business"
                    className="rounded-md bg-sidebar-accent border border-sidebar-border shadow-lg overflow-hidden"
                  >
                    {businesses.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        role="menuitem"
                        aria-current={b.id === current.id ? "true" : undefined}
                        onClick={() => {
                          setCurrent(b);
                          setBusinessMenuOpen(false);
                        }}
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
        <nav
          aria-label="Application sections"
          className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:space-y-0.5 lg:overflow-visible"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm transition lg:shrink ${
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

        <div className="px-3 py-3 border-t border-sidebar-border lg:block">
          <div className="text-xs text-sidebar-foreground/60 px-3 mb-2 truncate">{user.email}</div>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate({ to: "/" });
            }}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main id="main-content" className="flex-1 min-w-0 overflow-x-hidden" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
