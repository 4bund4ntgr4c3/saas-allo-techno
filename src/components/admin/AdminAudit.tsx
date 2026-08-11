import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n/context";
import { getAuditLogs } from "@/lib/audit.functions";

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
      <div>
        <h2 className="text-lg font-semibold">{t("admin.audit.title")}</h2>
        <p className="mt-4 text-sm text-destructive">
          {t("admin.audit.error")}
        </p>
      </div>
    );
  }

  const rows = logs.data ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold">{t("admin.audit.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("admin.audit.description")}
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("admin.audit.empty")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left">{t("admin.audit.col.date")}</th>
                <th className="px-4 py-2 text-left">{t("admin.audit.col.action")}</th>
                <th className="px-4 py-2 text-left">{t("admin.audit.col.entity")}</th>
                <th className="px-4 py-2 text-left">{t("admin.audit.col.details")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface"
                >
                  <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                    {new Date(row.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {AUDIT_ACTION_LABEL[row.action] ?? row.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {row.entity}
                    {row.entity_id ? (
                      <span className="ml-1 font-mono text-[10px]">
                        ({row.entity_id.slice(0, 8)}…)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {row.user_name ? <span>{row.user_name} · </span> : null}
                    {row.details ? JSON.stringify(row.details) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
