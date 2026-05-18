import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { BusinessProvider } from "@/lib/business";
import { Toaster } from "@/components/ui/sonner";

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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ValuRight.ai — Know Your Value. Plan Your Exit. Live Your Freedom." },
      { name: "description", content: "Exit-readiness and business valuation software for owners preparing to retire or sell. Estimate value, identify risks, and grow what your business is worth." },
      { name: "author", content: "ValuRight.ai" },
      { property: "og:title", content: "ValuRight.ai — Know Your Value. Plan Your Exit. Live Your Freedom." },
      { property: "og:description", content: "Exit-readiness and business valuation software for owners preparing to retire or sell. Estimate value, identify risks, and grow what your business is worth." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ValuRight.ai — Know Your Value. Plan Your Exit. Live Your Freedom." },
      { name: "twitter:description", content: "Exit-readiness and business valuation software for owners preparing to retire or sell. Estimate value, identify risks, and grow what your business is worth." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b39a52b5-670d-4abd-9568-36c258c4b902/id-preview-75396d10--0d57c900-6da7-4fcb-893e-afdbe8e9158c.lovable.app-1778810957571.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b39a52b5-670d-4abd-9568-36c258c4b902/id-preview-75396d10--0d57c900-6da7-4fcb-893e-afdbe8e9158c.lovable.app-1778810957571.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
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
  return (
    <AuthProvider>
      <BusinessProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </BusinessProvider>
    </AuthProvider>
  );
}
