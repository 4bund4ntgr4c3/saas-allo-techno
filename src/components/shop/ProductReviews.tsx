import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/shop/StarRating";
import { useServerFn } from "@tanstack/react-start";
import {
  getProductReviews,
  addProductReview,
  getProductRating,
} from "@/lib/product-reviews.functions";
import { useI18n } from "@/lib/i18n/context";

type ProductReviewsSectionProps = {
  productSlug: string;
};

type ReviewRow = {
  id: string;
  product_slug: string;
  name: string;
  rating: number;
  text: string;
  created_at: string;
};

export function ProductReviewsSection({ productSlug }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [rating, setRating] = useState({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useServerFn(getProductReviews);
  const fetchRating = useServerFn(getProductRating);
  const submitReview = useServerFn(addProductReview);
  const { t, locale } = useI18n();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [r, rt] = await Promise.all([
          fetchReviews({ data: { product_slug: productSlug } }),
          fetchRating({ data: { product_slug: productSlug } }),
        ]);
        if (!cancelled) {
          setReviews(r);
          setRating(rt);
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productSlug, fetchReviews, fetchRating]);

  async function handleSubmit() {
    if (stars < 1 || !name.trim() || text.trim().length < 10) return;
    setSubmitting(true);
    try {
      await submitReview({
        data: { product_slug: productSlug, name: name.trim(), rating: stars, text: text.trim() },
      });
      toast.success(t("boutique.review-thanks"));
      setShowForm(false);
      setName("");
      setText("");
      setStars(0);
      const [r, rt] = await Promise.all([
        fetchReviews({ data: { product_slug: productSlug } }),
        fetchRating({ data: { product_slug: productSlug } }),
      ]);
      setReviews(r);
      setRating(rt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
    setSubmitting(false);
  }

  return (
    <section className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="at-display text-2xl">{t("boutique.write-review")}</h2>
            {rating.count > 0 && (
              <div className="mt-2 flex items-center gap-3">
                <StarRating rating={Math.round(rating.avg)} size="md" />
                <span className="font-mono text-sm text-muted-foreground">
                  {rating.avg.toFixed(1)} · {rating.count}{" "}
                  {rating.count === 1
                    ? t("boutique.reviews.one")
                    : t("boutique.reviews", [rating.count])}
                </span>
              </div>
            )}
          </div>
          <Button variant="technicalOutline" size="sm" onClick={() => setShowForm(!showForm)}>
            <MessageSquare className="size-3" /> {t("boutique.write-review")}
          </Button>
        </div>

        {showForm && (
          <div className="mt-6 border border-border bg-card p-6">
            <div className="mb-4">
              <label htmlFor="review-rating" className="at-eyebrow block">
                {t("boutique.rating")}
              </label>
              <StarRating
                rating={stars}
                interactive
                onChange={setStars}
                className="mt-2"
                id="review-rating"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="review-name" className="at-eyebrow block">
                {t("boutique.review-name")}
              </label>
              <input
                id="review-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="review-text" className="at-eyebrow block">
                {t("boutique.review-text")}
              </label>
              <textarea
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <Button
              variant="technical"
              size="sm"
              disabled={
                submitting || stars < 1 || name.trim().length < 2 || text.trim().length < 10
              }
              onClick={handleSubmit}
            >
              {submitting ? "…" : t("boutique.review-submit")}
            </Button>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-muted-foreground">…</p>
        ) : reviews.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("boutique.no-reviews")}</p>
        ) : (
          <div className="mt-6 space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{r.name}</span>
                  <StarRating rating={r.rating} size="sm" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                <span className="mt-2 block font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString(locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
