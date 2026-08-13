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
  Loader2,
  Plus,
  Receipt,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { useI18n } from "@/lib/i18n/context";
import { getOrgContractFn } from "@/lib/contracts.functions";
import { exportSyscohadaJournalFn } from "@/lib/accounting.functions";
import { getOrgEsgMetricsFn } from "@/lib/esg.functions";
import { initiateSlaPaymentFn } from "@/lib/b2b-payments.functions";
import { Leaf, PhoneCall } from "lucide-react";
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
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState("");

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
    } catch {
      toast.error("Erreur lors de l'initialisation du paiement Mobile Money.");
    }
  };

  const createInvoiceMut = useMutation({
    mutationFn: () =>
      createOrgInvoice({
        data: {
          org_id: orgId,
          period_month: periodMonth,
          notes: notes || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(t("org.billing.generate.success"));
      setShowGenerate(false);
      queryClient.invalidateQueries({ queryKey: ["app", "org", orgId, "invoices"] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t("org.billing.generate.error"));
    },
  });

  const handleExportSyscohada = async () => {
    try {
      const res = await exportSyscohadaJournalFn({ data: {} });
      const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `journal-syscohada-${periodMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Journal comptable SYSCOHADA exporté avec succès (TVA 18%) !");
    } catch {
      toast.error("Erreur lors de l'exportation du journal SYSCOHADA.");
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
          {org?.name ?? t("org.detail.back")}
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
            {org?.member_role && ["admin_org", "comptabilite"].includes(org.member_role) && (
              <Button variant="primaryBlock" onClick={() => setShowGenerate(!showGenerate)}>
                {showGenerate ? <X className="size-4" /> : <Plus className="size-4" />}
                {t("org.billing.generate")}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Active SLA Contract Banner ─── */}
      {contract.data && (
        <div className="border border-primary/40 bg-primary/5 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 at-in">
          <div className="flex items-center gap-4">
            <div className="size-12 border border-primary bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-base font-extrabold uppercase">
                  Contrat SLA Actif — {contract.data.contractNumber}
                </h3>
                <Badge
                  variant="outline"
                  className="border-success text-success bg-success/10 uppercase font-mono text-[10px]"
                >
                  {contract.data.formula} SLA
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Engagements :{" "}
                <strong className="text-foreground">
                  Garantie Prise en Charge {contract.data.responseSlaHours}h
                </strong>{" "}
                ·{" "}
                <strong className="text-foreground">
                  Résolution {contract.data.resolutionSlaHours}h
                </strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-primary/20 pt-3 md:pt-0 md:pl-6">
            <div>
              <span className="at-eyebrow text-[10px] text-muted-foreground block">
                Forfait Mensuel
              </span>
              <span className="font-mono text-lg font-bold text-primary">
                {formatFcfa(contract.data.monthlyPrice)} /mois
              </span>
            </div>
            <div>
              <span className="at-eyebrow text-[10px] text-muted-foreground block">
                Flotte Couverte
              </span>
              <span className="font-mono text-sm font-bold">
                {contract.data.coveredEquipmentCount} / {contract.data.equipmentLimit} appareils
              </span>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handlePayMobileMoney}
              className="gap-1.5 font-mono text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <PhoneCall className="size-3.5" />
              <span>Payer SLA (Mobile Money)</span>
            </Button>
          </div>
        </div>
      )}

      {/* ─── RSE & Bilan Carbone Card ─── */}
      {esgQuery.data && (
        <div className="border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3 at-in">
          <div className="flex items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Leaf className="size-5 text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-emerald-950 dark:text-emerald-200">
                Bilan Carbone & Impact RSE Entreprise
              </h3>
            </div>
            <Badge variant="outline" className="border-emerald-600/40 text-emerald-600 bg-emerald-500/10 font-mono text-[10px]">
              {esgQuery.data.reportPeriod}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="border border-emerald-500/20 bg-background/60 p-3">
              <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">Émissions CO₂ Évitées</span>
              <span className="font-mono text-2xl font-extrabold text-emerald-600">{esgQuery.data.co2EmissionsAvoidedKg} kg</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Équivalent fabrication neuve</span>
            </div>
            <div className="border border-emerald-500/20 bg-background/60 p-3">
              <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">Déchets Électroniques Évités</span>
              <span className="font-mono text-2xl font-extrabold text-emerald-600">{esgQuery.data.electronicWasteSavedKg} kg</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Recyclage & Reconditionnement</span>
            </div>
            <div className="border border-emerald-500/20 bg-background/60 p-3">
              <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">Taux d'Économie Circulaire</span>
              <span className="font-mono text-2xl font-extrabold text-emerald-600">{esgQuery.data.circularEconomyScorePercent}%</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Défense du cycle de vie</span>
            </div>
            <div className="border border-emerald-500/20 bg-background/60 p-3">
              <span className="at-eyebrow text-[10px] text-muted-foreground block mb-1">Économies Financières CAPEX</span>
              <span className="font-mono text-xl font-extrabold text-primary">{formatFcfa(esgQuery.data.financialSavingsFcfa)}</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">vs réapprovisionnement neuf</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── KPI Cards ─── */}
      <div className="at-in grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-primary">
            <Receipt className="size-5" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold tabular-nums">{formatFcfa(totalAmount)}</p>
            <p className="text-xs text-muted-foreground">{t("org.billing.kpi.total")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-success">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold tabular-nums">{paidCount}</p>
            <p className="text-xs text-muted-foreground">{t("org.billing.kpi.paid")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border border-border bg-card p-4">
          <div className="flex size-10 items-center justify-center bg-muted text-amber-600">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="font-mono text-xl font-bold tabular-nums">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">{t("org.billing.kpi.pending")}</p>
          </div>
        </div>
      </div>

      {/* ─── Generate Invoice Form ─── */}
      {showGenerate && (
        <div className="at-in border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold">{t("org.billing.generate.title")}</h3>
            <button
              type="button"
              onClick={() => setShowGenerate(false)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">{t("org.billing.form.month")}</Label>
              <Input
                type="month"
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs">{t("org.billing.form.notes")}</Label>
              <Input
                placeholder="Ex: PO-2026-HQ-08"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setShowGenerate(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              size="sm"
              variant="primaryBlock"
              disabled={createInvoiceMut.isPending}
              onClick={() => createInvoiceMut.mutate()}
            >
              {createInvoiceMut.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileText className="size-4" />
              )}
              {t("org.billing.generate.submit")}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Invoice List ─── */}
      <div className="at-in" style={{ animationDelay: "120ms" }}>
        <span className="at-eyebrow mb-3 block">{t("org.billing.list.title")}</span>

        <div className="overflow-hidden border border-border bg-card">
          {invoices.isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoiceList.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">{t("org.billing.empty.title")}</p>
              <p className="mx-auto mt-1.5 max-w-sm text-xs text-muted-foreground">
                {t("org.billing.empty.text")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoiceList.map((inv: OrgInvoice) => (
                <div
                  key={inv.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-foreground">
                        {inv.reference}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${STATUS_BADGE[inv.status]}`}
                      >
                        {t(`org.billing.status.${inv.status}`)}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      <span>
                        {t("org.billing.period")}: {inv.period_month}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(inv.issued_at).toLocaleDateString("fr-FR", {
                          dateStyle: "medium",
                        })}
                      </span>
                    </p>
                    {inv.notes && (
                      <p className="text-[11px] italic text-muted-foreground">{inv.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Total TTC
                      </p>
                      <p className="font-mono text-lg font-extrabold tabular-nums text-foreground">
                        {formatFcfa(inv.total_ttc)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        toast.info(`${t("org.billing.download")} ${inv.reference}...`);
                        window.print();
                      }}
                    >
                      <Download className="size-3.5" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
