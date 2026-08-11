import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/audit.functions";
import { useI18n } from "@/lib/i18n/context";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminAuditEnriched() {
  const { t } = useI18n();
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-enriched", actionFilter, entityFilter, page],
    queryFn: () => getAuditLogs({ data: { offset: page * limit, limit } }),
  });

  const logs = data ?? [];
  const filteredLogs = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (entityFilter && log.entity !== entityFilter) return false;
    return true;
  });

  const actions = [...new Set(logs.map((l) => l.action))].sort();
  const entities = [...new Set(logs.map((l) => l.entity))].sort();

  const exportCsv = () => {
    const headers = ["Date", "Action", "Entity", "Entity ID", "User ID", "Details"];
    const rows = filteredLogs.map((l) => [
      l.created_at,
      l.action,
      l.entity,
      l.entity_id ?? "",
      l.user_id,
      JSON.stringify(l.details ?? {}),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("admin.audit.title")}</h2>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-1 size-3" />
          CSV
        </Button>
      </div>

      <div className="flex gap-2">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
        >
          <option value="">{t("admin.audit.filterAllActions")}</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(0); }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs"
        >
          <option value="">{t("admin.audit.filterAllEntities")}</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("admin.audit.loading")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{t("admin.audit.columnDate")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("admin.audit.columnAction")}</th>
                <th className="px-3 py-2 text-left font-medium">{t("admin.audit.columnEntity")}</th>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">{t("admin.audit.columnUser")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log, i) => (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="px-3 py-2 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2"><code className="rounded bg-muted px-1">{log.action}</code></td>
                  <td className="px-3 py-2">{log.entity}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{log.entity_id?.slice(0, 8) ?? "—"}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{(log.user_id ?? "").slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          {t("admin.audit.previous")}
        </Button>
        <span className="text-xs text-muted-foreground">{t("admin.audit.page", [page + 1])}</span>
        <Button variant="ghost" size="sm" disabled={filteredLogs.length < limit} onClick={() => setPage(page + 1)}>
          {t("admin.audit.next")}
        </Button>
      </div>
    </div>
  );
}
