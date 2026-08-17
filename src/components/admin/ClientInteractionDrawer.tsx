import * as React from "react";
import { PhoneCall, MessageSquare, StickyNote, User, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getClientInteractionsFn,
  addClientInteractionFn,
  type ClientInteractionEntry,
  type InteractionChannel,
} from "@/lib/interactions.functions";

export interface ClientInteractionDrawerProps {
  reference: string;
}

export function ClientInteractionDrawer({ reference }: ClientInteractionDrawerProps) {
  const [items, setItems] = React.useState<ClientInteractionEntry[]>([]);
  const [channel, setChannel] = React.useState<InteractionChannel>("phone_call");
  const [summary, setSummary] = React.useState("");
  const [nextAction, setNextAction] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isOpenForm, setIsOpenForm] = React.useState(false);

  React.useEffect(() => {
    getClientInteractionsFn({ data: { reference } })
      .then(setItems)
      .catch(() => {});
  }, [reference]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await addClientInteractionFn({
        data: {
          reference,
          channel,
          authorName: "Technicien d'Atelier",
          summary: summary.trim(),
          nextAction: nextAction.trim() || undefined,
        },
      });
      if (res.success) {
        setItems((prev) => [res.entry, ...prev]);
        setSummary("");
        setNextAction("");
        setIsOpenForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChannelIcon = (ch: InteractionChannel) => {
    switch (ch) {
      case "phone_call":
        return <PhoneCall className="size-3.5 text-blue-500" />;
      case "whatsapp":
        return <MessageSquare className="size-3.5 text-emerald-600" />;
      case "in_person":
        return <User className="size-3.5 text-amber-500" />;
      case "internal_memo":
        return <StickyNote className="size-3.5 text-purple-500" />;
    }
  };

  return (
    <div className="border border-border bg-card p-4 rounded-xl space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
            Journal des Contacts &amp; Mémos Atelier
          </h4>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpenForm((v) => !v)}
          className="text-[11px] h-7"
        >
          <Plus className="size-3 mr-1" />
          {isOpenForm ? "Fermer" : "Nouvelle Note"}
        </Button>
      </div>

      {isOpenForm && (
        <form
          onSubmit={handleSubmit}
          className="border border-primary/30 bg-primary/5 p-3 rounded-lg space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="flex gap-1.5">
            {[
              { id: "phone_call", label: "Appel Tél" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "in_person", label: "Passage Atelier" },
              { id: "internal_memo", label: "Mémo Interne" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id as InteractionChannel)}
                className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                  channel === c.id
                    ? "border-primary bg-primary text-primary-foreground font-bold"
                    : "border-border bg-surface text-muted-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Résumé de l'échange avec le client ou consigne technique..."
            className="text-xs min-h-[60px]"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />

          <Input
            placeholder="Action suivante à mener (optionnel)..."
            className="text-xs h-7"
            value={nextAction}
            onChange={(e) => setNextAction(e.target.value)}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              variant="technical"
              size="sm"
              disabled={isSubmitting || !summary.trim()}
              className="text-xs h-7"
            >
              {isSubmitting ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
              Enregistrer
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            Aucun contact consigné pour ce dossier.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="border border-border/80 bg-surface/50 p-2.5 rounded text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  {getChannelIcon(item.channel)}
                  {item.authorName}
                </span>
                <span>
                  {new Date(item.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-foreground text-[11px]">{item.summary}</p>
              {item.nextAction && (
                <div className="mt-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">
                  &rarr; À faire : {item.nextAction}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
