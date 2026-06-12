import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileSignature,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useBusiness } from "@/lib/business";

export const Route = createFileRoute("/app/buyer-requests")({
  head: () => ({ meta: [{ title: "Buyer Leads — ValuRight.ai" }] }),
  component: BuyerRequests,
});

type AccessStatus = Database["public"]["Enums"]["access_request_status"];
type BuyerRequest = Database["public"]["Tables"]["buyer_access_requests"]["Row"];
type BuyerEvent = Database["public"]["Tables"]["buyer_access_request_events"]["Row"];

const STATUS: Record<
  AccessStatus,
  {
    label: string;
    tone: string;
    icon: typeof Clock;
  }
> = {
  pending: {
    label: "New request",
    tone: "bg-gold/15 text-foreground",
    icon: Clock,
  },
  more_info_requested: {
    label: "More info requested",
    tone: "bg-secondary text-muted-foreground",
    icon: HelpCircle,
  },
  nda_sent: {
    label: "NDA sent",
    tone: "bg-accent-soft text-accent",
    icon: FileSignature,
  },
  approved: {
    label: "Approved",
    tone: "bg-accent-soft text-accent",
    icon: CheckCircle2,
  },
  denied: {
    label: "Rejected",
    tone: "bg-destructive/10 text-destructive",
    icon: XCircle,
  },
};

const BUYER_TYPE_LABELS: Record<NonNullable<BuyerRequest["buyer_type"]>, string> = {
  individual: "Individual buyer",
  strategic: "Strategic acquirer",
  financial: "Financial / PE",
  search_fund: "Search fund",
  other: "Other",
};

const FINANCING_LABELS: Record<NonNullable<BuyerRequest["financing_status"]>, string> = {
  cash: "Cash",
  sba_pre_approved: "SBA pre-approved",
  sba_unverified: "SBA not verified",
  seller_financing: "Needs seller financing",
  other: "Other / exploring",
};

