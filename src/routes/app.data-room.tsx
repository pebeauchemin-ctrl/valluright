import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/data-room")({
  head: () => ({ meta: [{ title: "Data Room — ValuRight.ai" }] }),
  component: DataRoom,
});

const CATEGORIES = ["financials", "tax_returns", "legal", "leases", "contracts", "operations", "other"] as const;
type Category = typeof CATEGORIES[number];

type FileRow = { id: string; filename: string; storage_path: string; category: Category; size_bytes: number | null; mime_type: string | null; uploaded_at: string };

function DataRoom() {
  const { current } = useBusiness();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState<Category>("financials");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    if (!current) return;
    const { data } = await supabase.from("data_room_files").select("*").eq("business_id", current.id).order("uploaded_at", { ascending: false });
    setFiles((data ?? []) as FileRow[]);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [current]);

  const upload = async (f: File) => {
    if (!current) return;
    setUploading(true);
    try {
      const path = `${current.id}/${Date.now()}-${f.name}`;
      const { error: upErr } = await supabase.storage.from("data-room").upload(path, f);
      if (upErr) throw upErr;
      await supabase.from("data_room_files").insert({
        business_id: current.id, filename: f.name, storage_path: path,
        category, size_bytes: f.size, mime_type: f.type,
      });
      await refresh();
      toast.success(`Uploaded ${f.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (f: FileRow) => {
    await supabase.storage.from("data-room").remove([f.storage_path]);
    await supabase.from("data_room_files").delete().eq("id", f.id);
    await refresh();
    toast.success("File removed");
  };

  const download = async (f: FileRow) => {
    const { data } = await supabase.storage.from("data-room").createSignedUrl(f.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (!current) return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Data Room</h1>
        <p className="mt-1 text-sm text-muted-foreground">Securely organize documents — financials, tax returns, leases, contracts. Ready when a buyer signs an NDA.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm capitalize">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload file"}
          </button>
        </div>
      </div>

      {CATEGORIES.map((cat) => {
        const items = files.filter((f) => f.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display font-semibold text-primary capitalize mb-3">{cat.replace(/_/g, " ")}</h3>
            <div className="space-y-2">
              {items.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{f.filename}</div>
                      <div className="text-xs text-muted-foreground">{((f.size_bytes ?? 0) / 1024).toFixed(0)} KB · {new Date(f.uploaded_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => download(f)} className="p-1.5 rounded hover:bg-card"><Download className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(f)} className="p-1.5 rounded hover:bg-card text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {files.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No documents yet. Start by uploading your last 3 years of P&L statements.
        </div>
      )}
    </div>
  );
}
