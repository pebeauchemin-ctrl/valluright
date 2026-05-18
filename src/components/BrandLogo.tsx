import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Show the wordmark "valuright.ai" next to the mark */
  withWordmark?: boolean;
  /** Show the "SMB EXIT GUIDE" tagline under the wordmark */
  withTagline?: boolean;
  /** Force a monochrome variant useful on dark sidebar surfaces */
  variant?: "color" | "onDark" | "mono";
  size?: number;
};

/**
 * ValuRight.ai brand mark — mountain horizon with sunrise, winding road,
 * and an "EXIT" highway sign. Built as inline SVG so it scales crisply and
 * adopts theme colors via currentColor / CSS custom properties.
 */
export function BrandLogo({
  className,
  withWordmark = true,
  withTagline = false,
  variant = "color",
  size = 36,
}: Props) {
  const navy = variant === "onDark" ? "currentColor" : variant === "mono" ? "currentColor" : "oklch(0.21 0.06 247)";
  const green = variant === "mono" ? "currentColor" : "oklch(0.45 0.1 158)";
  const gold = variant === "mono" ? "currentColor" : "oklch(0.81 0.15 80)";
  const road = variant === "mono" ? "currentColor" : "oklch(0.99 0.003 250)";
  const wordmarkColor = variant === "onDark" ? "text-primary-foreground" : "text-primary";
  const dotColor = variant === "onDark" ? "text-accent" : "text-accent";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark size={size} navy={navy} green={green} gold={gold} road={road} />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className={cn("font-display font-semibold tracking-tight", wordmarkColor)} style={{ fontSize: size * 0.5 }}>
            valuright<span className={dotColor}>.ai</span>
          </span>
          {withTagline && (
            <span
              className="font-display font-medium uppercase tracking-[0.22em] text-accent mt-1"
              style={{ fontSize: Math.max(8, size * 0.22) }}
            >
              SMB Exit Guide
            </span>
          )}
        </span>
      )}
    </span>
  );
}

function Mark({ size, navy, green, gold, road }: { size: number; navy: string; green: string; gold: string; road: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ValuRight.ai"
    >
      {/* Arched horizon backdrop */}
      <path d="M4 36a28 28 0 0 1 56 0v22a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V36z" fill={navy} />
      {/* Sun */}
      <circle cx="32" cy="30" r="7" fill={gold} />
      {/* Sun rays */}
      <g stroke={gold} strokeWidth="1.6" strokeLinecap="round">
        <line x1="32" y1="17" x2="32" y2="13" />
        <line x1="22.5" y1="20.5" x2="20" y2="18" />
        <line x1="41.5" y1="20.5" x2="44" y2="18" />
        <line x1="19" y1="30" x2="15.5" y2="30" />
        <line x1="45" y1="30" x2="48.5" y2="30" />
      </g>
      {/* Mountain range (back) */}
      <path d="M8 48 L22 28 L32 40 L44 24 L56 48 Z" fill={green} opacity="0.55" />
      {/* Mountain range (front) */}
      <path d="M4 52 L18 34 L28 44 L40 30 L52 46 L60 38 L60 52 Z" fill={green} />
      {/* Winding road */}
      <path
        d="M14 60 C 22 54, 26 50, 30 46 C 34 42, 36 40, 42 40 C 48 40, 50 46, 50 60"
        stroke={road}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Exit sign post + plate */}
      <rect x="48.5" y="40" width="1.2" height="14" fill={road} opacity="0.85" />
      <rect x="44" y="34" width="14" height="9" rx="1.2" fill={green} stroke={road} strokeWidth="0.8" />
      <path d="M53 36.2 L56 39 L53 41.8 M46 39 H56" stroke={road} strokeWidth="0.9" strokeLinecap="round" fill="none" />
    </svg>
  );
}
