import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";

export interface TicketTimelineItem {
  id: string;
  old_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

export interface TicketTimelineProps {
  timeline: TicketTimelineItem[];
}

export function TicketTimeline({ timeline }: TicketTimelineProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
        <History className="size-5 text-primary" />
        {t("org.tickets.detail.timeline")}
      </h2>
      {timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("org.tickets.detail.timeline.empty")}</p>
      ) : (
        <ol className="space-y-3">
          {timeline.map((h) => (
            <li key={h.id} className="flex gap-3 border-l-2 border-primary/30 pl-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  {h.old_status ? (
                    <Badge variant="outline">{t(`org.tickets.status.${h.old_status}`)}</Badge>
                  ) : null}
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline">{t(`org.tickets.status.${h.new_status}`)}</Badge>
                </p>
                {h.note ? <p className="mt-1 text-sm text-foreground">{h.note}</p> : null}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleString("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
