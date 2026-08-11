import { useState } from "react";
import { Button } from "@/components/ui/button";
import { generateReport } from "@/lib/reports.functions";
import { downloadMonthlyReportPdf } from "@/lib/report-pdf";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { field } from "@/components/admin/primitives/AdminField";

interface ReportResult {
  total_reservations?: number;
  total_revenue?: number;
  brand_breakdown?: Record<string, number>;
  status_breakdown?: Record<string, number>;
  payment_methods?: Record<string, number>;
  daily?: Record<string, number>;
}

export function AdminAdvancedReports() {
  const { t } = useI18n();
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = (await generateReport({
        data: {
          date_from: dateFrom,
          date_to: dateTo,
          metrics: ["status_breakdown", "brand_breakdown", "payment_methods", "daily"],
          group_by: "day",
        },
      })) as ReportResult;
      setResult(res);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result) return;
    await downloadMonthlyReportPdf({
      month: new Date(dateFrom).toLocaleDateString(undefined, { month: "long" }),
      year: new Date(dateFrom).getFullYear(),
      totalReservations: result.total_reservations ?? 0,
      completedRepairs: 0,
      totalRevenue: result.total_revenue ?? 0,
      topBrands: Object.entries(result.brand_breakdown ?? {}).map(([brand, count]) => ({
        brand,
        count,
        revenue: 0,
      })),
      statusBreakdown: result.status_breakdown ?? {},
      paymentMethods: result.payment_methods ?? {},
      averageRepairTime: 45,
      customerSatisfaction: 4.8,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <BarChart3 className="size-5" /> {t("admin.reports.title")}
      </h3>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">{t("admin.reports.dateFrom")}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">{t("admin.reports.dateTo")}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={field}
          />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="mr-1 size-3 animate-spin" /> : null}
            {t("admin.reports.generate")}
          </Button>
          {result && (
            <Button variant="outline" onClick={handleDownloadPdf}>
              <Download className="mr-1 size-3" /> PDF
            </Button>
          )}
        </div>
      </div>

      {result && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase text-muted-foreground">{t("admin.reports.totalReservations")}</p>
            <p className="text-2xl font-bold">{String(result.total_reservations ?? 0)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase text-muted-foreground">{t("admin.reports.revenue")}</p>
            <p className="text-2xl font-bold">{String(result.total_revenue ?? 0)} FCFA</p>
          </div>
          {result.brand_breakdown && (
            <div className="rounded-lg border bg-card p-4 sm:col-span-2">
              <p className="text-[10px] uppercase text-muted-foreground mb-2">{t("admin.reports.brands")}</p>
              {Object.entries(result.brand_breakdown)
                .slice(0, 5)
                .map(([brand, count]) => (
                  <div key={brand} className="flex items-center justify-between text-xs">
                    <span>{brand}</span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
