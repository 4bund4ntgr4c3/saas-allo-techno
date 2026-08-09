import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWebhooks,
  createWebhook,
  toggleWebhook,
  deleteWebhook,
  testWebhook,
} from "@/lib/webhook-manage";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { useState } from "react";
import { Trash2, Plus, ToggleLeft, ToggleRight, Zap, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_EVENTS = [
  "reservation.created",
  "reservation.status_changed",
  "payment.completed",
  "payment.failed",
  "quote.sent",
  "quote.accepted",
  "delivery.status_changed",
];

export function AdminWebhooks() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ["admin", "webhooks"],
    queryFn: () => getWebhooks(),
  });

  const createMutation = useMutation({
    mutationFn: () => createWebhook({ data: { url, events, secret } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "webhooks"] });
      setShowForm(false);
      setUrl("");
      setSecret("");
      setEvents([]);
      toast.success("Webhook créé");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleWebhook({ data: { id, active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "webhooks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "webhooks"] }),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => testWebhook({ data: { id } }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Test réussi (HTTP ${result.status})`);
      } else {
        toast.error(`Test échoué : ${result.error ?? "Erreur inconnue"}`);
      }
    },
  });

  const toggleEvent = (event: string) => {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("admin.webhooks")}</h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 size-3" />
          {t("admin.webhooks.add")}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          />
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Secret (min. 8 caractères)"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_EVENTS.map((event) => (
              <button
                key={event}
                onClick={() => toggleEvent(event)}
                className={`rounded-full border px-2 py-0.5 text-xs font-mono transition-colors ${
                  events.includes(event)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {event}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              disabled={!url || !secret || events.length === 0 || createMutation.isPending}
            >
              {t("admin.webhooks.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center justify-between bg-card px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono truncate">{wh.url}</code>
                  <a href={wh.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </a>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {wh.events.map((ev) => (
                    <span key={ev} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => testMutation.mutate(wh.id)}
                  disabled={testMutation.isPending}
                >
                  <Zap className="size-3" />
                </Button>
                <button onClick={() => toggleMutation.mutate({ id: wh.id, active: !wh.active })}>
                  {wh.active ? (
                    <ToggleRight className="size-6 text-success" />
                  ) : (
                    <ToggleLeft className="size-6 text-muted-foreground" />
                  )}
                </button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(wh.id)}>
                  <Trash2 className="size-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {webhooks.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Aucun webhook configuré
            </p>
          )}
        </div>
      )}
    </div>
  );
}
