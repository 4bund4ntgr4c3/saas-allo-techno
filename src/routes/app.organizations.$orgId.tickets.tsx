import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  LifeBuoy,
  Loader2,
  MapPin,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/context";
import {
  createB2BTicket,
  getMyOrganizations,
  getOrgEquipment,
  getOrgTickets,
  B2B_TICKET_PRIORITIES,
  B2B_TICKET_TYPES,
  type B2BTicketPriority,
  type B2BTicketType,
} from "@/lib/org.functions";

interface TicketsSearch {
  equipment?: string;
}

export const Route = createFileRoute("/app/organizations/$orgId/tickets")({
  component: OrgTickets,
  validateSearch: (search: Record<string, unknown>): TicketsSearch => {
    const equipment = typeof search["equipment"] === "string" ? search["equipment"] : undefined;
    return equipment ? { equipment } : {};
  },
});

const PRIORITY_BADGE: Record<B2BTicketPriority, string> = {
  faible: "bg-muted text-muted-foreground",
  normale: "bg-muted text-foreground",
  haute: "bg-amber-500/15 text-amber-600",
  critique: "bg-red-500/15 text-red-600",
};

function OrgTickets() {
  const { orgId } = Route.useParams();
  const equipmentSearch = Route.useSearch({ select: (s: TicketsSearch) => s.equipment });
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const tickets = useQuery({
    queryKey: ["app", "org", orgId, "tickets"],
    queryFn: () => getOrgTickets({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const equipment = useQuery({
    queryKey: ["app", "org", orgId, "equipment"],
    queryFn: () => getOrgEquipment({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const [showForm, setShowForm] = useState(Boolean(equipmentSearch));
  const [form, setForm] = useState({
    equipment_id: equipmentSearch ?? "",
    ticket_type: "panne" as B2BTicketType,
    priority: "normale" as B2BTicketPriority,
    issue: "",
    location: "",
    contact_phone: "",
    contact_email: "",
    message: "",
  });

  const createTicket = useMutation({
    mutationFn: () =>
      createB2BTicket({
        data: {
          org_id: orgId,
          equipment_id: form.equipment_id || null,
          ticket_type: form.ticket_type,
          priority: form.priority,
          issue: form.issue,
          location: form.location || null,
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
          message: form.message || null,
        },
      }),
    onSuccess: async (ticket) => {
      toast.success(t("org.tickets.form.success").replace("{0}", ticket.reference));
      setShowForm(false);
      setForm({
        equipment_id: "",
        ticket_type: "panne",
        priority: "normale",
        issue: "",
        location: "",
        contact_phone: "",
        contact_email: "",
        message: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "tickets"] });
      navigate({
        to: "/app/organizations/$orgId/tickets/$ticketId",
        params: { orgId, ticketId: ticket.id },
      });
    },
    onError: (err) => toast.error(t("org.tickets.form.error").replace("{0}", err.message)),
  });

  if (!org) {
    return (
      <p className="text-sm text-muted-foreground">
        {orgs.isLoading ? t("common.loading") : t("org.error.notfound")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/app/organizations/$orgId"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("org.tickets.detail.back")}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="at-display flex items-center gap-2 text-2xl font-bold">
              <LifeBuoy className="size-6" />
              {t("org.tickets.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("org.tickets.subtitle")}</p>
          </div>
          <Button type="button" variant="primaryBlock" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <ArrowLeft className="size-4" /> : <AlertTriangle className="size-4" />}
            {showForm ? t("org.equipment.detail.back") : t("org.tickets.report")}
          </Button>
        </div>
      </div>

      {showForm ? (
        <form
          className="grid gap-4 rounded-sm border border-border bg-card p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createTicket.mutate();
          }}
        >
          <div className="sm:col-span-2">
            <h2 className="text-lg font-bold">{t("org.tickets.form.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("org.tickets.form.subtitle")}</p>
          </div>
          <div>
            <Label>{t("org.tickets.form.equipment")}</Label>
            <Select
              value={form.equipment_id}
              onValueChange={(v) => setForm((f) => ({ ...f, equipment_id: v }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={t("org.tickets.form.equipment.none")} />
              </SelectTrigger>
              <SelectContent>
                {equipment.data?.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name}
                    {eq.asset_tag ? ` · ${eq.asset_tag}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("org.tickets.form.type")}</Label>
            <Select
              value={form.ticket_type}
              onValueChange={(v) => setForm((f) => ({ ...f, ticket_type: v as B2BTicketType }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {B2B_TICKET_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`org.tickets.type.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("org.tickets.form.priority")}</Label>
            <Select
              value={form.priority}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, priority: v as B2BTicketPriority }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {B2B_TICKET_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`org.tickets.priority.${p}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="ticket-location">{t("org.tickets.form.location")}</Label>
            <Input
              id="ticket-location"
              className="mt-1.5"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ticket-issue">{t("org.tickets.form.issue")}</Label>
            <Textarea
              id="ticket-issue"
              required
              className="mt-1.5"
              placeholder={t("org.tickets.form.issue.placeholder")}
              value={form.issue}
              onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="ticket-phone">{t("org.tickets.form.phone")}</Label>
            <Input
              id="ticket-phone"
              type="tel"
              className="mt-1.5"
              value={form.contact_phone}
              onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="ticket-email">{t("org.tickets.form.email")}</Label>
            <Input
              id="ticket-email"
              type="email"
              className="mt-1.5"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ticket-message">{t("org.tickets.form.message")}</Label>
            <Textarea
              id="ticket-message"
              className="mt-1.5"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              type="submit"
              variant="primaryBlock"
              disabled={!form.issue.trim() || createTicket.isPending}
            >
              {createTicket.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {t("org.tickets.form.submit")}
            </Button>
          </div>
        </form>
      ) : null}

      {tickets.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : tickets.data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("org.tickets.empty")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-card">
          {tickets.data?.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to="/app/organizations/$orgId/tickets/$ticketId"
                params={{ orgId, ticketId: ticket.id }}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-accent/50"
              >
                <Badge
                  variant="outline"
                  className={
                    ticket.priority ? PRIORITY_BADGE[ticket.priority] : undefined
                  }
                >
                  {ticket.priority ? t(`org.tickets.priority.${ticket.priority}`) : "—"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <span className="font-mono text-xs text-muted-foreground">
                      {ticket.reference}
                    </span>{" "}
                    {ticket.issue}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {ticket.equipment ? (
                      <span>{ticket.equipment.name}</span>
                    ) : (
                      <span>{t("org.tickets.detail.noEquipment")}</span>
                    )}
                    {ticket.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3" />
                        {ticket.location}
                      </span>
                    ) : null}
                    <span>
                      {new Date(ticket.created_at).toLocaleDateString("fr-FR", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </p>
                </div>
                <Badge variant="outline">{t(`org.tickets.status.${ticket.status}`)}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
