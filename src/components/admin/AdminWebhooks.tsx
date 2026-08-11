import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Webhook, Plus, Trash2, Power, PowerOff, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listWebhooks,
  listWebhookLogs,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  WEBHOOK_EVENTS,
  type OutboundWebhook,
  type WebhookLog,
} from "@/lib/webhooks.functions";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";

export function AdminWebhooks() {
  const { t } = useI18n();
  const EVENT_LABELS: Record<string, string> = {
    "reservation.created": t("admin.webhooks.event.reservation.created"),
    "reservation.status_changed": t("admin.webhooks.event.reservation.status_changed"),
    "reservation.completed": t("admin.webhooks.event.reservation.completed"),
    "payment.received": t("admin.webhooks.event.payment.received"),
    "payment.failed": t("admin.webhooks.event.payment.failed"),
    "lead.new": t("admin.webhooks.event.lead.new"),
    "review.submitted": t("admin.webhooks.event.review.submitted"),
  };
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["outbound-webhooks"],
    queryFn: () => listWebhooks(),
  });

  const { data: logs } = useQuery({
    queryKey: ["webhook-logs", expandedId],
    enabled: !!expandedId,
    queryFn: async () => (await listWebhookLogs({ data: { webhook_id: expandedId! } })) as WebhookLog[],
  });

  const createMut = useMutation({
    mutationFn: (v: { name: string; url: string; events: string[]; secret?: string }) =>
      createWebhook({ data: v }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-webhooks"] });
      toast.success(t("admin.webhooks.toast.created"));
      setShowCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (w: OutboundWebhook) =>
      updateWebhook({ data: { id: w.id, active: !w.active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outbound-webhooks"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteWebhook({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outbound-webhooks"] });
      toast.success(t("admin.webhooks.toast.deleted"));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-muted animate-pulse" />
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Webhook className="size-5" /> {t("admin.webhooks.title")}
        </h3>
        <Button variant="technical" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 size-4" /> {t("admin.webhooks.button.create")}
        </Button>
      </div>

      {showCreate && (
        <WebhookForm onSubmit={(v) => createMut.mutate(v)} onCancel={() => setShowCreate(false)} />
      )}

      {(!webhooks || webhooks.length === 0) ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Webhook className="mx-auto size-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{t("admin.webhooks.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((w) => (
            <div key={w.id} className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{w.name}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">{w.url}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {w.events.map((ev) => (
                      <span
                        key={ev}
                        className="inline-block rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium"
                      >
                        {EVENT_LABELS[ev] ?? ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {w.last_status && (
                    <span
                      className={`text-[10px] font-mono ${w.last_status < 300 ? "text-success" : "text-destructive"}`}
                    >
                      {w.last_status}
                    </span>
                  )}
                  <button
                    className="p-1 hover:bg-muted rounded-sm"
                    onClick={() => toggleMut.mutate(w)}
                    title={w.active ? t("admin.webhooks.action.deactivate") : t("admin.webhooks.action.activate")}
                  >
                    {w.active ? (
                      <Power className="size-4 text-success" />
                    ) : (
                      <PowerOff className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    className="p-1 hover:bg-muted rounded-sm"
                    onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                  >
                    {expandedId === w.id ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                  <button
                    className="p-1 hover:bg-destructive/10 rounded-sm"
                    onClick={() => deleteMut.mutate(w.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </button>
                </div>
              </div>
              {expandedId === w.id && logs && (
                <div className="border-t p-3">
                  {logs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("admin.webhooks.logs.empty")}</p>
                  ) : (
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-muted-foreground w-36 shrink-0">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                          <span
                            className={
                              log.status_code && log.status_code < 300
                                ? "text-success font-medium"
                                : "text-destructive font-medium"
                            }
                          >
                            {log.status_code ?? "ERR"}
                          </span>
                          <span className="truncate">{log.event}</span>
                          {log.duration_ms != null && (
                            <span className="text-muted-foreground">{log.duration_ms}ms</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WebhookForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (v: { name: string; url: string; events: string[]; secret?: string }) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const EVENT_LABELS: Record<string, string> = {
    "reservation.created": t("admin.webhooks.event.reservation.created"),
    "reservation.status_changed": t("admin.webhooks.event.reservation.status_changed"),
    "reservation.completed": t("admin.webhooks.event.reservation.completed"),
    "payment.received": t("admin.webhooks.event.payment.received"),
    "payment.failed": t("admin.webhooks.event.payment.failed"),
    "lead.new": t("admin.webhooks.event.lead.new"),
    "review.submitted": t("admin.webhooks.event.review.submitted"),
  };
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const toggle = (ev: string) =>
    setEvents((prev) => (prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]));

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <input
        className={field}
        placeholder={t("admin.webhooks.form.name_placeholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className={field}
        placeholder="https://example.com/webhook"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        className={field}
        placeholder={t("admin.webhooks.form.secret_placeholder")}
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <div>
        <p className="text-xs font-medium mb-1">{t("admin.webhooks.form.events_label")}</p>
        <div className="flex flex-wrap gap-1">
          {WEBHOOK_EVENTS.map((ev) => (
            <button
              key={ev}
              type="button"
              className={`rounded-sm px-2 py-1 text-[10px] font-medium border transition-colors ${
                events.includes(ev)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50"
              }`}
              onClick={() => toggle(ev)}
            >
              {EVENT_LABELS[ev] ?? ev}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="technical"
          size="sm"
          disabled={!name || !url || events.length === 0}
          onClick={() => onSubmit({ name, url, events, ...(secret ? { secret } : {}) })}
        >
          {t("admin.webhooks.form.save")}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          {t("admin.webhooks.form.cancel")}
        </Button>
      </div>
    </div>
  );
}
