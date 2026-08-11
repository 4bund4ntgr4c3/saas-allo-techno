import { Route } from "@/routes/_authenticated/admin";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/site/QrCode";
import { confirmOtp, disableOtp, enrollOtp } from "@/lib/otp.functions";
import { getSecurityStats } from "@/lib/security.functions";
import { getMetrics } from "@/lib/monitoring.functions";
import { field } from "@/components/admin/primitives/AdminField";
import { useI18n } from "@/lib/i18n/context";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

function SecuritySection() {
  const { t } = useI18n();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const otp = useQuery({
    queryKey: ["otp", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_otp")
        .select("secret, enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const enrollFn = useServerFn(enrollOtp);
  const confirmFn = useServerFn(confirmOtp);
  const disableFn = useServerFn(disableOtp);

  const enroll = useMutation({
    mutationFn: async () => enrollFn(),
    onSuccess: (res) => {
      setPendingSecret(res.secret);
      setPendingUri(res.uri);
      toast.success(t("admin.security.toast.scanQr"));
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("admin.security.toast.operationFailed")),
  });

  const confirm = useMutation({
    mutationFn: async () => confirmFn({ data: { code } }),
    onSuccess: () => {
      toast.success(t("admin.security.toast.2faEnabled"));
      setPendingSecret(null);
      setPendingUri(null);
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["otp", user.id] });
      queryClient.invalidateQueries({ queryKey: ["otp-enabled", user.id] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("admin.security.toast.invalidCode")),
  });

  const disable = useMutation({
    mutationFn: async () => disableFn({ data: { code } }),
    onSuccess: () => {
      toast.success(t("admin.security.toast.2faDisabled"));
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["otp", user.id] });
      queryClient.invalidateQueries({ queryKey: ["otp-enabled", user.id] });
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("admin.security.toast.invalidCode")),
  });

  const enrolling = pendingSecret !== null;

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.security.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.security.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.security.description")}
          </p>
        </div>
      </div>

      <RateLimitPanel />

      <MetricsPanel />

      {enrolling ? (
        <div className="mt-6 space-y-5 border border-border bg-card p-6">
          <p className="text-sm">
            1. {t("admin.security.enroll.step1")}
          </p>
          <QrCode
            value={pendingUri ?? ""}
            size={180}
            label={t("admin.security.enroll.totpKey")}
            caption={t("admin.security.enroll.qrCaption")}
          />
          <p className="break-all font-mono text-xs text-muted-foreground">{pendingSecret}</p>
          <p className="text-sm">2. {t("admin.security.enroll.step2")}</p>
          <div className="flex gap-3">
            <input
              className={`${field} max-w-40 text-center font-mono tracking-widest`}
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button
              disabled={confirm.isPending || code.length !== 6}
              onClick={() => confirm.mutate()}
            >
              {confirm.isPending ? t("admin.security.enroll.verifying") : t("admin.security.enroll.activate")}
            </Button>
          </div>
        </div>
      ) : otp.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : otp.data?.enabled ? (
        <div className="mt-6 space-y-4 border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <ShieldCheck className="size-4" />
            {t("admin.security.status.active")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("admin.security.status.activeDesc")}
          </p>
          <div className="flex flex-wrap gap-3">
            <input
              className={`${field} max-w-40 text-center font-mono tracking-widest`}
              inputMode="numeric"
              maxLength={6}
              placeholder={t("admin.security.status.currentCode")}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button
              variant="outline"
              disabled={disable.isPending || code.length !== 6}
              onClick={() => disable.mutate()}
            >
              {t("admin.security.status.disable")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4 border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="size-4" />
            {t("admin.security.status.inactive")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("admin.security.status.inactiveDesc")}
          </p>
          <Button disabled={enroll.isPending} onClick={() => enroll.mutate()}>
            {enroll.isPending ? t("admin.security.enroll.preparing") : t("admin.security.enroll.enable2fa")}
          </Button>
        </div>
      )}
    </div>
  );
}

function RateLimitPanel() {
  const { t } = useI18n();
  const getSecurityStatsFn = useServerFn(getSecurityStats);
  const stats = useQuery({
    queryKey: ["rate-limit-stats"],
    queryFn: () => getSecurityStatsFn(),
    refetchInterval: 15_000,
  });

  const rateLimitColumns: ColumnDef<{ key: string; count: number; resetIn: number }>[] = [
    { accessorKey: "key", header: t("admin.security.rateLimit.key") },
    { accessorKey: "count", header: t("admin.security.rateLimit.requests") },
    { accessorKey: "resetIn", header: t("admin.security.rateLimit.expiresIn") },
  ];

  return (
    <div className="mt-6 rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{t("admin.security.rateLimit.title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("admin.security.rateLimit.description")}
      </p>
      {stats.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : stats.data ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-sm border border-border p-3 text-center">
              <p className="font-mono text-2xl font-bold">{stats.data.totalBuckets}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("admin.security.rateLimit.activeBuckets")}</p>
            </div>
            <div className="rounded-sm border border-border p-3 text-center">
              <p className="font-mono text-2xl font-bold">{stats.data.activeBuckets}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("admin.security.rateLimit.inWindow")}</p>
            </div>
            <div className="rounded-sm border border-border p-3 text-center">
              <p
                className={`font-mono text-2xl font-bold ${stats.data.blockedBuckets > 0 ? "text-destructive" : ""}`}
              >
                {stats.data.blockedBuckets}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("admin.security.rateLimit.nearBlock")}</p>
            </div>
          </div>
          {stats.data.buckets.length > 0 && (
            <DataTable columns={rateLimitColumns} data={stats.data.buckets} pageSize={10} />
          )}
        </div>
      ) : null}
    </div>
  );
}

const METRIC_LABEL: Record<string, string> = {
  reservation_created: "Réservation créée",
  reservation_completed: "Réservation terminée",
  payment_processed: "Paiement traité",
  payment_failed: "Paiement échoué",
  review_submitted: "Avis soumis",
  lead_created: "Lead créé",
  quote_sent: "Devis envoyé",
  quote_approved: "Devis approuvé",
  quote_declined: "Devis refusé",
};

function MetricsPanel() {
  const { t } = useI18n();
  const getMetricsFn = useServerFn(getMetrics);
  const metrics = useQuery({
    queryKey: ["metrics-summary"],
    queryFn: () => getMetricsFn(),
    refetchInterval: 30_000,
  });

  const metricColumns: ColumnDef<{ name: string; count: number }>[] = [
    {
      accessorKey: "name",
      header: t("admin.security.metrics.event"),
      cell: (info) => (
        <span className="inline-block rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {METRIC_LABEL[info.getValue() as string] ?? info.getValue() as string}
        </span>
      ),
    },
    { accessorKey: "count", header: t("admin.security.metrics.count") },
  ];

  return (
    <div className="mt-6 rounded-sm border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{t("admin.security.metrics.title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("admin.security.metrics.description")}
      </p>
      {metrics.isLoading ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : metrics.data && metrics.data.length > 0 ? (
        <div className="mt-4">
          <DataTable columns={metricColumns} data={metrics.data} pageSize={10} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t("admin.security.metrics.empty")}</p>
      )}
    </div>
  );
}

export { SecuritySection, RateLimitPanel, MetricsPanel };
