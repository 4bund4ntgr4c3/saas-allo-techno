import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/data/catalog";
import { STATUS_LABEL } from "@/lib/reservation-schema";
import { getAdminKpis } from "@/lib/admin.functions";
import { exportPaymentsCsv } from "@/lib/export.functions";
import { useI18n } from "@/lib/i18n/context";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

function ExportPaymentsButton() {
  const { t } = useI18n();
  const fn = useServerFn(exportPaymentsCsv);
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    try {
      const res = await fn();
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(res.csv, `paiements-allotechno-${date}.csv`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.export.error"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={run}>
      {pending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 size-4" />
      )}
      {t("admin.kpis.exportPayments")}
    </Button>
  );
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function shortDate(iso: string): string {
  return `${iso.slice(8)}/${iso.slice(5, 7)}`;
}

function KpisSection() {
  const { t } = useI18n();
  const getKpisFn = useServerFn(getAdminKpis);

  const kpis = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: () => getKpisFn({ data: {} }),
    refetchInterval: 5 * 60 * 1000,
  });

  if (kpis.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("admin.kpis.loading")}</p>;
  }

  if (kpis.isError || !kpis.data) {
    return (
      <div>
        <h2 className="text-lg font-semibold">{t("admin.kpis.title")}</h2>
        <p className="mt-4 text-sm text-destructive">
          {t("admin.kpis.error")}
        </p>
      </div>
    );
  }

  const data = kpis.data;
  const totalRevenue = data.dailyRevenue.reduce((sum, d) => sum + d.amount, 0);
  const longestStage = data.avgStageDuration[0]?.avgHours ?? 0;
  const maxFault = data.topFaults[0]?.count ?? 0;
  const { quotesSent, quotesApproved, paid, rate } = data.quoteConversion;
  const approvedShare = quotesSent > 0 ? Math.round((quotesApproved / quotesSent) * 100) : 0;
  const paidShare = quotesSent > 0 ? Math.round((paid / quotesSent) * 100) : 0;

  const revenueChartConfig = {
    revenu: { label: t("admin.kpis.chart.revenu"), color: "var(--primary)" },
  } satisfies ChartConfig;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("admin.kpis.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.kpis.description")}
          </p>
        </div>
        <ExportPaymentsButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">{t("admin.kpis.revenue")}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{formatFcfa(totalRevenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.kpis.revenueDesc")}
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">{t("admin.kpis.quotesSent")}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{quotesSent}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.kpis.quotesSentDesc")}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">{t("admin.kpis.quotesApproved")}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{quotesApproved}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.kpis.quotesApprovedDesc")}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="at-eyebrow">{t("admin.kpis.paymentsReceived")}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{paid}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("admin.kpis.paymentsReceivedDesc")}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">{t("admin.kpis.conversion")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.kpis.conversionDesc")}
          </p>
          <p className="mt-4 text-3xl font-bold tabular-nums">{rate}%</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-muted-foreground">{t("admin.kpis.quotesSent")}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                <div className="h-full bg-primary/70" style={{ width: "100%" }} />
              </div>
              <span className="w-12 text-right font-mono text-xs tabular-nums">{quotesSent}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-muted-foreground">{t("admin.kpis.quotesApproved")}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                <div className="h-full bg-primary/70" style={{ width: `${approvedShare}%` }} />
              </div>
              <span className="w-12 text-right font-mono text-xs tabular-nums">
                {quotesApproved}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-40 shrink-0 truncate text-muted-foreground">{t("admin.kpis.paymentsReceived")}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                <div className="h-full bg-success/70" style={{ width: `${paidShare}%` }} />
              </div>
              <span className="w-12 text-right font-mono text-xs tabular-nums">{paid}</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">{t("admin.kpis.dailyRevenue")}</h3>
          <ChartContainer config={revenueChartConfig} className="mt-4 aspect-auto h-56">
            <BarChart data={data.dailyRevenue}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                tickFormatter={(v) => shortDate(String(v))}
                interval={4}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={48}
                tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent formatter={(value) => formatFcfa(Number(value))} />}
              />
              <Bar
                dataKey="amount"
                fill="var(--color-revenu)"
                radius={[2, 2, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">{t("admin.kpis.avgTimeByStage")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.kpis.avgTimeByStageDesc")}
          </p>
          <ul className="mt-4 space-y-2">
            {data.avgStageDuration.map((s) => (
              <li key={s.stage} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 truncate text-muted-foreground">
                  {STATUS_LABEL[s.stage] ?? s.stage}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface">
                  <div
                    className="h-full bg-primary/70"
                    style={{
                      width: `${longestStage > 0 ? Math.round((s.avgHours / longestStage) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">
                  {s.avgHours >= 24 ? `${Math.round(s.avgHours / 24)} j` : `${s.avgHours} h`}
                </span>
              </li>
            ))}
            {data.avgStageDuration.length === 0 && (
              <li className="text-sm text-muted-foreground">{t("admin.kpis.avgTimeByStageEmpty")}</li>
            )}
          </ul>
        </div>

        <div className="rounded-sm border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">{t("admin.kpis.topFaults")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("admin.kpis.topFaultsDesc")}
          </p>
          <ul className="mt-4 space-y-2">
            {data.topFaults.map((f) => (
              <li key={f.fault} className="flex items-center gap-3 text-sm">
                <span className="flex-1 truncate text-muted-foreground">{f.fault}</span>
                <div className="h-2 w-32 shrink-0 overflow-hidden rounded-sm bg-surface">
                  <div
                    className="h-full bg-primary/70"
                    style={{
                      width: `${maxFault > 0 ? Math.round((f.count / maxFault) * 100) : 0}%`,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums">
                  {f.count}
                </span>
              </li>
            ))}
            {data.topFaults.length === 0 && (
              <li className="text-sm text-muted-foreground">{t("admin.kpis.topFaultsEmpty")}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export { KpisSection };