function BuyerRequests() {
  const { current } = useBusiness();
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [events, setEvents] = useState<BuyerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const eventsByRequest = useMemo(() => {
    return events.reduce<Record<string, BuyerEvent[]>>((acc, event) => {
      acc[event.request_id] = [...(acc[event.request_id] ?? []), event];
      return acc;
    }, {});
  }, [events]);

  const counts = useMemo(() => {
    return requests.reduce<Record<AccessStatus, number>>(
      (acc, request) => {
        acc[request.status] += 1;
        return acc;
      },
      {
        pending: 0,
        more_info_requested: 0,
        nda_sent: 0,
        approved: 0,
        denied: 0,
      },
    );
  }, [requests]);

  const refresh = async () => {
    if (!current) return;
    setLoading(true);
    const [requestRes, eventRes] = await Promise.all([
      supabase
        .from("buyer_access_requests")
        .select("*")
        .eq("business_id", current.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("buyer_access_request_events")
        .select("*")
        .eq("business_id", current.id)
        .order("created_at", { ascending: false }),
    ]);

    if (requestRes.error) toast.error(requestRes.error.message);
    else setRequests((requestRes.data ?? []) as BuyerRequest[]);

    if (eventRes.error) toast.error(eventRes.error.message);
    else setEvents((eventRes.data ?? []) as BuyerEvent[]);

    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const updateStatus = async (request: BuyerRequest, status: AccessStatus) => {
    setSavingId(request.id);
    const note = notes[request.id]?.trim() || null;
    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "update_buyer_access_request_status",
          args: {
            _request_id: string;
            _status: AccessStatus;
            _note: string | null;
          },
        ) => Promise<{ data: BuyerRequest | null; error: Error | null }>;
      }
    ).rpc("update_buyer_access_request_status", {
      _request_id: request.id,
      _status: status,
      _note: note,
    });

    setSavingId(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      setRequests((items) => items.map((item) => (item.id === data.id ? data : item)));
      setNotes((prev) => ({ ...prev, [request.id]: "" }));
      toast.success(`Lead marked ${STATUS[status].label.toLowerCase()}`);
      await refresh();
    }
  };

  if (!current) {
    return <div className="p-12 text-sm text-muted-foreground">No business selected.</div>;
  }

  return (
    <div className="max-w-6xl space-y-6 p-4 sm:p-6 lg:p-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-primary">Buyer leads</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Review buyer access requests from your public teaser. Keep sensitive data gated until
            you approve the buyer or send an NDA.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {(Object.keys(STATUS) as AccessStatus[]).map((status) => {
          const Icon = STATUS[status].icon;
          return (
            <div key={status} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Icon className="h-4 w-4" />
                {STATUS[status].label}
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-primary">
                {counts[status]}
              </div>
            </div>
          );
        })}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-display text-xl font-semibold text-primary">
            No buyer leads yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Once a buyer submits the request-access form on a published teaser, the lead will appear
            here for review and follow-up.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <BuyerRequestCard
              key={request.id}
              request={request}
              events={eventsByRequest[request.id] ?? []}
              note={notes[request.id] ?? ""}
              saving={savingId === request.id}
              onNote={(value) => setNotes((prev) => ({ ...prev, [request.id]: value }))}
              onStatus={(status) => updateStatus(request, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BuyerRequestCard({
  request,
  events,
  note,
  saving,
  onNote,
  onStatus,
}: {
  request: BuyerRequest;
  events: BuyerEvent[];
  note: string;
  saving: boolean;
  onNote: (value: string) => void;
  onStatus: (status: AccessStatus) => void;
}) {
  const StatusIcon = STATUS[request.status].icon;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-primary">{request.name}</h2>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS[request.status].tone}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {STATUS[request.status].label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              <a
                className="font-medium text-foreground hover:underline"
                href={`mailto:${request.email}`}
              >
                {request.email}
              </a>
            </span>
            {request.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                <a
                  className="font-medium text-foreground hover:underline"
                  href={`tel:${request.phone}`}
                >
                  {request.phone}
                </a>
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Badge label={buyerTypeLabel(request.buyer_type)} />
            <Badge label={financingLabel(request.financing_status)} />
            <Badge label={`Submitted ${formatDate(request.created_at)}`} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
          <ActionButton
            label="Request more info"
            disabled={saving || request.status === "more_info_requested"}
            onClick={() => onStatus("more_info_requested")}
          />
          <ActionButton
            label="Mark NDA sent"
            disabled={saving || request.status === "nda_sent"}
            onClick={() => onStatus("nda_sent")}
          />
          <ActionButton
            label="Approve"
            disabled={saving || request.status === "approved"}
            onClick={() => onStatus("approved")}
          />
          <ActionButton
            label="Reject"
            danger
            disabled={saving || request.status === "denied"}
            onClick={() => onStatus("denied")}
          />
        </div>
      </div>

      {request.message && (
        <div className="mt-5 rounded-lg border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            Buyer message
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{request.message}</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <label className="block">
          <span className="text-sm font-medium text-foreground">
            Owner note for next status change
          </span>
          <textarea
            value={note}
            onChange={(e) => onNote(e.target.value)}
            rows={4}
            placeholder="Optional note, such as NDA sent by email or ask for proof of funds."
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>

        <div>
          <div className="text-sm font-medium text-foreground">Status history</div>
          <div className="mt-1.5 max-h-44 space-y-2 overflow-auto rounded-md border border-border bg-secondary/20 p-3">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No history recorded yet.</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="rounded-md bg-background p-2 text-xs">
                  <div className="font-semibold text-foreground">
                    {event.from_status ? `${STATUS[event.from_status].label} -> ` : ""}
                    {STATUS[event.to_status].label}
                  </div>
                  {event.note && (
                    <div className="mt-1 leading-relaxed text-muted-foreground">{event.note}</div>
                  )}
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(event.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  label,
  danger = false,
  disabled,
  onClick,
}: {
  label: string;
  danger?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border border-destructive/30 bg-card text-destructive hover:bg-destructive/10"
          : "border border-border bg-background hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-muted-foreground">
      {label}
    </span>
  );
}

function buyerTypeLabel(value: BuyerRequest["buyer_type"]) {
  return value ? BUYER_TYPE_LABELS[value] : "Buyer type not provided";
}

function financingLabel(value: BuyerRequest["financing_status"]) {
  return value ? FINANCING_LABELS[value] : "Financing not provided";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
