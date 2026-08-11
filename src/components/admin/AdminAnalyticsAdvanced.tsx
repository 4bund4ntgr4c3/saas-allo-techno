import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, TrendingUp, Globe, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  getConversionFunnel,
  getSourceStats,
  getRecentErrors,
} from "@/lib/analytics-advanced.functions";
import { useI18n } from "@/lib/i18n/context";

const FUNNEL_COLORS = ["#d83100", "#f59e0b", "#22c55e"];
const SOURCE_COLORS = ["#d83100", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6", "#64748b"];

export function AnalyticsAdvanced() {
  const { t } = useI18n();
  const getFunnel = useServerFn(getConversionFunnel);
  const getSources = useServerFn(getSourceStats);
  const getErrors = useServerFn(getRecentErrors);

  const { data: funnel } = useQuery({
    queryKey: ["analytics-funnel"],
    queryFn: () => getFunnel(),
  });

  const { data: sources } = useQuery({
    queryKey: ["analytics-sources"],
    queryFn: () => getSources(),
  });

  const { data: errors } = useQuery({
    queryKey: ["analytics-errors"],
    queryFn: () => getErrors(),
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <BarChart3 className="size-5" /> {t("admin.analytics.advanced.title")}
      </h3>

      {/* Conversion Funnel */}
      <div className="rounded-lg border bg-card p-4">
        <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
          <TrendingUp className="size-4" />
          {t("admin.analytics.funnel.title")}
        </h4>
        {funnel && funnel.length > 0 ? (
          <div className="space-y-2">
            {funnel.map((step, i) => {
              const maxCount = Math.max(...funnel.map((s) => s.count), 1);
              const width = Math.max((step.count / maxCount) * 100, 4);
              const prevStep = funnel[i - 1];
              const convRate = i > 0 && prevStep && prevStep.count > 0
                ? Math.round((step.count / prevStep.count) * 100)
                : 100;
              return (
                <div key={step.step} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{step.label}</span>
                    <span className="text-muted-foreground">
                      {step.count.toLocaleString(t("locale") as string)}
                      {i > 0 && (
                        <span className="ml-1 text-[10px]">
                          ({convRate}% {t("admin.analytics.funnel.conversionAbbrev")})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-6 rounded-sm bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: FUNNEL_COLORS[i] ?? "#64748b",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Pas de données</p>
        )}
      </div>

      {/* Source Attribution */}
      <div className="rounded-lg border bg-card p-4">
        <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
          <Globe className="size-4" />
          {t("admin.analytics.sources.title")}
        </h4>
        {sources && sources.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sources} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="source"
                tick={{ fontSize: 10 }}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [`${value} hits`, t("admin.analytics.sources.hits")]}
                contentStyle={{ fontSize: 11 }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {sources.map((_, i) => (
                  <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground">{t("admin.analytics.sources.empty")}</p>
        )}
      </div>

      {/* Recent Errors */}
      <div className="rounded-lg border bg-card p-4">
        <h4 className="flex items-center gap-2 text-sm font-bold mb-3">
          <AlertTriangle className="size-4" />
          {t("admin.analytics.errors.title")}
        </h4>
        {errors && errors.length > 0 ? (
          <div className="space-y-1">
            {errors.map((err) => (
              <div
                key={err.message}
                className="flex items-center justify-between rounded-sm border border-destructive/20 bg-destructive/5 p-2"
              >
                <p className="text-xs font-mono truncate max-w-[70%]">
                  {err.message}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="font-bold text-destructive">{err.count}×</span>
                  <span>{new Date(err.last).toLocaleTimeString(t("locale") as string, { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-sm bg-success/10 p-4 text-center">
            <p className="text-xs text-success font-medium">{t("admin.analytics.errors.empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
