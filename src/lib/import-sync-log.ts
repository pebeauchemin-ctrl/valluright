import type { Database } from "@/integrations/supabase/types";

export type ImportSyncLogRow = Database["public"]["Tables"]["import_sync_logs"]["Row"];
export type ImportSyncSource = "xero" | "quickbooks" | "csv" | "xlsx";
export type ImportRetryAction = "xero_import" | "quickbooks_refresh" | "file_upload";

export function importSourceLabel(source: string) {
  switch (source) {
    case "xero":
      return "Xero";
    case "quickbooks":
      return "QuickBooks";
    case "xlsx":
      return "Excel";
    case "csv":
      return "CSV";
    default:
      return source;
  }
}

export function importStatusLabel(status: string) {
  switch (status) {
    case "started":
      return "Started";
    case "success":
      return "Success";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

export function importDateRange(years: Array<{ year: number }>) {
  if (!years.length) return { start: null, end: null };
  const sorted = years.map((year) => Number(year.year)).sort((a, b) => a - b);
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

export function safeImportError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 300);
  return "Import failed";
}
