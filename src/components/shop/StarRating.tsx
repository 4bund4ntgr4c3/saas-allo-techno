import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
  id?: string;
};

export function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
  id,
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "size-3" : "size-4";

  return (
    <div
      id={id}
      role="group"
      aria-label={interactive ? "Note" : undefined}
      className={cn("flex items-center gap-0.5", className)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= rating;
        const halfFilled = !filled && starValue - 0.5 <= rating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(starValue)}
            className={cn(
              "relative disabled:cursor-default",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
            )}
            aria-label={`${starValue}/${max}`}
          >
            <Star
              className={cn(
                sizeClass,
                filled
                  ? "fill-amber-400 text-amber-400"
                  : halfFilled
                    ? "fill-amber-400/50 text-amber-400"
                    : "fill-transparent text-muted-foreground/30",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
