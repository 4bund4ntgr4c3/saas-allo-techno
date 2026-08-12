import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Send, Star } from "lucide-react";
import { CtaBand, ReviewsGrid, SectionHeader, Stars, TrustStats } from "@/components/site/Blocks";
import { REVIEWS } from "@/data/catalog";
import { ErrorRoute } from "@/components/ErrorRoute";
import {
  getReviewInvite,
  listPublishedReviews,
  submitReview,
  type PublishedReview,
} from "@/lib/reviews.functions";
import { useI18n } from "@/lib/i18n/context";
import { translate } from "@/lib/i18n/dictionaries";
import { normalizeLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

type GridReview = (typeof REVIEWS)[number];

function toGridReviews(rows: PublishedReview[]): GridReview[] {
  return rows.map((r) => ({
    name: r.customer_name,
    city: "Abomey-Calavi",
    rating: r.rating,
    text: r.comment,
    device: r.device ?? "",
  }));
}

export const Route = createFileRoute("/$locale/avis")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    token?: string;
  } => {
    const token = typeof search["token"] === "string" ? search["token"] : undefined;
    return token ? { token } : {};
  },
  head: ({ params }) => {
    const locale = normalizeLocale((params as { locale?: unknown }).locale) as Locale;
    return {
      meta: [
        { title: translate(locale, "avis.meta.title") },
        { name: "description", content: translate(locale, "avis.meta.description") },
        {
          property: "og:title",
          content: translate(locale, "avis.title"),
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: async (): Promise<PublishedReview[]> => {
    try {
      const rows = await listPublishedReviews({ data: {} });
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  },
  errorComponent: ErrorRoute,
  component: Avis,
});

function Avis() {
  const live = Route.useLoaderData();
  const { token } = Route.useSearch();
  const { t } = useI18n();

  if (token) {
    return (
      <>
        <AvisHero />
        <ReviewForm token={token} />
        <CtaBand />
      </>
    );
  }

  const reviews: GridReview[] = live.length > 0 ? toGridReviews(live) : REVIEWS;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(reviews.length, 1);

  return (
    <>
      <section className="border-b border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <span className="at-eyebrow mb-4 block">{t("avis.eyebrow")}</span>
          <h1 className="at-display text-4xl md:text-6xl">{t("avis.title")}</h1>
          <div className="mt-6 flex items-center gap-4">
            <Stars n={Math.round(avg)} />
            <span className="font-mono text-sm">
              {avg.toFixed(1).replace(".", ",")}/5 · {reviews.length} {t("avis.verified")}
            </span>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {reviews.length > 0 ? (
            <ReviewsGrid limit={Math.max(reviews.length, 1)} reviews={reviews} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("avis.list.empty")}</p>
          )}
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow={t("avis.eyebrow")} title={t("avis.subtitle")} />
          <TrustStats />
        </div>
      </section>

      <CtaBand />
    </>
  );
}

function AvisHero() {
  const { t } = useI18n();
  return (
    <section className="border-b border-border py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <span className="at-eyebrow mb-4 block">{t("avis.form.eyebrow")}</span>
        <h1 className="at-display text-4xl md:text-5xl">{t("avis.form.title")}</h1>
      </div>
    </section>
  );
}

const textareaClass =
  "w-full rounded-sm border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function ReviewForm({ token }: { token: string }) {
  const { t } = useI18n();
  const fetchInvite = useServerFn(getReviewInvite);
  const submit = useServerFn(submitReview);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const invite = useQuery({
    queryKey: ["review-invite", token],
    enabled: Boolean(token),
    queryFn: () => fetchInvite({ data: { token } }),
  });

  const send = useMutation({
    mutationFn: async () => {
      setError(null);
      const res = await submit({ data: { token, rating, comment: comment.trim() } });
      if (!res.ok) throw new Error(res.error);
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: unknown) => setError(err instanceof Error ? err.message : t("common.error")),
  });

  if (submitted) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="border border-success/40 bg-success/10 p-8 text-center">
            <p className="text-2xl font-bold">{t("avis.thanks.title")}</p>
            <p className="mt-3 text-sm text-muted-foreground">{t("avis.thanks.text")}</p>
          </div>
        </div>
      </section>
    );
  }

  const loading = invite.isFetching && !invite.data;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="border border-border bg-card p-8">
          {loading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("avis.form.loading")}
            </div>
          )}

          {!loading && invite.error && (
            <p role="alert" className="text-sm text-destructive">
              {t("avis.form.invalid")}
            </p>
          )}

          {!loading && invite.data && !invite.data.ok && (
            <p role="alert" className="text-sm text-destructive">
              {invite.data.error}
            </p>
          )}

          {!loading && invite.data?.ok && (
            <>
              <p className="text-sm text-muted-foreground">
                {t("avis.form.intro", [
                  invite.data.reservation.reference,
                  invite.data.reservation.device,
                ])}
              </p>

              <div className="mt-8">
                <span className="at-eyebrow mb-3 block">{t("avis.form.rating.label")}</span>
                <div
                  className="flex gap-1"
                  role="radiogroup"
                  aria-label={t("avis.form.rating.label")}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n}/5`}
                      className="cursor-pointer p-1"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                    >
                      <Star
                        aria-hidden
                        className={`size-8 transition-colors ${
                          (hover || rating) >= n
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("avis.form.rating.hint")}</p>
              </div>

              <div className="mt-8">
                <label htmlFor="review-comment" className="at-eyebrow mb-3 block">
                  {t("avis.form.comment.label")}
                </label>
                <textarea
                  id="review-comment"
                  className={`${textareaClass} min-h-32`}
                  placeholder={t("avis.form.comment.placeholder")}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {error && (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={send.isPending}
                onClick={() => {
                  const trimmed = comment.trim();
                  if (rating === 0) {
                    setError(t("avis.form.rating.error"));
                    return;
                  }
                  if (trimmed.length < 3) {
                    setError(t("avis.form.comment.error"));
                    return;
                  }
                  send.mutate();
                }}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-foreground px-6 text-sm font-bold uppercase tracking-wide text-background hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {send.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("avis.form.sending")}
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    {t("avis.form.submit")}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
