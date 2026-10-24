import {
  ENTITY,
  FOOTER_GUIDE_LINKS,
  FOOTER_INDUSTRY_LINKS,
  FOOTER_SITE_LINKS,
  INDUSTRY_WORTH_LINKS,
  RELATED_GUIDE_LINKS,
  type SiteLink,
} from "@/lib/site-entity";

/** "Related guides" + "By industry" internal-link block. Shows every link except `current`. */
export function RelatedLinksBlock({
  current,
  exclude = [],
}: {
  current: string;
  /** Extra hrefs to hide on this page (e.g. sibling pages not yet cross-linked). */
  exclude?: string[];
}) {
  const hidden = (href: string) => href === current || exclude.includes(href);
  const guides = RELATED_GUIDE_LINKS.filter((l) => !hidden(l.href));
  const industries = INDUSTRY_WORTH_LINKS.filter((l) => !hidden(l.href));
  return (
    <section aria-label="Related guides" className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto grid max-w-4xl gap-8 px-6 py-10 md:grid-cols-2">
        <LinkList title="Related guides" links={guides} />
        <LinkList title="What is my business worth? By industry" links={industries} />
      </div>
    </section>
  );
}

function LinkList({ title, links }: { title: string; links: SiteLink[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} className="font-semibold text-accent hover:underline">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Entity line shown in every marketing footer (legal disclaimer stays below it). */
export function FooterEntityLine({ className }: { className?: string }) {
  return (
    <p className={className ?? "mt-3 text-sm text-primary-foreground/70 max-w-md"}>{ENTITY}</p>
  );
}

/** Footer link rows: 6 guides, Methodology, What's my business worth?, 3 vertical pages. */
export function FooterSeoLinks() {
  const row = (links: SiteLink[]) => (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {links.map((l) => (
        <a key={l.href} href={l.href} className="hover:text-primary-foreground">
          {l.label}
        </a>
      ))}
    </div>
  );
  return (
    <div className="mt-3 space-y-2 text-xs text-primary-foreground/60">
      {row(FOOTER_SITE_LINKS)}
      {row(FOOTER_GUIDE_LINKS)}
      {row(FOOTER_INDUSTRY_LINKS)}
    </div>
  );
}
