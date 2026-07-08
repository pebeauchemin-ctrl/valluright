import { useId, type ReactNode } from "react";

type AccessibleChartProps = {
  title: string;
  summary: string;
  children: ReactNode;
  className?: string;
};

export function AccessibleChart({ title, summary, children, className }: AccessibleChartProps) {
  const chartId = useId();
  const titleId = `${chartId}-chart-title`;
  const summaryId = `${chartId}-chart-summary`;

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
