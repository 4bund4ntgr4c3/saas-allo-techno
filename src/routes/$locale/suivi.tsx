import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Boxes,
  CalendarClock,
  CheckCircle2,
  FileDown,
  Package,
  RadioTower,
  ScanSearch,
  Search,
  Truck,
  Wrench,
} from "lucide-react";
import { CtaBand } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { QrCode } from "@/components/site/QrCode";
import { ReschedulePanel } from "@/components/site/ReschedulePanel";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf } from "@/lib/invoice";
import {
  getReservationTracking,
  type ReservationStatus,
  type TimelineEntry,
} from "@/lib/suivi.functions";
import { formatDateFr, type DepositMode } from "@/lib/reservation-schema";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import "@/lib/i18n/segments/suivi";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/suivi")({
  validateSearch: (search: Record<string, unknown>): { ref?: string; code?: string } => {
    const ref = typeof search["ref"] === "string" ? search["ref"] : undefined;
    const code = typeof search["code"] === "string" ? search["code"] : undefined;
    return { ...(ref ? { ref } : {}), ...(code ? { code } : {}) };
  },

  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    const suffix = "/suivi";
    const seo = localeSeo(locale, suffix);
    return {
      meta: [
        { title: translate(locale, "suivi.meta.title") },
        { name: "description", content: translate(locale, "suivi.meta.description") },
        { property: "og:title", content: translate(locale, "suivi.meta.og.title") },
        {
          property: "og:description",
          content: translate(locale, "suivi.meta.og.description"),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Suivi,
});

const MILESTONES = [
  {
    key: "en_attente",
    label: "suivi.milestone.en_attente.label",
    detail: "suivi.milestone.en_attente.detail",
    icon: Package,
  },
  {
    key: "confirmee",
    label: "suivi.milestone.confirmee.label",
    detail: "suivi.milestone.confirmee.detail",
    icon: ScanSearch,
  },
  {
    key: "pieces",
    label: "suivi.milestone.pieces.label",
    detail: "suivi.milestone.pieces.detail",
    icon: Boxes,
  },
  {
    key: "en_cours",
    label: "suivi.milestone.en_cours.label",
    detail: "suivi.milestone.en_cours.detail",
    icon: Wrench,
  },
  {
    key: "pret",
    label: "suivi.milestone.pret.label",
    detail: "suivi.milestone.pret.detail",
    icon: CheckCircle2,
  },
  {
    key: "livre",
    label: "suivi.milestone.livre.label",
    detail: "suivi.milestone.livre.detail",
    icon: Truck,
  },
] as const;

// `terminee` (ancien parcours) est assimilé à « Prêt ».
const MILESTONE_INDEX: Record<string, number> = {
  en_attente: 0,
  confirmee: 1,
  pieces: 2,
  en_cours: 3,
  pret: 4,
  livre: 5,
  terminee: 4,
};

type TranslateFn = (key: string, params?: (string | number)[]) => string;

function statusLabel(t: TranslateFn, status: string | null | undefined): string {
  if (!status) return "";
  const label: Record<string, string> = {
    en_attente: t("suivi.status.en_attente"),
    confirmee: t("suivi.status.confirmee"),
    pieces: t("suivi.status.pieces"),
    en_cours: t("suivi.status.en_cours"),
    pret: t("suivi.status.pret"),
    livre: t("suivi.status.livre"),
    terminee: t("suivi.status.terminee"),
    annulee: t("suivi.status.annulee"),
  };
  return label[status] ?? status;
}

function Suivi() {
  const { ref, code } = Route.useSearch();
  const router = useRouter();
  const { locale, t } = useI18n();
  const [reference, setReference] = useState(ref ?? "");
  const [codeInput, setCodeInput] = useState(code ?? "");
  const fetchTracking = useServerFn(getReservationTracking);

  useEffect(() => {
    if (ref) setReference(ref);
  }, [ref]);
  useEffect(() => {
    if (code) setCodeInput(code);
  }, [code]);

  const tracking = useQuery({
    queryKey: ["suivi", ref, code],
    enabled: Boolean(ref) && Boolean(code),
    // Le dossier est public : on rafraîchit en continu pour refléter le travail de l'atelier.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    queryFn: () => fetchTracking({ data: { reference: ref as string, code: code as string } }),
  });

  const loading = tracking.isFetching && !tracking.data;
  const data = tracking.data;
  const result = data?.found ? data.reservation : null;
  const timeline = data?.found ? data.timeline : [];
  const error = tracking.error
    ? tracking.error instanceof Error
      ? tracking.error.message
      : t("suivi.error.unknown")
    : data && !data.found
      ? t("suivi.error.notfound")
      : !code
        ? t("suivi.error.nocode")
        : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.navigate({
      to: "/$locale/suivi",
      params: { locale },
      search: { ref: reference.trim(), code: codeInput.trim() },
    });
  };

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("suivi.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("suivi.title")}</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">{t("suivi.intro")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="border border-border bg-card p-8">
            <label htmlFor="ref" className="at-eyebrow mb-2 block">
              {t("suivi.ref.label")}
            </label>
            <div className="flex gap-3">
              <input
                id="ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="AT-2026-0001"
                className="h-11 flex-1 rounded-sm border border-border bg-background px-4 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="submit" variant="technical" disabled={loading}>
                <Search className="size-4" />
                <span className="ml-2 hidden sm:inline">{t("suivi.check")}</span>
              </Button>
            </div>
            <label htmlFor="code" className="at-eyebrow mt-5 mb-2 block">
              {t("suivi.code.label")}
            </label>
            <div className="flex gap-3">
              <input
                id="code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="ex. K7M2Q9XW3B"
                autoComplete="off"
                className="h-11 flex-1 rounded-sm border border-border bg-background px-4 font-mono text-sm tracking-wider focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{t("suivi.code.hint")}</p>
            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                <div className="flex-1">
                  {error}
                  {tracking.error ? (
                    <button
                      type="button"
                      onClick={() => void tracking.refetch()}
                      className="ml-2 text-destructive underline"
                    >
                      {t("action.ressayer")}
                    </button>
                  ) : null}
                </div>
              </div>
            )}
          </form>

          {loading && <SuiviSkeleton />}

          {result && (
            <StatusResult
              result={result}
              timeline={timeline}
              live={tracking.isFetching}
              updatedAt={tracking.dataUpdatedAt}
              ref={ref ?? ""}
              code={code ?? ""}
            />
          )}

          <div className="mt-10">
            <LeadForm
              source="suivi"
              title={t("suivi.help.title")}
              description={t("suivi.help.description")}
              showReference={false}
              defaultReference={ref ?? ""}
              successText={t("suivi.help.success")}
            />
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function StatusResult({
  result,
  timeline,
  live,
  updatedAt,
  ref,
  code,
}: {
  result: ReservationStatus;
  timeline: TimelineEntry[];
  live: boolean;
  updatedAt: number;
  ref: string;
  code: string;
}) {
  const queryClient = useQueryClient();
  const { locale, t } = useI18n();
  const [rescheduling, setRescheduling] = useState(false);
  const statusIndex = MILESTONE_INDEX[result.status] ?? -1;
  const isCancelled = result.status === "annulee";
  const activeIndex = isCancelled ? -1 : statusIndex >= 0 ? statusIndex : 0;
  const reschedulable =
    !isCancelled && (result.status === "en_attente" || result.status === "confirmee");

  const periodText =
    result.slot_period === "matin" ? t("suivi.period.matin") : t("suivi.period.apresmidi");

  const milestoneDates = new Map<string, string>();
  for (const e of timeline) {
    if (e.new_status && !milestoneDates.has(e.new_status)) {
      milestoneDates.set(e.new_status, e.created_at);
    }
  }

  return (
    <div className="mt-8 border border-border bg-card p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="at-eyebrow">
            {t("suivi.dossier")} {result.reference}
          </span>
          <h2 className="at-display mt-2 text-2xl">
            {statusLabel(t, result.status) ?? t("suivi.status.unknown")}
          </h2>
        </div>
        <div className="sm:text-right">
          <p className="text-sm text-muted-foreground">{t("suivi.appointment")}</p>
          <p className="font-medium">
            {formatDateFr(result.slot_date)} · {periodText}
            {result.slot_hour ? t("suivi.at", [result.slot_hour]) : ""}
          </p>
          <p className="mt-2 flex items-center justify-start gap-2 font-mono text-[10px] uppercase text-muted-foreground sm:justify-end">
            <RadioTower className={`size-3 ${live ? "animate-pulse text-primary" : ""}`} />
            {t("suivi.updated")}{" "}
            {new Date(updatedAt).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-6">
        <p className="max-w-sm text-sm text-muted-foreground">{t("suivi.qr.hint")}</p>
        <div className="flex flex-wrap items-center gap-6">
          <Button variant="outline" size="sm" onClick={() => downloadInvoicePdf(result)}>
            <FileDown className="mr-2 size-4" />
            {t("suivi.invoice")}
          </Button>
          <QrCode
            value={`${window.location.origin}/${locale}/suivi?ref=${result.reference}&code=${code}`}
            label={`${t("suivi.dossier")} ${result.reference}`}
            caption={t("suivi.qr.caption")}
          />
        </div>
      </div>

      {!isCancelled && (
        <div className="mt-10">
          <span className="at-eyebrow">{t("suivi.progress")}</span>
          <ol className="mt-6">
            {MILESTONES.map((milestone, i) => {
              const Icon = milestone.icon;
              const done = i < activeIndex;
              const current = i === activeIndex;
              const reachedAt = milestoneDates.get(milestone.key);
              return (
                <li key={milestone.key} className="relative flex gap-5 pb-10 last:pb-0">
                  {i < MILESTONES.length - 1 && (
                    <span
                      aria-hidden
                      className={`absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px ${
                        done ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border ${
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : current
                          ? "border-primary bg-card text-primary ring-2 ring-primary/30"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pt-1.5">
                    <div>
                      <p
                        className={`text-xs font-bold uppercase tracking-wider ${
                          done || current ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {t(milestone.label)}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{t(milestone.detail)}</p>
                    </div>
                    {current ? (
                      <span className="rounded-full border border-primary/50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                        {t("suivi.inProgress")}
                      </span>
                    ) : reachedAt ? (
                      <time className="font-mono text-[10px] uppercase text-muted-foreground">
                        {new Date(reachedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        ·{" "}
                        {new Date(reachedAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {isCancelled && (
        <div className="mt-8 border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-lg font-bold text-destructive">{t("suivi.cancelled")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("suivi.cancelled.text")}</p>
        </div>
      )}

      <div className="mt-8 grid gap-4 border-t border-border pt-8 md:grid-cols-2">
        <div>
          <span className="at-eyebrow">{t("suivi.category.device")}</span>
          <p className="mt-1 text-sm">{result.device}</p>
        </div>
        <div>
          <span className="at-eyebrow">{t("suivi.category.issue")}</span>
          <p className="mt-1 text-sm">{result.issue}</p>
        </div>
        <div>
          <span className="at-eyebrow">{t("suivi.category.mode")}</span>
          <p className="mt-1 text-sm">
            {result.mode === "domicile" ? t("suivi.mode.home") : t("suivi.mode.shop")}
          </p>
        </div>
        <div>
          <span className="at-eyebrow">{t("suivi.category.payment")}</span>
          <p className="mt-1 text-sm">
            {result.payment === "mtn"
              ? "MTN Mobile Money"
              : result.payment === "moov"
                ? "Moov Money"
                : result.payment === "celtiis"
                  ? "Celtiis"
                  : t("suivi.payment.cash")}
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-8">
        <span className="at-eyebrow">{t("suivi.journal")}</span>
        <TimelineFeed entries={timeline} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {reschedulable && (
          <Button variant="outline" onClick={() => setRescheduling((v) => !v)}>
            <CalendarClock className="size-3.5" />
            {rescheduling ? t("suivi.hide") : t("suivi.reschedule")}
          </Button>
        )}
        <Button asChild variant="technicalOutline">
          <Link to="/$locale/reservation" params={{ locale }}>
            {t("suivi.new")}
          </Link>
        </Button>
      </div>

      {rescheduling && (
        <ReschedulePanel
          reference={result.reference}
          code={code}
          mode={(result.mode as DepositMode) ?? "boutique"}
          current={{ date: result.slot_date, hour: result.slot_hour }}
          onDone={() => {
            setRescheduling(false);
            queryClient.invalidateQueries({ queryKey: ["suivi", ref, code] });
          }}
        />
      )}
    </div>
  );
}

function TimelineFeed({ entries }: { entries: TimelineEntry[] }) {
  const { t } = useI18n();
  if (entries.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{t("suivi.timeline.empty")}</p>;
  }

  return (
    <ol className="mt-4 space-y-4 border-l border-border pl-5">
      {[...entries].reverse().map((e, i) => (
        <li key={`${e.created_at}-${i}`} className="relative">
          <span
            className={`absolute -left-[27px] top-1 grid size-3 place-items-center rounded-full ${
              i === 0 ? "bg-primary ring-4 ring-primary/20" : "bg-border"
            }`}
          />
          <p className="text-sm font-semibold">
            {e.old_status
              ? `${statusLabel(t, e.old_status)} → ${statusLabel(t, e.new_status)}`
              : t("suivi.timeline.created", [statusLabel(t, e.new_status)])}
          </p>
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            {new Date(e.created_at).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {e.note ? <p className="mt-1 text-sm text-muted-foreground">{e.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

function SuiviSkeleton() {
  const { t } = useI18n();
  return (
    <div
      aria-busy="true"
      aria-label={t("suivi.loading")}
      className="mt-8 space-y-6 border border-border bg-card p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="h-6 w-48 animate-pulse rounded-sm bg-border" />
        <div className="h-4 w-32 animate-pulse rounded-sm bg-border" />
      </div>
      <ol aria-hidden className="space-y-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center gap-5">
            <div className="size-10 animate-pulse rounded-full bg-border" />
            <div className="flex-1">
              <div className="h-3 w-1/3 animate-pulse rounded-sm bg-border" />
              <div className="mt-2 h-3 w-2/3 animate-pulse rounded-sm bg-border" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
