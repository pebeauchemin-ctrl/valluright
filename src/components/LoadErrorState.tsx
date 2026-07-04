import { AlertTriangle, RefreshCw } from "lucide-react";

export function errorMessage(error: unknown, fallback = "Could not load this page.") {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  if (typeof error === "string" && error) return error;
  return fallback;
}

type LoadErrorStateProps = {
  title?: string;
  message?: string;
  onRetry: () => void;
  className?: string;
};

export function LoadErrorState({
  title = "Could not load data",
  message = "Something went wrong while loading this page.",
  onRetry,
  className = "p-12",
}: LoadErrorStateProps) {
  return (
    <div className={className}>
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-xl font-semibold text-primary">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    </div>
  );
}
