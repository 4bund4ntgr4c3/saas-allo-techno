import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateTicketForm, type CreateTicketFormData } from "@/components/b2b/tickets/CreateTicketForm";
import { TicketCard } from "@/components/b2b/tickets/TicketCard";
import { useI18n } from "@/lib/i18n/context";
import { parseError } from "@/lib/error-parser";
import {
  createB2BTicket,
  getMyOrganizations,
  getOrgEquipment,
  getOrgTickets,
  type OrgTicketSummary,
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

  const createTicket = useMutation({
    mutationFn: (data: CreateTicketFormData) =>
      createB2BTicket({
        data: {
          org_id: orgId,
          equipment_id: data.equipment_id || null,
          ticket_type: data.ticket_type,
          priority: data.priority,
          issue: data.issue,
          location: data.location || null,
          contact_phone: data.contact_phone || null,
          contact_email: data.contact_email || null,
          message: data.message || null,
        },
      }),
    onSuccess: async (res) => {
      toast.success(t("org.tickets.form.success"));
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "tickets"] });
      navigate({
        to: "/app/organizations/$orgId/tickets/$ticketId",
        params: { orgId, ticketId: res.id },
      });
    },
    onError: (err: unknown) => {
      const parsed = parseError(err, t("org.tickets.form.error"));
      toast.error(parsed.message);
    },
  });

  const openTickets = useMemo(
    () => (tickets.data ?? []).filter((tk) => !["resolu", "ferme"].includes(tk.status)),
    [tickets.data]
  );
  const closedTickets = useMemo(
    () => (tickets.data ?? []).filter((tk) => ["resolu", "ferme"].includes(tk.status)),
    [tickets.data]
  );

  if (!org) {
    return (
      <div className="p-6">
        {orgs.isLoading ? (
          <LoadingState message={t("common.loading")} />
        ) : (
          <EmptyState title={t("org.error.notfound")} description="Vérifiez vos autorisations." />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/app/organizations/$orgId"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {org.name}
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="at-display text-2xl font-bold">{t("org.tickets.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("org.tickets.subtitle")}</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="size-4 mr-1" /> : <Plus className="size-4 mr-1" />}
            {t("org.tickets.create")}
          </Button>
        </div>
      </div>

      {showForm && (
        <CreateTicketForm
          equipmentList={equipment.data ?? []}
          initialEquipmentId={equipmentSearch ?? ""}
          onSubmit={(data) => createTicket.mutate(data)}
          isPending={createTicket.isPending}
        />
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-semibold">
          {t("org.tickets.open")} ({openTickets.length})
        </h2>
        {tickets.isLoading ? (
          <LoadingState message={t("common.loading")} />
        ) : openTickets.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={t("org.tickets.emptyOpen")}
            description="Aucun incident ou ticket ouvert actuellement."
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="size-4 mr-1" />
                {t("org.tickets.create")}
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {openTickets.map((tk: OrgTicketSummary) => (
              <TicketCard
                key={tk.id}
                ticket={tk}
                onClick={() =>
                  navigate({
                    to: "/app/organizations/$orgId/tickets/$ticketId",
                    params: { orgId, ticketId: tk.id },
                  })
                }
              />
            ))}
          </ul>
        )}
      </div>

      {closedTickets.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("org.tickets.closed")} ({closedTickets.length})
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
            {closedTickets.map((tk: OrgTicketSummary) => (
              <TicketCard
                key={tk.id}
                ticket={tk}
                onClick={() =>
                  navigate({
                    to: "/app/organizations/$orgId/tickets/$ticketId",
                    params: { orgId, ticketId: tk.id },
                  })
                }
              />
            ))}
          </ul>
        </div>
      )}

      {isChildRoute && <Outlet />}
    </div>
  );
}
