import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fmtCurrency } from "@/lib/format";
import type { MethodResult } from "@/lib/valuation";

export function MethodRangeBar({ low, mid, high }: { low: number; mid: number; high: number }) {
  if (!(high > low)) {
    return <div className="h-2 rounded-full bg-secondary" />;
  }
  const span = high - low;
  const midPct = Math.max(0, Math.min(100, ((mid - low) / span) * 100));
  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-gradient-to-r from-accent/30 via-accent to-gold">
        <div
          className="absolute -top-1 h-4 w-1 rounded-sm bg-primary shadow"
          style={{ left: `calc(${midPct}% - 2px)` }}
          aria-label="Median"
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{fmtCurrency(low, { compact: true })}</span>
        <span className="font-semibold text-foreground">Median {fmtCurrency(mid, { compact: true })}</span>
        <span>{fmtCurrency(high, { compact: true })}</span>
      </div>
    </div>
  );
}

export function MethodDetailDialog({
  method,
  open,
  onOpenChange,
}: {
  method: MethodResult | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!method) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>{method.label}</span>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                method.confidence === "high"
                  ? "bg-accent-soft text-accent"
                  : method.confidence === "medium"
                  ? "bg-gold/15 text-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {method.confidence} confidence
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">{method.notes}</DialogDescription>
        </DialogHeader>

        {method.available ? (
          <div className="space-y-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Estimated value range
              </div>
              <MethodRangeBar low={method.low} mid={method.value} high={method.high} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat label="Low" value={fmtCurrency(method.low, { compact: true })} />
              <Stat label="Median" value={fmtCurrency(method.value, { compact: true })} highlight />
              <Stat label="High" value={fmtCurrency(method.high, { compact: true })} />
            </div>

            {method.inputLabel && (
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs">
                <div className="text-muted-foreground">{method.inputLabel}</div>
                <div className="mt-0.5 font-semibold text-foreground tabular-nums">
                  {fmtCurrency(method.inputUsed ?? 0)}
                  {method.multipleUsed !== undefined && (
                    <span className="ml-2 text-muted-foreground font-normal">
                      × {method.multipleUsed.toFixed(2)} multiple
                    </span>
                  )}
                </div>
              </div>
            )}

            {method.formula && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Formula
                </div>
                <pre className="whitespace-pre-wrap rounded-lg border border-border bg-card p-3 text-xs font-mono text-foreground leading-relaxed">
                  {method.formula}
                </pre>
              </div>
            )}

            {method.reasoning && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Reasoning
                </div>
                <p className="text-sm leading-relaxed text-foreground">{method.reasoning}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {method.notes}
          </div>
        )}

        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
          Software-generated estimate for planning purposes only. Not a certified appraisal, tax advice, legal advice, or guaranteed sale price.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 text-center ${highlight ? "border-accent bg-accent-soft" : "border-border bg-secondary/40"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</div>
      <div className="mt-0.5 font-semibold text-foreground text-sm tabular-nums">{value}</div>
    </div>
  );
}
