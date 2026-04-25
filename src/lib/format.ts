// Currency / number formatting
export function fmtCurrency(n: number | null | undefined, opts?: { compact?: boolean }) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  if (opts?.compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtRange(low: number | null | undefined, high: number | null | undefined) {
  return `${fmtCurrency(low, { compact: true })} – ${fmtCurrency(high, { compact: true })}`;
}

export function fmtPct(n: number | null | undefined, digits = 0) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function fmtNumber(n: number | null | undefined) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US").format(n);
}
