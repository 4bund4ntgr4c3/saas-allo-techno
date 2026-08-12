import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatFcfa } from "@/data/catalog";
import { field } from "@/components/admin/primitives/AdminField";
import { useI18n } from "@/lib/i18n/context";

const ORDER_STATUS_OPTIONS = ["nouveau", "en_cours", "livre", "cloture"] as const;

const PAYMENT_BADGE_TONE: Record<string, string> = {
  paid: "border-success/50 text-success",
  pending: "border-amber-500/50 text-amber-500",
  failed: "border-destructive/50 text-destructive",
  refunded: "border-border text-muted-foreground",
};

export function extractOrderTotal(message: string | null): number | null {
  if (!message) return null;
  const matches = [...message.matchAll(/Total\s*:\s*([\d\s\u00A0]+)\s*FCFA/g)];
  if (matches.length === 0) return null;
  const group = matches[matches.length - 1]?.[1];
  if (!group) return null;
  const raw = group.replace(/[\s\u00A0]/g, "");
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

type OrderRow = {
  id: string;
  reference: string | null;
  name: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export function OrdersSection() {
  const { t } = useI18n();

  const ORDER_STATUS_LABEL: Record<string, string> = {
    nouveau: t("admin.orders.status.new"),
    en_cours: t("admin.orders.status.processing"),
    livre: t("admin.orders.status.delivered"),
    cloture: t("admin.orders.status.closed"),
  };

  const PAYMENT_STATUS_LABEL: Record<string, string> = {
    paid: t("admin.orders.payment.paid"),
    pending: t("admin.orders.payment.pending"),
    failed: t("admin.orders.payment.failed"),
    refunded: t("admin.orders.payment.refunded"),
  };

  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("id, reference, name, phone, message, status, created_at")
        .eq("source", "boutique")
        .order("created_at", { ascending: false })
        .limit(200);
      if (leadsError) throw leadsError;
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("reference, status, amount, created_at")
        .eq("source", "boutique")
        .order("created_at", { ascending: true });
      if (paymentsError) throw paymentsError;
      return { orders: leadsData ?? [], payments: paymentsData ?? [] };
    },
  });

  const paymentByReference = useMemo(() => {
    const map = new Map<string, { status: string; amount: number | null }>();
    for (const p of orders.data?.payments ?? []) {
      map.set(p.reference, { status: p.status, amount: p.amount });
    }
    return map;
  }, [orders.data?.payments]);

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.orders.error.update")),
  });

  const rows = (orders.data?.orders ?? []).filter((o: OrderRow) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      (o.reference ?? "").toLowerCase().includes(q) ||
      (o.name ?? "").toLowerCase().includes(q) ||
      (o.phone ?? "").toLowerCase().includes(q)
    );
  });

  if (orders.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.orders.loading")}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.orders.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.orders.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.orders.description")}</p>
        </div>
      </div>
      <label htmlFor="orders-search" className="sr-only">
        {t("admin.orders.searchLabel")}
      </label>
      <input
        id="orders-search"
        className={field}
        placeholder={t("admin.orders.search")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("admin.orders.empty")}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((o) => {
            const payment = paymentByReference.get(o.reference ?? "") ?? null;
            const total = extractOrderTotal(o.message);
            return (
              <li key={o.id} className="border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-primary/50 px-3 py-1 font-mono text-xs font-bold text-primary">
                      {o.reference ?? "—"}
                    </span>
                    <p className="font-medium">{o.name ?? t("admin.orders.anonymous")}</p>
                    <Badge
                      variant="outline"
                      className={
                        payment
                          ? (PAYMENT_BADGE_TONE[payment.status] ??
                            "border-border text-muted-foreground")
                          : "border-border text-muted-foreground"
                      }
                    >
                      {payment
                        ? `${PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}${
                            payment.amount != null ? ` · ${formatFcfa(payment.amount)}` : ""
                          }`
                        : t("admin.orders.unpaid")}
                    </Badge>
                  </div>
                  <select
                    className={`${field} max-w-40 py-1.5 text-xs`}
                    value={o.status}
                    disabled={setStatus.isPending}
                    onChange={(e) => setStatus.mutate({ id: o.id, status: e.target.value })}
                  >
                    {ORDER_STATUS_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {ORDER_STATUS_LABEL[value]}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {o.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{o.phone ?? "—"}</span>
                  {total !== null && <span className="font-mono">{formatFcfa(total)}</span>}
                  <span>{new Date(o.created_at).toLocaleString(t("locale") as string)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
