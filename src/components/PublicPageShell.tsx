import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  children: React.ReactNode;
};

export function PublicPageShell({
  eyebrow,
  title,
  description,
  updated,
  children,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo size={40} withTagline />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/pricing" search={{ checkout: undefined }} className="hover:text-foreground transition">
              Pricing
            </Link>
            <Link to="/security" className="hover:text-foreground transition">
              Security
            </Link>
            <Link to="/methodology" className="hover:text-foreground transition">
              Methodology
            </Link>
            <Link to="/demo" className="hover:text-foreground transition">
              Demo
            </Link>
          </nav>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition hover:bg-accent/90"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-border/60 bg-secondary/40">
          <div className="mx-auto max-w-4xl px-6 py-14">
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">{eyebrow}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-primary md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
            {updated && (
              <p className="mt-4 text-xs font-medium text-muted-foreground">
                Last updated: {updated}
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-12">{children}</section>
      </main>

      <footer className="border-t border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <BrandLogo size={34} variant="onDark" />
          <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/70">
            <Link to="/privacy" className="hover:text-primary-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-primary-foreground">
              Terms
            </Link>
            <Link to="/security" className="hover:text-primary-foreground">
              Security
            </Link>
            <Link to="/methodology" className="hover:text-primary-foreground">
              Methodology
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border/60 py-7 last:border-0">
      <h2 className="font-display text-xl font-semibold text-primary">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
