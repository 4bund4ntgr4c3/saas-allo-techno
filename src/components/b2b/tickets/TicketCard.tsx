import { AlertTriangle, Clock, Laptop, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrgTicketSummary, B2BTicketPriority } from "@/lib/org.functions";
import { useI18n } from "@/lib/i18n/context";

const PRIORITY_BADGE: Record<B2BTicketPriority, string> = {
  faible: "bg-muted text-muted-foreground",
  normale: "bg-muted text-foreground",
  haute: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  critique: "bg-red-500/15 text-red-600 border-red-500/20",
};

export interface TicketCardProps {
  ticket: OrgTicketSummary;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const { t } = useI18n();
  const priorityKey = (ticket.priority ?? "normale") as B2BTicketPriority;
  const badgeClass = PRIORITY_BADGE[priorityKey] ?? PRIORITY_BADGE.normale;

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer flex flex-col gap-3 border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-md">
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {ticket.reference}
              </span>
              {ticket.priority && (
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase font-semibold ${badgeClass}`}
                >
                  {t(`org.tickets.priority.${ticket.priority}`)}
                </Badge>
              )}
            </div>
            <p className="truncate font-bold text-sm text-foreground group-hover:text-primary transition-colors mt-0.5">
              {ticket.issue}
            </p>
          </div>
        </div>
        <Badge variant="outline">{t(`org.tickets.status.${ticket.status}`)}</Badge>
      </div>

      <dl className="mt-auto space-y-1 text-xs text-muted-foreground">
        {ticket.equipment ? (
          <div className="flex items-center gap-1.5">
            <Laptop className="size-3 text-primary shrink-0" />
            <span className="truncate text-foreground">
              {ticket.equipment.name}{" "}
              {[ticket.equipment.brand, ticket.equipment.model].filter(Boolean).join(" ")}
            </span>
          </div>
        ) : null}
        {ticket.location ? (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{ticket.location}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-1.5 text-[11px]">
          <Clock className="size-3 shrink-0" />
          <span>Créé le {new Date(ticket.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>
          Type : {ticket.ticket_type ? t(`org.tickets.type.${ticket.ticket_type}`) : "SAV"}
        </span>
        <span className="text-primary font-medium text-[11px] group-hover:underline">
          Consulter &amp; Suivre &rarr;
        </span>
      </div>
    </li>
  );
}
