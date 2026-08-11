import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n/context";
import { getAuditLogs, type AuditLogRow } from "@/lib/audit.functions";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

export function AuditSection() {
  const { t } = useI18n();

  const AUDIT_ACTION_LABEL: Record<string, string> = {
    "reservation.status_changed": t("admin.audit.action.statusChanged"),
    "reservation.cancelled": t("admin.audit.action.cancelled"),
    "reservation.assigned": t("admin.audit.action.technicianAssigned"),
    "quote.sent": t("admin.audit.action.quoteSent"),
    "quote.approved": t("admin.audit.action.quoteApproved"),
    "quote.declined": t("admin.audit.action.quoteDeclined"),
    "payment.confirmed": t("admin.audit.action.paymentConfirmed"),
    "payment.refunded": t("admin.audit.action.paymentRefunded"),
    "review.published": t("admin.audit.action.reviewPublished"),
    "review.hidden": t("admin.audit.action.reviewHidden"),
    "lead.status_changed": t("admin.audit.action.leadUpdated"),
    "claim.status_changed": t("admin.audit.action.claimUpdated"),
    "user.role_changed": t("admin.audit.action.roleChanged"),
    "stock.updated": t("admin.audit.action.stockUpdated"),
    "blog.post_created": t("admin.audit.action.postCreated"),
    "blog.post_updated": t("admin.audit.action.postUpdated"),
  };
  const getLogsFn = useServerFn(getAuditLogs);

  const logs = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getLogsFn({ data: {} }),
  });

  if (logs.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.audit.loading")}</p>;
  }

  if (logs.isError) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="at-eyebrow">{t("admin.audit.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-semibold">{t("admin.audit.title")}</h2>
          </div>
        </div>
        <p className="text-sm text-destructive">
          {t("admin.audit.error")}
        </p>
      </div>
    );
  }

  const rows = logs.data ?? [];

  const columns: ColumnDef<AuditLogRow>[] = [
    {
      accessorKey: "created_at",
      header: t("admin.audit.col.date"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {new Date(row.original.created_at).toLocaleString(t("locale") as string, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: t("admin.audit.col.action"),
      cell: ({ row }) => (
        <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {AUDIT_ACTION_LABEL[row.original.action] ?? row.original.action}
        </span>
      ),
    },
    {
      accessorKey: "entity",
      header: t("admin.audit.col.entity"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.entity}
          {row.original.entity_id ? (
            <span className="ml-1 font-mono text-[10px]">
              ({row.original.entity_id.slice(0, 8)}…)
            </span>
          ) : null}
        </span>
      ),
    },
    {
      id: "details",
      header: t("admin.audit.col.details"),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.user_name ? <span>{row.original.user_name} · </span> : null}
          {row.original.details ? JSON.stringify(row.original.details) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.audit.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.audit.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.audit.description")}
          </p>
        </div>
      </div>
      <div>
        <DataTable
          columns={columns}
          data={rows}
          searchKey="action"
          searchPlaceholder={t("admin.audit.search")}
          emptyTitle={t("admin.audit.empty")}
        />
      </div>
    </div>
  );
}
