// Tableau de bord « Statistiques » de l'administration : données réelles
// calculées depuis la base (réservations, leads), agrégées côté client.
// Aucune librairie de graphique : barres et grilles en divs Tailwind.

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n/context";
import { computeEstimate } from "@/lib/estimate";
import { formatFcfa } from "@/data/catalog/company";
import { BRANDS } from "@/data/catalog/static";
import type { Enums } from "@/integrations/supabase/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { exportDashboardXlsx } from "@/lib/export.functions";
import { DataTable } from "@/components/admin/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

type Status = Enums<"reservation_status">;
type SlotPeriod = Enums<"slot_period">;

type ReservationRow = {
  id: string;
  reference: string | null;
  customer_name: string;
  device: string;
  issue: string;
  status: Status;
  slot_date: string;
  slot_period: SlotPeriod;
  mode: string;
  payment: string;
  created_at: string;
};

type LeadRow = {
  source: string;
  status: string;
  message: string | null;
  created_at: string;
};

const STATUS_ORDER: Status[] = [
  "en_attente",
  "confirmee",
  "pieces",
  "en_cours",
  "pret",
  "livre",
  "terminee",
  "annulee",
];

const PAYMENT_ORDER = ["mtn", "moov", "celtiis", "especes"] as const;

const STATUS_COLORS: Record<Status, string> = {
  en_attente: "#a1a1aa",
  confirmee: "var(--color-primary, #f97316)",
  pieces: "#f59e0b",
  en_cours: "var(--color-primary, #f97316)",
  pret: "#22c55e",
  livre: "#22c55e",
  terminee: "#10b981",
  annulee: "#ef4444",
};

const REVENUE_MONTHLY_CONFIG = {
  revenue: { label: "Revenus", color: "var(--primary)" },
} satisfies ChartConfig;

const STATUS_DISTRIBUTION_CONFIG: ChartConfig = Object.fromEntries(
  STATUS_ORDER.map((status) => [status, { label: status, color: STATUS_COLORS[status] }]),
);

const PERIOD_ORDER: SlotPeriod[] = ["matin", "apres-midi"];

const WEEKDAY_ORDER = [0, 1, 2, 3, 4, 5, 6] as const;

const BRAND_NAMES = [...BRANDS.map((b) => b.name)].sort((a, b) => b.length - a.length);

// « Total : 30 000 FCFA » (espace fine insécable entre les groupes de chiffres).
const BOUTIQUE_TOTAL_RE = /Total\s*[:：]?\s*([\d\s]+)\s*FCFA/;

function isoMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

function isSameMonth(a: string, b: string): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth();
}

function brandOfDevice(device: string): string | null {
  const lower = device.toLowerCase();
  for (const name of BRAND_NAMES) {
    const n = name.toLowerCase();
    if (n && lower.includes(n)) return name;
  }
  return null;
}

