import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** Aspect ratio for layout stability (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
};

/**
 * Responsive image with aspect-ratio stability, lazy loading, and decoding="async".
 * Uses CSS aspect-ratio to prevent layout shift.
 */
export function OptimizedImage({ aspectRatio, style, className, loading, decoding, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`overflow-hidden ${className ?? ""}`}
      style={aspectRatio ? { aspectRatio, ...style } : style}
    >
      <img
        {...props}
        loading={loading ?? "lazy"}
        decoding={decoding ?? "async"}
        className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
