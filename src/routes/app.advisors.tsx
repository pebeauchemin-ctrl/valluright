import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserPlus, Mail, MessageSquare } from "lucide-react";
import { useBusiness } from "@/lib/business";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/advisors")({
  head: () => ({ meta: [{ title: "Advisors — ValuRight.ai" }] }),
  component: Advisors,
});

type Invite = { id: string; advisor_email: string; status: string; invited_at: string };
type Comment = { id: string; body: string; is_approval: boolean; created_at: string; author_id: string };

function Advisors() {
  const { current } = useBusiness();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!current) return;
    const [{ data: inv }, { data: cm }] = await Promise.all([
      supabase.from("advisor_invites").select("*").eq("business_id", current.id).order("invited_at", { ascending: false }),
      supabase.from("advisor_comments").select("*").eq("business_id", current.id).order("created_at", { ascending: false }),
    ]);
    setInvites((inv ?? []) as Invite[]);
    setComments((cm ?? []) as Comment[]);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [current]);

  const invite = async () => {
    if (!current || !email) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("advisor_invites").insert({
        business_id: current.id, advisor_email: email, status: "pending",
      });
      if (error) throw error;
      setEmail("");
      await refresh();
      toast.success(`Invitation sent to ${email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setBusy(false);
    }
  };

  if (!current) return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;

  return (
    <div className="p-6 lg:p-10 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-semibold text-primary">Advisors</h1>
        <p className="mt-1 text-sm text-muted-foreground">Invite your CPA or business broker to review your assumptions, comment, and approve the report.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-primary">Invite an advisor</h2>
        <div className="flex gap-2">
          <input type="email" placeholder="advisor@firm.com" value={email} onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={invite} disabled={busy || !email}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60">
            <UserPlus className="h-4 w-4" /> Invite
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary mb-3">Pending & active</h2>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No advisors invited yet.</p>
        ) : (
          <div className="space-y-2">
            {invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{i.advisor_email}</div>
                    <div className="text-xs text-muted-foreground">Invited {new Date(i.invited_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                  i.status === "accepted" ? "bg-accent-soft text-accent" :
                  i.status === "pending" ? "bg-gold/15 text-foreground" :
                  "bg-secondary text-muted-foreground"
                }`}>{i.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-display font-semibold text-primary mb-3 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Advisor comments
        </h2>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Comments from your advisor will appear here once they review the report.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className={`rounded-md border p-3 ${c.is_approval ? "border-accent/30 bg-accent-soft" : "border-border bg-secondary/30"}`}>
                <div className="text-sm">{c.body}</div>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()} {c.is_approval && "· Approved"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
