import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, History, MapPin, Paperclip, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { getMyOrganizations, getOrgTicket } from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId/tickets/$ticketId")({
  component: OrgTicketDetail,
});

function OrgTicketDetail() {
  const { orgId, ticketId } = Route.useParams();
  const { t } = useI18n();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const ticket = useQuery({
    queryKey: ["app", "org", orgId, "tickets", ticketId],
    queryFn: () => getOrgTicket({ data: { ticket_id: ticketId } }),
    enabled: Boolean(org),
  });

  if (!org) {
    return (
      <p className="text-sm text-muted-foreground">
        {orgs.isLoading ? t("common.loading") : t("org.error.notfound")}
      </p>
    );
  }
  if (ticket.isLoading || !ticket.data) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  const tk = ticket.data;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/app/organizations/$orgId/tickets"
          params={{ orgId }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("org.tickets.detail.back")}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="at-display text-2xl font-bold">{tk.reference}</h1>
          <Badge variant="outline">{t(`org.tickets.status.${tk.status}`)}</Badge>
          {tk.ticket_type ? (
            <Badge variant="outline">{t(`org.tickets.type.${tk.ticket_type}`)}</Badge>
          ) : null}
          {tk.priority ? (
            <Badge variant="outline">{t(`org.tickets.priority.${tk.priority}`)}</Badge>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("org.tickets.detail.createdAt")}{" "}
          {new Date(tk.created_at).toLocaleString("fr-FR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">{tk.issue}</h2>
            {tk.message ? <p className="whitespace-pre-wrap text-sm">{tk.message}</p> : null}
            {tk.location ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {tk.location}
              </p>
            ) : null}
          </div>

          <div className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <History className="size-5" />
              {t("org.tickets.detail.timeline")}
            </h2>
            {tk.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("org.tickets.detail.timeline.empty")}
              </p>
            ) : (
              <ol className="space-y-3">
                {tk.timeline.map((h) => (
                  <li key={h.id} className="flex gap-3 border-l-2 border-border pl-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        {h.old_status ? (
                          <Badge variant="outline">
                            {t(`org.tickets.status.${h.old_status}`)}
                          </Badge>
                        ) : null}
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline">
                          {t(`org.tickets.status.${h.new_status}`)}
                        </Badge>
                      </p>
                      {h.note ? <p className="mt-1 text-sm">{h.note}</p> : null}
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

          <div className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Paperclip className="size-5" />
              {t("org.tickets.detail.attachments")}
            </h2>
            {tk.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("org.tickets.detail.attachments.empty")}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {tk.attachments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-sm border border-border p-3 text-sm transition-colors hover:border-primary"
                    >
                      <p className="truncate font-medium">{a.caption ?? "Pièce jointe"}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.kind ?? a.stage ?? "—"} ·{" "}
                        {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">{t("org.tickets.detail.info")}</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("org.tickets.form.issue")}
                </dt>
                <dd className="mt-1 font-medium">{tk.issue}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("org.tickets.detail.createdAt")}
                </dt>
                <dd className="mt-1 font-medium">
                  {new Date(tk.created_at).toLocaleDateString("fr-FR", {
                    dateStyle: "long",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("org.tickets.detail.updatedAt")}
                </dt>
                <dd className="mt-1 font-medium">
                  {new Date(tk.updated_at).toLocaleDateString("fr-FR", {
                    dateStyle: "long",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">{t("org.tickets.detail.equipment")}</h2>
            {tk.equipment ? (
              <Link
                to="/app/organizations/$orgId/equipment/$equipmentId"
                params={{ orgId, equipmentId: tk.equipment.id }}
                className="block rounded-sm border border-border p-3 text-sm transition-colors hover:border-primary"
              >
                <p className="font-medium">{tk.equipment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[tk.equipment.brand, tk.equipment.model, tk.equipment.serial_number]
                    .filter(Boolean)
                    .join(" · ") || tk.equipment.type}
                </p>
                {tk.equipment.location ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" />
                    {tk.equipment.location}
                  </p>
                ) : null}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("org.tickets.detail.noEquipment")}
              </p>
            )}
          </div>

          <div className="rounded-sm border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">{t("org.tickets.detail.contact")}</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("org.form.name")}
                </dt>
                <dd className="mt-0.5 font-medium">{tk.customer_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("org.form.phone")}
                </dt>
                <dd className="mt-0.5 font-medium">{tk.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("org.form.email")}
                </dt>
                <dd className="mt-0.5 font-medium">{tk.email ?? "—"}</dd>
              </div>
            </dl>
          </div>

          {tk.equipment?.warranty_expires_at ? (
            <p className="flex items-center gap-2 rounded-sm border border-dashed border-border p-4 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" />
              Garantie jusqu'au {tk.equipment.warranty_expires_at.slice(0, 10)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
