import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n/context";
import { getAuditLogs } from "@/lib/audit.functions";

const AUDIT_ACTION_LABEL: Record<string, string> = {
  "reservation.status_changed": "Statut changé",
  "reservation.cancelled": "Réservation annulée",
  "reservation.assigned": "Technicien assigné",
  "quote.sent": "Devis envoyé",
  "quote.approved": "Devis approuvé",
  "quote.declined": "Devis refusé",
  "payment.confirmed": "Paiement confirmé",
  "payment.refunded": "Paiement remboursé",
  "review.published": "Avis publié",
  "review.hidden": "Avis masqué",
  "lead.status_changed": "Lead mis à jour",
  "claim.status_changed": "Réclamation mise à jour",
  "user.role_changed": "Rôle modifié",
  "stock.updated": "Stock mis à jour",
  "blog.post_created": "Article créé",
  "blog.post_updated": "Article mis à jour",
};

export function AuditSection() {
  const { t } = useI18n();
  const getLogsFn = useServerFn(getAuditLogs);

  const logs = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getLogsFn({ data: {} }),
  });

  if (logs.isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement du journal…</p>;
  }

  if (logs.isError) {
    return (
      <div>
        <h2 className="text-lg font-semibold">{t("admin.audit.title")}</h2>
        <p className="mt-4 text-sm text-destructive">
          Impossible de charger le journal d'audit. Réessayez.
        </p>
      </div>
    );
  }

  const rows = logs.data ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold">{t("admin.audit.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Historique des opérations effectuées par le personnel (100 dernières entrées).
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("admin.audit.empty")}</p>
      ) : (
        <div className="mt-6 overflow-x-auto border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left">Entité</th>
                <th className="px-4 py-2 text-left">Détails</th>
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
