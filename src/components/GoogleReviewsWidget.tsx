import { useQuery } from "@tanstack/react-query";
import { getGoogleReviews } from "@/lib/google-reviews";
import { Star } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export function GoogleReviewsWidget() {
  const { data: info, isLoading } = useQuery({
    queryKey: ["google-reviews"],
    queryFn: () => getGoogleReviews(),
    staleTime: 60 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="h-3 w-48 bg-muted rounded" />
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
          alt="Google"
          className="size-6"
        />
        <div>
          <h3 className="text-sm font-bold">Avis Google</h3>
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(info.rating)} />
            <span className="text-sm font-medium">{info.rating}</span>
            <span className="text-xs text-muted-foreground">({info.total_ratings} avis)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {info.reviews.map((review, i) => (
          <div key={i} className="border-t border-border pt-3">
            <div className="flex items-center gap-2 mb-1">
              {review.profile_photo_url ? (
                <img src={review.profile_photo_url} alt="" loading="lazy" className="size-6 rounded-full" />
              ) : (
                <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                  {review.author_name[0]}
                </div>
              )}
              <span className="text-xs font-medium">{review.author_name}</span>
              <span className="text-[10px] text-muted-foreground">
                {review.relative_time_description}
              </span>
            </div>
            <StarRating rating={review.rating} />
            <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{review.text}</p>
          </div>
        ))}
      </div>

      <a
        href={info.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block text-center text-xs font-medium text-primary hover:underline"
      >
        Voir tous les avis sur Google
      </a>
    </div>
  );
}
