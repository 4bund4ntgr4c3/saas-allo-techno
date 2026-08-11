import { useState, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, X } from "lucide-react";

export function ImageZoom({ src, alt }: { src: string; alt: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!zoomed || !imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPosition({ x, y });
    },
    [zoomed],
  );

  const toggleZoom = () => {
    if (zoomed) {
      setZoomed(false);
      setScale(1);
    } else {
      setZoomed(true);
      setScale(2);
    }
  };

  return (
    <>
      <div
        ref={imgRef}
        className="relative cursor-zoom-in overflow-hidden rounded-lg border border-border bg-card"
        onClick={toggleZoom}
        onMouseMove={handleMouseMove}
        role="button"
        aria-label={zoomed ? "Réduire l'image" : "Agrandir l'image"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleZoom();
          }
        }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="aspect-square w-full object-cover transition-transform duration-200"
          style={
            zoomed
              ? {
                  transform: `scale(${scale})`,
                  transformOrigin: `${position.x}% ${position.y}%`,
                }
              : undefined
          }
          draggable={false}
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          <span className="inline-flex items-center gap-1 rounded-sm bg-background/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur">
            {zoomed ? <ZoomOut className="size-3" /> : <ZoomIn className="size-3" />}
            {zoomed ? "Réduire" : "Zoom"}
          </span>
        </div>
      </div>

      {/* Full-screen overlay on click */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={toggleZoom}
        >
          <button
            className="absolute right-6 top-6 text-white hover:text-white/80"
            onClick={toggleZoom}
            aria-label="Fermer le zoom"
          >
            <X className="size-6" />
          </button>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            draggable={false}
          />
        </div>
      )}
    </>
  );
}
