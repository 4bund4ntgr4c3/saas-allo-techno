import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Clock, LifeBuoy, Loader2, MapPin, Send } from "lucide-react";
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
  haute: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  critique: "bg-red-500/15 text-red-600 border-red-500/20",
};

function OrgTickets() {
  const { orgId } = Route.useParams();
  const location = useLocation();

  const isChildRoute = Boolean(location.pathname.match(/\/tickets\/[^/]+$/));
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

  const ticketList = tickets.data ?? [];
  const kpis = useMemo(() => {
    const open = ticketList.filter((t) => t.status !== "fermé" && t.status !== "annulé").length;
    const critical = ticketList.filter((t) => t.priority === "critique").length;
    return { total: ticketList.length, open, critical };
  }, [ticketList]);

  if (!org) {
    return (
      <div className="flex items-center justify-center py-20">
        {orgs.isLoading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <p className="text-sm text-muted-foreground">{t("org.error.notfound")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="at-in">
        <Link
          to="/app/organizations/$orgId"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {org.name}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="at-eyebrow mb-1 block">{t("org.tickets.title")}</span>
            <h1 className="at-display text-2xl font-bold">{t("org.tickets.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("org.tickets.subtitle")}</p>
          </div>
          <Button type="button" variant="primaryBlock" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <ArrowLeft className="size-4" /> : <AlertTriangle className="size-4" />}
            {showForm ? t("org.equipment.detail.back") : t("org.tickets.report")}
          </Button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="at-in grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-primary">
            <LifeBuoy className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{kpis.total}</p>
            <p className="text-xs text-muted-foreground">{t("org.tickets.kpi.total")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div
            className={`flex size-10 items-center justify-center ${kpis.open > 0 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-success"}`}
          >
            <Clock className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{kpis.open}</p>
            <p className="text-xs text-muted-foreground">{t("org.tickets.kpi.open")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div
            className={`flex size-10 items-center justify-center ${kpis.critical > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-success"}`}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="font-mono text-2xl font-bold tabular-nums">{kpis.critical}</p>
            <p className="text-xs text-muted-foreground">{t("org.tickets.kpi.critical")}</p>
          </div>
        </div>
      </div>

      {/* ─── Ticket Creation Form ─── */}
      {showForm ? (
        <form
          className="at-in grid gap-4 border border-border bg-card p-5 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createTicket.mutate();
          }}
        >
          <div className="sm:col-span-2 border-b border-border pb-3">
            <h2 className="text-sm font-bold">{t("org.tickets.form.title")}</h2>
            <p className="text-xs text-muted-foreground">{t("org.tickets.form.subtitle")}</p>
          </div>
          <div>
            <Label className="text-xs">{t("org.tickets.form.equipment")}</Label>
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
            <Label className="text-xs">{t("org.tickets.form.type")}</Label>
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
            <Label className="text-xs">{t("org.tickets.form.priority")}</Label>
            <Select
              value={form.priority}
              onValueChange={(v) => setForm((f) => ({ ...f, priority: v as B2BTicketPriority }))}
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
            <Label htmlFor="ticket-location" className="text-xs">
              {t("org.tickets.form.location")}
            </Label>
            <Input
              id="ticket-location"
              className="mt-1.5"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ticket-issue" className="text-xs">
              {t("org.tickets.form.issue")}
            </Label>
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
            <Label htmlFor="ticket-phone" className="text-xs">
              {t("org.tickets.form.phone")}
            </Label>
            <Input
              id="ticket-phone"
              type="tel"
              className="mt-1.5"
              value={form.contact_phone}
              onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="ticket-email" className="text-xs">
              {t("org.tickets.form.email")}
            </Label>
            <Input
              id="ticket-email"
              type="email"
              className="mt-1.5"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ticket-message" className="text-xs">
              {t("org.tickets.form.message")}
            </Label>
            <Textarea
              id="ticket-message"
              className="mt-1.5"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>
          <div className="flex justify-end sm:col-span-2">
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

      {/* ─── Ticket List ─── */}
      <div className="at-in" style={{ animationDelay: "120ms" }}>
        <span className="at-eyebrow mb-3 block">{t("org.tickets.list.title")}</span>

        {tickets.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : ticketList.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border py-16 text-center">
            <LifeBuoy className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">{t("org.tickets.empty")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-hidden border border-border bg-card">
            {ticketList.map((ticket) => (
              <Link
                key={ticket.id}
                to="/app/organizations/$orgId/tickets/$ticketId"
                params={{ orgId, ticketId: ticket.id }}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted/30"
              >
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${
                    ticket.priority ? PRIORITY_BADGE[ticket.priority] : ""
                  }`}
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
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold ${
                    ticket.status === "fermé"
                      ? "bg-success/15 text-success border-success/20"
                      : ticket.status === "en_cours"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : ""
                  }`}
                >
                  {t(`org.tickets.status.${ticket.status}`)}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isChildRoute && <Outlet />}
    </div>
  );
}
