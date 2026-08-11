import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog";
import {
  listRefundablePayments,
  initiateRefund,
  type RefundablePayment,
} from "@/lib/refund.functions";

export function RefundsSection() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const listFn = useServerFn(listRefundablePayments);
  const refundFn = useServerFn(initiateRefund);
  const [query, setQuery] = useState("");
  const [confirmPayment, setConfirmPayment] = useState<RefundablePayment | null>(null);
  const [reason, setReason] = useState("");

  const payments = useQuery({
    queryKey: ["admin-refundable-payments"],
    queryFn: () => listFn({ data: {} }),
  });

  const doRefund = useMutation({
    mutationFn: async () => {
      if (!confirmPayment) return;
      await refundFn({ data: { paymentId: confirmPayment.id, reason: reason.trim() } });
    },
    onSuccess: () => {
      toast.success(t("admin.refunds.toast.refundRecorded"));
      setConfirmPayment(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-refundable-payments"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.refunds.error.refundFailed")),
  });

  if (payments.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.refunds.loading")}</p>;
  }

  const rows = (payments.data ?? []).filter((p) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      p.reference.toLowerCase().includes(q) ||
      (p.customer_name ?? "").toLowerCase().includes(q) ||
      (p.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.refunds.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.refunds.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.refunds.description")}</p>
        </div>
      </div>
      <label htmlFor="refund-search" className="sr-only">
        {t("admin.refunds.searchLabel")}
      </label>
      <input
        id="refund-search"
        className={`${field} mt-4`}
        placeholder={t("admin.refunds.searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t("admin.refunds.empty")}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
                    {p.reference}
                  </span>
                  <p className="font-medium">{p.customer_name ?? t("admin.refunds.anonymous")}</p>
                  <Badge variant="outline" className="border-success/50 text-success">
                    {formatFcfa(p.amount)}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {p.method}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmPayment(p);
                    setReason("");
                  }}
                >
                  {t("admin.refunds.refundButton")}
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{p.phone ?? "—"}</span>
                <span>{p.source}</span>
                <span>{new Date(p.created_at).toLocaleString(t("locale") as string)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={confirmPayment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmPayment(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.refunds.dialog.title")}</DialogTitle>
            <DialogDescription>
              {t("admin.refunds.dialog.description", [confirmPayment ? `${confirmPayment.reference} (${formatFcfa(confirmPayment.amount)})` : ""])}
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="refund-reason" className="block">
            <span className="at-eyebrow mb-2 block">{t("admin.refunds.form.reason")}</span>
            <textarea
              id="refund-reason"
              className={`${field} min-h-20 py-1.5 text-xs`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("admin.refunds.form.reasonPlaceholder")}
              maxLength={500}
            />
          </label>
          {!reason.trim() && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="size-3" />
              {t("admin.refunds.form.reasonRequired")}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={doRefund.isPending}
              onClick={() => {
                setConfirmPayment(null);
                setReason("");
              }}
            >
              {t("admin.webhooks.form.cancel")}
            </Button>
            <Button
              variant="technical"
              disabled={doRefund.isPending || !reason.trim()}
              onClick={() => doRefund.mutate()}
            >
              {doRefund.isPending ? t("admin.refunds.processing") : t("admin.refunds.confirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
