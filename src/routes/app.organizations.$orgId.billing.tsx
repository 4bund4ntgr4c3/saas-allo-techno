import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Download,
  FileText,
  Plus,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ActiveContractCard } from "@/components/b2b/billing/ActiveContractCard";
import { EsgMetricsCard } from "@/components/b2b/billing/EsgMetricsCard";
import { GenerateInvoiceModal } from "@/components/b2b/billing/GenerateInvoiceModal";
import { formatFcfa } from "@/data/catalog/company";
import { useI18n } from "@/lib/i18n/context";
import { getOrgContractFn } from "@/lib/contracts.functions";
import { exportSyscohadaJournalFn } from "@/lib/accounting.functions";
import { getOrgEsgMetricsFn } from "@/lib/esg.functions";
import { initiateSlaPaymentFn } from "@/lib/b2b-payments.functions";
import { parseError } from "@/lib/error-parser";
import {
  createOrgInvoice,
  getMyOrganizations,
  getOrgInvoices,
  type OrgInvoice,
} from "@/lib/org.functions";

export const Route = createFileRoute("/app/organizations/$orgId/billing")({
  component: OrgBillingPage,
});

function OrgBillingPage() {
  const { orgId } = Route.useParams();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const orgs = useQuery({ queryKey: ["app", "orgs"], queryFn: () => getMyOrganizations() });
  const org = orgs.data?.find((o) => o.id === orgId);

  const invoices = useQuery({
    queryKey: ["app", "org", orgId, "invoices"],
    queryFn: () => getOrgInvoices({ data: { org_id: orgId } }),
    enabled: Boolean(org),
  });

  const contract = useQuery({
    queryKey: ["app", "org", orgId, "contract"],
    queryFn: () => getOrgContractFn({ data: { orgId } }),
    enabled: Boolean(org),
  });

  const esgQuery = useQuery({
    queryKey: ["app", "org", orgId, "esg"],
    queryFn: () => getOrgEsgMetricsFn({ data: { orgId } }),
    enabled: Boolean(org),
  });

  const [showGenerate, setShowGenerate] = useState(false);

  const handlePayMobileMoney = async () => {
    if (!contract.data) return;
    try {
      const res = await initiateSlaPaymentFn({
        data: {
          orgId,
          contractNumber: contract.data.contractNumber,
          amountFcfa: contract.data.monthlyPrice,
          provider: "fedapay",
          operator: "mtn",
        },
      });
      toast.success(res.instructions);
      if (res.checkoutUrl) {
        window.open(res.checkoutUrl, "_blank");
      }
    } catch (err) {
      const parsed = parseError(err, "Erreur lors de l'initialisation du paiement Mobile Money.");
      toast.error(parsed.message);
    }
  };

  const createInvoiceMut = useMutation({
    mutationFn: (data: { periodMonth: string; notes: string }) =>
      createOrgInvoice({
        data: {
          org_id: orgId,
          period_month: data.periodMonth,
          notes: data.notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(t("org.billing.generate.success"));
      setShowGenerate(false);
      queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "invoices"] });
    },
    onError: (err: unknown) => {
      const parsed = parseError(err, t("org.billing.generate.error"));
      toast.error(parsed.message);
    },
  });

  const handleExportSyscohada = async () => {
    try {
      const res = await exportSyscohadaJournalFn({ data: {} });
      const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `journal-syscohada-${new Date().toISOString().slice(0, 7)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Journal comptable SYSCOHADA exporté avec succès (TVA 18%) !");
    } catch (err) {
      const parsed = parseError(err, "Erreur lors de l'exportation du journal SYSCOHADA.");
      toast.error(parsed.message);
    }
  };

  const STATUS_BADGE: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-amber-500/15 text-amber-600 border-amber-500/20",
    paid: "bg-success/15 text-success border-success/20",
    cancelled: "bg-destructive/15 text-destructive border-destructive/20",
  };

  const invoiceList = invoices.data ?? [];
  const totalAmount = invoiceList.reduce((sum, inv) => sum + (inv.total_ttc ?? 0), 0);
  const paidCount = invoiceList.filter((i) => i.status === "paid").length;
  const pendingCount = invoiceList.filter((i) => i.status === "sent").length;

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
            <span className="at-eyebrow mb-1 block">{t("org.nav.billing")}</span>
            <h1 className="at-display text-2xl font-bold">{t("org.billing.title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("org.billing.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSyscohada}
              className="gap-1.5 font-mono text-xs"
            >
              <Download className="size-3.5" />
              <span>Export SYSCOHADA (TVA 18%)</span>
            </Button>
            {org.member_role && ["admin_org", "comptabilite"].includes(org.member_role) && (
              <Button onClick={() => setShowGenerate(true)}>
                <Plus className="size-4 mr-1" />
                {t("org.billing.generate")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Active SLA Contract Banner Extraite ─── */}
      {contract.data && (
        <ActiveContractCard
          contract={contract.data}
          onPayMobileMoney={handlePayMobileMoney}
        />
      )}

      {/* ─── RSE & Bilan Carbone Card Extraite ─── */}
      {esgQuery.data && <EsgMetricsCard metrics={esgQuery.data} />}

      {/* ─── KPI Cards ─── */}
      <div className="at-in grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 border border-border bg-card p-4 rounded-lg">
          <div className="flex size-10 items-center justify-center bg-muted text-primary rounded-md">
            <Receipt className="size-5" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold tabular-nums">{formatFcfa(totalAmount)}</p>
            <p className="text-xs text-muted-foreground">{t("org.billing.kpi.total")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4 rounded-lg">
          <div className="flex size-10 items-center justify-center bg-muted text-success rounded-md">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold tabular-nums">{paidCount}</p>
            <p className="text-xs text-muted-foreground">{t("org.billing.kpi.paid")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4 rounded-lg">
          <div className="flex size-10 items-center justify-center bg-muted text-amber-600 rounded-md">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold tabular-nums">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{t("org.billing.kpi.pending")}</p>
          </div>
        </div>
      </div>

      {/* ─── Generate Invoice Modale Extraite ─── */}
      <GenerateInvoiceModal
        isOpen={showGenerate}
        onClose={() => setShowGenerate(false)}
        onSubmit={(data) => createInvoiceMut.mutate(data)}
        isPending={createInvoiceMut.isPending}
      />

      {/* ─── Invoices Table ─── */}
      <div className="at-in">
        <span className="at-eyebrow mb-3 block">{t("org.billing.list.title")}</span>

        <div className="overflow-hidden border border-border bg-card rounded-lg">
          {invoices.isLoading ? (
            <LoadingState message={t("common.loading")} />
          ) : invoiceList.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={t("org.billing.empty.title")}
              description={t("org.billing.empty.text")}
              action={
                <Button size="sm" onClick={() => setShowGenerate(true)}>
                  <Plus className="size-4 mr-1" />
                  {t("org.billing.generate")}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t("org.billing.table.number")}</th>
                    <th className="px-4 py-3 font-semibold">{t("org.billing.table.period")}</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      {t("org.billing.table.amount")}
                    </th>
                    <th className="px-4 py-3 font-semibold text-center">
                      {t("org.billing.table.status")}
                    </th>
                    <th className="px-4 py-3 font-semibold">{t("org.billing.table.dueDate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoiceList.map((inv: OrgInvoice) => (
                    <tr key={inv.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono font-medium">{inv.reference}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.period_month ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {formatFcfa(inv.total_ttc)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            STATUS_BADGE[inv.status] ?? ""
                          }`}
                        >
                          {t(`org.billing.status.${inv.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.issued_at ? (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(inv.issued_at).toLocaleDateString("fr-FR")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
