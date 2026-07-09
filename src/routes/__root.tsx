import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AuthProvider } from "@/lib/auth";
import { BusinessProvider } from "@/lib/business";
import { Toaster } from "@/components/ui/sonner";
import { recordPublicClientEvent } from "@/lib/observability.functions";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const recordEvent = useServerFn(recordPublicClientEvent);
  console.error(error);

  useEffect(() => {
    recordEvent({
      data: {
        eventName: "route_error",
        severity: "error",
        area: "routing",
        metadata: {
          path: typeof window !== "undefined" ? window.location.pathname : "unknown",
          error_name: error.name || "Error",
        },
      },
    }).catch(() => undefined);
  }, [error.name, recordEvent]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-3xl font-bold text-destructive">
          !
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected rendering issue occurred. Please try again.
        </p>
        {error.message && (
          <div className="mt-4 rounded-md bg-muted p-3 text-left text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Error detail: </span>
            {error.message.slice(0, 300)}
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ValuRight.ai — Know Your Value. Plan Your Exit. Live Your Freedom." },
      {
        name: "description",
        content:
          "Exit-readiness and business valuation software for owners preparing to retire or sell. Estimate a planning range, identify risks, and improve exit readiness.",
      },
      { name: "author", content: "ValuRight.ai" },
      {
        property: "og:title",
        content: "ValuRight.ai — Know Your Value. Plan Your Exit. Live Your Freedom.",
      },
      {
        property: "og:description",
        content:
          "Exit-readiness and business valuation software for owners preparing to retire or sell. Estimate a planning range, identify risks, and improve exit readiness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "ValuRight.ai — Know Your Value. Plan Your Exit. Live Your Freedom.",
      },
      {
        name: "twitter:description",
        content:
          "Exit-readiness and business valuation software for owners preparing to retire or sell. Estimate a planning range, identify risks, and improve exit readiness.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b39a52b5-670d-4abd-9568-36c258c4b902/id-preview-75396d10--0d57c900-6da7-4fcb-893e-afdbe8e9158c.lovable.app-1778810957571.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b39a52b5-670d-4abd-9568-36c258c4b902/id-preview-75396d10--0d57c900-6da7-4fcb-893e-afdbe8e9158c.lovable.app-1778810957571.png",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const recordEvent = useServerFn(recordPublicClientEvent);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      recordEvent({
        data: {
          eventName: "frontend_error",
          severity: "error",
          area: "frontend",
          metadata: {
            path: window.location.pathname,
            error_name: event.error instanceof Error ? event.error.name : "Error",
          },
        },
      }).catch(() => undefined);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      recordEvent({
        data: {
          eventName: "unhandled_rejection",
          severity: "error",
          area: "frontend",
          metadata: {
            path: window.location.pathname,
            error_name: event.reason instanceof Error ? event.reason.name : "PromiseRejection",
          },
        },
      }).catch(() => undefined);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [recordEvent]);

  return (
    <AuthProvider>
      <BusinessProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </BusinessProvider>
    </AuthProvider>
  );
}
