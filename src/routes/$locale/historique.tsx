import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Search, Smartphone, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { getDeviceHistory, getDeviceStats, type DeviceHistoryEntry } from "@/lib/device-history";
import { formatDateFr } from "@/lib/reservation-schema";
import { STATUS_LABEL } from "@/lib/reservation-schema";
export const Route = createFileRoute("/$locale/historique")({
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "historique.meta.title") },
        { name: "description", content: translate(locale, "historique.meta.description") },
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: HistoriqueDevice,
});

function HistoriqueDevice() {
  const { locale, t } = useI18n();
  const fetchHistory = useServerFn(getDeviceHistory);
  const fetchStats = useServerFn(getDeviceStats);

  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<"phone" | "email">("phone");
  const [results, setResults] = useState<DeviceHistoryEntry[] | null>(null);
  const [stats, setStats] = useState<{
    totalRepairs: number;
    completedRepairs: number;
    completionRate: number;
    deviceBreakdown: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setStats(null);
    try {
      const params = searchType === "phone" ? { phone: trimmed } : { email: trimmed };
      const [history, deviceStats] = await Promise.all([
        fetchHistory({ data: params }),
        fetchStats({ data: params }),
      ]);
      setResults(history);
      setStats(deviceStats);
      if (history.length === 0) {
        setError(t("historique.empty"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("historique.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("historique.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("historique.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("historique.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="border border-border bg-card p-6">
            <div className="flex gap-2">
              <div className="flex rounded-sm border border-border bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => setSearchType("phone")}
                  className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                    searchType === "phone"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("historique.byPhone")}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType("email")}
                  className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition-colors ${
                    searchType === "email"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {t("historique.byEmail")}
                </button>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSearch();
                  }
                }}
                placeholder={
                  searchType === "phone"
                    ? t("historique.phonePlaceholder")
                    : t("historique.emailPlaceholder")
                }
                type={searchType === "email" ? "email" : "tel"}
                inputMode={searchType === "phone" ? "tel" : "email"}
                className="flex-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button
                variant="technical"
                onClick={() => void handleSearch()}
                disabled={loading || !query.trim()}
              >
                <Search className="mr-1 size-3" />
                {loading ? t("historique.searching") : t("historique.search")}
              </Button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          {stats && stats.totalRepairs > 0 && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="border border-border bg-card p-4">
                <p className="at-eyebrow">{t("historique.totalRepairs")}</p>
                <p className="mt-2 text-2xl font-semibold">{stats.totalRepairs}</p>
              </div>
              <div className="border border-border bg-card p-4">
                <p className="at-eyebrow">{t("historique.completedRepairs")}</p>
                <p className="mt-2 text-2xl font-semibold">{stats.completedRepairs}</p>
              </div>
              <div className="border border-border bg-card p-4">
                <p className="at-eyebrow">{t("historique.completionRate")}</p>
                <p className="mt-2 text-2xl font-semibold">{stats.completionRate}%</p>
              </div>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider">
                {t("historique.results")}
              </h2>
              {results.map((entry) => (
                <div key={entry.id} className="border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase text-muted-foreground">
                        {entry.reference}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                        <Smartphone className="size-3.5" />
                        {entry.device}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.issue}</p>
                    </div>
                    <span
                      className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase ${
                        entry.status === "terminee" || entry.status === "livre"
                          ? "border-green-300 bg-green-50 text-green-700"
                          : entry.status === "annulee"
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-border"
                      }`}
                    >
                      {STATUS_LABEL[entry.status] ?? entry.status}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarClock className="size-3" />
                      {formatDateFr(entry.created_at)}
                    </span>
                    {entry.completed_at && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="size-3" />
                        {t("historique.completed")} {formatDateFr(entry.completed_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-10">
            <Button asChild variant="technicalOutline">
              <Link to="/$locale/suivi" params={{ locale }}>
                {t("historique.goToSuivi")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
