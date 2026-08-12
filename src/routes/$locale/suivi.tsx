import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Boxes,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FileDown,
  Package,
  RadioTower,
  ScanSearch,
  Search,
  Truck,
  Wrench,
} from "lucide-react";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { CtaBand } from "@/components/site/Blocks";
import { LeadForm } from "@/components/site/LeadForm";
import { QrCode } from "@/components/site/QrCode";
import { ReschedulePanel } from "@/components/site/ReschedulePanel";
import { ReservationPayBlock } from "@/components/site/ReservationPayBlock";
import { Button } from "@/components/ui/button";
import { downloadInvoicePdf, downloadQuotePdf, downloadTimelinePdf } from "@/lib/invoice";
import {
  getReservationTracking,
  type ReservationStatus,
  type SlaForecast,
  type TimelineEntry,
  getReservationComments,
  addReservationComment,
} from "@/lib/suivi.functions";
import { decideOnQuote, getQuoteStatus } from "@/lib/quote.functions";
import { getReservationAttachments } from "@/lib/photos.functions";
import { formatDateFr, type DepositMode } from "@/lib/reservation-schema";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import { trackPlausibleEvent } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n/locales";
import { localeSeo } from "@/lib/seo";

export const Route = createFileRoute("/$locale/suivi")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    ref?: string;
    code?: string;
    token?: string;
  } => {
    const ref = typeof search["ref"] === "string" ? search["ref"] : undefined;
    const code = typeof search["code"] === "string" ? search["code"] : undefined;
    const token = typeof search["token"] === "string" ? search["token"] : undefined;
    return {
      ...(ref ? { ref } : {}),
      ...(code ? { code } : {}),
      ...(token ? { token } : {}),
    };
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
  errorComponent: SuiviError,
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

function SuiviError({ error, reset }: { error: Error | null; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-border bg-card p-8 text-center">
        <h2 className="at-display mb-2 text-2xl">{t("suivi.error.title")}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {error?.message ?? t("suivi.error.message")}
        </p>
        <button
          className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
          onClick={() => reset()}
        >
          {t("action.ressayer")}
        </button>
      </div>
    </div>
  );
}

function Suivi() {
  const { ref, code, token } = Route.useSearch();
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
  const sla = data?.found ? data.sla : null;
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
    trackPlausibleEvent("tracking_lookup");
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
          {token ? (
            <QuoteDecision token={token} />
          ) : (
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
          )}

          {!token && loading && <SuiviSkeleton />}

          {!token && result && (
            <StatusResult
              result={result}
              timeline={timeline}
              sla={sla}
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

function buildGoogleCalendarUrl(r: {
  reference: string;
  device: string;
  slot_date: string | null;
  slot_hour: string | null;
}): string {
  const date = r.slot_date?.replace(/-/g, "") ?? "";
  const [h, m] = (r.slot_hour ?? "09:00").split(":").map(Number);
  const start = `${date}T${String(h ?? 9).padStart(2, "0")}${String(m ?? 0).padStart(2, "0")}00`;
  const endH = (h ?? 9) + 1;
  const end = `${date}T${String(endH).padStart(2, "0")}${String(m ?? 0).padStart(2, "0")}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${r.reference} — ${r.device}`,
    dates: `${start}/${end}`,
    details: `Réparation ${r.device}\nRéf: ${r.reference}`,
    location: "Allô Techno, Cotonou",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function StatusResult({
  result,
  timeline,
  sla,
  live,
  updatedAt,
  ref,
  code,
}: {
  result: ReservationStatus;
  timeline: TimelineEntry[];
  sla: SlaForecast | null;
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
  const milestoneNotes = new Map<string, string | null>();
  for (const e of timeline) {
    if (e.new_status && !milestoneDates.has(e.new_status)) {
      milestoneDates.set(e.new_status, e.created_at);
      milestoneNotes.set(e.new_status, e.note ?? null);
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
            {formatDateFr(result.slot_date, locale)} · {periodText}
            {result.slot_hour ? t("suivi.at", [result.slot_hour]) : ""}
          </p>
          <p className="mt-2 flex items-center justify-start gap-2 font-mono text-[10px] uppercase text-muted-foreground sm:justify-end">
            <RadioTower className={`size-3 ${live ? "animate-pulse text-primary" : ""}`} />
            {t("suivi.updated")}{" "}
            {new Date(updatedAt).toLocaleTimeString(locale, {
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => void downloadTimelinePdf({ ...result, history: timeline })}
          >
            <FileDown className="mr-2 size-4" />
            {t("suivi.timelinePdf")}
          </Button>
          {result.slot_date && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={buildGoogleCalendarUrl(result)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <CalendarDays className="mr-2 size-4" />
                {t("suivi.addToCalendar")}
              </a>
            </Button>
          )}
          {(result.quote_status === "approved" || result.quote_status === "sent") &&
            (result.quote_amount ?? 0) > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadQuotePdf({
                    reference: result.reference,
                    customer_name: result.customer_name,
                    phone: result.phone,
                    email: result.email,
                    device: result.device,
                    issue: result.issue,
                    quote_amount: result.quote_amount ?? 0,
                    warranty_months: result.warranty_months,
                    quote_token: result.quote_token ?? "",
                    created_at: result.created_at,
                  })
                }
              >
                <FileDown className="mr-2 size-4" />
                {t("suivi.quotePdf")}
              </Button>
            )}
          <QrCode
            value={`${window.location.origin}/${locale}/suivi?ref=${result.reference}&code=${code}`}
            label={`${t("suivi.dossier")} ${result.reference}`}
            caption={t("suivi.qr.caption")}
          />
        </div>
      </div>

      {result.quote_status === "approved" && (result.quote_amount ?? 0) > 0 && (
        <ReservationPayBlock
          reference={result.reference}
          amount={result.quote_amount ?? 0}
          alreadyPaid={result.payment_status === "paid"}
        />
      )}

      {!isCancelled && (
        <div className="mt-10">
          <span className="at-eyebrow">{t("suivi.progress")}</span>

          {sla?.expectedDate && (
            <div className="mt-4 border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm">
                <strong>{t("suivi.sla.expected", [formatDateFr(sla.expectedDate, locale)])}</strong>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {sla.remainingDays < 1
                  ? t("suivi.sla.remaining.short")
                  : t("suivi.sla.remaining", [Math.ceil(sla.remainingDays)])}
              </p>
            </div>
          )}

          <ol className="mt-6">
            {MILESTONES.map((milestone, i) => {
              const Icon = milestone.icon;
              const done = i < activeIndex;
              const current = i === activeIndex;
              const reachedAt = milestoneDates.get(milestone.key);
              const note = milestoneNotes.get(milestone.key);
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
                      {note && (done || current) && (
                        <p className="mt-1 text-xs italic text-muted-foreground/80">{note}</p>
                      )}
                    </div>
                    {current ? (
                      <span className="rounded-full border border-primary/50 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                        {t("suivi.inProgress")}
                      </span>
                    ) : reachedAt ? (
                      <time className="font-mono text-[10px] uppercase text-muted-foreground">
                        {new Date(reachedAt).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        ·{" "}
                        {new Date(reachedAt).toLocaleTimeString(locale, {
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
        {result.mode === "domicile" &&
          result.delivery_status &&
          result.delivery_status !== "non_applicable" && (
            <div>
              <span className="at-eyebrow">{t("suivi.delivery")}</span>
              <p className="mt-1 text-sm">
                {result.delivery_status === "a_planifier"
                  ? t("suivi.delivery.a_planifier")
                  : result.delivery_status === "en_route"
                    ? t("suivi.delivery.en_route")
                    : result.delivery_status === "livre"
                      ? t("suivi.delivery.livre")
                      : result.delivery_status}
              </p>
              {result.delivery_address ? (
                <p className="mt-1 text-xs text-muted-foreground">{result.delivery_address}</p>
              ) : null}
            </div>
          )}
        {result.warranty_months > 0 && (
          <div className="md:col-span-2">
            <span className="at-eyebrow">{t("suivi.warranty.label")}</span>
            <p className="mt-1 text-sm">
              {result.warranty_months >= 12
                ? t("reservation.warranty.extended")
                : t("reservation.warranty.standard")}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 border-t border-border pt-8">
        <span className="at-eyebrow">{t("suivi.journal")}</span>
        <TimelineFeed entries={timeline} />
      </div>

      {!isCancelled && <PhotosBlock reference={ref} code={code} />}

      {!isCancelled && <CommentsBlock reference={ref} code={code} />}

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
  const { t, locale } = useI18n();
  if (entries.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{t("suivi.timeline.empty")}</p>;
  }

  const reversed = [...entries].reverse();

  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  }

  return (
    <ol className="mt-4 space-y-4 border-l border-border pl-5">
      {reversed.map((e, i) => {
        const prevEntry = i > 0 ? reversed[i - 1] : null;
        const durationMs = prevEntry
          ? new Date(e.created_at).getTime() - new Date(prevEntry.created_at).getTime()
          : null;
        const noteKey = e.new_status ? `suivi.timeline.note.${e.new_status}` : null;
        return (
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
            <div className="flex flex-wrap items-center gap-2">
              <time className="font-mono text-[10px] uppercase text-muted-foreground">
                {new Date(e.created_at).toLocaleString(locale, {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              {durationMs !== null && durationMs > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  ({t("suivi.timeline.duration", [formatDuration(durationMs)])})
                </span>
              )}
            </div>
            {noteKey && <p className="mt-1 text-xs text-muted-foreground italic">{t(noteKey)}</p>}
            {e.note ? <p className="mt-1 text-sm text-muted-foreground">{e.note}</p> : null}
          </li>
        );
      })}
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

function stageLabel(t: TranslateFn, stage: string): string {
  const known = `suivi.photos.stage.${stage}`;
  const label = t(known);
  return label === known ? stage : label;
}

function QuoteDecision({ token }: { token: string }) {
  const { t, locale } = useI18n();
  const fetchQuote = useServerFn(getQuoteStatus);
  const decide = useServerFn(decideOnQuote);
  const [decided, setDecided] = useState<{ approve: boolean } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const quote = useQuery({
    queryKey: ["quote", token],
    enabled: Boolean(token),
    queryFn: () => fetchQuote({ data: { token } }),
  });

  const decision = useMutation({
    mutationFn: async (approve: boolean) => {
      setActionError(null);
      await decide({ data: { token, approve } });
      return approve;
    },
    onSuccess: (approve) => setDecided({ approve }),
    onError: (err: unknown) =>
      setActionError(err instanceof Error ? err.message : t("suivi.error.unknown")),
  });

  const loading = quote.isFetching && !quote.data;
  const notFound = quote.data && !quote.data.found;

  return (
    <div className="border border-border bg-card p-8">
      {loading && <p className="text-sm text-muted-foreground">{t("suivi.quote.loading")}</p>}

      {!loading && (notFound || quote.error) && (
        <div role="alert" className="text-sm text-destructive">
          {t("suivi.quote.invalid")}
        </div>
      )}

      {!loading && !notFound && !quote.error && quote.data?.found && (
        <>
          <span className="at-eyebrow">
            {t("suivi.quote.eyebrow", [quote.data.quote.reference])}
          </span>
          <h2 className="at-display mt-2 text-2xl">{t("suivi.quote.title")}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{t("suivi.quote.intro")}</p>

          <dl className="mt-6 space-y-3 border-t border-border pt-6">
            <div>
              <dt className="text-xs text-muted-foreground">{t("suivi.quote.amount")}</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {(quote.data.quote.amount ?? 0).toLocaleString(locale)} FCFA
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("suivi.category.device")}</dt>
              <dd className="mt-1 text-sm">{quote.data.quote.device}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("suivi.category.payment")}</dt>
              <dd className="mt-1 text-sm">
                {quote.data.quote.warranty_months > 0
                  ? t("suivi.quote.warranty", [quote.data.quote.warranty_months])
                  : t("suivi.quote.warranty.none")}
              </dd>
            </div>
          </dl>

          {actionError && (
            <div
              role="alert"
              className="mt-6 border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
            >
              {actionError}
            </div>
          )}

          {decided ? (
            <div className="mt-6 border border-success/40 bg-success/10 p-6 text-center">
              <p className="text-lg font-bold">
                {decided.approve ? t("suivi.quote.approved") : t("suivi.quote.declined")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{t("suivi.quote.done")}</p>
              {decided.approve && (quote.data?.quote.amount ?? 0) > 0 && (
                <div className="text-left">
                  <ReservationPayBlock
                    reference={quote.data.quote.reference}
                    amount={quote.data.quote.amount ?? 0}
                    alreadyPaid={false}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                disabled={decision.isPending}
                onClick={() => decision.mutate(true)}
                variant="technical"
              >
                {t("suivi.quote.approve")}
              </Button>
              <Button
                disabled={decision.isPending}
                onClick={() => decision.mutate(false)}
                variant="outline"
              >
                {t("suivi.quote.decline")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PhotosBlock({ reference, code }: { reference: string; code: string }) {
  const { t } = useI18n();
  const fetchAttachments = useServerFn(getReservationAttachments);
  const [zoom, setZoom] = useState<string | null>(null);

  const photos = useQuery({
    queryKey: ["suivi-photos", reference, code],
    enabled: Boolean(reference) && Boolean(code),
    refetchInterval: 15_000,
    queryFn: () => fetchAttachments({ data: { reference, code } }),
  });

  const items = photos.data?.found ? photos.data.attachments : [];

  if (photos.isLoading && !photos.data) return null;
  if (items.length === 0) return null;

  return (
    <div className="mt-8 border-t border-border pt-8">
      <span className="at-eyebrow">{t("suivi.photos.title")}</span>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((a) =>
          a.kind === "video" ? (
            <div
              key={`${a.url}-${a.created_at}`}
              className="overflow-hidden rounded-sm border border-border bg-surface"
            >
              <video
                src={a.url}
                controls
                preload="metadata"
                className="aspect-square w-full bg-black object-cover"
              />
              <span className="block px-2 py-1.5 text-[11px] text-muted-foreground">
                {stageLabel(t, a.stage)}
              </span>
            </div>
          ) : (
            <button
              key={`${a.url}-${a.created_at}`}
              type="button"
              onClick={() => setZoom(a.url)}
              className="group overflow-hidden rounded-sm border border-border bg-surface text-left"
            >
              <OptimizedImage
                src={a.url}
                alt={`${stageLabel(t, a.stage)} — ${t("suivi.dossier")} ${reference}`}
                aspectRatio="1/1"
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <span className="block px-2 py-1.5 text-[11px] text-muted-foreground">
                {stageLabel(t, a.stage)}
              </span>
            </button>
          ),
        )}
      </div>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("suivi.photos.zoom")}
          className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center bg-black/80 p-4"
          onClick={() => setZoom(null)}
        >
          <img
            src={zoom}
            alt=""
            loading="lazy"
            decoding="async"
            className="max-h-[90vh] max-w-full rounded-sm object-contain"
          />
        </div>
      )}
    </div>
  );
}

function CommentsBlock({ reference, code }: { reference: string; code: string }) {
  const { t, locale } = useI18n();
  const fetchComments = useServerFn(getReservationComments);
  const addComment = useServerFn(addReservationComment);
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState<"ok" | "err" | null>(null);

  const comments = useQuery({
    queryKey: ["suivi-comments", reference, code],
    enabled: Boolean(reference) && Boolean(code),
    refetchInterval: 30_000,
    queryFn: () => fetchComments({ data: { reference, code } }),
  });

  const items = comments.data ?? [];

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setFlash(null);
    try {
      await addComment({
        data: { reference, code, body: trimmed, author_name: name.trim() || undefined },
      });
      setBody("");
      setFlash("ok");
      void queryClient.invalidateQueries({ queryKey: ["suivi-comments", reference, code] });
    } catch {
      setFlash("err");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-8 border-t border-border pt-8">
      <span className="at-eyebrow">{t("suivi.comments.title")}</span>

      {items.length === 0 && !comments.isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">{t("suivi.comments.empty")}</p>
      )}

      {items.length > 0 && (
        <div className="mt-4 space-y-4">
          {items.map((c) => (
            <div
              key={c.id}
              className="rounded-sm border border-border bg-surface p-4"
            >
              <p className="text-sm">{c.body}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {c.author_name
                  ? t("suivi.comments.by", [c.author_name])
                  : c.author === "staff"
                    ? "Atelier"
                    : ""}
                {c.author_name || c.author === "staff" ? " · " : ""}
                {new Date(c.created_at).toLocaleString(locale, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("suivi.comments.name")}
          className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={t("suivi.comments.input")}
            className="flex-1 border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <Button
            type="button"
            size="sm"
            variant="technical"
            disabled={sending || !body.trim()}
            onClick={() => void submit()}
          >
            {sending ? t("suivi.comments.sending") : t("suivi.comments.send")}
          </Button>
        </div>
        {flash === "ok" && (
          <p className="text-xs text-green-600">{t("suivi.comments.success")}</p>
        )}
        {flash === "err" && (
          <p className="text-xs text-destructive">{t("suivi.comments.error")}</p>
        )}
      </div>
    </div>
  );
}
