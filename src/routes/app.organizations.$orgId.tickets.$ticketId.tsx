import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TicketTimeline } from "@/components/b2b/tickets/TicketTimeline";
import { TicketAttachments } from "@/components/b2b/tickets/TicketAttachments";
import { useI18n } from "@/lib/i18n/context";
import { sendWhatsAppTicketNotificationFn } from "@/lib/whatsapp.functions";
import { parseError } from "@/lib/error-parser";
import {
  attachB2BTicketFile,
  getB2BTicketAttachmentUrls,
  getB2BTicketUpload,
  getMyOrganizations,
  getOrgTicket,
} from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId/tickets/$ticketId")({
  component: OrgTicketDetail,
});

function OrgTicketDetail() {
  const { orgId, ticketId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const ticket = useQuery({
    queryKey: ["app", "org", orgId, "tickets", ticketId],
    queryFn: () => getOrgTicket({ data: { ticket_id: ticketId } }),
    enabled: Boolean(org),
  });

  const attachmentUrls = useQuery({
    queryKey: ["app", "org", orgId, "tickets", ticketId, "attachments"],
    queryFn: () =>
      getB2BTicketAttachmentUrls({
        data: { ticket_id: ticketId, paths: ticket.data?.attachments.map((a) => a.url) ?? [] },
      }),
    enabled: Boolean(ticket.data?.attachments.length),
  });

  const uploadFiles = useMutation({
    mutationFn: async (files: File[]) => {
      setUploading(true);
      try {
        for (const file of files) {
          const prepared = await getB2BTicketUpload({
            data: {
              ticket_id: ticketId,
              fileName: file.name,
              contentType: file.type,
              fileSize: file.size,
            },
          });
          const res = await fetch(prepared.signedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
              "x-upsert": "false",
            },
            body: file,
          });
          if (!res.ok) throw new Error(`Upload ${res.status}`);
          await attachB2BTicketFile({
            data: { ticket_id: ticketId, path: prepared.path, kind: prepared.kind },
          });
        }
      } finally {
        setUploading(false);
      }
    },
    onSuccess: async () => {
      toast.success(t("org.tickets.detail.attachment.added"));
      await queryClient.invalidateQueries({
        queryKey: ["app", "org", orgId, "tickets", ticketId],
      });
    },
    onError: (err: unknown) => {
      const parsed = parseError(err, "Erreur lors du téléversement de la pièce jointe");
      toast.error(parsed.message);
    },
  });

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

  if (ticket.isLoading || !ticket.data) {
    return <LoadingState message={t("common.loading")} />;
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="at-display text-2xl font-bold">{tk.reference}</h1>
            <Badge variant="outline">{t(`org.tickets.status.${tk.status}`)}</Badge>
            {tk.ticket_type ? (
              <Badge variant="outline">{t(`org.tickets.type.${tk.ticket_type}`)}</Badge>
            ) : null}
            {tk.priority ? (
              <Badge variant="outline">{t(`org.tickets.priority.${tk.priority}`)}</Badge>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await sendWhatsAppTicketNotificationFn({
                  data: {
                    phoneNumber: "+22990000000",
                    recipientName: tk.customer_name ?? "Responsable IT",
                    ticketNumber: tk.reference,
                    equipmentName: tk.equipment?.id
                      ? "Équipement sous contrat"
                      : "Matériel sous ticket",
                    status: ["terminee", "pret", "livre"].includes(tk.status) ? "repaired" : "received",
                  },
                });
                toast.success("Message WhatsApp prêt !");
                window.open(res.whatsappUrl, "_blank");
              } catch (err) {
                const parsed = parseError(err, "Erreur lors de la préparation de la notification WhatsApp.");
                toast.error(parsed.message);
              }
            }}
            className="gap-1.5 font-mono text-xs border-emerald-600/40 text-emerald-600 hover:bg-emerald-500/10"
          >
            <MessageSquare className="size-3.5" />
            <span>Notifier via WhatsApp</span>
          </Button>
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
          <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-3 text-lg font-bold text-foreground">{tk.issue}</h2>
            {tk.message ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{tk.message}</p> : null}
            {tk.location ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {tk.location}
              </p>
            ) : null}
          </div>

          {/* ─── TIMELINE COMPOSANT EXTRAIT ─── */}
          <TicketTimeline timeline={tk.timeline} />

          {/* ─── ATTACHMENTS COMPOSANT EXTRAIT ─── */}
          <TicketAttachments
            attachments={tk.attachments}
            attachmentUrls={attachmentUrls.data}
            onUpload={(files) => uploadFiles.mutate(files)}
            isUploading={uploading}
          />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-3 text-base font-bold text-foreground">{t("org.tickets.detail.info")}</h2>
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

          <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-3 text-base font-bold text-foreground">{t("org.tickets.detail.equipment")}</h2>
            {tk.equipment ? (
              <Link
                to="/app/organizations/$orgId/equipment/$equipmentId"
                params={{ orgId, equipmentId: tk.equipment.id }}
                className="block border border-border p-3 text-sm transition-colors hover:border-primary rounded-md"
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
              <p className="text-sm text-muted-foreground">{t("org.tickets.detail.noEquipment")}</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
            <h2 className="mb-3 text-base font-bold text-foreground">{t("org.tickets.detail.contact")}</h2>
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
            <p className="flex items-center gap-2 border border-dashed border-border p-4 text-xs text-muted-foreground rounded-md">
              <ShieldCheck className="size-4 shrink-0 text-primary" />
              Garantie jusqu'au {tk.equipment.warranty_expires_at.slice(0, 10)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
