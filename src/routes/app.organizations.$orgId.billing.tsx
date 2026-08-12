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
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog/company";
import { useI18n } from "@/lib/i18n/context";
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

  const [showGenerate, setShowGenerate] = useState(false);
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [notes, setNotes] = useState("");

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
          {org?.member_role && ["admin_org", "comptabilite"].includes(org.member_role) && (
            <Button variant="primaryBlock" onClick={() => setShowGenerate(!showGenerate)}>
              {showGenerate ? <X className="size-4" /> : <Plus className="size-4" />}
              {t("org.billing.generate")}
            </Button>
          )}
        </div>
      </div>

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