function parseBoutiqueTotal(message: string | null): number {
  if (!message) return 0;
  try {
    const match = message.match(BOUTIQUE_TOTAL_RE);
    if (!match?.[1]) return 0;
    const n = Number(match[1].replace(/\D/g, ""));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Estimation heuristique du prix d'une réparation à partir du catalogue
 * statique (recherche d'appareil + correspondance de panne), comme invoice.ts.
 * Ne lève jamais : si l'appareil ou la panne est inconnu, renvoie 0.
 */
async function estimateRepairPrice(
  deviceName: string,
  issueLabel: string,
): Promise<{ found: boolean; total: number }> {
  try {
    const { searchDevices } = await import("@/lib/catalog-search");
    const match = searchDevices(deviceName)[0]?.device;
    if (!match) return { found: false, total: 0 };
    const q = issueLabel.trim().toLowerCase();
    const fault = match.faults.find(
      (f) =>
        f.label.toLowerCase() === q ||
        f.label.toLowerCase().includes(q) ||
        q.includes(f.label.toLowerCase()),
    );
    if (!fault) return { found: false, total: 0 };
    return { found: true, total: computeEstimate([fault]).total };
  } catch {
    return { found: false, total: 0 };
  }
}

function formatShortDate(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function KpiCard({
  label,
  value,
  sub,
  trend,
  visible = true,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { value: number; label: string } | null;
  visible?: boolean;
}) {
  if (!visible) return null;
  const up = trend && trend.value > 0;
  const down = trend && trend.value < 0;
  return (
    <div className="border border-border bg-card p-4">
      <p className="at-eyebrow">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
        {trend ? (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
              up ? "text-green-600" : down ? "text-red-500" : "text-muted-foreground"
            }`}
          >
            {up ? (
              <TrendingUp className="size-3" />
            ) : down ? (
              <TrendingDown className="size-3" />
            ) : null}
            {up ? "+" : ""}
            {trend.value}%
          </span>
        ) : null}
      </div>
    </div>
  );
}

function BarRow({ label, count, total }: { label: string; count: number; total: number }) {
  const width = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden bg-surface">
        <div className="h-full bg-primary/70" style={{ width: `${width}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-xs tabular-nums">{count}</span>
      <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">
        {width}%
      </span>
    </div>
  );
}

export function StatsDashboard() {
  const { t, locale } = useI18n();

  const reservationsQuery = useQuery({
    queryKey: ["admin-stats-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select(
          "id, reference, customer_name, device, issue, status, slot_date, slot_period, mode, payment, created_at",
        )
        .gte("created_at", isoMonthsAgo(12))
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ReservationRow[];
    },
  });

  const leadsQuery = useQuery({
    queryKey: ["admin-stats-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("source, status, message, created_at")
        .gte("created_at", isoMonthsAgo(12))
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as LeadRow[];
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["admin-stats-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, status, created_at")
        .gte("created_at", isoMonthsAgo(12))
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as { amount: number; status: string; created_at: string }[];
    },
  });

  const nowIso = useMemo(() => new Date().toISOString(), []);

  const [repairRevenue, setRepairRevenue] = useState({ total: 0, matched: 0 });
  const [revenueReady, setRevenueReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let total = 0;
    let matched = 0;
    const cache = new Map<string, number>();
    (async () => {
      for (const r of reservationsQuery.data ?? []) {
        if (!isSameMonth(r.created_at, nowIso)) continue;
        const key = `${r.device}||${r.issue}`;
        const hit = cache.get(key);
        if (hit !== undefined) {
          if (hit > 0) {
            total += hit;
            matched += 1;
          }
          continue;
        }
        const { found, total: price } = await estimateRepairPrice(r.device, r.issue);
        cache.set(key, found ? price : -1);
        if (found) {
          total += price;
          matched += 1;
        }
      }
      if (!cancelled) {
        setRepairRevenue({ total, matched });
        setRevenueReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reservationsQuery.data, nowIso]);

  const stats = useMemo(() => {
    const reservations = reservationsQuery.data ?? [];
    const leads = leadsQuery.data ?? [];
    const paymentsData = paymentsQuery.data ?? [];

    const brandCounts = new Map<string, number>();
    const funnel = new Map<Status, number>();
    for (const s of STATUS_ORDER) funnel.set(s, 0);
    const peak = new Map<string, number>();
    const payments = new Map<string, number>();
    for (const p of PAYMENT_ORDER) payments.set(p, 0);

    let repairsThisMonth = 0;

    for (const r of reservations) {
      const brand = brandOfDevice(r.device);
      if (brand) brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
      funnel.set(r.status, (funnel.get(r.status) ?? 0) + 1);
      const day = new Date(`${r.slot_date}T12:00:00`).getDay();
      const key = `${day}:${r.slot_period}`;
      peak.set(key, (peak.get(key) ?? 0) + 1);
      payments.set(r.payment, (payments.get(r.payment) ?? 0) + 1);
      if (isSameMonth(r.created_at, nowIso)) repairsThisMonth += 1;
    }

    let boutiqueOrdersThisMonth = 0;
    let boutiqueRevenue = 0;
    for (const l of leads) {
      if (l.source !== "boutique") continue;
      const total = parseBoutiqueTotal(l.message);
      if (total > 0) boutiqueRevenue += total;
      if (isSameMonth(l.created_at, nowIso)) boutiqueOrdersThisMonth += 1;
    }

    // Monthly revenue from payments (last 6 months)
    const monthlyRevenue = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue.set(key, 0);
    }
    for (const p of paymentsData) {
      if (p.status !== "success" && p.status !== "paid") continue;
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyRevenue.has(key)) {
        monthlyRevenue.set(key, (monthlyRevenue.get(key) ?? 0) + p.amount);
      }
    }
    const monthlyRevenueData = [...monthlyRevenue.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => {
        const parts = month.split("-");
        const y = parts[0] ?? "";
        const m = parts[1] ?? "";
        const label = `${m}/${y.slice(2)}`;
        return { month: label, revenue };
      });

    // Status distribution for pie chart
    const statusDistribution = STATUS_ORDER.map((status) => ({
      status,
      name: status,
      count: funnel.get(status) ?? 0,
      fill: STATUS_COLORS[status],
    })).filter((r) => r.count > 0);

    // Weekly revenue trend (last 8 weeks)
    const weeklyRevenue = new Map<string, number>();
    for (let i = 7; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 7 + d.getDay()));
      const weekStart = d.toISOString().slice(0, 10);
      weeklyRevenue.set(weekStart, 0);
    }
    for (const p of paymentsData) {
      if (p.status !== "success" && p.status !== "paid") continue;
      const d = new Date(p.created_at);
      d.setDate(d.getDate() - d.getDay());
      const key = d.toISOString().slice(0, 10);
      if (weeklyRevenue.has(key)) {
        weeklyRevenue.set(key, (weeklyRevenue.get(key) ?? 0) + p.amount);
      }
    }
    const weeklyRevenueData = [...weeklyRevenue.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, revenue]) => {
        const parts = week.split("-");
        const label = `${parts[2]}/${parts[1]}`;
        return { week: label, revenue };
      });

    // Trend calculations (current vs previous month)
    const currentMonth = monthlyRevenueData[monthlyRevenueData.length - 1]?.revenue ?? 0;
    const prevMonth = monthlyRevenueData[monthlyRevenueData.length - 2]?.revenue ?? 0;
    const revenueTrend =
      prevMonth > 0
        ? {
            value: Math.round(((currentMonth - prevMonth) / prevMonth) * 100),
            label: "vs mois précédent",
          }
        : null;

    const currentMonthReservations = reservations.filter((r) =>
      isSameMonth(r.created_at, nowIso),
    ).length;
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthReservations = reservations.filter((r) => {
      const d = new Date(r.created_at);
      return (
        d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear()
      );
    }).length;
    const repairsTrend =
      prevMonthReservations > 0
        ? {
            value: Math.round(
              ((currentMonthReservations - prevMonthReservations) / prevMonthReservations) * 100,
            ),
            label: "vs mois précédent",
          }
        : null;

    const brandRows = [...brandCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
    const brandMax = Math.max(1, ...brandRows.map((r) => r.count));

    const funnelRows = STATUS_ORDER.map((status) => ({
      status,
      count: funnel.get(status) ?? 0,
    })).filter((r) => r.count > 0);
    const totalReservations = reservations.length;

    const paymentRows = PAYMENT_ORDER.map((payment) => ({
      payment,
      count: payments.get(payment) ?? 0,
    })).filter((r) => r.count > 0);
    const paymentTotal = Math.max(1, ...paymentRows.map((r) => r.count));

    const peakMax = Math.max(1, ...[...peak.values()]);

    return {
      repairsThisMonth,
      boutiqueOrdersThisMonth,
      boutiqueRevenue,
      brandRows,
      brandMax,
      funnelRows,
      totalReservations,
      paymentRows,
      paymentTotal,
      peak,
      peakMax,
      recent: reservations.slice(0, 10),
      monthlyRevenueData,
      weeklyRevenueData,
      statusDistribution,
      revenueTrend,
      repairsTrend,
    };
  }, [reservationsQuery.data, leadsQuery.data, paymentsQuery.data, nowIso]);

  const [kpiConfig, setKpiConfig] = useState({
    repairs: true,
    boutiqueOrders: true,
    repairRevenue: true,
    boutiqueRevenue: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("at-admin-kpis");
      if (stored) setKpiConfig(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleKpi = useCallback((key: keyof typeof kpiConfig) => {
    setKpiConfig((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("at-admin-kpis", JSON.stringify(next));
      return next;
    });
  }, []);

  const handleExportXlsx = useCallback(async () => {
    try {
      const result = await exportDashboardXlsx();
      const binary = atob(result.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* silent */
    }
  }, []);

  if (reservationsQuery.isLoading || leadsQuery.isLoading || paymentsQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  const unmatched = Math.max(0, stats.repairsThisMonth - repairRevenue.matched);

  const columns: ColumnDef<ReservationRow>[] = [
    {
      accessorKey: "reference",
      header: t("admin.stats.recent.ref"),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.reference ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "customer_name",
      header: t("admin.stats.recent.client"),
    },
    {
      accessorKey: "device",
      header: t("admin.stats.recent.device"),
    },
    {
      accessorKey: "status",
      header: t("admin.stats.recent.status"),
      cell: ({ row }) => t(`admin.stats.status.${row.original.status}`),
    },
    {
      accessorKey: "created_at",
      header: t("admin.stats.recent.date"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatShortDate(row.original.created_at, locale)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="at-eyebrow">{t("admin.stats.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold">{t("admin.stats.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.stats.intro")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="technicalOutline" size="sm" onClick={handleExportXlsx}>
            <Download className="mr-1 size-3" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["repairs", t("admin.stats.kpi.repairs")],
            ["boutiqueOrders", t("admin.stats.kpi.boutiqueOrders")],
            ["repairRevenue", t("admin.stats.kpi.repairRevenue")],
            ["boutiqueRevenue", t("admin.stats.kpi.boutiqueRevenue")],
          ] as const
        ).map(([key, lbl]) => (
          <Button
            key={key}
            type="button"
            variant={kpiConfig[key] ? "secondary" : "ghost"}
            size="sm"
            onClick={() => toggleKpi(key)}
          >
            {lbl}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t("admin.stats.kpi.repairs")}
          value={String(stats.repairsThisMonth)}
          sub={t("admin.stats.month")}
          trend={stats.repairsTrend}
          visible={kpiConfig.repairs}
        />
        <KpiCard
          label={t("admin.stats.kpi.boutiqueOrders")}
          value={String(stats.boutiqueOrdersThisMonth)}
          sub={t("admin.stats.month")}
          visible={kpiConfig.boutiqueOrders}
        />
        <KpiCard
          label={t("admin.stats.kpi.repairRevenue")}
          value={revenueReady ? formatFcfa(repairRevenue.total) : "…"}
          sub={t("admin.stats.month")}
          trend={stats.revenueTrend}
          visible={kpiConfig.repairRevenue}
        />
        <KpiCard
          label={t("admin.stats.kpi.boutiqueRevenue")}
          value={formatFcfa(stats.boutiqueRevenue)}
          sub={t("admin.stats.month")}
          visible={kpiConfig.boutiqueRevenue}
        />
      </div>

      {unmatched > 0 ? (
        <p className="text-xs text-muted-foreground">{t("admin.stats.unmatched", [unmatched])}</p>
      ) : null}

      {stats.totalReservations === 0 && stats.boutiqueOrdersThisMonth === 0 ? (
        <p className="rounded-sm border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t("admin.stats.empty")}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">{t("admin.stats.brand.title")}</h3>
          {stats.brandRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.stats.brand.empty")}</p>
          ) : (
            <div className="space-y-3">
              {stats.brandRows.map(({ name, count }) => (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden bg-surface">
                    <div
                      className="h-full bg-primary/70"
                      style={{ width: `${Math.round((count / stats.brandMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">{t("admin.stats.funnel.title")}</h3>
          <div className="space-y-2">
            {stats.funnelRows.map(({ status, count }) => (
              <BarRow
                key={status}
                label={t(`admin.stats.status.${status}`)}
                count={count}
                total={stats.totalReservations}
              />
            ))}
          </div>
        </section>

        <section className="border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">{t("admin.stats.peak.title")}</h3>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1fr_repeat(7,minmax(56px,1fr))] gap-1 text-center">
                <div />
                {WEEKDAY_ORDER.map((d) => (
                  <div
                    key={d}
                    className="truncate text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    {t(`admin.stats.day.${d}`)}
                  </div>
                ))}
                {PERIOD_ORDER.map((period) => (
                  <Fragment key={period}>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {t(
                        period === "matin"
                          ? "admin.stats.peak.morning"
                          : "admin.stats.peak.afternoon",
                      )}
                    </div>
                    {WEEKDAY_ORDER.map((d) => {
                      const count = stats.peak.get(`${d}:${period}`) ?? 0;
                      const busy = count > 0 && count === stats.peakMax;
                      return (
                        <div
                          key={`${d}-${period}`}
                          className={`rounded-sm border p-1.5 ${
                            busy
                              ? "border-primary/60 bg-primary/10 font-semibold text-primary"
                              : "border-border"
                          }`}
                        >
                          <span className="font-mono text-xs tabular-nums">{count || "·"}</span>
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">{t("admin.stats.payments.title")}</h3>
          <div className="space-y-2">
            {stats.paymentRows.map(({ payment, count }) => (
              <BarRow
                key={payment}
                label={t(`admin.stats.payment.${payment}`)}
                count={count}
                total={stats.paymentTotal}
              />
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">{t("admin.stats.revenue_monthly.title")}</h3>
          {stats.monthlyRevenueData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("admin.stats.revenue_monthly.empty")}
            </p>
          ) : (
            <ChartContainer config={REVENUE_MONTHLY_CONFIG} className="aspect-auto h-64">
              <LineChart data={stats.monthlyRevenueData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  width={60}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value) => formatFcfa(Number(value))} />}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </section>

        <section className="border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">Tendance hebdomadaire (8 semaines)</h3>
          {stats.weeklyRevenueData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("admin.stats.revenue_monthly.empty")}
            </p>
          ) : (
            <ChartContainer config={REVENUE_MONTHLY_CONFIG} className="aspect-auto h-64">
              <AreaChart data={stats.weeklyRevenueData}>
                <defs>
                  <linearGradient id="weeklyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={10} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  width={60}
                  tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value) => formatFcfa(Number(value))} />}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  fill="url(#weeklyGrad)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </section>

        <section className="border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">
            {t("admin.stats.status_distribution.title")}
          </h3>
          {stats.statusDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("admin.stats.status_distribution.empty")}
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ChartContainer
                  config={STATUS_DISTRIBUTION_CONFIG}
                  className="aspect-square h-full w-full"
                >
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={stats.statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={40}
                      strokeWidth={1}
                    >
                      {stats.statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="flex-1 space-y-2">
                {stats.statusDistribution.map((d) => (
                  <div key={d.status} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="flex-1 truncate text-muted-foreground">
                      {t(`admin.stats.status.${d.status}`)}
                    </span>
                    <span className="font-mono text-xs tabular-nums">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section>
        <h3 className="mb-4 text-sm font-semibold">{t("admin.stats.recent.title")}</h3>
        <DataTable
          columns={columns}
          data={stats.recent}
          searchKey="reference"
          searchPlaceholder={t("admin.stats.search")}
          emptyTitle={t("admin.stats.recent.empty")}
        />
      </section>
    </div>
  );
}
