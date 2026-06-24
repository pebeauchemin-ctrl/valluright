import type { ReactNode } from "react";

type AccessibleChartProps = {
  title: string;
  summary: string;
  children: ReactNode;
  className?: string;
};

export function AccessibleChart({ title, summary, children, className }: AccessibleChartProps) {
  const titleId = `${slug(title)}-chart-title`;
  const summaryId = `${slug(title)}-chart-summary`;

  return (
    <figure
      role="img"
      aria-labelledby={titleId}
      aria-describedby={summaryId}
      tabIndex={0}
      className={className}
    >
      <figcaption id={titleId} className="sr-only">
        {title}
      </figcaption>
      <p id={summaryId} className="sr-only">
        {summary}
      </p>
      {children}
    </figure>
  );
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
