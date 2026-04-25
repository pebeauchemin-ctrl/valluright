import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Settings — ValuRight.ai" }] }),
  component: Settings,
});

function Settings() {
  const { user } = useAuth();
  const { current, refresh } = useBusiness();
  const [name, setName] = useState(current?.name ?? "");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const saveBusiness = async () => {
    if (!current) return;
    setBusy(true);
    await supabase.from("businesses").update({ name }).eq("id", current.id);
    await refresh();
    toast.success("Saved");
    setBusy(false);
  };

  const deleteBusiness = async () => {
    if (!current) return;
    if (!confirm(`Delete "${current.name}"? This permanently removes all data.`)) return;
    await supabase.from("businesses").delete().eq("id", current.id);
    await refresh();
    toast.success("Business deleted");
  };

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and business.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-display font-semibold text-primary">Account</h2>
        <div className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{user.email}</span></div>
      </div>

      {current && (
        <>
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="font-display font-semibold text-primary">Business</h2>
            <label className="block">
              <span className="text-sm font-medium">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </label>
            <button onClick={saveBusiness} disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>

          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-3">
            <h2 className="font-display font-semibold text-destructive">Danger zone</h2>
            <p className="text-sm text-muted-foreground">Permanently delete this business and all its data.</p>
            <button onClick={deleteBusiness}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive bg-card px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" /> Delete business
            </button>
          </div>
        </>
      )}
    </div>
  );
}
